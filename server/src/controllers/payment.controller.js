import Payment from "../models/payment.model.js";
import Order from "../models/order.model.js";
import Coupon from "../models/coupon.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import { HTTP_STATUS, PAYMENT_MESSAGES } from "../config/constants.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance
const getRazorpayInstance = () => {
  try {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } catch (error) {
    console.error("Failed to initialize Razorpay:", error);
    throw error;
  }
};

// Validate coupon code
const validateCoupon = async (req, res) => {
  try {
    const { couponCode, cartTotal } = req.body;
    if (!couponCode) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Coupon code required" });
    }
    
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Invalid coupon code" });
    }
    
    // Check expiry
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Coupon has expired" });
    }
    
    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Coupon usage limit exceeded" });
    }
    
    // Check minimum order amount
    if (cartTotal < coupon.minOrderAmount) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        message: `Minimum order amount ${coupon.minOrderAmount} required for this coupon` 
      });
    }
    
    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cartTotal * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }
    
    // Apply max discount cap
    if (coupon.maxDiscountAmount) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
    
    res.json({
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount: Math.round(discount * 100) / 100
      }
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Process payment / Create order
const processPayment = async (req, res) => {
  try {
    const { items, total, paymentMethod, paymentStatus, couponCode, addressId, estimatedDelivery } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Order items required" });
    }
    
    if (!total || !paymentMethod || !addressId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Total, payment method, and address required" });
    }
    
    // Verify user exists and get address
    const user = await User.findById(req.user.id);
    if (!user) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "User not found" });
    
    const address = user.addresses.find(a => a._id.toString() === addressId);
    if (!address) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Address not found" });
    
    // Verify all products exist and have stock
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: `Product not found: ${item.productId}` });
      
      if (product.stock < item.quantity) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: `Insufficient stock for ${product.name}` });
      }
      
      orderItems.push({
        product: item.productId,
        quantity: item.quantity
      });
      
      subtotal += product.price * item.quantity;
    }
    
    // Apply coupon if provided
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && coupon.discountType === 'percentage') {
        discount = (subtotal * coupon.discountValue) / 100;
      } else if (coupon) {
        discount = coupon.discountValue;
      }
      if (coupon && coupon.maxDiscountAmount) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    }
    
    // Create order with 10-minute payment window
    const paymentExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    const order = new Order({
      user: req.user.id,
      items: orderItems,
      subtotal,
      discount: Math.round(discount * 100) / 100,
      total,
      couponCode,
      paymentMethod,
      paymentStatus: 'pending',
      paymentExpiresAt,
      address: {
        label: address.label,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        landmark: address.landmark,
        fullName: address.name || user.name || 'Customer',
        phone: address.phone || user.phone
      },
      estimatedDelivery: estimatedDelivery || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    });
    
    await order.save();
    
    // Update coupon usage if applied
    if (couponCode) {
      await Coupon.findOneAndUpdate(
        { code: couponCode.toUpperCase() },
        { $inc: { usageCount: 1 } }
      );
    }
    
    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }
    
    // Clear user cart
    user.cart = [];
    await user.save();
    
    res.status(HTTP_STATUS.CREATED).json({
      message: "Order placed successfully",
      order: {
        id: order._id,
        items: order.items,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        estimatedDelivery: order.estimatedDelivery
      }
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Initialize payment (for Razorpay/Stripe integration)
const initializePayment = async (req, res) => {
  try {
    const { orderId, amount, paymentMethod } = req.body;
    if (!orderId || !amount || !paymentMethod) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Order ID, amount, and payment method required" });
    }
    
    const order = await Order.findById(orderId);
    if (!order) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: PAYMENT_MESSAGES.PAYMENT_NOT_FOUND });
    if (order.user.toString() !== req.user.id) return res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Unauthorized" });
    
    const payment = new Payment({
      order: orderId,
      user: req.user.id,
      amount,
      paymentMethod,
      status: "pending"
    });
    await payment.save();
    
    res.status(HTTP_STATUS.CREATED).json({
      message: PAYMENT_MESSAGES.PAYMENT_INITIALIZED,
      payment: {
        _id: payment._id,
        amount,
        paymentMethod,
        status: "pending"
      }
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Verify payment
const verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: PAYMENT_MESSAGES.PAYMENT_NOT_FOUND });
    
    payment.status = "success";
    await payment.save();
    
    // Update order status
    await Order.findByIdAndUpdate(payment.order, { paymentStatus: "success", status: "packed" });
    
    res.json({ message: PAYMENT_MESSAGES.PAYMENT_VERIFIED });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Create Razorpay Order
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, orderId, currency = "INR" } = req.body;
    
    if (!amount || !orderId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Amount and Order ID are required" });
    }

    if (!req.user || !req.user.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "User not authenticated" });
    }

    // Check if Razorpay credentials are set
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
        message: "Payment gateway not configured. Please contact support." 
      });
    }
    
    // Verify order exists and belongs to user
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Order not found" });
    }
    
    // Compare user IDs properly (both as strings)
    if (order.user.toString() !== req.user.id.toString()) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Unauthorized - Order does not belong to you" });
    }
    
    // Validate amount matches order total
    if (Math.round(amount * 100) / 100 !== order.total) {
      console.warn("⚠️  Amount mismatch - Order total:", order.total, "Requested amount:", amount);
      // Still proceed but log warning
    }
    
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `receipt_${orderId}`,
      notes: {
        orderId: orderId.toString(),
        userId: req.user.id.toString(),
      },
    };
    
    const razorpayInstance = getRazorpayInstance();
    const razorpayOrder = await razorpayInstance.orders.create(options);

    // Save Razorpay order ID to Payment document
    let payment = await Payment.findOne({ order: orderId, paymentMethod: "razorpay" });
    
    try {
      if (!payment) {
        payment = new Payment({
          order: orderId,
          user: req.user.id,
          amount,
          paymentMethod: "razorpay",
          status: "pending",
        });
      }
      
      payment.razorpayOrderId = razorpayOrder.id;
      payment.status = "pending";
      await payment.save();
    } catch (dbError) {
      // If duplicate key error, it's likely an old index issue. Try updating existing record
      if (dbError.code === 11000) {
        console.warn("⚠️  Duplicate key error, attempting to update existing payment record");
        try {
          // Try to update any existing payment for this order
          const updated = await Payment.findOneAndUpdate(
            { order: orderId, paymentMethod: "razorpay" },
            { razorpayOrderId: razorpayOrder.id, status: "pending" },
            { new: true }
          );
          if (updated) {
            payment = updated;
          } else {
            throw dbError;
          }
        } catch (updateError) {
          console.error("❌ Failed to update payment record:", updateError.message);
          throw dbError;
        }
      } else {
        throw dbError;
      }
    }
    
    res.status(HTTP_STATUS.CREATED).json({
      message: "Razorpay order created successfully",
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Error creating Razorpay order:", err.message);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      message: "Failed to create payment order", 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Verify Razorpay Payment
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Missing payment details" });
    }
    
    // Verify signature
    const signatureBody = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(signatureBody)
      .digest("hex");
    
    if (expectedSignature !== razorpay_signature) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Payment verification failed" });
    }
    
    // Find payment and update
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Payment not found" });
    
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.status = "success";
    await payment.save();
    
    // Update order status
    await Order.findByIdAndUpdate(
      payment.order,
      { paymentStatus: "success", status: "confirmed" }
    );
    
    res.json({
      message: "Payment verified successfully",
      payment: {
        id: payment._id,
        status: payment.status,
      },
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

export default {
  validateCoupon,
  processPayment,
  initializePayment,
  verifyPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
};

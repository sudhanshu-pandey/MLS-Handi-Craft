import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { HTTP_STATUS } from "../config/constants.js";
import Razorpay from "razorpay";
//import Stripe from "stripe";

// Create new order
const createOrder = async (req, res) => {
  try {
    const { items, total, subtotal, discount, couponDiscount, deliveryFee, paymentMethod, paymentStatus, estimatedDelivery, address, couponCode } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Items array is required' });
    }
    
    if (!total || total <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Valid total is required' });
    }
    
    // Convert productIds to product references and quantities
    const orderItems = [];
    for (const item of items) {
      const { productId, quantity } = item;
      
      if (!productId || !quantity) {
        continue;
      }
      
      // Find product by id or _id
      let product = null;
      try {
        product = await Product.findById(productId);
      } catch (err) {
        // ObjectId parse failed, will try numeric id
      }
      
      if (!product) {
        product = await Product.findOne({ id: productId });
      }
      
      if (!product) {
        continue;
      }
      orderItems.push({
        product: product._id,
        quantity,
        name: product.name,
        price: product.price,
        category: product.category,
        image: product.image
      });
    }
    
    if (orderItems.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'No valid items in order' });
    }
    
    // Create order with 10-minute payment window
    const paymentExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    const order = new Order({
      user: req.user.id,
      items: orderItems,
      total,
      subtotal: subtotal || total,
      discount: discount || 0,
      couponDiscount: couponDiscount || 0,
      deliveryFee: deliveryFee || 0,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: paymentStatus || 'pending',
      paymentExpiresAt,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      address: address || {},
      couponCode: couponCode || null,
      status: 'ordered'
    });
    
    await order.save();
    
    // Populate product details before returning
    await order.populate('items.product', 'name price image');
    
    res.status(HTTP_STATUS.CREATED).json({ 
      message: 'Order created successfully',
      order
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      message: 'Failed to create order',
      error: err.message 
    });
  }
};

// Get all orders for user
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });
    res.json({ orders, total: orders.length });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Admin: get all orders
const getAllOrdersAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const status = (req.query.status || "").trim();
    const search = (req.query.search || "").trim();
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    const searchQuery = search
      ? {
          $or: [
            { couponCode: { $regex: search, $options: "i" } },
            { paymentMethod: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const finalQuery = { ...query, ...searchQuery };

    const [orders, total] = await Promise.all([
      Order.find(finalQuery)
        .populate("user", "name email phone")
        .populate("items.product", "name price image")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(finalQuery),
    ]);

    res.json({
      orders,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Admin: get orders by user
const getOrdersByUserAdmin = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });

    res.json({ orders, total: orders.length });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Get single order details
const getOrderDetails = async (req, res) => {
  try {
    const query = req.admin
      ? { _id: req.params.orderId }
      : { _id: req.params.orderId, user: req.user.id };

    const order = await Order.findOne(query)
      .populate("user", "name email phone")
      .populate("items.product");
    
    if (!order) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Order not found" });
    
    res.json({ order });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Update order status (admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Status is required" });
    
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status, updatedAt: Date.now() },
      { returnDocument: 'after' }
    ).populate("items.product");
    
    if (!order) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Order not found" });
    
    res.json({ order });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id });
    
    if (!order) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Order not found" });
    
    // Can only cancel if order is in ordered or packed status
    if (!['ordered', 'packed'].includes(order.status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Order cannot be cancelled at this stage" });
    }
    
    order.status = 'cancelled';
    await order.save();
    
    res.json({ message: "Order cancelled", order });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Cancel order with refund
const cancelOrderWithRefund = async (req, res) => {
  try {
    const query = req.admin
      ? { _id: req.params.orderId }
      : { _id: req.params.orderId, user: req.user.id };

    const order = await Order.findOne(query).populate('items.product');
    
    if (!order) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Order not found" });
    
    // Can only cancel if order is in ordered or packed status
    // if (!['ordered', 'packed'].includes(order.status)) {
    //   return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Order cannot be cancelled at this stage" });
    // }
    
    // Only process refund if payment was successful
    if (order.paymentStatus !== 'success') {
      order.status = 'cancelled';
      await order.save();
      return res.json({ 
        message: "Order cancelled (no refund processed - payment not completed)",
        order 
      });
    }

    // Process refund based on payment method
    const refundAmount = order.total;
    let refundId = null;

    // Generate unique refund ID format based on payment method
    if (order.paymentMethod === 'razorpay') {
      refundId = `RFND_RAZORPAY_${Date.now()}`;
      
      // Process Razorpay refund in background
      setTimeout(async () => {
        try {
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
          });

          if (order.paymentId) {
            const refundData = {
              amount: refundAmount * 100 // Razorpay expects amount in paise
            };

            const refundResponse = await razorpay.payments.refund(order.paymentId, refundData);
            
            // Update order with actual refund ID
            await Order.findByIdAndUpdate(order._id, {
              refundId: refundResponse.id,
              refundStatus: 'completed'
            });
            
            console.log(`[Razorpay Refund] Refund completed: ${refundResponse.id}`);
          }
        } catch (err) {
          console.error("Razorpay refund error:", err.message);
          // Update refund status to failed
          await Order.findByIdAndUpdate(order._id, {
            refundStatus: 'failed'
          });
        }
      }, 100);
    } 

    // Update order status and add refund info immediately
    order.status = 'cancelled';
    order.refundStatus = 'initiated';
    order.refundAmount = refundAmount;
    order.refundId = refundId;
    order.refundInitiatedAt = new Date();
    
    await order.save();

    res.json({ 
      message: "Order cancelled and refund initiated successfully",
      order,
      refund: {
        amount: refundAmount,
        refundId: refundId,
        status: 'initiated'
      }
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      message: "Failed to process refund",
      error: err.message 
    });
  }
};

// Submit support ticket for order
const submitOrderSupport = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Support message is required" });
    }
    
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id });
    
    if (!order) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Order not found" });
    
    // Initialize supportTickets array if it doesn't exist
    if (!order.supportTickets) {
      order.supportTickets = [];
    }
    
    // Add new support ticket
    order.supportTickets.push({
      message: message.trim(),
      createdAt: new Date(),
      resolved: false
    });
    
    await order.save();
    
    res.json({ 
      message: "Support ticket created successfully",
      order
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

export default {
  createOrder,
  getOrders,
  getAllOrdersAdmin,
  getOrdersByUserAdmin,
  getOrderDetails,
  updateOrderStatus,
  cancelOrder,
  cancelOrderWithRefund,
  submitOrderSupport
};

import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: { type: Number, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String },
  image: { type: String }
});

const supportTicketSchema = new mongoose.Schema({
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [orderItemSchema],
  total: { type: Number, required: true },
  subtotal: { type: Number },
  discount: { type: Number, default: 0 },
  couponCode: { type: String },
  couponDiscount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  status: { type: String, enum: ['ordered', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'], default: "ordered" },
  paymentMethod: { type: String, enum: ['upi', 'card', 'netbanking', 'cod', 'razorpay', 'stripe'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  paymentId: { type: String }, // For Razorpay
  paymentIntentId: { type: String }, // For Stripe
  paymentExpiresAt: { type: Date },
  address: {
    label: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
    fullName: String,
    phone: String
  },
  estimatedDelivery: { type: Date },
  // Refund fields
  refundStatus: { type: String, enum: ['pending', 'initiated', 'completed', 'failed'], default: 'pending' },
  refundAmount: { type: Number },
  refundId: { type: String },
  refundInitiatedAt: { type: Date },
  refundCompletedAt: { type: Date },
  supportTickets: [supportTicketSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Order", orderSchema);

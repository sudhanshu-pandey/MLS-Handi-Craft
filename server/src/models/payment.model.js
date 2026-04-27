import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["upi", "card", "netbanking", "cod", "razorpay", "stripe"], required: true },
  paymentGateway: { type: String }, // razorpay_id, stripe_id, etc
  status: { type: String, enum: ["pending", "success", "failed", "refunded"], default: "pending" },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  stripePaymentIntentId: { type: String },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Payment", paymentSchema);

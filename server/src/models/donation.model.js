import mongoose from "mongoose"

const donationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Allow donations from non-registered users
    },
    donorName: {
      type: String,
      required: true,
    },
    donorEmail: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "INR",
    },
    paymentMethod: {
      type: String,
      default: "razorpay",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    razorpayPaymentId: String,
    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    razorpaySignature: String,
    message: {
      type: String,
      default: "",
    },
    inMemory: {
      type: Boolean,
      default: false,
    },
    memoryName: {
      type: String,
      default: "",
    },
    wantsReceipt: {
      type: Boolean,
      default: true,
    },
    receiptSentAt: Date,
    donatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

// Indexes for efficient querying
donationSchema.index({ user: 1, createdAt: -1 })
donationSchema.index({ paymentStatus: 1 })
donationSchema.index({ donorEmail: 1 })
donationSchema.index({ razorpayOrderId: 1 })

export default mongoose.model("Donation", donationSchema)

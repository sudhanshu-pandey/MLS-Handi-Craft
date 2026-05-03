import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    label: { type: String },
    name: { type: String },
    phone: { type: String },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String },
    isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true
    },
    name: { type: String },
    email: { type: String, unique: true, sparse: true },
    gender: { type: String, enum: ["male", "female", "other"] },
    dob: { type: Date },
    addresses: [addressSchema],
    isVerified: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String // Now stores hashed OTP
    },
    otpExpires: {
        type: Date
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    otpLockedUntil: {
        type: Date
    },
    lastOTPSentAt: {
        type: Date
    },
    lastVerifiedAt: {
        type: Date
    },
    refreshToken: {
        type: String
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    recentlyViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockedReason: {
        type: String
    },
    blockedUntil: {
        type: Date
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
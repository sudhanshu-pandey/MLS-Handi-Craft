import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  originalName: { type: String, required: true },
  fileName: { type: String, required: true },
  url: { type: String, required: true },
  publicId: { type: String }, // cloudinary or similar service ID
  size: { type: Number },
  mimeType: { type: String },
  type: { type: String, enum: ["product", "profile", "review", "general"], default: "general" },
  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Upload", uploadSchema);

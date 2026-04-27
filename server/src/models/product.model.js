import mongoose from "mongoose";

const productSchema = new mongoose.Schema({ // Numeric ID for frontend compatibility
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String },
  images: [{ type: String }],
  category: { type: String, required: true },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  stock: { type: Number, default: 50 },
  artisanInfo: {
    name: { type: String },
    region: { type: String },
    craftType: { type: String }
  },
  specifications: {
    dimension: { type: String },
    weight: { type: String },
    category: { type: String },
    countryOfOrigin: { type: String },
  },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Product", productSchema);

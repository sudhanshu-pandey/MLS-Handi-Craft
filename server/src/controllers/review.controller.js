import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import { HTTP_STATUS } from "../config/constants.js";

// Add review
const addReview = async (req, res) => {
  try {
    const { productId, rating, comment, name, images } = req.body;
    if (!productId || !rating) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Product and rating required" });
    
    const product = await Product.findById(productId);
    if (!product) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Product not found" });
    
    const review = new Review({
      product: productId,
      user: req.user.id,
      name: name || 'Anonymous',
      rating,
      comment,
      images: images || []
    });
    
    await review.save();
    
    // Update product review count and rating
    const allReviews = await Review.find({ product: productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    product.rating = avgRating;
    product.reviewCount = allReviews.length;
    await product.save();
    
    res.status(HTTP_STATUS.CREATED).json({ review });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

// Get reviews for a product
const getProductReviews = async (req, res) => {
  try {
    const { sort = 'latest' } = req.query;
    const sortOrder = sort === 'highest' ? { rating: -1 } : { createdAt: -1 };
    
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "name phone")
      .sort(sortOrder);
    
    res.json({ reviews, total: reviews.length });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: err.message });
  }
};

export default {
  addReview,
  getProductReviews
};

import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import { HTTP_STATUS } from "../config/constants.js";

// Add review with image uploads
const addReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    const userId = req.user.id;
    
    if (!productId || !rating) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Product and rating required" });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Rating must be between 1 and 5" });
    }
    
    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Product not found" });
    }
    
    // If orderId provided, verify user owns the order and order is delivered
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Order not found" });
      }
      if (order.user.toString() !== userId) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({ message: "You can only review your own orders" });
      }
      if (order.status !== 'delivered') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Can only review delivered orders" });
      }
    }
    
    // Get uploaded image URLs from multer-s3
    const images = req.files?.map(file => file.location) || [];
    
    const review = new Review({
      product: productId,
      user: userId,
      name: req.user.name || 'Anonymous',
      rating: parseInt(rating),
      comment: comment || '',
      images: images
    });
    
    await review.save();
    
    // Update product review count and average rating
    const allReviews = await Review.find({ product: productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    product.rating = Math.round(avgRating * 10) / 10; // Round to 1 decimal
    product.reviewCount = allReviews.length;
    await product.save();
    
    res.status(HTTP_STATUS.CREATED).json({ 
      message: "Review submitted successfully",
      review 
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      message: "Server error", 
      error: err.message 
    });
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
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
};

// Get user's reviews
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate("product", "name image")
      .sort({ createdAt: -1 });
    
    res.json({ reviews, total: reviews.length });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
};

// Check if user already reviewed a product (for an order)
const checkIfReviewed = async (req, res) => {
  try {
    const { productId, orderId } = req.query;
    
    const review = await Review.findOne({ 
      product: productId,
      user: req.user.id
    });
    
    res.json({ 
      hasReviewed: !!review,
      review: review || null
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
};

export default {
  addReview,
  getProductReviews,
  getUserReviews,
  checkIfReviewed
};

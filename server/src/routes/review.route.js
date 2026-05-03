import express from "express";
import reviewController from "../controllers/review.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import reviewUpload from "../middleware/reviewUpload.js";

const router = express.Router();

// Get reviews for a product
router.get("/product/:productId", reviewController.getProductReviews);

// Add review with image uploads (protected)
router.post("/", authMiddleware, reviewUpload.array('images', 3), reviewController.addReview);

// Get user's reviews (protected)
router.get("/user", authMiddleware, reviewController.getUserReviews);

// Check if user has already reviewed a product (protected)
router.get("/check", authMiddleware, reviewController.checkIfReviewed);

export default router;

import express from "express";
import reviewController from "../controllers/review.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

// Get reviews for a product - Use /products/:productId/reviews via product routes
// Add review - Use /products/:productId/reviews via product routes
// For standalone review endpoints:
router.post("/", authMiddleware, reviewController.addReview);
router.get("/:productId", reviewController.getProductReviews);

export default router;

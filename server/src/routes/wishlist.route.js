import express from "express";
import wishlistController from "../controllers/wishlist.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

// Get wishlist
router.get("/", authMiddleware, wishlistController.getWishlist);

// Add to wishlist
router.post("/add", authMiddleware, wishlistController.addToWishlist);

// Remove from wishlist
router.delete("/remove/:productId", authMiddleware, wishlistController.removeFromWishlist);

export default router;

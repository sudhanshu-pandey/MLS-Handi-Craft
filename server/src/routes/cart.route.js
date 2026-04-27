

import express from "express";
import cartController from "../controllers/cart.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

// Get user's cart
router.get('/', authMiddleware, cartController.getCart);

// Add product to cart
router.post('/', authMiddleware, cartController.addToCart);

// Update cart item quantity
router.put('/', authMiddleware, cartController.updateCartQuantity);

// Toggle save for later
router.post('/save-for-later', authMiddleware, cartController.toggleSaveForLater);

// Remove product from cart
router.delete('/:productId', authMiddleware, cartController.removeFromCart);

// Clear cart
router.post('/clear', authMiddleware, cartController.clearCart);

// Sync guest cart with user cart (called on login)
router.post('/sync', authMiddleware, cartController.syncCart);

export default router;
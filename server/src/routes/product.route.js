
import express from "express";
import productController from "../controllers/product.controller.js";
import reviewController from "../controllers/review.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

// Search products
router.get('/search', productController.searchProducts);

// Filter products
router.post('/filter', productController.filterProducts);

// Update stock (after order placement)
router.post('/update-stock', productController.updateStock);

// Get all products
router.get('/', productController.getAllProducts);

// Create product (admin only)
router.post('/', productController.createProduct);

// Get products by category
router.get('/category/:category', productController.getProductsByCategory);

// Get product by ID
router.get('/:id', productController.getProductById);

// Get reviews for product
router.get('/:id/reviews', reviewController.getProductReviews);

// Add review for product
router.post('/:id/reviews', authMiddleware, reviewController.addReview);

// Update product (admin only)
router.put('/:id', productController.updateProduct);

// Delete product (admin only)
router.delete('/:id', productController.deleteProduct);

export default router;

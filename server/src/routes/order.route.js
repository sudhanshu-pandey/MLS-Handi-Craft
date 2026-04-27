import express from "express";
import orderController from "../controllers/order.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";
const router = express.Router();

// Admin list routes
router.get("/admin/all", adminAuthMiddleware, orderController.getAllOrdersAdmin);
router.get("/admin/user/:userId", adminAuthMiddleware, orderController.getOrdersByUserAdmin);

// Create new order
router.post("/", authMiddleware, orderController.createOrder);

// Get all orders for user
router.get("/", authMiddleware, orderController.getOrders);

// Get single order details
router.get("/:orderId", authMiddleware, orderController.getOrderDetails);

// Update order status (admin)
router.put("/:orderId/status", adminAuthMiddleware, orderController.updateOrderStatus);

// Cancel order
router.post("/:orderId/cancel", authMiddleware, orderController.cancelOrder);

// Cancel order with refund
router.post("/:orderId/cancel-with-refund", authMiddleware, orderController.cancelOrderWithRefund);

// Submit support ticket for order
router.post("/:orderId/support", authMiddleware, orderController.submitOrderSupport);

export default router;
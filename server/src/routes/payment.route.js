import express from "express";
import paymentController from "../controllers/payment.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { cleanupExpiredOrders } from "../jobs/cleanupExpiredOrders.js";

const router = express.Router();

// Validate coupon code
router.post("/validate-coupon", paymentController.validateCoupon);

// Process payment / Create order
router.post("/process", authMiddleware, paymentController.processPayment);

// Initialize payment for gateway
router.post("/initialize", authMiddleware, paymentController.initializePayment);

// Verify payment
router.post("/verify", authMiddleware, paymentController.verifyPayment);

// Razorpay endpoints
router.post("/razorpay/create-order", authMiddleware, paymentController.createRazorpayOrder);
router.post("/razorpay/verify", authMiddleware, paymentController.verifyRazorpayPayment);

// Manual cleanup endpoint (for testing/monitoring)
router.post("/cleanup-expired", async (req, res) => {
  try {
    const result = await cleanupExpiredOrders();
    res.json(result);
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Cleanup failed", 
      error: err.message 
    });
  }
});

export default router;

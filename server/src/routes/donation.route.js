import express from "express"
import {
  createDonationOrder,
  verifyDonationPayment,
  getUserDonations,
  getDonationStats,
} from "../controllers/donation.controller.js"
import authMiddleware from "../middleware/authMiddleware.js"

const router = express.Router()

/**
 * POST /api/donations/razorpay/create-order
 * Create a new donation order (public endpoint)
 */
router.post("/razorpay/create-order", createDonationOrder)

/**
 * POST /api/donations/razorpay/verify
 * Verify Razorpay payment signature and record donation (public endpoint)
 */
router.post("/razorpay/verify", verifyDonationPayment)

/**
 * GET /api/donations/my-donations
 * Get user's donation history (requires authentication)
 */
router.get("/my-donations", authMiddleware, getUserDonations)

/**
 * GET /api/donations/stats
 * Get public donation statistics
 */
router.get("/stats", getDonationStats)

export default router

import express from "express";
import {
  getAllCoupons,
  verifyCoupon,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/coupon.controller.js";

const router = express.Router();

/**
 * Public Routes
 */
// Get all active coupons
router.get("/", getAllCoupons);

// Verify and apply coupon
router.post("/verify", verifyCoupon);

// Get coupon by code
router.get("/:code", getCouponByCode);

/**
 * Admin Routes (can add auth middleware later)
 */
// Create coupon
router.post("/admin/create", createCoupon);

// Update coupon
router.put("/admin/update/:id", updateCoupon);

// Delete coupon
router.delete("/admin/delete/:id", deleteCoupon);

export default router;

import express from "express";
import { logout, sendOTP, verifyOTP, refreshAccessToken } from "../controllers/auth.controller.js";
import { extractClientIP } from "../middleware/extractClientIP.js";

const router = express.Router();

// Apply IP extraction middleware to all OTP routes
router.post("/send-otp", extractClientIP, sendOTP);
router.post("/verify-otp", extractClientIP, verifyOTP);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);

export default router;

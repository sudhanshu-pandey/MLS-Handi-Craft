import express from "express";
import { logout, sendOTP, verifyOTP, refreshAccessToken } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);

export default router;

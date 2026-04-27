import express from "express";
import {
  adminLogin,
  adminLogout,
  adminRefreshToken,
} from "../controllers/admin-auth.controller.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// Public routes
router.post("/admin/login", adminLogin);
router.post("/admin/logout", adminLogout);
router.post("/admin/refresh", adminRefreshToken);

// Protected routes (require admin auth)
// Add routes that need authentication here

export default router;

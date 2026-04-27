import express from "express";
import userController from "../controllers/user.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";
const router = express.Router();


// Profile
router.get("/profile", authMiddleware, userController.getProfile);
router.put("/profile", authMiddleware, userController.updateProfile);

// Addresses
router.get("/addresses", authMiddleware, userController.listAddresses);
router.post("/addresses", authMiddleware, userController.addAddress);
router.put("/addresses/:addressId", authMiddleware, userController.updateAddress);
router.delete("/addresses/:addressId", authMiddleware, userController.deleteAddress);

// Admin user management
router.get("/admin/all", adminAuthMiddleware, userController.getAllUsersAdmin);
router.get("/admin/:userId", adminAuthMiddleware, userController.getUserByIdAdmin);
router.put("/admin/:userId/block", adminAuthMiddleware, userController.blockUserAdmin);
router.put("/admin/:userId/unblock", adminAuthMiddleware, userController.unblockUserAdmin);

export default router;
import express from "express";
import bannerController from "../controllers/banner.controller.js";

const router = express.Router();

// Public routes
router.get("/", bannerController.getAllBanners);
router.get("/:id", bannerController.getBannerById);

// Admin routes (can be protected with middleware later)
router.post("/", bannerController.createBanner);
router.put("/:id", bannerController.updateBanner);
router.delete("/:id", bannerController.deleteBanner);

export default router;

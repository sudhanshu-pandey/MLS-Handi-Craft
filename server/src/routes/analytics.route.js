import express from "express";
import analyticsController from "../controllers/analytics.controller.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/kpis", adminAuthMiddleware, analyticsController.getKPIs);
router.get("/revenue", adminAuthMiddleware, analyticsController.getRevenueTrend);
router.get("/category-revenue", adminAuthMiddleware, analyticsController.getCategoryRevenue);

export default router;

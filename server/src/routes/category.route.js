import express from "express";
import categoryController from "../controllers/category.controller.js";
const router = express.Router();

// Public routes
router.get("/", categoryController.getAllCategories);
router.get("/slug/:slug", categoryController.getCategoryBySlug);

// Admin routes (can be protected with middleware later)
router.post("/", categoryController.createCategory);
router.put("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

export default router;
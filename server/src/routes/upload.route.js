import { Router } from "express";
import upload from "../middleware/upload.js";

const router = Router();

// POST /api/upload  –  upload single image, returns the S3 URL
router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  res.json({ url: req.file.location });
});

// POST /api/upload/multiple  –  upload up to 5 images
router.post("/multiple", upload.array("images", 5), (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ message: "No files uploaded" });
  }
  const urls = req.files.map((f) => f.location);
  res.json({ urls });
});

export default router;

import { Router } from "express";
import upload, { videoUpload } from "../middleware/upload.js";

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

// POST /api/upload/video  –  upload single video, returns the S3 URL
router.post("/video", videoUpload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No video uploaded" });
  }
  res.json({ url: req.file.location });
});

// POST /api/upload/videos  –  upload up to 5 videos
router.post("/videos", videoUpload.array("videos", 5), (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ message: "No videos uploaded" });
  }
  const urls = req.files.map((f) => f.location);
  res.json({ urls });
});

export default router;

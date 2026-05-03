import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import s3Client, { S3_BUCKET } from "../config/s3.js";

const reviewUpload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      // Create unique filename: reviews/timestamp-randomstring-originalname
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const safeName = file.originalname.replace(/\s+/g, "_");
      cb(null, `reviews/${timestamp}-${random}-${safeName}`);
    },
  }),
  limits: { 
    fileSize: 2 * 1024 * 1024, // 2 MB per image
    files: 3 // Max 3 files
  },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) return cb(null, true);
    cb(new Error("Only image files (jpg, png, gif, webp) are allowed"));
  },
});

export default reviewUpload;

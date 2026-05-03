import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import s3Client, { S3_BUCKET } from "../config/s3.js";

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      // Keep original filename, sanitize spaces → underscores
      const safeName = file.originalname.replace(/\s+/g, "_");
      cb(null, safeName);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) return cb(null, true);
    cb(new Error("Only image files (jpg, png, gif, webp) are allowed"));
  },
});

export default upload;

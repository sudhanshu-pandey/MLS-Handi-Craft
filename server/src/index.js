import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { scheduleCleanupJob } from "./jobs/cleanupExpiredOrders.js";
import startOTPCleanupTasks from "./utils/otpCleanupTasks.js";

import authRouter from "./routes/auth.route.js";
import adminAuthRouter from "./routes/admin-auth.route.js";
import cartRouter from "./routes/cart.route.js";
import productRouter from "./routes/product.route.js";
import userRouter from "./routes/user.route.js";
import categoryRouter from "./routes/category.route.js";
import bannerRouter from "./routes/banner.route.js";
import orderRouter from "./routes/order.route.js";
import reviewRouter from "./routes/review.route.js";
import wishlistRouter from "./routes/wishlist.route.js";
import paymentRouter from "./routes/payment.route.js";
import couponRouter from "./routes/coupon.route.js";
import addressRouter from "./routes/address.route.js";
import pincodeRouter from "./routes/pincode.route.js";
import analyticsRouter from "./routes/analytics.route.js";
import uploadRouter from "./routes/upload.route.js";
import otpMonitoringRouter from "./routes/otp-monitoring.route.js";
import donationRouter from "./routes/donation.route.js";

dotenv.config();

// DB Connection
connectDB();

const app = express();

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
      "https://mls-handi-craft.onrender.com",
      "https://mls-handi-craft-admin.onrender.com"
    ].filter(Boolean);

    if (isLocalhost || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS request blocked from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors(corsOptions));

// Routes

app.use("/api/auth", authRouter);
app.use("/api/auth", adminAuthRouter);
app.use("/api/cart", cartRouter);
app.use("/api/products", productRouter);
app.use("/api/user", userRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/banners", bannerRouter);
app.use("/api/orders", orderRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/coupons", couponRouter);
app.use("/api/address", addressRouter);
app.use("/api/pincode", pincodeRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/otp-monitoring", otpMonitoringRouter);
app.use("/api/donations", donationRouter);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Schedule cleanup job to run every 2 minutes
  // This will automatically delete expired orders
  scheduleCleanupJob();
  
  // Start OTP security cleanup tasks
  startOTPCleanupTasks();
});

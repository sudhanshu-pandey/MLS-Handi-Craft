import "dotenv/config";
// Server Configuration Constants
export const SERVER_CONFIG = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
};

// JWT Token Constants
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET,
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES_IN: "30d",
  REFRESH_TOKEN_EXPIRES_IN: "300d",
};

// Twilio SMS & WhatsApp Configuration
export const TWILIO_CONFIG = {
  SID: process.env.TWILIO_SID,
  AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
};

// Payment Gateway Configuration
export const PAYMENT_CONFIG = {
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
};

// Database Configuration
export const DB_CONFIG = {
  MONGO_URI: process.env.MONGO_URI,
};

// Email Configuration (for future use)
export const EMAIL_CONFIG = {
  SERVICE: process.env.EMAIL_SERVICE || "gmail",
  USER: process.env.EMAIL_USER,
  PASSWORD: process.env.EMAIL_PASSWORD,
};

// OTP Configuration
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_TIME: 5 * 60 * 1000, // 5 minutes in milliseconds
};

// API Response Constants
export const API_MESSAGES = {
  SUCCESS: "Success",
  ERROR: "Error",
  NOT_FOUND: "Not Found",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  BAD_REQUEST: "Bad Request",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
};

// Authentication Messages
export const AUTH_MESSAGES = {
  OTP_SENT: "OTP sent successfully",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  USER_NOT_FOUND: "User not found",
  INVALID_OTP: "Invalid OTP",
  OTP_EXPIRED: "OTP expired",
  INVALID_TOKEN: "Invalid token",
  NO_TOKEN: "No token provided",
};

// Payment Messages
export const PAYMENT_MESSAGES = {
  PAYMENT_INITIALIZED: "Payment initialized",
  PAYMENT_VERIFIED: "Payment verified successfully",
  PAYMENT_NOT_FOUND: "Payment not found",
  INVALID_PAYMENT_METHOD: "Invalid payment method",
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// API Routes
export const API_ROUTES = {
  AUTH: "/api/auth",
  CART: "/api/cart",
  PRODUCTS: "/api/products",
  USER: "/api/user",
  CATEGORIES: "/api/categories",
  ORDERS: "/api/orders",
  REVIEWS: "/api/reviews",
  WISHLIST: "/api/wishlist",
  PAYMENTS: "/api/payments",
};

// Regex Patterns
export const REGEX_PATTERNS = {
  PHONE: /^[0-9]{10}$/, // Indian 10-digit phone number
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PINCODE: /^[0-9]{6}$/,
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: "pending",
  SUCCESS: "success",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

// Order Status
export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PACKED: "packed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURNED: "returned",
};

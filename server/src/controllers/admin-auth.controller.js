import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { JWT_CONFIG, AUTH_MESSAGES, HTTP_STATUS } from "../config/constants.js";

const resolveJwtSecret = () => JWT_CONFIG.SECRET || process.env.JWT_SECRET || "handicraft-dev-secret";
const resolveRefreshSecret = () => JWT_CONFIG.REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || "handicraft-refresh-secret";

/**
 * Admin Login
 * POST /api/auth/admin/login
 * Body: { email: string, password: string }
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Hardcoded demo credentials (in production, validate against database with bcrypt)
    const ADMIN_USERS = [
      {
        _id: "admin_001",
        name: "Admin User",
        email: "admin@handicraft.com",
        password: "admin123", // In production: use bcrypt
        role: "admin",
      },
      {
        _id: "manager_001",
        name: "Manager User",
        email: "manager@handicraft.com",
        password: "manager123",
        role: "manager",
      },
    ];

    const admin = ADMIN_USERS.find(u => u.email === email && u.password === password);

    if (!admin) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        name: admin.name,
        type: "admin",
      },
      resolveJwtSecret(),
      { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN || "30d" }
    );

    const refreshToken = jwt.sign(
      { id: admin._id, type: "admin" },
      resolveRefreshSecret(),
      { expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN || "300d" }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Admin login successful",
      token: accessToken,
      refreshToken,
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

/**
 * Admin Logout
 * POST /api/auth/admin/logout
 */
export const adminLogout = async (req, res) => {
  try {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: AUTH_MESSAGES.LOGOUT_SUCCESS,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Logout failed",
    });
  }
};

/**
 * Refresh Admin Access Token
 * POST /api/auth/admin/refresh
 * Body: { refreshToken: string }
 */
export const adminRefreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, resolveRefreshSecret());
    } catch (error) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // Get admin info
    const ADMIN_USERS = [
      {
        _id: "admin_001",
        name: "Admin User",
        email: "admin@handicraft.com",
        role: "admin",
      },
      {
        _id: "manager_001",
        name: "Manager User",
        email: "manager@handicraft.com",
        role: "manager",
      },
    ];

    const admin = ADMIN_USERS.find(u => u._id === decoded.id);

    if (!admin) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        name: admin.name,
        type: "admin",
      },
      resolveJwtSecret(),
      { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN || "30d" }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Admin token refresh error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Token refresh failed",
    });
  }
};

export default {
  adminLogin,
  adminLogout,
  adminRefreshToken,
};

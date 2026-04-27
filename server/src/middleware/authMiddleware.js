import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { JWT_CONFIG, AUTH_MESSAGES, HTTP_STATUS } from "../config/constants.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: AUTH_MESSAGES.NO_TOKEN });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: AUTH_MESSAGES.NO_TOKEN });
    }

    const decoded = jwt.verify(token, JWT_CONFIG.SECRET);

    if (decoded?.type === "admin") {
      req.admin = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
      };
      req.user = { id: decoded.id, isAdmin: true };
      return next();
    }

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      console.error("User not found for ID:", decoded.id);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: AUTH_MESSAGES.INVALID_TOKEN });
  }
};

export default authMiddleware;

import jwt from "jsonwebtoken";
import { AUTH_MESSAGES, HTTP_STATUS, JWT_CONFIG } from "../config/constants.js";

const resolveJwtSecret = () => JWT_CONFIG.SECRET || process.env.JWT_SECRET || "handicraft-dev-secret";

const adminAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: AUTH_MESSAGES.NO_TOKEN });
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: AUTH_MESSAGES.NO_TOKEN });
    }

    const decoded = jwt.verify(token, resolveJwtSecret());

    if (decoded?.type !== "admin") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: AUTH_MESSAGES.FORBIDDEN_ADMIN });
    }

    req.admin = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error.message);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: AUTH_MESSAGES.INVALID_TOKEN });
  }
};

export default adminAuthMiddleware;

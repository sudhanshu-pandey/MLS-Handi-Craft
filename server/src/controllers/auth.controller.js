import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { generateOTP } from "../utils/generateOTP.js";
import { sendSMSOtp, sendWhatsAppOtp } from "../utils/sendOTP.js";
import { JWT_CONFIG, AUTH_MESSAGES, HTTP_STATUS, OTP_CONFIG } from "../config/constants.js";
import otpSecurityService from "../services/otpSecurityService.js";
import otpAuditLogger from "../services/otpAuditLogger.js";

// Phone validation regex (E.164 format)
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, phone: user.phone }, JWT_CONFIG.SECRET, {
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, JWT_CONFIG.REFRESH_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
  });
};

const validatePhone = (phone) => {
  return PHONE_REGEX.test(phone.replace(/\s/g, ''));
};

const validateOTP = (otp) => {
  return /^\d{6}$/.test(otp);
};

/**
 * Send OTP with comprehensive security checks
 * Includes: rate limiting, cooldown, blacklist, suspicious activity detection, cost optimization
 */
export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const clientIP = req.clientIP || 'unknown';

    // ============ BASIC VALIDATION ============
    if (!phone) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Phone number is required" });
    }

    if (!validatePhone(phone)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Invalid phone number format" });
    }

    // ============ BLACKLIST CHECK ============
    if (otpSecurityService.isBlacklisted(phone)) {
      otpAuditLogger.logOTPSend(phone, clientIP, null, false, 'BLACKLISTED_PHONE');
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: "This phone number has been temporarily blocked due to suspicious activity",
      });
    }

    if (otpSecurityService.isBlacklisted(clientIP)) {
      otpAuditLogger.logOTPSend(phone, clientIP, null, false, 'BLACKLISTED_IP');
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: "Your IP has been blocked due to suspicious activity",
      });
    }

    // ============ IP RATE LIMIT CHECK ============
    const ipRateLimit = otpSecurityService.checkIPRateLimit(clientIP);
    if (!ipRateLimit.allowed) {
      otpAuditLogger.logRateLimitViolation(phone, clientIP, 'IP_LIMIT');
      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        message: "Too many OTP requests from your IP. Please try again later.",
        retryAfter: ipRateLimit.retryAfter,
      });
    }

    // ============ PHONE RATE LIMIT CHECK ============
    const phoneRateLimit = otpSecurityService.checkPhoneRateLimit(phone);
    if (!phoneRateLimit.allowed) {
      otpAuditLogger.logRateLimitViolation(phone, clientIP, 'PHONE_LIMIT');
      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        message: "Too many OTP requests for this phone. Please try again later.",
        retryAfter: phoneRateLimit.retryAfter,
      });
    }

    // ============ COOLDOWN CHECK ============
    const cooldown = otpSecurityService.checkCooldown(phone);
    if (!cooldown.allowed) {
      otpAuditLogger.logOTPSend(phone, clientIP, null, false, 'COOLDOWN_ACTIVE');
      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        message: "Please wait before requesting another OTP",
        retryAfter: cooldown.retryAfter,
      });
    }

    // ============ SUSPICIOUS ACTIVITY DETECTION ============
    otpSecurityService.trackIPPhoneRequest(clientIP, phone);
    if (otpSecurityService.isSuspiciousIP(clientIP)) {
      otpAuditLogger.logOTPSend(phone, clientIP, null, false, 'SUSPICIOUS_IP');
      // Silent block: pretend OTP was sent but don't actually send it
      return res.json({ message: AUTH_MESSAGES.OTP_SENT });
    }

    // ============ USER LOCK CHECK ============
    let user = await User.findOne({ phone });
    
    if (user) {
      // Check if user account is blocked
      if (user.isBlocked && user.blockedUntil && user.blockedUntil > new Date()) {
        otpAuditLogger.logOTPSend(phone, clientIP, null, false, 'USER_BLOCKED');
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          message: "Your account is temporarily locked. Please contact support.",
        });
      }

      // Reset block if expired
      if (user.isBlocked && user.blockedUntil && user.blockedUntil <= new Date()) {
        user.isBlocked = false;
        user.blockedUntil = null;
        user.blockedReason = null;
      }

      // Prevent re-verification within 30 seconds of successful login
      if (user.lastVerifiedAt && Date.now() - user.lastVerifiedAt.getTime() < 30 * 1000) {
        otpAuditLogger.logOTPSend(phone, clientIP, null, false, 'RECENTLY_VERIFIED');
        return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
          message: "You were recently verified. Please try again in a moment.",
        });
      }
    } else {
      user = new User({ phone });
    }

    // ============ GENERATE OTP & SESSION TOKEN ============
    const plainOTP = generateOTP();
    const hashedOTP = await otpSecurityService.hashOTP(plainOTP);
    const sessionToken = otpSecurityService.generateSessionToken(phone);

    user.otp = hashedOTP;
    user.otpExpires = new Date(Date.now() + OTP_CONFIG.EXPIRY_TIME);
    user.lastOTPSentAt = new Date();
    user.otpAttempts = 0; // Reset attempt counter
    user.otpLockedUntil = null;

    await user.save();

    // ============ SEND OTP ============
    // In production, use your SMS service
    await sendSMSOtp(phone, plainOTP);

    // Log successful send
    otpAuditLogger.logOTPSend(phone, clientIP, sessionToken, true);

    // ============ SMART DELAY FOR CLIENT ============
    const smartDelay = otpSecurityService.getSmartDelay(phone);
    otpSecurityService.updateCooldown(phone);

    console.log("OTP:", plainOTP); // For testing only - remove in production

    res.json({
      message: AUTH_MESSAGES.OTP_SENT,
      sessionToken, // Send token to client, don't use phone directly
      suggestedDelay: smartDelay, // Client should wait this long before resending
    });
  } catch (error) {
    otpAuditLogger.logOTPSend(null, req.clientIP || 'unknown', null, false, 'SERVER_ERROR');
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

/**
 * Verify OTP with security enhancements
 * Uses session token instead of phone number
 * Implements attempt limiting and account locking
 */
export const verifyOTP = async (req, res) => {
  try {
    const { sessionToken, otp } = req.body;
    const clientIP = req.clientIP || 'unknown';

    // ============ INPUT VALIDATION ============
    if (!sessionToken || !otp) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Session token and OTP are required",
      });
    }

    if (!validateOTP(otp)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Invalid OTP format",
      });
    }

    // ============ SESSION TOKEN VALIDATION ============
    const phone = otpSecurityService.getPhoneFromToken(sessionToken);
    if (!phone) {
      otpAuditLogger.logOTPVerify(null, clientIP, sessionToken, false, 'INVALID_TOKEN');
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: "Invalid or expired session token. Please request a new OTP.",
      });
    }

    // ============ BLACKLIST CHECK ============
    if (otpSecurityService.isBlacklisted(phone)) {
      otpAuditLogger.logOTPVerify(phone, clientIP, sessionToken, false, 'BLACKLISTED_PHONE');
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: "This phone number is blocked",
      });
    }

    // ============ ATTEMPT LIMIT CHECK ============
    const lockStatus = otpSecurityService.isPhoneLocked(phone);
    if (lockStatus.locked) {
      otpAuditLogger.logOTPVerify(phone, clientIP, sessionToken, false, 'ACCOUNT_LOCKED');
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: "Too many failed attempts. Please try again later.",
        retryAfter: lockStatus.retryAfter,
      });
    }

    // ============ FETCH USER ============
    const user = await User.findOne({ phone });

    if (!user) {
      otpAuditLogger.logOTPVerify(phone, clientIP, sessionToken, false, 'USER_NOT_FOUND');
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: AUTH_MESSAGES.USER_NOT_FOUND,
      });
    }

    // ============ OTP EXPIRY CHECK ============
    if (!user.otpExpires || user.otpExpires < new Date()) {
      otpAuditLogger.logOTPVerify(phone, clientIP, sessionToken, false, 'OTP_EXPIRED');
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: AUTH_MESSAGES.OTP_EXPIRED,
      });
    }

    // ============ OTP VERIFICATION ============
    const isValidOTP = await otpSecurityService.verifyHashedOTP(otp, user.otp);

    if (!isValidOTP) {
      // Record failed attempt
      const attemptResult = otpSecurityService.recordFailedAttempt(phone);

      // Update user with failed attempt data
      user.otpAttempts = (user.otpAttempts || 0) + 1;

      if (attemptResult.locked) {
        user.isBlocked = true;
        user.blockedUntil = new Date(Date.now() + 12 * 60 * 1000); // 12 minute lock
        user.blockedReason = 'Too many failed OTP attempts';
        await user.save();

        otpAuditLogger.logOTPVerify(phone, clientIP, sessionToken, false, 'INVALID_OTP_LOCKED');
        otpAuditLogger.logBlacklist(phone, 'TOO_MANY_FAILED_ATTEMPTS', 12);

        return res.status(HTTP_STATUS.FORBIDDEN).json({
          message: "Account locked due to too many failed attempts. Try again in 12 minutes.",
        });
      }

      await user.save();
      otpAuditLogger.logOTPVerify(phone, clientIP, sessionToken, false, 'INVALID_OTP');

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: AUTH_MESSAGES.INVALID_OTP,
        retriesLeft: 3 - user.otpAttempts,
      });
    }

    // ============ SUCCESS: CLEAR OTP & ATTEMPTS ============
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    user.otpAttempts = 0;
    user.lastVerifiedAt = new Date();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    // Clear failed attempts from in-memory store
    otpSecurityService.clearFailedAttempts(phone);

    // Mark session token as used (one-time use)
    otpSecurityService.markTokenAsUsed(sessionToken);

    otpAuditLogger.logOTPVerify(phone, clientIP, sessionToken, true);

    res.json({
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    otpAuditLogger.logOTPVerify(null, req.clientIP || 'unknown', null, false, 'SERVER_ERROR');
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Refresh token is required" });
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_SECRET);
    } catch (error) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Invalid or expired refresh token" });
    }

    // Find user and verify refresh token matches
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Refresh token not found or invalid" });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    res.json({
      message: "Access token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // If no refreshToken provided, just return success
    if (!refreshToken) {
      return res.json({ message: AUTH_MESSAGES.LOGOUT_SUCCESS });
    }

    const user = await User.findOne({
      refreshToken: refreshToken,
    });

    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.json({ message: AUTH_MESSAGES.LOGOUT_SUCCESS });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

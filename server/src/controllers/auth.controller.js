import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { generateOTP } from "../utils/generateOTP.js";
import { sendSMSOtp, sendWhatsAppOtp } from "../utils/sendOTP.js";
import { JWT_CONFIG, AUTH_MESSAGES, HTTP_STATUS, OTP_CONFIG } from "../config/constants.js";

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

export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number
    if (!phone) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Phone number is required" });
    }

    if (!validatePhone(phone)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Invalid phone number format" });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      user = new User({ phone });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + OTP_CONFIG.EXPIRY_TIME;

    await user.save();

    await sendSMSOtp(phone, otp);
    //await sendWhatsAppOtp(phone, otp);

    console.log("OTP:", otp); // For testing only - remove in production

    res.json({ message: AUTH_MESSAGES.OTP_SENT });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Validate inputs
    if (!phone || !otp) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Phone and OTP are required" });
    }

    if (!validatePhone(phone)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Invalid phone number format" });
    }

    if (!validateOTP(otp)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Invalid OTP format" });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: AUTH_MESSAGES.USER_NOT_FOUND });
    }

    if (user.otp !== otp) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: AUTH_MESSAGES.INVALID_OTP });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: AUTH_MESSAGES.OTP_EXPIRED });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      accessToken,
      refreshToken,
    });
  } catch (error) {
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

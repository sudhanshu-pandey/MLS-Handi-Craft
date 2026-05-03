/**
 * Optional Admin Monitoring API
 * Add this to admin routes to monitor OTP security
 */

import otpAuditLogger from '../services/otpAuditLogger.js';
import otpSecurityService from '../services/otpSecurityService.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * Get OTP audit logs summary
 */
export const getOTPSummary = async (req, res) => {
  try {
    const { hours = 1 } = req.query;

    const summary = otpAuditLogger.getSummary(parseInt(hours));
    const suspiciousIPs = otpAuditLogger.getSuspiciousIPs();

    res.json({
      period: `${hours} hour(s)`,
      summary,
      suspiciousIPs,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

/**
 * Get detailed OTP logs
 */
export const getOTPLogs = async (req, res) => {
  try {
    const { hours = 1, type } = req.query;

    const logs = otpAuditLogger.getRecentLogs(parseInt(hours), type);

    res.json({
      total: logs.length,
      logs,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

/**
 * Blacklist an IP or phone number (admin action)
 */
export const blacklistIdentifier = async (req, res) => {
  try {
    const { identifier, reason, durationMinutes = 60 } = req.body;

    if (!identifier || !reason) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Identifier and reason are required',
      });
    }

    otpSecurityService.blacklistIdentifier(identifier, reason, durationMinutes);
    otpAuditLogger.logBlacklist(identifier, reason, durationMinutes);

    res.json({
      message: `${identifier} blacklisted for ${durationMinutes} minutes`,
      reason,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

/**
 * Check if identifier is blacklisted
 */
export const checkBlacklist = async (req, res) => {
  try {
    const { identifier } = req.query;

    if (!identifier) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Identifier is required',
      });
    }

    const isBlacklisted = otpSecurityService.isBlacklisted(identifier);

    res.json({
      identifier,
      blacklisted: isBlacklisted,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

/**
 * Detect abuse patterns
 */
export const detectAbusePatterns = async (req, res) => {
  try {
    const patterns = otpAuditLogger.detectAbusePatterns();

    res.json({
      patterns,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

export default {
  getOTPSummary,
  getOTPLogs,
  blacklistIdentifier,
  checkBlacklist,
  detectAbusePatterns,
};

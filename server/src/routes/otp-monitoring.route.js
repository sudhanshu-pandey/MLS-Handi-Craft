import express from 'express';
import {
  getOTPSummary,
  getOTPLogs,
  blacklistIdentifier,
  checkBlacklist,
  detectAbusePatterns,
} from '../controllers/otp-monitoring.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';

/**
 * Admin OTP Monitoring Routes
 * Protect with admin authentication in production
 */

const router = express.Router();

// Apply auth middleware (replace with admin check in production)
// router.use(authMiddleware);

router.get('/summary', getOTPSummary);
router.get('/logs', getOTPLogs);
router.post('/blacklist', blacklistIdentifier);
router.get('/blacklist/check', checkBlacklist);
router.get('/abuse-patterns', detectAbusePatterns);

export default router;

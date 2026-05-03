import otpSecurityService from '../services/otpSecurityService.js';

/**
 * Start background cleanup tasks for OTP security
 * Should be called once when server starts
 */
export const startOTPCleanupTasks = () => {
  // Cleanup every 5 minutes
  setInterval(() => {
    otpSecurityService.cleanup();
    console.log('[OTP_CLEANUP] Cleaned up expired sessions and blacklist entries');
  }, 5 * 60 * 1000);

  console.log('[OTP_SECURITY] Cleanup tasks started');
};

export default startOTPCleanupTasks;

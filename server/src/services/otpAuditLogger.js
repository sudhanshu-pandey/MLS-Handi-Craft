/**
 * OTP Audit Logging Service
 * Tracks all OTP operations for security monitoring and abuse detection
 */

class OTPAuditLogger {
  constructor() {
    // In-memory logs (use MongoDB for persistence in production)
    this.logs = [];
    this.MAX_LOGS = 10000; // Keep last 10k logs in memory
  }

  /**
   * Log OTP send event
   */
  logOTPSend(phone, ip, sessionToken, success = true, reason = null) {
    this.addLog({
      type: 'OTP_SEND',
      phone,
      ip,
      sessionToken,
      success,
      reason, // Failure reason
      timestamp: new Date(),
    });
  }

  /**
   * Log OTP verification attempt
   */
  logOTPVerify(phone, ip, token, success = true, reason = null) {
    this.addLog({
      type: 'OTP_VERIFY',
      phone,
      ip,
      token,
      success,
      reason, // e.g., 'INVALID_OTP', 'EXPIRED', 'LOCKED'
      timestamp: new Date(),
    });
  }

  /**
   * Log rate limit violations
   */
  logRateLimitViolation(phone, ip, limitType) {
    this.addLog({
      type: 'RATE_LIMIT_VIOLATION',
      phone,
      ip,
      limitType, // 'PHONE_LIMIT' or 'IP_LIMIT'
      timestamp: new Date(),
    });
  }

  /**
   * Log blacklist action
   */
  logBlacklist(identifier, reason, duration) {
    this.addLog({
      type: 'BLACKLIST_ACTION',
      identifier,
      reason,
      duration,
      timestamp: new Date(),
    });
  }

  /**
   * Add log entry
   */
  addLog(logEntry) {
    this.logs.push(logEntry);

    // Trim logs if exceeds max
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[OTP_AUDIT]', logEntry);
    }
  }

  /**
   * Get recent logs for analysis
   */
  getRecentLogs(hours = 1, type = null) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.logs.filter((log) => {
      const matchesTime = log.timestamp >= cutoff;
      const matchesType = !type || log.type === type;
      return matchesTime && matchesType;
    });
  }

  /**
   * Detect abuse patterns
   */
  detectAbusePatterns() {
    const recentLogs = this.getRecentLogs(1); // Last 1 hour

    const patterns = {
      multiplePhonesSameIP: new Map(),
      repeatedFailures: new Map(),
      rateLimitViolations: 0,
    };

    for (const log of recentLogs) {
      // Track multiple phone numbers per IP
      if (log.ip) {
        const phones = patterns.multiplePhonesSameIP.get(log.ip) || new Set();
        if (log.phone) phones.add(log.phone);
        patterns.multiplePhonesSameIP.set(log.ip, phones);
      }

      // Track repeated failures per phone
      if (log.type === 'OTP_VERIFY' && !log.success) {
        const count = (patterns.repeatedFailures.get(log.phone) || 0) + 1;
        patterns.repeatedFailures.set(log.phone, count);
      }

      // Count rate limit violations
      if (log.type === 'RATE_LIMIT_VIOLATION') {
        patterns.rateLimitViolations++;
      }
    }

    return patterns;
  }

  /**
   * Get suspicious IPs (>5 different phone numbers in 1 hour)
   */
  getSuspiciousIPs() {
    const patterns = this.detectAbusePatterns();
    const suspicious = [];

    for (const [ip, phones] of patterns.multiplePhonesSameIP.entries()) {
      if (phones.size >= 5) {
        suspicious.push({ ip, phoneCount: phones.size, phones: Array.from(phones) });
      }
    }

    return suspicious;
  }

  /**
   * Get summary statistics
   */
  getSummary(hours = 1) {
    const logs = this.getRecentLogs(hours);

    return {
      totalOTPRequests: logs.filter((l) => l.type === 'OTP_SEND').length,
      successfulSends: logs.filter((l) => l.type === 'OTP_SEND' && l.success).length,
      failedSends: logs.filter((l) => l.type === 'OTP_SEND' && !l.success).length,
      totalVerifyAttempts: logs.filter((l) => l.type === 'OTP_VERIFY').length,
      successfulVerifies: logs.filter((l) => l.type === 'OTP_VERIFY' && l.success).length,
      rateLimitViolations: logs.filter((l) => l.type === 'RATE_LIMIT_VIOLATION').length,
      uniqueIPs: new Set(logs.map((l) => l.ip).filter(Boolean)).size,
      uniquePhones: new Set(logs.map((l) => l.phone).filter(Boolean)).size,
    };
  }
}

// Export singleton instance
export default new OTPAuditLogger();

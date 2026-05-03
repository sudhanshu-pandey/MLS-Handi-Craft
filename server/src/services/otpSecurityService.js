import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * OTP Security Service
 * Handles: hashing, temporary tokens, rate limiting state, abuse detection
 */

class OTPSecurityService {
  constructor() {
    // In-memory stores (use Redis in production for distributed systems)
    this.otpAttempts = new Map(); // { phone: { attempts, lastAttemptTime, locked } }
    this.otpRequests = new Map(); // { phone: { timestamp, count } }
    this.ipRequests = new Map(); // { ip: { phoneNumbers, timestamp, count } }
    this.sessionTokens = new Map(); // { token: { phone, expiresAt, used } }
    this.blacklist = new Map(); // { identifier: { reason, expiresAt } }
    this.cooldowns = new Map(); // { phone: { timestamp } }
  }

  /**
   * Hash OTP using bcrypt
   */
  async hashOTP(otp) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(otp, salt);
  }

  /**
   * Verify hashed OTP
   */
  async verifyHashedOTP(otp, hashedOTP) {
    return bcrypt.compare(otp, hashedOTP);
  }

  /**
   * Generate temporary session token for OTP verification
   * Prevents directly using phone number for verification
   */
  generateSessionToken(phone) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.sessionTokens.set(token, {
      phone,
      expiresAt,
      used: false,
      createdAt: Date.now(),
    });

    return token;
  }

  /**
   * Validate and retrieve phone from session token
   */
  getPhoneFromToken(token) {
    const session = this.sessionTokens.get(token);

    if (!session) {
      return null;
    }

    // Check if token is expired
    if (session.expiresAt < Date.now()) {
      this.sessionTokens.delete(token);
      return null;
    }

    // Check if already used
    if (session.used) {
      return null;
    }

    return session.phone;
  }

  /**
   * Mark token as used (one-time use)
   */
  markTokenAsUsed(token) {
    const session = this.sessionTokens.get(token);
    if (session) {
      session.used = true;
      // Keep token in map for 5 minutes to prevent replay
      setTimeout(() => this.sessionTokens.delete(token), 5 * 60 * 1000);
    }
  }

  /**
   * Check if phone number is rate limited
   * Limit: max 3 requests per 10 minutes per phone
   */
  checkPhoneRateLimit(phone) {
    const now = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;

    let phoneData = this.otpRequests.get(phone);

    if (!phoneData) {
      this.otpRequests.set(phone, {
        timestamp: now,
        count: 1,
      });
      return { allowed: true, retryAfter: null };
    }

    // Reset if window expired
    if (now - phoneData.timestamp > TEN_MINUTES) {
      this.otpRequests.set(phone, {
        timestamp: now,
        count: 1,
      });
      return { allowed: true, retryAfter: null };
    }

    // Check limit
    if (phoneData.count >= 3) {
      const retryAfter = Math.ceil((TEN_MINUTES - (now - phoneData.timestamp)) / 1000);
      return { allowed: false, retryAfter };
    }

    phoneData.count++;
    return { allowed: true, retryAfter: null };
  }

  /**
   * Check if IP is rate limited
   * Limit: max 10 requests per 10 minutes per IP
   */
  checkIPRateLimit(ip) {
    const now = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;

    let ipData = this.ipRequests.get(ip);

    if (!ipData) {
      this.ipRequests.set(ip, {
        timestamp: now,
        count: 1,
        phoneNumbers: new Set(),
      });
      return { allowed: true, retryAfter: null };
    }

    // Reset if window expired
    if (now - ipData.timestamp > TEN_MINUTES) {
      this.ipRequests.set(ip, {
        timestamp: now,
        count: 1,
        phoneNumbers: new Set(),
      });
      return { allowed: true, retryAfter: null };
    }

    // Check limit
    if (ipData.count >= 10) {
      const retryAfter = Math.ceil((TEN_MINUTES - (now - ipData.timestamp)) / 1000);
      return { allowed: false, retryAfter };
    }

    ipData.count++;
    return { allowed: true, retryAfter: null };
  }

  /**
   * Track phone numbers requested by IP (detect abuse)
   */
  trackIPPhoneRequest(ip, phone) {
    let ipData = this.ipRequests.get(ip);
    if (ipData) {
      ipData.phoneNumbers.add(phone);
    }
  }

  /**
   * Detect suspicious activity
   * Return true if same IP requesting OTP for too many different numbers
   */
  isSuspiciousIP(ip) {
    const ipData = this.ipRequests.get(ip);
    if (!ipData) return false;

    // Flag if same IP requests OTP for 5+ different numbers in 10 minutes
    return ipData.phoneNumbers.size >= 5;
  }

  /**
   * Check cooldown (60 seconds between OTP requests for same number)
   */
  checkCooldown(phone) {
    const now = Date.now();
    const COOLDOWN = 60 * 1000; // 60 seconds

    let cooldownData = this.cooldowns.get(phone);

    if (!cooldownData) {
      this.cooldowns.set(phone, { timestamp: now });
      return { allowed: true, retryAfter: null };
    }

    const elapsed = now - cooldownData.timestamp;
    if (elapsed < COOLDOWN) {
      const retryAfter = Math.ceil((COOLDOWN - elapsed) / 1000);
      return { allowed: false, retryAfter };
    }

    cooldownData.timestamp = now;
    return { allowed: true, retryAfter: null };
  }

  /**
   * Update cooldown timestamp (when OTP is sent)
   */
  updateCooldown(phone) {
    this.cooldowns.set(phone, { timestamp: Date.now() });
  }

  /**
   * Track failed OTP attempt
   * Allow max 3 incorrect attempts, then lock for 10-15 minutes
   */
  recordFailedAttempt(phone) {
    const now = Date.now();
    let attempts = this.otpAttempts.get(phone) || {
      attempts: 0,
      lastAttemptTime: now,
      locked: false,
      lockedUntil: null,
    };

    attempts.attempts++;
    attempts.lastAttemptTime = now;

    // Lock after 3 failed attempts
    if (attempts.attempts >= 3) {
      attempts.locked = true;
      attempts.lockedUntil = now + (12 * 60 * 1000); // 12 minutes lock
      this.otpAttempts.set(phone, attempts);
      return { locked: true, retryAfter: 12 };
    }

    this.otpAttempts.set(phone, attempts);
    return { locked: false, retriesLeft: 3 - attempts.attempts };
  }

  /**
   * Check if phone is locked from OTP attempts
   */
  isPhoneLocked(phone) {
    const attempts = this.otpAttempts.get(phone);

    if (!attempts || !attempts.locked) {
      return { locked: false };
    }

    const now = Date.now();
    if (now > attempts.lockedUntil) {
      // Lock expired, reset
      this.otpAttempts.delete(phone);
      return { locked: false };
    }

    const retryAfter = Math.ceil((attempts.lockedUntil - now) / 1000);
    return { locked: true, retryAfter };
  }

  /**
   * Clear failed attempts on successful verification
   */
  clearFailedAttempts(phone) {
    this.otpAttempts.delete(phone);
  }

  /**
   * Add to blacklist (IP or phone)
   */
  blacklistIdentifier(identifier, reason, durationMinutes = 60) {
    const expiresAt = Date.now() + durationMinutes * 60 * 1000;
    this.blacklist.set(identifier, {
      reason,
      expiresAt,
      addedAt: Date.now(),
    });
  }

  /**
   * Check if identifier is blacklisted
   */
  isBlacklisted(identifier) {
    const entry = this.blacklist.get(identifier);

    if (!entry) {
      return false;
    }

    if (entry.expiresAt < Date.now()) {
      this.blacklist.delete(identifier);
      return false;
    }

    return true;
  }

  /**
   * Calculate smart delay based on request count
   * Exponential backoff: 0s → 2s → 5s → 10s
   */
  getSmartDelay(phone) {
    const phoneData = this.otpRequests.get(phone);
    if (!phoneData) return 0;

    const requestCount = phoneData.count;
    if (requestCount <= 1) return 0;
    if (requestCount === 2) return 2000; // 2 seconds
    if (requestCount === 3) return 5000; // 5 seconds
    return 10000; // 10 seconds for 4+
  }

  /**
   * Cleanup: Remove expired entries periodically
   */
  cleanup() {
    const now = Date.now();

    // Cleanup session tokens
    for (const [token, session] of this.sessionTokens.entries()) {
      if (session.expiresAt < now) {
        this.sessionTokens.delete(token);
      }
    }

    // Cleanup blacklist
    for (const [identifier, entry] of this.blacklist.entries()) {
      if (entry.expiresAt < now) {
        this.blacklist.delete(identifier);
      }
    }
  }
}

// Export singleton instance
export default new OTPSecurityService();

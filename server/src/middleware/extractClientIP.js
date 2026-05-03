/**
 * Middleware to extract client IP address
 * Handles proxies, load balancers, and CDNs
 */

export const extractClientIP = (req, res, next) => {
  let ip =
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    'unknown';

  // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2...)
  // Take the first one (original client IP)
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // Remove IPv6 prefix if present (::ffff:)
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  req.clientIP = ip;
  next();
};

export default extractClientIP;

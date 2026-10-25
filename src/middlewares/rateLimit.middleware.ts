/* ============================================================================
 * Login rate limit
 * Protects POST /api/auth/login against brute force: after 5 failed attempts
 * from the same IP in 15 minutes, the API answers 429.
 * ========================================================================== */

import rateLimit from "express-rate-limit";

export const LOGIN_WINDOW_MINUTES = 15;
export const LOGIN_MAX_FAILED_ATTEMPTS = 5;

export const loginLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MINUTES * 60 * 1000,
  limit: LOGIN_MAX_FAILED_ATTEMPTS,
  // Only failed attempts (status 400 or more) count: a user who logs in
  // correctly several times is never blocked.
  skipSuccessfulRequests: true,
  // RateLimit-* headers tell the client how many attempts are left.
  standardHeaders: true,
  legacyHeaders: false,
  // Same response format as the rest of the API.
  handler: (_req, res) => {
    res.status(429).json({
      status: "fail",
      error: "TooManyRequests",
      message: `Too many failed login attempts. Try again in ${LOGIN_WINDOW_MINUTES} minutes.`,
    });
  },
});

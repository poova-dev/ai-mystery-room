import rateLimit from 'express-rate-limit';

/**
 * Standard API rate limiter for general routes.
 */
export const standardRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
      },
    });
  },
});

/**
 * Stricter rate limiter for mystery creation and AI generation.
 */
export const caseGenerationRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Max 10 generation requests per IP per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many case generation requests. Please wait before creating another mystery.',
      },
    });
  },
});

export default {
  standardRateLimiter,
  caseGenerationRateLimiter,
};

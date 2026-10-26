import { ZodError } from 'zod';
import { ApiError } from '../utils/api-error.js';

/**
 * Centralized error handling middleware adhering to SPEC.md Section 11.
 * Ensures consistent JSON response structure and prevents credential leakage.
 */
export const errorHandler = (err, req, res, next) => {
  // If response headers are already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle known ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && process.env.NODE_ENV !== 'production' ? { details: err.details } : {}),
      },
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const primaryIssue = err.issues?.[0];
    const message = primaryIssue ? `${primaryIssue.path.join('.') || 'field'}: ${primaryIssue.message}` : 'Validation failed.';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: primaryIssue?.message || message,
      },
    });
  }

  // Handle malformed JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid JSON payload provided.',
      },
    });
  }

  // Handle Mongoose CastError (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        code: 'INVALID_CASE_ID',
        message: `Invalid identifier format for ${err.path || 'resource'}.`,
      },
    });
  }

  // Handle Mongoose Schema ValidationError
  if (err.name === 'ValidationError') {
    const firstKey = Object.keys(err.errors || {})[0];
    const message = firstKey ? err.errors[firstKey].message : 'Database validation failed.';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message,
      },
    });
  }

  // Fallback for unhandled 500 errors
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.statusCode || 500;
  const message = isProduction && statusCode === 500
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'Internal server error.';

  return res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message,
    },
  });
};

export default errorHandler;

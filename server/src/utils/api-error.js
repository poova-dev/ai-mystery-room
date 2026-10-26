/**
 * Custom application error class conforming to SPEC.md Section 11 error format.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code identifier from SPEC.md catalogue
   * @param {string} message - User-friendly error message
   * @param {any} [details] - Optional contextual details (e.g., validation issues)
   */
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(code, message, details = null) {
    return new ApiError(400, code || 'VALIDATION_ERROR', message, details);
  }

  static notFound(code, message = 'Resource not found') {
    return new ApiError(404, code || 'NOT_FOUND', message);
  }

  static conflict(code, message) {
    return new ApiError(409, code, message);
  }

  static tooManyRequests(code, message = 'Too many requests. Please try again later.') {
    return new ApiError(429, code || 'RATE_LIMITED', message);
  }

  static internal(message = 'An unexpected internal error occurred.') {
    return new ApiError(500, 'INTERNAL_SERVER_ERROR', message);
  }
}

export default ApiError;

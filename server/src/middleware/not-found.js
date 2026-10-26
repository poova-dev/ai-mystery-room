/**
 * 404 Not Found fallback handler returning SPEC.md compliant JSON error response.
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `The requested resource '${req.originalUrl}' was not found.`,
    },
  });
};

export default notFoundHandler;

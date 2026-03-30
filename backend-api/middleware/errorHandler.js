const ResponseHandler = require('../utils/responseHandler');

/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and provides consistent error responses
 */

const globalErrorHandler = (err, req, res, next) => {
  // Default error
  let error = { ...err };
  error.message = err.message;

  // Log the error
  console.error('Global Error Handler:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    return ResponseHandler.notFound(res, message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return ResponseHandler.error(res, 400, message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      path: val.path,
      message: val.message
    }));
    return ResponseHandler.validationError(res, errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    return ResponseHandler.unauthorized(res, message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    return ResponseHandler.unauthorized(res, message);
  }

  // Rate limiting error
  if (err.statusCode === 429) {
    const message = 'Too many requests. Please try again later.';
    return ResponseHandler.error(res, 429, message);
  }

  // Default to internal server error
  return ResponseHandler.error(res, 500, 'Internal Server Error', err);
};

/**
 * 404 Handler for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const message = `Route ${req.originalUrl} not found`;
  return ResponseHandler.notFound(res, message);
};

module.exports = {
  globalErrorHandler,
  notFoundHandler
};
const winston = require('winston');

// Configure logger for this module
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'response-handler' },
  transports: [
    new winston.transports.File({ filename: 'logs/response-handler.log' })
  ]
});

// If we're not in production, log to console too
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

/**
 * Standardized API Response Handler
 * Creates consistent response format across all API endpoints
 */

class ResponseHandler {
  /**
   * Success response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {Object} data - Response data
   * @param {string} message - Success message
   */
  static success(res, statusCode = 200, data = null, message = 'Success') {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    logger.info(`API Success: ${message}`, { 
      statusCode, 
      endpoint: res.req?.originalUrl,
      method: res.req?.method 
    });
    
    return res.status(statusCode).json(response);
  }

  /**
   * Error response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Object} error - Error details (optional)
   */
  static error(res, statusCode = 500, message = 'Internal Server Error', error = null) {
    const response = {
      success: false,
      message,
      error: error ? error.message || error : null,
      timestamp: new Date().toISOString()
    };
    
    // Log the error with appropriate level
    if (statusCode >= 500) {
      logger.error(`API Error: ${message}`, { 
        statusCode, 
        endpoint: res.req?.originalUrl,
        method: res.req?.method,
        error: error?.stack || error
      });
    } else {
      logger.warn(`API Warning: ${message}`, { 
        statusCode, 
        endpoint: res.req?.originalUrl,
        method: res.req?.method 
      });
    }
    
    return res.status(statusCode).json(response);
  }

  /**
   * Validation error response
   * @param {Object} res - Express response object
   * @param {Array} errors - Array of validation errors
   */
  static validationError(res, errors) {
    const response = {
      success: false,
      message: 'Validation failed',
      errors: errors.map(err => ({
        field: err.path || 'unknown',
        message: err.message
      })),
      timestamp: new Date().toISOString()
    };
    
    logger.warn('Validation Error', { 
      endpoint: res.req?.originalUrl,
      errors: errors.map(e => e.message)
    });
    
    return res.status(400).json(response);
  }

  /**
   * Not found response
   * @param {Object} res - Express response object
   * @param {string} resource - Resource name that was not found
   */
  static notFound(res, resource = 'Resource') {
    return this.error(res, 404, `${resource} not found`);
  }

  /**
   * Unauthorized response
   * @param {Object} res - Express response object
   * @param {string} message - Custom message
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, 401, message);
  }

  /**
   * Forbidden response
   * @param {Object} res - Express response object
   * @param {string} message - Custom message
   */
  static forbidden(res, message = 'Access forbidden') {
    return this.error(res, 403, message);
  }

  /**
   * Created response
   * @param {Object} res - Express response object
   * @param {Object} data - Created resource data
   * @param {string} message - Success message
   */
  static created(res, data = null, message = 'Resource created successfully') {
    return this.success(res, 201, data, message);
  }
}

module.exports = ResponseHandler;
/**
 * Centralized error handling middleware
 */

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error for debugging (but not in production response)
  console.error('Error:', {
    message: error.message,
    statusCode: error.statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // PostgreSQL/Database errors
  if (err.code === '23505') {
    error.message = 'Duplicate field value entered';
    error.statusCode = 400;
  }
  
  if (err.code === '23503') {
    error.message = 'Referenced record does not exist';
    error.statusCode = 400;
  }

  if (err.code === '22P02') {
    error.message = 'Invalid input syntax';
    error.statusCode = 400;
  }

  // Firebase errors
  if (err.code === 'auth/id-token-expired') {
    error.message = 'Token has expired. Please login again';
    error.statusCode = 401;
  }

  if (err.code === 'auth/argument-error') {
    error.message = 'Invalid authentication token';
    error.statusCode = 401;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(e => e.message).join(', ');
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token. Please login again';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired. Please login again';
    error.statusCode = 401;
  }

  // Prepare error response
  const errorResponse = {
    status: error.status || 'error',
    message: error.message || 'Internal server error'
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = err;
    errorResponse.stack = err.stack;
  }

  // Send error response
  res.status(error.statusCode).json(errorResponse);
};

// Handle 404 errors
const notFound = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

// Async error wrapper to catch errors in async functions
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
  asyncHandler
};


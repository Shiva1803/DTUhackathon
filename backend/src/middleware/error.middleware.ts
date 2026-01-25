import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { errorResponse } from '../utils/response';
import mongoose from 'mongoose';

/**
 * Custom application error class
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Handle Mongoose validation errors
 */
const handleMongooseValidationError = (
  error: mongoose.Error.ValidationError
): AppError => {
  const messages = Object.values(error.errors).map((err) => err.message);
  return new ValidationError(`Validation failed: ${messages.join(', ')}`);
};

/**
 * Handle Mongoose duplicate key errors
 */
const handleMongooseDuplicateKeyError = (error: { keyValue?: Record<string, unknown> }): AppError => {
  const field = Object.keys(error.keyValue || {})[0];
  return new ConflictError(
    `Duplicate value for field: ${field || 'unknown'}`
  );
};

/**
 * Handle Mongoose cast errors (invalid ObjectId, etc.)
 */
const handleMongooseCastError = (error: mongoose.Error.CastError): AppError => {
  return new ValidationError(`Invalid ${error.path}: ${error.value}`);
};

/**
 * Handle JWT errors from express-jwt
 */
const handleJwtError = (error: { code?: string; message?: string }): AppError => {
  switch (error.code) {
    case 'credentials_required':
      return new UnauthorizedError('No authorization token was found');
    case 'invalid_token':
      return new UnauthorizedError('Invalid token');
    case 'credentials_bad_format':
      return new UnauthorizedError('Authorization header format is: Bearer [token]');
    default:
      return new UnauthorizedError(error.message || 'Authentication failed');
  }
};

/**
 * 404 Not Found middleware
 * Handles requests to undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  res.status(404).json(
    errorResponse(`Route ${req.method} ${req.originalUrl} not found`, 404)
  );
};

/**
 * Global error handler middleware
 * Must be registered last in the middleware chain
 */
export const errorHandler = (
  error: Error & { statusCode?: number; code?: string; status?: number; keyValue?: Record<string, unknown> },
  req: Request,
  res: Response
): void => {
  let appError: AppError;

  // Handle known error types
  if (error instanceof AppError) {
    appError = error;
  } else if (error.name === 'ValidationError' && error instanceof mongoose.Error.ValidationError) {
    appError = handleMongooseValidationError(error);
  } else if (error.code === '11000' || error.code === 'E11000') {
    appError = handleMongooseDuplicateKeyError(error);
  } else if (error.name === 'CastError' && error instanceof mongoose.Error.CastError) {
    appError = handleMongooseCastError(error);
  } else if (error.name === 'UnauthorizedError') {
    appError = handleJwtError(error);
  } else if (error.name === 'JsonWebTokenError') {
    appError = new UnauthorizedError('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    appError = new UnauthorizedError('Token expired');
  } else {
    // Unknown error - log full details and return generic message
    logger.error('Unhandled error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
    });

    appError = new AppError(
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message,
      500
    );
  }

  // Log operational errors at warn level, others at error level
  if (appError.isOperational) {
    logger.warn(`${appError.statusCode} - ${appError.message}`, {
      url: req.originalUrl,
      method: req.method,
    });
  }

  // Send response - use a mutable object for optional fields
  const response: Record<string, unknown> = {
    ...errorResponse(appError.message, appError.statusCode),
  };
  
  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production' && error.stack) {
    response.stack = error.stack;
  }

  // Include error code if available
  if (appError.code) {
    response.code = appError.code;
  }

  res.status(appError.statusCode).json(response);
};

/**
 * Async handler wrapper
 * Catches errors in async route handlers and passes them to error middleware
 */
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  notFoundHandler,
  errorHandler,
  asyncHandler,
};

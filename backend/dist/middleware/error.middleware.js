"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.notFoundHandler = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.NotFoundError = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Custom application error class
 */
class AppError extends Error {
    statusCode;
    isOperational;
    code;
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Not Found Error (404)
 */
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Validation Error (400)
 */
class ValidationError extends AppError {
    constructor(message = 'Validation failed') {
        super(message, 400, 'VALIDATION_ERROR');
    }
}
exports.ValidationError = ValidationError;
/**
 * Unauthorized Error (401)
 */
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * Forbidden Error (403)
 */
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * Conflict Error (409)
 */
class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT');
    }
}
exports.ConflictError = ConflictError;
/**
 * Handle Mongoose validation errors
 */
const handleMongooseValidationError = (error) => {
    const messages = Object.values(error.errors).map((err) => err.message);
    return new ValidationError(`Validation failed: ${messages.join(', ')}`);
};
/**
 * Handle Mongoose duplicate key errors
 */
const handleMongooseDuplicateKeyError = (error) => {
    const field = Object.keys(error.keyValue || {})[0];
    return new ConflictError(`Duplicate value for field: ${field || 'unknown'}`);
};
/**
 * Handle Mongoose cast errors (invalid ObjectId, etc.)
 */
const handleMongooseCastError = (error) => {
    return new ValidationError(`Invalid ${error.path}: ${error.value}`);
};
/**
 * Handle JWT errors from express-jwt
 */
const handleJwtError = (error) => {
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
const notFoundHandler = (req, res, _next) => {
    res.status(404).json((0, response_1.errorResponse)(`Route ${req.method} ${req.originalUrl} not found`, 404));
};
exports.notFoundHandler = notFoundHandler;
/**
 * Global error handler middleware
 * Must be registered last in the middleware chain
 */
const errorHandler = (error, req, res, _next) => {
    let appError;
    // Handle known error types
    if (error instanceof AppError) {
        appError = error;
    }
    else if (error.name === 'ValidationError' && error instanceof mongoose_1.default.Error.ValidationError) {
        appError = handleMongooseValidationError(error);
    }
    else if (error.code === '11000' || error.code === 'E11000') {
        appError = handleMongooseDuplicateKeyError(error);
    }
    else if (error.name === 'CastError' && error instanceof mongoose_1.default.Error.CastError) {
        appError = handleMongooseCastError(error);
    }
    else if (error.name === 'UnauthorizedError') {
        appError = handleJwtError(error);
    }
    else if (error.name === 'JsonWebTokenError') {
        appError = new UnauthorizedError('Invalid token');
    }
    else if (error.name === 'TokenExpiredError') {
        appError = new UnauthorizedError('Token expired');
    }
    else {
        // Unknown error - log full details and return generic message
        logger_1.logger.error('Unhandled error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            url: req.originalUrl,
            method: req.method,
        });
        appError = new AppError(process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : error.message, 500);
    }
    // Log operational errors at warn level, others at error level
    if (appError.isOperational) {
        logger_1.logger.warn(`${appError.statusCode} - ${appError.message}`, {
            url: req.originalUrl,
            method: req.method,
        });
    }
    // Send response - use a mutable object for optional fields
    const response = {
        ...(0, response_1.errorResponse)(appError.message, appError.statusCode),
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
exports.errorHandler = errorHandler;
/**
 * Async handler wrapper
 * Catches errors in async route handlers and passes them to error middleware
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
exports.default = {
    AppError,
    NotFoundError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    notFoundHandler: exports.notFoundHandler,
    errorHandler: exports.errorHandler,
    asyncHandler: exports.asyncHandler,
};
//# sourceMappingURL=error.middleware.js.map
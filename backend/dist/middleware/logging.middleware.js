"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = exports.requestLogger = void 0;
const logger_1 = require("../utils/logger");
/**
 * Request logging middleware using Winston
 * Logs all incoming requests with method, URL, status, and response time
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Attach request ID to request for tracking
    req.requestId = requestId;
    // Log incoming request
    logger_1.logger.info(`[${requestId}] ${req.method} ${req.originalUrl}`, {
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent'),
        contentLength: req.get('Content-Length'),
    });
    // Capture response finish
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const level = res.statusCode >= 400 ? 'warn' : 'info';
        logger_1.logger[level](`[${requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration,
            contentLength: res.get('Content-Length'),
        });
    });
    // Capture response errors
    res.on('error', (error) => {
        logger_1.logger.error(`[${requestId}] Response error:`, {
            requestId,
            error: error.message,
        });
    });
    next();
};
exports.requestLogger = requestLogger;
/**
 * Error request logger - logs detailed error information
 */
const errorLogger = (err, req, _res, next) => {
    const requestId = req.requestId || 'unknown';
    logger_1.logger.error(`[${requestId}] Error in ${req.method} ${req.originalUrl}:`, {
        requestId,
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        body: req.body,
    });
    next(err);
};
exports.errorLogger = errorLogger;
exports.default = { requestLogger: exports.requestLogger, errorLogger: exports.errorLogger };
//# sourceMappingURL=logging.middleware.js.map
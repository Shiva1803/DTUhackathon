import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request logging middleware using Winston
 * Logs all incoming requests with method, URL, status, and response time
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Attach request ID to request for tracking
    (req as Request & { requestId: string }).requestId = requestId;

    // Log incoming request
    logger.info(`[${requestId}] ${req.method} ${req.originalUrl}`, {
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

        logger[level](`[${requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
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
        logger.error(`[${requestId}] Response error:`, {
            requestId,
            error: error.message,
        });
    });

    next();
};

/**
 * Error request logger - logs detailed error information
 */
export const errorLogger = (
    err: Error,
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const requestId = (req as Request & { requestId?: string }).requestId || 'unknown';

    logger.error(`[${requestId}] Error in ${req.method} ${req.originalUrl}:`, {
        requestId,
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        body: req.body,
    });

    next(err);
};

export default { requestLogger, errorLogger };

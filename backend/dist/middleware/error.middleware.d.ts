import { Request, Response, NextFunction } from 'express';
/**
 * Custom application error class
 */
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    code?: string;
    constructor(message: string, statusCode: number, code?: string);
}
/**
 * Not Found Error (404)
 */
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
/**
 * Validation Error (400)
 */
export declare class ValidationError extends AppError {
    constructor(message?: string);
}
/**
 * Unauthorized Error (401)
 */
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
/**
 * Forbidden Error (403)
 */
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
/**
 * Conflict Error (409)
 */
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
/**
 * 404 Not Found middleware
 * Handles requests to undefined routes
 */
export declare const notFoundHandler: (req: Request, res: Response, _next: NextFunction) => void;
/**
 * Global error handler middleware
 * Must be registered last in the middleware chain
 */
export declare const errorHandler: (error: Error & {
    statusCode?: number;
    code?: string;
    status?: number;
    keyValue?: Record<string, unknown>;
}, req: Request, res: Response, _next: NextFunction) => void;
/**
 * Async handler wrapper
 * Catches errors in async route handlers and passes them to error middleware
 */
export declare const asyncHandler: <T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) => (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    AppError: typeof AppError;
    NotFoundError: typeof NotFoundError;
    ValidationError: typeof ValidationError;
    UnauthorizedError: typeof UnauthorizedError;
    ForbiddenError: typeof ForbiddenError;
    ConflictError: typeof ConflictError;
    notFoundHandler: (req: Request, res: Response, _next: NextFunction) => void;
    errorHandler: (error: Error & {
        statusCode?: number;
        code?: string;
        status?: number;
        keyValue?: Record<string, unknown>;
    }, req: Request, res: Response, _next: NextFunction) => void;
    asyncHandler: <T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) => (req: Request, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=error.middleware.d.ts.map
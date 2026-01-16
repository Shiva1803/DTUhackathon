import { Request, Response, NextFunction } from 'express';
/**
 * Request logging middleware using Winston
 * Logs all incoming requests with method, URL, status, and response time
 */
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Error request logger - logs detailed error information
 */
export declare const errorLogger: (err: Error, req: Request, _res: Response, next: NextFunction) => void;
declare const _default: {
    requestLogger: (req: Request, res: Response, next: NextFunction) => void;
    errorLogger: (err: Error, req: Request, _res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=logging.middleware.d.ts.map
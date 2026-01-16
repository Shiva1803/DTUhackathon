import winston from 'winston';
/**
 * Create the logger instance
 */
export declare const logger: winston.Logger;
/**
 * HTTP request logging middleware
 */
export declare const httpLogger: (req: {
    method: string;
    url: string;
}, res: {
    statusCode: number;
}, responseTime: number) => void;
/**
 * Create a child logger with additional context
 */
export declare const createChildLogger: (context: Record<string, unknown>) => winston.Logger;
export default logger;
//# sourceMappingURL=logger.d.ts.map
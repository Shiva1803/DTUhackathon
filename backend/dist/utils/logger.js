"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChildLogger = exports.httpLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
/**
 * Log levels in order of priority
 */
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
/**
 * Colors for each log level
 */
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};
// Add colors to winston
winston_1.default.addColors(colors);
/**
 * Determine log level based on environment
 */
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    return env === 'development' ? 'debug' : 'info';
};
/**
 * Custom log format
 */
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    // Add stack trace for errors
    if (stack) {
        log += `\n${stack}`;
    }
    // Add additional metadata if present
    if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
    }
    return log;
}));
/**
 * Console transport with colors (for development)
 */
const consoleTransport = new winston_1.default.transports.Console({
    format: winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), logFormat),
});
/**
 * File transports for production
 */
const fileTransports = [
    // Error logs
    new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
    // Combined logs
    new winston_1.default.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
];
/**
 * Create the logger instance
 */
exports.logger = winston_1.default.createLogger({
    level: level(),
    levels,
    transports: [
        consoleTransport,
        ...(process.env.NODE_ENV === 'production' ? fileTransports : []),
    ],
    // Don't exit on handled exceptions
    exitOnError: false,
});
/**
 * HTTP request logging middleware
 */
const httpLogger = (req, res, responseTime) => {
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
    exports.logger.log(logLevel, `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`);
};
exports.httpLogger = httpLogger;
/**
 * Create a child logger with additional context
 */
const createChildLogger = (context) => {
    return exports.logger.child(context);
};
exports.createChildLogger = createChildLogger;
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map
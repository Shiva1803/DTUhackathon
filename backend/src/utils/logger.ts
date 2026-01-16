import winston from 'winston';

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
winston.addColors(colors);

/**
 * Determine log level based on environment
 */
const level = (): string => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
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
  })
);

/**
 * Console transport with colors (for development)
 */
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    logFormat
  ),
});

/**
 * File transports for production
 */
const fileTransports = [
  // Error logs
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // Combined logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

/**
 * Create the logger instance
 */
export const logger = winston.createLogger({
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
export const httpLogger = (
  req: { method: string; url: string },
  res: { statusCode: number },
  responseTime: number
): void => {
  const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
  logger.log(logLevel, `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`);
};

/**
 * Create a child logger with additional context
 */
export const createChildLogger = (context: Record<string, unknown>): winston.Logger => {
  return logger.child(context);
};

export default logger;

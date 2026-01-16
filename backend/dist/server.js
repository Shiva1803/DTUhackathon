"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables before other imports
dotenv_1.default.config();
const app_1 = require("./app");
const database_1 = require("./config/database");
const auth0_1 = require("./config/auth0");
const logger_1 = require("./utils/logger");
/**
 * Server configuration
 */
const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`${signal} received. Starting graceful shutdown...`);
    try {
        // Close database connection
        await (0, database_1.disconnectDatabase)();
        logger_1.logger.info('Graceful shutdown completed');
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
};
/**
 * Start the server
 */
const startServer = async () => {
    try {
        // Validate configuration
        logger_1.logger.info('Validating configuration...');
        // Validate Auth0 config (skip in development if not configured)
        if (NODE_ENV === 'production' || process.env.AUTH0_DOMAIN) {
            try {
                (0, auth0_1.validateAuth0Config)();
                logger_1.logger.info('✅ Auth0 configuration validated');
            }
            catch (error) {
                if (NODE_ENV === 'production') {
                    throw error;
                }
                logger_1.logger.warn('⚠️  Auth0 not configured - authentication will not work');
            }
        }
        else {
            logger_1.logger.warn('⚠️  Auth0 not configured - authentication will not work');
        }
        // Connect to MongoDB
        logger_1.logger.info('Connecting to MongoDB...');
        await (0, database_1.connectDatabase)();
        // Start HTTP server
        const server = app_1.app.listen(PORT, () => {
            logger_1.logger.info(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🚀 Server started successfully!                         ║
  ║                                                           ║
  ║   Environment: ${NODE_ENV.padEnd(40)}║
  ║   Port: ${PORT.toString().padEnd(47)}║
  ║   URL: http://localhost:${PORT.toString().padEnd(35)}║
  ║                                                           ║
  ║   Endpoints:                                              ║
  ║   - Health:  GET  /health                                 ║
  ║   - Auth:    GET  /auth/me                                ║
  ║   - Logs:    POST /api/log                                ║
  ║   - Summary: GET  /api/summary/:weekId                    ║
  ║   - Chat:    POST /api/chat                               ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
      `);
        });
        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger_1.logger.error(`Port ${PORT} is already in use`);
                process.exit(1);
            }
            throw error;
        });
        // Graceful shutdown handlers
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        // Unhandled rejection handler
        process.on('unhandledRejection', (reason) => {
            logger_1.logger.error('Unhandled Rejection:', reason);
            // In production, you might want to exit
            if (NODE_ENV === 'production') {
                gracefulShutdown('UNHANDLED_REJECTION');
            }
        });
        // Uncaught exception handler
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught Exception:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Start the server
startServer();
//# sourceMappingURL=server.js.map
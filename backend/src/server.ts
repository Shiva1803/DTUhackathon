import dotenv from 'dotenv';

// Load environment variables before other imports
dotenv.config();

import { app } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { validateAuth0Config } from './config/auth0';
import { logger } from './utils/logger';

/**
 * Server configuration
 */
const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  try {
    // Close database connection
    await disconnectDatabase();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    // Validate configuration
    logger.info('Validating configuration...');
    
    // Validate Auth0 config (skip in development if not configured)
    if (NODE_ENV === 'production' || process.env.AUTH0_DOMAIN) {
      try {
        validateAuth0Config();
        logger.info('✅ Auth0 configuration validated');
      } catch (error) {
        if (NODE_ENV === 'production') {
          throw error;
        }
        logger.warn('⚠️  Auth0 not configured - authentication will not work');
      }
    } else {
      logger.warn('⚠️  Auth0 not configured - authentication will not work');
    }

    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await connectDatabase();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`
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
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
        process.exit(1);
      }
      throw error;
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason: Error) => {
      logger.error('Unhandled Rejection:', reason);
      // In production, you might want to exit
      if (NODE_ENV === 'production') {
        gracefulShutdown('UNHANDLED_REJECTION');
      }
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

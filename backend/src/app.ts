import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { checkDatabaseHealth } from './config/database';
import { authRoutes, logRoutes, summaryRoutes, chatRoutes } from './routes';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import { successResponse, errorResponse } from './utils/response';

/**
 * Create and configure the Express application
 */
export const createApp = (): Application => {
  const app = express();

  // ===========================================
  // Security Middleware
  // ===========================================
  
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
    credentials: true,
    maxAge: 86400, // 24 hours
  }));

  // ===========================================
  // Performance Middleware
  // ===========================================
  
  // Compression
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
  }));

  // ===========================================
  // Body Parsing Middleware
  // ===========================================
  
  // JSON body parser
  app.use(express.json({ limit: '10mb' }));
  
  // URL-encoded body parser
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ===========================================
  // Request Logging
  // ===========================================
  
  app.use((req: Request, res: Response, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
      
      logger.log(logLevel, `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    });
    
    next();
  });

  // ===========================================
  // Health Check Endpoint
  // ===========================================
  
  /**
   * @route   GET /health
   * @desc    Health check endpoint that verifies database connectivity
   * @access  Public
   */
  app.get('/health', async (_req: Request, res: Response) => {
    try {
      const dbHealthy = await checkDatabaseHealth();
      
      const healthStatus = {
        status: dbHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: {
            status: dbHealthy ? 'connected' : 'disconnected',
          },
        },
        version: process.env.npm_package_version || '1.0.0',
      };

      if (dbHealthy) {
        res.status(200).json(successResponse(healthStatus, 'Service is healthy'));
      } else {
        res.status(503).json(errorResponse('Database connection unhealthy', 503, 'SERVICE_UNAVAILABLE', healthStatus));
      }
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json(
        errorResponse('Health check failed', 503, 'SERVICE_UNAVAILABLE')
      );
    }
  });

  // ===========================================
  // API Routes
  // ===========================================
  
  // Auth routes
  app.use('/api/auth', authRoutes);
  
  // API routes
  app.use('/api/log', logRoutes);
  app.use('/api/summary', summaryRoutes);
  app.use('/api/chat', chatRoutes);

  // ===========================================
  // Root endpoint
  // ===========================================
  
  app.get('/', (_req: Request, res: Response) => {
    res.json(successResponse({
      name: 'Backend API',
      version: '1.0.0',
      documentation: '/api-docs', // If you add Swagger later
      health: '/health',
    }, 'Welcome to the API'));
  });

  // ===========================================
  // Error Handling
  // ===========================================
  
  // 404 handler for undefined routes
  app.use(notFoundHandler);
  
  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};

// Export the app
export const app = createApp();

export default app;

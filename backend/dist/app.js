"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const database_1 = require("./config/database");
const routes_1 = require("./routes");
const error_middleware_1 = require("./middleware/error.middleware");
const logger_1 = require("./utils/logger");
const response_1 = require("./utils/response");
/**
 * Create and configure the Express application
 */
const createApp = () => {
    const app = (0, express_1.default)();
    // ===========================================
    // Security Middleware
    // ===========================================
    // Helmet for security headers
    app.use((0, helmet_1.default)({
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
    app.use((0, cors_1.default)({
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
    app.use((0, compression_1.default)({
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return compression_1.default.filter(req, res);
        },
        level: 6,
    }));
    // ===========================================
    // Body Parsing Middleware
    // ===========================================
    // JSON body parser
    app.use(express_1.default.json({ limit: '10mb' }));
    // URL-encoded body parser
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // ===========================================
    // Request Logging
    // ===========================================
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
            logger_1.logger.log(logLevel, `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
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
     * Required environment variables for production
     */
    const REQUIRED_ENV_KEYS = [
        'MONGO_URI',
        'AUTH0_DOMAIN',
        'AUTH0_AUDIENCE',
    ];
    /**
     * Optional but recommended environment variables
     */
    const OPTIONAL_ENV_KEYS = [
        'CLOUDINARY_URL',
        'OND_CHAT_KEY',
        'OND_MEDIA_KEY',
        'GEMINI_KEY',
        'ELEVEN_KEY',
    ];
    /**
     * @route   GET /health
     * @desc    Health check endpoint that verifies:
     *          - MongoDB connection
     *          - Required environment keys present
     * @access  Public
     * @returns { status: 'ok' | 'degraded' | 'error', uptime, ... }
     */
    app.get('/health', async (_req, res) => {
        try {
            // Check database connection
            const dbHealthy = await (0, database_1.checkDatabaseHealth)();
            // Check required environment keys
            const missingRequired = REQUIRED_ENV_KEYS.filter(key => !process.env[key]);
            const missingOptional = OPTIONAL_ENV_KEYS.filter(key => !process.env[key]);
            const keysHealthy = missingRequired.length === 0;
            // Determine overall status
            const isHealthy = dbHealthy && keysHealthy;
            const status = isHealthy ? 'ok' : (dbHealthy ? 'degraded' : 'error');
            const healthResponse = {
                status,
                uptime: Math.floor(process.uptime()),
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                version: process.env.npm_package_version || '1.0.0',
                services: {
                    database: dbHealthy ? 'connected' : 'disconnected',
                    auth: process.env.AUTH0_DOMAIN ? 'configured' : 'missing',
                    storage: process.env.CLOUDINARY_URL ? 'configured' : 'missing',
                    chat: process.env.OND_CHAT_KEY ? 'configured' : 'missing',
                    media: process.env.OND_MEDIA_KEY ? 'configured' : 'missing',
                },
                ...(missingRequired.length > 0 && { missingRequired }),
                ...(missingOptional.length > 0 && process.env.NODE_ENV === 'development' && { missingOptional }),
            };
            if (isHealthy) {
                res.status(200).json(healthResponse);
            }
            else if (dbHealthy) {
                // DB healthy but missing some config
                res.status(200).json(healthResponse);
            }
            else {
                res.status(503).json(healthResponse);
            }
        }
        catch (error) {
            logger_1.logger.error('Health check failed:', error);
            res.status(503).json({
                status: 'error',
                uptime: Math.floor(process.uptime()),
                error: 'Health check failed',
            });
        }
    });
    // ===========================================
    // API Routes
    // ===========================================
    // Auth routes
    app.use('/api/auth', routes_1.authRoutes);
    // API routes
    app.use('/api/log', routes_1.logRoutes);
    app.use('/api/summary', routes_1.summaryRoutes);
    app.use('/api/chat', routes_1.chatRoutes);
    // ===========================================
    // Root endpoint
    // ===========================================
    app.get('/', (_req, res) => {
        res.json((0, response_1.successResponse)({
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
    app.use(error_middleware_1.notFoundHandler);
    // Global error handler (must be last)
    app.use(error_middleware_1.errorHandler);
    return app;
};
exports.createApp = createApp;
// Export the app
exports.app = (0, exports.createApp)();
exports.default = exports.app;
//# sourceMappingURL=app.js.map
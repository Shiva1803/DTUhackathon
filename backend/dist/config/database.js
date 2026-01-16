"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.checkDatabaseHealth = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
/**
 * MongoDB connection configuration and management
 */
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/app_database';
/**
 * Connect to MongoDB with retry logic
 */
const connectDatabase = async () => {
    try {
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };
        await mongoose_1.default.connect(MONGO_URI, options);
        logger_1.logger.info('✅ MongoDB connected successfully');
    }
    catch (error) {
        logger_1.logger.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
/**
 * Check database connection health
 * @returns Promise<boolean> - true if connected, false otherwise
 */
const checkDatabaseHealth = async () => {
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
            return false;
        }
        // Ping the database to ensure it's responsive
        await mongoose_1.default.connection.db?.admin().ping();
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database health check failed:', error);
        return false;
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
/**
 * Gracefully disconnect from MongoDB
 */
const disconnectDatabase = async () => {
    try {
        await mongoose_1.default.connection.close();
        logger_1.logger.info('MongoDB disconnected gracefully');
    }
    catch (error) {
        logger_1.logger.error('Error during MongoDB disconnection:', error);
        throw error;
    }
};
exports.disconnectDatabase = disconnectDatabase;
// Connection event handlers
mongoose_1.default.connection.on('connected', () => {
    logger_1.logger.info('Mongoose connected to MongoDB');
});
mongoose_1.default.connection.on('error', (err) => {
    logger_1.logger.error('Mongoose connection error:', err);
});
mongoose_1.default.connection.on('disconnected', () => {
    logger_1.logger.warn('Mongoose disconnected from MongoDB');
});
// Graceful shutdown handlers
process.on('SIGINT', async () => {
    await (0, exports.disconnectDatabase)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await (0, exports.disconnectDatabase)();
    process.exit(0);
});
exports.default = {
    connectDatabase: exports.connectDatabase,
    checkDatabaseHealth: exports.checkDatabaseHealth,
    disconnectDatabase: exports.disconnectDatabase,
};
//# sourceMappingURL=database.js.map
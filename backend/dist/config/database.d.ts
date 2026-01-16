/**
 * Connect to MongoDB with retry logic
 */
export declare const connectDatabase: () => Promise<void>;
/**
 * Check database connection health
 * @returns Promise<boolean> - true if connected, false otherwise
 */
export declare const checkDatabaseHealth: () => Promise<boolean>;
/**
 * Gracefully disconnect from MongoDB
 */
export declare const disconnectDatabase: () => Promise<void>;
declare const _default: {
    connectDatabase: () => Promise<void>;
    checkDatabaseHealth: () => Promise<boolean>;
    disconnectDatabase: () => Promise<void>;
};
export default _default;
//# sourceMappingURL=database.d.ts.map
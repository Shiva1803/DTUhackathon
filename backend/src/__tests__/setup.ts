/**
 * Jest Test Setup
 * Global configuration and mocks for testing
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.MONGO_URI = 'mongodb://localhost:27017/test_db';
process.env.AUTH0_DOMAIN = 'test.auth0.com';
process.env.AUTH0_AUDIENCE = 'https://test-api';

// Global test timeout
jest.setTimeout(30000);

// Mock console to reduce noise during tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Cleanup after all tests
afterAll(async () => {
    // Close any open connections
    jest.clearAllMocks();
});

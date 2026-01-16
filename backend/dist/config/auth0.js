"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkJwt = exports.jwtOptions = exports.jwksClient = exports.validateAuth0Config = exports.auth0Config = void 0;
const express_jwt_1 = require("express-jwt");
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
/**
 * Auth0 Configuration
 *
 * This module provides Auth0 configuration for JWT validation.
 * Ensure the following environment variables are set:
 * - AUTH0_DOMAIN: Your Auth0 tenant domain (e.g., your-tenant.auth0.com)
 * - AUTH0_AUDIENCE: The API identifier configured in Auth0
 */
// Auth0 configuration from environment
exports.auth0Config = {
    domain: process.env.AUTH0_DOMAIN || '',
    audience: process.env.AUTH0_AUDIENCE || '',
    clientId: process.env.AUTH0_CLIENT_ID || '',
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
};
/**
 * Validate that required Auth0 configuration is present
 */
const validateAuth0Config = () => {
    const { domain, audience } = exports.auth0Config;
    if (!domain) {
        throw new Error('AUTH0_DOMAIN environment variable is required');
    }
    if (!audience) {
        throw new Error('AUTH0_AUDIENCE environment variable is required');
    }
};
exports.validateAuth0Config = validateAuth0Config;
/**
 * JWKS client for fetching public keys from Auth0
 * Implements caching and rate limiting for optimal performance
 */
exports.jwksClient = jwks_rsa_1.default.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: exports.auth0Config.jwksUri,
});
/**
 * JWT verification options for express-jwt
 */
exports.jwtOptions = {
    secret: exports.jwksClient,
    audience: exports.auth0Config.audience,
    issuer: exports.auth0Config.issuer,
    algorithms: ['RS256'],
};
/**
 * Express-jwt middleware configured for Auth0
 * This validates the JWT token and attaches the decoded payload to req.auth
 */
exports.checkJwt = (0, express_jwt_1.expressjwt)(exports.jwtOptions);
exports.default = {
    auth0Config: exports.auth0Config,
    validateAuth0Config: exports.validateAuth0Config,
    jwksClient: exports.jwksClient,
    jwtOptions: exports.jwtOptions,
    checkJwt: exports.checkJwt,
};
//# sourceMappingURL=auth0.js.map
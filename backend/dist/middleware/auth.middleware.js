"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermissions = exports.optionalAuth = exports.authenticate = exports.attachUser = exports.validateJwt = void 0;
const express_jwt_1 = require("express-jwt");
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
/**
 * Auth0 configuration from environment
 */
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || '';
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || '';
/**
 * JWKS client for fetching Auth0 public keys
 */
const jwksClient = jwks_rsa_1.default.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
});
/**
 * JWT validation middleware
 * Validates the JWT token from the Authorization header
 */
exports.validateJwt = (0, express_jwt_1.expressjwt)({
    secret: jwksClient,
    audience: AUTH0_AUDIENCE,
    issuer: `https://${AUTH0_DOMAIN}/`,
    algorithms: ['RS256'],
});
/**
 * Attach user middleware
 * Looks up the user in the database and attaches to req.user
 * Creates a new user if they don't exist (first login)
 */
const attachUser = async (req, res, next) => {
    try {
        if (!req.auth?.sub) {
            res.status(401).json((0, response_1.errorResponse)('Unauthorized: No user identity found', 401));
            return;
        }
        const auth0Id = req.auth.sub;
        // Extract email and name from token
        // Auth0 includes these in standard OIDC claims when 'openid profile email' scopes are requested
        const email = req.auth['email'] ||
            req.auth['https://your-namespace/email'] ||
            // Fallback: create a valid placeholder email from auth0Id
            // Replace invalid characters (|, :, etc.) with safe ones
            `${auth0Id.replace(/[|:]/g, '_')}@auth0.placeholder.local`;
        const name = req.auth['name'] ||
            req.auth['https://your-namespace/name'] ||
            req.auth['nickname'] ||
            undefined;
        // Find or create user
        let user = await User_1.User.findOne({ auth0Id });
        if (!user) {
            // Create new user on first login
            user = await User_1.User.create({
                auth0Id,
                email,
                name,
                createdAt: new Date(),
                lastLogin: new Date(),
            });
            logger_1.logger.info(`New user created: ${auth0Id}`);
        }
        else {
            // Update last login and sync name/email if changed
            user.lastLogin = new Date();
            if (name && user.name !== name) {
                user.name = name;
            }
            await user.save();
        }
        // Attach user to request
        req.user = {
            id: user._id.toString(),
            auth0Id: user.auth0Id,
            email: user.email,
            name: user.name,
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Error attaching user:', error);
        next(error);
    }
};
exports.attachUser = attachUser;
/**
 * Combined authentication middleware
 * Validates JWT and attaches user in one step
 */
exports.authenticate = [exports.validateJwt, exports.attachUser];
/**
 * Optional authentication middleware
 * Does not fail if no token is provided, but validates if present
 */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, continue without authentication
        next();
        return;
    }
    // Token provided, validate it
    try {
        // Use the standard validation chain
        (0, exports.validateJwt)(req, res, async (err) => {
            if (err) {
                // Token is invalid, but this is optional auth, so continue
                logger_1.logger.warn('Optional auth: Invalid token provided');
                next();
                return;
            }
            // Token valid, attach user
            await (0, exports.attachUser)(req, res, next);
        });
    }
    catch (error) {
        // Continue without authentication on error
        next();
    }
};
exports.optionalAuth = optionalAuth;
/**
 * Require specific permissions (for RBAC)
 */
const requirePermissions = (...requiredPermissions) => {
    return (req, res, next) => {
        const userPermissions = req.auth?.permissions || [];
        const hasAllPermissions = requiredPermissions.every((permission) => userPermissions.includes(permission));
        if (!hasAllPermissions) {
            res.status(403).json((0, response_1.errorResponse)('Forbidden: Insufficient permissions', 403));
            return;
        }
        next();
    };
};
exports.requirePermissions = requirePermissions;
exports.default = {
    validateJwt: exports.validateJwt,
    attachUser: exports.attachUser,
    authenticate: exports.authenticate,
    optionalAuth: exports.optionalAuth,
    requirePermissions: exports.requirePermissions,
};
//# sourceMappingURL=auth.middleware.js.map
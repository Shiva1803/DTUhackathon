import { GetVerificationKey } from 'express-jwt';
/**
 * Auth0 Configuration
 *
 * This module provides Auth0 configuration for JWT validation.
 * Ensure the following environment variables are set:
 * - AUTH0_DOMAIN: Your Auth0 tenant domain (e.g., your-tenant.auth0.com)
 * - AUTH0_AUDIENCE: The API identifier configured in Auth0
 */
export declare const auth0Config: {
    domain: string;
    audience: string;
    clientId: string;
    issuer: string;
    jwksUri: string;
};
/**
 * Validate that required Auth0 configuration is present
 */
export declare const validateAuth0Config: () => void;
/**
 * JWKS client for fetching public keys from Auth0
 * Implements caching and rate limiting for optimal performance
 */
export declare const jwksClient: GetVerificationKey;
/**
 * JWT verification options for express-jwt
 */
export declare const jwtOptions: {
    secret: GetVerificationKey;
    audience: string;
    issuer: string;
    algorithms: ("RS256")[];
};
/**
 * Express-jwt middleware configured for Auth0
 * This validates the JWT token and attaches the decoded payload to req.auth
 */
export declare const checkJwt: {
    (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction): Promise<void>;
    unless: typeof import("express-unless").unless;
};
declare const _default: {
    auth0Config: {
        domain: string;
        audience: string;
        clientId: string;
        issuer: string;
        jwksUri: string;
    };
    validateAuth0Config: () => void;
    jwksClient: GetVerificationKey;
    jwtOptions: {
        secret: GetVerificationKey;
        audience: string;
        issuer: string;
        algorithms: ("RS256")[];
    };
    checkJwt: {
        (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction): Promise<void>;
        unless: typeof import("express-unless").unless;
    };
};
export default _default;
//# sourceMappingURL=auth0.d.ts.map
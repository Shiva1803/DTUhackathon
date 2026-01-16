import { expressjwt, GetVerificationKey } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

/**
 * Auth0 Configuration
 * 
 * This module provides Auth0 configuration for JWT validation.
 * Ensure the following environment variables are set:
 * - AUTH0_DOMAIN: Your Auth0 tenant domain (e.g., your-tenant.auth0.com)
 * - AUTH0_AUDIENCE: The API identifier configured in Auth0
 */

// Auth0 configuration from environment
export const auth0Config = {
  domain: process.env.AUTH0_DOMAIN || '',
  audience: process.env.AUTH0_AUDIENCE || '',
  clientId: process.env.AUTH0_CLIENT_ID || '',
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
};

/**
 * Validate that required Auth0 configuration is present
 */
export const validateAuth0Config = (): void => {
  const { domain, audience } = auth0Config;
  
  if (!domain) {
    throw new Error('AUTH0_DOMAIN environment variable is required');
  }
  
  if (!audience) {
    throw new Error('AUTH0_AUDIENCE environment variable is required');
  }
};

/**
 * JWKS client for fetching public keys from Auth0
 * Implements caching and rate limiting for optimal performance
 */
export const jwksClient = jwksRsa.expressJwtSecret({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: auth0Config.jwksUri,
}) as GetVerificationKey;

/**
 * JWT verification options for express-jwt
 */
export const jwtOptions = {
  secret: jwksClient,
  audience: auth0Config.audience,
  issuer: auth0Config.issuer,
  algorithms: ['RS256'] as ('RS256')[],
};

/**
 * Express-jwt middleware configured for Auth0
 * This validates the JWT token and attaches the decoded payload to req.auth
 */
export const checkJwt = expressjwt(jwtOptions);

export default {
  auth0Config,
  validateAuth0Config,
  jwksClient,
  jwtOptions,
  checkJwt,
};

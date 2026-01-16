import { Response, NextFunction } from 'express';
import { expressjwt, GetVerificationKey } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import { AuthenticatedRequest } from '../types/express';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { errorResponse } from '../utils/response';

/**
 * Auth0 configuration from environment
 */
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || '';
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || '';

/**
 * JWKS client for fetching Auth0 public keys
 */
const jwksClient = jwksRsa.expressJwtSecret({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
}) as GetVerificationKey;

/**
 * JWT validation middleware
 * Validates the JWT token from the Authorization header
 */
export const validateJwt = expressjwt({
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
export const attachUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.auth?.sub) {
      res.status(401).json(errorResponse('Unauthorized: No user identity found', 401));
      return;
    }

    const auth0Id = req.auth.sub;
    
    // Find or create user
    let user = await User.findOne({ auth0Id });
    
    if (!user) {
      // Create new user on first login
      // Extract email from token if available, otherwise use placeholder
      const email = (req.auth['email'] as string) || 
                    (req.auth['https://your-namespace/email'] as string) || 
                    `${auth0Id}@placeholder.com`;
      
      user = await User.create({
        auth0Id,
        email,
        createdAt: new Date(),
        lastLogin: new Date(),
      });
      
      logger.info(`New user created: ${auth0Id}`);
    } else {
      // Update last login
      user.lastLogin = new Date();
      await user.save();
    }

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      auth0Id: user.auth0Id,
      email: user.email,
    };

    next();
  } catch (error) {
    logger.error('Error attaching user:', error);
    next(error);
  }
};

/**
 * Combined authentication middleware
 * Validates JWT and attaches user in one step
 */
export const authenticate = [validateJwt, attachUser];

/**
 * Optional authentication middleware
 * Does not fail if no token is provided, but validates if present
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without authentication
    next();
    return;
  }

  // Token provided, validate it
  try {
    // Use the standard validation chain
    validateJwt(req, res, async (err) => {
      if (err) {
        // Token is invalid, but this is optional auth, so continue
        logger.warn('Optional auth: Invalid token provided');
        next();
        return;
      }
      
      // Token valid, attach user
      await attachUser(req, res, next);
    });
  } catch (error) {
    // Continue without authentication on error
    next();
  }
};

/**
 * Require specific permissions (for RBAC)
 */
export const requirePermissions = (...requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userPermissions = req.auth?.permissions || [];
    
    const hasAllPermissions = requiredPermissions.every(
      (permission) => userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      res.status(403).json(
        errorResponse('Forbidden: Insufficient permissions', 403)
      );
      return;
    }

    next();
  };
};

export default {
  validateJwt,
  attachUser,
  authenticate,
  optionalAuth,
  requirePermissions,
};

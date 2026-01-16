import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';
/**
 * JWT validation middleware
 * Validates the JWT token from the Authorization header
 */
export declare const validateJwt: {
    (req: import("express").Request, res: Response, next: NextFunction): Promise<void>;
    unless: typeof import("express-unless").unless;
};
/**
 * Attach user middleware
 * Looks up the user in the database and attaches to req.user
 * Creates a new user if they don't exist (first login)
 */
export declare const attachUser: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Combined authentication middleware
 * Validates JWT and attaches user in one step
 */
export declare const authenticate: ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>)[];
/**
 * Optional authentication middleware
 * Does not fail if no token is provided, but validates if present
 */
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Require specific permissions (for RBAC)
 */
export declare const requirePermissions: (...requiredPermissions: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
declare const _default: {
    validateJwt: {
        (req: import("express").Request, res: Response, next: NextFunction): Promise<void>;
        unless: typeof import("express-unless").unless;
    };
    attachUser: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    authenticate: ((req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>)[];
    optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    requirePermissions: (...requiredPermissions: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=auth.middleware.d.ts.map
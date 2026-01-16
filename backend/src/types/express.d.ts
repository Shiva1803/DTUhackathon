import { Request } from 'express';

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  auth?: {
    sub: string;           // Auth0 user ID (e.g., auth0|123456)
    aud: string | string[]; // Audience
    iss: string;           // Issuer
    exp: number;           // Expiration time
    iat: number;           // Issued at time
    azp?: string;          // Authorized party
    scope?: string;        // Scopes
    permissions?: string[]; // Permissions (if using RBAC)
    [key: string]: unknown; // Additional custom claims
  };
  user?: {
    id: string;            // MongoDB ObjectId as string
    auth0Id: string;       // Auth0 user ID
    email: string;         // User email
    name?: string;         // User display name
  };
}

/**
 * Auth0 JWT payload structure
 */
export interface Auth0JwtPayload {
  sub: string;
  aud: string | string[];
  iss: string;
  exp: number;
  iat: number;
  azp?: string;
  scope?: string;
  permissions?: string[];
}

/**
 * User session data attached to request
 */
export interface UserSession {
  id: string;
  auth0Id: string;
  email: string;
  name?: string;
}

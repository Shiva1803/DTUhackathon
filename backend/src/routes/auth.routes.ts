import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { successResponse } from '../utils/response';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route   GET /auth/me
 * @desc    Get current authenticated user's profile
 * @access  Private (requires valid JWT)
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // req.user is attached by the auth middleware
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', statusCode: 401 },
      });
      return;
    }

    // Get full user data from database
    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found', statusCode: 404 },
      });
      return;
    }

    logger.debug(`User profile retrieved: ${user.auth0Id}`);

    res.json(
      successResponse(
        {
          id: user._id.toString(),
          auth0Id: user.auth0Id,
          email: user.email,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
        'User profile retrieved successfully'
      )
    );
  })
);

/**
 * @route   GET /auth/profile
 * @desc    Alias for /auth/me
 * @access  Private
 */
router.get('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Redirect to /me handler logic
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { message: 'User not authenticated', statusCode: 401 },
    });
    return;
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404).json({
      success: false,
      error: { message: 'User not found', statusCode: 404 },
    });
    return;
  }

  res.json(
    successResponse({
      id: user._id.toString(),
      auth0Id: user.auth0Id,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    })
  );
}));

export default router;

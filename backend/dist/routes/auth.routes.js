"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const response_1 = require("../utils/response");
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user's profile
 * @access  Private (requires valid JWT)
 */
router.get('/me', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    // req.user is attached by the auth middleware
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: { message: 'User not authenticated', statusCode: 401 },
        });
        return;
    }
    // Get full user data from database
    const user = await User_1.User.findById(req.user.id);
    if (!user) {
        res.status(404).json({
            success: false,
            error: { message: 'User not found', statusCode: 404 },
        });
        return;
    }
    logger_1.logger.debug(`User profile retrieved: ${user.auth0Id}`);
    res.json((0, response_1.successResponse)({
        id: user._id.toString(),
        name: user.name || null,
        email: user.email,
        auth0Id: user.auth0Id,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
    }, 'User profile retrieved successfully'));
}));
/**
 * @route   GET /api/auth/profile
 * @desc    Alias for /api/auth/me
 * @access  Private
 */
router.get('/profile', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: { message: 'User not authenticated', statusCode: 401 },
        });
        return;
    }
    const user = await User_1.User.findById(req.user.id);
    if (!user) {
        res.status(404).json({
            success: false,
            error: { message: 'User not found', statusCode: 404 },
        });
        return;
    }
    res.json((0, response_1.successResponse)({
        id: user._id.toString(),
        name: user.name || null,
        email: user.email,
        auth0Id: user.auth0Id,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
    }));
}));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map
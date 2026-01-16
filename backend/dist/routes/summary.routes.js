"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const response_1 = require("../utils/response");
const ai_service_1 = require("../services/ai.service");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/summary/:weekId
 * @desc    Get weekly summary for a specific week
 * @param   weekId - Week identifier in format YYYY-WNN (e.g., 2024-W01)
 * @access  Private
 */
router.get('/:weekId', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: { message: 'User not authenticated', statusCode: 401 },
        });
        return;
    }
    const weekId = req.params['weekId'];
    // Check if weekId exists
    if (!weekId) {
        res.status(400).json({
            success: false,
            error: { message: 'Week ID is required', statusCode: 400 },
        });
        return;
    }
    // Validate weekId format
    if (!/^\d{4}-W\d{2}$/.test(weekId)) {
        res.status(400).json({
            success: false,
            error: {
                message: 'Invalid weekId format. Expected: YYYY-WNN (e.g., 2024-W01)',
                statusCode: 400,
            },
        });
        return;
    }
    logger_1.logger.debug(`Fetching summary for week ${weekId}, user ${req.user.id}`);
    // Get summary for the week
    let summary = await ai_service_1.aiService.getSummary(req.user.id, weekId);
    // If no summary exists, try to generate one
    if (!summary) {
        // Parse week start date from weekId
        const parts = weekId.split('-W');
        const year = Number(parts[0]);
        const weekNum = Number(parts[1]);
        if (!year || !weekNum || weekNum < 1 || weekNum > 53) {
            throw new error_middleware_1.NotFoundError('Summary not found for the specified week');
        }
        // Calculate week start (Monday)
        const jan1 = new Date(year, 0, 1);
        const daysToMonday = (8 - jan1.getDay()) % 7;
        const firstMonday = new Date(year, 0, 1 + daysToMonday);
        const weekStart = new Date(firstMonday.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000);
        // Check if the week is in the future
        if (weekStart > new Date()) {
            throw new error_middleware_1.NotFoundError('Cannot generate summary for a future week');
        }
        // Generate summary
        logger_1.logger.info(`Generating new summary for week ${weekId}, user ${req.user.id}`);
        const result = await ai_service_1.aiService.generateWeeklySummary(req.user.id, weekStart);
        summary = result.summary;
    }
    res.json((0, response_1.successResponse)({
        id: summary._id.toString(),
        weekId,
        weekStart: summary.weekStart,
        weekEnd: summary.weekEnd,
        metrics: summary.metrics,
        story: summary.story,
        ttsUrl: summary.ttsUrl,
        generatedAt: summary.generatedAt,
        isComplete: summary.isComplete,
    }, 'Weekly summary retrieved successfully'));
}));
/**
 * @route   GET /api/summary
 * @desc    Get current week summary for user (auto-generates if not exists)
 * @access  Private
 */
router.get('/', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: { message: 'User not authenticated', statusCode: 401 },
        });
        return;
    }
    // Import week utilities
    const { getWeekId, getWeekStart } = await Promise.resolve().then(() => __importStar(require('../utils/week.utils')));
    // Get current week
    const currentWeekId = getWeekId();
    const weekStartDate = getWeekStart(currentWeekId);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
    weekEndDate.setUTCHours(23, 59, 59, 999);
    logger_1.logger.debug(`Getting current week summary: ${currentWeekId} for user ${req.user.id}`);
    // Try to find existing summary
    let summary = await ai_service_1.aiService.getSummary(req.user.id, currentWeekId);
    // If no summary exists, auto-generate
    if (!summary) {
        logger_1.logger.info(`Auto-generating summary for ${currentWeekId}, user ${req.user.id}`);
        const result = await ai_service_1.aiService.generateWeeklySummary(req.user.id, weekStartDate);
        summary = result.summary;
    }
    // Derive phase from sentiment breakdown
    const derivedPhase = derivePhaseFromMetrics(summary.metrics);
    // Get user streak data
    const { User } = await Promise.resolve().then(() => __importStar(require('../models/User')));
    const user = await User.findById(req.user.id);
    res.json((0, response_1.successResponse)({
        id: summary._id.toString(),
        weekId: currentWeekId,
        weekStart: summary.weekStart,
        weekEnd: summary.weekEnd,
        phase: derivedPhase.phase,
        phaseConfidence: derivedPhase.confidence,
        metrics: summary.metrics,
        story: summary.story,
        ttsUrl: summary.ttsUrl,
        generatedAt: summary.generatedAt,
        isComplete: summary.isComplete,
        streak: user ? {
            current: user.streakCount || 0,
            longest: user.longestStreak || 0,
        } : null,
    }, 'Current week summary retrieved'));
}));
/**
 * Helper to derive phase from metrics
 */
function derivePhaseFromMetrics(metrics) {
    const { categoryCounts = {}, sentimentBreakdown = { positive: 0, negative: 0, neutral: 0, mixed: 0 } } = metrics;
    const total = sentimentBreakdown.positive + sentimentBreakdown.negative + sentimentBreakdown.neutral + sentimentBreakdown.mixed;
    const positiveRatio = total > 0 ? sentimentBreakdown.positive / total : 0;
    const categories = Object.keys(categoryCounts);
    if (positiveRatio > 0.7 && categories.includes('work')) {
        return { phase: 'Builder', confidence: Math.round(positiveRatio * 100) };
    }
    else if (categories.includes('learning')) {
        return { phase: 'Explorer', confidence: Math.round((positiveRatio + 0.3) * 70) };
    }
    else if (positiveRatio > 0.5) {
        return { phase: 'Optimizer', confidence: Math.round(positiveRatio * 90) };
    }
    else if (positiveRatio > 0.3) {
        return { phase: 'Reflector', confidence: Math.round((1 - positiveRatio) * 60) };
    }
    else {
        return { phase: 'Explorer', confidence: 60 };
    }
}
/**
 * @route   POST /api/summary/generate
 * @desc    Trigger summary generation for a specific week
 * @access  Private
 */
router.post('/generate', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: { message: 'User not authenticated', statusCode: 401 },
        });
        return;
    }
    const { weekStart } = req.body;
    if (!weekStart) {
        res.status(400).json({
            success: false,
            error: { message: 'weekStart is required', statusCode: 400 },
        });
        return;
    }
    const weekStartDate = new Date(weekStart);
    if (isNaN(weekStartDate.getTime())) {
        res.status(400).json({
            success: false,
            error: { message: 'Invalid weekStart date format', statusCode: 400 },
        });
        return;
    }
    logger_1.logger.info(`Manual summary generation requested for ${weekStart}, user ${req.user.id}`);
    const result = await ai_service_1.aiService.generateWeeklySummary(req.user.id, weekStartDate);
    res.json((0, response_1.successResponse)({
        id: result.summary._id.toString(),
        story: result.story,
        ttsUrl: result.ttsUrl,
        generatedAt: result.summary.generatedAt,
    }, 'Summary generated successfully'));
}));
exports.default = router;
//# sourceMappingURL=summary.routes.js.map
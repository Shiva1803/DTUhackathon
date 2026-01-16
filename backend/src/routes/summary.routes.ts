import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware';
import { successResponse, paginatedResponse, parsePagination } from '../utils/response';
import { aiService } from '../services/ai.service';
import { Summary } from '../models/Summary';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

const router = Router();

/**
 * @route   GET /api/summary/:weekId
 * @desc    Get weekly summary for a specific week
 * @param   weekId - Week identifier in format YYYY-WNN (e.g., 2024-W01)
 * @access  Private
 */
router.get(
  '/:weekId',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    logger.debug(`Fetching summary for week ${weekId}, user ${req.user.id}`);

    // Get summary for the week
    let summary = await aiService.getSummary(req.user.id, weekId);

    // If no summary exists, try to generate one
    if (!summary) {
      // Parse week start date from weekId
      const parts = weekId.split('-W');
      const year = Number(parts[0]);
      const weekNum = Number(parts[1]);
      
      if (!year || !weekNum || weekNum < 1 || weekNum > 53) {
        throw new NotFoundError('Summary not found for the specified week');
      }

      // Calculate week start (Monday)
      const jan1 = new Date(year, 0, 1);
      const daysToMonday = (8 - jan1.getDay()) % 7;
      const firstMonday = new Date(year, 0, 1 + daysToMonday);
      const weekStart = new Date(firstMonday.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000);

      // Check if the week is in the future
      if (weekStart > new Date()) {
        throw new NotFoundError('Cannot generate summary for a future week');
      }

      // Generate summary
      logger.info(`Generating new summary for week ${weekId}, user ${req.user.id}`);
      const result = await aiService.generateWeeklySummary(req.user.id, weekStart);
      summary = result.summary;
    }

    res.json(
      successResponse(
        {
          id: summary._id.toString(),
          weekId,
          weekStart: summary.weekStart,
          weekEnd: summary.weekEnd,
          metrics: summary.metrics,
          story: summary.story,
          ttsUrl: summary.ttsUrl,
          generatedAt: summary.generatedAt,
          isComplete: summary.isComplete,
        },
        'Weekly summary retrieved successfully'
      )
    );
  })
);

/**
 * @route   GET /api/summary
 * @desc    Get all summaries for the current user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', statusCode: 401 },
      });
      return;
    }

    const { page, limit } = parsePagination(req.query as { page?: string; limit?: string });
    const skip = (page - 1) * limit;

    const [summaries, total] = await Promise.all([
      Summary.find({ userId: new mongoose.Types.ObjectId(req.user.id) })
        .sort({ weekStart: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Summary.countDocuments({ userId: new mongoose.Types.ObjectId(req.user.id) }),
    ]);

    res.json(paginatedResponse(summaries, total, page, limit));
  })
);

/**
 * @route   POST /api/summary/generate
 * @desc    Trigger summary generation for a specific week
 * @access  Private
 */
router.post(
  '/generate',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', statusCode: 401 },
      });
      return;
    }

    const { weekStart } = req.body as { weekStart?: string };

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

    logger.info(`Manual summary generation requested for ${weekStart}, user ${req.user.id}`);

    const result = await aiService.generateWeeklySummary(req.user.id, weekStartDate);

    res.json(
      successResponse(
        {
          id: result.summary._id.toString(),
          story: result.story,
          ttsUrl: result.ttsUrl,
          generatedAt: result.summary.generatedAt,
        },
        'Summary generated successfully'
      )
    );
  })
);

export default router;

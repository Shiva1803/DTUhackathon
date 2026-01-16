import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler, ValidationError } from '../middleware/error.middleware';
import { successResponse, paginatedResponse, parsePagination } from '../utils/response';
import { aiService } from '../services/ai.service';
import { ChatMessage } from '../models/ChatMessage';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';
import crypto from 'crypto';

const router = Router();

/**
 * Generate a unique session ID
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
};

/**
 * @route   POST /api/chat
 * @desc    Send a chat message and receive AI response
 * @access  Private
 */
router.post(
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

    const { message, sessionId } = req.body as {
      message?: string;
      sessionId?: string;
    };

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new ValidationError('Message is required and must be a non-empty string');
    }

    if (message.length > 10000) {
      throw new ValidationError('Message exceeds maximum length of 10,000 characters');
    }

    // Use provided session ID or generate a new one
    const chatSessionId = sessionId || generateSessionId();

    logger.debug(`Chat message received from user ${req.user.id}, session ${chatSessionId}`);

    // Process the chat message
    const response = await aiService.processChat(
      req.user.id,
      chatSessionId,
      message.trim()
    );

    res.json(
      successResponse(
        {
          sessionId: response.sessionId,
          message: response.message,
          tokens: response.tokens,
        },
        'Chat response generated'
      )
    );
  })
);

/**
 * @route   GET /api/chat/sessions
 * @desc    Get recent chat sessions for the current user
 * @access  Private
 */
router.get(
  '/sessions',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', statusCode: 401 },
      });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const sessionIds = await ChatMessage.getUserSessions(
      new mongoose.Types.ObjectId(req.user.id),
      limit
    );

    // Get first and last message info for each session
    const sessions = await Promise.all(
      sessionIds.map(async (sessionId) => {
        const messages = await ChatMessage.find({ sessionId })
          .sort({ timestamp: 1 })
          .limit(1)
          .exec();

        const lastMessage = await ChatMessage.findOne({ sessionId })
          .sort({ timestamp: -1 })
          .exec();

        const messageCount = await ChatMessage.countDocuments({ sessionId });

        return {
          sessionId,
          firstMessage: messages[0]?.content?.substring(0, 100) || '',
          lastMessageAt: lastMessage?.timestamp,
          messageCount,
        };
      })
    );

    res.json(successResponse(sessions));
  })
);

/**
 * @route   GET /api/chat/sessions/:sessionId
 * @desc    Get chat history for a specific session
 * @access  Private
 */
router.get(
  '/sessions/:sessionId',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', statusCode: 401 },
      });
      return;
    }

    const { sessionId } = req.params;
    const { page, limit } = parsePagination(req.query as { page?: string; limit?: string });

    // Verify session belongs to user
    const sessionCheck = await ChatMessage.findOne({
      sessionId,
      userId: new mongoose.Types.ObjectId(req.user.id),
    });

    if (!sessionCheck) {
      res.status(404).json({
        success: false,
        error: { message: 'Chat session not found', statusCode: 404 },
      });
      return;
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      ChatMessage.find({
        sessionId,
        userId: new mongoose.Types.ObjectId(req.user.id),
      })
        .sort({ timestamp: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ChatMessage.countDocuments({
        sessionId,
        userId: new mongoose.Types.ObjectId(req.user.id),
      }),
    ]);

    res.json(paginatedResponse(messages, total, page, limit));
  })
);

/**
 * @route   DELETE /api/chat/sessions/:sessionId
 * @desc    Delete a chat session and all its messages
 * @access  Private
 */
router.delete(
  '/sessions/:sessionId',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', statusCode: 401 },
      });
      return;
    }

    const { sessionId } = req.params;

    const result = await ChatMessage.deleteMany({
      sessionId,
      userId: new mongoose.Types.ObjectId(req.user.id),
    });

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Chat session not found', statusCode: 404 },
      });
      return;
    }

    logger.info(`Chat session ${sessionId} deleted, ${result.deletedCount} messages removed`);

    res.json(
      successResponse(
        { deletedCount: result.deletedCount },
        'Chat session deleted successfully'
      )
    );
  })
);

export default router;

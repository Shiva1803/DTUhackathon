import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler, ValidationError } from '../middleware/error.middleware';
import { successResponse, paginatedResponse, parsePagination } from '../utils/response';
import { chatService } from '../services/chat.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route   POST /api/chat
 * @desc    Send a chat message and receive AI response via OnDemand Chat API
 * @access  Private
 * @body    { sessionId?: string, message: string }
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

    // Use provided session ID or create a new one
    let chatSessionId = sessionId;
    if (!chatSessionId) {
      chatSessionId = await chatService.createSession(req.user.id);
    }

    logger.debug(`Chat message received from user ${req.user.id}, session ${chatSessionId}`);

    // Process the chat message via OnDemand API
    const response = await chatService.sendMessage(
      req.user.id,
      chatSessionId,
      message.trim()
    );

    res.json(
      successResponse(
        {
          sessionId: response.sessionId,
          message: response.message,
          messageId: response.messageId,
          tokens: response.tokens,
          model: response.model,
          suggestions: response.suggestions,
        },
        'Chat response generated'
      )
    );
  })
);

/**
 * @route   POST /api/chat/sessions
 * @desc    Create a new chat session
 * @access  Private
 */
router.post(
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

    const sessionId = await chatService.createSession(req.user.id);

    res.status(201).json(
      successResponse(
        { sessionId },
        'Chat session created'
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

    const limit = Math.min(parseInt(req.query['limit'] as string) || 10, 50);

    const sessions = await chatService.getUserSessions(req.user.id, limit);

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

    const sessionId = req.params['sessionId'];
    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: { message: 'Session ID is required', statusCode: 400 },
      });
      return;
    }

    const { page, limit } = parsePagination(req.query as { page?: string; limit?: string });

    const messages = await chatService.getSessionHistory(sessionId, limit);

    // Filter messages to only include user's messages (security check)
    const userMessages = messages.filter(
      (msg) => msg.userId.toString() === req.user?.id
    );

    if (userMessages.length === 0 && messages.length > 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Chat session not found', statusCode: 404 },
      });
      return;
    }

    res.json(paginatedResponse(userMessages, userMessages.length, page, limit));
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

    const sessionId = req.params['sessionId'];
    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: { message: 'Session ID is required', statusCode: 400 },
      });
      return;
    }

    const deletedCount = await chatService.deleteSession(sessionId, req.user.id);

    if (deletedCount === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Chat session not found', statusCode: 404 },
      });
      return;
    }

    logger.info(`Chat session ${sessionId} deleted, ${deletedCount} messages removed`);

    res.json(
      successResponse(
        { deletedCount },
        'Chat session deleted successfully'
      )
    );
  })
);

export default router;

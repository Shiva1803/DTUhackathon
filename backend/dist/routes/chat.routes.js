"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const response_1 = require("../utils/response");
const chat_service_1 = require("../services/chat.service");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/chat
 * @desc    Send a chat message and receive AI response via OnDemand Chat API
 * @access  Private
 * @body    { sessionId?: string, message: string }
 */
router.post('/', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: { message: 'User not authenticated', statusCode: 401 },
        });
        return;
    }
    const { message, sessionId } = req.body;
    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new error_middleware_1.ValidationError('Message is required and must be a non-empty string');
    }
    if (message.length > 10000) {
        throw new error_middleware_1.ValidationError('Message exceeds maximum length of 10,000 characters');
    }
    // Use provided session ID or create a new one
    let chatSessionId = sessionId;
    if (!chatSessionId) {
        chatSessionId = await chat_service_1.chatService.createSession(req.user.id);
    }
    logger_1.logger.debug(`Chat message received from user ${req.user.id}, session ${chatSessionId}`);
    // Process the chat message via OnDemand API
    const response = await chat_service_1.chatService.sendMessage(req.user.id, chatSessionId, message.trim());
    res.json((0, response_1.successResponse)({
        sessionId: response.sessionId,
        message: response.message,
        messageId: response.messageId,
        tokens: response.tokens,
        model: response.model,
        suggestions: response.suggestions,
    }, 'Chat response generated'));
}));
/**
 * @route   POST /api/chat/sessions
 * @desc    Create a new chat session
 * @access  Private
 */
router.post('/sessions', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: { message: 'User not authenticated', statusCode: 401 },
        });
        return;
    }
    const sessionId = await chat_service_1.chatService.createSession(req.user.id);
    res.status(201).json((0, response_1.successResponse)({ sessionId }, 'Chat session created'));
}));
/**
 * @route   GET /api/chat/sessions
 * @desc    Get recent chat sessions for the current user
 * @access  Private
 */
router.get('/sessions', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: { message: 'User not authenticated', statusCode: 401 },
        });
        return;
    }
    const limit = Math.min(parseInt(req.query['limit']) || 10, 50);
    const sessions = await chat_service_1.chatService.getUserSessions(req.user.id, limit);
    res.json((0, response_1.successResponse)(sessions));
}));
/**
 * @route   GET /api/chat/sessions/:sessionId
 * @desc    Get chat history for a specific session
 * @access  Private
 */
router.get('/sessions/:sessionId', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
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
    const { page, limit } = (0, response_1.parsePagination)(req.query);
    const messages = await chat_service_1.chatService.getSessionHistory(sessionId, limit);
    // Filter messages to only include user's messages (security check)
    const userMessages = messages.filter((msg) => msg.userId.toString() === req.user?.id);
    if (userMessages.length === 0 && messages.length > 0) {
        res.status(404).json({
            success: false,
            error: { message: 'Chat session not found', statusCode: 404 },
        });
        return;
    }
    res.json((0, response_1.paginatedResponse)(userMessages, userMessages.length, page, limit));
}));
/**
 * @route   DELETE /api/chat/sessions/:sessionId
 * @desc    Delete a chat session and all its messages
 * @access  Private
 */
router.delete('/sessions/:sessionId', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
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
    const deletedCount = await chat_service_1.chatService.deleteSession(sessionId, req.user.id);
    if (deletedCount === 0) {
        res.status(404).json({
            success: false,
            error: { message: 'Chat session not found', statusCode: 404 },
        });
        return;
    }
    logger_1.logger.info(`Chat session ${sessionId} deleted, ${deletedCount} messages removed`);
    res.json((0, response_1.successResponse)({ deletedCount }, 'Chat session deleted successfully'));
}));
exports.default = router;
//# sourceMappingURL=chat.routes.js.map
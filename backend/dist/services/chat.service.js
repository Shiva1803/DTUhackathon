"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = exports.ChatService = exports.generateSessionId = void 0;
const axios_1 = __importDefault(require("axios"));
const ChatMessage_1 = require("../models/ChatMessage");
const logger_1 = require("../utils/logger");
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * OnDemand Chat API configuration
 */
const OND_CHAT_API_URL = process.env.OND_CHAT_URL || 'https://api.on-demand.io/chat/v1';
const OND_CHAT_KEY = process.env.OND_CHAT_KEY || '';
/**
 * Generate a unique session ID
 */
const generateSessionId = () => {
    return `session_${Date.now()}_${crypto_1.default.randomBytes(8).toString('hex')}`;
};
exports.generateSessionId = generateSessionId;
/**
 * Chat Service
 * Handles chat interactions using OnDemand Chat API
 */
class ChatService {
    apiUrl;
    apiKey;
    constructor() {
        this.apiUrl = OND_CHAT_API_URL;
        this.apiKey = OND_CHAT_KEY;
        if (!this.apiKey) {
            logger_1.logger.warn('OND_CHAT_KEY not configured - chat functionality will be limited');
        }
    }
    /**
     * Send a message and get AI response using OnDemand Chat API
     * @param userId - User's MongoDB ObjectId
     * @param sessionId - Chat session ID
     * @param message - User's message
     */
    async sendMessage(userId, sessionId, message) {
        try {
            // Get conversation history for context
            const history = await this.getSessionHistory(sessionId, 20);
            // Save user message first
            const userMessage = await ChatMessage_1.ChatMessage.create({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                sessionId,
                role: 'user',
                content: message,
                timestamp: new Date(),
            });
            // Build conversation context for API
            const messages = history.map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));
            messages.push({ role: 'user', content: message });
            // Call OnDemand Chat API
            const response = await this.callOnDemandChatApi(messages, sessionId);
            // Save assistant response
            const assistantMessage = await ChatMessage_1.ChatMessage.create({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                sessionId,
                role: 'assistant',
                content: response.message,
                timestamp: new Date(),
                metadata: {
                    model: response.model,
                    tokens: response.usage?.total_tokens,
                    externalId: response.id,
                },
            });
            logger_1.logger.info(`Chat message processed: session ${sessionId}`, {
                userMessageId: userMessage._id.toString(),
                assistantMessageId: assistantMessage._id.toString(),
            });
            // Generate contextual suggestions based on the conversation
            const suggestions = this.generateSuggestions(message, response.message);
            return {
                sessionId,
                message: response.message,
                messageId: assistantMessage._id.toString(),
                tokens: response.usage?.total_tokens,
                model: response.model,
                suggestions,
            };
        }
        catch (error) {
            logger_1.logger.error('Error in chat service:', error);
            throw error;
        }
    }
    /**
     * Generate contextual follow-up suggestions
     */
    generateSuggestions(userMessage, aiResponse) {
        const suggestions = [];
        const lowerMessage = userMessage.toLowerCase();
        const lowerResponse = aiResponse.toLowerCase();
        // Goal-related suggestions
        if (lowerMessage.includes('goal') || lowerResponse.includes('goal')) {
            suggestions.push('How can I break this goal into smaller steps?');
            suggestions.push('What habits support this goal?');
        }
        // Productivity suggestions
        if (lowerMessage.includes('productivity') || lowerMessage.includes('work') || lowerResponse.includes('productive')) {
            suggestions.push('What are my most productive times?');
            suggestions.push('How can I improve my focus?');
        }
        // Reflection suggestions
        if (lowerMessage.includes('feel') || lowerMessage.includes('stress') || lowerResponse.includes('reflect')) {
            suggestions.push('What patterns do you see in my logs?');
            suggestions.push('How can I better manage stress?');
        }
        // Summary suggestions
        if (lowerMessage.includes('week') || lowerMessage.includes('summary')) {
            suggestions.push('What should I focus on next week?');
            suggestions.push('What were my biggest achievements?');
        }
        // Default suggestions if none matched
        if (suggestions.length === 0) {
            suggestions.push('Tell me more about my patterns');
            suggestions.push('What should I work on next?');
            suggestions.push('How am I progressing?');
        }
        return suggestions.slice(0, 3); // Return max 3 suggestions
    }
    /**
     * Call OnDemand Chat API
     * @param messages - Conversation history
     * @param sessionId - Session ID for tracking
     */
    async callOnDemandChatApi(messages, sessionId) {
        if (!this.apiKey) {
            // Return mock response for development when API key is not configured
            logger_1.logger.warn('Using mock chat response - OND_CHAT_KEY not configured');
            return {
                id: `mock_${Date.now()}`,
                message: '[Mock response - Configure OND_CHAT_KEY for real AI responses] I received your message and would respond here.',
                role: 'assistant',
                created: Date.now(),
                model: 'mock',
            };
        }
        try {
            const response = await axios_1.default.post(`${this.apiUrl}/sessions/${sessionId}/query`, {
                endpointId: 'predefined-openai-gpt4o',
                query: messages[messages.length - 1]?.content || '',
                pluginIds: [],
                responseMode: 'sync',
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.apiKey,
                },
                timeout: 60000, // 60 second timeout
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const axiosError = error;
                const errorMessage = axiosError.response?.data?.error?.message || axiosError.message;
                logger_1.logger.error('OnDemand Chat API error:', {
                    status: axiosError.response?.status,
                    message: errorMessage,
                    sessionId,
                });
                throw new Error(`Chat API error: ${errorMessage}`);
            }
            throw error;
        }
    }
    /**
     * Create a new chat session with OnDemand
     * @param userId - User ID for tracking
     */
    async createSession(userId) {
        const sessionId = (0, exports.generateSessionId)();
        if (!this.apiKey) {
            logger_1.logger.warn('Using local session - OND_CHAT_KEY not configured');
            return sessionId;
        }
        try {
            // Create session with OnDemand API
            const response = await axios_1.default.post(`${this.apiUrl}/sessions`, {
                externalUserId: userId,
                pluginIds: [],
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.apiKey,
                },
                timeout: 10000,
            });
            // Return the external session ID if provided, otherwise use our generated one
            return response.data.data?.id || response.data.id || sessionId;
        }
        catch (error) {
            logger_1.logger.error('Failed to create OnDemand session, using local session:', error);
            return sessionId;
        }
    }
    /**
     * Get chat history for a session
     * @param sessionId - Session ID
     * @param limit - Max messages to retrieve
     */
    async getSessionHistory(sessionId, limit = 50) {
        return ChatMessage_1.ChatMessage.find({ sessionId })
            .sort({ timestamp: 1 })
            .limit(limit)
            .exec();
    }
    /**
     * Get user's recent chat sessions
     * @param userId - User's MongoDB ObjectId
     * @param limit - Max sessions to retrieve
     */
    async getUserSessions(userId, limit = 10) {
        const result = await ChatMessage_1.ChatMessage.aggregate([
            { $match: { userId: new mongoose_1.default.Types.ObjectId(userId) } },
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: '$sessionId',
                    lastMessage: { $first: '$timestamp' },
                    messageCount: { $sum: 1 },
                    firstContent: { $last: '$content' },
                },
            },
            { $sort: { lastMessage: -1 } },
            { $limit: limit },
        ]);
        return result.map((r) => ({
            sessionId: r._id,
            lastMessage: r.lastMessage,
            messageCount: r.messageCount,
            preview: r.firstContent?.substring(0, 100) || '',
        }));
    }
    /**
     * Delete a chat session
     * @param sessionId - Session ID
     * @param userId - User ID for authorization
     */
    async deleteSession(sessionId, userId) {
        const result = await ChatMessage_1.ChatMessage.deleteMany({
            sessionId,
            userId: new mongoose_1.default.Types.ObjectId(userId),
        });
        logger_1.logger.info(`Deleted chat session ${sessionId}: ${result.deletedCount} messages`);
        return result.deletedCount;
    }
}
exports.ChatService = ChatService;
// Export singleton instance
exports.chatService = new ChatService();
exports.default = exports.chatService;
//# sourceMappingURL=chat.service.js.map
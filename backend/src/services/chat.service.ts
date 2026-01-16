import axios, { AxiosError } from 'axios';
import { ChatMessage, IChatMessage } from '../models/ChatMessage';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * OnDemand Chat API configuration
 */
const OND_CHAT_API_URL = process.env.OND_CHAT_URL || 'https://api.on-demand.io/chat/v1';
const OND_CHAT_KEY = process.env.OND_CHAT_KEY || '';

/**
 * OnDemand Chat API response interface
 */
interface OnDemandChatResponse {
  id: string;
  message: string;
  role: 'assistant';
  created: number;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OnDemand Chat API error response
 */
interface OnDemandChatError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

/**
 * Chat response interface returned by the service
 */
export interface ChatServiceResponse {
  sessionId: string;
  message: string;
  messageId: string;
  tokens?: number;
  model?: string;
  suggestions?: string[];
}

/**
 * Chat history message format for OnDemand API
 */
interface ChatHistoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Generate a unique session ID
 */
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
};

/**
 * Chat Service
 * Handles chat interactions using OnDemand Chat API
 */
export class ChatService {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.apiUrl = OND_CHAT_API_URL;
    this.apiKey = OND_CHAT_KEY;

    if (!this.apiKey) {
      logger.warn('OND_CHAT_KEY not configured - chat functionality will be limited');
    }
  }

  /**
   * Send a message and get AI response using OnDemand Chat API
   * @param userId - User's MongoDB ObjectId
   * @param sessionId - Chat session ID
   * @param message - User's message
   */
  async sendMessage(
    userId: string,
    sessionId: string,
    message: string
  ): Promise<ChatServiceResponse> {
    try {
      // Get conversation history for context
      const history = await this.getSessionHistory(sessionId, 20);

      // Save user message first
      const userMessage = await ChatMessage.create({
        userId: new mongoose.Types.ObjectId(userId),
        sessionId,
        role: 'user',
        content: message,
        timestamp: new Date(),
      });

      // Build conversation context for API
      const messages: ChatHistoryMessage[] = history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      messages.push({ role: 'user', content: message });

      // Call OnDemand Chat API
      const response = await this.callOnDemandChatApi(messages, sessionId);

      // Save assistant response
      const assistantMessage = await ChatMessage.create({
        userId: new mongoose.Types.ObjectId(userId),
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

      logger.info(`Chat message processed: session ${sessionId}`, {
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
    } catch (error) {
      logger.error('Error in chat service:', error);
      throw error;
    }
  }

  /**
   * Generate contextual follow-up suggestions
   */
  private generateSuggestions(userMessage: string, aiResponse: string): string[] {
    const suggestions: string[] = [];
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
  private async callOnDemandChatApi(
    messages: ChatHistoryMessage[],
    sessionId: string
  ): Promise<OnDemandChatResponse> {
    if (!this.apiKey) {
      // Return mock response for development when API key is not configured
      logger.warn('Using mock chat response - OND_CHAT_KEY not configured');
      return {
        id: `mock_${Date.now()}`,
        message: '[Mock response - Configure OND_CHAT_KEY for real AI responses] I received your message and would respond here.',
        role: 'assistant',
        created: Date.now(),
        model: 'mock',
      };
    }

    try {
      const response = await axios.post<OnDemandChatResponse>(
        `${this.apiUrl}/sessions/${sessionId}/query`,
        {
          endpointId: 'predefined-openai-gpt4o',
          query: messages[messages.length - 1]?.content || '',
          pluginIds: [],
          responseMode: 'sync',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.apiKey,
          },
          timeout: 60000, // 60 second timeout
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<OnDemandChatError>;
        const errorMessage = axiosError.response?.data?.error?.message || axiosError.message;

        logger.error('OnDemand Chat API error:', {
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
  async createSession(userId: string): Promise<string> {
    const sessionId = generateSessionId();

    if (!this.apiKey) {
      logger.warn('Using local session - OND_CHAT_KEY not configured');
      return sessionId;
    }

    try {
      // Create session with OnDemand API
      const response = await axios.post(
        `${this.apiUrl}/sessions`,
        {
          externalUserId: userId,
          pluginIds: [],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.apiKey,
          },
          timeout: 10000,
        }
      );

      // Return the external session ID if provided, otherwise use our generated one
      return response.data.data?.id || response.data.id || sessionId;
    } catch (error) {
      logger.error('Failed to create OnDemand session, using local session:', error);
      return sessionId;
    }
  }

  /**
   * Get chat history for a session
   * @param sessionId - Session ID
   * @param limit - Max messages to retrieve
   */
  async getSessionHistory(sessionId: string, limit = 50): Promise<IChatMessage[]> {
    return ChatMessage.find({ sessionId })
      .sort({ timestamp: 1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get user's recent chat sessions
   * @param userId - User's MongoDB ObjectId
   * @param limit - Max sessions to retrieve
   */
  async getUserSessions(
    userId: string,
    limit = 10
  ): Promise<Array<{ sessionId: string; lastMessage: Date; messageCount: number; preview: string }>> {
    const result = await ChatMessage.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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
      sessionId: r._id as string,
      lastMessage: r.lastMessage as Date,
      messageCount: r.messageCount as number,
      preview: (r.firstContent as string)?.substring(0, 100) || '',
    }));
  }

  /**
   * Delete a chat session
   * @param sessionId - Session ID
   * @param userId - User ID for authorization
   */
  async deleteSession(sessionId: string, userId: string): Promise<number> {
    const result = await ChatMessage.deleteMany({
      sessionId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    logger.info(`Deleted chat session ${sessionId}: ${result.deletedCount} messages`);
    return result.deletedCount;
  }
}

// Export singleton instance
export const chatService = new ChatService();

export default chatService;

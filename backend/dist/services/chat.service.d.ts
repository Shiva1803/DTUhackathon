import { IChatMessage } from '../models/ChatMessage';
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
 * Generate a unique session ID
 */
export declare const generateSessionId: () => string;
/**
 * Chat Service
 * Handles chat interactions using OnDemand Chat API
 */
export declare class ChatService {
    private readonly apiUrl;
    private readonly apiKey;
    constructor();
    /**
     * Send a message and get AI response using OnDemand Chat API
     * @param userId - User's MongoDB ObjectId
     * @param sessionId - Chat session ID
     * @param message - User's message
     */
    sendMessage(userId: string, sessionId: string, message: string): Promise<ChatServiceResponse>;
    /**
     * Generate contextual follow-up suggestions
     */
    private generateSuggestions;
    /**
     * Call OnDemand Chat API
     * @param messages - Conversation history
     * @param sessionId - Session ID for tracking
     */
    private callOnDemandChatApi;
    /**
     * Create a new chat session with OnDemand
     * @param userId - User ID for tracking
     */
    createSession(userId: string): Promise<string>;
    /**
     * Get chat history for a session
     * @param sessionId - Session ID
     * @param limit - Max messages to retrieve
     */
    getSessionHistory(sessionId: string, limit?: number): Promise<IChatMessage[]>;
    /**
     * Get user's recent chat sessions
     * @param userId - User's MongoDB ObjectId
     * @param limit - Max sessions to retrieve
     */
    getUserSessions(userId: string, limit?: number): Promise<Array<{
        sessionId: string;
        lastMessage: Date;
        messageCount: number;
        preview: string;
    }>>;
    /**
     * Delete a chat session
     * @param sessionId - Session ID
     * @param userId - User ID for authorization
     */
    deleteSession(sessionId: string, userId: string): Promise<number>;
}
export declare const chatService: ChatService;
export default chatService;
//# sourceMappingURL=chat.service.d.ts.map
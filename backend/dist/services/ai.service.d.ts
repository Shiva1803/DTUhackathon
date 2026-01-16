import { IAudioLog } from '../models/AudioLog';
import { ISummary } from '../models/Summary';
/**
 * Categorization result interface
 */
export interface CategorizationResult {
    category: string;
    confidence: number;
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    keywords: string[];
}
/**
 * Summary generation result
 */
export interface SummaryGenerationResult {
    summary: ISummary;
    story: string;
    ttsUrl?: string;
}
/**
 * Chat response interface
 */
export interface ChatResponse {
    message: string;
    sessionId: string;
    tokens?: number;
}
/**
 * AI Service
 * Handles categorization, summarization, and chat functionality
 */
export declare class AIService {
    private readonly geminiApiUrl;
    private readonly geminiApiKey;
    private readonly elevenLabsApiUrl;
    private readonly elevenLabsApiKey;
    private readonly chatApiUrl;
    private readonly chatApiKey;
    constructor();
    /**
     * Categorize a transcript using AI
     * @param transcript - Text to categorize
     */
    categorizeTranscript(transcript: string): Promise<CategorizationResult>;
    /**
     * Update audio log with categorization
     * @param audioLogId - Audio log ID
     * @param userId - User ID for authorization
     */
    categorizeAudioLog(audioLogId: string, userId: string): Promise<IAudioLog | null>;
    /**
     * Generate weekly summary for a user
     * @param userId - User's MongoDB ObjectId
     * @param weekStart - Start of the week
     */
    generateWeeklySummary(userId: string, weekStart: Date): Promise<SummaryGenerationResult>;
    /**
     * Calculate metrics from audio logs
     */
    private calculateMetrics;
    /**
     * Generate a narrative story from logs and metrics
     */
    private generateStoryNarrative;
    /**
     * Generate TTS audio using Eleven Labs and upload to Cloudinary
     */
    private generateTTS;
    /**
     * Process a chat message and generate response
     * @param userId - User's MongoDB ObjectId
     * @param sessionId - Chat session ID
     * @param message - User's message
     */
    processChat(userId: string, sessionId: string, message: string): Promise<ChatResponse>;
    /**
     * Generate chat response using AI
     */
    private generateChatResponse;
    /**
     * Call Gemini API
     */
    private callGeminiApi;
    /**
     * Parse JSON from AI response
     */
    private parseJsonResponse;
    /**
     * Get summary for a specific week
     */
    getSummary(userId: string, weekId: string): Promise<ISummary | null>;
}
export declare const aiService: AIService;
export default aiService;
//# sourceMappingURL=ai.service.d.ts.map
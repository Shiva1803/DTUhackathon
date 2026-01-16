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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const AudioLog_1 = require("../models/AudioLog");
const Summary_1 = require("../models/Summary");
const ChatMessage_1 = require("../models/ChatMessage");
const logger_1 = require("../utils/logger");
const week_utils_1 = require("../utils/week.utils");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * AI Service
 * Handles categorization, summarization, and chat functionality
 */
class AIService {
    geminiApiUrl;
    geminiApiKey;
    elevenLabsApiUrl;
    elevenLabsApiKey;
    chatApiUrl;
    chatApiKey;
    constructor() {
        this.geminiApiKey = process.env.GEMINI_KEY || '';
        this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta';
        this.elevenLabsApiKey = process.env.ELEVEN_KEY || '';
        this.elevenLabsApiUrl = 'https://api.elevenlabs.io/v1';
        this.chatApiKey = process.env.OND_CHAT_KEY || '';
        this.chatApiUrl = process.env.OND_CHAT_URL || 'https://api.chat.example.com';
    }
    /**
     * Categorize a transcript using AI
     * @param transcript - Text to categorize
     */
    async categorizeTranscript(transcript) {
        try {
            const prompt = `Analyze the following transcript and provide:
1. A category (one of: health, work, personal, family, social, finance, learning, other)
2. A confidence score (0-1)
3. Sentiment (positive, negative, neutral, or mixed)
4. Up to 5 keywords

Transcript: "${transcript}"

Respond in JSON format:
{
  "category": "string",
  "confidence": number,
  "sentiment": "string",
  "keywords": ["string"]
}`;
            const result = await this.callGeminiApi(prompt);
            // Parse the JSON response
            const parsed = this.parseJsonResponse(result);
            return {
                category: parsed.category || 'other',
                confidence: parsed.confidence || 0.5,
                sentiment: parsed.sentiment || 'neutral',
                keywords: parsed.keywords || [],
            };
        }
        catch (error) {
            logger_1.logger.error('Error categorizing transcript:', error);
            // Return default categorization on error
            return {
                category: 'other',
                confidence: 0,
                sentiment: 'neutral',
                keywords: [],
            };
        }
    }
    /**
     * Update audio log with categorization
     * @param audioLogId - Audio log ID
     * @param userId - User ID for authorization
     */
    async categorizeAudioLog(audioLogId, userId) {
        const audioLog = await AudioLog_1.AudioLog.findOne({
            _id: new mongoose_1.default.Types.ObjectId(audioLogId),
            userId: new mongoose_1.default.Types.ObjectId(userId),
        });
        if (!audioLog) {
            return null;
        }
        const categorization = await this.categorizeTranscript(audioLog.transcript);
        audioLog.category = categorization.category;
        audioLog.sentiment = categorization.sentiment;
        if (!audioLog.metadata)
            audioLog.metadata = {};
        audioLog.metadata.keywords = categorization.keywords;
        audioLog.metadata.categoryConfidence = categorization.confidence;
        await audioLog.save();
        return audioLog;
    }
    /**
     * Generate weekly summary for a user
     * @param userId - User's MongoDB ObjectId
     * @param weekStart - Start of the week
     */
    async generateWeeklySummary(userId, weekStart) {
        try {
            // Calculate week end
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            // Get all audio logs for the week
            const logs = await AudioLog_1.AudioLog.find({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                timestamp: { $gte: weekStart, $lt: weekEnd },
            }).sort({ timestamp: 1 });
            // Calculate metrics
            const metrics = this.calculateMetrics(logs);
            // Generate narrative story
            const story = await this.generateStoryNarrative(logs, metrics);
            // Generate TTS audio (optional)
            let ttsUrl;
            if (this.elevenLabsApiKey) {
                ttsUrl = await this.generateTTS(story);
            }
            // Create or update summary
            const summary = await Summary_1.Summary.findOneAndUpdate({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                weekStart,
            }, {
                userId: new mongoose_1.default.Types.ObjectId(userId),
                weekStart,
                weekEnd,
                metrics,
                story,
                ttsUrl,
                generatedAt: new Date(),
                isComplete: true,
            }, { upsert: true, new: true });
            logger_1.logger.info(`Weekly summary generated for user ${userId}`, { weekStart });
            return { summary, story, ttsUrl };
        }
        catch (error) {
            logger_1.logger.error('Error generating weekly summary:', error);
            throw error;
        }
    }
    /**
     * Calculate metrics from audio logs
     */
    calculateMetrics(logs) {
        const categoryCounts = {};
        const sentimentBreakdown = {
            positive: 0,
            negative: 0,
            neutral: 0,
            mixed: 0,
        };
        let totalDuration = 0;
        const allKeywords = [];
        for (const log of logs) {
            // Count categories
            const category = log.category || 'uncategorized';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            // Count sentiments
            const sentiment = log.sentiment || 'neutral';
            if (sentiment in sentimentBreakdown) {
                sentimentBreakdown[sentiment]++;
            }
            // Sum durations
            if (log.duration) {
                totalDuration += log.duration;
            }
            // Collect keywords
            if (log.metadata?.keywords && Array.isArray(log.metadata.keywords)) {
                allKeywords.push(...log.metadata.keywords);
            }
        }
        // Get top keywords
        const keywordCounts = allKeywords.reduce((acc, kw) => {
            acc[kw] = (acc[kw] || 0) + 1;
            return acc;
        }, {});
        const topKeywords = Object.entries(keywordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([kw]) => kw);
        return {
            totalLogs: logs.length,
            categoryCounts,
            sentimentBreakdown,
            averageDuration: logs.length > 0 ? totalDuration / logs.length : 0,
            topKeywords,
        };
    }
    /**
     * Generate a narrative story from logs and metrics
     */
    async generateStoryNarrative(logs, metrics) {
        if (logs.length === 0) {
            return 'No audio logs recorded this week. Start logging to get your personalized weekly summary!';
        }
        try {
            const transcriptsSummary = logs
                .slice(0, 20) // Limit to avoid token limits
                .map((log) => `- ${log.transcript.substring(0, 200)}`)
                .join('\n');
            const prompt = `Based on the following weekly data, create a warm, personalized narrative summary (2-3 paragraphs) that reflects on the user's week. Be encouraging and insightful.

Metrics:
- Total entries: ${metrics.totalLogs}
- Categories: ${JSON.stringify(metrics.categoryCounts)}
- Sentiment: ${JSON.stringify(metrics.sentimentBreakdown)}
- Top themes: ${metrics.topKeywords?.join(', ') || 'N/A'}

Sample entries:
${transcriptsSummary}

Write a narrative that:
1. Highlights key themes and patterns
2. Acknowledges the user's emotions and experiences
3. Provides gentle encouragement or insights
4. Feels personal, not generic`;
            const story = await this.callGeminiApi(prompt);
            return story.trim();
        }
        catch (error) {
            logger_1.logger.error('Error generating story narrative:', error);
            return `This week you had ${metrics.totalLogs} entries across various categories. Keep logging to build a complete picture of your journey!`;
        }
    }
    /**
     * Generate TTS audio using Eleven Labs and upload to Cloudinary
     */
    async generateTTS(text) {
        if (!this.elevenLabsApiKey) {
            logger_1.logger.warn('ELEVEN_KEY not configured - skipping TTS generation');
            return undefined;
        }
        try {
            const response = await fetch(`${this.elevenLabsApiUrl}/text-to-speech/21m00Tcm4TlvDq8ikWAM`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': this.elevenLabsApiKey,
                },
                body: JSON.stringify({
                    text: text.substring(0, 5000), // Limit text length
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5,
                    },
                }),
            });
            if (!response.ok) {
                throw new Error(`Eleven Labs API error: ${response.status}`);
            }
            // Get audio buffer from response
            const audioBuffer = Buffer.from(await response.arrayBuffer());
            // Upload to Cloudinary
            const cloudinary = await Promise.resolve().then(() => __importStar(require('cloudinary')));
            return new Promise((resolve) => {
                const uploadStream = cloudinary.v2.uploader.upload_stream({
                    resource_type: 'video', // Cloudinary uses 'video' for audio
                    folder: 'tts_summaries',
                    format: 'mp3',
                }, (error, result) => {
                    if (error) {
                        logger_1.logger.error('Failed to upload TTS to Cloudinary:', error);
                        resolve(undefined);
                        return;
                    }
                    logger_1.logger.info('TTS uploaded to Cloudinary:', result?.public_id);
                    resolve(result?.secure_url);
                });
                uploadStream.end(audioBuffer);
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating TTS:', error);
            return undefined;
        }
    }
    /**
     * Process a chat message and generate response
     * @param userId - User's MongoDB ObjectId
     * @param sessionId - Chat session ID
     * @param message - User's message
     */
    async processChat(userId, sessionId, message) {
        try {
            // Get conversation history
            const history = await ChatMessage_1.ChatMessage.getSessionHistory(sessionId, 20);
            // Save user message
            await ChatMessage_1.ChatMessage.create({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                sessionId,
                role: 'user',
                content: message,
                timestamp: new Date(),
            });
            // Build conversation context
            const messages = history.map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));
            messages.push({ role: 'user', content: message });
            // Generate response
            const response = await this.generateChatResponse(messages);
            // Save assistant response
            await ChatMessage_1.ChatMessage.create({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                sessionId,
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            });
            return {
                message: response,
                sessionId,
            };
        }
        catch (error) {
            logger_1.logger.error('Error processing chat:', error);
            throw error;
        }
    }
    /**
     * Generate chat response using AI
     */
    async generateChatResponse(messages) {
        try {
            const systemPrompt = `You are a helpful, empathetic AI assistant for a personal journaling and reflection app. You help users:
1. Reflect on their experiences and emotions
2. Identify patterns in their behavior and thoughts
3. Set and track personal goals
4. Provide gentle encouragement and support

Be warm, supportive, and non-judgmental. Ask thoughtful follow-up questions when appropriate.`;
            const conversationContext = messages
                .map((m) => `${m.role}: ${m.content}`)
                .join('\n');
            const prompt = `${systemPrompt}\n\nConversation:\n${conversationContext}\n\nassistant:`;
            const response = await this.callGeminiApi(prompt);
            return response.trim();
        }
        catch (error) {
            logger_1.logger.error('Error generating chat response:', error);
            return "I'm having trouble processing that right now. Could you try again?";
        }
    }
    /**
     * Call Gemini API
     */
    async callGeminiApi(prompt) {
        if (!this.geminiApiKey) {
            logger_1.logger.warn('GEMINI_KEY not configured, using placeholder response');
            return '[Placeholder response - configure GEMINI_KEY for real AI responses]';
        }
        try {
            const response = await fetch(`${this.geminiApiUrl}/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    },
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                throw new Error('No text in Gemini response');
            }
            return text;
        }
        catch (error) {
            logger_1.logger.error('Gemini API error:', error);
            throw error;
        }
    }
    /**
     * Parse JSON from AI response
     */
    parseJsonResponse(text) {
        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            }
            catch {
                logger_1.logger.warn('Failed to parse JSON from AI response');
            }
        }
        return {};
    }
    /**
     * Get summary for a specific week
     */
    async getSummary(userId, weekId) {
        try {
            // Use the ISO week utilities for consistent calculation
            const weekStart = (0, week_utils_1.getWeekStart)(weekId);
            const weekEnd = (0, week_utils_1.getWeekEnd)(weekId);
            logger_1.logger.debug(`Looking for summary: weekId=${weekId}, weekStart=${weekStart.toISOString()}, weekEnd=${weekEnd.toISOString()}`);
            // Search with a range to handle timezone differences
            // The weekStart stored in the DB may differ by a day due to local timezone vs UTC
            const searchRangeStart = new Date(weekStart);
            searchRangeStart.setUTCDate(searchRangeStart.getUTCDate() - 1);
            const searchRangeEnd = new Date(weekStart);
            searchRangeEnd.setUTCDate(searchRangeEnd.getUTCDate() + 1);
            const summary = await Summary_1.Summary.findOne({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                weekStart: { $gte: searchRangeStart, $lte: searchRangeEnd },
            });
            if (summary) {
                logger_1.logger.debug(`Found summary for weekId=${weekId}, summaryId=${summary._id}`);
            }
            else {
                logger_1.logger.debug(`No summary found for weekId=${weekId}`);
            }
            return summary;
        }
        catch (error) {
            logger_1.logger.error(`Error getting summary for weekId=${weekId}:`, error);
            return null;
        }
    }
}
exports.AIService = AIService;
// Export singleton instance
exports.aiService = new AIService();
exports.default = exports.aiService;
//# sourceMappingURL=ai.service.js.map
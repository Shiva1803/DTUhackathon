import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { Summary, ISummary, IMetrics } from '../models/Summary';
import { IAudioProcessingLog } from './types';
import { categorizerService } from './categorizer.service';

/**
 * Phase determination based on activity distribution
 */
export type ActivityPhase = 'Growth' | 'Loop' | 'Scholar' | 'Grind' | 'Balanced';

/**
 * Story structure for summary
 */
export interface SummaryStory {
    headline: string;
    text: string;
}

/**
 * Weekly summary result
 */
export interface WeeklySummaryResult {
    summary: ISummary;
    story: SummaryStory;
    ttsUrl?: string;
    phase: ActivityPhase;
    categoryHours: {
        creation: number;
        consumption: number;
        learning: number;
        productivity: number;
    };
}

/**
 * Gemini API configuration
 */
const GEMINI_API_KEY = process.env.GEMINI_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * ElevenLabs API configuration
 */
const ELEVEN_LABS_API_KEY = process.env.ELEVEN_KEY || '';
const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1';
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice

/**
 * Cloudinary configuration check
 */
const CLOUDINARY_URL = process.env.CLOUDINARY_URL;

/**
 * Weekly Summary Service
 * 
 * Generates weekly summaries with:
 * - Activity categorization totals
 * - Phase determination
 * - AI-generated narrative
 * - Text-to-speech audio
 */
export class SummaryService {
    private readonly geminiApiKey: string;
    private readonly geminiApiUrl: string;
    private readonly elevenLabsApiKey: string;
    private readonly elevenLabsApiUrl: string;

    constructor() {
        this.geminiApiKey = GEMINI_API_KEY;
        this.geminiApiUrl = GEMINI_API_URL;
        this.elevenLabsApiKey = ELEVEN_LABS_API_KEY;
        this.elevenLabsApiUrl = ELEVEN_LABS_API_URL;

        if (!this.geminiApiKey) {
            logger.warn('[Summary] GEMINI_KEY not configured - narratives will use templates');
        }
        if (!this.elevenLabsApiKey) {
            logger.warn('[Summary] ELEVEN_KEY not configured - TTS will be disabled');
        }
    }

    /**
     * Sanitize text by removing markdown, quotes, and extra formatting
     */
    private sanitizeText(text: string): string {
        return text
            .replace(/["'`]/g, '')           // Remove quotes
            .replace(/\*\*/g, '')            // Remove bold markdown
            .replace(/\*/g, '')              // Remove italic markdown
            .replace(/_/g, ' ')              // Replace underscores with spaces
            .replace(/#+\s*/g, '')           // Remove headers
            .replace(/\n{2,}/g, ' ')         // Replace multiple newlines
            .replace(/\s{2,}/g, ' ')         // Replace multiple spaces
            .trim();
    }

    /**
     * Generate weekly summary for a user
     * 
     * @param userId - User's MongoDB ObjectId
     * @param weekLogs - Audio logs for the week
     * @param weekStart - Start of the week (Monday)
     */
    async generateWeeklySummary(
        userId: string,
        weekLogs: IAudioProcessingLog[],
        weekStart?: Date
    ): Promise<WeeklySummaryResult> {
        try {
            // Calculate week boundaries
            const start = weekStart || this.getWeekStart(new Date());
            const end = new Date(start);
            end.setDate(end.getDate() + 7);

            logger.info(`[Summary] Generating weekly summary for user ${userId}`, {
                weekStart: start,
                logCount: weekLogs.length,
            });

            // Step 1: Calculate total hours by category
            const categoryHours = await this.calculateCategoryHours(weekLogs);

            // Step 2: Determine dominant phase
            const phase = this.determinePhase(categoryHours);

            // Step 3: Generate narrative via Gemini
            const story = await this.generateNarrative(categoryHours, phase, weekLogs.length);

            // Step 4: Generate TTS audio
            let ttsUrl: string | undefined;
            if (this.elevenLabsApiKey) {
                const ttsResult = await this.textToSpeech(story.text);
                ttsUrl = ttsResult ?? undefined; // Convert null to undefined
            }

            // Step 5: Build metrics object
            const metrics: IMetrics = {
                totalLogs: weekLogs.length,
                categoryCounts: {
                    creation: Math.round(categoryHours.creation * 60), // Convert to minutes
                    consumption: Math.round(categoryHours.consumption * 60),
                    learning: Math.round(categoryHours.learning * 60),
                    productivity: Math.round(categoryHours.productivity * 60),
                },
                sentimentBreakdown: {
                    positive: 0,
                    negative: 0,
                    neutral: weekLogs.length,
                    mixed: 0,
                },
                phase,
                totalHours: categoryHours.creation + categoryHours.consumption +
                    categoryHours.learning + categoryHours.productivity,
            };

            // Step 6: Save to database
            const summary = await Summary.findOneAndUpdate(
                {
                    userId: new mongoose.Types.ObjectId(userId),
                    weekStart: start,
                },
                {
                    userId: new mongoose.Types.ObjectId(userId),
                    weekStart: start,
                    weekEnd: end,
                    metrics,
                    story: JSON.stringify(story), // Store as JSON string
                    ttsUrl,
                    generatedAt: new Date(),
                    isComplete: true,
                },
                { upsert: true, new: true }
            );

            logger.info(`[Summary] Weekly summary generated: ${summary._id}`);

            return {
                summary,
                story,
                ttsUrl,
                phase,
                categoryHours,
            };
        } catch (error) {
            logger.error('[Summary] Error generating weekly summary:', error);
            throw error;
        }
    }

    /**
     * Calculate total hours spent in each category from logs
     * Uses batch categorization for better AI context
     */
    private async calculateCategoryHours(
        logs: IAudioProcessingLog[]
    ): Promise<{ creation: number; consumption: number; learning: number; productivity: number }> {
        if (logs.length === 0) {
            logger.warn('[Summary] No logs provided for category calculation');
            return { creation: 0, consumption: 0, learning: 0, productivity: 0 };
        }

        // Extract all transcripts, handling missing ones
        const transcripts = logs.map(log => {
            if (!log.transcript || log.transcript.trim() === '' || log.transcript === 'No transcript') {
                logger.debug(`[Summary] Log ${log._id} has missing/empty transcript`);
                return ''; // Will be filtered by categorizeWeekLogs
            }
            return log.transcript;
        });

        // Use batch categorization for better context
        const totalMinutes = await categorizerService.categorizeWeekLogs(transcripts);

        // Convert to hours
        return {
            creation: Math.round((totalMinutes.creation / 60) * 10) / 10,
            consumption: Math.round((totalMinutes.consumption / 60) * 10) / 10,
            learning: Math.round((totalMinutes.learning / 60) * 10) / 10,
            productivity: Math.round((totalMinutes.productivity / 60) * 10) / 10,
        };
    }

    /**
     * Determine the dominant activity phase based on percentages
     */
    private determinePhase(categoryHours: {
        creation: number;
        consumption: number;
        learning: number;
        productivity: number;
    }): ActivityPhase {
        const total = categoryHours.creation + categoryHours.consumption +
            categoryHours.learning + categoryHours.productivity;

        if (total === 0) return 'Balanced';

        const percentages = {
            creation: (categoryHours.creation / total) * 100,
            consumption: (categoryHours.consumption / total) * 100,
            learning: (categoryHours.learning / total) * 100,
            productivity: (categoryHours.productivity / total) * 100,
        };

        // Determine phase based on dominant category (>60%)
        if (percentages.creation > 60) return 'Growth';
        if (percentages.consumption > 60) return 'Loop';
        if (percentages.learning > 60) return 'Scholar';
        if (percentages.productivity > 60) return 'Grind';

        // Check for combined thresholds
        if (percentages.creation + percentages.learning > 70) return 'Growth';
        if (percentages.consumption > 40 && percentages.productivity < 20) return 'Loop';

        return 'Balanced';
    }

    /**
     * Generate narrative summary using Gemini API
     */
    private async generateNarrative(
        categoryHours: { creation: number; consumption: number; learning: number; productivity: number },
        phase: ActivityPhase,
        logCount: number
    ): Promise<SummaryStory> {
        const prompt = `Write a friendly, upbeat summary of this week's activities.

Activity breakdown:
- Creation (coding, design, building): ${categoryHours.creation} hours
- Consumption (social media, entertainment): ${categoryHours.consumption} hours  
- Learning (reading, courses, tutorials): ${categoryHours.learning} hours
- Productivity (meetings, tasks, planning): ${categoryHours.productivity} hours

Total logs recorded: ${logCount}
Dominant phase: ${phase}

Write a 2-3 sentence summary that:
1. Highlights the user's strengths this week
2. Provides one friendly suggestion for improvement
3. Uses an encouraging, motivational tone

Also provide a short headline (5-7 words max).

Respond ONLY in this JSON format:
{
  "headline": "Your headline here",
  "text": "Your summary paragraph here"
}`;

        try {
            if (!this.geminiApiKey) {
                return this.generateFallbackNarrative(categoryHours, phase);
            }

            const response = await fetch(
                `${this.geminiApiUrl}/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 512,
                        },
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json() as {
                candidates?: Array<{
                    content?: { parts?: Array<{ text?: string }> };
                }>;
            };

            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) {
                throw new Error('No text in Gemini response');
            }

            // Parse JSON from response
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]) as SummaryStory;
                return {
                    headline: this.sanitizeText(parsed.headline || this.generateHeadline(phase)),
                    text: this.sanitizeText(parsed.text || this.generateFallbackNarrative(categoryHours, phase).text),
                };
            }

            return this.generateFallbackNarrative(categoryHours, phase);
        } catch (error) {
            logger.warn('[Summary] Gemini narrative generation failed:', error);
            return this.generateFallbackNarrative(categoryHours, phase);
        }
    }

    /**
     * Generate fallback narrative without AI
     */
    private generateFallbackNarrative(
        categoryHours: { creation: number; consumption: number; learning: number; productivity: number },
        phase: ActivityPhase
    ): SummaryStory {
        const total = categoryHours.creation + categoryHours.consumption +
            categoryHours.learning + categoryHours.productivity;

        const headline = this.generateHeadline(phase);

        let text: string;
        switch (phase) {
            case 'Growth':
                text = `Amazing week! You spent ${categoryHours.creation} hours creating and building. ` +
                    `Your focus on creation is paying off. Consider balancing with some learning time to keep growing!`;
                break;
            case 'Loop':
                text = `You logged ${total.toFixed(1)} hours this week with ${categoryHours.consumption} hours on consumption. ` +
                    `Try swapping 30 minutes of scrolling for something creative tomorrow!`;
                break;
            case 'Scholar':
                text = `What a learning-focused week with ${categoryHours.learning} hours of study! ` +
                    `Consider applying what you've learned through a small project.`;
                break;
            case 'Grind':
                text = `Productive week with ${categoryHours.productivity} hours of focused work! ` +
                    `Remember to schedule some downtime to recharge.`;
                break;
            default:
                text = `Balanced week with ${total.toFixed(1)} total hours tracked across all activities. ` +
                    `Keep up the great work maintaining variety in your routine!`;
        }

        return { headline, text };
    }

    /**
     * Generate headline based on phase
     */
    private generateHeadline(phase: ActivityPhase): string {
        const headlines: Record<ActivityPhase, string> = {
            Growth: '🚀 Builder Mode Activated!',
            Loop: '📱 Time to Break the Loop',
            Scholar: '📚 Knowledge Seeker Week',
            Grind: '💪 Productivity Champion',
            Balanced: '⚖️ Perfectly Balanced Week',
        };
        return headlines[phase];
    }

    /**
     * Convert text to speech using ElevenLabs API
     * 
     * @param text - Text to convert to speech
     * @returns URL of the generated audio file
     */
    async textToSpeech(text: string): Promise<string | null | undefined> {
        if (!this.elevenLabsApiKey) {
            logger.warn('[Summary] ElevenLabs API key not configured');
            return undefined;
        }

        try {
            logger.info('[Summary] Generating TTS audio...');

            // Truncate text if too long (ElevenLabs has limits)
            const truncatedText = text.substring(0, 5000);

            const response = await axios.post(
                `${this.elevenLabsApiUrl}/text-to-speech/${DEFAULT_VOICE_ID}`,
                {
                    text: truncatedText,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5,
                    },
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'xi-api-key': this.elevenLabsApiKey,
                    },
                    responseType: 'arraybuffer',
                    timeout: 30000,
                }
            );

            if (response.status !== 200) {
                throw new Error(`ElevenLabs API error: ${response.status}`);
            }

            // Upload audio to Cloudinary
            const audioBuffer = Buffer.from(response.data);
            const audioUrl = await this.uploadTTSToCloudinary(audioBuffer);

            logger.info('[Summary] TTS audio generated and uploaded');
            return audioUrl;
        } catch (error: any) {
            // Check for rate limit errors (status 429 or quota exceeded)
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const errorMessage = error.response?.data?.detail?.message || error.message;

                if (status === 429 || errorMessage?.includes('quota') || errorMessage?.includes('limit')) {
                    logger.warn('[Summary] ElevenLabs rate limit reached - TTS disabled for this request', {
                        status,
                        message: errorMessage,
                    });
                    return null; // Explicit null for rate limit
                }
            }

            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            logger.error('[Summary] TTS generation failed:', { message: errorMsg });
            return undefined;
        }
    }

    /**
     * Upload TTS audio buffer to Cloudinary
     */
    private async uploadTTSToCloudinary(audioBuffer: Buffer): Promise<string | undefined> {
        if (!CLOUDINARY_URL) {
            logger.warn('[Summary] Cloudinary not configured for TTS upload');
            return undefined;
        }

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'video', // Cloudinary uses 'video' for audio
                    folder: 'weekly_summaries_tts',
                    format: 'mp3',
                },
                (error, result) => {
                    if (error) {
                        logger.error('[Summary] Cloudinary TTS upload error:', error);
                        reject(error);
                        return;
                    }
                    resolve(result?.secure_url);
                }
            );
            uploadStream.end(audioBuffer);
        });
    }

    /**
     * Get the start of the week (Monday) for a given date
     */
    private getWeekStart(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    /**
     * Get existing summary for a user's week
     */
    async getSummary(userId: string, weekStart: Date): Promise<ISummary | null> {
        return Summary.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            weekStart,
        });
    }

    /**
     * Get recent summaries for a user
     */
    async getRecentSummaries(userId: string, limit = 10): Promise<ISummary[]> {
        return Summary.find({
            userId: new mongoose.Types.ObjectId(userId),
        })
            .sort({ weekStart: -1 })
            .limit(limit)
            .exec();
    }
}

// Export singleton instance
export const summaryService = new SummaryService();

export default summaryService;

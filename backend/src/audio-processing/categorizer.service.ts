import { logger } from '../utils/logger';

/**
 * Activity Categories Breakdown
 * Values represent minutes spent on each activity type
 */
export interface ActivityCategories {
    creation: number;      // Coding, design, building, creating content
    consumption: number;   // Social media, entertainment, browsing
    learning: number;      // Reading, watching educational content, courses
    productivity: number;  // Work tasks, meetings, planning, organizing
}

/**
 * Categorization result with metadata
 */
export interface CategorizationResult {
    categories: ActivityCategories;
    confidence: number;
    source: 'gemini' | 'fallback';
    rawResponse?: string;
}

/**
 * Gemini API configuration
 */
const GEMINI_API_KEY = process.env.GEMINI_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * In-memory cache for repeated transcripts
 * Key: hash of transcript, Value: categorization result
 */
const categorizationCache = new Map<string, { result: CategorizationResult; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour TTL

/**
 * Simple hash function for cache keys
 */
function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
}

/**
 * Keyword rules for fallback categorization
 */
const KEYWORD_RULES = {
    creation: [
        'coding', 'code', 'programming', 'develop', 'building', 'design',
        'create', 'writing', 'wrote', 'built', 'implementing', 'debug',
        'frontend', 'backend', 'api', 'database', 'javascript', 'typescript',
        'python', 'react', 'node', 'css', 'html', 'app', 'software',
        'feature', 'project', 'github', 'commit', 'deploy', 'test',
        'figma', 'photoshop', 'illustrator', 'sketch', 'wireframe'
    ],
    consumption: [
        'instagram', 'twitter', 'facebook', 'tiktok', 'youtube', 'netflix',
        'social media', 'scroll', 'scrolling', 'browsing', 'watching',
        'entertainment', 'movie', 'show', 'series', 'gaming', 'game',
        'reddit', 'news', 'feed', 'stories', 'reels', 'shorts'
    ],
    learning: [
        'learning', 'learned', 'study', 'studying', 'reading', 'read',
        'course', 'tutorial', 'lesson', 'lecture', 'educational',
        'book', 'article', 'documentation', 'research', 'practicing',
        'udemy', 'coursera', 'skillshare', 'podcast', 'audiobook',
        'workshop', 'conference', 'training', 'skill', 'understand'
    ],
    productivity: [
        'meeting', 'email', 'emails', 'call', 'calls', 'planning',
        'organize', 'organizing', 'task', 'tasks', 'work', 'working',
        'office', 'client', 'presentation', 'report', 'spreadsheet',
        'deadline', 'project management', 'schedule', 'calendar',
        'slack', 'zoom', 'teams', 'jira', 'trello', 'notion',
        'review', 'feedback', 'collaborate', 'sync', 'standup'
    ]
};

/**
 * Categorizer Service
 * 
 * Analyzes transcripts to estimate time spent on different activity types:
 * - Creation (coding, design, building)
 * - Consumption (social media, entertainment)
 * - Learning (reading, courses, tutorials)
 * - Productivity (work tasks, meetings, planning)
 */
export class CategorizerService {
    private readonly geminiApiKey: string;
    private readonly geminiApiUrl: string;

    constructor() {
        this.geminiApiKey = GEMINI_API_KEY;
        this.geminiApiUrl = GEMINI_API_URL;

        if (!this.geminiApiKey) {
            logger.warn('[Categorizer] GEMINI_KEY not configured - will use fallback keyword rules');
        }
    }

    /**
     * Categorize activities from transcript text
     * 
     * @param text - The transcript text to analyze
     * @returns Object with minutes spent on each category
     */
    async categorizeActivities(text: string): Promise<ActivityCategories> {
        // Handle missing or empty transcripts
        if (!text || text.trim() === '' || text === 'No transcript') {
            logger.debug('[Categorizer] Empty or missing transcript, returning zeros');
            return { creation: 0, consumption: 0, learning: 0, productivity: 0 };
        }

        const result = await this.categorizeWithCache(text);
        return result.categories;
    }

    /**
     * Categorize entire week logs by concatenating transcripts
     * This provides better context for AI categorization
     * 
     * @param transcripts - Array of transcript strings
     * @returns Aggregated minutes for each category
     */
    async categorizeWeekLogs(transcripts: string[]): Promise<ActivityCategories> {
        // Filter out empty/missing transcripts
        const validTranscripts = transcripts.filter(
            t => t && t.trim() !== '' && t !== 'No transcript'
        );

        if (validTranscripts.length === 0) {
            logger.warn('[Categorizer] No valid transcripts to categorize');
            return { creation: 0, consumption: 0, learning: 0, productivity: 0 };
        }

        // Concatenate all transcripts with separators
        const concatenatedText = validTranscripts.join('\n---\n');

        logger.info(`[Categorizer] Categorizing ${validTranscripts.length} transcripts (${concatenatedText.length} chars)`);

        // Use the main categorization method
        return this.categorizeActivities(concatenatedText);
    }

    /**
     * Full categorization with metadata
     */
    async categorizeWithCache(text: string): Promise<CategorizationResult> {
        // Check cache first
        const cacheKey = hashString(text);
        const cached = categorizationCache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
            logger.debug('[Categorizer] Cache hit for transcript');
            return cached.result;
        }

        // Perform categorization
        let result: CategorizationResult;

        try {
            if (this.geminiApiKey) {
                result = await this.categorizeWithGemini(text);
            } else {
                result = this.categorizeWithKeywords(text);
            }
        } catch (error) {
            logger.warn('[Categorizer] Gemini failed, falling back to keywords:', error);
            result = this.categorizeWithKeywords(text);
        }

        // Store in cache
        categorizationCache.set(cacheKey, { result, timestamp: Date.now() });

        // Clean old cache entries periodically
        this.cleanupCache();

        return result;
    }

    /**
     * Categorize using Gemini API
     */
    private async categorizeWithGemini(text: string): Promise<CategorizationResult> {
        const prompt = `Given this daily log: "${text}"

Estimate minutes spent on each activity type based on the content. Return a JSON object with these exact keys:
- "creation": minutes spent on coding, design, building, creating content
- "consumption": minutes spent on social media, entertainment, browsing
- "learning": minutes spent on reading, watching educational content, courses
- "productivity": minutes spent on work tasks, meetings, planning, organizing

If a category is not mentioned, estimate 0 minutes.
If the total time is unclear, estimate based on typical activity durations.

RESPOND ONLY WITH A JSON OBJECT, no other text. Example format:
{"creation": 60, "consumption": 30, "learning": 45, "productivity": 90}`;

        try {
            const response = await fetch(
                `${this.geminiApiUrl}/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`,
                {
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
                            temperature: 0.3, // Lower temperature for more consistent JSON output
                            maxOutputTokens: 256,
                        },
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json() as {
                candidates?: Array<{
                    content?: {
                        parts?: Array<{ text?: string }>;
                    };
                }>;
            };

            const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!rawResponse) {
                throw new Error('No text in Gemini response');
            }

            // Parse JSON from response
            const categories = this.parseGeminiResponse(rawResponse);

            logger.info('[Categorizer] Gemini categorization successful');

            return {
                categories,
                confidence: 0.85,
                source: 'gemini',
                rawResponse,
            };
        } catch (error) {
            logger.error('[Categorizer] Gemini API error:', error);
            throw error;
        }
    }

    /**
     * Parse Gemini response to extract categories
     */
    private parseGeminiResponse(text: string): ActivityCategories {
        logger.debug('[Categorizer] Parsing Gemini response:', text.substring(0, 200));

        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]) as Partial<ActivityCategories>;

                const result = {
                    creation: this.validateMinutes(parsed.creation),
                    consumption: this.validateMinutes(parsed.consumption),
                    learning: this.validateMinutes(parsed.learning),
                    productivity: this.validateMinutes(parsed.productivity),
                };

                logger.debug('[Categorizer] Parsed categories:', result);
                return result;
            } catch (parseError) {
                logger.warn('[Categorizer] Failed to parse Gemini JSON response:', {
                    error: parseError instanceof Error ? parseError.message : 'Unknown',
                    rawText: jsonMatch[0].substring(0, 100),
                });
            }
        } else {
            logger.warn('[Categorizer] No JSON object found in Gemini response:', {
                responsePreview: text.substring(0, 100),
            });
        }

        // If parsing fails, return zeros
        return { creation: 0, consumption: 0, learning: 0, productivity: 0 };
    }

    /**
     * Validate and sanitize minute values
     */
    private validateMinutes(value: unknown): number {
        const num = Number(value);
        if (isNaN(num) || num < 0) return 0;
        if (num > 1440) return 1440; // Max 24 hours
        return Math.round(num);
    }

    /**
     * Fallback: Categorize using keyword matching
     */
    private categorizeWithKeywords(text: string): CategorizationResult {
        const lowerText = text.toLowerCase();
        const wordCount = text.split(/\s+/).length;

        // Count keyword matches for each category
        const matchCounts: ActivityCategories = {
            creation: 0,
            consumption: 0,
            learning: 0,
            productivity: 0,
        };

        for (const [category, keywords] of Object.entries(KEYWORD_RULES)) {
            for (const keyword of keywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const matches = lowerText.match(regex);
                if (matches) {
                    matchCounts[category as keyof ActivityCategories] += matches.length;
                }
            }
        }

        // Calculate total matches
        const totalMatches = Object.values(matchCounts).reduce((a, b) => a + b, 0);

        // Estimate total minutes based on word count (rough estimate: 150 words per minute speaking)
        const estimatedTotalMinutes = Math.max(5, Math.round(wordCount / 150) * 60);

        // Distribute minutes based on keyword proportions
        let categories: ActivityCategories;

        if (totalMatches === 0) {
            // No keywords matched, distribute evenly with productivity bias
            categories = {
                creation: 0,
                consumption: 0,
                learning: 0,
                productivity: estimatedTotalMinutes,
            };
        } else {
            categories = {
                creation: Math.round((matchCounts.creation / totalMatches) * estimatedTotalMinutes),
                consumption: Math.round((matchCounts.consumption / totalMatches) * estimatedTotalMinutes),
                learning: Math.round((matchCounts.learning / totalMatches) * estimatedTotalMinutes),
                productivity: Math.round((matchCounts.productivity / totalMatches) * estimatedTotalMinutes),
            };
        }

        logger.info('[Categorizer] Fallback keyword categorization applied', { matchCounts });

        return {
            categories,
            confidence: 0.5, // Lower confidence for fallback
            source: 'fallback',
        };
    }

    /**
     * Clean up expired cache entries
     */
    private cleanupCache(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, value] of categorizationCache.entries()) {
            if (now - value.timestamp > CACHE_TTL_MS) {
                categorizationCache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug(`[Categorizer] Cleaned ${cleaned} expired cache entries`);
        }
    }

    /**
     * Clear the entire cache (useful for testing)
     */
    clearCache(): void {
        categorizationCache.clear();
        logger.info('[Categorizer] Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; ttlMs: number } {
        return {
            size: categorizationCache.size,
            ttlMs: CACHE_TTL_MS,
        };
    }
}

// Export singleton instance
export const categorizerService = new CategorizerService();

export default categorizerService;

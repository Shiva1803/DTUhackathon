import { AudioLog, IAudioLog } from '../models/AudioLog';
import { Summary, ISummary, IMetrics } from '../models/Summary';
import { ChatMessage, IChatMessage } from '../models/ChatMessage';
import { logger } from '../utils/logger';
import { getWeekStart, getWeekEnd, getWeekId } from '../utils/week.utils';
import mongoose from 'mongoose';

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
export class AIService {
  private readonly geminiApiUrl: string;
  private readonly geminiApiKey: string;
  private readonly elevenLabsApiUrl: string;
  private readonly elevenLabsApiKey: string;
  private readonly chatApiUrl: string;
  private readonly chatApiKey: string;

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
  async categorizeTranscript(transcript: string): Promise<CategorizationResult> {
    // Handle missing or empty transcript
    if (!transcript || transcript.trim().length === 0) {
      logger.warn('Empty transcript provided for categorization');
      return {
        category: 'uncategorized',
        confidence: 0,
        sentiment: 'neutral',
        keywords: [],
      };
    }

    try {
      const prompt = `Analyze the following transcript and provide:
1. A category (one of: health, work, personal, family, social, finance, learning, other)
2. A confidence score (0-1)
3. Sentiment (positive, negative, neutral, or mixed)
4. Up to 5 keywords

Transcript: "${transcript}"

Respond in JSON format only, no markdown or code blocks:
{
  "category": "string",
  "confidence": number,
  "sentiment": "string",
  "keywords": ["string"]
}`;

      const result = await this.callGeminiApi(prompt);

      // Parse the JSON response
      const parsed = this.parseJsonResponse<CategorizationResult>(result);

      return {
        category: parsed.category || 'other',
        confidence: parsed.confidence || 0.5,
        sentiment: parsed.sentiment || 'neutral',
        keywords: parsed.keywords || [],
      };
    } catch (error) {
      logger.error('Error categorizing transcript:', error);

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
   * Categorize all activities for a week (batch processing)
   * Concatenates transcripts and provides overall categorization
   * @param userId - User's MongoDB ObjectId
   * @param weekStart - Start of the week
   */
  async categorizeWeekActivities(
    userId: string,
    weekStart: Date
  ): Promise<{ categories: Record<string, number>; processed: number }> {
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Get all uncategorized logs for the week
      const logs = await AudioLog.find({
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: weekStart, $lt: weekEnd },
        $or: [{ category: { $exists: false } }, { category: null }, { category: '' }],
      });

      if (logs.length === 0) {
        logger.info(`No uncategorized logs found for user ${userId} in week starting ${weekStart}`);
        return { categories: {}, processed: 0 };
      }

      logger.info(`Categorizing ${logs.length} logs for user ${userId}`);

      const categories: Record<string, number> = {};
      let processed = 0;

      // Process each log asynchronously
      const categorizationPromises = logs.map(async (log) => {
        // Handle missing transcript
        if (!log.transcript || log.transcript.trim().length === 0) {
          log.category = 'uncategorized';
          log.sentiment = 'neutral';
          if (!log.metadata) log.metadata = {};
          log.metadata.categoryConfidence = 0;
          await log.save();
          categories['uncategorized'] = (categories['uncategorized'] || 0) + 1;
          return;
        }

        const result = await this.categorizeTranscript(log.transcript);

        log.category = result.category;
        log.sentiment = result.sentiment;
        if (!log.metadata) log.metadata = {};
        log.metadata.keywords = result.keywords;
        log.metadata.categoryConfidence = result.confidence;

        await log.save();
        categories[result.category] = (categories[result.category] || 0) + 1;
        processed++;
      });

      // Wait for all categorizations to complete
      await Promise.all(categorizationPromises);

      logger.info(`Week categorization complete: ${processed} logs processed`, { categories });
      return { categories, processed };
    } catch (error) {
      logger.error('Error categorizing week activities:', error);
      throw error;
    }
  }

  /**
   * Update audio log with categorization
   * @param audioLogId - Audio log ID
   * @param userId - User ID for authorization
   */
  async categorizeAudioLog(audioLogId: string, userId: string): Promise<IAudioLog | null> {
    const audioLog = await AudioLog.findOne({
      _id: new mongoose.Types.ObjectId(audioLogId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!audioLog) {
      return null;
    }

    const categorization = await this.categorizeTranscript(audioLog.transcript);

    audioLog.category = categorization.category;
    audioLog.sentiment = categorization.sentiment;
    if (!audioLog.metadata) audioLog.metadata = {};
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
  async generateWeeklySummary(
    userId: string,
    weekStart: Date
  ): Promise<SummaryGenerationResult> {
    try {
      // Calculate week end
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Get all audio logs for the week
      const logs = await AudioLog.find({
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: weekStart, $lt: weekEnd },
      }).sort({ timestamp: 1 });

      // Calculate metrics
      const metrics = this.calculateMetrics(logs);

      // Generate narrative story
      const story = await this.generateStoryNarrative(logs, metrics);

      // Generate TTS audio (optional)
      let ttsUrl: string | undefined;
      if (this.elevenLabsApiKey) {
        ttsUrl = await this.generateTTS(story);
      }

      // Create or update summary
      const summary = await Summary.findOneAndUpdate(
        {
          userId: new mongoose.Types.ObjectId(userId),
          weekStart,
        },
        {
          userId: new mongoose.Types.ObjectId(userId),
          weekStart,
          weekEnd,
          metrics,
          story,
          ttsUrl,
          generatedAt: new Date(),
          isComplete: true,
        },
        { upsert: true, new: true }
      );

      logger.info(`Weekly summary generated for user ${userId}`, { weekStart });

      return { summary, story, ttsUrl };
    } catch (error) {
      logger.error('Error generating weekly summary:', error);
      throw error;
    }
  }

  /**
   * Calculate metrics from audio logs
   */
  private calculateMetrics(logs: IAudioLog[]): IMetrics {
    const categoryCounts: Record<string, number> = {};
    const sentimentBreakdown = {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0,
    };
    let totalDuration = 0;
    const allKeywords: string[] = [];

    for (const log of logs) {
      // Count categories
      const category = log.category || 'uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

      // Count sentiments
      const sentiment = log.sentiment || 'neutral';
      if (sentiment in sentimentBreakdown) {
        sentimentBreakdown[sentiment as keyof typeof sentimentBreakdown]++;
      }

      // Sum durations
      if (log.duration) {
        totalDuration += log.duration;
      }

      // Collect keywords
      if (log.metadata?.keywords && Array.isArray(log.metadata.keywords)) {
        allKeywords.push(...(log.metadata.keywords as string[]));
      }
    }

    // Get top keywords
    const keywordCounts = allKeywords.reduce<Record<string, number>>((acc, kw) => {
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
  private async generateStoryNarrative(
    logs: IAudioLog[],
    metrics: IMetrics
  ): Promise<string> {
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
    } catch (error) {
      logger.error('Error generating story narrative:', error);
      return `This week you had ${metrics.totalLogs} entries across various categories. Keep logging to build a complete picture of your journey!`;
    }
  }

  /**
   * Generate TTS audio using Eleven Labs and upload to Cloudinary
   */
  private async generateTTS(text: string): Promise<string | undefined> {
    if (!this.elevenLabsApiKey) {
      logger.warn('ELEVEN_KEY not configured - skipping TTS generation');
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
        const status = response.status;

        // Handle rate limiting (429)
        if (status === 429) {
          logger.warn('ElevenLabs rate limit reached (429) - skipping TTS generation');
          return undefined;
        }

        throw new Error(`Eleven Labs API error: ${status}`);
      }

      // Get audio buffer from response
      const audioBuffer = Buffer.from(await response.arrayBuffer());

      // Upload to Cloudinary
      const cloudinary = await import('cloudinary');

      return new Promise<string | undefined>((resolve) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          {
            resource_type: 'video', // Cloudinary uses 'video' for audio
            folder: 'tts_summaries',
            format: 'mp3',
          },
          (error, result) => {
            if (error) {
              logger.error('Failed to upload TTS to Cloudinary:', error);
              resolve(undefined);
              return;
            }
            logger.info('TTS uploaded to Cloudinary:', result?.public_id);
            resolve(result?.secure_url);
          }
        );
        uploadStream.end(audioBuffer);
      });
    } catch (error) {
      logger.error('Error generating TTS:', error);
      return undefined;
    }
  }

  /**
   * Process a chat message and generate response
   * @param userId - User's MongoDB ObjectId
   * @param sessionId - Chat session ID
   * @param message - User's message
   */
  async processChat(
    userId: string,
    sessionId: string,
    message: string
  ): Promise<ChatResponse> {
    try {
      // Get conversation history
      const history = await ChatMessage.getSessionHistory(sessionId, 20);

      // Save user message
      await ChatMessage.create({
        userId: new mongoose.Types.ObjectId(userId),
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
      await ChatMessage.create({
        userId: new mongoose.Types.ObjectId(userId),
        sessionId,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      });

      return {
        message: response,
        sessionId,
      };
    } catch (error) {
      logger.error('Error processing chat:', error);
      throw error;
    }
  }

  /**
   * Generate chat response using AI
   */
  private async generateChatResponse(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
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
    } catch (error) {
      logger.error('Error generating chat response:', error);
      return "I'm having trouble processing that right now. Could you try again?";
    }
  }

  /**
   * Call Gemini API
   */
  private async callGeminiApi(prompt: string): Promise<string> {
    if (!this.geminiApiKey) {
      logger.warn('GEMINI_KEY not configured, using placeholder response');
      return '[Placeholder response - configure GEMINI_KEY for real AI responses]';
    }

    try {
      const response = await fetch(
        `${this.geminiApiUrl}/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`,
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
              temperature: 0.7,
              maxOutputTokens: 1024,
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

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('No text in Gemini response');
      }

      return text;
    } catch (error) {
      logger.error('Gemini API error:', error);
      throw error;
    }
  }

  /**
   * Parse JSON from AI response
   * Strips markdown formatting and extracts clean JSON
   */
  private parseJsonResponse<T>(text: string): T {
    // Strip markdown code blocks if present
    let cleanText = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/^\s*`+|`+\s*$/g, '')
      .trim();

    // Try to extract JSON from the response
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch (e) {
        logger.warn('Failed to parse JSON from AI response:', e);
      }
    }

    logger.warn('No valid JSON found in AI response');
    return {} as T;
  }

  /**
   * Strip formatting from text (quotes, markdown, etc.)
   */
  private stripTextFormatting(text: string): string {
    return text
      .replace(/^["'`]+|["'`]+$/g, '')  // Remove leading/trailing quotes
      .replace(/\*\*/g, '')              // Remove bold markdown
      .replace(/\*/g, '')                // Remove italic markdown
      .replace(/^#+\s*/gm, '')           // Remove heading markers
      .replace(/\n{3,}/g, '\n\n')        // Reduce multiple newlines
      .trim();
  }

  /**
   * Get summary for a specific week
   */
  async getSummary(userId: string, weekId: string): Promise<ISummary | null> {
    try {
      // Use the ISO week utilities for consistent calculation
      const weekStart = getWeekStart(weekId);
      const weekEnd = getWeekEnd(weekId);

      logger.debug(`Looking for summary: weekId=${weekId}, weekStart=${weekStart.toISOString()}, weekEnd=${weekEnd.toISOString()}`);

      // Search with a range to handle timezone differences
      // The weekStart stored in the DB may differ by a day due to local timezone vs UTC
      const searchRangeStart = new Date(weekStart);
      searchRangeStart.setUTCDate(searchRangeStart.getUTCDate() - 1);

      const searchRangeEnd = new Date(weekStart);
      searchRangeEnd.setUTCDate(searchRangeEnd.getUTCDate() + 1);

      const summary = await Summary.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        weekStart: { $gte: searchRangeStart, $lte: searchRangeEnd },
      });

      if (summary) {
        logger.debug(`Found summary for weekId=${weekId}, summaryId=${summary._id}`);
      } else {
        logger.debug(`No summary found for weekId=${weekId}`);
      }

      return summary;
    } catch (error) {
      logger.error(`Error getting summary for weekId=${weekId}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

export default aiService;

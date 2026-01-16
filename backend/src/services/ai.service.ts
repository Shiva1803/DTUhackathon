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
  title: string;
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
    try {
      const prompt = `Analyze the following transcript and provide:
1. A category (one of: health, work, personal, family, social, finance, learning, other)
2. A confidence score (0-1)
3. Sentiment (positive, negative, neutral, or mixed)
4. Up to 5 keywords
5. A short, descriptive title (max 50 characters) that summarizes what the recording is about

Transcript: "${transcript}"

Respond in JSON format:
{
  "category": "string",
  "confidence": number,
  "sentiment": "string",
  "keywords": ["string"],
  "title": "string"
}`;

      const result = await this.callGeminiApi(prompt);

      // Parse the JSON response
      const parsed = this.parseJsonResponse<CategorizationResult>(result);

      return {
        category: parsed.category || 'other',
        confidence: parsed.confidence || 0.5,
        sentiment: parsed.sentiment || 'neutral',
        keywords: parsed.keywords || [],
        title: parsed.title || this.generateFallbackTitle(transcript),
      };
    } catch (error) {
      logger.error('Error categorizing transcript:', error);

      // Return default categorization on error
      return {
        category: 'other',
        confidence: 0,
        sentiment: 'neutral',
        keywords: [],
        title: this.generateFallbackTitle(transcript),
      };
    }
  }

  /**
   * Generate a fallback title from transcript when AI fails
   * @param transcript - The transcript text
   */
  private generateFallbackTitle(transcript: string): string {
    // Take first 50 characters and clean up
    const cleaned = transcript.trim().replace(/\s+/g, ' ');
    if (cleaned.length <= 50) {
      return cleaned;
    }
    // Find last space before 50 chars to avoid cutting words
    const truncated = cleaned.substring(0, 50);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 20 ? truncated.substring(0, lastSpace) : truncated) + '...';
  }

  /**
   * Generate title for a transcript using AI
   * @param transcript - Text to generate title for
   */
  async generateTitle(transcript: string): Promise<string> {
    try {
      const prompt = `Generate a short, descriptive title (max 50 characters) that summarizes what this recording is about. The title should be clear and help the user understand the content at a glance.

Transcript: "${transcript.substring(0, 500)}"

Respond with just the title, no quotes or extra formatting.`;

      const result = await this.callGeminiApi(prompt);
      const title = result.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
      
      // Ensure title is not too long
      if (title.length > 60) {
        return title.substring(0, 57) + '...';
      }
      
      return title || this.generateFallbackTitle(transcript);
    } catch (error) {
      logger.error('Error generating title:', error);
      return this.generateFallbackTitle(transcript);
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
    // Only set AI-generated title if user didn't provide one
    if (!audioLog.title) {
      audioLog.title = categorization.title;
    }
    if (!audioLog.metadata) audioLog.metadata = {};
    audioLog.metadata.keywords = categorization.keywords;
    audioLog.metadata.categoryConfidence = categorization.confidence;

    await audioLog.save();
    logger.info(`Audio log categorized${!audioLog.title ? ` with title: "${categorization.title}"` : ' (user title preserved)'}`);
    
    // Also analyze activities and update tracker
    await this.analyzeAndTrackActivities(audioLogId, userId, audioLog.transcript, audioLog.title);
    
    return audioLog;
  }

  /**
   * STEP 1: Extract activities from transcript
   * Uses the exact prompt provided by user
   */
  async extractActivities(transcript: string): Promise<{ activity: string; context: string }[]> {
    try {
      const prompt = `You are an activity extraction assistant. Analyze the following voice-to-text transcript of a daily log and extract all activities mentioned.

TRANSCRIPT:
${transcript}

Your task:
1. Carefully read through the entire transcript
2. Identify ALL activities, tasks, habits, or events the person mentions doing or experiencing
3. Extract both explicit activities (e.g., "I went to the gym") and implicit ones (e.g., "had pizza for dinner" = ate junk food)
4. Include health-related activities (exercise, meals, sleep, mental health practices)
5. Include work/productivity activities (meetings, coding, studying, projects)
6. Include learning/growth activities (reading, courses, skill development)
7. Include consumption activities (TV shows, social media, movies, games)
8. Include any other miscellaneous activities

Return your response as a JSON object with this exact structure:
{
  "activities": [
    {
      "activity": "brief description of the activity",
      "context": "any relevant details or duration mentioned"
    }
  ]
}

Rules:
- If absolutely NO activities are mentioned (highly unlikely), return: {"activities": [{"activity": "N/A", "context": "No activities discussed"}]}
- Be thorough - don't miss activities mentioned casually in conversation
- Keep descriptions clear and concise
- Focus on actionable activities, not just thoughts or feelings (unless they involve specific practices like meditation or journaling)

Return ONLY the JSON object, no additional text.`;

      const result = await this.callGeminiApi(prompt);
      const parsed = this.parseJsonResponse<{ activities: { activity: string; context: string }[] }>(result);

      return parsed.activities || [{ activity: 'N/A', context: 'No activities discussed' }];
    } catch (error) {
      logger.error('Error extracting activities:', error);
      return [{ activity: 'N/A', context: 'Error extracting activities' }];
    }
  }

  /**
   * STEP 2: Classify activities into categories with points
   * Uses the exact prompt provided by user
   */
  async classifyActivities(activities: { activity: string; context: string }[]): Promise<{
    categoryPoints: { growth: number; health: number; work: number; consumption: number; other: number };
    classificationDetails: { activity: string; category: string; points: number; reasoning: string }[];
  }> {
    try {
      const activitiesJson = JSON.stringify(activities, null, 2);

      const prompt = `You are a life tracking classifier. You will receive a list of activities and must classify each one into specific categories with point values.

ACTIVITIES:
${activitiesJson}

CLASSIFICATION CATEGORIES:

1. **Growth** (Learning & Development)
   - +1: Reading books, taking courses, learning new skills, practicing instruments, language learning, educational content, personal development activities, journaling for self-reflection
   - -1: Avoiding learning opportunities, procrastinating on development goals

2. **Health** (Physical & Mental Wellness)
   - +1: Exercise/workout, healthy meals, adequate sleep, meditation, yoga, mental health practices, drinking water, taking breaks, outdoor activities
   - -1: Junk food, excessive alcohol, smoking, skipping meals, poor sleep, sedentary behavior, stress without coping mechanisms

3. **Work** (Professional Productivity)
   - +1: Completing work tasks, attending meetings, coding/developing, studying for work/school, project progress, focused work sessions
   - -1: Procrastinating on work, missing deadlines, unproductive work time

4. **Consumption** (Passive Entertainment)
   - +1: Never assign positive points to consumption (this is a passive category)
   - -1: Watching TV/movies, social media scrolling, gaming (recreational, not educational), binge-watching content, excessive phone use

5. **Other** (Miscellaneous Activities)
   - +1: ONLY if there are genuinely no activities that fit the above 4 categories (least preferred option)
   - This should rarely be used

CLASSIFICATION RULES:
1. Each activity can affect MULTIPLE categories (e.g., "cooked a healthy meal" = +1 Health, +1 Work if mentioned as productive)
2. Assign points based on the nature and impact of each activity
3. An activity can give both positive and negative points to different categories (e.g., "worked late into the night" = +1 Work, -1 Health)
4. Be precise: "ate food" without context = 0 points; "ate salad" = +1 Health; "ate fast food" = -1 Health
5. Only use "Other" when activities genuinely don't fit any category
6. If activities is "N/A", assign +1 to Other only

Return your response as a JSON object with this exact structure:
{
  "category_points": {
    "growth": 0,
    "health": 0,
    "work": 0,
    "consumption": 0,
    "other": 0
  },
  "classification_details": [
    {
      "activity": "activity description",
      "category": "category name",
      "points": +1 or -1,
      "reasoning": "brief explanation"
    }
  ]
}

Return ONLY the JSON object, no additional text.`;

      const result = await this.callGeminiApi(prompt);
      const parsed = this.parseJsonResponse<{
        category_points: { growth: number; health: number; work: number; consumption: number; other: number };
        classification_details: { activity: string; category: string; points: number; reasoning: string }[];
      }>(result);

      return {
        categoryPoints: parsed.category_points || { growth: 0, health: 0, work: 0, consumption: 0, other: 0 },
        classificationDetails: parsed.classification_details || [],
      };
    } catch (error) {
      logger.error('Error classifying activities:', error);
      return {
        categoryPoints: { growth: 0, health: 0, work: 0, consumption: 0, other: 0 },
        classificationDetails: [],
      };
    }
  }

  /**
   * STEP 3: Generate personal review based on aggregated counts
   * Uses the exact prompt provided by user
   */
  async generatePersonalReview(counts: { growth: number; health: number; work: number; consumption: number; other: number }): Promise<string> {
    try {
      const prompt = `You are a life coach providing personalized feedback. Based on the activity classification scores (excluding "Other"), provide a brief review of future prospects and actionable suggestions.

CATEGORY SCORES:
- Growth: ${counts.growth}
- Health: ${counts.health}
- Work: ${counts.work}
- Consumption: ${counts.consumption}

Your task:
1. Analyze the pattern across all 4 categories (ignore "Other")
2. Identify strengths (positive scores) and areas of concern (negative scores)
3. Provide 2-3 specific, actionable suggestions for improvement
4. Keep the tone encouraging but honest
5. Focus on the most impactful changes they can make

Write a review in approximately 100 words that includes:
- A brief assessment of their current trajectory
- Recognition of what they're doing well
- Specific suggestions for improvement prioritized by impact
- An encouraging closing statement

Keep it concise, actionable, and motivating. Write in second person ("you"). Return ONLY the review text, nothing else.`;

      const review = await this.callGeminiApi(prompt);
      return review.trim();
    } catch (error) {
      logger.error('Error generating personal review:', error);
      return 'Keep recording your reflections to unlock personalized insights about your journey.';
    }
  }

  /**
   * Main function: Analyze transcript and update activity tracker
   * Implements the 3-step process
   */
  async analyzeAndTrackActivities(
    audioLogId: string,
    userId: string,
    transcript: string,
    title?: string
  ): Promise<void> {
    try {
      const { ActivityTracker } = await import('../models/ActivityTracker');

      // STEP 1: Extract activities from transcript
      logger.info(`Step 1: Extracting activities from transcript for log ${audioLogId}`);
      const extractedActivities = await this.extractActivities(transcript);

      // Check if we got valid activities
      if (extractedActivities.length === 1 && extractedActivities[0]?.activity === 'N/A') {
        logger.debug('No activities detected in transcript');
      }

      // STEP 2: Classify activities into categories
      logger.info(`Step 2: Classifying ${extractedActivities.length} activities`);
      const { categoryPoints, classificationDetails } = await this.classifyActivities(extractedActivities);

      // Find or create activity tracker for user
      let tracker = await ActivityTracker.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      });

      if (!tracker) {
        tracker = new ActivityTracker({
          userId: new mongoose.Types.ObjectId(userId),
          counts: { growth: 0, health: 0, work: 0, consumption: 0, other: 0 },
          recentLogs: [],
        });
      }

      // Add new log entry with full details
      const logEntry = {
        logId: new mongoose.Types.ObjectId(audioLogId),
        title,
        timestamp: new Date(),
        extractedActivities,
        classificationDetails,
        categoryPoints,
      };

      // Add to recent logs (keep last 20)
      tracker.recentLogs.push(logEntry);
      if (tracker.recentLogs.length > 20) {
        tracker.recentLogs = tracker.recentLogs.slice(-20);
      }

      // Recalculate total counts from all recent logs
      const counts = { growth: 0, health: 0, work: 0, consumption: 0, other: 0 };
      for (const log of tracker.recentLogs) {
        if (log.categoryPoints) {
          counts.growth += log.categoryPoints.growth || 0;
          counts.health += log.categoryPoints.health || 0;
          counts.work += log.categoryPoints.work || 0;
          counts.consumption += log.categoryPoints.consumption || 0;
          counts.other += log.categoryPoints.other || 0;
        }
      }
      tracker.counts = counts;

      await tracker.save();
      logger.info(`Activity tracker updated for user ${userId}:`, counts);
    } catch (error) {
      logger.error('Error tracking activities:', error);
      // Don't throw - activity tracking failure shouldn't break the main flow
    }
  }

  /**
   * Generate a fresh review based on activity patterns
   * @param userId - User ID
   */
  async generateActivityReview(userId: string): Promise<string> {
    try {
      const { ActivityTracker } = await import('../models/ActivityTracker');

      const tracker = await ActivityTracker.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      });

      if (!tracker || tracker.recentLogs.length === 0) {
        return 'Start recording your daily reflections to get personalized insights about your life patterns and growth trajectory.';
      }

      // STEP 3: Generate personal review based on aggregated counts
      logger.info(`Step 3: Generating personal review for user ${userId}`);
      const review = await this.generatePersonalReview(tracker.counts);

      // Update tracker with new review
      tracker.lastReview = review;
      tracker.lastReviewAt = new Date();
      await tracker.save();

      return review;
    } catch (error) {
      logger.error('Error generating activity review:', error);
      return 'Keep recording your reflections to unlock personalized insights about your journey.';
    }
  }

  /**
   * Get activity summary for a user
   * @param userId - User ID
   */
  async getActivitySummary(userId: string): Promise<{
    counts: { growth: number; health: number; work: number; consumption: number; other: number };
    recentLogs: {
      title?: string;
      timestamp: Date;
      extractedActivities: { activity: string; context: string }[];
      classificationDetails: { activity: string; category: string; points: number; reasoning: string }[];
      categoryPoints: { growth: number; health: number; work: number; consumption: number; other: number };
    }[];
    review: string;
    totalLogs: number;
  } | null> {
    try {
      const { ActivityTracker } = await import('../models/ActivityTracker');

      const tracker = await ActivityTracker.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      });

      if (!tracker) {
        return null;
      }

      // Generate fresh review if needed (older than 1 hour or doesn't exist)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      let review = tracker.lastReview || '';

      if (!tracker.lastReview || !tracker.lastReviewAt || tracker.lastReviewAt < oneHourAgo) {
        review = await this.generateActivityReview(userId);
      }

      return {
        counts: tracker.counts,
        recentLogs: tracker.recentLogs.map(log => ({
          title: log.title,
          timestamp: log.timestamp,
          extractedActivities: log.extractedActivities || [],
          classificationDetails: log.classificationDetails || [],
          categoryPoints: log.categoryPoints || { growth: 0, health: 0, work: 0, consumption: 0, other: 0 },
        })),
        review,
        totalLogs: tracker.recentLogs.length,
      };
    } catch (error) {
      logger.error('Error getting activity summary:', error);
      return null;
    }
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
        throw new Error(`Eleven Labs API error: ${response.status}`);
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
   */
  private parseJsonResponse<T>(text: string): T {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {
        logger.warn('Failed to parse JSON from AI response');
      }
    }
    return {} as T;
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

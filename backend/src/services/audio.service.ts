import { AudioLog, IAudioLog } from '../models/AudioLog';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

/**
 * Audio upload result interface
 */
export interface AudioUploadResult {
  audioLog: IAudioLog;
  transcript: string;
  duration?: number;
}

/**
 * Media API response interface
 */
interface MediaApiResponse {
  transcript: string;
  duration?: number;
  language?: string;
  confidence?: number;
}

/**
 * Audio Service
 * Handles audio file uploads and transcription via Media API
 */
export class AudioService {
  private readonly mediaApiUrl: string;
  private readonly mediaApiKey: string;

  constructor() {
    this.mediaApiUrl = process.env.OND_MEDIA_URL || 'https://api.media.example.com';
    this.mediaApiKey = process.env.OND_MEDIA_KEY || '';
  }

  /**
   * Process an audio upload
   * @param userId - User's MongoDB ObjectId
   * @param audioBuffer - Audio file buffer
   * @param mimeType - Audio MIME type
   * @param filename - Original filename
   */
  async processAudioUpload(
    userId: string,
    audioBuffer: Buffer,
    mimeType: string,
    filename?: string
  ): Promise<AudioUploadResult> {
    try {
      logger.info(`Processing audio upload for user ${userId}`, {
        mimeType,
        filename,
        size: audioBuffer.length,
      });

      // Call Media API for transcription
      const transcriptionResult = await this.transcribeAudio(audioBuffer, mimeType);

      // Upload audio to storage (optional - implement based on your storage solution)
      const audioUrl = await this.uploadToStorage(audioBuffer, mimeType, filename);

      // Create audio log entry
      const audioLog = await AudioLog.create({
        userId: new mongoose.Types.ObjectId(userId),
        transcript: transcriptionResult.transcript,
        timestamp: new Date(),
        duration: transcriptionResult.duration,
        audioUrl,
        metadata: {
          originalFilename: filename,
          mimeType,
          size: audioBuffer.length,
          language: transcriptionResult.language,
          confidence: transcriptionResult.confidence,
        },
      });

      logger.info(`Audio log created: ${audioLog._id}`);

      return {
        audioLog,
        transcript: transcriptionResult.transcript,
        duration: transcriptionResult.duration,
      };
    } catch (error) {
      logger.error('Error processing audio upload:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio using Media API
   * @param audioBuffer - Audio file buffer
   * @param mimeType - Audio MIME type
   */
  private async transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string
  ): Promise<MediaApiResponse> {
    try {
      // Create form data for the API request
      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: mimeType });
      formData.append('audio', blob, 'audio.webm');

      const response = await fetch(`${this.mediaApiUrl}/v1/transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.mediaApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Media API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as MediaApiResponse;

      return {
        transcript: result.transcript || '',
        duration: result.duration,
        language: result.language,
        confidence: result.confidence,
      };
    } catch (error) {
      logger.error('Transcription API error:', error);
      
      // Return placeholder for development/testing
      if (process.env.NODE_ENV === 'development' && !this.mediaApiKey) {
        logger.warn('Using mock transcription in development mode');
        return {
          transcript: '[Mock transcription - configure OND_MEDIA_KEY for real transcription]',
          duration: 0,
        };
      }
      
      throw error;
    }
  }

  /**
   * Upload audio file to cloud storage
   * @param audioBuffer - Audio file buffer
   * @param mimeType - Audio MIME type
   * @param filename - Original filename
   */
  private async uploadToStorage(
    _audioBuffer: Buffer,
    _mimeType: string,
    _filename?: string
  ): Promise<string | undefined> {
    // Implement based on your storage solution (Cloudinary, S3, etc.)
    // For now, return undefined as audio storage is optional
    
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    
    if (!cloudinaryUrl) {
      logger.debug('CLOUDINARY_URL not configured, skipping audio storage');
      return undefined;
    }

    // TODO: Implement Cloudinary upload
    // const cloudinary = require('cloudinary').v2;
    // cloudinary.config({ secure: true });
    // const result = await cloudinary.uploader.upload_stream(...);
    
    return undefined;
  }

  /**
   * Get audio logs for a user
   * @param userId - User's MongoDB ObjectId
   * @param options - Query options
   */
  async getAudioLogs(
    userId: string,
    options: {
      limit?: number;
      skip?: number;
      startDate?: Date;
      endDate?: Date;
      category?: string;
    } = {}
  ): Promise<{ logs: IAudioLog[]; total: number }> {
    const { limit = 50, skip = 0, startDate, endDate, category } = options;

    // Build query
    const query: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) (query.timestamp as Record<string, Date>).$gte = startDate;
      if (endDate) (query.timestamp as Record<string, Date>).$lte = endDate;
    }

    if (category) {
      query.category = category;
    }

    const [logs, total] = await Promise.all([
      AudioLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      AudioLog.countDocuments(query),
    ]);

    return { logs, total };
  }

  /**
   * Delete an audio log
   * @param logId - Audio log ID
   * @param userId - User ID (for authorization check)
   */
  async deleteAudioLog(logId: string, userId: string): Promise<boolean> {
    const result = await AudioLog.deleteOne({
      _id: new mongoose.Types.ObjectId(logId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    return result.deletedCount > 0;
  }
}

// Export singleton instance
export const audioService = new AudioService();

export default audioService;

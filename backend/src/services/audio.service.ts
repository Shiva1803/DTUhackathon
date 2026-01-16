import axios, { AxiosError } from 'axios';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { AudioLog, IAudioLog } from '../models/AudioLog';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

/**
 * Configure Cloudinary from environment
 * CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
 */
const CLOUDINARY_URL = process.env.CLOUDINARY_URL;
if (CLOUDINARY_URL) {
  // Cloudinary auto-configures from CLOUDINARY_URL env var
  cloudinary.config({ secure: true });
  logger.info('Cloudinary configured successfully');
} else {
  logger.warn('CLOUDINARY_URL not configured - audio storage will be disabled');
}

/**
 * OnDemand Services API configuration
 * Endpoint: POST https://api.on-demand.io/execute/speech_to_text
 */
const OND_API_KEY = process.env.OND_MEDIA_KEY || '';

/**
 * Audio upload result interface
 */
export interface AudioUploadResult {
  audioLog: IAudioLog;
  transcript: string;
  duration?: number;
  audioUrl?: string;
}

/**
 * Cloudinary upload result
 */
interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  duration?: number;
  format: string;
  bytes: number;
}

/**
 * Audio Service
 * Handles audio file uploads to Cloudinary and transcription via OnDemand Services API
 */
export class AudioService {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = OND_API_KEY;

    if (!this.apiKey) {
      logger.warn('OND_MEDIA_KEY not configured - transcription will use fallback');
    }
  }

  /**
   * Process an audio upload: upload to Cloudinary, transcribe, and save
   * @param userId - User's MongoDB ObjectId
   * @param audioBuffer - Audio file buffer
   * @param mimeType - Audio MIME type
   * @param filename - Original filename
   * @param title - Optional user-provided title
   */
  async processAudioUpload(
    userId: string,
    audioBuffer: Buffer,
    mimeType: string,
    filename?: string,
    title?: string
  ): Promise<AudioUploadResult> {
    try {
      logger.info(`Processing audio upload for user ${userId}`, {
        mimeType,
        filename,
        size: audioBuffer.length,
      });

      // Step 1: Upload to Cloudinary
      let audioUrl: string | undefined;
      let cloudinaryResult: CloudinaryUploadResult | undefined;

      if (CLOUDINARY_URL) {
        cloudinaryResult = await this.uploadToCloudinary(audioBuffer, mimeType, filename);
        audioUrl = cloudinaryResult.secureUrl;
        logger.info(`Audio uploaded to Cloudinary: ${cloudinaryResult.publicId}`);
      }

      // Step 2: Transcribe audio using OnDemand API (requires Cloudinary URL)
      let transcript: string;
      
      if (audioUrl && this.apiKey) {
        const transcriptionResult = await this.transcribeAudioFromUrl(audioUrl);
        transcript = transcriptionResult.transcript;
      } else if (!this.apiKey) {
        logger.warn('Using mock transcription - OND_MEDIA_KEY not configured');
        transcript = '[Mock transcription - Configure OND_MEDIA_KEY for real transcription] Today I worked on my project and made good progress.';
      } else {
        transcript = '[Audio uploaded but transcription requires Cloudinary URL]';
      }
      
      const duration = cloudinaryResult?.duration;

      // Step 3: Create audio log entry
      const audioLog = await AudioLog.create({
        userId: new mongoose.Types.ObjectId(userId),
        transcript,
        title: title?.trim() || undefined, // Use user-provided title if available
        timestamp: new Date(),
        duration,
        audioUrl,
        metadata: {
          originalFilename: filename,
          mimeType,
          size: audioBuffer.length,
          cloudinaryPublicId: cloudinaryResult?.publicId,
        },
      });

      logger.info(`Audio log created: ${audioLog._id}`);

      return {
        audioLog,
        transcript,
        duration,
        audioUrl,
      };
    } catch (error) {
      logger.error('Error processing audio upload:', error);
      throw error;
    }
  }

  /**
   * Upload audio file to Cloudinary
   * @param audioBuffer - Audio file buffer
   * @param mimeType - Audio MIME type
   * @param filename - Original filename
   */
  private async uploadToCloudinary(
    audioBuffer: Buffer,
    mimeType: string,
    filename?: string
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: 'video' as const, // Cloudinary uses 'video' for audio files
        folder: 'audio_logs',
        public_id: filename ? filename.replace(/\.[^/.]+$/, '') : undefined,
        format: this.getFormatFromMimeType(mimeType),
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result: UploadApiResponse | undefined) => {
          if (error) {
            logger.error('Cloudinary upload error:', error);
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
            return;
          }

          if (!result) {
            reject(new Error('Cloudinary upload returned no result'));
            return;
          }

          resolve({
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            duration: result.duration,
            format: result.format,
            bytes: result.bytes,
          });
        }
      );

      uploadStream.end(audioBuffer);
    });
  }

  /**
   * Transcribe audio using OnDemand Services API
   * Endpoint: POST https://api.on-demand.io/services/v1/public/service/execute/speech_to_text
   * @param audioUrl - Public URL of the audio file (from Cloudinary)
   */
  private async transcribeAudioFromUrl(
    audioUrl: string
  ): Promise<{ transcript: string }> {
    try {
      logger.info('Calling OnDemand speech_to_text API', { audioUrl });
      
      const response = await axios.post<{
        message: string;
        data: { text: string };
      }>(
        'https://api.on-demand.io/services/v1/public/service/execute/speech_to_text',
        {
          audioUrl: audioUrl,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.apiKey,
          },
          timeout: 120000, // 2 minute timeout for transcription
        }
      );

      const transcript = response.data?.data?.text || '';
      
      if (!transcript) {
        logger.warn('OnDemand API returned empty transcript');
        return {
          transcript: '[Audio could not be transcribed - please try again with clearer audio]',
        };
      }

      logger.info('Audio transcribed successfully via OnDemand API');
      return {
        transcript: transcript.trim(),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string; error?: string; errorCode?: string }>;
        const status = axiosError.response?.status;
        const errorMsg = axiosError.response?.data?.message || axiosError.response?.data?.error || axiosError.message;
        const errorCode = axiosError.response?.data?.errorCode;
        
        logger.error('OnDemand transcription error:', {
          status,
          message: errorMsg,
          errorCode,
        });
        
        if (errorCode === 'invalid_request' && errorMsg?.includes('subscribe')) {
          throw new Error('Speech-to-text service not subscribed. Please subscribe in OnDemand dashboard.');
        } else if (status === 400) {
          throw new Error('Invalid audio URL or format. Please try recording again.');
        } else if (status === 401) {
          throw new Error('Transcription service authentication failed. Check API key.');
        } else {
          throw new Error(`Transcription failed: ${errorMsg}`);
        }
      }
      
      logger.error('Transcription error:', error);
      throw new Error('Transcription failed. Please try again.');
    }
  }

  /**
   * Get file format from MIME type
   */
  private getFormatFromMimeType(mimeType: string): string {
    const mimeToFormat: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'audio/flac': 'flac',
      'audio/m4a': 'm4a',
      'audio/x-m4a': 'm4a',
      'audio/mp4': 'm4a',
    };
    return mimeToFormat[mimeType] || 'webm';
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

    interface QueryType {
      userId: mongoose.Types.ObjectId;
      timestamp?: { $gte?: Date; $lte?: Date };
      category?: string;
    }

    const query: QueryType = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
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
   * Get a specific audio log
   * @param logId - Audio log ID
   * @param userId - User ID (for authorization)
   */
  async getAudioLog(logId: string, userId: string): Promise<IAudioLog | null> {
    return AudioLog.findOne({
      _id: new mongoose.Types.ObjectId(logId),
      userId: new mongoose.Types.ObjectId(userId),
    });
  }

  /**
   * Delete an audio log (and optionally the Cloudinary file)
   * @param logId - Audio log ID
   * @param userId - User ID (for authorization)
   */
  async deleteAudioLog(logId: string, userId: string): Promise<boolean> {
    const log = await AudioLog.findOne({
      _id: new mongoose.Types.ObjectId(logId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!log) {
      return false;
    }

    // Delete from Cloudinary if we have a public ID
    const publicId = log.metadata?.cloudinaryPublicId as string | undefined;
    if (publicId && CLOUDINARY_URL) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        logger.debug(`Deleted Cloudinary file: ${publicId}`);
      } catch (error) {
        logger.warn(`Failed to delete Cloudinary file ${publicId}:`, error);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    await AudioLog.deleteOne({ _id: log._id });
    return true;
  }
}

// Export singleton instance
export const audioService = new AudioService();

export default audioService;

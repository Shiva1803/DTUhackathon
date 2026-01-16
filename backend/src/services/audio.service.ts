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
 * OnDemand Media API configuration
 */
const OND_MEDIA_API_URL = process.env.OND_MEDIA_URL || 'https://api.on-demand.io/media/v1';
const OND_MEDIA_KEY = process.env.OND_MEDIA_KEY || '';

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
 * OnDemand Media API transcription response
 */
interface OnDemandTranscriptionResponse {
  id: string;
  status: 'completed' | 'processing' | 'failed';
  transcript?: string;
  duration?: number;
  language?: string;
  confidence?: number;
  error?: string;
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
 * Handles audio file uploads to Cloudinary and transcription via OnDemand Media API
 */
export class AudioService {
  private readonly mediaApiUrl: string;
  private readonly mediaApiKey: string;

  constructor() {
    this.mediaApiUrl = OND_MEDIA_API_URL;
    this.mediaApiKey = OND_MEDIA_KEY;

    if (!this.mediaApiKey) {
      logger.warn('OND_MEDIA_KEY not configured - transcription will use fallback');
    }
  }

  /**
   * Process an audio upload: upload to Cloudinary, transcribe, and save
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

      // Step 1: Upload to Cloudinary
      let audioUrl: string | undefined;
      let cloudinaryResult: CloudinaryUploadResult | undefined;

      if (CLOUDINARY_URL) {
        cloudinaryResult = await this.uploadToCloudinary(audioBuffer, mimeType, filename);
        audioUrl = cloudinaryResult.secureUrl;
        logger.info(`Audio uploaded to Cloudinary: ${cloudinaryResult.publicId}`);
      }

      // Step 2: Transcribe audio
      let transcript: string;
      let duration: number | undefined;

      if (audioUrl) {
        // Transcribe using URL (preferred)
        const transcriptionResult = await this.transcribeAudio(audioUrl);
        transcript = transcriptionResult.transcript;
        duration = transcriptionResult.duration || cloudinaryResult?.duration;
      } else {
        // Transcribe using buffer directly (fallback)
        const transcriptionResult = await this.transcribeAudioBuffer(audioBuffer, mimeType);
        transcript = transcriptionResult.transcript;
        duration = transcriptionResult.duration;
      }

      // Step 3: Create audio log entry
      const audioLog = await AudioLog.create({
        userId: new mongoose.Types.ObjectId(userId),
        transcript,
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
   * Transcribe audio from URL using OnDemand Media API
   * @param audioUrl - Public URL of the audio file
   * @returns Transcription result
   * 
   * Note: If OnDemand Media is unavailable, fallback to Google Cloud Speech
   * can be implemented here (not implemented - placeholder for future)
   */
  async transcribeAudio(audioUrl: string): Promise<{ transcript: string; duration?: number; language?: string }> {
    if (!this.mediaApiKey) {
      logger.warn('Using mock transcription - OND_MEDIA_KEY not configured');
      // FALLBACK NOTE: Here you could implement Google Cloud Speech-to-Text
      // const speech = require('@google-cloud/speech');
      // const client = new speech.SpeechClient();
      // ... Google Cloud Speech implementation
      return {
        transcript: '[Mock transcription - Configure OND_MEDIA_KEY for real transcription]',
        duration: 0,
      };
    }

    try {
      // Start transcription job
      const startResponse = await axios.post<{ id: string; status: string }>(
        `${this.mediaApiUrl}/transcribe`,
        {
          url: audioUrl,
          language: 'en', // Auto-detect could be implemented
          model: 'whisper-1',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.mediaApiKey,
          },
          timeout: 30000,
        }
      );

      const jobId = startResponse.data.id;
      logger.debug(`Transcription job started: ${jobId}`);

      // Poll for completion (with timeout)
      const result = await this.pollTranscriptionResult(jobId, 120000); // 2 minute timeout

      return {
        transcript: result.transcript || '',
        duration: result.duration,
        language: result.language,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error?: { message?: string } }>;
        const errorMessage = axiosError.response?.data?.error?.message || axiosError.message;
        
        logger.error('OnDemand Media API error:', {
          status: axiosError.response?.status,
          message: errorMessage,
        });

        // FALLBACK NOTE: If OnDemand fails, fallback to Google Cloud Speech could be triggered here
        // For now, throw the error
        throw new Error(`Transcription API error: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Transcribe audio from buffer directly
   * @param audioBuffer - Audio file buffer
   * @param mimeType - Audio MIME type
   */
  private async transcribeAudioBuffer(
    audioBuffer: Buffer,
    mimeType: string
  ): Promise<{ transcript: string; duration?: number }> {
    if (!this.mediaApiKey) {
      logger.warn('Using mock transcription - OND_MEDIA_KEY not configured');
      return {
        transcript: '[Mock transcription - Configure OND_MEDIA_KEY for real transcription]',
      };
    }

    try {
      // Create form data for direct upload
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: `audio.${this.getFormatFromMimeType(mimeType)}`,
        contentType: mimeType,
      });
      formData.append('language', 'en');
      formData.append('model', 'whisper-1');

      const response = await axios.post<OnDemandTranscriptionResponse>(
        `${this.mediaApiUrl}/transcribe/file`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'apikey': this.mediaApiKey,
          },
          timeout: 120000, // 2 minute timeout for upload + transcription
        }
      );

      return {
        transcript: response.data.transcript || '',
        duration: response.data.duration,
      };
    } catch (error) {
      logger.error('Buffer transcription error:', error);
      throw error;
    }
  }

  /**
   * Poll for transcription result
   * @param jobId - Transcription job ID
   * @param timeoutMs - Maximum time to wait
   */
  private async pollTranscriptionResult(
    jobId: string,
    timeoutMs: number
  ): Promise<OnDemandTranscriptionResponse> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < timeoutMs) {
      const response = await axios.get<OnDemandTranscriptionResponse>(
        `${this.mediaApiUrl}/transcribe/${jobId}`,
        {
          headers: {
            'apikey': this.mediaApiKey,
          },
          timeout: 10000,
        }
      );

      if (response.data.status === 'completed') {
        return response.data;
      }

      if (response.data.status === 'failed') {
        throw new Error(`Transcription failed: ${response.data.error || 'Unknown error'}`);
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error('Transcription timed out');
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

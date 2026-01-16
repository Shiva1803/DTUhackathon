import axios, { AxiosError } from 'axios';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import fs from 'fs';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { AudioProcessingLog } from './AudioProcessingLog.model';
import { TranscriptionError } from './TranscriptionError.model';
import {
    AudioProcessingResult,
    CloudinaryUploadResult,
    TranscriptionResult,
    AudioErrorCodes,
    IAudioProcessingLog,
} from './types';

/**
 * Configure Cloudinary from environment
 * CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
 */
const CLOUDINARY_URL = process.env.CLOUDINARY_URL;
if (CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
    logger.info('[AudioProcessing] Cloudinary configured successfully');
} else {
    logger.warn('[AudioProcessing] CLOUDINARY_URL not configured - audio storage will be disabled');
}

/**
 * OnDemand Media API configuration
 */
const OND_MEDIA_API_URL = process.env.OND_MEDIA_URL || 'https://api.on-demand.io/media/v1';
const OND_MEDIA_KEY = process.env.OND_MEDIA_KEY || '';

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
 * Audio Processing Service
 * 
 * Handles audio file uploads to Cloudinary and transcription via OnDemand Media API.
 * Implements the required functions:
 * - uploadToCloudinary(filePath: string): Upload audio file and return URL
 * - transcribeAudio(url: string): Call OnDemand Media API for transcription
 */
export class AudioProcessingService {
    private readonly mediaApiUrl: string;
    private readonly mediaApiKey: string;

    constructor() {
        this.mediaApiUrl = OND_MEDIA_API_URL;
        this.mediaApiKey = OND_MEDIA_KEY;

        if (!this.mediaApiKey) {
            logger.warn('[AudioProcessing] OND_MEDIA_KEY not configured - transcription will use fallback');
        }
    }

    /**
     * Upload audio file to Cloudinary from file path
     * 
     * @param filePath - Path to the audio file on disk
     * @returns Promise<string> - The secure URL of the uploaded audio
     * @throws Error if upload fails or Cloudinary is not configured
     */
    async uploadToCloudinary(filePath: string): Promise<string> {
        if (!CLOUDINARY_URL) {
            logger.error('[AudioProcessing] Cloudinary not configured');
            throw new Error(AudioErrorCodes.CLOUDINARY_NOT_CONFIGURED);
        }

        // Verify file exists
        if (!fs.existsSync(filePath)) {
            logger.error(`[AudioProcessing] File not found: ${filePath}`);
            throw new Error(AudioErrorCodes.FILE_NOT_FOUND);
        }

        try {
            logger.info(`[AudioProcessing] Uploading file to Cloudinary: ${filePath}`);

            const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
                resource_type: 'video', // Cloudinary uses 'video' for audio files
                folder: 'audio_processing_logs',
            });

            const uploadResult: CloudinaryUploadResult = {
                url: result.url,
                secureUrl: result.secure_url,
                publicId: result.public_id,
                duration: result.duration,
                format: result.format,
                bytes: result.bytes,
            };

            logger.info(`[AudioProcessing] Upload successful: ${uploadResult.publicId}`);
            return uploadResult.secureUrl;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`[AudioProcessing] Cloudinary upload failed: ${errorMessage}`);
            throw new Error(`${AudioErrorCodes.CLOUDINARY_UPLOAD_FAILED}: ${errorMessage}`);
        }
    }

    /**
     * Transcribe audio from URL using OnDemand Media API
     * 
     * @param url - Public URL of the audio file
     * @returns Promise<string> - The transcript text
     * @note If OnDemand fails, returns "No transcript" as fallback
     */
    async transcribeAudio(url: string): Promise<string> {
        if (!this.mediaApiKey) {
            logger.warn('[AudioProcessing] OND_MEDIA_KEY not configured - returning placeholder');
            return 'No transcript';
        }

        try {
            logger.info(`[AudioProcessing] Starting transcription for: ${url}`);

            // Start transcription job
            const startResponse = await axios.post<{ id: string; status: string }>(
                `${this.mediaApiUrl}/transcribe`,
                {
                    url: url,
                    language: 'en',
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
            logger.debug(`[AudioProcessing] Transcription job started: ${jobId}`);

            // Poll for completion (with 2 minute timeout)
            const result = await this.pollTranscriptionResult(jobId, 120000);

            logger.info(`[AudioProcessing] Transcription completed for job: ${jobId}`);
            return result.transcript || 'No transcript';
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError<{ error?: { message?: string } }>;
                const errorMessage = axiosError.response?.data?.error?.message || axiosError.message;

                logger.error('[AudioProcessing] OnDemand Media API error:', {
                    status: axiosError.response?.status,
                    message: errorMessage,
                });
            } else {
                logger.error('[AudioProcessing] Transcription error:', error);
            }

            // Return fallback as specified in requirements
            logger.warn('[AudioProcessing] Returning fallback transcript due to error');
            return 'No transcript';
        }
    }

    /**
     * Full transcription result with metadata
     * @param url - Public URL of the audio file
     */
    async transcribeAudioWithMetadata(url: string): Promise<TranscriptionResult> {
        if (!this.mediaApiKey) {
            return {
                transcript: 'No transcript',
                duration: 0,
            };
        }

        try {
            const startResponse = await axios.post<{ id: string; status: string }>(
                `${this.mediaApiUrl}/transcribe`,
                {
                    url: url,
                    language: 'en',
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
            const result = await this.pollTranscriptionResult(jobId, 120000);

            return {
                transcript: result.transcript || 'No transcript',
                duration: result.duration,
                language: result.language,
                confidence: result.confidence,
            };
        } catch (error) {
            logger.error('[AudioProcessing] Transcription with metadata error:', error);
            return {
                transcript: 'No transcript',
            };
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

        throw new Error(AudioErrorCodes.TRANSCRIPTION_TIMEOUT);
    }

    /**
     * Process audio file: upload, transcribe, and save to database
     * 
     * @param userId - User's MongoDB ObjectId
     * @param filePath - Path to the audio file
     * @returns AudioProcessingResult with success/failure status
     */
    async processAndSaveAudio(userId: string, filePath: string): Promise<AudioProcessingResult> {
        let audioUrl: string | undefined;

        try {
            // Step 1: Upload to Cloudinary
            audioUrl = await this.uploadToCloudinary(filePath);
            logger.info(`[AudioProcessing] Audio uploaded: ${audioUrl}`);

            // Step 2: Transcribe
            const transcriptionResult = await this.transcribeAudioWithMetadata(audioUrl);
            const transcript = transcriptionResult.transcript;

            // Step 3: Save to database
            const audioLog = await AudioProcessingLog.create({
                userId: new mongoose.Types.ObjectId(userId),
                transcript,
                timestamp: new Date(),
                audioUrl,
                duration: transcriptionResult.duration,
                status: 'success',
                metadata: {
                    filePath,
                    language: transcriptionResult.language,
                    confidence: transcriptionResult.confidence,
                },
            });

            logger.info(`[AudioProcessing] Audio log created: ${audioLog._id}`);

            return {
                success: true,
                audioLogId: audioLog._id.toString(),
                transcript,
                audioUrl,
                duration: transcriptionResult.duration,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorCode = this.extractErrorCode(errorMessage);

            logger.error(`[AudioProcessing] Processing failed: ${errorMessage}`);

            // Log the error to database
            await this.logTranscriptionError(userId, errorCode, errorMessage, filePath, audioUrl);

            return {
                success: false,
                audioUrl,
                error: {
                    code: errorCode,
                    message: errorMessage,
                },
            };
        }
    }

    /**
     * Log a transcription error to the database
     */
    private async logTranscriptionError(
        userId: string,
        errorCode: string,
        errorMessage: string,
        filePath?: string,
        audioUrl?: string
    ): Promise<void> {
        try {
            await TranscriptionError.create({
                userId: new mongoose.Types.ObjectId(userId),
                audioUrl,
                filePath,
                errorCode,
                errorMessage,
                timestamp: new Date(),
            });
            logger.info('[AudioProcessing] Transcription error logged to database');
        } catch (dbError) {
            logger.error('[AudioProcessing] Failed to log error to database:', dbError);
        }
    }

    /**
     * Extract error code from error message
     */
    private extractErrorCode(errorMessage: string): string {
        for (const code of Object.values(AudioErrorCodes)) {
            if (errorMessage.includes(code)) {
                return code;
            }
        }
        return 'UNKNOWN_ERROR';
    }

    /**
     * Get audio logs for a user
     */
    async getAudioLogs(
        userId: string,
        options: {
            limit?: number;
            skip?: number;
            startDate?: Date;
            endDate?: Date;
            status?: 'success' | 'failed';
        } = {}
    ): Promise<{ logs: IAudioProcessingLog[]; total: number }> {
        const { limit = 50, skip = 0, startDate, endDate, status } = options;

        interface QueryType {
            userId: mongoose.Types.ObjectId;
            timestamp?: { $gte?: Date; $lte?: Date };
            status?: string;
        }

        const query: QueryType = {
            userId: new mongoose.Types.ObjectId(userId),
        };

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = startDate;
            if (endDate) query.timestamp.$lte = endDate;
        }

        if (status) {
            query.status = status;
        }

        const [logs, total] = await Promise.all([
            AudioProcessingLog.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            AudioProcessingLog.countDocuments(query),
        ]);

        return { logs, total };
    }

    /**
     * Get a specific audio log by ID
     */
    async getAudioLog(logId: string, userId: string): Promise<IAudioProcessingLog | null> {
        return AudioProcessingLog.findOne({
            _id: new mongoose.Types.ObjectId(logId),
            userId: new mongoose.Types.ObjectId(userId),
        });
    }

    /**
     * Delete an audio log and its Cloudinary file
     */
    async deleteAudioLog(logId: string, userId: string): Promise<boolean> {
        const log = await AudioProcessingLog.findOne({
            _id: new mongoose.Types.ObjectId(logId),
            userId: new mongoose.Types.ObjectId(userId),
        });

        if (!log) {
            return false;
        }

        // Delete from Cloudinary if we have a URL
        if (log.audioUrl && CLOUDINARY_URL) {
            try {
                // Extract public ID from URL
                const urlParts = log.audioUrl.split('/');
                const publicIdWithExt = urlParts.slice(-2).join('/').replace('audio_processing_logs/', '');
                const publicId = `audio_processing_logs/${publicIdWithExt.replace(/\.[^/.]+$/, '')}`;

                await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
                logger.debug(`[AudioProcessing] Deleted Cloudinary file: ${publicId}`);
            } catch (error) {
                logger.warn('[AudioProcessing] Failed to delete Cloudinary file:', error);
            }
        }

        await AudioProcessingLog.deleteOne({ _id: log._id });
        return true;
    }
}

// Export singleton instance
export const audioProcessingService = new AudioProcessingService();

export default audioProcessingService;

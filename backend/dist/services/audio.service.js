"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioService = exports.AudioService = void 0;
const axios_1 = __importDefault(require("axios"));
const cloudinary_1 = require("cloudinary");
const AudioLog_1 = require("../models/AudioLog");
const logger_1 = require("../utils/logger");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Configure Cloudinary from environment
 * CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
 */
const CLOUDINARY_URL = process.env.CLOUDINARY_URL;
if (CLOUDINARY_URL) {
    // Cloudinary auto-configures from CLOUDINARY_URL env var
    cloudinary_1.v2.config({ secure: true });
    logger_1.logger.info('Cloudinary configured successfully');
}
else {
    logger_1.logger.warn('CLOUDINARY_URL not configured - audio storage will be disabled');
}
/**
 * OnDemand Services API configuration
 * Endpoint: POST https://api.on-demand.io/execute/speech_to_text
 */
const OND_API_KEY = process.env.OND_MEDIA_KEY || '';
/**
 * Audio Service
 * Handles audio file uploads to Cloudinary and transcription via OnDemand Services API
 */
class AudioService {
    apiKey;
    constructor() {
        this.apiKey = OND_API_KEY;
        if (!this.apiKey) {
            logger_1.logger.warn('OND_MEDIA_KEY not configured - transcription will use fallback');
        }
    }
    /**
     * Process an audio upload: upload to Cloudinary, transcribe, and save
     * @param userId - User's MongoDB ObjectId
     * @param audioBuffer - Audio file buffer
     * @param mimeType - Audio MIME type
     * @param filename - Original filename
     */
    async processAudioUpload(userId, audioBuffer, mimeType, filename) {
        try {
            logger_1.logger.info(`Processing audio upload for user ${userId}`, {
                mimeType,
                filename,
                size: audioBuffer.length,
            });
            // Step 1: Upload to Cloudinary
            let audioUrl;
            let cloudinaryResult;
            if (CLOUDINARY_URL) {
                cloudinaryResult = await this.uploadToCloudinary(audioBuffer, mimeType, filename);
                audioUrl = cloudinaryResult.secureUrl;
                logger_1.logger.info(`Audio uploaded to Cloudinary: ${cloudinaryResult.publicId}`);
            }
            // Step 2: Transcribe audio using OnDemand API (requires Cloudinary URL)
            let transcript;
            if (audioUrl && this.apiKey) {
                const transcriptionResult = await this.transcribeAudioFromUrl(audioUrl);
                transcript = transcriptionResult.transcript;
            }
            else if (!this.apiKey) {
                logger_1.logger.warn('Using mock transcription - OND_MEDIA_KEY not configured');
                transcript = '[Mock transcription - Configure OND_MEDIA_KEY for real transcription] Today I worked on my project and made good progress.';
            }
            else {
                transcript = '[Audio uploaded but transcription requires Cloudinary URL]';
            }
            const duration = cloudinaryResult?.duration;
            // Step 3: Create audio log entry
            const audioLog = await AudioLog_1.AudioLog.create({
                userId: new mongoose_1.default.Types.ObjectId(userId),
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
            logger_1.logger.info(`Audio log created: ${audioLog._id}`);
            return {
                audioLog,
                transcript,
                duration,
                audioUrl,
            };
        }
        catch (error) {
            logger_1.logger.error('Error processing audio upload:', error);
            throw error;
        }
    }
    /**
     * Upload audio file to Cloudinary
     * @param audioBuffer - Audio file buffer
     * @param mimeType - Audio MIME type
     * @param filename - Original filename
     */
    async uploadToCloudinary(audioBuffer, mimeType, filename) {
        return new Promise((resolve, reject) => {
            const uploadOptions = {
                resource_type: 'video', // Cloudinary uses 'video' for audio files
                folder: 'audio_logs',
                public_id: filename ? filename.replace(/\.[^/.]+$/, '') : undefined,
                format: this.getFormatFromMimeType(mimeType),
            };
            const uploadStream = cloudinary_1.v2.uploader.upload_stream(uploadOptions, (error, result) => {
                if (error) {
                    logger_1.logger.error('Cloudinary upload error:', error);
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
            });
            uploadStream.end(audioBuffer);
        });
    }
    /**
     * Transcribe audio using OnDemand Services API
     * Endpoint: POST https://api.on-demand.io/services/v1/public/service/execute/speech_to_text
     * @param audioUrl - Public URL of the audio file (from Cloudinary)
     */
    async transcribeAudioFromUrl(audioUrl) {
        try {
            logger_1.logger.info('Calling OnDemand speech_to_text API', { audioUrl });
            const response = await axios_1.default.post('https://api.on-demand.io/services/v1/public/service/execute/speech_to_text', {
                audioUrl: audioUrl,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.apiKey,
                },
                timeout: 120000, // 2 minute timeout for transcription
            });
            const transcript = response.data?.data?.text || '';
            if (!transcript) {
                logger_1.logger.warn('OnDemand API returned empty transcript');
                return {
                    transcript: '[Audio could not be transcribed - please try again with clearer audio]',
                };
            }
            logger_1.logger.info('Audio transcribed successfully via OnDemand API');
            return {
                transcript: transcript.trim(),
            };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const axiosError = error;
                const status = axiosError.response?.status;
                const errorMsg = axiosError.response?.data?.message || axiosError.response?.data?.error || axiosError.message;
                const errorCode = axiosError.response?.data?.errorCode;
                logger_1.logger.error('OnDemand transcription error:', {
                    status,
                    message: errorMsg,
                    errorCode,
                });
                if (errorCode === 'invalid_request' && errorMsg?.includes('subscribe')) {
                    throw new Error('Speech-to-text service not subscribed. Please subscribe in OnDemand dashboard.');
                }
                else if (status === 400) {
                    throw new Error('Invalid audio URL or format. Please try recording again.');
                }
                else if (status === 401) {
                    throw new Error('Transcription service authentication failed. Check API key.');
                }
                else {
                    throw new Error(`Transcription failed: ${errorMsg}`);
                }
            }
            logger_1.logger.error('Transcription error:', error);
            throw new Error('Transcription failed. Please try again.');
        }
    }
    /**
     * Get file format from MIME type
     */
    getFormatFromMimeType(mimeType) {
        const mimeToFormat = {
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
    async getAudioLogs(userId, options = {}) {
        const { limit = 50, skip = 0, startDate, endDate, category } = options;
        const query = {
            userId: new mongoose_1.default.Types.ObjectId(userId),
        };
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate)
                query.timestamp.$gte = startDate;
            if (endDate)
                query.timestamp.$lte = endDate;
        }
        if (category) {
            query.category = category;
        }
        const [logs, total] = await Promise.all([
            AudioLog_1.AudioLog.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            AudioLog_1.AudioLog.countDocuments(query),
        ]);
        return { logs, total };
    }
    /**
     * Get a specific audio log
     * @param logId - Audio log ID
     * @param userId - User ID (for authorization)
     */
    async getAudioLog(logId, userId) {
        return AudioLog_1.AudioLog.findOne({
            _id: new mongoose_1.default.Types.ObjectId(logId),
            userId: new mongoose_1.default.Types.ObjectId(userId),
        });
    }
    /**
     * Delete an audio log (and optionally the Cloudinary file)
     * @param logId - Audio log ID
     * @param userId - User ID (for authorization)
     */
    async deleteAudioLog(logId, userId) {
        const log = await AudioLog_1.AudioLog.findOne({
            _id: new mongoose_1.default.Types.ObjectId(logId),
            userId: new mongoose_1.default.Types.ObjectId(userId),
        });
        if (!log) {
            return false;
        }
        // Delete from Cloudinary if we have a public ID
        const publicId = log.metadata?.cloudinaryPublicId;
        if (publicId && CLOUDINARY_URL) {
            try {
                await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: 'video' });
                logger_1.logger.debug(`Deleted Cloudinary file: ${publicId}`);
            }
            catch (error) {
                logger_1.logger.warn(`Failed to delete Cloudinary file ${publicId}:`, error);
                // Continue with database deletion even if Cloudinary fails
            }
        }
        await AudioLog_1.AudioLog.deleteOne({ _id: log._id });
        return true;
    }
}
exports.AudioService = AudioService;
// Export singleton instance
exports.audioService = new AudioService();
exports.default = exports.audioService;
//# sourceMappingURL=audio.service.js.map
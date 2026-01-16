import { IAudioLog } from '../models/AudioLog';
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
 * Audio Service
 * Handles audio file uploads to Cloudinary and transcription via OnDemand Services API
 */
export declare class AudioService {
    private readonly apiKey;
    constructor();
    /**
     * Process an audio upload: upload to Cloudinary, transcribe, and save
     * @param userId - User's MongoDB ObjectId
     * @param audioBuffer - Audio file buffer
     * @param mimeType - Audio MIME type
     * @param filename - Original filename
     */
    processAudioUpload(userId: string, audioBuffer: Buffer, mimeType: string, filename?: string): Promise<AudioUploadResult>;
    /**
     * Upload audio file to Cloudinary
     * @param audioBuffer - Audio file buffer
     * @param mimeType - Audio MIME type
     * @param filename - Original filename
     */
    private uploadToCloudinary;
    /**
     * Transcribe audio using OnDemand Services API
     * Endpoint: POST https://api.on-demand.io/services/v1/public/service/execute/speech_to_text
     * @param audioUrl - Public URL of the audio file (from Cloudinary)
     */
    private transcribeAudioFromUrl;
    /**
     * Get file format from MIME type
     */
    private getFormatFromMimeType;
    /**
     * Get audio logs for a user
     * @param userId - User's MongoDB ObjectId
     * @param options - Query options
     */
    getAudioLogs(userId: string, options?: {
        limit?: number;
        skip?: number;
        startDate?: Date;
        endDate?: Date;
        category?: string;
    }): Promise<{
        logs: IAudioLog[];
        total: number;
    }>;
    /**
     * Get a specific audio log
     * @param logId - Audio log ID
     * @param userId - User ID (for authorization)
     */
    getAudioLog(logId: string, userId: string): Promise<IAudioLog | null>;
    /**
     * Delete an audio log (and optionally the Cloudinary file)
     * @param logId - Audio log ID
     * @param userId - User ID (for authorization)
     */
    deleteAudioLog(logId: string, userId: string): Promise<boolean>;
}
export declare const audioService: AudioService;
export default audioService;
//# sourceMappingURL=audio.service.d.ts.map
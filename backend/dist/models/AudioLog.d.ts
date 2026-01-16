import mongoose, { Document, Model } from 'mongoose';
/**
 * AudioLog document interface
 * Represents a transcribed audio log entry
 */
export interface IAudioLog extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    transcript: string;
    timestamp: Date;
    duration?: number;
    audioUrl?: string;
    category?: string;
    sentiment?: string;
    metadata?: Record<string, unknown>;
}
/**
 * AudioLog model
 */
export declare const AudioLog: Model<IAudioLog>;
export default AudioLog;
//# sourceMappingURL=AudioLog.d.ts.map
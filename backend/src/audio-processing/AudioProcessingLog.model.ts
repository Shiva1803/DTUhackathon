import mongoose, { Schema, Model } from 'mongoose';
import { IAudioProcessingLog } from './types';

/**
 * AudioProcessingLog schema definition
 * Stores transcribed audio logs with status tracking
 */
const audioProcessingLogSchema = new Schema<IAudioProcessingLog>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        transcript: {
            type: String,
            required: [true, 'Transcript is required'],
            trim: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
        audioUrl: {
            type: String,
            trim: true,
        },
        duration: {
            type: Number,
            min: [0, 'Duration cannot be negative'],
        },
        status: {
            type: String,
            enum: ['success', 'failed'],
            default: 'success',
            index: true,
        },
        errorMessage: {
            type: String,
            trim: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            transform: (_doc, ret) => {
                const { _id, ...rest } = ret as Record<string, unknown>;
                return { id: String(_id), ...rest };
            },
        },
    }
);

// Compound indexes for common query patterns
audioProcessingLogSchema.index({ userId: 1, timestamp: -1 });
audioProcessingLogSchema.index({ userId: 1, status: 1 });

// Text index for transcript search
audioProcessingLogSchema.index({ transcript: 'text' });

/**
 * AudioProcessingLog model
 */
export const AudioProcessingLog: Model<IAudioProcessingLog> = mongoose.model<IAudioProcessingLog>(
    'AudioProcessingLog',
    audioProcessingLogSchema
);

export default AudioProcessingLog;

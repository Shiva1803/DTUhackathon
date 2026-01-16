import mongoose, { Schema, Model } from 'mongoose';
import { ITranscriptionError } from './types';

/**
 * TranscriptionError schema definition
 * Logs failed transcription attempts for debugging and monitoring
 */
const transcriptionErrorSchema = new Schema<ITranscriptionError>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        audioUrl: {
            type: String,
            trim: true,
        },
        filePath: {
            type: String,
            trim: true,
        },
        errorCode: {
            type: String,
            required: [true, 'Error code is required'],
            index: true,
        },
        errorMessage: {
            type: String,
            required: [true, 'Error message is required'],
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
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

// Compound indexes
transcriptionErrorSchema.index({ userId: 1, timestamp: -1 });
transcriptionErrorSchema.index({ errorCode: 1, timestamp: -1 });

/**
 * TranscriptionError model
 */
export const TranscriptionError: Model<ITranscriptionError> = mongoose.model<ITranscriptionError>(
    'TranscriptionError',
    transcriptionErrorSchema
);

export default TranscriptionError;

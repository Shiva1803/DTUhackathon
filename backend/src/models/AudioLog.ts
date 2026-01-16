import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * AudioLog document interface
 * Represents a transcribed audio log entry
 */
export interface IAudioLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  transcript: string;
  title?: string;            // AI-generated title summarizing the log
  timestamp: Date;
  duration?: number;         // Audio duration in seconds
  audioUrl?: string;         // URL to stored audio file
  category?: string;         // AI-categorized category
  sentiment?: string;        // AI-detected sentiment
  metadata?: Record<string, unknown>; // Additional metadata
}

/**
 * AudioLog schema definition
 */
const audioLogSchema = new Schema<IAudioLog>(
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
      minlength: [1, 'Transcript cannot be empty'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    duration: {
      type: Number,
      min: [0, 'Duration cannot be negative'],
    },
    audioUrl: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral', 'mixed'],
      default: 'neutral',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
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
audioLogSchema.index({ userId: 1, timestamp: -1 });
audioLogSchema.index({ userId: 1, category: 1 });
audioLogSchema.index({ userId: 1, createdAt: -1 });

// Text index for transcript search
audioLogSchema.index({ transcript: 'text' });

/**
 * AudioLog model
 */
export const AudioLog: Model<IAudioLog> = mongoose.model<IAudioLog>('AudioLog', audioLogSchema);

export default AudioLog;

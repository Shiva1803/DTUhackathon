import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Metrics interface for weekly summary
 */
export interface IMetrics {
  totalLogs: number;
  categoryCounts: Record<string, number>;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  averageDuration?: number;
  topKeywords?: string[];
  [key: string]: unknown; // Allow additional metrics
}

/**
 * Summary document interface
 * Represents a weekly summary for a user
 */
export interface ISummary extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  weekStart: Date;
  weekEnd: Date;
  metrics: IMetrics;
  story: string;              // AI-generated narrative summary
  ttsUrl?: string;            // Text-to-speech audio URL
  generatedAt: Date;
  isComplete: boolean;
}

/**
 * Summary schema definition
 */
const summarySchema = new Schema<ISummary>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    weekStart: {
      type: Date,
      required: [true, 'Week start date is required'],
      index: true,
    },
    weekEnd: {
      type: Date,
      required: [true, 'Week end date is required'],
    },
    metrics: {
      type: Schema.Types.Mixed,
      required: [true, 'Metrics are required'],
      default: {
        totalLogs: 0,
        categoryCounts: {},
        sentimentBreakdown: {
          positive: 0,
          negative: 0,
          neutral: 0,
          mixed: 0,
        },
      },
    },
    story: {
      type: String,
      required: [true, 'Story narrative is required'],
      trim: true,
    },
    ttsUrl: {
      type: String,
      trim: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    isComplete: {
      type: Boolean,
      default: false,
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

// Compound unique index - one summary per user per week
summarySchema.index({ userId: 1, weekStart: 1 }, { unique: true });

// Index for fetching recent summaries
summarySchema.index({ userId: 1, generatedAt: -1 });

/**
 * Get week identifier string (YYYY-WW format)
 */
summarySchema.methods.getWeekId = function (): string {
  const date = this.weekStart as Date;
  const year = date.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const weekNum = Math.ceil(
    ((date.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7
  );
  return `${year}-W${weekNum.toString().padStart(2, '0')}`;
};

/**
 * Summary model
 */
export const Summary: Model<ISummary> = mongoose.model<ISummary>('Summary', summarySchema);

export default Summary;

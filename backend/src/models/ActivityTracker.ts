import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Activity categories for tracking user behavior
 */
export interface IActivityCounts {
  growth: number;      // Learning, skill development, hackathons, coding, reading
  health: number;      // Exercise, healthy eating, sleep, meditation (can be negative for unhealthy)
  work: number;        // Professional work, meetings, projects
  consumption: number; // Entertainment, social media, reels, movies (passive consumption)
  other: number;       // Miscellaneous activities
}

/**
 * Extracted activity from transcript
 */
export interface IExtractedActivity {
  activity: string;
  context: string;
}

/**
 * Classification detail for an activity
 */
export interface IClassificationDetail {
  activity: string;
  category: string;
  points: number;
  reasoning: string;
}

/**
 * Single log entry for activity tracking
 */
export interface IActivityLogEntry {
  logId: mongoose.Types.ObjectId;
  title?: string;
  timestamp: Date;
  extractedActivities: IExtractedActivity[];  // Raw activities from transcript
  classificationDetails: IClassificationDetail[];  // How each activity was classified
  categoryPoints: IActivityCounts;  // Points for this specific log
}

/**
 * ActivityTracker document interface
 * Tracks user activities across 5 categories based on last 20 logs
 */
export interface IActivityTracker extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  counts: IActivityCounts;  // Aggregated counts from all recent logs
  recentLogs: IActivityLogEntry[];  // Last 20 logs with their activity impacts
  lastReview?: string;              // AI-generated review based on activity patterns
  lastReviewAt?: Date;
  updatedAt: Date;
}

/**
 * ActivityTracker schema definition
 */
const activityTrackerSchema = new Schema<IActivityTracker>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    counts: {
      growth: { type: Number, default: 0 },
      health: { type: Number, default: 0 },
      work: { type: Number, default: 0 },
      consumption: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    recentLogs: [{
      logId: { type: Schema.Types.ObjectId, ref: 'AudioLog', required: true },
      title: { type: String },
      timestamp: { type: Date, required: true },
      extractedActivities: [{
        activity: { type: String, required: true },
        context: { type: String, default: '' },
      }],
      classificationDetails: [{
        activity: { type: String, required: true },
        category: { type: String, required: true },
        points: { type: Number, required: true },
        reasoning: { type: String, required: true },
      }],
      categoryPoints: {
        growth: { type: Number, default: 0 },
        health: { type: Number, default: 0 },
        work: { type: Number, default: 0 },
        consumption: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
      },
    }],
    lastReview: { type: String },
    lastReviewAt: { type: Date },
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

/**
 * Recalculate total counts from recent logs
 */
activityTrackerSchema.methods.recalculateCounts = function(): void {
  const counts: IActivityCounts = {
    growth: 0,
    health: 0,
    work: 0,
    consumption: 0,
    other: 0,
  };

  for (const log of this.recentLogs) {
    if (log.categoryPoints) {
      counts.growth += log.categoryPoints.growth || 0;
      counts.health += log.categoryPoints.health || 0;
      counts.work += log.categoryPoints.work || 0;
      counts.consumption += log.categoryPoints.consumption || 0;
      counts.other += log.categoryPoints.other || 0;
    }
  }

  this.counts = counts;
};

/**
 * ActivityTracker model
 */
export const ActivityTracker: Model<IActivityTracker> = mongoose.model<IActivityTracker>(
  'ActivityTracker', 
  activityTrackerSchema
);

export default ActivityTracker;

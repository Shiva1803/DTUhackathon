import mongoose, { Document, Model } from 'mongoose';
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
    [key: string]: unknown;
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
    story: string;
    ttsUrl?: string;
    generatedAt: Date;
    isComplete: boolean;
}
/**
 * Summary model
 */
export declare const Summary: Model<ISummary>;
export default Summary;
//# sourceMappingURL=Summary.d.ts.map
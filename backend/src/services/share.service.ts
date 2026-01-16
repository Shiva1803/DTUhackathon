import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import { v2 as cloudinary } from 'cloudinary';
import { Summary, ISummary } from '../models/Summary';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

/**
 * Share card result interface
 */
export interface ShareCardResult {
    imageUrl: string;
    imageBuffer: Buffer;
    publicId: string;
}

/**
 * Share card data interface
 */
export interface ShareCardData {
    weekId: string;
    phase: string;
    totalLogs: number;
    streak: number;
    longestStreak: number;
    topCategory: string;
    sentiment: { positive: number; negative: number; neutral: number };
    userName?: string;
}

/**
 * Share Card Service
 * Generates shareable image cards with summary stats using Canvas
 */
export class ShareCardService {
    private readonly cardWidth = 600;
    private readonly cardHeight = 800;
    private readonly bgGradientStart = '#1a1a2e';
    private readonly bgGradientEnd = '#16213e';
    private readonly accentColor = '#a855f7';
    private readonly textColor = '#ffffff';
    private readonly subtextColor = '#a0a0a0';

    /**
     * Generate a share card for a weekly summary
     * @param userId - User's MongoDB ObjectId
     * @param weekId - Week identifier (YYYY-WNN)
     */
    async generateShareCard(userId: string, weekId: string): Promise<ShareCardResult> {
        try {
            // Get summary and user data
            const [summary, user] = await Promise.all([
                Summary.findOne({
                    userId: new mongoose.Types.ObjectId(userId),
                }).sort({ weekStart: -1 }),
                User.findById(userId),
            ]);

            if (!summary) {
                throw new Error('No summary found for user');
            }

            // Prepare card data
            const topCategory = this.getTopCategory(summary.metrics.categoryCounts || {});
            const cardData: ShareCardData = {
                weekId,
                phase: this.derivePhase(summary),
                totalLogs: summary.metrics.totalLogs || 0,
                streak: user?.streakCount || 0,
                longestStreak: user?.longestStreak || 0,
                topCategory,
                sentiment: {
                    positive: summary.metrics.sentimentBreakdown?.positive || 0,
                    negative: summary.metrics.sentimentBreakdown?.negative || 0,
                    neutral: summary.metrics.sentimentBreakdown?.neutral || 0,
                },
                userName: user?.name,
            };

            // Generate image
            const imageBuffer = await this.createCardImage(cardData);

            // Upload to Cloudinary
            const uploadResult = await this.uploadToCloudinary(imageBuffer, userId, weekId);

            logger.info(`Share card generated for user ${userId}, week ${weekId}`);

            return {
                imageUrl: uploadResult.secure_url,
                imageBuffer,
                publicId: uploadResult.public_id,
            };
        } catch (error) {
            logger.error('Error generating share card:', error);
            throw error;
        }
    }

    /**
     * Create the card image using Canvas
     */
    private async createCardImage(data: ShareCardData): Promise<Buffer> {
        const canvas = createCanvas(this.cardWidth, this.cardHeight);
        const ctx = canvas.getContext('2d');

        // Draw background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.cardHeight);
        gradient.addColorStop(0, this.bgGradientStart);
        gradient.addColorStop(1, this.bgGradientEnd);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.cardWidth, this.cardHeight);

        // Draw decorative accent line
        ctx.beginPath();
        ctx.strokeStyle = this.accentColor;
        ctx.lineWidth = 4;
        ctx.moveTo(50, 60);
        ctx.lineTo(150, 60);
        ctx.stroke();

        // App name
        ctx.fillStyle = this.accentColor;
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.fillText('GrowthAmp', 50, 100);

        // Week identifier
        ctx.fillStyle = this.subtextColor;
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText(`Week of ${data.weekId}`, 50, 130);

        // Phase title
        ctx.fillStyle = this.textColor;
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.fillText(`${data.phase}`, 50, 200);

        // Subtitle
        ctx.fillStyle = this.subtextColor;
        ctx.font = '18px Arial, sans-serif';
        ctx.fillText('Week in Review', 50, 230);

        // Stats section
        const statsY = 300;
        this.drawStatBox(ctx, 50, statsY, 'Logs', data.totalLogs.toString(), '📝');
        this.drawStatBox(ctx, 220, statsY, 'Streak', `${data.streak} days`, '🔥');
        this.drawStatBox(ctx, 390, statsY, 'Best', `${data.longestStreak} days`, '🏆');

        // Top category
        this.drawStatBox(ctx, 50, statsY + 130, 'Focus', data.topCategory || 'N/A', '🎯');

        // Sentiment breakdown
        const total = data.sentiment.positive + data.sentiment.negative + data.sentiment.neutral;
        if (total > 0) {
            this.drawSentimentBar(ctx, 50, statsY + 280, data.sentiment, total);
        }

        // User name (if available)
        if (data.userName) {
            ctx.fillStyle = this.subtextColor;
            ctx.font = '14px Arial, sans-serif';
            ctx.fillText(`by ${data.userName}`, 50, this.cardHeight - 50);
        }

        // Watermark
        ctx.fillStyle = this.subtextColor;
        ctx.font = '12px Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('Built with GrowthAmp 🚀', this.cardWidth - 50, this.cardHeight - 30);

        return canvas.toBuffer('image/png');
    }

    /**
     * Draw a stat box with icon, label, and value
     */
    private drawStatBox(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        label: string,
        value: string,
        emoji: string
    ): void {
        // Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(x, y, 150, 100, 12);
        ctx.fill();

        // Emoji
        ctx.font = '28px Arial, sans-serif';
        ctx.fillText(emoji, x + 15, y + 40);

        // Value
        ctx.fillStyle = this.textColor;
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(value, x + 55, y + 45);

        // Label
        ctx.fillStyle = this.subtextColor;
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText(label, x + 15, y + 75);
    }

    /**
     * Draw sentiment breakdown bar
     */
    private drawSentimentBar(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        sentiment: { positive: number; negative: number; neutral: number },
        total: number
    ): void {
        const barWidth = 500;
        const barHeight = 30;

        // Label
        ctx.fillStyle = this.subtextColor;
        ctx.font = '14px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Sentiment', x, y);

        // Bar background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(x, y + 15, barWidth, barHeight, 8);
        ctx.fill();

        // Positive segment (green)
        const positiveWidth = (sentiment.positive / total) * barWidth;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.roundRect(x, y + 15, positiveWidth, barHeight, 8);
        ctx.fill();

        // Neutral segment (gray)
        const neutralWidth = (sentiment.neutral / total) * barWidth;
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(x + positiveWidth, y + 15, neutralWidth, barHeight);

        // Labels
        ctx.fillStyle = this.textColor;
        ctx.font = '12px Arial, sans-serif';
        const positivePercent = Math.round((sentiment.positive / total) * 100);
        const negativePercent = Math.round((sentiment.negative / total) * 100);
        ctx.fillText(`😊 ${positivePercent}%`, x, y + 65);
        ctx.fillText(`😟 ${negativePercent}%`, x + barWidth - 50, y + 65);
    }

    /**
     * Upload image to Cloudinary
     */
    private async uploadToCloudinary(
        imageBuffer: Buffer,
        userId: string,
        weekId: string
    ): Promise<{ secure_url: string; public_id: string }> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'image',
                    folder: 'share_cards',
                    public_id: `${userId}_${weekId.replace('-', '_')}`,
                    overwrite: true,
                    format: 'png',
                },
                (error, result) => {
                    if (error || !result) {
                        reject(error || new Error('Upload failed'));
                        return;
                    }
                    resolve({
                        secure_url: result.secure_url,
                        public_id: result.public_id,
                    });
                }
            );
            uploadStream.end(imageBuffer);
        });
    }

    /**
     * Get top category from counts
     */
    private getTopCategory(counts: Record<string, number>): string {
        const entries = Object.entries(counts);
        if (entries.length === 0) return 'N/A';
        entries.sort((a, b) => b[1] - a[1]);
        return entries[0]?.[0] || 'N/A';
    }

    /**
     * Derive phase from summary metrics
     */
    private derivePhase(summary: ISummary): string {
        const { categoryCounts = {}, sentimentBreakdown } = summary.metrics;
        const total =
            (sentimentBreakdown?.positive || 0) +
            (sentimentBreakdown?.negative || 0) +
            (sentimentBreakdown?.neutral || 0);
        const positiveRatio = total > 0 ? (sentimentBreakdown?.positive || 0) / total : 0;
        const categories = Object.keys(categoryCounts);

        if (positiveRatio > 0.7 && categories.includes('work')) return 'Builder';
        if (categories.includes('learning')) return 'Explorer';
        if (positiveRatio > 0.5) return 'Optimizer';
        if (positiveRatio > 0.3) return 'Reflector';
        return 'Explorer';
    }
}

// Export singleton instance
export const shareCardService = new ShareCardService();

export default shareCardService;

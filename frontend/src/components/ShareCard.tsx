import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';
import { Download, Share2, Loader2, Sparkles, Flame, Trophy } from 'lucide-react';

interface ShareCardProps {
    phase: string;
    phaseConfidence: number;
    metrics: {
        totalLogs?: number;
        categoryCounts?: Record<string, number>;
        totalDuration?: number;
    };
    story?: string;
    weekId: string;
    streak?: {
        current: number;
        longest: number;
    };
}

export default function ShareCard({
    phase,
    phaseConfidence,
    metrics,
    story,
    weekId,
    streak,
}: ShareCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [showCard, setShowCard] = useState(false);

    const handleDownload = async () => {
        if (!cardRef.current) return;

        setIsCapturing(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#1f2937',
                scale: 2,
                logging: false,
                useCORS: true,
            });

            const link = document.createElement('a');
            link.download = `growthamp-${weekId}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Failed to capture share card:', error);
        } finally {
            setIsCapturing(false);
        }
    };

    const handleShare = async () => {
        if (!cardRef.current || !navigator.share) {
            handleDownload();
            return;
        }

        setIsCapturing(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#1f2937',
                scale: 2,
                logging: false,
                useCORS: true,
            });

            canvas.toBlob(async (blob) => {
                if (!blob) return;

                const file = new File([blob], `growthamp-${weekId}.png`, { type: 'image/png' });

                try {
                    await navigator.share({
                        title: 'My GrowthAmp Week',
                        text: `I'm in my ${phase} phase! Check out my weekly growth summary.`,
                        files: [file],
                    });
                } catch {
                    // User cancelled or share failed, fallback to download
                    handleDownload();
                }
            });
        } catch (error) {
            console.error('Failed to share:', error);
        } finally {
            setIsCapturing(false);
        }
    };

    const getPhaseColor = (p: string) => {
        const colors: Record<string, string> = {
            Builder: 'from-amber-500 to-orange-500',
            Explorer: 'from-cyan-500 to-blue-500',
            Optimizer: 'from-green-500 to-emerald-500',
            Reflector: 'from-purple-500 to-violet-500',
        };
        return colors[p] || 'from-purple-500 to-cyan-500';
    };

    const topCategory = metrics.categoryCounts
        ? Object.entries(metrics.categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'growth'
        : 'growth';

    const totalHours = metrics.totalDuration
        ? Math.round(metrics.totalDuration / 60)
        : 0;

    return (
        <div className="space-y-4">
            {/* Toggle Button */}
            <button
                onClick={() => setShowCard(!showCard)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
                <Share2 className="w-4 h-4" />
                {showCard ? 'Hide Share Card' : 'Create Share Card'}
            </button>

            {showCard && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    {/* Share Card - This is what gets captured */}
                    <div
                        ref={cardRef}
                        className="relative w-full max-w-md mx-auto p-6 rounded-2xl overflow-hidden"
                        style={{ backgroundColor: '#1f2937' }}
                    >
                        {/* Background gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${getPhaseColor(phase)} opacity-10`} />

                        {/* Content */}
                        <div className="relative z-10 space-y-5">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    <span className="font-bold text-white">GrowthAmp</span>
                                </div>
                                <span className="text-sm text-gray-400">{weekId}</span>
                            </div>

                            {/* Phase Badge */}
                            <div className="text-center py-4">
                                <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r ${getPhaseColor(phase)}`}>
                                    <Trophy className="w-5 h-5 text-white" />
                                    <span className="font-bold text-white text-lg">{phase}</span>
                                    <span className="text-white/80 text-sm">({phaseConfidence}%)</span>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="bg-gray-800/50 rounded-xl p-3">
                                    <div className="text-2xl font-bold text-white">{metrics.totalLogs || 0}</div>
                                    <div className="text-xs text-gray-400">Logs</div>
                                </div>
                                <div className="bg-gray-800/50 rounded-xl p-3">
                                    <div className="text-2xl font-bold text-white">{totalHours}</div>
                                    <div className="text-xs text-gray-400">Minutes</div>
                                </div>
                                <div className="bg-gray-800/50 rounded-xl p-3 flex flex-col items-center">
                                    <div className="flex items-center gap-1">
                                        <Flame className="w-4 h-4 text-orange-500" />
                                        <span className="text-2xl font-bold text-white">{streak?.current || 0}</span>
                                    </div>
                                    <div className="text-xs text-gray-400">Day Streak</div>
                                </div>
                            </div>

                            {/* Focus Area */}
                            <div className="text-center text-gray-300">
                                <span className="text-sm">Top focus: </span>
                                <span className="font-semibold capitalize text-purple-400">{topCategory}</span>
                            </div>

                            {/* Story Preview */}
                            {story && (
                                <p className="text-sm text-gray-400 italic text-center line-clamp-2">
                                    "{story.substring(0, 100)}..."
                                </p>
                            )}

                            {/* Watermark */}
                            <div className="text-center pt-2">
                                <span className="text-xs text-gray-500">Powered by OnDemand • DTU Hackathon 2026</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={handleDownload}
                            disabled={isCapturing}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium hover:from-purple-600 hover:to-cyan-600 transition-all disabled:opacity-50"
                        >
                            {isCapturing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            Download PNG
                        </button>

                        {typeof navigator.share === 'function' && (
                            <button
                                onClick={handleShare}
                                disabled={isCapturing}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-all disabled:opacity-50"
                            >
                                <Share2 className="w-4 h-4" />
                                Share
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

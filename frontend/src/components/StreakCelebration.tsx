import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Star } from 'lucide-react';

interface StreakCelebrationProps {
    streak: number;
    onClose?: () => void;
}

/**
 * StreakCelebration - Shows confetti and celebration UI for milestones
 * Triggers on: 7-day streak, 14-day streak, 30-day streak, etc.
 */
export default function StreakCelebration({ streak, onClose }: StreakCelebrationProps) {
    const [showCelebration, setShowCelebration] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    // Milestones that trigger celebration
    const isMilestone = streak > 0 && (streak === 7 || streak === 14 || streak === 30 || streak % 30 === 0);

    useEffect(() => {
        // Update window size for confetti
        const updateSize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Show celebration when milestone is reached
    useEffect(() => {
        if (isMilestone && !showCelebration) {
            // Use requestAnimationFrame to defer state update
            const frameId = requestAnimationFrame(() => {
                setShowCelebration(true);
            });
            return () => cancelAnimationFrame(frameId);
        }
    }, [isMilestone, showCelebration]);

    useEffect(() => {
        if (showCelebration) {
            // Auto-hide after 5 seconds
            const timer = setTimeout(() => {
                setShowCelebration(false);
                onClose?.();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showCelebration, onClose]);

    const getMilestoneMessage = () => {
        if (streak >= 30) return { title: '🏆 Legendary Streak!', subtitle: `${streak} days of consistency!` };
        if (streak >= 14) return { title: '🔥 Two Weeks Strong!', subtitle: '14-day streak achieved!' };
        if (streak >= 7) return { title: '⭐ Week Warrior!', subtitle: '7-day streak milestone!' };
        return { title: '🎉 Great Job!', subtitle: 'Keep up the momentum!' };
    };

    const milestone = getMilestoneMessage();

    if (!showCelebration || !isMilestone) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 pointer-events-none">
                {/* Confetti */}
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={300}
                    gravity={0.2}
                    colors={['#a855f7', '#06b6d4', '#eab308', '#ec4899', '#22c55e']}
                />

                {/* Celebration Modal */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-auto"
                    onClick={() => {
                        setShowCelebration(false);
                        onClose?.();
                    }}
                >
                    <motion.div
                        className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-sm text-center shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Icon */}
                        <motion.div
                            animate={{
                                rotate: [0, -10, 10, -10, 10, 0],
                                scale: [1, 1.1, 1, 1.1, 1]
                            }}
                            transition={{ duration: 0.5, repeat: 2 }}
                            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center"
                        >
                            {streak >= 30 ? (
                                <Trophy className="w-10 h-10 text-white" />
                            ) : streak >= 14 ? (
                                <Flame className="w-10 h-10 text-white" />
                            ) : (
                                <Star className="w-10 h-10 text-white" />
                            )}
                        </motion.div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {milestone.title}
                        </h2>
                        <p className="text-gray-400 mb-4">
                            {milestone.subtitle}
                        </p>

                        {/* Streak Display */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30">
                            <Flame className="w-5 h-5 text-orange-500" />
                            <span className="text-orange-400 font-bold">{streak} Day Streak</span>
                        </div>

                        {/* Close hint */}
                        <p className="text-xs text-gray-500 mt-6">
                            Click anywhere to continue
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

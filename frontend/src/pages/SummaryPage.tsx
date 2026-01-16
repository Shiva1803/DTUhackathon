import { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { motion } from 'framer-motion';
import { Loader2, Play, Pause, Volume2, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { getSummary, generateSummary } from '../lib/api';
import PhaseBadge from '../components/PhaseBadge';
import ShareCard from '../components/ShareCard';
import StreakCelebration from '../components/StreakCelebration';
import { AxiosError } from 'axios';

interface SummaryMetrics {
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
  totalDuration?: number;
}

interface SummaryData {
  id: string;
  weekId: string;
  weekStart: string;
  weekEnd: string;
  metrics: SummaryMetrics;
  story: string;
  ttsUrl?: string;
  generatedAt: string;
  isComplete: boolean;
  phase: string;
  phaseConfidence: number;
  streak?: {
    current: number;
    longest: number;
  };
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

/**
 * ISO 8601 week number calculation
 */
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getISOWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

/**
 * Helper to get week ID in format "YYYY-Wnn"
 */
function getWeekId(date: Date = new Date()): string {
  const year = getISOWeekYear(date);
  const week = getISOWeekNumber(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

/**
 * Helper to get start of week (Monday)
 */
function getWeekStart(): string {
  const now = new Date();
  const year = getISOWeekYear(now);
  const week = getISOWeekNumber(now);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);

  const targetMonday = new Date(mondayOfWeek1);
  targetMonday.setUTCDate(mondayOfWeek1.getUTCDate() + (week - 1) * 7);
  targetMonday.setUTCHours(0, 0, 0, 0);

  return targetMonday.toISOString();
}

const categoryEmojis: Record<string, string> = {
  health: '💪',
  work: '💼',
  personal: '🏠',
  family: '👨‍👩‍👧',
  social: '👥',
  finance: '💰',
  learning: '📚',
  other: '📝',
  uncategorized: '📋',
};

export default function SummaryPage() {
  const { getAccessTokenSilently } = useAuth0();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        }
      });
      const weekId = getWeekId();
      const response = await getSummary(token, weekId);

      // Handle the response structure
      const data = response.data?.data || response.data;
      setSummary(data);
    } catch (err) {
      console.error('Error fetching summary:', err);
      if (err instanceof AxiosError && err.response?.status === 404) {
        setError('No summary available yet. Record some logs first, then generate a summary.');
      } else {
        setError('Unable to load summary. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setGenerating(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        }
      });
      const weekStart = getWeekStart();
      await generateSummary(token, weekStart);

      // Refetch the summary
      await fetchSummary();
    } catch (err) {
      console.error('Error generating summary:', err);
      setError('Failed to generate summary. Make sure you have some logs recorded.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAudioToggle = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
          <span className="text-gray-400">Loading your summary...</span>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">{error || 'No summary available yet.'}</p>
          <p className="text-gray-500 text-sm mb-6">
            Record daily logs and then generate your weekly summary.
          </p>
          <button
            onClick={handleGenerateSummary}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium hover:from-purple-600 hover:to-cyan-600 transition-all disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Generate Summary
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const topCategories = Object.entries(summary.metrics.categoryCounts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-12">
      {/* Streak Celebration */}
      {summary.streak && (
        <StreakCelebration streak={summary.streak.current} />
      )}

      {/* Header */}
      <header className="bg-gray-800/50 border-b border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Weekly Summary</h1>
            <p className="text-gray-400 text-sm">{getWeekId()}</p>
          </div>
          <button
            onClick={handleGenerateSummary}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Regenerate</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-8"
        >
          {/* Phase Badge */}
          <motion.div variants={fadeInUp} className="flex justify-center py-6">
            <PhaseBadge phase={summary.phase} confidence={summary.phaseConfidence} />
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-purple-400">{summary.metrics.totalLogs}</p>
              <p className="text-gray-400 text-sm">Total Logs</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{summary.metrics.sentimentBreakdown?.positive || 0}</p>
              <p className="text-gray-400 text-sm">Positive</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-cyan-400">
                {summary.metrics.averageDuration ? Math.round(summary.metrics.averageDuration) : 0}s
              </p>
              <p className="text-gray-400 text-sm">Avg Duration</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-yellow-400">
                {Object.keys(summary.metrics.categoryCounts || {}).length}
              </p>
              <p className="text-gray-400 text-sm">Categories</p>
            </div>
          </motion.div>

          {/* Categories Breakdown */}
          {topCategories.length > 0 && (
            <motion.div
              variants={fadeInUp}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Top Categories
              </h2>
              <div className="space-y-3">
                {topCategories.map(([category, count]) => {
                  const total = summary.metrics.totalLogs;
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span className="text-xl">{categoryEmojis[category] || '📝'}</span>
                      <span className="capitalize text-gray-300 w-24">{category}</span>
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                        />
                      </div>
                      <span className="text-gray-400 text-sm w-12 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Keywords */}
          {summary.metrics.topKeywords && summary.metrics.topKeywords.length > 0 && (
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-2 justify-center">
              {summary.metrics.topKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm border border-purple-500/30"
                >
                  {keyword}
                </span>
              ))}
            </motion.div>
          )}

          {/* Story Section */}
          <motion.div
            variants={fadeInUp}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Your Week in Review
            </h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{summary.story}</p>
          </motion.div>

          {/* Audio Player */}
          {summary.ttsUrl && (
            <motion.div
              variants={fadeInUp}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={handleAudioToggle}
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center hover:from-purple-600 hover:to-cyan-600 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Volume2 className="w-4 h-4 text-purple-400" />
                    <span className="font-medium">Listen to your summary</span>
                  </div>
                  <p className="text-gray-400 text-sm">AI-generated voice recap</p>
                </div>
              </div>
              <audio
                ref={audioRef}
                src={summary.ttsUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </motion.div>
          )}

          {/* Share Card Integration */}
          <motion.div variants={fadeInUp} className="flex justify-center pt-4">
            <ShareCard
              phase={summary.phase}
              phaseConfidence={summary.phaseConfidence}
              metrics={summary.metrics}
              story={summary.story}
              weekId={summary.weekId}
              streak={summary.streak}
            />
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

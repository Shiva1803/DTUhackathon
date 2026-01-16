import { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { motion } from 'framer-motion';
import { Loader2, Play, Pause, Volume2, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { getSummary, generateSummary } from '../lib/api';
import PhaseBadge from '../components/PhaseBadge';
import ShareCard from '../components/ShareCard';
import StreakCelebration from '../components/StreakCelebration';
import { AxiosError } from 'axios';
import { useTheme } from '../context/ThemeContext';

interface SummaryMetrics {
  totalLogs: number;
  categoryCounts: Record<string, number>;
  sentimentBreakdown: { positive: number; negative: number; neutral: number; mixed: number };
  averageDuration?: number;
  topKeywords?: string[];
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
  streak?: { current: number; longest: number };
}

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

function getWeekId(date: Date = new Date()): string {
  return `${getISOWeekYear(date)}-W${getISOWeekNumber(date).toString().padStart(2, '0')}`;
}

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
  return targetMonday.toISOString();
}

const categoryEmojis: Record<string, string> = {
  health: '💪', work: '💼', personal: '🏠', family: '👨‍👩‍👧',
  social: '👥', finance: '💰', learning: '📚', other: '📝', uncategorized: '📋',
};

export default function SummaryPage() {
  const { getAccessTokenSilently } = useAuth0();
  const { isDark } = useTheme();
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
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE }
      });
      const response = await getSummary(token, getWeekId());
      setSummary(response.data?.data || response.data);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        setError('No summary available yet. Record some logs first.');
      } else {
        setError('Unable to load summary.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setGenerating(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE }
      });
      await generateSummary(token, getWeekStart());
      await fetchSummary();
    } catch {
      setError('Failed to generate summary.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const handleAudioToggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-500" style={{ background: isDark ? '#000000' : '#F5E6D3' }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: isDark ? '#00d4ff' : '#8B6914' }} />
          <span style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(61, 41, 20, 0.6)' }}>
            Loading summary...
          </span>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 transition-colors duration-500" style={{ background: isDark ? '#000000' : '#F5E6D3' }}>
        <div className="text-center max-w-md">
          <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(61,41,20,0.2)' }} />
          <p className="text-lg mb-2" style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(61, 41, 20, 0.6)' }}>
            {error || 'No summary available yet.'}
          </p>
          <p className="text-sm mb-8" style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(61, 41, 20, 0.5)' }}>
            Record daily logs and generate your weekly summary.
          </p>
          <motion.button
            onClick={handleGenerateSummary}
            disabled={generating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium disabled:opacity-50"
            style={{
              fontFamily: "'Inter', sans-serif",
              background: isDark 
                ? 'linear-gradient(135deg, #003040 0%, #006080 100%)'
                : 'linear-gradient(135deg, #C2986C 0%, #D4A574 100%)',
              border: isDark ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid rgba(139, 105, 20, 0.3)',
              boxShadow: isDark ? '0 0 30px rgba(0, 212, 255, 0.2)' : '0 0 30px rgba(139, 105, 20, 0.2)',
              color: '#ffffff',
            }}
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            {generating ? 'Generating...' : 'Generate Summary'}
          </motion.button>
        </div>
      </div>
    );
  }

  const topCategories = Object.entries(summary.metrics.categoryCounts || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="min-h-screen pb-12 transition-colors duration-500" style={{ background: isDark ? '#000000' : '#F5E6D3', color: isDark ? '#ffffff' : '#3D2914' }}>
      {summary.streak && <StreakCelebration streak={summary.streak.current} />}

      {/* Header */}
      <header 
        className="sticky top-16 z-30 px-4 py-4"
        style={{
          background: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(245, 230, 211, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 
              className="text-xl font-semibold"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                ...(isDark ? {
                  background: 'linear-gradient(135deg, #ffffff 0%, #80e0ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                } : {
                  color: '#3D2914',
                }),
              }}
            >
              Weekly Summary
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61, 41, 20, 0.6)', fontSize: '0.875rem' }}>
              {getWeekId()}
            </p>
          </div>
          <motion.button
            onClick={handleGenerateSummary}
            disabled={generating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl disabled:opacity-50"
            style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
              fontFamily: "'Inter', sans-serif",
              color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(61, 41, 20, 0.7)',
            }}
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="hidden sm:inline text-sm">Regenerate</span>
          </motion.button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Phase Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center py-6"
        >
          <PhaseBadge phase={summary.phase} confidence={summary.phaseConfidence} />
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { value: summary.metrics.totalLogs, label: 'Total Logs', color: isDark ? '#00d4ff' : '#8B6914' },
            { value: summary.metrics.sentimentBreakdown?.positive || 0, label: 'Positive', color: '#10b981' },
            { value: summary.metrics.averageDuration ? `${Math.round(summary.metrics.averageDuration)}s` : '0s', label: 'Avg Duration', color: isDark ? '#00d4ff' : '#8B6914' },
            { value: Object.keys(summary.metrics.categoryCounts || {}).length, label: 'Categories', color: '#f59e0b' },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 text-center"
              style={{
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <p 
                className="text-3xl font-semibold mb-1"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: stat.color }}
              >
                {stat.value}
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61, 41, 20, 0.6)', fontSize: '0.875rem' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Categories */}
        {topCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-6"
            style={{
              background: isDark 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <h2 
              className="text-lg font-semibold mb-5 flex items-center gap-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: isDark ? '#00d4ff' : '#8B6914' }} />
              Top Categories
            </h2>
            <div className="space-y-4">
              {topCategories.map(([category, count]) => {
                const percentage = summary.metrics.totalLogs > 0 
                  ? Math.round((count / summary.metrics.totalLogs) * 100) : 0;
                return (
                  <div key={category} className="flex items-center gap-3">
                    <span className="text-xl w-8">{categoryEmojis[category] || '📝'}</span>
                    <span 
                      className="capitalize w-24"
                      style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(61, 41, 20, 0.8)' }}
                    >
                      {category}
                    </span>
                    <div 
                      className="flex-1 h-2 rounded-full overflow-hidden"
                      style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)' }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ background: isDark ? 'linear-gradient(90deg, #003040, #00d4ff)' : 'linear-gradient(90deg, #C2986C, #8B6914)' }}
                      />
                    </div>
                    <span 
                      className="w-10 text-right text-sm"
                      style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61, 41, 20, 0.6)' }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Keywords */}
        {summary.metrics.topKeywords?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2 justify-center"
          >
            {summary.metrics.topKeywords.map((keyword) => (
              <span
                key={keyword}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{
                  background: isDark ? 'rgba(0, 212, 255, 0.1)' : 'rgba(139, 105, 20, 0.1)',
                  border: isDark ? '1px solid rgba(0, 212, 255, 0.2)' : '1px solid rgba(139, 105, 20, 0.2)',
                  color: isDark ? '#00d4ff' : '#8B6914',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {keyword}
              </span>
            ))}
          </motion.div>
        )}

        {/* Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-6"
          style={{
            background: isDark 
              ? 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <h2 
            className="text-xl font-semibold mb-4"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              ...(isDark ? {
                background: 'linear-gradient(135deg, #ffffff 0%, #80e0ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              } : {
                color: '#3D2914',
              }),
            }}
          >
            Your Week in Review
          </h2>
          <p 
            className="leading-relaxed whitespace-pre-line"
            style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(61, 41, 20, 0.8)' }}
          >
            {summary.story}
          </p>
        </motion.div>

        {/* Audio Player */}
        {summary.ttsUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-6"
            style={{
              background: isDark 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <div className="flex items-center gap-4">
              <motion.button
                onClick={handleAudioToggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
                style={{
                  background: isDark 
                    ? 'linear-gradient(135deg, #003040 0%, #006080 100%)'
                    : 'linear-gradient(135deg, #C2986C 0%, #D4A574 100%)',
                  boxShadow: isDark ? '0 0 30px rgba(0, 212, 255, 0.2)' : '0 0 30px rgba(139, 105, 20, 0.2)',
                }}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </motion.button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="w-4 h-4" style={{ color: isDark ? '#00d4ff' : '#8B6914' }} />
                  <span className="font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Listen to your summary
                  </span>
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61, 41, 20, 0.6)', fontSize: '0.875rem' }}>
                  AI-generated voice recap
                </p>
              </div>
            </div>
            <audio ref={audioRef} src={summary.ttsUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
          </motion.div>
        )}

        {/* Share Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center pt-4"
        >
          <ShareCard
            phase={summary.phase}
            phaseConfidence={summary.phaseConfidence}
            metrics={summary.metrics}
            story={summary.story}
            weekId={summary.weekId}
            streak={summary.streak}
          />
        </motion.div>
      </main>
    </div>
  );
}

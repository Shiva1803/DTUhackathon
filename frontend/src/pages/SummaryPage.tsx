import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, RefreshCw, TrendingUp, TrendingDown, Minus,
  Sparkles, Brain, Heart, Briefcase, Tv, MoreHorizontal,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { getActivitySummary, generateActivityReview } from '../lib/api';
import { useTheme } from '../context/ThemeContext';

interface ActivityCounts {
  growth: number;
  health: number;
  work: number;
  consumption: number;
  other: number;
}

interface ExtractedActivity {
  activity: string;
  context: string;
}

interface ClassificationDetail {
  activity: string;
  category: string;
  points: number;
  reasoning: string;
}

interface CategoryPoints {
  growth: number;
  health: number;
  work: number;
  consumption: number;
  other: number;
}

interface RecentLog {
  title?: string;
  timestamp: string;
  extractedActivities: ExtractedActivity[];
  classificationDetails: ClassificationDetail[];
  categoryPoints: CategoryPoints;
}

interface ActivitySummaryData {
  counts: ActivityCounts;
  recentLogs: RecentLog[];
  review: string;
  totalLogs: number;
}

const categoryConfig: Record<string, { 
  icon: React.ElementType; 
  label: string; 
  colorDark: string; 
  colorLight: string;
  description: string;
}> = {
  growth: { 
    icon: Brain, 
    label: 'Growth', 
    colorDark: '#00d4ff', 
    colorLight: '#8B6914',
    description: 'Learning & Development'
  },
  health: { 
    icon: Heart, 
    label: 'Health', 
    colorDark: '#10b981', 
    colorLight: '#2d8a5e',
    description: 'Physical & Mental Wellness'
  },
  work: { 
    icon: Briefcase, 
    label: 'Work', 
    colorDark: '#f59e0b', 
    colorLight: '#b8860b',
    description: 'Professional Productivity'
  },
  consumption: { 
    icon: Tv, 
    label: 'Consumption', 
    colorDark: '#ef4444', 
    colorLight: '#c0392b',
    description: 'Passive Entertainment'
  },
  other: { 
    icon: MoreHorizontal, 
    label: 'Other', 
    colorDark: '#8b5cf6', 
    colorLight: '#7c3aed',
    description: 'Miscellaneous Activities'
  },
};


function CategoryCard({ category, count, isDark }: { category: string; count: number; isDark: boolean }) {
  const config = categoryConfig[category];
  const Icon = config.icon;
  const color = isDark ? config.colorDark : config.colorLight;
  
  const getTrendIcon = () => {
    if (count > 0) return <TrendingUp className="w-4 h-4" />;
    if (count < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
      }}
    >
      {count !== 0 && (
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 50%, ${color}40 0%, transparent 70%)` }}
        />
      )}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}20`, border: `1px solid ${color}40` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <p className="font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: isDark ? '#fff' : '#3D2914' }}>
              {config.label}
            </p>
            <p className="text-xs" style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61,41,20,0.5)' }}>
              {config.description}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span 
            className="text-3xl font-bold"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: count === 0 ? (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(61,41,20,0.3)') : color }}
          >
            {count > 0 ? `+${count}` : count}
          </span>
          <span style={{ color: count === 0 ? (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(61,41,20,0.3)') : color }}>
            {getTrendIcon()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function RecentActivityLog({ log, isDark, index }: { log: RecentLog; isDark: boolean; index: number }) {
  const [expanded, setExpanded] = useState(false);

  // Calculate total points for preview badges
  const pointsSummary = log.classificationDetails.reduce((acc, detail) => {
    const cat = detail.category.toLowerCase();
    if (cat in acc) {
      acc[cat as keyof typeof acc] += detail.points;
    }
    return acc;
  }, { growth: 0, health: 0, work: 0, consumption: 0, other: 0 });

  const nonZeroCategories = Object.entries(pointsSummary)
    .filter(([_, points]) => points !== 0)
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl p-4"
      style={{
        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.6)',
        border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <div className="flex-1 text-left">
          <p className="font-medium text-sm" style={{ fontFamily: "'Inter', sans-serif", color: isDark ? '#fff' : '#3D2914' }}>
            {log.title || 'Untitled Log'}
          </p>
          <p className="text-xs mt-0.5" style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61,41,20,0.5)' }}>
            {new Date(log.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {nonZeroCategories.map(([category, points], i) => {
              const config = categoryConfig[category];
              const color = isDark ? config.colorDark : config.colorLight;
              return (
                <span key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                  {points > 0 ? '+' : '−'}
                </span>
              );
            })}
          </div>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pt-3 mt-3 space-y-4" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
              {/* Extracted Activities */}
              {log.extractedActivities && log.extractedActivities.length > 0 && log.extractedActivities[0].activity !== 'N/A' && (
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(61,41,20,0.6)', fontFamily: "'Inter', sans-serif" }}>
                    Activities Detected
                  </p>
                  <div className="space-y-1">
                    {log.extractedActivities.map((activity, i) => (
                      <div key={i} className="text-sm flex items-start gap-2">
                        <span style={{ color: isDark ? '#00d4ff' : '#8B6914' }}>•</span>
                        <span style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(61,41,20,0.8)', fontFamily: "'Inter', sans-serif" }}>
                          {activity.activity}
                          {activity.context && activity.context !== '' && (
                            <span style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61,41,20,0.5)' }}> — {activity.context}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Classification Details */}
              {log.classificationDetails && log.classificationDetails.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(61,41,20,0.6)', fontFamily: "'Inter', sans-serif" }}>
                    Impact Breakdown
                  </p>
                  <div className="space-y-2">
                    {log.classificationDetails.map((detail, i) => {
                      const config = categoryConfig[detail.category.toLowerCase()] || categoryConfig.other;
                      const color = isDark ? config.colorDark : config.colorLight;
                      return (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="px-2 py-0.5 rounded text-xs font-medium shrink-0" style={{ background: `${color}20`, color }}>
                            {detail.points > 0 ? '+1' : '-1'} {config.label}
                          </span>
                          <span style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(61,41,20,0.7)', fontFamily: "'Inter', sans-serif" }}>
                            {detail.reasoning}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Log Points Summary */}
              {log.categoryPoints && (
                <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.03)' }}>
                  {Object.entries(log.categoryPoints).map(([category, points]) => {
                    if (points === 0) return null;
                    const config = categoryConfig[category];
                    const color = isDark ? config.colorDark : config.colorLight;
                    return (
                      <span key={category} className="text-xs px-2 py-1 rounded-full" style={{ background: `${color}15`, color, fontFamily: "'Inter', sans-serif" }}>
                        {config.label}: {points > 0 ? `+${points}` : points}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


function SummaryPreloader({ isDark }: { isDark: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center transition-colors duration-500" style={{ background: isDark ? '#000000' : '#F5E6D3' }}>
      <div className="relative flex flex-col items-center">
        <div className="relative w-20 h-20">
          <motion.div className="absolute inset-0 rounded-full" style={{ border: `3px solid ${isDark ? 'rgba(0, 212, 255, 0.1)' : 'rgba(139, 105, 20, 0.15)'}` }}
            animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
          <motion.div className="absolute inset-2 rounded-full"
            style={{ border: `3px solid transparent`, borderTopColor: isDark ? '#00d4ff' : '#8B6914', borderRightColor: isDark ? 'rgba(0, 212, 255, 0.5)' : 'rgba(139, 105, 20, 0.5)' }}
            animate={{ rotate: -360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} />
          <motion.div className="absolute rounded-full"
            style={{ top: '50%', left: '50%', width: 10, height: 10, marginTop: -5, marginLeft: -5, background: isDark ? '#00d4ff' : '#8B6914', boxShadow: isDark ? '0 0 15px rgba(0, 212, 255, 0.6)' : '0 0 15px rgba(139, 105, 20, 0.6)' }}
            animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-sm"
          style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(61, 41, 20, 0.6)' }}>
          Loading your insights...
        </motion.p>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  const { getAccessTokenSilently } = useAuth0();
  const { isDark, isLoaded: themeLoaded } = useTheme();
  const [data, setData] = useState<ActivitySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const token = await getAccessTokenSilently({ authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } });
      const response = await getActivitySummary(token);
      setData(response.data?.data || response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching activity summary:', err);
      setError('Unable to load activity summary.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshReview = async () => {
    setRefreshing(true);
    try {
      const token = await getAccessTokenSilently({ authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } });
      const response = await generateActivityReview(token);
      if (data) setData({ ...data, review: response.data?.data?.review || response.data?.review });
    } catch (err) {
      console.error('Error refreshing review:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (!themeLoaded || loading) return <SummaryPreloader isDark={isDark} />;

  const categories = ['growth', 'health', 'work', 'consumption', 'other'];

  return (
    <div className="min-h-screen pb-12 transition-colors duration-500" style={{ background: isDark ? '#000000' : '#F5E6D3', color: isDark ? '#ffffff' : '#3D2914' }}>
      <header className="sticky top-16 z-30 px-4 py-4"
        style={{ background: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(245, 230, 211, 0.9)', backdropFilter: 'blur(20px)', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold"
              style={{ fontFamily: "'Space Grotesk', sans-serif", ...(isDark ? { background: 'linear-gradient(135deg, #ffffff 0%, #80e0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: '#3D2914' }) }}>
              Activity Summary
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61, 41, 20, 0.6)', fontSize: '0.875rem' }}>
              Based on your last {data?.totalLogs || 0} reflections
            </p>
          </div>
          <motion.button onClick={fetchData} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl disabled:opacity-50"
            style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(61, 41, 20, 0.7)' }}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-sm">Refresh</span>
          </motion.button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', fontFamily: "'Inter', sans-serif" }}>
            {error}
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category, i) => (
            <motion.div key={category} transition={{ delay: i * 0.1 }}>
              <CategoryCard category={category} count={data?.counts[category as keyof ActivityCounts] || 0} isDark={isDark} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl p-6"
          style={{ background: isDark ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, rgba(0, 60, 80, 0.08) 100%)' : 'linear-gradient(135deg, rgba(139, 105, 20, 0.08) 0%, rgba(194, 152, 108, 0.1) 100%)', border: isDark ? '1px solid rgba(0, 212, 255, 0.15)' : '1px solid rgba(139, 105, 20, 0.2)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: isDark ? 'rgba(0, 212, 255, 0.15)' : 'rgba(139, 105, 20, 0.15)', border: isDark ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid rgba(139, 105, 20, 0.3)' }}>
                <Sparkles className="w-5 h-5" style={{ color: isDark ? '#00d4ff' : '#8B6914' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Your Personal Review</h2>
                <p className="text-xs" style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61,41,20,0.5)' }}>AI-powered insights based on your patterns</p>
              </div>
            </div>
            <motion.button onClick={handleRefreshReview} disabled={refreshing} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg disabled:opacity-50" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: isDark ? '#00d4ff' : '#8B6914' }} /> : <RefreshCw className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(61,41,20,0.5)' }} />}
            </motion.button>
          </div>
          <p className="leading-relaxed whitespace-pre-line" style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(61, 41, 20, 0.85)' }}>
            {data?.review || 'Start recording your daily reflections to get personalized insights.'}
          </p>
        </motion.div>

        {data && data.recentLogs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <TrendingUp className="w-5 h-5" style={{ color: isDark ? '#00d4ff' : '#8B6914' }} />
              Recent Activity Breakdown
            </h2>
            <div className="space-y-3">
              {data.recentLogs.slice().reverse().map((log, index) => (
                <RecentActivityLog key={index} log={log} isDark={isDark} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        {(!data || data.totalLogs === 0) && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Brain className="w-16 h-16 mx-auto mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(61,41,20,0.15)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(61,41,20,0.6)' }}>
              No Activity Data Yet
            </h3>
            <p className="text-sm max-w-md mx-auto" style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(61,41,20,0.5)' }}>
              Start recording your daily reflections to see your activity patterns across growth, health, work, and more.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}

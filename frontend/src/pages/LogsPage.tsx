import { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Trash2, Calendar, Clock,
  MessageSquare, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';
import { getAudioLogs, deleteAudioLog } from '../lib/api';
import { useTheme } from '../context/ThemeContext';

interface AudioLog {
  id: string;
  transcript: string;
  title?: string;
  timestamp: string;
  duration?: number;
  audioUrl?: string;
  category?: string;
  sentiment?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const categoryEmojis: Record<string, string> = {
  health: '💪', work: '💼', personal: '🏠', family: '👨‍👩‍👧',
  social: '👥', finance: '💰', learning: '📚', other: '📝', uncategorized: '📋',
};

const sentimentColors: Record<string, string> = {
  positive: 'text-emerald-400', negative: 'text-red-400',
  neutral: 'text-gray-400', mixed: 'text-amber-400',
};

// Pre-computed dust particles for ThemePreloader
const preloaderDustParticles = Array.from({ length: 12 }, (_, i) => {
  const seeds = [0.35, 0.82, 0.19, 0.67, 0.41, 0.93, 0.28, 0.56, 0.74, 0.11, 0.88, 0.49];
  const seeds2 = [0.22, 0.65, 0.38, 0.91, 0.14, 0.77, 0.43, 0.06, 0.59, 0.84, 0.31, 0.68];
  const seeds3 = [0.45, 0.12, 0.78, 0.33, 0.89, 0.56, 0.01, 0.67, 0.23, 0.94, 0.48, 0.17];
  const seeds4 = [0.61, 0.29, 0.85, 0.42, 0.07, 0.73, 0.38, 0.91, 0.16, 0.54, 0.82, 0.25];
  return {
    id: i,
    size: 3 + seeds[i] * 4,
    opacity: 0.3 + seeds2[i] * 0.3,
    xOffset: (seeds3[i] - 0.5) * 100,
    yOffset: (seeds4[i] - 0.5) * 100,
    delay: i * 0.15,
    duration: 2 + seeds[i],
  };
});

// Theme-aware Preloader Component
function ThemePreloader({ isDark }: { isDark: boolean }) {
  // Generate particles on each render to ensure they're theme-aware
  const starParticles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    angle: i * 45,
  }));

  return (
    <div 
      className="min-h-screen flex items-center justify-center transition-colors duration-500" 
      style={{ background: isDark ? '#000000' : '#F5E6D3' }}
    >
      <div className="relative flex flex-col items-center">
        {/* Animated rings */}
        <div className="relative w-24 h-24">
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: `3px solid ${isDark ? 'rgba(0, 212, 255, 0.1)' : 'rgba(139, 105, 20, 0.15)'}`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Middle ring with gradient */}
          <motion.div
            className="absolute inset-2 rounded-full"
            style={{
              border: `3px solid transparent`,
              borderTopColor: isDark ? '#00d4ff' : '#8B6914',
              borderRightColor: isDark ? 'rgba(0, 212, 255, 0.5)' : 'rgba(139, 105, 20, 0.5)',
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Inner pulsing circle */}
          <motion.div
            className="absolute inset-4 rounded-full"
            style={{
              background: isDark 
                ? 'radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(139, 105, 20, 0.25) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* Center dot */}
          <motion.div
            className="absolute rounded-full"
            style={{
              top: '50%',
              left: '50%',
              width: 12,
              height: 12,
              marginTop: -6,
              marginLeft: -6,
              background: isDark ? '#00d4ff' : '#8B6914',
              boxShadow: isDark 
                ? '0 0 20px rgba(0, 212, 255, 0.6)'
                : '0 0 20px rgba(139, 105, 20, 0.6)',
            }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Floating particles around loader - THEME SPECIFIC */}
        {isDark ? (
          // Dark mode: Cyan star particles
          starParticles.map((particle) => (
            <motion.div
              key={`star-${particle.id}`}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: '#00d4ff',
                boxShadow: '0 0 6px rgba(0, 212, 255, 0.8)',
                top: '50%',
                left: '50%',
              }}
              animate={{
                x: [0, Math.cos(particle.angle * Math.PI / 180) * 60],
                y: [0, Math.sin(particle.angle * Math.PI / 180) * 60],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: particle.id * 0.2,
                ease: 'easeOut',
              }}
            />
          ))
        ) : (
          // Light mode: Brown dust particles
          preloaderDustParticles.map((particle) => (
            <motion.div
              key={`dust-${particle.id}`}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                background: `rgba(139, 90, 43, ${particle.opacity})`,
                boxShadow: '0 0 4px rgba(139, 90, 43, 0.3)',
                top: '50%',
                left: '50%',
              }}
              animate={{
                x: [0, particle.xOffset],
                y: [0, particle.yOffset],
                opacity: [0, 0.7, 0],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                ease: 'easeOut',
              }}
            />
          ))
        )}

        {/* Loading text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-sm"
          style={{ 
            fontFamily: "'Inter', sans-serif", 
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(61, 41, 20, 0.7)' 
          }}
        >
          Loading your reflections...
        </motion.p>
      </div>
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting, 
  isDark,
  logTitle 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  isDeleting: boolean;
  isDark: boolean;
  logTitle?: string;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: isDark 
                ? 'linear-gradient(135deg, rgba(30, 10, 10, 0.98) 0%, rgba(20, 5, 5, 0.98) 100%)'
                : 'linear-gradient(135deg, rgba(255, 250, 245, 0.98) 0%, rgba(255, 240, 230, 0.98) 100%)',
              border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(180, 80, 60, 0.3)',
              boxShadow: isDark 
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(239, 68, 68, 0.15)'
                : '0 25px 50px -12px rgba(0, 0, 0, 0.2), 0 0 40px rgba(180, 80, 60, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated warning glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: isDark 
                  ? 'radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.15) 0%, transparent 60%)'
                  : 'radial-gradient(circle at 50% 0%, rgba(180, 80, 60, 0.1) 0%, transparent 60%)',
              }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Icon */}
            <div className="text-center mb-5">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{
                  background: isDark 
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(180, 50, 50, 0.3) 100%)'
                    : 'linear-gradient(135deg, rgba(220, 100, 80, 0.2) 0%, rgba(180, 80, 60, 0.25) 100%)',
                  border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(180, 80, 60, 0.3)',
                }}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <AlertTriangle 
                    className="w-8 h-8" 
                    style={{ color: isDark ? '#f87171' : '#B85450' }} 
                  />
                </motion.div>
              </motion.div>
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              <h3 
                className="text-lg font-semibold mb-2"
                style={{ 
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: isDark ? '#ffffff' : '#3D2914',
                }}
              >
                Delete Recording?
              </h3>
              <p 
                className="text-sm"
                style={{ 
                  fontFamily: "'Inter', sans-serif",
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(61, 41, 20, 0.6)',
                }}
              >
                {logTitle ? `"${logTitle}"` : 'This recording'} will be permanently deleted.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <motion.button
                onClick={onClose}
                disabled={isDeleting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(61, 41, 20, 0.7)',
                }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={onConfirm}
                disabled={isDeleting}
                whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                whileTap={{ scale: isDeleting ? 1 : 0.98 }}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  background: isDark 
                    ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                    : 'linear-gradient(135deg, #B85450 0%, #9A4540 100%)',
                  color: '#ffffff',
                  boxShadow: isDark 
                    ? '0 0 20px rgba(239, 68, 68, 0.3)'
                    : '0 0 20px rgba(180, 80, 60, 0.3)',
                }}
              >
                {isDeleting ? (
                  <>
                    <motion.div
                      className="w-4 h-4 rounded-full border-2 border-white border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </motion.button>
            </div>

            {/* Animated particles on delete */}
            {isDeleting && (
              <>
                {Array.from({ length: 8 }, (_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: isDark ? '#f87171' : '#B85450',
                      top: '30%',
                      left: '50%',
                    }}
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos(i * 45 * Math.PI / 180) * 80,
                      y: Math.sin(i * 45 * Math.PI / 180) * 80,
                      opacity: 0,
                      scale: 0,
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LogsPage() {
  const { getAccessTokenSilently } = useAuth0();
  const { isDark, isLoaded: themeLoaded } = useTheme();
  const [logs, setLogs] = useState<AudioLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<AudioLog | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchLogs = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE }
      });
      const response = await getAudioLogs(token, { page, limit: 10 });
      setLogs(response.data.data || []);
      setPagination({
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 10,
        total: response.data.pagination?.total || 0,
        totalPages: response.data.pagination?.totalPages || 0,
      });
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to load logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handlePlayPause = (log: AudioLog) => {
    if (!log.audioUrl) return;
    if (playingId === log.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = log.audioUrl;
        audioRef.current.play();
        setPlayingId(log.id);
      }
    }
  };

  const openDeleteModal = (log: AudioLog) => {
    setLogToDelete(log);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (!deletingId) {
      setDeleteModalOpen(false);
      setLogToDelete(null);
    }
  };

  const handleDelete = async () => {
    if (!logToDelete) return;
    setDeletingId(logToDelete.id);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE }
      });
      await deleteAudioLog(token, logToDelete.id);
      setLogs(logs.filter(log => log.id !== logToDelete.id));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      setDeleteModalOpen(false);
      setLogToDelete(null);
    } catch (err) {
      console.error('Error deleting log:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!themeLoaded || (loading && logs.length === 0)) {
    return <ThemePreloader key={isDark ? 'dark' : 'light'} isDark={isDark} />;
  }

  return (
    <div className="min-h-screen pb-12 transition-colors duration-500" style={{ background: isDark ? '#000000' : '#F5E6D3', color: isDark ? '#ffffff' : '#3D2914' }}>
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />

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
              My Logs
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61, 41, 20, 0.6)', fontSize: '0.875rem' }}>
              {pagination.total} total {pagination.total === 1 ? 'log' : 'logs'}
            </p>
          </div>
          <motion.button
            onClick={() => fetchLogs(pagination.page)}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
              fontFamily: "'Inter', sans-serif",
              color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(61, 41, 20, 0.7)',
            }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-sm">Refresh</span>
          </motion.button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div 
            className="rounded-xl p-4 mb-6"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {error}
          </div>
        )}

        {logs.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(61, 41, 20, 0.2)' }} />
            <h2 
              className="text-xl font-semibold mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(61, 41, 20, 0.7)' }}
            >
              No logs yet
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(61, 41, 20, 0.5)' }}>
              Start recording your daily reflections!
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  className="group rounded-2xl p-5 transition-all duration-300"
                  style={{
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
                    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  {/* Title */}
                  {log.title && (
                    <h3 
                      className="text-lg font-semibold mb-3"
                      style={{ 
                        fontFamily: "'Space Grotesk', sans-serif", 
                        color: isDark ? '#ffffff' : '#3D2914' 
                      }}
                    >
                      {log.title}
                    </h3>
                  )}

                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4 text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61, 41, 20, 0.6)' }}>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {formatDate(log.timestamp)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {formatDuration(log.duration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.category && (
                        <span 
                          className="px-2.5 py-1 text-xs rounded-lg"
                          style={{
                            background: isDark ? 'rgba(0, 212, 255, 0.1)' : 'rgba(139, 105, 20, 0.1)',
                            border: isDark ? '1px solid rgba(0, 212, 255, 0.2)' : '1px solid rgba(139, 105, 20, 0.2)',
                            color: isDark ? '#00d4ff' : '#8B6914',
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {categoryEmojis[log.category] || '📝'} {log.category}
                        </span>
                      )}
                      {log.sentiment && (
                        <span className={`text-xs capitalize ${sentimentColors[log.sentiment]}`}>
                          {log.sentiment}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Transcript */}
                  <p 
                    className="mb-5 leading-relaxed"
                    style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(61, 41, 20, 0.8)' }}
                  >
                    {log.transcript}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {log.audioUrl && (
                      <motion.button
                        onClick={() => handlePlayPause(log)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
                        style={{
                          background: playingId === log.id 
                            ? (isDark ? 'rgba(0, 212, 255, 0.15)' : 'rgba(139, 105, 20, 0.15)')
                            : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)'),
                          border: `1px solid ${playingId === log.id 
                            ? (isDark ? 'rgba(0, 212, 255, 0.3)' : 'rgba(139, 105, 20, 0.3)')
                            : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                          color: playingId === log.id 
                            ? (isDark ? '#00d4ff' : '#8B6914')
                            : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(61, 41, 20, 0.7)'),
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {playingId === log.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {playingId === log.id ? 'Pause' : 'Play'}
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => openDeleteModal(log)}
                      disabled={deletingId === log.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50"
                      style={{
                        background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(180, 80, 60, 0.1)',
                        border: isDark ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(180, 80, 60, 0.2)',
                        color: isDark ? '#f87171' : '#B85450',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <motion.button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm disabled:opacity-30"
              style={{
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(61, 41, 20, 0.7)',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </motion.button>
            <span style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61, 41, 20, 0.6)' }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <motion.button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm disabled:opacity-30"
              style={{
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(61, 41, 20, 0.7)',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        isDeleting={!!deletingId}
        isDark={isDark}
        logTitle={logToDelete?.title}
      />
    </div>
  );
}

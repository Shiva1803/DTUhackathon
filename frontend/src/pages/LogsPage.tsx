import { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2,
    Play,
    Pause,
    Trash2,
    Calendar,
    Clock,
    MessageSquare,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { getAudioLogs, deleteAudioLog } from '../lib/api';

interface AudioLog {
    id: string;
    transcript: string;
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

const sentimentColors: Record<string, string> = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400',
    mixed: 'text-yellow-400',
};

export default function LogsPage() {
    const { getAccessTokenSilently } = useAuth0();
    const [logs, setLogs] = useState<AudioLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fetchLogs = async (page: number = 1) => {
        setLoading(true);
        setError(null);

        try {
            const token = await getAccessTokenSilently({
                authorizationParams: {
                    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                }
            });

            const response = await getAudioLogs(token, { page, limit: 10 });
            const data = response.data;

            setLogs(data.data || []);
            setPagination({
                page: data.pagination?.page || 1,
                limit: data.pagination?.limit || 10,
                total: data.pagination?.total || 0,
                totalPages: data.pagination?.totalPages || 0,
            });
        } catch (err) {
            console.error('Error fetching logs:', err);
            setError('Failed to load logs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handlePlayPause = (log: AudioLog) => {
        if (!log.audioUrl) return;

        if (playingId === log.id) {
            // Pause current audio
            audioRef.current?.pause();
            setPlayingId(null);
        } else {
            // Play new audio
            if (audioRef.current) {
                audioRef.current.src = log.audioUrl;
                audioRef.current.play();
                setPlayingId(log.id);
            }
        }
    };

    const handleDelete = async (logId: string) => {
        if (!confirm('Are you sure you want to delete this log?')) return;

        setDeletingId(logId);
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: {
                    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                }
            });

            await deleteAudioLog(token, logId);

            // Remove from local state
            setLogs(logs.filter(log => log.id !== logId));
            setPagination(prev => ({ ...prev, total: prev.total - 1 }));
        } catch (err) {
            console.error('Error deleting log:', err);
            alert('Failed to delete log. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading && logs.length === 0) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
                    <span className="text-gray-400">Loading your logs...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white pb-12">
            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                onEnded={() => setPlayingId(null)}
                className="hidden"
            />

            {/* Header */}
            <header className="bg-gray-800/50 border-b border-gray-700 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">My Logs</h1>
                        <p className="text-gray-400 text-sm">
                            {pagination.total} total {pagination.total === 1 ? 'log' : 'logs'}
                        </p>
                    </div>
                    <button
                        onClick={() => fetchLogs(pagination.page)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-300">
                        {error}
                    </div>
                )}

                {logs.length === 0 ? (
                    <div className="text-center py-16">
                        <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-400 mb-2">No logs yet</h2>
                        <p className="text-gray-500">Start recording your daily reflections!</p>
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
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors"
                                >
                                    {/* Log Header */}
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex items-center gap-3 text-sm text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(log.timestamp)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {formatDuration(log.duration)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {log.category && (
                                                <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                    {categoryEmojis[log.category] || '📝'} {log.category}
                                                </span>
                                            )}
                                            {log.sentiment && (
                                                <span className={`text-xs ${sentimentColors[log.sentiment] || 'text-gray-400'}`}>
                                                    {log.sentiment}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Transcript */}
                                    <p className="text-gray-300 mb-4 leading-relaxed">
                                        {log.transcript}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3">
                                        {log.audioUrl && (
                                            <button
                                                onClick={() => handlePlayPause(log)}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
                                            >
                                                {playingId === log.id ? (
                                                    <>
                                                        <Pause className="w-4 h-4" />
                                                        Pause
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="w-4 h-4" />
                                                        Play
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(log.id)}
                                            disabled={deletingId === log.id}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors text-sm disabled:opacity-50"
                                        >
                                            {deletingId === log.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                            Delete
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </AnimatePresence>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <button
                            onClick={() => fetchLogs(pagination.page - 1)}
                            disabled={pagination.page <= 1 || loading}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>

                        <span className="text-gray-400">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>

                        <button
                            onClick={() => fetchLogs(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages || loading}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

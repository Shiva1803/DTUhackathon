import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useJobPolling } from '@/hooks/useJobPolling';
import { useJobStore } from '@/stores/jobStore';
import { Pipeline } from '@/components/processing/Pipeline';
import { NetworkError } from '@/components/error/NetworkError';
import { useAnnounce } from '@/components/a11y/ScreenReaderAnnouncer';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ShieldCheck } from 'lucide-react';

const MESSAGES = [
    "Organizing your activity data...",
    "Identifying meaningful patterns...",
    "Looking for long-term signals...",
    "Generating your reflection...",
    "Preparing your results..."
];

export function Processing() {
    const navigate = useNavigate();
    const { jobId, status, error, reset } = useJobStore();
    const { jobStatus: job } = useJobPolling();
    const announce = useAnnounce();
    const prefersReducedMotion = useReducedMotion();

    // Message Rotation Logic
    const [messageIndex, setMessageIndex] = useState(0);
    const [showError, setShowError] = useState(false);

    useEffect(() => {
        if (!jobId) {
            navigate('/');
            return;
        }

        const interval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % MESSAGES.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [jobId, navigate]);

    // Announce agent changes
    useEffect(() => {
        if (job?.currentAgent) {
            announce(`Now running: ${job.currentAgent} agent`, 'polite');
        }
    }, [job?.currentAgent, announce]);

    // Handle errors
    useEffect(() => {
        if (status === 'failed' || error) {
            setShowError(true);
            announce('Analysis encountered an error', 'assertive');
        }
    }, [status, error, announce]);

    // Auto-redirect on completion
    useEffect(() => {
        if (job?.status === 'completed') {
            announce('Analysis complete! Loading your results.', 'polite');
            setTimeout(() => navigate('/results'), 1500);
        }
    }, [job?.status, navigate, announce]);

    const handleRetry = () => {
        setShowError(false);
        reset();
        navigate('/');
    };

    if (showError) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
                <NetworkError 
                    type="polling" 
                    onRetry={handleRetry}
                    onUseDemoData={() => navigate('/results')}
                />
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen bg-bg-primary flex flex-col items-center justify-center relative overflow-hidden"
            role="region"
            aria-label="Analysis in progress"
            aria-live="polite"
        >
            {/* Background Ambient Mesh */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,80,255,0.03),transparent_70%)] pointer-events-none" aria-hidden="true" />

            <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center gap-12 text-center">
                {/* Header */}
                <header className="space-y-4">
                    <motion.h1
                        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-4xl md:text-5xl font-display font-bold text-text-primary"
                    >
                        Analyzing your patterns
                    </motion.h1>
                    <motion.p
                        initial={prefersReducedMotion ? {} : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-text-secondary text-lg"
                    >
                        This usually takes under a minute.
                    </motion.p>
                </header>

                {/* Agent Pipeline */}
                <motion.div
                    initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="w-full"
                    role="progressbar"
                    aria-label="Analysis progress"
                    aria-valuenow={job?.progress || 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                >
                    <Pipeline
                        currentAgent={job?.currentAgent || 'ingest'}
                        jobStatus={job?.status || 'processing'}
                    />
                </motion.div>

                {/* Micro Status Messages */}
                <div 
                    className="h-8 flex items-center justify-center w-full max-w-md mx-auto relative cursor-default"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={messageIndex}
                            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                            className="absolute text-accent-primary font-medium tracking-wide"
                        >
                            {MESSAGES[messageIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer Trust */}
            <motion.footer
                initial={prefersReducedMotion ? {} : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-8 flex items-center gap-2 text-text-tertiary text-xs"
            >
                <ShieldCheck size={14} className="text-accent-primary" aria-hidden="true" />
                <span>Processing securely. No data leaves your session until verified.</span>
            </motion.footer>
        </div>
    );
}

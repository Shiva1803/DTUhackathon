import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorFallbackProps {
    error?: Error | null;
    onReset?: () => void;
    title?: string;
    message?: string;
}

/**
 * Error Fallback Component
 * 
 * Calm, human-friendly error display.
 * Always offers a way forward.
 */
export function ErrorFallback({ 
    error, 
    onReset,
    title = "Something didn't load correctly",
    message = "We hit an unexpected issue. Let's try again."
}: ErrorFallbackProps) {
    const navigate = useNavigate();

    const handleGoHome = () => {
        if (onReset) onReset();
        navigate('/');
    };

    const handleRetry = () => {
        if (onReset) onReset();
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full text-center space-y-8"
            >
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-white/5 border border-white/10">
                        <AlertCircle size={32} className="text-text-secondary" />
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-3">
                    <h1 className="text-2xl font-display font-medium text-text-primary">
                        {title}
                    </h1>
                    <p className="text-text-secondary">
                        {message}
                    </p>
                    {import.meta.env.DEV && error && (
                        <p className="text-xs text-text-tertiary font-mono mt-4 p-3 bg-white/5 rounded-lg text-left overflow-auto max-h-32">
                            {error.message}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        variant="primary"
                        onClick={handleRetry}
                        leftIcon={<RefreshCw size={16} />}
                    >
                        Try again
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleGoHome}
                        leftIcon={<Home size={16} />}
                    >
                        Go home
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

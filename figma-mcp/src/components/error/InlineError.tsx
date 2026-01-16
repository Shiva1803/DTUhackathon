import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface InlineErrorProps {
    message: string;
    onRetry?: () => void;
    onDismiss?: () => void;
    className?: string;
}

/**
 * Inline Error Component
 * 
 * Non-intrusive error display for recoverable issues.
 * Calm, supportive tone.
 */
export function InlineError({ message, onRetry, onDismiss, className }: InlineErrorProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
            role="alert"
            aria-live="polite"
            className={cn(
                "flex items-center gap-3 p-4 rounded-xl bg-accent-error/10 border border-accent-error/20",
                className
            )}
        >
            <AlertCircle size={18} className="text-accent-error shrink-0" />
            
            <p className="flex-1 text-sm text-text-primary">
                {message}
            </p>

            <div className="flex items-center gap-2">
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
                        aria-label="Retry"
                    >
                        <RefreshCw size={16} />
                    </button>
                )}
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
                        aria-label="Dismiss error"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </motion.div>
    );
}

import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NetworkErrorProps {
    type: 'upload' | 'polling' | 'fetch' | 'timeout';
    onRetry?: () => void;
    onUseDemoData?: () => void;
}

const ERROR_CONTENT = {
    upload: {
        icon: WifiOff,
        title: "Upload didn't complete",
        message: "The connection was interrupted. Your files are safe locally."
    },
    polling: {
        icon: WifiOff,
        title: "Lost connection to analysis",
        message: "We'll try to reconnect automatically."
    },
    fetch: {
        icon: WifiOff,
        title: "Couldn't load your results",
        message: "The server might be busy. Let's try again."
    },
    timeout: {
        icon: WifiOff,
        title: "This is taking longer than expected",
        message: "The analysis might still be running. You can wait or try again."
    }
};

/**
 * Network Error Component
 * 
 * Specialized error display for network-related issues.
 * Offers retry and demo data fallback.
 */
export function NetworkError({ type, onRetry, onUseDemoData }: NetworkErrorProps) {
    const content = ERROR_CONTENT[type];
    const Icon = content.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md mx-auto p-8 rounded-2xl bg-bg-secondary border border-white/5 text-center space-y-6"
        >
            <div className="flex justify-center">
                <div className="p-4 rounded-full bg-white/5 border border-white/10">
                    <Icon size={28} className="text-text-secondary" />
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-xl font-display font-medium text-text-primary">
                    {content.title}
                </h3>
                <p className="text-sm text-text-secondary">
                    {content.message}
                </p>
            </div>

            <div className="flex flex-col gap-3">
                {onRetry && (
                    <Button
                        variant="primary"
                        onClick={onRetry}
                        leftIcon={<RefreshCw size={16} />}
                        fullWidth
                    >
                        Try again
                    </Button>
                )}
                {onUseDemoData && (
                    <Button
                        variant="secondary"
                        onClick={onUseDemoData}
                        leftIcon={<Database size={16} />}
                        fullWidth
                    >
                        Use sample data instead
                    </Button>
                )}
            </div>
        </motion.div>
    );
}

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

/**
 * Offline Indicator Component
 * 
 * Shows a subtle banner when the user loses network connectivity.
 * Automatically hides when back online.
 */
export function OfflineIndicator() {
    const isOnline = useNetworkStatus();

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.3 }}
                    className="fixed top-0 left-0 right-0 z-[1001] bg-accent-error/90 backdrop-blur-sm py-2 px-4 text-center"
                    role="alert"
                    aria-live="assertive"
                >
                    <div className="flex items-center justify-center gap-2 text-sm text-white">
                        <WifiOff size={16} />
                        <span>You&apos;re offline. Some features may not work.</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

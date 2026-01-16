import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
    label?: string;
}

/**
 * Loading Spinner Component
 * 
 * Minimal, calm loading indicator.
 * GPU-accelerated animation.
 */
export function LoadingSpinner({ 
    size = 'md', 
    fullScreen = false,
    label = 'Loading...'
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    const spinner = (
        <div className="flex flex-col items-center gap-4" role="status" aria-label={label}>
            <motion.div
                className={cn(
                    "rounded-full border-2 border-white/10 border-t-accent-primary",
                    sizeClasses[size]
                )}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{ willChange: 'transform' }}
            />
            <span className="sr-only">{label}</span>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                {spinner}
            </div>
        );
    }

    return spinner;
}

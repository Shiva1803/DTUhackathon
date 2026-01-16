import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useJobStore } from '@/stores/jobStore';
import { useUploadStore } from '@/stores/uploadStore';
import { useResultsStore } from '@/stores/resultsStore';
import { cn } from '@/utils/cn';

/**
 * Navbar Component
 * 
 * Apple-style navigation that:
 * - Stays invisible at page top
 * - Fades in with glassmorphism on scroll
 * - Contextual CTAs based on route
 * - Never distracts from content
 */

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    
    const { reset: resetJob } = useJobStore();
    const { reset: resetUpload } = useUploadStore();
    const { clearResults } = useResultsStore();

    // Scroll detection
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setIsScrolled(scrollY > 50);
            setIsVisible(scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check
        
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Full reset handler
    const handleRestart = () => {
        resetJob();
        resetUpload();
        clearResults();
        navigate('/');
    };

    // Contextual CTA based on route
    const renderCTA = () => {
        switch (location.pathname) {
            case '/':
                return null; // No CTA on landing
            case '/processing':
                return (
                    <button
                        onClick={handleRestart}
                        className="nav-link flex items-center gap-2"
                        aria-label="Cancel and restart"
                    >
                        <RotateCcw size={14} />
                        <span className="hidden sm:inline">Cancel</span>
                    </button>
                );
            case '/results':
                return (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleRestart}
                            className="nav-link flex items-center gap-2"
                            aria-label="Start new analysis"
                        >
                            <RotateCcw size={14} />
                            <span className="hidden sm:inline">New Analysis</span>
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <motion.header
            role="banner"
            aria-label="Main navigation"
            initial={{ opacity: 0 }}
            animate={{ 
                opacity: isVisible ? 1 : 0,
                pointerEvents: isVisible ? 'auto' : 'none'
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
                "fixed top-0 left-0 right-0 z-header h-14 transition-all duration-300",
                isScrolled 
                    ? "bg-[#0A0A0C]/75 backdrop-blur-lg border-b border-white/5" 
                    : "bg-transparent border-b border-transparent"
            )}
        >
            <nav 
                className="h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between"
                role="navigation"
                aria-label="Primary"
            >
                {/* Wordmark */}
                <button
                    onClick={() => navigate('/')}
                    className="nav-link font-display text-sm tracking-tight"
                    aria-label="Go to home"
                >
                    <span className="text-text-primary">Parallax</span>
                </button>

                {/* Right Actions */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-4"
                    >
                        {renderCTA()}
                    </motion.div>
                </AnimatePresence>
            </nav>
        </motion.header>
    );
}

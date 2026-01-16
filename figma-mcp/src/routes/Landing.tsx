import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SplashScreen } from '@/components/landing/SplashScreen';
import { IntroLoader } from '@/components/landing/IntroLoader';
import { HeroSection } from '@/components/landing/HeroSection';
import { UploadSection } from '@/components/landing/UploadSection';
import { StarfieldBackground } from '@/components/landing/StarfieldBackground';
import { useJobPolling } from '@/hooks/useJobPolling';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useUploadStore } from '@/stores/uploadStore';
import { useAnnounce } from '@/components/a11y/ScreenReaderAnnouncer';

/**
 * Landing Page
 * 
 * Flow:
 * 1. Splash screen with "PARALLAX" branding
 * 2. Click "Get Started" → Loader animation
 * 3. Main content with hero + upload sections
 */

type LandingState = 'splash' | 'loading' | 'main';

export function Landing() {
    const [state, setState] = useState<LandingState>('splash');
    const uploadSectionRef = useRef<HTMLElement>(null);
    const navigate = useNavigate();
    const announce = useAnnounce();

    const { files } = useUploadStore();
    const { upload, isUploading } = useFileUpload();
    const { createJob } = useJobPolling();

    const handleGetStarted = useCallback(() => {
        setState('loading');
    }, []);

    const handleLoaderComplete = useCallback(() => {
        setState('main');
    }, []);

    const handleScrollToUpload = useCallback(() => {
        uploadSectionRef.current?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
        });
    }, []);

    const handleStartAnalysis = useCallback(() => {
        if (files.length > 0) {
            announce('Starting analysis...', 'polite');
            upload(undefined, {
                onSuccess: (data) => {
                    createJob(data.uploadId, {
                        onSuccess: () => {
                            announce('Analysis started. Navigating to processing.', 'polite');
                            navigate('/processing');
                        }
                    });
                }
            });
        }
    }, [files.length, upload, createJob, navigate, announce]);

    return (
        <>
            <AnimatePresence mode="wait">
                {/* Step 1: Splash Screen */}
                {state === 'splash' && (
                    <SplashScreen key="splash" onGetStarted={handleGetStarted} />
                )}

                {/* Step 2: Loader Animation */}
                {state === 'loading' && (
                    <IntroLoader key="loader" onComplete={handleLoaderComplete} minDuration={2500} />
                )}
            </AnimatePresence>

            {/* Step 3: Main Content (always rendered but hidden until state is 'main') */}
            {state === 'main' && (
                <>
                    {/* Interactive Starfield Background */}
                    <StarfieldBackground starCount={250} parallaxIntensity={40} />

                    {/* Main Content */}
                    <div 
                        className="relative z-10 bg-transparent"
                        role="region"
                        aria-label="Landing page"
                    >
                        {/* Hero Section */}
                        <HeroSection onScrollToUpload={handleScrollToUpload} />

                        {/* Upload Section */}
                        <UploadSection 
                            ref={uploadSectionRef}
                            onStartAnalysis={handleStartAnalysis}
                            isUploading={isUploading}
                        />

                        {/* Footer */}
                        <footer className="py-8 text-center relative z-10">
                            <p className="text-xs text-text-tertiary font-mono opacity-40">
                                PARALLAX v1.0 • IDENTITY TRAJECTORY ANALYSIS
                            </p>
                        </footer>
                    </div>
                </>
            )}
        </>
    );
}

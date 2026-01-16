import { forwardRef, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Lock, Sparkles } from 'lucide-react';
import { useUploadStore } from '@/stores/uploadStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/utils/cn';

gsap.registerPlugin(ScrollTrigger);

interface UploadSectionProps {
    onStartAnalysis: () => void;
    isUploading: boolean;
}

/**
 * UploadSection Component
 * 
 * Scroll-triggered upload section with:
 * - Reveal animations on scroll
 * - Premium dropzone
 * - Trust indicators
 */
export const UploadSection = forwardRef<HTMLElement, UploadSectionProps>(
    ({ onStartAnalysis, isUploading }, ref) => {
        const { files } = useUploadStore();
        const prefersReducedMotion = useReducedMotion();
        const contentRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (prefersReducedMotion || !contentRef.current) return;

            const elements = contentRef.current.querySelectorAll('.reveal-item');
            
            gsap.set(elements, { y: 60, opacity: 0 });

            ScrollTrigger.create({
                trigger: contentRef.current,
                start: 'top 80%',
                onEnter: () => {
                    gsap.to(elements, {
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        stagger: 0.15,
                        ease: 'power3.out'
                    });
                }
            });

            return () => {
                ScrollTrigger.getAll().forEach(t => t.kill());
            };
        }, [prefersReducedMotion]);

        return (
            <section 
                ref={ref}
                className="relative min-h-screen flex items-center justify-center px-6 py-24"
            >
            {/* Background - semi-transparent overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-primary/80 to-bg-primary/90 pointer-events-none" />

                <div ref={contentRef} className="relative z-10 w-full max-w-4xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-16 reveal-item">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
                            <Sparkles size={14} className="text-accent-secondary" />
                            <span className="text-xs text-text-secondary uppercase tracking-widest">Step 1</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-text-primary mb-4">
                            Upload Your Data
                        </h2>
                        <p className="text-text-secondary max-w-lg mx-auto">
                            Drop your Spotify history or screen time export. We&apos;ll analyze your patterns and reveal your trajectory.
                        </p>
                    </div>

                    {/* Dropzone */}
                    <div className="reveal-item mb-12">
                        <FileDropzone />
                    </div>

                    {/* CTA */}
                    <div className="reveal-item flex flex-col items-center gap-6">
                        <Button
                            size="lg"
                            onClick={onStartAnalysis}
                            loading={isUploading}
                            disabled={files.length === 0}
                            rightIcon={<ArrowRight size={18} />}
                            className={cn(
                                "min-w-[200px] transition-all duration-500",
                                files.length > 0 
                                    ? "opacity-100 scale-100" 
                                    : "opacity-40 scale-95 pointer-events-none"
                            )}
                        >
                            {isUploading ? 'Uploading...' : 'Analyze My Data'}
                        </Button>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-text-tertiary">
                            <div className="flex items-center gap-2">
                                <Lock size={12} />
                                <span>End-to-end encrypted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-secondary" />
                                <span>No permanent storage</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                                <span>GDPR compliant</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
);

UploadSection.displayName = 'UploadSection';

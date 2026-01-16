import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface HeroSectionProps {
    onScrollToUpload: () => void;
}

/**
 * HeroSection Component
 * 
 * UNESCO-style cinematic hero with:
 * - Large typography with staggered reveals
 * - Subtle parallax effects
 * - Scroll indicator
 */
export function HeroSection({ onScrollToUpload }: HeroSectionProps) {
    const prefersReducedMotion = useReducedMotion();
    const headlineRef = useRef<HTMLHeadingElement>(null);
    const sublineRef = useRef<HTMLParagraphElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (prefersReducedMotion) return;

        const tl = gsap.timeline({ delay: 0.3 });

        // Headline words animation
        const words = headlineRef.current?.querySelectorAll('.word');
        if (words) {
            gsap.set(words, { y: 100, opacity: 0 });
            tl.to(words, {
                y: 0,
                opacity: 1,
                duration: 1,
                stagger: 0.15,
                ease: 'power3.out'
            });
        }

        // Subline
        tl.fromTo(sublineRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' },
            '-=0.4'
        );

        // CTA
        tl.fromTo(ctaRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
            '-=0.3'
        );

        return () => { tl.kill(); };
    }, [prefersReducedMotion]);

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
            {/* Background Elements - subtle overlay only */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Vignette effect */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,5,5,0.4)_70%,rgba(5,5,5,0.8)_100%)]" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto text-center">
                {/* Main Headline */}
                <h1 
                    ref={headlineRef}
                    className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold leading-[0.9] tracking-tight mb-8"
                >
                    <span className="word inline-block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/80">
                        Discover
                    </span>
                    <br />
                    <span className="word inline-block text-transparent bg-clip-text bg-gradient-to-b from-white/80 to-white/50">
                        Your
                    </span>{' '}
                    <span className="word inline-block text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
                        Trajectory
                    </span>
                </h1>

                {/* Subline */}
                <p 
                    ref={sublineRef}
                    className="text-lg md:text-xl lg:text-2xl text-text-secondary max-w-2xl mx-auto mb-12 font-light leading-relaxed"
                    style={{ opacity: prefersReducedMotion ? 1 : 0 }}
                >
                    A visual reflection of how your time shapes who you&apos;re becoming.
                    Upload your data. See your patterns. Understand your direction.
                </p>

                {/* CTA */}
                <div 
                    ref={ctaRef}
                    style={{ opacity: prefersReducedMotion ? 1 : 0 }}
                >
                    <button
                        onClick={onScrollToUpload}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-bg-primary font-semibold rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105"
                    >
                        <span>Begin Analysis</span>
                        <svg 
                            className="w-5 h-5 transition-transform group-hover:translate-y-1" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <span className="text-xs text-text-tertiary uppercase tracking-widest">Scroll</span>
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
                >
                    <motion.div 
                        className="w-1 h-2 bg-white/40 rounded-full"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                </motion.div>
            </motion.div>
        </section>
    );
}

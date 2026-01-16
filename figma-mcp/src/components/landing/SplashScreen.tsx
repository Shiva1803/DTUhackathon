import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FluidBackground } from './FluidBackground';

interface SplashScreenProps {
    onGetStarted: () => void;
}

/**
 * SplashScreen Component
 * 
 * Initial landing with just "PARALLAX" branding.
 * Click "Get Started" to trigger the loader animation.
 */
export function SplashScreen({ onGetStarted }: SplashScreenProps) {
    const prefersReducedMotion = useReducedMotion();
    const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const ctaRef = useRef<HTMLButtonElement>(null);
    const orbitsRef = useRef<HTMLDivElement>(null);

    const letters = 'PARALLAX'.split('');

    useEffect(() => {
        if (prefersReducedMotion) {
            // Show immediately
            lettersRef.current.forEach(el => {
                if (el) el.style.opacity = '1';
            });
            if (subtitleRef.current) subtitleRef.current.style.opacity = '1';
            if (ctaRef.current) ctaRef.current.style.opacity = '1';
            return;
        }

        const tl = gsap.timeline();

        // Initial state
        gsap.set(lettersRef.current, { 
            y: 80, 
            opacity: 0,
            rotateX: -90
        });

        // Staggered letter reveal
        tl.to(lettersRef.current, {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 1,
            stagger: 0.1,
            ease: 'power3.out'
        });

        // Subtitle
        tl.fromTo(subtitleRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' },
            '-=0.3'
        );

        // CTA button
        tl.fromTo(ctaRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
            '-=0.4'
        );

        // Orbits
        tl.fromTo(orbitsRef.current,
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' },
            '-=1'
        );

        return () => { tl.kill(); };
    }, [prefersReducedMotion]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[2000] bg-bg-primary overflow-hidden cursor-default"
        >
            {/* Fluid Animated Background */}
            <FluidBackground />

            {/* Animated Grid Overlay */}
            <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(0, 80, 255, 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 80, 255, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                    animation: 'grid-move 20s linear infinite'
                }}
            />

            {/* Floating Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ 
                        x: [0, 100, 0],
                        y: [0, -50, 0],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 blur-3xl"
                />
                <motion.div
                    animate={{ 
                        x: [0, -80, 0],
                        y: [0, 60, 0],
                        scale: [1, 0.9, 1]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-cyan-500/15 to-blue-500/10 blur-3xl"
                />
                <motion.div
                    animate={{ 
                        x: [0, 60, 0],
                        y: [0, -80, 0],
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 blur-3xl"
                />
            </div>

            {/* Orbital Rings around center */}
            <div 
                ref={orbitsRef}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ opacity: prefersReducedMotion ? 1 : 0 }}
            >
                {/* Ring 1 */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5"
                    style={{ transform: 'translate(-50%, -50%) rotateX(75deg)' }}
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-400/60 shadow-lg shadow-blue-400/50" />
                </motion.div>
                
                {/* Ring 2 */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/5"
                    style={{ transform: 'translate(-50%, -50%) rotateX(75deg) rotateY(20deg)' }}
                >
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400/60 shadow-lg shadow-cyan-400/50" />
                </motion.div>

                {/* Ring 3 */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/[0.03]"
                    style={{ transform: 'translate(-50%, -50%) rotateX(75deg) rotateY(-15deg)' }}
                >
                    <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-purple-400/50" />
                </motion.div>
            </div>

            {/* Scan Lines Effect */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'
                }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
                {/* Logo Text */}
                <div className="mb-6" style={{ perspective: '1000px' }}>
                    <h1 className="text-7xl md:text-8xl lg:text-9xl font-display font-bold tracking-tighter flex">
                        {letters.map((letter, i) => (
                            <span
                                key={i}
                                ref={el => lettersRef.current[i] = el}
                                className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/40 drop-shadow-[0_0_30px_rgba(0,80,255,0.3)]"
                                style={{ 
                                    transformStyle: 'preserve-3d',
                                    opacity: prefersReducedMotion ? 1 : 0 
                                }}
                            >
                                {letter}
                            </span>
                        ))}
                    </h1>
                </div>

                {/* Animated underline */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.2, duration: 0.8, ease: 'easeOut' }}
                    className="w-32 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mb-8"
                />

                {/* Subtitle */}
                <p 
                    ref={subtitleRef}
                    className="text-text-secondary text-lg md:text-xl mb-12 tracking-widest uppercase"
                    style={{ opacity: prefersReducedMotion ? 1 : 0 }}
                >
                    Identity Trajectory Analysis
                </p>

                {/* Get Started Button */}
                <button
                    ref={ctaRef}
                    onClick={onGetStarted}
                    className="get-started-btn group relative px-10 py-4 bg-transparent border border-white/20 rounded-full text-white font-medium tracking-wide overflow-hidden"
                    style={{ opacity: prefersReducedMotion ? 1 : 0 }}
                >
                    <span className="relative z-10 flex items-center gap-3 btn-content">
                        Get Started
                        <svg 
                            className="w-4 h-4 transition-transform group-hover:translate-x-1" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </span>
                </button>
            </div>

            {/* Corner Decorations */}
            <div className="absolute top-8 left-8 w-16 h-16 border-l border-t border-white/10" />
            <div className="absolute top-8 right-8 w-16 h-16 border-r border-t border-white/10" />
            <div className="absolute bottom-8 left-8 w-16 h-16 border-l border-b border-white/10" />
            <div className="absolute bottom-8 right-8 w-16 h-16 border-r border-b border-white/10" />

            {/* Bottom branding */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-text-tertiary font-mono tracking-widest"
            >
                v1.0
            </motion.p>

            {/* Flicker + Glow Animation Styles */}
            <style>{`
                .get-started-btn {
                    transition: background-color 0.3s ease;
                }
                
                .get-started-btn:hover {
                    animation: btn-flicker 0.67s ease-out forwards;
                }
                
                .get-started-btn:hover .btn-content {
                    animation: text-flicker 0.67s ease-out forwards;
                }
                
                @keyframes btn-flicker {
                    0% { 
                        opacity: 1; 
                        border-color: rgba(255, 255, 255, 0.2);
                        box-shadow: none;
                    }
                    8% { opacity: 0.3; }
                    16% { opacity: 0.9; }
                    24% { opacity: 0.2; }
                    32% { opacity: 0.7; }
                    40% { opacity: 0.1; }
                    48% { opacity: 0.8; }
                    56% { opacity: 0.3; }
                    64% { opacity: 0.95; }
                    72% { opacity: 0.5; }
                    80% { opacity: 1; }
                    88% { opacity: 0.8; }
                    100% { 
                        opacity: 1; 
                        border-color: rgba(0, 214, 255, 0.8);
                        box-shadow: 
                            0 0 15px rgba(0, 80, 255, 0.5),
                            0 0 30px rgba(0, 80, 255, 0.3),
                            0 0 45px rgba(0, 214, 255, 0.2),
                            inset 0 0 20px rgba(0, 214, 255, 0.1);
                        background-color: rgba(0, 80, 255, 0.1);
                    }
                }
                
                @keyframes text-flicker {
                    0% { opacity: 1; }
                    8% { opacity: 0.2; }
                    16% { opacity: 0.8; }
                    24% { opacity: 0.1; }
                    32% { opacity: 0.6; }
                    40% { opacity: 0.15; }
                    48% { opacity: 0.7; }
                    56% { opacity: 0.25; }
                    64% { opacity: 0.9; }
                    72% { opacity: 0.4; }
                    80% { opacity: 1; }
                    88% { opacity: 0.7; }
                    100% { 
                        opacity: 1;
                        color: rgba(0, 214, 255, 1);
                        text-shadow: 
                            0 0 10px rgba(0, 214, 255, 0.8),
                            0 0 20px rgba(0, 214, 255, 0.5),
                            0 0 30px rgba(0, 80, 255, 0.3);
                    }
                }

                @keyframes grid-move {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(60px, 60px); }
                }
            `}</style>
        </motion.div>
    );
}

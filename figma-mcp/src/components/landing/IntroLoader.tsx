import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface IntroLoaderProps {
    onComplete: () => void;
    minDuration?: number;
}

/**
 * IntroLoader Component
 * 
 * Unique preloader with rotating/spinning letters.
 * Each letter spins independently while loading.
 */
export function IntroLoader({ onComplete, minDuration = 3000 }: IntroLoaderProps) {
    const [progress, setProgress] = useState(0);
    const [isExiting, setIsExiting] = useState(false);
    const prefersReducedMotion = useReducedMotion();
    const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    const letters = 'PARALLAX'.split('');

    useEffect(() => {
        if (prefersReducedMotion) {
            // Skip animation
            setTimeout(onComplete, 500);
            return;
        }

        // Animate each letter with different rotation speeds
        lettersRef.current.forEach((letter, i) => {
            if (!letter) return;
            
            // Random rotation direction and speed for each letter
            const direction = i % 2 === 0 ? 1 : -1;
            const duration = 0.8 + (i * 0.1);
            
            gsap.to(letter, {
                rotateY: direction * 360 * 3, // 3 full rotations
                duration: minDuration / 1000,
                ease: 'power2.inOut',
                repeat: 0,
            });

            // Also add a slight bounce/scale effect
            gsap.to(letter, {
                scale: [1, 1.1, 1],
                duration: duration,
                repeat: -1,
                yoyo: true,
                ease: 'power1.inOut',
                delay: i * 0.1
            });
        });

        // Progress animation
        const startTime = Date.now();
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / minDuration) * 100, 100);
            setProgress(newProgress);

            if (newProgress >= 100) {
                clearInterval(progressInterval);
                
                // Exit animation - letters fly out
                lettersRef.current.forEach((letter, i) => {
                    if (!letter) return;
                    gsap.killTweensOf(letter);
                    
                    const angle = (i / letters.length) * Math.PI * 2;
                    const distance = 200;
                    
                    gsap.to(letter, {
                        x: Math.cos(angle) * distance,
                        y: Math.sin(angle) * distance,
                        opacity: 0,
                        scale: 0,
                        rotateZ: (i % 2 === 0 ? 1 : -1) * 180,
                        duration: 0.6,
                        ease: 'power3.in',
                        delay: i * 0.03
                    });
                });

                setTimeout(() => {
                    setIsExiting(true);
                    setTimeout(onComplete, 500);
                }, 600);
            }
        }, 16);

        return () => {
            clearInterval(progressInterval);
            lettersRef.current.forEach(letter => {
                if (letter) gsap.killTweensOf(letter);
            });
        };
    }, [minDuration, onComplete, prefersReducedMotion, letters.length]);

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    ref={containerRef}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="fixed inset-0 z-[2000] bg-bg-primary flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Background pulse */}
                    <div className="absolute inset-0 pointer-events-none">
                        <motion.div
                            animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.05, 0.1, 0.05]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent-primary"
                            style={{ filter: 'blur(150px)' }}
                        />
                    </div>

                    {/* Rotating Letters */}
                    <div 
                        className="relative z-10 mb-12"
                        style={{ perspective: '1000px' }}
                    >
                        <div className="flex items-center justify-center">
                            {letters.map((letter, i) => (
                                <span
                                    key={i}
                                    ref={el => lettersRef.current[i] = el}
                                    className="inline-block text-6xl md:text-7xl lg:text-8xl font-display font-bold mx-1"
                                    style={{ 
                                        transformStyle: 'preserve-3d',
                                        color: 'white',
                                        textShadow: `
                                            0 0 20px rgba(0, 80, 255, 0.5),
                                            0 0 40px rgba(0, 80, 255, 0.3),
                                            0 0 60px rgba(0, 214, 255, 0.2)
                                        `
                                    }}
                                >
                                    {letter}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Circular Progress */}
                    <div className="relative w-20 h-20 mb-8">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="2"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="url(#progressGradient)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 45}`}
                                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                                style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                            />
                            <defs>
                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#0050FF" />
                                    <stop offset="100%" stopColor="#00D6FF" />
                                </linearGradient>
                            </defs>
                        </svg>
                        
                        {/* Percentage text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-mono text-white/80">
                                {Math.round(progress)}%
                            </span>
                        </div>
                    </div>

                    {/* Loading text */}
                    <motion.p
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="text-sm text-text-tertiary tracking-widest uppercase"
                    >
                        Initializing
                    </motion.p>

                    {/* Decorative spinning rings */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                            className="absolute w-[400px] h-[400px] rounded-full border border-white/5"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                            className="absolute w-[500px] h-[500px] rounded-full border border-white/[0.03]"
                        />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                            className="absolute w-[600px] h-[600px] rounded-full border border-dashed border-white/[0.02]"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

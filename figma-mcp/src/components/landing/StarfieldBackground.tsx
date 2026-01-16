import { useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Star {
    x: number;
    y: number;
    z: number; // depth for parallax
    size: number;
    opacity: number;
    twinkleSpeed: number;
    twinklePhase: number;
}

interface StarfieldBackgroundProps {
    starCount?: number;
    parallaxIntensity?: number;
}

/**
 * StarfieldBackground Component
 * 
 * Interactive starfield that responds to mouse movement with parallax effect.
 * Stars at different depths move at different speeds for 3D illusion.
 */
export function StarfieldBackground({ 
    starCount = 200,
    parallaxIntensity = 30 
}: StarfieldBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const starsRef = useRef<Star[]>([]);
    const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
    const animationRef = useRef<number>();
    const prefersReducedMotion = useReducedMotion();

    // Initialize stars
    const initStars = useCallback((width: number, height: number) => {
        const stars: Star[] = [];
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                z: Math.random(), // 0 = far, 1 = close
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.3,
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }
        starsRef.current = stars;
    }, [starCount]);

    // Draw stars
    const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
        ctx.clearRect(0, 0, width, height);

        // Smooth mouse following
        mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
        mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

        const centerX = width / 2;
        const centerY = height / 2;
        const mouseOffsetX = (mouseRef.current.x - centerX) / centerX;
        const mouseOffsetY = (mouseRef.current.y - centerY) / centerY;

        starsRef.current.forEach(star => {
            // Parallax offset based on depth (z)
            const parallaxX = mouseOffsetX * parallaxIntensity * star.z;
            const parallaxY = mouseOffsetY * parallaxIntensity * star.z;

            const x = star.x + parallaxX;
            const y = star.y + parallaxY;

            // Twinkle effect
            const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
            const opacity = star.opacity + twinkle * 0.2;

            // Size based on depth
            const size = star.size * (0.5 + star.z * 0.5);

            // Draw star
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            
            // Color gradient based on depth (far = blue tint, close = white)
            const blueAmount = Math.floor((1 - star.z) * 100);
            ctx.fillStyle = `rgba(${200 + blueAmount * 0.5}, ${220 + blueAmount * 0.3}, 255, ${Math.max(0, Math.min(1, opacity))})`;
            ctx.fill();

            // Glow for closer stars
            if (star.z > 0.7) {
                ctx.beginPath();
                ctx.arc(x, y, size * 3, 0, Math.PI * 2);
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
                gradient.addColorStop(0, `rgba(100, 150, 255, ${opacity * 0.3})`);
                gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        });

        // Draw a few shooting stars occasionally
        if (Math.random() < 0.001 && !prefersReducedMotion) {
            drawShootingStar(ctx, width, height);
        }
    }, [parallaxIntensity, prefersReducedMotion]);

    // Shooting star effect
    const drawShootingStar = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const startX = Math.random() * width;
        const startY = Math.random() * height * 0.5;
        const length = 50 + Math.random() * 100;
        const angle = Math.PI / 4 + Math.random() * 0.5;

        const gradient = ctx.createLinearGradient(
            startX, startY,
            startX + Math.cos(angle) * length,
            startY + Math.sin(angle) * length
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + Math.cos(angle) * length, startY + Math.sin(angle) * length);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            initStars(rect.width, rect.height);
        };

        resize();
        window.addEventListener('resize', resize);

        let startTime = performance.now();
        
        const animate = (currentTime: number) => {
            const elapsed = (currentTime - startTime) / 1000;
            const rect = canvas.getBoundingClientRect();
            draw(ctx, rect.width, rect.height, elapsed);
            animationRef.current = requestAnimationFrame(animate);
        };

        if (!prefersReducedMotion) {
            animationRef.current = requestAnimationFrame(animate);
        } else {
            // Static render for reduced motion
            draw(ctx, canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height, 0);
        }

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [initStars, draw, prefersReducedMotion]);

    // Mouse tracking
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.targetX = e.clientX;
            mouseRef.current.targetY = e.clientY;
        };

        // Initialize to center
        mouseRef.current.x = window.innerWidth / 2;
        mouseRef.current.y = window.innerHeight / 2;
        mouseRef.current.targetX = window.innerWidth / 2;
        mouseRef.current.targetY = window.innerHeight / 2;

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-0"
            aria-hidden="true"
        />
    );
}

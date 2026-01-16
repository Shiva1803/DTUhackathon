import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * FluidBackground Component
 * 
 * Animated fluid/aurora effect using canvas.
 * Creates flowing, organic shapes with gradient colors.
 */
export function FluidBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const prefersReducedMotion = useReducedMotion();
    const animationRef = useRef<number>();
    const mouseRef = useRef({ x: 0.5, y: 0.5 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
        };

        resize();
        window.addEventListener('resize', resize);

        // Blob configuration
        const blobs = [
            { x: 0.3, y: 0.3, radius: 300, color: 'rgba(0, 80, 255, 0.15)', speed: 0.0003, phase: 0 },
            { x: 0.7, y: 0.6, radius: 350, color: 'rgba(139, 92, 246, 0.12)', speed: 0.0004, phase: 2 },
            { x: 0.5, y: 0.8, radius: 280, color: 'rgba(0, 214, 255, 0.1)', speed: 0.0005, phase: 4 },
            { x: 0.2, y: 0.7, radius: 250, color: 'rgba(236, 72, 153, 0.08)', speed: 0.0003, phase: 1 },
            { x: 0.8, y: 0.2, radius: 320, color: 'rgba(16, 185, 129, 0.08)', speed: 0.0004, phase: 3 },
        ];

        // Floating particles
        const particles: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.2,
                opacity: Math.random() * 0.5 + 0.2
            });
        }

        let time = 0;

        const draw = () => {
            time += 1;
            
            // Clear with fade effect for trails
            ctx.fillStyle = 'rgba(5, 5, 5, 0.03)';
            ctx.fillRect(0, 0, width, height);

            // Draw blobs
            blobs.forEach((blob, i) => {
                const mouseInfluence = 0.1;
                const targetX = blob.x + (mouseRef.current.x - 0.5) * mouseInfluence;
                const targetY = blob.y + (mouseRef.current.y - 0.5) * mouseInfluence;
                
                // Organic movement
                const offsetX = Math.sin(time * blob.speed + blob.phase) * 100;
                const offsetY = Math.cos(time * blob.speed * 0.8 + blob.phase) * 80;
                
                const x = targetX * width + offsetX;
                const y = targetY * height + offsetY;
                
                // Pulsing radius
                const pulseRadius = blob.radius + Math.sin(time * 0.002 + i) * 50;
                
                // Draw gradient blob
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, pulseRadius);
                gradient.addColorStop(0, blob.color);
                gradient.addColorStop(0.5, blob.color.replace(/[\d.]+\)$/, '0.05)'));
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                ctx.beginPath();
                ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            });

            // Draw flowing lines
            ctx.strokeStyle = 'rgba(0, 80, 255, 0.03)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                const startY = (height / 6) * i + Math.sin(time * 0.001 + i) * 50;
                ctx.moveTo(0, startY);
                
                for (let x = 0; x < width; x += 20) {
                    const y = startY + 
                        Math.sin(x * 0.005 + time * 0.002 + i) * 30 +
                        Math.cos(x * 0.003 + time * 0.001) * 20;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            // Draw particles
            particles.forEach(particle => {
                particle.y -= particle.speed;
                particle.x += Math.sin(time * 0.01 + particle.y * 0.01) * 0.3;
                
                if (particle.y < -10) {
                    particle.y = height + 10;
                    particle.x = Math.random() * width;
                }
                
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * 0.3})`;
                ctx.fill();
            });

            // Central glow effect
            const centerX = width / 2 + Math.sin(time * 0.001) * 50;
            const centerY = height / 2 + Math.cos(time * 0.0015) * 30;
            const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 400);
            centerGradient.addColorStop(0, 'rgba(0, 80, 255, 0.08)');
            centerGradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.04)');
            centerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, 400, 0, Math.PI * 2);
            ctx.fillStyle = centerGradient;
            ctx.fill();

            if (!prefersReducedMotion) {
                animationRef.current = requestAnimationFrame(draw);
            }
        };

        // Initial clear
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);

        if (prefersReducedMotion) {
            // Static render
            time = 1000;
            draw();
        } else {
            animationRef.current = requestAnimationFrame(draw);
        }

        // Mouse tracking
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = e.clientX / width;
            mouseRef.current.y = e.clientY / height;
        };
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [prefersReducedMotion]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ filter: 'blur(40px)' }}
            aria-hidden="true"
        />
    );
}

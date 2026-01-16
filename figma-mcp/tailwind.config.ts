import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS Configuration - Design System Engine
 * 
 * PHILOSOPHY:
 * - Design system foundation, not just utilities
 * - Dark-mode-first for premium feel
 * - Prepared for glassmorphism, gradients, motion
 * - Extensible without breaking hackathon velocity
 * 
 * ACTUAL VALUES: Coming in next phase (design tokens)
 * This config establishes STRUCTURE, not visual opinions yet.
 */

export default {
    // Content paths for Tailwind's JIT compiler
    content: [
        './index.html',
        './src/**/*.{ts,tsx,js,jsx}',
    ],

    // Dark mode strategy: class-based for explicit control
    // Why 'class'? Allows manual toggle + persisted preference
    // Alternative: 'media' for automatic OS-level detection
    darkMode: 'class',

    theme: {
        extend: {
            // ============================================
            // COLORS - Semantic Design System
            // ============================================
            colors: {
                // Sony/Apple Flagship Palette (Source of Truth)
                // Backgrounds
                bg: {
                    primary: '#050505',   // Deep Charcoal (Hero/Main)
                    secondary: '#0A0A0C', // Soft Charcoal (Cards/Surface)
                    tertiary: '#111113',  // Elevated
                },
                // Typography (Opacity-based white)
                text: {
                    primary: 'rgba(255, 255, 255, 0.9)',   // Headings
                    secondary: 'rgba(255, 255, 255, 0.6)', // Body
                    tertiary: 'rgba(255, 255, 255, 0.4)',  // Micro
                    inverted: '#050505',                   // On light accents
                },
                // Accents
                accent: {
                    primary: '#0050FF',   // Sony Blue (Focus/Action)
                    secondary: '#00D6FF', // Electric Cyan (Highlights)
                    success: '#00D6FF',   // Use Cyan for success
                    error: '#FF3333',     // Signal Red (New sleek error)
                },
                // Borders
                border: {
                    light: 'rgba(255, 255, 255, 0.1)',
                    subtle: 'rgba(255, 255, 255, 0.05)',
                    primary: '#0050FF',
                },
            },

            // ============================================
            // TYPOGRAPHY - Editorial & Clean
            // ============================================
            fontFamily: {
                display: ['Outfit', 'Inter', 'sans-serif'], // Headings
                sans: ['Inter', 'system-ui', 'sans-serif'], // Body/UI
                mono: ['JetBrains Mono', 'monospace'],      // Metrics/Code
            },

            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
                'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
                'base': ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],
                'lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
                'xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
                '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
                '3xl': ['2rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
                '4xl': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.03em' }],
                '5xl': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
            },

            // ============================================
            // SPACING - 4px Base Rhythm
            // ============================================
            spacing: {
                '18': '4.5rem',
                '22': '5.5rem',
                '26': '6.5rem',
                '30': '7.5rem',
                '34': '8.5rem',
                '128': '32rem',
                '144': '36rem',
            },

            // ============================================
            // DEPTH & BLUR - Glassmorphism Core
            // ============================================
            boxShadow: {
                'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                'glow': '0 0 20px rgba(255, 255, 255, 0.05)',
                'glow-lg': '0 0 40px rgba(255, 255, 255, 0.1)',
            },

            backdropBlur: {
                sm: '4px',
                md: '8px',
                lg: '16px',
                xl: '24px',
            },

            borderRadius: {
                'sm': '0.25rem',
                'md': '0.5rem',
                'lg': '0.75rem',
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            },

            // ============================================
            // MOTION - Introspective & Fluid
            // ============================================
            transitionDuration: {
                fast: '200ms',
                base: '400ms',
                slow: '700ms',
            },

            transitionTimingFunction: {
                standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
                emphasized: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
                exit: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
            },

            // Custom Animations
            keyframes: {
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'slide-up': {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'pulse-subtle': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
            },
            animation: {
                'fade-in': 'fade-in 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
                'slide-up': 'slide-up 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
                'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
            },

            zIndex: {
                'modal': '1000',
                'dropdown': '900',
                'header': '800',
                'tooltip': '700',
            },
        },
    },

    // Plugins (will add more as needed)
    plugins: [],
} satisfies Config;

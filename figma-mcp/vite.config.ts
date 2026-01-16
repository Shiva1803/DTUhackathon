import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite Configuration for "Who Are You Becoming?"
 * 
 * WHY VITE?
 * - Lightning-fast HMR for animation-heavy component iteration
 * - Native ESM = instant server start (critical for hackathon velocity)
 * - Optimized for large JSON parsing & media assets (audio, Lottie)
 * - Better control than CRA, simpler than Next.js for this phase
 * - Rollup-based production builds = smaller bundles
 * 
 * SUPPORTS:
 * - GSAP ScrollTrigger timelines (no build conflicts)
 * - D3/SVG canvas rendering (proper module resolution)
 * - Framer Motion page transitions (fast refresh)
 * - html2canvas screenshot exports (client-side only)
 */

export default defineConfig({
    plugins: [
        // React plugin with Fast Refresh for instant HMR
        react({
            // Enable automatic JSX runtime (React 18)
            jsxRuntime: 'automatic',

            // Fast Refresh for smooth development
            fastRefresh: true,
        }),
    ],

    // Path alias resolution (MUST match tsconfig.json)
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
            '@routes': path.resolve(__dirname, './src/routes'),
            '@stores': path.resolve(__dirname, './src/stores'),
            '@hooks': path.resolve(__dirname, './src/hooks'),
            '@api': path.resolve(__dirname, './src/api'),
            '@types': path.resolve(__dirname, './src/types'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@styles': path.resolve(__dirname, './src/styles'),
            '@lib': path.resolve(__dirname, './src/lib'),
            '@assets': path.resolve(__dirname, './src/assets'),
        },
    },

    // Development server configuration
    server: {
        port: 3000,
        strictPort: false, // Auto-increment if 3000 is taken
        host: true, // Listen on all addresses for demo accessibility
        open: false, // Don't auto-open browser (manual control)
    },

    // Production build optimization
    build: {
        // Output directory
        outDir: 'dist',

        // Source maps for debugging (disable for final deploy if needed)
        sourcemap: true,

        // Chunk size warning limit (500kb - we have animations/data)
        chunkSizeWarningLimit: 500,

        // Rollup options for bundle optimization
        rollupOptions: {
            output: {
                // Manual chunk splitting for better caching
                manualChunks: {
                    // Vendor chunks
                    'react-vendor': ['react', 'react-dom'],
                    'animation-vendor': ['framer-motion', 'gsap'],
                    'utils-vendor': ['zustand', '@tanstack/react-query'],
                },
            },
        },

        // Asset handling
        assetsInlineLimit: 4096, // Inline assets < 4kb as base64

        // Clear output dir before build
        emptyOutDir: true,
    },

    // Environment variable prefix (only VITE_ prefixed vars are exposed)
    envPrefix: 'VITE_',

    // Preview server config (for testing production builds)
    preview: {
        port: 4173,
        strictPort: false,
        host: true,
    },

    // Optimize dependencies (pre-bundle for faster dev)
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'zustand',
            '@tanstack/react-query',
        ],
    },
});

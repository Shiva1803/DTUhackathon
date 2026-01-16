/// <reference types="vite/client" />

/**
 * Type definitions for Vite environment variables
 * 
 * All custom env vars must be prefixed with VITE_
 * and defined here for TypeScript support
 */

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_ENV: 'development' | 'staging' | 'production';
    readonly VITE_ENABLE_DEMO_MODE: string;
    readonly VITE_ENABLE_ANALYTICS: string;
    readonly VITE_ENABLE_VOICE_NARRATION: string;
    readonly VITE_USE_MOCK_DATA: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

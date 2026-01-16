import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * API Client Configuration
 * 
 * Centralized Axios instance with strictly typed error handling.
 * - Base URL from environment
 * - 30s timeout for demo safety
 * - Interceptors for request tracking and error normalization
 */

// Define environment variables type safely
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Error Types
export interface ApiClientError {
    message: string;
    code: string;
    status: number;
    details?: unknown;
}

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Attach Request ID for tracing
        const requestId = Math.random().toString(36).substring(7);
        config.headers['X-Request-ID'] = requestId;

        // Log in development
        if (import.meta.env.DEV) {
            console.log(`[API] Req ${requestId}: ${config.method?.toUpperCase()} ${config.url}`); // eslint-disable-line no-console
        }

        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        if (import.meta.env.DEV) {
            console.log(`[API] Res ${response.config.headers['X-Request-ID']}: ${response.status}`); // eslint-disable-line no-console
        }
        return response;
    },
    (error: AxiosError<{ message?: string; code?: string }>) => {
        // Normalize Error
        const normalizedError: ApiClientError = {
            message: error.response?.data?.message || error.message || 'An unknown error occurred',
            code: error.response?.data?.code || error.code || 'UNKNOWN_ERROR',
            status: error.response?.status || 500,
            details: error.response?.data,
        };

        // Log error in dev
        if (import.meta.env.DEV) {
            console.error('[API Error]', normalizedError);
        }

        return Promise.reject(normalizedError);
    }
);

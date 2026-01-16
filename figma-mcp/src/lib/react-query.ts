import { QueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@/api/client';

/**
 * Global Query Client Configuration
 * 
 * Optimized for calm UX and demo safety:
 * - Stale Time: 5 mins (reduces visual flickering)
 * - Refetching: Disabled on window focus (calm)
 * - Retries: 1 (fail fast, but allow one hiccup)
 */

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 60,   // 1 hour
            retry: (failureCount, error) => {
                const apiError = error as unknown as ApiClientError;
                // Don't retry validation or 4xx errors
                if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
                    return false;
                }
                return failureCount < 2;
            },
            refetchOnWindowFocus: false, // Prevents jarring updates
            refetchOnReconnect: false,   // Prevents jarring updates
        },
        mutations: {
            retry: false, // Don't retry mutations (like uploads) automatically
        },
    },
});

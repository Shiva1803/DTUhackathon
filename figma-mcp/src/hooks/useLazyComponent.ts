import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Lazy load a component with retry logic
 * 
 * Handles chunk loading failures gracefully.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    retries = 3,
    delay = 1000
): LazyExoticComponent<T> {
    return lazy(async () => {
        let lastError: Error | null = null;
        
        for (let i = 0; i < retries; i++) {
            try {
                return await importFn();
            } catch (error) {
                lastError = error as Error;
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    });
}

/**
 * Preload a lazy component
 * 
 * Call this on hover/focus to start loading before navigation.
 */
export function preloadComponent(importFn: () => Promise<any>): void {
    importFn().catch(() => {
        // Silently fail preload - actual load will handle errors
    });
}

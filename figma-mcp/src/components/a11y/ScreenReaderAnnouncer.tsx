import { useEffect, useState, useCallback } from 'react';
import { create } from 'zustand';

/**
 * Screen Reader Announcer Store
 * 
 * Global store for managing screen reader announcements.
 */
interface AnnouncerState {
    message: string;
    priority: 'polite' | 'assertive';
    announce: (message: string, priority?: 'polite' | 'assertive') => void;
    clear: () => void;
}

export const useAnnouncerStore = create<AnnouncerState>((set) => ({
    message: '',
    priority: 'polite',
    announce: (message, priority = 'polite') => set({ message, priority }),
    clear: () => set({ message: '' })
}));

/**
 * Hook to announce messages to screen readers
 */
export function useAnnounce() {
    const announce = useAnnouncerStore((state) => state.announce);
    return useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        announce(message, priority);
    }, [announce]);
}

/**
 * Screen Reader Announcer Component
 * 
 * Visually hidden live region for screen reader announcements.
 * Place once at app root.
 */
export function ScreenReaderAnnouncer() {
    const { message, priority, clear } = useAnnouncerStore();
    const [currentMessage, setCurrentMessage] = useState('');

    useEffect(() => {
        if (message) {
            // Clear first to ensure re-announcement of same message
            setCurrentMessage('');
            const timeout = setTimeout(() => {
                setCurrentMessage(message);
                // Clear store after announcement
                setTimeout(clear, 1000);
            }, 100);
            return () => clearTimeout(timeout);
        }
        return undefined;
    }, [message, clear]);

    return (
        <>
            {/* Polite announcements */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {priority === 'polite' ? currentMessage : ''}
            </div>
            
            {/* Assertive announcements */}
            <div
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                className="sr-only"
            >
                {priority === 'assertive' ? currentMessage : ''}
            </div>
        </>
    );
}

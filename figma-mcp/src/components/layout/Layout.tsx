import { ReactNode } from 'react';
import { Navbar } from './Navbar';

/**
 * Global Layout Component
 * 
 * Wraps all pages with:
 * - Navigation bar
 * - Main content area with proper landmarks
 * - Skip link for accessibility
 */

interface LayoutProps {
    children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="relative min-h-screen bg-bg-primary">
            {/* Skip Link for Accessibility */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[1001] focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-white focus:rounded-lg focus:outline-none"
            >
                Skip to main content
            </a>

            {/* Navigation */}
            <Navbar />

            {/* Main Content */}
            <main id="main-content" role="main" tabIndex={-1} className="outline-none">
                {children}
            </main>
        </div>
    );
}

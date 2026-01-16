import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ScreenReaderAnnouncer } from '@/components/a11y/ScreenReaderAnnouncer';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import '@/styles/index.css';

// Lazy load route components for better performance
const Landing = lazy(() => import('@/routes/Landing').then(m => ({ default: m.Landing })));
const Processing = lazy(() => import('@/routes/Processing').then(m => ({ default: m.Processing })));
const Results = lazy(() => import('@/routes/Results'));

/**
 * Root Application Component
 * 
 * Manages client-side routing, page transitions, route guards,
 * error boundaries, and accessibility features.
 */

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Suspense fallback={<LoadingSpinner fullScreen />}>
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<Landing />} />

                    <Route path="/processing" element={
                        <ProtectedRoute requireStatus={['idle', 'queued', 'processing', 'completed']}>
                            <Processing />
                        </ProtectedRoute>
                    } />

                    <Route path="/results" element={
                        <ProtectedRoute requireStatus={['idle', 'queued', 'processing', 'completed']}>
                            <Results />
                        </ProtectedRoute>
                    } />
                </Routes>
            </Suspense>
        </AnimatePresence>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <div className="min-h-screen bg-bg-primary text-text-primary antialiased font-sans selection:bg-accent-primary/20">
                    <OfflineIndicator />
                    <Layout>
                        <AnimatedRoutes />
                    </Layout>
                    <ScreenReaderAnnouncer />
                </div>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/styles/index.css';

/**
 * Application Entry Point
 * 
 * - React 18 concurrent mode
 * - Strict mode for development warnings
 * - Global styles imported here
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </React.StrictMode>
);

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useJobStore } from '@/stores/jobStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireStatus?: ('idle' | 'queued' | 'processing' | 'completed' | 'failed')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireStatus }) => {
    const { status, jobId } = useJobStore();
    const location = useLocation();

    // Check availability
    if (!jobId && location.pathname !== '/') {
        // Redirect to landing if no job exists
        return <Navigate to="/" replace />;
    }

    // Check status requirement
    if (requireStatus && !requireStatus.includes(status)) {
        if (status === 'completed') return <Navigate to="/results" replace />;
        if (status === 'processing' || status === 'queued') return <Navigate to="/processing" replace />;
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

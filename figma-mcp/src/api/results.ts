import { apiClient } from './client';
import { Phase, TrajectoryPoint, Intervention } from '@/stores/resultsStore';

export interface AnalysisResultsResponse {
    phases: Phase[];
    trajectory: TrajectoryPoint[];
    interventions: Intervention[];
    narrativeAudioUrl?: string;
    identityStatement?: string;
}

export const resultsApi = {
    /**
     * Fetch final analysis results
     */
    getResults: async (jobId: string): Promise<AnalysisResultsResponse> => {
        const { data } = await apiClient.get<AnalysisResultsResponse>(`/results/${jobId}`);
        return data;
    }
};

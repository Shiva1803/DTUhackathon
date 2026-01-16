import { apiClient } from './client';
import { JobStatus, AgentType } from '@/stores/jobStore';

export interface CreateJobResponse {
    jobId: string;
    status: JobStatus;
}

export interface JobStatusResponse {
    jobId: string;
    status: JobStatus;
    currentAgent: AgentType | null;
    progress: number;
    logs: string[];
    error?: string;
}

export const jobsApi = {
    /**
     * Initialize a new analysis job
     */
    createJob: async (uploadId: string): Promise<CreateJobResponse> => {
        const { data } = await apiClient.post<CreateJobResponse>('/jobs', { uploadId });
        return data;
    },

    /**
     * Poll for job status updates
     */
    getJobStatus: async (jobId: string): Promise<JobStatusResponse> => {
        const { data } = await apiClient.get<JobStatusResponse>(`/jobs/${jobId}`);
        return data;
    },

    /**
     * Simulate job for demo mode (mock)
     */
    simulateJob: async (jobId: string): Promise<void> => {
        await apiClient.post(`/jobs/${jobId}/simulate`);
    }
};

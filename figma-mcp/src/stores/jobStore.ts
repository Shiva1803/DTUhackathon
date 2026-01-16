import { create } from 'zustand';

/**
 * Job Store
 * Manages the analysis pipeline lifecycle and agent progress
 */

export type JobStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';

export type AgentType = 'ingest' | 'normalize' | 'phase' | 'trajectory' | 'narrative' | 'export';

interface JobState {
    jobId: string | null;
    status: JobStatus;
    currentAgent: AgentType | null;
    progress: number;
    logs: string[];
    error: string | null;

    // Actions
    createJob: (id: string) => void;
    updateStatus: (status: JobStatus) => void;
    setAgent: (agent: AgentType) => void;
    setProgress: (progress: number) => void;
    addLog: (message: string) => void;
    failJob: (error: string) => void;
    reset: () => void;
}

export const useJobStore = create<JobState>((set) => ({
    jobId: null,
    status: 'idle',
    currentAgent: null,
    progress: 0,
    logs: [],
    error: null,

    createJob: (id) => set({
        jobId: id,
        status: 'queued',
        progress: 0,
        error: null,
        logs: ['Job created successfully']
    }),

    updateStatus: (status) => set({ status }),

    setAgent: (agent) => set((state) => ({
        currentAgent: agent,
        logs: [...state.logs, `Starting agent: ${agent}`]
    })),

    setProgress: (progress) => set({ progress }),

    addLog: (message) => set((state) => ({
        logs: [...state.logs, message]
    })),

    failJob: (error) => set({
        status: 'failed',
        error
    }),

    reset: () => set({
        jobId: null,
        status: 'idle',
        currentAgent: null,
        progress: 0,
        logs: [],
        error: null
    })
}));

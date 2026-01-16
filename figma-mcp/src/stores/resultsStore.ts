import { create } from 'zustand';

/**
 * Results Store
 * Manages the analyzed data, trajectory insights, and sharing state
 */

export interface Phase {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    description: string;
    color: string;
    dominantCategories: string[];
    confidenceScore: number;
}

export interface TrajectoryPoint {
    date: string;
    value: number;
    label: string;
}

export interface Intervention {
    id: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    category: string;
}

interface ResultsState {
    phases: Phase[];
    trajectory: TrajectoryPoint[];
    interventions: Intervention[];
    narrativeAudioUrl: string | null;
    identityStatement: string | null;

    // Actions
    setResults: (data: Partial<ResultsState>) => void;
    clearResults: () => void;
}

export const useResultsStore = create<ResultsState>((set) => ({
    phases: [],
    trajectory: [],
    interventions: [],
    narrativeAudioUrl: null,
    identityStatement: null,

    setResults: (data) => set((state) => ({
        ...state,
        ...data
    })),

    clearResults: () => set({
        phases: [],
        trajectory: [],
        interventions: [],
        narrativeAudioUrl: null,
        identityStatement: null
    })
}));

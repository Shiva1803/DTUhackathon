import { useQuery } from '@tanstack/react-query';
import { resultsApi } from '@/api/results';
import { useResultsStore } from '@/stores/resultsStore';
import { useJobStore } from '@/stores/jobStore';
import { useEffect } from 'react';

export const useResults = () => {
    const { jobId, status } = useJobStore();
    const { setResults } = useResultsStore();

    const { data, isLoading, error } = useQuery({
        queryKey: ['results', jobId],
        queryFn: () => resultsApi.getResults(jobId!),
        enabled: !!jobId && status === 'completed',
        staleTime: Infinity, // Results shouldn't change once complete
    });

    useEffect(() => {
        if (data) {
            setResults(data);
        }
    }, [data, setResults]);

    return {
        results: data,
        isLoading,
        error
    };
};

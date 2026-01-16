import { useQuery, useMutation } from '@tanstack/react-query';
import { jobsApi } from '@/api/jobs';
import { useJobStore } from '@/stores/jobStore';
import { useEffect } from 'react';
import { ApiClientError } from '@/api/client';

const JOB_POLL_INTERVAL = 2000; // 2 seconds

export const useJobPolling = () => {
    const {
        jobId,
        status,
        createJob: setStoreJob,
        updateStatus,
        setAgent,
        setProgress,
        addLog,
        failJob
    } = useJobStore();

    // Mutation to create a job
    const createJobMutation = useMutation({
        mutationFn: jobsApi.createJob,
        onSuccess: (data) => {
            setStoreJob(data.jobId);
        },
        onError: (error: ApiClientError) => {
            failJob(error.message);
        }
    });

    // Query to poll job status
    const { data: jobStatus, error } = useQuery({
        queryKey: ['job', jobId],
        queryFn: () => jobsApi.getJobStatus(jobId!),
        enabled: !!jobId && status !== 'completed' && status !== 'failed',
        refetchInterval: (query) => {
            const data = query.state.data;
            if (data?.status === 'completed' || data?.status === 'failed') {
                return false;
            }
            return JOB_POLL_INTERVAL;
        },
        refetchIntervalInBackground: true,
    });

    // Sync Query Data to Store
    useEffect(() => {
        if (jobStatus) {
            updateStatus(jobStatus.status);
            setProgress(jobStatus.progress);

            if (jobStatus.currentAgent) {
                setAgent(jobStatus.currentAgent);
            }

            // Add new logs (rudimentary deduping via length check would be better, but this suffices for now)
            if (jobStatus.logs && jobStatus.logs.length > 0) {
                const latestLog = jobStatus.logs[jobStatus.logs.length - 1];
                if (latestLog) addLog(latestLog); // Simply adding latest for stream effect
            }
        }
    }, [jobStatus, updateStatus, setProgress, setAgent, addLog]);

    // Handle Polling Errors
    useEffect(() => {
        if (error) {
            failJob((error as unknown as ApiClientError).message);
        }
    }, [error, failJob]);

    return {
        createJob: createJobMutation.mutate,
        isCreating: createJobMutation.isPending,
        jobStatus,
        error
    };
};

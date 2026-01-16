import { useMutation } from '@tanstack/react-query';
import { uploadApi } from '@/api/upload';
import { useUploadStore } from '@/stores/uploadStore';
import { ApiClientError } from '@/api/client';

export const useFileUpload = () => {
    const {
        files,
        setUploading,
        setProgress,
        setError,
        reset
    } = useUploadStore();

    const mutation = useMutation({
        mutationFn: async () => {
            // 1. Reset state
            setProgress(0);
            setUploading(true);
            setError(null);

            // 2. Perform upload
            const response = await uploadApi.uploadFiles(files, (progress) => {
                setProgress(progress);
            });
            return response;
        },
        onSuccess: () => {
            setUploading(false);
            // We don't verify success here, step 2 (Job creation) handles connection
        },
        onError: (error: ApiClientError) => {
            setUploading(false);
            setProgress(0);
            setError(error.message);
        }
    });

    return {
        upload: mutation.mutate,
        isUploading: mutation.isPending,
        error: mutation.error as ApiClientError | null,
        reset,
    };
};

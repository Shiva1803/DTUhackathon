import { apiClient } from './client';
import { FileWithPreview } from '@/stores/uploadStore';

export interface UploadResponse {
    uploadId: string;
    fileCount: number;
    totalSize: number;
}

export const uploadApi = {
    /**
     * Upload files with progress tracking
     * @param files Array of files to upload
     * @param onProgress Callback for upload progress percentage
     */
    uploadFiles: async (
        files: FileWithPreview[],
        onProgress?: (progress: number) => void
    ): Promise<UploadResponse> => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const { data } = await apiClient.post<UploadResponse>('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total && onProgress) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percentCompleted);
                }
            },
        });

        return data;
    }
};

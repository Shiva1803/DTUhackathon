import { create } from 'zustand';

/**
 * Upload Store
 * Manages file selection, validation, and upload lifecycle
 */

export interface FileWithPreview extends File {
    preview?: string;
    id: string;
}

interface UploadState {
    files: FileWithPreview[];
    isUploading: boolean;
    uploadProgress: number;
    error: string | null;

    // Actions
    addFiles: (files: File[]) => void;
    removeFile: (id: string) => void;
    setUploading: (isUploading: boolean) => void;
    setProgress: (progress: number) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
    files: [],
    isUploading: false,
    uploadProgress: 0,
    error: null,

    addFiles: (newFiles) => set((state) => {
        // Generate IDs and preview URLs for images
        const processedFiles = newFiles.map(file => {
            const isImage = file.type.startsWith('image/');
            return Object.assign(file, {
                preview: isImage ? URL.createObjectURL(file) : undefined,
                id: Math.random().toString(36).substring(7)
            });
        });

        return {
            files: [...state.files, ...processedFiles],
            error: null
        };
    }),

    removeFile: (id) => set((state) => ({
        files: state.files.filter(f => f.id !== id)
    })),

    setUploading: (isUploading) => set({ isUploading }),
    setProgress: (uploadProgress) => set({ uploadProgress }),
    setError: (error) => set({ error }),

    reset: () => set({
        files: [],
        isUploading: false,
        uploadProgress: 0,
        error: null
    })
}));

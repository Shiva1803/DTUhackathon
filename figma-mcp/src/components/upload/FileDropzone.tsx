import { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, X, AlertCircle } from 'lucide-react';
import { useUploadStore } from '@/stores/uploadStore';
import { useAnnounce } from '@/components/a11y/ScreenReaderAnnouncer';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/utils/cn';

/**
 * FileDropzone Component
 * 
 * A premium, glassmorphic drag-and-drop zone.
 * Features:
 * - Breathing idle animation (respects reduced motion)
 * - Smooth drag-over state
 * - File list with remove actions
 * - Error handling with accessible announcements
 */

const FILE_ERROR_MESSAGES: Record<string, string> = {
    'file-invalid-type': "This doesn't look like valid activity data. We support JSON and CSV files.",
    'file-too-large': "This file is too large. Please use files under 10MB.",
    'too-many-files': "Too many files. Please upload up to 5 files at a time."
};

export function FileDropzone() {
    const { files, addFiles, removeFile, error, setError } = useUploadStore();
    const announce = useAnnounce();
    const prefersReducedMotion = useReducedMotion();

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        if (rejectedFiles.length > 0) {
            const firstError = rejectedFiles[0]?.errors[0];
            const errorMessage = firstError 
                ? FILE_ERROR_MESSAGES[firstError.code] || firstError.message
                : "Some files couldn't be added.";
            setError(errorMessage);
            announce(errorMessage, 'assertive');
            return;
        }

        if (acceptedFiles.length > 0) {
            addFiles(acceptedFiles);
            announce(`${acceptedFiles.length} file${acceptedFiles.length > 1 ? 's' : ''} added successfully`, 'polite');
        }
    }, [addFiles, setError, announce]);

    const handleRemoveFile = (id: string, fileName: string) => {
        removeFile(id);
        announce(`${fileName} removed`, 'polite');
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/json': ['.json'],
            'text/csv': ['.csv']
        },
        maxFiles: 5,
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: true
    });

    return (
        <div className="w-full max-w-xl mx-auto space-y-6">
            {/* Dropzone Area */}
            <div
                {...getRootProps()}
                role="button"
                aria-label="Upload activity data files. Drag and drop or click to select. Accepts JSON and CSV files."
                tabIndex={0}
                className={cn(
                    "relative group cursor-pointer rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 ease-out p-12 text-center overflow-hidden",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
                    isDragActive ? "border-accent-primary/50 bg-white/10 scale-[1.02] shadow-glow" : "hover:border-white/20 hover:bg-white/5",
                    error && "border-accent-error/50"
                )}
            >
                <input {...getInputProps()} aria-describedby="dropzone-hint" />

                {/* Animated Background Gradient */}
                <div 
                    className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
                    aria-hidden="true" 
                />

                <div className="relative z-10 flex flex-col items-center gap-4">
                    {/* Breathing Icon */}
                    <motion.div
                        animate={prefersReducedMotion ? {} : {
                            scale: isDragActive ? 1.1 : [1, 1.05, 1],
                            y: isDragActive ? -5 : [0, -3, 0]
                        }}
                        transition={{
                            duration: isDragActive ? 0.2 : 4,
                            repeat: isDragActive ? 0 : Infinity,
                            ease: "easeInOut"
                        }}
                        className="p-4 rounded-full bg-white/5 border border-white/10 text-text-primary"
                        aria-hidden="true"
                    >
                        <UploadCloud size={32} strokeWidth={1.5} />
                    </motion.div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-display font-medium text-text-primary">
                            {isDragActive ? "Release to begin reflection" : "Drop your activity data here"}
                        </h3>
                        <p id="dropzone-hint" className="text-sm text-text-secondary">
                            Spotify History or Screen Time Export (JSON, CSV)
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                        className="flex items-center gap-2 text-sm text-accent-error justify-center"
                        role="alert"
                    >
                        <AlertCircle size={14} aria-hidden="true" />
                        <span>{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* File List */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.ul
                        initial={prefersReducedMotion ? {} : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid gap-2"
                        aria-label={`${files.length} file${files.length > 1 ? 's' : ''} selected`}
                    >
                        {files.map((file) => (
                            <motion.li
                                key={file.id}
                                layout={!prefersReducedMotion}
                                initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                                className="flex items-center justify-between p-3 rounded-xl bg-bg-secondary border border-white/5 group"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 rounded-lg bg-white/5 text-text-tertiary" aria-hidden="true">
                                        <File size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                                        <p className="text-xs text-text-secondary">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFile(file.id, file.name);
                                    }}
                                    className="p-2 rounded-full text-text-tertiary hover:bg-white/10 hover:text-accent-error transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                                    aria-label={`Remove ${file.name}`}
                                >
                                    <X size={14} />
                                </button>
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}

import { motion } from 'framer-motion';
import { FileWarning, Upload, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ValidationErrorProps {
    type: 'invalid-format' | 'corrupted' | 'empty' | 'too-large';
    fileName?: string;
    onTryAgain?: () => void;
    onLearnMore?: () => void;
}

const ERROR_CONTENT = {
    'invalid-format': {
        title: "This doesn't look like valid activity data",
        message: "We support JSON exports from Spotify or CSV screen time data.",
        hint: "Make sure you're uploading the right file type."
    },
    'corrupted': {
        title: "This file couldn't be read",
        message: "The data appears to be corrupted or incomplete.",
        hint: "Try exporting a fresh copy from the source app."
    },
    'empty': {
        title: "This file appears to be empty",
        message: "We didn't find any activity data to analyze.",
        hint: "Check that your export contains actual usage history."
    },
    'too-large': {
        title: "This file is too large",
        message: "We can handle files up to 10MB for now.",
        hint: "Try exporting a shorter time range."
    }
};

/**
 * Validation Error Component
 * 
 * User-friendly display for input validation issues.
 * No technical jargon, always helpful.
 */
export function ValidationError({ type, fileName, onTryAgain, onLearnMore }: ValidationErrorProps) {
    const content = ERROR_CONTENT[type];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md mx-auto p-6 rounded-xl bg-bg-secondary border border-accent-error/20 space-y-5"
        >
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-accent-error/10">
                    <FileWarning size={20} className="text-accent-error" />
                </div>
                <div className="flex-1 space-y-1">
                    <h3 className="text-base font-medium text-text-primary">
                        {content.title}
                    </h3>
                    {fileName && (
                        <p className="text-xs text-text-tertiary font-mono truncate">
                            {fileName}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-2 pl-14">
                <p className="text-sm text-text-secondary">
                    {content.message}
                </p>
                <p className="text-xs text-text-tertiary">
                    💡 {content.hint}
                </p>
            </div>

            <div className="flex gap-3 pl-14">
                {onTryAgain && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onTryAgain}
                        leftIcon={<Upload size={14} />}
                    >
                        Upload different file
                    </Button>
                )}
                {onLearnMore && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onLearnMore}
                        leftIcon={<HelpCircle size={14} />}
                    >
                        Supported formats
                    </Button>
                )}
            </div>
        </motion.div>
    );
}

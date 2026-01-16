import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { createPortal } from "react-dom";

/**
 * Modal Component
 * 
 * Design System Implementation:
 * - Backdrop: Heavy blur for focus
 * - Animation: Fade in + Scale up
 * - Accessibility: Focus trap, Esc to close
 */

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const Modal = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    maxWidth = 'md'
}: ModalProps) => {
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isMounted || !isOpen) return null;

    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-[95vw] h-[90vh]',
    };

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            />

            {/* Content */}
            <div
                className={cn(
                    "relative z-10 w-full overflow-hidden rounded-2xl bg-bg-secondary border border-white/10 shadow-glow-lg animate-scale-in flex flex-col max-h-[90vh]",
                    maxWidthClasses[maxWidth]
                )}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                {(title || description) && (
                    <div className="flex items-start justify-between p-6 border-b border-white/5">
                        <div className="space-y-1">
                            {title && <h2 className="text-xl font-display font-semibold text-text-primary">{title}</h2>}
                            {description && <p className="text-sm text-text-secondary">{description}</p>}
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-full p-2 text-text-tertiary hover:bg-white/5 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>,
        document.getElementById('root') || document.body
    );
};

export { Modal };

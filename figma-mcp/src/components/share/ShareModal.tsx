import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { X, Download, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShareCard } from './ShareCard';
import { cn } from '@/utils/cn';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        insight: string;
        date: string;
    }
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, data }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [aspect, setAspect] = useState<'square' | 'portrait' | 'story'>('square');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2, // Retina
                backgroundColor: '#050505',
                logging: false,
                useCORS: true
            });
            const link = document.createElement('a');
            link.download = `identity-trajectory-${aspect}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Export failed", err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText("Check out my identity trajectory!");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-bg-secondary w-full max-w-4xl max-h-[90vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row overflow-hidden"
                    >
                        {/* Close Button */}
                        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 text-white/60 hover:text-white hover:bg-black/40 transition-colors">
                            <X size={20} />
                        </button>

                        {/* Preview Area (Left/Top) */}
                        <div className="flex-1 bg-[#1A1A1C] p-8 flex items-center justify-center overflow-auto min-h-[400px]">
                            {/* The Card Render Target */}
                            <div className="shadow-2xl shadow-black/50">
                                <ShareCard ref={cardRef} aspect={aspect} data={data} />
                            </div>
                        </div>

                        {/* Controls (Right/Bottom) */}
                        <div className="w-full md:w-80 bg-bg-secondary p-6 md:p-8 border-l border-white/5 flex flex-col gap-6">
                            <div>
                                <h3 className="text-xl font-display font-medium text-white mb-1">Share Result</h3>
                                <p className="text-sm text-text-secondary">Choose a format for your socials.</p>
                            </div>

                            {/* Aspect Ratio Selector */}
                            <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/5">
                                {['square', 'portrait', 'story'].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setAspect(r as any)}
                                        className={cn(
                                            "flex-1 py-2 text-xs font-medium rounded-md capitalize transition-all",
                                            aspect === r ? "bg-accent-primary text-white shadow-lg" : "text-text-secondary hover:text-white"
                                        )}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1" />

                            {/* Actions */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleDownload}
                                    disabled={isGenerating}
                                    className="w-full py-3 rounded-lg bg-white text-black font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? (
                                        <span className="animate-pulse">Generating...</span>
                                    ) : (
                                        <>
                                            <Download size={18} />
                                            Download Image
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleCopy}
                                    className="w-full py-3 rounded-lg border border-white/10 text-text-primary hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                                >
                                    {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                                    {copied ? "Copied!" : "Copy Text"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

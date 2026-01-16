import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Circle } from 'lucide-react';
import { cn } from '@/utils/cn';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'error';

interface AgentNodeProps {
    label: string;
    status: AgentStatus;
    icon?: React.ReactNode;
    delay?: number;
}

/**
 * AgentNode Component
 * Represents a single step in the analysis pipeline.
 * Visual States:
 * - Idle: Low opacity, Lavender
 * - Running: Pulsing Wisteria ring, full opacity
 * - Completed: Solid Tuscan checkmark
 * - Error: Bubblegum tint
 */
export const AgentNode = memo(({ label, status, icon, delay = 0 }: AgentNodeProps) => {
    return (
        <div className="flex flex-col items-center gap-3 relative group">
            {/* Connector Line Placeholder (handled by parent usually, or we can add here) */}

            {/* Node Circle */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay, duration: 0.5 }}
                className={cn(
                    "relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-500",
                    // Status Styles
                    status === 'idle' && "border-white/5 bg-white/5 text-text-tertiary",
                    status === 'running' && "border-accent-primary bg-accent-primary/10 text-accent-primary shadow-[0_0_30px_rgba(0,80,255,0.4)]",
                    status === 'completed' && "border-accent-secondary bg-accent-secondary/10 text-accent-secondary shadow-[0_0_20px_rgba(0,214,255,0.3)]",
                    status === 'error' && "border-accent-error bg-accent-error/10 text-accent-error"
                )}
            >
                {/* Animated Ring for Running State */}
                {status === 'running' && (
                    <motion.div
                        className="absolute inset-[-4px] rounded-full border border-accent-primary/50"
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                    />
                )}

                {/* Icons based on status */}
                <div className="relative z-10">
                    {status === 'running' ? (
                        <div className="relative">
                            <Loader2 size={24} className="animate-spin absolute -inset-1 opacity-50" />
                            {icon}
                        </div>
                    ) : status === 'completed' ? (
                        <div className="relative">
                            {icon}
                            <div className="absolute -bottom-2 -right-2 bg-accent-secondary rounded-full p-0.5 text-bg-primary">
                                <Check size={10} strokeWidth={4} />
                            </div>
                        </div>
                    ) : icon ? (
                        icon
                    ) : (
                        <Circle size={12} fill="currentColor" className="opacity-50" />
                    )}
                </div>
            </motion.div>

            {/* Label */}
            <motion.span
                animate={{
                    opacity: status === 'idle' ? 0.4 : 1,
                    y: status === 'running' ? -2 : 0,
                    color: status === 'error' ? '#FF3333' : status === 'completed' ? '#00D6FF' : status === 'running' ? '#0050FF' : 'rgba(255,255,255,0.6)'
                }}
                className={cn(
                    "text-xs md:text-sm font-medium tracking-wide text-center uppercase transition-colors duration-300",
                    status === 'running' && "font-bold shadow-glow-text"
                )}
            >
                {label}
            </motion.span>
        </div>
    );
});

AgentNode.displayName = 'AgentNode';

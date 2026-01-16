import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AgentNode, AgentStatus } from './AgentNode';
import { AgentType } from '@/stores/jobStore';
import { Database, FileCode, GitBranch, PenTool, Share2, Sparkles } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/utils/cn';

interface PipelineProps {
    currentAgent: AgentType | null;
    jobStatus: 'idle' | 'queued' | 'processing' | 'completed' | 'failed';
}

const AGENTS: { id: AgentType; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'ingest', label: 'Ingest', icon: <Database />, description: 'Reading your data files' },
    { id: 'normalize', label: 'Normalize', icon: <FileCode />, description: 'Standardizing data format' },
    { id: 'phase', label: 'Phase Detection', icon: <GitBranch />, description: 'Identifying life phases' },
    { id: 'trajectory', label: 'Trajectory', icon: <PenTool />, description: 'Mapping your direction' },
    { id: 'narrative', label: 'Narrative', icon: <Sparkles />, description: 'Generating insights' },
    { id: 'export', label: 'Export', icon: <Share2 />, description: 'Preparing results' },
];

export const Pipeline = ({ currentAgent, jobStatus }: PipelineProps) => {
    const prefersReducedMotion = useReducedMotion();
    
    // Determine the index of the active agent
    const activeIndex = useMemo(() => {
        if (jobStatus === 'completed') return AGENTS.length;
        if (!currentAgent) return -1;
        return AGENTS.findIndex(a => a.id === currentAgent);
    }, [currentAgent, jobStatus]);

    const progressPercent = Math.min((activeIndex / (AGENTS.length - 1)) * 100, 100);

    return (
        <div 
            className="w-full max-w-5xl mx-auto px-4 py-12"
            role="group"
            aria-label="Analysis pipeline stages"
        >
            {/* Desktop Horizontal Layout */}
            <div className="hidden md:flex items-center justify-between relative z-10 w-full">
                {/* Connecting Line (Background) */}
                <div className="absolute top-6 left-0 w-full h-0.5 bg-white/10 -z-10" aria-hidden="true" />

                {/* Connecting Line (Progress) */}
                <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: "easeInOut" }}
                    className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-accent-primary to-accent-secondary -z-10 shadow-[0_0_15px_rgba(0,80,255,0.5)]"
                    aria-hidden="true"
                />

                {AGENTS.map((agent, index) => {
                    let status: AgentStatus = 'idle';
                    if (index < activeIndex) status = 'completed';
                    else if (index === activeIndex) status = jobStatus === 'failed' ? 'error' : 'running';

                    return (
                        <div
                            key={agent.id}
                            role="listitem"
                            aria-label={`${agent.label}: ${status === 'completed' ? 'Complete' : status === 'running' ? 'In progress' : status === 'error' ? 'Error' : 'Pending'}`}
                            aria-current={status === 'running' ? 'step' : undefined}
                        >
                            <AgentNode
                                label={agent.label}
                                status={status}
                                icon={agent.icon}
                                delay={prefersReducedMotion ? 0 : index * 0.1}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Mobile Vertical Layout */}
            <div 
                className="md:hidden flex flex-col gap-8 relative pl-6 border-l border-white/10 ml-6"
                role="list"
                aria-label="Analysis stages"
            >
                {/* Vertical Progress Bar */}
                <motion.div
                    initial={{ height: '0%' }}
                    animate={{ height: `${progressPercent}%` }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: "easeInOut" }}
                    className="absolute top-0 left-[-1px] w-0.5 bg-gradient-to-b from-accent-primary to-accent-secondary shadow-[0_0_15px_rgba(0,80,255,0.5)]"
                    style={{ width: '2px' }}
                    aria-hidden="true"
                />

                {AGENTS.map((agent, index) => {
                    let status: AgentStatus = 'idle';
                    if (index < activeIndex) status = 'completed';
                    else if (index === activeIndex) status = jobStatus === 'failed' ? 'error' : 'running';

                    return (
                        <div 
                            key={agent.id} 
                            className="flex items-center gap-4 relative"
                            role="listitem"
                            aria-label={`${agent.label}: ${status === 'completed' ? 'Complete' : status === 'running' ? 'In progress' : status === 'error' ? 'Error' : 'Pending'}`}
                            aria-current={status === 'running' ? 'step' : undefined}
                        >
                            <div className="absolute left-[-34px]">
                                <AgentNode
                                    label=""
                                    status={status}
                                    icon={agent.icon}
                                    delay={prefersReducedMotion ? 0 : index * 0.1}
                                />
                            </div>
                            <span className={cn(
                                "text-sm font-medium uppercase tracking-wider transition-colors duration-300 ml-4",
                                status === 'idle' ? "text-text-secondary" : "text-text-primary"
                            )}>
                                {agent.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

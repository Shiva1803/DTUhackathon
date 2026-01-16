import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowUpRight } from 'lucide-react';
import { AudioPlayer } from '../ui/AudioPlayer';

interface TrajectoryData {
    title: string;
    statement: string;
    evidence: string[];
}

const MOCK_TRAJECTORY: TrajectoryData = {
    title: "Your current trajectory",
    statement: "Your time has been leaning toward exploration and consumption, suggesting a period of information gathering before a shift to creation.",
    evidence: [
        "Consistent late-night research blocks (10pm - 2am)",
        "High diversity in content consumption sources",
        "Reduced output frequency in the last 2 weeks"
    ]
};

export const TrajectoryCard: React.FC = () => {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!cardRef.current) return;

        // Hero Reveal
        gsap.fromTo(cardRef.current,
            { opacity: 0, scale: 0.98, y: 20 },
            {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 1.2,
                ease: "power3.out",
                delay: 0.2
            }
        );
    }, []);

    return (
        <div ref={cardRef} className="relative w-full max-w-4xl mx-auto mb-20 p-8 md:p-12 rounded-3xl bg-bg-secondary border border-white/5 shadow-2xl overflow-hidden">
            {/* Ambient Background Gradient (Subtle) */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/5 blur-[120px] rounded-full mix-blend-screen pointer-events-none -translate-y-1/2 translate-x-1/4" />

            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-start">

                {/* Left Column: Narrative */}
                <div className="space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-3xl md:text-4xl font-display font-light text-text-primary leading-tight">
                            {MOCK_TRAJECTORY.title}
                        </h2>
                        <p className="text-sm text-text-tertiary uppercase tracking-wider font-medium">
                            A reflection based on recent patterns
                        </p>
                    </div>

                    <div className="relative pl-6 border-l-2 border-accent-primary/30 py-2">
                        <p className="text-xl md:text-2xl text-text-primary font-medium leading-relaxed">
                            &ldquo;{MOCK_TRAJECTORY.statement}&rdquo;
                        </p>
                    </div>

                    <div className="pt-4">
                        <AudioPlayer />
                    </div>
                </div>

                {/* Right Column: Direction & Evidence */}
                <div className="space-y-10">

                    {/* Visual Direction Indicator (Abstract Arrow) */}
                    <div className="relative h-32 w-full flex items-center justify-center opacity-80">
                        <svg width="100%" height="100%" viewBox="0 0 200 100" className="opacity-60">
                            {/* Abstract Arc */}
                            <path
                                d="M 20 80 Q 100 80 160 20"
                                fill="none"
                                stroke="#0050FF"
                                strokeWidth="2"
                                strokeDasharray="4 4"
                            />
                            {/* Arrowhead */}
                            <path
                                d="M 150 20 L 160 20 L 160 30"
                                fill="none"
                                stroke="#0050FF"
                                strokeWidth="2"
                            />
                            <circle cx="20" cy="80" r="4" fill="#0050FF" />
                        </svg>
                    </div>

                    {/* Evidence Highlights */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-widest">
                            Key Signals
                        </h3>
                        <ul className="space-y-3">
                            {MOCK_TRAJECTORY.evidence.map((item, i) => (
                                <li key={i} className="flex gap-3 text-text-secondary text-sm md:text-base">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-primary/60 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button className="flex-1 py-3 px-6 rounded-lg bg-accent-primary text-bg-primary font-semibold hover:bg-accent-primary/90 transition-colors flex items-center justify-center gap-2">
                            Explore next steps
                            <ArrowUpRight size={18} />
                        </button>
                        <button className="py-3 px-6 rounded-lg border border-white/10 text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
                            Keep things as they are
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

import { useState, useEffect, Suspense, lazy } from 'react';
import { useResults } from '@/hooks/useResults';
import { TrajectoryCard } from '@/components/results/TrajectoryCard';
import { ShareModal } from '@/components/share/ShareModal';
import { PageTransition } from '@/components/layout/PageTransition';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAnnounce } from '@/components/a11y/ScreenReaderAnnouncer';
import { Share2, ChevronRight } from 'lucide-react';

// Lazy load heavy D3 component
const PhaseTimeline = lazy(() => 
    import('@/components/results/PhaseTimeline').then(m => ({ default: m.PhaseTimeline }))
);

export default function Results() {
    const { results } = useResults();
    const [isShareOpen, setIsShareOpen] = useState(false);
    const announce = useAnnounce();

    // Announce page load
    useEffect(() => {
        announce('Your identity trajectory results are ready', 'polite');
    }, [announce]);

    const shareData = {
        insight: results?.identityStatement || "Focus -> Creation",
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };

    const handleShare = () => {
        setIsShareOpen(true);
        announce('Share dialog opened', 'polite');
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden selection:bg-accent-primary/30 pb-20">
                {/* Ambient Background */}
                <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent-primary/5 blur-[120px] rounded-full mix-blend-screen" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-secondary/5 blur-[100px] rounded-full mix-blend-screen" />
                </div>

                <main 
                    className="relative z-10 container mx-auto px-6 py-12 md:py-20 max-w-7xl space-y-24"
                    role="region"
                    aria-label="Analysis results"
                >
                    {/* Header Section */}
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 max-w-4xl mx-auto w-full">
                        <div>
                            <div 
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-accent-secondary mb-6 uppercase tracking-wider"
                                role="status"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary animate-pulse" aria-hidden="true" />
                                Identity Trajectory Mapped
                            </div>
                            <h1 className="text-5xl md:text-6xl font-display font-light leading-tight mb-2 bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
                                The evolution of<br />your focus.
                            </h1>
                        </div>

                        <button
                            onClick={handleShare}
                            className="group flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/5 hover:border-accent-primary/50 transition-all text-sm font-medium text-text-secondary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
                            aria-label="Share your results"
                        >
                            <Share2 size={16} aria-hidden="true" />
                            Share Result
                        </button>
                    </header>

                    {/* Trajectory Hero */}
                    <section aria-label="Your current trajectory">
                        <TrajectoryCard />
                    </section>

                    {/* Timeline Visualization */}
                    <section className="max-w-5xl mx-auto space-y-8" aria-label="Phase history timeline">
                        <div className="px-6 border-l-2 border-white/10">
                            <h2 className="text-xl font-display font-medium text-text-primary">Phase History</h2>
                            <p className="text-sm text-text-secondary">How your allocation has shifted over time.</p>
                        </div>
                        <Suspense fallback={
                            <div className="flex items-center justify-center h-64">
                                <LoadingSpinner label="Loading timeline visualization" />
                            </div>
                        }>
                            <PhaseTimeline phases={results?.phases || []} />
                        </Suspense>
                    </section>

                    {/* Footer / Continue */}
                    <nav className="flex justify-center pt-12" aria-label="Next steps">
                        <button 
                            className="group flex items-center gap-4 px-8 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent-primary/50 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
                            aria-label="Explore intervention suggestions"
                        >
                            <span className="text-sm font-medium tracking-wide">Explore Interventions</span>
                            <ChevronRight className="w-4 h-4 text-accent-primary group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                        </button>
                    </nav>

                </main>

                <ShareModal
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    data={shareData}
                />
            </div>
        </PageTransition>
    );
}

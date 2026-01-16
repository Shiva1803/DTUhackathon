import React, { useEffect, useRef, useState } from 'react';
import * as D3 from 'd3';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';
import { Phase } from '@/stores/resultsStore';

gsap.registerPlugin(ScrollTrigger);

interface PhaseTimelineProps {
    phases: Phase[];
}

const MOCK_PHASES: Phase[] = [
    {
        id: '1',
        name: 'Exploration Mode',
        startDate: '2025-01-01',
        endDate: '2025-03-15',
        description: 'High variability in activity. Seeking patterns.',
        color: '#0050FF',
        dominantCategories: ['Research', 'Ideation'],
        confidenceScore: 0.85
    },
    {
        id: '2',
        name: 'Deep Focus',
        startDate: '2025-03-16',
        endDate: '2025-06-30',
        description: 'Sustained engagement with core topics.',
        color: '#0050FF',
        dominantCategories: ['Development', 'Writing'],
        confidenceScore: 0.92
    },
    {
        id: '3',
        name: 'Integration',
        startDate: '2025-07-01',
        endDate: '2025-12-31',
        description: 'Merging disparate threads into cohesive output.',
        color: '#0050FF',
        dominantCategories: ['Synthesis', 'Review'],
        confidenceScore: 0.88
    }
];

export const PhaseTimeline: React.FC<PhaseTimelineProps> = ({ phases = [] }) => {
    // Use Mock data if empty for visualization during dev
    const data = phases.length > 0 ? phases : MOCK_PHASES;

    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: Phase | null }>({ x: 0, y: 0, content: null });
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Handle Resize
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            if (!entries[0]) return;
            setDimensions({
                width: entries[0].contentRect.width,
                height: window.innerWidth < 768 ? 600 : 350 // Taller for mobile
            });
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // D3 Render Logic
    useEffect(() => {
        if (!svgRef.current || dimensions.width === 0) return;

        const svg = D3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous

        const isMobile = window.innerWidth < 768;
        const margin = { top: 60, right: 30, bottom: 40, left: isMobile ? 60 : 40 };
        const width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const dates = data.flatMap(p => [new Date(p.startDate), new Date(p.endDate)]);
        const timeDomain = D3.extent(dates) as [Date, Date];

        if (!timeDomain[0] || !timeDomain[1]) return;

        const xScale = isMobile
            ? D3.scaleLinear().domain([0, 1]).range([0, width])
            : D3.scaleTime().domain(timeDomain).range([0, width]);

        const yScale = isMobile
            ? D3.scaleTime().domain(timeDomain).range([0, height])
            : D3.scaleLinear().domain([0, 1]).range([height / 2, height / 2]);

        // Axis
        if (isMobile) {
            const yAxis = D3.axisLeft(yScale)
                .ticks(6)
                .tickSize(-width)
                .tickFormat(D3.timeFormat('%b') as any);

            const axisG = g.append('g').call(yAxis).attr('class', 'axis-mobile');
            axisG.selectAll('text').attr('fill', 'rgba(255,255,255,0.4)').attr('font-size', '12px');
            axisG.selectAll('line').attr('stroke', 'rgba(255,255,255,0.1)').attr('stroke-dasharray', '2,2');
            axisG.select('.domain').remove();
        } else {
            const xAxis = D3.axisBottom(xScale as D3.ScaleTime<number, number>)
                .ticks(6)
                .tickSize(-height)
                .tickFormat(D3.timeFormat('%b %Y') as any);

            const axisG = g.append('g')
                .attr('transform', `translate(0, ${height})`)
                .call(xAxis);

            axisG.selectAll('text').attr('fill', 'rgba(255,255,255,0.4)').attr('dy', '1.5em').attr('font-size', '12px');
            axisG.selectAll('line').attr('stroke', 'rgba(255,255,255,0.1)').attr('stroke-dasharray', '2,2');
            axisG.select('.domain').remove();
        }

        // Draw Phases
        const phaseGroup = g.append('g').attr('class', 'phases');

        data.forEach((phase, i) => {
            const startDate = new Date(phase.startDate);
            const endDate = new Date(phase.endDate);

            let x = 0, y = 0, w = 0, h = 0;

            if (isMobile) {
                y = yScale(startDate);
                h = yScale(endDate) - yScale(startDate);
                x = 10;
                w = width - 20;
            } else {
                x = (xScale as D3.ScaleTime<number, number>)(startDate);
                w = (xScale as D3.ScaleTime<number, number>)(endDate) - x;
                y = 50; // Use fixed vertical space inside chart
                h = height - 100;
            }

            // Group
            const block = phaseGroup.append('g')
                .attr('class', `phase-block phase-${i}`)
                .style('cursor', 'pointer');

            // Block Rect
            block.append('rect')
                .attr('x', x)
                .attr('y', y)
                .attr('width', Math.max(w, 2))
                .attr('height', h)
                .attr('rx', 4)
                .attr('fill', '#0050FF')
                .attr('fill-opacity', 0.15)
                .attr('stroke', '#0050FF')
                .attr('stroke-opacity', 0.6)
                .attr('stroke-width', 1);

            // Label
            if ((!isMobile && w > 80) || (isMobile && h > 40)) {
                block.append('text')
                    .attr('x', isMobile ? x + 10 : x + w / 2)
                    .attr('y', isMobile ? y + 20 : y + h + 20)
                    .attr('text-anchor', isMobile ? 'start' : 'middle')
                    .attr('fill', 'rgba(255,255,255,0.9)')
                    .attr('font-size', '12px')
                    .attr('font-weight', '500')
                    .text(phase.name);
            }

            // Interactions
            block.on('mouseenter', (e) => {
                D3.select(e.currentTarget).select('rect')
                    .transition().duration(200)
                    .attr('fill-opacity', 0.3)
                    .attr('stroke', '#00D6FF')
                    .attr('stroke-width', 2);

                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    setTooltip({
                        x: e.clientX - rect.left, // Relative to container
                        y: e.clientY - rect.top,
                        content: phase
                    });
                }
            });

            block.on('mouseleave', (e) => {
                D3.select(e.currentTarget).select('rect')
                    .transition().duration(200)
                    .attr('fill-opacity', 0.15)
                    .attr('stroke', '#0050FF')
                    .attr('stroke-width', 1);

                setTooltip(prev => ({ ...prev, content: null }));
            });
        });

        // GSAP
        const blocks = phaseGroup.selectAll('g').nodes();
        gsap.fromTo(blocks,
            { opacity: 0, scale: 0.98 },
            {
                opacity: 1,
                scale: 1,
                duration: 0.8,
                stagger: 0.2,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top 85%'
                }
            }
        );

    }, [dimensions, data]);

    return (
        <div ref={containerRef} className="relative w-full overflow-hidden select-none bg-bg-primary/50 rounded-xl border border-white/5">
            {/* Header */}
            <div className="absolute top-0 left-0 px-6 py-4 z-10 pointer-events-none">
                <h3 className="text-xl font-display font-medium text-text-primary">Your recent phases</h3>
                <p className="text-sm text-text-secondary">A high-level view of how your time has shifted.</p>
            </div>

            {/* SVG Canvas */}
            <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                className="w-full h-full block"
            />

            {/* Tooltip Overlay */}
            <AnimatePresence>
                {tooltip.content && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ top: tooltip.y + 20, left: tooltip.x }}
                        className="absolute z-50 pointer-events-none bg-bg-secondary border border-accent-primary/20 backdrop-blur-md px-4 py-3 rounded-xl shadow-2xl min-w-[200px]"
                    >
                        <p className="text-sm font-bold text-text-primary">{tooltip.content.name}</p>
                        <div className="text-[10px] text-text-tertiary mt-0.5 mb-2 uppercase tracking-wide">
                            {new Date(tooltip.content.startDate).toLocaleDateString()} — {new Date(tooltip.content.endDate).toLocaleDateString()}
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed max-w-[220px]">
                            {tooltip.content.description}
                        </p>
                        <div className="mt-2 text-[10px] text-accent-secondary uppercase tracking-wider font-semibold">
                            {tooltip.content.dominantCategories.slice(0, 2).join(' • ')}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

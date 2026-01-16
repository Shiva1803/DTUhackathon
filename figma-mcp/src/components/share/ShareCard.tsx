import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface ShareCardProps {
    aspect: 'square' | 'portrait' | 'story';
    data: {
        insight: string;
        date: string;
    }
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ aspect, data }, ref) => {

    // Dimensions based on aspect ratio
    const dimensions = {
        square: 'w-[400px] h-[400px]',
        portrait: 'w-[400px] h-[500px]',
        story: 'w-[360px] h-[640px]'
    }[aspect];

    return (
        <div
            ref={ref}
            className={cn(
                "relative bg-[#050505] overflow-hidden flex flex-col p-8 select-none",
                dimensions
            )}
            style={{
                // Ensure high contrast and sharp rendering for canvas
                fontSmooth: 'always',
                WebkitFontSmoothing: 'antialiased'
            }}
        >
            {/* Minimal Brand Mark (Top Left) */}
            <div className="absolute top-8 left-8 flex items-center gap-2 opacity-50">
                <div className="w-3 h-3 rounded-full bg-[#0050FF]" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white">Identity Trajectory</span>
            </div>

            {/* Content Centered */}
            <div className="flex-1 flex flex-col justify-center items-start">
                <h1 className="text-3xl font-display font-light text-white leading-tight mb-2">
                    My Parallax
                </h1>
                <p className="text-sm text-white/60 mb-8 border-b border-[#0050FF] pb-4 inline-block">
                    A reflection on time &amp; focus
                </p>

                <p className="text-xl md:text-2xl font-serif italic text-white/90 leading-relaxed mb-8">
                    &ldquo;{data.insight}&rdquo;
                </p>

                {/* Visual abstract element */}
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-[#0050FF]" />
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end mt-auto">
                <div className="text-[10px] text-white/40 uppercase tracking-wider">
                    {data.date}
                </div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider">
                    parallax
                </div>
            </div>

            {/* Noise Texture Overlay (Optional) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0MDAnIGhlaWdodD0nNDAwJz48ZmlsdGVyIGlkPSdub2lzZSc+PGZlVHVyYnVsZW5jZSB0eXBlPSdmcmFjdGFsTm9pc2UnIGJhc2BGcmVxdWVuY3k9JzAuNjUnIG51bU9jdGF2ZXM9JzMnIHN0aXRjaFRpbGVzPSdzdGl0Y2gnLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyBmaWx0ZXI9J3VybCgjbm9pc2UpJyBvcGFjaXR5PScwLjUnLz48L3N2Zz4=")' }} />
        </div>
    );
});

ShareCard.displayName = "ShareCard";

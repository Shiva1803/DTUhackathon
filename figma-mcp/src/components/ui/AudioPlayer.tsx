import React, { useState, useEffect } from 'react';
import { Howl } from 'howler';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
    src?: string; // Optional for dev, defaults to a placeholder
    label?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
    src = "https://actions.google.com/sounds/v1/water/waves_crashing.ogg", // Placeholder sound
    label = "Listen to a short summary"
}) => {
    const [playing, setPlaying] = useState(false);
    const [sound, setSound] = useState<Howl | null>(null);

    useEffect(() => {
        const newSound = new Howl({
            src: [src],
            html5: true,
            onend: () => setPlaying(false),
            onloaderror: (_id, err) => console.error("Audio Load Error", err)
        });
        setSound(newSound);

        return () => {
            newSound.unload();
        };
    }, [src]);

    const togglePlay = () => {
        if (!sound) return;
        if (playing) {
            sound.pause();
        } else {
            sound.play();
        }
        setPlaying(!playing);
    };

    return (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 max-w-sm hover:border-accent-primary/30 transition-colors group cursor-pointer" onClick={togglePlay}>
            <button
                className="flex items-center justify-center w-10 h-10 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 group-hover:scale-110 transition-transform"
                aria-label={playing ? "Pause" : "Play"}
            >
                {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>

            <div className="flex flex-col">
                <span className="text-sm font-medium text-text-primary">{label}</span>
                <span className="text-xs text-text-secondary group-hover:text-accent-primary transition-colors">
                    {playing ? "Playing..." : "1:20 • Audio Insight"}
                </span>
            </div>

            <div className="ml-auto opacity-50 group-hover:opacity-100 transition-opacity">
                <Volume2 size={16} className="text-text-tertiary" />
            </div>
        </div>
    );
};

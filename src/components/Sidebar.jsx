import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square } from 'lucide-react';

const Sidebar = ({ periods, selectedPeriod, onSelectPeriod, hasInteracted }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const [volume, setVolume] = useState(0.5);

    useEffect(() => {
        // A lógica só roda se o usuário já tiver interagido com a página
        if (!audioRef.current || !selectedPeriod || !hasInteracted) return;

        if (selectedPeriod.referenceSong) {
            const isNewSong = !audioRef.current.src.endsWith(selectedPeriod.referenceSong);
            
            if (isNewSong) {
                audioRef.current.src = selectedPeriod.referenceSong;
            }

            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    setIsPlaying(false);
                    console.warn("Reprodução de áudio falhou. O navegador pode ter bloqueado.");
                });
            }
        }
    }, [selectedPeriod, hasInteracted]); // Roda o efeito quando o período ou o estado de interação mudam

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const handlePlayPause = () => {
        if (!audioRef.current?.src) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(() => console.error("Falha ao reproduzir áudio."));
        }
    };

    const handleStop = () => {
        if (audioRef.current?.src) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    return (
        <aside className="w-64 bg-black/30 backdrop-blur-md border-r-2 border-amber-900/50 flex flex-col flex-shrink-0">
            <header className="text-center p-4 border-b-2 border-amber-900/50">
                <h1 className="text-2xl lg:text-3xl font-title text-amber-300" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>
                    Codex Historiæ Musicæ
                </h1>
            </header>

            <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin">
                <ul className="space-y-2">
                    {periods.map(period => (
                        <li key={period.id}>
                            <button 
                                onClick={() => onSelectPeriod(period.id)}
                                className={`w-full text-left px-4 py-3 rounded-md text-base font-semibold transition-all duration-200 flex items-center gap-3
                                    ${selectedPeriod?.id === period.id 
                                        ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' 
                                        : 'text-amber-200 hover:bg-gray-700/50'
                                    }`}
                            >
                                <period.icon className="h-5 w-5 flex-shrink-0" />
                                <span>{period.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t-2 border-amber-900/50 space-y-3">
                <div className='flex items-center justify-center gap-4'>
                     <button onClick={handlePlayPause} className="p-2 rounded-full bg-amber-400/20 hover:bg-amber-400/40 text-amber-200 transition-colors">
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button onClick={handleStop} className="p-2 rounded-full bg-gray-600/30 hover:bg-gray-600/60 text-stone-300 transition-colors">
                        <Square size={20} />
                    </button>
                </div>
                <div className="w-full">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer range-sm accent-amber-300"
                        aria-label="Volume"
                    />
                </div>
            </div>

            <audio ref={audioRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} loop/>
        </aside>
    );
};

export default Sidebar;
import React, { useState } from 'react';
import { Play, Pause, Square, LogOut, Award, Star, BarChart2, ChevronDown, ChevronUp } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import './Sidebar.css';

const Sidebar = ({ 
    periods, 
    selectedPeriod, 
    onSelectPeriod, 
    hasInteracted, 
    user, 
    score, 
    achievements,
    stats,
    onLoginSuccess,
    onLogout
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = React.useRef(null);
    const [volume, setVolume] = useState(0.5);
    const [showProfileDetails, setShowProfileDetails] = useState(false);

    React.useEffect(() => {
        if (!audioRef.current || !selectedPeriod || !hasInteracted) return;
        if (selectedPeriod.referenceSong) {
            const isNewSong = !audioRef.current.src.endsWith(selectedPeriod.referenceSong);
            if (isNewSong) audioRef.current.src = selectedPeriod.referenceSong;
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => setIsPlaying(false));
            }
        }
    }, [selectedPeriod, hasInteracted]);
    
    React.useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    const handlePlayPause = () => {
        if (!audioRef.current?.src) return;
        isPlaying ? audioRef.current.pause() : audioRef.current.play().catch(console.error);
    };

    const handleStop = () => {
        if (audioRef.current?.src) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };
    
    const calculateWinRate = () => {
        if (!stats || !stats.quizzesCompleted) return '0%';
        const rate = (stats.correctAnswers / stats.quizzesCompleted) * 100;
        return `${rate.toFixed(1)}%`;
    }

    return (
        <aside className="w-64 bg-black/30 backdrop-blur-md border-r-2 border-amber-900/50 flex flex-col flex-shrink-0">
            <header className="text-center p-4 border-b-2 border-amber-900/50">
                <h1 className="text-2xl lg:text-3xl font-title gold-text-effect" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>
                    Codex Historiæ Musicæ
                </h1>
            </header>

            <div className="p-4 border-b-2 border-amber-900/50">
                {user ? (
                    <div className="flex flex-col items-center text-center">
                        <img 
                            src={user.picture} 
                            alt={user.name} 
                            className="w-16 h-16 rounded-full border-2 border-amber-400 mb-2"
                        />
                        <h2 className="font-semibold text-amber-200 truncate">{user.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Award className="text-amber-400" size={18} />
                            <p className="text-stone-300 font-bold">{score} pontos</p>
                        </div>

                        <button onClick={() => setShowProfileDetails(!showProfileDetails)} className="mt-4 w-full flex justify-between items-center px-3 py-2 bg-gray-700/50 rounded-md text-stone-200 hover:bg-gray-700">
                            <span>Ver Perfil Detalhado</span>
                            {showProfileDetails ? <ChevronUp size={18}/> : <ChevronDown size={18} />}
                        </button>
                        
                        {showProfileDetails && (
                            <div className="mt-2 w-full text-left p-3 bg-black/20 rounded-md border border-amber-900/50">
                                <h3 className="font-bold text-amber-300 mb-2 flex items-center gap-2"><BarChart2 size={16}/> Estatísticas</h3>
                                <p className="text-sm text-stone-300">Quizzes Concluídos: {stats.quizzesCompleted || 0}</p>
                                <p className="text-sm text-stone-300">Taxa de Acerto: {calculateWinRate()}</p>
                                
                                <h3 className="font-bold text-amber-300 mt-3 mb-2 flex items-center gap-2"><Star size={16}/> Conquistas</h3>
                                <div className="max-h-24 overflow-y-auto scrollbar-thin">
                                {achievements && achievements.length > 0 ? (
                                    achievements.map(ach => (
                                        <div key={ach.name} className="text-sm text-amber-400 mb-1" title={ach.description}>
                                            🏅 {ach.name}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-stone-400 italic">Nenhuma ainda.</p>
                                )}
                                </div>
                            </div>
                        )}
                        
                        <button onClick={onLogout} className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 text-red-200 border border-red-500 rounded-md hover:bg-red-600/40 transition-all">
                            <LogOut size={16} />
                            Sair
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                         <p className="text-stone-300 text-sm text-center mb-3">Faça login para salvar sua pontuação e conquistas!</p>
                         <GoogleLogin onSuccess={onLoginSuccess} onError={() => console.log('Login Failed')} theme="filled_black" text="signin_with" shape="pill" />
                    </div>
                )}
            </div>
            
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
                <div className="now-playing-container">
                    <p className="now-playing-text">
                        {isPlaying && selectedPeriod ? `Tocando agora: ${selectedPeriod.referenceSongTitle}` : 'Player pausado'}
                    </p>
                </div>
            </div>

            <audio ref={audioRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} loop/>
        </aside>
    );
};

export default Sidebar;
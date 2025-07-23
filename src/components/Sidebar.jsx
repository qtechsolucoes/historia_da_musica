import React, { useState, useEffect, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Play, Pause, Square, LogOut, Award, Star, BarChart2, ChevronDown, ChevronUp, UserPlus, BookOpen, Guitar, Music4, Crown, X } from 'lucide-react';

import { useMusicAppStore } from '../store/musicAppStore';
import { musicHistoryData } from '../data/index.js';

const getPlayerLevel = (score) => {
    if (score >= 10000) return { name: 'Kapellmeister', icon: <Crown size={20} className="text-yellow-400" />, color: 'text-yellow-400' };
    if (score >= 5000) return { name: 'Maestro', icon: <Award size={20} className="text-purple-400" />, color: 'text-purple-400' };
    if (score >= 1500) return { name: 'Virtuoso', icon: <Music4 size={20} className="text-blue-400" />, color: 'text-blue-400' };
    if (score >= 500) return { name: 'Trovador', icon: <Guitar size={20} className="text-green-400" />, color: 'text-green-400' };
    return { name: 'Aprendiz', icon: <BookOpen size={20} className="text-gray-400" />, color: 'text-gray-400' };
};

const Sidebar = ({ isOpen, onClose, hasInteracted }) => {
    const {
        selectedPeriodId,
        currentUser,
        score,
        achievements,
        stats,
        login,
        logout,
        handleSelectPeriod
    } = useMusicAppStore();

    const selectedPeriod = musicHistoryData.find(p => p.id === selectedPeriodId);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const [volume, setVolume] = useState(0.5);
    const [showProfileDetails, setShowProfileDetails] = useState(false);
    
    const playerLevel = currentUser ? getPlayerLevel(score) : null;

    const handleCustomLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            const googleResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + tokenResponse.access_token);
            const profile = await googleResponse.json();
            login(profile);
        },
        onError: (error) => console.log('Login Failed:', error)
    });

    // --- LÓGICA CORRIGIDA AQUI ---
    useEffect(() => {
        if (!hasInteracted) return; // Só faz algo após a primeira interação do utilizador

        if (audioRef.current && selectedPeriod?.referenceSong) {
            const isNewSong = !audioRef.current.src.endsWith(selectedPeriod.referenceSong);
            
            // Se for uma nova música, atualiza o src e tenta tocar.
            if (isNewSong) {
                audioRef.current.src = selectedPeriod.referenceSong;
                audioRef.current.play().catch(e => {
                    console.error("Reprodução automática falhou. O utilizador pode precisar de clicar em play.", e);
                    setIsPlaying(false);
                });
            }
        }
    }, [selectedPeriod, hasInteracted]); // A dependência de 'isPlaying' foi removida para evitar loops
    
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    const handlePlayPause = () => {
        if (!audioRef.current?.src) {
            if (selectedPeriod?.referenceSong) {
                audioRef.current.src = selectedPeriod.referenceSong;
            } else {
                return;
            }
        };
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
        const totalAnswers = (stats.correctAnswers || 0) + (stats.incorrectAnswers || 0);
        if (totalAnswers === 0) return '0%';
        const rate = (stats.correctAnswers / totalAnswers) * 100;
        return `${rate.toFixed(1)}%`;
    }

    return (
        <aside 
            className={`w-64 bg-black/50 backdrop-blur-md flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out md:static md:translate-x-0 fixed inset-y-0 left-0 z-40 border-r-2 border-amber-900/50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            onClick={(e) => e.stopPropagation()}
        >
            <header className="relative text-center p-4 border-b-2 border-amber-900/50">
                 <button onClick={onClose} className="md:hidden absolute top-2 right-2 p-2 text-stone-300 hover:text-white">
                    <X size={24} />
                </button>
                <h1 className="text-2xl lg:text-3xl font-title gold-text-effect" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>
                    Codex Historiæ Musicæ
                </h1>
            </header>

            <div className="p-4 border-b-2 border-amber-900/50">
                {currentUser ? (
                    <div className="flex flex-col items-center text-center">
                        <img 
                            src={currentUser.picture} 
                            alt={currentUser.name} 
                            className="w-16 h-16 rounded-full border-2 border-amber-400 mb-2"
                        />
                        <h2 className="font-semibold text-amber-200 truncate">{currentUser.name}</h2>
                        
                        <div className={`flex items-center gap-2 mt-2 font-bold ${playerLevel.color}`}>
                            {playerLevel.icon}
                            <span>{playerLevel.name}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-stone-300 font-bold">{score} pontos</p>
                        </div>

                        <button onClick={() => setShowProfileDetails(!showProfileDetails)} className="mt-4 w-full flex justify-between items-center px-3 py-2 bg-gray-700/50 rounded-md text-stone-200 hover:bg-gray-700">
                            <span>Ver Perfil Detalhado</span>
                            {showProfileDetails ? <ChevronUp size={18}/> : <ChevronDown size={18} />}
                        </button>
                        
                        {showProfileDetails && (
                            <div className="mt-2 w-full text-left p-3 bg-black/20 rounded-md border border-amber-900/50">
                                <h3 className="font-bold text-amber-300 mb-2 flex items-center gap-2"><BarChart2 size={16}/> Estatísticas</h3>
                                <p className="text-sm text-stone-300">Respostas Corretas: {stats.correctAnswers || 0}</p>
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
                        
                        <button onClick={logout} className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 text-red-200 border border-red-500 rounded-md hover:bg-red-600/40 transition-all">
                            <LogOut size={16} />
                            Sair
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                         <p className="text-stone-300 text-sm text-center mb-3">Faça login para salvar seu progresso e conquistas!</p>
                         <button
                            onClick={() => handleCustomLogin()}
                            className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-blue-600/20 text-blue-200 border border-blue-500 rounded-md hover:bg-blue-600/40 transition-all"
                         >
                            <UserPlus size={18}/>
                            Login com Google
                         </button>
                    </div>
                )}
            </div>
            
            <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin">
                <ul className="space-y-2">
                    {musicHistoryData.map(period => (
                        <li key={period.id}>
                            <button 
                                onClick={() => {
                                    handleSelectPeriod(period.id);
                                    onClose();
                                }}
                                className={`w-full text-left px-4 py-3 rounded-md text-base font-semibold transition-all duration-200 flex items-center gap-3
                                    ${selectedPeriodId === period.id 
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
                <div className="w-full overflow-hidden whitespace-nowrap box-border">
                    <p className="inline-block animate-marquee text-amber-200 text-sm">
                        {isPlaying && selectedPeriod ? `Tocando agora: ${selectedPeriod.referenceSongTitle}` : 'Player pausado'}
                    </p>
                </div>
            </div>

            <audio ref={audioRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} loop/>
        </aside>
    );
};

export default Sidebar;
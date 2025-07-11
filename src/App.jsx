import React, { useState, useEffect } from 'react';
// 1. Importar os componentes de roteamento
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

import { musicHistoryData } from './data/musicHistoryData';
import { useMusicApp } from './hooks/useMusicApp';

import MainContent from './components/MainContent';
import DetailModal from './components/DetailModal';
import Sidebar from './components/Sidebar';
import LoadingScreen from './components/LoadingScreen';
import AchievementToast from './components/AchievementToast';

// --- COMPONENTES PROVISÓRIOS (PLACEHOLDERS) PARA AS NOVAS TELAS ---
// Estes componentes serão substituídos pelos ficheiros reais que você criará.
const CreateKahootScreen = () => <div className="text-white h-screen flex items-center justify-center bg-gray-800"><h1>Página de Criação do Quiz (Em breve)</h1></div>;
const KahootHostLobby = () => <div className="text-white h-screen flex items-center justify-center bg-gray-800"><h1>Lobby do Anfitrião (Em breve)</h1></div>;
const KahootJoinScreen = () => <div className="text-white h-screen flex items-center justify-center bg-gray-800"><h1>Ecrã para Entrar no Jogo (Em breve)</h1></div>;
const KahootPlayerScreen = () => <div className="text-white h-screen flex items-center justify-center bg-gray-800"><h1>Ecrã do Jogador (Em breve)</h1></div>;
// ----------------------------------------------------------------

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const backendUrl = 'http://localhost:5001';
const socket = io(backendUrl);

/**
 * AppLayout é o componente que contém a interface principal da sua aplicação
 * (a exploração da história da música com a sidebar e o conteúdo principal).
 * Isto permite que seja renderizado apenas na rota principal ("/").
 */
const AppLayout = () => {
    const [hasInteracted, setHasInteracted] = useState(false);
    const musicAppProps = useMusicApp();

    return (
        <div 
            className="h-full w-full text-stone-200 font-sans flex absolute top-0 left-0" 
            id="app-container" 
            onClick={() => { if (!hasInteracted) setHasInteracted(true); }}
        >
            <Sidebar
                periods={musicHistoryData}
                selectedPeriod={musicAppProps.selectedPeriod}
                onSelectPeriod={musicAppProps.handleSelectPeriod}
                hasInteracted={hasInteracted}
                user={musicAppProps.currentUser}
                score={musicAppProps.score}
                achievements={musicAppProps.achievements}
                stats={musicAppProps.stats}
                onLoginSuccess={musicAppProps.handleLoginSuccess}
                onLogout={musicAppProps.handleLogout}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                {musicAppProps.selectedPeriod && (
                    <MainContent 
                        period={musicAppProps.selectedPeriod} 
                        onCardClick={musicAppProps.handleOpenModal}
                        activeChallenge={musicAppProps.activeChallenge}
                        setActiveChallenge={musicAppProps.setActiveChallenge}
                        quiz={musicAppProps.quiz}
                        onGenerateQuiz={musicAppProps.handleGenerateQuiz}
                        onQuizGuess={musicAppProps.handleQuizGuess}
                        whoAmI={musicAppProps.whoAmI}
                        onGenerateWhoAmI={musicAppProps.handleGenerateWhoAmI}
                        onWhoAmIGuess={musicAppProps.handleWhoAmIGuess}
                        timeline={musicAppProps.timeline}
                        onGenerateTimeline={musicAppProps.handleGenerateTimeline}
                        onCheckTimeline={musicAppProps.handleCheckTimeline}
                        fromWhichPeriod={musicAppProps.fromWhichPeriod}
                        onGenerateFromWhichPeriod={musicAppProps.handleGenerateFromWhichPeriod}
                        onFromWhichPeriodGuess={musicAppProps.handleFromWhichPeriodGuess}
                        leaderboard={musicAppProps.leaderboard}
                        user={musicAppProps.currentUser}
                        socket={socket}
                    />
                )}
            </div>
            <DetailModal content={musicAppProps.modalContent} onClose={musicAppProps.handleCloseModal} />
            <AchievementToast 
                achievement={musicAppProps.lastAchievement} 
                onDismiss={() => musicAppProps.setLastAchievement(null)} 
            />
             <audio ref={musicAppProps.correctSoundRef} src="/assets/audio/correct.mp3" preload="auto" />
             <audio ref={musicAppProps.incorrectSoundRef} src="/assets/audio/incorrect.mp3" preload="auto" />
        </div>
    );
};


export default function App() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 5000); // Mantém a tela de loading por 5 segundos
        return () => clearTimeout(timer);
    }, []);

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <div className="h-screen w-screen bg-gray-900">
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap');
                    body { background-color: #111827; overflow: hidden; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; }
                    .font-title { font-family: 'MedievalSharp', cursive; }
                    .font-serif { font-family: 'Times New Roman', Times, serif; }
                    .text-shadow-gold { text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5); }
                    .scrollbar-thin::-webkit-scrollbar { width: 5px; height: 5px; }
                    .scrollbar-thin::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                    .scrollbar-thin::-webkit-scrollbar-thumb { background: #a38b71; border-radius: 10px; }
                    .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #c0a58a; }
                `}</style>
                
                <AnimatePresence>
                    {isLoading ? (
                        <LoadingScreen key="loading-screen" />
                    ) : (
                        // 2. O BrowserRouter envolve toda a aplicação para gerir o histórico de navegação.
                        // O 'basename' é crucial e deve corresponder à configuração 'base' no seu vite.config.js.
                        <BrowserRouter basename="/historia_da_musica/">
                             <motion.div 
                                key="main-app-motion" 
                                className="h-full w-full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 1.0 }}
                            >
                                {/* 3. O componente <Routes> define onde as rotas serão renderizadas. */}
                                <Routes>
                                    {/* Rota principal que renderiza a interface de exploração */}
                                    <Route path="/*" element={<AppLayout />} />

                                    {/* Novas rotas para o modo de jogo interativo */}
                                    <Route path="/challenges/kahoot/create" element={<CreateKahootScreen />} />
                                    <Route path="/kahoot/lobby/:accessCode" element={<KahootHostLobby />} />
                                    <Route path="/kahoot/join" element={<KahootJoinScreen />} />
                                    <Route path="/kahoot/play/:accessCode" element={<KahootPlayerScreen />} />
                                </Routes>
                            </motion.div>
                        </BrowserRouter>
                    )}
                </AnimatePresence>
            </div>
        </GoogleOAuthProvider>
    );
}

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';

import { musicHistoryData } from './data/musicHistoryData';
import { useMusicApp } from './hooks/useMusicApp';

import MainContent from './components/MainContent';
import DetailModal from './components/DetailModal';
import Sidebar from './components/Sidebar';
import LoadingScreen from './components/LoadingScreen';
import AchievementToast from './components/AchievementToast';

import CreateQuiz from './components/quiz/CreateQuiz';
import QuizLobby from './components/quiz/QuizLobby';
import JoinQuiz from './components/quiz/JoinQuiz';
import PlayerScreen from './components/quiz/PlayerScreen';
import HostScreen from './components/quiz/HostScreen';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const backendUrl = 'http://localhost:5001';
const socket = io(backendUrl);

const AppLayout = () => {
    const musicAppProps = useMusicApp();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false); // 1. Estado de interação volta para o AppLayout

    return (
        // 2. O onClick é adicionado ao container principal
        <div 
            className="h-screen w-screen text-stone-200 font-sans md:flex overflow-hidden" 
            id="app-container"
            onClick={() => { if (!hasInteracted) setHasInteracted(true); }}
        >
            <Sidebar
                periods={musicHistoryData}
                selectedPeriod={musicAppProps.selectedPeriod}
                onSelectPeriod={musicAppProps.handleSelectPeriod}
                user={musicAppProps.currentUser}
                score={musicAppProps.score}
                achievements={musicAppProps.achievements}
                stats={musicAppProps.stats}
                onCustomLogin={musicAppProps.handleCustomLogin} 
                onLogout={musicAppProps.handleLogout}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                hasInteracted={hasInteracted} // 3. Passa o estado como prop
            />

            {isSidebarOpen && <div onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(false); }} className="md:hidden fixed inset-0 bg-black/60 z-30" />}

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="md:hidden flex-shrink-0 flex items-center justify-between p-4 bg-black/40 border-b-2 border-amber-900/50">
                    <button onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }} className="text-stone-200 p-1">
                        <Menu size={28} />
                    </button>
                    <h1 className="text-xl font-title text-amber-300">
                        Codex Historiæ Musicæ
                    </h1>
                    <div className="w-8" />
                </header>

                <div className="flex-1 flex flex-col overflow-y-auto scrollbar-custom">
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
                            survival={musicAppProps.survival}
                            handleStartSurvival={musicAppProps.handleStartSurvival}
                            generateSurvivalQuestion={musicAppProps.generateSurvivalQuestion}
                            handleSurvivalAnswer={musicAppProps.handleSurvivalAnswer}
                        />
                    )}
                </div>
            </div>

            <DetailModal content={musicAppProps.modalContent} onClose={musicAppProps.handleCloseModal} />
            <AchievementToast 
                achievement={musicAppProps.lastAchievement} 
                onDismiss={() => musicAppProps.setLastAchievement(null)} 
            />
             <audio ref={musicAppProps.correctSoundRef} src="assets/audio/correct.mp3" preload="auto" />
             <audio ref={musicAppProps.incorrectSoundRef} src="assets/audio/incorrect.mp3" preload="auto" />
        </div>
    );
};


export default function App() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <div className="min-h-screen w-full bg-gray-900">
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap');
                    body { background-color: #111827; }
                    .font-title { font-family: 'MedievalSharp', cursive; }
                    .font-serif { font-family: 'Times New Roman', Times, serif; }
                `}</style>
                
                <AnimatePresence>
                    {isLoading ? (
                        <LoadingScreen key="loading-screen" />
                    ) : (
                        <BrowserRouter basename="/historia_da_musica/">
                             <motion.div 
                                key="main-app-motion" 
                                className="h-full w-full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 1.0 }}
                            >
                                <Routes>
                                    <Route path="/*" element={<AppLayout />} />
                                    <Route path="/quiz/create" element={<CreateQuiz socket={socket} />} />
                                    <Route path="/quiz/lobby/:accessCode" element={<QuizLobby socket={socket} />} />
                                    <Route path="/quiz/join" element={<JoinQuiz socket={socket} />} />
                                    <Route path="/quiz/play/:accessCode" element={<PlayerScreen socket={socket} />} />
                                    <Route path="/quiz/host/:accessCode" element={<HostScreen socket={socket} />} />
                                </Routes>
                            </motion.div>
                        </BrowserRouter>
                    )}
                </AnimatePresence>
            </div>
        </GoogleOAuthProvider>
    );
}
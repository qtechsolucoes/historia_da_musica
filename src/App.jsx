import React, { useState, useEffect } from 'react';
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

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const backendUrl = 'http://localhost:5001';
const socket = io(backendUrl);

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [hasInteracted, setHasInteracted] = useState(false);

    const {
        selectedPeriod,
        modalContent,
        activeChallenge,
        quiz,
        whoAmI,
        timeline,
        fromWhichPeriod,
        currentUser,
        score,
        leaderboard,
        achievements,
        stats,
        lastAchievement,
        correctSoundRef,
        incorrectSoundRef,
        handleOpenModal,
        handleCloseModal,
        handleSelectPeriod,
        setActiveChallenge,
        handleLoginSuccess,
        handleLogout,
        handleGenerateQuiz,
        handleQuizGuess,
        handleGenerateWhoAmI,
        handleWhoAmIGuess,
        handleGenerateTimeline,
        handleCheckTimeline,
        handleGenerateFromWhichPeriod,
        handleFromWhichPeriodGuess,
        setLastAchievement
    } = useMusicApp();

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    const handleFirstInteraction = () => {
        if (!hasInteracted) setHasInteracted(true);
    };

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
                
                <audio ref={correctSoundRef} src="/assets/audio/correct.mp3" preload="auto" />
                <audio ref={incorrectSoundRef} src="/assets/audio/incorrect.mp3" preload="auto" />

                <AnimatePresence>
                    {isLoading ? (
                        <LoadingScreen key="loading-screen" />
                    ) : (
                        <motion.div 
                            key="main-app" 
                            className="h-full w-full text-stone-200 font-sans flex absolute top-0 left-0" 
                            id="app-container" 
                            onClick={handleFirstInteraction}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1.0 }}
                        >
                            <Sidebar
                                periods={musicHistoryData}
                                selectedPeriod={selectedPeriod}
                                onSelectPeriod={handleSelectPeriod}
                                hasInteracted={hasInteracted}
                                user={currentUser}
                                score={score}
                                achievements={achievements}
                                stats={stats}
                                onLoginSuccess={handleLoginSuccess}
                                onLogout={handleLogout}
                            />
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {selectedPeriod && (
                                    <MainContent 
                                        period={selectedPeriod} 
                                        onCardClick={handleOpenModal}
                                        activeChallenge={activeChallenge}
                                        setActiveChallenge={setActiveChallenge}
                                        quiz={quiz}
                                        onGenerateQuiz={handleGenerateQuiz}
                                        onQuizGuess={handleQuizGuess}
                                        whoAmI={whoAmI}
                                        onGenerateWhoAmI={handleGenerateWhoAmI}
                                        onWhoAmIGuess={handleWhoAmIGuess}
                                        timeline={timeline}
                                        onGenerateTimeline={handleGenerateTimeline}
                                        onCheckTimeline={handleCheckTimeline}
                                        fromWhichPeriod={fromWhichPeriod}
                                        onGenerateFromWhichPeriod={handleGenerateFromWhichPeriod}
                                        onFromWhichPeriodGuess={handleFromWhichPeriodGuess}
                                        leaderboard={leaderboard}
                                        user={currentUser}
                                        socket={socket}
                                    />
                                )}
                            </div>
                            <DetailModal content={modalContent} onClose={handleCloseModal} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <AchievementToast 
                    achievement={lastAchievement} 
                    onDismiss={() => setLastAchievement(null)} 
                />
            </div>
        </GoogleOAuthProvider>
    );
}
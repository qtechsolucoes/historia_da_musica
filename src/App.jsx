import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';

import { useMusicAppStore } from './store/musicAppStore';

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
import NotificationToast from './components/NotificationToast';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
const socket = io(backendUrl);

const AppLayout = () => {
    const modalContent = useMusicAppStore((state) => state.modalContent);
    const lastAchievement = useMusicAppStore((state) => state.lastAchievement);
    const handleCloseModal = useMusicAppStore((state) => state.handleCloseModal);
    const setLastAchievement = useMusicAppStore((state) => state.setLastAchievement);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    
    const correctSoundRef = useRef(null);
    const incorrectSoundRef = useRef(null);
    const sounds = {
        correct: () => correctSoundRef.current?.play().catch(console.error),
        incorrect: () => incorrectSoundRef.current?.play().catch(console.error)
    };

    return (
        <div 
            className="h-screen w-screen text-stone-200 font-sans md:flex overflow-hidden" 
            id="app-container"
            onClick={() => { if (!hasInteracted) setHasInteracted(true); }}
        >
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                hasInteracted={hasInteracted}
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
                    <MainContent socket={socket} sounds={sounds} />
                </div>
            </div>

            <DetailModal content={modalContent} onClose={handleCloseModal} />
            <AchievementToast 
                achievement={lastAchievement} 
                onDismiss={() => setLastAchievement(null)} 
            />
            <NotificationToast />
            <audio ref={correctSoundRef} src="assets/audio/correct.mp3" preload="auto" />
            <audio ref={incorrectSoundRef} src="assets-incorrect.mp3" preload="auto" />
        </div>
    );
};

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    // <-- INÍCIO DA MUDANÇA
    const initializeApp = useMusicAppStore((state) => state.initialize);

    useEffect(() => {
        // Esta função agora é chamada apenas uma vez quando o componente App é montado.
        initializeApp();
    }, [initializeApp]); // A dependência garante que o useEffect não seja executado desnecessariamente.
    // <-- FIM DA MUDANÇA

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
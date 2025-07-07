import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleOAuthProvider, googleLogout } from '@react-oauth/google';
import io from 'socket.io-client';
import { musicHistoryData } from './data/musicHistoryData';
import { motion, AnimatePresence } from 'framer-motion';

import MainContent from './components/MainContent';
import DetailModal from './components/DetailModal';
import Sidebar from './components/Sidebar';
import LoadingScreen from './components/LoadingScreen';
import AchievementToast from './components/AchievementToast';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const backendUrl = 'http://localhost:5001';

const socket = io(backendUrl);

const ALL_ACHIEVEMENTS = {
    MESTRE_MEDIEVAL: { name: "Mestre Medieval", description: "Acerte 10 perguntas do período Medieval." },
    VIAJANTE_DO_TEMPO: { name: "Viajante do Tempo", description: "Visite todos os 5 períodos musicais." },
    POLIGLOTA_MUSICAL: { name: "Poliglota Musical", description: "Complete desafios em 3 períodos diferentes." }
};

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPeriodId, setSelectedPeriodId] = useState('medieval');
    const [modalContent, setModalContent] = useState(null);
    const [hasInteracted, setHasInteracted] = useState(false);

    const [activeChallenge, setActiveChallenge] = useState(null);
    const [quiz, setQuiz] = useState({ question: '', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null });
    const [whoAmI, setWhoAmI] = useState({ description: '', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null });
    const [timeline, setTimeline] = useState({ items: [], correctOrder: [], feedback: '', isLoading: false, isChecked: false });
    const [fromWhichPeriod, setFromWhichPeriod] = useState({ description: '', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null });

    const [currentUser, setCurrentUser] = useState(null);
    const [score, setScore] = useState(0);
    const [leaderboard, setLeaderboard] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [stats, setStats] = useState({});
    const [lastAchievement, setLastAchievement] = useState(null);

    const correctSoundRef = useRef(null);
    const incorrectSoundRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch(`${backendUrl}/api/leaderboard`);
                if (!response.ok) throw new Error("Falha ao buscar ranking");
                const data = await response.json();
                setLeaderboard(data);
            } catch (error) {
                console.error("Erro ao carregar o ranking:", error);
            }
        };
        fetchLeaderboard();
    }, []);

    const handleFirstInteraction = () => {
        if (!hasInteracted) setHasInteracted(true);
    };

    const selectedPeriod = useMemo(() => musicHistoryData.find(p => p.id === selectedPeriodId), [selectedPeriodId]);

    const handleOpenModal = (type, data) => setModalContent({ type, data });
    const handleCloseModal = () => setModalContent(null);

    const handleSelectPeriod = (id) => {
        setSelectedPeriodId(id);
        setActiveChallenge(null);
        if (currentUser && stats.periodsVisited) {
            const visited = Object.keys(stats.periodsVisited);
            if (!visited.includes(id)) {
                const newVisited = new Set([...visited, id]);
                const newPeriodsVisited = Array.from(newVisited).reduce((obj, key) => ({ ...obj, [key]: stats.periodsVisited[key] || 0 }), {});
                setStats(prev => ({ ...prev, periodsVisited: newPeriodsVisited }));
                if (newVisited.size >= 5) {
                    checkAndAwardAchievement(ALL_ACHIEVEMENTS.VIAJANTE_DO_TEMPO);
                }
            }
        }
    };
    
    const handleLoginSuccess = async (credentialResponse) => {
        try {
            const response = await fetch(`${backendUrl}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential }),
            });
            if (!response.ok) throw new Error('Falha na autenticação com o backend');
            const userFromDb = await response.json();
            setCurrentUser(userFromDb);
            setScore(userFromDb.score);
            setAchievements(userFromDb.achievements || []);
            setStats(userFromDb.stats || {});
        } catch (error) {
            console.error("Erro no login:", error);
        }
    };

    const handleLogout = () => {
        googleLogout();
        setCurrentUser(null);
        setScore(0);
        setAchievements([]);
        setStats({});
    };

    const checkAndAwardAchievement = async (achievement) => {
        if (currentUser && !achievements.find(a => a.name === achievement.name)) {
            try {
                const response = await fetch(`${backendUrl}/api/achievements`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: currentUser.email, achievement }),
                });
                if (response.ok) {
                    const updatedUser = await response.json();
                    if (updatedUser && updatedUser.achievements) {
                        setAchievements(updatedUser.achievements);
                        setLastAchievement(achievement);
                    }
                }
            } catch (error) {
                console.error("Erro ao salvar conquista:", error);
            }
        }
    };

    const handleCorrectAnswer = async () => {
        if (!currentUser) return;
        const newScore = score + 15;
        setScore(newScore);

        const currentPeriodCorrectAnswers = ((stats.periodsVisited && stats.periodsVisited[selectedPeriodId]) || 0) + 1;
        
        const newStats = {
            ...stats,
            quizzesCompleted: (stats.quizzesCompleted || 0) + 1,
            correctAnswers: (stats.correctAnswers || 0) + 1,
            periodsVisited: {
                ...stats.periodsVisited,
                [selectedPeriodId]: currentPeriodCorrectAnswers
            }
        };
        setStats(newStats);

        correctSoundRef.current?.play().catch(console.error);

        try {
            await fetch(`${backendUrl}/api/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: currentUser.email,
                    score: newScore,
                    statsUpdate: { correctAnswers: 1, quizzesCompleted: 1 }
                }),
            });
            const updatedLeaderboard = await fetch(`${backendUrl}/api/leaderboard`);
            const data = await updatedLeaderboard.json();
            setLeaderboard(data);

            if (selectedPeriodId === 'medieval' && currentPeriodCorrectAnswers >= 10) {
                checkAndAwardAchievement(ALL_ACHIEVEMENTS.MESTRE_MEDIEVAL);
            }
        } catch (error) {
            console.error("Erro ao salvar pontuação no backend:", error);
            setScore(prevScore => prevScore - 15);
        }
    };

    const handleIncorrectAnswer = async () => {
        incorrectSoundRef.current?.play().catch(console.error);
        if (currentUser) {
            setStats(prev => ({ ...prev, incorrectAnswers: (prev.incorrectAnswers || 0) + 1 }));
            try {
                await fetch(`${backendUrl}/api/score`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: currentUser.email,
                        score: score,
                        statsUpdate: { incorrectAnswers: 1 }
                    }),
                });
            } catch (error) {
                console.error("Erro ao salvar estatísticas:", error);
            }
        }
    };

    const handleGenerateQuiz = async () => {
        setQuiz({ question: '', options: [], answer: '', feedback: '', isLoading: true, guessedOption: null });
        if (!selectedPeriod.composers || selectedPeriod.composers.length === 0) {
            setQuiz({ question: 'Não há compositores disponíveis neste período.', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null });
            return;
        }
        const randomComposer = selectedPeriod.composers[Math.floor(Math.random() * selectedPeriod.composers.length)];
        const prompt = `Aja como um professor de história da música. Crie uma pergunta de múltipla escolha sobre a biografia ou uma obra importante do compositor ${randomComposer.name}, que pertence ao período da ${selectedPeriod.name}. Forneça a pergunta, quatro opções (sendo uma correta e três incorretas, mas plausíveis) e a resposta correta em um formato específico. Atenção, para cada pergunta que você criar, o texto deverá começar com uma letra indicando a alternativa. Cada alternativa deverá ser não muito pequena, mas também não muito grande, e deve ser escrita de forma que a resposta correta não seja óbvia. O texto da pergunta deve ser claro e direto, e as opções devem ser variadas em conteúdo e estilo, mas todas relacionadas ao tema da pergunta. Evite perguntas excessivamente complexas ou que exijam conhecimento especializado além do que seria esperado para um estudante de história da música. O texto deve ser escrito em português do Brasil, e as opções devem ser apresentadas de forma clara e distinta, com a resposta correta claramente identificada. O texto deve ser escrito de forma que seja fácil de entender, evitando jargões técnicos ou termos excessivamente complicados.

Formato Exigido (use ;; como separador entre as opções):
PERGUNTA: [Texto da pergunta aqui]
OPÇÕES: [Opção A];;[Opção B];;[Opção C];;[Opção D]
RESPOSTA: [Texto da opção correta aqui]

Responda em português do Brasil.`;
        
        try {
            const response = await fetch(`${backendUrl}/api/gemini`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!response.ok) throw new Error("Falha ao comunicar com o servidor.");
            
            const result = await response.json();
            const text = result.candidates[0]?.content?.parts[0]?.text;

            if (text) {
                const lines = text.split('\n');
                const questionLine = lines.find(line => line.startsWith('PERGUNTA:'));
                const optionsLine = lines.find(line => line.startsWith('OPÇÕES:'));
                const answerLine = lines.find(line => line.startsWith('RESPOSTA:'));
                if (questionLine && optionsLine && answerLine) {
                    const question = questionLine.replace('PERGUNTA:', '').trim();
                    const options = optionsLine.replace('OPÇÕES:', '').split(';;').map(opt => opt.trim());
                    const answer = answerLine.replace('RESPOSTA:', '').trim();
                    if (options.length === 4) {
                        setQuiz({ question, options, answer, feedback: '', isLoading: false, guessedOption: null });
                    } else { throw new Error("A API retornou um formato de opções inválido."); }
                } else { throw new Error("Formato de resposta da API inválido."); }
            } else { throw new Error("Resposta da API vazia."); }
        } catch (error) {
            console.error("Erro ao gerar desafio:", error);
            setQuiz({ question: 'Não foi possível criar a pergunta no momento. Por favor, tente novamente.', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null });
        }
    };

    const handleQuizGuess = (guess) => {
        const isCorrect = quiz.answer.trim().toLowerCase() === guess.trim().toLowerCase();
        let feedbackMessage = isCorrect ? 'Correto! Você conhece a história.' : `Incorreto. A resposta correta era: ${quiz.answer}.`;
        if (isCorrect) {
            handleCorrectAnswer();
        } else {
            handleIncorrectAnswer();
        }
        setQuiz(prev => ({ ...prev, feedback: feedbackMessage, guessedOption: guess }));
    };

    const handleGenerateWhoAmI = async () => {
        setWhoAmI({ description: '', options: [], answer: '', feedback: '', isLoading: true, guessedOption: null });
        if (!selectedPeriod.composers || selectedPeriod.composers.length < 4) {
             setWhoAmI(prev => ({...prev, isLoading: false, description: "Este período não tem compositores suficientes para o desafio."}));
             return;
        }
        let randomComposers = [...selectedPeriod.composers].sort(() => 0.5 - Math.random()).slice(0, 4);
        const correctComposer = randomComposers[0];
        const prompt = `Crie uma descrição curta e enigmática para o desafio "Quem sou eu?" sobre o compositor ${correctComposer.name}. A descrição deve ter de 2 a 3 frases, destacando uma característica única, uma obra famosa ou um fato curioso de sua vida, sem mencionar o nome. Deve ser um desafio para um estudante de música. Responda apenas com a descrição, em português do Brasil.`;
        
        try {
            const response = await fetch(`${backendUrl}/api/gemini`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });
            
            if (!response.ok) throw new Error("Falha ao comunicar com o servidor.");

            const result = await response.json();
            const description = result.candidates[0]?.content?.parts[0]?.text;

            if(description){
                setWhoAmI({
                    description: description.trim(),
                    options: randomComposers.map(c => c.name).sort(() => 0.5 - Math.random()),
                    answer: correctComposer.name,
                    isLoading: false,
                    feedback: '',
                    guessedOption: null
                });
            } else { throw new Error("API não retornou descrição."); }
        } catch (error) {
            console.error("Erro ao gerar 'Quem sou eu?':", error);
            setWhoAmI(prev => ({...prev, isLoading: false, description: "Não foi possível criar o desafio. Tente novamente."}));
        }
    };
    
    const handleWhoAmIGuess = (guess) => {
        const isCorrect = guess === whoAmI.answer;
        let feedbackMessage = isCorrect ? 'Correto! Você desvendou o enigma.' : `Errado! O compositor era ${whoAmI.answer}.`;
        if (isCorrect) {
             handleCorrectAnswer();
        } else {
             handleIncorrectAnswer();
        }
        setWhoAmI(prev => ({ ...prev, feedback: feedbackMessage, guessedOption: guess }));
    };

    const handleGenerateTimeline = () => {
        setTimeline({ items: [], correctOrder: [], feedback: '', isLoading: true, isChecked: false });
        if (!selectedPeriod.composers || selectedPeriod.composers.length < 4) {
            setTimeline({ isLoading: false, feedback: "Não há compositores suficientes para este desafio.", items: [], correctOrder: [] });
            return;
        }
        const randomComposers = [...selectedPeriod.composers].sort(() => 0.5 - Math.random()).slice(0, 4);
        const correctOrder = [...randomComposers]
            .sort((a, b) => parseInt(a.lifespan) - parseInt(b.lifespan))
            .map(c => c.name);
        const shuffledItems = [...randomComposers]
            .map(c => ({ name: c.name, lifespan: c.lifespan }))
            .sort(() => 0.5 - Math.random());
        setTimeline({
            items: shuffledItems,
            correctOrder: correctOrder,
            feedback: '',
            isLoading: false,
            isChecked: false
        });
    };
    
    const handleCheckTimeline = (userOrder) => {
        const userOrderNames = userOrder.map(item => item.name);
        const allCorrect = JSON.stringify(userOrderNames) === JSON.stringify(timeline.correctOrder);
        if (allCorrect) {
            handleCorrectAnswer();
            setTimeline(prev => ({ ...prev, feedback: 'Perfeito! A ordem está correta.', isChecked: true }));
        } else {
            handleIncorrectAnswer();
            setTimeline(prev => ({ ...prev, feedback: 'Quase lá! A ordem correta foi revelada.', isChecked: true }));
        }
    };

    // <-- INÍCIO DO CÓDIGO CORRIGIDO -->
    const handleGenerateFromWhichPeriod = async () => {
        setFromWhichPeriod({ description: '', options: [], answer: '', feedback: '', isLoading: true, guessedOption: null });
    
        // 1. SORTEIA UM PERÍODO ALEATÓRIO
        const randomPeriod = musicHistoryData[Math.floor(Math.random() * musicHistoryData.length)];
        const periodName = randomPeriod.name;
    
        const prompt = `Aja como um historiador da música criando um desafio. Gere uma descrição de 2 a 3 frases sobre uma característica, obra, compositor ou instrumento marcante do período da "${periodName}". A descrição deve ser enigmática, sem mencionar o nome do período. O objetivo é que o jogador adivinhe o período.

    Exemplo para o período Barroco: "Minhas composições são conhecidas pelo drama e pela grandiosidade, utilizando o baixo contínuo e explorando o contraste entre solistas e a orquestra em uma forma musical chamada concerto."

    Responda apenas com a descrição, em português do Brasil.`;
    
        try {
            const response = await fetch(`${backendUrl}/api/gemini`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });
            
            if (!response.ok) throw new Error("Falha ao comunicar com a IA.");
    
            const result = await response.json();
            const description = result.candidates[0]?.content?.parts[0]?.text;
    
            if (description) {
                setFromWhichPeriod({
                    description: description.trim(),
                    // As opções são sempre os nomes de todos os períodos
                    options: musicHistoryData.map(p => p.name).sort(() => 0.5 - Math.random()), 
                    answer: periodName, // 2. A RESPOSTA CORRETA É O PERÍODO SORTEADO
                    isLoading: false,
                    feedback: '',
                    guessedOption: null
                });
            } else {
                throw new Error("A API não retornou uma descrição.");
            }
        } catch (error) {
            console.error("Erro ao gerar 'De Que Período?':", error);
            setFromWhichPeriod(prev => ({...prev, isLoading: false, description: "Não foi possível criar o desafio. Tente novamente."}));
        }
    };

    const handleFromWhichPeriodGuess = (guess) => {
        const isCorrect = guess === fromWhichPeriod.answer;
        let feedbackMessage = isCorrect ? 'Correto! Você sabe identificar as eras da música.' : `Incorreto. A resposta correta era: ${fromWhichPeriod.answer}.`;
        
        if (isCorrect) {
            handleCorrectAnswer();
        } else {
            handleIncorrectAnswer();
        }
    
        setFromWhichPeriod(prev => ({ ...prev, feedback: feedbackMessage, guessedOption: guess }));
    };
    // <-- FIM DO CÓDIGO CORRIGIDO -->

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
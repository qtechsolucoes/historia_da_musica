import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const PlayerScreen = ({ socket }) => {
    const { accessCode } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const getInitialPlayerInfo = useCallback(() => {
        const statePlayer = location.state?.player;
        if (statePlayer) return statePlayer;
        try {
            const storedPlayerJSON = sessionStorage.getItem('kahoot_player_info');
            const storedCode = sessionStorage.getItem('kahoot_access_code');
            if (storedPlayerJSON && storedCode === accessCode) {
                return JSON.parse(storedPlayerJSON);
            }
        } catch (e) {
            console.error("Falha ao ler dados da sessão:", e);
        }
        return null;
    }, [location.state, accessCode]);

    const [playerInfo, setPlayerInfo] = useState(getInitialPlayerInfo);
    const [gameState, setGameState] = useState('connecting');
    const [question, setQuestion] = useState(null);
    const [time, setTime] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [roundResult, setRoundResult] = useState(null);
    const [finalRanking, setFinalRanking] = useState([]);

    const previousScoreRef = useRef(playerInfo?.score || 0);

    useEffect(() => {
        if (!playerInfo) {
            navigate(`/quiz/join?code=${accessCode}`, { replace: true });
            return;
        }

        const handleReconnect = () => {
            console.log('Reconectado ao servidor. Tentando reentrar no jogo...');
            socket.emit('kahoot:player_rejoin', { accessCode, playerInfo }, (response) => {
                if (response.error) {
                    alert(`Não foi possível reconectar: ${response.error}`);
                    sessionStorage.clear();
                    navigate('/quiz/join');
                } else {
                    console.log('Reconexão bem-sucedida!');
                }
            });
        };

        const handleNewQuestion = (q) => {
            previousScoreRef.current = playerInfo.score;
            setQuestion(q);
            setSelectedAnswer(null);
            setRoundResult(null);
            setTime(q.time || 15);
            setGameState('question');
        };

        const handleRoundResult = (result) => {
            setRoundResult(result);
            const myResult = result.ranking.find(p => p.socketId === playerInfo.socketId);
            if (myResult) {
                setPlayerInfo(prev => ({ ...prev, score: myResult.score }));
            }
            setGameState('result');
        };

        const handleGameOver = (data) => {
            setFinalRanking(data.players);
            setGameState('finished');
            sessionStorage.removeItem('kahoot_player_info');
            sessionStorage.removeItem('kahoot_access_code');
        };
        
        const handleGameCanceled = () => {
            alert('O anfitrião cancelou o jogo.');
            sessionStorage.removeItem('kahoot_player_info');
            sessionStorage.removeItem('kahoot_access_code');
            navigate('/');
        };
        
        function registerGameListeners() {
            socket.on('kahoot:new_question', handleNewQuestion);
            socket.on('kahoot:round_result', handleRoundResult);
            socket.on('kahoot:game_over', handleGameOver);
            socket.on('kahoot:game_canceled', handleGameCanceled);
            setGameState('lobby');
        }

        function unregisterGameListeners() {
            socket.off('kahoot:new_question', handleNewQuestion);
            socket.off('kahoot:round_result', handleRoundResult);
            socket.off('kahoot:game_over', handleGameOver);
            socket.off('kahoot:game_canceled');
        }

        if (socket.connected) {
            registerGameListeners();
        } else {
            socket.once('connect', registerGameListeners);
        }
        
        socket.on('connect', handleReconnect);

        return () => {
            unregisterGameListeners();
            socket.off('connect', handleReconnect);
        };
        
    }, [socket, playerInfo, accessCode, navigate]);
    
    useEffect(() => {
        if (gameState === 'question' && time > 0) {
            const timer = setTimeout(() => setTime(t => t - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [gameState, time]);

    const handleAnswerClick = (option) => {
        if (!selectedAnswer && question) {
            setSelectedAnswer(option);
            socket.emit('kahoot:player_answer', { accessCode, answerIndex: question.options.indexOf(option), timeRemaining: time });
        }
    };
    
    const shapes = [
        <path d="M12 2L2 22h20L12 2z" />,
        <rect x="2" y="2" width="20" height="20" rx="4" />,
        <circle cx="12" cy="12" r="10" />,
        <path d="m12 1 9.5 9.5-9.5 9.5-9.5-9.5L12 1z" />
    ];
    const shapeColors = ['bg-red-600', 'bg-blue-600', 'bg-yellow-500', 'bg-green-600'];

    if (!playerInfo) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><LoadingSpinner /></div>;
    }

    const renderContent = () => {
        switch(gameState) {
            case 'connecting':
                return <LoadingSpinner />;
            case 'lobby':
                return (
                    <div className="text-center">
                        <h2 className="text-3xl text-amber-200">Você está no jogo!</h2>
                        <p className="text-stone-300 mt-2">Aguarde o anfitrião iniciar a partida.</p>
                        <LoadingSpinner />
                    </div>
                );
            case 'question':
                if (!question || !Array.isArray(question.options)) {
                    return <div className="text-center"><h2 className="text-2xl">A carregar pergunta...</h2><LoadingSpinner /></div>;
                }
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full">
                        <div className="absolute top-4 right-4 text-3xl font-bold bg-black/50 px-4 py-2 rounded-full">{time}</div>
                        <div className="grid grid-cols-2 gap-4 h-full">
                            {question.options.map((option, index) => (
                                <button
                                    key={`${question.index}-${index}`}
                                    onClick={() => handleAnswerClick(option)}
                                    disabled={!!selectedAnswer}
                                    className={`flex items-center justify-center p-4 rounded-lg text-white font-bold text-xl transition-all duration-300 ${shapeColors[index]} ${selectedAnswer ? (selectedAnswer === option ? 'opacity-100 scale-105' : 'opacity-50') : 'hover:opacity-80'}`}
                                >
                                    <svg viewBox="0 0 24 24" className="w-8 h-8 mr-4 fill-current">{shapes[index]}</svg>
                                    <span>{option}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                );
            case 'result':
                 if (!roundResult) return <div className="text-center"><h2 className="text-2xl">A calcular resultados...</h2><LoadingSpinner /></div>;
                 
                 const myCurrentData = roundResult.ranking.find(p => p.socketId === playerInfo.socketId);
                 const currentScore = myCurrentData ? myCurrentData.score : playerInfo.score;
                 const isCorrect = currentScore > previousScoreRef.current;
                 const correctOptionText = question.options[roundResult.correctAnswerIndex];

                return (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                        {isCorrect ? <CheckCircle className="mx-auto text-green-400 mb-4" size={80}/> : <XCircle className="mx-auto text-red-400 mb-4" size={80}/>}
                        <h2 className={`text-5xl font-bold mb-4 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {isCorrect ? 'Correto!' : 'Incorreto'}
                        </h2>
                        {!isCorrect && <p className="text-xl text-stone-300 mt-2">A resposta correta era: <span className="font-bold">{correctOptionText}</span></p>}
                        <p className="text-2xl text-white mt-4">Sua pontuação: <span className="font-bold">{currentScore}</span></p>
                    </motion.div>
                );
            case 'finished':
                const myRank = finalRanking.findIndex(p => p.socketId === playerInfo.socketId) + 1;
                return (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                        <Award className="mx-auto text-amber-400 mb-4" size={96} />
                        <h2 className="text-5xl font-bold text-amber-300">Jogo Terminado!</h2>
                        <p className="text-3xl text-white mt-4">Sua posição final: <span className="font-bold">{myRank > 0 ? `${myRank}º` : 'N/A'}</span></p>
                        <p className="text-2xl text-stone-300">Pontuação final: <span className="font-bold">{playerInfo.score}</span></p>
                    </motion.div>
                );
            default:
                return <p>Estado de jogo desconhecido.</p>;
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col p-4">
             <header className="flex-shrink-0 flex justify-between items-center bg-black/30 p-4 rounded-t-lg">
                <h2 className="text-xl font-bold text-white truncate">{playerInfo.nickname}</h2>
                <div className="text-xl font-bold text-amber-300">{playerInfo.score} pts</div>
            </header>
            <main className="flex-grow flex items-center justify-center bg-black/20 p-4 rounded-b-lg relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={gameState}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full flex items-center justify-center"
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default PlayerScreen;
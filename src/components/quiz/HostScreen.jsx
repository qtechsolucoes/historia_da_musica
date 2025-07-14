import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Clock, Users, ChevronRight, Check, ArrowUp, ArrowDown, Minus, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const HostScreen = ({ socket }) => {
    const { accessCode } = useParams();
    const navigate = useNavigate();

    const [gameState, setGameState] = useState('countdown'); 
    const [game, setGame] = useState(null);
    const [questionData, setQuestionData] = useState(null);
    const [answerCount, setAnswerCount] = useState(0);
    const [time, setTime] = useState(0);
    const [roundResult, setRoundResult] = useState(null);
    const [finalRanking, setFinalRanking] = useState([]);
    const [countdown, setCountdown] = useState(3);
    const previousRanking = useRef([]);

    useEffect(() => {
        socket.emit('kahoot:host_join', { accessCode });

        const handleGameData = (data) => setGame(data);
        const handleNewQuestion = (q) => {
            if (roundResult) {
                previousRanking.current = roundResult.ranking;
            }
            setQuestionData(q);
            setAnswerCount(0);
            setRoundResult(null);
            setGameState('question');
        };
        const handleTimerUpdate = ({ timeRemaining }) => setTime(timeRemaining);
        const handleAnswerUpdate = ({ count }) => setAnswerCount(count);
        const handleRoundResult = (result) => {
            setGameState('answer_result');
            setRoundResult(result);
        };
        const handleGameOver = (data) => {
            setGameState('finished');
            setFinalRanking(data.players);
        };
        const handleGameCanceled = () => {
            alert('O jogo foi cancelado.');
            navigate('/quiz/create');
        };

        socket.on('kahoot:game_data', handleGameData);
        socket.on('kahoot:new_question', handleNewQuestion);
        socket.on('kahoot:timer_update', handleTimerUpdate);
        socket.on('kahoot:answer_update', handleAnswerUpdate);
        socket.on('kahoot:round_result', handleRoundResult);
        socket.on('kahoot:game_over', handleGameOver);
        socket.on('kahoot:game_canceled', handleGameCanceled);

        return () => {
            socket.off('kahoot:game_data', handleGameData);
            socket.off('kahoot:new_question', handleNewQuestion);
            socket.off('kahoot:timer_update', handleTimerUpdate);
            socket.off('kahoot:answer_update', handleAnswerUpdate);
            socket.off('kahoot:round_result', handleRoundResult);
            socket.off('kahoot:game_over', handleGameOver);
            socket.off('kahoot:game_canceled', handleGameCanceled);
        };
    }, [socket, accessCode, navigate]); // <-- CORREÇÃO: Removido 'roundResult' da matriz de dependências

    useEffect(() => {
        if (gameState !== 'countdown') return;

        const timer = setInterval(() => {
            setCountdown(c => {
                if (c > 1) return c - 1;
                clearInterval(timer);
                socket.emit('kahoot:request_next_question', { accessCode });
                return 0;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState, socket, accessCode]);


    const handleNextQuestion = () => {
        setCountdown(3); // Reinicia a contagem
        setGameState('countdown');
    };
    
    const handleShowScoreboard = () => {
        setGameState('scoreboard');
    };

    const getRankingChange = (player, newIndex) => {
        const oldIndex = previousRanking.current.findIndex(p => p._id === player._id);
        if (oldIndex === -1 || previousRanking.current.length === 0) return { icon: <Minus size={16} />, color: 'text-gray-500' };
        if (oldIndex > newIndex) return { icon: <ArrowUp size={16} />, color: 'text-green-500' };
        if (oldIndex < newIndex) return { icon: <ArrowDown size={16} />, color: 'text-red-500' };
        return { icon: <Minus size={16} />, color: 'text-gray-500' };
    };
    
    const shapes = [
        <path d="M12 2L2 22h20L12 2z" />,
        <rect x="2" y="2" width="20" height="20" rx="4" />,
        <circle cx="12" cy="12" r="10" />,
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    ];
    const shapeColors = ['bg-red-600', 'bg-blue-600', 'bg-yellow-500', 'bg-green-600'];

    if (!game) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><LoadingSpinner /></div>;
    
    const connectedPlayerCount = game.players.filter(p => p.connected).length;

    const renderContent = () => {
        switch (gameState) {
            case 'countdown':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-white bg-gray-800">
                         <h2 className="text-4xl font-bold mb-4">A próxima pergunta está a chegar...</h2>
                        <AnimatePresence>
                            <motion.div
                                key={countdown}
                                initial={{ scale: 2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0, position: 'absolute' }}
                                transition={{ duration: 0.5 }}
                                className="text-9xl font-bold text-amber-300"
                            >
                                {countdown > 0 ? countdown : 'VAI!'}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                );
            case 'question':
                if (!questionData) return <LoadingSpinner />
                return (
                    <div className="w-full h-full flex flex-col p-8 bg-gray-800">
                        <div className="flex-grow text-center flex items-center justify-center">
                            <motion.h2
                                key={questionData.text}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl md:text-5xl font-bold text-white leading-tight"
                            >
                                {questionData.text}
                            </motion.h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            {questionData.options.map((option, index) => (
                                <motion.div
                                    key={option}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 + index * 0.1 }}
                                    className={`flex items-center p-4 rounded-lg ${shapeColors[index]}`}
                                >
                                     <svg viewBox="0 0 24 24" className="w-10 h-10 mr-4 fill-current text-white">{shapes[index]}</svg>
                                    <p className="text-white font-bold text-2xl">{option}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );
            case 'answer_result':
                if (!roundResult) return <LoadingSpinner />;
                const totalAnswers = Object.values(roundResult.answerDistribution).reduce((sum, count) => sum + count, 0);
                return (
                    <div className="w-full h-full flex flex-col p-6 items-center justify-between bg-gray-800 text-white">
                        <motion.h1 initial={{y: -20, opacity: 0}} animate={{y: 0, opacity: 1}} className="text-4xl font-bold">Respostas</motion.h1>
                        
                        <div className="w-full max-w-3xl flex justify-around items-end gap-4 h-64">
                            {Object.entries(roundResult.answerDistribution).map(([index, count]) => {
                                const isCorrect = parseInt(index) === roundResult.correctAnswerIndex;
                                return (
                                    <div key={index} className="w-1/4 flex flex-col items-center justify-end h-full">
                                        <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.5}} className="text-2xl font-bold mb-2">{count}</motion.div>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${totalAnswers > 0 ? (count / totalAnswers) * 100 : 0}%` }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className={`w-full rounded-t-lg ${shapeColors[index]}`}
                                        />
                                        <div className="mt-4">
                                            {isCorrect ? <CheckCircle size={40} className="text-green-400" /> : <div className="w-[40px] h-[40px]"></div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button onClick={handleShowScoreboard} className="px-12 py-3 bg-gray-700 text-white font-bold text-2xl rounded-lg hover:bg-gray-600">
                            Ver Ranking
                        </button>
                    </div>
                );
            case 'scoreboard':
                if (!roundResult) return <LoadingSpinner />;
                return (
                    <div className="w-full h-full flex flex-col p-6 items-center justify-between bg-gray-900 text-white">
                        <motion.h1 initial={{y: -20, opacity: 0}} animate={{y: 0, opacity: 1}} className="text-5xl font-bold text-amber-300">Ranking</motion.h1>
                        
                        <div className="w-full max-w-2xl space-y-2">
                            {roundResult.ranking.slice(0, 5).map((player, index) => {
                                const change = getRankingChange(player, index);
                                return (
                                    <motion.div
                                        key={player._id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1, type: "spring", stiffness: 120 }}
                                        className="flex items-center p-4 rounded-lg bg-white/10 shadow-lg"
                                    >
                                        <span className="text-2xl font-bold w-12 text-center">{index + 1}</span>
                                        <p className="text-2xl flex-grow font-semibold">{player.nickname}</p>
                                        <div className={`flex items-center gap-2 mx-4 ${change.color}`}>{change.icon}</div>
                                        <p className="text-2xl font-bold text-amber-300 w-32 text-right">{player.score} pts</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                        
                        <button onClick={handleNextQuestion} className="w-full max-w-md p-4 bg-amber-600 text-black font-bold text-2xl rounded-lg hover:bg-amber-500 shadow-lg">
                            Próxima Pergunta
                        </button>
                    </div>
                );
             case 'finished':
                return (
                    <div className="w-full h-full flex flex-col p-8 items-center justify-center text-center">
                         <Award className="text-yellow-400 mb-6" size={128} />
                         <h2 className="text-6xl font-bold text-yellow-300">Vencedor!</h2>
                         <h3 className="text-5xl font-title text-white mt-4 mb-10">{finalRanking[0]?.nickname}</h3>
                         <div className="w-full max-w-3xl space-y-4">
                             {finalRanking.slice(0, 3).map((player, index) => (
                                <motion.div
                                    key={player._id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + index * 0.2 }}
                                     className={`flex items-center justify-between p-5 rounded-xl border-2 ${
                                        index === 0 ? 'bg-yellow-400/20 border-yellow-400' : 
                                        index === 1 ? 'bg-gray-400/20 border-gray-400' : 
                                        index === 2 ? 'bg-orange-600/20 border-orange-600' : 'bg-gray-800 border-gray-700'
                                     }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl font-bold text-white w-10">{index + 1}</span>
                                        <p className="text-2xl text-white">{player.nickname}</p>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{player.score} pts</p>
                                </motion.div>
                             ))}
                         </div>
                         <button onClick={() => navigate('/quiz/create')} className="mt-12 px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500">
                             Jogar Novamente
                         </button>
                    </div>
                );
            default:
                return <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>;
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <header className="flex-shrink-0 flex justify-between items-center bg-black/40 p-4 border-b-2 border-gray-700">
                <div className="flex items-center gap-4">
                    <span className="px-4 py-2 bg-gray-700 text-lg font-bold rounded-md">{questionData ? `Questão ${questionData.index + 1} / ${questionData.totalQuestions}` : `Iniciando...`}</span>
                </div>
                 <div className="flex items-center gap-6 text-xl">
                    <div className="flex items-center gap-2"><Users /> {connectedPlayerCount}</div>
                    <div className="flex items-center gap-2"><Check /> {answerCount}</div>
                    <div className="flex items-center gap-2 font-mono bg-black/50 px-4 py-2 rounded-md"><Clock size={20} /> {time < 0 ? 0 : time}</div>
                </div>
            </header>
            <main className="flex-grow relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={gameState}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0"
                    >
                         {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default HostScreen;
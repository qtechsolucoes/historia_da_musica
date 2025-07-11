import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Award, Clock, Users, ChevronRight, BarChart3, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const HostScreen = ({ socket }) => {
    const { accessCode } = useParams();
    const navigate = useNavigate();

    const [gameState, setGameState] = useState('loading'); // loading, countdown, question, result_distribution, result_scoreboard, finished
    
    const [game, setGame] = useState(null);
    const [questionData, setQuestionData] = useState(null);
    const [answerCount, setAnswerCount] = useState(0);
    const [time, setTime] = useState(0);
    const [roundResult, setRoundResult] = useState(null);
    const [finalRanking, setFinalRanking] = useState([]);
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        socket.emit('kahoot:host_join', { accessCode });

        const handleGameData = (data) => setGame(data);
        const handleNewQuestion = (q) => {
            setQuestionData(q);
            setTime(q.time);
            setAnswerCount(0);
            setRoundResult(null);
            setCountdown(3); 
            setGameState('countdown'); 
        };
        const handleAnswerUpdate = ({ count }) => setAnswerCount(count);

        const handleRoundResult = (result) => {
            setRoundResult(result);
            setGameState('result_distribution');
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
        socket.on('kahoot:answer_update', handleAnswerUpdate);
        socket.on('kahoot:round_result', handleRoundResult);
        socket.on('kahoot:game_over', handleGameOver);
        socket.on('kahoot:game_canceled', handleGameCanceled);

        return () => {
            socket.off('kahoot:game_data');
            socket.off('kahoot:new_question');
            socket.off('kahoot:answer_update');
            socket.off('kahoot:round_result');
            socket.off('kahoot:game_over');
            socket.off('kahoot:game_canceled');
        };

    }, [accessCode, socket, navigate]);

     useEffect(() => {
        if (gameState === 'question' && time > 0) {
            const timer = setTimeout(() => setTime(t => t - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [gameState, time]);

    useEffect(() => {
        if (gameState === 'countdown' && countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else if (gameState === 'countdown' && countdown === 0) {
            setGameState('question');
        }
    }, [gameState, countdown]);

    const handleNextQuestion = () => {
        socket.emit('kahoot:next_question', { accessCode });
    };

    const showScoreboard = () => {
        setGameState('result_scoreboard');
    }
    
    const shapes = [
        <path d="M12 2L2 22h20L12 2z" />,
        <rect x="2" y="2" width="20" height="20" rx="4" />,
        <circle cx="12" cy="12" r="10" />,
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    ];
    const shapeColors = ['bg-red-600', 'bg-blue-600', 'bg-yellow-500', 'bg-green-600'];

    if (!game) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><LoadingSpinner /></div>;

    const renderContent = () => {
        switch (gameState) {
            case 'countdown':
                return (
                    <div className="flex items-center justify-center h-full">
                        <AnimatePresence>
                            <motion.div
                                key={countdown}
                                initial={{ scale: 2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0, position: 'absolute' }}
                                transition={{ duration: 0.5 }}
                                className="text-9xl font-bold text-white"
                            >
                                {countdown}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                );
            case 'question':
                return (
                    <div className="w-full h-full flex flex-col p-8">
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
            case 'result_distribution': {
                if (!roundResult || !questionData) return <LoadingSpinner />;
                const totalAnswers = roundResult.answerDistribution.reduce((sum, count) => sum + count, 0);

                return (
                    <div className="w-full h-full flex flex-col p-8 items-center justify-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-10 text-center">{questionData.text}</h2>
                        <div className="w-full max-w-3xl space-y-4">
                            {questionData.options.map((option, index) => {
                                const isCorrect = index === roundResult.correctAnswerIndex;
                                const count = roundResult.answerDistribution[index];
                                const percentage = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;

                                return (
                                    <div key={index} className={`relative flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-500 ${isCorrect ? 'border-green-400 shadow-lg shadow-green-400/20' : 'border-transparent bg-black/30'}`}>
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%`}}
                                            transition={{ duration: 0.5, ease: 'easeOut' }}
                                            className={`absolute top-0 left-0 h-full rounded-md ${isCorrect ? 'bg-green-500/30' : 'bg-gray-700/50'}`}
                                        />
                                        <div className="relative z-10 flex items-center gap-4">
                                            <span className="font-bold text-xl text-white">{option}</span>
                                            {isCorrect && <CheckCircle className="text-green-400" />}
                                        </div>
                                        <span className="relative z-10 font-bold text-xl text-white">{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                         <button onClick={showScoreboard} className="mt-12 flex items-center gap-2 px-8 py-4 bg-amber-600 text-black font-bold text-xl rounded-lg hover:bg-amber-500">
                            Ver Placar <ChevronRight />
                        </button>
                    </div>
                )
            }
            case 'result_scoreboard': {
                if (!roundResult) return <LoadingSpinner />;
                return (
                    <div className="w-full h-full flex flex-col p-8 items-center justify-center">
                        <h2 className="text-5xl font-bold text-white mb-8">Placar</h2>
                        <div className="w-full max-w-2xl">
                             <Reorder.Group as="ol" axis="y" values={roundResult.ranking} onReorder={() => {}} className="space-y-3">
                                {roundResult.ranking.slice(0, 5).map((player, index) => (
                                    <Reorder.Item 
                                        key={player.socketId} 
                                        value={player}
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: index * 0.1 } }}
                                        className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border-2 border-amber-900/50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl font-bold text-white w-8">{index + 1}</span>
                                            <p className="text-xl text-white">{player.nickname}</p>
                                        </div>
                                        <p className="text-xl font-bold text-white">{player.score} pts</p>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        </div>
                        <button onClick={handleNextQuestion} className="mt-12 flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold text-xl rounded-lg hover:bg-blue-500">
                            Próxima Pergunta <ChevronRight />
                        </button>
                    </div>
                );
            }
             case 'finished':
                return (
                    <div className="w-full h-full flex flex-col p-8 items-center justify-center text-center">
                         <Award className="text-yellow-400 mb-6" size={128} />
                         <h2 className="text-6xl font-bold text-yellow-300">Vencedor!</h2>
                         <h3 className="text-5xl font-title text-white mt-4 mb-10">{finalRanking[0]?.nickname}</h3>
                         <div className="w-full max-w-3xl space-y-4">
                             {finalRanking.map((player, index) => (
                                <motion.div
                                    key={player.socketId}
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
            <header className="flex-shrink-0 flex justify-between items-center bg-black/40 p-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">{game.title}</h1>
                    <span className="px-3 py-1 bg-gray-700 text-sm rounded-full">{questionData ? `Questão ${questionData.index + 1} de ${game.quiz.questionCount}` : `Lobby`}</span>
                </div>
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-xl"><Users /> {game.players.length}</div>
                    <div className="flex items-center gap-2 text-xl"><BarChart3 /> {answerCount}</div>
                    <div className="flex items-center gap-2 text-xl font-mono bg-black/50 px-3 py-1 rounded"><Clock /> {time}</div>
                </div>
            </header>
            <main className="flex-grow relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={gameState}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
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
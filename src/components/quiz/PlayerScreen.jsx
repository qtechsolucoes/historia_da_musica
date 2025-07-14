import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle, XCircle, Clock, WifiOff } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

// --- Componentes de View Puros ---

const WaitingView = () => (
    <div className="text-center">
        <h2 className="text-3xl text-amber-200">Você está no jogo!</h2>
        <p className="text-stone-300 mt-2">Aguarde o anfitrião iniciar a partida.</p>
        <LoadingSpinner />
    </div>
);


const QuestionView = ({ question, time, onAnswer, selectedAnswer }) => {
    const shapes = [
        <path d="M12 2L2 22h20L12 2z" />,
        <rect x="2" y="2" width="20" height="20" rx="4" />,
        <circle cx="12" cy="12" r="10" />,
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    ];
    const shapeColors = ['bg-red-600', 'bg-blue-600', 'bg-yellow-500', 'bg-green-600'];

    if (!question) return <LoadingSpinner />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full flex flex-col p-4">
            <div className="w-full flex justify-between items-center mb-4">
                <h2 className="text-xl md:text-2xl text-white flex-grow text-center">{question.text}</h2>
                <div className="text-3xl font-bold text-white bg-black/50 px-4 py-2 rounded-full">{time}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 flex-grow">
                {question.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => onAnswer(index)}
                        disabled={selectedAnswer !== null}
                        className={`flex flex-col items-center justify-center p-4 rounded-lg text-white font-bold text-xl transition-all duration-300 ${shapeColors[index]} ${selectedAnswer !== null ? (selectedAnswer === index ? 'opacity-100 scale-105 ring-4 ring-white' : 'opacity-50') : 'hover:scale-105 hover:opacity-90'}`}
                    >
                        <svg viewBox="0 0 24 24" className="w-12 h-12 fill-current mb-2">{shapes[index]}</svg>
                        <span className="text-lg text-center">{option}</span>
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

const ResultView = ({ roundResult, selectedAnswer }) => {
    if (!roundResult) return <div className="text-center text-xl text-white animate-pulse">Aguardando resultados...</div>;
    
    const isCorrect = selectedAnswer === roundResult.correctAnswerIndex;
    
    return (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            {isCorrect ? <CheckCircle className="mx-auto text-green-400 mb-4" size={80}/> : <XCircle className="mx-auto text-red-400 mb-4" size={80}/>}
            <h2 className={`text-5xl font-bold mb-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? 'Correto!' : 'Incorreto'}
            </h2>
            <p className="text-stone-400 mt-4">Aguardando a próxima pergunta...</p>
        </motion.div>
    );
};

const FinishedView = ({ finalRanking, player }) => {
    const myFinalData = finalRanking.find(p => p.nickname === player?.nickname);
    const myRank = finalRanking.findIndex(p => p.nickname === player?.nickname) + 1;

    return (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Award className="mx-auto text-amber-400 mb-4" size={96} />
            <h2 className="text-5xl font-bold text-amber-300">Jogo Terminado!</h2>
            {myRank > 0 ? 
                <p className="text-3xl text-white mt-4">Sua posição final: <span className="font-bold">{myRank}º</span></p> :
                <p className="text-3xl text-white mt-4">Você não foi classificado.</p>
            }
            <p className="text-2xl text-stone-300">Pontuação final: <span className="font-bold">{myFinalData?.score || 0}</span></p>
        </motion.div>
    );
};

const ErrorView = ({ message }) => (
    <div className="text-center text-red-400">
        <WifiOff size={48} className="mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Erro</h2>
        <p>{message}</p>
    </div>
);


const PlayerScreen = ({ socket }) => {
    const { accessCode } = useParams();
    const navigate = useNavigate();
    
    const [gameState, setGameState] = useState('waiting_for_question');
    const [player, setPlayer] = useState(null);
    const [question, setQuestion] = useState(null);
    const [time, setTime] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [roundResult, setRoundResult] = useState(null);
    const [finalRanking, setFinalRanking] = useState([]);

    useEffect(() => {
        const savedPlayer = sessionStorage.getItem('kahootPlayer');
        if (savedPlayer) {
            setPlayer(JSON.parse(savedPlayer));
        } else {
            navigate('/quiz/join');
            return; 
        }

        const handleNewQuestion = (q) => {
            setQuestion(q);
            setSelectedAnswer(null);
            setRoundResult(null);
            setGameState('question');
        };

        const handleTimerUpdate = ({ timeRemaining }) => {
            setTime(timeRemaining);
        };

        const handleRoundResult = (result) => {
            setRoundResult(result);
            setGameState('result');
        };

        const handleGameOver = (data) => {
            setGameState('finished');
            setFinalRanking(data.players);
            sessionStorage.removeItem('kahootPlayer');
        };

        const handleGameCanceled = (data) => {
            alert(data.message || 'O jogo foi cancelado.');
            navigate('/quiz/create');
        };
        
        socket.on('kahoot:new_question', handleNewQuestion);
        socket.on('kahoot:timer_update', handleTimerUpdate);
        socket.on('kahoot:round_result', handleRoundResult);
        socket.on('kahoot:game_over', handleGameOver);
        socket.on('kahoot:game_canceled', handleGameCanceled);

        return () => {
            socket.off('kahoot:new_question', handleNewQuestion);
            socket.off('kahoot:timer_update', handleTimerUpdate);
            socket.off('kahoot:round_result', handleRoundResult);
            socket.off('kahoot:game_over', handleGameOver);
            socket.off('kahoot:game_canceled', handleGameCanceled);
        };
    }, [socket, navigate]);

    const handleAnswerClick = (answerIndex) => {
        if (selectedAnswer === null) {
            setSelectedAnswer(answerIndex);
            socket.emit('kahoot:player_answer', { accessCode, answerIndex, timeRemaining: time });
        }
    };
    
    const score = roundResult?.ranking.find(p => p.nickname === player?.nickname)?.score ?? 0;

    const renderMainContent = () => {
        switch (gameState) {
            case 'question':
                return <QuestionView question={question} time={time} onAnswer={handleAnswerClick} selectedAnswer={selectedAnswer} />;
            case 'result':
                return <ResultView roundResult={roundResult} selectedAnswer={selectedAnswer} />;
            case 'finished':
                return <FinishedView finalRanking={finalRanking} player={player} />;
            case 'waiting_for_question':
                 return <WaitingView />;
            case 'error':
                 return <ErrorView message="A sessão do jogo não foi encontrada." />;
            default:
                return <LoadingSpinner />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col p-4">
             <header className="flex-shrink-0 flex justify-between items-center bg-black/30 p-4 rounded-t-lg">
                <h2 className="text-xl font-bold text-white truncate">{player?.nickname || 'Jogador'}</h2>
                <div className="text-xl font-bold text-amber-300">{score} pts</div>
            </header>
            <main className="flex-grow flex items-center justify-center bg-black/20 p-4 rounded-b-lg relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={gameState}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20, position: 'absolute' }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full flex items-center justify-center"
                    >
                        {renderMainContent()}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default PlayerScreen;
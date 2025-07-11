import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle, XCircle, Clock } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';


const PlayerScreen = ({ socket }) => {
    const { accessCode } = useParams();
    const location = useLocation();
    
    const [gameState, setGameState] = useState('lobby'); // lobby, question, result, finished
    const [player, setPlayer] = useState(location.state?.player || null);
    const [game, setGame] = useState(location.state?.game || null);
    const [question, setQuestion] = useState(null);
    const [time, setTime] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [roundResult, setRoundResult] = useState(null);
    const [finalRanking, setFinalRanking] = useState([]);

    useEffect(() => {
        // Se não houver dados iniciais, o jogador provavelmente atualizou a página.
        // O ideal seria implementar uma reconexão, mas por agora, vamos mantê-lo simples.
        if (!player || !game) {
             // Idealmente, redirecionar ou mostrar mensagem de erro
             console.error("Dados de jogador/jogo não encontrados.");
             return;
        }

        const handleGameStarted = () => setGameState('question');
        const handleNewQuestion = (q) => {
            setQuestion(q);
            setSelectedAnswer(null);
            setRoundResult(null);
            setTime(q.time);
            setGameState('question');
        };
        const handleRoundResult = (result) => {
            setRoundResult(result);
            // Atualiza a pontuação local do jogador
            const myResult = result.ranking.find(p => p.socketId === player.socketId);
            if (myResult) {
                setPlayer(prev => ({ ...prev, score: myResult.score }));
            }
            setGameState('result');
        };
        const handleGameOver = (data) => {
            setFinalRanking(data.players);
            setGameState('finished');
        };
        const handleGameCanceled = () => {
            alert('O anfitrião cancelou o jogo.');
            // Navegar de volta
        };

        socket.on('kahoot:game_started', handleGameStarted);
        socket.on('kahoot:new_question', handleNewQuestion);
        socket.on('kahoot:round_result', handleRoundResult);
        socket.on('kahoot:game_over', handleGameOver);
        socket.on('kahoot:game_canceled', handleGameCanceled);

        return () => {
            socket.off('kahoot:game_started', handleGameStarted);
            socket.off('kahoot:new_question', handleNewQuestion);
            socket.off('kahoot:round_result', handleRoundResult);
            socket.off('kahoot:game_over', handleGameOver);
            socket.off('kahoot:game_canceled', handleGameCanceled);
        };
    }, [socket, player, game]);

    // Lógica do cronómetro
    useEffect(() => {
        if (gameState === 'question' && time > 0) {
            const timer = setTimeout(() => setTime(t => t - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [gameState, time]);

    const handleAnswerClick = (answer) => {
        if (!selectedAnswer) {
            setSelectedAnswer(answer);
            socket.emit('kahoot:player_answer', { accessCode, answerIndex: question.options.indexOf(answer), timeRemaining: time });
        }
    };
    
    // Formas geométricas para as opções
    const shapes = [
        <path d="M12 2L2 22h20L12 2z" />, // Triângulo
        <rect x="2" y="2" width="20" height="20" rx="4" />, // Quadrado arredondado
        <circle cx="12" cy="12" r="10" />, // Círculo
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /> // Losango
    ];
    const shapeColors = ['bg-red-600', 'bg-blue-600', 'bg-yellow-500', 'bg-green-600'];

    // Renderiza o conteúdo principal com base no estado do jogo
    const renderContent = () => {
        switch(gameState) {
            case 'lobby':
                return (
                    <div className="text-center">
                        <h2 className="text-3xl text-amber-200">Você está no jogo!</h2>
                        <p className="text-stone-300 mt-2">Aguarde o anfitrião iniciar a partida.</p>
                        <LoadingSpinner />
                    </div>
                );
            case 'question':
                if (!question) return <LoadingSpinner />;
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="absolute top-4 right-4 text-3xl font-bold bg-black/50 px-4 py-2 rounded-full">{time}</div>
                        <div className="grid grid-cols-2 gap-4 h-full">
                            {question.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerClick(option)}
                                    disabled={!!selectedAnswer}
                                    className={`flex items-center justify-center p-4 rounded-lg text-white font-bold text-xl transition-all duration-300 ${shapeColors[index]} ${selectedAnswer ? (selectedAnswer === option ? 'opacity-100 scale-105' : 'opacity-50') : 'hover:opacity-80'}`}
                                >
                                    <svg viewBox="0 0 24 24" className="w-8 h-8 mr-4 fill-current">{shapes[index]}</svg>
                                    {option}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                );
            case 'result':
                 if (!roundResult) return null;
                 const myAnswer = roundResult.ranking.find(p => p.socketId === player.socketId);
                 const isCorrect = myAnswer?.score > (player?.score || 0);
                return (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                        {isCorrect ? <CheckCircle className="mx-auto text-green-400 mb-4" size={80}/> : <XCircle className="mx-auto text-red-400 mb-4" size={80}/>}
                        <h2 className={`text-5xl font-bold mb-4 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {isCorrect ? 'Correto!' : 'Incorreto'}
                        </h2>
                        <p className="text-2xl text-white">Sua pontuação: <span className="font-bold">{player.score}</span></p>
                    </motion.div>
                );
            case 'finished':
                const myRank = finalRanking.findIndex(p => p.socketId === player.socketId) + 1;
                return (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                        <Award className="mx-auto text-amber-400 mb-4" size={96} />
                        <h2 className="text-5xl font-bold text-amber-300">Jogo Terminado!</h2>
                        <p className="text-3xl text-white mt-4">Sua posição final: <span className="font-bold">{myRank}º</span></p>
                        <p className="text-2xl text-stone-300">Pontuação final: <span className="font-bold">{player.score}</span></p>
                    </motion.div>
                );
            default:
                return <p>Estado de jogo desconhecido.</p>;
        }
    };
    
    if (!player) {
        return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center"><p>Erro: dados do jogador não encontrados. Por favor, tente entrar novamente.</p></div>
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col p-4">
             <header className="flex-shrink-0 flex justify-between items-center bg-black/30 p-4 rounded-t-lg">
                <h2 className="text-xl font-bold text-white truncate">{player.nickname}</h2>
                <div className="text-xl font-bold text-amber-300">{player.score} pts</div>
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
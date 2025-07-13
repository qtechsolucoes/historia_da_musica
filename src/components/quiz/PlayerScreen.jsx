import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle, XCircle, Clock, WifiOff } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

// --- ARQUITETURA ROBUSTA: Componentes de View ---
// Cada estado visual do jogo é um componente separado e puro.
// Eles apenas recebem dados (props) e os renderizam.

const ConnectingView = () => (
    <div className="text-center">
        <LoadingSpinner />
        <p className="mt-2 text-stone-300 animate-pulse">A reconectar ao jogo...</p>
    </div>
);

const LobbyView = () => (
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full">
            <div className="absolute top-4 right-4 text-3xl font-bold bg-black/50 px-4 py-2 rounded-full">{time}</div>
            <div className="grid grid-cols-2 gap-4 h-full">
                {question.options.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => onAnswer(index)}
                        disabled={selectedAnswer !== null}
                        className={`flex items-center justify-center p-4 rounded-lg text-white font-bold text-xl transition-all duration-300 ${shapeColors[index]} ${selectedAnswer !== null ? (selectedAnswer === index ? 'opacity-100 scale-105 ring-4 ring-white' : 'opacity-50') : 'hover:scale-105 hover:opacity-90'}`}
                    >
                        <svg viewBox="0 0 24 24" className="w-16 h-16 fill-current">{shapes[index]}</svg>
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

const ResultView = ({ roundResult, player, previousScore }) => {
    if (!roundResult || !player) return <div className="text-center text-xl text-white animate-pulse">Aguardando resultados...</div>;

    const myCurrentData = roundResult.ranking.find(p => p.nickname === player.nickname);
    const myScoreGained = myCurrentData ? myCurrentData.score - previousScore : 0;
    const isCorrect = myScoreGained > 0;
    
    return (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            {isCorrect ? <CheckCircle className="mx-auto text-green-400 mb-4" size={80}/> : <XCircle className="mx-auto text-red-400 mb-4" size={80}/>}
            <h2 className={`text-5xl font-bold mb-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? 'Correto!' : 'Incorreto'}
            </h2>
            {isCorrect && <p className="text-xl text-green-300 mb-4">+{myScoreGained} pontos</p>}
            <p className="text-2xl text-white">Sua pontuação: <span className="font-bold">{myCurrentData?.score || player.score}</span></p>
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
            <p className="text-2xl text-stone-300">Pontuação final: <span className="font-bold">{myFinalData?.score || player?.score || 0}</span></p>
        </motion.div>
    );
};

const ErrorView = ({ message }) => (
    <div className="text-center text-red-400">
        <WifiOff size={48} className="mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Erro de Conexão</h2>
        <p>{message}</p>
    </div>
);

// --- COMPONENTE RENDERIZADOR ---
const GameStateRenderer = ({ gameState, ...props }) => {
    switch (gameState) {
        case 'lobby': return <LobbyView />;
        case 'question': return <QuestionView {...props} />;
        case 'result': return <ResultView {...props} />;
        case 'finished': return <FinishedView {...props} />;
        case 'error': return <ErrorView {...props} />;
        case 'connecting':
        default: return <ConnectingView />;
    }
};


// --- COMPONENTE PRINCIPAL ---
const PlayerScreen = ({ socket }) => {
    const { accessCode } = useParams();
    const navigate = useNavigate();
    
    // CUIDADO: Estado unificado para garantir atualizações atômicas e evitar condições de corrida na renderização.
    const [gameData, setGameData] = useState({
        gameState: 'connecting',
        player: null,
        game: null,
        question: null,
        roundResult: null,
        finalRanking: [],
        error: '',
    });
    
    const [time, setTime] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const previousScoreRef = useRef(0);

    useEffect(() => {
        // CUIDADO: Todos os listeners são configurados uma vez e usam o 'setGameData' para atualizar o estado.
        // Isso previne recriações de listeners e comportamentos inesperados.
        const handleNewQuestion = (q) => {
            setSelectedAnswer(null);
            setTime(q.time || 15);
            setGameData(prev => {
                if (prev.player) previousScoreRef.current = prev.player.score;
                return { ...prev, gameState: 'question', question: q, roundResult: null };
            });
        };

        const handleRoundResult = (result) => {
            setGameData(prev => ({ ...prev, gameState: 'result', roundResult: result }));
        };

        const handleGameOver = (data) => {
            setGameData(prev => ({ ...prev, gameState: 'finished', finalRanking: data.players }));
            sessionStorage.removeItem('kahootPlayer');
        };
        
        const handleGameCanceled = ({ message }) => {
            alert(message || 'O jogo foi encerrado.');
            sessionStorage.removeItem('kahootPlayer');
            navigate('/quiz/create'); // Redireciona para um local seguro
        };
        
        const handleReconnect = () => {
            const savedPlayerData = sessionStorage.getItem('kahootPlayer');
            if (!savedPlayerData) {
                setGameData(prev => ({ ...prev, gameState: 'error', error: 'Sessão não encontrada. Por favor, entre no jogo novamente.' }));
                return;
            }

            const { nickname } = JSON.parse(savedPlayerData);
            socket.emit('kahoot:player_rejoin', { accessCode, nickname }, (response) => {
                if (response.error) {
                    setGameData(prev => ({ ...prev, gameState: 'error', error: response.error }));
                    sessionStorage.removeItem('kahootPlayer');
                } else {
                    const newGameState = response.game.status === 'in_progress' ? 'question' : response.game.status;
                    setGameData({
                        ...gameData,
                        player: response.player,
                        game: response.game,
                        gameState: newGameState,
                        question: response.currentQuestion
                    });
                    previousScoreRef.current = response.player.score;
                }
            });
        };

        socket.on('connect', handleReconnect); // Tenta reconectar se a conexão for restabelecida
        socket.on('kahoot:new_question', handleNewQuestion);
        socket.on('kahoot:round_result', handleRoundResult);
        socket.on('kahoot:game_over', handleGameOver);
        socket.on('kahoot:game_canceled', handleGameCanceled);
        
        handleReconnect(); // Tenta a primeira conexão/reconexão

        return () => {
            socket.off('connect', handleReconnect);
            socket.off('kahoot:new_question', handleNewQuestion);
            socket.off('kahoot:round_result', handleRoundResult);
            socket.off('kahoot:game_over', handleGameOver);
            socket.off('kahoot:game_canceled', handleGameCanceled);
        };
    }, [accessCode, navigate, socket]);
    
    useEffect(() => {
        if (gameData.gameState === 'result' && gameData.roundResult) {
            const myResult = gameData.roundResult.ranking.find(p => p.nickname === gameData.player?.nickname);
            if (myResult) {
                setGameData(prev => ({ ...prev, player: { ...prev.player, score: myResult.score } }));
            }
        }
    }, [gameData.gameState, gameData.roundResult, gameData.player?.nickname]);

    useEffect(() => {
        let timer;
        if (gameData.gameState === 'question' && time > 0) {
            timer = setTimeout(() => setTime(t => t - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [gameData.gameState, time]);

    const handleAnswerClick = (answerIndex) => {
        if (selectedAnswer === null) {
            setSelectedAnswer(answerIndex);
            socket.emit('kahoot:player_answer', { accessCode, answerIndex, timeRemaining: time });
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col p-4">
             <header className="flex-shrink-0 flex justify-between items-center bg-black/30 p-4 rounded-t-lg">
                <h2 className="text-xl font-bold text-white truncate">{gameData.player?.nickname || 'Aguardando...'}</h2>
                <div className="text-xl font-bold text-amber-300">{gameData.player?.score || 0} pts</div>
            </header>
            <main className="flex-grow flex items-center justify-center bg-black/20 p-4 rounded-b-lg relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        // CUIDADO: A chave da animação é o gameState. Isso força a Framer Motion
                        // a ver a mudança como uma troca de componente, animando corretamente.
                        key={gameData.gameState}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20, position: 'absolute' }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full flex items-center justify-center"
                    >
                        <GameStateRenderer 
                            gameState={gameData.gameState}
                            question={gameData.question}
                            time={time}
                            onAnswer={handleAnswerClick}
                            selectedAnswer={selectedAnswer}
                            roundResult={gameData.roundResult}
                            player={gameData.player}
                            previousScore={previousScoreRef.current}
                            finalRanking={gameData.finalRanking}
                            message={gameData.error}
                        />
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default PlayerScreen;
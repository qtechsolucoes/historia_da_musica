import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, LogOut, ShieldQuestion } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

// Um novo componente de Modal simples
const EndGameModal = ({ show, requesterName, onAccept, onNegotiate, onDismiss }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <motion.div initial={{scale:0.8, opacity: 0}} animate={{scale:1, opacity: 1}} className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-amber-700 text-center">
                <ShieldQuestion className="mx-auto text-amber-400 mb-4" size={48} />
                <h3 className="text-xl text-white mb-2">{requesterName} quer encerrar a partida.</h3>
                <p className="text-stone-300 mb-6">Se você aceitar, o jogador com mais pontos vence. O que deseja fazer?</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onAccept} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-500">Aceitar e Encerrar</button>
                    <button onClick={onNegotiate} className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-500" disabled>Negociar (em breve)</button>
                    <button onClick={onDismiss} className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-500">Recusar</button>
                </div>
            </motion.div>
        </div>
    );
};

const GameOverModal = ({ show, result, onBack }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <motion.div initial={{scale:0.8, opacity: 0}} animate={{scale:1, opacity: 1}} className="bg-gray-900 p-8 rounded-lg shadow-2xl border-2 border-amber-400 text-center">
                <Trophy className="mx-auto text-amber-400 mb-4 animate-pulse" size={64} />
                <h2 className="text-3xl text-amber-300 font-title mb-2">Fim de Jogo!</h2>
                <p className="text-2xl text-white mb-4">Vencedor: <span className="font-bold">{result.winner}</span></p>
                <p className="text-stone-300">Prémio: <span className="font-bold text-amber-300">{result.prize}</span> pontos!</p>
                <button onClick={onBack} className="mt-8 px-8 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-600 transition-colors font-bold">Voltar ao Hub</button>
            </motion.div>
        </div>
    );
};


const BattleMode = ({ user, socket, period, onBack }) => {
    const [gameState, setGameState] = useState('idle'); // idle, waiting, in_battle, result
    const [battleInfo, setBattleInfo] = useState(null);
    const [questionData, setQuestionData] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [result, setResult] = useState(null); // Resultado da rodada
    const [totalScores, setTotalScores] = useState(null);
    const [showEndGamePrompt, setShowEndGamePrompt] = useState(false);
    const [endGameRequester, setEndGameRequester] = useState('');
    const [gameOverData, setGameOverData] = useState(null);

    useEffect(() => {
        const handleWaiting = () => setGameState('waiting');
        const handleBattleFound = (data) => {
            setBattleInfo(data);
            setTotalScores(data.scores);
            setGameState('in_battle');
        };
        const handleNewQuestion = (question) => {
            setQuestionData(question);
            setSelectedAnswer(null);
            setResult(null); // Zera o resultado da rodada anterior
            setGameState('in_battle');
        };
        const handleBattleResult = (data) => {
            setResult(data);
            setTotalScores(data.scores); // Atualiza o placar geral
            setGameState('result');
        };
        const handleOpponentDisconnected = () => {
            alert('Seu oponente desconectou e perdeu 5 pontos. Você venceu!');
            // Idealmente, o servidor deveria formalizar esta vitória
            onBack();
        };
        const handleBattleError = (message) => {
            alert(`Erro na batalha: ${message}`);
            onBack();
        };
        const handleConfirmEndGame = ({ requesterName }) => {
            setEndGameRequester(requesterName);
            setShowEndGamePrompt(true);
        };
        const handleGameOver = (data) => {
            setGameOverData(data);
        };

        socket.on('waiting_for_opponent', handleWaiting);
        socket.on('battle_found', handleBattleFound);
        socket.on('new_battle_question', handleNewQuestion);
        socket.on('battle_result', handleBattleResult);
        socket.on('opponent_disconnected', handleOpponentDisconnected);
        socket.on('battle_error', handleBattleError);
        socket.on('confirm_end_game', handleConfirmEndGame);
        socket.on('game_over', handleGameOver);

        return () => {
            socket.off('waiting_for_opponent', handleWaiting);
            socket.off('battle_found', handleBattleFound);
            socket.off('new_battle_question', handleNewQuestion);
            socket.off('battle_result', handleBattleResult);
            socket.off('opponent_disconnected', handleOpponentDisconnected);
            socket.off('battle_error', handleBattleError);
            socket.off('confirm_end_game', handleConfirmEndGame);
            socket.off('game_over', handleGameOver);
        };
    }, [socket, onBack]);

    const handleFindBattle = () => {
        socket.emit('find_battle', { user, periodId: period.id });
        setGameState('waiting');
    };

    const handleAnswerSubmit = (answer) => {
        if (!selectedAnswer && battleInfo) {
            setSelectedAnswer(answer);
            socket.emit('battle_answer', { battleId: battleInfo.battleId, answer });
        }
    };
    
    const getButtonClass = (option) => {
        if (!result) {
            return selectedAnswer === option ? 'bg-amber-600/50' : 'bg-gray-700 hover:bg-gray-600';
        }
        if (option === result.correctAnswer) return 'bg-green-600/70 border-green-500';
        if (selectedAnswer && option === selectedAnswer) return 'bg-red-600/70 border-red-500';
        return 'bg-gray-700 opacity-60';
    };

    const handleRequestEndGame = () => {
        socket.emit('request_end_game', { battleId: battleInfo.battleId });
        alert('Pedido para encerrar a partida enviado. Aguardando resposta do oponente.');
    };

    if (gameOverData) {
        return <GameOverModal show={true} result={gameOverData} onBack={onBack} />;
    }

    if (gameState === 'idle') {
        return (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="text-center">
                 <h2 className="text-3xl mb-4 text-amber-300 font-title">Batalha de Conhecimento</h2>
                 <p className="text-stone-300 mb-6">Desafie outro jogador em um quiz de velocidade sobre o período <span className="font-bold text-amber-300">{period.name}</span>!</p>
                 <button onClick={handleFindBattle} className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600/20 text-blue-200 border-2 border-blue-500 rounded-lg hover:bg-blue-600/40 transition-all text-xl font-bold">
                     <Swords size={28} />
                     Procurar Oponente
                 </button>
            </motion.div>
        );
    }
    
    if (gameState === 'waiting') {
         return (
             <div className="text-center p-8">
                <h2 className="text-2xl text-amber-300 mb-4 animate-pulse">Procurando oponente...</h2>
                <LoadingSpinner />
                <p className="text-stone-400 mt-4">Aguarde, estamos conectando você a outro mestre da música.</p>
             </div>
         );
    }

    if (gameState === 'in_battle' || gameState === 'result') {
        if (!battleInfo || !totalScores) return <LoadingSpinner />;

        const player1 = battleInfo.players[0];
        const player2 = battleInfo.players[1];

        return (
             <div className="w-full max-w-4xl mx-auto">
                 <EndGameModal 
                    show={showEndGamePrompt} 
                    requesterName={endGameRequester} 
                    onAccept={() => {
                        socket.emit('accept_end_game', { battleId: battleInfo.battleId });
                        setShowEndGamePrompt(false);
                    }}
                    onNegotiate={() => alert('Funcionalidade em desenvolvimento.')}
                    onDismiss={() => setShowEndGamePrompt(false)}
                 />

                 <div className="flex justify-between items-center mb-6 p-3 bg-black/30 rounded-lg border border-amber-900/50">
                     <div className="text-center flex flex-col items-center gap-2">
                         <img src={player1.user.picture} alt={player1.user.name} className="w-16 h-16 rounded-full border-2 border-amber-400" />
                         <p className="font-bold text-amber-200 truncate max-w-xs">{player1.user.name}</p>
                         <p className="text-2xl font-bold text-white">{totalScores[player1.id]}</p>
                     </div>
                      <Trophy size={40} className="text-amber-400 flex-shrink-0 mx-4"/>
                     <div className="text-center flex flex-col items-center gap-2">
                         <img src={player2.user.picture} alt={player2.user.name} className="w-16 h-16 rounded-full border-2 border-amber-400" />
                         <p className="font-bold text-amber-200 truncate max-w-xs">{player2.user.name}</p>
                         <p className="text-2xl font-bold text-white">{totalScores[player2.id]}</p>
                     </div>
                 </div>

                {!questionData && <LoadingSpinner />}
                
                {questionData && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-4 p-4 bg-black/30 rounded-md border border-amber-900/50">
                        <p className="text-stone-300 text-xl font-semibold mb-4 text-center">{questionData.question}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {questionData.options.map((option, index) => (
                                <button 
                                    key={index} 
                                    onClick={() => handleAnswerSubmit(option)} 
                                    disabled={!!selectedAnswer || !!result} 
                                    className={`px-4 py-3 text-stone-200 rounded-md text-left transition-all duration-300 border ${getButtonClass(option)} disabled:cursor-not-allowed`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                <AnimatePresence>
                    {result && (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="mt-6 text-center font-bold text-2xl text-amber-300">
                            Aguardando próximo round...
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-8 text-center">
                    <button onClick={handleRequestEndGame} className="px-4 py-2 text-sm bg-red-800/50 text-red-200 border border-red-700 rounded-md hover:bg-red-700/50 flex items-center gap-2 mx-auto">
                        <LogOut size={16} />
                        Propor Fim da Partida
                    </button>
                </div>
             </div>
        );
    }
    
    return null;
};

export default BattleMode;
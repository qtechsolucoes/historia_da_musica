import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Trophy } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const BattleMode = ({ user, socket, period, onBack }) => {
    const [gameState, setGameState] = useState('idle'); // idle, waiting, in_battle, result
    const [battleInfo, setBattleInfo] = useState(null);
    const [questionData, setQuestionData] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [result, setResult] = useState(null);

    useEffect(() => {
        // Listeners do Socket
        const handleWaiting = () => setGameState('waiting');
        const handleBattleFound = (data) => {
            setBattleInfo(data);
            setGameState('in_battle');
        };
        const handleNewQuestion = (question) => {
            setQuestionData(question);
            setSelectedAnswer(null);
            setResult(null);
            setGameState('in_battle');
        };
        const handleBattleResult = (data) => {
            setResult(data);
            setGameState('result');
            setTimeout(() => {
                // Não precisa pedir a próxima pergunta, o servidor enviará
            }, 5000);
        };
        const handleOpponentDisconnected = () => {
            alert('Seu oponente desconectou. A batalha foi encerrada.');
            onBack();
        };
        const handleBattleError = (message) => {
            alert(`Erro na batalha: ${message}`);
            onBack();
        };

        socket.on('waiting_for_opponent', handleWaiting);
        socket.on('battle_found', handleBattleFound);
        socket.on('new_battle_question', handleNewQuestion);
        socket.on('battle_result', handleBattleResult);
        socket.on('opponent_disconnected', handleOpponentDisconnected);
        socket.on('battle_error', handleBattleError);

        // Função de limpeza ao desmontar o componente
        return () => {
            socket.off('waiting_for_opponent', handleWaiting);
            socket.off('battle_found', handleBattleFound);
            socket.off('new_battle_question', handleNewQuestion);
            socket.off('battle_result', handleBattleResult);
            socket.off('opponent_disconnected', handleOpponentDisconnected);
            socket.off('battle_error', handleBattleError);
        };
    }, [socket, onBack]);

    const handleFindBattle = () => {
        // CORREÇÃO: Enviando o ID do período junto com os dados do usuário
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

    // Renderização dos diferentes estados do jogo
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
        if (!battleInfo) return <LoadingSpinner />; // Proteção caso battleInfo ainda não tenha chegado

        const player1 = battleInfo.players[0];
        const player2 = battleInfo.players[1];

        return (
             <div className="w-full max-w-4xl mx-auto">
                 <div className="flex justify-between items-center mb-6 p-3 bg-black/30 rounded-lg border border-amber-900/50">
                     <div className="text-center">
                         <p className="font-bold text-amber-200 truncate max-w-xs">{player1.name}</p>
                         <p className="text-2xl font-bold text-white">{result?.scores[Object.keys(result.scores).find(id => activeBattles[battleId].players[id].email === player1.email)] || 0}</p>
                     </div>
                      <Trophy size={40} className="text-amber-400 flex-shrink-0 mx-4"/>
                     <div className="text-center">
                         <p className="font-bold text-amber-200 truncate max-w-xs">{player2.name}</p>
                         <p className="text-2xl font-bold text-white">{result?.scores[Object.keys(result.scores).find(id => activeBattles[battleId].players[id].email === player2.email)] || 0}</p>
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

                {result && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-6 text-center font-bold text-2xl text-amber-300">
                        Aguardando próximo round...
                    </motion.div>
                )}
             </div>
        );
    }
    
    return null; // Estado padrão
};

export default BattleMode;
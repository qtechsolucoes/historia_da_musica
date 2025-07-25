import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { BrainCircuit, Sparkles, Crown, ArrowLeft, Clock, HelpCircle, ListChecks, Swords, PlusSquare, Hash, Heart, Shield } from 'lucide-react';

import { useMusicAppStore } from '../../store/musicAppStore';
import LoadingSpinner from '../LoadingSpinner';
import BattleMode from '../BattleMode';

// --- Componentes Auxiliares (Movidos de MainContent.jsx) ---

const ChallengeHub = ({ setActiveChallenge }) => (
    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-5xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl mb-6 text-amber-300 font-title flex items-center justify-center gap-3"><BrainCircuit/> Hub de Desafios</h2>
        
        <div className="mb-6 p-4 border border-dashed border-amber-500 rounded-lg bg-amber-900/20">
            <h3 className="text-lg md:text-xl font-bold text-amber-200 animate-pulse">🔥 Desafio Diário 🔥</h3>
            <p className="text-stone-300 mt-1 text-sm md:text-base">Jogue no período Barroco para ganhar pontos em dobro!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/quiz/create" className="p-4 md:p-6 bg-green-800/50 rounded-lg border border-green-700/50 hover:bg-green-600/20 hover:border-green-500 transition-all group flex flex-col items-center col-span-1 md:col-span-2">
                <PlusSquare size={32} className="mb-2 text-green-400"/>
                <h3 className="text-lg md:text-xl font-bold text-green-300 font-serif">Criar Quiz Multiplayer</h3>
                <p className="text-stone-400 mt-2 text-xs md:text-sm">Crie e partilhe o seu próprio quiz interativo!</p>
            </Link>

            <Link to="/quiz/join" className="p-4 md:p-6 bg-blue-800/50 rounded-lg border border-blue-700/50 hover:bg-blue-600/20 hover:border-blue-500 transition-all group flex flex-col items-center col-span-1 md:col-span-2">
                <Hash size={32} className="mb-2 text-blue-400"/>
                <h3 className="text-lg md:text-xl font-bold text-blue-300 font-serif">Entrar com Código</h3>
                <p className="text-stone-400 mt-2 text-xs md:text-sm">Participe de um quiz existente.</p>
            </Link>
            
            <button onClick={() => setActiveChallenge('quiz')} className="p-4 md:p-6 bg-gray-800/50 rounded-lg border border-amber-800/50 hover:bg-amber-600/20 hover:border-amber-500 transition-all group flex flex-col items-center">
                <ListChecks size={32} className="mb-2 text-amber-400"/>
                <h3 className="text-lg md:text-xl font-bold text-amber-300 font-serif">Múltipla Escolha</h3>
                <p className="text-stone-400 mt-2 text-xs md:text-sm">Responda perguntas sobre compositores e suas obras.</p>
            </button>
            <button onClick={() => setActiveChallenge('whoami')} className="p-4 md:p-6 bg-gray-800/50 rounded-lg border border-amber-800/50 hover:bg-amber-600/20 hover:border-amber-500 transition-all group flex flex-col items-center">
                <HelpCircle size={32} className="mb-2 text-amber-400"/>
                <h3 className="text-lg md:text-xl font-bold text-amber-300 font-serif">Quem Sou Eu?</h3>
                <p className="text-stone-400 mt-2 text-xs md:text-sm">Adivinhe o compositor a partir de uma descrição.</p>
            </button>
            <button onClick={() => setActiveChallenge('timeline')} className="p-4 md:p-6 bg-gray-800/50 rounded-lg border border-amber-800/50 hover:bg-amber-600/20 hover:border-amber-500 transition-all group flex flex-col items-center">
                <Clock size={32} className="mb-2 text-amber-400"/>
                <h3 className="text-lg md:text-xl font-bold text-amber-300 font-serif">Linha do Tempo</h3>
                <p className="text-stone-400 mt-2 text-xs md:text-sm">Ordene os compositores cronologicamente.</p>
            </button>
            <button onClick={() => setActiveChallenge('fromWhichPeriod')} className="p-4 md:p-6 bg-gray-800/50 rounded-lg border border-amber-800/50 hover:bg-amber-600/20 hover:border-amber-500 transition-all group flex flex-col items-center">
                <BrainCircuit size={32} className="mb-2 text-amber-400"/>
                <h3 className="text-lg md:text-xl font-bold text-amber-300 font-serif">De Que Período?</h3>
                <p className="text-stone-400 mt-2 text-xs md:text-sm">Identifique o período musical pela descrição.</p>
            </button>
             <button onClick={() => setActiveChallenge('battle')} className="p-4 md:p-6 bg-gray-800/50 rounded-lg border border-purple-800/50 hover:bg-purple-600/20 hover:border-purple-500 transition-all group flex flex-col items-center">
                <Swords size={32} className="mb-2 text-purple-400"/>
                <h3 className="text-lg md:text-xl font-bold text-purple-300 font-serif">Duelo Épico</h3>
                <p className="text-stone-400 mt-2 text-xs md:text-sm">Desafie outro jogador em tempo real.</p>
            </button>
            <button onClick={() => setActiveChallenge('ranking')} className="p-4 md:p-6 bg-gray-800/50 rounded-lg border border-amber-800/50 hover:bg-amber-600/20 hover:border-amber-500 transition-all group flex flex-col items-center">
                <Crown size={32} className="mb-2 text-amber-400"/>
                <h3 className="text-lg md:text-xl font-bold text-amber-300 font-serif">Ranking Geral</h3>
                <p className="text-stone-400 mt-2 text-xs md:text-sm">Veja os maiores mestres da história.</p>
            </button>
            <button onClick={() => setActiveChallenge('survival')} className="p-4 md:p-6 bg-red-800/50 rounded-lg border border-red-700/50 hover:bg-red-600/20 hover:border-red-500 transition-all group flex flex-col items-center col-span-1 md:col-span-2 lg:col-span-4">
                <Shield size={32} className="mb-2 text-red-400"/>
                <h3 className="text-lg md:text-xl font-bold text-red-300 font-serif">Modo Sobrevivência</h3>
                <p className="text-stone-400 mt-2 text-xs md:text-sm">Quantas perguntas você consegue acertar antes de perder todas as vidas?</p>
            </button>
        </div>
    </motion.div>
);

const SurvivalGame = ({ survival, onAnswer, onStart, generateQuestion, getButtonClass }) => {
    useEffect(() => {
        if (survival.isActive && !survival.question && !survival.isLoading) {
            generateQuestion();
        }
    }, [survival.isActive, survival.question, survival.isLoading, generateQuestion]);

    if (survival.isGameOver) {
        return (
            <motion.div initial={{opacity:0, scale: 0.8}} animate={{opacity:1, scale: 1}} className="text-center">
                <h2 className="text-5xl font-bold text-red-400 mb-4">Fim de Jogo!</h2>
                <p className="text-3xl text-white">Sua pontuação final foi:</p>
                <p className="text-8xl font-bold text-amber-300 my-4">{survival.score}</p>
                <button onClick={onStart} className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500">
                    Jogar Novamente
                </button>
            </motion.div>
        )
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6 p-4 bg-black/50 rounded-lg">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-2xl text-amber-300">Pontos: {survival.score}</span>
                </div>
                <div className="flex items-center gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Heart key={i} size={32} className={`${i < survival.lives ? 'text-red-500 fill-current animate-pulse' : 'text-gray-600'}`} />
                    ))}
                </div>
            </div>

            {survival.isLoading && <LoadingSpinner />}
            
            {survival.question && survival.question.options && !survival.isLoading && (
                <motion.div 
                    key={survival.question.text}
                    initial={{opacity: 0, x: 50}} 
                    animate={{opacity: 1, x: 0}}
                    className="p-4 bg-black/30 rounded-md border border-amber-900/50"
                >
                    <p className="text-stone-300 text-xl font-semibold mb-4 text-center">
                        "{survival.question.text}"
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {survival.question.options.map((option, index) => (
                            <button 
                                key={index} 
                                onClick={() => onAnswer(option)} 
                                disabled={survival.question.feedback !== undefined}
                                className={`px-3 py-2 text-stone-200 rounded-md text-left transition-all duration-300 border ${getButtonClass(option, survival.question.answer, survival.question.guessedOption, survival.question.feedback !== undefined)} disabled:cursor-not-allowed`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    )
};


// --- Componente Principal da Aba de Desafios ---

const ChallengesTab = ({ socket, sounds }) => {
    const {
        activeChallenge, setActiveChallenge, leaderboard, currentUser,
        quiz, handleGenerateQuiz, handleQuizGuess,
        whoAmI, handleGenerateWhoAmI, handleWhoAmIGuess,
        timeline, handleGenerateTimeline, handleCheckTimeline, setTimelineItems,
        fromWhichPeriod, handleGenerateFromWhichPeriod, handleFromWhichPeriodGuess,
        survival, handleStartSurvival, generateSurvivalQuestion, handleSurvivalAnswer,
        selectedPeriodId
    } = useMusicAppStore();

    const period = useMusicAppStore.getState().musicHistoryData.find(p => p.id === selectedPeriodId);
    
    const getButtonClass = (option, answer, guessedOption, hasFeedback) => {
        if (!hasFeedback) return 'bg-gray-700 hover:bg-gray-600';
        const isCorrectAnswer = option.trim().toLowerCase() === answer.trim().toLowerCase();
        
        if (isCorrectAnswer) return 'bg-green-600/70 border-green-500';
        
        const isGuessedOption = guessedOption && (option.trim().toLowerCase() === guessedOption.trim().toLowerCase());
        if (isGuessedOption) return 'bg-red-600/70 border-red-500';

        return 'bg-gray-700 opacity-60';
    };

    const goBackToHub = () => setActiveChallenge(null);

    if (!activeChallenge) {
        return <ChallengeHub setActiveChallenge={setActiveChallenge} />;
    }
    
    switch (activeChallenge) {
        case 'quiz':
            return (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                    <button onClick={goBackToHub} className="flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-4 text-sm"><ArrowLeft size={16} /> Voltar ao Hub</button>
                    <h2 className="text-2xl md:text-3xl mb-4 text-amber-300 font-title">Múltipla Escolha</h2>
                    <button onClick={() => handleGenerateQuiz()} disabled={quiz.isLoading} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-wait mb-4">
                        <Sparkles size={18} />
                        {quiz.isLoading ? 'Criando...' : 'Gerar Nova Pergunta'}
                    </button>
                    {quiz.isLoading && <LoadingSpinner />}
                    {quiz.question && !quiz.isLoading && (
                        <div className="mt-4 p-4 bg-black/30 rounded-md border border-amber-900/50">
                            <p className="text-stone-300 text-lg font-semibold mb-4 text-justify">{quiz.question}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {quiz.options.map((option, index) => <button key={index} onClick={() => handleQuizGuess(option, sounds)} disabled={!!quiz.feedback} className={`px-3 py-2 text-stone-200 rounded-md text-left transition-all duration-300 border ${getButtonClass(option, quiz.answer, quiz.guessedOption, !!quiz.feedback)} disabled:cursor-not-allowed`}>{option}</button>)}
                            </div>
                            {quiz.feedback && <p className="mt-4 font-bold text-lg text-amber-300 text-justify">{quiz.feedback}</p>}
                        </div>
                    )}
                </motion.div>
            );

        case 'survival':
            if (!survival.isActive && !survival.isGameOver) {
                return (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="text-center bg-black/20 p-6 rounded-lg">
                         <h2 className="text-3xl mb-4 text-red-300 font-title">Modo Sobrevivência</h2>
                         <p className="text-stone-300 mb-6">Teste seus conhecimentos em uma maratona de perguntas. Você tem 3 vidas. Boa sorte!</p>
                         <button onClick={handleStartSurvival} className="px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500">
                             Começar!
                         </button>
                    </motion.div>
                )
            }
            return (
                 <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                    <button onClick={goBackToHub} className="flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-4 text-sm"><ArrowLeft size={16} /> Desistir e Voltar</button>
                    <SurvivalGame
                        survival={survival}
                        onAnswer={(guess) => handleSurvivalAnswer(guess, sounds)}
                        onStart={handleStartSurvival}
                        generateQuestion={generateSurvivalQuestion}
                        getButtonClass={getButtonClass}
                    />
                </motion.div>
            );

        case 'whoami':
             return (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                    <button onClick={goBackToHub} className="flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-4 text-sm"><ArrowLeft size={16} /> Voltar ao Hub</button>
                    <h2 className="text-2xl md:text-3xl mb-4 text-amber-300 font-title">Quem Sou Eu?</h2>
                    <button onClick={() => handleGenerateWhoAmI()} disabled={whoAmI.isLoading} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-wait mb-4">
                        <Sparkles size={18} />
                        {whoAmI.isLoading ? 'Criando...' : 'Gerar Novo Desafio'}
                    </button>
                     {whoAmI.isLoading && <LoadingSpinner />}
                     {whoAmI.description && !whoAmI.isLoading && (
                        <div className="mt-4 p-4 bg-black/30 rounded-md border border-amber-900/50">
                            <p className="text-stone-300 text-lg italic font-semibold mb-4 text-center">"{whoAmI.description}"</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {whoAmI.options.map((option, index) => <button key={index} onClick={() => handleWhoAmIGuess(option, sounds)} disabled={!!whoAmI.feedback} className={`px-3 py-2 text-stone-200 rounded-md text-left transition-all duration-300 border ${getButtonClass(option, whoAmI.answer, whoAmI.guessedOption, !!whoAmI.feedback)} disabled:cursor-not-allowed`}>{option}</button>)}
                            </div>
                            {whoAmI.feedback && <p className="mt-4 font-bold text-lg text-amber-300 text-justify">{whoAmI.feedback}</p>}
                        </div>
                     )}
                </motion.div>
            );

        case 'timeline':
            const getTimelineItemClass = (itemName) => {
                if (!timeline.isChecked) return 'bg-gray-800/60 border-amber-800/50';
                const userIndex = timeline.items.findIndex(item => item.name === itemName);
                if (userIndex < 0 || userIndex >= timeline.correctOrder.length) return 'bg-gray-800/60 border-amber-800/50';
                
                return timeline.correctOrder[userIndex] === itemName 
                    ? 'bg-green-600/50 border-green-500'
                    : 'bg-red-600/50 border-red-500';
            };
            
            return (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                    <button onClick={goBackToHub} className="flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-4 text-sm"><ArrowLeft size={16} /> Voltar ao Hub</button>
                    <h2 className="text-2xl md:text-3xl mb-2 text-amber-300 font-title flex items-center gap-3"><Clock /> Linha do Tempo</h2>
                    <p className="text-stone-400 mb-4">Arraste os compositores para ordená-los do mais antigo para o mais recente (por ano de nascimento).</p>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                        <button onClick={handleGenerateTimeline} disabled={timeline.isLoading} className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-wait">
                            <Sparkles size={18} />
                            {timeline.isLoading ? 'Gerando...' : 'Gerar Novo Desafio'}
                        </button>
                        <button onClick={() => handleCheckTimeline(timeline.items, sounds)} disabled={timeline.isLoading || timeline.isChecked || timeline.items.length === 0} className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600/20 text-blue-200 border border-blue-500 rounded-md hover:bg-blue-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            Verificar Ordem
                        </button>
                    </div>
                    
                    {timeline.isLoading && <LoadingSpinner />}

                    {timeline.items.length > 0 && !timeline.isLoading && (
                        <div className="mt-6">
                            <Reorder.Group axis="y" values={timeline.items} onReorder={setTimelineItems} className="space-y-3">
                                {timeline.items.map(item => (
                                    <Reorder.Item key={item.name} value={item} className={`p-4 rounded-md shadow-md cursor-grab active:cursor-grabbing border ${getTimelineItemClass(item.name)} transition-colors duration-300`}>
                                        <p className="font-bold text-lg text-amber-200">{item.name}</p>
                                        <p className="text-sm text-stone-300">{timeline.isChecked ? item.lifespan : '???'}</p>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        </div>
                    )}
                    
                    {timeline.feedback && <p className="mt-4 font-bold text-lg text-amber-300 text-center">{timeline.feedback}</p>}
                </motion.div>
            );
        
        case 'fromWhichPeriod':
            return (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                    <button onClick={goBackToHub} className="flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-4 text-sm"><ArrowLeft size={16} /> Voltar ao Hub</button>
                    <h2 className="text-2xl md:text-3xl mb-4 text-amber-300 font-title">De Que Período?</h2>
                    
                    <p className="text-stone-400 mb-4">Leia a descrição e escolha o período musical correto.</p>

                    <button onClick={() => handleGenerateFromWhichPeriod()} disabled={fromWhichPeriod.isLoading} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-wait mb-4">
                        <Sparkles size={18} />
                        {fromWhichPeriod.isLoading ? 'Criando...' : 'Gerar Novo Desafio'}
                    </button>
                    
                    {fromWhichPeriod.isLoading && <LoadingSpinner />}
                    
                    {fromWhichPeriod.description && !fromWhichPeriod.isLoading && (
                        <div className="mt-4 p-4 bg-black/30 rounded-md border border-amber-900/50">
                            <p className="text-stone-300 text-lg italic font-semibold mb-4 text-center">"{fromWhichPeriod.description}"</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {fromWhichPeriod.options.map((option, index) => (
                                    <button 
                                        key={index} 
                                        onClick={() => handleFromWhichPeriodGuess(option, sounds)} 
                                        disabled={!!fromWhichPeriod.feedback}
                                        className={`px-3 py-2 text-stone-200 rounded-md text-left transition-all duration-300 border ${getButtonClass(option, fromWhichPeriod.answer, fromWhichPeriod.guessedOption, !!fromWhichPeriod.feedback)} disabled:cursor-not-allowed`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                            {fromWhichPeriod.feedback && <p className="mt-4 font-bold text-lg text-amber-300 text-center">{fromWhichPeriod.feedback}</p>}
                        </div>
                    )}
                </motion.div>
            );

        case 'ranking':
            return (
                 <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                    <button onClick={goBackToHub} className="flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-4 text-sm"><ArrowLeft size={16} /> Voltar ao Hub</button>
                    <h2 className="text-2xl md:text-3xl mb-4 text-amber-300 font-title flex items-center gap-3"><Crown /> Ranking dos Mestres</h2>
                    <ul className="space-y-3">
                        {leaderboard.length > 0 ? leaderboard.map((player, index) => (
                            <li key={player.email} className={`flex items-center justify-between p-3 rounded-md bg-gray-800/60 border ${index === 0 ? 'border-amber-400 shadow-lg shadow-amber-400/20' : 'border-amber-900/50'}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`font-bold text-lg w-6 text-center ${index === 0 ? 'text-amber-300' : 'text-stone-400'}`}>{index + 1}</span>
                                    <p className="font-semibold text-stone-200">{player.name}</p>
                                </div>
                                <p className="font-bold text-amber-300">{player.score} pts</p>
                            </li>
                        )) : <p className="text-stone-400 text-center">Ninguém no ranking ainda. Jogue para ser o primeiro!</p>}
                    </ul>
                </motion.div>
            );
        
        case 'battle':
            if (!currentUser) {
                return (
                    <div className="text-center p-6 bg-black/20 rounded-lg max-w-4xl mx-auto">
                        <h2 className="text-2xl text-amber-300 mb-4">Modo Batalha</h2>
                        <p className="text-stone-300">Você precisa estar logado para desafiar outros jogadores.</p>
                        <button onClick={goBackToHub} className="mt-4 flex items-center justify-center mx-auto gap-2 px-6 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all">
                            <ArrowLeft size={16} /> Voltar ao Hub
                        </button>
                    </div>
                );
            }
            return (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                    <button onClick={goBackToHub} className="flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-4 text-sm"><ArrowLeft size={16} /> Voltar ao Hub</button>
                    <BattleMode user={currentUser} socket={socket} period={period} onBack={goBackToHub} />
                </motion.div>
            );
        default:
            return <ChallengeHub setActiveChallenge={setActiveChallenge} />;
    }
};

export default ChallengesTab;
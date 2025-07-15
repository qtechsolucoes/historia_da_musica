import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { BrainCircuit, Sparkles, Crown, ArrowLeft, Clock, HelpCircle, ListChecks, Swords, PlusSquare, Hash, Heart, Shield } from 'lucide-react';
import InfoCard from './InfoCard';
import WorkCard from './WorkCard';
import LoadingSpinner from './LoadingSpinner';
import BattleMode from './BattleMode'; 

const ChallengeHub = ({ setActiveChallenge }) => (
    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-5xl mx-auto text-center">
        <h2 className="text-3xl mb-6 text-amber-300 font-title flex items-center justify-center gap-3"><BrainCircuit/> Hub de Desafios</h2>
        
        <div className="mb-6 p-4 border border-dashed border-amber-500 rounded-lg bg-amber-900/20">
            <h3 className="text-xl font-bold text-amber-200 animate-pulse">🔥 Desafio Diário 🔥</h3>
            <p className="text-stone-300 mt-1">Jogue no período Barroco para ganhar pontos em dobro!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/quiz/create" className="p-6 bg-green-800/50 rounded-lg border border-green-700/50 hover:bg-green-600/20 hover:border-green-500 transition-all group flex flex-col items-center col-span-1 md:col-span-2">
                <PlusSquare size={32} className="mb-2 text-green-400"/>
                <h3 className="text-xl font-bold text-green-300 font-serif">Criar Quiz Multiplayer</h3>
                <p className="text-stone-400 mt-2 text-sm">Crie e partilhe o seu próprio quiz interativo!</p>
            </Link>

            <Link to="/quiz/join" className="p-6 bg-blue-800/50 rounded-lg border border-blue-700/50 hover:bg-blue-600/20 hover:border-blue-500 transition-all group flex flex-col items-center col-span-1 md:col-span-2">
                <Hash size={32} className="mb-2 text-blue-400"/>
                <h3 className="text-xl font-bold text-blue-300 font-serif">Entrar com Código</h3>
                <p className="text-stone-400 mt-2 text-sm">Participe de um quiz existente.</p>
            </Link>
            
            <button onClick={() => setActiveChallenge('quiz')} className="p-6 bg-gray-800/50 rounded-lg border border-amber-800/50 hover:bg-amber-600/20 hover:border-amber-500 transition-all group flex flex-col items-center">
                <ListChecks size={32} className="mb-2 text-amber-400"/>
                <h3 className="text-xl font-bold text-amber-300 font-serif">Múltipla Escolha</h3>
                <p className="text-stone-400 mt-2 text-sm">Responda perguntas sobre compositores e suas obras.</p>
            </button>
            <button onClick={() => setActiveChallenge('whoami')} className="p-6 bg-gray-800/50 rounded-lg border border-amber-800/50 hover:bg-amber-600/20 hover:border-amber-500 transition-all group flex flex-col items-center">
                <HelpCircle size={32} className="mb-2 text-amber-400"/>
                <h3 className="text-xl font-bold text-amber-300 font-serif">Quem Sou Eu?</h3>
                <p className="text-stone-400 mt-2 text-sm">Adivinhe o compositor a partir de uma descrição.</p>
            </button>
            <button onClick={() => setActiveChallenge('timeline')} className="p-6 bg-gray-800/50 rounded-lg border border-amber-800/50 hover:bg-amber-600/20 hover:border-amber-500 transition-all group flex flex-col items-center">
                <Clock size={32} className="mb-2 text-amber-400"/>
                <h3 className="text-xl font-bold text-amber-300 font-serif">Linha do Tempo</h3>
                <p className="text-stone-400 mt-2 text-sm">Ordene os compositores cronologicamente.</p>
            </button>
            <button onClick={() => setActiveChallenge('fromWhichPeriod')} className="p-6 bg-gray-800/50 rounded-lg border border-amber-800/50 hover:bg-amber-600/20 hover:border-amber-500 transition-all group flex flex-col items-center">
                <BrainCircuit size={32} className="mb-2 text-amber-400"/>
                <h3 className="text-xl font-bold text-amber-300 font-serif">De Que Período?</h3>
                <p className="text-stone-400 mt-2 text-sm">Identifique o período musical pela descrição.</p>
            </button>
            <button onClick={() => setActiveChallenge('battle')} className="p-6 bg-gray-800/50 rounded-lg border border-purple-800/50 hover:bg-purple-600/20 hover:border-purple-500 transition-all group flex flex-col items-center">
                <Swords size={32} className="mb-2 text-purple-400"/>
                <h3 className="text-xl font-bold text-purple-300 font-serif">Duelo Épico</h3>
                <p className="text-stone-400 mt-2 text-sm">Desafie outro jogador em tempo real.</p>
            </button>
            <button onClick={() => setActiveChallenge('ranking')} className="p-6 bg-gray-800/50 rounded-lg border border-amber-800/50 hover:bg-amber-600/20 hover:border-amber-500 transition-all group flex flex-col items-center">
                <Crown size={32} className="mb-2 text-amber-400"/>
                <h3 className="text-xl font-bold text-amber-300 font-serif">Ranking Geral</h3>
                <p className="text-stone-400 mt-2 text-sm">Veja os maiores mestres da história.</p>
            </button>
            <button onClick={() => setActiveChallenge('survival')} className="p-6 bg-red-800/50 rounded-lg border border-red-700/50 hover:bg-red-600/20 hover:border-red-500 transition-all group flex flex-col items-center col-span-1 md:col-span-2 lg:col-span-4">
                <Shield size={32} className="mb-2 text-red-400"/>
                <h3 className="text-xl font-bold text-red-300 font-serif">Modo Sobrevivência</h3>
                <p className="text-stone-400 mt-2 text-sm">Quantas perguntas você consegue acertar antes de perder todas as vidas?</p>
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
            
            {survival.question && !survival.isLoading && (
                <motion.div 
                    key={survival.question.text} // Forçar re-render na troca de pergunta
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
}

const MainContent = ({ 
    period, onCardClick, activeChallenge, setActiveChallenge,
    quiz, onGenerateQuiz, onQuizGuess,
    whoAmI, onGenerateWhoAmI, onWhoAmIGuess,
    timeline, onGenerateTimeline, onCheckTimeline,
    fromWhichPeriod, onGenerateFromWhichPeriod, onFromWhichPeriodGuess,
    leaderboard, user, socket,
    survival, handleStartSurvival, generateSurvivalQuestion, handleSurvivalAnswer
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [timelineItems, setTimelineItems] = useState(timeline.items);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');

    useEffect(() => {
        setSearchTerm('');
        setSortBy('name');
    }, [activeTab]);

    useEffect(() => {
        setTimelineItems(timeline.items);
    }, [timeline.items]);

    useEffect(() => {
        if (activeTab !== 'quiz') {
            setActiveChallenge(null);
        }
    }, [activeTab, setActiveChallenge]);

    const tabs = [
        { id: 'overview', label: 'Visão Geral' },
        { id: 'composers', label: 'Compositores' },
        { id: 'genres', label: 'Formas/Gêneros' },
        { id: 'styles', label: 'Técnicas/Estilos' },
        { id: 'instruments', label: 'Instrumentos' },
        { id: 'ensembles', label: 'Conjuntos' },
        { id: 'works', label: 'Obras' },
        { id: 'quiz', label: 'Desafios' },
    ];

    const getButtonClass = (option, answer, guessedOption, hasFeedback) => {
        if (!hasFeedback) return 'bg-gray-700 hover:bg-gray-600';
        const isCorrectAnswer = option.trim().toLowerCase() === answer.trim().toLowerCase();
        
        if (isCorrectAnswer) return 'bg-green-600/70 border-green-500';
        
        const isGuessedOption = guessedOption && (option.trim().toLowerCase() === guessedOption.trim().toLowerCase());
        if (isGuessedOption) return 'bg-red-600/70 border-red-500';

        return 'bg-gray-700 opacity-60';
    };

    const renderGrid = (items, type) => {
        if (!Array.isArray(items) || items.length === 0) {
            return <div className="text-stone-400 p-4 text-center">Conteúdo não disponível para esta seção.</div>;
        }

        const filteredItems = items.filter(item => 
            (item.name || item.title).toLowerCase().includes(searchTerm.toLowerCase())
        );

        const sortedItems = [...filteredItems].sort((a, b) => {
            if (sortBy === 'year' && type === 'composer' && a.lifespan && b.lifespan) {
                const yearA = parseInt(a.lifespan.split(/–|-/)[0].replace(/[^0-9]/g, ''));
                const yearB = parseInt(b.lifespan.split(/–|-/)[0].replace(/[^0-9]/g, ''));
                return yearA - yearB;
            }
            return (a.name || a.title).localeCompare(b.name || b.title);
        });

        return (
            <>
                <div className="mb-6 p-4 bg-black/20 rounded-lg border border-amber-900/50 flex flex-col sm:flex-row gap-4">
                    <input 
                        type="text"
                        placeholder={`Pesquisar por nome...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow p-2 bg-gray-800 text-white border border-amber-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {type === 'composer' && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-stone-300 text-sm">Ordenar por:</span>
                            <button onClick={() => setSortBy('name')} className={`px-3 py-1 text-sm rounded-md transition-colors ${sortBy === 'name' ? 'bg-amber-500 text-black font-bold' : 'bg-gray-700 text-stone-200 hover:bg-gray-600'}`}>Nome</button>
                            <button onClick={() => setSortBy('year')} className={`px-3 py-1 text-sm rounded-md transition-colors ${sortBy === 'year' ? 'bg-amber-500 text-black font-bold' : 'bg-gray-700 text-stone-200 hover:bg-gray-600'}`}>Ano</button>
                        </div>
                    )}
                </div>

                {sortedItems.length > 0 ? (
                    <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        <AnimatePresence>
                            {sortedItems.map((item) => (
                                <InfoCard 
                                    key={`${type}-${item.name || item.title}`}
                                    item={item} 
                                    type={type} 
                                    onCardClick={onCardClick}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="text-stone-400 p-8 text-center bg-black/20 rounded-lg">Nenhum resultado encontrado para "{searchTerm}".</div>
                )}
            </>
        );
    };

    const renderWorks = (items) => {
        if (!Array.isArray(items) || items.length === 0) {
            return <div className="text-stone-400 p-4 text-center">Conteúdo não disponível para esta seção.</div>;
        }

        const filteredItems = items.filter(item => 
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.composer.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const sortedItems = [...filteredItems].sort((a, b) => {
            if (sortBy === 'composer') {
                return a.composer.localeCompare(b.composer);
            }
            return a.title.localeCompare(b.title);
        });

        const groupedWorks = sortedItems.reduce((acc, work) => {
            const category = work.category || 'Outras Obras';
            if (!acc[category]) acc[category] = [];
            acc[category].push(work);
            return acc;
        }, {});

        return (
            <div className="space-y-8 max-w-6xl mx-auto">
                <div className="mb-6 p-4 bg-black/20 rounded-lg border border-amber-900/50 flex flex-col sm:flex-row gap-4">
                    <input 
                        type="text"
                        placeholder={`Pesquisar por obra ou compositor...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow p-2 bg-gray-800 text-white border border-amber-800/50 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-stone-300 text-sm">Ordenar por:</span>
                        <button onClick={() => setSortBy('name')} className={`px-3 py-1 text-sm rounded-md transition-colors ${sortBy === 'name' ? 'bg-amber-500 text-black font-bold' : 'bg-gray-700 text-stone-200 hover:bg-gray-600'}`}>Título</button>
                        <button onClick={() => setSortBy('composer')} className={`px-3 py-1 text-sm rounded-md transition-colors ${sortBy === 'composer' ? 'bg-amber-500 text-black font-bold' : 'bg-gray-700 text-stone-200 hover:bg-gray-600'}`}>Compositor</button>
                    </div>
                </div>

                {Object.keys(groupedWorks).length > 0 ? (
                    Object.entries(groupedWorks).map(([category, works]) => (
                        <motion.div key={category} layout>
                            <h3 className="text-2xl text-amber-200 font-serif text-shadow-gold mb-4 border-b-2 border-amber-900/50 pb-2">{category}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {works.map((work, index) => (
                                    <WorkCard key={`${category}-${work.title}-${index}`} item={work} onCardClick={onCardClick} />
                                ))}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-stone-400 p-8 text-center bg-black/20 rounded-lg">Nenhum resultado encontrado para "{searchTerm}".</div>
                )}
            </div>
        );
    };
    
    const renderChallengeContent = () => {
        const goBackToHub = () => {
             setActiveChallenge(null);
             if (survival.isActive || survival.isGameOver) {
                // Reseta o jogo de sobrevivência ao sair
                 handleStartSurvival(); 
                 setActiveChallenge(null); // Garante que a tela de início apareça na próxima vez
             }
        };

        if (!activeChallenge) {
            return <ChallengeHub setActiveChallenge={setActiveChallenge} />;
        }
        
        switch (activeChallenge) {
            case 'quiz':
                 return (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                        <button onClick={goBackToHub} className="flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-4 text-sm"><ArrowLeft size={16} /> Voltar ao Hub</button>
                        <h2 className="text-3xl mb-4 text-amber-300 font-title">Múltipla Escolha</h2>
                        <button onClick={() => onGenerateQuiz()} disabled={quiz.isLoading} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-wait mb-4">
                            <Sparkles size={18} />
                            {quiz.isLoading ? 'Criando...' : 'Gerar Nova Pergunta'}
                        </button>
                        {quiz.isLoading && <LoadingSpinner />}
                        {quiz.question && !quiz.isLoading && (
                            <div className="mt-4 p-4 bg-black/30 rounded-md border border-amber-900/50">
                                <p className="text-stone-300 text-lg font-semibold mb-4 text-justify">{quiz.question}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {quiz.options.map((option, index) => <button key={index} onClick={() => onQuizGuess(option)} disabled={!!quiz.feedback} className={`px-3 py-2 text-stone-200 rounded-md text-left transition-all duration-300 border ${getButtonClass(option, quiz.answer, quiz.guessedOption, !!quiz.feedback)} disabled:cursor-not-allowed`}>{option}</button>)}
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
                     <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                        <button onClick={goBackToHub} className="flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-4 text-sm"><ArrowLeft size={16} /> Desistir e Voltar</button>
                        <SurvivalGame
                            survival={survival}
                            onAnswer={handleSurvivalAnswer}
                            onStart={handleStartSurvival}
                            generateQuestion={generateSurvivalQuestion}
                            getButtonClass={getButtonClass}
                        />
                    </motion.div>
                );

            case 'whoami':
                 return (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                        <button onClick={goBackToHub} className="flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-4 text-sm"><ArrowLeft size={16} /> Voltar ao Hub</button>
                        <h2 className="text-3xl mb-4 text-amber-300 font-title">Quem Sou Eu?</h2>
                        <button onClick={() => onGenerateWhoAmI()} disabled={whoAmI.isLoading} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-wait mb-4">
                            <Sparkles size={18} />
                            {whoAmI.isLoading ? 'Criando...' : 'Gerar Novo Desafio'}
                        </button>
                         {whoAmI.isLoading && <LoadingSpinner />}
                         {whoAmI.description && !whoAmI.isLoading && (
                            <div className="mt-4 p-4 bg-black/30 rounded-md border border-amber-900/50">
                                <p className="text-stone-300 text-lg italic font-semibold mb-4 text-center">"{whoAmI.description}"</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {whoAmI.options.map((option, index) => <button key={index} onClick={() => onWhoAmIGuess(option)} disabled={!!whoAmI.feedback} className={`px-3 py-2 text-stone-200 rounded-md text-left transition-all duration-300 border ${getButtonClass(option, whoAmI.answer, whoAmI.guessedOption, !!whoAmI.feedback)} disabled:cursor-not-allowed`}>{option}</button>)}
                                </div>
                                {whoAmI.feedback && <p className="mt-4 font-bold text-lg text-amber-300 text-justify">{whoAmI.feedback}</p>}
                            </div>
                         )}
                    </motion.div>
                );

            case 'timeline':
                const getTimelineItemClass = (itemName) => {
                    if (!timeline.isChecked) return 'bg-gray-800/60 border-amber-800/50';
                    const userIndex = timelineItems.findIndex(item => item.name === itemName);
                    if (userIndex < 0 || userIndex >= timeline.correctOrder.length) return 'bg-gray-800/60 border-amber-800/50';
                    
                    return timeline.correctOrder[userIndex] === itemName 
                        ? 'bg-green-600/50 border-green-500'
                        : 'bg-red-600/50 border-red-500';
                };
                
                return (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                        <button onClick={goBackToHub} className="flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-4 text-sm"><ArrowLeft size={16} /> Voltar ao Hub</button>
                        <h2 className="text-3xl mb-2 text-amber-300 font-title flex items-center gap-3"><Clock /> Linha do Tempo</h2>
                        <p className="text-stone-400 mb-4">Arraste os compositores para ordená-los do mais antigo para o mais recente (por ano de nascimento).</p>
                        
                        <div className="flex flex-col md:flex-row gap-4">
                            <button onClick={onGenerateTimeline} disabled={timeline.isLoading} className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-wait">
                                <Sparkles size={18} />
                                {timeline.isLoading ? 'Gerando...' : 'Gerar Novo Desafio'}
                            </button>
                            <button onClick={() => onCheckTimeline(timelineItems, setTimelineItems)} disabled={timeline.isLoading || timeline.isChecked || timeline.items.length === 0} className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600/20 text-blue-200 border border-blue-500 rounded-md hover:bg-blue-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                Verificar Ordem
                            </button>
                        </div>
                        
                        {timeline.isLoading && <LoadingSpinner />}

                        {timeline.items.length > 0 && !timeline.isLoading && (
                            <div className="mt-6">
                                <Reorder.Group axis="y" values={timelineItems} onReorder={setTimelineItems} className="space-y-3">
                                    {timelineItems.map(item => (
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
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                        <button onClick={goBackToHub} className="flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-4 text-sm"><ArrowLeft size={16} /> Voltar ao Hub</button>
                        <h2 className="text-3xl mb-4 text-amber-300 font-title">De Que Período?</h2>
                        
                        <p className="text-stone-400 mb-4">Leia a descrição e escolha o período musical correto.</p>

                        <button onClick={() => onGenerateFromWhichPeriod()} disabled={fromWhichPeriod.isLoading} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-wait mb-4">
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
                                            onClick={() => onFromWhichPeriodGuess(option)} 
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
                     <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                        <button onClick={goBackToHub} className="flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-4 text-sm"><ArrowLeft size={16} /> Voltar ao Hub</button>
                        <h2 className="text-3xl mb-4 text-amber-300 font-title flex items-center gap-3"><Crown /> Ranking dos Mestres</h2>
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
                if (!user) {
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
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                        <button onClick={goBackToHub} className="flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-4 text-sm"><ArrowLeft size={16} /> Voltar ao Hub</button>
                        <BattleMode user={user} socket={socket} period={period} onBack={goBackToHub} />
                    </motion.div>
                );
            default: return <ChallengeHub setActiveChallenge={setActiveChallenge} />;
        }
    }
    
    const renderContent = () => {
        if (activeTab === 'quiz') {
            return renderChallengeContent();
        }
        
        switch (activeTab) {
            case 'overview': {
                const middleIndex = Math.ceil((period.overviewImages || []).length / 2);
                const historicalImages = (period.overviewImages || []).slice(0, middleIndex);
                const musicalImages = (period.overviewImages || []).slice(middleIndex);
                return (
                    <div className="bg-black/20 backdrop-blur-sm p-6 md:p-8 rounded-lg border border-amber-900/50 shadow-lg max-w-7xl mx-auto">
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <h2 className="text-4xl text-amber-300 mb-2 font-serif text-shadow-gold text-center">{period.name}</h2>
                        </motion.div>
                        <p className="text-center text-stone-400 mb-8 font-title text-xl">{period.years}</p>
                        
                        <section className="mb-12">
                            <h3 className="text-3xl text-amber-200 font-serif text-shadow-gold mb-4">Contexto Histórico</h3>
                            <div className="grid md:grid-cols-3 gap-8 items-start">
                                <div className="md:col-span-2 text-stone-300 leading-relaxed text-lg text-justify">
                                    {(period.historicalContext || '').split('\n\n').map((paragraph, index) => (<p key={index} className="mb-4 last:mb-0">{paragraph}</p>))}
                                </div>
                                <div className="md:col-span-1 space-y-6">
                                    {historicalImages.map((image, index) => (
                                        <figure key={`hist-${index}`}>
                                            <img src={image.src} alt={image.caption || `Contexto Histórico ${index + 1}`} className="w-full h-auto object-cover rounded-md shadow-lg border-2 border-amber-900/50"/>
                                            {image.caption && (<figcaption className="text-xs text-stone-400 mt-2 text-center italic">{image.caption}</figcaption>)}
                                        </figure>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-3xl text-amber-200 font-serif text-shadow-gold mb-4">Características Musicais</h3>
                            <div className="grid md:grid-cols-3 gap-8 items-start">
                                <div className="md:col-span-1 space-y-6 md:order-2">
                                     {musicalImages.map((image, index) => (
                                        <figure key={`music-${index}`}>
                                            <img src={image.src} alt={image.caption || `Características Musicais ${index + 1}`} className="w-full h-auto object-cover rounded-md shadow-lg border-2 border-amber-900/50"/>
                                            {image.caption && (<figcaption className="text-xs text-stone-400 mt-2 text-center italic">{image.caption}</figcaption>)}
                                        </figure>
                                    ))}
                                </div>
                                <div className="md:col-span-2 text-stone-300 leading-relaxed text-lg text-justify md:order-1">
                                    {(period.description || '').split('\n\n').map((paragraph, index) => (<p key={index} className="mb-4 last:mb-0">{paragraph}</p>))}
                                </div>
                            </div>
                        </section>
                    </div>
                );
            }
            case 'composers': return renderGrid(period.composers, 'composer');
            case 'genres': return renderGrid(period.genresAndForms, 'genre');
            case 'styles': return renderGrid(period.stylesAndTechniques, 'style');
            case 'instruments': return renderGrid(period.instruments, 'instrument');
            case 'ensembles': return renderGrid(period.ensembles, 'ensemble');
            case 'works': return renderWorks(period.works);
            default: return null;
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
            <div className="flex-shrink-0 border-b-2 border-amber-900/50 p-4">
                <nav className="-mb-px flex justify-center flex-wrap gap-x-3 gap-y-2 sm:gap-x-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-2 px-4 rounded-md border-b-2 font-semibold text-sm transition-all duration-200 ${
                                activeTab === tab.id
                                    ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                                    : 'border-transparent text-stone-400 hover:text-amber-300 hover:bg-white/5'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <main className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${period.id}-${activeTab}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>
             <footer className="text-center p-2 bg-black/30 backdrop-blur-sm z-10 border-t-2 border-amber-900/50 flex-shrink-0">
                <p className="text-xs text-stone-400">Referência principal: "História da Música Ocidental" por D. J. Grout & C. V. Palisca.</p>
                <p className="text-xs text-stone-500">© 2025 Qtech Soluções Tecnológicas. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

export default MainContent;
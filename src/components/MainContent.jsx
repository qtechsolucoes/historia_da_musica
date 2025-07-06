import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { BrainCircuit, Sparkles, Crown, ArrowLeft, Clock, HelpCircle, ListChecks } from 'lucide-react';
import InfoCard from './InfoCard';
import WorkCard from './WorkCard';
import LoadingSpinner from './LoadingSpinner';

const ChallengeHub = ({ setActiveChallenge }) => (
    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-5xl mx-auto text-center">
        <h2 className="text-3xl mb-6 text-amber-300 font-title flex items-center justify-center gap-3"><BrainCircuit/> Hub de Desafios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <button onClick={() => setActiveChallenge('ranking')} className="p-6 bg-gray-800/50 rounded-lg border border-amber-800/50 hover:bg-amber-600/20 hover:border-amber-500 transition-all group flex flex-col items-center">
                <Crown size={32} className="mb-2 text-amber-400"/>
                <h3 className="text-xl font-bold text-amber-300 font-serif">Ranking</h3>
                <p className="text-stone-400 mt-2 text-sm">Veja os maiores mestres da história.</p>
            </button>
        </div>
    </motion.div>
);

const MainContent = ({ 
    period, 
    onCardClick, 
    activeChallenge, 
    setActiveChallenge,
    quiz, 
    onGenerateQuiz, 
    onQuizGuess,
    whoAmI,
    onGenerateWhoAmI,
    onWhoAmIGuess,
    timeline,
    onGenerateTimeline,
    onCheckTimeline,
    leaderboard
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [timelineItems, setTimelineItems] = useState(timeline.items);

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

    const getButtonClass = (option, answer, guessedOption, feedback) => {
        if (!feedback) return 'bg-gray-700 hover:bg-gray-600';
        const isCorrectAnswer = option.trim().toLowerCase() === answer.trim().toLowerCase();
        const isGuessedOption = option.trim().toLowerCase() === guessedOption?.trim().toLowerCase();
        if (isCorrectAnswer) return 'bg-green-600/70 border-green-500';
        if (isGuessedOption) return 'bg-red-600/70 border-red-500';
        return 'bg-gray-700 opacity-60';
    };

    const renderGrid = (items, type) => {
        if (!Array.isArray(items) || items.length === 0) {
            return <div className="text-stone-400 p-4 text-center">Conteúdo não disponível para esta seção.</div>;
        }
        return (
            <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {items.map((item, index) => (
                    <InfoCard 
                        key={`${type}-${item.name || item.title}-${index}`}
                        item={item} 
                        type={type} 
                        onCardClick={onCardClick}
                    />
                ))}
            </motion.div>
        );
    };

    const renderWorks = (items) => {
        if (!Array.isArray(items) || items.length === 0) {
            return <div className="text-stone-400 p-4 text-center">Conteúdo não disponível para esta seção.</div>;
        }
        const groupedWorks = items.reduce((acc, work) => {
            const category = work.category || 'Outras Obras';
            if (!acc[category]) acc[category] = [];
            acc[category].push(work);
            return acc;
        }, {});
        return (
            <div className="space-y-8 max-w-6xl mx-auto">
                {Object.entries(groupedWorks).map(([category, works]) => (
                    <motion.div key={category} layout>
                        <h3 className="text-2xl text-amber-200 font-serif text-shadow-gold mb-4 border-b-2 border-amber-900/50 pb-2">{category}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {works.map((work, index) => (
                                <WorkCard key={`${category}-${work.title}-${index}`} item={work} onCardClick={onCardClick} />
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        );
    };
    
    const renderChallengeContent = () => {
        const goBackToHub = () => setActiveChallenge(null);

        if (!activeChallenge) {
            return <ChallengeHub setActiveChallenge={setActiveChallenge} />;
        }
        
        switch (activeChallenge) {
            case 'quiz':
                return (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                        <button onClick={goBackToHub} className="flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-4 text-sm"><ArrowLeft size={16} /> Voltar ao Hub</button>
                        <h2 className="text-3xl mb-4 text-amber-300 font-title">Múltipla Escolha</h2>
                        <button onClick={onGenerateQuiz} disabled={quiz.isLoading} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-wait mb-4">
                            <Sparkles size={18} />
                            {quiz.isLoading ? 'Criando...' : 'Gerar Nova Pergunta'}
                        </button>
                        {quiz.isLoading && <LoadingSpinner />}
                        {quiz.question && !quiz.isLoading && (
                            <div className="mt-4 p-4 bg-black/30 rounded-md border border-amber-900/50">
                                <p className="text-stone-300 text-lg font-semibold mb-4 text-justify">{quiz.question}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {quiz.options.map((option, index) => <button key={index} onClick={() => onQuizGuess(option)} disabled={!!quiz.feedback} className={`px-3 py-2 text-stone-200 rounded-md text-left transition-all duration-300 border ${getButtonClass(option, quiz.answer, quiz.guessedOption, quiz.feedback)} disabled:cursor-not-allowed`}>{option}</button>)}
                                </div>
                                {quiz.feedback && <p className="mt-4 font-bold text-lg text-amber-300 text-justify">{quiz.feedback}</p>}
                            </div>
                        )}
                    </motion.div>
                );

            case 'whoami':
                 return (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                        <button onClick={goBackToHub} className="flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-4 text-sm"><ArrowLeft size={16} /> Voltar ao Hub</button>
                        <h2 className="text-3xl mb-4 text-amber-300 font-title">Quem Sou Eu?</h2>
                        <button onClick={onGenerateWhoAmI} disabled={whoAmI.isLoading} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-wait mb-4">
                            <Sparkles size={18} />
                            {whoAmI.isLoading ? 'Criando...' : 'Gerar Novo Desafio'}
                        </button>
                         {whoAmI.isLoading && <LoadingSpinner />}
                         {whoAmI.description && !whoAmI.isLoading && (
                            <div className="mt-4 p-4 bg-black/30 rounded-md border border-amber-900/50">
                                <p className="text-stone-300 text-lg italic font-semibold mb-4 text-center">"{whoAmI.description}"</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {whoAmI.options.map((option, index) => <button key={index} onClick={() => onWhoAmIGuess(option)} disabled={!!whoAmI.feedback} className={`px-3 py-2 text-stone-200 rounded-md text-left transition-all duration-300 border ${getButtonClass(option, whoAmI.answer, whoAmI.guessedOption, whoAmI.feedback)} disabled:cursor-not-allowed`}>{option}</button>)}
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
                        ? 'bg-green-600/50 border-green-500' // Certo
                        : 'bg-red-600/50 border-red-500'; // Errado
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
                            <button onClick={() => onCheckTimeline(timelineItems)} disabled={timeline.isLoading || timeline.isChecked || timeline.items.length === 0} className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600/20 text-blue-200 border border-blue-500 rounded-md hover:bg-blue-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
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
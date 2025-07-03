import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, Swords, ChevronLeft, ChevronRight } from 'lucide-react';
import InfoCard from './InfoCard';
import WorkCard from './WorkCard';
import LoadingSpinner from './LoadingSpinner';

const MainContent = ({ period, onCardClick, quiz, onGenerateQuiz, onQuizGuess, duel, onGenerateDuel, onDuelChange }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        setActiveTab('overview');
        setCurrentSlide(0);
    }, [period]);


    const tabs = [
        { id: 'overview', label: 'Visão Geral' },
        { id: 'composers', label: 'Compositores' },
        { id: 'genres', label: 'Gêneros' },
        { id: 'styles', label: 'Estilos' },
        { id: 'instruments', label: 'Instrumentos' },
        { id: 'ensembles', label: 'Conjuntos' },
        { id: 'works', label: 'Obras' },
        { id: 'quiz', label: 'Desafio' },
        { id: 'duel', label: 'Duelo de Titãs' },
    ];
    
    const renderGrid = (items, type) => {
        if (!Array.isArray(items) || items.length === 0) {
            return <div className="text-stone-400 p-4 text-center">Conteúdo não disponível para esta seção.</div>;
        }
        return (
            <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {items.map((item, index) => (
                    <InfoCard 
                        key={`${type}-${item.name}-${index}`}
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
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(work);
            return acc;
        }, {});

        return (
            <div className="space-y-8 max-w-5xl mx-auto">
                {Object.entries(groupedWorks).map(([category, works]) => (
                    <motion.div key={category} layout>
                        <h3 className="text-2xl text-amber-200 font-serif mb-4 border-b-2 border-amber-900/50 pb-2">{category}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {works.map((work, index) => (
                                <WorkCard key={`${category}-${work.title}-${index}`} item={work} onCardClick={onCardClick} />
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': {
                const slides = [
                    {
                        title: 'Contexto Histórico',
                        text: period.historicalContext,
                        image: period.overviewImages[0],
                    },
                    {
                        title: 'Descrição Musical',
                        text: period.description,
                        image: period.overviewImages[1],
                    }
                ];
                
                const paginate = (newDirection) => {
                    setDirection(newDirection);
                    if (newDirection > 0) {
                        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
                    } else {
                        setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
                    }
                }
                
                const slideVariants = {
                    enter: (direction) => ({
                      x: direction > 0 ? 50 : -50,
                      opacity: 0,
                    }),
                    center: {
                      zIndex: 1,
                      x: 0,
                      opacity: 1,
                      transition: { duration: 0.4, ease: [0.645, 0.045, 0.355, 1.000] }
                    },
                    exit: (direction) => ({
                      zIndex: 0,
                      x: direction < 0 ? 50 : -50,
                      opacity: 0,
                      transition: { duration: 0.2, ease: 'easeIn' }
                    }),
                };

                const safeCurrentSlide = Math.max(0, Math.min(slides.length - 1, currentSlide));
                const slide = slides[safeCurrentSlide];

                return (
                    <div className="flex flex-col items-center">
                        <h2 className="text-4xl text-amber-300 mb-4 font-title">{period.name}</h2>
                        
                        <div className="flex items-center justify-center w-full max-w-6xl">
                            <button 
                                onClick={() => paginate(-1)} 
                                className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-black/20 text-amber-300 hover:bg-black/40 transition-colors mx-4 flex-shrink-0"
                            >
                                <ChevronLeft size={32} />
                            </button>

                            <motion.section 
                                className="relative bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-amber-900/50 shadow-lg w-full overflow-hidden"
                                style={{ minHeight: '400px' }}
                            >
                                <AnimatePresence initial={false} custom={direction}>
                                    <motion.div
                                        key={safeCurrentSlide}
                                        variants={slideVariants}
                                        custom={direction}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="absolute w-full h-full top-0 left-0 p-6"
                                    >
                                        <div className="grid md:grid-cols-3 gap-8 items-center h-full">
                                            <div className="md:col-span-2">
                                                <h3 className="text-2xl text-amber-200 font-serif mb-2">{slide.title}</h3>
                                                <p className="text-stone-300 leading-relaxed font-serif text-justify">{slide.text}</p>
                                            </div>
                                            <div className="hidden md:block">
                                                <img src={slide.image} alt={slide.title} className="w-full h-auto object-cover rounded-md shadow-lg border-2 border-amber-900/50"/>
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </motion.section>

                            <button 
                                onClick={() => paginate(1)} 
                                className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-black/20 text-amber-300 hover:bg-black/40 transition-colors mx-4 flex-shrink-0"
                            >
                                <ChevronRight size={32} />
                            </button>
                        </div>

                        <div className="flex justify-center items-center mt-4 w-full">
                             <button onClick={() => paginate(-1)} className="p-2 rounded-full text-amber-300 md:hidden">
                                <ChevronLeft size={24} />
                            </button>
                            <div className="flex-1 text-center text-xs text-stone-400">
                                {safeCurrentSlide + 1} / {slides.length}
                            </div>
                            <button onClick={() => paginate(1)} className="p-2 rounded-full text-amber-300 md:hidden">
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>
                );
            }
            case 'composers': return renderGrid(period.composers, 'composer');
            case 'genres': return renderGrid(period.genresAndForms, 'genre');
            case 'styles': return renderGrid(period.stylesAndTechniques, 'style');
            case 'instruments': return renderGrid(period.instruments, 'instrument');
            case 'ensembles': return renderGrid(period.ensembles, 'ensemble');
            case 'works': return renderWorks(period.works);
            case 'quiz':
                return (
                    <motion.section initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                        <h2 className="text-3xl mb-4 text-amber-300 font-title flex items-center gap-3"><BrainCircuit/> Desafio dos Mestres</h2>
                        <p className="text-stone-300 mb-4 font-serif">Teste seus conhecimentos. Clique para gerar uma pergunta sobre um compositor deste período.</p>
                        <button onClick={onGenerateQuiz} disabled={quiz.isLoading || period.composers.length === 0} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-wait mb-4">
                            <Sparkles size={18} />
                            {quiz.isLoading ? 'Criando Pergunta...' : '✨ Gerar Pergunta com IA'}
                        </button>
                        {quiz.isLoading && <LoadingSpinner />}
                        {quiz.question && !quiz.isLoading && (
                            <div className="mt-4 p-4 bg-black/30 rounded-md border border-amber-900/50">
                                <p className="text-stone-300 text-lg font-semibold whitespace-pre-wrap mb-4">{quiz.question}</p>
                                {quiz.feedback ? (
                                    <p className="font-bold text-lg text-amber-300">{quiz.feedback}</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {quiz.options.map(option => (
                                            <button key={option} onClick={() => onQuizGuess(option)} className="px-3 py-2 bg-gray-700 text-stone-200 rounded-md hover:bg-gray-600 transition-colors text-left">
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.section>
                );
            case 'duel':
                return (
                    <motion.section initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                        <h2 className="text-3xl mb-4 text-amber-300 font-title flex items-center gap-3"><Swords/> Duelo de Titãs</h2>
                        <p className="text-stone-300 mb-4 font-serif">Selecione dois compositores para uma análise comparativa gerada por IA.</p>
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <select onChange={(e) => onDuelChange('composer1', e.target.value)} value={duel.composer1} className="flex-1 p-2 bg-gray-800 text-white border border-amber-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500">
                                <option value="">Selecione o primeiro compositor</option>
                                {period.composers.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                            <select onChange={(e) => onDuelChange('composer2', e.target.value)} value={duel.composer2} className="flex-1 p-2 bg-gray-800 text-white border border-amber-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500">
                                <option value="">Selecione o segundo compositor</option>
                                {period.composers.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <button onClick={onGenerateDuel} disabled={duel.isLoading || !duel.composer1 || !duel.composer2 || duel.composer1 === duel.composer2} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-wait mb-4">
                            <Sparkles size={18} />
                            {duel.isLoading ? 'Comparando...' : '⚔️ Comparar com IA'}
                        </button>
                        {duel.isLoading && <LoadingSpinner />}
                        {duel.result && !duel.isLoading && (
                            <div className="mt-4 p-4 bg-black/30 rounded-md border border-amber-900/50">
                                <p className="text-stone-300 whitespace-pre-wrap">{duel.result}</p>
                            </div>
                        )}
                    </motion.section>
                );
            default: return null;
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 border-b-2 border-amber-900/50 px-4 sm:px-6">
                <div className="overflow-x-auto -mb-px flex justify-center">
                    <nav className="flex space-x-4">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors duration-200 ${
                                    activeTab === tab.id
                                        ? 'border-amber-300 text-amber-300'
                                        : 'border-transparent text-stone-400 hover:text-amber-300 hover:border-amber-400'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
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
        </div>
    );
};

export default MainContent;
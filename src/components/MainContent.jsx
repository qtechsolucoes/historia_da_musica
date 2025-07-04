import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, Swords } from 'lucide-react';
import InfoCard from './InfoCard';
import WorkCard from './WorkCard';
import LoadingSpinner from './LoadingSpinner';

const MainContent = ({ period, onCardClick, quiz, onGenerateQuiz, onQuizGuess, duel, onGenerateDuel, onDuelChange }) => {
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        setActiveTab('overview');
    }, [period]);

    const tabs = [
        { id: 'overview', label: 'Visão Geral' },
        { id: 'composers', label: 'Compositores' },
        { id: 'genres', label: 'Formas/Gêneros' },
        { id: 'styles', label: 'Técnicas/Estilos' },
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
                const middleIndex = Math.ceil((period.overviewImages || []).length / 2);
                const historicalImages = (period.overviewImages || []).slice(0, middleIndex);
                const musicalImages = (period.overviewImages || []).slice(middleIndex);

                return (
                    <div className="bg-black/20 backdrop-blur-sm p-6 md:p-8 rounded-lg border border-amber-900/50 shadow-lg max-w-7xl mx-auto">
                        <h2 className="text-4xl text-amber-300 mb-6 font-title text-center">{period.name}</h2>
                        
                        <section className="mb-12">
                            <h3 className="text-3xl text-amber-200 font-serif mb-4">Contexto Histórico</h3>
                            <div className="grid md:grid-cols-3 gap-8 items-start">
                                <div className="md:col-span-2">
                                    <p className="text-stone-300 leading-relaxed font-serif text-lg text-justify whitespace-pre-wrap">{period.historicalContext}</p>
                                </div>
                                <div className="md:col-span-1 space-y-6">
                                    {historicalImages.map((image, index) => (
                                        <figure key={`hist-${index}`}>
                                            <img src={image.src} alt={image.caption || `Contexto Histórico ${index + 1}`} className="w-full h-auto object-cover rounded-md shadow-lg border-2 border-amber-900/50"/>
                                            {image.caption && (
                                                <figcaption className="text-xs text-stone-400 mt-2 text-center italic">{image.caption}</figcaption>
                                            )}
                                        </figure>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-3xl text-amber-200 font-serif mb-4">Características Musicais</h3>
                            <div className="grid md:grid-cols-3 gap-8 items-start">
                                <div className="md:col-span-2">
                                    <p className="text-stone-300 leading-relaxed font-serif text-lg text-justify whitespace-pre-wrap">{period.description}</p>
                                </div>
                                <div className="md:col-span-1 space-y-6">
                                    {musicalImages.map((image, index) => (
                                        <figure key={`music-${index}`}>
                                            <img src={image.src} alt={image.caption || `Características Musicais ${index + 1}`} className="w-full h-auto object-cover rounded-md shadow-lg border-2 border-amber-900/50"/>
                                            {image.caption && (
                                                <figcaption className="text-xs text-stone-400 mt-2 text-center italic">{image.caption}</figcaption>
                                            )}
                                        </figure>
                                    ))}
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
            case 'quiz':
                return (
                    <motion.section initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-amber-900/50 shadow-lg max-w-4xl mx-auto">
                        <h2 className="text-3xl mb-4 text-amber-300 font-title flex items-center gap-3"><BrainCircuit/> Desafio dos Mestres</h2>
                        <p className="text-stone-300 mb-4 font-serif text-justify whitespace-pre-wrap">Teste seus conhecimentos. Clique para gerar uma pergunta sobre um compositor deste período.</p>
                        <button onClick={onGenerateQuiz} disabled={quiz.isLoading || !period.composers || period.composers.length === 0} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-wait mb-4">
                            <Sparkles size={18} />
                            {quiz.isLoading ? 'Criando Pergunta...' : '✨ Gerar Pergunta com IA'}
                        </button>
                        {quiz.isLoading && <LoadingSpinner />}
                        {quiz.question && !quiz.isLoading && (
                            <div className="mt-4 p-4 bg-black/30 rounded-md border border-amber-900/50">
                                <p className="text-stone-300 text-lg font-semibold whitespace-pre-wrap mb-4 text-justify">{quiz.question}</p>
                                {quiz.feedback ? (
                                    <p className="font-bold text-lg text-amber-300 text-justify whitespace-pre-wrap">{quiz.feedback}</p>
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
                        <p className="text-stone-300 mb-4 font-serif text-justify whitespace-pre-wrap">Selecione dois compositores para uma análise comparativa gerada por IA.</p>
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <select onChange={(e) => onDuelChange('composer1', e.target.value)} value={duel.composer1} className="flex-1 p-2 bg-gray-800 text-white border border-amber-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500">
                                <option value="">Selecione o primeiro compositor</option>
                                {period.composers && period.composers.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                            <select onChange={(e) => onDuelChange('composer2', e.target.value)} value={duel.composer2} className="flex-1 p-2 bg-gray-800 text-white border border-amber-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500">
                                <option value="">Selecione o segundo compositor</option>
                                {period.composers && period.composers.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <button onClick={onGenerateDuel} disabled={duel.isLoading || !duel.composer1 || !duel.composer2 || duel.composer1 === duel.composer2} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-wait mb-4">
                            <Sparkles size={18} />
                            {duel.isLoading ? 'Comparando...' : '⚔️ Comparar com IA'}
                        </button>
                        {duel.isLoading && <LoadingSpinner />}
                        {duel.result && !duel.isLoading && (
                            <div className="mt-4 p-4 bg-black/30 rounded-md border border-amber-900/50">
                                <p className="text-stone-300 whitespace-pre-wrap text-justify">{duel.result}</p>
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
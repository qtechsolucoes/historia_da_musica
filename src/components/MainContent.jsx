// src/components/MainContent.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useMusicAppStore } from '../store/musicAppStore';
import { musicHistoryData } from '../data/index.js';

import LoadingSpinner from './LoadingSpinner';
import OverviewTab from './tabs/OverviewTab';
import GridTab from './tabs/GridTab';
import WorksTab from './tabs/WorksTab';
import ChallengesTab from './tabs/ChallengesTab';

const MainContent = ({ socket, sounds }) => {
    const selectedPeriodId = useMusicAppStore((state) => state.selectedPeriodId);
    const period = musicHistoryData.find(p => p.id === selectedPeriodId);
    
    // O estado da aba ativa agora é local, o que é mais limpo.
    const [activeTab, setActiveTab] = useState('overview');

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

    const renderContent = () => {
        if (!period) return <LoadingSpinner />;
        
        switch (activeTab) {
            case 'overview':
                return <OverviewTab period={period} />;
            case 'composers':
                return <GridTab items={period.composers} type="composer" />;
            case 'genres':
                return <GridTab items={period.genresAndForms} type="genre" />;
            case 'styles':
                return <GridTab items={period.stylesAndTechniques} type="style" />;
            case 'instruments':
                return <GridTab items={period.instruments} type="instrument" />;
            case 'ensembles':
                return <GridTab items={period.ensembles} type="ensemble" />;
            case 'works':
                return <WorksTab items={period.works} />;
            case 'quiz':
                return <ChallengesTab socket={socket} sounds={sounds} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
            <div className="flex-shrink-0 border-b-2 border-amber-900/50 p-2 md:p-4 overflow-hidden">
                <nav className="flex justify-start md:justify-center overflow-x-auto scrollbar-thin">
                    <div className="flex flex-nowrap gap-x-2 sm:gap-x-4">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-shrink-0 py-2 px-3 md:px-4 rounded-md border-b-2 font-semibold text-xs sm:text-sm transition-all duration-200 ${
                                    activeTab === tab.id
                                        ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                                        : 'border-transparent text-stone-400 hover:text-amber-300 hover:bg-white/5'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </nav>
            </div>

            <main className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${period?.id}-${activeTab}`}
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
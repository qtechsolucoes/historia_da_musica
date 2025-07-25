// src/components/tabs/WorksTab.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WorkCard from '../WorkCard';
import { useMusicAppStore } from '../../store/musicAppStore';

const WorksTab = ({ items }) => {
    const handleOpenModal = useMusicAppStore((state) => state.handleOpenModal);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');

    useEffect(() => {
        setSearchTerm('');
        setSortBy('name');
    }, [items]);

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
        const category = work.category || 'Obras Principais';
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
                        <h3 className="text-xl md:text-2xl text-amber-200 font-serif text-shadow-gold mb-4 border-b-2 border-amber-900/50 pb-2">{category}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {works.map((work, index) => (
                                <WorkCard key={`${category}-${work.title}-${index}`} item={work} onCardClick={handleOpenModal} />
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

export default WorksTab;
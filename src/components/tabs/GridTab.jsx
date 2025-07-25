// src/components/tabs/GridTab.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InfoCard from '../InfoCard';
import { useMusicAppStore } from '../../store/musicAppStore';

const GridTab = ({ items, type }) => {
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
                <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
                    <AnimatePresence>
                        {sortedItems.map((item) => (
                            <InfoCard 
                                key={`${type}-${item.name || item.title}`}
                                item={item} 
                                type={type} 
                                onCardClick={handleOpenModal}
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

export default GridTab;
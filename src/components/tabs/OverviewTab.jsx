// src/components/tabs/OverviewTab.jsx

import React from 'react';
import { motion } from 'framer-motion';

const OverviewTab = ({ period }) => {
    if (!period) return null;

    const middleIndex = Math.ceil((period.overviewImages || []).length / 2);
    const historicalImages = (period.overviewImages || []).slice(0, middleIndex);
    const musicalImages = (period.overviewImages || []).slice(middleIndex);

    return (
        <div className="bg-black/20 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-lg border border-amber-900/50 shadow-lg max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h2 className="text-3xl md:text-4xl text-amber-300 mb-2 font-serif text-shadow-gold text-center">{period.name}</h2>
            </motion.div>
            <p className="text-center text-stone-400 mb-8 font-title text-lg md:text-xl">{period.years}</p>
            
            <section className="mb-12">
                <h3 className="text-2xl md:text-3xl text-amber-200 font-serif text-shadow-gold mb-4">Contexto Histórico</h3>
                <div className="grid md:grid-cols-3 gap-8 items-start">
                    <div className="md:col-span-2 text-stone-300 leading-relaxed text-base md:text-lg text-justify">
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
                <h3 className="text-2xl md:text-3xl text-amber-200 font-serif text-shadow-gold mb-4">Características Musicais</h3>
                <div className="grid md:grid-cols-3 gap-8 items-start">
                    <div className="md:col-span-1 space-y-6 md:order-2">
                         {musicalImages.map((image, index) => (
                            <figure key={`music-${index}`}>
                                <img src={image.src} alt={image.caption || `Características Musicais ${index + 1}`} className="w-full h-auto object-cover rounded-md shadow-lg border-2 border-amber-900/50"/>
                                {image.caption && (<figcaption className="text-xs text-stone-400 mt-2 text-center italic">{image.caption}</figcaption>)}
                            </figure>
                        ))}
                    </div>
                    <div className="md:col-span-2 text-stone-300 leading-relaxed text-base md:text-lg text-justify md:order-1">
                        {/* AQUI ESTAVA O ERRO. 'p' foi substituído por 'paragraph' */}
                        {(period.description || '').split('\n\n').map((paragraph, index) => (<p key={index} className="mb-4 last:mb-0">{paragraph}</p>))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default OverviewTab;
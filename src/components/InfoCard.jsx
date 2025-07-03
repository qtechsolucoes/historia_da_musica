import React from 'react';
import { motion } from 'framer-motion';

const InfoCard = ({ item, type, onCardClick }) => {
    let title, subtitle;
    switch(type) {
        case 'composer': title = item.name; subtitle = item.lifespan; break;
        case 'instrument': title = item.name; subtitle = 'Instrumento Histórico'; break;
        case 'work': title = item.title; subtitle = `Por ${item.composer}`; break;
        case 'genre': title = item.name; subtitle = 'Forma / Gênero'; break;
        case 'style': title = item.name; subtitle = 'Estilo / Técnica'; break;
        case 'ensemble': title = item.name; subtitle = 'Conjunto / Prática'; break;
        default: title = "N/A"; subtitle = "N/A";
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-md shadow-lg border border-amber-900/50 cursor-pointer group overflow-hidden"
            onClick={() => onCardClick(type, item)}
        >
            <div className="aspect-square w-full bg-black/20 flex items-center justify-center overflow-hidden rounded-t-md">
                 <img src={item.image} alt={`[Imagem de ${title}]`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/200x200/111827/5a3a22?text=Imagem+Indisponível'; }}/>
            </div>
            <div className="p-3">
                <h3 className="font-bold text-amber-300 text-base font-serif truncate">{title}</h3>
                <p className="text-xs text-stone-400 truncate">{subtitle}</p>
            </div>
        </motion.div>
    );
};

export default InfoCard;
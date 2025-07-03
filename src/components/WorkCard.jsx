import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';

const WorkCard = ({ item, onCardClick }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between p-3 bg-gray-900/50 backdrop-blur-sm rounded-md shadow-lg border border-amber-900/50 cursor-pointer group hover:bg-gray-800/70"
            onClick={() => onCardClick('work', item)}
        >
            <div>
                <h3 className="font-bold text-amber-300 text-base font-serif">{item.title}</h3>
                <p className="text-xs text-stone-400">{item.composer}</p>
            </div>
            <PlayCircle className="text-amber-400 group-hover:text-white transition-colors"/>
        </motion.div>
    );
};

export default WorkCard;
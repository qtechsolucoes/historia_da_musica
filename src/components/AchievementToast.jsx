import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

const AchievementToast = ({ achievement, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 5000); // A notificação some após 5 segundos
        return () => clearTimeout(timer);
    }, [onDismiss]);

    if (!achievement) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.3 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                className="fixed bottom-5 right-5 bg-gray-800 border-2 border-amber-400 text-white p-4 rounded-lg shadow-2xl flex items-center gap-4 z-50"
            >
                <Star className="text-amber-400 h-10 w-10" fill="currentColor" />
                <div>
                    <h3 className="font-bold text-amber-300">Conquista Desbloqueada!</h3>
                    <p className="text-stone-200">{achievement.name}</p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AchievementToast;
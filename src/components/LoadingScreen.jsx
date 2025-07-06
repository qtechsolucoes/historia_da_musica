import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
    return (
        <motion.div
            className="relative h-screen w-screen flex flex-col items-center justify-center bg-transparent overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
        >
            
            <motion.h1
                className="text-4xl lg:text-6xl font-title gold-text-effect text-shadow-gold z-10"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            >
                Codex Historiæ Musicæ
            </motion.h1>

            <motion.p
                className="mt-4 text-xl lg:text-3xl font-title gold-text-effect text-shadow-gold z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1.5 }}
            >
                Uma Jornada Pela História da Música
            </motion.p>
        </motion.div>
    );
};

export default LoadingScreen;
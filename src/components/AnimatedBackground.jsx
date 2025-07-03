import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-[-1] pointer-events-none">
        {[...Array(20)].map((_, i) => {
            const duration = Math.random() * 20 + 15;
            const delay = Math.random() * -20;
            const size = Math.random() * 20 + 10;
            const left = Math.random() * 100;
            const opacity = Math.random() * 0.1 + 0.05;
            const note = ['♪', '♫', '♩', '♬'][Math.floor(Math.random() * 4)];

            return (
                <motion.div
                    key={`note-${i}`}
                    className="absolute text-amber-300"
                    style={{
                        left: `${left}vw`,
                        fontSize: `${size}px`,
                        opacity: opacity,
                    }}
                    initial={{ top: '110%' }}
                    animate={{ top: '-10%' }}
                    transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
                >
                    {note}
                </motion.div>
            );
        })}
    </div>
);

export default AnimatedBackground;
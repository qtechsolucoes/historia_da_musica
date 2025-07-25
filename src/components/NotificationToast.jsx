// src/components/NotificationToast.jsx

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Info, CheckCircle, X } from 'lucide-react';
import { useMusicAppStore } from '../store/musicAppStore';

const NotificationToast = () => {
    // <-- INÍCIO DA MUDANÇA: Selecionar estado e ações separadamente para evitar loops
    const notification = useMusicAppStore((state) => state.notification);
    const hideNotification = useMusicAppStore((state) => state.hideNotification);
    // <-- FIM DA MUDANÇA

    useEffect(() => {
        if (!notification.isVisible) {
            return;
        }

        const timerId = setTimeout(() => {
            hideNotification();
        }, 5000);

        return () => {
            clearTimeout(timerId);
        };
    }, [notification.isVisible, hideNotification]);

    const icons = {
        error: <XCircle className="text-red-400 h-8 w-8 flex-shrink-0" />,
        success: <CheckCircle className="text-green-400 h-8 w-8 flex-shrink-0" />,
        info: <Info className="text-blue-400 h-8 w-8 flex-shrink-0" />,
    };

    const borderColors = {
        error: 'border-red-500',
        success: 'border-green-500',
        info: 'border-blue-500',
    };

    return (
        <AnimatePresence>
            {notification.isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8, transition: { duration: 0.2 } }}
                    className={`fixed top-5 right-5 bg-gray-800 border-2 ${borderColors[notification.type]} text-white p-4 rounded-lg shadow-2xl flex items-center gap-4 z-[100] max-w-sm`}
                >
                    {icons[notification.type]}
                    <div className="flex-grow">
                        <h3 className="font-bold text-stone-100">Notificação</h3>
                        <p className="text-stone-300 text-sm">{notification.message}</p>
                    </div>
                    <button onClick={hideNotification} className="p-1 text-gray-400 hover:text-white flex-shrink-0 self-start">
                        <X size={18} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationToast;
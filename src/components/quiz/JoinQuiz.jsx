import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const JoinKahoot = ({ socket }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Extrai o código da URL, se existir
    const urlParams = new URLSearchParams(location.search);
    const initialCode = urlParams.get('code') || '';

    const [accessCode, setAccessCode] = useState(initialCode);
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Limpa ouvintes de eventos anteriores ao montar o componente
        socket.off('kahoot:game_data');
        socket.off('error');
    }, [socket]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!accessCode || !nickname) {
            setError('Por favor, preencha o código de acesso e um apelido.');
            return;
        }
        setIsLoading(true);
        setError('');

        socket.emit('kahoot:player_join', { accessCode, nickname }, (response) => {
            setIsLoading(false);
            if (response.error) {
                setError(response.error);
            } else {
                // Navega para a tela do jogador com os dados do jogo
                navigate(`/kahoot/play/${accessCode}`, { state: { player: response.player, game: response.game } });
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-800 text-white flex items-center justify-center p-4" style={{
            backgroundImage: `radial-gradient(circle at center, rgba(38, 70, 83, 0.2), transparent 60%)`
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-black/50 backdrop-blur-sm p-8 rounded-2xl border border-blue-800/50 shadow-2xl"
            >
                <div className="text-center mb-8">
                    <Gamepad2 className="mx-auto text-blue-400 mb-3" size={48} />
                    <h1 className="text-4xl font-title text-blue-300">Entrar no Jogo</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="accessCode" className="block text-blue-200 font-semibold mb-2">Código de Acesso</label>
                        <input
                            type="text"
                            id="accessCode"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                            className="w-full p-3 bg-gray-700 border border-blue-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest font-bold"
                            placeholder="ABC123"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="nickname" className="block text-blue-200 font-semibold mb-2">Apelido</label>
                        <input
                            type="text"
                            id="nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full p-3 bg-gray-700 border border-blue-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Seu nome no jogo"
                            required
                        />
                    </div>

                    {error && <p className="text-red-400 text-center bg-red-900/50 p-2 rounded-md">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 mt-8 p-4 bg-blue-600 text-white font-bold text-lg rounded-lg hover:bg-blue-500 transition-all duration-300 disabled:bg-gray-500 disabled:cursor-wait"
                    >
                        {isLoading ? <LoadingSpinner /> : <>Entrar <ChevronRight /></>}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default JoinKahoot;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Play, Copy, X } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const QuizLobby = ({ socket }) => {
    const { accessCode } = useParams();
    const navigate = useNavigate();
    const [game, setGame] = useState(null);
    const [players, setPlayers] = useState([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        socket.emit('kahoot:host_join', { accessCode });

        const handleGameData = (data) => {
            setGame(data);
            setPlayers(data.players || []);
        };

        const handlePlayerUpdate = (updatedPlayers) => {
            setPlayers(updatedPlayers);
        };

        const handleGameStarted = () => {
            navigate(`/quiz/host/${accessCode}`);
        };

        const handleGameCanceled = ({ message }) => {
            alert(message || 'O jogo foi cancelado.');
            navigate('/quiz/create');
        };

        socket.on('kahoot:game_data', handleGameData);
        socket.on('kahoot:player_list_update', handlePlayerUpdate);
        socket.on('kahoot:game_started', handleGameStarted);
        socket.on('kahoot:game_canceled', handleGameCanceled);

        return () => {
            socket.off('kahoot:game_data', handleGameData);
            socket.off('kahoot:player_list_update', handlePlayerUpdate);
            socket.off('kahoot:game_started', handleGameStarted);
            socket.off('kahoot:game_canceled', handleGameCanceled);
        };
    }, [accessCode, socket, navigate]);

    const handleStartGame = () => {
        const connectedPlayers = players.filter(p => p.connected);
        if (connectedPlayers.length > 0) {
            socket.emit('kahoot:start_game', { accessCode });
        } else {
            alert("Não há jogadores conectados para iniciar o jogo.");
        }
    };

    const handleCancelGame = () => {
        if (window.confirm("Tem a certeza de que deseja cancelar este jogo? Todos os jogadores serão desconectados.")) {
            socket.emit('kahoot:cancel_game', { accessCode });
            navigate('/quiz/create');
        }
    };

    const handleCopy = () => {
        const joinUrl = `${window.location.origin}/historia_da_musica/quiz/join?code=${accessCode}`;
        navigator.clipboard.writeText(joinUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const joinUrl = `${window.location.origin}/historia_da_musica/quiz/join?code=${accessCode}`;

    if (!game) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><LoadingSpinner /></div>;

    const connectedPlayerCount = players.filter(p => p.connected).length;

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8">
                <h1 className="text-3xl font-title text-amber-300">{game.quiz?.title || "Lobby do Jogo"}</h1>
                <p className="text-stone-400">Aguardando jogadores...</p>
            </motion.div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="md:col-span-1 bg-black/40 p-6 rounded-2xl border border-amber-900/50 flex flex-col items-center justify-center gap-4"
                >
                    <div className="text-center">
                        <p className="text-stone-300 mb-2">Código de Acesso:</p>
                        <div className="text-6xl font-bold tracking-widest text-white bg-gray-800 px-6 py-4 rounded-lg">
                            {accessCode}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-4 border-amber-400">
                        <QRCodeSVG value={joinUrl} size={160} bgColor="#ffffff" fgColor="#000000" />
                    </div>
                    <button onClick={handleCopy} className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2">
                        <Copy size={20} /> {copied ? 'Copiado!' : 'Copiar Link'}
                    </button>
                </motion.div>

                <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="md:col-span-2 bg-black/40 p-6 rounded-2xl border border-amber-900/50 flex flex-col"
                >
                    <h2 className="text-2xl font-bold text-amber-200 mb-4 flex items-center gap-2"><Users /> Jogadores ({connectedPlayerCount})</h2>
                    <div className="flex-grow bg-gray-800/50 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto scrollbar-thin">
                        <AnimatePresence>
                            {players.length === 0 && <p className="text-center text-stone-400 mt-16">Nenhum jogador ainda...</p>}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {players.filter(p => p && p._id).map(player => (
                                <motion.div
                                    key={player._id}
                                    layout
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    className={`p-2 rounded-md font-semibold transition-all flex flex-col items-center justify-center gap-2 ${
                                        player.connected ? 'bg-gray-700' : 'bg-red-900/50 text-stone-400 opacity-60'
                                    }`}
                                    title={!player.connected ? `${player.nickname} (desconectado)` : player.nickname}
                                >
                                    {player.picture ? (
                                        <img src={player.picture} alt={player.nickname} className="w-12 h-12 rounded-full border-2 border-amber-500"/>
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-xl">?</div>
                                    )}
                                    <span className="truncate w-full text-center text-sm">{player.nickname}</span>
                                </motion.div>
                            ))}
                            </div>
                        </AnimatePresence>
                    </div>
                    <button
                        onClick={handleStartGame}
                        disabled={connectedPlayerCount === 0}
                        className="w-full mt-6 flex items-center justify-center gap-3 p-4 bg-green-600 text-white font-bold text-lg rounded-lg hover:bg-green-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <Play /> Iniciar Jogo
                    </button>
                    <button
                        onClick={handleCancelGame}
                        className="w-full mt-3 flex items-center justify-center gap-2 p-2 bg-red-800/60 text-red-200 text-sm rounded-lg hover:bg-red-700/60 transition-colors"
                    >
                        <X size={16} /> Cancelar e Voltar
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default QuizLobby;
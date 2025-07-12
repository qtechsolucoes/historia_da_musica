const Game = require('../models/Game');

const activeGames = {};

function initializeKahootManager(io) {
    io.on('connection', (socket) => {

        socket.on('kahoot:host_join', async ({ accessCode }) => {
            try {
                const game = await Game.findOne({ accessCode }).populate({
                    path: 'quiz',
                    populate: { path: 'questions' }
                });

                if (game) {
                    socket.join(accessCode);
                    game.hostSocketId = socket.id;
                    await game.save();
                    activeGames[accessCode] = { questionTimer: null, playerAnswers: new Map() };
                    socket.emit('kahoot:game_data', game);
                } else {
                    socket.emit('error', { message: 'Jogo não encontrado.' });
                }
            } catch (error) {
                socket.emit('error', { message: 'Ocorreu um erro interno no servidor.' });
            }
        });

        // --- LÓGICA DE ENTRADA DO JOGADOR CORRIGIDA ---
        socket.on('kahoot:player_join', async ({ accessCode, nickname }, callback) => {
            try {
                const game = await Game.findOne({ accessCode });
                if (!game || game.status !== 'lobby') {
                    return callback({ error: 'Jogo não encontrado ou já iniciado.' });
                }

                socket.join(accessCode);
                const newPlayer = { socketId: socket.id, nickname, score: 0 };
                game.players.push(newPlayer);
                await game.save();

                // Notifica a todos sobre o novo jogador
                io.to(accessCode).emit('kahoot:player_list_update', game.players);

                // Apenas confirma que a entrada foi bem-sucedida
                callback({ success: true, player: newPlayer });
                
            } catch (error) {
                 callback({ error: 'Ocorreu um erro ao entrar no jogo.' });
            }
        });
        
        socket.on('kahoot:start_game', async ({ accessCode }) => {
            const game = await Game.findOneAndUpdate({ accessCode, hostSocketId: socket.id }, { status: 'in_progress' }, { new: true });
            if (game) {
                // Ao iniciar o jogo, envia o primeiro evento de pergunta para TODOS na sala
                io.to(accessCode).emit('kahoot:game_started');
                startNextQuestion(io, accessCode);
            }
        });
        
        // ... O resto do ficheiro permanece igual ...
        socket.on('kahoot:cancel_game', async ({ accessCode }) => {
            const game = await Game.findOne({ accessCode, hostSocketId: socket.id });
            if (game) {
                io.to(accessCode).emit('kahoot:game_canceled', { message: 'O anfitrião cancelou o jogo.' });
                delete activeGames[accessCode];
                await Game.deleteOne({ accessCode });
            }
        });

        socket.on('kahoot:next_question', ({ accessCode }) => {
            if (activeGames[accessCode]) startNextQuestion(io, accessCode);
        });

        socket.on('kahoot:player_answer', ({ accessCode, answerIndex, timeRemaining }) => {
            const gameSession = activeGames[accessCode];
            if (gameSession && !gameSession.playerAnswers.has(socket.id)) {
                gameSession.playerAnswers.set(socket.id, { answerIndex, timeRemaining });
                io.to(accessCode).emit('kahoot:answer_update', { count: gameSession.playerAnswers.size });
            }
        });

        socket.on('disconnect', async () => { 
            for (const accessCode in activeGames) {
                const game = await Game.findOne({ accessCode });
                if (game) {
                    const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
                    if (playerIndex !== -1) {
                        game.players.splice(playerIndex, 1);
                        await game.save();
                        io.to(accessCode).emit('kahoot:player_list_update', game.players);
                        break;
                    }
                    if (game.hostSocketId === socket.id) {
                        io.to(accessCode).emit('kahoot:game_canceled', { message: 'O anfitrião desconectou-se.'});
                        delete activeGames[accessCode];
                        await Game.deleteOne({ accessCode });
                    }
                }
            }
        });
    });
}

function calculateScore(timeRemaining) {
    if (timeRemaining > 12) return 1000;
    if (timeRemaining > 9) return 800;
    if (timeRemaining > 5) return 600;
    if (timeRemaining > 2) return 400;
    return 200;
}

async function startNextQuestion(io, accessCode) {
    const game = await Game.findOne({ accessCode }).populate({
        path: 'quiz',
        populate: { path: 'questions' }
    });
    const gameSession = activeGames[accessCode];

    if (!game || !gameSession || game.status !== 'in_progress') return;

    gameSession.playerAnswers.clear();
    const nextIndex = game.currentQuestionIndex + 1;

    if (nextIndex >= game.quiz.questions.length) {
        game.status = 'finished';
        await game.save();
        io.to(accessCode).emit('kahoot:game_over', { players: game.players.sort((a, b) => b.score - a.score) });
        delete activeGames[accessCode];
        return;
    }

    game.currentQuestionIndex = nextIndex;
    await game.save();

    const question = game.quiz.questions[nextIndex];
    if (!question || !question.options) {
        return;
    }

    const questionData = {
        index: nextIndex,
        text: question.text,
        options: question.options,
        time: 15
    };

    io.to(accessCode).emit('kahoot:new_question', questionData);

    clearTimeout(gameSession.questionTimer);
    gameSession.questionTimer = setTimeout(async () => {
        const currentGame = await Game.findOne({ accessCode }).populate({path: 'quiz', populate: { path: 'questions' }});
        const correctAnswerIndex = currentGame.quiz.questions[nextIndex].correctAnswerIndex;
        gameSession.playerAnswers.forEach((answer, socketId) => {
            const player = currentGame.players.find(p => p.socketId === socketId);
            if (player && answer.answerIndex === correctAnswerIndex) {
                player.score += calculateScore(answer.timeRemaining);
            }
        });
        await currentGame.save();
        io.to(accessCode).emit('kahoot:round_result', {
            correctAnswerIndex: correctAnswerIndex,
            ranking: currentGame.players.sort((a, b) => b.score - a.score)
        });
    }, 15000);
}

module.exports = initializeKahootManager;
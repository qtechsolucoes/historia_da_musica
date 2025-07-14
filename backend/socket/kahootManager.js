const Game = require('../models/Game');

const activeGames = {};

function calculateScore(timeRemaining) {
    return Math.max(0, Math.floor(1000 * (timeRemaining / 15)));
}

async function startNextQuestion(io, accessCode) {
    const game = await Game.findOne({ accessCode }).populate({ path: 'quiz', populate: { path: 'questions' } });
    const gameSession = activeGames[accessCode];

    if (!game || !gameSession || game.status !== 'in_progress') return;

    const connectedPlayers = game.players.filter(p => p.connected);
    if (connectedPlayers.length === 0) {
        game.status = 'finished';
        await game.save();
        io.to(accessCode).emit('kahoot:game_over', { players: game.players.sort((a, b) => b.score - a.score) });
        if(activeGames[accessCode]) {
            clearTimeout(activeGames[accessCode].questionTimer);
            delete activeGames[accessCode];
        }
        return;
    }

    gameSession.playerAnswers.clear();
    const nextIndex = game.currentQuestionIndex + 1;

    if (nextIndex >= game.quiz.questions.length) {
        game.status = 'finished';
        await game.save();
        io.to(accessCode).emit('kahoot:game_over', { players: game.players.sort((a, b) => b.score - a.score) });
        if(activeGames[accessCode]) {
            clearTimeout(activeGames[accessCode].questionTimer);
            delete activeGames[accessCode];
        }
        return;
    }

    game.currentQuestionIndex = nextIndex;
    await game.save();

    const question = game.quiz.questions[nextIndex];
    if (!question) {
        io.to(accessCode).emit('kahoot:game_canceled', { message: 'Erro crítico: Pergunta não encontrada. O jogo foi encerrado.' });
        await Game.deleteOne({ accessCode });
        return;
    }
    
    const questionData = {
        index: nextIndex,
        text: question.text,
        options: question.options,
        time: 15,
        totalQuestions: game.quiz.questions.length
    };

    io.to(accessCode).emit('kahoot:new_question', questionData);

    clearTimeout(gameSession.questionTimer);
    gameSession.questionTimer = setTimeout(async () => {
        const currentGame = await Game.findOne({ accessCode }).populate({ path: 'quiz', populate: { path: 'questions' } });
        if (!currentGame) return;

        const currentQuestion = currentGame.quiz.questions[nextIndex];
        if (!currentQuestion) return;

        const correctAnswerIndex = currentQuestion.correctAnswerIndex;

        currentGame.players.forEach(player => {
            const answer = gameSession.playerAnswers.get(player.socketId);
            if (answer && answer.answerIndex === correctAnswerIndex) {
                player.score += calculateScore(answer.timeRemaining);
            }
        });
        
        await currentGame.save();
        
        io.to(accessCode).emit('kahoot:round_result', {
            correctAnswerIndex: correctAnswerIndex,
            ranking: currentGame.players.sort((a, b) => b.score - a.score)
        });

    }, (questionData.time * 1000) + 500);
}

function initializeKahootManager(io) {
    io.on('connection', (socket) => {

        socket.on('kahoot:host_join', async ({ accessCode }) => {
            const game = await Game.findOne({ accessCode }).populate({ path: 'quiz', populate: { path: 'questions' } });
            if (game) {
                socket.join(accessCode);
                game.hostSocketId = socket.id;
                await game.save();
                
                if (!activeGames[accessCode]) {
                    activeGames[accessCode] = { questionTimer: null, playerAnswers: new Map() };
                }
                
                socket.emit('kahoot:game_data', game);
                io.to(socket.id).emit('kahoot:player_list_update', game.players);
            } else {
                socket.emit('kahoot:error', { message: 'Jogo não encontrado.' });
            }
        });

        socket.on('kahoot:player_join', async ({ accessCode, nickname }, callback) => {
            if (!accessCode || !nickname || typeof nickname !== 'string' || nickname.length < 2 || nickname.length > 20) {
                return callback({ error: 'Apelido inválido.' });
            }
            const game = await Game.findOne({ accessCode });
            if (!game) return callback({ error: 'Jogo não encontrado.' });
            if (game.status !== 'lobby') return callback({ error: 'Este jogo já começou.' });
            if (game.players.some(p => p.nickname === nickname && p.connected)) {
                return callback({ error: 'Este apelido já está em uso.' });
            }

            socket.join(accessCode);
            const newPlayer = { socketId: socket.id, nickname, score: 0, connected: true };
            game.players.push(newPlayer);
            await game.save();
            
            const playerFromDb = game.players[game.players.length - 1];
            
            io.to(accessCode).emit('kahoot:player_list_update', game.players);
            callback({ player: playerFromDb, game });
        });
        
        socket.on('kahoot:player_rejoin', async ({ accessCode, nickname }, callback) => {
            const game = await Game.findOne({ accessCode }).populate({ path: 'quiz', populate: { path: 'questions' } });
            const player = game ? game.players.find(p => p.nickname === nickname) : null;

            if (game && player) {
                socket.join(accessCode);
                player.socketId = socket.id;
                player.connected = true;
                await game.save();

                io.to(game.hostSocketId).emit('kahoot:player_list_update', game.players);
                
                const currentQuestion = (game.status === 'in_progress' && game.currentQuestionIndex > -1) 
                    ? game.quiz.questions[game.currentQuestionIndex] 
                    : null;

                callback({ player, game, gameState: game.status, currentQuestion });
            } else {
                callback({ error: 'Não foi possível reconectar ao jogo.' });
            }
        });

        socket.on('kahoot:start_game', async ({ accessCode }) => {
            const game = await Game.findOneAndUpdate(
                { accessCode, hostSocketId: socket.id }, 
                { status: 'in_progress' }, 
                { new: true }
            );
            if (game) {
                io.to(accessCode).emit('kahoot:game_started');
                startNextQuestion(io, accessCode);
            }
        });

        socket.on('kahoot:next_question', async ({ accessCode }) => {
            const game = await Game.findOne({ accessCode });
            if(game && game.hostSocketId === socket.id){
                startNextQuestion(io, accessCode);
            }
        });
        
        socket.on('kahoot:player_answer', ({ accessCode, answerIndex, timeRemaining }) => {
            const gameSession = activeGames[accessCode];
            if (gameSession && typeof answerIndex === 'number' && !gameSession.playerAnswers.has(socket.id)) {
                gameSession.playerAnswers.set(socket.id, { answerIndex, timeRemaining });
                Game.findOne({ accessCode }).select('hostSocketId players').lean().then(game => {
                    if (game && game.hostSocketId) {
                        const connectedPlayerCount = game.players.filter(p => p.connected).length;
                        io.to(game.hostSocketId).emit('kahoot:answer_update', { 
                            count: gameSession.playerAnswers.size,
                            total: connectedPlayerCount 
                        });
                    }
                });
            }
        });

        socket.on('kahoot:cancel_game', async ({ accessCode }) => {
            const game = await Game.findOne({ accessCode });
            if (game && game.hostSocketId === socket.id) {
                if (activeGames[accessCode]) {
                    clearTimeout(activeGames[accessCode].questionTimer);
                    delete activeGames[accessCode];
                }
                io.to(accessCode).emit('kahoot:game_canceled', { message: 'O anfitrião cancelou o jogo.' });
                await Game.deleteOne({ accessCode });
            }
        });

        socket.on('disconnect', async () => {
            const game = await Game.findOne({ "players.socketId": socket.id });

            if (game) {
                 const player = game.players.find(p => p.socketId === socket.id);
                 if (player) {
                    player.connected = false;
                    await game.save();
                    io.to(game.accessCode).emit('kahoot:player_list_update', game.players);
                 }
            }
            
            const hostGame = await Game.findOne({ hostSocketId: socket.id });
            if (hostGame) {
                if (activeGames[hostGame.accessCode]) {
                    clearTimeout(activeGames[hostGame.accessCode].questionTimer);
                    delete activeGames[hostGame.accessCode];
                }
                io.to(hostGame.accessCode).emit('kahoot:game_canceled', { message: 'O anfitrião desconectou-se.' });
                await Game.deleteOne({ accessCode: hostGame.accessCode });
            }
        });
    });
}

module.exports = initializeKahootManager;
const Game = require('../models/Game');

const activeGames = {};
const gameTimers = {};

function calculateScore(timeRemaining) {
    return Math.max(0, Math.floor(1000 * (timeRemaining / 15)));
}

async function endRound(io, accessCode) {
    const game = await Game.findOne({ accessCode }).populate({ path: 'quiz', populate: { path: 'questions' } });
    const gameSession = activeGames[accessCode];

    if (!game || !gameSession) return;
    
    const currentQuestion = game.quiz.questions[game.currentQuestionIndex];
    if (!currentQuestion) return;

    const correctAnswerIndex = currentQuestion.correctAnswerIndex;
    
    const answerDistribution = { 0: 0, 1: 0, 2: 0, 3: 0 };
    gameSession.playerAnswers.forEach((answerData) => {
       answerDistribution[answerData.answerIndex]++;
    });

    game.players.forEach(player => {
        const answer = gameSession.playerAnswers.get(player.socketId);
        if (answer && answer.answerIndex === correctAnswerIndex) {
            player.score += calculateScore(answer.timeRemaining);
        }
    });
    
    await game.save();
    
    io.to(accessCode).emit('kahoot:round_result', {
        correctAnswerIndex,
        ranking: game.players.sort((a, b) => b.score - a.score),
        answerDistribution
    });
}

async function startNextQuestion(io, accessCode) {
    const gameSession = activeGames[accessCode];
    if (!gameSession || gameSession.isStartingNextQuestion) {
        return; // Retorna imediatamente se uma transição já estiver em andamento.
    }
    gameSession.isStartingNextQuestion = true;

    if (gameTimers[accessCode]) {
        clearInterval(gameTimers[accessCode].tickInterval);
        clearTimeout(gameTimers[accessCode].endRoundTimeout);
    }

    const game = await Game.findOne({ accessCode }).populate({ path: 'quiz', populate: { path: 'questions' } });
    if (!game || game.status !== 'in_progress') {
        if(gameSession) gameSession.isStartingNextQuestion = false;
        return;
    }
    
    const nextIndex = game.currentQuestionIndex + 1;
    if (nextIndex >= game.quiz.questions.length) {
        game.status = 'finished';
        await game.save();
        io.to(accessCode).emit('kahoot:game_over', { players: game.players.sort((a, b) => b.score - a.score) });
        if (activeGames[accessCode]) delete activeGames[accessCode];
        if (gameTimers[accessCode]) delete gameTimers[accessCode];
        return;
    }
    
    game.currentQuestionIndex = nextIndex;
    await game.save();
    gameSession.playerAnswers.clear();

    const question = game.quiz.questions[nextIndex];
    const questionData = {
        index: nextIndex,
        text: question.text,
        options: question.options,
        time: 15,
        totalQuestions: game.quiz.questions.length
    };
    
    io.to(accessCode).emit('kahoot:new_question', questionData);
    gameSession.isStartingNextQuestion = false; // Libera o bloqueio
    
    let timeRemaining = questionData.time;
    const tickInterval = setInterval(() => {
        io.to(accessCode).emit('kahoot:timer_update', { timeRemaining });
        timeRemaining--;
    }, 1000);

    const endRoundTimeout = setTimeout(() => {
        clearInterval(tickInterval);
        endRound(io, accessCode);
    }, questionData.time * 1000 + 500);

    gameTimers[accessCode] = { tickInterval, endRoundTimeout };
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
                    // CORREÇÃO: Inicializa a flag de bloqueio aqui
                    activeGames[accessCode] = { 
                        playerAnswers: new Map(),
                        isStartingNextQuestion: false 
                    };
                }
                socket.emit('kahoot:game_data', game);
                io.to(socket.id).emit('kahoot:player_list_update', game.players);
            } else {
                socket.emit('kahoot:error', { message: 'Jogo não encontrado.' });
            }
        });

        socket.on('kahoot:player_join', async ({ accessCode, nickname, user }, callback) => {
            const game = await Game.findOne({ accessCode });
            if (!game) return callback({ error: 'Jogo não encontrado.' });
            if (game.status !== 'lobby') return callback({ error: 'Este jogo já começou.' });
            if (game.players.some(p => p.nickname === nickname && p.connected)) {
                return callback({ error: 'Este apelido já está em uso.' });
            }

            socket.join(accessCode);
            
            const newPlayer = {
                socketId: socket.id,
                nickname,
                score: 0,
                connected: true,
                email: user ? user.email : undefined,
                picture: user ? user.picture : undefined
            };
            
            game.players.push(newPlayer);
            await game.save();
            
            const playerFromDb = game.players.find(p => p.socketId === socket.id);
            
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
            }
        });
        
        socket.on('kahoot:request_next_question', ({ accessCode }) => {
            startNextQuestion(io, accessCode);
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
            if (gameTimers[accessCode]) {
                clearInterval(gameTimers[accessCode].tickInterval);
                clearTimeout(gameTimers[accessCode].endRoundTimeout);
                delete gameTimers[accessCode];
            }
            if(activeGames[accessCode]) delete activeGames[accessCode];
            const game = await Game.findOne({ accessCode });
            if (game && game.hostSocketId === socket.id) {
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
                if (gameTimers[hostGame.accessCode]) {
                    clearInterval(gameTimers[hostGame.accessCode].tickInterval);
                    clearTimeout(gameTimers[hostGame.accessCode].endRoundTimeout);
                    delete gameTimers[hostGame.accessCode];
                }
                if(activeGames[hostGame.accessCode]) delete activeGames[hostGame.accessCode];
                io.to(hostGame.accessCode).emit('kahoot:game_canceled', { message: 'O anfitrião desconectou-se.' });
                await Game.deleteOne({ accessCode: hostGame.accessCode });
            }
        });
    });
}

module.exports = initializeKahootManager;
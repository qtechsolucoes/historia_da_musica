const Game = require('../models/Game');

// Um objeto em memória para manter o estado dos timers e das respostas de cada jogo ativo.
const activeGames = {};

function initializeKahootManager(io) {
    io.on('connection', (socket) => {

        // Evento: O anfitrião junta-se à sala após criar o jogo.
        socket.on('kahoot:host_join', async ({ accessCode }) => {
            const game = await Game.findOne({ accessCode }).populate('quiz');
            if (game) {
                socket.join(accessCode);
                game.hostSocketId = socket.id;
                await game.save();

                // Inicializa o estado em memória para este jogo
                activeGames[accessCode] = {
                    questionTimer: null,
                    playerAnswers: new Map() // Usamos um Map para [socketId, { answerIndex, timeRemaining }]
                };

                // Envia os dados iniciais do jogo para o anfitrião
                socket.emit('kahoot:game_data', game);
            } else {
                socket.emit('error', { message: 'Jogo não encontrado.' });
            }
        });

        // Evento: Um jogador tenta entrar no lobby.
        socket.on('kahoot:player_join', async ({ accessCode, nickname }, callback) => {
            const game = await Game.findOne({ accessCode });
            if (!game || game.status !== 'lobby') {
                return callback({ error: 'Jogo não encontrado ou já iniciado.' });
            }

            socket.join(accessCode);
            const newPlayer = { socketId: socket.id, nickname, score: 0 };
            game.players.push(newPlayer);
            await game.save();

            // Notifica todos na sala (anfitrião e outros jogadores) sobre o novo jogador.
            io.to(accessCode).emit('kahoot:player_list_update', game.players);
            callback({ player: newPlayer, game });
        });

        // Evento: O anfitrião inicia o jogo.
        socket.on('kahoot:start_game', async ({ accessCode }) => {
            const game = await Game.findOneAndUpdate({ accessCode, hostSocketId: socket.id }, { status: 'in_progress' }, { new: true });
            if (game) {
                io.to(accessCode).emit('kahoot:game_started');
                startNextQuestion(io, accessCode);
            }
        });

        // Evento: O anfitrião solicita a próxima pergunta.
        socket.on('kahoot:next_question', ({ accessCode }) => {
            const game = activeGames[accessCode];
            if (game) {
                startNextQuestion(io, accessCode);
            }
        });

        // Evento: Um jogador envia a sua resposta.
        socket.on('kahoot:player_answer', ({ accessCode, answerIndex, timeRemaining }) => {
            const gameSession = activeGames[accessCode];
            // Só aceita a resposta se a sessão do jogo existir e o jogador ainda não tiver respondido.
            if (gameSession && !gameSession.playerAnswers.has(socket.id)) {
                gameSession.playerAnswers.set(socket.id, { answerIndex, timeRemaining });
                // Notifica o anfitrião que uma resposta foi recebida para atualizar a contagem.
                io.to(accessCode).emit('kahoot:answer_update', { count: gameSession.playerAnswers.size });
            }
        });

        // Evento: Lida com a desconexão de um socket.
        socket.on('disconnect', async () => {
            // Encontra se o jogador estava em algum jogo
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
                    // Se o anfitrião desconectar, o jogo é encerrado
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

// Função para calcular a pontuação baseada no tempo restante.
function calculateScore(timeRemaining) {
    if (timeRemaining > 12) return 1000; // 0 a 3s de resposta
    if (timeRemaining > 9) return 800;   // 3 a 6s de resposta
    if (timeRemaining > 5) return 600;   // 6 a 10s de resposta
    if (timeRemaining > 2) return 400;   // 10 a 13s de resposta
    return 200;                          // 13 a 15s de resposta
}

// Função principal que orquestra o fluxo de uma rodada.
async function startNextQuestion(io, accessCode) {
    const game = await Game.findOne({ accessCode }).populate('quiz');
    const gameSession = activeGames[accessCode];

    if (!game || !gameSession || game.status !== 'in_progress') return;

    // Limpa as respostas da rodada anterior.
    gameSession.playerAnswers.clear();

    const nextIndex = game.currentQuestionIndex + 1;

    // Verifica se o jogo acabou.
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
    const questionData = {
        index: nextIndex,
        text: question.text,
        options: question.options,
        time: 15
    };

    // Envia a nova pergunta para todos na sala.
    io.to(accessCode).emit('kahoot:new_question', questionData);

    // Limpa qualquer timer antigo e inicia um novo no servidor.
    clearTimeout(gameSession.questionTimer);
    gameSession.questionTimer = setTimeout(async () => {
        // Quando o tempo acaba, busca o estado mais recente do jogo.
        const currentGame = await Game.findOne({ accessCode }).populate('quiz');
        const correctAnswerIndex = currentGame.quiz.questions[nextIndex].correctAnswerIndex;

        // Calcula a pontuação para cada jogador que respondeu.
        gameSession.playerAnswers.forEach((answer, socketId) => {
            const player = currentGame.players.find(p => p.socketId === socketId);
            if (player && answer.answerIndex === correctAnswerIndex) {
                player.score += calculateScore(answer.timeRemaining);
            }
        });
        await currentGame.save();
        
        // Envia o resultado da rodada e o ranking atualizado para todos.
        io.to(accessCode).emit('kahoot:round_result', {
            correctAnswerIndex: correctAnswerIndex,
            ranking: currentGame.players.sort((a, b) => b.score - a.score)
        });

    }, 15000); // 15 segundos
}

module.exports = initializeKahootManager;
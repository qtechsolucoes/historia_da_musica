// backend/socket/kahootManager.js

const redisClient = require('../redisClient'); // <-- 1. Importar o nosso cliente Redis
const allQuestions = require('../data'); // Supondo que os seus dados estão em data.js

// A variável 'games' em memória foi removida. O Redis é agora a nossa "fonte da verdade".
// const games = {};

const initializeKahootManager = (io) => {
    
    // Função auxiliar para gerar um código de acesso único
    const generateAccessCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    // Função auxiliar para obter e analisar os dados de um jogo a partir do Redis
    const getGame = async (accessCode) => {
        const gameData = await redisClient.get(`game:${accessCode}`);
        return gameData ? JSON.parse(gameData) : null;
    };

    // Função auxiliar para guardar (ou atualizar) os dados de um jogo no Redis
    const saveGame = async (accessCode, gameData) => {
        // Usamos JSON.stringify para armazenar o objeto como uma string
        // Definimos um tempo de expiração (TTL - Time To Live) de 6 horas para limpar jogos antigos
        await redisClient.set(`game:${accessCode}`, JSON.stringify(gameData), {
            EX: 21600 // 6 horas em segundos
        });
    };

    io.on('connection', (socket) => {
        
        socket.on('kahoot:create_game', async (data, callback) => {
            try {
                const accessCode = generateAccessCode();
                
                // Filtrar perguntas com base nos períodos e na contagem solicitada
                const filteredQuestions = allQuestions
                    .filter(q => data.periods.includes(q.periodId))
                    .sort(() => 0.5 - Math.random()) // Baralhar
                    .slice(0, data.questionCount);

                const newGame = {
                    accessCode,
                    hostId: socket.id,
                    quiz: {
                        title: data.title,
                        questions: filteredQuestions,
                    },
                    players: [],
                    gameState: 'lobby',
                    currentQuestionIndex: -1,
                };
                
                // <-- 2. GUARDAR NO REDIS em vez de no objeto 'games'
                await saveGame(accessCode, newGame);
                
                socket.join(accessCode);
                callback({ accessCode });
            } catch (err) {
                console.error("Erro ao criar o jogo:", err);
                callback({ error: "Não foi possível criar o jogo." });
            }
        });

        socket.on('kahoot:host_join', async (data) => {
            const { accessCode } = data;
            const game = await getGame(accessCode); // <-- 3. OBTER O JOGO DO REDIS

            if (game && game.hostId === socket.id) {
                socket.join(accessCode);
                socket.emit('kahoot:game_data', game);
            }
        });

        socket.on('kahoot:player_join', async (data, callback) => {
            const { accessCode, nickname, user } = data;
            
            try {
                const game = await getGame(accessCode);

                if (!game) {
                    return callback({ error: 'Jogo não encontrado.' });
                }
                if (game.players.some(p => p.nickname === nickname)) {
                    return callback({ error: 'Este apelido já está a ser utilizado.' });
                }
                if (game.gameState !== 'lobby') {
                    return callback({ error: 'Este jogo já começou.' });
                }

                const newPlayer = {
                    _id: user?._id || socket.id,
                    nickname,
                    picture: user?.picture || null,
                    socketId: socket.id,
                    score: 0,
                    connected: true
                };

                game.players.push(newPlayer);
                await saveGame(accessCode, game); // <-- 4. ATUALIZAR O JOGO NO REDIS

                socket.join(accessCode);
                
                // Envia a confirmação ao jogador
                callback({ success: true, player: newPlayer });
                // Envia a lista de jogadores atualizada ao anfitrião
                io.to(accessCode).emit('kahoot:player_list_update', game.players);

            } catch (err) {
                console.error("Erro na entrada do jogador:", err);
                callback({ error: "Ocorreu um erro ao entrar no jogo." });
            }
        });

        socket.on('kahoot:start_game', async ({ accessCode }) => {
            const game = await getGame(accessCode);
            if (game && game.hostId === socket.id) {
                game.gameState = 'in_progress';
                await saveGame(accessCode, game);
                io.to(accessCode).emit('kahoot:game_started');
            }
        });

        socket.on('kahoot:request_next_question', async ({ accessCode }) => {
            const game = await getGame(accessCode);
            if (!game || game.hostId !== socket.id) return;

            if (game.currentQuestionIndex >= game.quiz.questions.length - 1) {
                // Fim de jogo
                game.gameState = 'finished';
                await saveGame(accessCode, game);
                io.to(accessCode).emit('kahoot:game_over', { players: game.players.sort((a, b) => b.score - a.score) });
            } else {
                game.currentQuestionIndex++;
                await saveGame(accessCode, game);

                const question = game.quiz.questions[game.currentQuestionIndex];
                const questionPayload = {
                    index: game.currentQuestionIndex,
                    totalQuestions: game.quiz.questions.length,
                    text: question.text,
                    options: question.options,
                    timeLimit: 20 // Segundos
                };
                
                io.to(accessCode).emit('kahoot:new_question', questionPayload);

                // Iniciar o temporizador no servidor
                let timeRemaining = questionPayload.timeLimit;
                const timer = setInterval(async () => {
                    io.to(accessCode).emit('kahoot:timer_update', { timeRemaining });
                    timeRemaining--;

                    if (timeRemaining < 0) {
                        clearInterval(timer);
                        const currentGame = await getGame(accessCode); // Obter estado atualizado
                        const currentQuestion = currentGame.quiz.questions[currentGame.currentQuestionIndex];

                        // Enviar resultados da ronda
                        io.to(accessCode).emit('kahoot:round_result', {
                            correctAnswerIndex: currentQuestion.correctAnswerIndex,
                            answerDistribution: currentGame.answerDistribution || {},
                            ranking: currentGame.players.sort((a, b) => b.score - a.score)
                        });
                        
                        // Limpar a distribuição de respostas para a próxima ronda
                        currentGame.answerDistribution = {};
                        await saveGame(accessCode, currentGame);
                    }
                }, 1000);
            }
        });

        socket.on('kahoot:player_answer', async ({ accessCode, answerIndex, timeRemaining }) => {
            const game = await getGame(accessCode);
            if (!game) return;

            const player = game.players.find(p => p.socketId === socket.id);
            if (!player) return;

            const question = game.quiz.questions[game.currentQuestionIndex];

            // Inicializar a distribuição de respostas se não existir
            if (!game.answerDistribution) {
                game.answerDistribution = {};
            }
            game.answerDistribution[answerIndex] = (game.answerDistribution[answerIndex] || 0) + 1;

            if (answerIndex === question.correctAnswerIndex) {
                // Cálculo de pontos: 1000 pontos base * (tempo restante / tempo limite)
                const scoreGained = Math.round(1000 * (timeRemaining / 20));
                player.score += scoreGained;
            }
            
            await saveGame(accessCode, game);
            
            const totalAnswers = Object.values(game.answerDistribution).reduce((sum, count) => sum + count, 0);
            io.to(game.hostId).emit('kahoot:answer_update', { count: totalAnswers });
        });
        
        socket.on('disconnect', async () => {
            // Lógica de desconexão mais complexa para encontrar o jogo do jogador
            console.log(`Utilizador ${socket.id} desconectou-se`);
            // Esta parte é mais complexa com Redis, pois não temos uma referência direta
            // Para uma implementação de produção, seria bom ter um mapeamento socket.id -> accessCode no Redis.
            // Por enquanto, vamos manter a lógica mais simples.
        });

    });
};

module.exports = initializeKahootManager;
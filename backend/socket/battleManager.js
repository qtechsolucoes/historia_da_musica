// backend/socket/battleManager.js

const { v4: uuidv4 } = require('uuid');
const redisClient = require('../redisClient'); // <-- 1. Importar o cliente Redis
const allQuestions = require('../data');

// As variáveis em memória foram removidas.
// let waitingPlayers = {};
// let battles = {};

// Chaves do Redis que usaremos para as listas de espera e batalhas.
const WAITING_PLAYERS_KEY = 'waiting_players';
const BATTLE_KEY_PREFIX = 'battle:';

const initializeSocketManager = (io) => {

    // --- Funções Auxiliares para Redis ---

    const getBattle = async (battleId) => {
        const battleData = await redisClient.get(`${BATTLE_KEY_PREFIX}${battleId}`);
        return battleData ? JSON.parse(battleData) : null;
    };

    const saveBattle = async (battleId, battleData) => {
        // Guardar a batalha com uma expiração de 2 horas.
        await redisClient.set(`${BATTLE_KEY_PREFIX}${battleId}`, JSON.stringify(battleData), {
            EX: 7200 // 2 horas em segundos
        });
    };
    
    const removeBattle = async (battleId) => {
        await redisClient.del(`${BATTLE_KEY_PREFIX}${battleId}`);
    };

    io.on('connection', (socket) => {

        socket.on('find_battle', async ({ user, periodId }) => {
            try {
                // <-- 2. LER E MODIFICAR A FILA DE ESPERA NO REDIS
                const waitingPlayerJson = await redisClient.lPop(WAITING_PLAYERS_KEY);

                if (waitingPlayerJson) {
                    // Oponente encontrado!
                    const opponent = JSON.parse(waitingPlayerJson);

                    // Evitar que o jogador jogue contra si mesmo em outra aba
                    if (opponent.socketId === socket.id || opponent.user.email === user.email) {
                        // Se for o mesmo jogador, recoloca o oponente na fila e avisa o jogador atual.
                        await redisClient.rPush(WAITING_PLAYERS_KEY, waitingPlayerJson);
                        return socket.emit('battle_error', 'Você não pode batalhar contra si mesmo.');
                    }

                    const battleId = uuidv4();
                    const players = [
                        { id: opponent.socketId, user: opponent.user },
                        { id: socket.id, user: user }
                    ];

                    const newBattle = {
                        battleId,
                        players,
                        scores: { [opponent.socketId]: 0, [socket.id]: 0 },
                        answers: {},
                        currentQuestionIndex: -1,
                        periodId: periodId,
                        questions: allQuestions.filter(q => q.periodId === periodId).sort(() => 0.5 - Math.random()).slice(0, 10)
                    };

                    await saveBattle(battleId, newBattle);

                    // Coloca ambos os jogadores numa "sala" de socket.io
                    io.to(opponent.socketId).socketsJoin(battleId);
                    socket.join(battleId);

                    io.to(battleId).emit('battle_found', newBattle);
                    
                    // Inicia a primeira pergunta
                    startNextRound(battleId);

                } else {
                    // Nenhum oponente, adiciona o jogador à fila de espera no Redis
                    const playerInfo = { socketId: socket.id, user, periodId };
                    await redisClient.rPush(WAITING_PLAYERS_KEY, JSON.stringify(playerInfo));
                    socket.emit('waiting_for_opponent');
                }
            } catch (err) {
                console.error("Erro ao procurar batalha:", err);
                socket.emit('battle_error', 'Ocorreu um erro interno.');
            }
        });

        const startNextRound = async (battleId) => {
            const battle = await getBattle(battleId);
            if (!battle) return;

            if (battle.currentQuestionIndex >= battle.questions.length - 1) {
                // Fim da batalha
                const winnerId = Object.keys(battle.scores).reduce((a, b) => battle.scores[a] > battle.scores[b] ? a : b);
                const winner = battle.players.find(p => p.id === winnerId).user.name;
                io.to(battleId).emit('game_over', { winner, prize: 50 });
                await removeBattle(battleId);
                return;
            }

            battle.currentQuestionIndex++;
            battle.answers = {}; // Limpa as respostas da ronda anterior
            await saveBattle(battleId, battle);

            const question = battle.questions[battle.currentQuestionIndex];
            io.to(battleId).emit('new_battle_question', {
                question: question.text,
                options: question.options
            });
        };

        socket.on('battle_answer', async ({ battleId, answer }) => {
            const battle = await getBattle(battleId);
            if (!battle || battle.answers[socket.id]) return; // Impede respostas múltiplas

            battle.answers[socket.id] = answer;
            await saveBattle(battleId, battle);

            // Se ambos os jogadores responderam, processa o resultado
            if (Object.keys(battle.answers).length === 2) {
                const question = battle.questions[battle.currentQuestionIndex];
                const correctAnswer = question.options[question.correctAnswerIndex];
                
                const result = {
                    correctAnswer,
                    scores: battle.scores,
                };

                // Atualiza as pontuações
                for (const playerId in battle.answers) {
                    if (battle.answers[playerId] === correctAnswer) {
                        battle.scores[playerId] += 10;
                    }
                }
                
                await saveBattle(battleId, battle);
                result.scores = battle.scores; // Envia as pontuações atualizadas

                io.to(battleId).emit('battle_result', result);

                // Aguarda 3 segundos antes de iniciar a próxima ronda
                setTimeout(() => startNextRound(battleId), 3000);
            }
        });
        
        socket.on('disconnect', async () => {
             // Lógica de desconexão: remove o jogador da fila de espera se ele estiver lá.
             // Uma lógica mais completa para batalhas em andamento exigiria mapear socket.id -> battleId.
             const allWaiting = await redisClient.lRange(WAITING_PLAYERS_KEY, 0, -1);
             const playerJson = allWaiting.find(p => JSON.parse(p).socketId === socket.id);
             if(playerJson) {
                 await redisClient.lRem(WAITING_PLAYERS_KEY, 1, playerJson);
                 console.log(`Jogador ${socket.id} removido da fila de espera.`);
             }
        });
    });
};

module.exports = initializeSocketManager;
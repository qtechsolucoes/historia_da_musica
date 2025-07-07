const { GoogleGenerativeAI } = require("@google/generative-ai");
const { musicHistoryData } = require('../data.js');
const User = require('../models/User');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let battleQueue = [];
let activeBattles = {};

async function generateBattleQuestion(periodId) {
    const period = musicHistoryData.find(p => p.id === periodId);
    
    // --- CORREÇÃO APLICADA AQUI ---
    // A validação foi corrigida para a lógica correta.
    if (!period || !period.composers || period.composers.length < 4) {
        // Este erro só será lançado se REALMENTE não houver dados suficientes.
        throw new Error("Dados de período inválidos ou insuficientes para gerar pergunta de batalha.");
    }

    const randomComposer = period.composers[Math.floor(Math.random() * period.composers.length)];
    const otherComposers = period.composers.filter(c => c.name !== randomComposer.name).sort(() => 0.5 - Math.random()).slice(0, 3).map(c => c.name);

    try {
        const questionTypes = ['work_to_composer', 'composer_to_lifespan', 'fact_to_composer'];
        const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
        
        let prompt;
        const baseFormat = `
Formato Exigido (use ;; como separador entre as opções e termine cada linha com a informação correspondente):
PERGUNTA: [Texto da pergunta aqui]
OPÇÕES: [Opção A];;[Opção B];;[Opção C];;[Opção D]
RESPOSTA: [Texto exato da opção correta aqui]

Responda em português do Brasil.`

        switch (randomType) {
            case 'composer_to_lifespan':
                prompt = `Crie uma pergunta de múltipla escolha: "Qual o período de vida de ${randomComposer.name}?". A resposta correta é "${randomComposer.lifespan}". Gere três outras opções de datas plausíveis, mas incorretas, para compositores do mesmo período. ${baseFormat}`;
                break;
            case 'fact_to_composer':
                prompt = `Crie uma pergunta de múltipla escolha sobre um facto interessante ou uma característica principal de ${randomComposer.name}. A resposta correta deve ser "${randomComposer.name}". As outras três opções devem ser os seguintes compositores: ${otherComposers.join(', ')}. ${baseFormat}`;
                break;
            case 'work_to_composer':
            default:
                const correctWork = randomComposer.majorWorks[0] || 'Obra Desconhecida';
                prompt = `Crie uma pergunta de múltipla escolha: "Qual destes compositores escreveu a obra '${correctWork}'?". A resposta correta deve ser "${randomComposer.name}". As outras três opções devem ser os seguintes compositores: ${otherComposers.join(', ')}. ${baseFormat}`;
                break;
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const lines = text.split('\n').filter(line => line.trim() !== '');
        const questionLine = lines.find(line => line.startsWith('PERGUNTA:'));
        const optionsLine = lines.find(line => line.startsWith('OPÇÕES:'));
        const answerLine = lines.find(line => line.startsWith('RESPOSTA:'));

        if (!questionLine || !optionsLine || !answerLine) {
            throw new Error("Formato de resposta da IA inválido.");
        }

        const question = questionLine.replace('PERGUNTA:', '').trim();
        const options = optionsLine.replace('OPÇÕES:', '').split(';;').map(opt => opt.trim());
        const answer = answerLine.replace('RESPOSTA:', '').trim();

        if (options.length !== 4 || !question || !answer) {
             throw new Error("Dados da pergunta da IA estão incompletos.");
        }

        console.log("[Socket.IO] Pergunta gerada com sucesso pela IA.");
        return { question, options, answer };

    } catch (error) {
        console.error("[Socket.IO] Erro ao gerar pergunta com IA, a usar fallback:", error.message);
        
        const correctWork = randomComposer.majorWorks[0] || 'Obra Desconhecida';
        const options = [randomComposer.name, ...otherComposers].sort(() => 0.5 - Math.random());
        
        return {
            question: `Qual compositor escreveu a obra "${correctWork}"?`,
            options: options,
            answer: randomComposer.name
        };
    }
}

const endBattle = async (io, battleId, winnerId, loserId) => {
    const battle = activeBattles[battleId];
    if (!battle) return;

    const winnerSocket = battle.players.find(p => p.user._id.toString() === winnerId.toString());
    const winnerName = winnerSocket ? winnerSocket.user.name : "Vencedor";

    const winner = await User.findById(winnerId);
    if (winner) {
        winner.score += 25;
        await winner.save();
    }
    
    io.to(battleId).emit('game_over', { winner: winnerName, prize: 25 });
    delete activeBattles[battleId];
};

function initializeSocketManager(io) {
    io.on('connection', (socket) => {
        console.log(`[Socket.IO] Usuário conectado: ${socket.id}`);

        socket.on('find_battle', ({ user, periodId }) => {
            if (!user || !user.email) {
                console.log(`[Socket.IO] Tentativa de 'find_battle' com usuário inválido do socket ${socket.id}.`);
                return;
            }

            console.log(`[Socket.IO] ${user.name} está procurando uma batalha para o período: ${periodId}`);
            socket.user = user;
            socket.periodId = periodId;

            if (battleQueue.some(s => s.user.email === user.email)) {
                console.log(`[Socket.IO] ${user.name} já está na fila.`);
                return;
            }
            
            battleQueue.push(socket);
            console.log(`[Socket.IO] Fila de espera agora tem: ${battleQueue.length} jogador(es).`);

            if (battleQueue.length >= 2) {
                const p1Socket = battleQueue.shift();
                const p2Socket = battleQueue.shift();
                const battleId = `battle_${p1Socket.id}_${p2Socket.id}`;
                console.log(`[Socket.IO] Formando batalha ${battleId} entre ${p1Socket.user.name} e ${p2Socket.user.name}`);

                p1Socket.join(battleId);
                p2Socket.join(battleId);

                activeBattles[battleId] = {
                    players: [ { id: p1Socket.id, user: p1Socket.user }, { id: p2Socket.id, user: p2Socket.user } ],
                    scores: { [p1Socket.id]: 0, [p2Socket.id]: 0 },
                    periodId: p1Socket.periodId,
                    answers: {},
                    endGameRequests: new Set()
                };
                
                io.to(battleId).emit('battle_found', { battleId, players: activeBattles[battleId].players, scores: activeBattles[battleId].scores });
                console.log(`[Socket.IO] Evento 'battle_found' emitido para a sala ${battleId}.`);

                generateBattleQuestion(activeBattles[battleId].periodId)
                    .then(question => {
                        activeBattles[battleId].question = question;
                        io.to(battleId).emit('new_battle_question', question);
                        console.log(`[Socket.IO] Primeira pergunta enviada para a batalha ${battleId}.`);
                    })
                    .catch(err => {
                        console.error("[Socket.IO] Erro crítico irrecuperável ao gerar pergunta:", err);
                        io.to(battleId).emit('battle_error', 'Erro irrecuperável ao gerar pergunta.');
                    });
            } else {
                socket.emit('waiting_for_opponent');
                console.log(`[Socket.IO] ${user.name} está esperando por um oponente.`);
            }
        });
        
        socket.on('battle_answer', ({ battleId, answer }) => {
            const battle = activeBattles[battleId];
            if (!battle || battle.answers[socket.id]) return;

            battle.answers[socket.id] = answer;
            const allAnswered = Object.keys(battle.answers).length === 2;

            if (allAnswered) {
                let results = {};
                for (const playerId in battle.answers) {
                    const isCorrect = battle.answers[playerId] === battle.question.answer;
                    if (isCorrect) battle.scores[playerId] += 10;
                    results[playerId] = { isCorrect, answer: battle.answers[playerId] };
                }
                
                io.to(battleId).emit('battle_result', { results, scores: battle.scores, correctAnswer: battle.question.answer });
                
                battle.answers = {};
                
                setTimeout(() => {
                     generateBattleQuestion(battle.periodId)
                        .then(question => {
                            battle.question = question;
                            io.to(battleId).emit('new_battle_question', question);
                        })
                        .catch(err => io.to(battleId).emit('battle_error', 'Erro ao gerar pergunta.'));
                }, 5000);
            }
        });

        socket.on('request_end_game', ({ battleId }) => {
            const battle = activeBattles[battleId];
            if (!battle) return;
            
            battle.endGameRequests.add(socket.id);
            const opponent = battle.players.find(p => p.id !== socket.id);
            if (opponent) {
                io.to(opponent.id).emit('confirm_end_game', { requesterName: socket.user.name });
            }
        });

        socket.on('accept_end_game', ({ battleId }) => {
            const battle = activeBattles[battleId];
            if (!battle) return;

            const p1 = battle.players[0];
            const p2 = battle.players[1];
            const p1Score = battle.scores[p1.id];
            const p2Score = battle.scores[p2.id];

            if (p1Score === p2Score) {
                io.to(battleId).emit('game_over', { winner: 'Empate', prize: 5 });
                delete activeBattles[battleId];
                return;
            }

            const winnerId = p1Score > p2Score ? p1.user._id : p2.user._id;
            const loserId = p1Score < p2Score ? p1.user._id : p2.user._id;
            endBattle(io, battleId, winnerId, loserId);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket.IO] Usuário desconectado: ${socket.id}`);
            battleQueue = battleQueue.filter(s => s.id !== socket.id);
            for (const battleId in activeBattles) {
                const playerIndex = activeBattles[battleId].players.findIndex(p => p.id === socket.id);
                if (playerIndex !== -1) {
                    console.log(`[Socket.IO] Jogador ${socket.user?.name || 'desconhecido'} desconectou da batalha ${battleId}`);
                    
                    if (socket.user && socket.user.email) {
                        User.findOneAndUpdate({ email: socket.user.email }, { $inc: { score: -5 } }).exec();
                    }
                    
                    const opponent = activeBattles[battleId].players[1 - playerIndex];
                    if (opponent) {
                         io.to(opponent.id).emit('opponent_disconnected');
                    }
                    delete activeBattles[battleId];
                    break;
                }
            }
        });
    });
}

module.exports = initializeSocketManager;
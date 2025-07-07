require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
const { body, validationResult } = require('express-validator');
const http = require('http');
const { Server } = require("socket.io");
const { GoogleGenerativeAI } = require("@google/generative-ai"); // <-- CORREÇÃO: Importado

const User = require('./models/User');
const { musicHistoryData } = require('./data.js');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Certifique-se que a porta está correta para o seu frontend Vite
        methods: ["GET", "POST"]
    }
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const PORT = process.env.PORT || 5001;

// --- CORREÇÃO: Inicialização do cliente Gemini ---
// Certifique-se que sua chave está no arquivo .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 

mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('Conectado ao MongoDB com sucesso!'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// --- ROTAS DA API ---

app.post('/api/auth/google',
    body('token').isString().notEmpty(),
    async (req, res) => {
        try {
            const ticket = await client.verifyIdToken({ idToken: req.body.token, audience: process.env.GOOGLE_CLIENT_ID });
            const { name, email, picture } = ticket.getPayload();
            let user = await User.findOne({ email });
            if (!user) {
                user = new User({
                    name,
                    email,
                    picture,
                    score: 0,
                    achievements: [],
                    stats: {
                        quizzesCompleted: 0,
                        correctAnswers: 0,
                        incorrectAnswers: 0,
                        periodsVisited: new Map(),
                        favoritePeriod: 'Nenhum'
                    }
                });
                await user.save();
            }
            res.status(200).json(user);
        } catch (error) {
            console.error("Erro na autenticação do Google:", error);
            res.status(400).json({ error: "Falha na autenticação" });
        }
    }
);

app.post('/api/score',
    body('email').isEmail().normalizeEmail(),
    body('score').isNumeric(),
    body('statsUpdate').isObject().optional(),
    async (req, res) => {
        const { email, score, statsUpdate } = req.body;
        try {
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

            user.score = score;
            if (statsUpdate) {
                user.stats.quizzesCompleted = (user.stats.quizzesCompleted || 0) + (statsUpdate.quizzesCompleted || 0);
                user.stats.correctAnswers = (user.stats.correctAnswers || 0) + (statsUpdate.correctAnswers || 0);
                user.stats.incorrectAnswers = (user.stats.incorrectAnswers || 0) + (statsUpdate.incorrectAnswers || 0);
            }
            const updatedUser = await user.save();
            res.status(200).json(updatedUser);
        } catch (error) {
            res.status(500).json({ error: "Erro ao atualizar pontuação" });
        }
    }
);

app.post('/api/achievements',
    body('email').isEmail().normalizeEmail(),
    body('achievement').isObject(),
    async (req, res) => {
        const { email, achievement } = req.body;
        try {
            const user = await User.findOneAndUpdate(
                { email, 'achievements.name': { $ne: achievement.name } },
                { $push: { achievements: achievement } },
                { new: true }
            );
            if (!user) return res.status(200).send("Usuário não encontrado ou conquista já existe.");
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: "Erro ao adicionar conquista" });
        }
    }
);

app.get('/api/leaderboard', async (req, res) => {
    try {
        const topPlayers = await User.find().sort({ score: -1 }).limit(10);
        res.status(200).json(topPlayers);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar o ranking" });
    }
});

// --- CORREÇÃO: Nova Rota para a IA Generativa ---
app.post('/api/gemini', 
    body('prompt').isString().notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
            const prompt = req.body.prompt;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            
            // Retorna a resposta da IA no formato que o frontend espera
            res.status(200).json({ candidates: [{ content: { parts: [{ text: response.text() }] } }] });

        } catch (error) {
            console.error("Erro ao chamar a API Gemini:", error);
            // Retorna um erro em formato JSON, que o frontend pode tratar
            res.status(500).json({ error: "Ocorreu um erro ao processar a sua solicitação." });
        }
    }
);


// --- LÓGICA DO WEBSOCKET ---
let battleQueue = [];
let activeBattles = {};

async function generateBattleQuestion(periodId) {
    const period = musicHistoryData.find(p => p.id === periodId);
    if (!period || !period.composers || period.composers.length === 0) {
        throw new Error("Dados de período inválidos para gerar pergunta.");
    }
    const randomComposer = period.composers[Math.floor(Math.random() * period.composers.length)];
    const correctWork = randomComposer.majorWorks[0] || 'Obra Desconhecida';
    const fakeWorks = ['Sonata ao Luar', 'A Flauta Mágica', 'Sinfonia do Novo Mundo', 'Para Elisa'].filter(w => w !== correctWork);
    const options = [correctWork, ...fakeWorks.slice(0, 3)].sort(() => 0.5 - Math.random());

    return {
        question: `Qual destas obras é de ${randomComposer.name}?`,
        options: options,
        answer: correctWork
    };
}

const endBattle = async (battleId, winnerId, loserId) => {
    const winner = await User.findById(winnerId);
    if (winner) {
        winner.score += 25; // Prémio de 25 pontos
        // Adicionar estatísticas de vitória, etc.
        await winner.save();
    }
    // Lógica para o perdedor, se necessário
    
    io.to(battleId).emit('game_over', { winner: winner.name, prize: 25 });
    delete activeBattles[battleId];
};


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
                players: [
                    { id: p1Socket.id, user: p1Socket.user },
                    { id: p2Socket.id, user: p2Socket.user }
                ],
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
                    console.error("[Socket.IO] Erro ao gerar pergunta:", err);
                    io.to(battleId).emit('battle_error', 'Erro ao gerar pergunta.');
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

        let winnerId, loserId;
        if (p1Score > p2Score) {
            winnerId = p1.user._id;
            loserId = p2.user._id;
        } else if (p2Score > p1Score) {
            winnerId = p2.user._id;
            loserId = p1.user._id;
        } else {
            // Empate: ambos ganham um prémio menor ou ninguém ganha
            io.to(battleId).emit('game_over', { winner: 'Empate', prize: 5 });
            delete activeBattles[battleId];
            return;
        }
        endBattle(battleId, winnerId, loserId);
    });

    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Usuário desconectado: ${socket.id}`);
        battleQueue = battleQueue.filter(s => s.id !== socket.id);
        for (const battleId in activeBattles) {
            const playerIndex = activeBattles[battleId].players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                console.log(`[Socket.IO] Jogador ${socket.user?.name || 'desconhecido'} desconectou da batalha ${battleId}`);
                
                if (socket.user && socket.user.email) {
                    // Lógica de penalidade
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

server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
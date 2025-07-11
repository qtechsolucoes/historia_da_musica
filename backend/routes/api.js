require('dotenv').config();
const express = require('express');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const User = require('../models/User');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Demasiadas requisições deste IP, por favor tente novamente após 15 minutos.'
});

router.use(apiLimiter);

// Rota de Autenticação Atualizada
router.post('/auth/google', async (req, res) => {
    const { token, profile } = req.body;

    try {
        let name, email, picture;

        if (token) {
            // Fluxo original: valida o ID token do Google
            const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
            const payload = ticket.getPayload();
            name = payload.name;
            email = payload.email;
            picture = payload.picture;
        } else if (profile) {
            // Novo fluxo: usa o perfil obtido pelo frontend após login com access_token
            name = profile.name;
            email = profile.email;
            picture = profile.picture;
        } else {
            return res.status(400).json({ error: "Nenhum token ou perfil fornecido." });
        }

        if (!email) {
            return res.status(400).json({ error: "Email não encontrado no perfil." });
        }

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
});

// --- Rotas ---

// Rota de Autenticação
router.post('/auth/google',
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

// Rota de Pontuação
router.post('/score',
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

// Rota de Conquistas
router.post('/achievements',
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

// Rota do Ranking
router.get('/leaderboard', async (req, res) => {
    try {
        const topPlayers = await User.find().sort({ score: -1 }).limit(10);
        res.status(200).json(topPlayers);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar o ranking" });
    }
});

// Rota para a IA Generativa
router.post('/gemini',
    body('prompt').isString().notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const maxRetries = 3;
        let attempt = 0;
        const prompt = req.body.prompt;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

        while (attempt < maxRetries) {
            try {
                console.log(`Tentativa ${attempt + 1} de chamar a API Gemini...`);
                const result = await model.generateContent(prompt);
                const response = result.response;
                const text = await response.text();
                
                // Sucesso! Envia a resposta e sai do loop.
                return res.status(200).json({ candidates: [{ content: { parts: [{ text: text }] } }] });

            } catch (error) {
                attempt++;
                console.error(`Erro na tentativa ${attempt}:`, error.message);

                // Se for um erro 503 e ainda tivermos tentativas...
                if (error.status === 503 && attempt < maxRetries) {
                    // Espera 2 segundos antes de tentar novamente (backoff exponencial)
                    const delay = Math.pow(2, attempt) * 1000;
                    console.log(`Modelo sobrecarregado. Tentando novamente em ${delay / 1000} segundos...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // Se não for um erro 503 ou se esgotaram as tentativas, envia o erro.
                    return res.status(error.status || 500).json({ 
                        error: "Ocorreu um erro ao processar a sua solicitação com a IA.",
                        details: error.message
                    });
                }
            }
        }
    }
);

module.exports = router;
require('dotenv').config();
const express = require('express');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware'); // Importa o middleware de proteção

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

// Rota de Autenticação: Gera um token JWT no login
router.post('/auth/google', async (req, res) => {
    const { profile } = req.body;

    try {
        if (!profile || !profile.email) {
            return res.status(400).json({ error: 'Perfil ou email do Google não fornecido.' });
        }

        const { name, email, picture } = profile;

        let user = await User.findOne({ email: email });

        if (!user) {
            user = new User({ name, email, picture });
            await user.save();
        }

        // Criar o payload do token com o ID do usuário
        const jwtPayload = {
            id: user._id,
            email: user.email,
            name: user.name
        };

        // Assinar e gerar o token
        const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        // Retornar os dados do usuário e o token
        res.status(200).json({ user, token: jwtToken });

    } catch (error) {
        console.error("Erro na autenticação:", error);
        res.status(500).json({ error: 'Falha na autenticação com o Google' });
    }
});

// Rota pública para obter o placar (leaderboard)
router.get('/leaderboard', async (req, res) => {
    try {
        const topUsers = await User.find().sort({ score: -1 }).limit(10);
        res.json(topUsers);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar o placar' });
    }
});

// Rota protegida para atualizar pontuação
router.post('/score', protect, async (req, res) => {
    const { score, statsUpdate } = req.body;
    try {
        // Usa req.user.id injetado pelo middleware 'protect' para segurança
        const user = await User.findById(req.user.id);

        if (user) {
            if (typeof score === 'number') {
                user.score = score;
            }
            if (statsUpdate) {
                if (statsUpdate.correctAnswers) user.stats.correctAnswers = (user.stats.correctAnswers || 0) + statsUpdate.correctAnswers;
                if (statsUpdate.incorrectAnswers) user.stats.incorrectAnswers = (user.stats.incorrectAnswers || 0) + statsUpdate.incorrectAnswers;
                if (statsUpdate.quizzesCompleted) user.stats.quizzesCompleted = (user.stats.quizzesCompleted || 0) + statsUpdate.quizzesCompleted;
            }
            const updatedUser = await user.save();
            res.status(200).json(updatedUser);
        } else {
            res.status(404).json({ error: 'Usuário não encontrado' });
        }
    } catch (error) {
        console.error("Erro ao atualizar pontuação:", error);
        res.status(500).json({ error: 'Erro ao atualizar pontuação' });
    }
});

// Rota protegida para adicionar conquistas
router.post('/achievements', protect, async (req, res) => {
    const { achievement } = req.body;
    try {
        // Usa req.user.id injetado pelo middleware 'protect' para segurança
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { achievements: achievement } }, // $addToSet previne duplicatas
            { new: true }
        );
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ error: 'Usuário não encontrado' });
        }
    } catch (error) {
        console.error("Erro ao adicionar conquista:", error);
        res.status(500).json({ error: 'Erro ao adicionar conquista' });
    }
});

// Rota de proxy para a API do Gemini
router.post('/gemini',
    body('prompt').isString().notEmpty().withMessage('O prompt não pode estar vazio.'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { prompt } = req.body;
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(prompt);
                const response = result.response;
                const text = await response.text();
                
                return res.status(200).json({ candidates: [{ content: { parts: [{ text }] } }] });

            } catch (error) {
                console.error(`Erro na API Gemini (tentativa ${attempt}):`, error.message);

                const isRetryable = error.status === 503 || error.status === 429;
                
                if (isRetryable && attempt < maxRetries) {
                    const delay = Math.pow(2, attempt - 1) * 1000; // Backoff exponencial
                    console.log(`Tentando novamente em ${delay / 1000} segundos...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
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
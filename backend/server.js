require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
const { body, validationResult } = require('express-validator');
const axios = require('axios');

const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const PORT = process.env.PORT || 5001;

// Conectar ao MongoDB
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('Conectado ao MongoDB com sucesso!'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// --- ROTA DE AUTENTICAÇÃO ---
app.post('/api/auth/google',
    body('token').isString().notEmpty().withMessage('O token é obrigatório.'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { token } = req.body;
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const { name, email, picture } = ticket.getPayload();

            let user = await User.findOne({ email });

            if (!user) {
                user = new User({ name, email, picture, score: 0 });
                await user.save();
            }

            res.status(200).json(user);
        } catch (error) {
            console.error("Erro na autenticação do Google:", error);
            res.status(400).json({ error: "Falha na autenticação do Google" });
        }
    }
);

// --- ROTA PARA ATUALIZAR PONTUAÇÃO ---
app.post('/api/score',
    body('email').isEmail().withMessage('Formato de email inválido.').normalizeEmail(),
    body('score').isNumeric().withMessage('A pontuação deve ser um número.'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, score } = req.body;
        try {
            const user = await User.findOneAndUpdate({ email }, { score }, { new: true });
            if (!user) {
                return res.status(404).json({ error: "Usuário não encontrado" });
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: "Erro ao atualizar pontuação" });
        }
    }
);

// --- ROTA PARA O RANKING (LEADERBOARD) ---
app.get('/api/leaderboard', async (req, res) => {
    try {
        const topPlayers = await User.find().sort({ score: -1 }).limit(5);
        res.status(200).json(topPlayers);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar o ranking" });
    }
});

// --- ROTA DE PROXY PARA A API GEMINI ---
app.post('/api/gemini', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "O prompt é obrigatório." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
         return res.status(500).json({ error: "A chave da API Gemini não está configurada no servidor." });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        };

        const geminiResponse = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        res.status(200).json(geminiResponse.data);

    } catch (error) {
        console.error("Erro ao chamar a API Gemini:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Falha ao se comunicar com a API Gemini." });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
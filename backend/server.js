require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');

const User = require('./models/User'); // Vamos criar este arquivo a seguir

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
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { name, email, picture } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (!user) {
            // Se o usuário não existe, cria um novo
            user = new User({ name, email, picture, score: 0 });
            await user.save();
        }

        // Retorna os dados do usuário do banco de dados
        res.status(200).json(user);
    } catch (error) {
        console.error("Erro na autenticação do Google:", error);
        res.status(400).json({ error: "Falha na autenticação do Google" });
    }
});

// --- ROTA PARA ATUALIZAR PONTUAÇÃO ---
app.post('/api/score', async (req, res) => {
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
});

// --- ROTA PARA O RANKING (LEADERBOARD) ---
app.get('/api/leaderboard', async (req, res) => {
    try {
        const topPlayers = await User.find().sort({ score: -1 }).limit(5);
        res.status(200).json(topPlayers);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar o ranking" });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
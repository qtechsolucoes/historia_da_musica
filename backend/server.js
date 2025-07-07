require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

const apiRoutes = require('./routes/api');
const initializeSocketManager = require('./socket/battleManager');

const app = express();
const server = http.createServer(app);

// --- Configuração dos Middlewares ---
app.use(cors());
app.use(express.json());

// --- Configuração da Base de Dados ---
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('Conectado ao MongoDB com sucesso!'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// --- Configuração do Socket.IO ---
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // URL do seu frontend
        methods: ["GET", "POST"]
    }
});

// --- Rotas da Aplicação ---
app.use('/api', apiRoutes);

// --- Inicialização do Gestor de Sockets ---
initializeSocketManager(io);

// --- Inicialização do Servidor ---
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
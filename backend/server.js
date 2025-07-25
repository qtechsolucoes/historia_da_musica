require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

const apiRoutes = require('./routes/api');
const kahootApiRoutes = require('./routes/kahootApi');
const adminApiRoutes = require('./routes/adminApi');
const initializeSocketManager = require('./socket/battleManager');
const initializeKahootManager = require('./socket/kahootManager');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('Conectado ao MongoDB com sucesso!'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

const io = new Server(server, {
    cors: {
        origin: "*", // Alterado para aceitar de qualquer origem, melhor para desenvolvimento em rede
        methods: ["GET", "POST"]
    }
});

app.use('/api', apiRoutes);
app.use('/api/kahoot', kahootApiRoutes);
app.use('/api/admin', adminApiRoutes);

initializeSocketManager(io);
initializeKahootManager(io);

const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0'; // <-- MUDANÇA: Define o host para aceitar conexões externas

// MUDANÇA: Adiciona o HOST ao comando listen
server.listen(PORT, HOST, () => console.log(`Servidor rodando em http://${HOST}:${PORT}`));
require('dotenv').config();
console.log("Ficheiro server.js carregado e a executar.");
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

const apiRoutes = require('./routes/api');
const kahootApiRoutes = require('./routes/kahootApi');
const adminApiRoutes = require('./routes/adminApi'); // 1. Importar a nova rota de admin
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
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use('/api', apiRoutes);
app.use('/api/kahoot', kahootApiRoutes);
console.log("A registar a rota /api/admin...");
app.use('/api/admin', adminApiRoutes); // 2. Usar a nova rota de admin

initializeSocketManager(io);
initializeKahootManager(io);

app.use((req, res, next) => {
    console.log(`ALERTA: Pedido não correspondido recebido -> Método: ${req.method}, URL: ${req.originalUrl}`);
    res.status(404).send(`O servidor não conseguiu encontrar a rota: ${req.method} ${req.originalUrl}`);
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
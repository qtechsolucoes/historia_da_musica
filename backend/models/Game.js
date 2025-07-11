const mongoose = require('mongoose');

// Define a estrutura de um jogador dentro de uma partida.
const playerSchema = new mongoose.Schema({
    socketId: { type: String, required: true },
    nickname: { type: String, required: true },
    score: { type: Number, default: 0 },
});

// Define a estrutura de uma instância de jogo em tempo real.
const gameSchema = new mongoose.Schema({
    // Referência ao template do quiz que está a ser jogado.
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    // Código de acesso único para os jogadores entrarem.
    accessCode: { type: String, required: true, unique: true, index: true },
    hostSocketId: { type: String }, // ID do socket do anfitrião para comunicação direta.
    status: { type: String, enum: ['lobby', 'in_progress', 'finished'], default: 'lobby' },
    currentQuestionIndex: { type: Number, default: -1 },
    players: [playerSchema],
    // Os jogos são automaticamente removidos da base de dados após 6 horas para limpeza.
    createdAt: { type: Date, default: Date.now, expires: '6h' }
});

module.exports = mongoose.model('Game', gameSchema);

const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    socketId: { type: String, required: true },
    nickname: { type: String, required: true },
    score: { type: Number, default: 0 },
});

const gameSchema = new mongoose.Schema({
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    
    // --- NOME PADRONIZADO ---
    accessCode: { type: String, required: true, unique: true, index: true },

    hostSocketId: { type: String },
    status: { type: String, enum: ['lobby', 'in_progress', 'finished'], default: 'lobby' },
    currentQuestionIndex: { type: Number, default: -1 },
    players: [playerSchema],
    createdAt: { type: Date, default: Date.now, expires: '6h' }
});

module.exports = mongoose.model('Game', gameSchema);
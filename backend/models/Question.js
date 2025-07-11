const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswerIndex: { type: Number, required: true },
    period: { type: String, required: true, index: true }, // Ex: 'barroco', 'medieval'
    difficulty: { type: String, enum: ['Fácil', 'Médio', 'Difícil'], default: 'Médio', index: true },
    createdBy: { type: String, default: 'Gemini-AI' },
    createdAt: { type: Date, default: Date.now }
});

// Evita que perguntas exatamente iguais sejam inseridas
questionSchema.index({ text: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Question', questionSchema);
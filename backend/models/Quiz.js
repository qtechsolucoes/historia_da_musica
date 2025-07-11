const mongoose = require('mongoose');

// Define a estrutura de uma única pergunta dentro do quiz.
const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswerIndex: { type: Number, required: true },
    difficulty: { type: String, enum: ['Fácil', 'Médio', 'Difícil'], default: 'Médio' }
});

// Define a estrutura principal do quiz.
const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    periods: [{ type: String, required: true }],
    difficulty: { type: String, enum: ['Fácil', 'Médio', 'Difícil'], default: 'Médio' },
    questionCount: { type: Number, required: true },
    questions: [questionSchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);
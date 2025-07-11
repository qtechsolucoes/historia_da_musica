const mongoose = require('mongoose');

// Define a estrutura de uma única pergunta dentro do quiz.
const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [{ type: String, required: true }], // Array de 2 a 4 strings para as alternativas.
    correctAnswerIndex: { type: Number, required: true }, // O índice da resposta correta no array de opções.
    difficulty: { type: String, enum: ['Fácil', 'Médio', 'Difícil'], default: 'Médio' }
});

// Define a estrutura principal do quiz.
const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    // Referência ao utilizador que criou o quiz (opcional, para futuras expansões).
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    periods: [{ type: String, required: true }], // Ex: ['barroco', 'classico']
    difficulty: { type: String, enum: ['Fácil', 'Médio', 'Difícil'], default: 'Médio' },
    questionCount: { type: Number, required: true },
    questions: [questionSchema], // Array de perguntas.
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);

const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    picture: { type: String },
    score: { type: Number, default: 0 },
    achievements: [achievementSchema],
    stats: {
        quizzesCompleted: { type: Number, default: 0 },
        correctAnswers: { type: Number, default: 0 },
        incorrectAnswers: { type: Number, default: 0 },
        periodsVisited: { type: Map, of: Number, default: {} },
        favoritePeriod: { type: String, default: 'Nenhum' }
    }
});

module.exports = mongoose.model('User', userSchema);
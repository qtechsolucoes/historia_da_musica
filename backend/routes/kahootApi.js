const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Game = require('../models/Game');
const Question = require('../models/Question');

const generateAccessCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

router.post('/create', async (req, res) => {
    const { title, periods, difficulty, questionCount } = req.body;

    try {
        const questions = await Question.aggregate([
            { $match: { period: { $in: periods }, difficulty: difficulty } },
            { $sample: { size: Number(questionCount) } }
        ]);

        if (questions.length < questionCount) {
            return res.status(400).json({ error: `Não há perguntas suficientes (${questions.length}) para os critérios selecionados.` });
        }

        const newQuiz = new Quiz({
            title,
            periods,
            difficulty,
            questionCount,
            questions: questions.map(q => q._id)
        });
        await newQuiz.save();

        // --- NOME PADRONIZADO ---
        const newGame = new Game({
            quiz: newQuiz._id,
            accessCode: generateAccessCode() 
        });
        await newGame.save();

        res.status(201).json({ accessCode: newGame.accessCode, gameId: newGame._id });

    } catch (error) {
        console.error("Erro ao criar o quiz a partir do banco de dados:", error);
        res.status(500).json({ error: "Ocorreu um erro interno ao montar o quiz." });
    }
});

module.exports = router;
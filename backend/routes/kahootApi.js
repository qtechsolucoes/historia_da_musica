const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Game = require('../models/Game');
const Question = require('../models/Question');

const generateAccessCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// ROTA EXISTENTE: Criar quiz a partir do banco de dados
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
            title, periods, difficulty, questionCount,
            questions: questions.map(q => q._id)
        });
        await newQuiz.save();

        const newGame = new Game({ quiz: newQuiz._id, accessCode: generateAccessCode() });
        await newGame.save();

        res.status(201).json({ accessCode: newGame.accessCode, gameId: newGame._id });

    } catch (error) {
        console.error("Erro ao criar o quiz a partir do banco de dados:", error);
        res.status(500).json({ error: "Ocorreu um erro interno ao montar o quiz." });
    }
});


// NOVA ROTA: Criar quiz com perguntas personalizadas
router.post('/create-custom', async (req, res) => {
    // --- ALTERAÇÃO AQUI: Recebendo 'difficulty' do frontend ---
    const { title, period, difficulty, questions } = req.body;

    if (!title || !period || !difficulty || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'Dados inválidos. Título, período, dificuldade e perguntas são obrigatórios.' });
    }

    try {
        const questionDocsToSave = questions.map(q => ({
            text: q.text,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex,
            period: period,
            // --- ALTERAÇÃO AQUI: Usando a dificuldade vinda do formulário ---
            difficulty: difficulty, 
            createdBy: 'user'
        }));
        
        const savedQuestions = await Question.insertMany(questionDocsToSave, { ordered: false }).catch(err => {
            if (err.code === 11000) {
                console.warn("Algumas perguntas personalizadas já existiam e foram ignoradas.");
                return Question.find({ text: { $in: questions.map(q => q.text) } });
            }
            throw err;
        });

        const newQuiz = new Quiz({
            title,
            periods: [period],
            difficulty,
            questionCount: savedQuestions.length,
            questions: savedQuestions.map(q => q._id)
        });
        await newQuiz.save();

        const newGame = new Game({ quiz: newQuiz._id, accessCode: generateAccessCode() });
        await newGame.save();
        
        res.status(201).json({ accessCode: newGame.accessCode, gameId: newGame._id });

    } catch (error) {
        console.error("Erro ao criar o quiz personalizado:", error);
        res.status(500).json({ error: "Ocorreu um erro interno ao criar o seu quiz." });
    }
});

module.exports = router;
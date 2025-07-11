const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Game = require('../models/Game');
const Question = require('../models/Question'); // Importamos o nosso banco de questões

const generateAccessCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Rota para criar um jogo a partir do nosso banco de dados
router.post('/create', async (req, res) => {
    const { title, periods, difficulty, questionCount } = req.body;

    try {
        // 1. Buscar perguntas aleatórias do nosso banco de dados
        //    - $match: Filtra as perguntas pelos períodos e dificuldade selecionados.
        //    - $sample: Pega uma amostra aleatória do tamanho especificado.
        const questions = await Question.aggregate([
            { $match: { period: { $in: periods }, difficulty: difficulty } },
            { $sample: { size: Number(questionCount) } }
        ]);

        // Verifica se encontrámos perguntas suficientes
        if (questions.length < questionCount) {
            return res.status(400).json({ error: `Não há perguntas suficientes (${questions.length}) para os critérios selecionados. Tente com menos perguntas ou popule mais o banco de dados.` });
        }

        // 2. Cria um "template" de quiz para este jogo específico
        const newQuiz = new Quiz({
            title,
            periods,
            difficulty,
            questionCount,
            questions: questions // Usa as perguntas que buscámos do nosso banco
        });
        await newQuiz.save();

        // 3. Cria a instância do jogo com um código de acesso
        const newGame = new Game({
            quiz: newQuiz._id,
            accessCode: generateAccessCode()
        });
        await newGame.save();

        // 4. Retorna o código de acesso para o frontend
        res.status(201).json({ accessCode: newGame.accessCode, gameId: newGame._id });

    } catch (error) {
        console.error("Erro ao criar o quiz a partir do banco de dados:", error);
        res.status(500).json({ error: "Ocorreu um erro interno ao montar o quiz." });
    }
});

module.exports = router;
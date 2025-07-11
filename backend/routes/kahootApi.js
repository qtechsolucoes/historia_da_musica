const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Game = require('../models/Game');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { musicHistoryData } = require('../data.js');

// Inicializa a IA Generativa com a sua chave de API.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Função auxiliar para gerar um código de acesso único e aleatório.
const generateAccessCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

/**
 * Rota POST /api/kahoot/create
 * Responsável por criar um novo quiz e uma nova instância de jogo.
 */
router.post('/create', async (req, res) => {
    const { title, periods, difficulty, questionCount } = req.body;

    try {
        // --- Geração de Questões com a IA do Gemini ---
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            Crie um quiz de história da música com ${questionCount} perguntas.
            O quiz deve focar nos seguintes períodos: ${periods.join(', ')}.
            A dificuldade geral deve ser: ${difficulty}.
            Para cada pergunta, forneça o texto, 4 opções de resposta e o índice da resposta correta.
            Responda APENAS com um array de objetos JSON válido, seguindo este formato:
            [
                {"text": "Qual destes compositores é do período Barroco?", "options": ["Mozart", "Bach", "Chopin", "Debussy"], "correctAnswerIndex": 1},
                {"text": "A 'Sagração da Primavera' foi composta por qual compositor?", "options": ["Stravinsky", "Schoenberg", "Bartók", "Vivaldi"], "correctAnswerIndex": 0}
            ]
        `;

        const result = await model.generateContent(prompt);
        const responseText = await result.response.text();
        
        // Limpa e analisa a resposta JSON da IA.
        const cleanedJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const generatedQuestions = JSON.parse(cleanedJsonString);

        if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
            throw new Error("A IA não gerou perguntas no formato esperado.");
        }

        // Cria e guarda o novo template de quiz na base de dados.
        const newQuiz = new Quiz({
            title,
            periods,
            difficulty,
            questionCount,
            questions: generatedQuestions
        });
        await newQuiz.save();

        // Cria uma nova instância de jogo com um código de acesso.
        const newGame = new Game({
            quiz: newQuiz._id,
            accessCode: generateAccessCode()
        });
        await newGame.save();

        // Retorna o código de acesso para o frontend.
        res.status(201).json({ accessCode: newGame.accessCode, gameId: newGame._id });

    } catch (error) {
        console.error("Erro ao criar o quiz:", error);
        res.status(500).json({ error: "Ocorreu um erro ao gerar as perguntas com a IA. Por favor, tente novamente." });
    }
});

module.exports = router;
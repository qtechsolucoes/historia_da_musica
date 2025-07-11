// Ficheiro: backend/routes/kahootApi.js

const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Game = require('../models/Game');
const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
    throw new Error("A variável de ambiente GEMINI_API_KEY não foi definida. Verifique o seu ficheiro .env no backend.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateAccessCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

router.post('/create', async (req, res) => {
    const { title, periods, difficulty, questionCount } = req.body;

    try {
        console.log("A iniciar a criação de quiz com a IA...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            Crie um quiz de história da música com ${questionCount} perguntas.
            O quiz deve focar nos seguintes períodos: ${periods.join(', ')}.
            A dificuldade geral deve ser: ${difficulty}.
            Para cada pergunta, forneça o texto da pergunta, 4 opções de resposta (como um array de strings) e o índice da resposta correta (de 0 a 3).
            Responda APENAS com um array de objetos JSON válido, seguindo este formato:
            [
                {"text": "Qual destes compositores é do período Barroco?", "options": ["Mozart", "Bach", "Chopin", "Debussy"], "correctAnswerIndex": 1},
                {"text": "A 'Sagração da Primavera' foi composta por qual compositor?", "options": ["Stravinsky", "Schoenberg", "Bartók", "Vivaldi"], "correctAnswerIndex": 0}
            ]
        `;

        const result = await model.generateContent(prompt);
        const responseText = await result.response.text();
        
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error("A IA não retornou um array JSON válido.");
        }
        
        const jsonString = jsonMatch[0];
        const generatedQuestions = JSON.parse(jsonString);

        if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
            throw new Error("A IA não gerou perguntas no formato esperado.");
        }

        const newQuiz = new Quiz({
            title,
            periods,
            difficulty,
            questionCount,
            questions: generatedQuestions
        });
        await newQuiz.save();

        const newGame = new Game({
            quiz: newQuiz._id,
            accessCode: generateAccessCode()
        });
        await newGame.save();

        console.log(`Quiz "${title}" criado com sucesso. Código de acesso: ${newGame.accessCode}`);
        res.status(201).json({ accessCode: newGame.accessCode, gameId: newGame._id });

    } catch (error) {
        // --- TRATAMENTO DE ERRO APRIMORADO ---
        console.error("--- ERRO DETALHADO AO CRIAR O QUIZ ---");
        console.error(error.message); // Log mais limpo
        console.error("--------------------------------------");

        // Se o erro for de sobrecarga da API, envia uma mensagem específica
        if (error.message && error.message.includes('503 Service Unavailable')) {
            return res.status(503).json({ error: "O serviço de IA está sobrecarregado. Por favor, tente novamente em alguns momentos." });
        }
        
        // Para outros erros, envia uma mensagem genérica
        res.status(500).json({ error: "Ocorreu um erro ao gerar as perguntas com a IA. Por favor, tente novamente." });
    }
});

module.exports = router;
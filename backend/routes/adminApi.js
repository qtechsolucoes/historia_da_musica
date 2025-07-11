const express = require('express');
const router = express.Router();
const Question = require('../models/Question'); // O nosso novo modelo
const { GoogleGenerativeAI } = require("@google/generative-ai");

console.log("Ficheiro adminApi.js foi carregado com sucesso!");
router.get('/test', (req, res) => {
    console.log("SUCESSO! A rota GET /api/admin/test foi acedida!");
    res.status(200).send("A rota de administração está a funcionar!");
});

if (!process.env.GEMINI_API_KEY) {
    throw new Error("A variável de ambiente GEMINI_API_KEY não foi definida.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Rota para popular o banco de dados
// Ex: POST /api/admin/populate-questions
router.post('/populate-questions', async (req, res) => {
    const { period, difficulty, count } = req.body;

    if (!period || !difficulty || !count) {
        return res.status(400).json({ error: 'Período, dificuldade e quantidade são obrigatórios.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            Crie um lote de ${count} perguntas de história da música para um quiz.
            As perguntas devem ser EXCLUSIVAMENTE sobre o período: ${period}.
            A dificuldade geral deve ser: ${difficulty}.
            Para cada pergunta, forneça o texto, 4 opções de resposta e o índice da resposta correta.
            Responda APENAS com um array de objetos JSON válido, seguindo este formato:
            [
                {"text": "Qual o principal instrumento de teclado do período Barroco?", "options": ["Piano", "Cravo", "Órgão Portativo", "Clavicórdio"], "correctAnswerIndex": 1},
                {"text": "Quem compôs 'As Quatro Estações'?", "options": ["Bach", "Handel", "Vivaldi", "Corelli"], "correctAnswerIndex": 2}
            ]
        `;

        const result = await model.generateContent(prompt);
        const responseText = await result.response.text();

        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error("A IA não retornou um array JSON válido.");
        }
        
        const generatedQuestions = JSON.parse(jsonMatch[0]);

        let questionsToSave = generatedQuestions.map(q => ({
            ...q,
            period: period,
            difficulty: difficulty,
        }));

        // Insere as perguntas, ignorando duplicados (com base no índice que criamos no modelo)
        const inserted = await Question.insertMany(questionsToSave, { ordered: false });

        res.status(201).json({ message: `${inserted.length} novas perguntas foram adicionadas com sucesso ao banco de dados para o período ${period}.` });

    } catch (error) {
        // Se o erro for de chaves duplicadas, significa que a IA gerou perguntas repetidas.
        if (error.code === 11000) {
            return res.status(200).json({ message: "Tentativa de inserção concluída. Algumas perguntas geradas pela IA já existiam e foram ignoradas." });
        }
        console.error("Erro ao popular o banco de dados:", error);
        res.status(500).json({ error: "Ocorreu um erro ao comunicar com a IA." });
    }
});

module.exports = router;
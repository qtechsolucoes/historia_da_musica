const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
    throw new Error("A variável de ambiente GEMINI_API_KEY não foi definida.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let jobQueue = [];
let isWorkerRunning = false;

async function processQueue() {
    if (jobQueue.length === 0) {
        console.log("Fila de tarefas concluída. O trabalhador vai dormir.");
        isWorkerRunning = false;
        return;
    }

    isWorkerRunning = true;
    const job = jobQueue.shift();

    console.log(`--- A iniciar tarefa: Gerar ${job.count} perguntas para [${job.period} / ${job.difficulty}] ---`);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            Crie um lote de ${job.count} perguntas de história da música para um quiz.
            As perguntas devem ser EXCLUSIVAMENTE sobre o período: ${job.period}.
            A dificuldade geral deve ser: ${job.difficulty}.
            Para cada pergunta, forneça o texto, 4 opções de resposta e o índice da resposta correta.
            Responda APENAS com um array de objetos JSON válido.
        `;

        const result = await model.generateContent(prompt);
        let responseText = await result.response.text();

        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("A IA não retornou um JSON válido.");
        
        let jsonString = jsonMatch[0];

        // --- NOVA LÓGICA DE LIMPEZA ---
        // Tenta corrigir aspas não escapadas dentro dos valores das chaves, que é um erro comum da IA.
        // Isto transforma "key": "valor com "aspas" internas" em "key": "valor com \\"aspas\\" internas"
        jsonString = jsonString.replace(/:\s*"(.*?)"/g, (match, group1) => {
            const cleanedValue = group1.replace(/"/g, '\\"');
            return `: "${cleanedValue}"`;
        });
        
        const generatedQuestions = JSON.parse(jsonString);

        const questionsToSave = generatedQuestions.map(q => ({ ...q, period: job.period, difficulty: job.difficulty }));
        
        await Question.insertMany(questionsToSave, { ordered: false });

        console.log(`✅ SUCESSO: Tarefa concluída. Perguntas para [${job.period} / ${job.difficulty}] foram adicionadas.`);

    } catch (error) {
        if (error.code === 11000) {
            console.warn(`⚠️ AVISO: A tarefa para [${job.period} / ${job.difficulty}] gerou perguntas duplicadas que já existiam.`);
        } else {
            console.error(`❌ ERRO: A tarefa para [${job.period} / ${job.difficulty}] falhou.`, error.message);
        }
    }

    setTimeout(processQueue, 20000); 
}

router.post('/schedule-population', (req, res) => {
    const { jobs } = req.body;

    if (!Array.isArray(jobs) || jobs.length === 0) {
        return res.status(400).json({ error: 'O corpo da requisição deve conter um array de "jobs".' });
    }

    jobQueue.push(...jobs);

    if (!isWorkerRunning) {
        processQueue();
    }

    res.status(202).json({ 
        message: `${jobs.length} tarefa(s) adicionada(s) à fila. O banco de dados será populado em segundo plano.`,
        jobsInQueue: jobQueue.length,
        isWorkerActive: isWorkerRunning
    });
});

module.exports = router;
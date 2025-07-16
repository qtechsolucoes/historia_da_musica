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

// Função aprimorada para extrair e limpar o JSON
function extractAndParseJson(text) {
    // 1. Encontra o início e o fim do array JSON
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');

    if (startIndex === -1 || endIndex === -1) {
        throw new Error("A IA não retornou um array JSON válido (delimitadores `[` ou `]` não encontrados).");
    }

    let jsonString = text.substring(startIndex, endIndex + 1);

    // 2. Tenta fazer o parse diretamente
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        // 3. Se falhar, tenta corrigir problemas comuns (como vírgulas extras no final) e tenta novamente
        console.warn("AVISO: JSON inicial malformado, a tentar corrigir...");
        
        // Remove vírgulas extras antes de fechar colchetes ou chaves
        jsonString = jsonString.replace(/,\s*(\]|\})/g, '$1');
        
        try {
            return JSON.parse(jsonString);
        } catch (finalError) {
            console.error("ERRO FINAL: Não foi possível fazer o parse do JSON mesmo após a tentativa de correção.", finalError.message);
            console.error("JSON problemático:", jsonString);
            throw new Error("Falha ao fazer o parse da resposta da IA após a correção.");
        }
    }
}


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
            Responda APENAS com um array de objetos JSON válido, sem nenhum texto introdutório ou final.
            Certifique-se de que todas as strings dentro do JSON estão devidamente escapadas.
        `;

        const result = await model.generateContent(prompt);
        let responseText = await result.response.text();
        
        // Usa a nova função robusta para extrair e fazer o parse do JSON
        const generatedQuestions = extractAndParseJson(responseText);

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

    // Aumenta o intervalo para dar mais tempo à API e evitar sobrecarga
    setTimeout(processQueue, 25000); 
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
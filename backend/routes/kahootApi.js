const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Game = require('../models/Game');
const Question = require('../models/Question');

const generateAccessCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Rota de criação de Quiz atualizada para aceitar perguntas do usuário
router.post('/create', async (req, res) => {
    const { title, periods, difficulty, questionCount, questionSource, questions: manualQuestions } = req.body;

    try {
        let questionIds = [];

        // --- LÓGICA CONDICIONAL ADICIONADA ---
        if (questionSource === 'manual') {
            // Se o usuário enviou as próprias perguntas
            if (!manualQuestions || manualQuestions.length === 0) {
                return res.status(400).json({ error: "Nenhuma pergunta foi enviada para o modo de criação manual." });
            }

            // Mapeia as perguntas do usuário para o schema do banco, adicionando período e dificuldade
            const questionsToSave = manualQuestions.map(q => ({
                ...q,
                period: periods[0] || 'geral', // Associa ao primeiro período selecionado ou um geral
                difficulty: difficulty,
                createdBy: 'user', // Identifica a origem da pergunta
            }));
            
            // Insere as novas perguntas no banco de dados. 'ordered: false' continua mesmo se houver duplicatas.
            // O 'catch' lida com erros de duplicidade, evitando que o quiz deixe de ser criado.
            const insertedQuestions = await Question.insertMany(questionsToSave, { ordered: false }).catch(err => {
                if (err.code === 11000) { // Código de erro para chave duplicada
                    console.log("Aviso: Tentativa de inserir perguntas duplicadas. Elas serão ignoradas.");
                    // Retorna apenas os documentos que foram inseridos com sucesso
                    return err.result.ops.filter(op => !err.writeErrors.some(we => we.op._id === op._id));
                }
                throw err; // Lança outros erros
            });

            // Precisamos encontrar os IDs de todas as perguntas, tanto as novas quanto as que já existiam
            const questionTexts = questionsToSave.map(q => q.text);
            const existingQuestions = await Question.find({ text: { $in: questionTexts }, period: periods[0] || 'geral' });
            
            questionIds = existingQuestions.map(q => q._id);

        } else {
            // Lógica original: buscar perguntas aleatórias do banco de dados
            const questions = await Question.aggregate([
                { $match: { period: { $in: periods }, difficulty: difficulty } },
                { $sample: { size: Number(questionCount) } }
            ]);

            if (questions.length < questionCount) {
                return res.status(400).json({ error: `Não há perguntas suficientes (${questions.length}) para os critérios selecionados.` });
            }
            questionIds = questions.map(q => q._id);
        }
        // --- FIM DA LÓGICA CONDICIONAL ---

        if (questionIds.length === 0) {
            return res.status(400).json({ error: 'Nenhuma pergunta foi encontrada ou criada para este quiz.' });
        }
        
        const newQuiz = new Quiz({
            title,
            periods,
            difficulty,
            questionCount: questionIds.length,
            questions: questionIds
        });
        await newQuiz.save();

        const newGame = new Game({
            quiz: newQuiz._id,
            accessCode: generateAccessCode() 
        });
        await newGame.save();

        res.status(201).json({ accessCode: newGame.accessCode, gameId: newGame._id });

    } catch (error) {
        console.error("Erro ao criar o quiz:", error);
        res.status(500).json({ error: "Ocorreu um erro interno ao montar o quiz." });
    }
});

module.exports = router;
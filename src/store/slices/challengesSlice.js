import { musicHistoryData } from '../../data/index.js';
// <-- MUDANÇA: Importa o nosso novo serviço de API
import apiService from '../../services/api';

// --- Funções Auxiliares dos Desafios ---
const romanToDecimal = (roman) => {
    const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let result = 0;
    for (let i = 0; i < roman.length; i++) {
        const current = map[roman[i].toUpperCase()];
        const next = map[roman[i + 1]?.toUpperCase()];
        if (next && current < next) {
            result -= current;
        } else {
            result += current;
        }
    }
    return result;
};

const getBirthYear = (lifespan) => {
    if (!lifespan) return Infinity;
    let match = lifespan.match(/\d{3,4}/);
    if (match) {
        return parseInt(match[0], 10);
    }
    match = lifespan.match(/séc\.\s*([IVXLCDM]+)/i);
    if (match && match[1]) {
        const century = romanToDecimal(match[1]);
        if (century > 0) {
            return (century - 1) * 100 + 1;
        }
    }
    return Infinity;
};

const createQuestionPrompt = (composerName, periodName) => `Aja como um professor de história da música. Crie uma pergunta de múltipla escolha sobre a biografia ou uma obra importante do compositor ${composerName}, que pertence ao período da ${periodName}. A pergunta deve ser clara e direta. As opções devem ser variadas em conteúdo e estilo, mas todas relacionadas ao tema. O texto deve ser escrito em português do Brasil.

Formato Exigido (use ;; como separador entre as opções):
PERGUNTA: [Texto da pergunta aqui]
OPÇÕES: A. [Opção A];;B. [Opção B];;C. [Opção C];;D. [Opção D]
RESPOSTA: [Apenas a LETRA da opção correta. Ex: C]

Responda em português do Brasil.`;


export const createChallengesSlice = (set, get) => ({
    quiz: { question: '', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null },
    whoAmI: { description: '', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null },
    timeline: { items: [], correctOrder: [], feedback: '', isLoading: false, isChecked: false },
    fromWhichPeriod: { description: '', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null },
    survival: {
        isActive: false,
        lives: 3,
        score: 0,
        question: null,
        questionType: null,
        isGameOver: false,
        isLoading: false,
    },

    handleCorrectAnswer: (playCorrectSound) => {
        playCorrectSound();
        const { score, stats, selectedPeriodId, updateScoreAndStats, checkAndAwardAchievement } = get();
        
        const newScore = score + 15;
        const newStats = {
            ...stats,
            quizzesCompleted: (stats.quizzesCompleted || 0) + 1,
            correctAnswers: (stats.correctAnswers || 0) + 1,
            periodsVisited: {
                ...(stats.periodsVisited || {}),
                [selectedPeriodId]: ((stats.periodsVisited && stats.periodsVisited[selectedPeriodId]) || 0) + 1,
            }
        };
        set({ score: newScore, stats: newStats });

        updateScoreAndStats(newScore, { correctAnswers: 1, quizzesCompleted: 1 });
        
        const currentPeriodCorrectAnswers = newStats.periodsVisited[selectedPeriodId];
        if (selectedPeriodId === 'medieval' && currentPeriodCorrectAnswers >= 10) {
             const MESTRE_MEDIEVAL = { name: "Mestre Medieval", description: "Acerte 10 perguntas do período Medieval." };
             checkAndAwardAchievement(MESTRE_MEDIEVAL);
        }
    },

    handleIncorrectAnswer: (playIncorrectSound) => {
        playIncorrectSound();
        const { score, stats, updateScoreAndStats } = get();
        const incorrectCount = (stats.incorrectAnswers || 0) + 1;
        set({ stats: { ...stats, incorrectAnswers: incorrectCount } });
        updateScoreAndStats(score, { incorrectAnswers: 1 });
    },

    handleGenerateQuiz: async (returnOnly = false) => {
        const stateUpdater = (newState) => returnOnly ? {} : set(prev => ({ quiz: { ...prev.quiz, ...newState } }));
        stateUpdater({ isLoading: true, feedback: '', guessedOption: null });

        const { selectedPeriodId } = get();
        const targetPeriod = returnOnly ? musicHistoryData[Math.floor(Math.random() * musicHistoryData.length)] : musicHistoryData.find(p => p.id === selectedPeriodId);

        if (!targetPeriod.composers || targetPeriod.composers.length === 0) {
            const errorState = { question: 'Não há compositores disponíveis neste período.', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null };
            stateUpdater(errorState);
            if (returnOnly) return { ...errorState, text: errorState.question };
            return;
        }
        
        const randomComposer = targetPeriod.composers[Math.floor(Math.random() * targetPeriod.composers.length)];
        const prompt = createQuestionPrompt(randomComposer.name, targetPeriod.name);

        try {
            // <-- MUDANÇA: Usa a função do serviço de API
            const result = await apiService.generateGeminiContent(prompt);
            const text = result.candidates[0]?.content?.parts[0]?.text;

            const lines = text.split('\n');
            const questionText = lines.find(l => l.startsWith('PERGUNTA:'))?.replace('PERGUNTA:', '').trim();
            const optionsText = lines.find(l => l.startsWith('OPÇÕES:'))?.replace('OPÇÕES:', '').trim();
            const answerLetter = lines.find(l => l.startsWith('RESPOSTA:'))?.replace('RESPOSTA:', '').trim().toUpperCase();

            if (questionText && optionsText && answerLetter) {
                const options = optionsText.split(';;').map(opt => opt.replace(/^[A-D]\.\s*/, '').trim());
                const answer = options.find((opt, index) => 'ABCD'[index] === answerLetter);

                if (options.length === 4 && answer) {
                    const newQuestionData = { text: questionText, options, answer, feedback: undefined, guessedOption: null };
                    stateUpdater({ ...newQuestionData, question: questionText, isLoading: false });
                    if (returnOnly) return newQuestionData;
                } else { throw new Error("Dados da API inválidos (opções ou resposta)."); }
            } else { throw new Error("Formato de resposta da API inválido."); }
        } catch (error) {
            console.error("Erro ao gerar desafio:", error);
            const errorState = { question: 'Não foi possível criar a pergunta. Tente novamente.', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null };
            stateUpdater(errorState);
            if (returnOnly) return { ...errorState, text: errorState.question };
        }
    },

    handleQuizGuess: (guess, sounds) => {
        const { quiz, handleCorrectAnswer, handleIncorrectAnswer } = get();
        const isCorrect = quiz.answer.trim().toLowerCase() === guess.trim().toLowerCase();
        let feedbackMessage = isCorrect ? 'Correto! Você conhece a história.' : `Incorreto. A resposta correta era: ${quiz.answer}`;
        isCorrect ? handleCorrectAnswer(sounds.correct) : handleIncorrectAnswer(sounds.incorrect);
        set(state => ({ quiz: { ...state.quiz, feedback: feedbackMessage, guessedOption: guess } }));
    },

    handleGenerateWhoAmI: async (returnOnly = false) => {
        const stateUpdater = (newState) => returnOnly ? {} : set(prev => ({ whoAmI: { ...prev.whoAmI, ...newState } }));
        stateUpdater({ isLoading: true, feedback: '', guessedOption: null });

        const { selectedPeriodId } = get();
        const targetPeriod = returnOnly ? musicHistoryData[Math.floor(Math.random() * musicHistoryData.length)] : musicHistoryData.find(p => p.id === selectedPeriodId);

        if (!targetPeriod.composers || targetPeriod.composers.length < 4) {
             const errorState = { isLoading: false, description: "Este período não tem compositores suficientes."};
             stateUpdater(errorState);
             if (returnOnly) return { ...errorState, text: errorState.description };
             return;
        }
        let randomComposers = [...targetPeriod.composers].sort(() => 0.5 - Math.random()).slice(0, 4);
        const correctComposer = randomComposers[0];
        const prompt = `Crie uma descrição curta e enigmática para o desafio "Quem sou eu?" sobre o compositor ${correctComposer.name}. A descrição deve ter de 2 a 3 frases, destacando uma característica única, uma obra famosa ou um fato curioso de sua vida, sem mencionar o nome. Deve ser um desafio para um estudante de música. Responda apenas com a descrição, em português do Brasil.`;
        
        try {
            // <-- MUDANÇA: Usa a função do serviço de API
            const result = await apiService.generateGeminiContent(prompt);
            const description = result.candidates[0]?.content?.parts[0]?.text;

            if(description){
                const newQuestionData = {
                    text: description.trim(),
                    options: randomComposers.map(c => c.name).sort(() => 0.5 - Math.random()),
                    answer: correctComposer.name,
                    feedback: undefined, guessedOption: null
                };
                stateUpdater({ ...newQuestionData, description: newQuestionData.text, isLoading: false });
                if(returnOnly) return newQuestionData;
            } else { throw new Error("API não retornou descrição."); }
        } catch (error) {
            console.error("Erro ao gerar 'Quem sou eu?':", error);
            const errorState = { isLoading: false, description: "Não foi possível criar o desafio. Tente novamente." };
            stateUpdater(errorState);
            if(returnOnly) return { ...errorState, text: errorState.description };
        }
    },
    
    handleWhoAmIGuess: (guess, sounds) => {
        const { whoAmI, handleCorrectAnswer, handleIncorrectAnswer } = get();
        const isCorrect = guess === whoAmI.answer;
        let feedbackMessage = isCorrect ? 'Correto! Você desvendou o enigma.' : `Errado! O compositor era ${whoAmI.answer}.`;
        isCorrect ? handleCorrectAnswer(sounds.correct) : handleIncorrectAnswer(sounds.incorrect);
        set(state => ({ whoAmI: { ...state.whoAmI, feedback: feedbackMessage, guessedOption: guess } }));
    },

    handleGenerateTimeline: () => {
        const { selectedPeriodId } = get();
        const selectedPeriod = musicHistoryData.find(p => p.id === selectedPeriodId);
        set({ timeline: { items: [], correctOrder: [], feedback: '', isLoading: true, isChecked: false } });
        if (!selectedPeriod.composers || selectedPeriod.composers.length < 4) {
            set({ timeline: { isLoading: false, feedback: "Não há compositores suficientes para este desafio.", items: [], correctOrder: [] } });
            return;
        }
        const randomComposers = [...selectedPeriod.composers].sort(() => 0.5 - Math.random()).slice(0, 4);
        const correctOrder = [...randomComposers].sort((a, b) => getBirthYear(a.lifespan) - getBirthYear(b.lifespan)).map(c => c.name);
        const shuffledItems = [...randomComposers].map(c => ({ name: c.name, lifespan: c.lifespan })).sort(() => 0.5 - Math.random());
            
        set({ timeline: { items: shuffledItems, correctOrder, feedback: '', isLoading: false, isChecked: false } });
    },

    setTimelineItems: (items) => set(state => ({ timeline: { ...state.timeline, items } })),

    handleCheckTimeline: (userOrder, sounds) => {
        const { timeline, handleCorrectAnswer, handleIncorrectAnswer } = get();
        const isOrderCorrect = userOrder.every((item, index) => item.name === timeline.correctOrder[index]);
        if (isOrderCorrect) {
            handleCorrectAnswer(sounds.correct);
            set(state => ({ timeline: { ...state.timeline, feedback: 'Perfeito! A ordem está correta.', isChecked: true } }));
        } else {
            handleIncorrectAnswer(sounds.incorrect);
            set(state => ({ timeline: { ...state.timeline, feedback: 'Quase lá! Itens na posição correta estão em verde.', isChecked: true } }));
        }
    },

    handleGenerateFromWhichPeriod: async (returnOnly = false) => {
        const stateUpdater = (newState) => returnOnly ? {} : set(prev => ({ fromWhichPeriod: { ...prev.fromWhichPeriod, ...newState } }));
        stateUpdater({ isLoading: true, feedback: '', guessedOption: null });

        const randomPeriod = musicHistoryData[Math.floor(Math.random() * musicHistoryData.length)];
        const periodName = randomPeriod.name;
        const prompt = `Aja como um historiador da música criando um desafio. Gere uma descrição de 2 a 3 frases sobre uma característica, obra, compositor ou instrumento marcante do período da "${periodName}". A descrição deve ser enigmática, sem mencionar o nome do período. O objetivo é que o jogador adivinhe o período. Responda apenas com a descrição, em português do Brasil.`;
    
        try {
            // <-- MUDANÇA: Usa a função do serviço de API
            const result = await apiService.generateGeminiContent(prompt);
            const description = result.candidates[0]?.content?.parts[0]?.text;

            if (description) {
                const newQuestionData = {
                    text: description.trim(),
                    options: musicHistoryData.map(p => p.name).sort(() => 0.5 - Math.random()), 
                    answer: periodName,
                    feedback: undefined, guessedOption: null
                };
                stateUpdater({ ...newQuestionData, description: newQuestionData.text, isLoading: false });
                if(returnOnly) return newQuestionData;
            } else { throw new Error("A API não retornou uma descrição."); }
        } catch (error) {
            console.error("Erro ao gerar 'De Que Período?':", error);
            const errorState = { isLoading: false, description: "Não foi possível criar o desafio. Tente novamente." };
            stateUpdater(errorState);
            if(returnOnly) return { ...errorState, text: errorState.description };
        }
    },

    handleFromWhichPeriodGuess: (guess, sounds) => {
        const { fromWhichPeriod, handleCorrectAnswer, handleIncorrectAnswer } = get();
        const isCorrect = guess === fromWhichPeriod.answer;
        let feedbackMessage = isCorrect ? 'Correto! Você sabe identificar as eras da música.' : `Incorreto. A resposta correta era: ${fromWhichPeriod.answer}.`;
        isCorrect ? handleCorrectAnswer(sounds.correct) : handleIncorrectAnswer(sounds.incorrect);
        set(state => ({ fromWhichPeriod: { ...state.fromWhichPeriod, feedback: feedbackMessage, guessedOption: guess } }));
    },

    handleStartSurvival: () => {
        set({
            activeChallenge: 'survival',
            survival: {
                isActive: true,
                lives: 3,
                score: 0,
                question: null,
                questionType: null,
                isGameOver: false,
                isLoading: false,
            }
        });
        get().generateSurvivalQuestion();
    },

    generateSurvivalQuestion: async () => {
        set(state => ({ survival: { ...state.survival, isLoading: true, question: null } }));
        const challengeTypes = ['quiz', 'whoami', 'fromWhichPeriod'];
        const randomType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

        let questionData = null;
        switch (randomType) {
            case 'quiz':
                questionData = await get().handleGenerateQuiz(true);
                break;
            case 'whoami':
                questionData = await get().handleGenerateWhoAmI(true);
                break;
            case 'fromWhichPeriod':
                questionData = await get().handleGenerateFromWhichPeriod(true);
                break;
        }
        
        set(state => ({
            survival: {
                ...state.survival,
                question: questionData,
                questionType: randomType,
                isLoading: false
            }
        }));
    },

    handleSurvivalAnswer: (guess, sounds) => {
        const { survival } = get();
        if (!survival.question || survival.question.feedback !== undefined) return;
        
        const isCorrect = guess.trim().toLowerCase() === survival.question.answer.trim().toLowerCase();

        set(state => ({ survival: { ...state.survival, question: { ...state.survival.question, feedback: isCorrect, guessedOption: guess } } }));
        
        if (isCorrect) {
            sounds.correct();
            set(state => ({ survival: { ...state.survival, score: state.survival.score + 10 } }));
            setTimeout(() => get().generateSurvivalQuestion(), 1200);
        } else {
            sounds.incorrect();
            const newLives = survival.lives - 1;
            setTimeout(() => {
                if (newLives > 0) {
                    set(state => ({ survival: { ...state.survival, lives: newLives } }));
                    get().generateSurvivalQuestion();
                } else {
                    set(state => ({ survival: { ...state.survival, lives: 0, isActive: false, isGameOver: true } }));
                }
            }, 1200);
        }
    },
});
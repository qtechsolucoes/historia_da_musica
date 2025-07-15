import { useState, useEffect, useRef, useMemo } from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import { musicHistoryData } from '../data/musicHistoryData';

const backendUrl = 'http://localhost:5001';

const ALL_ACHIEVEMENTS = {
    MESTRE_MEDIEVAL: { name: "Mestre Medieval", description: "Acerte 10 perguntas do período Medieval." },
    VIAJANTE_DO_TEMPO: { name: "Viajante do Tempo", description: "Visite todos os 5 períodos musicais." },
    POLIGLOTA_MUSICAL: { name: "Poliglota Musical", description: "Complete desafios em 3 períodos diferentes." }
};

// --- FUNÇÃO CORRIGIDA ---
// Esta nova versão agora consegue interpretar algarismos romanos para os séculos.
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

    // 1. Tenta encontrar um ano com 3 ou 4 dígitos primeiro
    let match = lifespan.match(/\d{3,4}/);
    if (match) {
        return parseInt(match[0], 10);
    }

    // 2. Se não encontrar, procura pelo padrão "séc. [ALGARISMO ROMANO]"
    match = lifespan.match(/séc\.\s*([IVXLCDM]+)/i);
    if (match && match[1]) {
        const century = romanToDecimal(match[1]);
        // Retorna o ano de início do século para a ordenação (ex: séc. XII -> 1101)
        if (century > 0) {
            return (century - 1) * 100 + 1;
        }
    }

    return Infinity; // Fallback se nenhum ano válido for encontrado
};


export const useMusicApp = () => {
    const [selectedPeriodId, setSelectedPeriodId] = useState('medieval');
    const [modalContent, setModalContent] = useState(null);
    const [activeChallenge, setActiveChallenge] = useState(null);
    
    const [quiz, setQuiz] = useState({ question: '', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null });
    const [whoAmI, setWhoAmI] = useState({ description: '', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null });
    const [timeline, setTimeline] = useState({ items: [], correctOrder: [], feedback: '', isLoading: false, isChecked: false });
    const [fromWhichPeriod, setFromWhichPeriod] = useState({ description: '', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null });

    const [survival, setSurvival] = useState({
        isActive: false,
        lives: 3,
        score: 0,
        question: null,
        questionType: null,
        isGameOver: false,
        isLoading: false,
    });

    const [currentUser, setCurrentUser] = useState(null);
    const [score, setScore] = useState(0);
    const [leaderboard, setLeaderboard] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [stats, setStats] = useState({});
    const [lastAchievement, setLastAchievement] = useState(null);

    const correctSoundRef = useRef(null);
    const incorrectSoundRef = useRef(null);

    const selectedPeriod = useMemo(() => musicHistoryData.find(p => p.id === selectedPeriodId), [selectedPeriodId]);

    useEffect(() => {
        try {
            const loggedInUser = localStorage.getItem('user');
            if (loggedInUser) {
                const user = JSON.parse(loggedInUser);
                setCurrentUser(user);
                setScore(user.score || 0);
                setAchievements(user.achievements || []);
                setStats(user.stats || {});
            }
        } catch (error) {
            console.error("Falha ao carregar usuário do localStorage:", error);
            localStorage.removeItem('user');
        }
    }, []);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch(`${backendUrl}/api/leaderboard`);
                if (!response.ok) throw new Error("Falha ao buscar ranking");
                const data = await response.json();
                setLeaderboard(data);
            } catch (error) {
                console.error("Erro ao carregar o ranking:", error);
            }
        };
        fetchLeaderboard();
    }, []);

    const handleOpenModal = (type, data) => setModalContent({ type, data });
    const handleCloseModal = () => setModalContent(null);
    
    const checkAndAwardAchievement = async (achievement) => {
        if (currentUser && !achievements.find(a => a.name === achievement.name)) {
            try {
                const response = await fetch(`${backendUrl}/api/achievements`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: currentUser.email, achievement }),
                });
                if (response.ok) {
                    const updatedUser = await response.json();
                    if (updatedUser && updatedUser.achievements) {
                        setAchievements(updatedUser.achievements);
                        setLastAchievement(achievement);
                    }
                }
            } catch (error) {
                console.error("Erro ao salvar conquista:", error);
            }
        }
    };

    const handleSelectPeriod = (id) => {
        setSelectedPeriodId(id);
        setActiveChallenge(null);
        if (currentUser && stats.periodsVisited) {
            const visited = Object.keys(stats.periodsVisited);
            if (!visited.includes(id)) {
                const newVisited = new Set([...visited, id]);
                const newPeriodsVisited = Array.from(newVisited).reduce((obj, key) => ({ ...obj, [key]: stats.periodsVisited[key] || 0 }), {});
                setStats(prev => ({ ...prev, periodsVisited: newPeriodsVisited }));
                if (newVisited.size >= 5) {
                    checkAndAwardAchievement(ALL_ACHIEVEMENTS.VIAJANTE_DO_TEMPO);
                }
            }
        }
    };

    const handleLoginSuccess = async (tokenResponse) => {
        try {
            const googleResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + tokenResponse.access_token, {
                headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`,
                    Accept: 'application/json'
                }
            });
            const profile = await googleResponse.json();

            const backendResponse = await fetch(`${backendUrl}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile }),
            });

            if (!backendResponse.ok) throw new Error('Falha na autenticação com o backend');
            
            const userFromDb = await backendResponse.json();
            localStorage.setItem('user', JSON.stringify(userFromDb));
            setCurrentUser(userFromDb);
            setScore(userFromDb.score);
            setAchievements(userFromDb.achievements || []);
            setStats(userFromDb.stats || {});

        } catch (error) {
            console.error("Erro no login:", error);
        }
    };

    const handleCustomLogin = useGoogleLogin({
        onSuccess: handleLoginSuccess,
        onError: (error) => console.log('Login Failed:', error)
    });

    const handleLogout = () => {
        googleLogout();
        setCurrentUser(null);
        setScore(0);
        setAchievements([]);
        setStats({});
        localStorage.removeItem('user');
    };

    const handleCorrectAnswer = async () => {
        if (!currentUser) return;
        const newScore = score + 15;
        setScore(newScore);

        const currentPeriodCorrectAnswers = ((stats.periodsVisited && stats.periodsVisited[selectedPeriodId]) || 0) + 1;
        
        const newStats = {
            ...stats,
            quizzesCompleted: (stats.quizzesCompleted || 0) + 1,
            correctAnswers: (stats.correctAnswers || 0) + 1,
            periodsVisited: {
                ...stats.periodsVisited,
                [selectedPeriodId]: currentPeriodCorrectAnswers
            }
        };
        setStats(newStats);

        correctSoundRef.current?.play().catch(console.error);

        try {
            await fetch(`${backendUrl}/api/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: currentUser.email,
                    score: newScore,
                    statsUpdate: { correctAnswers: 1, quizzesCompleted: 1 }
                }),
            });
            const updatedLeaderboard = await fetch(`${backendUrl}/api/leaderboard`);
            const data = await updatedLeaderboard.json();
            setLeaderboard(data);

            if (selectedPeriodId === 'medieval' && currentPeriodCorrectAnswers >= 10) {
                checkAndAwardAchievement(ALL_ACHIEVEMENTS.MESTRE_MEDIEVAL);
            }
        } catch (error) {
            console.error("Erro ao salvar pontuação no backend:", error);
            setScore(prevScore => prevScore - 15);
        }
    };

    const handleIncorrectAnswer = async () => {
        incorrectSoundRef.current?.play().catch(console.error);
        if (currentUser) {
            const incorrectCount = (stats.incorrectAnswers || 0) + 1;
            setStats(prev => ({...prev, incorrectAnswers: incorrectCount}));
            try {
                await fetch(`${backendUrl}/api/score`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: currentUser.email,
                        score: score,
                        statsUpdate: { incorrectAnswers: 1 }
                    }),
                });
            } catch (error) {
                console.error("Erro ao salvar estatísticas:", error);
            }
        }
    };

    const createQuestionPrompt = (composerName, periodName) => `Aja como um professor de história da música. Crie uma pergunta de múltipla escolha sobre a biografia ou uma obra importante do compositor ${composerName}, que pertence ao período da ${periodName}. A pergunta deve ser clara e direta. As opções devem ser variadas em conteúdo e estilo, mas todas relacionadas ao tema. O texto deve ser escrito em português do Brasil.

Formato Exigido (use ;; como separador entre as opções):
PERGUNTA: [Texto da pergunta aqui]
OPÇÕES: A. [Opção A];;B. [Opção B];;C. [Opção C];;D. [Opção D]
RESPOSTA: [Apenas a LETRA da opção correta. Ex: C]

Responda em português do Brasil.`;

    const handleGenerateQuiz = async (returnOnly = false) => {
        const stateUpdater = returnOnly ? () => {} : setQuiz;
        stateUpdater(prev => ({ ...prev, isLoading: true }));

        const targetPeriod = returnOnly ? musicHistoryData[Math.floor(Math.random() * musicHistoryData.length)] : selectedPeriod;

        if (!targetPeriod.composers || targetPeriod.composers.length === 0) {
            const errorState = { question: 'Não há compositores disponíveis neste período.', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null };
            stateUpdater(errorState);
            if (returnOnly) return { ...errorState, text: errorState.question };
            return;
        }
        
        const randomComposer = targetPeriod.composers[Math.floor(Math.random() * targetPeriod.composers.length)];
        const prompt = createQuestionPrompt(randomComposer.name, targetPeriod.name);

        try {
            const response = await fetch(`${backendUrl}/api/gemini`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!response.ok) throw new Error("Falha ao comunicar com o servidor.");
            
            const result = await response.json();
            const text = result.candidates[0]?.content?.parts[0]?.text;

            const lines = text.split('\n');
            const questionText = lines.find(l => l.startsWith('PERGUNTA:'))?.replace('PERGUNTA:', '').trim();
            const optionsText = lines.find(l => l.startsWith('OPÇÕES:'))?.replace('OPÇÕES:', '').trim();
            const answerLetter = lines.find(l => l.startsWith('RESPOSTA:'))?.replace('RESPOSTA:', '').trim().toUpperCase();

            if (questionText && optionsText && answerLetter) {
                const options = optionsText.split(';;').map(opt => opt.replace(/^[A-D]\.\s*/, '').trim());
                const answer = options.find((opt, index) => 'ABCD'[index] === answerLetter);

                if (options.length === 4 && answer) {
                    const newQuestionData = { text: questionText, options, answer, feedback: undefined, guessedOption: null, isLoading: false };
                    if (returnOnly) return newQuestionData;
                    setQuiz({ ...newQuestionData, question: questionText });
                } else { throw new Error("Dados da API inválidos (opções ou resposta)."); }
            } else { throw new Error("Formato de resposta da API inválido."); }
        } catch (error) {
            console.error("Erro ao gerar desafio:", error);
            const errorState = { question: 'Não foi possível criar a pergunta. Tente novamente.', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null };
            stateUpdater(errorState);
            if (returnOnly) return { ...errorState, text: errorState.question };
        }
    };

    const handleQuizGuess = (guess) => {
        const isCorrect = quiz.answer.trim().toLowerCase() === guess.trim().toLowerCase();
        let feedbackMessage = isCorrect ? 'Correto! Você conhece a história.' : `Incorreto. A resposta correta era: ${quiz.answer}`;
        if (isCorrect) handleCorrectAnswer(); else handleIncorrectAnswer();
        setQuiz(prev => ({ ...prev, feedback: feedbackMessage, guessedOption: guess }));
    };
    
    const handleGenerateWhoAmI = async (returnOnly = false) => {
        const stateUpdater = returnOnly ? () => {} : setWhoAmI;
        stateUpdater(prev => ({ ...prev, isLoading: true }));
        
        const targetPeriod = returnOnly ? musicHistoryData[Math.floor(Math.random() * musicHistoryData.length)] : selectedPeriod;

        if (!targetPeriod.composers || targetPeriod.composers.length < 4) {
             const errorState = { isLoading: false, description: "Este período não tem compositores suficientes."};
             stateUpdater(prev => ({...prev, ...errorState}));
             if (returnOnly) return { ...errorState, text: errorState.description };
             return;
        }
        let randomComposers = [...targetPeriod.composers].sort(() => 0.5 - Math.random()).slice(0, 4);
        const correctComposer = randomComposers[0];
        const prompt = `Crie uma descrição curta e enigmática para o desafio "Quem sou eu?" sobre o compositor ${correctComposer.name}. A descrição deve ter de 2 a 3 frases, destacando uma característica única, uma obra famosa ou um fato curioso de sua vida, sem mencionar o nome. Deve ser um desafio para um estudante de música. Responda apenas com a descrição, em português do Brasil.`;
        
        try {
            const response = await fetch(`${backendUrl}/api/gemini`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
            if (!response.ok) throw new Error("Falha ao comunicar com o servidor.");
            const result = await response.json();
            const description = result.candidates[0]?.content?.parts[0]?.text;

            if(description){
                const newQuestionData = {
                    text: description.trim(),
                    options: randomComposers.map(c => c.name).sort(() => 0.5 - Math.random()),
                    answer: correctComposer.name,
                    feedback: undefined, guessedOption: null, isLoading: false
                };
                if(returnOnly) return newQuestionData;
                setWhoAmI({ ...newQuestionData, description: newQuestionData.text });
            } else { throw new Error("API não retornou descrição."); }
        } catch (error) {
            console.error("Erro ao gerar 'Quem sou eu?':", error);
            const errorState = { isLoading: false, description: "Não foi possível criar o desafio. Tente novamente." };
            stateUpdater(prev => ({...prev, ...errorState}));
            if(returnOnly) return { ...errorState, text: errorState.description };
        }
    };

    const handleWhoAmIGuess = (guess) => {
        const isCorrect = guess === whoAmI.answer;
        let feedbackMessage = isCorrect ? 'Correto! Você desvendou o enigma.' : `Errado! O compositor era ${whoAmI.answer}.`;
        if (isCorrect) handleCorrectAnswer(); else handleIncorrectAnswer();
        setWhoAmI(prev => ({ ...prev, feedback: feedbackMessage, guessedOption: guess }));
    };

    const handleGenerateTimeline = () => {
        setTimeline({ items: [], correctOrder: [], feedback: '', isLoading: true, isChecked: false });
        if (!selectedPeriod.composers || selectedPeriod.composers.length < 4) {
            setTimeline({ isLoading: false, feedback: "Não há compositores suficientes para este desafio.", items: [], correctOrder: [] });
            return;
        }
        const randomComposers = [...selectedPeriod.composers].sort(() => 0.5 - Math.random()).slice(0, 4);
        
        const correctOrder = [...randomComposers].sort((a, b) => getBirthYear(a.lifespan) - getBirthYear(b.lifespan)).map(c => c.name);
        const shuffledItems = [...randomComposers].map(c => ({ name: c.name, lifespan: c.lifespan })).sort(() => 0.5 - Math.random());
            
        setTimeline({ items: shuffledItems, correctOrder, feedback: '', isLoading: false, isChecked: false });
    };
    
    const handleCheckTimeline = (userOrder) => {
        const isOrderCorrect = userOrder.every((item, index) => item.name === timeline.correctOrder[index]);
    
        if (isOrderCorrect) {
            handleCorrectAnswer();
            setTimeline(prev => ({ ...prev, feedback: 'Perfeito! A ordem está correta.', isChecked: true }));
        } else {
            handleIncorrectAnswer();
            setTimeline(prev => ({ ...prev, feedback: 'Quase lá! Itens na posição correta estão em verde.', isChecked: true }));
        }
    };

    const handleGenerateFromWhichPeriod = async (returnOnly = false) => {
        const stateUpdater = returnOnly ? () => {} : setFromWhichPeriod;
        stateUpdater(prev => ({ ...prev, isLoading: true }));
        
        const randomPeriod = musicHistoryData[Math.floor(Math.random() * musicHistoryData.length)];
        const periodName = randomPeriod.name;
        const prompt = `Aja como um historiador da música criando um desafio. Gere uma descrição de 2 a 3 frases sobre uma característica, obra, compositor ou instrumento marcante do período da "${periodName}". A descrição deve ser enigmática, sem mencionar o nome do período. O objetivo é que o jogador adivinhe o período.

    Exemplo para o período Barroco: "Minhas composições são conhecidas pelo drama e pela grandiosidade, utilizando o baixo contínuo e explorando o contraste entre solistas e a orquestra em uma forma musical chamada concerto."

    Responda apenas com a descrição, em português do Brasil.`;
    
        try {
            const response = await fetch(`${backendUrl}/api/gemini`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
            if (!response.ok) throw new Error("Falha ao comunicar com a IA.");
            const result = await response.json();
            const description = result.candidates[0]?.content?.parts[0]?.text;

            if (description) {
                const newQuestionData = {
                    text: description.trim(),
                    options: musicHistoryData.map(p => p.name).sort(() => 0.5 - Math.random()), 
                    answer: periodName,
                    feedback: undefined, guessedOption: null, isLoading: false
                };
                if(returnOnly) return newQuestionData;
                setFromWhichPeriod({ ...newQuestionData, description: newQuestionData.text });
            } else { throw new Error("A API não retornou uma descrição."); }
        } catch (error) {
            console.error("Erro ao gerar 'De Que Período?':", error);
            const errorState = { isLoading: false, description: "Não foi possível criar o desafio. Tente novamente." };
            stateUpdater(prev => ({...prev, ...errorState}));
            if(returnOnly) return { ...errorState, text: errorState.description };
        }
    };

    const handleFromWhichPeriodGuess = (guess) => {
        const isCorrect = guess === fromWhichPeriod.answer;
        let feedbackMessage = isCorrect ? 'Correto! Você sabe identificar as eras da música.' : `Incorreto. A resposta correta era: ${fromWhichPeriod.answer}.`;
        if (isCorrect) handleCorrectAnswer(); else handleIncorrectAnswer();
        setFromWhichPeriod(prev => ({ ...prev, feedback: feedbackMessage, guessedOption: guess }));
    };

    const handleStartSurvival = () => {
        setActiveChallenge('survival');
        setSurvival({
            isActive: true,
            lives: 3,
            score: 0,
            question: null,
            questionType: null,
            isGameOver: false,
            isLoading: false,
        });
    };

    const generateSurvivalQuestion = async () => {
        setSurvival(prev => ({ ...prev, isLoading: true, question: null }));
        const challengeTypes = ['quiz', 'whoami', 'fromWhichPeriod'];
        const randomType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

        let questionData = null;
        switch (randomType) {
            case 'quiz':
                questionData = await handleGenerateQuiz(true);
                break;
            case 'whoami':
                questionData = await handleGenerateWhoAmI(true);
                break;
            case 'fromWhichPeriod':
                questionData = await handleGenerateFromWhichPeriod(true);
                break;
        }
        
        setSurvival(prev => ({
            ...prev,
            question: questionData,
            questionType: randomType,
            isLoading: false
        }));
    };

    const handleSurvivalAnswer = (guess) => {
        if (!survival.question || survival.question.feedback !== undefined) return;
        
        const isCorrect = guess.trim().toLowerCase() === survival.question.answer.trim().toLowerCase();

        setSurvival(prev => ({ ...prev, question: { ...prev.question, feedback: isCorrect, guessedOption: guess }}));
        
        if (isCorrect) {
            correctSoundRef.current?.play().catch(console.error);
            setSurvival(prev => ({ ...prev, score: prev.score + 10 }));
            setTimeout(generateSurvivalQuestion, 1200);
        } else {
            incorrectSoundRef.current?.play().catch(console.error);
            const newLives = survival.lives - 1;
            setTimeout(() => {
                if (newLives > 0) {
                    setSurvival(prev => ({ ...prev, lives: newLives }));
                    generateSurvivalQuestion();
                } else {
                    setSurvival(prev => ({ ...prev, lives: 0, isActive: false, isGameOver: true }));
                }
            }, 1200);
        }
    };

    return {
        selectedPeriod, modalContent, activeChallenge, quiz, whoAmI, timeline, fromWhichPeriod,
        currentUser, score, leaderboard, achievements, stats, lastAchievement,
        correctSoundRef, incorrectSoundRef,
        handleOpenModal, handleCloseModal, handleSelectPeriod, setActiveChallenge, handleCustomLogin,
        handleLogout, handleGenerateQuiz, handleQuizGuess, handleGenerateWhoAmI, handleWhoAmIGuess,
        handleGenerateTimeline, handleCheckTimeline, handleGenerateFromWhichPeriod, handleFromWhichPeriodGuess,
        setLastAchievement,
        survival, handleStartSurvival, generateSurvivalQuestion, handleSurvivalAnswer
    };
};
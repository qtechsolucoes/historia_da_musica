import { useState, useEffect, useRef, useMemo } from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import { musicHistoryData } from '../data/musicHistoryData';

const backendUrl = 'http://localhost:5001';

const ALL_ACHIEVEMENTS = {
    MESTRE_MEDIEVAL: { name: "Mestre Medieval", description: "Acerte 10 perguntas do período Medieval." },
    VIAJANTE_DO_TEMPO: { name: "Viajante do Tempo", description: "Visite todos os 5 períodos musicais." },
    POLIGLOTA_MUSICAL: { name: "Poliglota Musical", description: "Complete desafios em 3 períodos diferentes." }
};

const getBirthYear = (lifespan) => {
    if (!lifespan) return Infinity;
    const match = lifespan.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : Infinity;
};


export const useMusicApp = () => {
    const [selectedPeriodId, setSelectedPeriodId] = useState('medieval');
    const [modalContent, setModalContent] = useState(null);
    const [activeChallenge, setActiveChallenge] = useState(null);
    
    const [quiz, setQuiz] = useState({ question: '', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null });
    const [whoAmI, setWhoAmI] = useState({ description: '', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null });
    const [timeline, setTimeline] = useState({ items: [], correctOrder: [], feedback: '', isLoading: false, isChecked: false });
    const [fromWhichPeriod, setFromWhichPeriod] = useState({ description: '', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null });

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

    const handleGenerateQuiz = async () => {
        setQuiz({ question: '', options: [], answer: '', feedback: '', isLoading: true, guessedOption: null });
        if (!selectedPeriod.composers || selectedPeriod.composers.length === 0) {
            setQuiz({ question: 'Não há compositores disponíveis neste período.', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null });
            return;
        }
        const randomComposer = selectedPeriod.composers[Math.floor(Math.random() * selectedPeriod.composers.length)];
        
        const prompt = `Aja como um professor de história da música. Crie uma pergunta de múltipla escolha sobre a biografia ou uma obra importante do compositor ${randomComposer.name}, que pertence ao período da ${selectedPeriod.name}.
A pergunta deve ser clara e direta. As opções devem ser variadas em conteúdo e estilo, mas todas relacionadas ao tema. O texto deve ser escrito em português do Brasil.

Formato Exigido (use ;; como separador entre as opções):
PERGUNTA: [Texto da pergunta aqui]
OPÇÕES: A. [Opção A];;B. [Opção B];;C. [Opção C];;D. [Opção D]
RESPOSTA: [Apenas a LETRA da opção correta. Ex: C]

Responda em português do Brasil.`;
        
        try {
            const response = await fetch(`${backendUrl}/api/gemini`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!response.ok) throw new Error("Falha ao comunicar com o servidor.");
            
            const result = await response.json();
            const text = result.candidates[0]?.content?.parts[0]?.text;

            if (text) {
                const lines = text.split('\n');
                const questionLine = lines.find(line => line.startsWith('PERGUNTA:'));
                const optionsLine = lines.find(line => line.startsWith('OPÇÕES:'));
                const answerLine = lines.find(line => line.startsWith('RESPOSTA:'));
                
                if (questionLine && optionsLine && answerLine) {
                    const question = questionLine.replace('PERGUNTA:', '').trim();
                    const options = optionsLine.replace('OPÇÕES:', '').split(';;').map(opt => opt.trim());
                    
                    const correctLetter = answerLine.replace('RESPOSTA:', '').trim().toUpperCase();
                    
                    const answer = options.find(opt => opt.trim().toUpperCase().startsWith(correctLetter + '.'));

                    if (options.length === 4 && answer) {
                        setQuiz({ question, options, answer, feedback: '', isLoading: false, guessedOption: null });
                    } else { 
                        throw new Error("A API retornou um formato de opções ou letra de resposta inválido."); 
                    }
                } else { 
                    throw new Error("Formato de resposta da API inválido."); 
                }
            } else { 
                throw new Error("Resposta da API vazia."); 
            }
        } catch (error) {
            console.error("Erro ao gerar desafio:", error);
            setQuiz({ question: 'Não foi possível criar a pergunta no momento. Por favor, tente novamente.', options: [], answer: '', feedback: '', isLoading: false, guessedOption: null });
        }
    };

    const handleQuizGuess = (guess) => {
        const isCorrect = quiz.answer.trim().toLowerCase() === guess.trim().toLowerCase();
        let feedbackMessage = isCorrect ? 'Correto! Você conhece a história.' : `Incorreto. A resposta correta era: ${quiz.answer}`;
        if (isCorrect) {
            handleCorrectAnswer();
        } else {
            handleIncorrectAnswer();
        }
        setQuiz(prev => ({ ...prev, feedback: feedbackMessage, guessedOption: guess }));
    };

    const handleGenerateWhoAmI = async () => {
        setWhoAmI({ description: '', options: [], answer: '', feedback: '', isLoading: true, guessedOption: null });
        if (!selectedPeriod.composers || selectedPeriod.composers.length < 4) {
             setWhoAmI(prev => ({...prev, isLoading: false, description: "Este período não tem compositores suficientes para o desafio."}));
             return;
        }
        let randomComposers = [...selectedPeriod.composers].sort(() => 0.5 - Math.random()).slice(0, 4);
        const correctComposer = randomComposers[0];
        const prompt = `Crie uma descrição curta e enigmática para o desafio "Quem sou eu?" sobre o compositor ${correctComposer.name}. A descrição deve ter de 2 a 3 frases, destacando uma característica única, uma obra famosa ou um fato curioso de sua vida, sem mencionar o nome. Deve ser um desafio para um estudante de música. Responda apenas com a descrição, em português do Brasil.`;
        
        try {
            const response = await fetch(`${backendUrl}/api/gemini`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });
            
            if (!response.ok) throw new Error("Falha ao comunicar com o servidor.");

            const result = await response.json();
            const description = result.candidates[0]?.content?.parts[0]?.text;

            if(description){
                setWhoAmI({
                    description: description.trim(),
                    options: randomComposers.map(c => c.name).sort(() => 0.5 - Math.random()),
                    answer: correctComposer.name,
                    isLoading: false,
                    feedback: '',
                    guessedOption: null
                });
            } else { throw new Error("API não retornou descrição."); }
        } catch (error) {
            console.error("Erro ao gerar 'Quem sou eu?':", error);
            setWhoAmI(prev => ({...prev, isLoading: false, description: "Não foi possível criar o desafio. Tente novamente."}));
        }
    };
    
    const handleWhoAmIGuess = (guess) => {
        const isCorrect = guess === whoAmI.answer;
        let feedbackMessage = isCorrect ? 'Correto! Você desvendou o enigma.' : `Errado! O compositor era ${whoAmI.answer}.`;
        if (isCorrect) {
             handleCorrectAnswer();
        } else {
             handleIncorrectAnswer();
        }
        setWhoAmI(prev => ({ ...prev, feedback: feedbackMessage, guessedOption: guess }));
    };

    const handleGenerateTimeline = () => {
        setTimeline({ items: [], correctOrder: [], feedback: '', isLoading: true, isChecked: false });
        if (!selectedPeriod.composers || selectedPeriod.composers.length < 4) {
            setTimeline({ isLoading: false, feedback: "Não há compositores suficientes para este desafio.", items: [], correctOrder: [] });
            return;
        }
        const randomComposers = [...selectedPeriod.composers].sort(() => 0.5 - Math.random()).slice(0, 4);
        
        const correctOrder = [...randomComposers]
            .sort((a, b) => getBirthYear(a.lifespan) - getBirthYear(b.lifespan))
            .map(c => c.name);

        const shuffledItems = [...randomComposers]
            .map(c => ({ name: c.name, lifespan: c.lifespan }))
            .sort(() => 0.5 - Math.random());
            
        setTimeline({
            items: shuffledItems,
            correctOrder: correctOrder,
            feedback: '',
            isLoading: false,
            isChecked: false
        });
    };
    
    const handleCheckTimeline = (userOrder, setTimelineItems) => {
        let isOrderCorrect = true;
        for (let i = 1; i < userOrder.length; i++) {
            const prevYear = getBirthYear(userOrder[i - 1].lifespan);
            const currentYear = getBirthYear(userOrder[i].lifespan);
            if (prevYear > currentYear) {
                isOrderCorrect = false;
                break;
            }
        }
    
        if (isOrderCorrect) {
            handleCorrectAnswer();
            setTimeline(prev => ({ ...prev, feedback: 'Perfeito! A ordem está correta.', isChecked: true }));
        } else {
            handleIncorrectAnswer();
            const correctItems = [...timeline.items].sort((a, b) => getBirthYear(a.lifespan) - getBirthYear(b.lifespan));
            setTimelineItems(correctItems);
            setTimeline(prev => ({ ...prev, feedback: 'Quase lá! A ordem correta foi revelada.', isChecked: true }));
        }
    };

    const handleGenerateFromWhichPeriod = async () => {
        setFromWhichPeriod({ description: '', options: [], answer: '', feedback: '', isLoading: true, guessedOption: null });
        const randomPeriod = musicHistoryData[Math.floor(Math.random() * musicHistoryData.length)];
        const periodName = randomPeriod.name;
        const prompt = `Aja como um historiador da música criando um desafio. Gere uma descrição de 2 a 3 frases sobre uma característica, obra, compositor ou instrumento marcante do período da "${periodName}". A descrição deve ser enigmática, sem mencionar o nome do período. O objetivo é que o jogador adivinhe o período.

    Exemplo para o período Barroco: "Minhas composições são conhecidas pelo drama e pela grandiosidade, utilizando o baixo contínuo e explorando o contraste entre solistas e a orquestra em uma forma musical chamada concerto."

    Responda apenas com a descrição, em português do Brasil.`;
    
        try {
            const response = await fetch(`${backendUrl}/api/gemini`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });
            if (!response.ok) throw new Error("Falha ao comunicar com a IA.");
            const result = await response.json();
            const description = result.candidates[0]?.content?.parts[0]?.text;
            if (description) {
                setFromWhichPeriod({
                    description: description.trim(),
                    options: musicHistoryData.map(p => p.name).sort(() => 0.5 - Math.random()), 
                    answer: periodName,
                    isLoading: false,
                    feedback: '',
                    guessedOption: null
                });
            } else {
                throw new Error("A API não retornou uma descrição.");
            }
        } catch (error) {
            console.error("Erro ao gerar 'De Que Período?':", error);
            setFromWhichPeriod(prev => ({...prev, isLoading: false, description: "Não foi possível criar o desafio. Tente novamente."}));
        }
    };

    const handleFromWhichPeriodGuess = (guess) => {
        const isCorrect = guess === fromWhichPeriod.answer;
        let feedbackMessage = isCorrect ? 'Correto! Você sabe identificar as eras da música.' : `Incorreto. A resposta correta era: ${fromWhichPeriod.answer}.`;
        if (isCorrect) {
            handleCorrectAnswer();
        } else {
            handleIncorrectAnswer();
        }
        setFromWhichPeriod(prev => ({ ...prev, feedback: feedbackMessage, guessedOption: guess }));
    };

    return {
        selectedPeriod,
        modalContent,
        activeChallenge,
        quiz,
        whoAmI,
        timeline,
        fromWhichPeriod,
        currentUser,
        score,
        leaderboard,
        achievements,
        stats,
        lastAchievement,
        correctSoundRef,
        incorrectSoundRef,
        handleOpenModal,
        handleCloseModal,
        handleSelectPeriod,
        setActiveChallenge,
        handleCustomLogin,
        handleLogout,
        handleGenerateQuiz,
        handleQuizGuess,
        handleGenerateWhoAmI,
        handleWhoAmIGuess,
        handleGenerateTimeline,
        handleCheckTimeline,
        handleGenerateFromWhichPeriod,
        handleFromWhichPeriodGuess,
        setLastAchievement,
    };
}
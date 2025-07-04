import React, { useState, useMemo } from 'react';
import { musicHistoryData } from './data/musicHistoryData';

import AnimatedBackground from './components/AnimatedBackground';
import MainContent from './components/MainContent';
import DetailModal from './components/DetailModal';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export default function App() {
    const [selectedPeriodId, setSelectedPeriodId] = useState('medieval');
    const [modalContent, setModalContent] = useState(null);
    const [quiz, setQuiz] = useState({ question: '', options: [], answer: '', feedback: '', isLoading: false });
    const [duel, setDuel] = useState({ composer1: '', composer2: '', result: '', isLoading: false });

    const selectedPeriod = useMemo(() => musicHistoryData.find(p => p.id === selectedPeriodId), [selectedPeriodId]);
    
    const handleOpenModal = (type, data) => setModalContent({ type, data });
    const handleCloseModal = () => setModalContent(null);

    const handleSelectPeriod = (id) => {
        setSelectedPeriodId(id);
        setQuiz({ question: '', options: [], answer: '', feedback: '', isLoading: false });
        setDuel({ composer1: '', composer2: '', result: '', isLoading: false });
    };
    
    const handleDuelChange = (field, value) => {
        setDuel(prev => ({ ...prev, [field]: value }));
    };

    const handleGenerateDuel = async () => {
        setDuel(prev => ({ ...prev, isLoading: true, result: '' }));
        const prompt = `Como um musicólogo, escreva uma análise comparativa concisa entre ${duel.composer1} e ${duel.composer2}. Destaque suas principais semelhanças e diferenças em termos de estilo, técnica, gênero principal e legado. Responda em português do Brasil, em um parágrafo.`;

        try {
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            const text = result.candidates[0]?.content?.parts[0]?.text;
            setDuel(prev => ({ ...prev, result: text || "Não foi possível gerar a comparação.", isLoading: false }));
        } catch (error) {
            console.error("Erro ao gerar duelo:", error);
            setDuel(prev => ({ ...prev, result: 'Ocorreu um erro de conexão.', isLoading: false }));
        }
    };

    const handleGenerateQuiz = async () => {
        setQuiz({ question: '', options: [], answer: '', feedback: '', isLoading: true });
        const composerNames = selectedPeriod.composers.map(c => c.name).join(', ');
        const prompt = `Aja como um professor de história da música. Crie uma pergunta de múltipla escolha sobre a biografia ou uma obra importante de um dos seguintes compositores do período ${selectedPeriod.name}: ${composerNames}. Forneça a pergunta, quatro opções (sendo uma correta e três incorretas, mas plausíveis) e a resposta correta em um formato específico.

Formato Exigido:
PERGUNTA: [Texto da pergunta aqui]
OPÇÕES: [Opção 1], [Opção 2], [Opção 3], [Opção 4]
RESPOSTA: [Texto da opção correta aqui]

Responda em português do Brasil.`;

        try {
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            const text = result.candidates[0]?.content?.parts[0]?.text;
            if (text) {
                const lines = text.split('\n');
                const questionLine = lines.find(line => line.startsWith('PERGUNTA:'));
                const optionsLine = lines.find(line => line.startsWith('OPÇÕES:'));
                const answerLine = lines.find(line => line.startsWith('RESPOSTA:'));

                if (questionLine && optionsLine && answerLine) {
                    const question = questionLine.replace('PERGUNTA:', '').trim();
                    const options = optionsLine.replace('OPÇÕES:', '').split(',').map(opt => opt.trim());
                    const answer = answerLine.replace('RESPOSTA:', '').trim();
                    setQuiz({ question, options, answer, feedback: '', isLoading: false });
                } else {
                     throw new Error("Formato de resposta da API inválido.");
                }
            } else {
                throw new Error("Resposta da API vazia.");
            }
        } catch (error) {
            console.error("Erro ao gerar desafio:", error);
            setQuiz({ question: 'Não foi possível criar uma pergunta. Tente novamente.', options: [], answer: '', feedback: '', isLoading: false });
        }
    };

    const handleQuizGuess = (guess) => {
        const isCorrect = quiz.answer.trim().toLowerCase().includes(guess.trim().toLowerCase()) || guess.trim().toLowerCase().includes(quiz.answer.trim().toLowerCase());
        if (isCorrect) {
            setQuiz(prev => ({ ...prev, feedback: 'Correto! Você conhece a história.' }));
        } else {
            setQuiz(prev => ({ ...prev, feedback: `Incorreto. A resposta correta era: ${quiz.answer}.` }));
        }
    };

    return (
        <div className="h-screen w-screen text-stone-200 font-sans bg-gray-900 flex flex-col" id="app-container">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;700&family=MedievalSharp&display=swap');
                body { font-family: 'EB Garamond', serif; background-color: #111827; overflow: hidden; }
                .font-title { font-family: 'MedievalSharp', cursive; }
                .font-serif { font-family: 'EB Garamond', serif; }
                .scrollbar-thin::-webkit-scrollbar { width: 5px; height: 5px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background: #a38b71; border-radius: 10px; }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #c0a58a; }
            `}</style>
            <AnimatedBackground />
            
            <header className="text-center p-4 bg-black/30 backdrop-blur-sm z-20 border-b-2 border-amber-900/50 flex-shrink-0">
                <h1 className="text-3xl md:text-5xl font-title text-amber-300" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>
                    Codex Historiæ Musicæ
                </h1>
            </header>

            <nav className="flex-shrink-0 bg-black/20 backdrop-blur-sm border-b-2 border-amber-900/50">
                <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
                    <div className="relative flex items-center justify-center h-16">
                        <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto scrollbar-thin">
                            {musicHistoryData.map((period) => (
                                <button key={period.id} onClick={() => handleSelectPeriod(period.id)} className={`px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${selectedPeriodId === period.id ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'text-amber-300 hover:bg-gray-700/50'}`}>
                                    <span>{period.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex-1 flex overflow-hidden">
                {selectedPeriod && (
                    <MainContent 
                        period={selectedPeriod} 
                        onCardClick={handleOpenModal}
                        quiz={quiz}
                        onGenerateQuiz={handleGenerateQuiz}
                        onQuizGuess={handleQuizGuess}
                        duel={duel}
                        onDuelChange={handleDuelChange}
                        onGenerateDuel={handleGenerateDuel}
                    />
                )}
            </div>
            
            <footer className="text-center p-2 bg-black/30 backdrop-blur-sm z-20 border-t-2 border-amber-900/50 flex-shrink-0">
                <p className="text-xs text-stone-400">Referência principal: "História da Música Ocidental" por D. J. Grout & C. V. Palisca.</p>
                <p className="text-xs text-stone-500">© 2025 Qtech Soluções Tecnológicas. Todos os direitos reservados.</p>
            </footer>

            <DetailModal content={modalContent} onClose={handleCloseModal} />
        </div>
    );
}
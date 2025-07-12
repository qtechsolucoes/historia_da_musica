import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, BookOpen, BrainCircuit, BarChart, ArrowLeft, Database, Edit } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import QuestionList from './QuestionList'; 
import QuestionEditor from './QuestionEditor'; 

const periodOptions = [
    { id: 'medieval', name: 'Medieval' }, { id: 'renascentista', name: 'Renascentista' },
    { id: 'barroco', name: 'Barroco' }, { id: 'classico', name: 'Clássico' },
    { id: 'romantico', name: 'Romântico' }, { id: 'moderno', name: 'Moderno' },
];

const DatabaseQuizForm = ({ onSubmit, isLoading }) => {
    const [formData, setFormData] = useState({ title: '', periods: [], difficulty: 'Médio', questionCount: 10 });
    const handlePeriodChange = (periodId) => {
        setFormData(prev => ({ ...prev, periods: prev.periods.includes(periodId) ? prev.periods.filter(p => p !== periodId) : [...prev.periods, periodId] }));
    };
    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleFormSubmit} className="space-y-6">
            <div>
                <label htmlFor="title" className="text-amber-200 font-semibold mb-2 flex items-center gap-2">Título do Quiz</label>
                <input type="text" id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full p-3 bg-gray-800 border border-amber-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Ex: Gigantes do Barroco" required />
            </div>
            <div>
                <label className="text-amber-200 font-semibold mb-2 flex items-center gap-2"><BookOpen size={20}/> Períodos Musicais</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {periodOptions.map(period => (
                        <button type="button" key={period.id} onClick={() => handlePeriodChange(period.id)} className={`p-3 rounded-lg text-center transition-all duration-200 border-2 ${formData.periods.includes(period.id) ? 'bg-amber-500/20 border-amber-500 text-white font-bold' : 'bg-gray-800/50 border-gray-700 hover:border-amber-600'}`}>{period.name}</button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label htmlFor="difficulty" className="text-amber-200 font-semibold mb-2 flex items-center gap-2"><BrainCircuit size={20}/> Dificuldade</label>
                    <select id="difficulty" value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className="w-full p-3 bg-gray-800 border border-amber-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                        <option>Fácil</option><option>Médio</option><option>Difícil</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="questionCount" className="text-amber-200 font-semibold mb-2 flex items-center gap-2"><BarChart size={20}/> Nº de Questões: {formData.questionCount}</label>
                    <input type="range" id="questionCount" min="5" max="20" value={formData.questionCount} onChange={(e) => setFormData({ ...formData, questionCount: e.target.value })} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-400" />
                </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-3 mt-4 p-4 bg-amber-600 text-black font-bold text-lg rounded-lg hover:bg-amber-500 transition-all duration-300 disabled:bg-gray-500 disabled:cursor-wait">
                {isLoading ? <><LoadingSpinner /> Gerando Quiz...</> : <>Gerar e Iniciar Lobby <ArrowRight /></>}
            </button>
        </form>
    );
};

const CustomQuizForm = ({ onSubmit, isLoading }) => {
    const [title, setTitle] = useState('');
    const [period, setPeriod] = useState('barroco');
    const [difficulty, setDifficulty] = useState('Médio');
    const [questions, setQuestions] = useState([]);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);

    const handleAddNewQuestion = () => {
        const newQuestion = { id: Date.now(), text: '', options: ['', '', '', ''], correctAnswerIndex: 0 };
        setQuestions(prev => [...prev, newQuestion]);
        setEditingQuestion({ data: newQuestion, index: questions.length });
        setIsEditorOpen(true);
    };

    const handleEditQuestion = (index) => {
        setEditingQuestion({ data: questions[index], index });
        setIsEditorOpen(true);
    };

    const handleRemoveQuestion = (index) => {
        const questionToRemove = questions[index];
        setQuestions(prev => prev.filter((_, i) => i !== index));
        if (editingQuestion && editingQuestion.data.id === questionToRemove.id) {
            setIsEditorOpen(false);
        }
    };

    const handleSaveQuestion = ({ data, index }) => {
        setQuestions(prev => prev.map((q, i) => (i === index ? data : q)));
        setIsEditorOpen(false);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit({ title, period, difficulty, questions });
    };

    return (
        <div className="grid md:grid-cols-2 gap-8 h-full">
            <form onSubmit={handleFormSubmit} className="flex flex-col space-y-6">
                <div>
                    <label className="text-amber-200 font-semibold mb-2 block">Título do Quiz</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 bg-gray-800 rounded-lg" placeholder="Ex: Mestres do Barroco"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-amber-200 font-semibold mb-2 block">Período</label>
                        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full p-3 bg-gray-800 rounded-lg">
                            {periodOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-amber-200 font-semibold mb-2 block">Dificuldade</label>
                        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full p-3 bg-gray-800 rounded-lg">
                            <option>Fácil</option><option>Médio</option><option>Difícil</option>
                        </select>
                    </div>
                </div>
                <div className="flex-1 flex flex-col min-h-0">
                    <QuestionList questions={questions} onEdit={handleEditQuestion} onRemove={handleRemoveQuestion} />
                </div>
                <div className="flex-shrink-0 space-y-3">
                    <button type="button" onClick={handleAddNewQuestion} className="w-full p-2 bg-gray-700/50 hover:bg-gray-700 text-amber-300 font-semibold rounded-md">+ Adicionar Nova Pergunta</button>
                    <button type="submit" disabled={isLoading || questions.length === 0} className="w-full p-4 bg-amber-600 text-black font-bold rounded-lg disabled:bg-gray-600">
                        {isLoading ? <LoadingSpinner /> : 'Gerar e Iniciar Lobby'}
                    </button>
                </div>
            </form>
            <div className="relative">
                <AnimatePresence>
                    {isEditorOpen && (
                        <QuestionEditor 
                            key={editingQuestion ? editingQuestion.data.id : 'editor'}
                            questionData={editingQuestion} 
                            onSave={handleSaveQuestion} 
                            onCancel={() => setIsEditorOpen(false)} 
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};


const CreateQuiz = ({ socket }) => {
    const [mode, setMode] = useState('database');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleCreateQuiz = async (formData, quizMode) => {
        setError('');
        setIsLoading(true);
        const endpoint = quizMode === 'database' ? '/api/kahoot/create' : '/api/kahoot/create-custom';
        
        if (!formData.title) {
            setError('Por favor, preencha o título do quiz.');
            setIsLoading(false); return;
        }
        if (quizMode === 'database' && formData.periods.length === 0) {
            setError('Por favor, selecione pelo menos um período.');
            setIsLoading(false); return;
        }
        if (quizMode === 'custom' && formData.questions.length === 0) {
            setError('Por favor, adicione pelo menos uma pergunta ao quiz.');
            setIsLoading(false); return;
        }

        try {
            const response = await fetch(`http://localhost:5001${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Falha ao criar o quiz.`);
            }
            const { accessCode } = await response.json();
            navigate(`/quiz/lobby/${accessCode}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
            <div className="w-full max-w-7xl h-[90vh] bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-amber-900/50 shadow-2xl relative flex flex-col">
                <div className="flex-shrink-0">
                    <button onClick={() => navigate('/')} className="absolute top-4 left-4 p-2 text-stone-400 hover:text-amber-300 rounded-full"><ArrowLeft size={24} /></button>
                    <h1 className="text-4xl font-title text-amber-300 mb-2 text-center">Criar Novo Desafio</h1>
                     <div className="flex justify-center gap-4 my-6">
                        <button onClick={() => setMode('database')} className={`px-4 py-2 rounded-lg border-2 ${mode === 'database' ? 'bg-blue-500/20 border-blue-400' : 'border-transparent'}`}>Usar Banco de Dados</button>
                        <button onClick={() => setMode('custom')} className={`px-4 py-2 rounded-lg border-2 ${mode === 'custom' ? 'bg-green-500/20 border-green-400' : 'border-transparent'}`}>Criar do Zero</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    {error && <p className="text-red-400 text-center mb-4">{error}</p>}
                    <AnimatePresence mode="wait">
                         <motion.div 
                            key={mode}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                         >
                           {mode === 'database' 
                               ? <DatabaseQuizForm onSubmit={(data) => handleCreateQuiz(data, 'database')} isLoading={isLoading} />
                               : <CustomQuizForm onSubmit={(data) => handleCreateQuiz(data, 'custom')} isLoading={isLoading} />
                           }
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default CreateQuiz;
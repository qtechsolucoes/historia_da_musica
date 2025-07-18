import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, BookOpen, BrainCircuit, BarChart, ArrowLeft, Database, PlusCircle, Trash2, Check, Edit, ChevronDown } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

// --- COMPONENTES AUXILIARES ---

const CommonFields = ({ formData, setFormData, periodOptions, handlePeriodChange }) => (
    <div className="space-y-6">
        <div>
            <label htmlFor="title" className="text-amber-200 font-semibold mb-2 block">Título do Quiz</label>
            <input 
                type="text" 
                id="title" 
                value={formData.title} 
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} 
                className="w-full p-3 bg-gray-800 border border-amber-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" 
                placeholder="Ex: Gigantes do Barroco" 
                required
            />
        </div>
        <div>
            <label htmlFor="difficulty" className="text-amber-200 font-semibold mb-2 block">Dificuldade</label>
            <select 
                id="difficulty" 
                value={formData.difficulty} 
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))} 
                className="w-full p-3 bg-gray-800 border border-amber-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
                <option>Fácil</option>
                <option>Médio</option>
                <option>Difícil</option>
            </select>
        </div>
        <div>
            <label className="text-amber-200 font-semibold mb-2 flex items-center gap-2"><BookOpen size={20}/> Períodos Musicais</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {periodOptions.map(period => (
                    <button 
                        type="button" 
                        key={period.id} 
                        onClick={() => handlePeriodChange(period.id)} 
                        className={`p-3 rounded-lg text-center transition-all duration-200 border-2 ${formData.periods.includes(period.id) ? 'bg-amber-500/20 border-amber-500 text-white font-bold' : 'bg-gray-800/50 border-gray-700 hover:border-amber-600'}`}
                    >
                        {period.name}
                    </button>
                ))}
            </div>
        </div>
    </div>
);

const QuestionEditor = ({ question, onChange, onSave, isEditing }) => (
    <div className="p-4 bg-black/30 rounded-lg border border-gray-600 h-full flex flex-col gap-4">
        <h3 className="text-xl font-semibold text-amber-200">{isEditing ? 'Editando Pergunta' : 'Nova Pergunta'}</h3>
        <div className="flex-grow space-y-4">
            <textarea
                placeholder="Escreva o texto da pergunta aqui..." 
                value={question.text} 
                onChange={(e) => onChange('text', e.target.value)} 
                className="w-full p-2 bg-gray-700/80 rounded-md border border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none h-24 resize-none scrollbar-custom" 
            />
            <div className="space-y-3">
                {question.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                         <input 
                             type="text" 
                             placeholder={`Opção ${optIndex + 1}`} 
                             value={opt} 
                             onChange={(e) => onChange('option', { optionIndex: optIndex, optionValue: e.target.value })} 
                             className="flex-grow p-2 bg-gray-700/80 rounded-md border border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none" 
                         />
                         <button 
                             type="button" 
                             onClick={() => onChange('correctAnswerIndex', optIndex)}
                             className={`p-2 rounded-md transition-colors ${question.correctAnswerIndex === optIndex ? 'bg-green-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}
                             title="Marcar como correta"
                        >
                            <Check size={18}/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
        <button type="button" onClick={onSave} className="w-full mt-auto p-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors">
            {isEditing ? 'Atualizar Pergunta' : 'Adicionar Pergunta à Lista'}
        </button>
    </div>
);

const SubmitButton = ({ isLoading, error }) => (
    <div className="mt-auto pt-6">
        {error && <p className="text-red-400 text-center bg-red-900/50 p-2 rounded-md mb-4">{error}</p>}
        <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full flex items-center justify-center gap-3 p-4 bg-amber-600 text-black font-bold text-lg rounded-lg hover:bg-amber-500 transition-all duration-300 disabled:bg-gray-500 disabled:cursor-wait"
        >
            {isLoading ? <><LoadingSpinner /> Gerando Quiz...</> : <>Gerar e Iniciar Lobby <ArrowRight /></>}
        </button>
    </div>
);

// --- COMPONENTE PRINCIPAL ---
const CreateQuiz = ({ socket }) => {
    const [questionSource, setQuestionSource] = useState('database');
    const [formData, setFormData] = useState({ title: '', periods: [], difficulty: 'Médio', questionCount: 10 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [manualQuestions, setManualQuestions] = useState([]);
    const [editingQuestion, setEditingQuestion] = useState({ text: '', options: ['', '', '', ''], correctAnswerIndex: 0 });
    const [editingIndex, setEditingIndex] = useState(null);
    const [expandedQuestion, setExpandedQuestion] = useState(null);

    const periodOptions = [
        { id: 'medieval', name: 'Medieval' }, { id: 'renascentista', name: 'Renascentista' },
        { id: 'barroco', name: 'Barroco' }, { id: 'classico', name: 'Clássico' },
        { id: 'romantico', name: 'Romântico' }, { id: 'moderno', name: 'Moderno' },
    ];

    const handlePeriodChange = (periodId) => setFormData(prev => ({...prev, periods: prev.periods.includes(periodId) ? prev.periods.filter(p => p !== periodId) : [...prev.periods, periodId] }));
    
    const handleEditingQuestionChange = (field, value) => {
        setEditingQuestion(prev => {
            if (field === 'option') {
                const newOptions = [...prev.options];
                newOptions[value.optionIndex] = value.optionValue;
                return { ...prev, options: newOptions };
            }
            return { ...prev, [field]: value };
        });
    };

    const handleSaveQuestion = () => {
        if (!editingQuestion.text.trim() || editingQuestion.options.some(opt => !opt.trim())) {
            setError('Preencha o texto da pergunta e todas as opções.');
            setTimeout(() => setError(''), 3000);
            return;
        }
        setError('');
        if (editingIndex !== null) {
            const updatedQuestions = [...manualQuestions];
            updatedQuestions[editingIndex] = editingQuestion;
            setManualQuestions(updatedQuestions);
        } else {
            setManualQuestions([...manualQuestions, editingQuestion]);
        }
        setEditingQuestion({ text: '', options: ['', '', '', ''], correctAnswerIndex: 0 });
        setEditingIndex(null);
    };

    const handleEditClick = (index) => {
        setEditingQuestion(manualQuestions[index]);
        setEditingIndex(index);
    };

    const handleRemoveClick = (index) => {
        setManualQuestions(manualQuestions.filter((_, i) => i !== index));
        if (editingIndex === index) {
            setEditingQuestion({ text: '', options: ['', '', '', ''], correctAnswerIndex: 0 });
            setEditingIndex(null);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // --- VALIDAÇÃO REFINADA ---
        if (!formData.title.trim()) {
            setError('Por favor, preencha o título do quiz.');
            return;
        }
        if (formData.periods.length === 0) {
            setError('É necessário selecionar pelo menos um período musical.');
            return;
        }
        if (questionSource === 'manual' && manualQuestions.length === 0) {
            setError('Adicione pelo menos uma pergunta para criar o quiz no modo manual.');
            return;
        }
        // --- FIM DA VALIDAÇÃO ---

        setIsLoading(true);
        const payload = { ...formData, questionSource, questions: manualQuestions, questionCount: questionSource === 'database' ? formData.questionCount : manualQuestions.length };
        try {
            const response = await fetch('http://localhost:5001/api/kahoot/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Falha ao criar o quiz.');
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
        <div className="min-h-screen w-full bg-gray-900 text-white flex items-start justify-center py-10 px-4 sm:px-6 lg:px-8" style={{ backgroundImage: `radial-gradient(circle at top right, rgba(187, 148, 92, 0.1), transparent 40%), radial-gradient(circle at bottom left, rgba(63, 98, 18, 0.1), transparent 50%)` }}>
            <motion.div
                layout
                transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
                className={`w-full ${questionSource === 'database' ? 'max-w-3xl' : 'max-w-7xl'}`}
            >
                <div className="bg-black/40 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-amber-900/50 shadow-2xl relative">
                    <button type="button" onClick={() => navigate('/')} className="absolute top-4 left-4 p-2 text-stone-400 hover:text-amber-300 hover:bg-gray-700 rounded-full transition-colors" aria-label="Voltar"><ArrowLeft size={24} /></button>
                    <div className="text-center mb-8"><h1 className="text-4xl font-title text-amber-300 flex items-center justify-center gap-3"><Sparkles /> Criar Novo Desafio</h1></div>
                    <div className="mb-8 p-1 bg-black/30 rounded-lg flex gap-1 max-w-md mx-auto">
                        <button type="button" onClick={() => setQuestionSource('database')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${questionSource === 'database' ? 'bg-amber-600 text-black' : 'hover:bg-gray-700/50'}`}><Database size={16}/> Usar Banco de Dados</button>
                        <button type="button" onClick={() => setQuestionSource('manual')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${questionSource === 'manual' ? 'bg-amber-600 text-black' : 'hover:bg-gray-700/50'}`}><PlusCircle size={16}/> Criar Minhas Perguntas</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <AnimatePresence mode="wait">
                            {questionSource === 'database' ? (
                                <motion.div key="db-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                                    <CommonFields formData={formData} setFormData={setFormData} periodOptions={periodOptions} handlePeriodChange={handlePeriodChange} />
                                    <div className="pt-2">
                                        <label htmlFor="questionCount" className="text-amber-200 font-semibold mb-2 flex items-center gap-2"><BarChart size={20}/> Nº de Questões: {formData.questionCount}</label>
                                        <input type="range" id="questionCount" min="5" max="20" value={formData.questionCount} onChange={(e) => setFormData({ ...formData, questionCount: e.target.value })} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-400"/>
                                    </div>
                                    <SubmitButton isLoading={isLoading} error={error} />
                                </motion.div>
                            ) : (
                                <motion.div key="manual-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                    <div className="lg:col-span-2 space-y-8 flex flex-col">
                                        <CommonFields formData={formData} setFormData={setFormData} periodOptions={periodOptions} handlePeriodChange={handlePeriodChange} />
                                        <div className="space-y-2 flex-grow flex flex-col">
                                            <h3 className="text-amber-200 font-semibold">Perguntas Criadas ({manualQuestions.length})</h3>
                                            <div className="p-2 bg-black/20 rounded-lg border border-gray-700 flex-grow min-h-[250px] overflow-y-auto scrollbar-custom space-y-2">
                                                {manualQuestions.length === 0 ? <div className="flex items-center justify-center h-full"><p className="text-center text-stone-500 p-4">Nenhuma pergunta adicionada.</p></div> :
                                                    <AnimatePresence>
                                                        {manualQuestions.map((q, i) => (
                                                            <motion.div key={i} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }}>
                                                                <div className="bg-gray-800/50 rounded-md border border-gray-600">
                                                                    <div className="p-2 flex justify-between items-center cursor-pointer" onClick={() => setExpandedQuestion(expandedQuestion === i ? null : i)}>
                                                                        <p className="text-sm font-semibold truncate flex-1 pr-2">{q.text || "Pergunta sem texto"}</p>
                                                                        <div className="flex-shrink-0 flex items-center gap-2">
                                                                            <button type="button" onClick={(e) => {e.stopPropagation(); handleEditClick(i)}} className="p-1 hover:text-blue-400"><Edit size={14}/></button>
                                                                            <button type="button" onClick={(e) => {e.stopPropagation(); handleRemoveClick(i)}} className="p-1 hover:text-red-400"><Trash2 size={14}/></button>
                                                                            <ChevronDown size={16} className={`transition-transform ${expandedQuestion === i ? 'rotate-180' : ''}`} />
                                                                        </div>
                                                                    </div>
                                                                    {expandedQuestion === i && (
                                                                        <motion.div initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}} className="px-3 pb-2 border-t border-gray-700/50 text-xs space-y-1 overflow-hidden">
                                                                            {q.options.map((opt, optIdx) => (
                                                                                <p key={optIdx} className={`truncate ${optIdx === q.correctAnswerIndex ? 'text-green-400 font-bold' : 'text-stone-400'}`}>- {opt || "Opção vazia"}</p>
                                                                            ))}
                                                                        </motion.div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </AnimatePresence>
                                                }
                                            </div>
                                        </div>
                                        <SubmitButton isLoading={isLoading} error={error} />
                                    </div>
                                    <div className="lg:col-span-3">
                                       <QuestionEditor question={editingQuestion} onChange={handleEditingQuestionChange} onSave={handleSaveQuestion} isEditing={editingIndex !== null} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default CreateQuiz;
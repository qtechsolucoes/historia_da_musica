import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, BookOpen, BrainCircuit, BarChart, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const CreateQuiz = ({ socket }) => {
    const [formData, setFormData] = useState({
        title: '',
        periods: [],
        difficulty: 'Médio',
        questionCount: 10,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const periodOptions = [
        { id: 'medieval', name: 'Medieval' },
        { id: 'renascentista', name: 'Renascentista' },
        { id: 'barroco', name: 'Barroco' },
        { id: 'classico', name: 'Clássico' },
        { id: 'romantico', name: 'Romântico' },
        { id: 'moderno', name: 'Moderno' },
    ];

    const handlePeriodChange = (periodId) => {
        setFormData(prev => ({
            ...prev,
            periods: prev.periods.includes(periodId)
                ? prev.periods.filter(p => p !== periodId)
                : [...prev.periods, periodId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.periods.length === 0 || !formData.title) {
            setError('Por favor, preencha o título e selecione pelo menos um período.');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5001/api/kahoot/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

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
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4" style={{
            backgroundImage: `radial-gradient(circle at top right, rgba(187, 148, 92, 0.1), transparent 40%), 
                              radial-gradient(circle at bottom left, rgba(63, 98, 18, 0.1), transparent 50%)`
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-amber-900/50 shadow-2xl relative"
            >
                <button 
                    onClick={() => navigate('/')} 
                    className="absolute top-4 left-4 p-2 text-stone-400 hover:text-amber-300 hover:bg-gray-700 rounded-full transition-colors"
                    aria-label="Voltar"
                >
                    <ArrowLeft size={24} />
                </button>

                <h1 className="text-4xl font-title text-amber-300 mb-6 text-center flex items-center justify-center gap-3">
                    <Sparkles /> Criar Novo Desafio
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="title" className="text-amber-200 font-semibold mb-2 flex items-center gap-2">Título do Quiz</label>
                        <input
                            type="text"
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full p-3 bg-gray-800 border border-amber-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Ex: Gigantes do Barroco"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-amber-200 font-semibold mb-2 flex items-center gap-2"><BookOpen size={20}/> Períodos Musicais</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {periodOptions.map(period => (
                                <button
                                    type="button"
                                    key={period.id}
                                    onClick={() => handlePeriodChange(period.id)}
                                    className={`p-3 rounded-lg text-center transition-all duration-200 border-2 ${formData.periods.includes(period.id)
                                            ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                                            : 'bg-gray-800/50 border-gray-700 hover:border-amber-600'
                                        }`}
                                >
                                    {period.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="difficulty" className="text-amber-200 font-semibold mb-2 flex items-center gap-2"><BrainCircuit size={20}/> Dificuldade</label>
                            <select
                                id="difficulty"
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                className="w-full p-3 bg-gray-800 border border-amber-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option>Fácil</option>
                                <option>Médio</option>
                                <option>Difícil</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="questionCount" className="text-amber-200 font-semibold mb-2 flex items-center gap-2"><BarChart size={20}/> Nº de Questões: {formData.questionCount}</label>
                            <input
                                type="range"
                                id="questionCount"
                                min="5"
                                max="20"
                                value={formData.questionCount}
                                onChange={(e) => setFormData({ ...formData, questionCount: e.target.value })}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 mt-8 p-4 bg-amber-600 text-black font-bold text-lg rounded-lg hover:bg-amber-500 transition-all duration-300 disabled:bg-gray-500 disabled:cursor-wait"
                    >
                        {isLoading ? <><LoadingSpinner /> Gerando Quiz...</> : <>Gerar e Iniciar Lobby <ArrowRight /></>}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateQuiz;
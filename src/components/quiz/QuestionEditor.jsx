import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

// Removido o import do 'motion' pois não será mais usado para animar o container principal

const QuestionEditor = ({ questionData, onSave, onCancel }) => {
    const [question, setQuestion] = useState(questionData.data);

    useEffect(() => {
        setQuestion(questionData.data);
    }, [questionData]);

    const handleTextChange = (e) => {
        setQuestion({ ...question, text: e.target.value });
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...question.options];
        newOptions[index] = value;
        setQuestion({ ...question, options: newOptions });
    };
    
    const handleSetCorrect = (index) => {
        setQuestion({ ...question, correctAnswerIndex: index });
    };

    const handleSaveClick = () => {
        if (question.text.trim() && question.options.every(opt => opt.trim())) {
            onSave({ ...questionData, data: question });
        } else {
            alert("Por favor, preencha todos os campos da pergunta e das opções.");
        }
    };

    // --- CORREÇÃO: Trocado 'motion.div' por 'div' e removidas as props de animação ---
    return (
        <div 
            className="h-full bg-black/40 p-6 rounded-2xl border border-green-800/80 flex flex-col"
        >
            <h2 className="text-2xl font-title text-green-300 mb-4 flex-shrink-0">
                {questionData.index === null ? 'Nova Pergunta' : `Editando Pergunta ${questionData.index + 1}`}
            </h2>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-thin">
                <div>
                    <label className="font-semibold text-stone-300 mb-1 block">Texto da Pergunta</label>
                    <textarea 
                        value={question.text} 
                        onChange={handleTextChange} 
                        className="w-full p-2 bg-gray-800 rounded-md" 
                        rows="3"
                        placeholder="Ex: Qual destes compositores é do período Barroco?"
                    />
                </div>
                <div>
                    <label className="font-semibold text-stone-300 mb-1 block">Opções (Marque a correta)</label>
                    <div className="space-y-2">
                        {question.options.map((opt, index) => (
                             <div key={index} className="flex items-center gap-2">
                                <input 
                                    type="radio" 
                                    name="correct_answer" 
                                    checked={question.correctAnswerIndex === index}
                                    onChange={() => handleSetCorrect(index)}
                                    className="h-5 w-5 flex-shrink-0 accent-green-500"
                                />
                                <input 
                                    type="text" 
                                    value={opt} 
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    className="w-full p-2 bg-gray-800 rounded-md" 
                                    placeholder={`Opção ${index + 1}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 flex gap-4 mt-6">
                 <button onClick={onCancel} className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                    <X size={20} /> Cancelar
                </button>
                <button onClick={handleSaveClick} className="flex-1 flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-500 rounded-lg transition-colors">
                   <Check size={20} /> Salvar Pergunta
                </button>
            </div>
        </div>
    );
};

export default QuestionEditor;
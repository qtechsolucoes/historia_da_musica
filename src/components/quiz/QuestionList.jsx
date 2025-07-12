import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';

const QuestionListItem = ({ question, index, onEdit, onRemove }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-black/30 rounded-lg border border-gray-700">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 text-left"
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <span className="font-semibold text-stone-200">Questão {index + 1}: <span className="font-normal italic">{question.text || "Nova Pergunta"}</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(index); }} className="p-1 text-blue-400 hover:text-blue-300"><Edit size={16} /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(index); }} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                </div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-2 border-t border-gray-700 space-y-2">
                            {question.options.map((option, oIndex) => (
                                <p key={oIndex} className={`text-sm rounded p-1 ${oIndex === question.correctAnswerIndex ? 'bg-green-500/20 text-green-300 font-bold' : 'text-stone-400'}`}>
                                    {oIndex === question.correctAnswerIndex ? '✓' : '•'} {option || `Opção ${oIndex + 1}`}
                                </p>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const QuestionList = ({ questions, onEdit, onRemove }) => {
    return (
        <div className="space-y-3">
            <h3 className="text-amber-200 font-semibold">Perguntas Criadas ({questions.length})</h3>
            <div className="space-y-2 max-h-[45vh] overflow-y-auto scrollbar-thin pr-2">
                {questions.map((q, index) => (
                    // --- CORREÇÃO DEFINITIVA: A chave deve ser única e estável ---
                    <QuestionListItem 
                        key={q.id} // Usar a ID da pergunta, não o índice
                        question={q} 
                        index={index} 
                        onEdit={onEdit}
                        onRemove={onRemove}
                    />
                ))}
            </div>
        </div>
    );
};

export default QuestionList;
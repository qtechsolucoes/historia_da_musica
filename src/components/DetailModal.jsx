import React, { useState, useEffect } from 'react';
import { X, Sparkles, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';

// --- ATENÇÃO: Acessando a API Key de forma segura ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const DetailModal = ({ content, onClose }) => {
    const [generatedAnalysis, setGeneratedAnalysis] = useState('');
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [showChat, setShowChat] = useState(false);

    useEffect(() => {
        setGeneratedAnalysis('');
        setIsAnalysisLoading(false);
        setChatHistory([]);
        setChatInput('');
        setIsChatLoading(false);
        setShowChat(false);
    }, [content]);

    if (!content) return null;

    const { type, data } = content;

    const typeTranslations = {
        composer: 'Compositor',
        instrument: 'Instrumento',
        work: 'Obra',
        genre: 'Gênero/Forma',
        style: 'Estilo/Técnica',
        ensemble: 'Conjunto'
    };

    const translatedType = typeTranslations[type] || type;
    const title = `${translatedType}: ${type === 'work' ? data.title : data.name}`;
    
    const handleGenerateAnalysis = async (title, composer) => {
        setIsAnalysisLoading(true);
        setGeneratedAnalysis('');
        const prompt = `Como um musicólogo especialista, forneça uma análise aprofundada e crítica sobre a obra "${title}" de ${composer}. Fale sobre seu contexto histórico, inovações harmônicas e estruturais, instrumentação e seu impacto emocional e legado na história da música. Responda em português do Brasil, em um único parágrafo longo.`;
        
        try {
            const history = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: history };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                setGeneratedAnalysis(result.candidates[0].content.parts[0].text);
            } else {
                setGeneratedAnalysis("Não foi possível gerar a análise. Verifique sua chave de API ou a resposta do servidor.");
            }
        } catch (error) {
            console.error("Erro ao chamar a API Gemini:", error);
            setGeneratedAnalysis("Ocorreu um erro de conexão ao tentar gerar a análise.");
        } finally {
            setIsAnalysisLoading(false);
        }
    };
    
    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || isChatLoading) return;

        const newHistory = [...chatHistory, { role: 'user', text: chatInput }];
        setChatHistory(newHistory);
        setChatInput('');
        setIsChatLoading(true);

        const prompt = `Você é ${content.data.name}, o compositor. Responda à pergunta do usuário da sua perspectiva, usando sua personalidade conhecida, contexto histórico e um tom apropriado para a sua época. Mantenha as respostas relativamente concisas. A pergunta do usuário é: "${chatInput}"`;
        
        try {
            const historyForApi = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: historyForApi };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            let botResponse = "Desculpe, não consegui pensar em uma resposta neste momento.";
            if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                botResponse = result.candidates[0].content.parts[0].text;
            }
            setChatHistory(prev => [...prev, { role: 'bot', text: botResponse }]);
        } catch (error) {
            console.error("Erro ao chamar a API Gemini para chat:", error);
            setChatHistory(prev => [...prev, { role: 'bot', text: "Houve um erro de conexão. Minhas desculpas." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const renderDetails = () => {
        switch (type) {
            case 'composer':
                return (
                    <>
                        <div className="flex flex-col md:flex-row gap-6">
                            <img src={data.image} alt={`[Imagem de ${data.name}]`} className="w-full md:w-48 h-48 object-cover rounded-md shadow-lg border-2 border-amber-900/50 flex-shrink-0"/>
                            <div className="flex-1">
                                <p className="font-semibold text-amber-200">{data.lifespan}</p>
                                <div className="max-h-48 overflow-y-auto scrollbar-thin pr-2 mt-2 text-stone-300 text-justify">
                                    {(data.bio || '').split('\n\n').map((paragraph, index) => (
                                        <p key={index} className="mb-2 last:mb-0">{paragraph}</p>
                                    ))}
                                </div>
                                <h4 className="font-bold mt-4 text-amber-100">Principais Obras:</h4>
                                <ul className="list-disc list-inside text-stone-300 mt-1">
                                    {data.majorWorks.map(work => <li key={work}>{work}</li>)}
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-amber-900/50 pt-4 mt-6">
                             <button onClick={() => setShowChat(!showChat)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all">
                                <MessageSquare size={18} />
                                {showChat ? 'Fechar Conversa' : 'Conversar com o Mestre (IA)'}
                            </button>
                            <AnimatePresence>
                            {showChat && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 overflow-hidden"
                                >
                                    <div className="h-64 bg-black/30 rounded-t-md border border-b-0 border-amber-900/50 p-4 overflow-y-auto flex flex-col space-y-2 scrollbar-thin">
                                        {chatHistory.map((msg, index) => (
                                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-justify ${msg.role === 'user' ? 'bg-amber-800/70 text-white' : 'bg-gray-700 text-stone-200'}`}>
                                                    {(msg.text || '').split('\n\n').map((paragraph, index) => (
                                                        <p key={index} className="mb-1 last:mb-0">{paragraph}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {isChatLoading && <div className="flex justify-start"><LoadingSpinner size="h-6 w-6"/></div>}
                                    </div>
                                    <form onSubmit={handleChatSubmit} className="flex">
                                        <input 
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder={`Pergunte a ${data.name}...`}
                                            className="flex-1 p-2 bg-gray-800 text-white border border-amber-900/50 rounded-bl-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                        <button type="submit" className="p-2 bg-amber-700 text-white rounded-br-md border border-amber-700 hover:bg-amber-600 transition-colors disabled:opacity-50" disabled={isChatLoading}>
                                            <Send size={20}/>
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>
                    </>
                );
            case 'instrument':
            case 'ensemble':
            case 'genre':
            case 'style':
                 return (
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                       {data.image && <img src={data.image} alt={`[Imagem de ${data.name}]`} className="w-full md:w-48 h-48 object-cover rounded-md shadow-lg border-2 border-amber-900/50 flex-shrink-0"/>}
                       <div className="flex-1 max-h-96 overflow-y-auto scrollbar-thin pr-2 text-stone-300 leading-relaxed text-justify">
                          {(data.description || '').split('\n\n').map((paragraph, index) => (
                            <p key={index} className="mb-2 last:mb-0">{paragraph}</p>
                          ))}
                       </div>
                   </div>
                 );
            case 'work':
                return (
                    <>
                        <p className="font-semibold text-amber-200 mb-4">Compositor: {data.composer} ({data.year})</p>
                        <div className="aspect-w-16 aspect-h-9 mb-4 rounded-lg overflow-hidden shadow-lg border-2 border-amber-900/50">
                            <iframe src={`https://www.youtube.com/embed/${data.youtubeId}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"></iframe>
                        </div>
                        <div className="max-h-40 overflow-y-auto scrollbar-thin pr-2 text-stone-300 italic leading-relaxed mb-6 text-justify">
                            {(data.analysis || '').split('\n\n').map((paragraph, index) => (
                                <p key={index} className="mb-2 last:mb-0">"{paragraph}"</p>
                            ))}
                        </div>
                        <div className="border-t border-amber-900/50 pt-4">
                            <button onClick={() => handleGenerateAnalysis(data.title, data.composer)} disabled={isAnalysisLoading} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-wait">
                                <Sparkles size={18} />
                                {isAnalysisLoading ? 'Analisando...' : '✨ Análise Aprofundada com IA'}
                            </button>
                            {isAnalysisLoading && <LoadingSpinner />}
                            {generatedAnalysis && (
                                <div className="mt-4 p-4 bg-black/30 rounded-md border border-amber-900/50">
                                    <h4 className="font-bold text-amber-200 mb-2">Análise da IA:</h4>
                                    <div className="text-stone-300 text-justify">
                                        {(generatedAnalysis || '').split('\n\n').map((paragraph, index) => (
                                            <p key={index} className="mb-2 last:mb-0">{paragraph}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                );
            default: return null;
        }
    }


    return (
        <AnimatePresence>
            {content && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-2xl max-w-4xl w-full p-6 md:p-8 border border-amber-800/60 relative max-h-[95vh] overflow-y-auto scrollbar-thin"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-3xl font-bold text-amber-300 mb-4 font-title">{title}</h2>
                        <div className="text-base text-stone-300 leading-relaxed">{renderDetails()}</div>
                        <button onClick={onClose} className="absolute top-3 right-3 text-stone-400 hover:text-amber-300 hover:bg-gray-700 rounded-full p-2 transition-colors" aria-label="Fechar modal">
                            <X size={24} />
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DetailModal;
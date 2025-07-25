import React, { useState, useEffect } from 'react';
import { X, Sparkles, MessageSquare, Send, ArrowLeft, FileText } from 'lucide-react'; // Ícone FileText adicionado
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';

const modalLayouts = {
  composer: 'max-w-6xl h-[90vh]',
  instrument: 'max-w-7xl h-[70vh]', // ALTURA ADICIONADA
  work: 'max-w-5xl h-[95vh]',
  genre: 'max-w-6xl h-[90vh]',      // ALTURA ADICIONADA
  style: 'max-w-6xl h-[90vh]',      // ALTURA ADICIONADA
  ensemble: 'max-w-6xl h-[90vh]',   // ALTURA ADICIONADA
  default: 'max-w-4xl h-[90vh]',    // ALTURA ADICIONADA
};

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
            const response = await fetch('http://localhost:5001/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Falha na resposta do servidor.");
            }
    
            const result = await response.json();
            if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                setGeneratedAnalysis(result.candidates[0].content.parts[0].text);
            } else {
                setGeneratedAnalysis("Não foi possível gerar a análise a partir da resposta da API.");
            }
        } catch (error) {
            console.error("Erro ao chamar o backend:", error);
            setGeneratedAnalysis(`Ocorreu um erro ao tentar gerar a análise: ${error.message}`);
        } finally {
            setIsAnalysisLoading(false);
        }
    };
    
    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || isChatLoading) return;
    
        const newHistory = [...chatHistory, { role: 'user', text: chatInput }];
        setChatHistory(newHistory);
        const userInput = chatInput;
        setChatInput('');
        setIsChatLoading(true);
    
        const prompt = `Você é ${content.data.name}, o compositor. Responda à pergunta do usuário da sua perspectiva, usando sua personalidade conhecida, contexto histórico e um tom apropriado para a sua época. Mantenha as respostas relativamente concisas. A pergunta do usuário é: "${userInput}"`;
        
        try {
            const response = await fetch('http://localhost:5001/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Falha na resposta do servidor.");
            }
    
            const result = await response.json();
            let botResponse = "Desculpe, não consegui pensar em uma resposta neste momento.";
            if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                botResponse = result.candidates[0].content.parts[0].text;
            }
            setChatHistory(prev => [...prev, { role: 'bot', text: botResponse }]);
        } catch (error) {
            console.error("Erro ao chamar o backend para chat:", error);
            setChatHistory(prev => [...prev, { role: 'bot', text: `Houve um erro de conexão: ${error.message}` }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const renderDetails = () => {
        switch (type) {
            case 'composer':
                return (
                    <div className="flex flex-col md:flex-row gap-6 h-full">
                        <div className="w-full md:w-80 flex-shrink-0">
                            <img src={data.image} alt={`[Imagem de ${data.name}]`} className="w-full h-auto object-cover rounded-md shadow-lg border-2 border-amber-900/50"/>
                        </div>
                        
                        <div className="flex-1 flex flex-col min-h-0">
                            {!showChat && (
                                <motion.div
                                    key="info-view"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex flex-col h-full"
                                >
                                    <div className="flex-shrink-0">
                                        <p className="font-semibold text-amber-200">{data.lifespan}</p>
                                    </div>
                                    <div className="flex-grow overflow-y-auto scrollbar-custom my-4 pr-3">
                                        <div className="text-stone-300 text-justify">
                                            {(data.bio || '').split('\n\n').map((p, i) => <p key={i} className="mb-4 last:mb-0">{p}</p>)}
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 border-t border-amber-900/50 pt-4">
                                        <h4 className="font-bold text-amber-100">Principais Obras:</h4>
                                        <ul className="list-disc list-inside text-stone-300 mt-1 mb-4">
                                            {data.majorWorks.map(work => <li key={work}>{work}</li>)}
                                        </ul>
                                        <button onClick={() => setShowChat(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all">
                                            <MessageSquare size={18} />
                                            Conversar com o Compositor
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {showChat && (
                                <motion.div
                                    key="chat-view"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex flex-col h-full"
                                >
                                    <button onClick={() => setShowChat(false)} className="flex-shrink-0 flex items-center gap-2 text-amber-300 hover:text-amber-100 mb-3 text-sm">
                                        <ArrowLeft size={16} />
                                        Voltar à Biografia
                                    </button>
                                    <div className="flex-grow flex flex-col bg-black/30 rounded-md border border-amber-900/50 overflow-hidden">
                                        <div className="flex-grow p-4 overflow-y-auto flex flex-col space-y-2 scrollbar-custom">
                                            {chatHistory.length === 0 && (
                                                <div className="text-center text-stone-400 text-sm m-auto">
                                                    Faça uma pergunta a {data.name} sobre sua vida, suas obras ou sua época.
                                                </div>
                                            )}
                                            {chatHistory.map((msg, index) => (
                                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-justify ${msg.role === 'user' ? 'bg-amber-800/70 text-white' : 'bg-gray-700 text-stone-200'}`}>
                                                        {(msg.text || '').split('\n\n').map((p, pIndex) => <p key={pIndex} className="mb-1 last:mb-0">{p}</p>)}
                                                    </div>
                                                </div>
                                            ))}
                                            {isChatLoading && <div className="flex justify-start"><LoadingSpinner size="h-6 w-6"/></div>}
                                        </div>
                                        <form onSubmit={handleChatSubmit} className="flex flex-shrink-0">
                                            <input 
                                                type="text"
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                placeholder={`Pergunte a ${data.name}...`}
                                                className="flex-1 p-2 bg-gray-800 text-white border-t border-amber-900/50 rounded-bl-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                            <button type="submit" className="p-2 bg-amber-700 text-white rounded-br-md border-t border-r border-b border-amber-700 hover:bg-amber-600 transition-colors disabled:opacity-50" disabled={isChatLoading}>
                                                <Send size={20}/>
                                            </button>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                );
case 'instrument':
    return (
       <div className="flex flex-col lg:flex-row gap-8 h-full">
           {/* Coluna da Esquerda: Imagem e Descrição */}
           <div className="lg:w-3/5 flex flex-col">
               <div className="flex flex-col md:flex-row gap-6 items-start">
                   {data.image && <img src={data.image} alt={`[Imagem de ${data.name}]`} className="w-full md:w-56 h-56 object-cover rounded-md shadow-lg border-2 border-amber-900/50 flex-shrink-0"/>}
                   <div className="flex-1 text-stone-300 leading-relaxed text-justify overflow-y-auto scrollbar-custom pr-2 max-h-[calc(90vh-150px)] md:max-h-full">
                       {(data.description || '').split('\n\n').map((p, i) => <p key={i} className="mb-2 last:mb-0">{p}</p>)}
                   </div>
               </div>
           </div>
           
           {/* Coluna da Direita: Vídeo do YouTube */}
           {data.youtubeId && (
              <div className="w-full lg:w-2/5 flex flex-col flex-grow">
                  {/* Este contêiner agora tem h-full para ocupar todo o espaço vertical */}
                  <div className="w-full h-full rounded-lg overflow-hidden shadow-lg border-2 border-amber-900/50">
                      <iframe 
                          src={`https://www.youtube.com/embed/${data.youtubeId}`}
                          title="YouTube video player" 
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen 
                          className="w-full h-full">
                      </iframe>
                  </div>
              </div>
           )}
      </div>
    );

            case 'ensemble':
            case 'genre':
            case 'style':
                return (
                    <div className="flex flex-col md:flex-row gap-6 items-start h-full">
                       {data.image && <img src={data.image} alt={`[Imagem de ${data.name}]`} className="w-full md:w-56 h-56 object-cover rounded-md shadow-lg border-2 border-amber-900/50 flex-shrink-0"/>}
                       <div className="flex-1 max-h-full overflow-y-auto scrollbar-custom pr-2 text-stone-300 leading-relaxed text-justify">
                          {(data.description || '').split('\n\n').map((p, i) => <p key={i} className="mb-2 last:mb-0">{p}</p>)}
                       </div>
                    </div>
                );

            case 'work':
                return (
                    <div className="flex flex-col h-full">
                        <p className="font-semibold text-amber-200 mb-4 flex-shrink-0">Compositor: {data.composer} ({data.year})</p>
                        
                        <div className="w-full flex-grow mb-4 rounded-lg overflow-hidden shadow-lg border-2 border-amber-900/50">
                            <iframe 
                                src={`https://www.youtube.com/embed/${data.youtubeId}`}
                                title="YouTube video player" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen 
                                className="w-full h-full">
                            </iframe>
                        </div>
                        
                        <div className="flex-shrink-0 space-y-4">
                            <div className="max-h-24 overflow-y-auto scrollbar-custom pr-2 text-stone-300 italic leading-relaxed text-justify">
                                {(data.analysis || '').split('\n\n').map((p, i) => <p key={i} className="mb-2 last:mb-0">"{p}"</p>)}
                            </div>
                            
                            <div className="border-t border-amber-900/50 pt-4 flex flex-wrap gap-4">
                                <button onClick={() => handleGenerateAnalysis(data.title, data.composer)} disabled={isAnalysisLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600/20 text-amber-200 border border-amber-500 rounded-md hover:bg-amber-600/40 transition-all disabled:opacity-50 disabled:cursor-wait">
                                    <Sparkles size={18} />
                                    {isAnalysisLoading ? 'Analisando...' : '✨ Análise com IA'}
                                </button>
                                {data.sheetMusicUrl && (
                                    <a 
                                        href={data.sheetMusicUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-200 border border-blue-500 rounded-md hover:bg-blue-600/40 transition-all"
                                    >
                                        <FileText size={18} />
                                        Ver Partitura
                                    </a>
                                )}
                            </div>

                            {isAnalysisLoading && <LoadingSpinner />}
                            
                            {generatedAnalysis && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: 'auto' }} 
                                    className="mt-4 p-4 bg-black/30 rounded-md border border-amber-900/50 max-h-40 overflow-y-auto scrollbar-custom"
                                >
                                    <h4 className="font-bold text-amber-200 mb-2">Análise da Inteligência Artificial:</h4>
                                    <div className="text-stone-300 text-justify">
                                        {(generatedAnalysis || '').split('\n\n').map((p, i) => <p key={i} className="mb-2 last:mb-0">{p}</p>)}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                );
            default: return null;
        }
    }

    const layoutClass = content ? modalLayouts[content.type] || modalLayouts.default : '';

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
                        className={`bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-lg shadow-2xl w-full p-6 md:p-8 border border-amber-800/60 relative flex flex-col ${layoutClass} max-h-[95vh]`}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-3xl font-bold text-amber-300 mb-4 font-title flex-shrink-0">{title}</h2>
                        <div className="flex-grow overflow-hidden relative">
                           <div className="absolute inset-0 overflow-y-auto scrollbar-custom pr-2">
                               {renderDetails()}
                           </div>
                        </div>
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
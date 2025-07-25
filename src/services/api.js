// src/services/api.js

import { useMusicAppStore } from '../store/musicAppStore';

// Obtém a URL do backend a partir das variáveis de ambiente
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

/**
 * Uma função wrapper para o 'fetch' que lida com a lógica de API de forma centralizada.
 * Ela adiciona automaticamente o token de autenticação, define os cabeçalhos corretos
 * e trata erros de resposta HTTP.
 *
 * @param {string} endpoint - O endpoint da API para o qual fazer a chamada (ex: '/auth/google').
 * @param {object} options - As opções da requisição (method, body, etc.).
 * @returns {Promise<any>} - O JSON da resposta.
 * @throws {Error} - Lança um erro se a resposta da rede não for 'ok'.
 */
const apiFetch = async (endpoint, options = {}) => {
    // Pega o token diretamente do estado do Zustand
    const { authToken } = useMusicAppStore.getState();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Se um token existir, adiciona-o ao cabeçalho de autorização
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${backendUrl}/api${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        // Tenta extrair uma mensagem de erro do corpo da resposta
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Erro HTTP: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
    }

    return response.json();
};

// --- Funções de API Exportadas ---
// Agora, criamos uma função específica para cada endpoint da nossa API.

// Realiza o login e retorna { user, token }
export const loginUser = (profile) => {
    return apiFetch('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ profile }),
    });
};

// Busca o placar de líderes
export const getLeaderboard = () => {
    return apiFetch('/leaderboard');
};

// Atualiza a pontuação e as estatísticas do usuário (rota protegida)
export const updateUserScoreAndStats = (score, statsUpdate) => {
    return apiFetch('/score', {
        method: 'POST',
        body: JSON.stringify({ score, statsUpdate }),
    });
};

// Adiciona uma nova conquista ao usuário (rota protegida)
export const addUserAchievement = (achievement) => {
    return apiFetch('/achievements', {
        method: 'POST',
        body: JSON.stringify({ achievement }),
    });
};

// Envia um prompt para a API do Gemini
export const generateGeminiContent = (prompt) => {
    return apiFetch('/gemini', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
};

// Exporta o objeto de serviço completo
const apiService = {
    loginUser,
    getLeaderboard,
    updateUserScoreAndStats,
    addUserAchievement,
    generateGeminiContent,
};

export default apiService;
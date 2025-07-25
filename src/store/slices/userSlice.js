// src/store/slices/userSlice.js

import { googleLogout } from '@react-oauth/google';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

// A "slice" é uma função que cria uma parte do nosso estado global.
// Ela recebe 'set' e 'get' como argumentos, assim como o store principal.
export const createUserSlice = (set, get) => ({
    currentUser: null,
    authToken: null,
    score: 0,
    achievements: [],
    stats: {},
    leaderboard: [],

    initialize: async () => {
        const token = localStorage.getItem('authToken');
        const loggedInUser = localStorage.getItem('user');

        if (token && loggedInUser) {
            try {
                const user = JSON.parse(loggedInUser);
                set({
                    currentUser: user,
                    authToken: token,
                    score: user.score || 0,
                    achievements: user.achievements || [],
                    stats: user.stats || {}
                });
            } catch (error) {
                console.error("Falha ao carregar dados do localStorage:", error);
                localStorage.clear();
            }
        }
        // Carregar o leaderboard
        try {
            const response = await fetch(`${backendUrl}/api/leaderboard`);
            if (!response.ok) throw new Error("Falha ao buscar ranking");
            const data = await response.json();
            set({ leaderboard: data });
        } catch (error) {
            console.error("Erro ao carregar o ranking:", error);
        }
    },

    login: async (profile) => {
        try {
            const backendResponse = await fetch(`${backendUrl}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile }),
            });
            if (!backendResponse.ok) throw new Error('Falha na autenticação com o backend');
            
            const { user, token } = await backendResponse.json();
            
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('authToken', token);

            set({
                currentUser: user,
                authToken: token,
                score: user.score,
                achievements: user.achievements || [],
                stats: user.stats || {}
            });
        } catch (error) {
            console.error("Erro no login:", error);
        }
    },

    logout: () => {
        googleLogout();
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        set({ currentUser: null, authToken: null, score: 0, achievements: [], stats: {}, leaderboard: get().leaderboard });
    },

    checkAndAwardAchievement: async (achievement) => {
        const { currentUser, achievements, authToken, setLastAchievement } = get();
        if (currentUser && !achievements.find(a => a.name === achievement.name)) {
            try {
                const response = await fetch(`${backendUrl}/api/achievements`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ achievement }),
                });
                if (response.ok) {
                    const updatedUser = await response.json();
                    if (updatedUser && updatedUser.achievements) {
                        set({ achievements: updatedUser.achievements });
                        setLastAchievement(achievement); // Chama a ação do uiSlice
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                    }
                }
            } catch (error) {
                console.error("Erro ao salvar conquista:", error);
            }
        }
    },

    updateScoreAndStats: async (newScore, statsUpdate) => {
        const { authToken } = get();
        if (!authToken) return;

        try {
            const response = await fetch(`${backendUrl}/api/score`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ score: newScore, statsUpdate }),
            });
            const updatedUser = await response.json();
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Atualiza o placar após a pontuação
            const leaderboardResponse = await fetch(`${backendUrl}/api/leaderboard`);
            const updatedLeaderboard = await leaderboardResponse.json();
            set({ leaderboard: updatedLeaderboard });

        } catch (error) {
            console.error("Erro ao salvar pontuação no backend:", error);
        }
    },
});
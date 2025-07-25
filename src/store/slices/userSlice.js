// src/store/slices/userSlice.js

import { googleLogout } from '@react-oauth/google';
import apiService from '../../services/api';

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
        
        try {
            const data = await apiService.getLeaderboard();
            set({ leaderboard: data });
        } catch (error) {
            console.error("Erro ao carregar o ranking:", error);
            // <-- MUDANÇA: Aciona a notificação de erro
            get().showNotification('Não foi possível carregar o ranking. Verifique sua conexão.');
        }
    },

    login: async (profile) => {
        try {
            const { user, token } = await apiService.loginUser(profile);
            
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
            // <-- MUDANÇA: Aciona a notificação de erro
            get().showNotification(`Falha no login: ${error.message}`);
        }
    },

    logout: () => {
        googleLogout();
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        set({ currentUser: null, authToken: null, score: 0, achievements: [], stats: {}, leaderboard: get().leaderboard });
    },

    checkAndAwardAchievement: async (achievement) => {
        const { currentUser, achievements, setLastAchievement } = get();
        if (currentUser && !achievements.find(a => a.name === achievement.name)) {
            try {
                const updatedUser = await apiService.addUserAchievement(achievement);
                if (updatedUser && updatedUser.achievements) {
                    set({ achievements: updatedUser.achievements });
                    setLastAchievement(achievement);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
            } catch (error) {
                console.error("Erro ao salvar conquista:", error);
                get().showNotification('Erro ao salvar sua nova conquista.');
            }
        }
    },

    updateScoreAndStats: async (newScore, statsUpdate) => {
        const { authToken } = get();
        if (!authToken) return;

        try {
            const updatedUser = await apiService.updateUserScoreAndStats(newScore, statsUpdate);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            const updatedLeaderboard = await apiService.getLeaderboard();
            set({ leaderboard: updatedLeaderboard });

        } catch (error) {
            console.error("Erro ao salvar pontuação no backend:", error);
            get().showNotification('Não foi possível salvar sua pontuação.');
        }
    },
});
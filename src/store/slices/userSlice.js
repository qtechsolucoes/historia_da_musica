import { googleLogout } from '@react-oauth/google';
// <-- MUDANÇA: Importa o nosso novo serviço de API
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
            // <-- MUDANÇA: Usa a função do serviço de API
            const data = await apiService.getLeaderboard();
            set({ leaderboard: data });
        } catch (error) {
            console.error("Erro ao carregar o ranking:", error);
        }
    },

    login: async (profile) => {
        try {
            // <-- MUDANÇA: Usa a função do serviço de API
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
            // Aqui você pode adicionar uma notificação de erro para o usuário
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
                // <-- MUDANÇA: Usa a função do serviço de API
                const updatedUser = await apiService.addUserAchievement(achievement);
                if (updatedUser && updatedUser.achievements) {
                    set({ achievements: updatedUser.achievements });
                    setLastAchievement(achievement); // Chama a ação do uiSlice
                    localStorage.setItem('user', JSON.stringify(updatedUser));
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
            // <-- MUDANÇA: Usa a função do serviço de API
            const updatedUser = await apiService.updateUserScoreAndStats(newScore, statsUpdate);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Atualiza o placar após a pontuação
            const updatedLeaderboard = await apiService.getLeaderboard();
            set({ leaderboard: updatedLeaderboard });

        } catch (error) {
            console.error("Erro ao salvar pontuação no backend:", error);
        }
    },
});
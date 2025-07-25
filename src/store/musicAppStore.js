import { create } from 'zustand';
import { createUserSlice } from './slices/userSlice';
import { createUISlice } from './slices/uiSlice';
import { createChallengesSlice } from './slices/challengesSlice';

// Conquistas que dependem de lógicas que cruzam diferentes slices
// podem ser definidas aqui para fácil acesso.
const ALL_ACHIEVEMENTS = {
    VIAJANTE_DO_TEMPO: { name: "Viajante do Tempo", description: "Visite todos os 5 períodos musicais." },
    // Adicione outras conquistas globais aqui se necessário
};

export const useMusicAppStore = create((set, get) => ({
    // O operador 'spread' (...) é usado para mesclar o estado e as ações
    // de cada slice em um único store global.
    ...createUserSlice(set, get),
    ...createUISlice(set, get),
    ...createChallengesSlice(set, get),

    // =================================================================================
    // AÇÕES QUE INTERAGEM COM MÚLTIPLOS SLICES
    // =================================================================================
    // Colocamos aqui ações que precisam acessar ou modificar
    // o estado de mais de um slice para manter a lógica centralizada.

    /**
     * Atualiza o período musical selecionado (uiSlice) e verifica se a
     * conquista "Viajante do Tempo" deve ser concedida (userSlice).
     * @param {string} id - O ID do período selecionado.
     */
    handleSelectPeriod: (id) => {
        // Modifica o estado do uiSlice
        set({ selectedPeriodId: id, activeChallenge: null });

        const { currentUser, stats, checkAndAwardAchievement } = get();

        // Interage com o estado do userSlice
        if (currentUser && stats) {
            const newPeriodsVisited = { ...(stats.periodsVisited || {}), [id]: (stats.periodsVisited?.[id] || 0) + 1 };
            
            // O ideal é que a atualização de stats também seja uma ação centralizada no userSlice,
            // mas por enquanto, mantemos aqui para simplicidade.
            const newStats = { ...stats, periodsVisited: newPeriodsVisited };
            set({ stats: newStats });

            // Lógica da conquista "Viajante do Tempo"
            if (Object.keys(newPeriodsVisited).length >= 5) {
                checkAndAwardAchievement(ALL_ACHIEVEMENTS.VIAJANTE_DO_TEMPO);
            }
        }
    },
}));

// Inicializa o estado do store (principalmente para carregar dados do usuário do localStorage)
// Esta chamada permanece aqui para garantir que os dados sejam carregados assim que a aplicação iniciar.
useMusicAppStore.getState().initialize();
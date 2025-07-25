// src/store/slices/uiSlice.js

export const createUISlice = (set, get) => ({
    selectedPeriodId: 'medieval',
    modalContent: null,
    lastAchievement: null,
    activeChallenge: null,
    
    notification: {
        isVisible: false,
        message: '',
        type: 'info',
    },

    // AÇÃO CORRIGIDA: Agora ela apenas define o estado.
    showNotification: (message, type = 'error') => {
        set({ notification: { isVisible: true, message, type } });
    },

    hideNotification: () => {
        set(state => ({ notification: { ...state.notification, isVisible: false } }));
    },
    
    handleSelectPeriod: (id) => {
        set({ selectedPeriodId: id, activeChallenge: null });
    },
    
    handleOpenModal: (type, data) => set({ modalContent: { type, data } }),
    
    handleCloseModal: () => set({ modalContent: null }),
    
    setLastAchievement: (achievement) => set({ lastAchievement: achievement }),

    setActiveChallenge: (challenge) => set({ activeChallenge: challenge }),
});
// src/store/slices/uiSlice.js

export const createUISlice = (set) => ({
    selectedPeriodId: 'medieval',
    modalContent: null,
    lastAchievement: null,
    activeChallenge: null,

    handleSelectPeriod: (id) => {
        set({ selectedPeriodId: id, activeChallenge: null });
        // A lógica de verificar conquistas por visitar períodos será movida
        // para a ação handleSelectPeriod no store principal.
    },
    
    handleOpenModal: (type, data) => set({ modalContent: { type, data } }),
    
    handleCloseModal: () => set({ modalContent: null }),
    
    setLastAchievement: (achievement) => set({ lastAchievement: achievement }),

    setActiveChallenge: (challenge) => set({ activeChallenge: challenge }),
});
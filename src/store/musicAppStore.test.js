// src/store/musicAppStore.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { useMusicAppStore } from './musicAppStore';
import { act } from '@testing-library/react';

describe('musicAppStore', () => {
  // Reseta o estado do store antes de cada teste
  beforeEach(() => {
    act(() => {
      useMusicAppStore.setState({ selectedPeriodId: 'medieval' });
    });
  });

  it('deve atualizar o selectedPeriodId quando handleSelectPeriod é chamado', () => {
    // Estado inicial
    expect(useMusicAppStore.getState().selectedPeriodId).toBe('medieval');

    // Executa a ação dentro de 'act' para garantir que as atualizações de estado sejam processadas
    act(() => {
      useMusicAppStore.getState().handleSelectPeriod('barroco');
    });

    // Verifica o novo estado
    expect(useMusicAppStore.getState().selectedPeriodId).toBe('barroco');
  });
});
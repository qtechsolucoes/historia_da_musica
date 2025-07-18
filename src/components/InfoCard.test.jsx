// src/components/InfoCard.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InfoCard from './InfoCard';

describe('InfoCard', () => {
  it('deve renderizar o título e subtítulo corretamente para um compositor', () => {
    const mockComposer = {
      name: 'J. S. Bach',
      lifespan: '1685-1750',
      image: 'path/to/image.jpg'
    };

    render(
      <InfoCard 
        item={mockComposer} 
        type="composer" 
        onCardClick={() => {}} 
      />
    );

    // Verifica se os textos estão no documento
    expect(screen.getByText('J. S. Bach')).toBeInTheDocument();
    expect(screen.getByText('1685-1750')).toBeInTheDocument();
  });
});
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GameOverOverlay from '../GameOverOverlay';

describe('GameOverOverlay', () => {
    test('announces a victory when the player won', () => {
        render(<GameOverOverlay winner="PLAYER" reason="Ascended to Divinity (8 Fate)" />);

        expect(screen.getByText('VICTORY')).toBeInTheDocument();
        expect(screen.getByText('You win')).toBeInTheDocument();
        expect(screen.getByText('Ascended to Divinity (8 Fate)')).toBeInTheDocument();
    });

    test('announces a defeat when the enemy won', () => {
        render(<GameOverOverlay winner="ENEMY" reason="System Meltdown (8 Overload)" />);

        expect(screen.getByText('DEFEAT')).toBeInTheDocument();
        expect(screen.getByText('The enemy wins')).toBeInTheDocument();
        expect(screen.getByText('System Meltdown (8 Overload)')).toBeInTheDocument();
    });

    test('shows the restart button only when a handler is supplied', () => {
        const { rerender } = render(<GameOverOverlay winner="PLAYER" reason="x" />);
        expect(screen.queryByRole('button', { name: /play again/i })).not.toBeInTheDocument();

        const onRestart = jest.fn();
        rerender(<GameOverOverlay winner="PLAYER" reason="x" onRestart={onRestart} />);

        fireEvent.click(screen.getByRole('button', { name: /play again/i }));
        expect(onRestart).toHaveBeenCalledTimes(1);
    });
});

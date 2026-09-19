import React from 'react';
import { DEVOTION_LABELS } from '../helpers/winConditions';

/**
 * End-of-game overlay. Rendered when the game mode reaches 'GAME_OVER',
 * reporting which side won and which win condition ended the game.
 *
 * This is also where Devotion is revealed -- it is secret for the whole game
 * and disclosed only now.
 */
export default function GameOverOverlay({ winner, reason, devotion, onRestart }) {
    const playerWon = winner === 'PLAYER';

    return (
        <div style={styles.backdrop}>
            <div style={styles.panel}>
                <div style={{ ...styles.banner, color: playerWon ? '#4ade80' : '#f87171' }}>
                    {playerWon ? 'VICTORY' : 'DEFEAT'}
                </div>
                <div style={styles.subtitle}>
                    {playerWon ? 'You win' : 'The enemy wins'}
                </div>
                {reason && <div style={styles.reason}>{reason}</div>}
                <div style={styles.devotion}>
                    {devotion
                        ? `Devotion revealed: ${DEVOTION_LABELS[devotion] || devotion}`
                        : 'Devotion revealed: none taken'}
                </div>
                {onRestart && (
                    <button style={styles.button} onClick={onRestart}>
                        Play Again
                    </button>
                )}
            </div>
        </div>
    );
}

const styles = {
    backdrop: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
    },
    panel: {
        background: '#12121a',
        border: '1px solid #2f2f42',
        borderRadius: '12px',
        padding: '40px 56px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
        fontFamily: 'inherit',
    },
    banner: {
        fontSize: '48px',
        fontWeight: 700,
        letterSpacing: '6px',
        marginBottom: '8px',
    },
    subtitle: {
        fontSize: '18px',
        color: '#c8c8d8',
        marginBottom: '16px',
    },
    reason: {
        fontSize: '15px',
        color: '#8f8fa6',
        marginBottom: '10px',
    },
    devotion: {
        fontSize: '13px',
        color: '#6f6f88',
        fontStyle: 'italic',
        marginBottom: '28px',
    },
    button: {
        background: '#2f2f42',
        color: '#f0f0f5',
        border: '1px solid #45455e',
        borderRadius: '6px',
        padding: '10px 28px',
        fontSize: '15px',
        cursor: 'pointer',
    },
};

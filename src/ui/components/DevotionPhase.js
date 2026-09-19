import React, { useState } from 'react';
import { stateSetters } from '../helpers/state';
import {
    DEVOTIONS,
    DEVOTION_LABELS,
    DEVOTION_DESCRIPTIONS,
    WIN_THRESHOLD,
} from '../helpers/winConditions';

/**
 * Devotion selection, run once at the start of the game.
 *
 * notes.txt: "At the start of the game, you may secretly choose a Devotion that
 * lowers one of these thresholds by 1. Devotion is only revealed when the game
 * ends." Choosing is optional, hence the explicit decline.
 */
const DevotionPhase = ({ onComplete }) => {
    const [selected, setSelected] = useState(null);

    const confirm = (devotion) => {
        stateSetters.setPlayerDevotion(devotion);
        stateSetters.setDevotionRevealed(false);
        onComplete?.(devotion);
    };

    return (
        <div style={styles.backdrop}>
            <div style={styles.panel}>
                <div style={styles.title}>Choose Your Devotion</div>
                <div style={styles.blurb}>
                    Lower one of your victory thresholds from {WIN_THRESHOLD} to {WIN_THRESHOLD - 1}.
                    Your choice stays secret until the game ends.
                </div>

                <div style={styles.options}>
                    {Object.values(DEVOTIONS).map((devotion) => {
                        const isSelected = selected === devotion;
                        return (
                            <button
                                key={devotion}
                                onClick={() => setSelected(devotion)}
                                style={{
                                    ...styles.option,
                                    ...(isSelected ? styles.optionSelected : null),
                                }}
                            >
                                <div style={styles.optionLabel}>{DEVOTION_LABELS[devotion]}</div>
                                <div style={styles.optionDesc}>{DEVOTION_DESCRIPTIONS[devotion]}</div>
                            </button>
                        );
                    })}
                </div>

                <div style={styles.actions}>
                    <button style={styles.secondary} onClick={() => confirm(null)}>
                        No Devotion
                    </button>
                    <button
                        style={{
                            ...styles.primary,
                            ...(selected ? null : styles.primaryDisabled),
                        }}
                        disabled={!selected}
                        onClick={() => confirm(selected)}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    backdrop: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9000,
    },
    panel: {
        background: '#12121a',
        border: '1px solid #2f2f42',
        borderRadius: '12px',
        padding: '32px 40px',
        maxWidth: '560px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
        fontFamily: 'inherit',
    },
    title: {
        fontSize: '26px',
        fontWeight: 700,
        letterSpacing: '2px',
        color: '#f0f0f5',
        marginBottom: '8px',
        textAlign: 'center',
    },
    blurb: {
        fontSize: '14px',
        color: '#8f8fa6',
        marginBottom: '24px',
        textAlign: 'center',
        lineHeight: 1.5,
    },
    options: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '24px',
    },
    option: {
        background: '#1b1b26',
        border: '1px solid #2f2f42',
        borderRadius: '8px',
        padding: '14px 16px',
        textAlign: 'left',
        cursor: 'pointer',
        color: '#f0f0f5',
        fontFamily: 'inherit',
    },
    optionSelected: {
        border: '1px solid #4ade80',
        background: '#17251d',
    },
    optionLabel: {
        fontSize: '16px',
        fontWeight: 600,
        marginBottom: '4px',
    },
    optionDesc: {
        fontSize: '13px',
        color: '#8f8fa6',
        lineHeight: 1.4,
    },
    actions: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
    },
    primary: {
        background: '#2f2f42',
        color: '#f0f0f5',
        border: '1px solid #45455e',
        borderRadius: '6px',
        padding: '10px 28px',
        fontSize: '15px',
        cursor: 'pointer',
    },
    primaryDisabled: {
        opacity: 0.45,
        cursor: 'not-allowed',
    },
    secondary: {
        background: 'transparent',
        color: '#8f8fa6',
        border: '1px solid #2f2f42',
        borderRadius: '6px',
        padding: '10px 28px',
        fontSize: '15px',
        cursor: 'pointer',
    },
};

export default DevotionPhase;

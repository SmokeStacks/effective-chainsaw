// Tests for player turn auto-pass (consumePlayerAction).

import { setupTestEnv } from '../testHarness';
import { state } from '../state';
import { consumePlayerAction, handlePlayerMine } from '../core';

beforeEach(() => {
    setupTestEnv();
});

// ── consumePlayerAction ──────────────────────────────────────────────────────

describe('consumePlayerAction', () => {
    test('decrements playerActions by 1', () => {
        state.playerActions = 3;
        consumePlayerAction();
        expect(state.playerActions).toBe(2);
    });

    test('does not go below 0', () => {
        state.playerActions = 0;
        consumePlayerAction();
        expect(state.playerActions).toBe(0);
    });

    test('passes turn to ENEMY when last action is spent', () => {
        state.playerActions = 1;
        state.currentPlayer = 'PLAYER';
        consumePlayerAction();
        expect(state.playerActions).toBe(0);
        expect(state.currentPlayer).toBe('ENEMY');
    });

    test('does NOT pass turn while actions remain', () => {
        state.playerActions = 2;
        state.currentPlayer = 'PLAYER';
        consumePlayerAction();
        expect(state.currentPlayer).toBe('PLAYER');
    });
});

// ── handlePlayerMine auto-pass ───────────────────────────────────────────────

describe('handlePlayerMine — auto-pass when last action', () => {
    test('passes turn to ENEMY when mine uses the last action', () => {
        state.playerActions = 1;
        state.playerBits = 0;
        state.currentPlayer = 'PLAYER';
        const result = handlePlayerMine();
        expect(result).toBe(true);
        expect(state.playerBits).toBe(1);
        expect(state.playerActions).toBe(0);
        expect(state.currentPlayer).toBe('ENEMY');
    });

    test('does NOT pass turn when actions remain after mine', () => {
        state.playerActions = 3;
        state.playerBits = 0;
        state.currentPlayer = 'PLAYER';
        handlePlayerMine();
        expect(state.currentPlayer).toBe('PLAYER');
    });
});


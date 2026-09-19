import { startTurn, endTurn, enemyPerformAction } from '../core';
import { state, stateSetters } from '../state';
import { eventManager } from '../eventManager';

// Regression coverage for the GAME_OVER guards in core.js.
//
// Before these guards existed the win/loss conditions were inert: the effect set
// mode to 'GAME_OVER', but the turn loop kept running and startTurn's
// unconditional setMode('NORMAL') immediately clobbered it, so play continued
// forever. These tests pin that the loop actually halts.

describe('GAME_OVER halts the turn loop', () => {
    let publishSpy;

    beforeEach(() => {
        // Stub every setter so core.js can run without React mounted, and so we
        // can observe which ones a guarded call would have reached.
        Object.keys(stateSetters).forEach(key => {
            stateSetters[key] = jest.fn();
        });

        publishSpy = jest.spyOn(eventManager, 'publish').mockImplementation(() => {});

        state.mode = 'NORMAL';
        state.currentPlayer = 'PLAYER';
        state.priorityLeft = true;
        state.playerActions = 3;
        state.enemyActions = 3;
    });

    afterEach(() => {
        publishSpy.mockRestore();
        jest.clearAllMocks();
    });

    describe('startTurn', () => {
        test('does not reset the mode once the game is over', () => {
            state.mode = 'GAME_OVER';

            startTurn(true);

            // The specific bug: this call used to overwrite GAME_OVER.
            expect(stateSetters.setMode).not.toHaveBeenCalled();
            expect(stateSetters.setCurrentPlayer).not.toHaveBeenCalled();
            expect(state.mode).toBe('GAME_OVER');
        });

        test('publishes no turnStart events once the game is over', () => {
            state.mode = 'GAME_OVER';

            startTurn(true);

            const events = publishSpy.mock.calls.map(([name]) => name);
            expect(events).not.toContain('turnStart');
        });
    });

    describe('endTurn', () => {
        test('does not advance priority or publish endTurn once the game is over', () => {
            state.mode = 'GAME_OVER';

            endTurn();

            expect(stateSetters.setPriorityLeft).not.toHaveBeenCalled();
            const events = publishSpy.mock.calls.map(([name]) => name);
            expect(events).not.toContain('endTurn');
            expect(state.priorityLeft).toBe(true);
        });
    });

    describe('enemyPerformAction', () => {
        // enemyActions === 0 with playerActions > 0 takes the shortest path
        // through the function: it hands control straight back to the player.
        // That makes it a clean differential pair for the guard.
        test('hands control back to the player while the game is live', async () => {
            state.mode = 'NORMAL';
            state.enemyActions = 0;
            state.playerActions = 1;

            await enemyPerformAction();

            expect(stateSetters.setMode).toHaveBeenCalledWith('NORMAL');
            expect(stateSetters.setCurrentPlayer).toHaveBeenCalledWith('PLAYER');
        });

        test('does nothing once the game is over', async () => {
            state.mode = 'GAME_OVER';
            state.enemyActions = 0;
            state.playerActions = 1;

            await enemyPerformAction();

            expect(stateSetters.setMode).not.toHaveBeenCalled();
            expect(stateSetters.setCurrentPlayer).not.toHaveBeenCalled();
        });
    });
});

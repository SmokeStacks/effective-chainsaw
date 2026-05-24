// Tests for simple per-action handlers in core.js: Mine, Draft, Draw.
//
// Mine = "Gain 1 Bit" action, costs 1 action.
// Draft = pull a Dreamer onto the selectedCard slot for placement (the 1-bit
//   cost is paid when the card is actually placed, not when selected).
// Draw = simple library->hand draw, absorbed by wounds per notes.txt.

import { setupTestEnv } from '../testHarness';
import { state } from '../state';

import { handlePlayerMine, playerDraft, playerDraw } from '../core';
import { draw as playerDrawFromPlayer } from '../player';

beforeEach(() => {
    setupTestEnv();
});

describe('handlePlayerMine (Mine action)', () => {
    test('returns true and gains 1 bit, spends 1 action', () => {
        state.playerActions = 3;
        state.playerBits = 4;

        const result = handlePlayerMine();

        expect(result).toBe(true);
        expect(state.playerBits).toBe(5);
        expect(state.playerActions).toBe(2);
    });

    test('returns false and changes nothing if no actions available', () => {
        state.playerActions = 0;
        state.playerBits = 4;

        const result = handlePlayerMine();

        expect(result).toBe(false);
        expect(state.playerBits).toBe(4);
        expect(state.playerActions).toBe(0);
    });

    test('mine while overloaded absorbs the gain and decrements overload', () => {
        // Regression: this whole chain used to bypass overload entirely
        // because core.js -> game.js had a broken playerGainBits.
        state.playerActions = 3;
        state.playerBits = 4;
        state.playerOverload = 2;

        handlePlayerMine();

        // The 1 bit gained is absorbed by overload
        expect(state.playerBits).toBe(4);
        expect(state.playerOverload).toBe(1);
        // The action is still consumed
        expect(state.playerActions).toBe(2);
    });

    test('multiple mines drain overload then start adding bits', () => {
        state.playerActions = 3;
        state.playerBits = 0;
        state.playerOverload = 2;

        handlePlayerMine(); // absorbs 1, overload=1
        handlePlayerMine(); // absorbs 1, overload=0
        handlePlayerMine(); // gains 1 bit, overload still 0

        expect(state.playerBits).toBe(1);
        expect(state.playerOverload).toBe(0);
        expect(state.playerActions).toBe(0);
    });
});

describe('playerDraft', () => {
    test('selects the first draftable card and flags it as draft-from-hand', () => {
        // Pre-test sanity: harness gives us null/false defaults
        expect(state.selectedCard).toBe(null);
        expect(state.draftSelected).toBe(false);

        playerDraft();

        expect(state.selectedCard).not.toBe(null);
        expect(state.draftSelected).toBe(true);
        expect(state.selectedInHand).toBe(true);
    });

    test('selected draft card is a runtime entity with numeric keyword stats', () => {
        // Validates the createDraft() factory hasn't regressed back to booleans.
        playerDraft();

        const card = state.selectedCard;
        expect(card).toBeTruthy();
        expect(typeof card.id).toBe('string');
        expect(card.card).toBeDefined();
        for (const key of ['armored', 'deathless', 'stealth', 'override', 'solo']) {
            expect(typeof card[key]).toBe('number');
        }
    });
});

describe('draw (via core re-export)', () => {
    test('core.playerDraw delegates to player.draw (same function reference)', () => {
        // After the cleanup, core.js should not own a separate playerDraw
        // implementation; it should be the same function as player.draw to
        // avoid the stale-destructuring bug in the old version.
        expect(playerDraw).toBe(playerDrawFromPlayer);
    });

    test('drawing N from library moves N cards into hand', () => {
        state.playerLibrary = [
            { id: 'a', card: { name: 'A' } },
            { id: 'b', card: { name: 'B' } },
            { id: 'c', card: { name: 'C' } },
        ];
        state.playerHand = [];

        playerDraw(2);

        expect(state.playerHand.map(c => c.id)).toEqual(['a', 'b']);
        expect(state.playerLibrary.map(c => c.id)).toEqual(['c']);
    });

    test('draw is absorbed by wounds 1-for-1', () => {
        state.playerLibrary = [
            { id: 'a', card: {} }, { id: 'b', card: {} }, { id: 'c', card: {} },
        ];
        state.playerHand = [];
        state.playerWounds = 1;

        playerDraw(2);

        expect(state.playerHand).toHaveLength(1);
        expect(state.playerWounds).toBe(0);
    });
});

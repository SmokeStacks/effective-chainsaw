// Deck-out: drawing from an empty Pandora loses the game.
//
// Previously both draw() implementations guarded with
// `if (remaining > 0 && library.length > 0)`, so an empty library made the
// draw a silent no-op -- no card, no error, no loss. Two 40-card decks drawing
// at least once per turn can reach that state, at which point the game had no
// way to end except by one of the three resource thresholds.
//
// The subtlety worth pinning down is the interaction with Wounds. notes.txt:
// "Cannot ... draw cards if Wounded ... Each point you would gain decreases the
// status by the same amount." A draw absorbed by a Wound is a draw that never
// happened, so it must NOT deck you out -- otherwise a wounded player with an
// empty deck loses on a draw they were never allowed to make.

import { setupTestEnv } from '../testHarness';
import { state } from '../state';
import { draw as playerDraw } from '../player';
import { draw as enemyDraw } from '../enemy';
import { evaluateWinConditions, WIN_REASONS } from '../winConditions';
import { eventManager } from '../eventManager';

beforeEach(() => {
    setupTestEnv();
});

const cards = (n) => Array.from({ length: n }, (_, i) => ({ id: `c${i}`, card: { name: `c${i}` } }));

describe('player deck-out latching', () => {
    test('drawing from an empty library sets the flag', () => {
        state.playerLibrary = [];
        state.playerHand = [];

        playerDraw(1);

        expect(state.playerDeckedOut).toBe(true);
    });

    test('drawing with enough cards does not set the flag', () => {
        state.playerLibrary = cards(3);
        state.playerHand = [];

        playerDraw(1);

        expect(state.playerDeckedOut).toBe(false);
        expect(state.playerHand).toHaveLength(1);
        expect(state.playerLibrary).toHaveLength(2);
    });

    test('drawing the last card exactly does not deck you out', () => {
        state.playerLibrary = cards(1);
        state.playerHand = [];

        playerDraw(1);

        expect(state.playerDeckedOut).toBe(false);
        expect(state.playerLibrary).toHaveLength(0);
    });

    // The failure is on the second card, not the first.
    test('drawing 2 from a 1-card library decks you out', () => {
        state.playerLibrary = cards(1);
        state.playerHand = [];

        playerDraw(2);

        expect(state.playerDeckedOut).toBe(true);
    });

    test('a draw fully absorbed by Wounds does not deck you out', () => {
        state.playerLibrary = [];
        state.playerHand = [];
        state.playerWounds = 2;

        playerDraw(1);

        expect(state.playerDeckedOut).toBe(false);
        // The wound absorbed the draw and was reduced by it.
        expect(state.playerWounds).toBe(1);
        expect(state.playerHand).toHaveLength(0);
    });

    // Wounds only absorb up to their own value; the excess is a real draw.
    test('a draw only partly absorbed by Wounds still decks you out', () => {
        state.playerLibrary = [];
        state.playerHand = [];
        state.playerWounds = 1;

        playerDraw(2);

        expect(state.playerDeckedOut).toBe(true);
        expect(state.playerWounds).toBe(0);
    });
});

describe('enemy deck-out latching', () => {
    test('drawing from an empty library sets the flag', () => {
        state.enemyLibrary = [];
        state.enemyHand = [];

        enemyDraw(1);

        expect(state.enemyDeckedOut).toBe(true);
    });

    test('drawing with enough cards does not set the flag', () => {
        state.enemyLibrary = cards(3);
        state.enemyHand = [];

        enemyDraw(1);

        expect(state.enemyDeckedOut).toBe(false);
        expect(state.enemyHand).toHaveLength(1);
    });

    test('a draw fully absorbed by Wounds does not deck you out', () => {
        state.enemyLibrary = [];
        state.enemyHand = [];
        state.enemyWounds = 2;

        enemyDraw(1);

        expect(state.enemyDeckedOut).toBe(false);
        expect(state.enemyWounds).toBe(1);
    });

    test('the two sides latch independently', () => {
        state.playerLibrary = cards(5);
        state.enemyLibrary = [];

        playerDraw(1);
        enemyDraw(1);

        expect(state.playerDeckedOut).toBe(false);
        expect(state.enemyDeckedOut).toBe(true);
    });
});

describe('deckedOut event', () => {
    test('is published once, on the transition only', () => {
        const seen = [];
        const handler = (d) => seen.push(d);
        eventManager.subscribe('deckedOut', handler);

        state.playerLibrary = [];
        state.playerHand = [];

        playerDraw(1);
        // A second failed draw before the game-over effect runs must not
        // re-announce.
        playerDraw(1);

        eventManager.unsubscribe('deckedOut', handler);

        expect(seen).toEqual([{ side: 'PLAYER' }]);
    });

    test('is not published when the draw succeeds', () => {
        const seen = [];
        const handler = (d) => seen.push(d);
        eventManager.subscribe('deckedOut', handler);

        state.playerLibrary = cards(3);
        playerDraw(1);

        eventManager.unsubscribe('deckedOut', handler);

        expect(seen).toEqual([]);
    });
});

describe('deck-out reaches the win evaluation', () => {
    test('an empty player draw ends the game as an enemy win', () => {
        state.playerLibrary = [];
        state.playerHand = [];

        playerDraw(1);

        expect(evaluateWinConditions({
            playerDeckedOut: state.playerDeckedOut,
            enemyDeckedOut: state.enemyDeckedOut,
        })).toEqual({ winner: 'ENEMY', reason: WIN_REASONS.DECKED_OUT });
    });

    test('the flag stays latched across later successful draws', () => {
        state.playerLibrary = [];
        state.playerHand = [];

        playerDraw(1);
        expect(state.playerDeckedOut).toBe(true);

        // A card returning to Pandora later must not un-lose the game.
        state.playerLibrary = cards(2);
        playerDraw(1);

        expect(state.playerDeckedOut).toBe(true);
    });
});

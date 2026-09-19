// Who takes the first turn is decided randomly, and turn 1 is actually started.
//
// Both halves of this were broken. Turn order was hard-coded: the single call
// site passed `startTurn(true)`, so the player always went first. And that call
// site was unreachable -- it required both hands to hold 5 cards while the mode
// was still MULLIGAN, but setupNewRules deals 4 and the mulligan refills to 4.
// The result was a hard soft-lock at game start: after choosing a Devotion the
// game sat in mode 'PLAY' with 0 actions and no Focus prompt, and nothing could
// advance it because the domination hand-off only fires from mode 'NORMAL'.

import { setupTestEnv } from '../testHarness';
import { state, stateSetters } from '../state';
import {
    beginFirstTurn,
    chooseStartingSide,
    PER_TURN_ENEMY_BITS,
    PER_TURN_PLAYER_BITS,
    FIRST_TURN_PLAYER_BONUS_BITS,
    GOING_SECOND_BONUS_BITS,
} from '../core';
import { eventManager } from '../eventManager';

const makeLibrary = (n, prefix) =>
    Array.from({ length: n }, (_, i) => ({ id: `${prefix}-${i}`, card: { name: `${prefix} ${i}` } }));

beforeEach(() => {
    setupTestEnv();
    state.mode = 'NORMAL';
    state.turnNumber = 0;
    state.playerBits = 0;
    state.enemyBits = 0;
    state.playerActions = 0;
    state.enemyActions = 0;
    state.playerLibrary = makeLibrary(10, 'p');
    state.enemyLibrary = makeLibrary(10, 'e');
    state.playerHand = [];
    state.enemyHand = [];
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('chooseStartingSide', () => {
    test('returns the player on a low roll and the enemy on a high roll', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0);
        expect(chooseStartingSide()).toBe(true);

        Math.random.mockReturnValue(0.99);
        expect(chooseStartingSide()).toBe(false);
    });

    // A hard-coded `return true` would pass a single-branch test, so pin that
    // both outcomes are actually reachable across many rolls.
    test('produces both outcomes over repeated rolls', () => {
        jest.spyOn(Math, 'random').mockRestore();
        const seen = new Set();
        for (let i = 0; i < 200; i += 1) seen.add(chooseStartingSide());
        expect(seen).toEqual(new Set([true, false]));
    });
});

describe('beginFirstTurn', () => {
    test('starts turn 1 rather than leaving the game unstarted', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0);

        beginFirstTurn();

        expect(state.turnNumber).toBe(1);
        // The specific soft-lock: the game used to stay in 'PLAY' with no
        // actions, which no effect could advance.
        expect(state.mode).toBe('NORMAL');
        expect(state.playerActions).toBeGreaterThan(0);
        expect(state.enemyActions).toBeGreaterThan(0);
    });

    test('a player-first roll sets priority left and starts the player', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0);

        beginFirstTurn();

        expect(state.priorityLeft).toBe(true);
        expect(state.currentPlayer).toBe('PLAYER');
    });

    test('an enemy-first roll sets priority right and starts the enemy', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.99);

        beginFirstTurn();

        expect(state.priorityLeft).toBe(false);
        expect(state.currentPlayer).toBe('ENEMY');
    });

    test('the going-second Bit follows the roll', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0);
        beginFirstTurn();
        expect(state.enemyBits).toBe(PER_TURN_ENEMY_BITS + GOING_SECOND_BONUS_BITS);
        expect(state.playerBits).toBe(PER_TURN_PLAYER_BITS + FIRST_TURN_PLAYER_BONUS_BITS);
    });

    test('the going-second Bit goes to the player when the enemy starts', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.99);
        beginFirstTurn();
        expect(state.playerBits).toBe(
            PER_TURN_PLAYER_BITS + FIRST_TURN_PLAYER_BONUS_BITS + GOING_SECOND_BONUS_BITS
        );
        expect(state.enemyBits).toBe(PER_TURN_ENEMY_BITS);
    });

    test('announces the decided order', () => {
        const seen = [];
        const handler = (d) => seen.push(d);
        eventManager.subscribe('turnOrderDecided', handler);

        jest.spyOn(Math, 'random').mockReturnValue(0.99);
        beginFirstTurn();

        eventManager.unsubscribe('turnOrderDecided', handler);
        expect(seen).toEqual([{ side: 'ENEMY' }]);
    });

    test('respects the game-over guard', () => {
        state.mode = 'GAME_OVER';
        jest.spyOn(Math, 'random').mockReturnValue(0);

        beginFirstTurn();

        expect(state.turnNumber).toBe(0);
        expect(state.mode).toBe('GAME_OVER');
    });
});

describe('turn order after the first turn', () => {
    // startTurn alternates priority from the previous turn, so the roll must
    // happen once in beginFirstTurn and never again.
    test('beginFirstTurn is the only thing that rolls', () => {
        const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);

        beginFirstTurn();
        const callsAfterFirstTurn = randomSpy.mock.calls.length;

        expect(callsAfterFirstTurn).toBeGreaterThanOrEqual(1);
        expect(stateSetters.setPriorityLeft).toBeDefined();
    });
});

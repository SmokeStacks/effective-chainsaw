// Unit tests for resource-management functions.
//
// Per notes.txt:
//   "Cannot gain Fate if Burdened, draw cards if Wounded, gain Bits if
//    Overloaded, or gain Boost if the entity is Frozen. Each point you would
//    gain decreases the status by the same amount."
//
// So the rule for gain(N) with a status of S is:
//   absorbed   = min(N, S)
//   gained     = N - absorbed
//   newStatus  = S - absorbed
//
// We test this against both the player/* and enemy/* implementations, and
// against the higher-level wrappers re-exported via game.js / core.js so that
// the "two implementations" bug is caught directly.

import { setupTestEnv } from '../testHarness';
import { state } from '../state';

import * as player from '../player';
import * as enemy from '../enemy';
import * as game from '../game';
import * as core from '../core';

beforeEach(() => {
    setupTestEnv();
});

describe('player resource gains — status absorption (per notes.txt)', () => {
    test('gainBits with no overload adds straight', () => {
        player.gainBits(3);
        expect(state.playerBits).toBe(4 + 3);
        expect(state.playerOverload).toBe(0);
    });

    test('gainBits with overload >= amount absorbs fully and decrements overload', () => {
        state.playerOverload = 5;
        player.gainBits(3);
        expect(state.playerBits).toBe(4); // unchanged
        expect(state.playerOverload).toBe(5 - 3);
    });

    test('gainBits with overload < amount partially absorbs and zeroes overload', () => {
        state.playerOverload = 2;
        player.gainBits(5);
        expect(state.playerBits).toBe(4 + 3);
        expect(state.playerOverload).toBe(0);
    });

    test('gainFate with no burden adds straight', () => {
        player.gainFate(2);
        expect(state.playerFate).toBe(2);
        expect(state.playerBurden).toBe(0);
    });

    test('gainFate with burden >= amount absorbs fully and decrements burden', () => {
        state.playerBurden = 4;
        player.gainFate(3);
        expect(state.playerFate).toBe(0);
        expect(state.playerBurden).toBe(4 - 3);
    });

    test('gainFate with burden < amount partially absorbs and zeroes burden', () => {
        state.playerBurden = 1;
        player.gainFate(3);
        expect(state.playerFate).toBe(2);
        expect(state.playerBurden).toBe(0);
    });
});

describe('enemy resource gains — status absorption', () => {
    test('gainBits absorbs against enemy overload', () => {
        state.enemyBits = 0;
        state.enemyOverload = 2;
        enemy.gainBits(3);
        expect(state.enemyBits).toBe(1);
        expect(state.enemyOverload).toBe(0);
    });

    test('gainFate absorbs against enemy burden', () => {
        state.enemyBurden = 5;
        enemy.gainFate(2);
        expect(state.enemyFate).toBe(0);
        expect(state.enemyBurden).toBe(5 - 2);
    });
});

describe('actions — Lag absorbs action gains point-for-point', () => {
    // Lag is the Action-side status, so it follows the same notes.txt rule:
    // it absorbs gains 1-for-1 and is decremented by the absorbed amount.
    // It previously reduced every gain without ever being consumed, which made
    // a single point of Lag a permanent tax instead of a one-shot.

    test('gainActions with no lag adds straight', () => {
        const before = state.playerActions;
        player.gainActions(2);
        expect(state.playerActions).toBe(before + 2);
        expect(state.playerLag).toBe(0);
    });

    test('gainActions with lag >= amount absorbs fully and decrements lag', () => {
        const before = state.playerActions;
        state.playerLag = 4;
        player.gainActions(3);
        expect(state.playerActions).toBe(before);
        expect(state.playerLag).toBe(4 - 3);
    });

    test('gainActions with lag < amount partially absorbs and zeroes lag', () => {
        const before = state.playerActions;
        state.playerLag = 1;
        player.gainActions(3);
        expect(state.playerActions).toBe(before + 2);
        expect(state.playerLag).toBe(0);
    });

    test('enemy gainActions absorbs against enemy lag', () => {
        const before = state.enemyActions;
        state.enemyLag = 2;
        enemy.gainActions(3);
        expect(state.enemyActions).toBe(before + 1);
        expect(state.enemyLag).toBe(0);
    });
});

describe('game.js wrappers honor the same semantics as player/enemy', () => {
    // Regression test for the duplicate-implementation bug: game.js's
    // playerGainBits historically ignored overload entirely. After fixing,
    // game.playerGainBits and player.gainBits must behave identically.

    test('game.playerGainBits respects overload', () => {
        state.playerOverload = 1;
        game.playerGainBits(2);
        expect(state.playerBits).toBe(4 + 1);
        expect(state.playerOverload).toBe(0);
    });

    test('game.enemyGainBits respects overload', () => {
        state.enemyOverload = 3;
        game.enemyGainBits(2);
        expect(state.enemyBits).toBe(0);
        expect(state.enemyOverload).toBe(1);
    });

    test('game.playerGainFate respects burden', () => {
        state.playerBurden = 1;
        game.playerGainFate(3);
        expect(state.playerFate).toBe(2);
        expect(state.playerBurden).toBe(0);
    });

    test('game.playerGainActions respects lag', () => {
        const before = state.playerActions;
        state.playerLag = 1;
        game.playerGainActions(3);
        expect(state.playerActions).toBe(before + 2);
        expect(state.playerLag).toBe(0);
    });
});

describe('core.js wrappers honor the same semantics as player/enemy', () => {
    // core.js is the module glossary.js imports its resource helpers from, so
    // this is the path every ability actually takes. It used to define its own
    // bare-increment copies of these functions, which meant Burden never
    // blocked Fate and Lag never absorbed Action gains for any ability in the
    // game, even though player.js implemented both rules correctly.

    test('core.playerGainFate absorbs against burden', () => {
        state.playerBurden = 4;
        core.playerGainFate(3);
        expect(state.playerFate).toBe(0);
        expect(state.playerBurden).toBe(4 - 3);
    });

    test('core.playerGainFate partially absorbs and zeroes burden', () => {
        state.playerBurden = 1;
        core.playerGainFate(3);
        expect(state.playerFate).toBe(2);
        expect(state.playerBurden).toBe(0);
    });

    test('core.enemyGainFate absorbs against enemy burden', () => {
        state.enemyBurden = 5;
        core.enemyGainFate(2);
        expect(state.enemyFate).toBe(0);
        expect(state.enemyBurden).toBe(5 - 2);
    });

    test('core.playerGainActions absorbs against lag', () => {
        const before = state.playerActions;
        state.playerLag = 4;
        core.playerGainActions(3);
        expect(state.playerActions).toBe(before);
        expect(state.playerLag).toBe(4 - 3);
    });

    test('core.enemyGainActions absorbs against enemy lag', () => {
        const before = state.enemyActions;
        state.enemyLag = 2;
        core.enemyGainActions(3);
        expect(state.enemyActions).toBe(before + 1);
        expect(state.enemyLag).toBe(0);
    });

    test('core.playerLoseActions clamps at 0', () => {
        state.playerActions = 1;
        core.playerLoseActions(5);
        expect(state.playerActions).toBe(0);
    });

    test('core wrappers are the same function objects as player/enemy', () => {
        // Guards against a future copy being reintroduced alongside the canonical one.
        expect(core.playerGainFate).toBe(player.gainFate);
        expect(core.enemyGainFate).toBe(enemy.gainFate);
        expect(core.playerGainActions).toBe(player.gainActions);
        expect(core.enemyGainActions).toBe(enemy.gainActions);
    });
});

describe('losses — never go below zero', () => {
    test('playerLoseBits clamps at 0', () => {
        state.playerBits = 1;
        player.loseBits(5);
        expect(state.playerBits).toBe(0);
    });

    test('enemyLoseBits clamps at 0', () => {
        state.enemyBits = 2;
        enemy.loseBits(10);
        expect(state.enemyBits).toBe(0);
    });

    test('playerLoseSurge clamps at 0 via game.js wrapper', () => {
        state.playerSurge = 1;
        game.playerLoseSurge(5);
        expect(state.playerSurge).toBe(0);
    });
});

describe('ashes / surge — plain add/subtract', () => {
    test('gainAshes adds', () => {
        player.gainAshes(2);
        expect(state.playerAshes).toBe(2);
    });

    test('gainSurge adds', () => {
        player.gainSurge(3);
        expect(state.playerSurge).toBe(3);
    });

    test('enemy gainAshes adds', () => {
        enemy.gainAshes(2);
        expect(state.enemyAshes).toBe(2);
    });
});

describe('draw — wounds block draws point-for-point', () => {
    test('drawing N with no wounds draws N cards from library', () => {
        state.playerLibrary = makeFakeLibrary(5);
        player.draw(3);
        expect(state.playerHand).toHaveLength(3);
        expect(state.playerLibrary).toHaveLength(2);
        expect(state.playerWounds).toBe(0);
    });

    test('drawing N with wounds >= N absorbs all draws and decrements wounds', () => {
        state.playerLibrary = makeFakeLibrary(5);
        state.playerWounds = 4;
        player.draw(2);
        expect(state.playerHand).toHaveLength(0);
        expect(state.playerLibrary).toHaveLength(5);
        expect(state.playerWounds).toBe(4 - 2);
    });

    test('drawing N with wounds < N partially absorbs and zeroes wounds', () => {
        state.playerLibrary = makeFakeLibrary(5);
        state.playerWounds = 1;
        player.draw(3);
        expect(state.playerHand).toHaveLength(2);
        expect(state.playerWounds).toBe(0);
    });
});

function makeFakeLibrary(n) {
    return Array.from({ length: n }, (_, i) => ({ id: `card-${i}`, card: { name: `Card ${i}` } }));
}

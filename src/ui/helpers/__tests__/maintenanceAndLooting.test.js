// Tests for two core-loop rules from notes.txt that were previously missing:
//
//   Maintenance (notes.txt:87) -- "If a player has 2 or more Wounds, they gain
//   1 Wound from infection. Likewise for Burden which causes depression."
//
//   Looting (notes.txt:123) -- "The first uncontested attack (0 blockers) each
//   turn also awards the attacker 2 Bits."

import { setupTestEnv } from '../testHarness';
import { state, stateSetters } from '../state';
import {
    applyInfectionAndDepression,
    startTurn,
    PER_TURN_PLAYER_ACTIONS,
    PER_TURN_PLAYER_BITS,
    GOING_SECOND_BONUS_BITS,
    PER_TURN_ENEMY_ACTIONS,
    PER_TURN_ENEMY_BITS,
    FIRST_TURN_PLAYER_BONUS_BITS,
} from '../core';
import { handleUnblockedAttack } from '../battle';

beforeEach(() => {
    setupTestEnv();
});

// ─── infection / depression ───────────────────────────────────────────────────

describe('applyInfectionAndDepression', () => {
    test('does nothing at 0 or 1 Wounds / Burden', () => {
        state.playerWounds = 1;
        state.playerBurden = 0;
        state.enemyWounds = 0;
        state.enemyBurden = 1;

        applyInfectionAndDepression();

        expect(state.playerWounds).toBe(1);
        expect(state.playerBurden).toBe(0);
        expect(state.enemyWounds).toBe(0);
        expect(state.enemyBurden).toBe(1);
    });

    test('threshold is 2 and is inclusive', () => {
        state.playerWounds = 2;

        applyInfectionAndDepression();

        expect(state.playerWounds).toBe(3);
    });

    test('adds exactly 1 Wound regardless of how high the total is', () => {
        state.playerWounds = 6;

        applyInfectionAndDepression();

        expect(state.playerWounds).toBe(7);
    });

    test('Burden causes depression independently of Wounds', () => {
        state.playerBurden = 3;
        state.playerWounds = 0;

        applyInfectionAndDepression();

        expect(state.playerBurden).toBe(4);
        expect(state.playerWounds).toBe(0);
    });

    test('applies to both sides in the same phase', () => {
        state.playerWounds = 2;
        state.playerBurden = 2;
        state.enemyWounds = 2;
        state.enemyBurden = 2;

        applyInfectionAndDepression();

        expect(state.playerWounds).toBe(3);
        expect(state.playerBurden).toBe(3);
        expect(state.enemyWounds).toBe(3);
        expect(state.enemyBurden).toBe(3);
    });

    test('is evaluated from a single snapshot, so one tick cannot cascade', () => {
        // A side at 1 Wound must not be pushed to 2 and then infected within the
        // same call. Running the phase once on 1 Wound leaves it at 1.
        state.playerWounds = 1;

        applyInfectionAndDepression();
        expect(state.playerWounds).toBe(1);

        // Only once it independently reaches 2 does infection start.
        state.playerWounds = 2;
        applyInfectionAndDepression();
        expect(state.playerWounds).toBe(3);
    });
});

// ─── per-turn income ──────────────────────────────────────────────────────────

describe('per-turn income granted by startTurn', () => {
    // Intended asymmetry: player 3 actions / 1 Bit / 1 draw,
    //                     enemy  2 actions / 2 Bits / 1 draw.
    function makeFakeLibrary(n, prefix) {
        return Array.from({ length: n }, (_, i) => ({
            id: `${prefix}-${i}`,
            card: { name: `${prefix} ${i}` },
        }));
    }

    beforeEach(() => {
        state.mode = 'NORMAL';
        state.playerActions = 0;
        state.enemyActions = 0;
        state.playerBits = 0;
        state.enemyBits = 0;
        state.playerLibrary = makeFakeLibrary(10, 'p');
        state.enemyLibrary = makeFakeLibrary(10, 'e');
        state.playerHand = [];
        state.enemyHand = [];
        // Default to a steady-state turn; first-turn cases set this explicitly.
        state.turnNumber = 5;
    });

    test('grants the documented actions to each side', () => {
        startTurn(true);

        expect(state.playerActions).toBe(PER_TURN_PLAYER_ACTIONS);
        expect(state.enemyActions).toBe(PER_TURN_ENEMY_ACTIONS);
        expect(PER_TURN_PLAYER_ACTIONS).toBe(3);
        expect(PER_TURN_ENEMY_ACTIONS).toBe(2);
    });

    test('grants the documented Bits to each side', () => {
        startTurn(true);

        expect(state.playerBits).toBe(PER_TURN_PLAYER_BITS);
        expect(state.enemyBits).toBe(PER_TURN_ENEMY_BITS);
        expect(PER_TURN_PLAYER_BITS).toBe(1);
        expect(PER_TURN_ENEMY_BITS).toBe(2);
    });

    test('each side draws exactly 1 card', () => {
        startTurn(true);

        expect(state.playerHand).toHaveLength(1);
        expect(state.enemyHand).toHaveLength(1);
    });

    test('Dividend accumulation stacks on top of base Bit income', () => {
        state.playerDividendAmount = 3;
        state.enemyDividendAmount = 1;

        startTurn(true);

        expect(state.playerBits).toBe(PER_TURN_PLAYER_BITS + 3);
        expect(state.enemyBits).toBe(PER_TURN_ENEMY_BITS + 1);
    });

    test('increments the turn counter', () => {
        state.turnNumber = 0;

        startTurn(true);
        expect(state.turnNumber).toBe(1);

        startTurn(true);
        expect(state.turnNumber).toBe(2);
    });

    test('production state.js defaults both Dividend accumulators to 0', () => {
        // enemyDividendAmount used to default to 2, smuggling the enemy's base
        // income in through the keyword's accumulator, and playerDividendAmount
        // was not declared at all (so the player's income read undefined).
        //
        // The test harness supplies its own defaults, so assert against a
        // pristine copy of the real module rather than the mutated singleton.
        let freshState;
        jest.isolateModules(() => {
            freshState = require('../state').state;
        });

        expect(freshState.playerDividendAmount).toBe(0);
        expect(freshState.enemyDividendAmount).toBe(0);
    });

    test('production stateSetters declares both Dividend setters', () => {
        // glossary.js calls setPlayerDividendAmount; it was absent from both
        // stateSetters and BoardContainer, so Dividend threw a TypeError.
        let freshSetters;
        jest.isolateModules(() => {
            freshSetters = require('../state').stateSetters;
        });

        expect('setPlayerDividendAmount' in freshSetters).toBe(true);
        expect('setEnemyDividendAmount' in freshSetters).toBe(true);
    });

    // notes.txt: "Going second awards +1 Bit". With the player starting, the
    // enemy is the one going second.
    test('turn 1 gives the player 4 Bits and the enemy 2 + the going-second Bit', () => {
        state.turnNumber = 0;

        startTurn(true);

        expect(state.turnNumber).toBe(1);
        expect(state.playerBits).toBe(4);
        expect(state.enemyBits).toBe(PER_TURN_ENEMY_BITS + GOING_SECOND_BONUS_BITS);
        expect(PER_TURN_PLAYER_BITS + FIRST_TURN_PLAYER_BONUS_BITS).toBe(4);
        expect(GOING_SECOND_BONUS_BITS).toBe(1);
    });

    // Turn order is random, so the player can be the one going second and must
    // then receive the bonus instead.
    test('turn 1 with the enemy starting moves the going-second Bit to the player', () => {
        state.turnNumber = 0;

        startTurn(false);

        expect(state.playerBits).toBe(4 + GOING_SECOND_BONUS_BITS);
        expect(state.enemyBits).toBe(PER_TURN_ENEMY_BITS);
    });

    test('the going-second Bit is not paid on later turns', () => {
        state.turnNumber = 4;

        startTurn(true);

        expect(state.playerBits).toBe(PER_TURN_PLAYER_BITS);
        expect(state.enemyBits).toBe(PER_TURN_ENEMY_BITS);
    });

    test('turn 1 is otherwise an ordinary turn', () => {
        state.turnNumber = 0;

        startTurn(true);

        expect(state.playerActions).toBe(PER_TURN_PLAYER_ACTIONS);
        expect(state.enemyActions).toBe(PER_TURN_ENEMY_ACTIONS);
        expect(state.playerHand).toHaveLength(1);
        expect(state.enemyHand).toHaveLength(1);
    });

    test('the bonus is not repeated on turn 2', () => {
        state.turnNumber = 0;

        startTurn(true);
        expect(state.playerBits).toBe(4);
        const enemyAfterTurn1 = state.enemyBits;

        // Actions are always spent to 0 before a turn ends, so clear them the
        // way the real loop would.
        state.playerActions = 0;
        state.enemyActions = 0;

        startTurn(true);
        expect(state.turnNumber).toBe(2);
        expect(state.playerBits).toBe(4 + PER_TURN_PLAYER_BITS);
        // The going-second Bit is a one-off too.
        expect(state.enemyBits).toBe(enemyAfterTurn1 + PER_TURN_ENEMY_BITS);
    });

    test('production state.js starts every resource total at 0', () => {
        // startTurn grants turn 1's income, so seeding non-zero totals here
        // would stack on top of the grant instead of replacing it.
        let freshState;
        jest.isolateModules(() => {
            freshState = require('../state').state;
        });

        expect(freshState.playerBits).toBe(0);
        expect(freshState.enemyBits).toBe(0);
        expect(freshState.playerActions).toBe(0);
        expect(freshState.enemyActions).toBe(0);
        expect(freshState.turnNumber).toBe(0);
    });

    test('Drift adds actions on top of the base grant', () => {
        state.playerDriftCount = 2;
        state.enemyDriftCount = 1;

        startTurn(true);

        expect(state.playerActions).toBe(PER_TURN_PLAYER_ACTIONS + 2);
        expect(state.enemyActions).toBe(PER_TURN_ENEMY_ACTIONS + 1);
    });
});

// ─── looting ──────────────────────────────────────────────────────────────────

function makeAttacker(id, power, overrides = {}) {
    return {
        id,
        power,
        wounds: 0,
        armored: 0,
        stealth: 0,
        vengeance: 0,
        solo: 0,
        charge: 3,
        readied: true,
        owner: 'PLAYER',
        realm: 'Underpass',
        card: { name: id, HP: 10, timer: 3 },
        ...overrides,
    };
}

describe('Looting — first uncontested attack each turn awards 2 Bits', () => {
    beforeEach(() => {
        state.attackMode = 'PLAYER_QUEST';
        state.battleRealm = 'Underpass';
        state.playerTargetSelection = null;
        state.enemyTargetSelection = null;
    });

    test('awards 2 Bits on the first unblocked attack', () => {
        const before = state.playerBits;

        handleUnblockedAttack(makeAttacker('A', 2), 'PLAYER', 0);

        expect(state.playerBits).toBe(before + 2);
        expect(state.playerLooted).toBe(true);
    });

    test('does not award again on subsequent unblocked attacks the same turn', () => {
        const before = state.playerBits;

        handleUnblockedAttack(makeAttacker('A', 2), 'PLAYER', 0);
        handleUnblockedAttack(makeAttacker('B', 2), 'PLAYER', 1);
        handleUnblockedAttack(makeAttacker('C', 2), 'PLAYER', 2);

        expect(state.playerBits).toBe(before + 2);
    });

    test('each side claims Looting independently', () => {
        const playerBefore = state.playerBits;
        const enemyBefore = state.enemyBits;

        handleUnblockedAttack(makeAttacker('A', 2), 'PLAYER', 0);
        expect(state.enemyBits).toBe(enemyBefore);
        expect(state.enemyLooted).toBe(false);

        state.attackMode = 'ENEMY_QUEST';
        handleUnblockedAttack(makeAttacker('E', 2, { owner: 'ENEMY' }), 'ENEMY', 0);

        expect(state.playerBits).toBe(playerBefore + 2);
        expect(state.enemyBits).toBe(enemyBefore + 2);
        expect(state.enemyLooted).toBe(true);
    });

    test('is claimable again after the flags are reset for a new turn', () => {
        const before = state.playerBits;

        handleUnblockedAttack(makeAttacker('A', 2), 'PLAYER', 0);
        expect(state.playerBits).toBe(before + 2);

        // startTurn resets these; emulate that without running the whole phase.
        stateSetters.setPlayerLooted(false);

        handleUnblockedAttack(makeAttacker('B', 2), 'PLAYER', 1);
        expect(state.playerBits).toBe(before + 4);
    });

    test('Overload absorbs looted Bits like any other Bit gain', () => {
        // Looting routes through the canonical gainBits, so the notes.txt
        // status-absorption rule applies rather than bypassing Overload.
        const before = state.playerBits;
        state.playerOverload = 1;

        handleUnblockedAttack(makeAttacker('A', 2), 'PLAYER', 0);

        expect(state.playerBits).toBe(before + 1);
        expect(state.playerOverload).toBe(0);
    });

    test('still awards when the unblocked attack targets a Location', () => {
        // Raiding an undefended Location is still an uncontested attack.
        state.attackMode = 'PLAYER_RAID';
        state.playerTargetSelection = {
            id: 'loc1',
            realm: 'Underpass',
            card: { name: 'loc1', HP: 4, category: 'LOCATION' },
        };
        state.enemyUnderpass.places.push(state.playerTargetSelection);
        const before = state.playerBits;

        handleUnblockedAttack(makeAttacker('A', 2), 'PLAYER', 0);

        expect(state.playerBits).toBe(before + 2);
    });

    test('an invalid attacker awards nothing', () => {
        const before = state.playerBits;

        handleUnblockedAttack(null, 'PLAYER', 0);

        expect(state.playerBits).toBe(before);
        expect(state.playerLooted).toBe(false);
    });
});

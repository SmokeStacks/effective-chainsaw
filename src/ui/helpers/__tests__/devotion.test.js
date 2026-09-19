// Devotion (notes.txt): "At the start of the game, you may secretly choose a
// Devotion that lowers one of these thresholds by 1. Devotion is only revealed
// when the game ends."
//
// The three thresholds are the player's own win conditions, so a Devotion only
// ever lowers a bar the player is trying to clear. It must never make the
// player easier to defeat, and the enemy never has one.

import {
    evaluateWinConditions,
    thresholdFor,
    DEVOTIONS,
    WIN_THRESHOLD,
} from '../winConditions';

const LOWERED = WIN_THRESHOLD - 1;

describe('thresholdFor', () => {
    test('no Devotion leaves every threshold at full', () => {
        Object.values(DEVOTIONS).forEach((condition) => {
            expect(thresholdFor(condition, null)).toBe(WIN_THRESHOLD);
        });
    });

    test('a Devotion lowers only its own condition', () => {
        expect(thresholdFor(DEVOTIONS.DIVINITY, DEVOTIONS.DIVINITY)).toBe(LOWERED);
        expect(thresholdFor(DEVOTIONS.CORPOREAL, DEVOTIONS.DIVINITY)).toBe(WIN_THRESHOLD);
        expect(thresholdFor(DEVOTIONS.MELTDOWN, DEVOTIONS.DIVINITY)).toBe(WIN_THRESHOLD);
    });

    test('an unrecognised Devotion is ignored', () => {
        expect(thresholdFor(DEVOTIONS.DIVINITY, 'NONSENSE')).toBe(WIN_THRESHOLD);
    });
});

describe('Devotion to Divinity', () => {
    const devoted = { playerDevotion: DEVOTIONS.DIVINITY };

    test('the player wins at one less Fate', () => {
        expect(evaluateWinConditions({ ...devoted, playerFate: LOWERED }))
            .toMatchObject({ winner: 'PLAYER' });
    });

    test('without it the same Fate is not yet a win', () => {
        expect(evaluateWinConditions({ playerFate: LOWERED })).toBeNull();
    });

    test('the enemy still needs the full threshold', () => {
        expect(evaluateWinConditions({ ...devoted, enemyFate: LOWERED })).toBeNull();
        expect(evaluateWinConditions({ ...devoted, enemyFate: WIN_THRESHOLD }))
            .toMatchObject({ winner: 'ENEMY' });
    });

    test('it does not lower the other two conditions', () => {
        expect(evaluateWinConditions({ ...devoted, enemyOverload: LOWERED })).toBeNull();
        expect(evaluateWinConditions({ ...devoted, enemyBurden: LOWERED })).toBeNull();
    });

    test('the reason names the Devotion, since the game has ended', () => {
        const outcome = evaluateWinConditions({ ...devoted, playerFate: LOWERED });
        expect(outcome.reason).toContain('Devotion');
        expect(outcome.reason).toContain(String(LOWERED));
    });
});

describe('Devotion to Corporeal Form', () => {
    const devoted = { playerDevotion: DEVOTIONS.CORPOREAL };

    test('the player wins at one less Burden + Wounds on the enemy', () => {
        expect(evaluateWinConditions({ ...devoted, enemyBurden: 4, enemyWounds: 3 }))
            .toMatchObject({ winner: 'PLAYER' });
    });

    test('without it the same total is not yet a win', () => {
        expect(evaluateWinConditions({ enemyBurden: 4, enemyWounds: 3 })).toBeNull();
    });

    test('it never makes the player easier to destroy', () => {
        // The player taking LOWERED damage must not hand the enemy a win.
        expect(evaluateWinConditions({ ...devoted, playerBurden: 4, playerWounds: 3 }))
            .toBeNull();
        expect(evaluateWinConditions({ ...devoted, playerBurden: 4, playerWounds: 4 }))
            .toMatchObject({ winner: 'ENEMY' });
    });
});

describe('Devotion to System Meltdown', () => {
    const devoted = { playerDevotion: DEVOTIONS.MELTDOWN };

    test('the player wins at one less enemy Overload', () => {
        expect(evaluateWinConditions({ ...devoted, enemyOverload: LOWERED }))
            .toMatchObject({ winner: 'PLAYER' });
    });

    test('without it the same Overload is not yet a win', () => {
        expect(evaluateWinConditions({ enemyOverload: LOWERED })).toBeNull();
    });

    test('it never lowers the player\'s own Overload tolerance', () => {
        expect(evaluateWinConditions({ ...devoted, playerOverload: LOWERED })).toBeNull();
        expect(evaluateWinConditions({ ...devoted, playerOverload: WIN_THRESHOLD }))
            .toMatchObject({ winner: 'ENEMY' });
    });
});

describe('Devotion is optional and safe', () => {
    test('null Devotion behaves exactly as before', () => {
        expect(evaluateWinConditions({ playerDevotion: null, playerFate: LOWERED })).toBeNull();
        expect(evaluateWinConditions({ playerDevotion: null, playerFate: WIN_THRESHOLD }))
            .toMatchObject({ winner: 'PLAYER' });
    });

    test('an unrecognised Devotion is ignored rather than throwing', () => {
        expect(evaluateWinConditions({ playerDevotion: 'GARBAGE', playerFate: LOWERED }))
            .toBeNull();
    });

    test('a Devotion can never turn a player win into a loss', () => {
        // Every Devotion, against a board where the player is one short of
        // winning by Fate and the enemy is at the full corporeal threshold.
        const board = { playerFate: LOWERED, playerBurden: 4, playerWounds: 3 };
        expect(evaluateWinConditions(board)).toBeNull();

        Object.values(DEVOTIONS).forEach((devotion) => {
            const outcome = evaluateWinConditions({ ...board, playerDevotion: devotion });
            if (outcome) expect(outcome.winner).toBe('PLAYER');
        });
    });

    test('the outcome shape is unchanged for consumers', () => {
        const outcome = evaluateWinConditions({
            playerDevotion: DEVOTIONS.DIVINITY,
            playerFate: LOWERED,
        });
        expect(Object.keys(outcome).sort()).toEqual(['reason', 'winner']);
    });
});

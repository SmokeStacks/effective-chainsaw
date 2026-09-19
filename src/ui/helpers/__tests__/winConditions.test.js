import { evaluateWinConditions, WIN_REASONS, WIN_THRESHOLD } from '../winConditions';

describe('evaluateWinConditions', () => {
    test('returns null while the game is still in progress', () => {
        expect(evaluateWinConditions()).toBeNull();
        expect(evaluateWinConditions({
            playerFate: 7,
            enemyFate: 7,
            playerBurden: 4, playerWounds: 3,
            enemyBurden: 3, enemyWounds: 4,
            playerOverload: 7,
            enemyOverload: 7,
        })).toBeNull();
    });

    test('threshold is 8 and is inclusive', () => {
        expect(WIN_THRESHOLD).toBe(8);
        expect(evaluateWinConditions({ playerFate: 7 })).toBeNull();
        expect(evaluateWinConditions({ playerFate: 8 })).toEqual({
            winner: 'PLAYER',
            reason: WIN_REASONS.DIVINITY,
        });
    });

    describe('Ascend to Divinity (Fate)', () => {
        test('player reaching 8 Fate wins', () => {
            expect(evaluateWinConditions({ playerFate: 9 })).toEqual({
                winner: 'PLAYER',
                reason: WIN_REASONS.DIVINITY,
            });
        });

        test('enemy reaching 8 Fate wins', () => {
            expect(evaluateWinConditions({ enemyFate: 8 })).toEqual({
                winner: 'ENEMY',
                reason: WIN_REASONS.DIVINITY,
            });
        });
    });

    describe('Destroy their Corporeal Form (Burden + Wounds)', () => {
        test('Burden and Wounds are summed, not checked separately', () => {
            expect(evaluateWinConditions({ enemyBurden: 5, enemyWounds: 3 })).toEqual({
                winner: 'PLAYER',
                reason: WIN_REASONS.CORPOREAL,
            });
            expect(evaluateWinConditions({ enemyBurden: 4, enemyWounds: 3 })).toBeNull();
        });

        test('player exceeding the threshold loses', () => {
            expect(evaluateWinConditions({ playerBurden: 2, playerWounds: 6 })).toEqual({
                winner: 'ENEMY',
                reason: WIN_REASONS.CORPOREAL,
            });
        });
    });

    describe('System Meltdown (Overload)', () => {
        test('enemy overload hands the win to the player', () => {
            expect(evaluateWinConditions({ enemyOverload: 8 })).toEqual({
                winner: 'PLAYER',
                reason: WIN_REASONS.MELTDOWN,
            });
        });

        test('player overload is a loss', () => {
            expect(evaluateWinConditions({ playerOverload: 10 })).toEqual({
                winner: 'ENEMY',
                reason: WIN_REASONS.MELTDOWN,
            });
        });
    });

    describe('precedence', () => {
        test('reaching divinity beats simultaneously losing', () => {
            expect(evaluateWinConditions({
                playerFate: 8,
                playerBurden: 8,
                playerOverload: 8,
            })).toEqual({ winner: 'PLAYER', reason: WIN_REASONS.DIVINITY });
        });

        test('player divinity is checked before enemy divinity', () => {
            expect(evaluateWinConditions({ playerFate: 8, enemyFate: 8 })).toEqual({
                winner: 'PLAYER',
                reason: WIN_REASONS.DIVINITY,
            });
        });

        test('corporeal defeat is checked before meltdown', () => {
            expect(evaluateWinConditions({
                enemyWounds: 8,
                playerOverload: 8,
            })).toEqual({ winner: 'PLAYER', reason: WIN_REASONS.CORPOREAL });
        });
    });

    describe('deck-out', () => {
        test('the side that could not draw is the side that loses', () => {
            expect(evaluateWinConditions({ playerDeckedOut: true })).toEqual({
                winner: 'ENEMY',
                reason: WIN_REASONS.DECKED_OUT,
            });
            expect(evaluateWinConditions({ enemyDeckedOut: true })).toEqual({
                winner: 'PLAYER',
                reason: WIN_REASONS.DECKED_OUT,
            });
        });

        test('neither flag set leaves the game in progress', () => {
            expect(evaluateWinConditions({
                playerDeckedOut: false,
                enemyDeckedOut: false,
            })).toBeNull();
        });

        // Guards the ordering: deck-out must be evaluated last, so drawing your
        // library empty on the very update that takes you to 8 Fate is a win,
        // not a loss.
        test('a simultaneous win takes priority over decking out', () => {
            expect(evaluateWinConditions({
                playerFate: 8,
                playerDeckedOut: true,
            })).toEqual({ winner: 'PLAYER', reason: WIN_REASONS.DIVINITY });
        });

        test('losing on Overload takes priority over the opponent decking out', () => {
            expect(evaluateWinConditions({
                playerOverload: 8,
                enemyDeckedOut: true,
            })).toEqual({ winner: 'ENEMY', reason: WIN_REASONS.MELTDOWN });
        });

        // Both empty at once is only reachable via a symmetric forced draw. The
        // player is checked first, consistent with every other condition.
        test('both decking out resolves in the player\'s favour', () => {
            expect(evaluateWinConditions({
                playerDeckedOut: true,
                enemyDeckedOut: true,
            })).toEqual({ winner: 'PLAYER', reason: WIN_REASONS.DECKED_OUT });
        });

        test('a Devotion does not relabel the deck-out reason', () => {
            expect(evaluateWinConditions({
                enemyDeckedOut: true,
                playerDevotion: 'DIVINITY',
            })).toEqual({ winner: 'PLAYER', reason: WIN_REASONS.DECKED_OUT });
        });
    });
});

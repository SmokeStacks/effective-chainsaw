// Dominance scoring. notes.txt: "Compare the total Skill of your Readied Online
// Entities plus any Surge (extra Bits from unblocked Hack damage)."
//
// Two bugs here:
//   1. The score read `entity.card.power`, the printed value, so Boosts and any
//      other power modifier were invisible to Dominance.
//   2. It added `entity.statusEffects?.Vengeance`, a field nothing populates;
//      Vengeance lives directly on the entity everywhere else.
//
// Surge had a third, separate problem: handleEndOfBattle cleared it, and the
// Dominance Phase runs after all battles, so the Surge term was always 0. That
// reset now lives in startTurn; see the Surge tests at the bottom.

import { setupTestEnv } from '../testHarness';
import { state } from '../state';
import { calculateDominationScore, determineEnemyBid } from '../domination';
import { handleEndOfBattle } from '../battle';

beforeEach(() => {
    setupTestEnv();
});

const fighter = (over = {}) => ({
    id: 'f1',
    online: true,
    readied: true,
    power: 2,
    card: { name: 'Grunt', power: 2 },
    ...over,
});

describe('calculateDominationScore', () => {
    test('sums the Skill of Readied Online entities', () => {
        state.playerTheater.people = [fighter(), fighter({ id: 'f2', power: 3 })];
        expect(calculateDominationScore('PLAYER')).toBe(5);
    });

    test('ignores Offline entities', () => {
        state.playerTheater.people = [fighter({ online: false })];
        expect(calculateDominationScore('PLAYER')).toBe(0);
    });

    test('ignores entities that are not Readied', () => {
        state.playerTheater.people = [fighter({ readied: false })];
        expect(calculateDominationScore('PLAYER')).toBe(0);
    });

    test('counts current Skill including a power boost, not the printed value', () => {
        // The regression: card.power stayed at 2 while the entity was boosted.
        state.playerTheater.people = [fighter({ power: 2, powerBoost: 3 })];
        expect(calculateDominationScore('PLAYER')).toBe(5);
    });

    test('applies a power penalty', () => {
        state.playerTheater.people = [fighter({ power: 4, powerPenalty: 1 })];
        expect(calculateDominationScore('PLAYER')).toBe(3);
    });

    test('adds Vengeance from the entity field', () => {
        state.playerTheater.people = [fighter({ power: 1, vengeance: 2 })];
        expect(calculateDominationScore('PLAYER')).toBe(3);
    });

    test('adds Surge to the total', () => {
        state.playerTheater.people = [fighter({ power: 1 })];
        state.playerSurge = 4;
        expect(calculateDominationScore('PLAYER')).toBe(5);
    });

    test('sums across all four playable Realms', () => {
        state.playerSolarium.people = [fighter({ id: 'a', power: 1 })];
        state.playerTheater.people = [fighter({ id: 'b', power: 1 })];
        state.playerUnderpass.people = [fighter({ id: 'c', power: 1 })];
        state.playerGrid.people = [fighter({ id: 'd', power: 1 })];
        expect(calculateDominationScore('PLAYER')).toBe(4);
    });

    test('scores the enemy from enemy realms', () => {
        state.enemyGrid.people = [fighter({ power: 6 })];
        expect(calculateDominationScore('ENEMY')).toBe(6);
        expect(calculateDominationScore('PLAYER')).toBe(0);
    });

    test('an empty board scores 0', () => {
        expect(calculateDominationScore('PLAYER')).toBe(0);
    });
});

// notes.txt: "Surge are special Bits that can only be spent during the
// Dominance Phase to increase your bid." The Dominance Phase runs in endTurn,
// after every battle has resolved, so Surge has to survive end-of-battle.
describe('Surge survives to the Dominance Phase', () => {
    test('handleEndOfBattle does not clear Surge', () => {
        state.playerSurge = 3;
        state.enemySurge = 2;

        handleEndOfBattle();

        expect(state.playerSurge).toBe(3);
        expect(state.enemySurge).toBe(2);
    });

    test('Surge earned in battle is still countable afterwards', () => {
        state.playerSurge = 5;
        handleEndOfBattle();
        expect(calculateDominationScore('PLAYER')).toBe(5);
    });
});

describe('determineEnemyBid', () => {
    test('bids 0 when it cannot catch up even by spending everything', () => {
        expect(determineEnemyBid(2, 10, 3, 0)).toBe(0);
    });

    test('bids within its available Bits', () => {
        const bid = determineEnemyBid(5, 6, 4, 0);
        expect(bid).toBeGreaterThan(0);
        expect(bid).toBeLessThanOrEqual(4);
    });

    test('bids 0 with no Bits', () => {
        expect(determineEnemyBid(5, 6, 0, 0)).toBe(0);
    });
});

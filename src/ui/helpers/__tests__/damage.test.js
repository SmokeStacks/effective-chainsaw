// Tests for damage.js after the call-time-state refactor.
//
// These tests exercise the same paths that previously hit stale references
// (battle slots / realms / setters / gain-fate functions). The harness installs
// fake setters that mutate `state` synchronously, so we can assert against
// state.* after each call.
//
// Limitations: handleDeadCard calls deactivateAbilities() from glossary.js,
// which still has stale top-level destructures of its own. We avoid that
// path for now by testing only damage that does NOT reduce HP to zero, or
// by testing handleDestroyedThing/handleDestroyedPlace which do not call
// deactivateAbilities.

import { setupTestEnv } from '../testHarness';
import { state } from '../state';

import { handleDamage, handlePlaceDamage, handleDestroyedThing, handleDestroyedPlace } from '../damage';

beforeEach(() => {
    setupTestEnv();
});

function entityInBattle(idx, side, overrides = {}) {
    const card = { id: `c${idx}`, card: { name: `Card ${idx}`, HP: 3 }, wounds: 0, armored: 0, deathless: 0, ...overrides };
    const slotsKey = side === 'PLAYER' ? 'playerBattleSlots' : 'enemyBattleSlots';
    state[slotsKey][idx] = card;
    return card;
}

describe('handleDamage in BATTLE', () => {
    test('non-lethal damage accrues wounds without removing the card', () => {
        entityInBattle(0, 'PLAYER', { card: { name: 'Tank', HP: 5 } });

        handleDamage('BATTLE', 'c0', 2, 'PLAYER');

        expect(state.playerBattleSlots[0].wounds).toBe(2);
    });

    test('armor reduces damage 1-for-1', () => {
        entityInBattle(1, 'ENEMY', { card: { name: 'Armored', HP: 5 }, armored: 2 });

        handleDamage('BATTLE', 'c1', 3, 'ENEMY');

        expect(state.enemyBattleSlots[1].wounds).toBe(1);
    });

    test('armor higher than damage means zero wounds added', () => {
        entityInBattle(2, 'PLAYER', { card: { name: 'Bunker', HP: 5 }, armored: 10 });

        handleDamage('BATTLE', 'c2', 3, 'PLAYER');

        expect(state.playerBattleSlots[2].wounds).toBe(0);
    });

    test('handleDamage returns { damageDealt, excessDamage }', () => {
        entityInBattle(3, 'PLAYER', { card: { name: 'X', HP: 5 } });

        const result = handleDamage('BATTLE', 'c3', 2, 'PLAYER');

        expect(result.damageDealt).toBe(2);
        expect(result.excessDamage).toBe(0);
    });
});

describe('handleDamage in a realm', () => {
    test('damage to entities in a realm accrues wounds', () => {
        const entity = { id: 'r0', card: { name: 'Realm Dweller', HP: 4 }, wounds: 0, armored: 0 };
        state.playerSolarium.people = [entity];

        handleDamage('Solarium', 'r0', 2, 'PLAYER');

        expect(state.playerSolarium.people[0].wounds).toBe(2);
    });
});

describe('handlePlaceDamage', () => {
    test('non-lethal damage accrues wounds on the place', () => {
        const place = { id: 'p0', card: { name: 'Shrine', HP: 5 }, wounds: 0 };
        state.playerTheater.places = [place];

        const result = handlePlaceDamage('Theater', 'p0', 2, 'PLAYER');

        expect(result.damageDealt).toBe(2);
        expect(result.excessDamage).toBe(0);
        expect(state.playerTheater.places[0].wounds).toBe(2);
    });

    test('damage exceeding remaining HP destroys the place', () => {
        const place = { id: 'p1', card: { name: 'Shrine', HP: 2, category: 'LANDMARK' }, wounds: 0 };
        state.playerTheater.places = [place];

        const result = handlePlaceDamage('Theater', 'p1', 5, 'PLAYER');

        expect(result.damageDealt).toBe(2);
        expect(result.excessDamage).toBe(3);
        // Place should be removed from the realm
        expect(state.playerTheater.places).toHaveLength(0);
        // And added to the graveyard
        expect(state.playerGraveyard.map(c => c.id)).toContain('p1');
    });
});

describe('handleDestroyedThing', () => {
    test('removes the thing from its realm and moves it to the graveyard', () => {
        const thing = { id: 't0', card: { name: 'Rune', category: 'SNIP' } };
        state.playerUnderpass.things = [thing];

        handleDestroyedThing('Underpass', 't0', 'PLAYER');

        expect(state.playerUnderpass.things).toHaveLength(0);
        expect(state.playerGraveyard.map(c => c.id)).toContain('t0');
    });

    test('destroyed Sym grants fate equal to its runes to the OPPOSING side', () => {
        // Regression: this code path was previously dead because
        // playerGainFate / enemyGainFate were destructured from stateSetters
        // (where they don't exist) and so were undefined.
        const sym = { id: 's0', card: { name: 'Sigil', category: 'SYM', runes: 2 } };
        state.enemyUnderpass.things = [sym];

        handleDestroyedThing('Underpass', 's0', 'ENEMY');

        // Sym belonged to enemy; opposing side is player.
        expect(state.playerFate).toBe(2);
        expect(state.enemyFate).toBe(0);
    });
});

// notes.txt: "If a Landmark is destroyed, its controller loses it and the
// attacker gains Fate equal to that Landmark's Runes."
//
// `runes` was a parameter defaulting to 0 and every real caller omitted it, so
// raiding a Landmark down paid nothing. The test below it passes `runes`
// explicitly and so kept passing throughout. These drive the real path.
describe('destroying a Landmark through damage awards its Runes', () => {
    test('lethal damage to a Landmark grants the attacker Fate equal to its Runes', () => {
        const landmark = { id: 'lm1', wounds: 0, card: { name: 'Beacon', category: 'LANDMARK', HP: 3, runes: 4 } };
        state.enemyTheater.places = [landmark];

        handlePlaceDamage('Theater', 'lm1', 3, 'ENEMY');

        expect(state.enemyTheater.places).toHaveLength(0);
        expect(state.playerFate).toBe(4);
    });

    test('a Landmark with no Runes awards nothing', () => {
        const landmark = { id: 'lm2', wounds: 0, card: { name: 'Plinth', category: 'LANDMARK', HP: 2 } };
        state.enemyTheater.places = [landmark];

        handlePlaceDamage('Theater', 'lm2', 2, 'ENEMY');

        expect(state.playerFate).toBe(0);
    });

    test('a destroyed Location awards nothing, only Landmarks do', () => {
        const location = { id: 'lc1', wounds: 0, card: { name: 'Safehouse', category: 'LOCATION', HP: 2, runes: 5 } };
        state.enemyTheater.places = [location];

        handlePlaceDamage('Theater', 'lc1', 2, 'ENEMY');

        expect(state.enemyTheater.places).toHaveLength(0);
        expect(state.playerFate).toBe(0);
    });

    test("the player's own destroyed Landmark pays the enemy", () => {
        const landmark = { id: 'lm3', wounds: 0, card: { name: 'Beacon', category: 'LANDMARK', HP: 1, runes: 2 } };
        state.playerTheater.places = [landmark];

        handlePlaceDamage('Theater', 'lm3', 1, 'PLAYER');

        expect(state.enemyFate).toBe(2);
    });

    test('non-lethal damage awards nothing and leaves the Landmark standing', () => {
        const landmark = { id: 'lm4', wounds: 0, card: { name: 'Beacon', category: 'LANDMARK', HP: 5, runes: 3 } };
        state.enemyTheater.places = [landmark];

        handlePlaceDamage('Theater', 'lm4', 2, 'ENEMY');

        expect(state.enemyTheater.places).toHaveLength(1);
        expect(state.playerFate).toBe(0);
    });
});

describe('handleDestroyedPlace', () => {
    test('destroyed Landmark grants opposing-side fate equal to runes parameter', () => {
        const landmark = { id: 'l0', card: { name: 'Beacon', category: 'LANDMARK' } };
        state.playerTheater.places = [landmark];

        handleDestroyedPlace('Theater', 'l0', 'PLAYER', /* runes */ 3);

        // Landmark belonged to player; opposing side is enemy.
        expect(state.enemyFate).toBe(3);
        expect(state.playerFate).toBe(0);
        expect(state.playerTheater.places).toHaveLength(0);
        expect(state.playerGraveyard.map(c => c.id)).toContain('l0');
    });

    test('non-landmark place destruction does not grant fate', () => {
        const location = { id: 'l1', card: { name: 'Spot', category: 'LOCATION' } };
        state.enemyTheater.places = [location];

        handleDestroyedPlace('Theater', 'l1', 'ENEMY', 5);

        expect(state.playerFate).toBe(0);
        expect(state.enemyFate).toBe(0);
    });
});

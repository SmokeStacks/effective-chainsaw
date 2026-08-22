// Tests for the previously-unimplemented combat keywords: Sting, Regen,
// Bribe, Aggro, Aggressive, and the keywordStacks/keywordAmount parsing that
// feeds them.
import { setupTestEnv } from '../testHarness';
import { state } from '../state';
import { commitAttack } from '../battle';
import { adjustEntityPowerExternal } from '../core';
import { healRegeneratingEntities, tryBribe } from '../combatKeywords';
import { keywordStacks, buildCardInstance } from '../setup';

function makeFighter(id, power, overrides = {}) {
    return {
        id,
        power,
        wounds: 0,
        armored: 0,
        stealth: 0,
        vengeance: 0,
        solo: 0,
        charge: 0,
        card: { name: id, HP: 10, timer: 1 },
        realm: 'Underpass',
        ...overrides,
    };
}

function placeInPlayerSlot(idx, fighter) {
    state.playerBattleSlots[idx] = fighter;
    const realmKey = 'player' + fighter.realm.charAt(0).toUpperCase() + fighter.realm.slice(1);
    state[realmKey].people.push(fighter);
}

function placeInEnemySlot(idx, fighter) {
    state.enemyBattleSlots[idx] = fighter;
    const realmKey = 'enemy' + fighter.realm.charAt(0).toUpperCase() + fighter.realm.slice(1);
    state[realmKey].people.push(fighter);
}

describe('keywordStacks', () => {
    test('reads an explicit ability entry amount', () => {
        const card = { abilities: [{ name: 'Sting', amount: 4 }] };
        expect(keywordStacks(card, 'Sting')).toBe(4);
    });

    test('parses "Keyword N" from free-text keywords', () => {
        const card = { keywords: 'Sting 4, Ambush 2, Aggressive, Locality' };
        expect(keywordStacks(card, 'Sting')).toBe(4);
        expect(keywordStacks(card, 'Ambush')).toBe(2);
    });

    test('bare keyword with no number defaults to 1', () => {
        const card = { keywords: 'Pounce, Charge, Ambush' };
        expect(keywordStacks(card, 'Ambush')).toBe(1);
    });

    test('missing keyword returns 0', () => {
        const card = { keywords: 'Pounce, Charge' };
        expect(keywordStacks(card, 'Sting')).toBe(0);
    });
});

describe('buildCardInstance combat keyword fields', () => {
    test('populates sting/ambush/regen/bribe/aggro/aggressive/defensive/charge from keywords', () => {
        const card = { keywords: 'Sting 2, Ambush 3, Regen 5, Bribe, Aggro, Aggressive, Defensive, Charge 2' };
        const instance = buildCardInstance('x0', card, 'PLAYER');

        expect(instance.sting).toBe(2);
        expect(instance.ambush).toBe(3);
        expect(instance.regen).toBe(5);
        expect(instance.bribe).toBe(1);
        expect(instance.aggro).toBe(1);
        expect(instance.aggressive).toBe(1);
        expect(instance.defensive).toBe(true);
        expect(instance.charge).toBe(2);
    });
});

describe('Sting', () => {
    beforeEach(() => {
        setupTestEnv();
        state.battleRealm = 'Underpass';
    });

    test('attacker with Sting deals bonus damage to the defender on clash', () => {
        const attacker = makeFighter('A', 1, { sting: 2 });
        const defender = makeFighter('D', 1);
        placeInPlayerSlot(0, attacker);
        placeInEnemySlot(0, defender);

        // Simulate the clash step directly since Sting is applied at clash time.
        const { applyStingOnClash } = require('../combatKeywords');
        applyStingOnClash(attacker.id, 'PLAYER', defender.id);

        expect(state.enemyUnderpass.people[0].wounds).toBe(2);
    });
});

describe('Regen', () => {
    beforeEach(() => setupTestEnv());

    test('heals wounds by the Regen amount, floored at 0', () => {
        state.playerUnderpass.people = [
            { id: 'r1', card: { name: 'Healer', HP: 10 }, wounds: 5, regen: 3 },
        ];

        healRegeneratingEntities('PLAYER', require('../state').stateSetters);

        expect(state.playerUnderpass.people[0].wounds).toBe(2);
    });

    test('does not go below 0 wounds', () => {
        state.playerUnderpass.people = [
            { id: 'r1', card: { name: 'Healer', HP: 10 }, wounds: 1, regen: 5 },
        ];

        healRegeneratingEntities('PLAYER', require('../state').stateSetters);

        expect(state.playerUnderpass.people[0].wounds).toBe(0);
    });
});

describe('Bribe', () => {
    beforeEach(() => {
        setupTestEnv();
        state.battleRealm = 'Underpass';
    });

    test('spends bits to survive lethal damage once', () => {
        state.playerBits = 5;
        const entity = { id: 'b1', card: { name: 'Briber', HP: 5 }, wounds: 5, bribe: 1 };

        const survived = tryBribe(entity, 'PLAYER', require('../state').stateSetters);

        expect(survived).toBe(true);
        expect(state.playerBits).toBe(2);
    });

    test('fails if the controller cannot afford the cost', () => {
        state.playerBits = 1;
        const entity = { id: 'b1', card: { name: 'Briber', HP: 5 }, wounds: 5, bribe: 1 };

        const survived = tryBribe(entity, 'PLAYER', require('../state').stateSetters);

        expect(survived).toBe(false);
        expect(state.playerBits).toBe(1);
    });

    test('cannot be used twice on the same entity instance', () => {
        state.playerBits = 10;
        const entity = { id: 'b1', card: { name: 'Briber', HP: 5 }, wounds: 5, bribe: 1, bribeUsed: true };

        const survived = tryBribe(entity, 'PLAYER', require('../state').stateSetters);

        expect(survived).toBe(false);
    });

    test('a lethal hit in handleDamage triggers Bribe instead of destroying the entity', () => {
        // The defender being hit is on the ENEMY side, so ENEMY's bits fund the Bribe.
        state.enemyBits = 5;
        const attacker = makeFighter('A', 15);
        const defender = makeFighter('D', 1, { bribe: 1 });
        placeInPlayerSlot(0, attacker);
        placeInEnemySlot(0, defender);

        commitAttack(attacker, defender, 'PLAYER');

        // Bribe consumed 3 bits, entity survives at maxHealth - 1 wounds.
        expect(state.enemyBits).toBe(2);
        expect(state.enemyUnderpass.people[0].wounds).toBe(9);
        expect(state.enemyUnderpass.people[0].bribeUsed).toBe(true);
    });
});

describe('Aggro / Aggressive power adjustments', () => {
    test('Aggro grants +1 power while attacking only', () => {
        const entity = { power: 2, aggro: 1 };
        expect(adjustEntityPowerExternal(entity, 'PLAYER', true)).toBe(3);
        expect(adjustEntityPowerExternal(entity, 'PLAYER', false)).toBe(2);
    });

    test('Aggressive grants +2 while attacking and -1 while defending', () => {
        const entity = { power: 3, aggressive: 1 };
        expect(adjustEntityPowerExternal(entity, 'PLAYER', true)).toBe(5);
        expect(adjustEntityPowerExternal(entity, 'PLAYER', false)).toBe(2);
    });

    test('Aggressive power never drops below 0', () => {
        const entity = { power: 0, aggressive: 1 };
        expect(adjustEntityPowerExternal(entity, 'PLAYER', false)).toBe(0);
    });
});

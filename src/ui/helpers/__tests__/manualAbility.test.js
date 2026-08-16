// Tests for manual ability cost parsing and affordability.
//
// Covers:
//   manualAbility.js : splitAbilityCost, getManualAbility, canActivateManualAbility
//
// splitAbilityCost drives the clickable affordance in AbilityDescription.js, so
// the cases below use real card descriptions from the orange binder.

import { setupTestEnv } from '../testHarness';
import { state } from '../state';
import {
    COST_ARROW,
    splitAbilityCost,
    getManualAbility,
    canActivateManualAbility
} from '../manualAbility';

describe('splitAbilityCost', () => {
    test('simple cost is everything before the arrow', () => {
        const { prefix, condition, cost, effect } = splitAbilityCost(
            `1 Bit ${COST_ARROW} Gain +1/+1 and 1 Freeze.`
        );
        expect(prefix).toBe('');
        expect(condition).toBe('');
        expect(cost).toBe('1 Bit');
        expect(effect).toBe('Gain +1/+1 and 1 Freeze.');
    });

    test('multi-part cost is preserved intact', () => {
        const { cost, effect } = splitAbilityCost(
            `2 Bits, Action ${COST_ARROW} Friendly Places and Things gain 2 Develop`
        );
        expect(cost).toBe('2 Bits, Action');
        expect(effect).toBe('Friendly Places and Things gain 2 Develop');
    });

    // Regression: previously the entire leading sentence became the clickable
    // cost, and AbilityDescription dropped it from the rendered output.
    test('a preceding triggered clause is split off as prefix, not cost', () => {
        const { prefix, condition, cost, effect } = splitAbilityCost(
            `When Interfaced, inflict 2 Overload for each Development. Scheme 2: Sacrifice ${COST_ARROW} Target entity gains Freeze 5.`
        );
        expect(prefix).toBe('When Interfaced, inflict 2 Overload for each Development.');
        expect(condition).toBe('Scheme 2:');
        expect(cost).toBe('Sacrifice');
        expect(effect).toBe('Target entity gains Freeze 5.');
    });

    test('a Scheme gate is separated from the payable cost', () => {
        const { condition, cost } = splitAbilityCost(
            `Scheme 3: 2 Bits ${COST_ARROW} Draw a card.`
        );
        expect(condition).toBe('Scheme 3:');
        expect(cost).toBe('2 Bits');
    });

    test('no arrow means no cost and the whole string is the effect', () => {
        const { cost, effect } = splitAbilityCost('Whenever another Place is destroyed, +3 Surge.');
        expect(cost).toBe('');
        expect(effect).toBe('Whenever another Place is destroyed, +3 Surge.');
    });

    test('non-string input is handled safely', () => {
        expect(splitAbilityCost(undefined)).toEqual({
            prefix: '', condition: '', cost: '', effect: ''
        });
    });
});

describe('getManualAbility', () => {
    test('returns the first manual ability and ignores triggered ones', () => {
        const entity = {
            card: {
                abilities: [
                    { name: 'SomeTrigger', type: 'triggered' },
                    { name: 'BoostSelf', type: 'manual' }
                ]
            }
        };
        expect(getManualAbility(entity).name).toBe('BoostSelf');
    });

    test('returns null when there is no manual ability', () => {
        expect(getManualAbility({ card: { abilities: [] } })).toBeNull();
        expect(getManualAbility(undefined)).toBeNull();
    });
});

describe('canActivateManualAbility', () => {
    beforeEach(() => {
        setupTestEnv();
    });

    const ability = { name: 'BoostSelf', type: 'manual' };

    function makeEntity(overrides = {}) {
        return {
            id: 'e1',
            online: true,
            exhausted: false,
            realm: 'Grid',
            owner: 'PLAYER',
            card: { name: 'Nova Kane', abilities: [ability] },
            ...overrides
        };
    }

    test('affordable when the player has enough bits', () => {
        state.playerBits = 5;
        expect(canActivateManualAbility(makeEntity(), ability, 'PLAYER')).toBe(true);
    });

    test('not affordable when bits are short', () => {
        state.playerBits = 0;
        expect(canActivateManualAbility(makeEntity(), ability, 'PLAYER')).toBe(false);
    });

    test('offline entities cannot activate', () => {
        state.playerBits = 5;
        expect(canActivateManualAbility(makeEntity({ online: false }), ability, 'PLAYER')).toBe(false);
    });

    test('a scheming entity is locked until its scheme threshold is met', () => {
        state.playerBits = 5;
        const locked = makeEntity({ scheming: true, schemeUnlocked: false });
        expect(canActivateManualAbility(locked, ability, 'PLAYER')).toBe(false);

        const unlocked = makeEntity({ scheming: true, schemeUnlocked: true });
        expect(canActivateManualAbility(unlocked, ability, 'PLAYER')).toBe(true);
    });

    test('an unknown ability name is never activatable', () => {
        state.playerBits = 99;
        const bogus = { name: 'NoSuchAbility', type: 'manual' };
        expect(canActivateManualAbility(makeEntity(), bogus, 'PLAYER')).toBe(false);
    });
});

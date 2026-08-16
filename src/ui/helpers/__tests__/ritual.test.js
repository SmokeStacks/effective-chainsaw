// Unit tests for Ritual resolution.
//
// Three bugs motivated this:
//
// 1. A Ritual with no targeting ability never resolved. It fell through the
//    placement switch in handleRealmSelect, which has no RITUAL case, so the
//    card silently stayed in hand. Six of the eight ritual cards in the live
//    deck are non-targeting, so most rituals were unplayable.
// 2. Rituals never paid their Activation cost, which glossary.txt requires to be
//    "paid immediately".
// 3. String abilities such as 'Duplicate' resolved twice, because
//    confirmRitualActivation fired them in its own pass and then called
//    triggerRitualAbilities, which fires them again.

import { setupTestEnv } from '../testHarness';
import { state } from '../state';
import { resolveRitual } from '../core';
import { abilitiesDefinitions } from '../../abilities/glossary';

beforeEach(() => {
    setupTestEnv();
});

afterEach(() => {
    jest.restoreAllMocks();
});

const ritual = (over = {}) => ({
    id: 'r1',
    card: {
        name: 'Test Ritual',
        category: 'RITUAL',
        rezCost: 0,
        ash: 0,
        soul: 0,
        abilities: [],
        ...over,
    },
});

describe('resolveRitual — spending the card', () => {
    test('removes the ritual from hand', () => {
        const entity = ritual();
        state.playerHand = [entity, ritual({ name: 'Other' })];
        state.playerHand[1].id = 'r2';

        resolveRitual(entity, null);

        expect(state.playerHand.map(c => c.id)).toEqual(['r2']);
    });

    test('spends an action', () => {
        state.playerHand = [ritual()];
        state.playerActions = 2;

        resolveRitual(state.playerHand[0], null);

        expect(state.playerActions).toBe(1);
    });

    test('costs an action but does not end the turn', () => {
        const entity = ritual();
        state.playerHand = [entity];
        state.playerActions = 3;

        resolveRitual(entity, null);

        expect(state.playerActions).toBe(2);
        expect(state.currentPlayer).toBe('PLAYER');
    });

    test('moves the spent ritual to the graveyard', () => {
        const entity = ritual();
        state.playerHand = [entity];
        state.playerGraveyard = [];

        resolveRitual(entity, null);

        expect(state.playerGraveyard.map(c => c.id)).toEqual(['r1']);
    });

    test('appends to an existing graveyard rather than replacing it', () => {
        const entity = ritual();
        const older = { id: 'old', card: { name: 'Older' } };
        state.playerHand = [entity];
        state.playerGraveyard = [older];

        resolveRitual(entity, null);

        expect(state.playerGraveyard.map(c => c.id)).toEqual(['old', 'r1']);
    });

    test('clears the selection tied to the spent card', () => {
        const entity = ritual();
        state.playerHand = [entity];
        state.selectedCard = entity;
        state.selectedInHand = true;

        resolveRitual(entity, null);

        expect(state.selectedCard).toBe(null);
        expect(state.selectedInHand).toBe(false);
        expect(state.targetType).toBe('none');
    });

    test('clears any pending ritual and target selection', () => {
        const entity = ritual();
        state.playerHand = [entity];
        state.pendingRitual = { entity, ability: null };

        resolveRitual(entity, null);

        expect(state.pendingRitual).toBe(null);
        expect(state.targetSelection.enabled).toBe(false);
    });
});

describe('resolveRitual — paying the Activation cost', () => {
    test('deducts the Bits cost', () => {
        const entity = ritual({ rezCost: 2 });
        state.playerHand = [entity];
        state.playerBits = 5;

        resolveRitual(entity, null);

        expect(state.playerBits).toBe(3);
    });

    test('deducts the Ash cost', () => {
        const entity = ritual({ ash: 3 });
        state.playerHand = [entity];
        state.playerAshes = 4;

        resolveRitual(entity, null);

        expect(state.playerAshes).toBe(1);
    });

    test('a free ritual costs nothing', () => {
        const entity = ritual();
        state.playerHand = [entity];
        state.playerBits = 5;

        resolveRitual(entity, null);

        expect(state.playerBits).toBe(5);
    });
});

describe('resolveRitual — firing abilities exactly once', () => {
    test("a string 'Duplicate' ability fires exactly once", () => {
        const spy = jest.spyOn(abilitiesDefinitions['Duplicate'], 'onPlay').mockImplementation(() => {});
        const entity = ritual({ abilities: ['Duplicate'] });
        state.playerHand = [entity];

        resolveRitual(entity, null);

        expect(spy).toHaveBeenCalledTimes(1);
    });

    test('an onPlay ability receives the chosen target', () => {
        const spy = jest.spyOn(abilitiesDefinitions['Duplicate'], 'onPlay').mockImplementation(() => {});
        const entity = ritual({
            abilities: [{ name: 'Duplicate', type: 'onPlay', requiresTarget: true }],
        });
        const target = { id: 't1', card: { name: 'Victim', category: 'ENTITY' }, owner: 'PLAYER' };
        state.playerHand = [entity];

        resolveRitual(entity, target);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0][3]).toBe(target);
    });

    test('a ritual with no abilities resolves without error', () => {
        const entity = ritual({ abilities: [] });
        state.playerHand = [entity];

        expect(() => resolveRitual(entity, null)).not.toThrow();
        expect(state.playerHand).toEqual([]);
    });
});

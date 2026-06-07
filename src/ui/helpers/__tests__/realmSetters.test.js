// Tests for the realm-setter behavior contract used by BoardContainer.
//
// The contract:
//   1. Calling setXxx(value) updates state.<key> to value.
//   2. Calling setXxx(prev => next) reads the current state, calls the updater,
//      and writes the result -- never storing the function itself.
//   3. (BoardContainer-only) the setter also mirrors into the React `realms`
//      state and `gameState`. We don't test that here because it requires a
//      React tree; we test the state.<key> path because that is what game
//      logic reads, and that is where the original bug was masked.
//
// The harness install_FakeSetters provides setters that mutate `state` in
// place and support the updater-function form. This matches the production
// contract that BoardContainer now implements via buildRealmSetters.

import { setupTestEnv } from '../testHarness';
import { state, stateSetters } from '../state';

beforeEach(() => {
    setupTestEnv();
});

describe('player realm setters', () => {
    test('setPlayerSolarium with a value writes through to state', () => {
        const next = { name: 'Solarium', people: [{ id: 'a', card: {} }], places: [], things: [] };
        stateSetters.setPlayerSolarium(next);
        expect(state.playerSolarium).toBe(next);
    });

    test('setPlayerSolarium with an updater function unwraps and writes the result', () => {
        // This is the regression: the production wrappers used to store the
        // function literally in state.playerSolarium, leaving game logic
        // looking at a function instead of a realm.
        state.playerSolarium = { name: 'Solarium', people: [], places: [], things: [] };

        stateSetters.setPlayerSolarium(prev => ({
            ...prev,
            people: [...prev.people, { id: 'new', card: { name: 'New' } }],
        }));

        expect(typeof state.playerSolarium).toBe('object');
        expect(state.playerSolarium.people).toHaveLength(1);
        expect(state.playerSolarium.people[0].id).toBe('new');
    });

    test('all four playable player realms support updater form', () => {
        for (const key of ['playerSolarium', 'playerTheater', 'playerUnderpass', 'playerGrid']) {
            const setterName = 'set' + key.charAt(0).toUpperCase() + key.slice(1);
            state[key] = { name: key, people: [], places: [], things: [] };
            stateSetters[setterName](prev => ({ ...prev, people: [...prev.people, { id: key }] }));
            expect(state[key].people).toEqual([{ id: key }]);
        }
    });
});

describe('enemy realm setters', () => {
    test('setEnemySolarium handles updater form', () => {
        state.enemySolarium = { name: 'Solarium', people: [], places: [], things: [] };
        stateSetters.setEnemySolarium(prev => ({ ...prev, people: [{ id: 'e1' }] }));
        expect(state.enemySolarium.people).toEqual([{ id: 'e1' }]);
    });
});

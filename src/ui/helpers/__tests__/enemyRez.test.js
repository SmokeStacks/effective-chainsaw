// Tests for enemy rez logic: rezEnemyEntitiesInRealm (pre-combat rez).
// activateAbilities is mocked to isolate the rez timer/flag logic.

jest.mock('../../abilities/glossary', () => ({
    activateAbilities: jest.fn(),
    abilitiesDefinitions: {},
}));

import { setupTestEnv } from '../testHarness';
import { state, stateSetters } from '../state';
import { rezEnemyEntitiesInRealm } from '../enemy/rez';

beforeEach(() => {
    setupTestEnv();
    jest.clearAllMocks();
});

const makeEntity = (overrides = {}) => ({
    id: `e${Math.random()}`,
    card: { category: 'ENTITY', timer: 2, name: 'TestEntity' },
    online: false,
    freeze: 0,
    steps: 0,
    ...overrides,
});

describe('rezEnemyEntitiesInRealm', () => {
    test('rezzes entity when steps >= timer', () => {
        const entity = makeEntity({ steps: 2 });
        stateSetters.setEnemyGrid({ people: [entity], places: [], things: [] });
        rezEnemyEntitiesInRealm('Grid');
        expect(state.enemyGrid.people[0].online).toBe(true);
    });

    test('does not rez when steps < timer', () => {
        const entity = makeEntity({ steps: 1 });
        stateSetters.setEnemyGrid({ people: [entity], places: [], things: [] });
        rezEnemyEntitiesInRealm('Grid');
        expect(state.enemyGrid.people[0].online).toBe(false);
    });

    test('does not rez frozen entity', () => {
        const entity = makeEntity({ steps: 3, freeze: 1 });
        stateSetters.setEnemyGrid({ people: [entity], places: [], things: [] });
        rezEnemyEntitiesInRealm('Grid');
        expect(state.enemyGrid.people[0].online).toBe(false);
    });

    test('does not re-rez already online entity', () => {
        const entity = makeEntity({ steps: 2, online: true });
        stateSetters.setEnemyGrid({ people: [entity], places: [], things: [] });
        rezEnemyEntitiesInRealm('Grid');
        expect(state.enemyGrid.people[0].online).toBe(true);
    });

    test('rez is free — no enemy bits charged', () => {
        const entity = makeEntity({ steps: 2 });
        stateSetters.setEnemyGrid({ people: [entity], places: [], things: [] });
        state.enemyBits = 5;
        rezEnemyEntitiesInRealm('Grid');
        expect(state.enemyBits).toBe(5);
    });

    test('rezzes only entities that meet timer condition when multiple present', () => {
        const ready = makeEntity({ id: 'ready', steps: 2 });
        const notReady = makeEntity({ id: 'notReady', steps: 0 });
        stateSetters.setEnemyGrid({ people: [ready, notReady], places: [], things: [] });
        rezEnemyEntitiesInRealm('Grid');
        const people = state.enemyGrid.people;
        expect(people.find(e => e.id === 'ready').online).toBe(true);
        expect(people.find(e => e.id === 'notReady').online).toBe(false);
    });
});

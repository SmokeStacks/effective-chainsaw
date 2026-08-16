// Tests for enemyRezCards reading realms live from state.
//
// The bug: this module destructured enemySolarium/Theater/Underpass/Grid from
// state once at import time. The realm setters replace those objects instead of
// mutating them, so the snapshot kept pointing at the original empty realms.
// Any entity placed after module load was invisible, so the enemy never rezzed.

import { setupTestEnv } from '../testHarness';
import { state } from '../state';
import { enemyRezCards } from '../enemy/rez';
import * as glossary from '../../abilities/glossary';

let activateSpy;

beforeEach(() => {
    setupTestEnv();
    activateSpy = jest.spyOn(glossary, 'activateAbilities').mockResolvedValue(undefined);
});

afterEach(() => {
    jest.restoreAllMocks();
});

const readyEntity = (over = {}) => ({
    id: 'e1',
    steps: 3,
    freeze: 0,
    online: false,
    card: { name: 'Timed Entity', category: 'ENTITY', timer: 2 },
    ...over,
});

describe('enemyRezCards — realms are read at call time', () => {
    test('activates an entity in a realm object replaced after module load', async () => {
        // Simulates what the realm setters do: swap in a brand new object.
        state.enemyGrid = { people: [readyEntity()], places: [], things: [] };

        await enemyRezCards();

        expect(activateSpy).toHaveBeenCalledTimes(1);
        expect(activateSpy.mock.calls[0][1]).toBe('ENEMY');
    });

    test('scans every enemy realm', async () => {
        state.enemySolarium = { people: [readyEntity({ id: 's1' })], places: [], things: [] };
        state.enemyTheater = { people: [readyEntity({ id: 't1' })], places: [], things: [] };
        state.enemyUnderpass = { people: [readyEntity({ id: 'u1' })], places: [], things: [] };
        state.enemyGrid = { people: [readyEntity({ id: 'g1' })], places: [], things: [] };

        await enemyRezCards();

        expect(activateSpy).toHaveBeenCalledTimes(4);
    });

    test('does not activate an entity whose timer has not elapsed', async () => {
        state.enemyGrid = {
            people: [readyEntity({ steps: 1, card: { name: 'Slow', timer: 5 } })],
            places: [],
            things: [],
        };

        await enemyRezCards();

        expect(activateSpy).not.toHaveBeenCalled();
    });

    test('does not activate a frozen or already online entity', async () => {
        state.enemyGrid = {
            people: [readyEntity({ id: 'f1', freeze: 2 }), readyEntity({ id: 'o1', online: true })],
            places: [],
            things: [],
        };

        await enemyRezCards();

        expect(activateSpy).not.toHaveBeenCalled();
    });

    test('activates a SNIP thing but skips traps', async () => {
        state.enemyGrid = {
            people: [],
            places: [],
            things: [
                { id: 'sn1', online: false, card: { name: 'Snip', category: 'SNIP' } },
                { id: 'tr1', online: false, card: { name: 'Trap', category: 'SNIP', trap: true } },
            ],
        };

        await enemyRezCards();

        expect(activateSpy).toHaveBeenCalledTimes(1);
        expect(activateSpy.mock.calls[0][0].id).toBe('sn1');
    });

    test('tolerates a missing realm and still reports success', async () => {
        state.enemyGrid = undefined;

        await expect(enemyRezCards()).resolves.toBe(true);
    });
});

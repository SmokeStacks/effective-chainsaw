// Tests for enemyRezCards reading realms live from state.
//
// The bug: this module destructured enemySolarium/Theater/Underpass/Grid from
// state once at import time. The realm setters replace those objects instead of
// mutating them, so the snapshot kept pointing at the original empty realms.
// Any entity placed after module load was invisible.
//
// Since then, entity rez was split out into rezEnemyEntitiesInRealm (see
// rezEnemyEntitiesInRealm.test.js) which fires right before combat.
// enemyRezCards is now the general pre-action pass and only auto-onlines
// non-trap SNIPs; it still needs to read every enemy realm live from state.

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

const snipThing = (over = {}) => ({
    id: 'sn1',
    online: false,
    card: { name: 'Snip', category: 'SNIP' },
    ...over,
});

describe('enemyRezCards — realms are read at call time', () => {
    test('activates a SNIP thing in a realm object replaced after module load', async () => {
        // Simulates what the realm setters do: swap in a brand new object.
        state.enemyGrid = { people: [], places: [], things: [snipThing()] };

        await enemyRezCards();

        expect(activateSpy).toHaveBeenCalledTimes(1);
        expect(activateSpy.mock.calls[0][1]).toBe('ENEMY');
    });

    test('scans every enemy realm', async () => {
        state.enemySolarium = { people: [], places: [], things: [snipThing({ id: 's1' })] };
        state.enemyTheater = { people: [], places: [], things: [snipThing({ id: 't1' })] };
        state.enemyUnderpass = { people: [], places: [], things: [snipThing({ id: 'u1' })] };
        state.enemyGrid = { people: [], places: [], things: [snipThing({ id: 'g1' })] };

        await enemyRezCards();

        expect(activateSpy).toHaveBeenCalledTimes(4);
    });

    test('does not re-activate an already online SNIP', async () => {
        state.enemyGrid = { people: [], places: [], things: [snipThing({ online: true })] };

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

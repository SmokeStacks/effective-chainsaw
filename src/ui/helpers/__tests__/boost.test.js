// Tests for Boost and Develop actions.
//
// Covers:
//   actions.js  : handleBoostButton, handleDevelopButton (resource deduction + mode)
//   advancement.js : applyBoost, gainSteps, handleBoostCard, handleDevelopCard (entity mutation)
//
// handleBoostInRealm / handleDevelopInRealm in BoardContainer.js are React-
// closure functions that depend on local `realms` state; they are not tested here.

import { setupTestEnv } from '../testHarness';
import { state } from '../state';
import { handleBoostButton, handleDevelopButton } from '../actions';
import { applyBoost, gainSteps, handleBoostCard, handleDevelopCard } from '../advancement';

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeEntity(id, realmName, overrides = {}) {
    return {
        id,
        power: 2,
        steps: 0,
        freeze: 0,
        readied: false,
        owner: 'PLAYER',
        realm: realmName,
        card: { name: id, HP: 5, timer: 3, category: 'ENTITY' },
        ...overrides,
    };
}

function placeInRealm(entity, side = 'PLAYER') {
    const key = (side === 'PLAYER' ? 'player' : 'enemy') +
        entity.realm.charAt(0).toUpperCase() + entity.realm.slice(1);
    state[key].people.push(entity);
}

// ─── handleBoostButton ────────────────────────────────────────────────────────

describe('handleBoostButton', () => {
    beforeEach(() => setupTestEnv());

    test('deducts 1 action and 1 bit, sets attackMode to BOOST', () => {
        state.playerActions = 3;
        state.playerBits = 4;

        handleBoostButton();

        expect(state.playerActions).toBe(2);
        expect(state.playerBits).toBe(3);
        expect(state.attackMode).toBe('BOOST');
    });

    test('does nothing when player has no actions', () => {
        state.playerActions = 0;
        state.playerBits = 4;

        handleBoostButton();

        expect(state.playerBits).toBe(4);
        expect(state.attackMode).not.toBe('BOOST');
    });

    test('does nothing when player has no bits', () => {
        state.playerActions = 3;
        state.playerBits = 0;

        handleBoostButton();

        expect(state.playerActions).toBe(3);
        expect(state.attackMode).not.toBe('BOOST');
    });
});

// ─── handleDevelopButton ──────────────────────────────────────────────────────

describe('handleDevelopButton', () => {
    beforeEach(() => setupTestEnv());

    test('deducts 1 action and 1 bit, sets attackMode to DEVELOP', () => {
        state.playerActions = 2;
        state.playerBits = 3;

        handleDevelopButton();

        expect(state.playerActions).toBe(1);
        expect(state.playerBits).toBe(2);
        expect(state.attackMode).toBe('DEVELOP');
    });

    test('does nothing when insufficient resources', () => {
        state.playerActions = 1;
        state.playerBits = 0;

        handleDevelopButton();

        expect(state.playerActions).toBe(1);
        expect(state.attackMode).not.toBe('DEVELOP');
    });
});

// ─── gainSteps ────────────────────────────────────────────────────────────────

describe('gainSteps', () => {
    beforeEach(() => setupTestEnv());

    test('increments steps on the entity in the realm', () => {
        const entity = makeEntity('e1', 'Solarium', { steps: 1, card: { name: 'e1', HP: 5, timer: 5 } });
        placeInRealm(entity);

        gainSteps(entity, 2, 'PLAYER');

        expect(state.playerSolarium.people[0].steps).toBe(3);
    });

    test('marks entity readied when steps reach timer', () => {
        const entity = makeEntity('e2', 'Theater', { steps: 2, card: { name: 'e2', HP: 5, timer: 3 } });
        placeInRealm(entity);

        gainSteps(entity, 1, 'PLAYER');

        expect(state.playerTheater.people[0].readied).toBe(true);
    });

    test('entity is not readied when steps still below timer', () => {
        const entity = makeEntity('e3', 'Grid', { steps: 0, card: { name: 'e3', HP: 5, timer: 4 } });
        placeInRealm(entity);

        gainSteps(entity, 2, 'PLAYER');

        expect(state.playerGrid.people[0].readied).toBe(false);
        expect(state.playerGrid.people[0].steps).toBe(2);
    });
});

// ─── applyBoost ───────────────────────────────────────────────────────────────

describe('applyBoost', () => {
    beforeEach(() => setupTestEnv());

    test('with no freeze: adds boostAmount steps', () => {
        const entity = makeEntity('b1', 'Underpass', { steps: 0, freeze: 0, card: { name: 'b1', HP: 5, timer: 5 } });
        placeInRealm(entity);

        applyBoost(entity, 2, 'PLAYER');

        expect(state.playerUnderpass.people[0].steps).toBe(2);
    });

    test('with freeze > 0 and boost <= freeze: absorbs full boost into freeze, no steps gained', () => {
        // boost=2 <= freeze=3: entire boost absorbed, freeze goes from 3 → 1
        const entity = makeEntity('b2', 'Underpass', { steps: 0, freeze: 3, card: { name: 'b2', HP: 5, timer: 5 } });
        placeInRealm(entity);

        applyBoost(entity, 2, 'PLAYER');

        const updated = state.playerUnderpass.people[0];
        expect(updated.freeze).toBe(1);
        expect(updated.steps).toBe(0);
    });

    test('excess boost after freeze cleared is applied as steps', () => {
        // freeze=1, boostAmount=3: 1 absorbed by freeze → 2 remaining go to steps
        const entity = makeEntity('b3', 'Solarium', { steps: 0, freeze: 1, card: { name: 'b3', HP: 5, timer: 5 } });
        placeInRealm(entity);

        applyBoost(entity, 3, 'PLAYER');

        const updated = state.playerSolarium.people[0];
        expect(updated.freeze).toBe(0);
        expect(updated.steps).toBe(2);
    });
});

// ─── handleBoostCard ─────────────────────────────────────────────────────────

describe('handleBoostCard', () => {
    beforeEach(() => setupTestEnv());

    test('step gain: entity steps + 1 in realm', () => {
        const entity = makeEntity('hb1', 'Grid', { steps: 1, freeze: 0, card: { name: 'hb1', HP: 5, timer: 5 } });
        placeInRealm(entity);

        handleBoostCard(entity);

        expect(state.playerGrid.people[0].steps).toBe(2);
    });

    test('freeze > 0: reduces freeze, no step gain', () => {
        const entity = makeEntity('hb2', 'Grid', { steps: 0, freeze: 3, card: { name: 'hb2', HP: 5, timer: 5 } });
        placeInRealm(entity);

        handleBoostCard(entity);

        const updated = state.playerGrid.people[0];
        expect(updated.freeze).toBe(2);
        expect(updated.steps).toBe(0);
    });

    test('readied when steps reach timer', () => {
        const entity = makeEntity('hb3', 'Theater', { steps: 2, readied: false, card: { name: 'hb3', HP: 5, timer: 3 } });
        placeInRealm(entity);

        handleBoostCard(entity);

        expect(state.playerTheater.people[0].readied).toBe(true);
    });

    test('resets attackMode to NONE', () => {
        state.attackMode = 'BOOST';
        const entity = makeEntity('hb4', 'Solarium', { card: { name: 'hb4', HP: 5, timer: 5 } });
        placeInRealm(entity);

        handleBoostCard(entity);

        expect(state.attackMode).toBe('NONE');
    });
});

// ─── handleDevelopCard ────────────────────────────────────────────────────────

describe('handleDevelopCard', () => {
    beforeEach(() => setupTestEnv());

    test('increments development on a SYM card', () => {
        const entity = makeEntity('dc1', 'Solarium', {
            development: 0,
            owner: 'PLAYER',
            card: { name: 'dc1', HP: 5, timer: 3, category: 'SYM', plot: 5 },
        });
        placeInRealm(entity);

        handleDevelopCard(entity);

        expect(state.playerSolarium.people[0].development).toBe(1);
    });

    test('increments development on a LANDMARK card', () => {
        const entity = makeEntity('dc2', 'Theater', {
            development: 2,
            owner: 'PLAYER',
            card: { name: 'dc2', HP: 5, timer: 3, category: 'LANDMARK', plot: 5 },
        });
        placeInRealm(entity);

        handleDevelopCard(entity);

        expect(state.playerTheater.people[0].development).toBe(3);
    });

    test('non-developable category: entity not modified', () => {
        // No development property set — if handleDevelopCard touches it we'll see it
        const entity = makeEntity('dc3', 'Grid', {
            owner: 'PLAYER',
            card: { name: 'dc3', HP: 5, timer: 3, category: 'ENTITY' },
        });
        placeInRealm(entity);

        handleDevelopCard(entity);

        // Should remain absent / falsy — the early-return guard fires
        expect(state.playerGrid.people[0].development ?? undefined).toBeUndefined();
    });

    test('scheme card: increments scheme', () => {
        const entity = makeEntity('dc4', 'Underpass', {
            scheme: 1,
            scheming: true,
            owner: 'PLAYER',
            card: { name: 'dc4', HP: 5, category: 'ENTITY', schemeThreshold: 5 },
        });
        placeInRealm(entity);

        handleDevelopCard(entity);

        expect(state.playerUnderpass.people[0].scheme).toBe(2);
    });

    test('scheme threshold reached: schemeUnlocked set to true', () => {
        const entity = makeEntity('dc5', 'Underpass', {
            scheme: 4,
            scheming: true,
            owner: 'PLAYER',
            card: { name: 'dc5', HP: 5, category: 'ENTITY', schemeThreshold: 5 },
        });
        placeInRealm(entity);

        handleDevelopCard(entity);

        const updated = state.playerUnderpass.people[0];
        expect(updated.scheme).toBe(5);
        expect(updated.schemeUnlocked).toBe(true);
    });

    test('resets attackMode to NONE', () => {
        state.attackMode = 'DEVELOP';
        const entity = makeEntity('dc6', 'Solarium', {
            owner: 'PLAYER',
            card: { name: 'dc6', HP: 5, category: 'SYM', plot: 5 },
        });
        placeInRealm(entity);

        handleDevelopCard(entity);

        expect(state.attackMode).toBe('NONE');
    });
});

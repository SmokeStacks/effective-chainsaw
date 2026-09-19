// Detox was completely inert. `performDetox` gated on a bare `playerActions`
// identifier that resolved to a module-level `playerActions = 0` left over from
// a destructure of `state` performed at import time, when `state` is still
// empty. The check `playerActions >= 3` was therefore always false and the
// action only ever logged "Not enough actions to detox".
//
// `detoxEntities` had the same problem with the Realm objects, and additionally
// cleansed the WRONG side: it only ran its Venom pass when the enemy detoxed,
// and cleared Venom from the opponent's cards. notes.txt: "Detox (spend 3
// actions to cleanse all Freeze, Decay and enemy Venom)" — "enemy Venom" is
// whose Venom it is, not whose cards get cleaned.

import { setupTestEnv } from '../testHarness';
import { state } from '../state';
import { performDetox, detoxEntities, DETOX_ACTION_COST } from '../core';

beforeEach(() => {
    setupTestEnv();
});

const afflicted = (id, over = {}) => ({
    id,
    freeze: 2,
    decay: 1,
    venom: 3,
    card: { name: id, category: 'ENTITY' },
    ...over,
});

describe('performDetox action cost', () => {
    test('costs 3 actions', () => {
        expect(DETOX_ACTION_COST).toBe(3);
    });

    test('spends 3 actions when the player can afford it', () => {
        state.playerActions = 3;
        expect(performDetox('PLAYER')).toBe(true);
        expect(state.playerActions).toBe(0);
    });

    test('is refused with 2 actions and spends nothing', () => {
        state.playerActions = 2;
        expect(performDetox('PLAYER')).toBe(false);
        expect(state.playerActions).toBe(2);
    });

    test('reads live actions rather than a stale snapshot', () => {
        // The whole original bug: a value captured at import time is always 0,
        // so no amount of actions could ever pay for a Detox.
        state.playerActions = 5;
        expect(performDetox('PLAYER')).toBe(true);
        expect(state.playerActions).toBe(2);
    });

    test('the enemy pays from its own action pool', () => {
        state.enemyActions = 4;
        state.playerActions = 0;
        expect(performDetox('ENEMY')).toBe(true);
        expect(state.enemyActions).toBe(1);
        expect(state.playerActions).toBe(0);
    });
});

describe('detoxEntities cleanses the detoxing side', () => {
    test('clears Freeze, Decay and Venom from your own entities', () => {
        state.playerTheater.people = [afflicted('a1')];

        detoxEntities('PLAYER');

        const cleaned = state.playerTheater.people[0];
        expect(cleaned.freeze).toBe(0);
        expect(cleaned.decay).toBe(0);
        expect(cleaned.venom).toBe(0);
    });

    test('cleanses across every Realm, not just one', () => {
        state.playerSolarium.people = [afflicted('s1')];
        state.playerUnderpass.people = [afflicted('u1')];
        state.playerGrid.people = [afflicted('g1')];

        detoxEntities('PLAYER');

        expect(state.playerSolarium.people[0].freeze).toBe(0);
        expect(state.playerUnderpass.people[0].decay).toBe(0);
        expect(state.playerGrid.people[0].venom).toBe(0);
    });

    test('cleanses Venom from Places and Things too', () => {
        state.playerTheater.places = [afflicted('p1', { card: { name: 'p1', category: 'LOCATION' } })];
        state.playerGrid.things = [afflicted('t1', { card: { name: 't1', category: 'SNIP' } })];

        detoxEntities('PLAYER');

        expect(state.playerTheater.places[0].venom).toBe(0);
        expect(state.playerGrid.things[0].venom).toBe(0);
    });

    test("does not touch the opponent's cards", () => {
        state.enemyTheater.people = [afflicted('e1')];

        detoxEntities('PLAYER');

        const untouched = state.enemyTheater.people[0];
        expect(untouched.freeze).toBe(2);
        expect(untouched.decay).toBe(1);
        expect(untouched.venom).toBe(3);
    });

    test('an enemy Detox cleanses the enemy, not the player', () => {
        state.enemyTheater.people = [afflicted('e1')];
        state.playerTheater.people = [afflicted('a1')];

        detoxEntities('ENEMY');

        expect(state.enemyTheater.people[0].venom).toBe(0);
        expect(state.playerTheater.people[0].venom).toBe(3);
    });

    test('leaves unafflicted entities untouched', () => {
        const clean = { id: 'c1', card: { name: 'c1', category: 'ENTITY' } };
        state.playerTheater.people = [clean];

        detoxEntities('PLAYER');

        expect(state.playerTheater.people[0]).toBe(clean);
    });

    test('goes through the Realm setter so the UI sees the change', () => {
        // The original mutated entity objects in place, so React never
        // re-rendered. The harness setters write to state, so observing the new
        // array identity is the closest proxy for "a setter was called".
        const before = state.playerTheater.people;
        state.playerTheater.people = [afflicted('a1')];
        detoxEntities('PLAYER');
        expect(state.playerTheater.people).not.toBe(before);
    });
});

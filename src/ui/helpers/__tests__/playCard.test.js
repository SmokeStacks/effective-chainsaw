// Regression tests for the consolidated card-play path.
//
// Placement logic previously existed twice: a live copy inside BoardContainer
// and a dead exported copy in core.js that nothing imported. Three behaviours
// only ever existed in the dead copy, so they never ran in a real game:
//
//   1. The Impostor branch, which is the ONLY way to raise an Impostor swap
//      request. BoardContainer had no Impostor code at all, so the keyword was
//      unreachable no matter how correct impostor.js was.
//   2. activateAbilities + the entityEntered publish for cards entering Online,
//      so every Landmark and Location was inert on arrival.
//   3. Consuming a drafted Dreamer. The live copy called removeCardFromHand,
//      which only filters playerHand; a drafted Dreamer is never in hand, so it
//      was a no-op and the shared 5-card draft deck never depleted.
//
// These tests drive playCardToRealm directly so the live path is covered.

import { setupTestEnv } from '../testHarness';
import { state } from '../state';
import { eventManager } from '../eventManager';
import { playCardToRealm } from '../playCard';
import { getDraftArray, resetDraftArray } from '../core';

beforeEach(() => {
    setupTestEnv();
    resetDraftArray();
    eventManager.events = {};
});

const entityCard = (over = {}) => ({
    id: 'p1',
    owner: 'PLAYER',
    card: {
        name: 'Grunt',
        category: 'ENTITY',
        magi: false,
        phys: true,
        tech: false,
        abilities: [],
        ...(over.card || {}),
    },
    ...over,
});

/** Puts `cardEntity` in hand and selects it, as the UI would. */
function select(cardEntity, { draft = false } = {}) {
    if (!draft) state.playerHand = [cardEntity];
    state.selectedCard = cardEntity;
    state.draftSelected = draft;
    state.selectedInHand = true;
}

describe('focus gate', () => {
    test('an Entity whose affinity does not match the Focus is rejected', () => {
        state.focus = 'tech';
        select(entityCard());
        expect(playCardToRealm('Theater').reason).toBe('focus-mismatch');
        expect(state.playerTheater.people).toHaveLength(0);
    });

    test('an Entity matching the Focus is placed', () => {
        state.focus = 'phys';
        state.playerActions = 3;
        select(entityCard());
        expect(playCardToRealm('Theater').placed).toBe(true);
        expect(state.playerTheater.people).toHaveLength(1);
    });

    test('non-Entities ignore Focus (notes.txt: Focus gates affinities)', () => {
        state.focus = null;
        state.playerActions = 3;
        select(entityCard({ card: { name: 'Obelisk', category: 'LANDMARK' } }));
        expect(playCardToRealm('Theater').placed).toBe(true);
    });
});

describe('placement rules are enforced on the live path', () => {
    test('Theater rejects a Tech-only entity', () => {
        state.focus = 'tech';
        state.playerActions = 3;
        select(entityCard({ card: { category: 'ENTITY', tech: true, phys: false } }));
        expect(playCardToRealm('Theater').reason).toBe('affinity-mismatch');
    });

    test('realm name capitalisation does not matter', () => {
        state.focus = 'phys';
        state.playerActions = 3;
        select(entityCard());
        expect(playCardToRealm('theater').placed).toBe(true);
        expect(state.playerTheater.people).toHaveLength(1);
    });

    test('Elysium is not directly playable', () => {
        state.focus = 'phys';
        select(entityCard());
        expect(playCardToRealm('Elysium').placed).toBe(false);
    });
});

describe('cards entering Online activate on arrival', () => {
    test('a Landmark publishes entityEntered', () => {
        state.playerActions = 3;
        const seen = [];
        eventManager.subscribe('entityEntered', (d) => seen.push(d));

        select(entityCard({ card: { name: 'Obelisk', category: 'LANDMARK' } }));
        playCardToRealm('Theater');

        expect(seen).toHaveLength(1);
        expect(seen[0].side).toBe('PLAYER');
        expect(seen[0].realm).toBe('Theater');
        expect(state.playerTheater.places[0].online).toBe(true);
    });

    test('an Entity enters Offline and does not publish entityEntered', () => {
        state.focus = 'phys';
        state.playerActions = 3;
        const seen = [];
        eventManager.subscribe('entityEntered', (d) => seen.push(d));

        select(entityCard());
        playCardToRealm('Theater');

        expect(seen).toHaveLength(0);
        expect(state.playerTheater.people[0].online).toBe(false);
    });
});

describe('Location Activation cost', () => {
    const location = (rezCost) =>
        entityCard({ card: { name: 'Safehouse', category: 'LOCATION', rezCost } });

    test('is refused when the player cannot afford it', () => {
        state.playerActions = 3;
        state.playerBits = 1;
        select(location(3));

        expect(playCardToRealm('Theater').reason).toBe('insufficient-resources');
        expect(state.playerTheater.places).toHaveLength(0);
        // The key regression: it must not be placed for free.
        expect(state.playerBits).toBe(1);
    });

    test('is charged when affordable', () => {
        state.playerActions = 3;
        state.playerBits = 5;
        select(location(3));

        expect(playCardToRealm('Theater').placed).toBe(true);
        expect(state.playerBits).toBe(2);
    });
});

describe('Impostor is reachable from the play path', () => {
    const impostor = () =>
        entityCard({
            id: 'imp1',
            card: { name: 'Splinter Faction', category: 'ENTITY', phys: true, abilities: [{ name: 'Impostor' }] },
        });

    test('raises a swap request when the realm holds an enemy Offline entity', () => {
        state.focus = 'phys';
        state.enemyUnderpass.people = [
            { id: 'e1', owner: 'ENEMY', realm: 'Underpass', online: false, card: { category: 'ENTITY' } },
        ];
        select(impostor());

        const result = playCardToRealm('Underpass');

        expect(result.reason).toBe('awaiting-impostor');
        expect(state.awaitingImpostor).toBe(true);
        expect(state.impostorRealm).toBe('Underpass');
        // The card waits for a target rather than being placed.
        expect(state.playerUnderpass.people).toHaveLength(0);
    });

    test('refuses a realm with no enemy Offline entity, leaving no stuck request', () => {
        state.focus = 'phys';
        select(impostor());

        expect(playCardToRealm('Underpass').reason).toBe('no-impostor-target');
        expect(state.awaitingImpostor).toBe(false);
    });
});

describe('drafted Dreamers are consumed', () => {
    test('placing a drafted Dreamer depletes the shared deck and costs 1 Bit', () => {
        state.focus = 'magi';
        state.playerActions = 3;
        state.playerBits = 4;

        const before = getDraftArray().length;
        const dreamer = getDraftArray()[0];
        select({ ...dreamer, owner: 'PLAYER' }, { draft: true });

        expect(playCardToRealm('Solarium').placed).toBe(true);
        expect(getDraftArray()).toHaveLength(before - 1);
        expect(state.playerBits).toBe(3);
        expect(state.playerDrafted).toBe(true);
    });

    test('the same Dreamer cannot be drafted twice (deck actually shrinks)', () => {
        state.focus = 'magi';
        state.playerActions = 3;
        state.playerBits = 9;

        const first = getDraftArray()[0];
        select({ ...first, owner: 'PLAYER' }, { draft: true });
        playCardToRealm('Solarium');

        const next = getDraftArray()[0];
        expect(next.id).not.toBe(first.id);
    });

    test('a card played from hand is removed from hand, not from the draft deck', () => {
        state.focus = 'phys';
        state.playerActions = 3;
        const before = getDraftArray().length;

        select(entityCard());
        playCardToRealm('Theater');

        expect(state.playerHand).toHaveLength(0);
        expect(getDraftArray()).toHaveLength(before);
    });
});

describe('action economy', () => {
    test('a successful placement spends exactly one action', () => {
        state.focus = 'phys';
        state.playerActions = 3;
        select(entityCard());

        playCardToRealm('Theater');

        expect(state.playerActions).toBe(2);
    });

    test('a rejected placement spends no action', () => {
        state.focus = 'tech';
        state.playerActions = 3;
        select(entityCard());

        playCardToRealm('Theater');

        expect(state.playerActions).toBe(3);
    });
});

test('no selected card is a no-op', () => {
    state.selectedCard = null;
    expect(playCardToRealm('Theater').reason).toBe('no-selection');
});

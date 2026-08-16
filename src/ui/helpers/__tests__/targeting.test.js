// Tests for consuming an open target request.
//
// The bug: setTargetSelection({ enabled, filter, onSelect }) was write-only
// state. Nothing in the codebase ever read back onSelect and invoked it, so no
// targeted effect could resolve. Worse, the live board-click handler is
// handleCardSelect(card, false), whose first act was to clear targetSelection
// and pendingRitual -- so the click meant to choose a target cancelled the
// request instead. This affected both targeting Rituals (Multi Threading) and
// every targeted manual ability set up in selection.js.

import { setupTestEnv } from '../testHarness';
import { state } from '../state';
import { handleCardSelect } from '../selection';
import { resolveRitual } from '../core';

beforeEach(() => {
    setupTestEnv();
});

const boardCard = (over = {}) => ({
    id: 'b1',
    owner: 'PLAYER',
    card: { name: 'Board Entity', category: 'ENTITY' },
    ...over,
});

const requestTarget = (over = {}) => {
    state.targetSelection = {
        enabled: true,
        side: 'PLAYER',
        filter: () => true,
        onSelect: jest.fn(),
        ...over,
    };
    return state.targetSelection;
};

describe('handleCardSelect — answering an open target request', () => {
    test('a board click invokes onSelect with the clicked card', () => {
        const request = requestTarget();
        const target = boardCard();

        handleCardSelect(target, false);

        expect(request.onSelect).toHaveBeenCalledTimes(1);
        expect(request.onSelect).toHaveBeenCalledWith(target);
    });

    test('answering the request does not overwrite the selected card', () => {
        // The ritual being resolved is the selectedCard; clobbering it with the
        // target would lose the card mid-resolution.
        requestTarget();
        state.selectedCard = { id: 'ritual', card: { name: 'Multi Threading' } };

        handleCardSelect(boardCard(), false);

        expect(state.selectedCard.id).toBe('ritual');
    });

    test('an illegal target is ignored and the request stays open', () => {
        const request = requestTarget({
            filter: (t) => t.owner === 'ENEMY',
        });

        handleCardSelect(boardCard({ owner: 'PLAYER' }), false);

        expect(request.onSelect).not.toHaveBeenCalled();
        expect(state.targetSelection.enabled).toBe(true);
    });

    test('a legal target passing the filter is accepted', () => {
        const request = requestTarget({
            filter: (t) => t.card.category === 'ENTITY' && t.owner === 'PLAYER',
        });
        const target = boardCard();

        handleCardSelect(target, false);

        expect(request.onSelect).toHaveBeenCalledWith(target);
    });

    test('a hand click does not answer the request', () => {
        const request = requestTarget();

        handleCardSelect(boardCard(), true);

        expect(request.onSelect).not.toHaveBeenCalled();
    });

    test('a board click falls through to normal selection when no request is open', () => {
        state.targetSelection = { enabled: false };
        const target = boardCard();

        handleCardSelect(target, false);

        expect(state.selectedCard).toBe(target);
        expect(state.selectedInHand).toBe(false);
    });

    test('an enabled request with no onSelect falls through to normal selection', () => {
        state.targetSelection = { enabled: true, filter: () => true };
        const target = boardCard();

        handleCardSelect(target, false);

        expect(state.selectedCard).toBe(target);
    });
});

describe('targeting Rituals resolve end to end', () => {
    test('clicking a target resolves the ritual: cost paid, card in graveyard', () => {
        const ritual = {
            id: 'r1',
            card: {
                name: 'Multi Threading',
                category: 'RITUAL',
                rezCost: 2,
                ash: 0,
                soul: 0,
                abilities: [],
            },
        };
        state.playerHand = [ritual];
        state.playerBits = 5;
        state.playerActions = 2;
        state.playerGraveyard = [];
        state.pendingRitual = { entity: ritual, ability: null };
        requestTarget({
            filter: (t) => t.card.category === 'ENTITY',
            onSelect: (target) => resolveRitual(ritual, target),
        });

        handleCardSelect(boardCard(), false);

        expect(state.playerHand).toEqual([]);
        expect(state.playerGraveyard.map(c => c.id)).toEqual(['r1']);
        expect(state.playerBits).toBe(3);
        expect(state.playerActions).toBe(1);
        expect(state.pendingRitual).toBe(null);
        expect(state.targetSelection.enabled).toBe(false);
    });
});

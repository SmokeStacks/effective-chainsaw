// Unit tests for effective rez cost resolution.
//
// Rapture: a card carrying the keyword costs 1 less to rez on any turn where an
// entity has already died. The discount applies to whichever non-Bits cost the
// card actually uses (Ash or Soul), and applies to cards still in hand, so it is
// resolved from the card definition rather than from a board entity.

import { setupTestEnv } from '../testHarness';
import { state } from '../state';
import { rezCostFor } from '../activation';

beforeEach(() => {
    setupTestEnv();
});

const raptureAshCard = { name: 'Embedding', rezCost: 2, ash: 4, soul: 0, abilities: [{ name: 'Rapture' }] };
const raptureSoulCard = { name: 'Soulbound', rezCost: 1, ash: 0, soul: 3, abilities: [{ name: 'Rapture' }] };
const plainCard = { name: 'Plain', rezCost: 2, ash: 4, soul: 0, abilities: [] };

describe('rezCostFor — base costs', () => {
    test('a card with no cost keywords returns its printed cost', () => {
        expect(rezCostFor(plainCard)).toEqual({ bits: 2, ash: 4, soul: 0 });
    });

    test('missing cost fields default to 0', () => {
        expect(rezCostFor({ name: 'Sparse' })).toEqual({ bits: 0, ash: 0, soul: 0 });
    });

    test('does not mutate the card definition', () => {
        state.entityDiedThisTurn = true;
        rezCostFor(raptureAshCard);
        expect(raptureAshCard.ash).toBe(4);
    });
});

describe('rezCostFor — Rapture', () => {
    test('no discount when nothing has died this turn', () => {
        state.entityDiedThisTurn = false;
        expect(rezCostFor(raptureAshCard)).toEqual({ bits: 2, ash: 4, soul: 0 });
    });

    test('discounts Ash by 1 once an entity has died', () => {
        state.entityDiedThisTurn = true;
        expect(rezCostFor(raptureAshCard)).toEqual({ bits: 2, ash: 3, soul: 0 });
    });

    test('discounts Soul when the card has no Ash cost', () => {
        state.entityDiedThisTurn = true;
        expect(rezCostFor(raptureSoulCard)).toEqual({ bits: 1, ash: 0, soul: 2 });
    });

    test('never discounts Bits', () => {
        state.entityDiedThisTurn = true;
        expect(rezCostFor(raptureAshCard).bits).toBe(2);
        expect(rezCostFor(raptureSoulCard).bits).toBe(1);
    });

    test('a card without Rapture is unaffected even after a death', () => {
        state.entityDiedThisTurn = true;
        expect(rezCostFor(plainCard)).toEqual({ bits: 2, ash: 4, soul: 0 });
    });

    test('the keyword is also read from a bare numeric field', () => {
        state.entityDiedThisTurn = true;
        const bareField = { name: 'Bare', rezCost: 0, ash: 2, soul: 0, rapture: 1 };
        expect(rezCostFor(bareField).ash).toBe(1);
    });

    test('a zero-cost Rapture card cannot be discounted below zero', () => {
        state.entityDiedThisTurn = true;
        const free = { name: 'Free', rezCost: 0, ash: 0, soul: 0, abilities: [{ name: 'Rapture' }] };
        expect(rezCostFor(free)).toEqual({ bits: 0, ash: 0, soul: 0 });
    });
});

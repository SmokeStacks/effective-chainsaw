// Unit tests for paying a card's rez cost.
//
// Rezzing previously verified affordability but never deducted anything, so
// cards were effectively free. Payment happens when the rez completes (the card
// goes online), not when it starts, so an abandoned rez costs nothing.
//
// Soul is deliberately not deducted here: it is not a spendable pool, it is paid
// by destroying entities in the sacrifice step.

import { setupTestEnv } from '../testHarness';
import { state } from '../state';
import { payRezCost } from '../player';

beforeEach(() => {
    setupTestEnv();
});

const card = (over = {}) => ({ name: 'Test', rezCost: 0, ash: 0, soul: 0, abilities: [], ...over });

describe('payRezCost — Bits', () => {
    test('deducts the Bits cost', () => {
        state.playerBits = 5;
        payRezCost(card({ rezCost: 2 }));
        expect(state.playerBits).toBe(3);
    });

    test('a zero Bits cost leaves Bits untouched', () => {
        state.playerBits = 5;
        payRezCost(card({ rezCost: 0 }));
        expect(state.playerBits).toBe(5);
    });

    test('never drives Bits below zero', () => {
        state.playerBits = 1;
        payRezCost(card({ rezCost: 4 }));
        expect(state.playerBits).toBe(0);
    });
});

describe('payRezCost — Ash', () => {
    test('deducts the Ash cost', () => {
        state.playerAshes = 6;
        payRezCost(card({ ash: 4 }));
        expect(state.playerAshes).toBe(2);
    });

    test('deducts Bits and Ash together', () => {
        state.playerBits = 5;
        state.playerAshes = 5;
        payRezCost(card({ rezCost: 2, ash: 3 }));
        expect(state.playerBits).toBe(3);
        expect(state.playerAshes).toBe(2);
    });

    test('never drives Ash below zero', () => {
        state.playerAshes = 1;
        payRezCost(card({ ash: 4 }));
        expect(state.playerAshes).toBe(0);
    });
});

describe('payRezCost — Soul is not spent from a pool', () => {
    test('a Soul cost does not touch Bits or Ash', () => {
        state.playerBits = 4;
        state.playerAshes = 4;
        payRezCost(card({ soul: 3 }));
        expect(state.playerBits).toBe(4);
        expect(state.playerAshes).toBe(4);
    });

    test('reports the Soul cost back to the caller', () => {
        expect(payRezCost(card({ soul: 3 })).soul).toBe(3);
    });
});

describe('payRezCost — keyword discounts reduce what is actually paid', () => {
    const raptureCard = card({ name: 'Embedding', rezCost: 2, ash: 4, abilities: [{ name: 'Rapture' }] });

    test('pays full price when nothing has died this turn', () => {
        state.playerAshes = 10;
        state.entityDiedThisTurn = false;
        payRezCost(raptureCard);
        expect(state.playerAshes).toBe(6);
    });

    test('Rapture reduces the Ash actually deducted', () => {
        state.playerAshes = 10;
        state.entityDiedThisTurn = true;
        payRezCost(raptureCard);
        expect(state.playerAshes).toBe(7);
    });

    test('Rapture never reduces the Bits deducted', () => {
        state.playerBits = 10;
        state.entityDiedThisTurn = true;
        payRezCost(raptureCard);
        expect(state.playerBits).toBe(8);
    });

    test('returns the cost that was paid', () => {
        state.entityDiedThisTurn = true;
        expect(payRezCost(raptureCard)).toEqual({ bits: 2, ash: 3, soul: 0 });
    });
});

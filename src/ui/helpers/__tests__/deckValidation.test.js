// Unit tests for the deck Rune requirement.
//
// notes.txt: "Include at least 20 Runes worth of Landmarks and/or Syms
//             (modified by Cursed and Karmic cards)."
// glossary.txt Karmic: "For every 2 cards with Karmic, increase the total
//             effective Rune score of your deck by 1."
// glossary.txt Cursed: "Every 2 Cursed cards in your deck decreases the
//             effective total Rune score by 1."
//
// The per-*pair* rounding is the subtle part: a single Karmic card is worth
// nothing, and three are worth the same as two.

import {
    RUNE_REQUIREMENT,
    baseRuneScore,
    countCardsWithKeyword,
    evaluateDeckRunes,
} from '../deckValidation';
import { cardList1 } from '../../../playerDecks/deckTwo';

const landmark = (runes, extra = {}) => ({ category: 'LANDMARK', runes, ...extra });
const sym = (runes, extra = {}) => ({ category: 'SYM', runes, ...extra });
const entity = (extra = {}) => ({ category: 'ENTITY', runes: 0, ...extra });

const karmic = { abilities: [{ name: 'Karmic' }] };
const cursed = { abilities: [{ name: 'Cursed' }] };

describe('baseRuneScore — only Landmarks and Syms count', () => {
    test('sums Runes across Landmarks and Syms', () => {
        expect(baseRuneScore([landmark(5), sym(3), landmark(2)])).toBe(10);
    });

    test('ignores Runes printed on other categories', () => {
        const deck = [landmark(4), { category: 'ENTITY', runes: 99 }, { category: 'RITUAL', runes: 50 }];
        expect(baseRuneScore(deck)).toBe(4);
    });

    test('treats a missing Runes value as 0', () => {
        expect(baseRuneScore([{ category: 'SYM' }, landmark(3)])).toBe(3);
    });

    test('an empty or undefined deck scores 0', () => {
        expect(baseRuneScore([])).toBe(0);
        expect(baseRuneScore(undefined)).toBe(0);
    });

    test('accepts built card instances that wrap the definition in .card', () => {
        expect(baseRuneScore([{ card: landmark(6) }, { card: sym(4) }])).toBe(10);
    });
});

describe('countCardsWithKeyword — both authoring conventions', () => {
    test('counts an abilities entry', () => {
        expect(countCardsWithKeyword([entity(karmic), entity()], 'karmic', 'Karmic')).toBe(1);
    });

    test('counts a bare field', () => {
        expect(countCardsWithKeyword([entity({ karmic: 1 }), entity()], 'karmic', 'Karmic')).toBe(1);
    });

    test('counts a card only once when it uses both conventions', () => {
        const both = entity({ karmic: 1, abilities: [{ name: 'Karmic' }] });
        expect(countCardsWithKeyword([both], 'karmic', 'Karmic')).toBe(1);
    });
});

describe('evaluateDeckRunes — Karmic and Cursed adjust per pair', () => {
    test('one Karmic card is not enough to add anything', () => {
        const result = evaluateDeckRunes([landmark(18), entity(karmic)]);
        expect(result.karmicCards).toBe(1);
        expect(result.karmicBonus).toBe(0);
        expect(result.effective).toBe(18);
        expect(result.valid).toBe(false);
    });

    test('two Karmic cards add 1', () => {
        const result = evaluateDeckRunes([landmark(19), entity(karmic), entity(karmic)]);
        expect(result.karmicBonus).toBe(1);
        expect(result.effective).toBe(20);
        expect(result.valid).toBe(true);
    });

    test('three Karmic cards still only add 1', () => {
        const result = evaluateDeckRunes([landmark(10), entity(karmic), entity(karmic), entity(karmic)]);
        expect(result.karmicBonus).toBe(1);
        expect(result.effective).toBe(11);
    });

    test('four Karmic cards add 2', () => {
        const result = evaluateDeckRunes([landmark(10), ...Array(4).fill(entity(karmic))]);
        expect(result.karmicBonus).toBe(2);
        expect(result.effective).toBe(12);
    });

    test('two Cursed cards subtract 1', () => {
        const result = evaluateDeckRunes([landmark(20), entity(cursed), entity(cursed)]);
        expect(result.cursedPenalty).toBe(1);
        expect(result.effective).toBe(19);
        expect(result.valid).toBe(false);
        expect(result.shortfall).toBe(1);
    });

    test('Karmic and Cursed offset each other', () => {
        const deck = [landmark(20), entity(karmic), entity(karmic), entity(cursed), entity(cursed)];
        const result = evaluateDeckRunes(deck);
        expect(result.effective).toBe(20);
        expect(result.valid).toBe(true);
    });

    test('effective score never goes negative', () => {
        const deck = [...Array(6).fill(entity(cursed))];
        expect(evaluateDeckRunes(deck).effective).toBe(0);
    });

    test('exactly meeting the requirement is legal', () => {
        const result = evaluateDeckRunes([landmark(RUNE_REQUIREMENT)]);
        expect(result.valid).toBe(true);
        expect(result.shortfall).toBe(0);
    });

    test('reports the requirement and shortfall for an illegal deck', () => {
        const result = evaluateDeckRunes([landmark(12)]);
        expect(result.required).toBe(20);
        expect(result.valid).toBe(false);
        expect(result.shortfall).toBe(8);
    });
});

describe('the live player deck is Rune-legal', () => {
    // This deck sits exactly on the requirement, and only clears it because of
    // its Karmic cards: 18 printed Runes + 1 for each pair of 4 Karmic cards.
    // Removing a Landmark/Sym or a pair of Karmic cards makes it illegal, which
    // is what this guard is here to catch.
    test('deckTwo meets the requirement via its Karmic pairs', () => {
        const result = evaluateDeckRunes(cardList1);
        expect(result.base).toBe(18);
        expect(result.karmicCards).toBe(4);
        expect(result.karmicBonus).toBe(2);
        expect(result.effective).toBe(20);
        expect(result.valid).toBe(true);
    });
});

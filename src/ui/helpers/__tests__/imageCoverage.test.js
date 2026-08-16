// Card art is looked up by card NAME: CardDisplay renders imgObj[name]. So
// renaming a card in a deck silently breaks its art -- imgObj[name] comes back
// undefined, the <img> gets no src, and the card renders without art.
//
// These tests fail with the exact list of names that have no art, so a rename
// cannot quietly lose an image again.

import { imgObj } from '../../Tools';
import { cardList1 } from '../../../playerDecks/deckTwo';
import enemyOne from '../../../systemDecks/enemyOne';

const namesOf = (deck) => [...new Set(deck.map((card) => card.name))].filter(Boolean);

const missingArt = (deck) => namesOf(deck).filter((name) => !imgObj[name]);

describe('card art coverage', () => {
    test('every card in the live player deck has art', () => {
        expect(missingArt(cardList1)).toEqual([]);
    });

    test('every card in the live enemy deck has art', () => {
        expect(missingArt(enemyOne)).toEqual([]);
    });

    test('no imgObj entry maps to an undefined import', () => {
        const broken = Object.keys(imgObj).filter((key) => !imgObj[key]);

        expect(broken).toEqual([]);
    });
});

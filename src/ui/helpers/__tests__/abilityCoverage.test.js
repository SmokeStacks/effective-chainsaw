// An ability only runs if its name resolves in abilitiesDefinitions: activateAbilities
// looks each card ability up by name and silently skips unknown ones. So a card can
// carry an ability that does nothing at all, with no error anywhere.
//
// This reports which ability names in the live decks have no implementation.

import { abilitiesDefinitions } from '../../abilities/glossary';
import { cardList1 } from '../../../playerDecks/deckTwo';
import enemyOne from '../../../systemDecks/enemyOne';

// Keyword-style entries are legitimately absent from the glossary -- they are
// read directly by other systems rather than dispatched by activateAbilities:
//   Buffer, Deathless      -> damage.js
//   Pounce, Stealth        -> entity properties set on placement (core.js)
//   Glitchy, Locality, Karmic, Soulless, Rapture -> rez-cost keywords
//                             (activation.js, deckValidation.js)
const KEYWORDS = new Set([
    'Buffer',
    'Deathless',
    'Pounce',
    'Stealth',
    'Glitchy',
    'Locality',
    'Karmic',
    'Soulless',
    'Rapture',
]);

const abilityNames = (deck) => {
    const names = new Set();

    deck.forEach((card) => {
        (card.abilities || []).forEach((ability) => {
            const name = typeof ability === 'string' ? ability : ability && ability.name;
            if (name) names.add(name);
        });
    });

    return [...names];
};

const unimplemented = (deck) =>
    abilityNames(deck).filter((name) => !KEYWORDS.has(name) && !abilitiesDefinitions[name]);

describe('ability coverage', () => {
    test('every ability on a live enemy card is implemented', () => {
        expect(unimplemented(enemyOne)).toEqual([]);
    });

    // MultiThreadingEffect is commented out in glossary.js ("Temporarily disabled
    // until hack mechanics are implemented") while Multi Threading is still in the
    // live deck, so the card is dealt but its effect never runs. Asserted as a
    // known gap rather than [] so the list cannot grow unnoticed; delete the entry
    // once the ability is re-enabled.
    test('the only unimplemented player ability is the known Multi Threading gap', () => {
        expect(unimplemented(cardList1)).toEqual(['MultiThreadingEffect']);
    });
});

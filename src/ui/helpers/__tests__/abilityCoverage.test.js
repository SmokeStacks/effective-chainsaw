// An ability only runs if its name resolves in abilitiesDefinitions: activateAbilities
// looks each card ability up by name and silently skips unknown ones. So a card can
// carry an ability that does nothing at all, with no error anywhere.
//
// This reports which ability names in the live decks have no implementation.

import { abilitiesDefinitions } from '../../abilities/glossary';
import { playerMainDeck } from '../../../playerDecks/playerDeck';
import { getEnemyDeck } from '../../../systemDecks/enemyDeck';
import { resolveDeckReferences } from '../../../rules/deckResolver';

// Keyword-style entries are legitimately absent from the glossary -- they are
// read directly by other systems rather than dispatched by activateAbilities:
//   Buffer, Deathless, Armored          -> damage.js
//   Pounce, Stealth                     -> entity properties set on placement (core.js)
//   Glitchy, Locality, Karmic, Soulless, Rapture -> rez-cost keywords
//                                           (activation.js, deckValidation.js)
//   Sting, Ambush, Regen, Bribe         -> parsed into instance stats by
//                                           keywordStacks() (setup.js) and
//                                           applied directly in battle.js /
//                                           core.js / damage.js / glossary.js
//                                           (see combatKeywords.js)
//   Aggro, Aggressive, Defensive, Charge -> same as above: instance stats
//                                           read directly in
//                                           adjustEntityPowerExternal (core.js)
//                                           and the attacker-selection logic
//                                           (selection.js, enemy/attack.js)
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
    'Armored',
    'Sting',
    'Ambush',
    'Regen',
    'Bribe',
    'Aggro',
    'Aggressive',
    'Defensive',
    'Charge',
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
        expect(unimplemented(resolveDeckReferences(getEnemyDeck()))).toEqual([]);
    });

    test('every ability on a live player card is implemented', () => {
        expect(unimplemented(resolveDeckReferences(playerMainDeck))).toEqual([]);
    });
});

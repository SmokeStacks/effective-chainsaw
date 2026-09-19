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

// Having an implementation is not enough: an ability only ever runs if some
// dispatcher recognises its `type`. Each dispatcher matches on type and silently
// ignores anything it does not know, so an ability with an unrouted type is
// inert with no error anywhere.
//
// 'onPlay' used to be exactly that for non-Ritual cards: activateAbilities had
// no branch for it, so a placed Entity/Location/Landmark carrying one did
// nothing at all.
//
// Every type below must name the dispatcher that fires it:
const DISPATCHERS = {
    // activateAbilities (glossary.js), on entering play / being rezzed
    static: 'activateAbilities',
    triggered: 'activateAbilities',
    manual: 'activateAbilities',
    onActivate: 'activateAbilities',
    onPlay: 'activateAbilities',
    // triggerAscendAbilities (advancement.js), when the card Ascends
    onAscend: 'triggerAscendAbilities',
};

// Rituals never reach activateAbilities -- they resolve through
// triggerRitualAbilities (core.js), which handles 'onPlay' and 'conditional'.
const RITUAL_CATEGORIES = new Set(['RITUAL']);

const undispatchable = (deck) => {
    const offenders = [];

    deck.forEach((card) => {
        if (RITUAL_CATEGORIES.has(card.category)) return;

        (card.abilities || []).forEach((ability) => {
            const name = typeof ability === 'string' ? ability : ability && ability.name;
            if (!name || KEYWORDS.has(name)) return;

            let def = abilitiesDefinitions[name];
            if (typeof def === 'function') def = def(ability.amount);
            if (!def || !def.type) return;

            if (!DISPATCHERS[def.type]) {
                offenders.push(`${card.category} ${card.name} -> ${name} (type: ${def.type})`);
            }
        });
    });

    return [...new Set(offenders)];
};

describe('every non-Ritual deck ability has a dispatcher that will fire it', () => {
    test('enemy deck', () => {
        expect(undispatchable(resolveDeckReferences(getEnemyDeck()))).toEqual([]);
    });

    test('player deck', () => {
        expect(undispatchable(resolveDeckReferences(playerMainDeck))).toEqual([]);
    });
});

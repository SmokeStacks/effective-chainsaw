import { cardList1 } from '../../playerDecks/deckTwo';
import enemyOne from '../../systemDecks/enemyOne';
import { reportDeckRunes } from './deckValidation';

export function shuffle(array) {
        let currentIndex = array.length;
        while (currentIndex !== 0) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
    }

export const createLibrary = () => {
    console.log('Creating player library...');
    console.log('Player deck source:', cardList1);
    reportDeckRunes(cardList1, 'Player deck');
    const libraryInstanceArray = [];
    for (let i = 0; i < cardList1.length; i++) {
        const card = cardList1[i];
        const cardEntityInstance = buildCardInstance(`a${i}`, card, 'PLAYER');
        libraryInstanceArray.push(cardEntityInstance);
    }
    console.log('Created player library:', libraryInstanceArray);
    shuffle(libraryInstanceArray);
    return libraryInstanceArray;
};

// Some cards express a keyword stat as a bare field (`solo: 2`) and others as an
// entry in the abilities array (`{ name: 'Solo', amount: 2 }`). Both conventions
// exist across the decks, so resolve either into the numeric instance field.
export function keywordAmount(card, field, abilityName) {
    if (typeof card[field] === 'number') return card[field];
    const ability = (card.abilities || []).find(a => a && a.name === abilityName);
    if (ability) return ability.amount || 1;
    return 0;
}

// Builds a runtime card instance with all per-card counters initialized to
// the right numeric defaults.
//
// Previously, keyword stats like `armored`, `deathless`, `stealth`, etc. were
// initialized to `false`. Damage code treats them as numbers (`armored > 0`,
// `damage - armored`, `deathless > 0`), and a card with `card.armored = 2`
// would still have its instance's `armored` reset to `false`. The draft list
// instance factory in core.js does this correctly; this brings the player
// and enemy library factories in line.
export function buildCardInstance(id, card, owner) {
    return {
        id,
        card,
        power: card.power || 0,
        HP: card.HP || 0,
        wounds: 0,
        exposed: false,
        scored: false,
        readied: false,
        ascended: false,
        online: false,
        tapped: false,
        sacrificed: false,
        // Numeric per-turn counters
        steps: 0,
        freeze: 0,
        decay: 0,
        venom: 0,
        damage: 0,
        shield: 0,
        counters: 0,
        development: card.development || 0,
        // Keyword stats (numeric: a value of N means N stacks)
        charge: card.charge || 0,
        cosmic: card.cosmic || 1,
        deathless: card.deathless || 0,
        pounce: card.pounce || 0,
        override: card.override || 0,
        stealth: card.stealth || 0,
        armored: card.armored || 0,
        solo: keywordAmount(card, 'solo', 'Solo'),
        plot: card.plot || 0,
        // Misc
        tokens: [],
        abilities: card.abilities || [],
        keywords: card.keywords || [],
        faction: card.faction,
        category: card.category,
        owner,
    };
}

export const createEnemyLibrary = () => {
    console.log('Creating enemy library...');
    console.log('Enemy deck source:', enemyOne);
    const libraryInstanceArray = [];
    for (let i = 0; i < enemyOne.length; i++) {
        const card = enemyOne[i];
        const cardEntityInstance = buildCardInstance(`b${i}`, card, 'ENEMY');
        libraryInstanceArray.push(cardEntityInstance);
    }
    console.log('Created enemy library:', libraryInstanceArray);
    shuffle(libraryInstanceArray);
    return libraryInstanceArray;
};

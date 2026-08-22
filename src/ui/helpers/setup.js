import { playerMainDeck } from '../../playerDecks/playerDeck';
import { resolveDeckReferences } from '../../rules/deckResolver';
import { initializeStartingResources, createPlayerStartingHand, createEnemyStartingHand, processBitIncome } from './setupNewRules';
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
    console.log('Creating player library with new rules...');
    
    // Initialize starting resources (4 bits for both sides)
    initializeStartingResources();
    
    // Create starting hand with 4 cards
    const playerStart = createPlayerStartingHand();
    const enemyStart = createEnemyStartingHand();
    
    console.log('Player starting hand:', playerStart.hand.map(card => card.name));
    console.log('Enemy starting hand:', enemyStart.hand.map(card => card.name));
    
    // Convert hand cards to instances
    const playerHandInstances = playerStart.hand.map((card, index) => 
        buildCardInstance(`p${index}`, card, 'PLAYER')
    );
    
    const enemyHandInstances = enemyStart.hand.map((card, index) => 
        buildCardInstance(`e${index}`, card, 'ENEMY')
    );
    
    // Convert remaining deck to instances
    const playerLibraryInstances = playerStart.deck.map((card, index) => 
        buildCardInstance(`p${index + 4}`, card, 'PLAYER')
    );
    
    const enemyLibraryInstances = enemyStart.deck.map((card, index) => 
        buildCardInstance(`e${index + 4}`, card, 'ENEMY')
    );
    
    // Shuffle libraries
    shuffle(playerLibraryInstances);
    shuffle(enemyLibraryInstances);
    
    console.log('Created player hand:', playerHandInstances.length, 'cards');
    console.log('Created player library:', playerLibraryInstances.length, 'cards');
    console.log('Created enemy hand:', enemyHandInstances.length, 'cards');
    console.log('Created enemy library:', enemyLibraryInstances.length, 'cards');
    
    return {
        playerHand: playerHandInstances,
        playerLibrary: playerLibraryInstances,
        enemyHand: enemyHandInstances,
        enemyLibrary: enemyLibraryInstances
    };
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

// A number of combat keywords (Sting, Ambush, Regen, Bribe, Aggro, Aggressive,
// Defensive, Charge) are authored as free-text entries in a card's `keywords`
// string (e.g. "Sting 4, Ambush 2, Aggressive, Locality") rather than as
// structured `abilities` array entries. This parses either representation:
// an `{ name: keywordName, amount }` ability entry takes precedence, falling
// back to a regex scan of the keywords string for "KeywordName" or
// "KeywordName N". Returns 0 if the keyword is not present at all, or
// `defaultAmount` (1) if present with no explicit number.
export function keywordStacks(card, keywordName, defaultAmount = 1) {
    const ability = (card.abilities || []).find(a => a && a.name === keywordName);
    if (ability) return ability.amount || defaultAmount;
    if (!card.keywords || typeof card.keywords !== 'string') return 0;
    const match = card.keywords.match(new RegExp(`\\b${keywordName}\\b\\s*(\\d+)?`, 'i'));
    if (!match) return 0;
    return match[1] ? parseInt(match[1], 10) : defaultAmount;
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
        charge: card.charge || keywordStacks(card, 'Charge'),
        cosmic: card.cosmic || 1,
        deathless: card.deathless || 0,
        pounce: card.pounce || 0,
        override: card.override || 0,
        stealth: card.stealth || 0,
        armored: card.armored || 0,
        solo: keywordAmount(card, 'solo', 'Solo'),
        plot: card.plot || 0,
        // Combat keywords parsed from either an abilities-array entry or the
        // free-text `keywords` string (see keywordStacks above).
        sting: keywordStacks(card, 'Sting'),
        ambush: keywordStacks(card, 'Ambush'),
        regen: keywordStacks(card, 'Regen'),
        bribe: keywordStacks(card, 'Bribe'),
        aggro: keywordStacks(card, 'Aggro'),
        aggressive: keywordStacks(card, 'Aggressive'),
        defensive: keywordStacks(card, 'Defensive') > 0,
        // Misc
        tokens: [],
        abilities: card.abilities || [],
        keywords: card.keywords || [],
        faction: card.faction,
        category: card.category,
        owner,
    };
}


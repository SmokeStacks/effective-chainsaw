// Updated Game Setup with Bootstrap Mechanic and New Deck System
// Integrates player deck, enemy deck, and bootstrap functionality

import { playerMainDeck, getBootstrapCard } from '../../playerDecks/playerDeck';
import { getEnemyDeck, getEnemyAI } from '../../systemDecks/enemyDeck';
import { resolveDeckReferences } from '../../rules/deckResolver';
import { bootstrapMechanic } from '../../rules/bootstrapMechanic';
import enemyOne from '../../systemDecks/enemyOne'; // Fallback enemy deck

export function shuffle(array: any[]) {
    let currentIndex = array.length;
    while (currentIndex !== 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}

// Bootstrap phase setup
export function setupBootstrapPhase() {
    console.log('Starting bootstrap phase...');
    
    // Get player bootstrap card (CatPhish by default)
    const playerBootstrapCard = getBootstrapCard();
    const playerSuccess = bootstrapMechanic.selectPlayerBootstrap(playerBootstrapCard);
    
    if (!playerSuccess) {
        console.error('Failed to set player bootstrap card');
        return null;
    }
    
    // Enemy selects bootstrap card (AI)
    const enemyBootstrapCard = bootstrapMechanic.selectEnemyBootstrap();
    
    if (!enemyBootstrapCard) {
        console.error('Failed to set enemy bootstrap card');
        return null;
    }
    
    // Reveal both cards simultaneously
    const revealedCards = bootstrapMechanic.revealBootstrapCards();
    console.log('Bootstrap phase complete:', revealedCards);
    
    return revealedCards;
}

// Create player library with new deck system
export const createPlayerLibrary = () => {
    console.log('Creating player library...');
    console.log('Player deck source:', playerMainDeck);
    
    // Resolve card references to actual card objects
    const resolvedCards = resolveDeckReferences(playerMainDeck);
    console.log('Resolved cards:', resolvedCards.length);
    
    // Remove bootstrap card from library (it's installed separately)
    const bootstrapCard = getBootstrapCard();
    const libraryCards = resolvedCards.filter(card => {
        const bootstrapRef = bootstrapCard;
        const bootstrapActual = bootstrapMechanic.getBootstrapCards().player;
        if (!bootstrapActual) return true;
        
        const resolvedBootstrap = resolveDeckReferences([bootstrapActual])[0];
        return card.id !== resolvedBootstrap?.id;
    });
    
    console.log('Library cards after removing bootstrap:', libraryCards.length);
    
    const libraryInstanceArray = [];
    for (let i = 0; i < libraryCards.length; i++) {
        const card = libraryCards[i];
        const cardEntityInstance = buildCardInstance(`p${i}`, card, 'PLAYER');
        libraryInstanceArray.push(cardEntityInstance);
    }
    
    console.log('Created player library:', libraryInstanceArray);
    shuffle(libraryInstanceArray);
    return libraryInstanceArray;
};

// Create enemy library with new deck system
export const createEnemyLibrary = () => {
    console.log('Creating enemy library...');
    
    // Use new enemy deck or fallback to enemyOne
    const enemyDeck = getEnemyDeck();
    console.log('Enemy deck source:', enemyDeck);
    
    // Resolve card references to actual card objects
    const resolvedCards = resolveDeckReferences(enemyDeck);
    console.log('Resolved enemy cards:', resolvedCards.length);
    
    // Remove bootstrap card from library
    const enemyBootstrapCard = bootstrapMechanic.getBootstrapCards().enemy;
    let libraryCards = resolvedCards;
    
    if (enemyBootstrapCard) {
        const resolvedBootstrap = resolveDeckReferences([enemyBootstrapCard])[0];
        libraryCards = resolvedCards.filter(card => card.id !== resolvedBootstrap?.id);
        console.log('Library cards after removing enemy bootstrap:', libraryCards.length);
    }
    
    const libraryInstanceArray = [];
    for (let i = 0; i < libraryCards.length; i++) {
        const card = libraryCards[i];
        const cardEntityInstance = buildCardInstance(`e${i}`, card, 'ENEMY');
        libraryInstanceArray.push(cardEntityInstance);
    }
    
    console.log('Created enemy library:', libraryInstanceArray);
    shuffle(libraryInstanceArray);
    return libraryInstanceArray;
};

// Initialize bootstrap cards on game board
export const initializeBootstrapCards = () => {
    console.log('Initializing bootstrap cards...');
    
    const bootstrapCards = bootstrapMechanic.getBootstrapCards();
    const initializedCards = {
        player: null,
        enemy: null
    };
    
    if (bootstrapCards.player) {
        initializedCards.player = bootstrapMechanic.installBootstrapCard(bootstrapCards.player, 'player');
    }
    
    if (bootstrapCards.enemy) {
        initializedCards.enemy = bootstrapMechanic.installBootstrapCard(bootstrapCards.enemy, 'enemy');
    }
    
    console.log('Bootstrap cards initialized:', initializedCards);
    return initializedCards;
};

// Setup enemy AI
export const setupEnemyAI = () => {
    console.log('Setting up enemy AI...');
    const enemyAI = getEnemyAI();
    
    // Select realm (coin flip)
    const selectedRealm = enemyAI.selectRealm();
    console.log(`Enemy selected realm: ${selectedRealm}`);
    
    return {
        ai: enemyAI,
        realm: selectedRealm
    };
};

// Complete game setup with all new systems
export const setupNewGame = () => {
    console.log('Setting up new game with bootstrap mechanic...');
    
    // 1. Bootstrap phase
    const bootstrapResult = setupBootstrapPhase();
    if (!bootstrapResult) {
        throw new Error('Failed to setup bootstrap phase');
    }
    
    // 2. Create libraries
    const playerLibrary = createPlayerLibrary();
    const enemyLibrary = createEnemyLibrary();
    
    // 3. Initialize bootstrap cards
    const bootstrapCards = initializeBootstrapCards();
    
    // 4. Setup enemy AI
    const enemyAI = setupEnemyAI();
    
    // 5. Return complete game state
    return {
        playerLibrary,
        enemyLibrary,
        bootstrapCards,
        enemyAI,
        bootstrapResult
    };
};

// Builds a runtime card instance (unchanged from original)
export function buildCardInstance(id: string, card: any, owner: string) {
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
        solo: card.solo || 0,
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

// Legacy functions for backward compatibility
export const createLibrary = createPlayerLibrary;
export const createEnemyLibraryLegacy = () => {
    // Fallback to original enemyOne if needed
    console.log('Creating enemy library (legacy fallback)...');
    const libraryInstanceArray = [];
    for (let i = 0; i < enemyOne.length; i++) {
        const card = enemyOne[i];
        const cardEntityInstance = buildCardInstance(`e${i}`, card, 'ENEMY');
        libraryInstanceArray.push(cardEntityInstance);
    }
    console.log('Created enemy library (legacy):', libraryInstanceArray);
    shuffle(libraryInstanceArray);
    return libraryInstanceArray;
};

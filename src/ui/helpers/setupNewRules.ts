// Updated Game Setup with New Starting Rules
// Both sides begin with 4 bits and 4 cards
// Player mulligan: choose any number of cards, shuffle, redraw up to 4
// Enemy mulligan: shuffle Syms and LMs only
// Bit income: player 1 bit/turn, NPC 2 bits/turn

import { playerMainDeck, getBootstrapCard } from '../../playerDecks/playerDeck';
import { getEnemyDeck, getEnemyAI } from '../../systemDecks/enemyDeck';
import { resolveDeckReferences } from '../../rules/deckResolver';
import { bootstrapMechanic } from '../../rules/bootstrapMechanic';
import { state } from './state';

export function shuffle(array: any[]) {
    let currentIndex = array.length;
    while (currentIndex !== 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}

// New starting resources
export function initializeStartingResources() {
    console.log('Initializing starting resources...');
    
    // Both sides start with 4 bits - directly modify state
    if (state) {
        state.playerBits = 4;
        state.enemyBits = 4;
        console.log('Starting resources set - Player: 4 bits, Enemy: 4 bits');
    } else {
        console.error('State not available for initializing resources');
    }
}

// Player starting hand with mulligan
export function createPlayerStartingHand() {
    console.log('Creating player starting hand...');
    
    // Resolve deck references
    const resolvedCards = resolveDeckReferences(playerMainDeck);
    
    // Remove bootstrap card from deck
    const bootstrapCard = getBootstrapCard();
    const deckCards = resolvedCards.filter(card => {
        const bootstrapRef = bootstrapMechanic.getBootstrapCards().player;
        if (!bootstrapRef) return true;
        
        const resolvedBootstrap = resolveDeckReferences([bootstrapRef])[0];
        return card.id !== resolvedBootstrap?.id;
    });
    
    // Shuffle deck
    shuffle(deckCards);
    
    // Draw initial 4 cards
    const startingHand = deckCards.slice(0, 4);
    const remainingDeck = deckCards.slice(4);
    
    console.log('Player starting hand:', startingHand.map(card => card.name));
    console.log('Remaining deck size:', remainingDeck.length);
    
    return {
        hand: startingHand,
        deck: remainingDeck
    };
}

// Enemy starting hand with mulligan (Syms and LMs only)
export function createEnemyStartingHand() {
    console.log('Creating enemy starting hand...');
    
    const enemyDeck = getEnemyDeck();
    const resolvedCards = resolveDeckReferences(enemyDeck);
    
    // Remove bootstrap card from deck
    const enemyBootstrapCard = bootstrapMechanic.getBootstrapCards().enemy;
    let deckCards = resolvedCards;
    
    if (enemyBootstrapCard) {
        const resolvedBootstrap = resolveDeckReferences([enemyBootstrapCard])[0];
        deckCards = resolvedCards.filter(card => card.id !== resolvedBootstrap?.id);
    }
    
    // Shuffle deck
    shuffle(deckCards);
    
    // Find Syms and Landmarks (LMs) for mulligan
    const symsAndLMs = deckCards.filter(card => 
        card.category === 'SYM' || card.category === 'LANDMARK'
    );
    
    const otherCards = deckCards.filter(card => 
        card.category !== 'SYM' && card.category !== 'LANDMARK'
    );
    
    // Shuffle Syms and LMs
    shuffle(symsAndLMs);
    
    // Take up to 4 cards from Syms/LMs first, then from other cards
    let startingHand: any[] = [];
    let remainingDeck: any[] = [];
    
    // Add up to 4 Syms/LMs
    const symsToTake = Math.min(4, symsAndLMs.length);
    startingHand = startingHand.concat(symsAndLMs.slice(0, symsToTake));
    
    // Fill remaining slots with other cards if needed
    if (startingHand.length < 4) {
        const needed = 4 - startingHand.length;
        const otherToTake = Math.min(needed, otherCards.length);
        startingHand = startingHand.concat(otherCards.slice(0, otherToTake));
    }
    
    // Create remaining deck (all cards not in hand)
    const handIds = new Set(startingHand.map(card => card.id));
    remainingDeck = deckCards.filter(card => !handIds.has(card.id));
    
    console.log('Enemy starting hand:', startingHand.map(card => card.name));
    console.log('Remaining deck size:', remainingDeck.length);
    
    return {
        hand: startingHand,
        deck: remainingDeck
    };
}

// Player mulligan - choose any number of cards to shuffle back
export function playerMulligan(hand: any[], deck: any[], cardsToMulligan: number[]) {
    console.log('Player mulligan - shuffling back', cardsToMulligan.length, 'cards');
    
    // Get cards to mulligan
    const cardsToShuffle = cardsToMulligan.map(index => hand[index]);
    const remainingHand = hand.filter((_, index) => !cardsToMulligan.includes(index));
    
    // Add mulliganed cards back to deck
    const newDeck = [...deck, ...cardsToShuffle];
    shuffle(newDeck);
    
    // Draw cards to reach 4
    const cardsToDraw = 4 - remainingHand.length;
    const newCards = newDeck.slice(0, cardsToDraw);
    const finalDeck = newDeck.slice(cardsToDraw);
    
    const finalHand = [...remainingHand, ...newCards];
    
    console.log('Player final hand:', finalHand.map(card => card.name));
    
    return {
        hand: finalHand,
        deck: finalDeck
    };
}

// Enemy mulligan - shuffle all Syms and LMs
export function enemyMulligan(hand: any[], deck: any[]) {
    console.log('Enemy mulligan - shuffling Syms and LMs');
    
    // Separate Syms/LMs from other cards
    const symsAndLMs = hand.filter(card => 
        card.category === 'SYM' || card.category === 'LANDMARK'
    );
    const otherCards = hand.filter(card => 
        card.category !== 'SYM' && card.category !== 'LANDMARK'
    );
    
    // Add Syms/LMs back to deck and shuffle
    const newDeck = [...deck, ...symsAndLMs];
    shuffle(newDeck);
    
    // Draw cards to reach 4
    const cardsToDraw = 4 - otherCards.length;
    const newCards = newDeck.slice(0, cardsToDraw);
    const finalDeck = newDeck.slice(cardsToDraw);
    
    const finalHand = [...otherCards, ...newCards];
    
    console.log('Enemy final hand:', finalHand.map(card => card.name));
    
    return {
        hand: finalHand,
        deck: finalDeck
    };
}

// Bit income system
export function processBitIncome() {
    console.log('Processing bit income...');
    
    if (state) {
        // Player gets 1 bit per turn
        const currentPlayerBits = state.playerBits || 0;
        state.playerBits = currentPlayerBits + 1;
        
        // Enemy gets 2 bits per turn
        const currentEnemyBits = state.enemyBits || 0;
        state.enemyBits = currentEnemyBits + 2;
        
        console.log(`Bit income - Player: +1 (total: ${state.playerBits}), Enemy: +2 (total: ${state.enemyBits})`);
    } else {
        console.error('State not available for processing bit income');
    }
}

// Complete new game setup
export const setupNewGameWithRules = () => {
    console.log('Setting up new game with updated rules...');
    
    // 1. Initialize starting resources
    initializeStartingResources();
    
    // 2. Bootstrap phase
    const bootstrapResult = bootstrapMechanic.revealBootstrapCards();
    if (!bootstrapResult.player || !bootstrapResult.enemy) {
        throw new Error('Bootstrap phase incomplete');
    }
    
    // 3. Create starting hands
    const playerStart = createPlayerStartingHand();
    const enemyStart = createEnemyStartingHand();
    
    // 4. Initialize bootstrap cards
    const bootstrapCards = {
        player: bootstrapMechanic.installBootstrapCard(bootstrapResult.player, 'player'),
        enemy: bootstrapMechanic.installBootstrapCard(bootstrapResult.enemy, 'enemy')
    };
    
    // 5. Setup enemy AI
    const enemyAI = setupEnemyAI();
    
    return {
        playerHand: playerStart.hand,
        playerDeck: playerStart.deck,
        enemyHand: enemyStart.hand,
        enemyDeck: enemyStart.deck,
        bootstrapCards,
        enemyAI,
        bootstrapResult
    };
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

// Builds a runtime card instance
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

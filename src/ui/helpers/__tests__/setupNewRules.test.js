// Unit tests for new starting rules functionality

// Mock the state import before importing the functions
jest.mock('../state', () => ({
    state: {
        playerBits: 0,
        enemyBits: 0,
        playerHand: [],
        enemyHand: []
    }
}));

import { 
    initializeStartingResources, 
    createPlayerStartingHand, 
    createEnemyStartingHand, 
    playerMulligan, 
    enemyMulligan, 
    processBitIncome 
} from '../setupNewRules';

import { state } from '../state';

describe('Setup New Rules Tests', () => {
    beforeEach(() => {
        // Reset state before each test
        state.playerBits = 0;
        state.enemyBits = 0;
        state.playerHand = [];
        state.enemyHand = [];
    });

    test('initializeStartingResources should set both players to 4 bits', () => {
        initializeStartingResources();
        
        expect(state.playerBits).toBe(4);
        expect(state.enemyBits).toBe(4);
    });

    test('processBitIncome should give player 1 bit and enemy 2 bits', () => {
        // Set initial bits
        state.playerBits = 5;
        state.enemyBits = 3;
        
        processBitIncome();
        
        expect(state.playerBits).toBe(6); // 5 + 1
        expect(state.enemyBits).toBe(5); // 3 + 2
    });

    test('processBitIncome should handle zero initial bits', () => {
        processBitIncome();
        
        expect(state.playerBits).toBe(1);
        expect(state.enemyBits).toBe(2);
    });

    test('createPlayerStartingHand should return 4 cards in hand', () => {
        const result = createPlayerStartingHand();
        
        expect(result.hand).toHaveLength(4);
        expect(result.deck).toBeDefined();
        expect(result.hand.length + result.deck.length).toBeGreaterThan(4);
    });

    test('createEnemyStartingHand should return 4 cards in hand', () => {
        const result = createEnemyStartingHand();
        
        expect(result.hand).toHaveLength(4);
        expect(result.deck).toBeDefined();
        expect(result.hand.length + result.deck.length).toBeGreaterThan(4);
    });

    test('playerMulligan should shuffle selected cards and redraw to 4', () => {
        // Create mock hand and deck
        const mockHand = ['card1', 'card2', 'card3', 'card4'];
        const mockDeck = ['deck1', 'deck2', 'deck3'];
        
        const result = playerMulligan(mockHand, mockDeck, [0, 2]); // Mulligan cards 0 and 2
        
        expect(result.hand).toHaveLength(4);
        expect(result.deck).toBeDefined();
        // Should contain the non-mulliganed cards
        expect(result.hand).toContain('card2');
        expect(result.hand).toContain('card4');
        // The combined pool (original deck + mulliganed cards) should be 5 cards total
        // After drawing 2 cards, 3 should remain in deck
        expect(result.deck).toHaveLength(3);
        // All cards from original deck and mulliganed cards should be accounted for
        const allCards = [...mockDeck, 'card1', 'card3'];
        const distributedCards = [...result.hand, ...result.deck];
        allCards.forEach(card => {
            expect(distributedCards).toContain(card);
        });
    });

    test('enemyMulligan should shuffle Syms and LMs', () => {
        // Create mock hand with Syms, LMs, and other cards
        const mockHand = [
            { name: 'SYM Card', category: 'SYM' },
            { name: 'LM Card', category: 'LANDMARK' },
            { name: 'Entity Card', category: 'ENTITY' },
            { name: 'Ritual Card', category: 'RITUAL' }
        ];
        const mockDeck = ['deck1', 'deck2'];
        
        const result = enemyMulligan(mockHand, mockDeck);
        
        expect(result.hand).toHaveLength(4);
        expect(result.deck).toBeDefined();
        // Entity and Ritual cards should remain in hand
        const entityCard = result.hand.find(card => card.name === 'Entity Card');
        const ritualCard = result.hand.find(card => card.name === 'Ritual Card');
        expect(entityCard).toBeDefined();
        expect(ritualCard).toBeDefined();
    });

    test('playerMulligan with no cards selected should return same hand', () => {
        const mockHand = ['card1', 'card2', 'card3', 'card4'];
        const mockDeck = ['deck1', 'deck2'];
        
        const result = playerMulligan(mockHand, mockDeck, []);
        
        // Hand should remain the same
        expect(result.hand).toEqual(mockHand);
        // Deck should contain the same cards but may be shuffled
        expect(result.deck).toHaveLength(mockDeck.length);
        expect(result.deck).toContain('deck1');
        expect(result.deck).toContain('deck2');
    });

    test('enemyMulligan with no Syms/LMs should draw cards to reach 4', () => {
        const mockHand = [
            { name: 'Entity Card', category: 'ENTITY' },
            { name: 'Ritual Card', category: 'RITUAL' }
        ];
        const mockDeck = ['deck1', 'deck2'];
        
        const result = enemyMulligan(mockHand, mockDeck);
        
        // Should draw 2 cards to reach 4 total
        expect(result.hand).toHaveLength(4);
        // Should contain the original cards
        expect(result.hand).toContainEqual({ name: 'Entity Card', category: 'ENTITY' });
        expect(result.hand).toContainEqual({ name: 'Ritual Card', category: 'RITUAL' });
        // Should contain 2 cards from deck
        expect(result.hand).toContain('deck1');
        expect(result.hand).toContain('deck2');
        // Deck should be empty after drawing
        expect(result.deck).toHaveLength(0);
    });
});

describe('Error Handling Tests', () => {
    test('should handle null state gracefully', () => {
        // Temporarily set state to null
        const originalPlayerBits = state.playerBits;
        const originalEnemyBits = state.enemyBits;
        
        state.playerBits = null;
        state.enemyBits = null;
        
        expect(() => {
            initializeStartingResources();
        }).not.toThrow();
        
        expect(() => {
            processBitIncome();
        }).not.toThrow();
        
        // Restore state
        state.playerBits = originalPlayerBits;
        state.enemyBits = originalEnemyBits;
    });
});

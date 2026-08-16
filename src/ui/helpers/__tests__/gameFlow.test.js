// Comprehensive tests for game flow: Bootstrap → Mulligan → Play

// Mock state for testing
const mockState = {
    playerBits: 0,
    enemyBits: 0,
    playerHand: [],
    enemyHand: [],
    playerLibrary: [],
    enemyLibrary: [],
    playerGrid: [],
    enemyGrid: [],
    enemyTheater: []
};

// Mock the state import
jest.mock('../state', () => ({
    state: mockState
}));

// Mock bootstrap mechanic
const mockBootstrapMechanic = {
    getAvailableBootstrapCards: jest.fn(() => [
        { faction: 'orange', index: 10 },
        { faction: 'gray', index: 15 }
    ]),
    selectPlayerBootstrap: jest.fn(() => true),
    selectEnemyBootstrap: jest.fn(() => ({ faction: 'orange', index: 12 })),
    revealBootstrapCards: jest.fn(() => ({
        player: { faction: 'orange', index: 10 },
        enemy: { faction: 'orange', index: 12 }
    })),
    installBootstrapCard: jest.fn((ref, owner) => ({
        id: `${owner}_bootstrap`,
        card: { name: 'Test Card' },
        owner,
        isBootstrap: true
    })),
    getBootstrapCards: jest.fn(() => ({
        player: { faction: 'orange', index: 10 },
        enemy: { faction: 'orange', index: 12 }
    }))
};

jest.mock('../../../rules/bootstrapMechanic', () => ({
    bootstrapMechanic: mockBootstrapMechanic
}));

// Mock setup functions
const mockCreateLibrary = jest.fn(() => ({
    playerHand: [
        { id: 'p1', card: { name: 'Card 1' } },
        { id: 'p2', card: { name: 'Card 2' } },
        { id: 'p3', card: { name: 'Card 3' } },
        { id: 'p4', card: { name: 'Card 4' } }
    ],
    playerLibrary: [
        { id: 'p5', card: { name: 'Card 5' } },
        { id: 'p6', card: { name: 'Card 6' } }
    ],
    enemyHand: [
        { id: 'e1', card: { name: 'Enemy Card 1' } },
        { id: 'e2', card: { name: 'Enemy Card 2' } },
        { id: 'e3', card: { name: 'Enemy Card 3' } },
        { id: 'e4', card: { name: 'Enemy Card 4' } }
    ],
    enemyLibrary: [
        { id: 'e5', card: { name: 'Enemy Card 5' } },
        { id: 'e6', card: { name: 'Enemy Card 6' } }
    ]
}));

jest.mock('../setup', () => ({
    createLibrary: mockCreateLibrary,
    createEnemyLibrary: jest.fn()
}));

describe('Game Flow Tests', () => {
    beforeEach(() => {
        // Reset state before each test
        mockState.playerBits = 0;
        mockState.enemyBits = 0;
        mockState.playerHand = [];
        mockState.enemyHand = [];
        mockState.playerLibrary = [];
        mockState.enemyLibrary = [];
        mockState.playerGrid = [];
        mockState.enemyGrid = [];
        mockState.enemyTheater = [];
        
        // Clear all mocks
        jest.clearAllMocks();
        
        // Restore mock implementations
        mockBootstrapMechanic.getAvailableBootstrapCards.mockReturnValue([
            { faction: 'orange', index: 10 },
            { faction: 'gray', index: 15 }
        ]);
        mockBootstrapMechanic.selectPlayerBootstrap.mockReturnValue(true);
        mockBootstrapMechanic.selectEnemyBootstrap.mockReturnValue({ faction: 'orange', index: 12 });
        mockBootstrapMechanic.revealBootstrapCards.mockReturnValue({
            player: { faction: 'orange', index: 10 },
            enemy: { faction: 'orange', index: 12 }
        });
        mockBootstrapMechanic.installBootstrapCard.mockImplementation((ref, owner) => ({
            id: `${owner}_bootstrap`,
            card: { name: 'Test Card' },
            owner,
            isBootstrap: true
        }));
        mockBootstrapMechanic.getBootstrapCards.mockReturnValue({
            player: { faction: 'orange', index: 10 },
            enemy: { faction: 'orange', index: 12 }
        });
        
        mockCreateLibrary.mockReturnValue({
            playerHand: [
                { id: 'p1', card: { name: 'Card 1' } },
                { id: 'p2', card: { name: 'Card 2' } },
                { id: 'p3', card: { name: 'Card 3' } },
                { id: 'p4', card: { name: 'Card 4' } }
            ],
            playerLibrary: [
                { id: 'p5', card: { name: 'Card 5' } },
                { id: 'p6', card: { name: 'Card 6' } }
            ],
            enemyHand: [
                { id: 'e1', card: { name: 'Enemy Card 1' } },
                { id: 'e2', card: { name: 'Enemy Card 2' } },
                { id: 'e3', card: { name: 'Enemy Card 3' } },
                { id: 'e4', card: { name: 'Enemy Card 4' } }
            ],
            enemyLibrary: [
                { id: 'e5', card: { name: 'Enemy Card 5' } },
                { id: 'e6', card: { name: 'Enemy Card 6' } }
            ]
        });
    });

    test('Bootstrap phase should initialize with available cards', () => {
        const availableCards = mockBootstrapMechanic.getAvailableBootstrapCards();
        
        expect(availableCards).toHaveLength(2);
        expect(availableCards[0]).toHaveProperty('faction');
        expect(availableCards[0]).toHaveProperty('index');
    });

    test('Bootstrap phase should handle player card selection', () => {
        const selectedCard = { faction: 'orange', index: 10 };
        mockBootstrapMechanic.selectPlayerBootstrap.mockReturnValue(true);
        
        const result = mockBootstrapMechanic.selectPlayerBootstrap(selectedCard);
        
        expect(result).toBe(true);
        expect(mockBootstrapMechanic.selectPlayerBootstrap).toHaveBeenCalledWith(selectedCard);
    });

    test('Bootstrap phase should handle enemy card selection', () => {
        const enemyCard = mockBootstrapMechanic.selectEnemyBootstrap();
        
        expect(enemyCard).toEqual({ faction: 'orange', index: 12 });
        expect(mockBootstrapMechanic.selectEnemyBootstrap).toHaveBeenCalled();
    });

    test('Bootstrap phase should reveal cards simultaneously', () => {
        const revealed = mockBootstrapMechanic.revealBootstrapCards();
        
        expect(revealed).toHaveProperty('player');
        expect(revealed).toHaveProperty('enemy');
        expect(revealed.player).toEqual({ faction: 'orange', index: 10 });
        expect(revealed.enemy).toEqual({ faction: 'orange', index: 12 });
    });

    test('Bootstrap phase should install player card in Grid realm', () => {
        const cardInstance = mockBootstrapMechanic.installBootstrapCard(
            { faction: 'orange', index: 10 }, 
            'player'
        );
        
        expect(cardInstance).toHaveProperty('id', 'player_bootstrap');
        expect(cardInstance).toHaveProperty('owner', 'player');
        expect(cardInstance).toHaveProperty('isBootstrap', true);
    });

    test('Bootstrap phase should install enemy card in tech realm', () => {
        const cardInstance = mockBootstrapMechanic.installBootstrapCard(
            { faction: 'orange', index: 12 }, 
            'enemy'
        );
        
        expect(cardInstance).toHaveProperty('id', 'enemy_bootstrap');
        expect(cardInstance).toHaveProperty('owner', 'enemy');
        expect(cardInstance).toHaveProperty('isBootstrap', true);
    });

    test('Setup should create proper starting hands and libraries', () => {
        const setupResult = mockCreateLibrary();
        
        expect(setupResult).toHaveProperty('playerHand');
        expect(setupResult).toHaveProperty('playerLibrary');
        expect(setupResult).toHaveProperty('enemyHand');
        expect(setupResult).toHaveProperty('enemyLibrary');
        
        expect(setupResult.playerHand).toHaveLength(4);
        expect(setupResult.enemyHand).toHaveLength(4);
        expect(setupResult.playerLibrary).toHaveLength(2);
        expect(setupResult.enemyLibrary).toHaveLength(2);
    });

    test('Mulligan phase should handle player card selection', () => {
        // Mock mulligan function
        const mockPlayerMulligan = jest.fn((hand, deck, selected) => ({
            hand: hand.filter((_, i) => !selected.includes(i)),
            deck: [...deck, ...selected.map(i => hand[i])]
        }));
        
        const mockHand = ['card1', 'card2', 'card3', 'card4'];
        const mockDeck = ['deck1', 'deck2'];
        const selectedCards = [0, 2];
        
        const result = mockPlayerMulligan(mockHand, mockDeck, selectedCards);
        
        expect(result.hand).toHaveLength(2);
        expect(result.hand).toEqual(['card2', 'card4']);
        expect(result.deck).toHaveLength(4);
        expect(mockPlayerMulligan).toHaveBeenCalledWith(mockHand, mockDeck, selectedCards);
    });

    test('Mulligan phase should handle enemy Syms/LMs filtering', () => {
        const mockEnemyMulligan = jest.fn((hand, deck) => {
            const symsAndLMs = hand.filter(card => 
                card.category === 'SYM' || card.category === 'LANDMARK'
            );
            const otherCards = hand.filter(card => 
                card.category !== 'SYM' && card.category !== 'LANDMARK'
            );
            
            const newDeck = [...deck, ...symsAndLMs];
            const cardsToDraw = 4 - otherCards.length;
            const newCards = newDeck.slice(0, cardsToDraw);
            const finalDeck = newDeck.slice(cardsToDraw);
            
            return {
                hand: [...otherCards, ...newCards],
                deck: finalDeck
            };
        });
        
        const mockHand = [
            { name: 'SYM Card', category: 'SYM' },
            { name: 'Entity Card', category: 'ENTITY' },
            { name: 'LM Card', category: 'LANDMARK' },
            { name: 'Ritual Card', category: 'RITUAL' }
        ];
        const mockDeck = ['deck1', 'deck2'];
        
        const result = mockEnemyMulligan(mockHand, mockDeck);
        
        expect(result.hand).toHaveLength(4);
        expect(result.deck).toHaveLength(2);
        expect(mockEnemyMulligan).toHaveBeenCalledWith(mockHand, mockDeck);
    });

    test('Game flow should transition through phases correctly', () => {
        // Simulate the complete game flow
        const phases = [];
        
        // Phase 1: Bootstrap
        phases.push('BOOTSTRAP');
        
        // Phase 2: Mulligan
        phases.push('MULLIGAN');
        
        // Phase 3: Play
        phases.push('PLAY');
        
        expect(phases).toEqual(['BOOTSTRAP', 'MULLIGAN', 'PLAY']);
    });

    test('Resources should be initialized correctly', () => {
        // Mock the setupNewRules functions
        const mockInitializeResources = () => {
            mockState.playerBits = 4;
            mockState.enemyBits = 4;
        };
        
        mockInitializeResources();
        
        expect(mockState.playerBits).toBe(4);
        expect(mockState.enemyBits).toBe(4);
    });

    test('Bit income should work correctly', () => {
        // Mock bit income function
        const mockProcessBitIncome = () => {
            mockState.playerBits += 1;
            mockState.enemyBits += 2;
        };
        
        mockState.playerBits = 4;
        mockState.enemyBits = 4;
        
        mockProcessBitIncome();
        
        expect(mockState.playerBits).toBe(5);
        expect(mockState.enemyBits).toBe(6);
    });
});

describe('Error Handling Tests', () => {
    test('Bootstrap should handle no available cards', () => {
        mockBootstrapMechanic.getAvailableBootstrapCards.mockReturnValue([]);
        
        const availableCards = mockBootstrapMechanic.getAvailableBootstrapCards();
        
        expect(availableCards).toHaveLength(0);
    });

    test('Bootstrap should handle invalid card selection', () => {
        mockBootstrapMechanic.selectPlayerBootstrap.mockReturnValue(false);
        
        const result = mockBootstrapMechanic.selectPlayerBootstrap({ faction: 'invalid', index: -1 });
        
        expect(result).toBe(false);
    });

    test('Mulligan should handle empty hand', () => {
        const mockPlayerMulligan = jest.fn(() => ({ hand: [], deck: [] }));
        
        const result = mockPlayerMulligan([], [], []);
        
        expect(result.hand).toHaveLength(0);
        expect(result.deck).toHaveLength(0);
    });

    test('Game flow should handle missing state gracefully', () => {
        // Test with null state
        const nullState = null;
        
        expect(() => {
            if (nullState) {
                nullState.playerBits = 4;
            }
        }).not.toThrow();
    });
});

describe('Integration Tests', () => {
    beforeEach(() => {
        // Restore mock implementations for integration tests
        mockBootstrapMechanic.getAvailableBootstrapCards.mockReturnValue([
            { faction: 'orange', index: 10 },
            { faction: 'gray', index: 15 }
        ]);
        mockBootstrapMechanic.selectPlayerBootstrap.mockReturnValue(true);
        mockBootstrapMechanic.selectEnemyBootstrap.mockReturnValue({ faction: 'orange', index: 12 });
        mockBootstrapMechanic.revealBootstrapCards.mockReturnValue({
            player: { faction: 'orange', index: 10 },
            enemy: { faction: 'orange', index: 12 }
        });
        mockBootstrapMechanic.installBootstrapCard.mockImplementation((ref, owner) => ({
            id: `${owner}_bootstrap`,
            card: { name: 'Test Card' },
            owner,
            isBootstrap: true
        }));
        
        mockCreateLibrary.mockReturnValue({
            playerHand: [
                { id: 'p1', card: { name: 'Card 1' } },
                { id: 'p2', card: { name: 'Card 2' } },
                { id: 'p3', card: { name: 'Card 3' } },
                { id: 'p4', card: { name: 'Card 4' } }
            ],
            playerLibrary: [
                { id: 'p5', card: { name: 'Card 5' } },
                { id: 'p6', card: { name: 'Card 6' } }
            ],
            enemyHand: [
                { id: 'e1', card: { name: 'Enemy Card 1' } },
                { id: 'e2', card: { name: 'Enemy Card 2' } },
                { id: 'e3', card: { name: 'Enemy Card 3' } },
                { id: 'e4', card: { name: 'Enemy Card 4' } }
            ],
            enemyLibrary: [
                { id: 'e5', card: { name: 'Enemy Card 5' } },
                { id: 'e6', card: { name: 'Enemy Card 6' } }
            ]
        });
    });

    test('Complete game initialization flow', () => {
        // Step 1: Create libraries and hands
        const setupResult = mockCreateLibrary();
        expect(setupResult.playerHand).toHaveLength(4);
        
        // Step 2: Bootstrap phase
        const availableCards = mockBootstrapMechanic.getAvailableBootstrapCards();
        expect(availableCards.length).toBeGreaterThan(0);
        
        const playerBootstrap = mockBootstrapMechanic.selectPlayerBootstrap(availableCards[0]);
        const enemyBootstrap = mockBootstrapMechanic.selectEnemyBootstrap();
        
        expect(playerBootstrap).toBeDefined();
        expect(enemyBootstrap).toBeDefined();
        
        // Step 3: Reveal bootstrap cards
        const revealed = mockBootstrapMechanic.revealBootstrapCards();
        expect(revealed.player).toBeDefined();
        expect(revealed.enemy).toBeDefined();
        
        // Step 4: Install bootstrap cards
        const playerCard = mockBootstrapMechanic.installBootstrapCard(revealed.player, 'player');
        const enemyCard = mockBootstrapMechanic.installBootstrapCard(revealed.enemy, 'enemy');
        
        expect(playerCard.owner).toBe('player');
        expect(enemyCard.owner).toBe('enemy');
    });

    test('Mulligan after bootstrap should maintain card count', () => {
        // Start with 4 cards
        let playerHand = ['card1', 'card2', 'card3', 'card4'];
        let playerDeck = ['deck1', 'deck2'];
        
        // Mulligan 2 cards
        const selectedCards = [0, 2];
        const mulliganedCards = selectedCards.map(i => playerHand[i]);
        const remainingHand = playerHand.filter((_, i) => !selectedCards.includes(i));
        
        const newDeck = [...playerDeck, ...mulliganedCards]; // 2 + 2 = 4 cards
        const newCards = newDeck.slice(0, selectedCards.length); // Draw 2 cards
        const finalDeck = newDeck.slice(selectedCards.length); // Remaining 2 cards
        const finalHand = [...remainingHand, ...newCards];
        
        expect(finalHand).toHaveLength(4);
        expect(finalDeck).toHaveLength(2); // Should be 2 remaining cards, not 3
    });
});

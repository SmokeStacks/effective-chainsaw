// Initial state object
const state = {
    playerBits: 0,
    playerAshes: 0,
    playerBurden: 0,
    playerFate: 0,
    playerWounds: 0,
    playerOverload: 0,
    playerLag: 0,
    playerActions: 3,
    playerSurge: 0,
    playerDriftCount: 0,
    playerGlitchyAmount: 0,

    enemyBits: 0,
    enemyAshes: 0,
    enemyBurden: 0,
    enemyFate: 0,
    enemyWounds: 0,
    enemyOverload: 0,
    enemyLag: 0,
    enemyActions: 3,
    enemySurge: 0,
    enemyDriftCount: 0,
    enemyGlitchyAmount: 0,
    enemyDividendAmount: 2,

    // Realms
    playerSolarium: { people: [], places: [], things: [] },
    playerTheater: { people: [], places: [], things: [] },
    playerUnderpass: { people: [], places: [], things: [] },
    playerGrid: { people: [], places: [], things: [] },
    
    enemySolarium: { people: [], places: [], things: [] },
    enemyTheater: { people: [], places: [], things: [] },
    enemyUnderpass: { people: [], places: [], things: [] },
    enemyGrid: { people: [], places: [], things: [] },

    // Battle state
    battleRealm: null,
    playerBattleSlots: Array(6).fill(null),
    enemyBattleSlots: Array(6).fill(null),

    // Selection state
    selectedCard: null,
    selectedInHand: false,
    targetType: 'none',
    playerTargetSelection: null,
    enemyTargetSelection: null,
    pendingRitual: null,
    targetSelection: { enabled: false },

    // Game flow
    currentPlayer: 'PLAYER',
    priorityLeft: true,
    
    // Other state
    playerFirstAttack: true,
    awaitingImpostor: false,
    awaitingSacrifices: false,
    rezCard: null,
    draftSelected: false,
    selectedRealm: null,
    soulSelections: [],
    focus: null,
    awaitingFocus: false
};



// Game State
export const gameState = {
    playerBits: 0,
    playerAshes: 0,
    playerBurden: 0,
    playerFate: 0,
    playerWounds: 0,
    playerOverload: 0,
    playerLag: 0,
    playerActions: 3,
    playerSurge: 0,
    playerDriftCount: 0,
    playerGlitchyAmount: 0,

    enemyBits: 0,
    enemyAshes: 0,
    enemyBurden: 0,
    enemyFate: 0,
    enemyWounds: 0,
    enemyOverload: 0,
    enemyLag: 0,
    enemyActions: 3,
    enemySurge: 0,
    enemyDriftCount: 0,
    enemyGlitchyAmount: 0,
    enemyDividendAmount: 2,

    // Realms
    playerSolarium: { people: [], places: [], things: [] },
    playerTheater: { people: [], places: [], things: [] },
    playerUnderpass: { people: [], places: [], things: [] },
    playerGrid: { people: [], places: [], things: [] },
    
    enemySolarium: { people: [], places: [], things: [] },
    enemyTheater: { people: [], places: [], things: [] },
    enemyUnderpass: { people: [], places: [], things: [] },
    enemyGrid: { people: [], places: [], things: [] },

    // Battle state
    battleRealm: null,
    playerBattleSlots: Array(6).fill(null),
    enemyBattleSlots: Array(6).fill(null),

    // Selection state
    selectedCard: null,
    selectedInHand: false,
    targetType: 'none',
    playerTargetSelection: null,
    enemyTargetSelection: null,
    pendingRitual: null,
    targetSelection: { enabled: false },

    // Game flow
    currentPlayer: 'PLAYER',
    priorityLeft: true,
    
    // Other state
    playerFirstAttack: true,
    awaitingImpostor: false,
    awaitingSacrifices: false,
    rezCard: null,
    draftSelected: false,
    selectedRealm: null,
};

// State setters
const stateSetters = {
    setSelectedCard: null,
    setPlayerBits: null,
    setPlayerAshes: null,
    setPlayerBurden: null,
    setPlayerFate: null,
    setPlayerWounds: null,
    setPlayerOverload: null,
    setPlayerLag: null,
    setPlayerActions: null,
    setPlayerSurge: null,
    setPlayerDriftCount: null,
    setPlayerGlitchyAmount: null,

    setEnemyBits: null,
    setEnemyAshes: null,
    setEnemyBurden: null,
    setEnemyFate: null,
    setEnemyWounds: null,
    setEnemyOverload: null,
    setEnemyLag: null,
    setEnemyActions: null,
    setEnemySurge: null,
    setEnemyDriftCount: null,
    setEnemyGlitchyAmount: null,
    setEnemyDividendAmount: null,

    // Realm setters
    setPlayerSolarium: null,
    setPlayerTheater: null,
    setPlayerUnderpass: null,
    setPlayerGrid: null,
    
    setEnemySolarium: null,
    setEnemyTheater: null,
    setEnemyUnderpass: null,
    setEnemyGrid: null,

    // Battle setters
    setBattleRealm: null,
    setPlayerBattleSlots: null,
    setEnemyBattleSlots: null,

    // Selection setters
    setSelectedInHand: null,
    setTargetType: null,
    setPlayerTargetSelection: null,
    setEnemyTargetSelection: null,
    setPendingRitual: null,
    setTargetSelection: null,

    // Game flow setters
    setCurrentPlayer: null,
    setPriorityLeft: null,

    // Other setters
    setPlayerFirstAttack: null,
    setAwaitingImpostor: null,
    setAwaitingSacrifices: null,
    setRezCard: null,
    setDraftSelected: null,
    setSelectedRealm: null,
};

// Initialize setters with React setState functions
export function initializeSetters(setterFunctions) {
    Object.assign(stateSetters, setterFunctions);
}

// Initialize game state with new values
export function initializeGameState(newState) {
    Object.assign(state, newState);
}



// Get realm and setter function
export function getRealmAndSetter(realmName, side) {
    switch (side) {
        case 'PLAYER':
            switch (realmName) {
                case 'Solarium':
                    return [playerSolarium, setPlayerSolarium];
                case 'Theater':
                    return [playerTheater, setPlayerTheater];
                case 'Underpass':
                    return [playerUnderpass, setPlayerUnderpass];
                case 'Grid':
                    return [playerGrid, setPlayerGrid];
                default:
                    console.error(`Invalid realm name: ${realmName}`);
                    return [null, null];
            }
        case 'ENEMY':
            switch (realmName) {
                case 'Solarium':
                    return [enemySolarium, setEnemySolarium];
                case 'Theater':
                    return [enemyTheater, setEnemyTheater];
                case 'Underpass':
                    return [enemyUnderpass, setEnemyUnderpass];
                case 'Grid':
                    return [enemyGrid, setEnemyGrid];
                default:
                    console.error(`Invalid realm name: ${realmName}`);
                    return [null, null];
            }
        default:
            console.error(`Invalid side: ${side}`);
            return [null, null];
    }
}

// Export state variables
export const {
    playerBits,
    playerAshes,
    playerBurden,
    playerFate,
    playerWounds,
    playerOverload,
    playerLag,
    playerActions,
    playerSurge,
    playerDriftCount,
    playerGlitchyAmount,
    enemyBits,
    enemyAshes,
    enemyBurden,
    enemyFate,
    enemyWounds,
    enemyOverload,
    enemyLag,
    enemyActions,
    enemySurge,
    enemyDriftCount,
    enemyGlitchyAmount,
    enemyDividendAmount,
    playerSolarium,
    playerTheater,
    playerUnderpass,
    playerGrid,
    enemySolarium,
    enemyTheater,
    enemyUnderpass,
    enemyGrid,
    battleRealm,
    playerBattleSlots,
    enemyBattleSlots,
    selectedCard,
    selectedInHand,
    targetType,
    playerTargetSelection,
    enemyTargetSelection,
    pendingRitual,
    targetSelection,
    currentPlayer,
    priorityLeft,
    playerFirstAttack,
    awaitingImpostor,
    awaitingSacrifices,
    rezCard,
    draftSelected,
    selectedRealm,
    soulSelections,
    focus
} = state;

// Export setters
export const {
    setPlayerBits,
    setPlayerAshes,
    setPlayerBurden,
    setPlayerFate,
    setPlayerWounds,
    setPlayerOverload,
    setPlayerLag,
    setPlayerActions,
    setPlayerSurge,
    setPlayerDriftCount,
    setPlayerGlitchyAmount,
    setEnemyBits,
    setEnemyAshes,
    setEnemyBurden,
    setEnemyFate,
    setEnemyWounds,
    setEnemyOverload,
    setEnemyLag,
    setEnemyActions,
    setEnemySurge,
    setEnemyDriftCount,
    setEnemyGlitchyAmount,
    setEnemyDividendAmount,
    setPlayerSolarium,
    setPlayerTheater,
    setPlayerUnderpass,
    setPlayerGrid,
    setEnemySolarium,
    setEnemyTheater,
    setEnemyUnderpass,
    setEnemyGrid,
    setBattleRealm,
    setPlayerBattleSlots,
    setEnemyBattleSlots,
    setSelectedInHand,
    setTargetType,
    setPlayerTargetSelection,
    setEnemyTargetSelection,
    setPendingRitual,
    setTargetSelection,
    setCurrentPlayer,
    setPriorityLeft,
    setPlayerFirstAttack,
    setAwaitingImpostor,
    setAwaitingSacrifices,
    setRezCard,
    setDraftSelected,
    setSelectedRealm,
    setModalVisible,
    setSoulSelections,
    setFocus,
    setAwaitingFocus,
    setUiState,
    setTurnNumber,
    endTurn
} = stateSetters;

// Export state objects
export { state, stateSetters };

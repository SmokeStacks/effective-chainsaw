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
export const setters = {
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
    setSelectedCard: null,
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
    Object.assign(setters, setterFunctions);
}

// Initialize game state with new values
export function initializeGameState(newState) {
    Object.assign(gameState, newState);
}

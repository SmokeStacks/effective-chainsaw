// Game State
export const state = {
    playerBits: 5,
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

    // Cards
    playerHand: [],
    playerLibrary: [],
    playerGraveyard: [],
    enemyHand: [],
    enemyLibrary: [],
    enemyGraveyard: [],

    // Realms
    playerSolarium: { people: [], places: [], things: [] },
    playerTheater: { people: [], places: [], things: [] },
    playerUnderpass: { people: [], places: [], things: [] },
    playerGrid: { people: [], places: [], things: [] },
    playerElysium: { people: [], places: [], things: [] },
    
    enemySolarium: { people: [], places: [], things: [] },
    enemyTheater: { people: [], places: [], things: [] },
    enemyUnderpass: { people: [], places: [], things: [] },
    enemyGrid: { people: [], places: [], things: [] },
    enemyElysium: { people: [], places: [], things: [] },

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
    mode: 'BEGIN',
    
    // Other state
    playerFirstAttack: true,
    awaitingImpostor: false,
    awaitingSacrifices: false,
    rezCard: null,
    draftSelected: false,
    selectedRealm: null,
    soulSelections: [],
    focus: null,
    awaitingFocus: false,
};

// State setters
export const stateSetters = {
    setSelectedCard: null,
    setPlayerHand: null,
    setPlayerLibrary: null,
    setPlayerGraveyard: null,
    setEnemyHand: null,
    setEnemyLibrary: null,
    setEnemyGraveyard: null,
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
    setPlayerElysium: null,
    
    setEnemySolarium: null,
    setEnemyTheater: null,
    setEnemyUnderpass: null,
    setEnemyGrid: null,
    setEnemyElysium: null,

    // Battle setters
    setBattleRealm: null,
    setPlayerBattleSlots: null,
    setEnemyBattleSlots: null,
    setBattleSelectedCard: null,

    // Selection setters
    setSelectedInHand: null,
    setTargetType: null,
    setPlayerTargetSelection: null,
    setEnemyTargetSelection: null,
    setPendingRitual: null,
    setPendingManualAbility: null,
    setTargetSelection: null,

    // Game flow setters
    setCurrentPlayer: null,
    setPriorityLeft: null,
    setMode: null,

    // Other setters
    setPlayerFirstAttack: null,
    setEnemyFirstAttack: null,
    setAwaitingImpostor: null,
    setImpostorRealm: null,
    setAwaitingSacrifices: null,
    setRezCard: null,
    setDraftSelected: null,
    setSelectedRealm: null,
    setSoulSelections: null,
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
                    return [state.playerSolarium, stateSetters.setPlayerSolarium];
                case 'Theater':
                    return [state.playerTheater, stateSetters.setPlayerTheater];
                case 'Underpass':
                    return [state.playerUnderpass, stateSetters.setPlayerUnderpass];
                case 'Grid':
                    return [state.playerGrid, stateSetters.setPlayerGrid];
                case 'Elysium':
                    return [state.playerElysium, stateSetters.setPlayerElysium];
                default:
                    console.error(`Invalid realm name: ${realmName}`);
                    return [null, null];
            }
        case 'ENEMY':
            switch (realmName) {
                case 'Solarium':
                    return [state.enemySolarium, stateSetters.setEnemySolarium];
                case 'Theater':
                    return [state.enemyTheater, stateSetters.setEnemyTheater];
                case 'Underpass':
                    return [state.enemyUnderpass, stateSetters.setEnemyUnderpass];
                case 'Grid':
                    return [state.enemyGrid, stateSetters.setEnemyGrid];
                case 'Elysium':
                    return [state.enemyElysium, stateSetters.setEnemyElysium];
                default:
                    console.error(`Invalid realm name: ${realmName}`);
                    return [null, null];
            }
        default:
            console.error(`Invalid side: ${side}`);
            return [null, null];
    }
}

// Export state getters
export const getState = () => state;

// Export individual state values as getters
export const playerBits = () => state.playerBits;
export const playerAshes = () => state.playerAshes;
export const playerBurden = () => state.playerBurden;
export const playerFate = () => state.playerFate;
export const playerWounds = () => state.playerWounds;
export const playerOverload = () => state.playerOverload;
export const playerLag = () => state.playerLag;
export const playerActions = () => state.playerActions;
export const playerSurge = () => state.playerSurge;
export const playerDriftCount = () => state.playerDriftCount;
export const playerGlitchyAmount = () => state.playerGlitchyAmount;

export const enemyBits = () => state.enemyBits;
export const enemyAshes = () => state.enemyAshes;
export const enemyBurden = () => state.enemyBurden;
export const enemyFate = () => state.enemyFate;
export const enemyWounds = () => state.enemyWounds;
export const enemyOverload = () => state.enemyOverload;
export const enemyLag = () => state.enemyLag;
export const enemyActions = () => state.enemyActions;
export const enemySurge = () => state.enemySurge;
export const enemyDriftCount = () => state.enemyDriftCount;
export const enemyGlitchyAmount = () => state.enemyGlitchyAmount;
export const enemyDividendAmount = () => state.enemyDividendAmount;

export const playerHand = () => state.playerHand;
export const playerLibrary = () => state.playerLibrary;
export const playerGraveyard = () => state.playerGraveyard;
export const enemyHand = () => state.enemyHand;
export const enemyLibrary = () => state.enemyLibrary;
export const enemyGraveyard = () => state.enemyGraveyard;

export const playerSolarium = () => state.playerSolarium;
export const playerTheater = () => state.playerTheater;
export const playerUnderpass = () => state.playerUnderpass;
export const playerGrid = () => state.playerGrid;
export const playerElysium = () => state.playerElysium;

export const enemySolarium = () => state.enemySolarium;
export const enemyTheater = () => state.enemyTheater;
export const enemyUnderpass = () => state.enemyUnderpass;
export const enemyGrid = () => state.enemyGrid;
export const enemyElysium = () => state.enemyElysium;

export const battleRealm = () => state.battleRealm;
export const playerBattleSlots = () => state.playerBattleSlots;
export const enemyBattleSlots = () => state.enemyBattleSlots;

export const selectedCard = () => state.selectedCard;
export const selectedInHand = () => state.selectedInHand;
export const targetType = () => state.targetType;
export const playerTargetSelection = () => state.playerTargetSelection;
export const enemyTargetSelection = () => state.enemyTargetSelection;
export const pendingRitual = () => state.pendingRitual;
export const targetSelection = () => state.targetSelection;

export const currentPlayer = () => state.currentPlayer;
export const priorityLeft = () => state.priorityLeft;

export const playerFirstAttack = () => state.playerFirstAttack;
export const awaitingImpostor = () => state.awaitingImpostor;
export const awaitingSacrifices = () => state.awaitingSacrifices;
export const rezCard = () => state.rezCard;
export const draftSelected = () => state.draftSelected;
export const selectedRealm = () => state.selectedRealm;
export const soulSelections = () => state.soulSelections;
export const focus = () => state.focus;
export const awaitingFocus = () => state.awaitingFocus;

// Export setters
export const {
    setSelectedCard,
    setPlayerHand,
    setPlayerLibrary,
    setPlayerGraveyard,
    setEnemyHand,
    setEnemyLibrary,
    setEnemyGraveyard,
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
    setPlayerElysium,
    setEnemySolarium,
    setEnemyTheater,
    setEnemyUnderpass,
    setEnemyGrid,
    setEnemyElysium,
    setBattleRealm,
    setPlayerBattleSlots,
    setEnemyBattleSlots,
    setBattleSelectedCard,
    setSelectedInHand,
    setTargetType,
    setPlayerTargetSelection,
    setEnemyTargetSelection,
    setPendingRitual,
    setPendingManualAbility,
    setTargetSelection,
    setCurrentPlayer,
    setPriorityLeft,
    setMode,
    setPlayerFirstAttack,
    setEnemyFirstAttack,
    setAwaitingImpostor,
    setImpostorRealm,
    setAwaitingSacrifices,
    setRezCard,
    setDraftSelected,
    setSelectedRealm,
    setModalVisible,
    setSoulSelections,
    setUiState,
    setTurnNumber,
    endTurn
} = stateSetters;

// stateSetters is already exported above

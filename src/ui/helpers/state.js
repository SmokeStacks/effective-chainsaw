// Game State
// Resource totals start empty. Turn 1 is a normal turn: startTurn grants the
// per-turn income (plus the player's first-turn Bit bonus), so seeding non-zero
// values here would stack on top of that grant rather than replace it.
export const state = {
    playerBits: 0,
    playerAshes: 0,
    playerBurden: 0,
    playerFate: 0,
    playerWounds: 0,
    playerOverload: 0,
    playerLag: 0,
    playerActions: 0,
    playerSurge: 0,
    playerDriftCount: 0,
    playerGlitchyAmount: 0,
    // Accumulator for the Dividend keyword only. Base per-turn Bit income lives
    // in startTurn, not here.
    playerDividendAmount: 0,

    enemyBits: 0,
    enemyAshes: 0,
    enemyBurden: 0,
    enemyFate: 0,
    enemyWounds: 0,
    enemyOverload: 0,
    enemyLag: 0,
    enemyActions: 0,
    enemySurge: 0,
    enemyDriftCount: 0,
    enemyGlitchyAmount: 0,
    enemyDividendAmount: 0,

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

    // Game result. Set alongside mode === 'GAME_OVER' so the end-of-game UI can
    // report who won and why; null while the game is still in progress.
    winner: null,
    winReason: null,

    // Devotion: chosen secretly at setup, lowers one of the player's own win
    // thresholds by 1, and stays hidden until the game ends. null means the
    // player declined one (it is optional). Enemy has no Devotion.
    playerDevotion: null,
    devotionRevealed: false,

    // Interface/Hacking tracking (resets each turn)
    playerInterfaced: false,
    playerInterfacedHeadSpace: false,
    playerInterfacedPandora: false,
    playerSuccessfulHack: false,
    enemyInterfaced: false,
    enemyInterfacedHeadSpace: false,
    enemyInterfacedPandora: false,
    enemySuccessfulHack: false,

    // Base Interface/Access counts (how many cards are seen on a successful
    // Interface of Pandora/HeadSpace). Auras like the PandoraAccess ability
    // raise these permanently. Default is 1 card per successful hack.
    playerPandoraAccess: 1,
    playerHeadSpaceAccess: 1,
    enemyPandoraAccess: 1,
    enemyHeadSpaceAccess: 1,
    // One-shot bonuses added to the access count for the next Interface only,
    // then cleared automatically by handleAccessPhase (e.g. Multi Threading).
    playerAccessBonus: 0,
    enemyAccessBonus: 0,

    // Dominance tracking
    playerWonDominance: false,
    playerLostDominance: false,  // "Surrender"
    enemyWonDominance: false,
    enemyLostDominance: false,

    // Incremented at the top of every startTurn, so the first turn is 1.
    turnNumber: 0,

    // Set once when a side is required to draw a card and its Pandora cannot
    // supply one. Latched rather than derived from library.length, because an
    // empty library is only a loss at the moment a draw is actually demanded --
    // sitting on an empty deck is legal until you must draw. Never reset during
    // a game; evaluateWinConditions turns it into a loss.
    playerDeckedOut: false,
    enemyDeckedOut: false,

    // Other state
    playerFirstAttack: true,
    enemyFirstAttack: true,

    // Looting: the first uncontested attack each turn awards 2 Bits, so this
    // tracks whether a side has already claimed it. Reset in startTurn.
    playerLooted: false,
    enemyLooted: false,
    awaitingImpostor: false,
    // Realm the pending Impostor swap will happen in.
    impostorRealm: null,
    awaitingSacrifices: false,
    rezCard: null,
    draftSelected: false,
    // notes.txt: "Draft a Dreamer (once per turn, costs 1 Bit)". Reset in startTurn.
    playerDrafted: false,
    selectedRealm: null,
    soulSelections: [],

    // Modal. The Dominance bid prompt blocks on this: handleDominationPhase
    // awaits a callback that only the rendered modal can fire.
    modalVisible: false,
    modalProps: {},
    focus: null,
    awaitingFocus: false,
    // Set when any entity dies, cleared at the start of each turn. Rapture reads
    // this to discount the cost of cards that carry the keyword.
    entityDiedThisTurn: false,
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
    setPlayerDividendAmount: null,

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
    setGameResult: null,
    setPlayerDevotion: null,
    setDevotionRevealed: null,

    // Interface/Hacking setters
    setPlayerInterfaced: null,
    setPlayerInterfacedHeadSpace: null,
    setPlayerInterfacedPandora: null,
    setPlayerSuccessfulHack: null,
    setEnemyInterfaced: null,
    setEnemyInterfacedHeadSpace: null,
    setEnemyInterfacedPandora: null,
    setEnemySuccessfulHack: null,
    setPlayerPandoraAccess: null,
    setPlayerHeadSpaceAccess: null,
    setEnemyPandoraAccess: null,
    setEnemyHeadSpaceAccess: null,
    setPlayerAccessBonus: null,
    setEnemyAccessBonus: null,

    // Dominance setters
    setPlayerWonDominance: null,
    setPlayerLostDominance: null,
    setEnemyWonDominance: null,
    setEnemyLostDominance: null,

    // Other setters
    setTurnNumber: null,
    setPlayerDeckedOut: null,
    setEnemyDeckedOut: null,
    setPlayerFirstAttack: null,
    setEnemyFirstAttack: null,
    setPlayerLooted: null,
    setEnemyLooted: null,
    setAwaitingImpostor: null,
    setImpostorRealm: null,
    setAwaitingSacrifices: null,
    setRezCard: null,
    setDraftSelected: null,
    setPlayerDrafted: null,
    setSelectedRealm: null,
    setSoulSelections: null,
    setModalVisible: null,
    setModalProps: null,
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
export const playerDrafted = () => state.playerDrafted;
export const selectedRealm = () => state.selectedRealm;
export const soulSelections = () => state.soulSelections;
export const focus = () => state.focus;
export const awaitingFocus = () => state.awaitingFocus;

// The setters were once re-exported individually here, via
// `export const { setPlayerBits, ... } = stateSetters;`. That destructure ran at
// module load, when every entry in `stateSetters` is still null, so each export
// was permanently bound to null -- importing one and calling it threw
// "is not a function", and importing one and null-checking it silently skipped
// the update forever. No call site used them (they all go through
// `stateSetters.setX(...)`, which resolves at call time and therefore sees the
// real functions BoardContainer installs via initializeSetters), so the block
// was pure trap and has been removed. Always reach setters through the
// `stateSetters` object.
// stateSetters is already exported above

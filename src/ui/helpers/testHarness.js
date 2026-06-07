// Test harness for game-logic unit tests.
//
// Game logic in src/ui/helpers/* relies on two module-level singletons from
// state.js:
//   - `state`  : a plain mutable object holding the current game state
//   - `stateSetters` : an object whose properties are setter functions; populated
//     at runtime by BoardContainer via `initializeSetters(...)`
//
// In production, the setters wrap React's setState. In tests we want
// synchronous, plain-function setters that simply mutate the shared `state`
// object (and support React-style updater functions). This harness provides:
//
//   - resetState()   -> overwrites `state` in-place with default initial values
//   - installFakeSetters() -> installs setters into `stateSetters` that mutate `state`
//   - setupTestEnv() -> resets state, installs setters, returns the live state
//
// IMPORTANT: due to a known issue (TRIAGE.md item #1), several modules
// destructure `state` and `stateSetters` at module-load time. Tests written
// against those modules (battle.js, damage.js, glossary.js, parts of core.js)
// will see stale snapshots. Those modules need to be refactored before they
// become testable. For now, target modules that read state/setters at call
// time: player.js, enemy.js, game.js, and the resource-management portions of
// core.js.

import { state, stateSetters, initializeSetters } from './state';

const DEFAULT_STATE = {
    playerBits: 4,
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
    playerDividendAmount: 0,

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
    enemyDividendAmount: 0,

    playerHand: [],
    playerLibrary: [],
    playerGraveyard: [],
    enemyHand: [],
    enemyLibrary: [],
    enemyGraveyard: [],

    playerSolarium: { name: 'Solarium', people: [], places: [], things: [] },
    playerTheater: { name: 'Theater', people: [], places: [], things: [] },
    playerUnderpass: { name: 'Underpass', people: [], places: [], things: [] },
    playerGrid: { name: 'Grid', people: [], places: [], things: [] },
    playerElysium: { name: 'Elysium', people: [], places: [], things: [] },

    enemySolarium: { name: 'Solarium', people: [], places: [], things: [] },
    enemyTheater: { name: 'Theater', people: [], places: [], things: [] },
    enemyUnderpass: { name: 'Underpass', people: [], places: [], things: [] },
    enemyGrid: { name: 'Grid', people: [], places: [], things: [] },
    enemyElysium: { name: 'Elysium', people: [], places: [], things: [] },

    battleRealm: null,
    playerBattleSlots: Array(6).fill(null),
    enemyBattleSlots: Array(6).fill(null),

    selectedCard: null,
    selectedInHand: false,
    targetType: 'none',
    playerTargetSelection: null,
    enemyTargetSelection: null,
    pendingRitual: null,
    targetSelection: { enabled: false },

    currentPlayer: 'PLAYER',
    priorityLeft: true,
    mode: 'BEGIN',

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

/**
 * Overwrites the shared `state` object in-place with default values.
 * In-place mutation (vs. reassignment) is required because other modules
 * have already imported `state` by reference.
 */
export function resetState(overrides = {}) {
    // Clear any keys present in current state but not in defaults
    for (const key of Object.keys(state)) {
        if (!(key in DEFAULT_STATE) && !(key in overrides)) {
            delete state[key];
        }
    }
    // Deep-copy default values so tests can't pollute each other through
    // shared object references (e.g. realm.people arrays).
    Object.assign(state, deepClone(DEFAULT_STATE), deepClone(overrides));
    return state;
}

/**
 * Builds a setter that, when called with either a plain value or an
 * updater function, mutates state[key] and returns the new value.
 */
function makeSetter(key) {
    return (updater) => {
        const prev = state[key];
        const next = typeof updater === 'function' ? updater(prev) : updater;
        state[key] = next;
        return next;
    };
}

/**
 * Installs synchronous, plain-function setters into the shared `stateSetters`
 * object. Every setter mutates `state` in place.
 */
export function installFakeSetters() {
    // Build a setter for every known state key + a few that don't directly
    // correspond to a state field but are used by helpers.
    const setters = {};
    const setterKeys = [
        ...Object.keys(DEFAULT_STATE),
        // Misc that helpers expect but aren't in DEFAULT_STATE
        'playerEntitiesDiedThisTurn',
        'enemyEntitiesDiedThisTurn',
        'attackMode',
        'impostorRealm',
        'enemyTargetType',
        'enemyFirstAttack',
        // Interfacing / hack setters used by handlePlayerBattle / handleSuccessfulHack
        'playerInterfaced',
        'playerInterfacedHeadSpace',
        'playerInterfacedPandora',
        'enemyInterfaced',
        'enemyInterfacedHeadSpace',
        'enemyInterfacedPandora',
        // Defense confirmation setters used by handleEndOfBattle
        'playerDefenseConfirmed',
        'enemyDefenseConfirmed',
    ];
    for (const key of setterKeys) {
        const setterName = 'set' + key.charAt(0).toUpperCase() + key.slice(1);
        setters[setterName] = makeSetter(key);
    }
    initializeSetters(setters);
    return stateSetters;
}

/**
 * Convenience: reset state and install setters. Call from beforeEach().
 * Returns the live state object.
 */
export function setupTestEnv(overrides = {}) {
    resetState(overrides);
    installFakeSetters();
    return state;
}

function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(deepClone);
    const out = {};
    for (const k of Object.keys(obj)) out[k] = deepClone(obj[k]);
    return out;
}

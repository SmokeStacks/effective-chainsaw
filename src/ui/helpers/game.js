import { stateSetters } from './state';
import {
    gainBits as _pGainBits, loseBits as _pLoseBits,
    gainAshes as _pGainAshes, loseAshes as _pLoseAshes,
    gainSurge as _pGainSurge, loseSurge as _pLoseSurge,
    gainFate as _pGainFate, loseFate as _pLoseFate,
    gainActions as _pGainActions, loseActions as _pLoseActions,
    gainWounds as _pGainWounds, loseWounds as _pLoseWounds,
    gainBurden as _pGainBurden, loseBurden as _pLoseBurden,
    calculateSoulsAvailable as calcSoulsPlayer,
} from './player';
import {
    gainBits as _eGainBits, loseBits as _eLoseBits,
    gainAshes as _eGainAshes, loseAshes as _eLoseAshes,
    gainSurge as _eGainSurge, loseSurge as _eLoseSurge,
    gainFate as _eGainFate, loseFate as _eLoseFate,
    gainActions as _eGainActions, loseActions as _eLoseActions,
    gainWounds as _eGainWounds, loseWounds as _eLoseWounds,
    gainBurden as _eGainBurden, loseBurden as _eLoseBurden,
    calculateSoulsAvailable as calcSoulsEnemy,
} from './enemy';
import { handleAscension } from './advancement';

// game.js used to contain a second, simpler implementation of these resource
// helpers that ignored Overload absorption and other status rules. It is now
// a thin re-export of the canonical implementations in player.js / enemy.js
// so that callers using `playerGainBits` (via game.js or core.js) get the
// same behavior as callers using `player.gainBits` directly.

// Bits
export const playerGainBits = _pGainBits;
export const playerLoseBits = _pLoseBits;
export const enemyGainBits = _eGainBits;
export const enemyLoseBits = _eLoseBits;

// Ashes
export const playerGainAshes = _pGainAshes;
export const playerLoseAshes = _pLoseAshes;
export const enemyGainAshes = _eGainAshes;
export const enemyLoseAshes = _eLoseAshes;

// Surge
export const playerGainSurge = _pGainSurge;
export const playerLoseSurge = _pLoseSurge;
export const enemyGainSurge = _eGainSurge;
export const enemyLoseSurge = _eLoseSurge;

// Fate. The canonical implementations absorb gains against Burden
// (notes.txt: "Cannot gain Fate if Burdened ... Each point you would gain
// decreases the status by the same amount"), which the old core.js copies did not.
export const playerGainFate = _pGainFate;
export const playerLoseFate = _pLoseFate;
export const enemyGainFate = _eGainFate;
export const enemyLoseFate = _eLoseFate;

// Actions. Gains are absorbed against Lag, same rule as above.
export const playerGainActions = _pGainActions;
export const playerLoseActions = _pLoseActions;
export const enemyGainActions = _eGainActions;
export const enemyLoseActions = _eLoseActions;

// Wounds / Burden. Inflicted statuses, so no absorption applies; routed through
// here purely to keep a single definition per resource.
export const playerGainWounds = _pGainWounds;
export const playerLoseWounds = _pLoseWounds;
export const enemyGainWounds = _eGainWounds;
export const enemyLoseWounds = _eLoseWounds;
export const playerGainBurden = _pGainBurden;
export const playerLoseBurden = _pLoseBurden;
export const enemyGainBurden = _eGainBurden;
export const enemyLoseBurden = _eLoseBurden;

// Re-export functions
export { handleAscension };

// Game state management
export function setAttackMode(mode) {
    // This function sets the current attack mode (e.g., 'ENEMY_magi', 'ENEMY_phys', 'ENEMY_tech')
    stateSetters.setMode(mode);
}

export function setGameState(state) {
    // This function sets the current game state (e.g., 'WAITING_FOR_PLAYER_DEFENSE')
    stateSetters.setMode(state);
}

// Souls calculation
export function calculateSoulsAvailable(id, side) {
    return side === 'PLAYER' ? calcSoulsPlayer(id) : calcSoulsEnemy(id);
}

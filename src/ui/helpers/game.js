import { stateSetters } from './state';
import {
    gainBits as _pGainBits, loseBits as _pLoseBits,
    gainAshes as _pGainAshes, loseAshes as _pLoseAshes,
    gainSurge as _pGainSurge, loseSurge as _pLoseSurge,
    calculateSoulsAvailable as calcSoulsPlayer,
} from './player';
import {
    gainBits as _eGainBits, loseBits as _eLoseBits,
    gainAshes as _eGainAshes, loseAshes as _eLoseAshes,
    gainSurge as _eGainSurge, loseSurge as _eLoseSurge,
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

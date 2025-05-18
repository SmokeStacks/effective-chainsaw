import { state, stateSetters } from './state';
import { calculateSoulsAvailable as calcSoulsPlayer } from './player';
import { calculateSoulsAvailable as calcSoulsEnemy } from './enemy';
import { handleAscension } from './advancement';

// Bits management
export function playerGainBits(amount) {
    stateSetters.setPlayerBits(state.playerBits + amount);
}

export function playerLoseBits(amount) {
    stateSetters.setPlayerBits(Math.max(0, state.playerBits - amount));
}

export function enemyGainBits(amount) {
    stateSetters.setEnemyBits(state.enemyBits + amount);
}

export function enemyLoseBits(amount) {
    stateSetters.setEnemyBits(Math.max(0, state.enemyBits - amount));
}

// Ash management
export function playerGainAshes(amount) {
    stateSetters.setPlayerAshes(prev => prev + amount);
}

export function playerLoseAshes(amount) {
    stateSetters.setPlayerAshes(prev => Math.max(0, prev - amount));
}

export function enemyGainAshes(amount) {
    stateSetters.setEnemyAshes(prev => prev + amount);
}

export function enemyLoseAshes(amount) {
    stateSetters.setEnemyAshes(prev => Math.max(0, prev - amount));
}

export function playerGainSurge(amount) {
    stateSetters.setPlayerSurge(prev => prev + amount);
}

export function playerLoseSurge(amount) {
    stateSetters.setPlayerSurge(prev => Math.max(0, prev - amount));
}

export function enemyGainSurge(amount) {
    stateSetters.setEnemySurge(prev => prev + amount);
}

export function enemyLoseSurge(amount) {
    stateSetters.setEnemySurge(prev => Math.max(0, prev - amount));
}

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

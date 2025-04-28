import { state, stateSetters } from './state';
import { calculateSoulsAvailable as calcSoulsPlayer } from './player';
import { calculateSoulsAvailable as calcSoulsEnemy } from './enemy';
import { handleAscension } from './advancement';

const {
    playerBits = 0,
    enemyBits = 0,
    setPlayerBits,
    setEnemyBits,
} = state;

// Bits management
export function playerGainBits(amount) {
    setPlayerBits(playerBits + amount);
}

export function playerLoseBits(amount) {
    setPlayerBits(Math.max(0, playerBits - amount));
}

export function enemyGainBits(amount) {
    setEnemyBits(enemyBits + amount);
}

export function enemyLoseBits(amount) {
    setEnemyBits(Math.max(0, enemyBits - amount));
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

// Souls calculation
export function calculateSoulsAvailable(id, side) {
    return side === 'PLAYER' ? calcSoulsPlayer(id) : calcSoulsEnemy(id);
}

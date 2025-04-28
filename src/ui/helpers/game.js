import { gameState } from './state';
import { calculateSoulsAvailable as calcSoulsPlayer } from './player';
import { calculateSoulsAvailable as calcSoulsEnemy } from './enemy';
import { handleAscension } from './advancement';

const {
    playerBits = 0,
    enemyBits = 0,
    setPlayerBits,
    setEnemyBits,
} = gameState;

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
    gameState.setPlayerAshes(prev => prev + amount);
}

export function playerLoseAshes(amount) {
    gameState.setPlayerAshes(prev => Math.max(0, prev - amount));
}

export function enemyGainAshes(amount) {
    gameState.setEnemyAshes(prev => prev + amount);
}

export function enemyLoseAshes(amount) {
    gameState.setEnemyAshes(prev => Math.max(0, prev - amount));
}

export function playerGainSurge(amount) {
    gameState.setPlayerSurge(prev => prev + amount);
}

export function playerLoseSurge(amount) {
    gameState.setPlayerSurge(prev => Math.max(0, prev - amount));
}

export function enemyGainSurge(amount) {
    gameState.setEnemySurge(prev => prev + amount);
}

export function enemyLoseSurge(amount) {
    gameState.setEnemySurge(prev => Math.max(0, prev - amount));
}

// Re-export functions
export { handleAscension };

// Souls calculation
export function calculateSoulsAvailable(id, side) {
    return side === 'PLAYER' ? calcSoulsPlayer(id) : calcSoulsEnemy(id);
}

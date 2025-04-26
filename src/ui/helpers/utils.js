import { gameState } from './state';

export function getOppositeSide(side) {
    return side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
}

export function willEntitySurvive(entity, incomingDamage) {
    const currentWounds = entity.wounds || 0;
    const totalDamage = currentWounds + incomingDamage;
    return totalDamage < entity.card.HP;
}

export function getRealmAndSetter(realmName, owner) {
    if (owner === 'PLAYER') {
        switch (realmName) {
            case 'Solarium':
                return [gameState.playerSolarium, gameState.setters.setPlayerSolarium];
            case 'Theater':
                return [gameState.playerTheater, gameState.setters.setPlayerTheater];
            case 'Underpass':
                return [gameState.playerUnderpass, gameState.setters.setPlayerUnderpass];
            case 'Grid':
                return [gameState.playerGrid, gameState.setters.setPlayerGrid];
            default:
                console.error('Invalid realm:', realmName);
                return [null, null];
        }
    } else {
        switch (realmName) {
            case 'Solarium':
                return [gameState.enemySolarium, gameState.setters.setEnemySolarium];
            case 'Theater':
                return [gameState.enemyTheater, gameState.setters.setEnemyTheater];
            case 'Underpass':
                return [gameState.enemyUnderpass, gameState.setters.setEnemyUnderpass];
            case 'Grid':
                return [gameState.enemyGrid, gameState.setters.setEnemyGrid];
            default:
                console.error('Invalid realm:', realmName);
                return [null, null];
        }
    }
}

export function getArrayNameForCategory(category) {
    switch (category) {
        case 'ENTITY':
            return 'people';
        case 'LOCATION':
        case 'LANDMARK':
            return 'places';
        case 'RITUAL':
        case 'ITEM':
            return 'things';
        default:
            console.error('Invalid category:', category);
            return null;
    }
}

export function getAllPlayerRealms() {
    return [
        gameState.playerSolarium,
        gameState.playerUnderpass,
        gameState.playerGrid,
        gameState.playerTheater
    ];
}

export function getAllEnemyRealms() {
    return [
        gameState.enemySolarium,
        gameState.enemyUnderpass,
        gameState.enemyGrid,
        gameState.enemyTheater
    ];
}

export function getPlayerRealmByName(realmName) {
    switch (realmName) {
        case 'Solarium':
            return gameState.playerSolarium;
        case 'Theater':
            return gameState.playerTheater;
        case 'Underpass':
            return gameState.playerUnderpass;
        case 'Grid':
            return gameState.playerGrid;
        default:
            console.error('Invalid realm:', realmName);
            return null;
    }
}

export function getEnemyRealmByName(realmName) {
    switch (realmName) {
        case 'Solarium':
            return gameState.enemySolarium;
        case 'Theater':
            return gameState.enemyTheater;
        case 'Underpass':
            return gameState.enemyUnderpass;
        case 'Grid':
            return gameState.enemyGrid;
        default:
            console.error('Invalid realm:', realmName);
            return null;
    }
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

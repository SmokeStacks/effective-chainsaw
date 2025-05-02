import { state, stateSetters } from './state';

export function getOppositeSide(side) {
    return side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
}

export function willEntitySurvive(entity, incomingDamage) {
    const currentWounds = entity.wounds || 0;
    const totalDamage = currentWounds + incomingDamage;
    return totalDamage < entity.card.HP;
}

export function getRealmAndSetter(realmName, owner) {
    // Convert realm name to title case for comparison
    const normalizedName = realmName.charAt(0).toUpperCase() + realmName.slice(1).toLowerCase();
    
    if (owner === 'PLAYER') {
        switch (normalizedName) {
            case 'Solarium':
                return [state.playerSolarium, stateSetters.setPlayerSolarium];
            case 'Theater':
                return [state.playerTheater, stateSetters.setPlayerTheater];
            case 'Underpass':
                return [state.playerUnderpass, stateSetters.setPlayerUnderpass];
            case 'Grid':
                return [state.playerGrid, stateSetters.setPlayerGrid];
            default:
                console.error('Invalid realm:', realmName);
                return [null, null];
        }
    } else {
        switch (normalizedName) {
            case 'Solarium':
                return [state.enemySolarium, stateSetters.setEnemySolarium];
            case 'Theater':
                return [state.enemyTheater, stateSetters.setEnemyTheater];
            case 'Underpass':
                return [state.enemyUnderpass, stateSetters.setEnemyUnderpass];
            case 'Grid':
                return [state.enemyGrid, stateSetters.setEnemyGrid];
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
        state.playerSolarium,
        state.playerUnderpass,
        state.playerGrid,
        state.playerTheater
    ];
}

export function getAllEnemyRealms() {
    return [
        state.enemySolarium,
        state.enemyUnderpass,
        state.enemyGrid,
        state.enemyTheater
    ];
}

export function getPlayerRealmByName(realmName) {
    switch (realmName) {
        case 'Solarium':
            return state.playerSolarium;
        case 'Theater':
            return state.playerTheater;
        case 'Underpass':
            return state.playerUnderpass;
        case 'Grid':
            return state.playerGrid;
        default:
            console.error('Invalid realm:', realmName);
            return null;
    }
}

export function getEnemyRealmByName(realmName) {
    switch (realmName) {
        case 'Solarium':
            return state.enemySolarium;
        case 'Theater':
            return state.enemyTheater;
        case 'Underpass':
            return state.enemyUnderpass;
        case 'Grid':
            return state.enemyGrid;
        default:
            console.error('Invalid realm:', realmName);
            return null;
    }
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

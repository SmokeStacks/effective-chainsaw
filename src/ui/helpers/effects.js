import { eventManager } from './eventManager';
import { getRealmAndSetter, getOppositeSide } from './utils';
import { gameState } from './state';
import { applyBoost } from './advancement';
import { abilitiesDefinitions } from '../abilities/glossary';

export function applyAbilityEffect(entity, effect, side) {
    const abilityDef = abilitiesDefinitions[effect.name];
    if (abilityDef && typeof abilityDef.execute === 'function') {
        abilityDef.execute(entity, effect, side);
    } else {
        console.error(`Ability effect ${effect.name} not found or invalid.`);
    }
}

export function applySoloEffect(entity, location) {
    console.log('solo effect ', entity)
    applyBoost(entity, entity.solo, entity.owner);
    applyEffect(entity.id, entity.realm, entity.owner, {
        type: 'stat',
        value: entity.solo,
        field: 'HP'
    });
    applyEffect(entity.id, entity.realm, entity.owner, {
        type: 'stat',
        value: entity.solo,
        field: 'power'
    });
}

export async function applyEffect(entityId, realmName, owner, effect) {
    const [realm, setRealm] = getRealmAndSetter(realmName, owner);
    const entityIndex = realm.people.findIndex((e) => e.id === entityId);
    
    if (entityIndex === -1) {
        console.error(`Entity with ID ${entityId} not found in realm ${realmName}`);
        return;
    }

    const entity = realm.people[entityIndex];
    const updatedEntity = { ...entity };

    switch (effect.type) {
        case 'setOnline':
            updatedEntity.online = effect.value;
            break;
        case 'status':
            if (!updatedEntity.statusEffects) {
                updatedEntity.statusEffects = {};
            }
            updatedEntity.statusEffects[effect.status] = effect.amount;
            break;
        case 'stat':
            updatedEntity[effect.field] = (updatedEntity[effect.field] || 0) + effect.value;
            break;
        default:
            console.error(`Unknown effect type: ${effect.type}`);
            return;
    }

    const newPeople = [...realm.people];
    newPeople[entityIndex] = updatedEntity;

    setRealm({
        ...realm,
        people: newPeople
    });

    eventManager.publish('effectApplied', {
        entityId,
        realmName,
        owner,
        effect
    });
}

export function applyFreezeToAllEntities(amount) {
    const enemySide = 'ENEMY';
    const realms = ['Solarium', 'Theater', 'Underpass', 'Grid'];

    realms.forEach(realmName => {
        const [realm, setRealm] = getRealmAndSetter(realmName, enemySide);
        const updatedPeople = realm.people.map(entity => {
            if (entity.online) {
                return {
                    ...entity,
                    freeze: (entity.freeze || 0) + amount
                };
            }
            return entity;
        });

        setRealm({
            ...realm,
            people: updatedPeople
        });
    });
}

export function applyOverload(side, amount) {
    const { setPlayerOverload, setEnemyOverload } = gameState;
    if (side === 'PLAYER') {
        setPlayerOverload(prev => prev + amount);
    } else {
        setEnemyOverload(prev => prev + amount);
    }
}

export function playerGainOverload(amount) {
    applyOverload('PLAYER', amount);
}

export function enemyGainOverload(amount) {
    gameState.setEnemyOverload(prev => prev + amount);
}

export function removeEffect(entityId, realmName, owner, effect) {
    const [realm, setRealm] = getRealmAndSetter(realmName, owner);
    const entityIndex = realm.people.findIndex((e) => e.id === entityId);
    
    if (entityIndex === -1) {
        console.error(`Entity with ID ${entityId} not found in realm ${realmName}`);
        return;
    }

    const entity = realm.people[entityIndex];
    const updatedEntity = { ...entity };

    switch (effect.type) {
        case 'status':
            if (updatedEntity.statusEffects && updatedEntity.statusEffects[effect.status]) {
                delete updatedEntity.statusEffects[effect.status];
            }
            break;
        case 'stat':
            updatedEntity[effect.field] = (updatedEntity[effect.field] || 0) - effect.value;
            break;
        default:
            console.error(`Unknown effect type: ${effect.type}`);
            return;
    }

    const newPeople = [...realm.people];
    newPeople[entityIndex] = updatedEntity;

    setRealm({
        ...realm,
        people: newPeople
    });
}

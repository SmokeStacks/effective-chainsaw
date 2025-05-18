import { eventManager } from './eventManager';
import { getRealmAndSetter, getOppositeSide } from './utils';
import { stateSetters } from './state';
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
    console.log('________APPLY EFFECT', effect);

    const [realm, setRealmFunction] = getRealmAndSetter(realmName, owner);
    
    if (!realm) {
        console.error(`Realm ${realmName} not found for owner ${owner}`);
        return;
    }

    setRealmFunction(prevRealm => {
        const newRealm = {
            ...prevRealm,
            people: prevRealm.people.map(entity => {
                if (entity.id === entityId) {
                    return applyEffectToEntity(entity, effect);
                }
                return entity;
            }),
            things: (prevRealm.things || []).map(entity => {
                if (entity.id === entityId) {
                    return applyEffectToEntity(entity, effect);
                }
                return entity;
            }),
            places: (prevRealm.places || []).map(entity => {
                if (entity.id === entityId) {
                    return applyEffectToEntity(entity, effect);
                }
                return entity;
            }),
        };

        return newRealm;
    });

    eventManager.publish('effectApplied', {
        entityId,
        realmName,
        owner,
        effect
    });
}

// Helper function to apply an effect to an entity
function applyEffectToEntity(entity, effect) {
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
            return entity; // Return original entity if effect type is unknown
    }

    return updatedEntity;
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
    const { setPlayerOverload, setEnemyOverload } = stateSetters;
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
    stateSetters.setEnemyOverload(prev => prev + amount);
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

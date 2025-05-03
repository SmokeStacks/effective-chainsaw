import { flushSync } from 'react-dom';
import { state, stateSetters } from '../state';
import { getPlayerRealmByName } from '../utils';
import { removeFromRealm } from '../core';
import { setAttackMode, setGameState } from '../game';

export function enemyPlanAttack() {
    console.log('PLAN ATTACK');
    console.log('Enemy hand size:', state.enemyHand.length);
    console.log('Enemy actions:', state.enemyActions);
    
    // Make sure we have access to the enemy realms
    // If any of these are undefined, we can't plan an attack
    if (!state.enemySolarium || !state.enemyTheater || !state.enemyUnderpass || !state.enemyGrid) {
        console.log('Enemy realms not initialized, cannot plan attack');
        return false;
    }
    
    // Create a helper function to ensure each realm has the necessary arrays
    const ensureRealmStructure = (realm, name) => {
        if (!realm) {
            console.log(`${name} realm is undefined`);
            return { name, people: [], places: [], things: [] };
        }
        
        // Ensure the realm has people, places, and things arrays
        return {
            ...realm,
            name: name,
            people: Array.isArray(realm.people) ? realm.people : [],
            places: Array.isArray(realm.places) ? realm.places : [],
            things: Array.isArray(realm.things) ? realm.things : []
        };
    };
    
    // Ensure all enemy realms have the proper structure
    const enemySolarium = ensureRealmStructure(state.enemySolarium, 'Solarium');
    const enemyTheater = ensureRealmStructure(state.enemyTheater, 'Theater');
    const enemyUnderpass = ensureRealmStructure(state.enemyUnderpass, 'Underpass');
    const enemyGrid = ensureRealmStructure(state.enemyGrid, 'Grid');
    
    let realms;
    if (state.priorityLeft) {
        realms = [
            { realm: enemySolarium, name: 'Solarium', aspects: ['magi'] },
            { realm: enemyTheater, name: 'Theater', aspects: ['phys', 'magi'] },
            { realm: enemyUnderpass, name: 'Underpass', aspects: ['tech', 'phys'] },
            { realm: enemyGrid, name: 'Grid', aspects: ['tech'] },
        ];
    } else {
        realms = [
            { realm: enemyGrid, name: 'Grid', aspects: ['tech'] },
            { realm: enemyUnderpass, name: 'Underpass', aspects: ['tech', 'phys'] },
            { realm: enemyTheater, name: 'Theater', aspects: ['magi', 'phys'] },
            { realm: enemySolarium, name: 'Solarium', aspects: ['magi'] },
        ];
    }

    const newSlots = Array(6).fill(null);

    for (const { realm, name, aspects } of realms) {
        console.log(`Checking realm: ${name}`);
        
        if (!realm) {
            console.log(`Realm ${name} is undefined, skipping`);
            continue;
        }
        
        if (!realm.people || !Array.isArray(realm.people)) {
            console.log(`Realm ${name} has no people array, skipping`);
            continue;
        }
        
        console.log(`Realm ${name} has ${realm.people.length} people`);
        
        for (const aspect of aspects) {
            console.log(`Checking aspect: ${aspect} in realm ${name}`);
            
            const matchingCreatures = realm.people.filter(
                creature => creature && creature.card && creature.card[aspect] && creature.online && creature.readied && !creature.card.defensive
            );
            
            console.log(`Found ${matchingCreatures.length} matching creatures for aspect ${aspect} in realm ${name}`);

            if (matchingCreatures.length === 0) continue;

            // Find a target in the player's realm
            console.log(`Looking for player realm: ${name}`);
            const playerRealm = getPlayerRealmByName(name);
            
            if (!playerRealm) {
                console.error(`Player realm ${name} not found`);
                continue;
            }
            
            console.log(`Player realm ${name} found with:`, {
                people: playerRealm.people ? playerRealm.people.length : 0,
                places: playerRealm.places ? playerRealm.places.length : 0,
                things: playerRealm.things ? playerRealm.things.length : 0
            });

            // Check for potential targets in player realm
            const onlinePeople = playerRealm.people ? playerRealm.people.filter(entity => entity && entity.online) : [];
            const onlinePlaces = playerRealm.places ? playerRealm.places.filter(place => place && place.online) : [];
            const onlineThings = playerRealm.things ? playerRealm.things.filter(thing => thing && thing.online) : [];
            
            console.log(`Player realm ${name} has:`, {
                onlinePeople: onlinePeople.length,
                onlinePlaces: onlinePlaces.length,
                onlineThings: onlineThings.length
            });
            
            const potentialTargets = [
                ...onlinePeople,
                ...onlinePlaces,
                ...onlineThings
            ];

            console.log(`Found ${potentialTargets.length} potential targets in player realm ${name}`);
            
            if (potentialTargets.length === 0) {
                console.log(`No potential targets in player realm ${name}, continuing to next realm/aspect`);
                continue;
            }

            // Sort targets by priority
            potentialTargets.sort((a, b) => {
                // Prioritize non-defensive targets
                if (a.card.defensive && !b.card.defensive) return 1;
                if (!a.card.defensive && b.card.defensive) return -1;

                // Then prioritize by threat level (e.g., attack power)
                const aThreat = a.card.attack || 0;
                const bThreat = b.card.attack || 0;
                if (aThreat !== bThreat) return bThreat - aThreat;

                // Then by health
                const aHealth = a.health || 0;
                const bHealth = b.health || 0;
                return aHealth - bHealth;
            });

            const target = potentialTargets[0];
            const attacker = matchingCreatures[0];
            
            console.log('Selected attacker:', {
                id: attacker.id,
                card: attacker.card.name,
                power: attacker.power,
                HP: attacker.HP,
                online: attacker.online,
                readied: attacker.readied
            });
            
            console.log('Selected target:', {
                id: target.id,
                card: target.card.name,
                HP: target.HP,
                online: target.online
            });

            // Set up the attack
            stateSetters.setAttackingEntity(attacker);
            stateSetters.setDefendingEntity(target);
            stateSetters.setAttackingRealm(name);
            stateSetters.setDefendingRealm(name);

            // Pass the current priorityLeft value as a parameter
            console.log(`Calling selectEnemyAttackTarget with realm: ${name}, aspect: ${aspect}, priorityLeft: ${state.priorityLeft}`);
            selectEnemyAttackTarget(name, aspect, state.priorityLeft);
            
            console.log('Setting game state to WAITING_FOR_PLAYER_DEFENSE');
            flushSync(() => {
                setGameState('WAITING_FOR_PLAYER_DEFENSE');
            });
            
            console.log('Attack successfully planned, returning true');
            return true; // Attack was planned
        }
    }
    
    return false; // No attack possible
}

export function selectEnemyAttackTarget(realmName, aspect, isPriorityLeft) {
    console.log('selectEnemyAttackTarget realmName', realmName);
    console.log('selectEnemyAttackTarget aspect', aspect);
    
    const playerRealm = getPlayerRealmByName(realmName);
    if (!playerRealm) {
        console.error(`Player realm ${realmName} not found in selectEnemyAttackTarget`);
        return;
    }
    
    if (aspect === 'phys') {
        // Raid logic
        const places = playerRealm.places;

        if (places && places.length > 0) {
            // Target the place with the lowest health
            const targetPlace = places.reduce((lowest, place) => {
                return place.card.health < lowest.card.health ? place : lowest;
            }, places[0]);

            stateSetters.setEnemyTargetSelection(targetPlace);
            stateSetters.setEnemyTargetType('PLACE');
        } else {
            // No places, target player directly
            stateSetters.setEnemyTargetSelection(null);
            stateSetters.setEnemyTargetType('none');
        }
    } else if (aspect === 'tech') {
        // Hack logic
        const things = playerRealm.things;

        let targetRoll = Math.random();
        if (things && things.length > 0 && targetRoll < 2 / 3) {
            // Target a thing based on the current priority direction
            const targetThing = isPriorityLeft ? things[0] : things[things.length - 1];
            stateSetters.setEnemyTargetSelection(targetThing);
            stateSetters.setEnemyTargetType('THING');
        } else {
            // Target HeadSpace or Pandora
            if (realmName === 'Underpass') {
                stateSetters.setEnemyTargetSelection(null);
                stateSetters.setEnemyTargetType('HEADSPACE');
            } else if (realmName === 'Grid') {
                stateSetters.setEnemyTargetSelection(null);
                stateSetters.setEnemyTargetType('PANDORA');
            }
        }
    } else if (aspect === 'magi') {
        // Assault logic - target people
        const people = playerRealm.people;
        
        if (people && people.length > 0) {
            // Target the person with the lowest health
            const targetPerson = people.reduce((lowest, person) => {
                return person.card.health < lowest.card.health ? person : lowest;
            }, people[0]);
            
            stateSetters.setEnemyTargetSelection(targetPerson);
            stateSetters.setEnemyTargetType('PERSON');
        } else {
            // No people, target player directly
            stateSetters.setEnemyTargetSelection(null);
            stateSetters.setEnemyTargetType('none');
        }
    }
}
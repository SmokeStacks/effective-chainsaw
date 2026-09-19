import { state, stateSetters } from './state';
import { getRealmAndSetter, getOppositeSide } from './utils';
import { eventManager } from './eventManager';
import { deactivateAbilities } from '../abilities/glossary';
import { gainFate as playerGainFate, gainAshes as playerGainAshes } from './player';
import { gainFate as enemyGainFate, gainAshes as enemyGainAshes } from './enemy';
import { tryBribe } from './combatKeywords';

// NOTE: this file used to destructure `state` and `stateSetters` at the top of
// the module. That captured references at module-load time, BEFORE
// BoardContainer ran `initializeSetters(...)` -- so the setters were
// undefined, and battle/realm arrays were frozen to their initial empty
// values. Worse, four "setters" (playerGainFate etc.) were destructured from
// stateSetters where they never existed, leaving them undefined and
// silently breaking fate-on-sym-destruction.
//
// All references below now read state.<key> and stateSetters.set<Key>
// at call time.

export function handleDamage(location, entityId, damageAmount, owner) {
    let cardToWound;
    let setRealmOrBattleSlots;
    let damageDealt = 0;
    let excessDamage = 0;

    // Handle the 'BATTLE' location separately
    if (location === 'BATTLE') {
        if (owner === 'PLAYER') {
            cardToWound = state.playerBattleSlots.find((card) => card && card.id === entityId);
            setRealmOrBattleSlots = stateSetters.setPlayerBattleSlots;
        } else {
            cardToWound = state.enemyBattleSlots.find((card) => card && card.id === entityId);
            setRealmOrBattleSlots = stateSetters.setEnemyBattleSlots;
        }

        if (cardToWound) {
            // Get Armor amount
            const armorAmount = cardToWound.armored || 0;

            // Adjust damage amount by Armor
            const adjustedDamageAmount = Math.max(damageAmount - armorAmount, 0);

            const currentWounds = cardToWound.wounds || 0;
            const maxHealth = cardToWound.card.HP;
            const remainingHealth = maxHealth - currentWounds;
            const actualDamage = Math.min(remainingHealth, adjustedDamageAmount);
            damageDealt = actualDamage;
            excessDamage = adjustedDamageAmount - actualDamage;

            let newWounds = currentWounds + actualDamage;
            console.log(
                `${cardToWound.card.name} receives ${actualDamage} damage after Armor. Total wounds: ${newWounds}`
            );

            if (newWounds >= maxHealth && tryBribe(cardToWound, owner, stateSetters)) {
                newWounds = maxHealth - 1;
                setRealmOrBattleSlots((prev) =>
                    prev.map((card) =>
                        card && card.id === entityId ? { ...card, wounds: newWounds, bribeUsed: true } : card
                    )
                );
            } else if (newWounds >= maxHealth) {
                handleDeadCard(location, entityId, owner);
            } else {
                setRealmOrBattleSlots((prev) =>
                    prev.map((card) =>
                        card && card.id === entityId ? { ...card, wounds: newWounds } : card
                    )
                );
            }
        }
    } else {
        // Use getRealmAndSetter for realm locations
        const [realm, setRealm] = getRealmAndSetter(location, owner);

        const entityIndex = realm.people.findIndex((e) => e.id === entityId);
        if (entityIndex === -1) return { damageDealt: 0, excessDamage: 0 };

        const oldEntity = realm.people[entityIndex];

        // Get Armor amount
        const armorAmount = oldEntity.armored || 0;

        // Adjust damage amount by Armor
        const adjustedDamageAmount = Math.max(damageAmount - armorAmount, 0);

        const currentWounds = oldEntity.wounds || 0;
        const maxHealth = oldEntity.card.HP;
        const remainingHealth = maxHealth - currentWounds;
        const actualDamage = Math.min(remainingHealth, adjustedDamageAmount);
        damageDealt = actualDamage;
        excessDamage = adjustedDamageAmount - actualDamage;

        let newEntity = { ...oldEntity, wounds: currentWounds + actualDamage };
        console.log(
            `${newEntity.card.name} receives ${actualDamage} damage after Armor. Total wounds: ${newEntity.wounds}`
        );

        if (newEntity.wounds >= maxHealth && tryBribe(newEntity, owner, stateSetters)) {
            newEntity = { ...newEntity, wounds: maxHealth - 1, bribeUsed: true };
            const newPeople = [...realm.people];
            newPeople[entityIndex] = newEntity;

            setRealm({
                ...realm,
                people: newPeople,
            });
        } else if (newEntity.wounds >= maxHealth) {
            handleDeadCard(location, entityId, owner);
        } else {
            const newPeople = [...realm.people];
            newPeople[entityIndex] = newEntity;

            setRealm({
                ...realm,
                people: newPeople,
            });
        }
    }

    return { damageDealt, excessDamage };
}




export function handleDeadCard(location, entityId, side) {
    let cardToRemove;
    console.log("handleDeadCard called with:", { location, entityId, side })

    // Convert entityId to number if necessary
    const numericEntityId = typeof entityId === 'string' ? entityId : entityId;
    console.log('Numeric Entity ID:', numericEntityId, 'Type:', typeof numericEntityId);

    if (location === 'BATTLE') {
        let battleSlots, setBattleSlots;

        if (side === 'PLAYER') {
            battleSlots = state.playerBattleSlots;
            setBattleSlots = stateSetters.setPlayerBattleSlots;
        } else {
            battleSlots = state.enemyBattleSlots;
            setBattleSlots = stateSetters.setEnemyBattleSlots;
        }

        cardToRemove = battleSlots.find(card => card && card.id === numericEntityId);
        console.log('Card to remove in BATTLE:', cardToRemove);

        if (cardToRemove) {
            // Remove the card from battle slots
            setBattleSlots(prev => {
                console.log('Previous battle slots:', prev);
                console.log('Searching for card with ID:', numericEntityId);

                const newSlots = prev.map(card =>
                    card && card.id === numericEntityId ? null : card
                );

                console.log('Updated battle slots:', newSlots);
                return newSlots;
            });
            console.log('after battleslots')
        } else {
            console.log('Card not found in battleSlots.');
        }
    } else {
        const [realm, setRealm] = getRealmAndSetter(location, side);
        console.log('Retrieved realm and setter:', { realm, setRealm });

        // Check the structure of the realm.people array
        console.log(`Current people in ${location}:`, realm.people);

        cardToRemove = realm.people.find(card => card.id === numericEntityId);
        console.log('cardToRemove:', cardToRemove);
        if (cardToRemove) {
            console.log('Removing card');
            setRealm(prevRealm => ({
                ...prevRealm,
                people: prevRealm.people.filter(card => card.id !== numericEntityId),
            }));
            console.log(`Card with ID ${numericEntityId} removed from ${location}.`);
        }
    }

    if (cardToRemove) {
        console.log('Proceeding to deactivate abilities and handle Deathless.');

        // Deactivate abilities
        deactivateAbilities(cardToRemove, side);
        console.log(`Abilities of ${cardToRemove.card.name} deactivated.`);

        // Check if the card has Deathless
        const hasDeathless = cardToRemove.deathless > 0;
        console.log(`Card has Deathless: ${hasDeathless}`);

        // Publish death event
        state.entityDiedThisTurn = true;
        eventManager.publish('entityDied', { entityId: numericEntityId, realmName: location, owner: side, decay: cardToRemove.decay || 0 });

        // Gain ashes based on side
        if (side === 'PLAYER') {
            playerGainAshes(1);
            console.log('Player gains 1 Ash.');
        } else {
            enemyGainAshes(1);
            console.log('Enemy gains 1 Ash.');
        }

        if (hasDeathless) {
            // Reset the card's stats
            const resetCard = {
                ...cardToRemove,
                power: cardToRemove.card.power || 0,
                HP: cardToRemove.card.HP || 0,
                wounds: 0, // Assuming 'wounds' is used for damage
                exposed: false,
                scored: false,
                online: false,
                readied: false,
                ascended: false,
                steps: 0,
                freeze: 0,
                decay: 0,
                venom: 0,
                charge: cardToRemove.card.charge || 0,
                sacrificed: false,
                cosmic: cardToRemove.card.cosmic || 1,
                deathless: cardToRemove.deathless || 0,
                pounce: cardToRemove.pounce || 0,
                override: cardToRemove.override || 0,
                stealth: cardToRemove.stealth || 0,
                armored: cardToRemove.armored || 0,
                solo: cardToRemove.solo || 0,
                statusEffects: {},
            };

            // Add the reset card to HeadSpace
            if (side === 'PLAYER') {
                stateSetters.setPlayerHand(prev => [...prev, resetCard]);
                console.log(`Added reset card to Player Hand:`, resetCard);
            } else {
                stateSetters.setEnemyHand(prev => [...prev, resetCard]);
                console.log(`Added reset card to Enemy Hand:`, resetCard);
            }

            console.log(`${cardToRemove.card.name} is Deathless and returns to HeadSpace.`);
        } else {
            if (side === 'PLAYER') {
                stateSetters.setPlayerGraveyard(prev => [...prev, cardToRemove]);
                console.log(`Added card to Player Graveyard:`, cardToRemove);
            } else {
                stateSetters.setEnemyGraveyard(prev => [...prev, cardToRemove]);
                console.log(`Added card to Enemy Graveyard:`, cardToRemove);
            }
        }
    } else {
        console.error(`Card with ID ${entityId} not found in ${location} for side ${side}`);
    }
}




export function handleDeadCards(deadList, side) {
    if (!deadList || deadList.length === 0) return;

    // We will first gather all entities before removing them from the realms.
    // This way we can deactivate abilities and handle deathless logic while we still have the entities.
    const allEntities = [];
    for (const { location, entityId } of deadList) {
        const [realm] = getRealmAndSetter(location, side);
        // Search people, things, and places arrays for the entity
        let entity = realm.people.find(card => card.id === entityId);
        if (!entity && realm.things) {
            entity = realm.things.find(card => card.id === entityId);
        }
        if (!entity && realm.places) {
            entity = realm.places.find(card => card.id === entityId);
        }

        if (entity) {
            allEntities.push({ location, entity });
        } else {
            console.error(`Card with ID ${entityId} not found in ${location} for side ${side}`);
        }
    }

    // Deactivate abilities and handle deathless etc. before removal
    for (const { location, entity } of allEntities) {
        deactivateAbilities(entity, side);
        state.entityDiedThisTurn = true;
        eventManager.publish('entityDied', { entityId: entity.id, realmName: location, owner: side, decay: entity.decay || 0 });

        if (side === 'PLAYER') {
            playerGainAshes(1);
        } else {
            enemyGainAshes(1);
        }

        const hasDeathless = entity.deathless > 0;
        if (hasDeathless) {
            const resetCard = {
                ...entity,
                power: entity.card.power || 0,
                HP: entity.card.HP || 0,
                wounds: 0,
                exposed: false,
                scored: false,
                online: false,
                readied: false,
                ascended: false,
                steps: 0,
                freeze: 0,
                decay: 0,
                venom: 0,
                charge: entity.card.charge || 0,
                sacrificed: false,
                cosmic: entity.card.cosmic || 1,
                deathless: entity.deathless || 0,
                pounce: entity.pounce || 0,
                override: entity.override || 0,
                stealth: entity.stealth || 0,
                armored: entity.armored || 0,
                solo: entity.solo || 0,
                statusEffects: {},
            };

            if (side === 'PLAYER') {
                stateSetters.setPlayerHand(prev => [...prev, resetCard]);
            } else {
                stateSetters.setEnemyHand(prev => [...prev, resetCard]);
            }

            console.log(`${entity.card.name} is Deathless and returns to HeadSpace.`);
        } else {
            if (side === 'PLAYER') {
                stateSetters.setPlayerGraveyard(prev => [...prev, entity]);
            } else {
                stateSetters.setEnemyGraveyard(prev => [...prev, entity]);
            }
        }
    }

    // Now remove them from their realms after we’ve handled all logic
    const realmGroups = {};
    for (const { location, entity } of allEntities) {
        if (!realmGroups[location]) {
            realmGroups[location] = [];
        }
        realmGroups[location].push(entity.id);
    }

    for (const location in realmGroups) {
        const idsToRemove = realmGroups[location];
        const [realm, setRealm] = getRealmAndSetter(location, side);

        setRealm(prevRealm => ({
            ...prevRealm,
            people: prevRealm.people.filter(card => !idsToRemove.includes(card.id)),
            things: prevRealm.things ? prevRealm.things.filter(card => !idsToRemove.includes(card.id)) : prevRealm.things,
            places: prevRealm.places ? prevRealm.places.filter(card => !idsToRemove.includes(card.id)) : prevRealm.places,
        }));
    }
}




export function handleDestroyedThing(location, entityId, side, runes = 0) {
    const [realm, setRealm] = getRealmAndSetter(location, side);
    
    // Find the thing to remove
    const thingToRemove = realm.things.find(card => card.id === entityId);

    if (thingToRemove) {
        // Publish an event if necessary (e.g., 'thingDestroyed')
        eventManager.publish('thingDestroyed', {
            entityId: thingToRemove.id,
            side: side,
            realm: location,
        });

        // Remove the thing from the realm
        setRealm(prevRealm => ({
            ...prevRealm,
            things: prevRealm.things.filter(card => card.id !== entityId),
        }));

        // Check if the Thing is a Sym
        if (thingToRemove.card.category === 'SYM') {
            // Award Fate equal to the Sym's Runes to the opposing player
            const fateAmount = thingToRemove.card.runes || 0; // Assuming 'runes' is a property on the card
            const opposingSide = getOppositeSide(side);
            if (opposingSide === 'PLAYER') {
                playerGainFate(fateAmount);
                console.log(`${thingToRemove.card.name} was destroyed. Player gains ${fateAmount} Fate.`);
            } else {
                enemyGainFate(fateAmount);
                console.log(`${thingToRemove.card.name} was destroyed. Enemy gains ${fateAmount} Fate.`);
            }
        }

        // Add the thing to the graveyard
        if (side === 'PLAYER') {
            stateSetters.setPlayerGraveyard(prev => [...prev, thingToRemove]);
        } else {
            stateSetters.setEnemyGraveyard(prev => [...prev, thingToRemove]);
        }

        // Log the destruction
        console.log(`${thingToRemove.card.name} has been destroyed and moved to the graveyard.`);
    } else {
        console.error(`Thing with ID ${entityId} not found in ${location} for side ${side}`);
    }
}


/**
 * Removes a destroyed Place and, for Landmarks, awards its Runes as Fate to the
 * opposing side.
 *
 * notes.txt: "If a Landmark is destroyed, its controller loses it and the
 * attacker gains Fate equal to that Landmark's Runes."
 *
 * `runes` used to be a plain parameter defaulting to 0, and every real caller
 * (handlePlaceDamage and the two glossary sacrifice abilities) omitted it, so a
 * destroyed Landmark always paid out 0 Fate. It now falls back to the card's own
 * Runes and the parameter acts only as an explicit override.
 *
 * @param {string} location - Realm name
 * @param {string} entityId - Id of the Place
 * @param {string} side - Owner of the Place ('PLAYER' or 'ENEMY')
 * @param {number} [runes] - Optional override for the Fate awarded
 */
export function handleDestroyedPlace(location, entityId, side, runes = null) {

    const [realm, setRealm] = getRealmAndSetter(location, side);

    // Find the place to remove
    const placeToRemove = realm.places.find(card => card.id === entityId);

    if (placeToRemove) {
        eventManager.publish('placeDestroyed', {
            entityId: placeToRemove.id,
            side: side,
            realm: location,
        });
        setRealm(prevRealm => ({
            ...prevRealm,
            places: prevRealm.places.filter(card => card.id !== entityId),
        }));

        // Check if the place is a 'LANDMARK'
        if (placeToRemove.card.category === 'LANDMARK') {
            const fateAmount = runes !== null && runes !== undefined
                ? runes
                : (placeToRemove.card.runes || 0);
            if (side === 'PLAYER') {
                enemyGainFate(fateAmount);
            } else {
                playerGainFate(fateAmount);
            }
        }

        // Add the place to the graveyard
        if (side === 'PLAYER') {
            stateSetters.setPlayerGraveyard(prev => [...prev, placeToRemove]);
        } else {
            stateSetters.setEnemyGraveyard(prev => [...prev, placeToRemove]);
        }
    } else {
        console.error(`Place with ID ${entityId} not found in ${location} for side ${side}`);
    }
}

export function handlePlaceDamage(location, entityId, damageAmount, owner) {
    const [realm, setRealm] = getRealmAndSetter(location, owner);
    
    // Find the place in the realm
    const placeIndex = realm.places.findIndex(place => place.id === entityId);
    if (placeIndex === -1) {
        console.error(`Place with ID ${entityId} not found in ${location}`);
        return { damageDealt: 0, excessDamage: 0 };
    }

    const place = realm.places[placeIndex];
    const currentWounds = place.wounds || 0;
    const maxHealth = place.card.HP;
    const remainingHealth = maxHealth - currentWounds;
    const actualDamage = Math.min(remainingHealth, damageAmount);
    const excessDamage = damageAmount - actualDamage;

    const newWounds = currentWounds + actualDamage;
    console.log(`${place.card.name} receives ${actualDamage} damage. Total wounds: ${newWounds}`);

    if (newWounds >= maxHealth) {
        handleDestroyedPlace(location, entityId, owner);
        return { damageDealt: actualDamage, excessDamage };
    }

    // Update the place's wounds
    setRealm(prevRealm => ({
        ...prevRealm,
        places: prevRealm.places.map(p => 
            p.id === entityId ? { ...p, wounds: newWounds } : p
        )
    }));

    return { damageDealt: actualDamage, excessDamage };
}
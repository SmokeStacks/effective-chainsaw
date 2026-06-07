import { eventManager } from './eventManager';
import { getOppositeSide, getRealmAndSetter } from './utils';
import { state, stateSetters } from './state';
import { applySoloEffect } from './effects';
import { handleAccessPhase } from './interfacing';
import { handlePlaceDamage, handleDamage } from './damage';
import { 
    enemyGainWounds,
    playerGainWounds,
    enemyGainBurden,
    playerGainBurden,
    adjustEntityPowerExternal,
    returnToOriginalRealm,
    playerGainFate,
    enemyGainFate
} from './core';
import { clearVengeance } from '../abilities/glossary';

// NOTE: this file used to destructure `state` and `stateSetters` here at module
// load. That captured a frozen snapshot of empty arrays / null setters before
// BoardContainer's `initializeSetters` ran, so basically nothing in combat
// worked correctly. Every reference below now reads state.<key> and
// stateSetters.set<Key> at call time.

/**
 * Decreases the stealth value of an entity by 1.
 * @param {Object} entity - The entity whose stealth should be decreased
 * @param {string} side - The side of the entity ('PLAYER' or 'ENEMY')
 */
function decreaseStealth(entity, side) {
    if (!entity.stealth || entity.stealth <= 0) {
        return;
    }

    const realmName = entity.realm; // Ensure the entity has a 'realm' property
    const [realm, setRealm] = getRealmAndSetter(realmName, side);

    const entityIndex = realm.people.findIndex((e) => e.id === entity.id);
    if (entityIndex === -1) {
        console.error(`Entity with ID ${entity.id} not found in realm ${realmName}`);
        return;
    }

    const updatedEntity = { ...realm.people[entityIndex] };
    updatedEntity.stealth = updatedEntity.stealth - 1;

    // Ensure stealth doesn't go below 0
    if (updatedEntity.stealth < 0) {
        updatedEntity.stealth = 0;
    }

    // Update the realm's people array
    const newPeople = [...realm.people];
    newPeople[entityIndex] = updatedEntity;

    // Update the realm state
    setRealm({
        ...realm,
        people: newPeople,
    });

    console.log(`${entity.card.name}'s Stealth decreased by 1. New Stealth: ${updatedEntity.stealth}`);
}

/**
 * Commits an attack between an attacker and defender.
 * @param {Object} attacker - The attacking entity
 * @param {Object} defender - The defending entity
 * @param {string} side - The side of the attacker ('PLAYER' or 'ENEMY')
 * @param {Object} target - The target of the attack
 * @param {string} targetType - The type of target
 * @param {number} slotIndex - The slot index of the attacker
 * @returns {Object} Object containing unblockedHacking status
 */
const commitAttack = (attacker, defender = null, side, target = null, targetType = null, slotIndex) => {
    if (!attacker || !attacker.card) {
        console.error('Invalid attacker in commitAttack');
        return { unblockedHacking: false };
    }

    let unblockedHacking = false;
    let attackerPower = adjustEntityPowerExternal(attacker, side);
    let defenderPower = defender ? adjustEntityPowerExternal(defender, getOppositeSide(side)) : 0;

    // Handle stealth
    if (defender?.stealth > 0) {
        decreaseStealth(defender, getOppositeSide(side));
        return { unblockedHacking: false };
    }

    // Handle vengeance
    if (defender?.vengeance > 0) {
        clearVengeance(defender, getOppositeSide(side));
        handleDamage(state.battleRealm, attacker.id, defender.vengeance, side);
        return { unblockedHacking: false };
    }

    // If no defender, handle unblocked attack
    if (!defender) {
        const unblocked = handleUnblockedAttack(attacker, side, slotIndex);
        // Decrease attacker's stealth if they have it
        if (attacker.stealth > 0) {
            decreaseStealth(attacker, side);
        }
        // Clear attacker's vengeance if they have it
        if (attacker.vengeance > 0) {
            clearVengeance(attacker, side);
        }
        return { unblockedHacking: unblocked.unblockedHacking };
    }

    // Handle combat between attacker and defender
    if (attackerPower > defenderPower) {
        handleDamage(state.battleRealm, defender.id, attackerPower, getOppositeSide(side));
        const excessDamage = attackerPower - defenderPower;
        if (excessDamage > 0) {
            applyOverrideDamage(attacker, excessDamage, side, state.battleRealm);
        }
        // Decrease attacker's stealth if they have it
        if (attacker.stealth > 0) {
            decreaseStealth(attacker, side);
        }
        // Clear attacker's vengeance if they have it
        if (attacker.vengeance > 0) {
            clearVengeance(attacker, side);
        }
    } else if (defenderPower > attackerPower) {
        handleDamage(state.battleRealm, attacker.id, defenderPower, side);
        // Decrease defender's stealth if they have it
        if (defender.stealth > 0) {
            decreaseStealth(defender, getOppositeSide(side));
        }
        // Clear defender's vengeance if they have it
        if (defender.vengeance > 0) {
            clearVengeance(defender, getOppositeSide(side));
        }
    } else {
        // Equal power, mutual destruction
        handleDamage(state.battleRealm, attacker.id, defenderPower, side);
        handleDamage(state.battleRealm, defender.id, attackerPower, getOppositeSide(side));
        
        // Decrease both entities' stealth if they have it
        if (attacker.stealth > 0) {
            decreaseStealth(attacker, side);
        }
        if (defender.stealth > 0) {
            decreaseStealth(defender, getOppositeSide(side));
        }
        
        // Clear both entities' vengeance if they have it
        if (attacker.vengeance > 0) {
            clearVengeance(attacker, side);
        }
        if (defender.vengeance > 0) {
            clearVengeance(defender, getOppositeSide(side));
        }
    }

    // Publish combat result event
    eventManager.publish('combatResolved', {
        attacker,
        defender,
        attackerPower,
        defenderPower,
        side,
        battleRealm: state.battleRealm,
    });

    return { unblockedHacking };
};

/**
 * Handles cleanup and state reset at the end of a battle.
 */
const handleEndOfBattle = () => {
    console.log('____________________end of battle');
    stateSetters.setBattleRealm(null);

    // Reset battle slots and return entities to original realms
    stateSetters.setPlayerBattleSlots(prev => {
        prev.forEach(cardEntity => {
            if (cardEntity) returnToOriginalRealm(cardEntity, 'PLAYER');
        });
        return Array(6).fill(null);
    });

    stateSetters.setEnemyBattleSlots(prev => {
        prev.forEach(cardEntity => {
            if (cardEntity) returnToOriginalRealm(cardEntity, 'ENEMY');
        });
        return Array(6).fill(null);
    });

    // Reset game state
    stateSetters.setGameState && stateSetters.setGameState('ATTACK_RESOLVED');
    stateSetters.setAttackMode('NONE');
    stateSetters.setTargetType(null);
    stateSetters.setEnemyTargetType('none');
    stateSetters.setPlayerTargetSelection(null);
    stateSetters.setEnemyTargetSelection(null);
    stateSetters.setPlayerTargetSlot && stateSetters.setPlayerTargetSlot(null);
    stateSetters.setEnemyTargetSlot && stateSetters.setEnemyTargetSlot(null);
    stateSetters.setPlayerDefendingSlot && stateSetters.setPlayerDefendingSlot(null);
    stateSetters.setEnemyDefendingSlot && stateSetters.setEnemyDefendingSlot(null);

    // Reset interface states
    stateSetters.setPlayerInterfaced && stateSetters.setPlayerInterfaced(false);
    stateSetters.setEnemyInterfaced && stateSetters.setEnemyInterfaced(false);

    // Reset surge (battle-round scoped — accumulated per-attack, not permanent).
    // NOTE: wounds/burden/fate are permanent resources and must NOT be reset here.
    stateSetters.setPlayerSurge(0);
    stateSetters.setEnemySurge(0);

    // Reset defense states
    stateSetters.setPlayerDefenseConfirmed && stateSetters.setPlayerDefenseConfirmed(false);
    stateSetters.setEnemyDefenseConfirmed && stateSetters.setEnemyDefenseConfirmed(false);
};

// Main battle handling functions
const handleEnemyBattle = () => {
    try {
        // Update player's battle slots if necessary
        const updatedPlayerBattleSlots = state.playerBattleSlots.map(creature => {
            if (!creature) return null;
            return {
                ...creature,
                steps: 1,
                readied: creature.timer <= 1 ? creature.readied : false
            };
        });
        stateSetters.setPlayerBattleSlots(updatedPlayerBattleSlots);

        // Determine if only one attacker is present on the enemy side
        const enemyAttackers = state.enemyBattleSlots.filter(attacker => attacker !== null);
        const isEnemySoloAttack = enemyAttackers.length === 1;

        // Track hacking success
        let unblockedHacking = false;

        // Process each battle slot
        state.enemyBattleSlots.forEach((slot, i) => {
            if (!slot) return;

            // Apply solo effects if applicable
            if (isEnemySoloAttack && slot.solo > 0) {
                applySoloEffect(slot, state.battleRealm);
            }

            // Commit the attack
            const defender = updatedPlayerBattleSlots[i];
            const attackResult = commitAttack(slot, defender, 'ENEMY', state.enemyTargetSelection, state.enemyTargetType, i);
            if (attackResult.unblockedHacking) {
                unblockedHacking = true;
            }
        });

        if (unblockedHacking && state.attackMode === 'ENEMY_HACK') {
            handleSuccessfulHack();
        } else {
            eventManager.publish('failedHack', {
                side: 'ENEMY',
                targetType: state.enemyTargetType,
                success: false
            });
        }

        handleEndOfBattle();
    } catch (error) {
        console.error('Error in handleEnemyBattle:', error);
        eventManager.publish('battleError', { error: error.message });
        handleEndOfBattle(); // Ensure cleanup happens even on error
    }
};

// Helper function for successful hack
const handleSuccessfulHack = () => {
    stateSetters.setEnemyInterfaced(true);

    if (state.enemyTargetType === 'HEADSPACE') {
        stateSetters.setEnemyInterfacedHeadSpace(true);
    } else if (state.enemyTargetType === 'PANDORA') {
        stateSetters.setEnemyInterfacedPandora(true);
    }

    eventManager.publish('successfulHack', {
        side: 'ENEMY',
        targetType: state.enemyTargetType,
        success: true
    });

    handleAccessPhase('ENEMY');
    handleEndOfBattle();
};

/**
 * Handles an unblocked attack from an attacker against a target.
 * @param {Object} attacker - The attacking entity
 * @param {string} side - The side of the attacker ('PLAYER' or 'ENEMY')
 * @param {number} slotIndex - The slot index of the attacker
 * @returns {Object} Object containing unblockedHacking status
 */
function handleUnblockedAttack(attacker, side, slotIndex) {
    if (!attacker?.card) {
        console.error('Invalid attacker in handleUnblockedAttack');
        return { unblockedHacking: false };
    }

    const attackerPower = adjustEntityPowerExternal(attacker, side);
    const opponentSide = getOppositeSide(side);
    let unblockedHacking = false;

    try {
        // Get target information
        const targetSelection = side === 'PLAYER' ? state.playerTargetSelection : state.enemyTargetSelection;
        const currentTargetType = side === 'PLAYER' ? state.targetType : state.enemyTargetType;

        // Handle place damage during raids
        if (isPlaceTarget(targetSelection) && isRaidMode(state.attackMode)) {
            handlePlaceDamage(targetSelection.realm, targetSelection.id, attackerPower, opponentSide);
            logDamage(attacker, attackerPower, targetSelection);
            return { unblockedHacking };
        }

        // Handle unblocked damage based on attack mode
        unblockedHacking = handleUnblockedDamage(state.attackMode, attackerPower, side, state.battleRealm);

        // Log the damage
        logDamage(attacker, attackerPower);

        // Publish attack event
        eventManager.publish('unblockedAttack', {
            attacker,
            power: attackerPower,
            side,
            targetType: currentTargetType,
            battleRealm: state.battleRealm,
        });

        return { unblockedHacking };
    } catch (error) {
        console.error('Error in handleUnblockedAttack:', error);
        return { unblockedHacking: false };
    }
}

/**
 * Checks if a target is a place (location or landmark).
 * @param {Object} target - The target to check
 * @returns {boolean} True if target is a place
 */
function isPlaceTarget(target) {
    return target?.card?.category === 'LOCATION' || target?.card?.category === 'LANDMARK';
}

/**
 * Checks if the current attack mode is a raid.
 * @param {string} mode - The attack mode to check
 * @returns {boolean} True if mode is a raid type
 */
function isRaidMode(mode) {
    return mode === 'PLAYER_RAID' || mode === 'ENEMY_RAID';
}

/**
 * Logs damage dealt during an attack.
 * @param {Object} attacker - The attacking entity
 * @param {number} power - The amount of power/damage dealt
 * @param {Object} [target] - Optional target that received the damage
 */
function logDamage(attacker, power, target = null) {
    const message = target
        ? `${attacker.card.name} deals ${power} damage to ${target.card.name}.`
        : `${attacker.card.name} deals ${power} unblocked damage.`;
    console.log(message);
}

/**
 * Handles unblocked damage based on attack mode and realm.
 * @param {string} mode - The attack mode
 * @param {number} power - The power/damage to deal
 * @param {string} side - The side dealing damage ('PLAYER' or 'ENEMY')
 * @param {string} realm - The current battle realm
 * @returns {boolean} True if hacking damage was dealt
 */
function handleUnblockedDamage(mode, power, side, realm) {
    if (power <= 0) return false;

    switch (mode) {
        case 'ENEMY_phys':
        case 'PLAYER_RAID':
            if (['Underpass', 'Grid'].includes(realm)) {
                side === 'PLAYER' ? enemyGainWounds(power) : playerGainWounds(power);
            } else if (['Theater', 'Solarium'].includes(realm)) {
                side === 'PLAYER' ? enemyGainBurden(power) : playerGainBurden(power);
            }
            return false;

        case 'ENEMY_magi':
        case 'PLAYER_QUEST':
            side === 'PLAYER' ? playerGainFate(power) : enemyGainFate(power);
            return false;

        case 'ENEMY_tech':
        case 'PLAYER_HACK':
            if (side === 'PLAYER') {
                stateSetters.setPlayerSurge(prev => prev + power);
            } else {
                stateSetters.setEnemySurge(prev => prev + power);
            }
            return true;

        default:
            console.error('Invalid attack mode:', mode);
            return false;
    }
}

/**
 * Applies override damage to a target or opponent based on the current realm.
 * @param {Object} attacker - The attacking entity
 * @param {number} excessDamage - The amount of override damage to deal
 * @param {string} side - The side dealing damage ('PLAYER' or 'ENEMY')
 * @param {string} currentRealm - The current battle realm
 */
function applyOverrideDamage(attacker, excessDamage, side, currentRealm) {
    const opponentSide = getOppositeSide(side);

    // Determine the target selection based on the side
    const targetSelection = side === 'PLAYER' ? state.playerTargetSelection : state.enemyTargetSelection;

    if (
        targetSelection &&
        (targetSelection.card.category === 'LOCATION' || targetSelection.card.category === 'LANDMARK')
    ) {
        // Apply excess damage to the Place
        handlePlaceDamage(targetSelection.realm, targetSelection.id, excessDamage, opponentSide);
        console.log(`${attacker.card.name} deals ${excessDamage} Override damage to ${targetSelection.card.name}.`);
    } else {
        // Apply the excess damage as unblocked damage to the opponent directly, based on the realm
        if (['Underpass', 'Grid'].includes(currentRealm)) {
            // Apply wounds in Underpass and Grid realms
            if (opponentSide === 'PLAYER') {
                playerGainWounds(excessDamage);
                console.log(`${attacker.card.name} deals ${excessDamage} Override damage as wounds to the player.`);
            } else {
                enemyGainWounds(excessDamage);
                console.log(`${attacker.card.name} deals ${excessDamage} Override damage as wounds to the enemy.`);
            }
        } else if (['Theater', 'Solarium'].includes(currentRealm)) {
            // Apply burden in Theater and Solarium realms
            if (opponentSide === 'PLAYER') {
                playerGainBurden(excessDamage);
                console.log(`${attacker.card.name} deals ${excessDamage} Override damage as burden to the player.`);
            } else {
                enemyGainBurden(excessDamage);
                console.log(`${attacker.card.name} deals ${excessDamage} Override damage as burden to the enemy.`);
            }
        } else {
            // Handle other realms if necessary
            console.error(`Unknown realm '${currentRealm}' for Override damage application.`);
        }
    }
}

// Function declarations
const handleConfirmDefenseSelection = (side) => {
    if (side === 'ENEMY') {
        handleEnemyBattle();
    } else if (side === 'PLAYER') {
        handlePlayerBattle();
    }
};

/**
 * Handles the player battle logic after defense selection is confirmed.
 */
const handlePlayerBattle = () => {
    const updatedBattleSlots = state.playerBattleSlots.map(attacker => {
        if (attacker) {
            let isReadied = attacker.charge < attacker.card.timer ? false : true;
            return {
                ...attacker,
                readied: isReadied,
                steps: attacker.charge
            };
        } else {
            return attacker;
        }
    });

    // Update the state with the modified battle slots
    stateSetters.setPlayerBattleSlots(updatedBattleSlots);

    let unblockedHacking = false;

    // Determine if only one attacker is present
    const attackers = updatedBattleSlots.filter(a => a !== null);
    const isSoloAttack = attackers.length === 1;

    // Proceed with the battle using the updated battle slots
    for (let i = 0; i < 6; i++) {
        const attacker = updatedBattleSlots[i];
        const defender = state.enemyBattleSlots[i] || null;

        if (attacker) {
            // Implement solo event dispatch here
            if (isSoloAttack && attacker.solo > 0) {
                applySoloEffect(attacker, state.battleRealm);
            }

            const attackResult = commitAttack(attacker, defender, 'PLAYER', state.playerTargetSelection, state.targetType);
            if (attackResult.unblockedHacking) {
                unblockedHacking = true;
            }
        }
    }

    if (unblockedHacking && state.attackMode === 'PLAYER_HACK') {
        stateSetters.setPlayerInterfaced(true);
        if (state.enemyTargetType === 'HEADSPACE') {
            stateSetters.setPlayerInterfacedHeadSpace(true);
        }
        if (state.enemyTargetType === 'PANDORA') {
            stateSetters.setPlayerInterfacedPandora(true);
        }
        eventManager.publish('successfulHack', {
            side: 'PLAYER',
            targetType: state.targetType,
            success: true,
        });
        handleAccessPhase('PLAYER');
    } else {
        eventManager.publish('failedHack', {
            side: 'PLAYER',
            targetType: state.targetType,
            success: false,
        });
    }

    handleEndOfBattle();
};

// Pass-through export so existing importers of setBattleRealm from this
// module keep working after the top-level destructure was removed.
export const setBattleRealm = (v) => stateSetters.setBattleRealm(v);

// Export functions
export {
    handleUnblockedAttack,
    isPlaceTarget,
    isRaidMode,
    logDamage,
    handleUnblockedDamage,
    handleConfirmDefenseSelection,
    handleEndOfBattle,
    applyOverrideDamage,
    commitAttack,
    handleEnemyBattle,
    handlePlayerBattle,
    handleSuccessfulHack,
    decreaseStealth,
};

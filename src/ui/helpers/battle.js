import { eventManager } from './eventManager';
import { getOppositeSide, getRealmAndSetter } from './utils';
import { state, stateSetters } from './state';
import { applySoloEffect } from './effects';
import { handleAccessPhase } from './interfacing';
import { handlePlaceDamage, handleDamage } from './damage';
import { applyStingOnClash } from './combatKeywords';
import { 
    enemyGainWounds,
    playerGainWounds,
    enemyGainBurden,
    playerGainBurden,
    adjustEntityPowerExternal,
    returnToOriginalRealm,
    playerGainFate,
    enemyGainFate,
    playerGainBits,
    enemyGainBits,
    playerGainOverload,
    enemyGainOverload
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
    let attackerPower = adjustEntityPowerExternal(attacker, side, true);
    let defenderPower = defender ? adjustEntityPowerExternal(defender, getOppositeSide(side), false) : 0;

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

    // Surge is deliberately NOT reset here. notes.txt: "Surge are special Bits
    // that can only be spent during the Dominance Phase to increase your bid."
    // The Dominance Phase runs in endTurn, after every battle, so clearing Surge
    // here meant calculateDominationScore always saw 0. startTurn clears it.
    // NOTE: wounds/burden/fate are permanent resources and must NOT be reset here.

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

        // First time this side attacks with any entity this round (drives Crusade).
        if (enemyAttackers.length > 0 && state.enemyFirstAttack) {
            stateSetters.setEnemyFirstAttack(false);
            eventManager.publish('firstAttack', {
                side: 'ENEMY',
                attackers: enemyAttackers.map(a => a.id),
                realm: state.battleRealm
            });
        }

        // Track hacking success
        let unblockedHacking = false;

        // Process each battle slot
        state.enemyBattleSlots.forEach((slot, i) => {
            if (!slot) return;

            // Apply solo effects if applicable
            if (isEnemySoloAttack && slot.solo > 0) {
                applySoloEffect(slot, state.battleRealm);
            }

            // Clash: fires for the attacker and its blocker now that blockers are locked in
            const defender = updatedPlayerBattleSlots[i];
            eventManager.publish('clash', { side: 'ENEMY', entityId: slot.id, opponentEntityId: defender ? defender.id : null, opponentSide: 'PLAYER' });
            applyStingOnClash(slot.id, 'ENEMY', defender ? defender.id : null);
            if (defender) {
                eventManager.publish('clash', { side: 'PLAYER', entityId: defender.id, opponentEntityId: slot.id, opponentSide: 'ENEMY' });
                applyStingOnClash(defender.id, 'PLAYER', slot.id);
            }

            // Commit the attack
            const attackResult = commitAttack(slot, defender, 'ENEMY', state.enemyTargetSelection, state.enemyTargetType, i);
            if (attackResult.unblockedHacking) {
                unblockedHacking = true;
            }
        });

        if (unblockedHacking && state.attackMode === 'ENEMY_HACK') {
            resolveSuccessfulHack('ENEMY');
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

// notes.txt: "Every successful Hack inflicts 2 Overload (regardless of damage
// dealt)." Flat and independent of the Surge gained from the damage itself.
const HACK_OVERLOAD = 2;

/**
 * Resolves a successful Hack for either side.
 *
 * The player and enemy each used to carry their own copy of this. Neither
 * inflicted the 2 Overload the rules require, and the player's copy tested
 * `state.enemyTargetType` -- the enemy's target -- when deciding which
 * Interface flag to set, so the player's flags tracked the wrong attack.
 *
 * Does not call handleEndOfBattle: every caller already does, and the enemy
 * copy calling it here as well meant an enemy hack ended the battle twice.
 *
 * @param {string} side - 'PLAYER' or 'ENEMY'
 */
const resolveSuccessfulHack = (side) => {
    const isPlayer = side === 'PLAYER';
    const targetType = isPlayer ? state.targetType : state.enemyTargetType;

    if (isPlayer) {
        stateSetters.setPlayerInterfaced(true);
        if (targetType === 'HEADSPACE') {
            stateSetters.setPlayerInterfacedHeadSpace(true);
        } else if (targetType === 'PANDORA') {
            stateSetters.setPlayerInterfacedPandora(true);
        }
        enemyGainOverload(HACK_OVERLOAD);
    } else {
        stateSetters.setEnemyInterfaced(true);
        if (targetType === 'HEADSPACE') {
            stateSetters.setEnemyInterfacedHeadSpace(true);
        } else if (targetType === 'PANDORA') {
            stateSetters.setEnemyInterfacedPandora(true);
        }
        playerGainOverload(HACK_OVERLOAD);
    }

    eventManager.publish('successfulHack', { side, targetType, success: true });

    handleAccessPhase(side);
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

    const attackerPower = adjustEntityPowerExternal(attacker, side, true);
    const opponentSide = getOppositeSide(side);
    let unblockedHacking = false;

    // Looting (notes.txt: "The first uncontested attack (0 blockers) each turn
    // also awards the attacker 2 Bits."). Reaching this function already means
    // the attack drew no blocker, so award it here -- before the target-type
    // branching below, since looting applies regardless of what was attacked.
    awardLooting(side);

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
 * Awards Looting to `side` if it has not already claimed it this turn.
 * The per-turn flags are reset in startTurn.
 * @param {string} side - 'PLAYER' or 'ENEMY'
 */
function awardLooting(side) {
    const alreadyLooted = side === 'PLAYER' ? state.playerLooted : state.enemyLooted;
    if (alreadyLooted) return;

    if (side === 'PLAYER') {
        stateSetters.setPlayerLooted(true);
        playerGainBits(2);
    } else {
        stateSetters.setEnemyLooted(true);
        enemyGainBits(2);
    }
    console.log(`${side} loots 2 Bits from the first uncontested attack this turn.`);
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
            // notes.txt: "Players cannot be targeted directly by Raid if they
            // control a Location or Landmark in that Realm", and a Raid inflicts
            // Burden/Wounds only "if the Realm contains no enemy Landmarks or
            // Locations". The Place must be raided down first; an attack that
            // ignores it deals nothing to its controller.
            if (controlsPlaceInRealm(getOppositeSide(side), realm)) {
                console.log(`Raid in ${realm} is shielded: defender controls a Location or Landmark there.`);
                return false;
            }
            if (['Underpass', 'Grid'].includes(realm)) {
                side === 'PLAYER' ? enemyGainWounds(power) : playerGainWounds(power);
            } else if (['Theater', 'Solarium'].includes(realm)) {
                side === 'PLAYER' ? enemyGainBurden(power) : playerGainBurden(power);
            }
            return false;

        case 'ENEMY_magi':
        case 'PLAYER_QUEST':
            side === 'PLAYER' ? playerGainFate(power) : enemyGainFate(power);
            eventManager.publish('questSuccess', { side });
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
 * True when `side` controls at least one Location or Landmark in `realm`.
 *
 * notes.txt restricts Landmarks and Locations to Trenches (Theater) and IRL
 * (Underpass), but this reads the realm generically so a card that bends that
 * restriction still shields correctly.
 *
 * @param {string} side - 'PLAYER' or 'ENEMY'
 * @param {string} realm - Realm name, e.g. 'Theater'
 * @returns {boolean}
 */
function controlsPlaceInRealm(side, realm) {
    if (!realm) return false;
    const key = `${side === 'PLAYER' ? 'player' : 'enemy'}${realm}`;
    const places = state[key]?.places;
    return Array.isArray(places) && places.length > 0;
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

    // First time this side attacks with any entity this round (drives Crusade).
    if (attackers.length > 0 && state.playerFirstAttack) {
        stateSetters.setPlayerFirstAttack(false);
        eventManager.publish('firstAttack', {
            side: 'PLAYER',
            attackers: attackers.map(a => a.id),
            realm: state.battleRealm
        });
    }

    // Proceed with the battle using the updated battle slots
    for (let i = 0; i < 6; i++) {
        const attacker = updatedBattleSlots[i];
        const defender = state.enemyBattleSlots[i] || null;

        if (attacker) {
            // Implement solo event dispatch here
            if (isSoloAttack && attacker.solo > 0) {
                applySoloEffect(attacker, state.battleRealm);
            }

            // Clash: fires for the attacker and its blocker now that blockers are locked in
            eventManager.publish('clash', { side: 'PLAYER', entityId: attacker.id, opponentEntityId: defender ? defender.id : null, opponentSide: 'ENEMY' });
            applyStingOnClash(attacker.id, 'PLAYER', defender ? defender.id : null);
            if (defender) {
                eventManager.publish('clash', { side: 'ENEMY', entityId: defender.id, opponentEntityId: attacker.id, opponentSide: 'PLAYER' });
                applyStingOnClash(defender.id, 'ENEMY', attacker.id);
            }

            const attackResult = commitAttack(attacker, defender, 'PLAYER', state.playerTargetSelection, state.targetType);
            if (attackResult.unblockedHacking) {
                unblockedHacking = true;
            }
        }
    }

    if (unblockedHacking && state.attackMode === 'PLAYER_HACK') {
        resolveSuccessfulHack('PLAYER');
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
    controlsPlaceInRealm,
    handleConfirmDefenseSelection,
    handleEndOfBattle,
    applyOverrideDamage,
    commitAttack,
    handleEnemyBattle,
    handlePlayerBattle,
    resolveSuccessfulHack,
    decreaseStealth,
};

import { eventManager } from './eventManager';
import { getOppositeSide } from './utils';
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

// Get state variables
const {
    playerBattleSlots,
    enemyBattleSlots,
    battleRealm,
    attackMode,
    targetType,
    enemyTargetType,
    playerTargetSelection,
    enemyTargetSelection,
} = state;

// Get setters
const {
    setBattleRealm,
    setPlayerBattleSlots,
    setEnemyBattleSlots,
    setGameState,
    setAttackMode,
    setTargetType,
    setEnemyTargetType,
    setPlayerTargetSelection,
    setEnemyTargetSelection,
    setPlayerTargetSlot,
    setEnemyTargetSlot,
    setPlayerDefendingSlot,
    setEnemyDefendingSlot,
    setPlayerInterfaced,
    setEnemyInterfaced,
    setPlayerSurge,
    setEnemySurge,
    setPlayerFate,
    setEnemyFate,
    setPlayerWounds,
    setEnemyWounds,
    setPlayerBurden,
    setEnemyBurden,
    setPlayerDefenseConfirmed,
    setEnemyDefenseConfirmed,
    setEnemyInterfacedHeadSpace,
    setEnemyInterfacedPandora,
    setPlayerInterfacedHeadSpace,
    setPlayerInterfacedPandora
} = stateSetters;

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
        // Removed decreaseStealth function call
        return { unblockedHacking: false };
    }

    // Handle vengeance
    if (defender?.vengeance > 0) {
        // Removed clearVengeance function call
        handleDamage(battleRealm, attacker.id, defender.vengeance, side);
        return { unblockedHacking: false };
    }

    // If no defender, handle unblocked attack
    if (!defender) {
        const unblocked = handleUnblockedAttack(attacker, side, slotIndex);
        return { unblockedHacking: unblocked.unblockedHacking };
    }

    // Handle combat between attacker and defender
    if (attackerPower > defenderPower) {
        handleDamage(battleRealm, defender.id, attackerPower, getOppositeSide(side));
        const excessDamage = attackerPower - defenderPower;
        if (excessDamage > 0) {
            applyOverrideDamage(attacker, excessDamage, side, battleRealm);
        }
    } else if (defenderPower > attackerPower) {
        handleDamage(battleRealm, attacker.id, defenderPower, side);
    } else {
        // Equal power, mutual destruction
        handleDamage(battleRealm, attacker.id, defenderPower, side);
        handleDamage(battleRealm, defender.id, attackerPower, getOppositeSide(side));
    }

    // Publish combat result event
    eventManager.publish('combatResolved', {
        attacker,
        defender,
        attackerPower,
        defenderPower,
        side,
        battleRealm
    });

    return { unblockedHacking };
};

/**
 * Handles cleanup and state reset at the end of a battle.
 */
const handleEndOfBattle = () => {
    console.log('____________________end of battle');
    setBattleRealm(null);

    // Reset battle slots and return entities to original realms
    setPlayerBattleSlots(prev => {
        prev.forEach(cardEntity => {
            if (cardEntity) returnToOriginalRealm(cardEntity, 'PLAYER');
        });
        return Array(6).fill(null);
    });

    setEnemyBattleSlots(prev => {
        prev.forEach(cardEntity => {
            if (cardEntity) returnToOriginalRealm(cardEntity, 'ENEMY');
        });
        return Array(6).fill(null);
    });

    // Reset game state
    setGameState('ATTACK_RESOLVED');
    setAttackMode('NONE');
    setTargetType(null);
    setEnemyTargetType('none');
    setPlayerTargetSelection(null);
    setEnemyTargetSelection(null);
    setPlayerTargetSlot(null);
    setEnemyTargetSlot(null);
    setPlayerDefendingSlot(null);
    setEnemyDefendingSlot(null);
    
    // Reset interface states
    setPlayerInterfaced(false);
    setEnemyInterfaced(false);
    
    // Reset counters
    setPlayerSurge(0);
    setEnemySurge(0);
    setPlayerFate(0);
    setEnemyFate(0);
    setPlayerWounds(0);
    setEnemyWounds(0);
    setPlayerBurden(0);
    setEnemyBurden(0);
    
    // Reset defense states
    setPlayerDefenseConfirmed(false);
    setEnemyDefenseConfirmed(false);
};

// Main battle handling functions
const handleEnemyBattle = () => {
    try {
        // Update player's battle slots if necessary
        const updatedPlayerBattleSlots = playerBattleSlots.map(creature => {
            if (!creature) return null;
            return {
                ...creature,
                steps: 1,
                readied: creature.timer <= 1 ? creature.readied : false
            };
        });
        setPlayerBattleSlots(updatedPlayerBattleSlots);

        // Determine if only one attacker is present on the enemy side
        const enemyAttackers = enemyBattleSlots.filter(attacker => attacker !== null);
        const isEnemySoloAttack = enemyAttackers.length === 1;

        // Track hacking success
        let unblockedHacking = false;

        // Process each battle slot
        enemyBattleSlots.forEach((slot, i) => {
            if (!slot) return;

            // Apply solo effects if applicable
            if (isEnemySoloAttack && slot.solo > 0) {
                applySoloEffect(slot, battleRealm);
            }

            // Commit the attack
            const defender = updatedPlayerBattleSlots[i];
            const attackResult = commitAttack(slot, defender, 'ENEMY', enemyTargetSelection, enemyTargetType, i);
            if (attackResult.unblockedHacking) {
                unblockedHacking = true;
            }
        });

        if (unblockedHacking && attackMode === 'ENEMY_HACK') {
            handleSuccessfulHack();
        } else {
            eventManager.publish('failedHack', {
                side: 'ENEMY',
                targetType: enemyTargetType,
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
    setEnemyInterfaced(true);
    
    if (enemyTargetType === 'HEADSPACE') {
        setEnemyInterfacedHeadSpace(true);
    } else if (enemyTargetType === 'PANDORA') {
        setEnemyInterfacedPandora(true);
    }

    eventManager.publish('successfulHack', {
        side: 'ENEMY',
        targetType: enemyTargetType,
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
        const targetSelection = side === 'PLAYER' ? playerTargetSelection : enemyTargetSelection;
        const currentTargetType = side === 'PLAYER' ? targetType : enemyTargetType;

        // Handle place damage during raids
        if (isPlaceTarget(targetSelection) && isRaidMode(attackMode)) {
            handlePlaceDamage(targetSelection.realm, targetSelection.id, attackerPower, opponentSide);
            logDamage(attacker, attackerPower, targetSelection);
            return { unblockedHacking };
        }

        // Handle unblocked damage based on attack mode
        unblockedHacking = handleUnblockedDamage(attackMode, attackerPower, side, battleRealm);

        // Log the damage
        logDamage(attacker, attackerPower);

        // Publish attack event
        eventManager.publish('unblockedAttack', {
            attacker,
            power: attackerPower,
            side,
            targetType: currentTargetType,
            battleRealm
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
                setPlayerSurge(prev => prev + power);
            } else {
                setEnemySurge(prev => prev + power);
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
    const targetSelection = side === 'PLAYER' ? playerTargetSelection : enemyTargetSelection;

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
    const updatedBattleSlots = playerBattleSlots.map(attacker => {
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
    setPlayerBattleSlots(updatedBattleSlots);

    let unblockedHacking = false;

    // Determine if only one attacker is present
    const attackers = updatedBattleSlots.filter(a => a !== null);
    const isSoloAttack = attackers.length === 1;

    // Proceed with the battle using the updated battle slots
    for (let i = 0; i < 6; i++) {
        const attacker = updatedBattleSlots[i];
        const defender = enemyBattleSlots[i] || null;

        if (attacker) {
            // Implement solo event dispatch here
            if (isSoloAttack && attacker.solo > 0) {
                applySoloEffect(attacker, battleRealm)
            }

            const attackResult = commitAttack(attacker, defender, 'PLAYER', playerTargetSelection, targetType);
            if (attackResult.unblockedHacking) {
                unblockedHacking = true;
            }
        }
    }

    if (unblockedHacking && attackMode === 'PLAYER_HACK') {
        setPlayerInterfaced(true);
        if (enemyTargetType === 'HEADSPACE') {
            setPlayerInterfacedHeadSpace(true);
        }
        if (enemyTargetType === 'PANDORA') {
            setPlayerInterfacedPandora(true);
        }
        eventManager.publish('successfulHack', {
            side: 'PLAYER',
            targetType: targetType,
            success: true,
        });
        handleAccessPhase('PLAYER');
    } else {
        eventManager.publish('failedHack', {
            side: 'PLAYER',
            targetType: targetType,
            success: false,
        });
    }

    handleEndOfBattle();
};

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
    setBattleRealm
};

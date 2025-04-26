const handleEnemyBattle = () => {
    // Update player's battle slots if necessary
    const updatedPlayerBattleSlots = playerBattleSlots.map(creature => {
        if (creature) {
            return {
                ...creature,
                steps: 1,
                readied: creature.timer <= 1 ? creature.readied : false
            };
        } else {
            return creature;
        }
    });
    setPlayerBattleSlots(updatedPlayerBattleSlots);

    let unblockedHacking = false;

    // Determine if only one attacker is present on the enemy side
    const enemyAttackers = enemyBattleSlots.filter(attacker => attacker !== null);
    const isEnemySoloAttack = enemyAttackers.length === 1;

    // Proceed with the battle using the enemy battle slots
    for (let i = 0; i < 6; i++) {
        const attacker = enemyBattleSlots[i];
        const defender = updatedPlayerBattleSlots[i] || null;

        if (attacker) {
            // Implement solo event dispatch for enemy attackers
            if (isEnemySoloAttack && attacker.solo > 0) {
                applySoloEffect(attacker, battleRealm)
            }

            const attackResult = commitAttack(attacker, defender, 'ENEMY', enemyTargetSelection, enemyTargetType);
            if (attackResult.unblockedHacking) {
                unblockedHacking = true;
            }
        }
    }

    if (unblockedHacking && attackMode === 'ENEMY_tech') {
        setEnemyInterfaced(true);
        if (enemyTargetType === 'HEADSPACE') {
            setEnemyInterfacedHeadSpace(true);
        }
        if (enemyTargetType === 'PANDORA') {
            setEnemyInterfacedPandora(true);
        }
        eventManager.publish('successfulHack', {
            side: 'ENEMY',
            targetType: enemyTargetType,
            success: true,
        });
        handleAccessPhase('ENEMY');
    } else {
        eventManager.publish('failedHack', {
            side: 'ENEMY',
            targetType: enemyTargetType,
            success: false,
        });
    }

    handleEndOfBattle();
};



function enemyPlanDefense() {
    // First, the enemy rezzes their cards
    enemyRezCards();

    // Map attackMode to aspect
    let aspect;
    if (attackMode === 'PLAYER_QUEST') {
        aspect = 'magi';
    } else if (attackMode === 'PLAYER_RAID') {
        aspect = 'phys';
    } else if (attackMode === 'PLAYER_HACK') {
        aspect = 'tech';
    }

    // Get the enemy realm corresponding to battleRealm
    let enemyRealm;
    switch (battleRealm) {
        case 'Solarium':
            enemyRealm = enemySolarium;
            break;
        case 'Theater':
            enemyRealm = enemyTheater;
            break;
        case 'Underpass':
            enemyRealm = enemyUnderpass;
            break;
        case 'Grid':
            enemyRealm = enemyGrid;
            break;
        default:
            console.error('Invalid battleRealm:', battleRealm);
            return;
    }

    // Get online entities in that realm matching the aspect, ignoring 'aggressive' creatures
    let availableDefenders = enemyRealm.people.filter(
        (creature) => creature.card[aspect] && creature.online && creature.readied && !creature.card.aggressive
    );

    // Identify player attackers
    const playerAttackers = playerBattleSlots.map((attacker, index) => ({
        attacker,
        index,
    })).filter(({ attacker }) => attacker !== null);

    // Limit the number of defenders to the number of attackers
    const maxDefendersNeeded = playerAttackers.length;

    // Separate attackers with and without Stealth
    const stealthyAttackers = playerAttackers.filter(
        ({ attacker }) => (attacker.stealth || 0) > 0
    );
    const normalAttackers = playerAttackers.filter(
        ({ attacker }) => (attacker.stealth || 0) === 0
    );

    // Prepare enemyBattleSlots
    const enemyDefenseSlots = Array(6).fill(null);

    // Defend against stealthy attackers with stealthy defenders
    const stealthyDefenders = availableDefenders.filter(
        (defender) => (defender.stealth || 0) > 0
    );

    for (const { attacker, index } of stealthyAttackers) {
        if (stealthyDefenders.length > 0) {
            const defender = stealthyDefenders.shift();

            // Update defender properties
            prepareDefenderForBattle(defender);

            // Remove defender from realm
            removeFromRealm(defender, defender.realm, 'ENEMY');

            // Place defender in the corresponding slot
            enemyDefenseSlots[index] = defender;

            // Remove from available defenders
            availableDefenders = availableDefenders.filter((d) => d.id !== defender.id);
        }
    }

    // Defend against normal attackers with any available defenders
    for (const { attacker, index } of normalAttackers) {
        if (availableDefenders.length > 0) {
            const defender = availableDefenders.shift();

            // Update defender properties
            prepareDefenderForBattle(defender);

            // Remove defender from realm
            removeFromRealm(defender, defender.realm, 'ENEMY');

            // Place defender in the corresponding slot
            enemyDefenseSlots[index] = defender;
        }
    }

    // Set enemyBattleSlots
    setEnemyBattleSlots(enemyDefenseSlots);

    // Proceed to handle the battle
    handlePlayerBattle();
}

function prepareDefenderForBattle(defender) {
    // Update defender properties as per your instruction
    if (defender.timer >= 2) {
        defender.readied = false;
    }
    defender.steps = 1;
}







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
        if (targetType === 'HEADSPACE') {
            setPlayerInterfacedHeadSpace(true);
        }
        if (targetType === 'PANDORA') {
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









function commitAttack(attacker, defender = null, side, target = null, targetType = null, slotIndex) { // todo1
    if (side === 'PLAYER' && playerFirstAttack) {
        eventManager.publish('firstAttack', { side: 'PLAYER' });
        setPlayerFirstAttack(false);
    } else if (side === 'ENEMY' && enemyFirstAttack) {
        eventManager.publish('firstAttack', { side: 'ENEMY' });
        setEnemyFirstAttack(false);
    }

    let attackerBasePower = attacker.card.power || 0;
    let attackerVengeance = attacker.statusEffects?.Vengeance || 0;
    let attackerPower = attackerBasePower + attackerVengeance;

    // Get attacker's Stealth value
    let attackerStealth = attacker.stealth || 0;

    let defenderPower = 0;
    let defenderStealth = 0;
    if (defender) {
        // Calculate defender's total power including Vengeance
        let defenderBasePower = defender.card.power || 0;
        let defenderVengeance = defender.statusEffects?.Vengeance || 0;
        defenderPower = defenderBasePower + defenderVengeance;

        // Get defender's Stealth value
        defenderStealth = defender.stealth || 0;
    }

    let unblockedHacking = false;
    let attackSuccessful = false;
    let damageDealt = 0;

    // Check if defender can block attacker based on Stealth
    const defenderCanBlock = defender
        ? attackerStealth <= 0 || defenderStealth > 0
        : false;

    if (defender && defenderCanBlock) {
        // Determine if attacker and defender have Pounce
        const attackerHasPounce = attacker.pounce > 0 || false;
        const defenderHasPounce = defender?.pounce > 0 || false;

        if (attackerHasPounce && !defenderHasPounce) {
            // Attacker deals damage first
            const damageDealtToDefender = handleDamage('BATTLE', defender.id, attackerPower, getOppositeSide(side));

            // Handle Override
            if (attacker.override > 0 && damageDealtToDefender.excessDamage > 0) {
                applyOverrideDamage(attacker, damageDealtToDefender.excessDamage, side, battleRealm);
            }

            // Check if defender survives
            const defenderSurvives = willEntitySurvive(defender, attackerPower);

            if (defenderSurvives) {
                const damageDealtToAttacker = handleDamage('BATTLE', attacker.id, defenderPower, side);

                // After defender deals damage, decrease defender's Stealth by 1 if damage was dealt
                if (defenderPower > 0) {
                    decreaseStealth(defender, getOppositeSide(side));
                    clearVengeance(defender, getOppositeSide(side));
                }
            }

            // After attacker deals damage, decrease attacker's Stealth by 1 if damage was dealt
            if (attackerPower > 0) {
                decreaseStealth(attacker, side);
                clearVengeance(attacker, side);
                attackSuccessful = damageDealtToDefender.damageDealt > 0;
                damageDealt = damageDealtToDefender.damageDealt;
            }

        } else if (!attackerHasPounce && defenderHasPounce) {
            // Defender deals damage first
            const damageDealtToAttacker = handleDamage('BATTLE', attacker.id, defenderPower, side);

            // Check if attacker survives
            const attackerSurvives = willEntitySurvive(attacker, defenderPower);

            if (attackerSurvives) {
                const damageDealtToDefender = handleDamage('BATTLE', defender.id, attackerPower, getOppositeSide(side));

                // Handle Override
                if (attacker.override > 0 && damageDealtToDefender.excessDamage > 0) {
                    applyOverrideDamage(attacker, damageDealtToDefender.excessDamage, side, battleRealm);
                }

                // After attacker deals damage, decrease attacker's Stealth by 1 if damage was dealt
                if (attackerPower > 0) {
                    decreaseStealth(attacker, side);
                    clearVengeance(attacker, side);
                    attackSuccessful = damageDealtToDefender.damageDealt > 0;
                    damageDealt = damageDealtToDefender.damageDealt;
                }
            }

            // After defender deals damage, decrease defender's Stealth by 1 if damage was dealt
            if (defenderPower > 0) {
                decreaseStealth(defender, getOppositeSide(side));
                clearVengeance(defender, getOppositeSide(side));
            }

        } else {
            // Both have Pounce or neither have Pounce; combat proceeds simultaneously
            const damageDealtToDefender = handleDamage('BATTLE', defender.id, attackerPower, getOppositeSide(side));
            const damageDealtToAttacker = handleDamage('BATTLE', attacker.id, defenderPower, side);

            // Handle Override
            if (attacker.override > 0 && damageDealtToDefender.excessDamage > 0) {
                applyOverrideDamage(attacker, damageDealtToDefender.excessDamage, side, battleRealm);
            }

            // After attacker deals damage, decrease attacker's Stealth by 1 if damage was dealt
            if (attackerPower > 0) {
                decreaseStealth(attacker, side);
                clearVengeance(attacker, side);
                attackSuccessful = damageDealtToDefender.damageDealt > 0;
                damageDealt = damageDealtToDefender.damageDealt;
            }

            // After defender deals damage, decrease defender's Stealth by 1 if damage was dealt
            if (defenderPower > 0) {
                decreaseStealth(defender, getOppositeSide(side));
                clearVengeance(defender, getOppositeSide(side));
            }
        }

    } else if (defender && !defenderCanBlock) {
        // Defender cannot block attacker due to Stealth
        console.log(
            `${defender.card.name} cannot block ${attacker.card.name} due to Stealth.`
        );

        // The attack is unblocked; handle unblocked damage
        handleUnblockedAttack(attacker, side, slotIndex);
        unblockedHacking = true;
        // Decrease attacker's Stealth by 1 if damage was dealt
        if (attackerPower > 0) {
            decreaseStealth(attacker, side);
            clearVengeance(attacker, side);
            attackSuccessful = true;
            damageDealt = attackerPower;
        }
    } else if (!defender) {
        // No defender; handle unblocked attack
        handleUnblockedAttack(attacker, side, slotIndex);
        unblockedHacking = true;
        // Decrease attacker's Stealth by 1 if damage was dealt
        if (attackerPower > 0) {
            decreaseStealth(attacker, side);
            clearVengeance(attacker, side);
            attackSuccessful = true;
            damageDealt = attackerPower;
        }
    }

    // Publish the event if the attack was successful
    if (attackSuccessful) {
        const eventData = {
            attackerId: attacker.id,
            side: side,
            targetType: targetType || 'ENTITY',
            damageDealt: damageDealt,
            type: attackMode,
        };
        eventManager.publish('attackSuccessful', eventData);
        unblockedHacking = true;
    }

    setAttackMode('NONE');
    return { unblockedHacking };
}



function handleUnblockedAttack(attacker, side, slotIndex) {
    const attackerPower = (attacker.power || 0) + (attacker.statusEffects?.Vengeance || 0);
    const opponentSide = getOppositeSide(side);
    let unblockedHacking = false;

    // Determine the target selection and type based on the side
    const targetSelection = side === 'PLAYER' ? playerTargetSelection : enemyTargetSelection;
    const thisTargetType = side === 'PLAYER' ? targetType : enemyTargetType;

    // Check if a Place is being targeted during a raid
    if (
        attackMode === 'PLAYER_RAID' &&
        targetSelection &&
        (targetSelection.card.category === 'LOCATION' || targetSelection.card.category === 'LANDMARK')
    ) {
        // Player is attacking an enemy Place during a raid
        handlePlaceDamage(targetSelection.realm, targetSelection.id, attackerPower, opponentSide);
        console.log(`${attacker.card.name} deals ${attackerPower} damage to ${targetSelection.card.name}.`);
    } else if (
        attackMode === 'ENEMY_RAID' &&
        targetSelection &&
        (targetSelection.card.category === 'LOCATION' || targetSelection.card.category === 'LANDMARK')
    ) {
        // Enemy is attacking a player's Place during a raid
        handlePlaceDamage(targetSelection.realm, targetSelection.id, attackerPower, opponentSide);
        console.log(`${attacker.card.name} deals ${attackerPower} damage to ${targetSelection.card.name}.`);
    } else {
        // Apply damage based on the battle realm and attack mode
        switch (attackMode) {
            case 'ENEMY_phys':
                if (['Underpass', 'Grid'].includes(battleRealm)) {
                    playerGainWounds(attackerPower);
                } else if (['Theater', 'Solarium'].includes(battleRealm)) {
                    playerGainBurden(attackerPower);
                }
                break;
            case 'PLAYER_RAID':
                if (['Underpass', 'Grid'].includes(battleRealm)) {
                    enemyGainWounds(attackerPower);
                } else if (['Theater', 'Solarium'].includes(battleRealm)) {
                    enemyGainBurden(attackerPower);
                }
                break;
            case 'ENEMY_magi':
                enemyGainFate(attackerPower);
                break;
            case 'PLAYER_QUEST':
                playerGainFate(attackerPower);
                break;
            case 'ENEMY_tech':
                if (attackerPower > 0) {
                    unblockedHacking = true;
                    setEnemySurge(prevSurge => prevSurge + attackerPower);
                }
                break;
            case 'PLAYER_HACK':
                if (attackerPower > 0) {
                    unblockedHacking = true;
                    setPlayerSurge(prevSurge => prevSurge + attackerPower);
                }
                break;
            default:
                console.error('Invalid attack mode:', attackMode);
                break;
        }

        console.log(`${attacker.card.name} deals ${attackerPower} unblocked damage.`);
    }
}







const handleEndOfBattle = () => {
    console.log('____________________end of battle')
    setBattleRealm(null);
    // Use React state to get the most up-to-date battle slots
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

    setGameState('ATTACK_RESOLVED');
    setEnemyTargetSelection(null);
    setEnemyTargetType('none');
};

const handleConfirmDefenseSelection = () => {
    handleEnemyBattle()
};


function applyOverrideDamage(attacker, excessDamage, side, currentRealm) {
    const opponentSide = getOppositeSide(side);

    // Determine the target selection and type based on the side
    const targetSelection = side === 'PLAYER' ? playerTargetSelection : enemyTargetSelection;
    const targetTypeVar = side === 'PLAYER' ? targetType : enemyTargetType;

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

export const abilitiesDefinitions = {
    'Extortion': {
        name: 'Extortion',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            const countEntities = () => {
                let count = 0;
                const realms = ['playerSolarium', 'enemySolarium', 'playerTheater', 'enemyTheater', 'playerUnderpass', 'enemyUnderpass', 'playerGrid', 'enemyGrid'];
                realms.forEach(realmName => {
                    const realm = gameState[realmName];
                    if (realm) {
                        count += realm.people.length;
                    }
                });
                return count;
            };

            const totalEntities = countEntities();
            const bitsToGain = totalEntities * 2;
            if (side === 'PLAYER') {
                playerGainBits(bitsToGain);
            } else {
                enemyGainBits(bitsToGain);
            }
            console.log(`${side} gains ${bitsToGain} Bits from Extortion.`);
        }
    },
    'SplinterFactionAscend': {
        name: "SplinterFactionAscend",
        type: "onAscend",
        onAscend: function (entity, gameState, side) {
            const enemySide = side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
    
            // Get enemy realms
            const enemyRealms = enemySide === 'PLAYER'
                ? [
                    { realm: playerSolarium, setRealm: setPlayerSolarium },
                    { realm: playerTheater, setRealm: setPlayerTheater },
                    { realm: playerUnderpass, setRealm: setPlayerUnderpass },
                    { realm: playerGrid, setRealm: setPlayerGrid },
                ]
                : [
                    { realm: enemySolarium, setRealm: setEnemySolarium },
                    { realm: enemyTheater, setRealm: setEnemyTheater },
                    { realm: enemyUnderpass, setRealm: setEnemyUnderpass },
                    { realm: enemyGrid, setRealm: setEnemyGrid },
                ];
    
            // Collect all entities (people) in the enemy's realms
            const enemyEntities = enemyRealms.flatMap(({ realm }) => realm.people);
    
            // Apply damage to each entity
            enemyEntities.forEach((enemyEntity) => {
                handleDamage(enemyEntity.realm, enemyEntity.id, 2, enemySide);
            });
    
            console.log(`${entity.card.name} dealt 2 damage to all enemy entities.`);
        },
    },
    'ForgottenIslandAscend': {
        name: "ForgottenIslandAscend",
        type: "onAscend",
        onAscend: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                playerGainBits(10);
            } else {
                enemyGainBits(10);
            }
            console.log(`${entity.card.name} grants 10 Bits to ${side}.`);
        },
    },
    'Wasteland': {
        name: "Wasteland",
        type: "triggered",
        triggers: ["cardStolen", "placeDestroyed"],
        eventHandler: function (entity, eventData, gameState, side) {
            if (
                (eventData.card && eventData.card.id === entity.id) ||
                (eventData.entityId && eventData.entityId === entity.id)
            ) {
                const opponentSide = side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
                if (opponentSide === 'PLAYER') {
                    playerGainWounds(1);
                } else {
                    enemyGainWounds(1);
                }
                console.log(`${entity.card.name} inflicted 1 Wound to ${opponentSide}.`);
            }
        },
    },
    'CatCafeAscended': {
        name: "CatCafeAscended",
        type: "ascended",
        typeCategory: "triggered", // Indicates it's a triggered ability
        triggers: ["turnStart"], // List of events it listens to
        eventHandler: function (entity, eventData, gameState, side) {
            console.log('_____________________-cat cafe')
            if (eventData.side === side && entity.realm === 'Elysium') {
                if (side === 'PLAYER') {
                    enemyGainOverload(3);
                } else {
                    playerGainOverload(3);
                }
                console.log(`${entity.card.name} has inflicted 3 Overload to ${side}.`);
            }
        },
    },
    'AdrenochromeAscend': {
        name: 'AdrenochromeAscend',
        type: 'onAscend',
        onAscend: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                playerGainActions(2);
                playerGainAshes(3);
                playerGainOverload(4);
            } else {
                enemyGainActions(2);
                enemyGainAshes(3);
                enemyGainOverload(4);
            }
            console.log(`${entity.card.name} has granted 2 Actions, 3 Ash, and 4 Overload to ${side}.`);
        },
    },
    'ImplantsEffect': {
        name: 'ImplantsEffect',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            // Grant +2 Surge and +2 Ash
            if (side === 'PLAYER') {
                playerGainSurge(2);
                playerGainAshes(2);
            } else {
                enemyGainSurge(2);
                enemyGainAshes(2);
            }

            // Search Pandora for JAWbreaker entities
            const pandora = side === 'PLAYER' ? playerLibrary : enemyLibrary; // Ensure these state variables exist
            //console.log(pandora)
            const jawbreakerEntities = pandora.filter(entity =>
                entity.card.subTypes?.includes('JAWbreaker')
            );
            console.log(jawbreakerEntities)
            if (jawbreakerEntities.length > 0) {
                showModal({
                    title: 'Search Pandora',
                    message: 'Select a JAWbreaker to draw:',
                    renderContent: () => (
                        <div>
                            <ul>
                                {jawbreakerEntities.map(jb => (
                                    <li
                                        key={jb.id}
                                        onClick={() => {
                                            drawSpecificCard(jb, side);
                                            setModalVisible(false);
                                        }}
                                        style={{ cursor: 'pointer', marginBottom: '5px' }}
                                    >
                                        {jb.card.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ),
                    onConfirm: setModalVisible(false),
                    onCancel: setModalVisible(false),
                });
            } else {
                // No valid JAWbreaker found, proceed without drawing
                console.log('No JAWbreaker entities found in Pandora.');
            }
        },
    },
    'ExploitEffect': {
        name: 'ExploitEffect',
        type: 'onPlay',
        condition: 'successfulHack',
        requiresTarget: true,
        targetFilter: (target) =>
            target.card.subTypes?.includes('JAWbreaker') &&
            target.owner === 'PLAYER' &&
            target.online,
        onPlay: function (entity, gameState, side, target) {
            const hasHacked = side === 'PLAYER' ? playerInterfaced : enemyInterfaced;
            if (hasHacked && target) {
                applyEffect(target.id, target.realm, side, {
                    type: 'stat',
                    field: 'power',
                    value: 2,
                });
                applyEffect(target.id, target.realm, side, {
                    type: 'stat',
                    field: 'HP',
                    value: 2,
                });
                applyEffect(target.id, target.realm, side, {
                    type: 'status',
                    status: 'Stealth',
                    amount: 1,
                });
            }
        },
    },
    'Duplicate': {
        name: 'Duplicate',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            const duplicateAbility = entity.card.abilities.find(
                (ability) => ability.name === 'Duplicate'
            );
            const duplicateAmount = duplicateAbility?.amount || 1;

            if (duplicateAmount >= 1) {
                const newCardEntity = { //todo1
                    ...entity,
                    id: `z${Math.random()}`,
                    realm: 'HEADSPACE',
                    owner: side,
                    card: {
                        ...entity.card,
                        abilities: entity.card.abilities.map((ability) => {
                            if (ability.name === 'Duplicate') {
                                return { ...ability, amount: duplicateAmount - 1 };
                            }
                            return ability;
                        }),
                    },
                };

                if (side === 'PLAYER') {
                    setPlayerHand((prevHeadSpace) => [...prevHeadSpace, newCardEntity]);
                } else {
                    setEnemyHand((prevHeadSpace) => [...prevHeadSpace, newCardEntity]);
                }
            }
        },
    },
    // 'MultiThreadingEffect': {
    //     name: 'MultiThreadingEffect',
    //     type: 'onPlay',
    //     requiresTarget: true,
    //     onPlay: function (entity, gameState, side, target) {
    //         console.log('MultiThreadingEffect', target)
    //         if (side === 'PLAYER') {
    //             playerDraw(2);
    //         } else {
    //             enemyDraw(2);
    //         }

    //         if (target && target.owner === side) {
    //             applyBoost(target, 1, side);
    //         }

    //         setAttackMode(side === 'PLAYER' ? 'PLAYER_HACK' : 'ENEMY_tech');
    //     },
    // },
    MultiThreadingEffect: {
        type: 'onPlay',
        requiresTarget: true,
        onPlay: function (entity, gameState, side, target) {
            console.log('MultiThreadingEffect', target);
            if (side === 'PLAYER') {
                playerDraw(2);
                if (target) {
                    applyBoost(target, 1, side);
                    setTargetSelection({
                        enabled: true,
                        side: side,
                        filter: (t) => t.owner === getOppositeSide(side),
                        onSelect: (hackTarget) => {
                            applyHack(hackTarget);
                            setTargetSelection({ enabled: false });
                        },
                        onCancel: () => {
                            setTargetSelection({ enabled: false });
                        },
                    });
                }
            } else {
                enemyDraw(2);
                if (target) {
                    applyBoost(target, 1, side);
                    // AI logic for hack target
                }
            }
        }
    },
    'ForgeryEffect': {
        name: 'ForgeryEffect',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            if (side === 'PLAYER' && playerInterfacedHeadSpace) {
                playerGainBits(10);
                const CatPhishCard = cardList.find(card => card.name === 'CatPhish');

                if (CatPhishCard) {
                    const newCatPhishEntity = {
                        id: `z${Math.random()}`,
                        card: CatPhishCard,
                        power: CatPhishCard.power || 0,
                        HP: CatPhishCard.HP || 0,
                        damage: 0,
                        exposed: false,
                        scored: false,
                        online: false,
                        readied: false,
                        steps: 0,
                        freeze: 0,
                        decay: 0,
                        venom: 0,
                        charge: CatPhishCard.charge || 0,
                        sacrificed: false,
                        cosmic: CatPhishCard.cosmic || 1,
                        deathless: CatPhishCard.deathless || 0, //todo1
                        pounce: CatPhishCard.pounce || 0,
                        override: CatPhishCard.override || 0,
                        stealth: CatPhishCard.stealth || 0,
                        armored: CatPhishCard.armored || 0,
                        development: CatPhishCard.development || 0,
                        plot: CatPhishCard.plot || 0,
                        owner: 'ENEMY',
                    };
                    setEnemyUnderpass(prevRealm => ({
                        ...prevRealm,
                        people: [...prevRealm.people, newCatPhishEntity],
                    }));
                } else {
                    console.error('CatPhish card not found in the library.');
                }
            } else if (side === 'ENEMY' && enemyInterfacedHeadSpace) {
                enemyGainBits(10);
                const CatPhishCard = cardList.find(card => card.name === 'CatPhish');

                if (CatPhishCard) {
                    const newCatPhishEntity = {
                        id: `z${Math.random()}`,
                        card: CatPhishCard,
                        power: CatPhishCard.power || 0,
                        HP: CatPhishCard.HP || 0,
                        damage: 0,
                        exposed: false,
                        scored: false,
                        online: false,
                        readied: false,
                        steps: 0,
                        freeze: 0,
                        decay: 0,
                        venom: 0,
                        charge: CatPhishCard.charge || 0,
                        sacrificed: false,
                        cosmic: CatPhishCard.cosmic || 1,
                        deathless: CatPhishCard.deathless || 0,
                        pounce: CatPhishCard.pounce || 0,
                        override: CatPhishCard.override || 0,
                        stealth: CatPhishCard.stealth || 0,
                        armored: CatPhishCard.armored || 0,
                        development: CatPhishCard.development || 0,
                        plot: CatPhishCard.plot || 0,
                        owner: 'ENEMY',
                    };
                    setPlayerUnderpass(prevRealm => ({
                        ...prevRealm,
                        people: [...prevRealm.people, newCatPhishEntity],
                    }));
                } else {
                    console.error('CatPhish card not found in the library.');
                }
            }
        },
    },
    'GainAshAndOverload': {
        name: 'GainAshAndOverload',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            // Gain 6 Ash
            if (side === 'PLAYER') {
                playerGainAshes(6);
            } else {
                enemyGainAshes(6);
            }

            // Gain 3 Overload
            if (side === 'PLAYER') {
                setPlayerOverload(prevOverload => prevOverload + 3);
            } else {
                setEnemyOverload(prevOverload => prevOverload + 3);
            }
        },
    },
    'BrainFreezeHackPandora': {
        name: 'BrainFreezeHackPandora',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            // Set up a one-time listener for successfulHack and failedHack events
            const handler = (eventData) => {
                if (eventData.side === side && eventData.targetType === 'PANDORA') {
                    if (eventData.success) {
                        // Apply Freeze 3 to all entities
                        applyFreezeToAllEntities(3);
                    }
                    // Unsubscribe the handler
                    eventManager.unsubscribe('successfulHack', handler);
                    eventManager.unsubscribe('failedHack', handler);
                }
            };

            eventManager.subscribe('successfulHack', handler);
            eventManager.subscribe('failedHack', handler);

            // Initiate hack attack mode targeting Pandora
            setAttackMode('PLAYER_HACK');
            setTargetType('PANDORA');
            setSelectedRealm('Grid'); // Only Grid can perform the hack
        },
    },
    'ImitationGameInflictOverload': {
        name: 'ImitationGameInflictOverload',
        type: 'manual',
        execute: function (entity, effect, side) {
            const overloadAmount = effect.overloadAmount || 3;
            const opposingSide = getOppositeSide(side);
            applyOverload(opposingSide, overloadAmount);
            console.log(`${entity.card.name} inflicts ${overloadAmount} Overload to ${opposingSide}.`);
        },
    },
    'DataBombWhenInterfaced': {
        name: 'DataBombWhenInterfaced',
        type: 'triggered',
        triggers: ['snipAccessed'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Check if the accessed card is this entity
            if (eventData.cardId !== entity.id) {
                return; // Not the correct card
            }

            // Calculate Overload amount
            const overloadAmount = (entity.development || 0) * 2;

            // Apply Overload to the opposing side
            const opposingSide = getOppositeSide(side);
            applyOverload(opposingSide, overloadAmount);

            console.log(`${entity.card.name} inflicts ${overloadAmount} Overload to ${opposingSide} when interfaced.`);
        },
    },
    'DataBombSacrificeForFreeze': {
        name: 'DataBombSacrificeForFreeze',
        type: 'manual',
        requiresTarget: true,
        execute: function (entity, effect, side, target) {
            if (entity.scheming && !entity.schemeUnlocked) {
                console.log(`${entity.card.name}'s Scheme ability is not yet unlocked.`);
                return;
            }
            if (target) {
                handleDestroyedThing(entity.realm, entity.id, side);
                applyEffect(target.id, target.realm, getOppositeSide(side), {
                    type: 'status',
                    status: 'Freeze',
                    amount: effect.freezeAmount,
                });
                console.log(`${target.card.name} gains Freeze ${effect.freezeAmount} from ${entity.card.name}.`);
            } else {
                console.log('No target selected for Data Bomb\'s ability.');
            }
        },
    },
    'PandoraAccess': {
        name: 'PandoraAccess',
        type: 'static',
        applyEffect: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                setPlayerPandoraAccess(prev => prev + 1);
            } else {
                setEnemyPandoraAccess(prev => prev + 1);
            }
            console.log(`${entity.card.name} increases Pandora Access by 1.`);
        },
        removeEffect: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                setPlayerPandoraAccess(prev => prev - 1);
            } else {
                setEnemyPandoraAccess(prev => prev - 1);
            }
            console.log(`${entity.card.name} decreases Pandora Access by 1.`);
        },
    },
    'Drift': {
        name: 'Drift',
        type: 'static',
        applyEffect: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                setPlayerDriftCount(prev => prev + 1);
            } else {
                setEnemyDriftCount(prev => prev + 1);
            }
            console.log(`${entity.card.name} increases Drift count by 1.`);
        },
        removeEffect: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                setPlayerDriftCount(prev => prev - 1);
            } else {
                setEnemyDriftCount(prev => prev - 1);
            }
            console.log(`${entity.card.name} decreases Drift count by 1.`);
        },
    },
    'Dividend': (amount) => ({
        name: 'Dividend',
        type: 'static',
        applyEffect: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                setPlayerDividendAmount(prev => prev + amount);
            } else {
                setEnemyDividendAmount(prev => prev + amount);
            }
            console.log(`${entity.card.name} increases Dividend count.`);
        },
        removeEffect: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                setPlayerDividendAmount(prev => prev - amount);
            } else {
                setEnemyDividendAmount(prev => prev - amount);
            }
            console.log(`${entity.card.name} decreases Dividend count.`);
        },
    }),
    'GainActionsOnPandoraInterface': {
        name: 'GainActionsOnPandoraInterface',
        type: 'triggered',
        triggers: ['successfulHack'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (entity.scheming && !entity.schemeUnlocked) {
                return;
            }
            if (eventData.side === side && eventData.targetType === 'PANDORA') {
                if (!entity.abilityActivated) {
                    const amount = entity.card.abilities.find(ability => ability.name === 'GainActionsOnPandoraInterface').effect.amount || 3;
                    if (side === 'PLAYER') {
                        setPlayerActions(prevActions => prevActions + amount);
                    } else {
                        setEnemyActions(prevActions => prevActions + amount);
                    }
                    console.log(`${entity.card.name} grants ${amount} Actions upon interfacing with Pandora.`);
                    entity.abilityActivated = true;
                }
            }
        },
    },
    'GainSurgeAndAshOnPlaceDestroyed': {
        name: 'GainSurgeAndAshOnPlaceDestroyed',
        type: 'triggered',
        triggers: ['placeDestroyed'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.entityId !== entity.id && eventData.side !== side) {
                if (side === 'PLAYER') {
                    playerGainSurge(3);
                    playerGainAshes(3);
                } else {
                    enemyGainSurge(3);
                    enemyGainAshes(3);
                }
                console.log(`${entity.name} gains +3 Surge and +3 Ash because another Place was destroyed.`);
            }
        },
    },
    'DamageTargetPlace': {
        name: 'DamageTargetPlace',
        type: 'manual',
        execute: function (entity, effect, side, target) {
            if (!target || !(target.card.category === 'LOCATION' || target.card.category === 'LANDMARK')) {
                console.log('No valid target Place provided for DamageTargetPlace ability.');
                return;
            }
            if (side === 'PLAYER') {
                if (playerActions < 2) {
                    console.log('Not enough actions to activate this ability.');
                    return;
                }
                setPlayerActions(prev => prev - 2);
            } else {
                if (enemyActions < 2) {
                    console.log('Not enough actions to activate this ability.');
                    return;
                }
                setEnemyActions(prev => prev - 2);
            }
            handlePlaceDamage(target.realm, target.id, effect.damageAmount, getOppositeSide(side));

            console.log(`${entity.name} deals ${effect.damageAmount} damage to ${target.card.name}.`);
        },
    },
    'GainResourcesOnInterface': {
        name: 'GainResourcesOnInterface',
        type: 'triggered',
        triggers: ['successfulHack'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side && eventData.targetType === 'HEADSPACE') {
                if (side === 'PLAYER') {
                    setPlayerBits(prevBits => prevBits + 2);
                    playerGainAshes(2);
                } else {
                    setEnemyBits(prevBits => prevBits + 2);
                    enemyGainAshes(2);
                }

                console.log(`${entity.card.name} grants +2 Bits and +2 Ash upon interfacing with HeadSpace.`);
            }
        },
    },
    'Solo': {
        name: 'Solo',
        type: 'triggered',
        triggers: ['soloAttack'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.entityId === entity.id) {
                const soloLevel = entity.card.abilities.find(a => a.name === 'Solo').amount || 1;

                // Apply Solo effects
                // Increase power and HP by +1 per level
                entity.currentPower = (entity.power || entity.card.power || 0) + soloLevel;
                entity.HP = (entity.HP || entity.card.HP || 0) + soloLevel;

                // Apply Boost per level
                applyBoost(entity, soloLevel, side);

                // Update the entity in its realm or battle slot
                updateEntityInRealm(entity, side);

                console.log(`${entity.card.name} gains Solo effects: +${soloLevel} Power, +${soloLevel} HP, +${soloLevel} Boost.`);
            }
        },
    },
    'GainStealth': {
        name: 'GainStealth',
        type: 'manual',
        execute: function (entity, effect, side) {
            // Use grantAbility to give Stealth to the entity
            const amount = effect.amount || 1;
            grantAbility(entity, 'stealth', amount, side);
            console.log(`${entity.card.name} gains Stealth (${amount}).`);
        },
    },
    'DestroyTargetWithVenom': {
        name: 'DestroyTargetWithVenom',
        type: 'manual',
        requiresTarget: true,
        targetFilter: function (target, entity) {
            // Only Online enemy entities with HP less than Leviathan's Venom
            const targetHP = target.card.HP - (target.wounds || 0);
            const leviathanVenom = entity.venom || 0;
            return (
                target.owner !== entity.owner &&
                target.online &&
                targetHP < leviathanVenom
            );
        },
        execute: function (entity, effect, side, target) {
            // Exhaust Leviathan
            exhaustEntity(entity, side);

            // Destroy the target
            handleDeadCard(target.realm, target.id, getOppositeSide(side));

            console.log(`${entity.card.name} destroys ${target.card.name} using Venom (${entity.venom}).`);
        }
    },
    'GainVenomOnInterface': {
        name: 'GainVenomOnInterface',
        type: 'triggered',
        triggers: ['successfulHack'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side && eventData.targetType === 'HEADSPACE') {
                // Increase Leviathan's Venom by 3
                const venomIncrease = 3;
                entity.venom = (entity.venom || 0) + venomIncrease;

                // Update the entity in its realm
                updateEntityInRealm(entity, side);

                console.log(`${entity.card.name} gains ${venomIncrease} Venom (Total Venom: ${entity.venom}).`);
            }
        },
    },
    'GainAshOnSteal': {
        name: 'GainAshOnSteal',
        type: 'triggered',
        triggers: ['cardStolen'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Only trigger if the enemy card was stolen
            if (eventData.side === side) {
                const amount = entity.card.abilities.find((a) => a.name === 'GainAshOnSteal').amount || 3;
                if (side === 'PLAYER') {
                    playerGainAshes(amount);
                } else {
                    enemyGainAshes(amount);
                }
                console.log(`${entity.card.name} gains ${amount} Ash because an enemy card was stolen.`);
            }
        },
    },
    'Crusade': {
        name: 'Crusade',
        type: 'triggered',
        triggers: ['firstAttack'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side) {
                // Grant 1 bonus action
                if (side === 'PLAYER') {
                    playerGainActions(1);
                } else {
                    enemyGainActions(1);
                }
                console.log(`${entity.card.name} triggers Crusade, granting 1 bonus action.`);
            }
        },
    },
    'BoostAllAllies': {
        name: 'BoostAllAllies',
        type: 'manual',
        execute: function (entity, effect, side) {
            // Check if the entity is already exhausted
            if (entity.exhausted) {
                console.log(`${entity.card.name} is already exhausted and cannot activate this ability.`);
                return;
            }

            // Exhaust the entity
            exhaustEntity(entity, side);

            // Apply Boost 2 to all friendly entities in the same realm
            const realmName = entity.realm;
            const [realm, setRealm] = getRealmAndSetter(realmName, side);

            const boostAmount = effect.boostAmount || 2; // Default to 2 if not specified

            realm.people.forEach((e) => {
                if (e.id !== entity.id) {
                    // Apply Boost
                    applyBoost(e, boostAmount, side);
                    console.log(`${e.card.name} gains Boost ${boostAmount} from ${entity.card.name}.`);
                }
            });

            console.log(`${entity.card.name} is exhausted to boost all friendly entities in ${realmName}.`);
        },
    },
    'Inspire': {
        name: 'Inspire',
        type: 'static',
        applyEffect: function (entity, gameState, side) {
            const isLocal = entity.card.abilities.includes('Locality');
            const targets = getFriendlyEntities(side, isLocal ? entity.realm : null).filter(
                e => e.id !== entity.id && e.online
            );

            // Group targets by realm to minimize state updates
            const targetsByRealm = targets.reduce((acc, target) => {
                if (!acc[target.realm]) {
                    acc[target.realm] = [];
                }
                acc[target.realm].push(target);
                return acc;
            }, {});

            // Get realm setters dynamically
            const realmSetters = {
                'PLAYER': {
                    'Solarium': setPlayerSolarium,
                    'Theater': setPlayerTheater,
                    'Underpass': setPlayerUnderpass,
                    'Grid': setPlayerGrid
                },
                'ENEMY': {
                    'Solarium': setEnemySolarium,
                    'Theater': setEnemyTheater,
                    'Underpass': setEnemyUnderpass,
                    'Grid': setEnemyGrid
                }
            };

            // Update each realm with inspired targets
            Object.entries(targetsByRealm).forEach(([realmName, realmTargets]) => {
                const setRealm = realmSetters[side][realmName];

                setRealm(prevRealm => ({
                    ...prevRealm,
                    people: prevRealm.people.map(person => {
                        const target = realmTargets.find(t => t.id === person.id);
                        if (target) {
                            return {
                                ...person,
                                power: (person.power || person.card.power || 0) + 1
                            };
                        }
                        return person;
                    })
                }));
            });
        },
        removeEffect: function (entity, gameState, side) {
            const isLocal = entity.card.abilities.includes('Locality');
            const targets = getFriendlyEntities(side, isLocal ? entity.realm : null).filter(
                e => e.id !== entity.id && e.online
            );

            // Group targets by realm to minimize state updates
            const targetsByRealm = targets.reduce((acc, target) => {
                if (!acc[target.realm]) {
                    acc[target.realm] = [];
                }
                acc[target.realm].push(target);
                return acc;
            }, {});

            // Get realm setters dynamically
            const realmSetters = {
                'PLAYER': {
                    'Solarium': setPlayerSolarium,
                    'Theater': setPlayerTheater,
                    'Underpass': setPlayerUnderpass,
                    'Grid': setPlayerGrid
                },
                'ENEMY': {
                    'Solarium': setEnemySolarium,
                    'Theater': setEnemyTheater,
                    'Underpass': setEnemyUnderpass,
                    'Grid': setEnemyGrid
                }
            };

            // Restore original power for each realm's targets
            Object.entries(targetsByRealm).forEach(([realmName, realmTargets]) => {
                const setRealm = realmSetters[side][realmName];

                setRealm(prevRealm => ({
                    ...prevRealm,
                    people: prevRealm.people.map(person => {
                        const target = realmTargets.find(t => t.id === person.id);
                        if (target) {
                            return {
                                ...person,
                                power: (person.power || person.card.power || 0) - 1
                            };
                        }
                        return person;
                    })
                }));
            });
        },
    },
    'Rotten': {
        name: 'Rotten',
        type: 'static',
        applyEffect: function (entity, gameState, side) {
            const enemySide = side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
            const enemyRealms = enemySide === 'PLAYER'
                ? [
                    { realm: playerSolarium, setRealm: setPlayerSolarium, name: 'Solarium' },
                    { realm: playerTheater, setRealm: setPlayerTheater, name: 'Theater' },
                    { realm: playerUnderpass, setRealm: setPlayerUnderpass, name: 'Underpass' },
                    { realm: playerGrid, setRealm: setPlayerGrid, name: 'Grid' },
                ]
                : [
                    { realm: enemySolarium, setRealm: setEnemySolarium, name: 'Solarium' },
                    { realm: enemyTheater, setRealm: setEnemyTheater, name: 'Theater' },
                    { realm: enemyUnderpass, setRealm: setEnemyUnderpass, name: 'Underpass' },
                    { realm: enemyGrid, setRealm: setEnemyGrid, name: 'Grid' },
                ];

            enemyRealms.forEach(({ realm, setRealm, name }) => {
                // Create a new array of updated entities
                const updatedPeople = realm.people.map((enemyEntity) => {
                    // Create a deep copy of the entity
                    const effect = {
                        type: 'stat',
                        field: 'power',
                        value: -1,
                    };

                    // Apply effect directly to the entity
                    const newEntity = { ...enemyEntity };
                    newEntity.power = (newEntity.power || newEntity.card.power || 0) - 1;

                    return newEntity;
                });

                // Update the realm with the new entities
                setRealm(prevRealm => ({
                    ...prevRealm,
                    people: updatedPeople
                }));
            });
        },
        removeEffect: function (entity, gameState, side) {
            const enemySide = side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
            const enemyRealms = enemySide === 'PLAYER'
                ? [
                    { realm: playerSolarium, setRealm: setPlayerSolarium, name: 'Solarium' },
                    { realm: playerTheater, setRealm: setPlayerTheater, name: 'Theater' },
                    { realm: playerUnderpass, setRealm: setPlayerUnderpass, name: 'Underpass' },
                    { realm: playerGrid, setRealm: setPlayerGrid, name: 'Grid' },
                ]
                : [
                    { realm: enemySolarium, setRealm: setEnemySolarium, name: 'Solarium' },
                    { realm: enemyTheater, setRealm: setEnemyTheater, name: 'Theater' },
                    { realm: enemyUnderpass, setRealm: setEnemyUnderpass, name: 'Underpass' },
                    { realm: enemyGrid, setRealm: setEnemyGrid, name: 'Grid' },
                ];

            enemyRealms.forEach(({ realm, setRealm, name }) => {
                // Create a new array of updated entities
                const updatedPeople = realm.people.map((enemyEntity) => {
                    // Create a deep copy of the entity
                    const newEntity = { ...enemyEntity };

                    // Restore power to its original value (card power)
                    newEntity.power = (newEntity.power || newEntity.card.power || 0) + 1;

                    return newEntity;
                });

                // Update the realm with the new entities
                setRealm(prevRealm => ({
                    ...prevRealm,
                    people: updatedPeople
                }));
            });
        }
    },
    'FleshHive': {
        name: 'FleshHive',
        type: 'triggered',
        triggers: ['entityDied'],
        eventHandler: function (entity, eventData, gameState, side) {
            const { deadEntity, deadSide } = eventData;
            if (deadEntity.card.abilities.includes('Decay')) {
                if (side === 'PLAYER') {
                    gameState.playerGainFate(1);
                    gameState.playerGainOverload(2);
                } else {
                    gameState.enemyGainFate(1);
                    gameState.enemyGainOverload(2);
                }
            }
        },
    },
    'DominanceGainCharge': {
        name: 'DominanceGainCharge',
        type: 'triggered',
        triggers: ['dominationResolved'],
        eventHandler: function (entity, eventData, gameState, side) {
            console.log('gain charge')
            if (eventData.winner === side) {
                entity.charge = (entity.charge || 0) + 1;
                console.log(`${entity.card.name} gains 1 Charge (total: ${entity.charge})`);
                updateCardInRealm(entity, side);
            }
        },
    },
    'DominanceInflictFreeze': {
        name: 'DominanceInflictFreeze',
        type: 'triggered',
        triggers: ['dominationResolved'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.winner === side) {
                // Inflict Freeze 1 on enemy entities
                const isLocal = entity.card.abilities.includes('Locality');
                const targets = getEnemyEntities(side, isLocal ? entity.realm : null).filter(e => e.online);
                targets.forEach(target => {
                    applyEffect(target, {
                        type: 'status',
                        status: 'Freeze',
                        amount: 1,
                    });
                    console.log(`${target.card.name} is Frozen by ${entity.card.name}`);
                });
            }
        }
    },
    'DominanceInflictBurden': {
        name: 'DominanceInflictBurden',
        type: 'triggered',
        triggers: ['dominationResolved'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.winner === side) {
                // Inflict 3 Burden on opponent
                if (side === 'PLAYER') {
                    setEnemyBurden(prev => prev + 3);
                    console.log('Enemy gains 3 Burden due to Dread\'s Dominance effect.');
                } else {
                    setPlayerBurden(prev => prev + 3);
                    console.log('Player gains 3 Burden due to Dread\'s Dominance effect.');
                }
            }
        },
    },
    'SurrenderGainBurden': {
        name: 'SurrenderGainBurden',
        type: 'triggered',
        triggers: ['dominationResolved'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.winner !== side && eventData.winner !== null) {
                // Gain 3 Burden
                if (side === 'PLAYER') {
                    setPlayerBurden(prev => prev + 3);
                    console.log('Player gains 3 Burden due to Dread\'s Surrender effect.');
                } else {
                    setEnemyBurden(prev => prev + 3);
                    console.log('Enemy gains 3 Burden due to Dread\'s Surrender effect.');
                }
            }
        },
    },
    'MassFreezeEnemies': {
        name: 'MassFreezeEnemies',
        type: 'onActivate',
        onActivate: function (entity, gameState, side) {
            console.log('mass freeze')
            // Get enemy side
            const enemySide = side === 'PLAYER' ? 'ENEMY' : 'PLAYER';

            // Get enemy realms
            const enemyRealms = enemySide === 'PLAYER'
                ? [
                    { realm: playerSolarium, setRealm: setPlayerSolarium },
                    { realm: playerTheater, setRealm: setPlayerTheater },
                    { realm: playerUnderpass, setRealm: setPlayerUnderpass },
                    { realm: playerGrid, setRealm: setPlayerGrid },
                ]
                : [
                    { realm: enemySolarium, setRealm: setEnemySolarium },
                    { realm: enemyTheater, setRealm: setEnemyTheater },
                    { realm: enemyUnderpass, setRealm: setEnemyUnderpass },
                    { realm: enemyGrid, setRealm: setEnemyGrid },
                ];

            // Collect online enemy entities
            const enemyEntities = enemyRealms.flatMap(({ realm }) =>
                realm.people.filter((e) => e.online)
            );

            // Apply Freeze 2 to each online enemy entity
            enemyEntities.forEach((enemyEntity) => {
                applyEffect(enemyEntity.id, enemyEntity.realm, enemySide, {
                    type: 'status',
                    status: 'Freeze',
                    amount: 2,
                });
                console.log(`${enemyEntity.card.name} gains 2 Freeze due to massFreezeEnemies's effect.`);
            });
        },
    },
    'Buffer': (amount) => ({
        name: 'Buffer',
        type: 'onActivate',
        onActivate: function (entity, gameState, side) {
            console.log('apply buffer')
            applyEffect(entity.id, entity.realm, side, {
                type: 'status',
                status: 'Freeze',
                amount: amount,
            });
            console.log(`${entity.card.name} gains ${amount} Freeze due to Buffer.`);
        },
    }),
    Plague: (amount) => ({
        name: 'Plague',
        type: 'onActivate',
        onActivate: function (entity, gameState, side) {
            // Apply Decay to the entity itself
            applyEffect(entity.id, entity.realm, side, {
                type: 'status',
                status: 'Decay',
                amount: amount,
            });
            console.log(`${entity.card.name} gains ${amount} Decay due to Plague.`);
        },
    }),
    Vicious: (amount) => ({
        name: 'Vicious',
        type: 'onActivate',
        onActivate: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                playerGainWounds(amount);
                console.log(`Player takes ${amount} damage due to Vicious.`);
            } else {
                enemyGainWounds(amount);
                console.log(`Enemy takes ${amount} damage due to Vicious.`);
            }
        },
    }),
    GainVengeance: (amount) => ({
        name: 'GainVengeance',
        type: 'manual',
        execute: function (entity, amount, side) {
            addStatusEffect(entity, 'Vengeance', amount, side);
            console.log(`${entity.card.name} gains Vengeance ${amount}.`);
        },
    }),
    'GrantBoostAndPounce': {
        name: 'GrantBoostAndPounce',
        type: 'manual',
        execute: function (entity, effect, side, target) {
            if (!target) {
                console.log('No target provided for GrantBoostAndPounce.');
                return;
            }

            // Apply Boost
            applyBoost(target, effect.boostAmount, side);

            // Grant Pounce with specified amount
            const pounceAmount = effect.pounceAmount || 1;
            grantAbility(target, 'pounce', pounceAmount, side);

            console.log(`${target.card.name} gains Boost ${effect.boostAmount} and Pounce (${pounceAmount}).`);
        },
    },
    'InflictOverloadAndLag': {
        name: 'InflictOverloadAndLag',
        type: 'onActivate',
        onActivate: function (entity, gameState, side) {
            // Inflict Overload and Lag on the opponent
            if (side === 'PLAYER') {
                enemyGainOverload(2);
                enemyGainLag(1);
            } else {
                playerGainOverload(2);
                playerGainLag(1);
            }
            console.log(`${entity.card.name} inflicts 2 Overload and 1 Lag on the opponent.`);
        },
    },
    'Gravity': {
        name: 'Gravity',
        type: 'onActivate',
        onActivate: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                playerGainLag(1);
            } else {
                enemyGainLag(1);
            }
            console.log(`${entity.card.name} inflicts 1 Lag on owner.`);
        },
    },
    'Glitchy': {
        name: 'Glitchy',
        type: 'static',
        applyEffect: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                setPlayerGlitchyAmount((prev) => prev + 1);
            } else {
                setEnemyGlitchyAmount((prev) => prev + 1);
            }
            console.log(`${entity.card.name} increases Glitchy by 1.`);
        },
        removeEffect: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                setPlayerGlitchyAmount((prev) => prev - 1);
            } else {
                setEnemyGlitchyAmount((prev) => prev - 1);
            }
            console.log(`${entity.card.name} increases Glitchy by 1.`);
        },
    },
    'InflictOverloadOnHack': {
        name: 'InflictOverloadOnHack',
        type: 'triggered',
        triggers: ['attackSuccessful'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Check if the side matches
            if (eventData.type === 'PLAYER_HACK' || 'ENEMY_tech') {
                // Inflict Overload on the opponent
                if (side === 'PLAYER') {
                    setEnemyOverload((prev) => prev + 3);
                } else {
                    setPlayerOverload((prev) => prev + 3);
                }
                console.log(`${entity.card.name} inflicts 3 Overload on the opponent due to successful Hack.`);
            }
        },
    },
    'GrantImpostorToDreamers': {
        name: 'GrantImpostorToDreamers',
        type: 'static',
        applyEffect: function (entity, gameState, side) {
            // Increase the Recruiter count
            if (side === 'PLAYER') {
                setRecruiterCount((prev) => prev + 1);
            } else {
                setEnemyRecruiterCount((prev) => prev + 1);
            }
            console.log(`${entity.card.name} is granting Impostor to your Dreamers.`);
        },
        removeEffect: function (entity, gameState, side) {
            // Decrease the Recruiter count
            if (side === 'PLAYER') {
                setRecruiterCount((prev) => prev - 1);
            } else {
                setEnemyRecruiterCount((prev) => prev - 1);
            }
            console.log(`${entity.card.name} has left play. Adjusting Recruiter count.`);
        }
    },
    'OnEnterGainActions': {
        name: 'OnEnterGainActions',
        type: 'onActivate',
        onActivate: function (entity, gameState, side) {
            const actionsGained = entity.card.abilities.find(a => a.name === 'OnEnterGainActions').actionsGained || 0;
            if (side === 'PLAYER') {
                setPlayerActions((prev) => prev + actionsGained);
            } else {
                setEnemyActions((prev) => prev + actionsGained);
            }
            console.log(`${entity.card.name} gains ${actionsGained} Actions.`);
        }
    },
    // Define other abilities here
}

export async function activateAbilities(entity, side) {
    console.log('ACTIVATE ABILITIES ', entity);

    // Set online first before processing abilities
    await applyEffect(entity.id, entity.realm, side, {
        type: 'setOnline',
        value: true,
    });

    if (!entity.activeAbilities) {
        entity.activeAbilities = [];
    }

    const abilities = entity.card.abilities || [];
    for (const ability of abilities) {
        console.log('activating ability ', ability);
        const abilityName = ability.name;
        let abilityDef = abilitiesDefinitions[abilityName];

        if (abilityDef) {
            if (typeof abilityDef === 'function') {
                abilityDef = abilityDef(ability.amount);
            }

            const isAbilityActive = entity.activeAbilities.some(ab => ab.abilityName === abilityName);
            if (isAbilityActive) {
                console.log(`Ability "${abilityName}" is already active for "${entity.card.name}". Skipping.`);
                continue;
            }

            if (abilityDef.type === 'static') {
                abilityDef.applyEffect(entity, gameState, side);
                entity.activeAbilities.push({ abilityName, abilityDef });
            } else if (abilityDef.type === 'triggered') {
                console.log('activate trigger listener');
                abilityDef.triggers.forEach((eventType) => {
                    const handler = (eventData) => {
                        if (entity.scheming && !entity.schemeUnlocked) {
                            return;
                        }
                        abilityDef.eventHandler(entity, eventData, gameState, side);
                    };
                    eventManager.subscribe(eventType, handler);
                    entity.activeAbilities.push({ abilityName, eventType, handler });
                });
            } else if (abilityDef.type === 'manual') {
                entity.activeAbilities.push({ abilityName, abilityDef });
            } else if (abilityDef.type === 'onActivate') {
                console.log('on activate');
                abilityDef.onActivate(entity, gameState, side);
                entity.activeAbilities.push({ abilityName, abilityDef });
            }
        }
    }
}

async function applyEffect(entityId, realmName, owner, effect) {
    console.log('________APPLY EFFECT', effect);

    const [realm, setRealmFunction] = getRealmAndSetter(realmName, owner);

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
}

function applyEffectToEntity(entity, effect) {
    const newEntity = { ...entity };
    newEntity.effects = newEntity.effects ? [...newEntity.effects] : [];

    if (effect.type === 'stat') {
        newEntity[effect.field] = (newEntity[effect.field] || newEntity.card[effect.field] || 0) + effect.value;
    } else if (effect.type === 'keyword') {
        newEntity.modifiedAbilities = new Set(newEntity.modifiedAbilities || (entity.card.abilities || []));
        newEntity.modifiedAbilities.add(effect.value);
    } else if (effect.type === 'status') {
        if (effect.status === 'Freeze') {
            newEntity.freeze = (newEntity.freeze || 0) + effect.amount;
            if (effect.amount > 0) {
                newEntity.readied = false;
            }
            console.log(`${newEntity.card.name} gains ${effect.amount} Freeze (total Freeze: ${newEntity.freeze})`);
        } else if (effect.status === 'Decay') {
            newEntity.decay = (newEntity.decay || 0) + effect.amount;
            console.log(`${newEntity.card.name} gains ${effect.amount} Decay (total Decay: ${newEntity.decay})`);
        } else if (effect.status === 'Venom') {
            newEntity.venom = (newEntity.venom || 0) + effect.amount;
            console.log(`${newEntity.card.name} gains ${effect.amount} Venom (total Venom: ${newEntity.venom})`);
        }
    } else if (effect.type === 'setOnline') {
        newEntity.online = effect.value;
        console.log(`${newEntity.card.name} is set to online: ${newEntity.online}`);
    } else if (effect.type === 'swap') {
        return effect.swapEntity;
    }

    if (effect.duration && effect.duration > 0) {
        newEntity.effects.push({
            ...effect,
            remainingDuration: effect.duration,
        });
    }

    console.log('_________________NEW ENTITY AFTER EFFECT ', newEntity);
    return newEntity;
}

function addStatusEffect(entity, status, amount, side) {
    // Determine the realm and setter
    const realmName = entity.realm; // Ensure the entity has a 'realm' property
    const [realm, setRealm] = getRealmAndSetter(realmName, side);

    const entityIndex = realm.people.findIndex((e) => e.id === entity.id);
    if (entityIndex === -1) return;

    // Create a new entity object
    const updatedEntity = { ...realm.people[entityIndex] };

    // Initialize statusEffects if not present
    if (!updatedEntity.statusEffects) {
        updatedEntity.statusEffects = {};
    }

    // Update the status effect
    updatedEntity.statusEffects[status] = (updatedEntity.statusEffects[status] || 0) + amount;

    // Update the realm's people array
    const newPeople = [...realm.people];
    newPeople[entityIndex] = updatedEntity;

    // Update the realm state
    setRealm({
        ...realm,
        people: newPeople,
    });
}

function drawSpecificCard(card, side) {
    const library = side === 'PLAYER' ? playerLibrary : enemyLibrary;
    const setLibrary = side === 'PLAYER' ? setPlayerLibrary : setEnemyLibrary;
    const setHand = side === 'PLAYER' ? setPlayerHand : setEnemyHand;
    const updatedLibrary = library.filter(entity => entity.id !== card.id);
    setLibrary(updatedLibrary);
    setHand(prevHand => [...prevHand, card]);

    console.log(`${card.card.name} has been drawn.`);
}


function deactivateAbilities(entity, side) {
    if (!entity.activeAbilities) return;

    entity.activeAbilities.forEach((activeAbility) => {
        const abilityDef = activeAbility.abilityDef;
        if (abilityDef.type === 'static' && abilityDef.removeEffect) {
            // Remove static effect
            abilityDef.removeEffect(entity, gameState, side);
        } else if (abilityDef.type === 'triggered') {
            // Unsubscribe from events
            eventManager.unsubscribe(activeAbility.eventType, activeAbility.handler);
        }
        // Handle other ability types as needed
    });

    // Clear the active abilities
    entity.activeAbilities = [];

    // Adjust entity's power based on external effects
    adjustEntityPowerExternal(entity, side);
}




function removeEffect(entityId, realmName, owner, effect) {
    const [realm, setRealm] = getRealmAndSetter(realmName, owner);

    const entityIndex = realm.people.findIndex((e) => e.id === entityId);
    if (entityIndex === -1) return;

    const oldEntity = realm.people[entityIndex];
    const newEntity = { ...oldEntity };

    if (effect.type === 'stat') {
        // Reverse the stat adjustment
        newEntity[effect.field] -= effect.value;
    } else if (effect.type === 'keyword') {
        if (newEntity.modifiedAbilities) {
            newEntity.modifiedAbilities = new Set(newEntity.modifiedAbilities);
            newEntity.modifiedAbilities.delete(effect.value);
        }
    } else if (effect.type === 'status') {
        if (effect.status === 'Freeze') {
            newEntity.freeze = Math.max(0, (newEntity.freeze || 0) - effect.amount);
            console.log(`${newEntity.card.name} loses ${effect.amount} Freeze (remaining Freeze: ${newEntity.freeze})`);
        } else if (effect.status === 'Decay') {
            newEntity.decay = Math.max(0, (newEntity.decay || 0) - effect.amount);
            console.log(`${newEntity.card.name} loses ${effect.amount} Decay (remaining Decay: ${newEntity.decay})`);
        } else if (effect.status === 'Venom') {
            newEntity.venom = Math.max(0, (newEntity.venom || 0) - effect.amount);
            console.log(`${newEntity.card.name} loses ${effect.amount} Venom (remaining Venom: ${newEntity.venom})`);
        }
    }

    // Remove effect from effects array
    if (newEntity.effects) {
        newEntity.effects = newEntity.effects.filter((e) => e !== effect);
    }

    // Update the realm state
    const newPeople = [...realm.people];
    newPeople[entityIndex] = newEntity;

    setRealm({
        ...realm,
        people: newPeople,
    });
}

function applyFreezeToAllEntities(amount) {
    ['PLAYER', 'ENEMY'].forEach((side) => {
        const realms = side === 'PLAYER' ? getAllPlayerRealms() : getAllEnemyRealms();
        realms.forEach((realm) => {
            ['people'].forEach((arrayName) => {
                realm[arrayName].forEach((entity) => {
                    if (entity.card.category === 'ENTITY' && entity.online) {
                        applyEffect(entity.id, realm.name, side, {
                            type: 'status',
                            status: 'Freeze',
                            amount: amount,
                        });
                    }
                });
            });
        });
    });
    console.log(`All entities gain Freeze ${amount} due to Brain Freeze.`);
}

function isValidAbilityTarget(cardEntity) {
    // Check if the card is a friendly Online entity
    return (
        cardEntity.online &&
        cardEntity.owner === 'PLAYER' &&
        cardEntity !== pendingAbility.entity // Cannot target itself
    );
}

function confirmAbilityTarget(target) {
    const { entity, ability } = pendingAbility;

    // Apply the effect
    applyAbilityEffect(entity, ability.effect, 'PLAYER', target);

    // Reset state
    setPendingAbility(null);
    setSelectionMode('NONE');
}

    function exhaustEntity(entity, side) {
        const realmName = entity.realm; // Ensure the entity has a 'realm' property
        const [realm, setRealm] = getRealmAndSetter(realmName, side);

        const entityIndex = realm.people.findIndex((e) => e.id === entity.id);
        if (entityIndex === -1) {
            console.error(`Entity with ID ${entity.id} not found in realm ${realmName}`);
            return;
        }

        const updatedEntity = { ...realm.people[entityIndex] };

        // Set steps to 0 to exhaust the entity
        updatedEntity.steps = 0;

        // Update the realm's people array
        const newPeople = [...realm.people];
        newPeople[entityIndex] = updatedEntity;

        // Update the realm state
        setRealm({
            ...realm,
            people: newPeople,
        });

        console.log(`${entity.card.name} is now exhausted.`);
    }

    function confirmManualAbility(target) {
        const { entity, ability } = pendingManualAbility;

        // Apply the ability effect
        const abilityDef = abilitiesDefinitions[ability.name];
        if (abilityDef && typeof abilityDef.execute === 'function') {
            abilityDef.execute(entity, ability.effect, 'PLAYER', target);
        } else {
            console.error(`Ability ${ability.name} not found or invalid.`);
        }

        // Clear the pending manual ability and disable target selection
        setPendingManualAbility(null);
        setTargetSelection({ enabled: false });
    }

    function applyOverload(side, amount) {
        if (side === 'PLAYER') {
            setPlayerOverload(prevOverload => prevOverload + amount);
            console.log(`Player gains ${amount} Overload.`);
        } else {
            setEnemyOverload(prevOverload => prevOverload + amount);
            console.log(`Enemy gains ${amount} Overload.`);
        }
    }




    function applyAbilityEffect(entity, effect, side) {
        const abilityDef = abilitiesDefinitions[effect.name];
        if (abilityDef && typeof abilityDef.execute === 'function') {
            abilityDef.execute(entity, effect, side);
        } else {
            console.error(`Ability effect ${effect.name} not found or invalid.`);
        }
    }


    function grantAbility(entity, abilityName, amount = 1, side) {
        const realmName = entity.realm;
        const [realm, setRealm] = getRealmAndSetter(realmName, side);

        const entityIndex = realm.people.findIndex((e) => e.id === entity.id);
        if (entityIndex === -1) {
            console.error(`Entity with ID ${entity.id} not found in realm ${realmName}`);
            return;
        }

        const updatedEntity = { ...realm.people[entityIndex] };

        if (!updatedEntity.abilities) {
            updatedEntity.abilities = {};
        }

        updatedEntity[abilityName] = (updatedEntity[abilityName] || 0) + amount;

        // Update the realm's people array
        const newPeople = [...realm.people];
        newPeople[entityIndex] = updatedEntity;

        // Update the realm state
        setRealm({
            ...realm,
            people: newPeople,
        });

        console.log(`${entity.card.name} gains ${abilityName} (${updatedEntity.abilities[abilityName]}).`);
    }

    function removeAbility(entity, abilityName, amount = 1, side) {
        const realmName = entity.realm;
        const [realm, setRealm] = getRealmAndSetter(realmName, side);

        const entityIndex = realm.people.findIndex((e) => e.id === entity.id);
        if (entityIndex === -1) {
            console.error(`Entity with ID ${entity.id} not found in realm ${realmName}`);
            return;
        }

        const updatedEntity = { ...realm.people[entityIndex] };

        if (updatedEntity.abilities && updatedEntity.abilities[abilityName]) {
            updatedEntity.abilities[abilityName] -= amount;
            if (updatedEntity.abilities[abilityName] <= 0) {
                delete updatedEntity.abilities[abilityName];
            }

            // Update the realm's people array
            const newPeople = [...realm.people];
            newPeople[entityIndex] = updatedEntity;

            // Update the realm state
            setRealm({
                ...realm,
                people: newPeople,
            });

            console.log(`${entity.card.name} loses ${abilityName}. Remaining: ${updatedEntity.abilities[abilityName] || 0}`);
        } else {
            console.log(`${entity.card.name} does not have ${abilityName}.`);
        }
    }

    function applySoloEffect(entity, location) {
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

        function clearVengeance(entity, side) {
            let location = 'REALM';
            let realm, setRealm;
            let entityIndex = -1;
            let setRealmOrBattleSlots;
    
            // Check if entity is in battle
            const playerBattleCard = playerBattleSlots.find((card) => card && card.id === entity.id);
            const enemyBattleCard = enemyBattleSlots.find((card) => card && card.id === entity.id);
    
            if (playerBattleCard || enemyBattleCard) {
                location = 'BATTLE';
    
                if (playerBattleCard) {
                    setRealmOrBattleSlots = setPlayerBattleSlots;
                    entityIndex = playerBattleSlots.findIndex((card) => card && card.id === entity.id);
                } else {
                    setRealmOrBattleSlots = setEnemyBattleSlots;
                    entityIndex = enemyBattleSlots.findIndex((card) => card && card.id === entity.id);
                }
            } else {
                // If not in battle, proceed with realm logic
                const realmName = entity.realm;
                [realm, setRealm] = getRealmAndSetter(realmName, side);
    
                entityIndex = realm.people.findIndex((e) => e.id === entity.id);
                if (entityIndex === -1) {
                    console.error(`Entity with ID ${entity.id} not found in realm or battle`);
                    return;
                }
            }
    
            // Determine the current entity and array to update
            const currentEntity = location === 'REALM'
                ? realm.people[entityIndex]
                : (playerBattleCard || enemyBattleCard);
    
            // Check and remove Vengeance
            if (currentEntity.statusEffects && currentEntity.statusEffects.Vengeance) {
                const updatedEntity = { ...currentEntity };
                delete updatedEntity.statusEffects.Vengeance;
    
                // Update based on location
                if (location === 'REALM') {
                    const newPeople = [...realm.people];
                    newPeople[entityIndex] = updatedEntity;
    
                    setRealm({
                        ...realm,
                        people: newPeople,
                    });
                } else {
                    setRealmOrBattleSlots((prev) =>
                        prev.map((card) =>
                            card && card.id === entity.id ? updatedEntity : card
                        )
                    );
                }
    
                console.log(`Vengeance cleared from ${updatedEntity.card.name}`);
            }
        }


        function handleImpostorPlacement(selectedCard, enemyCard, realmName, side, dreamer) {
            // Determine the realms and setter functions based on the side
            let ownRealm, setOwnRealm, opponentRealm, setOpponentRealm;
    
            if (side === 'PLAYER') {
                ownRealm = getPlayerRealmByName(realmName);
                setOwnRealm = getSetPlayerRealm(realmName);
                opponentRealm = getEnemyRealmByName(realmName);
                setOpponentRealm = getSetEnemyRealm(realmName);
            } else {
                ownRealm = getEnemyRealmByName(realmName);
                setOwnRealm = getSetEnemyRealm(realmName);
                opponentRealm = getPlayerRealmByName(realmName);
                setOpponentRealm = getSetPlayerRealm(realmName);
            }
    
            // Swap the cards
            swapEntitiesForImpostor(selectedCard, enemyCard, realmName, setOwnRealm, setOpponentRealm, side, dreamer);
    
            // Remove the selected card from the player's or enemy's hand
            if (side === 'PLAYER') {
                setPlayerHand((prevHand) => prevHand.filter((card) => card.id !== selectedCard.id));
            } else {
                setEnemyHand((prevHand) => prevHand.filter((card) => card.id !== selectedCard.id));
            }
    
            // Deduct an action point from the acting player
            if (side === 'PLAYER') {
                playerLoseActions(1);
            } else {
                enemyLoseActions(1);
            }
    
            // Reset selection states
            setSelectedCard(null);
            setSelectedInHand(false);
            setDraftSelected(false);
            setTargetType('none');
            setCurrentPlayer(getOppositeSide(side));
        }
    
        function swapEntitiesForImpostor(selectedCard, enemyEntity, realmName, setOwnRealm, setOpponentRealm, side, dreamer) {
            // Update ownership and realm properties
            const updatedSelectedCard = { ...selectedCard, realm: realmName, owner: getOppositeSide(side) };
            const updatedEnemyEntity = { ...enemyEntity, realm: realmName, owner: side };
    
            // Determine which arrays to use based on card categories
            const selectedCardArrayName = getArrayNameForCategory(selectedCard.card.category);
            const enemyCardArrayName = getArrayNameForCategory(enemyEntity.card.category);
    
            // Remove enemy entity from opponent realm
            setOpponentRealm((prevRealm) => ({
                ...prevRealm,
                [enemyCardArrayName]: prevRealm[enemyCardArrayName].filter((entity) => entity.id !== enemyEntity.id),
            }));
    
            // Add enemy entity to own realm
            setOwnRealm((prevRealm) => ({
                ...prevRealm,
                [enemyCardArrayName]: [...prevRealm[enemyCardArrayName], updatedEnemyEntity],
            }));
    
            // Add selected card to opponent realm
            setOpponentRealm((prevRealm) => ({
                ...prevRealm,
                [selectedCardArrayName]: [...prevRealm[selectedCardArrayName], updatedSelectedCard],
            }));
    
            // Activate abilities for a Dreamer
            if (dreamer) {
                activateAbilities(updatedSelectedCard, getOppositeSide(side));
            }
        }

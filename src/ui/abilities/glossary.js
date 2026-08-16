import { state, stateSetters } from '../helpers/state';
import { eventManager } from '../helpers/eventManager';
import { cardList1 as cardList } from '../data/cardList';
import { 
    playerGainFate, playerGainOverload, 
    enemyGainFate, enemyGainOverload,
    playerGainBits, enemyGainBits,
    playerGainWounds, enemyGainWounds,
    playerGainActions, enemyGainActions,
    playerGainAshes, enemyGainAshes,
    playerGainSurge, enemyGainSurge,
    playerGainBurden, enemyGainBurden,
    getFriendlyEntities
} from '../helpers/core';

import { applyBoost } from '../helpers/advancement';
import { handleDamage, handleDeadCard, handlePlaceDamage, handleDestroyedThing } from '../helpers/damage';
import { getOppositeSide, getRealmAndSetter, getArrayNameForCategory } from '../helpers/utils';
import { applyEffect, applyFreezeToAllEntities, applyOverload } from '../helpers/effects';
import { updateEntityInRealm, drawSpecificCard } from '../helpers/entity';
import { buildCardInstance, keywordAmount } from '../helpers/setup';


// Define ability helpers for internal use
const abilityHelpers = {
    clearVengeance: function(entity, side) {
        let location = 'REALM';
        let realm = null;
        let setRealm = null;
        let entityIndex = -1;
        let setRealmOrBattleSlots = null;

        // Check if entity is in battle
        const playerBattleCard = state.playerBattleSlots.find((card) => card && card.id === entity.id);
        const enemyBattleCard = state.enemyBattleSlots.find((card) => card && card.id === entity.id);

        if (playerBattleCard || enemyBattleCard) {
            location = 'BATTLE';

            if (playerBattleCard) {
                setRealmOrBattleSlots = stateSetters.setPlayerBattleSlots;
                entityIndex = state.playerBattleSlots.findIndex((card) => card && card.id === entity.id);
            } else {
                setRealmOrBattleSlots = stateSetters.setEnemyBattleSlots;
                entityIndex = state.enemyBattleSlots.findIndex((card) => card && card.id === entity.id);
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
                    people: newPeople
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
    },

    swapEntitiesForImpostor: function(selectedCard, enemyEntity, realmName, setOwnRealm, setOpponentRealm, side, dreamer) {
        // Update ownership and realm properties
        const updatedSelectedCard = { ...selectedCard, realm: realmName, owner: getOppositeSide(side) };
        const updatedEnemyEntity = { ...enemyEntity, realm: realmName, owner: side };

        // Determine which arrays to use based on card categories
        const selectedCardArrayName = getArrayNameForCategory(selectedCard.card.category);
        const enemyCardArrayName = getArrayNameForCategory(enemyEntity.card.category);

        // Remove enemy entity from opponent realm
        setOpponentRealm((prevRealm) => ({
            ...prevRealm,
            [enemyCardArrayName]: prevRealm[enemyCardArrayName].filter((entity) => entity.id !== enemyEntity.id)
        }));

        // Add enemy entity to own realm
        setOwnRealm((prevRealm) => ({
            ...prevRealm,
            [enemyCardArrayName]: [...prevRealm[enemyCardArrayName], updatedEnemyEntity]
        }));

        // Add selected card to opponent realm
        setOpponentRealm((prevRealm) => ({
            ...prevRealm,
            [selectedCardArrayName]: [...prevRealm[selectedCardArrayName], updatedSelectedCard]
        }));

        // Activate abilities for a Dreamer
        if (dreamer) {
            activateAbilities(updatedSelectedCard, getOppositeSide(side));
        }
    }
};

// Initialize abilities definitions
const abilitiesDefinitions = {
    'Extortion': {
        name: 'Extortion',
        type: 'onPlay',
        onPlay: function (entity, state, side) {
            const countEntities = () => {
                let count = 0;
                const realms = ['playerSolarium', 'enemySolarium', 'playerTheater', 'enemyTheater', 'playerUnderpass', 'enemyUnderpass', 'playerGrid', 'enemyGrid'];
                realms.forEach(realmName => {
                    const realm = state[realmName];
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
            const enemyRealms = enemySide === 'PLAYER' ? [
                { realm: state.playerSolarium, setRealm: stateSetters.setPlayerSolarium },
                { realm: state.playerTheater, setRealm: stateSetters.setPlayerTheater },
                { realm: state.playerUnderpass, setRealm: stateSetters.setPlayerUnderpass },
                { realm: state.playerGrid, setRealm: stateSetters.setPlayerGrid }
            ] : [
                { realm: state.enemySolarium, setRealm: stateSetters.setEnemySolarium },
                { realm: state.enemyTheater, setRealm: stateSetters.setEnemyTheater },
                { realm: state.enemyUnderpass, setRealm: stateSetters.setEnemyUnderpass },
                { realm: state.enemyGrid, setRealm: stateSetters.setEnemyGrid },
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
        onPlay: function (entity, state, side) {
            // Grant +2 Surge and +2 Ash
            if (side === 'PLAYER') {
                playerGainSurge(2);
                playerGainAshes(2);
            } else {
                enemyGainSurge(2);
                enemyGainAshes(2);
            }

            // Search Pandora for JAWbreaker entities
            const pandora = side === 'PLAYER' ? state.playerLibrary : state.enemyLibrary; // Ensure these state variables exist
            //console.log(pandora)
            const jawbreakerEntities = pandora.filter(entity =>
                entity.card.subTypes?.includes('JAWbreaker')
            );
            console.log(jawbreakerEntities)
            if (jawbreakerEntities.length > 0) {
                stateSetters.showModal({
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
                                            stateSetters.setModalVisible(false);
                                        }}
                                        style={{ cursor: 'pointer', marginBottom: '5px' }}
                                    >
                                        {jb.card.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ),
                    onConfirm: stateSetters.setModalVisible(false),
                    onCancel: stateSetters.setModalVisible(false),
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
        targetFilter: (target, entity, side) =>
            target &&
            target.card.subTypes?.includes('JAWbreaker') &&
            target.owner === side &&
            target.online,
        onPlay: function (entity, gameState, side, target) {
            // Hacker: successful hack this turn
            const hasHacked = side === 'PLAYER' ? state.playerSuccessfulHack : state.enemySuccessfulHack;
            if (hasHacked && target) {
                // +1/+1
                applyEffect(target.id, target.realm, side, {
                    type: 'stat',
                    field: 'power',
                    value: 1,
                });
                applyEffect(target.id, target.realm, side, {
                    type: 'stat',
                    field: 'HP',
                    value: 1,
                });
                // Stealth
                applyEffect(target.id, target.realm, side, {
                    type: 'status',
                    status: 'Stealth',
                    amount: 1,
                });
                // Charge (ready the entity immediately)
                target.readied = true;
                updateEntityInRealm(target, side);
            }
        },
    },
    'Duplicate': {
        name: 'Duplicate',
        type: 'onPlay',
        onPlay: function (entity, state, side) {
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
                    stateSetters.setPlayerHand((prevHeadSpace) => [...prevHeadSpace, newCardEntity]);
                } else {
                    stateSetters.setEnemyHand((prevHeadSpace) => [...prevHeadSpace, newCardEntity]);
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
    // Temporarily disabled until hack mechanics are implemented
    // MultiThreadingEffect: {
    //     type: 'onPlay',
    //     requiresTarget: true,
    //     onPlay: function (entity, gameState, side, target) {
    //         console.log('MultiThreadingEffect', target);
    //         if (side === 'PLAYER') {
    //             playerDraw(2);
    //             if (target) {
    //                 applyBoost(target, 1, side);
    //                 setTargetSelection({
    //                     enabled: true,
    //                     side: side,
    //                     filter: (t) => t.owner === getOppositeSide(side),
    //                     onSelect: (hackTarget) => {
    //                         // TODO: Implement hack mechanics
    //                         setTargetSelection({ enabled: false });
    //                     },
    //                     onCancel: () => {
    //                         setTargetSelection({ enabled: false });
    //                     },
    //                 });
    //             }
    //         } else {
    //             enemyDraw(2);
    //             if (target) {
    //                 applyBoost(target, 1, side);
    //                 // AI logic for hack target
    //             }
    //         }
    //     }
    // },
    'ForgeryEffect': {
        name: 'ForgeryEffect',
        type: 'onPlay',
        onPlay: function (entity, state, side) {
            if (side === 'PLAYER' && state.playerInterfacedHeadSpace) {
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
                    stateSetters.setEnemyUnderpass(prevRealm => ({
                        ...prevRealm,
                        people: [...prevRealm.people, newCatPhishEntity],
                    }));
                } else {
                    console.error('CatPhish card not found in the library.');
                }
            } else if (side === 'ENEMY' && state.enemyInterfacedHeadSpace) {
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
                    stateSetters.setPlayerUnderpass(prevRealm => ({
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
        onPlay: function (entity, state, side) {
            // Gain 6 Ash
            if (side === 'PLAYER') {
                playerGainAshes(6);
            } else {
                enemyGainAshes(6);
            }

            // Gain 3 Overload
            if (side === 'PLAYER') {
                stateSetters.setPlayerOverload(prevOverload => prevOverload + 3);
            } else {
                stateSetters.setEnemyOverload(prevOverload => prevOverload + 3);
            }
        },
    },
    'BrainFreezeHackPandora': {
        name: 'BrainFreezeHackPandora',
        type: 'onPlay',
        onPlay: function (entity, state, side) {
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
            stateSetters.setAttackMode('PLAYER_HACK');
            stateSetters.setTargetType('PANDORA');
            stateSetters.setSelectedRealm('Grid'); // Only Grid can perform the hack
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
        applyAbilityEffect: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                stateSetters.setPlayerPandoraAccess(prev => prev + 1);
            } else {
                stateSetters.setEnemyPandoraAccess(prev => prev + 1);
            }
            console.log(`${entity.card.name} increases Pandora Access by 1.`);
        },
        removeEffect: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                stateSetters.setPlayerPandoraAccess(prev => prev - 1);
            } else {
                stateSetters.setEnemyPandoraAccess(prev => prev - 1);
            }
            console.log(`${entity.card.name} decreases Pandora Access by 1.`);
        },
    },
    'Drift': {
        name: 'Drift',
        type: 'static',
        applyAbilityEffect: function(entity, gameState, side) {
        if (side === 'PLAYER') {
            stateSetters.setPlayerDriftCount(prev => prev + 1);
        } else {
            stateSetters.setEnemyDriftCount(prev => prev + 1);
        }
        console.log(`${entity.card.name} increases Drift count by 1.`);
        },
        removeEffect: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                stateSetters.setPlayerDriftCount(prev => prev - 1);
            } else {
                stateSetters.setEnemyDriftCount(prev => prev - 1);
            }
            console.log(`${entity.card.name} decreases Drift count by 1.`);
        }
    },
    'Dividend': (amount) => ({
        name: 'Dividend',
        type: 'static',
        applyAbilityEffect: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                stateSetters.setPlayerDividendAmount(prev => prev + amount);
            } else {
                stateSetters.setEnemyDividendAmount(prev => prev + amount);
            }
            console.log(`${entity.card.name} increases Dividend count.`);
        },
        removeEffect: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                stateSetters.setPlayerDividendAmount(prev => prev - amount);
            } else {
                stateSetters.setEnemyDividendAmount(prev => prev - amount);
            }
            console.log(`${entity.card.name} decreases Dividend count.`);
        },
    }),
    'GainActionsOnHeadSpaceInterface': {
        name: 'GainActionsOnHeadSpaceInterface',
        type: 'triggered',
        triggers: ['successfulHack'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (entity.scheming && !entity.schemeUnlocked) {
                return;
            }
            if (eventData.side === side && eventData.targetType === 'HEADSPACE') {
                if (!entity.abilityActivated) {
                    const ability = entity.card.abilities.find(a => a.name === 'GainActionsOnHeadSpaceInterface');
                    const amount = ability?.effect?.amount || 3;
                    if (side === 'PLAYER') {
                        stateSetters.setPlayerActions(prevActions => prevActions + amount);
                    } else {
                        stateSetters.setEnemyActions(prevActions => prevActions + amount);
                    }
                    console.log(`${entity.card.name} grants ${amount} Actions upon interfacing with HeadSpace.`);
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
                if (state.playerActions < 2) {
                    console.log('Not enough actions to activate this ability.');
                    return;
                }
                stateSetters.setPlayerActions(prev => prev - 2);
            } else {
                if (state.enemyActions < 2) {
                    console.log('Not enough actions to activate this ability.');
                    return;
                }
                stateSetters.setEnemyActions(prev => prev - 2);
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
                    stateSetters.setPlayerBits(prevBits => prevBits + 2);
                    playerGainAshes(2);
                } else {
                    stateSetters.setEnemyBits(prevBits => prevBits + 2);
                    enemyGainAshes(2);
                }

                console.log(`${entity.card.name} grants +2 Bits and +2 Ash upon interfacing with HeadSpace.`);
            }
        },
    },
    // Solo is implemented by applySoloEffect() in helpers/effects.js, which
    // battle.js calls directly for the lone attacker. It reads entity.solo
    // (populated from card.solo by setup.js). A duplicate triggered 'Solo'
    // ability used to live here listening on a 'soloAttack' event that was never
    // published; publishing it would have applied Solo twice.
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
    'HackingInflictOverload': {
        name: 'HackingInflictOverload',
        type: 'triggered',
        triggers: ['successfulHack'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Poser: Hacking ➔ inflict 3 Overload
            if (eventData.side === side) {
                const ability = entity.card.abilities?.find(a => a.name === 'HackingInflictOverload');
                const amount = ability?.amount || 3;
                const targetSide = getOppositeSide(side);

                applyOverload(targetSide, amount);
                console.log(`${entity.card.name} Hacking: Inflicted ${amount} Overload to ${targetSide}`);
            }
        },
    },
    'HackingVenomFreeze': {
        name: 'HackingVenomFreeze',
        type: 'triggered',
        triggers: ['successfulHack'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Z0MBI: Hacking ➔ Inflict Freeze equal to Venom on enemy entities, then +1 Venom
            if (eventData.side === side) {
                const currentVenom = entity.venom || 0;
                const enemySide = getOppositeSide(side);

                // Get all enemy realms
                const enemyRealms = ['Solarium', 'Theater', 'Underpass', 'Grid', 'Elysium'].map(name => {
                    const realmName = enemySide === 'PLAYER' ? `player${name}` : `enemy${name}`;
                    return state[realmName];
                });

                // Apply Freeze to all online enemy entities
                enemyRealms.forEach(realm => {
                    if (!realm || !realm.people) return;
                    realm.people.forEach(target => {
                        if (target.online) {
                            applyEffect(target.id, target.realm, enemySide, {
                                type: 'status',
                                status: 'freeze',
                                amount: currentVenom
                            });
                        }
                    });
                });

                // Increase Venom by 1
                entity.venom = currentVenom + 1;
                updateEntityInRealm(entity, side);

                console.log(`${entity.card.name} Hacking: Inflicted Freeze ${currentVenom} to all enemy entities, Venom increased to ${entity.venom}`);
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
    'MaintainGainVengeance': {
        name: 'MaintainGainVengeance',
        type: 'triggered',
        triggers: ['maintain'], // Fires during timer reduction phase
        eventHandler: function (entity, eventData, gameState, side) {
            // VyperDrive: Maintain ➔ Gain 2 Vengeance
            // 'maintain' is a phase event with no entityId; this handler is already
            // registered per entity, so matching the side is enough.
            if (eventData.side === side && entity.online) {
                const ability = entity.card.abilities?.find(a => a.name === 'MaintainGainVengeance');
                const amount = ability?.amount || 2;

                // Add Vengeance status effect
                applyEffect(entity.id, entity.realm, side, {
                    type: 'status',
                    status: 'Vengeance',
                    amount: amount
                });

                console.log(`${entity.card.name} Maintain: Gained ${amount} Vengeance`);
            }
        },
    },
    'DominanceInflictOverload': {
        name: 'DominanceInflictOverload',
        type: 'triggered',
        triggers: ['dominanceWon'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Dread: Dominance ➔ Inflict 3 Overload
            if (eventData.side === side) {
                const ability = entity.card.abilities?.find(a => a.name === 'DominanceInflictOverload');
                const amount = ability?.amount || 3;
                const targetSide = getOppositeSide(side);

                applyOverload(targetSide, amount);
                console.log(`${entity.card.name} Dominance: Inflicted ${amount} Overload to ${targetSide}`);
            }
        },
    },
    'DominanceInflictOverloadAndGainLifeless': {
        name: 'DominanceInflictOverloadAndGainLifeless',
        type: 'triggered',
        triggers: ['dominanceWon'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Con Artist: Dominance ➔ Inflict 2 Overload and gain Lifeless
            if (eventData.side === side) {
                const ability = entity.card.abilities?.find(a => a.name === 'DominanceInflictOverloadAndGainLifeless');
                const amount = ability?.amount || 2;
                const targetSide = getOppositeSide(side);

                applyOverload(targetSide, amount);

                entity.lifeless = true;
                updateEntityInRealm(entity, side);

                console.log(`${entity.card.name} Dominance: Inflicted ${amount} Overload and gained Lifeless`);
            }
        },
    },
    'SylkWormAura': {
        name: 'SylkWormAura',
        type: 'triggered',
        triggers: ['maintain', 'entityEntered', 'entityDied'],
        eventHandler: function (entity, eventData, gameState, side) {
            // SylkWorm: Online enemy entities gain Freeze 2
            if (!entity.online) return;

            const enemySide = getOppositeSide(side);
            const enemyRealms = ['Solarium', 'Theater', 'Underpass', 'Grid'].map(name => {
                return enemySide === 'PLAYER' ? state[`player${name}`] : state[`enemy${name}`];
            });

            enemyRealms.forEach(realm => {
                if (!realm || !realm.people) return;
                realm.people.forEach(target => {
                    if (target.online) {
                        applyEffect(target.id, target.realm, enemySide, {
                            type: 'status',
                            status: 'freeze',
                            amount: 2
                        });
                    }
                });
            });

            console.log(`${entity.card.name} aura: Enemy online entities gain Freeze 2`);
        },
    },
    'CatPhishSurgicalAura': {
        name: 'CatPhishSurgicalAura',
        type: 'triggered',
        triggers: ['entityEntered', 'maintain'],
        eventHandler: function (entity, eventData, gameState, side) {
            // CatPhish: Your entities are Surgical
            if (!entity.online) return;

            const friendlyRealms = ['Solarium', 'Theater', 'Underpass', 'Grid'].map(name => {
                return side === 'PLAYER' ? state[`player${name}`] : state[`enemy${name}`];
            });

            friendlyRealms.forEach(realm => {
                if (!realm || !realm.people) return;
                realm.people.forEach(target => {
                    if (target.online && !target.hasSurgical) {
                        target.hasSurgical = true;
                        updateEntityInRealm(target, side);
                    }
                });
            });

            console.log(`${entity.card.name} aura: Friendly entities are Surgical`);
        },
    },
    'Lifeless': {
        name: 'Lifeless',
        type: 'triggered',
        triggers: ['endTurn'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Lifeless: Sacrifice this entity at end of turn
            if (eventData.side === side && entity.lifeless) {
                handleDeadCard(entity.realm, entity.id, side);
                console.log(`${entity.card.name} Lifeless: Sacrificed at end of turn`);
            }
        },
    },
    'DominanceInflictBurden': {
        name: 'DominanceInflictBurden',
        type: 'triggered',
        triggers: ['dominationResolved'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Dread: Dominance ➔ Inflict 3 Burden on the opponent
            if (eventData.winner === side) {
                const ability = entity.card.abilities?.find(a => a.name === 'DominanceInflictBurden');
                const amount = ability?.amount || 3;
                const enemySide = getOppositeSide(side);

                if (enemySide === 'PLAYER') {
                    playerGainBurden(amount);
                } else {
                    enemyGainBurden(amount);
                }
                console.log(`${entity.card.name} Dominance: inflicted ${amount} Burden on ${enemySide}`);
            }
        },
    },
    'SurrenderGainBurden': {
        name: 'SurrenderGainBurden',
        type: 'triggered',
        triggers: ['dominanceLost'], // Surrender = lose dominance
        eventHandler: function (entity, eventData, gameState, side) {
            // Dread: Surrender ➔ Gain 3 Burden
            if (eventData.side === side) {
                const ability = entity.card.abilities?.find(a => a.name === 'SurrenderGainBurden');
                const amount = ability?.amount || 3;

                if (side === 'PLAYER') {
                    playerGainBurden(amount);
                } else {
                    enemyGainBurden(amount);
                }
                console.log(`${entity.card.name} Surrender: gained ${amount} Burden`);
            }
        },
    },
    'SurrenderGainOverload': {
        name: 'SurrenderGainOverload',
        type: 'triggered',
        triggers: ['dominanceLost'], // Surrender = lose dominance
        eventHandler: function (entity, eventData, gameState, side) {
            // Dread: Surrender ➔ Gain 3 Overload
            if (eventData.side === side) {
                const ability = entity.card.abilities?.find(a => a.name === 'SurrenderGainOverload');
                const amount = ability?.amount || 3;

                applyOverload(side, amount);
                console.log(`${entity.card.name} Surrender: Gained ${amount} Overload`);
            }
        },
    },
    'WastelandInterfaceWound': {
        name: 'WastelandInterfaceWound',
        type: 'triggered',
        triggers: ['interface'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Wasteland: When you Interface, all entities gain 1 Wound
            if (eventData.side !== side) return;

            const allSides = ['PLAYER', 'ENEMY'];
            allSides.forEach(s => {
                const realms = ['Solarium', 'Theater', 'Underpass', 'Grid'].map(name => {
                    return s === 'PLAYER' ? state[`player${name}`] : state[`enemy${name}`];
                });
                realms.forEach(realm => {
                    if (!realm || !realm.people) return;
                    realm.people.forEach(target => {
                        applyEffect(target.id, target.realm, s, {
                            type: 'wound',
                            amount: 1
                        });
                    });
                });
            });

            console.log(`${entity.card.name}: All entities gain 1 Wound from Interface`);
        },
    },
    'LeviathanSchemeEffect': {
        name: 'LeviathanSchemeEffect',
        type: 'manual',
        requiresTarget: true,
        targetType: 'entity',
        targetFilter: (target) => target && target.online,
        execute: function (entity, effect, side, target) {
            // Leviathan Scheme 2: Interface, target entity gains 2 Wounds
            if (entity.scheming && !entity.schemeUnlocked) {
                console.log(`${entity.card.name}'s Scheme ability is not yet unlocked.`);
                return;
            }
            if (target) {
                applyEffect(target.id, target.realm, side, {
                    type: 'wound',
                    amount: 2
                });
                console.log(`${entity.card.name} Scheme: ${target.card.name} gains 2 Wounds.`);
            }
        },
    },
    'ImitationGameDividend': {
        name: 'ImitationGameDividend',
        type: 'triggered',
        triggers: ['entityEntered'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Imitation Game Dividend 2: When a friendly entity enters, you may Impostor
            if (eventData.side !== side) return;
            if (entity.scheming && !entity.schemeUnlocked) {
                return;
            }
            // Only activate if the card has not yet been used for Impostor this turn
            if (!entity.abilityActivated) {
                entity.abilityActivated = true;
                console.log(`${entity.card.name} Dividend: Impostor opportunity triggered`);
            }
        },
    },
    'ChronomancerBufferAura': {
        name: 'ChronomancerBufferAura',
        type: 'triggered',
        triggers: ['entityEntered', 'maintain'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Chronomancer: Other entities have Buffer 2
            if (!entity.online) return;

            const allSides = ['PLAYER', 'ENEMY'];
            allSides.forEach(s => {
                const realms = ['Solarium', 'Theater', 'Underpass', 'Grid'].map(name => {
                    return s === 'PLAYER' ? state[`player${name}`] : state[`enemy${name}`];
                });
                realms.forEach(realm => {
                    if (!realm || !realm.people) return;
                    realm.people.forEach(target => {
                        if (target && target.id !== entity.id && !target.chronomancerBuffer) {
                            target.chronomancerBuffer = true;
                            target.bufferAmount = (target.bufferAmount || 0) + 2;
                            updateEntityInRealm(target, s);
                        }
                    });
                });
            });

            console.log(`${entity.card.name} aura: Other entities have Buffer 2`);
        },
    },
    'BuffSelfWithFreeze': {
        name: 'BuffSelfWithFreeze',
        type: 'manual',
        cost: { bits: 1 },
        execute: function (entity, effect, side) {
            // Blood Sugar: Pay 1 Bit ➔ Gain +1/+1 and 1 Freeze
            const bits = side === 'PLAYER' ? state.playerBits : state.enemyBits;
            const bitsSetter = side === 'PLAYER' ? stateSetters.setPlayerBits : stateSetters.setEnemyBits;
            if (bits >= 1 && bitsSetter) {
                bitsSetter(prev => prev - 1);
                entity.power = (entity.power || 0) + 1;
                entity.HP = (entity.HP || 0) + 1;
                applyEffect(entity.id, entity.realm, side, {
                    type: 'status',
                    status: 'freeze',
                    amount: 1
                });
                updateEntityInRealm(entity, side);
                console.log(`${entity.card.name}: Paid 1 bit for +1/+1 and Freeze 1`);
            } else {
                console.log(`${entity.card.name}: Not enough bits`);
            }
        },
    },
    'BoostSelf': {
        name: 'BoostSelf',
        type: 'manual',
        cost: { bits: 1 },
        execute: function (entity, effect, side) {
            // Nova Kane: Pay 1 Bit ➔ Gain 1 Boost
            const bits = side === 'PLAYER' ? state.playerBits : state.enemyBits;
            const bitsSetter = side === 'PLAYER' ? stateSetters.setPlayerBits : stateSetters.setEnemyBits;
            if (bits >= 1 && bitsSetter) {
                bitsSetter(prev => prev - 1);
                applyEffect(entity.id, entity.realm, side, {
                    type: 'boost',
                    amount: 1
                });
                console.log(`${entity.card.name}: Paid 1 bit for Boost 1`);
            } else {
                console.log(`${entity.card.name}: Not enough bits`);
            }
        },
    },
    'GainActionWithWound': {
        name: 'GainActionWithWound',
        type: 'manual',
        cost: { bits: 1 },
        execute: function (entity, effect, side) {
            // Memory Leak: Pay 1 Bit ➔ Gain 1 Action and 1 Wound
            const bits = side === 'PLAYER' ? state.playerBits : state.enemyBits;
            const bitsSetter = side === 'PLAYER' ? stateSetters.setPlayerBits : stateSetters.setEnemyBits;
            const actionsSetter = side === 'PLAYER' ? stateSetters.setPlayerActions : stateSetters.setEnemyActions;
            if (bits >= 1 && bitsSetter) {
                bitsSetter(prev => prev - 1);
                if (actionsSetter) actionsSetter(prev => prev + 1);
                applyEffect(entity.id, entity.realm, side, {
                    type: 'wound',
                    amount: 1
                });
                console.log(`${entity.card.name}: Paid 1 bit for +1 Action and 1 Wound`);
            } else {
                console.log(`${entity.card.name}: Not enough bits`);
            }
        },
    },
    'DevelopFriendlyPlacesAndThings': {
        name: 'DevelopFriendlyPlacesAndThings',
        type: 'manual',
        cost: { bits: 2, actions: 1 },
        execute: function (entity, effect, side) {
            // Architect: Pay 2 Bits, Action ➔ Friendly Places and Things gain 2 Develop
            const bits = side === 'PLAYER' ? state.playerBits : state.enemyBits;
            const bitsSetter = side === 'PLAYER' ? stateSetters.setPlayerBits : stateSetters.setEnemyBits;
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            const actionsSetter = side === 'PLAYER' ? stateSetters.setPlayerActions : stateSetters.setEnemyActions;
            if (bits >= 2 && bitsSetter && actions >= 1 && actionsSetter) {
                bitsSetter(prev => prev - 2);
                actionsSetter(prev => prev - 1);

                const friendlyRealms = ['Solarium', 'Theater', 'Underpass', 'Grid'].map(name => {
                    return side === 'PLAYER' ? state[`player${name}`] : state[`enemy${name}`];
                });
                friendlyRealms.forEach(realm => {
                    if (!realm) return;
                    ['places', 'things'].forEach(arrayName => {
                        (realm[arrayName] || []).forEach(target => {
                            target.development = (target.development || 0) + 2;
                            updateEntityInRealm(target, side);
                        });
                    });
                });

                console.log(`${entity.card.name}: Paid 2 bits for friendly Places and Things to gain 2 Develop`);
            } else {
                console.log(`${entity.card.name}: Not enough bits`);
            }
        },
    },
    'BoostFriendlyEntities': {
        name: 'BoostFriendlyEntities',
        type: 'manual',
        cost: { bits: 1, exhaust: true },
        execute: function (entity, effect, side) {
            // Freight Train: Pay 1 Bit, Exhaust ➔ Friendly entities gain 1 Boost
            if (entity.exhausted) {
                console.log(`${entity.card.name} is already exhausted.`);
                return;
            }
            const bits = side === 'PLAYER' ? state.playerBits : state.enemyBits;
            const bitsSetter = side === 'PLAYER' ? stateSetters.setPlayerBits : stateSetters.setEnemyBits;
            if (bits >= 1 && bitsSetter) {
                bitsSetter(prev => prev - 1);
                exhaustEntity(entity, side);

                const friendlyRealms = ['Solarium', 'Theater', 'Underpass', 'Grid'].map(name => {
                    return side === 'PLAYER' ? state[`player${name}`] : state[`enemy${name}`];
                });
                friendlyRealms.forEach(realm => {
                    if (!realm || !realm.people) return;
                    realm.people.forEach(target => {
                        applyEffect(target.id, target.realm, side, {
                            type: 'boost',
                            amount: 1
                        });
                    });
                });

                console.log(`${entity.card.name}: Paid 1 bit and Exhausted to give friendly entities Boost 1`);
            } else {
                console.log(`${entity.card.name}: Not enough bits`);
            }
        },
    },
    'FreezeTargetJaw': {
        name: 'FreezeTargetJaw',
        type: 'manual',
        cost: { exhaust: true },
        requiresTarget: true,
        targetType: 'entity',
        targetFilter: (target) => target?.card?.subTypes?.includes('JAWbreaker'),
        execute: function (entity, effect, side, target) {
            // MouseByte: Exhaust ➔ Target JAW gains 1 Freeze
            if (entity.exhausted) {
                console.log(`${entity.card.name} is already exhausted.`);
                return;
            }
            if (target) {
                applyEffect(target.id, target.realm, side, {
                    type: 'status',
                    status: 'freeze',
                    amount: 1
                });
                exhaustEntity(entity, side);
                console.log(`${entity.card.name}: Exhausted to give target JAW Freeze 1`);
            }
        },
    },
    'BoostAndPounceTargetAlly': {
        name: 'BoostAndPounceTargetAlly',
        type: 'manual',
        cost: { exhaust: true },
        requiresTarget: true,
        targetType: 'entity',
        targetSide: 'PLAYER',
        targetFilter: (target) => target?.online,
        execute: function (entity, effect, side, target) {
            // Pharmacist: Exhaust ➔ Target friendly Online entity gains 2 Boost and Pounce
            if (entity.exhausted) {
                console.log(`${entity.card.name} is already exhausted.`);
                return;
            }
            if (target && target.online) {
                applyEffect(target.id, target.realm, side, {
                    type: 'boost',
                    amount: 2
                });
                target.hasPounce = true;
                updateEntityInRealm(target, side);
                exhaustEntity(entity, side);
                console.log(`${entity.card.name}: Exhausted to give target friendly Online entity +2 Boost and Pounce`);
            }
        },
    },
    'GainVengeanceWithWound': {
        name: 'GainVengeanceWithWound',
        type: 'manual',
        cost: { actions: 1 },
        execute: function (entity, effect, side) {
            // GooTooth: Action ➔ Gain 2 Vengeance and 1 Wound
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            const actionsSetter = side === 'PLAYER' ? stateSetters.setPlayerActions : stateSetters.setEnemyActions;
            if (actions >= 1 && actionsSetter) {
                actionsSetter(prev => prev - 1);
                applyEffect(entity.id, entity.realm, side, {
                    type: 'status',
                    status: 'vengeance',
                    amount: 2
                });
                applyEffect(entity.id, entity.realm, side, {
                    type: 'wound',
                    amount: 1
                });
                console.log(`${entity.card.name}: Paid 1 action for 2 Vengeance and 1 Wound`);
            } else {
                console.log(`${entity.card.name}: Not enough actions`);
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
            const [realm] = getRealmAndSetter(realmName, side);

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
        applyAbilityEffect: function(entity, gameState, side) {
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
                'Solarium': stateSetters.setPlayerSolarium,
                'Theater': stateSetters.setPlayerTheater,
                'Underpass': stateSetters.setPlayerUnderpass,
                'Grid': stateSetters.setPlayerGrid
            },
            'ENEMY': {
                'Solarium': stateSetters.setEnemySolarium,
                'Theater': stateSetters.setEnemyTheater,
                'Underpass': stateSetters.setEnemyUnderpass,
                'Grid': stateSetters.setEnemyGrid
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
                'Solarium': stateSetters.setPlayerSolarium,
                'Theater': stateSetters.setPlayerTheater,
                'Underpass': stateSetters.setPlayerUnderpass,
                'Grid': stateSetters.setPlayerGrid
            },
            'ENEMY': {
                'Solarium': stateSetters.setEnemySolarium,
                'Theater': stateSetters.setEnemyTheater,
                'Underpass': stateSetters.setEnemyUnderpass,
                'Grid': stateSetters.setEnemyGrid
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
                            power: (person.power || person.card.power || 0) - 1
                        };
                    }
                    return person;
                })
            }));
        });
    }
    },
    'Rotten': {
        name: 'Rotten',
        type: 'static',
        applyAbilityEffect: function(entity, gameState, side) {
        const enemySide = side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
        const enemyRealms = enemySide === 'PLAYER' ? [
            { realm: state.playerSolarium, setRealm: stateSetters.setPlayerSolarium, name: 'Solarium' },
            { realm: state.playerTheater, setRealm: stateSetters.setPlayerTheater, name: 'Theater' },
            { realm: state.playerUnderpass, setRealm: stateSetters.setPlayerUnderpass, name: 'Underpass' },
            { realm: state.playerGrid, setRealm: stateSetters.setPlayerGrid, name: 'Grid' }
        ] : [
                    { realm: state.enemySolarium, setRealm: stateSetters.setEnemySolarium, name: 'Solarium' },
                    { realm: state.enemyTheater, setRealm: stateSetters.setEnemyTheater, name: 'Theater' },
                    { realm: state.enemyUnderpass, setRealm: stateSetters.setEnemyUnderpass, name: 'Underpass' },
                    { realm: state.enemyGrid, setRealm: stateSetters.setEnemyGrid, name: 'Grid' },
                ];

            enemyRealms.forEach(({ realm, setRealm }) => {
                // Create a new array of updated entities
                const updatedPeople = realm.people.map((enemyEntity) => {
                    // Create a deep copy of the entity
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
                    { realm: state.playerSolarium, setRealm: stateSetters.setPlayerSolarium, name: 'Solarium' },
                    { realm: state.playerTheater, setRealm: stateSetters.setPlayerTheater, name: 'Theater' },
                    { realm: state.playerUnderpass, setRealm: stateSetters.setPlayerUnderpass, name: 'Underpass' },
                    { realm: state.playerGrid, setRealm: stateSetters.setPlayerGrid, name: 'Grid' },
                ]
                : [
                    { realm: state.enemySolarium, setRealm: stateSetters.setEnemySolarium, name: 'Solarium' },
                    { realm: state.enemyTheater, setRealm: stateSetters.setEnemyTheater, name: 'Theater' },
                    { realm: state.enemyUnderpass, setRealm: stateSetters.setEnemyUnderpass, name: 'Underpass' },
                    { realm: state.enemyGrid, setRealm: stateSetters.setEnemyGrid, name: 'Grid' },
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
            const { deadEntity } = eventData;
            if (deadEntity.card.abilities.some(ability => 
                typeof ability === 'string' ? ability === 'Decay' : ability.name === 'Decay'
            )) {
                if (side === 'PLAYER') {
                    playerGainFate(1);
                    playerGainOverload(2);
                } else {
                    enemyGainFate(1);
                    enemyGainOverload(2);
                }
                console.log(`${entity.card.name} triggered: gained 1 Fate and 2 Overload from decaying entity.`);
            }
        },
    },
    'DominanceGainCharge': {
        name: 'DominanceGainCharge',
        type: 'triggered',
        triggers: ['dominationResolved'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.winner === side) {
                applyEffect(entity.id, entity.realm, side, {
                    type: 'status',
                    status: 'charge',
                    amount: 1
                });
                console.log(`${entity.card.name} gains 1 Charge from winning domination.`);
            }
        }
    },
    'DominanceInflictFreeze': {
        name: 'DominanceInflictFreeze',
        type: 'triggered',
        triggers: ['dominationResolved'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.winner === side) {
                const enemySide = getOppositeSide(side);
                const isLocal = entity.card.abilities.some(ability => 
                    typeof ability === 'string' ? ability === 'Locality' : ability.name === 'Locality'
                );
                
                // Get all enemy realms or just the local realm
                const realms = isLocal ? [entity.realm] : ['Solarium', 'Theater', 'Underpass', 'Grid'];
                
                realms.forEach(realmName => {
                    const [realm] = getRealmAndSetter(realmName, enemySide);
                    realm.people.forEach(target => {
                        if (target.online) {
                            applyEffect(target.id, realmName, enemySide, {
                                type: 'status',
                                status: 'freeze',
                                amount: 1
                            });
                        }
                    });
                });
                
                console.log(`${entity.card.name} freezes enemy entities from domination victory.`);
            }
        }
    },
    'Sabotage': {
        name: 'Sabotage',
        type: 'triggered',
        triggers: ['cardStolen'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Sabotage triggers when ANY side steals a Sym or LM
            // TerraBite: Inflict 3 Wounds
            // Operator: Inflict 2 Lag
            const ability = entity.card.abilities?.find(a => a.name === 'Sabotage');
            const effectType = ability?.effectType || 'wounds'; // 'wounds' or 'lag'
            const amount = ability?.amount || 3;

            const targetSide = eventData.side === 'PLAYER' ? 'ENEMY' : 'PLAYER';

            if (effectType === 'lag') {
                // Inflict Lag
                if (targetSide === 'PLAYER') {
                    stateSetters.setPlayerLag && stateSetters.setPlayerLag(prev => prev + amount);
                } else {
                    stateSetters.setEnemyLag && stateSetters.setEnemyLag(prev => prev + amount);
                }
                console.log(`${entity.card.name} Sabotage: Inflicted ${amount} Lag to ${targetSide}`);
            } else {
                // Inflict Wounds
                if (targetSide === 'PLAYER') {
                    stateSetters.setPlayerWounds && stateSetters.setPlayerWounds(prev => prev + amount);
                } else {
                    stateSetters.setEnemyWounds && stateSetters.setEnemyWounds(prev => prev + amount);
                }
                console.log(`${entity.card.name} Sabotage: Inflicted ${amount} Wounds to ${targetSide}`);
            }
        }
    },
    'Impostor': {
        name: 'Impostor',
        type: 'onPlay',
        requiresTarget: true,
        targetType: 'entity',
        targetFilter: function (target, entity, side) {
            // Target must be an enemy entity in the same realm
            if (!target || !target.online) return false;
            const targetSide = target.owner;
            if (targetSide === side) return false;
            return entity.realm === target.realm;
        },
        onPlay: async function (entity, gameState, side) {
            // Resolve Impostor: swap control and realm of entity and target
            const targetSelection = gameState[`${side.toLowerCase()}TargetSelection`];
            if (!targetSelection) return;

            const enemyEntity = targetSelection;
            const realmName = entity.realm;
            const enemySide = getOppositeSide(side);

            // Get the appropriate realm setters
            const [, ownRealmSetter] = getRealmAndSetter(realmName, side);
            const [, opponentRealmSetter] = getRealmAndSetter(realmName, enemySide);
            if (!ownRealmSetter || !opponentRealmSetter) {
                console.error(`Could not find realm setters for ${realmName}`);
                return;
            }

            swapEntitiesForImpostor(
                entity,
                enemyEntity,
                realmName,
                ownRealmSetter,
                opponentRealmSetter,
                side,
                false
            );

            console.log(`${entity.card.name} Impostor: Swapped with ${enemyEntity.card.name} in ${realmName}`);
        }
    },
    'DreamersAreImpostors': {
        name: 'DreamersAreImpostors',
        type: 'triggered',
        triggers: ['entityEntered'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Recruiter: Your Dreamers are Impostors
            if (eventData.side === side) {
                const enteredEntity = eventData.entity;
                if (!enteredEntity) return;

                const isDreamer = enteredEntity.card.subTypes?.includes('Dreamer') ||
                    enteredEntity.card.keywords?.toLowerCase().includes('dreamer');
                if (!isDreamer) return;

                // Grant Impostor ability if not already present
                if (!enteredEntity.card.abilities) {
                    enteredEntity.card.abilities = [];
                }
                if (!enteredEntity.card.abilities.some(a => a.name === 'Impostor')) {
                    enteredEntity.card.abilities.push({ name: 'Impostor' });
                }

                updateEntityInRealm(enteredEntity, side);
                console.log(`${entity.card.name} granted Impostor to ${enteredEntity.card.name}`);
            }
        }
    },
    'Vicious': {
        name: 'Vicious',
        type: 'triggered',
        triggers: ['entityEntered'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Vicious N: deal N Wounds to this entity's owner when it becomes active.
            if (eventData.side !== side) return;
            if (eventData.entity?.id !== entity.id) return;

            const amount = keywordAmount(entity.card, 'vicious', 'Vicious');
            if (amount <= 0) return;

            if (side === 'PLAYER') {
                playerGainWounds(amount);
            } else {
                enemyGainWounds(amount);
            }
            console.log(`${entity.card.name} Vicious: dealt ${amount} Wounds to its owner (${side})`);
        },
    },
    'Gravity': {
        name: 'Gravity',
        type: 'triggered',
        triggers: ['entityEntered'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Gravity N: owner's next Action gain is reduced by N. Lag already has
            // exactly these absorb-once semantics, so Gravity grants Lag.
            if (eventData.side !== side) return;
            if (eventData.entity?.id !== entity.id) return;

            const amount = keywordAmount(entity.card, 'gravity', 'Gravity');
            if (amount <= 0) return;

            if (side === 'PLAYER') {
                stateSetters.setPlayerLag && stateSetters.setPlayerLag(prev => prev + amount);
            } else {
                stateSetters.setEnemyLag && stateSetters.setEnemyLag(prev => prev + amount);
            }
            console.log(`${entity.card.name} Gravity: ${side} next Action gain reduced by ${amount}`);
        },
    },
    'GainVengeance': {
        name: 'GainVengeance',
        type: 'manual',
        cost: { actions: 2 },
        execute: function (entity, effect, side) {
            // BluTooth: 2 Actions ➔ Gain Vengeance 4
            const ability = entity.card.abilities?.find(a => a.name === 'GainVengeance');
            const amount = ability?.amount || 4;
            const cost = 2;

            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            const actionsSetter = side === 'PLAYER' ? stateSetters.setPlayerActions : stateSetters.setEnemyActions;
            if (actions < cost || !actionsSetter) {
                console.log(`${entity.card.name}: Not enough actions`);
                return;
            }

            actionsSetter(prev => prev - cost);
            applyEffect(entity.id, entity.realm, side, {
                type: 'status',
                status: 'vengeance',
                amount: amount
            });
            console.log(`${entity.card.name}: Paid ${cost} actions for ${amount} Vengeance`);
        },
    },
    'OnEnterGainActions': {
        name: 'OnEnterGainActions',
        type: 'triggered',
        triggers: ['entityEntered'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Blood Sugar: Gain 3 Actions upon entering play
            if (eventData.side !== side) return;
            if (eventData.entity?.id !== entity.id) return;

            const ability = entity.card.abilities?.find(a => a.name === 'OnEnterGainActions');
            const amount = ability?.actionsGained ?? ability?.amount ?? 3;

            if (side === 'PLAYER') {
                playerGainActions(amount);
            } else {
                enemyGainActions(amount);
            }
            console.log(`${entity.card.name} entered play: gained ${amount} Actions`);
        },
    },
    'InflictOverloadAndLag': {
        name: 'InflictOverloadAndLag',
        type: 'triggered',
        triggers: ['entityEntered'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Saboteur: Inflict 2 Overload and 1 Lag upon entering play
            if (eventData.side !== side) return;
            if (eventData.entity?.id !== entity.id) return;

            const ability = entity.card.abilities?.find(a => a.name === 'InflictOverloadAndLag');
            const overload = ability?.overloadAmount ?? ability?.amount ?? 2;
            const lag = ability?.lagAmount ?? 1;
            const targetSide = getOppositeSide(side);

            applyOverload(targetSide, overload);
            if (targetSide === 'PLAYER') {
                stateSetters.setPlayerLag && stateSetters.setPlayerLag(prev => prev + lag);
            } else {
                stateSetters.setEnemyLag && stateSetters.setEnemyLag(prev => prev + lag);
            }
            console.log(`${entity.card.name} entered play: inflicted ${overload} Overload and ${lag} Lag on ${targetSide}`);
        },
    },
    'GainAshAndInflictOverload': {
        name: 'GainAshAndInflictOverload',
        type: 'manual',
        cost: { exhaust: true },
        execute: function (entity, effect, side) {
            // Con Artist: Exhaust ➔ Gain 4 Ash and inflict 4 Overload
            if (entity.exhausted) {
                console.log(`${entity.card.name} is already exhausted.`);
                return;
            }

            const ability = entity.card.abilities?.find(a => a.name === 'GainAshAndInflictOverload');
            const ashAmount = ability?.ashAmount ?? ability?.amount ?? 4;
            const overloadAmount = ability?.overloadAmount ?? ability?.amount ?? 4;

            if (side === 'PLAYER') {
                playerGainAshes(ashAmount);
            } else {
                enemyGainAshes(ashAmount);
            }
            applyOverload(getOppositeSide(side), overloadAmount);
            exhaustEntity(entity, side);
            console.log(`${entity.card.name}: Exhausted to gain ${ashAmount} Ash and inflict ${overloadAmount} Overload`);
        },
    },
};

// Export helper functions and abilities
export { abilityHelpers, abilitiesDefinitions, grantAbility, removeAbility };

async function activateAbilities(entity, side) {
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
                abilityDef.applyAbilityEffect(entity, state, side);
                entity.activeAbilities.push({ abilityName, abilityDef });
            } else if (abilityDef.type === 'triggered') {
                console.log('activate trigger listener');
                abilityDef.triggers.forEach((eventType) => {
                    const handler = (eventData) => {
                        if (entity.scheming && !entity.schemeUnlocked) {
                            return;
                        }
                        abilityDef.eventHandler(entity, eventData, state, side);
                    };
                    eventManager.subscribe(eventType, handler);
                    entity.activeAbilities.push({ abilityName, eventType, handler });
                });
            } else if (abilityDef.type === 'manual') {
                entity.activeAbilities.push({ abilityName, abilityDef });
            } else if (abilityDef.type === 'onActivate') {
                console.log('on activate');
                abilityDef.onActivate(entity, state, side); 
                entity.activeAbilities.push({ abilityName, abilityDef });
            }
        }
    }
}

export { activateAbilities };

function grantAbility(entity, abilityName, amount = 1, side) {
    const realmName = entity.realm;
    const [realm, setRealm] = getRealmAndSetter(realmName, side);

    const entityIndex = realm.people.findIndex((e) => e.id === entity.id);
    if (entityIndex === -1) {
        console.error(`Entity with ID ${entity.id} not found in realm`);
        return;
    }

    const updatedEntity = { ...realm.people[entityIndex] };

    if (!updatedEntity.abilities) {
        updatedEntity.abilities = {};
    }

    if (!updatedEntity.abilities[abilityName]) {
        updatedEntity.abilities[abilityName] = 0;
    }

    updatedEntity.abilities[abilityName] += amount;

    const newPeople = [...realm.people];
    newPeople[entityIndex] = updatedEntity;

    setRealm({
        ...realm,
        people: newPeople
    });

    console.log(`${entity.card.name} gains ${abilityName} (${updatedEntity.abilities[abilityName]}).`);
}

function removeAbility(entity, abilityName, amount = 1, side) {
    const realmName = entity.realm;
    const [realm, setRealm] = getRealmAndSetter(realmName, side);

    const entityIndex = realm.people.findIndex((e) => e.id === entity.id);
    if (entityIndex === -1) {
        console.error(`Entity with ID ${entity.id} not found in realm`);
        return;
    }

    const updatedEntity = { ...realm.people[entityIndex] };

    if (!updatedEntity.abilities) {
        updatedEntity.abilities = {};
    }
}

export function clearVengeance(entity, side) {
    let location = 'REALM';
    let realm = null;
    let setRealm = null;
    let entityIndex = -1;
    let setRealmOrBattleSlots = null;

    // Check if entity is in battle
    const playerBattleCard = state.playerBattleSlots.find((card) => card && card.id === entity.id);
    const enemyBattleCard = state.enemyBattleSlots.find((card) => card && card.id === entity.id);

    if (playerBattleCard || enemyBattleCard) {
        location = 'BATTLE';

        if (playerBattleCard) {
            setRealmOrBattleSlots = stateSetters.setPlayerBattleSlots;
            entityIndex = state.playerBattleSlots.findIndex((card) => card && card.id === entity.id);
        } else {
            setRealmOrBattleSlots = stateSetters.setEnemyBattleSlots;
            entityIndex = state.enemyBattleSlots.findIndex((card) => card && card.id === entity.id);
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
                people: newPeople
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

export function deactivateAbilities(entity, side) {
    // Find the entity in the appropriate realm
    let location = 'REALM';
    let realm = null;
    let setRealm = null;
    let entityIndex = -1;
    let setRealmOrBattleSlots = null;

    // Check if entity is in battle
    const playerBattleCard = state.playerBattleSlots.find((card) => card && card.id === entity.id);
    const enemyBattleCard = state.enemyBattleSlots.find((card) => card && card.id === entity.id);

    if (playerBattleCard || enemyBattleCard) {
        location = 'BATTLE';

        if (playerBattleCard) {
            setRealmOrBattleSlots = stateSetters.setPlayerBattleSlots;
            entityIndex = state.playerBattleSlots.findIndex((card) => card && card.id === entity.id);
        } else {
            setRealmOrBattleSlots = stateSetters.setEnemyBattleSlots;
            entityIndex = state.enemyBattleSlots.findIndex((card) => card && card.id === entity.id);
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

    // Remove all abilities
    const updatedEntity = { ...currentEntity };
    delete updatedEntity.abilities;

    // Update based on location
    if (location === 'REALM') {
        const newPeople = [...realm.people];
        newPeople[entityIndex] = updatedEntity;

        setRealm({
            ...realm,
            people: newPeople
        });
    } else {
        setRealmOrBattleSlots((prev) =>
            prev.map((card) =>
                card && card.id === entity.id ? updatedEntity : card
            )
        );
    }

    console.log(`Abilities deactivated for ${updatedEntity.card.name}`);
}

export function swapEntitiesForImpostor(selectedCard, enemyEntity, realmName, setOwnRealm, setOpponentRealm, side, dreamer) {
    // Update ownership and realm properties
    const updatedSelectedCard = { ...selectedCard, realm: realmName, owner: getOppositeSide(side) };
    const updatedEnemyEntity = { ...enemyEntity, realm: realmName, owner: side };

    // Determine which arrays to use based on card categories
    const selectedCardArrayName = getArrayNameForCategory(selectedCard.card.category);
    const enemyCardArrayName = getArrayNameForCategory(enemyEntity.card.category);

    // Remove enemy entity from opponent realm
    setOpponentRealm((prevRealm) => ({
        ...prevRealm,
        [enemyCardArrayName]: prevRealm[enemyCardArrayName].filter((entity) => entity.id !== enemyEntity.id)
    }));

    // Add enemy entity to own realm
    setOwnRealm((prevRealm) => ({
        ...prevRealm,
        [enemyCardArrayName]: [...prevRealm[enemyCardArrayName], updatedEnemyEntity]
    }));

    // Add selected card to opponent realm
    setOpponentRealm((prevRealm) => ({
        ...prevRealm,
        [selectedCardArrayName]: [...prevRealm[selectedCardArrayName], updatedSelectedCard]
    }));

    // Activate abilities for a Dreamer
    if (dreamer) {
        activateAbilities(updatedSelectedCard, getOppositeSide(side));
    }
}

export function exhaustEntity(entity, side) {
    let location = 'REALM';
    let realm, setRealm;
    let entityIndex = -1;
    let setRealmOrBattleSlots;

    // Check if entity is in battle
    const playerBattleCard = state.playerBattleSlots.find((card) => card && card.id === entity.id);
    const enemyBattleCard = state.enemyBattleSlots.find((card) => card && card.id === entity.id);

    if (playerBattleCard || enemyBattleCard) {
        location = 'BATTLE';

        if (playerBattleCard) {
            setRealmOrBattleSlots = stateSetters.setPlayerBattleSlots;
            entityIndex = state.playerBattleSlots.findIndex((card) => card && card.id === entity.id);
        } else {
            setRealmOrBattleSlots = stateSetters.setEnemyBattleSlots;
            entityIndex = state.enemyBattleSlots.findIndex((card) => card && card.id === entity.id);
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
                people: newPeople
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

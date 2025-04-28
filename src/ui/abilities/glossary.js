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
    getFriendlyEntities
} from '../helpers/core';

import { applyBoost } from '../helpers/advancement';
import { handleDamage, handleDeadCard, handlePlaceDamage, handleDestroyedThing } from '../helpers/damage';
import { getOppositeSide, getRealmAndSetter, getArrayNameForCategory } from '../helpers/utils';
import { applyEffect, applyFreezeToAllEntities, applyOverload } from '../helpers/effects';
import { updateEntityInRealm, drawSpecificCard } from '../helpers/entity';

const {
    playerSolarium, playerTheater, playerUnderpass, playerGrid,
    enemySolarium, enemyTheater, enemyUnderpass, enemyGrid,
    playerBattleSlots, enemyBattleSlots,
    playerLibrary, enemyLibrary,
    playerInterfaced, enemyInterfaced,
    playerInterfacedHeadSpace, enemyInterfacedHeadSpace,
    playerActions, enemyActions
} = state;

const {
    setPlayerSolarium, setPlayerTheater, setPlayerUnderpass, setPlayerGrid,
    setEnemySolarium, setEnemyTheater, setEnemyUnderpass, setEnemyGrid,
    setPlayerBattleSlots, setEnemyBattleSlots,
    setPlayerHand, setEnemyHand, setAttackMode,
    setTargetType, setSelectedRealm,
    setPlayerPandoraAccess, setEnemyPandoraAccess,
    setPlayerDriftCount, setEnemyDriftCount,
    setPlayerDividendAmount, setEnemyDividendAmount,
    setPlayerActions, setEnemyActions,
    setPlayerBits, setEnemyBits,
    setPlayerOverload, setEnemyOverload,
    showModal, setModalVisible
} = stateSetters;

// Define ability helpers for internal use
const abilityHelpers = {
    clearVengeance: function(entity, side) {
        let location = 'REALM';
        let realm = null;
        let setRealm = null;
        let entityIndex = -1;
        let setRealmOrBattleSlots = null;

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
                { realm: playerSolarium, setRealm: setPlayerSolarium },
                { realm: playerTheater, setRealm: setPlayerTheater },
                { realm: playerUnderpass, setRealm: setPlayerUnderpass },
                { realm: playerGrid, setRealm: setPlayerGrid }
            ] : [
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
        onPlay: function (entity, state, side) {
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
        applyAbilityEffect: function (entity, gameState, side) {
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
        applyAbilityEffect: function(entity, gameState, side) {
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
        }
    },
    'Dividend': (amount) => ({
        name: 'Dividend',
        type: 'static',
        applyAbilityEffect: function (entity, gameState, side) {
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
            { realm: playerSolarium, setRealm: setPlayerSolarium, name: 'Solarium' },
            { realm: playerTheater, setRealm: setPlayerTheater, name: 'Theater' },
            { realm: playerUnderpass, setRealm: setPlayerUnderpass, name: 'Underpass' },
            { realm: playerGrid, setRealm: setPlayerGrid, name: 'Grid' }
        ] : [
                    { realm: enemySolarium, setRealm: setEnemySolarium, name: 'Solarium' },
                    { realm: enemyTheater, setRealm: setEnemyTheater, name: 'Theater' },
                    { realm: enemyUnderpass, setRealm: setEnemyUnderpass, name: 'Underpass' },
                    { realm: enemyGrid, setRealm: setEnemyGrid, name: 'Grid' },
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
                    const [realm, setRealm] = getRealmAndSetter(realmName, enemySide);
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
                abilityDef.applyEffect(entity, state, side);
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

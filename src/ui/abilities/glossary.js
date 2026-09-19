import { state, stateSetters } from '../helpers/state';
import { showModal, hideModal } from '../helpers/modal';
import { eventManager } from '../helpers/eventManager';
import { cardList1 as cardList } from '../data/cardList';
import { 
    playerGainFate, playerGainOverload, 
    enemyGainFate, enemyGainOverload,
    playerGainBits, enemyGainBits,
    playerGainWounds, enemyGainWounds,
    playerGainBurden, enemyGainBurden,
    playerGainActions, enemyGainActions,
    playerGainAshes, enemyGainAshes,
    playerGainSurge, enemyGainSurge,
    getFriendlyEntities, detoxEntities
} from '../helpers/core';

import { applyBoost } from '../helpers/advancement';
import { handleDamage, handleDeadCard, handlePlaceDamage, handleDestroyedThing, handleDestroyedPlace } from '../helpers/damage';
import { getOppositeSide, getRealmAndSetter, getArrayNameForCategory, getAllPlayerRealms, getAllEnemyRealms } from '../helpers/utils';
import { draw as playerDraw, gainLag as playerGainLag } from '../helpers/player';
import { draw as enemyDraw, gainLag as enemyGainLag } from '../helpers/enemy';
import { applyEffect, applyFreezeToAllEntities, applyOverload } from '../helpers/effects';
import { updateEntityInRealm, drawSpecificCard } from '../helpers/entity';
import { keywordAmount } from '../helpers/setup';
import { applyAmbushOnEntry, tryBribe } from '../helpers/combatKeywords';


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

// Green faction helpers (Decay/Toxic/Destiny/Questing mechanics)
function countDecayingEntities(side) {
    const realms = side === 'PLAYER' ? getAllPlayerRealms() : getAllEnemyRealms();
    return realms.reduce((sum, realm) => sum + (realm.people || []).filter(e => e.decay > 0).length, 0);
}

function getAllOnlineEntities(side) {
    const realms = side === 'PLAYER' ? getAllPlayerRealms() : getAllEnemyRealms();
    return realms.flatMap(realm => (realm.people || []).filter(e => e.online));
}

function findLibraryCardByPredicate(side, predicate) {
    const library = side === 'PLAYER' ? state.playerLibrary : state.enemyLibrary;
    return (library || []).find(predicate);
}

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
            const bitsToGain = totalEntities * 1;
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
        // Wasteland: Interface, Departed ➔ Inflict 2 Wounds.
        // NOTE: no "landmark departed" lifecycle event currently exists anywhere
        // in the codebase (Landmarks have no implemented plot-completion/exit
        // mechanic), so the "Departed" half of this trigger is a no-op until
        // that lifecycle is implemented. "Interface" is fully wired.
        name: "Wasteland",
        type: "triggered",
        triggers: ["interface", "landmarkDeparted"],
        eventHandler: function (entity, eventData, gameState, side) {
            const isInterfaceTrigger = eventData.targetType !== undefined && eventData.side === side;
            const isDepartedTrigger = eventData.entityId === entity.id && eventData.side === side;
            if (isInterfaceTrigger || isDepartedTrigger) {
                const ability = entity.card.abilities?.find(a => a.name === 'Wasteland');
                const amount = ability?.amount || 2;
                const opponentSide = getOppositeSide(side);
                if (opponentSide === 'PLAYER') { playerGainWounds(amount); } else { enemyGainWounds(amount); }
                console.log(`${entity.card.name} inflicted ${amount} Wounds to ${opponentSide}.`);
            }
        },
    },
    'CatCafeAscended': {
        // Cat Cafe: Maintenance ➔ Inflict 1 Lag.
        name: "CatCafeAscended",
        type: "triggered",
        triggers: ["maintain"],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side) {
                const ability = entity.card.abilities?.find(a => a.name === 'CatCafeAscended');
                const amount = ability?.amount || 1;
                const enemySide = getOppositeSide(side);
                if (enemySide === 'PLAYER') { playerGainLag(amount); } else { enemyGainLag(amount); }
                console.log(`${entity.card.name} Maintenance: inflicted ${amount} Lag.`);
            }
        },
    },
    'AdrenochromeAscend': {
        name: 'AdrenochromeAscend',
        type: 'onAscend',
        onAscend: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                playerGainAshes(4);
                playerGainActions(3);
                playerGainWounds(2);
            } else {
                enemyGainAshes(4);
                enemyGainActions(3);
                enemyGainWounds(2);
            }
            console.log(`${entity.card.name} has granted 4 Ash, 3 Actions, and 2 Wounds to ${side}.`);
        },
    },
    'ImplantsEffect': {
        name: 'ImplantsEffect',
        type: 'onPlay',
        onPlay: function (entity, state, side) {
            // Grant +4 Surge and +4 Ash
            if (side === 'PLAYER') {
                playerGainSurge(4);
                playerGainAshes(4);
            } else {
                enemyGainSurge(4);
                enemyGainAshes(4);
            }

            // Search Pandora for JAWbreaker entities
            const pandora = side === 'PLAYER' ? state.playerLibrary : state.enemyLibrary; // Ensure these state variables exist
            //console.log(pandora)
            const jawbreakerEntities = pandora.filter(entity =>
                entity.card.subTypes?.includes('JAWbreaker')
            );
            console.log(jawbreakerEntities)
            if (jawbreakerEntities.length > 0) {
                // `stateSetters.showModal` does not exist -- this threw a
                // TypeError every time the ability triggered. The confirm and
                // cancel handlers were also *called* here rather than passed,
                // so they closed the modal at construction time and left
                // undefined as the handler.
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
                                            hideModal();
                                        }}
                                        style={{ cursor: 'pointer', marginBottom: '5px' }}
                                    >
                                        {jb.card.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ),
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
            const hasHacked = side === 'PLAYER' ? state.playerInterfaced : state.enemyInterfaced;
            if (hasHacked && target) {
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
                applyEffect(target.id, target.realm, side, {
                    type: 'stat',
                    field: 'stealth',
                    value: 1,
                });
                applyEffect(target.id, target.realm, side, {
                    type: 'stat',
                    field: 'charge',
                    value: 1,
                });
                console.log(`${entity.card.name}: gave ${target.card.name} +1/+1, Stealth, and Charge.`);
            } else {
                console.log(`${entity.card.name}: requires a successful Hack and a target JAWbreaker to resolve.`);
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
    'MultiThreadingEffect': {
        name: 'MultiThreadingEffect',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            // Set up a one-time listener for successfulHack/failedHack on HeadSpace
            const handler = (eventData) => {
                if (eventData.side === side && eventData.targetType === 'HEADSPACE') {
                    if (eventData.success) {
                        if (side === 'PLAYER') {
                            stateSetters.setPlayerAccessBonus(prev => (prev || 0) + 2);
                            playerGainActions(2);
                        } else {
                            stateSetters.setEnemyAccessBonus(prev => (prev || 0) + 2);
                            enemyGainActions(2);
                        }
                        console.log(`${entity.card.name}: Hack succeeded, Interface +2 cards and gain 2 Actions.`);
                    }
                    eventManager.unsubscribe('successfulHack', handler);
                    eventManager.unsubscribe('failedHack', handler);
                }
            };

            eventManager.subscribe('successfulHack', handler);
            eventManager.subscribe('failedHack', handler);

            // Initiate a Hack attack on HeadSpace (Underpass). Rituals are
            // only played by the human player today (see BrainFreezeHackPandora),
            // so this mirrors that pattern rather than the still-unwired
            // enemy-side hack targeting.
            stateSetters.setAttackMode('PLAYER_HACK');
            stateSetters.setTargetType('HEADSPACE');
            stateSetters.setSelectedRealm('Underpass');
        },
    },
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
    'PrecognitionSchemeFirstHeadSpaceGainActions': {
        // Precognition: Scheme 2: The first time you Interface HeadSpace each
        // turn, gain 3 Actions.
        name: 'PrecognitionSchemeFirstHeadSpaceGainActions',
        type: 'triggered',
        triggers: ['interface'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (entity.scheming && !entity.schemeUnlocked) return;
            if (eventData.side !== side || eventData.targetType !== 'HEADSPACE') return;
            if (entity.abilityUsedThisTurn) return;

            const ability = entity.card.abilities?.find(a => a.name === 'PrecognitionSchemeFirstHeadSpaceGainActions');
            const amount = ability?.actionAmount || 3;
            if (side === 'PLAYER') { playerGainActions(amount); } else { enemyGainActions(amount); }
            entity.abilityUsedThisTurn = true;
            console.log(`${entity.card.name}: first HeadSpace Interface this turn, gained ${amount} Actions.`);
        },
    },
    'OnPlayGainBitsAndAsh': {
        // Stolen Briefcase: Gain 5 Bits and 5 Ash.
        name: 'OnPlayGainBitsAndAsh',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            const ability = entity.card.abilities?.find(a => a.name === 'OnPlayGainBitsAndAsh');
            const bitAmount = ability?.bitAmount || 5;
            const ashAmount = ability?.ashAmount || 5;
            if (side === 'PLAYER') { playerGainBits(bitAmount); playerGainAshes(ashAmount); } else { enemyGainBits(bitAmount); enemyGainAshes(ashAmount); }
            console.log(`${entity.card.name}: gained ${bitAmount} Bits and ${ashAmount} Ash.`);
        },
    },
    'OnPlayHackHeadSpaceThenFreezeAndOverload': {
        // Brain Freeze: Perform a Hack on HeadSpace. If successful, give all
        // entities Freeze 3 and inflict 2 Overload.
        // (Simplified: the Hack is treated as automatically successful rather
        // than resolving through the normal player-driven Hack flow.)
        name: 'OnPlayHackHeadSpaceThenFreezeAndOverload',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            const ability = entity.card.abilities?.find(a => a.name === 'OnPlayHackHeadSpaceThenFreezeAndOverload');
            const freezeAmount = ability?.freezeAmount || 3;
            const overloadAmount = ability?.overloadAmount || 2;
            const enemySide = getOppositeSide(side);

            [...getAllPlayerRealms().flatMap(r => (r.people || []).map(e => ({ e, entitySide: 'PLAYER' }))),
             ...getAllEnemyRealms().flatMap(r => (r.people || []).map(e => ({ e, entitySide: 'ENEMY' })))]
                .forEach(({ e, entitySide }) => {
                    applyEffect(e.id, e.realm, entitySide, { type: 'status', status: 'freeze', amount: freezeAmount });
                });
            applyOverload(enemySide, overloadAmount);

            console.log(`${entity.card.name}: Hacked HeadSpace, all entities gain Freeze ${freezeAmount}, inflicted ${overloadAmount} Overload.`);
        },
    },
    'OnPlayGainBitsIfInterfacedPandora': {
        // Dead Drop: If you Interfaced Pandora this turn, +7 Bits.
        // (The "place an enemy Adrenochrome IRL" clause is not implemented --
        // there is no existing mechanic for placing a copy of an opposing
        // faction's card into a board, so it is omitted here.)
        name: 'OnPlayGainBitsIfInterfacedPandora',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            const interfacedPandora = side === 'PLAYER' ? state.playerInterfacedPandora : state.enemyInterfacedPandora;
            if (!interfacedPandora) {
                console.log(`${entity.card.name}: Pandora was not Interfaced this turn, no effect.`);
                return;
            }
            const ability = entity.card.abilities?.find(a => a.name === 'OnPlayGainBitsIfInterfacedPandora');
            const bitAmount = ability?.bitAmount || 7;
            if (side === 'PLAYER') { playerGainBits(bitAmount); } else { enemyGainBits(bitAmount); }
            console.log(`${entity.card.name}: Interfaced Pandora this turn, gained ${bitAmount} Bits.`);
        },
    },
    'DataBombWhenInterfaced': {
        name: 'DataBombWhenInterfaced',
        type: 'triggered',
        triggers: ['snipAccessed'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Check if the accessed card is this entity
            if (eventData.card?.id !== entity.id) {
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
                const freezeAmount = effect.freezeAmount || 5;
                handleDestroyedThing(entity.realm, entity.id, side);
                applyEffect(target.id, target.realm, target.owner, {
                    type: 'status',
                    status: 'freeze',
                    amount: freezeAmount,
                });
                console.log(`${target.card.name} gains Freeze ${freezeAmount} from ${entity.card.name}.`);
            } else {
                console.log('No target selected for Data Bomb\'s ability.');
            }
        },
    },
    'PandoraAccess': {
        name: 'PandoraAccess',
        type: 'static',
        applyAbilityEffect: function (entity, gameState, side) {
            const ability = entity.card.abilities?.find(a => a.name === 'PandoraAccess');
            const amount = ability?.amount || 1;
            if (side === 'PLAYER') {
                stateSetters.setPlayerPandoraAccess(prev => prev + amount);
            } else {
                stateSetters.setEnemyPandoraAccess(prev => prev + amount);
            }
            console.log(`${entity.card.name} increases Pandora Access by ${amount}.`);
        },
        removeEffect: function (entity, gameState, side) {
            const ability = entity.card.abilities?.find(a => a.name === 'PandoraAccess');
            const amount = ability?.amount || 1;
            if (side === 'PLAYER') {
                stateSetters.setPlayerPandoraAccess(prev => prev - amount);
            } else {
                stateSetters.setEnemyPandoraAccess(prev => prev - amount);
            }
            console.log(`${entity.card.name} decreases Pandora Access by ${amount}.`);
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
                        stateSetters.setPlayerActions(prevActions => prevActions + amount);
                    } else {
                        stateSetters.setEnemyActions(prevActions => prevActions + amount);
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
            if (eventData.side === side && eventData.entityId === entity.id) {
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
    // Orange Cards - Action Abilities
    'ActionGainVengeanceAndWound': {
        name: 'ActionGainVengeanceAndWound',
        type: 'manual',
        execute: function (entity, effect, side) {
            // GooTooth: Action ➔ Gain 2 Vengeance and 1 Wound
            const vengeanceAmount = effect.vengeanceAmount || 2;
            const woundAmount = effect.woundAmount || 1;

            // Apply Vengeance
            applyEffect(entity.id, entity.realm, side, {
                type: 'status',
                status: 'Vengeance',
                amount: vengeanceAmount
            });

            // Apply Wounds to self
            if (side === 'PLAYER') {
                stateSetters.setPlayerWounds(prev => prev + woundAmount);
            } else {
                stateSetters.setEnemyWounds(prev => prev + woundAmount);
            }

            console.log(`${entity.card.name} Action: Gained ${vengeanceAmount} Vengeance and ${woundAmount} Wound.`);
        }
    },
    'ExhaustTargetJAWFreeze': {
        name: 'ExhaustTargetJAWFreeze',
        type: 'manual',
        requiresTarget: true,
        targetFilter: (target) => target.card.subTypes?.includes('JAWbreaker'),
        execute: function (entity, effect, side, target) {
            // MouseByte: Exhaust ➔ Target JAW gains 1 Freeze
            if (!target) {
                console.log('No target selected for ExhaustTargetJAWFreeze');
                return;
            }

            const freezeAmount = effect.freezeAmount || 1;

            // Exhaust the entity
            exhaustEntity(entity, side);

            // Apply Freeze to target
            applyEffect(target.id, target.realm, target.owner, {
                type: 'status',
                status: 'freeze',
                amount: freezeAmount
            });

            console.log(`${entity.card.name} Exhaust: ${target.card.name} gains Freeze ${freezeAmount}.`);
        }
    },
    'ExhaustGrantBoostAndPounce': {
        name: 'ExhaustGrantBoostAndPounce',
        type: 'manual',
        requiresTarget: true,
        targetFilter: (target, entity) => target.owner === entity.owner && target.online,
        execute: function (entity, effect, side, target) {
            // Pharmacist: Exhaust ➔ Target friendly Online entity gains 2 Boost and Pounce
            if (!target) {
                console.log('No target selected for ExhaustGrantBoostAndPounce');
                return;
            }

            const boostAmount = effect.boostAmount || 2;

            // Exhaust the entity
            exhaustEntity(entity, side);

            // Apply Boost
            applyBoost(target, boostAmount, side);

            // Grant Pounce
            applyEffect(target.id, target.realm, side, {
                type: 'status',
                status: 'pounce',
                amount: 1
            });

            console.log(`${entity.card.name} Exhaust: ${target.card.name} gains Boost ${boostAmount} and Pounce.`);
        }
    },
    'DominanceInflictOverloadAndLifeless': {
        name: 'DominanceInflictOverloadAndLifeless',
        type: 'triggered',
        triggers: ['dominanceWon'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Con Artist: Dominance ➔ Inflict 2 Overload and gain Lifeless
            if (eventData.side === side) {
                const overloadAmount = entity.card.abilities?.find(a => a.name === 'DominanceInflictOverloadAndLifeless')?.overloadAmount || 2;
                const targetSide = getOppositeSide(side);

                // Inflict Overload
                applyOverload(targetSide, overloadAmount);

                // Gain Lifeless
                applyEffect(entity.id, entity.realm, side, {
                    type: 'status',
                    status: 'lifeless',
                    amount: 1
                });

                console.log(`${entity.card.name} Dominance: Inflicted ${overloadAmount} Overload to ${targetSide} and gained Lifeless.`);
            }
        }
    },
    'BitPaymentGainStatsAndFreeze': {
        name: 'BitPaymentGainStatsAndFreeze',
        type: 'manual',
        execute: function (entity, effect, side) {
            // Blood Sugar: 1 Bit ➔ Gain +1/+1 and 1 Freeze
            const bitCost = effect.bitCost || 1;
            const powerGain = effect.powerGain || 1;
            const hpGain = effect.hpGain || 1;
            const freezeAmount = effect.freezeAmount || 1;

            // Check if player has enough bits
            const bits = side === 'PLAYER' ? state.playerBits : state.enemyBits;
            if (bits < bitCost) {
                console.log(`Not enough bits to activate ${entity.card.name}'s ability.`);
                return;
            }

            // Deduct bits
            if (side === 'PLAYER') {
                stateSetters.setPlayerBits(prev => prev - bitCost);
            } else {
                stateSetters.setEnemyBits(prev => prev - bitCost);
            }

            // Apply stat gains
            applyEffect(entity.id, entity.realm, side, {
                type: 'stat',
                field: 'power',
                value: powerGain
            });
            applyEffect(entity.id, entity.realm, side, {
                type: 'stat',
                field: 'HP',
                value: hpGain
            });

            // Apply Freeze to self
            applyEffect(entity.id, entity.realm, side, {
                type: 'status',
                status: 'freeze',
                amount: freezeAmount
            });

            console.log(`${entity.card.name} paid ${bitCost} Bit: Gained +${powerGain}/+${hpGain} and Freeze ${freezeAmount}.`);
        }
    },
    'BitPaymentGainVengeanceAndFreeze': {
        name: 'BitPaymentGainVengeanceAndFreeze',
        type: 'manual',
        execute: function (entity, effect, side) {
            // Blood Sugar: 1 Bit ➔ Gain 1 Vengeance and 1 Freeze
            const bitCost = effect.bitCost || 1;
            const vengeanceAmount = effect.vengeanceAmount || 1;
            const freezeAmount = effect.freezeAmount || 1;

            // Check if player has enough bits
            const bits = side === 'PLAYER' ? state.playerBits : state.enemyBits;
            if (bits < bitCost) {
                console.log(`Not enough bits to activate ${entity.card.name}'s ability.`);
                return;
            }

            // Deduct bits
            if (side === 'PLAYER') {
                stateSetters.setPlayerBits(prev => prev - bitCost);
            } else {
                stateSetters.setEnemyBits(prev => prev - bitCost);
            }

            applyEffect(entity.id, entity.realm, side, {
                type: 'status',
                status: 'Vengeance',
                amount: vengeanceAmount
            });

            applyEffect(entity.id, entity.realm, side, {
                type: 'status',
                status: 'freeze',
                amount: freezeAmount
            });

            console.log(`${entity.card.name} paid ${bitCost} Bit: Gained ${vengeanceAmount} Vengeance and Freeze ${freezeAmount}.`);
        }
    },
    'AuraGrantBufferToOthers': {
        name: 'AuraGrantBufferToOthers',
        type: 'static',
        applyAbilityEffect: function (entity, gameState, side) {
            // Chronomancer: Other entities have Buffer 2
            const bufferAmount = entity.card.abilities?.find(a => a.name === 'AuraGrantBufferToOthers')?.bufferAmount || 2;

            // Get all friendly entities in the same realm except self
            const [realm] = getRealmAndSetter(entity.realm, side);
            realm.people.forEach(otherEntity => {
                if (otherEntity.id !== entity.id) {
                    applyEffect(otherEntity.id, otherEntity.realm, side, {
                        type: 'status',
                        status: 'buffer',
                        amount: bufferAmount
                    });
                }
            });

            console.log(`${entity.card.name} Aura: Other entities in ${entity.realm} gain Buffer ${bufferAmount}.`);
        },
        removeEffect: function (entity, gameState, side) {
            const bufferAmount = entity.card.abilities?.find(a => a.name === 'AuraGrantBufferToOthers')?.bufferAmount || 2;

            // Remove buffer from other entities when Chronomancer leaves play
            const [realm] = getRealmAndSetter(entity.realm, side);
            realm.people.forEach(otherEntity => {
                if (otherEntity.id !== entity.id) {
                    applyEffect(otherEntity.id, otherEntity.realm, side, {
                        type: 'status',
                        status: 'buffer',
                        amount: -bufferAmount
                    });
                }
            });

            console.log(`${entity.card.name} Aura removed: Buffer ${bufferAmount} removed from other entities.`);
        }
    },
    'ClashDetox': {
        name: 'ClashDetox',
        type: 'triggered',
        triggers: ['clash'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Operator: Clash ➔ Detox
            if (eventData.side === side && eventData.entityId === entity.id) {
                detoxEntities(side);
                console.log(`${entity.card.name} Clash: performed a Detox for ${side}.`);
            }
        },
    },
    'ActionDevelopPlacesAndThings': {
        name: 'ActionDevelopPlacesAndThings',
        type: 'manual',
        execute: function (entity, effect, side) {
            // Architect: 2 Bits, Action ➔ Friendly Places and Things gain 2 Develop
            const bitCost = effect.bitCost || 2;
            const developAmount = effect.developAmount || 2;

            // Check actions and bits
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            const bits = side === 'PLAYER' ? state.playerBits : state.enemyBits;

            if (actions < 1 || bits < bitCost) {
                console.log(`Not enough resources to activate ${entity.card.name}'s ability.`);
                return;
            }

            // Deduct action and bits
            if (side === 'PLAYER') {
                stateSetters.setPlayerActions(prev => prev - 1);
                stateSetters.setPlayerBits(prev => prev - bitCost);
            } else {
                stateSetters.setEnemyActions(prev => prev - 1);
                stateSetters.setEnemyBits(prev => prev - bitCost);
            }

            // Apply Develop to friendly Places and Things
            const [realm] = getRealmAndSetter(entity.realm, side);
            [...realm.places, ...realm.things].forEach(target => {
                applyEffect(target.id, target.realm, side, {
                    type: 'status',
                    status: 'development',
                    amount: developAmount
                });
            });

            console.log(`${entity.card.name} Action: Friendly Places and Things gain Develop ${developAmount}.`);
        }
    },
    'ExhaustGrantBoostToAllies': {
        name: 'ExhaustGrantBoostToAllies',
        type: 'manual',
        execute: function (entity, effect, side) {
            // Freight Train: 1 Bit, Exhaust ➔ Friendly entities gain 1 Boost
            const bitCost = effect.bitCost || 1;
            const boostAmount = effect.boostAmount || 1;

            // Check bits
            const bits = side === 'PLAYER' ? state.playerBits : state.enemyBits;
            if (bits < bitCost) {
                console.log(`Not enough bits to activate ${entity.card.name}'s ability.`);
                return;
            }

            // Deduct bits
            if (side === 'PLAYER') {
                stateSetters.setPlayerBits(prev => prev - bitCost);
            } else {
                stateSetters.setEnemyBits(prev => prev - bitCost);
            }

            // Exhaust the entity
            exhaustEntity(entity, side);

            // Apply Boost to all friendly entities
            const [realm] = getRealmAndSetter(entity.realm, side);
            realm.people.forEach(target => {
                if (target.id !== entity.id) {
                    applyBoost(target, boostAmount, side);
                }
            });

            console.log(`${entity.card.name} Exhaust: Friendly entities gain Boost ${boostAmount}.`);
        }
    },
    'BitPaymentGainBoost': {
        name: 'BitPaymentGainBoost',
        type: 'manual',
        execute: function (entity, effect, side) {
            // Nova Kane: 1 Bit ➔ Gain 1 Boost
            const bitCost = effect.bitCost || 1;
            const boostAmount = effect.boostAmount || 1;

            // Check bits
            const bits = side === 'PLAYER' ? state.playerBits : state.enemyBits;
            if (bits < bitCost) {
                console.log(`Not enough bits to activate ${entity.card.name}'s ability.`);
                return;
            }

            // Deduct bits
            if (side === 'PLAYER') {
                stateSetters.setPlayerBits(prev => prev - bitCost);
            } else {
                stateSetters.setEnemyBits(prev => prev - bitCost);
            }

            // Apply Boost
            applyBoost(entity, boostAmount, side);

            console.log(`${entity.card.name} paid ${bitCost} Bit: Gained Boost ${boostAmount}.`);
        }
    },
    'BitPaymentGainActionAndWound': {
        name: 'BitPaymentGainActionAndWound',
        type: 'manual',
        execute: function (entity, effect, side) {
            // Memory Leak: 1 Bit ➔ Gain 1 Action and 1 Wound
            const bitCost = effect.bitCost || 1;
            const actionAmount = effect.actionAmount || 1;
            const woundAmount = effect.woundAmount || 1;

            // Check bits
            const bits = side === 'PLAYER' ? state.playerBits : state.enemyBits;
            if (bits < bitCost) {
                console.log(`Not enough bits to activate ${entity.card.name}'s ability.`);
                return;
            }

            // Deduct bits
            if (side === 'PLAYER') {
                stateSetters.setPlayerBits(prev => prev - bitCost);
            } else {
                stateSetters.setEnemyBits(prev => prev - bitCost);
            }

            // Gain Actions
            if (side === 'PLAYER') {
                stateSetters.setPlayerActions(prev => prev + actionAmount);
            } else {
                stateSetters.setEnemyActions(prev => prev + actionAmount);
            }

            // Gain Wounds
            if (side === 'PLAYER') {
                stateSetters.setPlayerWounds(prev => prev + woundAmount);
            } else {
                stateSetters.setEnemyWounds(prev => prev + woundAmount);
            }

            console.log(`${entity.card.name} paid ${bitCost} Bit: Gained ${actionAmount} Action and ${woundAmount} Wound.`);
        }
    },
    'ActionDamagePlaceAndGainAsh': {
        name: 'ActionDamagePlaceAndGainAsh',
        type: 'manual',
        requiresTarget: true,
        targetFilter: (target) => target.card.category === 'LOCATION' || target.card.category === 'LANDMARK',
        execute: function (entity, effect, side, target) {
            // Insurgency: 2 Actions ➔ Deal 2 Damage to target Place and gain 2 Ash
            if (!target) {
                console.log('No target Place selected for ActionDamagePlaceAndGainAsh');
                return;
            }

            const actionCost = effect.actionCost || 2;
            const damageAmount = effect.damageAmount || 2;
            const ashAmount = effect.ashAmount || 2;

            // Check actions
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            if (actions < actionCost) {
                console.log(`Not enough actions to activate ${entity.card.name}'s ability.`);
                return;
            }

            // Deduct actions
            if (side === 'PLAYER') {
                stateSetters.setPlayerActions(prev => prev - actionCost);
            } else {
                stateSetters.setEnemyActions(prev => prev - actionCost);
            }

            // Deal damage to target Place
            const targetSide = target.owner;
            handlePlaceDamage(target.realm, target.id, damageAmount, targetSide);

            // Gain Ash
            if (side === 'PLAYER') {
                playerGainAshes(ashAmount);
            } else {
                enemyGainAshes(ashAmount);
            }

            console.log(`${entity.card.name} Action: Dealt ${damageAmount} damage to ${target.card.name} and gained ${ashAmount} Ash.`);
        }
    },
    // Aura Effects
    'AuraAllEntitiesSurgical': {
        name: 'AuraAllEntitiesSurgical',
        type: 'static',
        applyAbilityEffect: function (entity, gameState, side) {
            // CatPhish: Your entities are Surgical
            // Surgical means card's bit cost is paid with Surge
            // This is a passive effect that modifies how bit costs are paid
            // Applied to all friendly entities when CatPhish comes online

            const [realm] = getRealmAndSetter(entity.realm, side);
            realm.people.forEach(friendlyEntity => {
                applyEffect(friendlyEntity.id, friendlyEntity.realm, side, {
                    type: 'status',
                    status: 'surgical',
                    amount: 1
                });
            });

            console.log(`${entity.card.name} Aura: All friendly entities are now Surgical.`);
        },
        removeEffect: function (entity, gameState, side) {
            // Remove Surgical from all friendly entities when CatPhish leaves play
            const [realm] = getRealmAndSetter(entity.realm, side);
            realm.people.forEach(friendlyEntity => {
                applyEffect(friendlyEntity.id, friendlyEntity.realm, side, {
                    type: 'status',
                    status: 'surgical',
                    amount: -1
                });
            });

            console.log(`${entity.card.name} Aura removed: Surgical removed from friendly entities.`);
        }
    },
    'AuraEnemyEntitiesFreeze': {
        name: 'AuraEnemyEntitiesFreeze',
        type: 'static',
        applyAbilityEffect: function (entity, gameState, side) {
            // SylkWorm: Online enemy entities gain Freeze 2
            const freezeAmount = 2;
            const enemySide = getOppositeSide(side);

            // Get all enemy realms
            const enemyRealms = ['Solarium', 'Theater', 'Underpass', 'Grid'].map(name => {
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
                            amount: freezeAmount
                        });
                    }
                });
            });

            console.log(`${entity.card.name} Aura: Online enemy entities gain Freeze ${freezeAmount}.`);
        },
        removeEffect: function (entity, gameState, side) {
            // Remove Freeze from enemy entities when SylkWorm leaves play
            const freezeAmount = 2;
            const enemySide = getOppositeSide(side);

            const enemyRealms = ['Solarium', 'Theater', 'Underpass', 'Grid'].map(name => {
                const realmName = enemySide === 'PLAYER' ? `player${name}` : `enemy${name}`;
                return state[realmName];
            });

            enemyRealms.forEach(realm => {
                if (!realm || !realm.people) return;
                realm.people.forEach(target => {
                    if (target.online) {
                        applyEffect(target.id, target.realm, enemySide, {
                            type: 'status',
                            status: 'freeze',
                            amount: -freezeAmount
                        });
                    }
                });
            });

            console.log(`${entity.card.name} Aura removed: Freeze ${freezeAmount} removed from enemy entities.`);
        }
    },
    // Purple Cards - Ritual On-Play Effects
    'OnPlayGrantStatsFortifyFreeze': {
        name: 'OnPlayGrantStatsFortifyFreeze',
        type: 'onPlay',
        onPlay: function (entity, state, side, target) {
            // Crystalize: Target entity gains +4/+4, Fortify, and Freeze 2
            if (!target) {
                console.log('Crystalize requires a target entity');
                return;
            }
            const powerGain = entity.card.abilities?.find(a => a.name === 'OnPlayGrantStatsFortifyFreeze')?.powerGain || 4;
            const hpGain = entity.card.abilities?.find(a => a.name === 'OnPlayGrantStatsFortifyFreeze')?.hpGain || 4;
            const freezeAmount = entity.card.abilities?.find(a => a.name === 'OnPlayGrantStatsFortifyFreeze')?.freezeAmount || 2;

            // Apply stat gains
            applyEffect(target.id, target.realm, side, {
                type: 'stat',
                field: 'power',
                value: powerGain
            });
            applyEffect(target.id, target.realm, side, {
                type: 'stat',
                field: 'HP',
                value: hpGain
            });

            // Apply Fortify
            applyEffect(target.id, target.realm, side, {
                type: 'status',
                status: 'fortify',
                amount: 1
            });

            // Apply Freeze
            applyEffect(target.id, target.realm, side, {
                type: 'status',
                status: 'freeze',
                amount: freezeAmount
            });

            console.log(`Crystalize: ${target.card.name} gains +${powerGain}/+${hpGain}, Fortify, and Freeze ${freezeAmount}.`);
        }
    },
    'OnPlayGainBitsOnAttack': {
        name: 'OnPlayGainBitsOnAttack',
        type: 'onPlay',
        onPlay: function (entity, state, side) {
            // Tithing: Gain 4 Bits whenever a player attacks this turn
            const bitAmount = entity.card.abilities?.find(a => a.name === 'OnPlayGainBitsOnAttack')?.bitAmount || 4;

            // Set up a one-time listener for attacks this turn
            const attackHandler = (eventData) => {
                if (eventData.side === side) {
                    if (side === 'PLAYER') {
                        stateSetters.setPlayerBits(prev => prev + bitAmount);
                    } else {
                        stateSetters.setEnemyBits(prev => prev + bitAmount);
                    }
                    console.log(`Tithing: Gained ${bitAmount} Bits from attack.`);
                }
            };

            eventManager.subscribe('attackCommitted', attackHandler);

            // Unsubscribe at end of turn
            const endTurnHandler = () => {
                eventManager.unsubscribe('attackCommitted', attackHandler);
                eventManager.unsubscribe('endTurn', endTurnHandler);
            };
            eventManager.subscribe('endTurn', endTurnHandler);

            console.log(`Tithing: Will gain ${bitAmount} Bits per attack this turn.`);
        }
    },
    'OnPlayCreatePoltergeists': {
        name: 'OnPlayCreatePoltergeists',
        type: 'onPlay',
        onPlay: function (entity, state, side) {
            // Seance: Place three created [Poltergeist]
            const count = entity.card.abilities?.find(a => a.name === 'OnPlayCreatePoltergeists')?.count || 3;

            // Create Poltergeist tokens in the player's realm
            const [realm, setRealm] = getRealmAndSetter(entity.realm, side);

            for (let i = 0; i < count; i++) {
                const poltergeistId = `poltergeist_${side}_${Date.now()}_${i}`;
                const poltergeist = {
                    id: poltergeistId,
                    card: {
                        name: 'Poltergeist',
                        category: 'ENTITY',
                        power: 3,
                        HP: 2,
                        timer: 1,
                        keywords: 'Duelist, Deathless, Devour. Lifeless, Soulless, Horrific 2.',
                        magi: true,
                        phys: true,
                        tech: false
                    },
                    power: 3,
                    HP: 2,
                    timer: 1,
                    owner: side,
                    realm: entity.realm,
                    online: false,
                    token: true
                };

                // Add to realm
                setRealm(prev => ({
                    ...prev,
                    people: [...prev.people, poltergeist]
                }));
            }

            console.log(`Seance: Created ${count} Poltergeist tokens in ${entity.realm}.`);
        }
    },
    'OnPlayGrantBoostAndDamage': {
        name: 'OnPlayGrantBoostAndDamage',
        type: 'onPlay',
        onPlay: function (entity, state, side, target) {
            // Ignition: Target Online entity gains Boost 3 and takes 2 Damage
            if (!target) {
                console.log('Ignition requires a target entity');
                return;
            }

            const boostAmount = entity.card.abilities?.find(a => a.name === 'OnPlayGrantBoostAndDamage')?.boostAmount || 3;
            const damageAmount = entity.card.abilities?.find(a => a.name === 'OnPlayGrantBoostAndDamage')?.damageAmount || 2;

            // Apply Boost
            applyBoost(target, boostAmount, side);

            // Apply Damage
            handleDamage(target.realm, target.id, damageAmount, side);

            console.log(`Ignition: ${target.card.name} gains Boost ${boostAmount} and takes ${damageAmount} damage.`);
        }
    },
    'OnPlayActivateAndGrantVengeance': {
        name: 'OnPlayActivateAndGrantVengeance',
        type: 'onPlay',
        onPlay: function (entity, state, side, target) {
            // Royal Decree: Activate target friendly Offline entity and give it 2 Vengeance
            if (!target) {
                console.log('Royal Decree requires a target entity');
                return;
            }

            const vengeanceAmount = entity.card.abilities?.find(a => a.name === 'OnPlayActivateAndGrantVengeance')?.vengeanceAmount || 2;

            // Activate the entity (set online)
            applyEffect(target.id, target.realm, side, {
                type: 'setOnline',
                value: true
            });

            // Grant Vengeance
            applyEffect(target.id, target.realm, side, {
                type: 'status',
                status: 'Vengeance',
                amount: vengeanceAmount
            });

            console.log(`Royal Decree: ${target.card.name} activated and gains ${vengeanceAmount} Vengeance.`);
        }
    },
    // Purple Cards - Exhaust Abilities
    'ExhaustDestroyAllOtherEntities': {
        name: 'ExhaustDestroyAllOtherEntities',
        type: 'manual',
        execute: function (entity, effect, side) {
            // Mortician: Exhaust ➔ Destroy all other entities
            const [realm] = getRealmAndSetter(entity.realm, side);

            // Get all other entities in the same realm
            const otherEntities = realm.people.filter(e => e.id !== entity.id);

            // Destroy each other entity
            otherEntities.forEach(target => {
                handleDeadCard(target.realm, target.id, side);
            });

            // Exhaust the Mortician
            exhaustEntity(entity, side);

            console.log(`${entity.card.name} Exhaust: Destroyed ${otherEntities.length} other entities.`);
        }
    },
    'ExhaustActivateOfflineEntity': {
        name: 'ExhaustActivateOfflineEntity',
        type: 'manual',
        requiresTarget: true,
        targetFilter: (target, entity) => target.owner === entity.owner && !target.online,
        execute: function (entity, effect, side, target) {
            // False Prophet: Exhaust ➔ Activate target friendly Offline entity, it gains Boost 2 and Lifeless
            if (!target) {
                console.log('No target selected for ExhaustActivateOfflineEntity');
                return;
            }

            const boostAmount = effect.boostAmount || 2;

            // Exhaust the False Prophet
            exhaustEntity(entity, side);

            // Activate the target
            applyEffect(target.id, target.realm, side, {
                type: 'setOnline',
                value: true
            });

            // Apply Boost
            applyBoost(target, boostAmount, side);

            // Grant Lifeless
            applyEffect(target.id, target.realm, side, {
                type: 'status',
                status: 'lifeless',
                amount: 1
            });

            console.log(`${entity.card.name} Exhaust: ${target.card.name} activated, gains Boost ${boostAmount} and Lifeless.`);
        }
    },
    // Purple Cards - BitPayment Abilities
    'BitPaymentGrantArmored': {
        name: 'BitPaymentGrantArmored',
        type: 'manual',
        requiresTarget: true,
        targetFilter: (target, entity) => target.owner === entity.owner,
        execute: function (entity, effect, side, target) {
            // Oracle: 2 Bits ➔ Target friendly entity gains Armored
            if (!target) {
                console.log('No target selected for BitPaymentGrantArmored');
                return;
            }

            const bitCost = effect.bitCost || 2;

            // Check bits
            const bits = side === 'PLAYER' ? state.playerBits : state.enemyBits;
            if (bits < bitCost) {
                console.log(`Not enough bits to activate ${entity.card.name}'s ability.`);
                return;
            }

            // Deduct bits
            if (side === 'PLAYER') {
                stateSetters.setPlayerBits(prev => prev - bitCost);
            } else {
                stateSetters.setEnemyBits(prev => prev - bitCost);
            }

            // Grant Armored
            applyEffect(target.id, target.realm, side, {
                type: 'status',
                status: 'armored',
                amount: 1
            });

            console.log(`${entity.card.name} paid ${bitCost} Bits: ${target.card.name} gains Armored.`);
        }
    },
    'BitPaymentGrantVengeanceBlocked': {
        name: 'BitPaymentGrantVengeanceBlocked',
        type: 'manual',
        requiresTarget: true,
        targetFilter: (target, entity) => target.owner === entity.owner && target.blocked,
        execute: function (entity, effect, side, target) {
            // Archon: 2 Bits ➔ Target friendly blocked entity gains 2 Vengeance
            if (!target) {
                console.log('No target selected for BitPaymentGrantVengeanceBlocked');
                return;
            }

            const bitCost = effect.bitCost || 2;
            const vengeanceAmount = effect.vengeanceAmount || 2;

            // Check bits
            const bits = side === 'PLAYER' ? state.playerBits : state.enemyBits;
            if (bits < bitCost) {
                console.log(`Not enough bits to activate ${entity.card.name}'s ability.`);
                return;
            }

            // Deduct bits
            if (side === 'PLAYER') {
                stateSetters.setPlayerBits(prev => prev - bitCost);
            } else {
                stateSetters.setEnemyBits(prev => prev - bitCost);
            }

            // Grant Vengeance
            applyEffect(target.id, target.realm, side, {
                type: 'status',
                status: 'Vengeance',
                amount: vengeanceAmount
            });

            console.log(`${entity.card.name} paid ${bitCost} Bits: ${target.card.name} gains ${vengeanceAmount} Vengeance.`);
        }
    },
    'BitActionActivateOfflineJAW': {
        name: 'BitActionActivateOfflineJAW',
        type: 'manual',
        requiresTarget: true,
        targetFilter: (target, entity) => target.owner === entity.owner && !target.online && 
            (target.card.subTypes?.includes('JAW') || target.card.subTypes?.includes('JAWbreaker')),
        execute: function (entity, effect, side, target) {
            // Reliquary: 3 Bits, Action ➔ Activate Target Offline JAW or JAWbreaker entity
            if (!target) {
                console.log('No target selected for BitActionActivateOfflineJAW');
                return;
            }

            const bitCost = effect.bitCost || 3;
            const actionCost = effect.actionCost || 1;

            // Check resources
            const bits = side === 'PLAYER' ? state.playerBits : state.enemyBits;
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;

            if (bits < bitCost || actions < actionCost) {
                console.log(`Not enough resources to activate ${entity.card.name}'s ability.`);
                return;
            }

            // Deduct resources
            if (side === 'PLAYER') {
                stateSetters.setPlayerBits(prev => prev - bitCost);
                stateSetters.setPlayerActions(prev => prev - actionCost);
            } else {
                stateSetters.setEnemyBits(prev => prev - bitCost);
                stateSetters.setEnemyActions(prev => prev - actionCost);
            }

            // Activate the target
            applyEffect(target.id, target.realm, side, {
                type: 'setOnline',
                value: true
            });

            console.log(`${entity.card.name}: Activated ${target.card.name}.`);
        }
    },
    // Purple Cards - Triggered Effects
    'TriggeredSacrificeGainBoostVengeance': {
        name: 'TriggeredSacrificeGainBoostVengeance',
        type: 'triggered',
        triggers: ['entitySacrificed'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Demiurge: When an entity is sacrificed: +2 Boost, +2 Vengeance
            if (eventData.side === side) {
                const boostAmount = entity.card.abilities?.find(a => a.name === 'TriggeredSacrificeGainBoostVengeance')?.boostAmount || 2;
                const vengeanceAmount = entity.card.abilities?.find(a => a.name === 'TriggeredSacrificeGainBoostVengeance')?.vengeanceAmount || 2;

                // Apply Boost to self
                applyBoost(entity, boostAmount, side);

                // Apply Vengeance to self
                applyEffect(entity.id, entity.realm, side, {
                    type: 'status',
                    status: 'Vengeance',
                    amount: vengeanceAmount
                });

                console.log(`${entity.card.name}: Gained ${boostAmount} Boost and ${vengeanceAmount} Vengeance from sacrifice.`);
            }
        }
    },
    'DestinyGainFateAndWounds': {
        name: 'DestinyGainFateAndWounds',
        type: 'triggered',
        triggers: ['destinyResolved'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Tyranny: Destiny 2: Gain 2 Fate and 2 Wounds
            const destinyAmount = entity.card.abilities?.find(a => a.name === 'DestinyGainFateAndWounds')?.destinyAmount || 2;
            const fateAmount = entity.card.abilities?.find(a => a.name === 'DestinyGainFateAndWounds')?.fateAmount || 2;
            const woundAmount = entity.card.abilities?.find(a => a.name === 'DestinyGainFateAndWounds')?.woundAmount || 2;

            // Check if destiny threshold met
            if (eventData.side === side && eventData.destiny >= destinyAmount) {
                // Gain Fate
                if (side === 'PLAYER') {
                    playerGainFate(fateAmount);
                } else {
                    enemyGainFate(fateAmount);
                }

                // Gain Wounds
                if (side === 'PLAYER') {
                    stateSetters.setPlayerWounds(prev => prev + woundAmount);
                } else {
                    stateSetters.setEnemyWounds(prev => prev + woundAmount);
                }

                console.log(`${entity.card.name} Destiny ${destinyAmount}: Gained ${fateAmount} Fate and ${woundAmount} Wounds.`);
            }
        }
    },
    'DominanceClashInflictWounds': {
        name: 'DominanceClashInflictWounds',
        type: 'triggered',
        triggers: ['dominanceWon', 'clashResolved'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Baroness: Clash/ Dominance ➔ Inflict 3 Wounds
            if (eventData.side === side) {
                const woundAmount = entity.card.abilities?.find(a => a.name === 'DominanceClashInflictWounds')?.woundAmount || 3;
                const targetSide = getOppositeSide(side);

                // Inflict wounds to opponent
                if (targetSide === 'PLAYER') {
                    stateSetters.setPlayerWounds(prev => prev + woundAmount);
                } else {
                    stateSetters.setEnemyWounds(prev => prev + woundAmount);
                }

                console.log(`${entity.card.name} Dominance/Clash: Inflicted ${woundAmount} Wounds to ${targetSide}.`);
            }
        }
    },
    'ClashExhaustDiscardEnemyHeadSpace': {
        name: 'ClashExhaustDiscardEnemyHeadSpace',
        type: 'triggered',
        triggers: ['clashResolved', 'entityExhausted'],
        eventHandler: function (entity, eventData, gameState, side) {
            // RATs: Clash/ Exhaust ➔ Discard 2 cards at random from enemy HeadSpace
            if (eventData.side === side && (eventData.type === 'clash' || eventData.type === 'exhaust')) {
                const discardAmount = entity.card.abilities?.find(a => a.name === 'ClashExhaustDiscardEnemyHeadSpace')?.discardAmount || 2;
                const targetSide = getOppositeSide(side);

                // Get enemy HeadSpace
                const headSpace = targetSide === 'PLAYER' ? state.playerHeadSpace : state.enemyHeadSpace;

                // Discard random cards
                for (let i = 0; i < discardAmount && headSpace.length > 0; i++) {
                    const randomIndex = Math.floor(Math.random() * headSpace.length);
                    const discardedCard = headSpace[randomIndex];

                    // Remove from HeadSpace and add to discard
                    const newHeadSpace = headSpace.filter((_, idx) => idx !== randomIndex);
                    if (targetSide === 'PLAYER') {
                        stateSetters.setPlayerHeadSpace(newHeadSpace);
                        stateSetters.setPlayerDiscard(prev => [...prev, discardedCard]);
                    } else {
                        stateSetters.setEnemyHeadSpace(newHeadSpace);
                        stateSetters.setEnemyDiscard(prev => [...prev, discardedCard]);
                    }
                }

                console.log(`${entity.card.name} ${eventData.type}: Discarded ${discardAmount} cards from ${targetSide} HeadSpace.`);
            }
        }
    },
    // Purple Cards - Aura Effects
    'AuraFriendlyEntitiesBribe': {
        name: 'AuraFriendlyEntitiesBribe',
        type: 'static',
        applyAbilityEffect: function (entity, gameState, side) {
            // Merchant Guild: Online friendly entities have Bribe
            const [realm] = getRealmAndSetter(entity.realm, side);

            realm.people.forEach(friendlyEntity => {
                if (friendlyEntity.online) {
                    applyEffect(friendlyEntity.id, friendlyEntity.realm, side, {
                        type: 'status',
                        status: 'bribe',
                        amount: 1
                    });
                }
            });

            console.log(`${entity.card.name} Aura: Friendly online entities have Bribe.`);
        },
        removeEffect: function (entity, gameState, side) {
            // Remove Bribe from friendly entities
            const [realm] = getRealmAndSetter(entity.realm, side);

            realm.people.forEach(friendlyEntity => {
                applyEffect(friendlyEntity.id, friendlyEntity.realm, side, {
                    type: 'status',
                    status: 'bribe',
                    amount: -1
                });
            });

            console.log(`${entity.card.name} Aura removed: Bribe removed from friendly entities.`);
        }
    },
    // Purple Cards - Action Abilities
    'ActionGrantVengeanceAndBoost': {
        name: 'ActionGrantVengeanceAndBoost',
        type: 'manual',
        requiresTarget: true,
        targetFilter: (target, entity) => target.owner === entity.owner && target.online,
        execute: function (entity, effect, side, target) {
            // Lighthouse: Action ➔ Give a friendly Online entity Vengeance and 2 Boost
            if (!target) {
                console.log('No target selected for ActionGrantVengeanceAndBoost');
                return;
            }

            const actionCost = effect.actionCost || 1;
            const vengeanceAmount = effect.vengeanceAmount || 1;
            const boostAmount = effect.boostAmount || 2;

            // Check actions
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            if (actions < actionCost) {
                console.log(`Not enough actions to activate ${entity.card.name}'s ability.`);
                return;
            }

            // Deduct actions
            if (side === 'PLAYER') {
                stateSetters.setPlayerActions(prev => prev - actionCost);
            } else {
                stateSetters.setEnemyActions(prev => prev - actionCost);
            }

            // Grant Vengeance
            applyEffect(target.id, target.realm, side, {
                type: 'status',
                status: 'Vengeance',
                amount: vengeanceAmount
            });

            // Apply Boost
            applyBoost(target, boostAmount, side);

            console.log(`${entity.card.name} Action: ${target.card.name} gains ${vengeanceAmount} Vengeance and ${boostAmount} Boost.`);
        }
    },
    'OncePerTurnActionGrantStatsAndFreeze': {
        name: 'OncePerTurnActionGrantStatsAndFreeze',
        type: 'manual',
        requiresTarget: true,
        targetFilter: (target) => target.online,
        execute: function (entity, effect, side, target) {
            // Alchemy Lab: Once Per Turn: Action ➔ Target Online entity gains +2/+2 and 1 Freeze
            if (!target) {
                console.log('No target selected for OncePerTurnActionGrantStatsAndFreeze');
                return;
            }

            // Check if already used this turn
            if (entity.abilityUsedThisTurn) {
                console.log(`${entity.card.name}'s ability already used this turn.`);
                return;
            }

            const actionCost = effect.actionCost || 1;
            const powerGain = effect.powerGain || 2;
            const hpGain = effect.hpGain || 2;
            const freezeAmount = effect.freezeAmount || 1;

            // Check actions
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            if (actions < actionCost) {
                console.log(`Not enough actions to activate ${entity.card.name}'s ability.`);
                return;
            }

            // Deduct actions
            if (side === 'PLAYER') {
                stateSetters.setPlayerActions(prev => prev - actionCost);
            } else {
                stateSetters.setEnemyActions(prev => prev - actionCost);
            }

            // Apply stat gains
            applyEffect(target.id, target.realm, side, {
                type: 'stat',
                field: 'power',
                value: powerGain
            });
            applyEffect(target.id, target.realm, side, {
                type: 'stat',
                field: 'HP',
                value: hpGain
            });

            // Apply Freeze
            applyEffect(target.id, target.realm, side, {
                type: 'status',
                status: 'freeze',
                amount: freezeAmount
            });

            // Apply Devour
            applyEffect(target.id, target.realm, side, {
                type: 'status',
                status: 'devour',
                amount: 1
            });

            // Mark as used this turn
            entity.abilityUsedThisTurn = true;

            console.log(`${entity.card.name}: ${target.card.name} gains +${powerGain}/+${hpGain}, Devour, and Freeze ${freezeAmount}.`);
        }
    },
    // Purple Cards - Landmark/Sym Triggered Effects
    'DepartedDamageEnemyEntities': {
        name: 'DepartedDamageEnemyEntities',
        type: 'triggered',
        triggers: ['landmarkDeparted'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Ancient Tomb: Departed ➔ Deal 2 damage to enemy entities
            if (eventData.entityId === entity.id && eventData.side === side) {
                const damageAmount = entity.card.abilities?.find(a => a.name === 'DepartedDamageEnemyEntities')?.damageAmount || 2;
                const targetSide = getOppositeSide(side);

                // Deal damage to all enemy entities in all realms
                ['Solarium', 'Theater', 'Underpass', 'Grid'].forEach(realmName => {
                    const realmKey = targetSide === 'PLAYER' ? `player${realmName}` : `enemy${realmName}`;
                    const realm = state[realmKey];
                    if (realm && realm.people) {
                        realm.people.forEach(target => {
                            handleDamage(realmName, target.id, damageAmount, targetSide);
                        });
                    }
                });

                console.log(`${entity.card.name} Departed: Dealt ${damageAmount} damage to all ${targetSide} entities.`);
            }
        }
    },
    'AscendSacrificeAndGainWounds': {
        name: 'AscendSacrificeAndGainWounds',
        type: 'triggered',
        triggers: ['ascend'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Witch Hunt: Ascend ➔ Sacrifice and gain 2 Wounds
            if (eventData.entityId === entity.id && eventData.side === side) {
                const woundAmount = entity.card.abilities?.find(a => a.name === 'AscendSacrificeAndGainWounds')?.woundAmount || 2;

                // Gain Wounds
                if (side === 'PLAYER') {
                    stateSetters.setPlayerWounds(prev => prev + woundAmount);
                } else {
                    stateSetters.setEnemyWounds(prev => prev + woundAmount);
                }

                // Sacrifice the landmark (destroy it)
                handleDestroyedPlace(entity.realm, entity.id, side);

                console.log(`${entity.card.name} Ascend: Gained ${woundAmount} Wounds and sacrificed.`);
            }
        }
    },
    'DevelopDealDamage': {
        name: 'DevelopDealDamage',
        type: 'manual',
        requiresTarget: true,
        targetFilter: (target) => target.category === 'ENTITY',
        execute: function (entity, effect, side, target) {
            // Volcano: Develop ➔ Deal 1 damage to target entity
            if (!target) {
                console.log('Volcano requires a target entity');
                return;
            }

            const damageAmount = effect.damageAmount || 1;

            // Deal damage
            handleDamage(target.realm, target.id, damageAmount, target.owner);

            console.log(`${entity.card.name} Develop: Dealt ${damageAmount} damage to ${target.card.name}.`);
        }
    },
    'InterfaceAscendInflictWounds': {
        name: 'InterfaceAscendInflictWounds',
        type: 'triggered',
        triggers: ['successfulHack', 'ascend'],
        eventHandler: function (entity, eventData, gameState, side) {
            // True Self: Interface, Ascend ➔ Inflict 3 Wounds
            if (eventData.side === side) {
                const woundAmount = entity.card.abilities?.find(a => a.name === 'InterfaceAscendInflictWounds')?.woundAmount || 3;
                const targetSide = getOppositeSide(side);

                // Inflict wounds
                if (targetSide === 'PLAYER') {
                    stateSetters.setPlayerWounds(prev => prev + woundAmount);
                } else {
                    stateSetters.setEnemyWounds(prev => prev + woundAmount);
                }

                console.log(`${entity.card.name} ${eventData.type}: Inflicted ${woundAmount} Wounds to ${targetSide}.`);
            }
        }
    },
    // Purple Cards - Raider Effect
    'RaiderDestroyOnlineEntity': {
        name: 'RaiderDestroyOnlineEntity',
        type: 'onPlay',
        onPlay: function (entity, state, side, target) {
            // Acceptable Losses: Raider: destroy target Online entity
            if (!target) {
                console.log('Acceptable Losses requires a target Online entity');
                return;
            }

            if (!target.online) {
                console.log('Acceptable Losses can only target Online entities');
                return;
            }

            // Destroy the target entity
            handleDeadCard(target.realm, target.id, target.owner);

            console.log(`Acceptable Losses: Destroyed ${target.card.name}.`);
        }
    },
    // Purple Cards - Search Pandora (Placeholder - needs UI)
    'SearchPandoraDrawRitual': {
        name: 'SearchPandoraDrawRitual',
        type: 'triggered',
        triggers: ['raiding'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Archivist: Raiding ➔ Search Pandora and draw a Ritual
            if (eventData.side === side) {
                console.log(`${entity.card.name} Raiding: Search Pandora for a Ritual - UI needed`);
                // TODO: Implement deck search UI for Rituals
                // This would open a dialog showing Rituals in Pandora, let player select one
            }
        }
    },
    'SearchPandoraDrawLocation': {
        name: 'SearchPandoraDrawLocation',
        type: 'manual',
        execute: function (entity, effect, side) {
            // Acolyte: Search Pandora and draw a Location
            console.log(`${entity.card.name}: Search Pandora for a Location - UI needed`);
            // TODO: Implement deck search UI for Locations
        }
    },
    // Purple Cards - Manual Grant Override
    'ManualGrantOverride': {
        name: 'ManualGrantOverride',
        type: 'manual',
        requiresTarget: true,
        targetFilter: (target, entity) => target.owner === entity.owner && target.online,
        execute: function (entity, effect, side, target) {
            // Viceroy: Target friendly Online entity gains Override
            if (!target) {
                console.log('No target selected for ManualGrantOverride');
                return;
            }

            // Grant Override
            applyEffect(target.id, target.realm, side, {
                type: 'status',
                status: 'override',
                amount: 1
            });

            console.log(`${entity.card.name}: ${target.card.name} gains Override.`);
        }
    },
    // Purple Cards - Scheme Abilities
    'SchemeSacrificeDrawAndGrantVengeance': {
        name: 'SchemeSacrificeDrawAndGrantVengeance',
        type: 'manual',
        requiresTarget: true,
        targetFilter: (target, entity) => target.owner === entity.owner && target.online,
        execute: function (entity, effect, side, target) {
            // Apocrypha: Scheme 2: Sacrifice ➔ Draw 2 and give friendly Online entity 4 Vengeance
            if (entity.scheming && !entity.schemeUnlocked) {
                console.log(`${entity.card.name}'s Scheme ability is not yet unlocked.`);
                return;
            }
            if (!target) {
                console.log('No target selected for SchemeSacrificeDrawAndGrantVengeance');
                return;
            }

            const ability = entity.card.abilities?.find(a => a.name === 'SchemeSacrificeDrawAndGrantVengeance');
            const drawAmount = ability?.drawAmount || 2;
            const vengeanceAmount = ability?.vengeanceAmount || 4;

            // Grant Vengeance to the target before sacrificing self
            applyEffect(target.id, target.realm, side, {
                type: 'status',
                status: 'Vengeance',
                amount: vengeanceAmount
            });

            // Draw cards
            if (side === 'PLAYER') {
                playerDraw(drawAmount);
            } else {
                enemyDraw(drawAmount);
            }

            // Sacrifice self (SNIP cards live in the 'things' array)
            handleDestroyedThing(entity.realm, entity.id, side);

            console.log(`${entity.card.name} Scheme: Sacrificed, drew ${drawAmount}, gave ${target.card.name} ${vengeanceAmount} Vengeance.`);
        }
    },
    'SchemeSacrificeGrantVengeanceAndLifeless': {
        name: 'SchemeSacrificeGrantVengeanceAndLifeless',
        type: 'manual',
        requiresTarget: true,
        targetFilter: (target, entity) => target.owner === entity.owner && target.online,
        execute: function (entity, effect, side, target) {
            // Apocrypha: Scheme 2: Sacrifice ➔ Target Online entity gains 4 Vengeance and Lifeless
            if (entity.scheming && !entity.schemeUnlocked) {
                console.log(`${entity.card.name}'s Scheme ability is not yet unlocked.`);
                return;
            }
            if (!target) {
                console.log('No target selected for SchemeSacrificeGrantVengeanceAndLifeless');
                return;
            }

            const ability = entity.card.abilities?.find(a => a.name === 'SchemeSacrificeGrantVengeanceAndLifeless');
            const vengeanceAmount = ability?.vengeanceAmount || 4;

            applyEffect(target.id, target.realm, side, {
                type: 'status',
                status: 'Vengeance',
                amount: vengeanceAmount
            });
            applyEffect(target.id, target.realm, side, {
                type: 'status',
                status: 'lifeless',
                amount: 1
            });

            handleDestroyedThing(entity.realm, entity.id, side);

            console.log(`${entity.card.name} Scheme: Sacrificed, gave ${target.card.name} ${vengeanceAmount} Vengeance and Lifeless.`);
        }
    },
    'SurrenderGainWounds': {
        name: 'SurrenderGainWounds',
        type: 'triggered',
        triggers: ['dominanceLost'],
        eventHandler: function (entity, eventData, gameState, side) {
            // Tyranny: Surrender ➔ Gain 2 Wounds
            if (eventData.side === side) {
                const ability = entity.card.abilities?.find(a => a.name === 'SurrenderGainWounds');
                const amount = ability?.amount || 2;
                if (side === 'PLAYER') { playerGainWounds(amount); } else { enemyGainWounds(amount); }
                console.log(`${entity.card.name} Surrender: gained ${amount} Wounds.`);
            }
        },
    },
    'SchemeActionInflictWoundsResetDevelopments': {
        name: 'SchemeActionInflictWoundsResetDevelopments',
        type: 'manual',
        execute: function (entity, effect, side) {
            // Entropy: Scheme 3: Action ➔ Inflict 4 Wounds. Reset all Developments.
            if (entity.scheming && !entity.schemeUnlocked) {
                console.log(`${entity.card.name}'s Scheme ability is not yet unlocked.`);
                return;
            }

            const ability = entity.card.abilities?.find(a => a.name === 'SchemeActionInflictWoundsResetDevelopments');
            const actionCost = ability?.actionCost || 1;
            const woundAmount = ability?.woundAmount || 4;

            // Check and deduct the Action cost
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            if (actions < actionCost) {
                console.log(`Not enough actions to activate ${entity.card.name}'s Scheme ability.`);
                return;
            }
            if (side === 'PLAYER') {
                stateSetters.setPlayerActions(prev => prev - actionCost);
            } else {
                stateSetters.setEnemyActions(prev => prev - actionCost);
            }

            // Inflict Wounds on the opponent
            const targetSide = getOppositeSide(side);
            if (targetSide === 'PLAYER') {
                stateSetters.setPlayerWounds(prev => prev + woundAmount);
            } else {
                stateSetters.setEnemyWounds(prev => prev + woundAmount);
            }

            // Reset all Developments on SYM/LANDMARK cards in every realm (both sides)
            const resetRealmDevelopments = (realm, setRealm) => {
                if (!realm || !setRealm) return;
                setRealm(prev => ({
                    ...prev,
                    places: (prev.places || []).map(c => 'development' in c ? { ...c, development: 0 } : c),
                    things: (prev.things || []).map(c => 'development' in c ? { ...c, development: 0 } : c),
                }));
            };

            ['Solarium', 'Theater', 'Underpass', 'Grid'].forEach(realmName => {
                const [pRealm, pSetter] = getRealmAndSetter(realmName, 'PLAYER');
                const [eRealm, eSetter] = getRealmAndSetter(realmName, 'ENEMY');
                resetRealmDevelopments(pRealm, pSetter);
                resetRealmDevelopments(eRealm, eSetter);
            });

            // Sacrifice self after use (SNIP lives in 'things')
            handleDestroyedThing(entity.realm, entity.id, side);

            console.log(`${entity.card.name} Scheme: Inflicted ${woundAmount} Wounds to ${targetSide} and reset all Developments.`);
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
        // Rituals resolve instantly rather than entering a realm, so their
        // "activation" is being played. This lets a Ritual's abilities array
        // reference Vicious directly with type: 'onPlay'.
        onPlay: function (entity, gameState, side) {
            const amount = keywordAmount(entity.card, 'vicious', 'Vicious');
            if (amount <= 0) return;

            if (side === 'PLAYER') {
                playerGainWounds(amount);
            } else {
                enemyGainWounds(amount);
            }
            console.log(`${entity.card.name} Vicious: dealt ${amount} Wounds to its owner (${side}) on activation.`);
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

    // ─── Green faction (Decay/Toxic/Destiny/Questing) ──────────────────────

    'Plague': {
        name: 'Plague',
        type: 'onActivate',
        onActivate: function (entity, gameState, side) {
            const ability = entity.card.abilities?.find(a => a.name === 'Plague');
            const amount = ability?.amount || 1;
            applyEffect(entity.id, entity.realm, side, { type: 'stat', field: 'decay', value: amount });
            console.log(`${entity.card.name} Plague: gained ${amount} Decay.`);
        },
    },
    'ClashInflictFreezeOnOpponent': {
        // PingWin: Clash ➔ Inflict 3 Freeze on target entity (approximated as the entity it clashes with)
        name: 'ClashInflictFreezeOnOpponent',
        type: 'triggered',
        triggers: ['clash'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side && eventData.entityId === entity.id && eventData.opponentEntityId) {
                const ability = entity.card.abilities?.find(a => a.name === 'ClashInflictFreezeOnOpponent');
                const amount = ability?.amount || 3;
                applyEffect(eventData.opponentEntityId, entity.realm, eventData.opponentSide, {
                    type: 'stat',
                    field: 'freeze',
                    value: amount,
                });
                console.log(`${entity.card.name} Clash: inflicted ${amount} Freeze on its opponent.`);
            }
        },
    },
    'ToxicClashInflictWounds': {
        // Hexapod: Toxic 1: Clash ➔ Inflict 2 Wounds
        name: 'ToxicClashInflictWounds',
        type: 'triggered',
        triggers: ['clash'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side && eventData.entityId === entity.id) {
                const ability = entity.card.abilities?.find(a => a.name === 'ToxicClashInflictWounds');
                const toxicRequirement = ability?.toxicRequirement || 1;
                const amount = ability?.amount || 2;
                if (countDecayingEntities(side) < toxicRequirement) return;
                if (side === 'PLAYER') { enemyGainWounds(amount); } else { playerGainWounds(amount); }
                console.log(`${entity.card.name} Toxic Clash: inflicted ${amount} Wounds.`);
            }
        },
    },
    'ClashDevelopFriendlyNonEntity': {
        // Ram: Exhaust/Clash ➔ Target friendly Sym or Snip gains Develop 2 (auto-targets the least-developed one)
        name: 'ClashDevelopFriendlyNonEntity',
        type: 'triggered',
        triggers: ['clash'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side && eventData.entityId === entity.id) {
                const ability = entity.card.abilities?.find(a => a.name === 'ClashDevelopFriendlyNonEntity');
                const amount = ability?.amount || 2;
                const realms = side === 'PLAYER' ? getAllPlayerRealms() : getAllEnemyRealms();
                const candidates = realms.flatMap(realm => (realm.things || []).filter(t => t.card.category === 'SYM' || t.card.category === 'SNIP'));
                if (candidates.length === 0) return;
                const target = candidates.sort((a, b) => (a.development || 0) - (b.development || 0))[0];
                updateEntityInRealm(target, { development: (target.development || 0) + amount }, side);
                console.log(`${entity.card.name} Clash: gave ${target.card.name} ${amount} Develop.`);
            }
        },
    },
    'DominanceSearchAndDrawCard': {
        // GrimRar: Dominance ➔ Place and activate a [Ram] (simplified to searching and drawing it)
        name: 'DominanceSearchAndDrawCard',
        type: 'triggered',
        triggers: ['dominanceWon'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side) {
                const ability = entity.card.abilities?.find(a => a.name === 'DominanceSearchAndDrawCard');
                const cardName = ability?.cardName;
                if (!cardName) return;
                const found = findLibraryCardByPredicate(side, c => c.card.name === cardName);
                if (found) {
                    drawSpecificCard(found, side);
                    console.log(`${entity.card.name} Dominance: searched Pandora and drew ${cardName}. (Note: auto-placing and activating it is not implemented; play it manually.)`);
                }
            }
        },
    },
    'ToxicClashFriendliesGainDecayAndHealth': {
        // Priestess: Toxic 3: Clash ➔ Friendly online entities gain 1 Decay and +4 Health
        name: 'ToxicClashFriendliesGainDecayAndHealth',
        type: 'triggered',
        triggers: ['clash'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side && eventData.entityId === entity.id) {
                const ability = entity.card.abilities?.find(a => a.name === 'ToxicClashFriendliesGainDecayAndHealth');
                const toxicRequirement = ability?.toxicRequirement || 3;
                const decayAmount = ability?.decayAmount || 1;
                const hpAmount = ability?.hpAmount || 4;
                if (countDecayingEntities(side) < toxicRequirement) return;
                getAllOnlineEntities(side).forEach(friendly => {
                    applyEffect(friendly.id, friendly.realm, side, { type: 'stat', field: 'decay', value: decayAmount });
                    applyEffect(friendly.id, friendly.realm, side, { type: 'stat', field: 'HP', value: hpAmount });
                });
                console.log(`${entity.card.name} Toxic Clash: friendly online entities gained ${decayAmount} Decay and +${hpAmount} Health.`);
            }
        },
    },
    'DestinyInflictDecayOnEnemies': {
        // Lamia: Destiny 2 ➔ Inflict 2 Decay on Online enemy entities
        name: 'DestinyInflictDecayOnEnemies',
        type: 'triggered',
        triggers: ['destinyTrigger'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side) {
                const ability = entity.card.abilities?.find(a => a.name === 'DestinyInflictDecayOnEnemies');
                const maxUses = ability?.maxUses || 2;
                const amount = ability?.amount || 2;
                entity.destinyUses = entity.destinyUses || 0;
                if (entity.destinyUses >= maxUses) return;
                entity.destinyUses += 1;
                getAllOnlineEntities(getOppositeSide(side)).forEach(enemy => {
                    applyEffect(enemy.id, enemy.realm, getOppositeSide(side), { type: 'stat', field: 'decay', value: amount });
                });
                console.log(`${entity.card.name} Destiny (${entity.destinyUses}/${maxUses}): inflicted ${amount} Decay on online enemy entities.`);
            }
        },
    },
    'DestinyGainFate': {
        // Flesh Hive: Destiny ➔ Gain 1 Fate and place a [Flesh Hive] (self-placement simplified away)
        name: 'DestinyGainFate',
        type: 'triggered',
        triggers: ['destinyTrigger'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side) {
                const ability = entity.card.abilities?.find(a => a.name === 'DestinyGainFate');
                const amount = ability?.amount || 1;
                if (side === 'PLAYER') { playerGainFate(amount); } else { enemyGainFate(amount); }
                console.log(`${entity.card.name} Destiny: gained ${amount} Fate. (Note: placing an additional copy is not implemented.)`);
            }
        },
    },
    'DominanceDestinyTransferDecayToTarget': {
        // Hostess: Dominance/Destiny ➔ Transfer all friendly Decay to target entity.
        // (Simplified: target is the first online enemy entity found, since triggered
        // abilities in this codebase cannot prompt for an interactive target.)
        name: 'DominanceDestinyTransferDecayToTarget',
        type: 'triggered',
        triggers: ['dominanceWon', 'destinyTrigger'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side !== side) return;
            const friendlies = getAllOnlineEntities(side);
            const totalDecay = friendlies.reduce((sum, e) => sum + (e.decay || 0), 0);
            if (totalDecay <= 0) return;
            friendlies.forEach(e => {
                if (e.decay > 0) applyEffect(e.id, e.realm, side, { type: 'stat', field: 'decay', value: -e.decay });
            });
            const target = getAllOnlineEntities(getOppositeSide(side))[0];
            if (target) {
                applyEffect(target.id, target.realm, getOppositeSide(side), { type: 'stat', field: 'decay', value: totalDecay });
                console.log(`${entity.card.name}: transferred ${totalDecay} Decay to ${target.card.name}.`);
            }
        },
    },
    'QuestingGainActionsPerVenom': {
        // Soothsayer: Questing ➔ Gain 1 Action for each Venom, then +1 Venom
        name: 'QuestingGainActionsPerVenom',
        type: 'triggered',
        triggers: ['questSuccess'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side) {
                const venom = entity.venom || 0;
                if (venom > 0) {
                    if (side === 'PLAYER') { playerGainActions(venom); } else { enemyGainActions(venom); }
                }
                applyEffect(entity.id, entity.realm, side, { type: 'stat', field: 'venom', value: 1 });
                console.log(`${entity.card.name} Questing: gained ${venom} Actions, then +1 Venom.`);
            }
        },
    },
    'OnActivateGainStats': {
        // Incubus: Ascension (Activation) ➔ Gain +2/+2
        name: 'OnActivateGainStats',
        type: 'onActivate',
        onActivate: function (entity, gameState, side) {
            const ability = entity.card.abilities?.find(a => a.name === 'OnActivateGainStats');
            const powerGain = ability?.powerGain ?? ability?.amount ?? 2;
            const hpGain = ability?.hpGain ?? ability?.amount ?? 2;
            applyEffect(entity.id, entity.realm, side, { type: 'stat', field: 'power', value: powerGain });
            applyEffect(entity.id, entity.realm, side, { type: 'stat', field: 'HP', value: hpGain });
            console.log(`${entity.card.name} Activated: gained +${powerGain}/+${hpGain}.`);
        },
    },
    'OnActivateGainBits': {
        // Terminal: Ascension (Activation) ➔ +3 Bits
        name: 'OnActivateGainBits',
        type: 'onActivate',
        onActivate: function (entity, gameState, side) {
            const ability = entity.card.abilities?.find(a => a.name === 'OnActivateGainBits');
            const amount = ability?.amount || 3;
            if (side === 'PLAYER') { playerGainBits(amount); } else { enemyGainBits(amount); }
            console.log(`${entity.card.name} Activated: gained ${amount} Bits.`);
        },
    },
    'ClashSearchAndDrawSnip': {
        // Husk: Clash ➔ Search Pandora, place a Snip, and give it 2 Develop (simplified to searching and drawing it)
        name: 'ClashSearchAndDrawSnip',
        type: 'triggered',
        triggers: ['clash'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side && eventData.entityId === entity.id) {
                const found = findLibraryCardByPredicate(side, c => c.card.category === 'SNIP');
                if (found) {
                    drawSpecificCard(found, side);
                    console.log(`${entity.card.name} Clash: searched Pandora and drew a Snip (${found.card.name}). (Note: auto-placing it with 2 Develop is not implemented; play and Develop it manually.)`);
                }
            }
        },
    },
    'QuestMutationRitual': {
        // Hunger: Perform a Quest. If successful, target Decaying online entity undergoes Mutation
        // (simplified: the full "transform into an enemy entity" swap is not implemented; approximated
        // as the friendly +1/+1 clause of Mutation applied to the first friendly Decaying online entity).
        name: 'QuestMutationRitual',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            const handler = (eventData) => {
                if (eventData.side === side) {
                    const decaying = getAllOnlineEntities(side).filter(e => e.decay > 0);
                    if (decaying.length > 0) {
                        const target = decaying[0];
                        applyEffect(target.id, target.realm, side, { type: 'stat', field: 'power', value: 1 });
                        applyEffect(target.id, target.realm, side, { type: 'stat', field: 'HP', value: 1 });
                        console.log(`${entity.card.name}: Quest succeeded, ${target.card.name} gains +1/+1 (simplified Mutation).`);
                    }
                    eventManager.unsubscribe('questSuccess', handler);
                }
            };
            eventManager.subscribe('questSuccess', handler);
            stateSetters.setAttackMode('PLAYER_QUEST');
            stateSetters.setSelectedRealm('Solarium');
        },
    },
    'AllEntitiesGainDecay': {
        // Code Injection / Containment Breach: All entities gain X Decay
        name: 'AllEntitiesGainDecay',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            const ability = entity.card.abilities?.find(a => a.name === 'AllEntitiesGainDecay');
            const amount = ability?.amount || 1;
            getAllPlayerRealms().forEach(realm => (realm.people || []).forEach(e => {
                applyEffect(e.id, e.realm, 'PLAYER', { type: 'stat', field: 'decay', value: amount });
            }));
            getAllEnemyRealms().forEach(realm => (realm.people || []).forEach(e => {
                applyEffect(e.id, e.realm, 'ENEMY', { type: 'stat', field: 'decay', value: amount });
            }));
            console.log(`${entity.card.name}: All entities gain ${amount} Decay.`);
        },
    },
    'GainLagAndFateOnNextAscendOrQuest': {
        // Altered State: Gain 2 Lag. When you Ascend or Quest successfully this turn, +2 Fate
        // (simplified: triggers once on the next Ascend/Quest rather than resetting at end of turn).
        name: 'GainLagAndFateOnNextAscendOrQuest',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            const ability = entity.card.abilities?.find(a => a.name === 'GainLagAndFateOnNextAscendOrQuest');
            const lagAmount = ability?.lagAmount || 2;
            const fateAmount = ability?.fateAmount || 2;
            if (side === 'PLAYER') { playerGainLag(lagAmount); } else { enemyGainLag(lagAmount); }

            const handler = (eventData) => {
                if (eventData.side === side) {
                    if (side === 'PLAYER') { playerGainFate(fateAmount); } else { enemyGainFate(fateAmount); }
                    console.log(`${entity.card.name}: gained ${fateAmount} Fate from a successful Ascend/Quest.`);
                    eventManager.unsubscribe('destinyTrigger', handler);
                    eventManager.unsubscribe('questSuccess', handler);
                }
            };
            eventManager.subscribe('destinyTrigger', handler);
            eventManager.subscribe('questSuccess', handler);
            console.log(`${entity.card.name}: gained ${lagAmount} Lag.`);
        },
    },
    'OblivionEffect': {
        // Oblivion: Lose all Burden and Overload, Discard HeadSpace, Disconnect all entities
        name: 'OblivionEffect',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            if (side === 'PLAYER') {
                stateSetters.setPlayerBurden(0);
                stateSetters.setPlayerOverload(0);
                stateSetters.setPlayerHand([]);
                getAllPlayerRealms().forEach(realm => {
                    ['people', 'things', 'places'].forEach(key => {
                        (realm[key] || []).forEach(e => applyEffect(e.id, e.realm, 'PLAYER', { type: 'setOnline', value: false }));
                    });
                });
            } else {
                stateSetters.setEnemyBurden(0);
                stateSetters.setEnemyOverload(0);
                stateSetters.setEnemyHand([]);
                getAllEnemyRealms().forEach(realm => {
                    ['people', 'things', 'places'].forEach(key => {
                        (realm[key] || []).forEach(e => applyEffect(e.id, e.realm, 'ENEMY', { type: 'setOnline', value: false }));
                    });
                });
            }
            console.log(`${entity.card.name}: lost all Burden/Overload, discarded HeadSpace, and disconnected all entities for ${side}.`);
        },
    },
    'MaintainGainVenom': {
        // Isolation Chamber: Maintain ➔ Gain 2 Venom
        name: 'MaintainGainVenom',
        type: 'triggered',
        triggers: ['maintain'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side) {
                const ability = entity.card.abilities?.find(a => a.name === 'MaintainGainVenom');
                const amount = ability?.amount || 2;
                applyEffect(entity.id, entity.realm, side, { type: 'stat', field: 'venom', value: amount });
                console.log(`${entity.card.name} Maintain: gained ${amount} Venom.`);
            }
        },
    },
    'DominanceMutateFriendlyEntity': {
        // Research Facility: Dominance ➔ Target friendly online entity undergoes Mutation
        // (simplified: auto-targets the first friendly online entity and applies the friendly +1/+1 clause).
        name: 'DominanceMutateFriendlyEntity',
        type: 'triggered',
        triggers: ['dominanceWon'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side) {
                const online = getAllOnlineEntities(side);
                if (online.length > 0) {
                    const target = online[0];
                    applyEffect(target.id, target.realm, side, { type: 'stat', field: 'power', value: 1 });
                    applyEffect(target.id, target.realm, side, { type: 'stat', field: 'HP', value: 1 });
                    console.log(`${entity.card.name} Dominance: ${target.card.name} gains +1/+1 (simplified Mutation).`);
                }
            }
        },
    },
    'SacrificeDecayEnemiesAndGainBits': {
        // Drug Trial: Scheme 2: Sacrifice ➔ Give 1 Decay to enemy entities and gain 10 Bits (Scheme gating simplified away)
        name: 'SacrificeDecayEnemiesAndGainBits',
        type: 'manual',
        execute: function (entity, effect, side) {
            const decayAmount = effect.decayAmount || 1;
            const bitAmount = effect.bitAmount || 10;
            getAllOnlineEntities(getOppositeSide(side)).forEach(enemy => {
                applyEffect(enemy.id, enemy.realm, getOppositeSide(side), { type: 'stat', field: 'decay', value: decayAmount });
            });
            if (side === 'PLAYER') { playerGainBits(bitAmount); } else { enemyGainBits(bitAmount); }
            handleDestroyedThing(entity.realm, entity.id, side);
            console.log(`${entity.card.name}: Sacrificed, gave enemy entities ${decayAmount} Decay, and gained ${bitAmount} Bits.`);
        },
    },
    'ActionGainVengeanceAndDecayToFriendlies': {
        // Exposure Therapy: Scheme 3: Action ➔ Friendly online entities gain 2 Vengeance and 1 Decay (Scheme gating simplified away)
        name: 'ActionGainVengeanceAndDecayToFriendlies',
        type: 'manual',
        execute: function (entity, effect, side) {
            const actionCost = effect.actionCost || 1;
            const vengeanceAmount = effect.vengeanceAmount || 2;
            const decayAmount = effect.decayAmount || 1;
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            if (actions < actionCost) {
                console.log(`Not enough actions to activate ${entity.card.name}'s ability.`);
                return;
            }
            if (side === 'PLAYER') { stateSetters.setPlayerActions(prev => prev - actionCost); } else { stateSetters.setEnemyActions(prev => prev - actionCost); }
            getAllOnlineEntities(side).forEach(friendly => {
                applyEffect(friendly.id, friendly.realm, side, { type: 'status', status: 'Vengeance', amount: vengeanceAmount });
                applyEffect(friendly.id, friendly.realm, side, { type: 'stat', field: 'decay', value: decayAmount });
            });
            console.log(`${entity.card.name}: Friendly online entities gained ${vengeanceAmount} Vengeance and ${decayAmount} Decay.`);
        },
    },
    'ActionSearchAndDrawSubtype': {
        // HoloGen: Action ➔ Search Pandora for a JAW entity and draw it
        name: 'ActionSearchAndDrawSubtype',
        type: 'manual',
        execute: function (entity, effect, side) {
            const actionCost = effect.actionCost || 1;
            const subType = effect.subType || 'JAW';
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            if (actions < actionCost) {
                console.log(`Not enough actions to activate ${entity.card.name}'s ability.`);
                return;
            }
            const found = findLibraryCardByPredicate(side, c => c.card.subTypes?.includes(subType));
            if (!found) {
                console.log(`No ${subType} entity found in Pandora.`);
                return;
            }
            if (side === 'PLAYER') { stateSetters.setPlayerActions(prev => prev - actionCost); } else { stateSetters.setEnemyActions(prev => prev - actionCost); }
            drawSpecificCard(found, side);
            console.log(`${entity.card.name}: searched Pandora and drew ${found.card.name}.`);
        },
    },
    'DeathGainVenom': {
        // Organ Market: When a decaying entity dies, +1 Venom
        name: 'DeathGainVenom',
        type: 'triggered',
        triggers: ['entityDied'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.owner === getOppositeSide(side) && eventData.decay > 0) {
                const amount = 1;
                applyEffect(entity.id, entity.realm, side, { type: 'stat', field: 'venom', value: amount });
                console.log(`${entity.card.name}: a Decaying entity died, gained ${amount} Venom.`);
            }
        },
    },
    'MaintainGainBitsPerVenom': {
        // Organ Market: Maintenance ➔ +1 Bit for each Venom
        name: 'MaintainGainBitsPerVenom',
        type: 'triggered',
        triggers: ['maintain'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side) {
                const venom = entity.venom || 0;
                if (venom > 0) {
                    if (side === 'PLAYER') { playerGainBits(venom); } else { enemyGainBits(venom); }
                    console.log(`${entity.card.name} Maintenance: gained ${venom} Bits from Venom.`);
                }
            }
        },
    },
    'ManualDestroyDecayingEntity': {
        // Fever Dream: 2 Actions ➔ Destroy target Decaying entity (auto-targets the first enemy Decaying online entity)
        name: 'ManualDestroyDecayingEntity',
        type: 'manual',
        execute: function (entity, effect, side) {
            const actionCost = effect.actionCost || 2;
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            if (actions < actionCost) {
                console.log(`Not enough actions to activate ${entity.card.name}'s ability.`);
                return;
            }
            const target = getAllOnlineEntities(getOppositeSide(side)).find(e => e.decay > 0);
            if (!target) {
                console.log('No Decaying entity to destroy.');
                return;
            }
            if (side === 'PLAYER') { stateSetters.setPlayerActions(prev => prev - actionCost); } else { stateSetters.setEnemyActions(prev => prev - actionCost); }
            handleDeadCard(target.realm, target.id, getOppositeSide(side));
            console.log(`${entity.card.name}: destroyed ${target.card.name}.`);
        },
    },
    'ToxicActionGainWoundsAndBits': {
        // Apotheosis: Toxic 2: Action ➔ Gain 2 Wounds and 5 Bits
        name: 'ToxicActionGainWoundsAndBits',
        type: 'manual',
        execute: function (entity, effect, side) {
            const actionCost = effect.actionCost || 1;
            const toxicRequirement = effect.toxicRequirement || 2;
            const woundAmount = effect.woundAmount || 2;
            const bitAmount = effect.bitAmount || 5;
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            if (actions < actionCost) {
                console.log(`Not enough actions to activate ${entity.card.name}'s ability.`);
                return;
            }
            if (countDecayingEntities(side) < toxicRequirement) {
                console.log(`${entity.card.name}: not enough Decaying entities to meet Toxic ${toxicRequirement}.`);
                return;
            }
            if (side === 'PLAYER') { stateSetters.setPlayerActions(prev => prev - actionCost); } else { stateSetters.setEnemyActions(prev => prev - actionCost); }
            if (side === 'PLAYER') { playerGainWounds(woundAmount); playerGainBits(bitAmount); } else { enemyGainWounds(woundAmount); enemyGainBits(bitAmount); }
            console.log(`${entity.card.name}: gained ${woundAmount} Wounds and ${bitAmount} Bits.`);
        },
    },
    'DominanceGainVenomAndWounds': {
        // Inoculation: Dominance ➔ Gain 1 Venom, then inflict 1 Wound for each Venom
        name: 'DominanceGainVenomAndWounds',
        type: 'triggered',
        triggers: ['dominanceWon'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side) {
                applyEffect(entity.id, entity.realm, side, { type: 'stat', field: 'venom', value: 1 });
                const venom = (entity.venom || 0) + 1;
                if (side === 'PLAYER') { enemyGainWounds(venom); } else { playerGainWounds(venom); }
                console.log(`${entity.card.name} Dominance: gained 1 Venom (${venom} total), inflicted ${venom} Wounds.`);
            }
        },
    },
    'AscendGainActionsCannotAttack': {
        // Eclipse: Ascend ➔ +3 Actions. You cannot attack this turn (attack restriction not enforced)
        name: 'AscendGainActionsCannotAttack',
        type: 'onAscend',
        onAscend: function (entity, gameState, side) {
            const ability = entity.card.abilities?.find(a => a.name === 'AscendGainActionsCannotAttack');
            const amount = ability?.amount || 3;
            if (side === 'PLAYER') { playerGainActions(amount); } else { enemyGainActions(amount); }
            console.log(`${entity.card.name} Ascend: gained ${amount} Actions. (Note: the "cannot attack this turn" restriction is not enforced.)`);
        },
    },
    'BitPaymentGainBoostAndWound': {
        // ScriptKitty: 1 Bit ➔ Gain 1 Boost and 1 Wound
        name: 'BitPaymentGainBoostAndWound',
        type: 'manual',
        execute: function (entity, effect, side) {
            const bitCost = effect.bitCost || 1;
            const boostAmount = effect.boostAmount || 1;
            const woundAmount = effect.woundAmount || 1;
            const bits = side === 'PLAYER' ? state.playerBits : state.enemyBits;
            if (bits < bitCost) {
                console.log(`Not enough bits to activate ${entity.card.name}'s ability.`);
                return;
            }
            if (side === 'PLAYER') { stateSetters.setPlayerBits(prev => prev - bitCost); } else { stateSetters.setEnemyBits(prev => prev - bitCost); }
            applyBoost(entity, boostAmount, side);
            if (side === 'PLAYER') { playerGainWounds(woundAmount); } else { enemyGainWounds(woundAmount); }
            console.log(`${entity.card.name} paid ${bitCost} Bit: gained ${boostAmount} Boost and ${woundAmount} Wound.`);
        },
    },
    // ─── Gray faction ──────────────────────────────────────────────────────

    'OnPlayDamageAllEntities': {
        // Phoenix: Deal 2 Damage to all Entities
        name: 'OnPlayDamageAllEntities',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            const ability = entity.card.abilities?.find(a => a.name === 'OnPlayDamageAllEntities');
            const amount = ability?.amount || 2;
            getAllPlayerRealms().forEach(realm => (realm.people || []).forEach(e => {
                handleDamage(e.realm, e.id, amount, 'PLAYER');
            }));
            getAllEnemyRealms().forEach(realm => (realm.people || []).forEach(e => {
                handleDamage(e.realm, e.id, amount, 'ENEMY');
            }));
            console.log(`${entity.card.name}: Dealt ${amount} damage to all entities.`);
        },
    },
    'ExhaustGrantBarricade': {
        // Conscripts: Exhaust ➔ Barricade 3
        name: 'ExhaustGrantBarricade',
        type: 'manual',
        execute: function (entity, effect, side) {
            const amount = effect.amount || 3;
            applyEffect(entity.id, entity.realm, side, { type: 'status', status: 'barricade', amount });
            exhaustEntity(entity, side);
            console.log(`${entity.card.name}: Exhausted to gain Barricade ${amount}.`);
        },
    },
    'OnPlayGrantHealthAndCharge': {
        // Combat Medic: Target entity gains +6 Health and Charge
        name: 'OnPlayGrantHealthAndCharge',
        type: 'onPlay',
        requiresTarget: true,
        targetFilter: (target) => true,
        onPlay: function (entity, gameState, side, target) {
            if (!target) {
                console.log('No target selected for OnPlayGrantHealthAndCharge');
                return;
            }
            const ability = entity.card.abilities?.find(a => a.name === 'OnPlayGrantHealthAndCharge');
            const hpGain = ability?.hpGain || 6;
            applyEffect(target.id, target.realm, target.owner, { type: 'stat', field: 'HP', value: hpGain });
            applyEffect(target.id, target.realm, target.owner, { type: 'status', status: 'charge', amount: 1 });
            console.log(`${entity.card.name}: ${target.card.name} gains +${hpGain} Health and Charge.`);
        },
    },
    'DominanceGainBits': {
        // Troll: Dominance ➔ Gain 4 Bits
        name: 'DominanceGainBits',
        type: 'triggered',
        triggers: ['dominanceWon'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side) {
                const ability = entity.card.abilities?.find(a => a.name === 'DominanceGainBits');
                const amount = ability?.amount || 4;
                if (side === 'PLAYER') { playerGainBits(amount); } else { enemyGainBits(amount); }
                console.log(`${entity.card.name} Dominance: gained ${amount} Bits.`);
            }
        },
    },
    'ClashInflictLag': {
        // Embedding: Clash ➔ Inflict 3 Lag
        name: 'ClashInflictLag',
        type: 'triggered',
        triggers: ['clash'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side && eventData.entityId === entity.id) {
                const ability = entity.card.abilities?.find(a => a.name === 'ClashInflictLag');
                const amount = ability?.amount || 3;
                if (getOppositeSide(side) === 'PLAYER') { playerGainLag(amount); } else { enemyGainLag(amount); }
                console.log(`${entity.card.name} Clash: inflicted ${amount} Lag.`);
            }
        },
    },
    'ClashInflictFreezeOnJAWbreakers': {
        // IceBorg: Clash ➔ Inflict Freeze 2 on JAWbreaker entities
        name: 'ClashInflictFreezeOnJAWbreakers',
        type: 'triggered',
        triggers: ['clash'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side && eventData.entityId === entity.id) {
                const ability = entity.card.abilities?.find(a => a.name === 'ClashInflictFreezeOnJAWbreakers');
                const amount = ability?.amount || 2;
                const enemySide = getOppositeSide(side);
                getAllOnlineEntities(enemySide)
                    .filter(e => e.card.subTypes?.includes('JAWbreaker'))
                    .forEach(target => {
                        applyEffect(target.id, target.realm, enemySide, { type: 'stat', field: 'freeze', value: amount });
                    });
                console.log(`${entity.card.name} Clash: inflicted ${amount} Freeze on enemy JAWbreaker entities.`);
            }
        },
    },
    'ClashInflictWounds': {
        // Daemon: Clash ➔ Inflict 2 Wounds
        name: 'ClashInflictWounds',
        type: 'triggered',
        triggers: ['clash'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side && eventData.entityId === entity.id) {
                const ability = entity.card.abilities?.find(a => a.name === 'ClashInflictWounds');
                const amount = ability?.amount || 2;
                if (getOppositeSide(side) === 'PLAYER') { playerGainWounds(amount); } else { enemyGainWounds(amount); }
                console.log(`${entity.card.name} Clash: inflicted ${amount} Wounds.`);
            }
        },
    },
    'ClashGrantFriendliesBoost': {
        // Leech: Clash ➔ Friendly entities gain 1 Boost
        name: 'ClashGrantFriendliesBoost',
        type: 'triggered',
        triggers: ['clash'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side && eventData.entityId === entity.id) {
                const ability = entity.card.abilities?.find(a => a.name === 'ClashGrantFriendliesBoost');
                const amount = ability?.amount || 1;
                getAllOnlineEntities(side).forEach(friendly => applyBoost(friendly, amount, side));
                console.log(`${entity.card.name} Clash: friendly entities gain ${amount} Boost.`);
            }
        },
    },
    'ActionGainCharge': {
        // CarJack: Action ➔ Gain 2 Charge
        name: 'ActionGainCharge',
        type: 'manual',
        execute: function (entity, effect, side) {
            const actionCost = effect.actionCost || 1;
            const amount = effect.amount || 2;
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            if (actions < actionCost) {
                console.log(`Not enough actions to activate ${entity.card.name}'s ability.`);
                return;
            }
            if (side === 'PLAYER') { stateSetters.setPlayerActions(prev => prev - actionCost); } else { stateSetters.setEnemyActions(prev => prev - actionCost); }
            applyEffect(entity.id, entity.realm, side, { type: 'stat', field: 'charge', value: amount });
            console.log(`${entity.card.name}: gained ${amount} Charge.`);
        },
    },
    'ClashLoseCharge': {
        // CarJack: Clash ➔ Lose 1 Charge
        name: 'ClashLoseCharge',
        type: 'triggered',
        triggers: ['clash'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side && eventData.entityId === entity.id) {
                const ability = entity.card.abilities?.find(a => a.name === 'ClashLoseCharge');
                const amount = Math.min(ability?.amount || 1, entity.charge || 0);
                if (amount > 0) {
                    applyEffect(entity.id, entity.realm, side, { type: 'stat', field: 'charge', value: -amount });
                    console.log(`${entity.card.name} Clash: lost ${amount} Charge.`);
                }
            }
        },
    },
    'ActionDisconnectSelf': {
        // Lurker: Action ➔ Disconnect
        name: 'ActionDisconnectSelf',
        type: 'manual',
        execute: function (entity, effect, side) {
            const actionCost = effect.actionCost || 1;
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            if (actions < actionCost) {
                console.log(`Not enough actions to activate ${entity.card.name}'s ability.`);
                return;
            }
            if (side === 'PLAYER') { stateSetters.setPlayerActions(prev => prev - actionCost); } else { stateSetters.setEnemyActions(prev => prev - actionCost); }
            applyEffect(entity.id, entity.realm, side, { type: 'setOnline', value: false });
            console.log(`${entity.card.name}: disconnected.`);
        },
    },
    'OnPlayGrantBoostChargeLifeless': {
        // Overclock: Give target friendly online entity Boost 2, Charge 2, and Lifeless
        name: 'OnPlayGrantBoostChargeLifeless',
        type: 'onPlay',
        requiresTarget: true,
        targetFilter: (target, entity) => target.owner === entity.owner && target.online,
        onPlay: function (entity, gameState, side, target) {
            if (!target) {
                console.log('No target selected for OnPlayGrantBoostChargeLifeless');
                return;
            }
            const ability = entity.card.abilities?.find(a => a.name === 'OnPlayGrantBoostChargeLifeless');
            const boostAmount = ability?.boostAmount || 2;
            const chargeAmount = ability?.chargeAmount || 2;
            applyBoost(target, boostAmount, side);
            applyEffect(target.id, target.realm, side, { type: 'stat', field: 'charge', value: chargeAmount });
            applyEffect(target.id, target.realm, side, { type: 'status', status: 'lifeless', amount: 1 });
            console.log(`${entity.card.name}: ${target.card.name} gains Boost ${boostAmount}, Charge ${chargeAmount}, and Lifeless.`);
        },
    },
    'OnPlayGainActionsAndDraw': {
        // Meditation: Gain 3 Actions and draw 3 cards. You cannot attack this turn (restriction not enforced)
        name: 'OnPlayGainActionsAndDraw',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            const ability = entity.card.abilities?.find(a => a.name === 'OnPlayGainActionsAndDraw');
            const actionAmount = ability?.actionAmount || 3;
            const drawAmount = ability?.drawAmount || 3;
            if (side === 'PLAYER') { playerGainActions(actionAmount); playerDraw(drawAmount); } else { enemyGainActions(actionAmount); enemyDraw(drawAmount); }
            console.log(`${entity.card.name}: gained ${actionAmount} Actions and drew ${drawAmount} cards. (Note: the "cannot attack this turn" restriction is not enforced.)`);
        },
    },
    'OnPlayGainBitsAshAndWound': {
        // Bloodletting: +10 Bits and +2 Ash. Inflict 1 Wound.
        name: 'OnPlayGainBitsAshAndWound',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            const ability = entity.card.abilities?.find(a => a.name === 'OnPlayGainBitsAshAndWound');
            const bitAmount = ability?.bitAmount || 10;
            const ashAmount = ability?.ashAmount || 2;
            const woundAmount = ability?.woundAmount || 1;
            if (side === 'PLAYER') { playerGainBits(bitAmount); playerGainAshes(ashAmount); playerGainWounds(woundAmount); } else { enemyGainBits(bitAmount); enemyGainAshes(ashAmount); enemyGainWounds(woundAmount); }
            console.log(`${entity.card.name}: gained ${bitAmount} Bits, ${ashAmount} Ash, and ${woundAmount} Wound.`);
        },
    },
    'OnPlayDamageTargetSubtype': {
        // Disintegrate: Deal 4 damage to target Online enemy JAW or JAWbreaker
        name: 'OnPlayDamageTargetSubtype',
        type: 'onPlay',
        requiresTarget: true,
        targetFilter: (target, entity) =>
            target.owner !== entity.owner &&
            target.online &&
            (target.card.subTypes?.includes('JAW') || target.card.subTypes?.includes('JAWbreaker')),
        onPlay: function (entity, gameState, side, target) {
            if (!target) {
                console.log('No target selected for OnPlayDamageTargetSubtype');
                return;
            }
            const ability = entity.card.abilities?.find(a => a.name === 'OnPlayDamageTargetSubtype');
            const amount = ability?.amount || 4;
            handleDamage(target.realm, target.id, amount, target.owner);
            console.log(`${entity.card.name}: Dealt ${amount} damage to ${target.card.name}.`);
        },
    },
    'OnPlayInflictBurdenAndFreezeByAffinity': {
        // Amnesia: Inflict 2 Burden. Magical or Physical entities gain Freeze 2.
        name: 'OnPlayInflictBurdenAndFreezeByAffinity',
        type: 'onPlay',
        onPlay: function (entity, gameState, side) {
            const ability = entity.card.abilities?.find(a => a.name === 'OnPlayInflictBurdenAndFreezeByAffinity');
            const burdenAmount = ability?.burdenAmount || 2;
            const freezeAmount = ability?.freezeAmount || 2;
            const enemySide = getOppositeSide(side);
            if (enemySide === 'PLAYER') { playerGainBurden(burdenAmount); } else { enemyGainBurden(burdenAmount); }

            [...getAllPlayerRealms().flatMap(r => (r.people || []).map(e => ({ e, side: 'PLAYER' }))),
             ...getAllEnemyRealms().flatMap(r => (r.people || []).map(e => ({ e, side: 'ENEMY' })))]
                .filter(({ e }) => e.card.magi || e.card.phys)
                .forEach(({ e, side: entitySide }) => {
                    applyEffect(e.id, e.realm, entitySide, { type: 'stat', field: 'freeze', value: freezeAmount });
                });

            console.log(`${entity.card.name}: Inflicted ${burdenAmount} Burden. Magical/Physical entities gain ${freezeAmount} Freeze.`);
        },
    },
    'InterfaceInflictOverload': {
        // Sigil: Interface ➔ inflict 4 Overload
        name: 'InterfaceInflictOverload',
        type: 'triggered',
        triggers: ['interface'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side) {
                const ability = entity.card.abilities?.find(a => a.name === 'InterfaceInflictOverload');
                const amount = ability?.amount || 4;
                applyOverload(getOppositeSide(side), amount);
                console.log(`${entity.card.name} Interface: inflicted ${amount} Overload.`);
            }
        },
    },
    'ActionGrantStatsAndCharge': {
        // Satellite Array: Action ➔ Target friendly Online entity gains +1/+1 and Charge
        name: 'ActionGrantStatsAndCharge',
        type: 'manual',
        requiresTarget: true,
        targetFilter: (target, entity) => target.owner === entity.owner && target.online,
        execute: function (entity, effect, side, target) {
            if (!target) {
                console.log('No target selected for ActionGrantStatsAndCharge');
                return;
            }
            const actionCost = effect.actionCost || 1;
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            if (actions < actionCost) {
                console.log(`Not enough actions to activate ${entity.card.name}'s ability.`);
                return;
            }
            if (side === 'PLAYER') { stateSetters.setPlayerActions(prev => prev - actionCost); } else { stateSetters.setEnemyActions(prev => prev - actionCost); }
            applyEffect(target.id, target.realm, side, { type: 'stat', field: 'power', value: 1 });
            applyEffect(target.id, target.realm, side, { type: 'stat', field: 'HP', value: 1 });
            applyEffect(target.id, target.realm, side, { type: 'status', status: 'charge', amount: 1 });
            console.log(`${entity.card.name}: ${target.card.name} gains +1/+1 and Charge.`);
        },
    },
    'ActionGainDividendBonus': {
        // Obelisk: 2 Actions ➔ Gain Dividend 3 (simplified: immediately gain 3 Bits rather than a
        // permanent Dividend stack increase, since Dividend is a per-turn passive keyword).
        name: 'ActionGainDividendBonus',
        type: 'manual',
        execute: function (entity, effect, side) {
            const actionCost = effect.actionCost || 2;
            const amount = effect.amount || 3;
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            if (actions < actionCost) {
                console.log(`Not enough actions to activate ${entity.card.name}'s ability.`);
                return;
            }
            if (side === 'PLAYER') { stateSetters.setPlayerActions(prev => prev - actionCost); } else { stateSetters.setEnemyActions(prev => prev - actionCost); }
            if (side === 'PLAYER') { playerGainBits(amount); } else { enemyGainBits(amount); }
            console.log(`${entity.card.name}: gained ${amount} Bits. (Simplified from a permanent Dividend 3 increase.)`);
        },
    },
    'OncePerTurnActionGrantBoostAndStealth': {
        // Warp Gate: Once Per Turn: Action ➔ Target entity gains Boost 2 and Stealth
        name: 'OncePerTurnActionGrantBoostAndStealth',
        type: 'manual',
        requiresTarget: true,
        targetFilter: (target) => true,
        execute: function (entity, effect, side, target) {
            if (!target) {
                console.log('No target selected for OncePerTurnActionGrantBoostAndStealth');
                return;
            }
            if (entity.abilityUsedThisTurn) {
                console.log(`${entity.card.name}'s ability already used this turn.`);
                return;
            }
            const actionCost = effect.actionCost || 1;
            const boostAmount = effect.boostAmount || 2;
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            if (actions < actionCost) {
                console.log(`Not enough actions to activate ${entity.card.name}'s ability.`);
                return;
            }
            if (side === 'PLAYER') { stateSetters.setPlayerActions(prev => prev - actionCost); } else { stateSetters.setEnemyActions(prev => prev - actionCost); }
            applyBoost(target, boostAmount, target.owner);
            applyEffect(target.id, target.realm, target.owner, { type: 'stat', field: 'stealth', value: 1 });
            entity.abilityUsedThisTurn = true;
            console.log(`${entity.card.name}: ${target.card.name} gains Boost ${boostAmount} and Stealth.`);
        },
    },
    'ManualSacrificeGainBits': {
        // Museum: 3 Actions, Sacrifice ➔ Gain 12 Bits
        name: 'ManualSacrificeGainBits',
        type: 'manual',
        execute: function (entity, effect, side) {
            const actionCost = effect.actionCost || 3;
            const amount = effect.amount || 12;
            const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
            if (actions < actionCost) {
                console.log(`Not enough actions to activate ${entity.card.name}'s ability.`);
                return;
            }
            if (side === 'PLAYER') { stateSetters.setPlayerActions(prev => prev - actionCost); } else { stateSetters.setEnemyActions(prev => prev - actionCost); }
            if (side === 'PLAYER') { playerGainBits(amount); } else { enemyGainBits(amount); }
            handleDestroyedPlace(entity.realm, entity.id, side);
            console.log(`${entity.card.name}: Sacrificed to gain ${amount} Bits.`);
        },
    },
    'AscendedGainFateOnTurnStart': {
        // Past Life: Ascended: Beginning of Turn ➔ +1 Fate
        name: 'AscendedGainFateOnTurnStart',
        type: 'triggered',
        triggers: ['turnStart'],
        eventHandler: function (entity, eventData, gameState, side) {
            if (eventData.side === side && entity.ascended) {
                const ability = entity.card.abilities?.find(a => a.name === 'AscendedGainFateOnTurnStart');
                const amount = ability?.amount || 1;
                if (side === 'PLAYER') { playerGainFate(amount); } else { enemyGainFate(amount); }
                console.log(`${entity.card.name} (Ascended): gained ${amount} Fate.`);
            }
        },
    },
    'AscendDamageAllEntitiesAndLocations': {
        // Launch Codes: Ascend ➔ Deal 4 damage to all entities and locations
        name: 'AscendDamageAllEntitiesAndLocations',
        type: 'onAscend',
        onAscend: function (entity, gameState, side) {
            const ability = entity.card.abilities?.find(a => a.name === 'AscendDamageAllEntitiesAndLocations');
            const amount = ability?.amount || 4;
            getAllPlayerRealms().forEach(realm => {
                (realm.people || []).forEach(e => handleDamage(e.realm, e.id, amount, 'PLAYER'));
                (realm.places || []).forEach(p => handlePlaceDamage(p.realm, p.id, amount, 'PLAYER'));
            });
            getAllEnemyRealms().forEach(realm => {
                (realm.people || []).forEach(e => handleDamage(e.realm, e.id, amount, 'ENEMY'));
                (realm.places || []).forEach(p => handlePlaceDamage(p.realm, p.id, amount, 'ENEMY'));
            });
            console.log(`${entity.card.name} Ascend: dealt ${amount} damage to all entities and locations.`);
        },
    },
    'AscendedGrantKeywords': {
        // Causality: Ascended ➔ Drift, Dividend, Tarot
        // (simplified: grants the three keyword abilities to self permanently on ascend rather than
        // continuously for as long as it remains Ascended).
        name: 'AscendedGrantKeywords',
        type: 'onAscend',
        onAscend: function (entity, gameState, side) {
            entity.card.abilities = [
                ...(entity.card.abilities || []),
                { name: 'Drift' },
                { name: 'Dividend' },
                { name: 'Tarot' },
            ];
            console.log(`${entity.card.name} Ascended: gained Drift, Dividend, and Tarot.`);
        },
    },
    'AscendBuffDecayingEnemyEntity': {
        // Coronation: Ascend ➔ Gain control of target Decaying entity and give it +5/+5
        // (simplified: full control transfer is not implemented; the first enemy Decaying online
        // entity found instead just gains +5/+5 and 2 Decay as an approximation).
        name: 'AscendBuffDecayingEnemyEntity',
        type: 'onAscend',
        onAscend: function (entity, gameState, side) {
            const target = getAllOnlineEntities(getOppositeSide(side)).find(e => e.decay > 0);
            if (!target) {
                console.log(`${entity.card.name} Ascend: no Decaying enemy entity to target.`);
                return;
            }
            applyEffect(target.id, target.realm, getOppositeSide(side), { type: 'stat', field: 'power', value: 5 });
            applyEffect(target.id, target.realm, getOppositeSide(side), { type: 'stat', field: 'HP', value: 5 });
            console.log(`${entity.card.name} Ascend: ${target.card.name} gains +5/+5. (Note: gaining control of it is not implemented.)`);
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

    // Ambush: deal damage to a random enemy entity in the same realm on entry.
    applyAmbushOnEntry(entity, side);

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
            } else if (abilityDef.type === 'onPlay') {
                // onPlay used to fall off the end of this chain and be silently
                // dropped, so any non-Ritual card carrying one did nothing at
                // all. Rituals are unaffected: they resolve through
                // triggerRitualAbilities, which never reaches this function.
                resolveOnPlayAbility(entity, abilityDef, side);
                entity.activeAbilities.push({ abilityName, abilityDef });
            } else {
                console.warn(
                    `Ability "${abilityName}" on "${entity.card.name}" has unhandled type "${abilityDef.type}" and will not run.`
                );
            }
        }
    }
}

export { activateAbilities };

/**
 * Every entity currently on the board, both sides, for auto-targeting.
 * @returns {Object[]}
 */
function allBoardEntities() {
    return [...getAllPlayerRealms(), ...getAllEnemyRealms()]
        .filter(Boolean)
        .flatMap((realm) => [
            ...(realm.people || []),
            ...(realm.places || []),
            ...(realm.things || []),
        ]);
}

/**
 * Runs an `onPlay` ability for a card entering play.
 *
 * Untargeted abilities resolve immediately. Targeted ones open a normal target
 * request for the player; the enemy AI has no way to click, so it resolves
 * against the first legal target instead of stalling the turn.
 *
 * @param {Object} entity - The entity whose ability is firing
 * @param {Object} abilityDef - The resolved ability definition
 * @param {string} side - 'PLAYER' or 'ENEMY'
 * @returns {void}
 */
function resolveOnPlayAbility(entity, abilityDef, side) {
    if (!abilityDef.requiresTarget) {
        abilityDef.onPlay(entity, state, side);
        return;
    }

    const filter = (target) => {
        if (!target?.card) return false;
        return typeof abilityDef.targetFilter === 'function'
            ? abilityDef.targetFilter(target, entity, side)
            : true;
    };

    if (side === 'ENEMY') {
        const target = allBoardEntities().find(filter) || null;
        abilityDef.onPlay(entity, state, side, target);
        return;
    }

    // No legal target exists, so resolve with none rather than opening a
    // request the player can never satisfy. The abilities themselves already
    // guard on a missing target.
    if (!allBoardEntities().some(filter)) {
        console.log(`${entity.card.name}: no legal target for ${abilityDef.name}.`);
        abilityDef.onPlay(entity, state, side, null);
        return;
    }

    stateSetters.setTargetSelection({
        enabled: true,
        side: abilityDef.targetSide || 'PLAYER',
        filter,
        onSelect: (target) => {
            stateSetters.setTargetSelection({ enabled: false });
            abilityDef.onPlay(entity, state, side, target);
        },
        onCancel: () => {
            stateSetters.setTargetSelection({ enabled: false });
        },
    });
    console.log(`Select a target for ${entity.card.name}'s ${abilityDef.name}.`);
}

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

    // Undo any static/aura abilities that granted a persistent effect (e.g.
    // PandoraAccess, Drift, Dividend, various auras). Without this, a static
    // ability's bonus survives forever after the granting entity dies, since
    // nothing else ever reverses applyAbilityEffect.
    (currentEntity.activeAbilities || []).forEach(({ abilityName, abilityDef }) => {
        const def = abilityDef || abilitiesDefinitions[abilityName];
        if (def && typeof def.removeEffect === 'function') {
            def.removeEffect(currentEntity, state, side);
        }
    });

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

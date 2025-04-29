// Import core dependencies
import { eventManager } from './eventManager';
import { 
    getOppositeSide, 
    getRealmAndSetter,
    getAllPlayerRealms,
    getAllEnemyRealms
} from './utils';

// Import game mechanics
import { handleDamage } from './damage';
import { handleDominationPhase } from './domination';
import { handleRezPlayerCard } from './enemy/rez';
import { abilitiesDefinitions } from '../abilities/glossary';
import { 
    removeEffect,
    playerGainOverload,
    enemyGainOverload
} from './effects';

import { getAbilityDefinition } from './abilities';
import { 
    calculateSoulsAvailable,
    handleAscension,
    playerGainBits,
    playerLoseBits,
    enemyGainBits,
    enemyLoseBits,
    playerGainAshes,
    playerLoseAshes,
    enemyGainAshes,
    enemyLoseAshes,
    playerGainSurge,
    playerLoseSurge,
    enemyGainSurge,
    enemyLoseSurge
} from './game';

// Import state and setters
import { state, stateSetters } from './state';

// Re-export resource management functions
export {
    // Bits
    playerGainBits,
    playerLoseBits,
    enemyGainBits,
    enemyLoseBits,
    // Overload
    playerGainOverload,
    enemyGainOverload,
    // Ashes
    playerGainAshes,
    playerLoseAshes,
    enemyGainAshes,
    enemyLoseAshes,
    // Surge
    playerGainSurge,
    playerLoseSurge,
    enemyGainSurge,
    enemyLoseSurge
};

// Get state variables
const {
    playerBattleSlots = [],
    enemyBattleSlots = [],
    battleSelectedCard = null,
    recruiterCount = 0,
    priorityLeft = true,
    enemyRezCards = [],
    enemyPlanAttack = false,
    selectedCard = null,
    selectedInHand = false,
    draftSelected = false,
    draft = [],
    playerBits = 0,
    playerWounds = 0,
    enemyWounds = 0,
    playerActions = 0,
    enemyActions = 0,
    playerSolarium = { people: [], places: [], things: [] },
    playerTheater = { people: [], places: [], things: [] },
    playerUnderpass = { people: [], places: [], things: [] },
    playerGrid = { people: [], places: [], things: [] },
    enemySolarium = { people: [], places: [], things: [] },
    enemyTheater = { people: [], places: [], things: [] },
    enemyUnderpass = { people: [], places: [], things: [] },
    enemyGrid = { people: [], places: [], things: [] },
    enemyHand = [],
    playerAshes = 0,
    playerGlitchyAmount = 0,
    enemyGlitchyAmount = 0,
    playerDriftCount = 0,
    enemyDriftCount = 0,
    playerDividendAmount = 0,
    enemyDividendAmount = 0
} = state;

// Get setters
const {
    setSelectedCard,
    setSelectedInHand,
    setDraftSelected,
    setDraft,
    setPlayerSolarium,
    setPlayerTheater,
    setPlayerUnderpass,
    setPlayerGrid,
    setEnemySolarium,
    setEnemyTheater,
    setEnemyUnderpass,
    setEnemyGrid,
    setPlayerHand,
    setCurrentPlayer,
    setPlayerInterfacedHeadSpace,
    setPlayerInterfacedPandora,
    setEnemyInterfacedHeadSpace,
    setEnemyInterfacedPandora,
    setPlayerElysium,
    setEnemyElysium,
    setPlayerFirstAttack,
    setEnemyFirstAttack,
    setPriorityLeft,
    setPendingRitual,
    setTargetType,
    setPlayerOverload,
    setEnemyOverload,
    setPlayerEntitiesDiedThisTurn,
    setEnemyEntitiesDiedThisTurn
} = stateSetters;

// Export functions
export function adjustEntityPowerExternal(entity, side) {
    if (!entity) return 0;
    let power = entity.power || 0;
    
    // Apply any external modifiers
    if (entity.powerBoost) power += entity.powerBoost;
    if (entity.powerPenalty) power -= entity.powerPenalty;
    
    return Math.max(0, power);
}

export function playerGainWounds(amount) {
    stateSetters.setPlayerWounds(prevWounds => prevWounds + amount);
}

export function playerLoseWounds(amount) {
    stateSetters.setPlayerWounds(prevWounds => Math.max(0, prevWounds - amount));
}

export function enemyGainWounds(amount) {
    stateSetters.setEnemyWounds(prevWounds => prevWounds + amount);
}

export function enemyLoseWounds(amount) {
    stateSetters.setEnemyWounds(prevWounds => Math.max(0, prevWounds - amount));
}

export function playerGainBurden(amount) {
    stateSetters.setPlayerBurden(prevBurden => prevBurden + amount);
}

export function playerLoseBurden(amount) {
    stateSetters.setPlayerBurden(prevBurden => Math.max(0, prevBurden - amount));
}

export function enemyGainBurden(amount) {
    stateSetters.setEnemyBurden(prevBurden => prevBurden + amount);
}

export function enemyLoseBurden(amount) {
    stateSetters.setEnemyBurden(prevBurden => Math.max(0, prevBurden - amount));
}

export function playerGainFate(amount) {
    stateSetters.setPlayerFate(prevFate => prevFate + amount);
}

export function playerLoseFate(amount) {
    stateSetters.setPlayerFate(prevFate => Math.max(0, prevFate - amount));
}

export function enemyGainFate(amount) {
    stateSetters.setEnemyFate(prevFate => prevFate + amount);
}

export function enemyLoseFate(amount) {
    stateSetters.setEnemyFate(prevFate => Math.max(0, prevFate - amount));
}

export function playerGainActions(amount) {
    stateSetters.setPlayerActions(prevActions => Math.max(0, prevActions + amount));
}

export function playerLoseActions(amount) {
    stateSetters.setPlayerActions(prevActions => Math.max(0, prevActions - amount));
}

export function enemyGainActions(amount) {
    stateSetters.setEnemyActions(prevActions => prevActions + amount);
}

export function enemyLoseActions(amount) {
    stateSetters.setEnemyActions(prevActions => Math.max(0, prevActions - amount));
}

export function returnToOriginalRealm(cardEntity, side) {
    // Remove from current realm
    removeFromRealm(cardEntity.realm, cardEntity.id, 'PEOPLE');

    // Add to target realm
    const [, setRealm] = getRealmAndSetter(cardEntity.realm, side);
    setRealm(prev => ({
        ...prev,
        people: [...prev.people, cardEntity]
    }));
}

export function endPlayerTurn() {
    stateSetters.setSelectedCard(null);
    stateSetters.setSelectedInHand(false);
    stateSetters.setDraftSelected(false);
    stateSetters.setTargetType('none');
    stateSetters.setPendingRitual(null);
    stateSetters.setTargetSelection({ enabled: false });
    stateSetters.setCurrentPlayer('ENEMY');
}

export const handleRealmSelect = (realmName) => {
    console.log('selectedCard', selectedCard)
    if (!selectedCard) return;
    if (!selectedCard.card.focus) {
        console.log('Card has no focus');
        return;
    }
    const soulsAvailable = calculateSoulsAvailable(selectedCard.id);
    if (selectedCard.card.category === 'LANDMARK' || selectedCard.card.category === 'LOCATION') {
        if (playerBits < selectedCard.card.rezCost || playerAshes < selectedCard.card.ash || soulsAvailable < selectedCard.card.soul) {
            console.log('no resources')
            return;
        }
    }
    const { category, magi, phys, tech, activationCost } = selectedCard.card;
    console.log(realmName);

    if (category === 'RITUAL') {
        // First handle any non-targeting abilities like Duplicate
        selectedCard.card.abilities.forEach(
            ability => typeof ability === 'string' || !ability.requiresTarget
        );

        // Then set up targeting for abilities that need it
        const targetingAbilities = selectedCard.card.abilities.filter(
            ability => typeof ability === 'object' && ability.requiresTarget
        );

        if (targetingAbilities.length > 0) {
            const ability = targetingAbilities[0]; // Handle first targeting ability
            stateSetters.setPendingRitual({ entity: selectedCard, ability });
            stateSetters.setTargetSelection({
                enabled: true,
                side: 'PLAYER',
                filter: (target) => target.card.category === 'ENTITY' && target.owner === 'PLAYER',
                onSelect: (target) => {
                    confirmRitualActivation(target);
                },
                onCancel: () => {
                    stateSetters.setPendingRitual(null);
                    stateSetters.setTargetSelection({ enabled: false });
                },
            });
            // Don't remove from hand yet - wait for target confirmation
            return;
        }
    }

    if (battleSelectedCard) {
        returnToOriginalRealm(battleSelectedCard, 'PLAYER');
        stateSetters.setBattleSelectedCard(null);
        const occupiedPlayerSlots = playerBattleSlots.filter(slot => slot !== null).length;
        const occupiedEnemySlots = enemyBattleSlots.filter(slot => slot !== null).length;
        const isPlayerBattleEmpty = occupiedPlayerSlots === 1;
        const isEnemyBattleEmpty = occupiedEnemySlots === 0;

        if (isPlayerBattleEmpty && isEnemyBattleEmpty) {
            stateSetters.setBattleRealm(null);
        }
    }
    if (!selectedInHand) return;
    const isImpostor = selectedCard.card.abilities?.some(
        (ability) => ability.name === 'Impostor'
    ) || (draftSelected && recruiterCount > 0);

    if (isImpostor) {
        stateSetters.setAwaitingImpostor(true);
        stateSetters.setImpostorRealm(realmName);
        console.log(`Awaiting Impostor target in realm: ${realmName}`);
        return;
    }

    // Initialize variables
    let canPlace = false;
    let targetRealmSetter = null;
    let placementArray = null;
    let updatedCard = { ...selectedCard, realm: realmName, owner: 'PLAYER' };

    switch (realmName) {
        case 'Solarium':
            if (category === 'ENTITY' && magi) {
                canPlace = true;
                targetRealmSetter = setPlayerSolarium;
                placementArray = 'people';
            }
            break;
        case 'Theater':
            if (category === 'ENTITY' && (magi || phys)) {
                canPlace = true;
                targetRealmSetter = setPlayerTheater;
                placementArray = 'people';
            } else if (category === 'LOCATION' || category === 'LANDMARK') {
                canPlace = true;
                targetRealmSetter = setPlayerTheater;
                placementArray = 'places';
                updatedCard.online = true;
            }
            break;
        case 'Underpass':
            if (category === 'ENTITY' && (tech || phys)) {
                canPlace = true;
                targetRealmSetter = setPlayerUnderpass;
                placementArray = 'people';
            } else if (category === 'LOCATION' || category === 'LANDMARK') {
                canPlace = true;
                targetRealmSetter = setPlayerUnderpass;
                placementArray = 'places';
                updatedCard.online = true;
            } else if (category === 'SNIP' || category === 'SYM') {
                canPlace = true;
                targetRealmSetter = setPlayerUnderpass;
                placementArray = 'things';
                updatedCard.online = false;
            }
            break;
        case 'Grid':
            if (category === 'ENTITY' && tech) {
                canPlace = true;
                targetRealmSetter = setPlayerGrid;
                placementArray = 'people';
            } else if (category === 'SNIP' || category === 'SYM') {
                canPlace = true;
                targetRealmSetter = setPlayerGrid;
                placementArray = 'things';
                updatedCard.online = false;
            }
            break;
        default:
            // Invalid realm
            return;
    }

    if (canPlace) {
        console.log('can place');
        if (category === 'LOCATION' && activationCost > 0) {
            if (playerBits >= activationCost) {
                playerLoseBits(activationCost); // Deduct bits
            } else {
                console.log('Not enough bits to play Location with cost of: ', activationCost)
                return;
            }
        }

        // Add the card to the appropriate array in the realm
        targetRealmSetter((prevRealm) => ({
            ...prevRealm,
            [placementArray]: [...prevRealm[placementArray], updatedCard],
        }));

        console.log('Actions before decrement:', playerActions);
        playerLoseActions(1); // Deduct an action point
        console.log('Actions after decrement:', playerActions);

        // Remove the card from the player's hand
        if (draftSelected) {
            setDraft((prevDraft) => prevDraft.slice(1));
        } else {
            setPlayerHand((prevHand) => prevHand.filter((card) => card.id !== selectedCard.id));
        }
        setSelectedCard(null);
        setDraftSelected(false);
        setTargetType('none');
        setCurrentPlayer('ENEMY');
        if (updatedCard.card.category === 'LANDMARK' || updatedCard.card.category === 'LOCATION' || updatedCard.card.name === 'Dreamer') {
            console.log('rez place')
            handleRezPlayerCard(updatedCard)
        }
    } else {
        // Cannot place the card in this realm
        console.log('Cannot place the card in this realm.');
    }
};

// function confirmRitualActivation(target) {
//     const { entity, ability } = pendingRitual;
//     removeCardFromHand(entity);
//     triggerRitualAbilities(entity, target, 'PLAYER', ability);
//     endPlayerTurn();
// }

function confirmRitualActivation(target) {
    const { entity, ability } = stateSetters.pendingRitual;
    removeCardFromHand(entity);
    // First trigger non-targeting abilities
    entity.card.abilities.forEach(ab => {
        if (typeof ab === 'string') {
            // Handle abilities like "Duplicate"
            const abilityDef = abilitiesDefinitions[ab];
            if (abilityDef && abilityDef.onPlay) {
                abilityDef.onPlay(entity, null, 'PLAYER');
            }
        }
    });
    // Then trigger the targeting ability with the selected target
    triggerRitualAbilities(entity, target, 'PLAYER', ability);
    endPlayerTurn();
}

function removeCardFromHand(card) {
    stateSetters.setPlayerHand((prevHand) => prevHand.filter((c) => c.id !== card.id));
    //playerLoseActions(1);
}

function triggerRitualAbilities(entity, target, side) {
    entity.card.abilities.forEach((ability) => {
        if (typeof ability === 'object' && ability.type === 'onPlay') {
            const abilityDef = abilitiesDefinitions[ability.name];
            if (abilityDef && abilityDef.onPlay) {
                abilityDef.onPlay(entity, null, side, target);
            }
        } else if (typeof ability === 'object' && ability.type === 'conditional') {
            const abilityDef = abilitiesDefinitions[ability.name];
            if (abilityDef && abilityDef.onPlay) {
                abilityDef.onPlay(entity, null, side, target);
            }
        } else if (ability === 'Duplicate') {
            const abilityDef = abilitiesDefinitions['Duplicate'];
            if (abilityDef && abilityDef.onPlay) {
                abilityDef.onPlay(entity, null, side);
            }
        }
    });
}

function playerAdvanceCards() {
    const advanceCardList = (cardList) => {
        return cardList.map(cardEntity => {
            if (cardEntity.freeze > 0) {
                cardEntity.freeze -= 1;
                console.log(`${cardEntity.card.name} reduces Freeze by 1. Remaining Freeze: ${cardEntity.freeze}`);
            } else {
                if ('steps' in cardEntity) {
                    const newSteps = cardEntity.steps + 1;
                    let updatedCard = { ...cardEntity, steps: newSteps };

                    if (cardEntity.card.timer && newSteps >= cardEntity.card.timer) {
                        updatedCard.readied = true;
                    }
                    return updatedCard;
                }
            }
            return cardEntity;
        });
    };

    stateSetters.setPlayerSolarium(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people)
        };
    });

    stateSetters.setPlayerTheater(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people)
        };
    });

    stateSetters.setPlayerUnderpass(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people)
        };
    });

    stateSetters.setPlayerGrid(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people)
        };
    });
}

function enemyAdvanceCards() {
    const advanceCardList = (cardList) => {
        return cardList.map(cardEntity => {
            if (cardEntity.freeze > 0) {
                cardEntity.freeze -= 1;
                console.log(`${cardEntity.card.name} reduces Freeze by 1. Remaining Freeze: ${cardEntity.freeze}`);
            } else {
                if (cardEntity.card.category === 'ENTITY') {
                    const newSteps = (cardEntity.steps || 0) + 1;
                    let updatedCard = { ...cardEntity, steps: newSteps };

                    if (cardEntity.card.timer && newSteps >= cardEntity.card.timer && !cardEntity.freeze) {
                        updatedCard.readied = true;
                    }
                    return updatedCard;

                } else if (cardEntity.card.category === 'SYM' || cardEntity.card.category === 'LANDMARK') {
                    const newDevelopment = (cardEntity.development || 0) + 1;
                    let updatedCard = { ...cardEntity, development: newDevelopment };

                    if (cardEntity.card.plot && newDevelopment >= cardEntity.card.plot) {
                        handleAscension(cardEntity, 'ENEMY');
                        console.log(`${cardEntity.card.name} has ascended.`);
                    }
                    return updatedCard;

                } else if (cardEntity.scheming) {
                    // Increment the scheme points
                    const newScheme = (cardEntity.scheme || 0) + 1;
                    let updatedCard = { ...cardEntity, scheme: newScheme };

                    if (cardEntity.card.schemeThreshold && newScheme >= cardEntity.card.schemeThreshold) {
                        // Unlock the scheme ability
                        updatedCard.schemeUnlocked = true;
                        console.log(`${cardEntity.card.name} has unlocked its Scheme ability.`);
                    }
                    return updatedCard;
                }
            }
            return cardEntity;
        });
    };


    stateSetters.setEnemySolarium(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people),
            places: advanceCardList(prevRealm.places),
            things: advanceCardList(prevRealm.things)
        };
    });

    stateSetters.setEnemyTheater(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people),
            places: advanceCardList(prevRealm.places),
            things: advanceCardList(prevRealm.things)
        };
    });

    stateSetters.setEnemyUnderpass(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people),
            places: advanceCardList(prevRealm.places),
            things: advanceCardList(prevRealm.things)
        };
    });

    stateSetters.setEnemyGrid(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people),
            places: advanceCardList(prevRealm.places),
            things: advanceCardList(prevRealm.things)
        };
    });
}

export function enemyDraw(num) {
    console.log('enemy draw', num)
    let remainingCards = num;

    if (enemyWounds > 0) {
        const newWounds = enemyWounds - num;
        remainingCards = Math.max(0, -newWounds);
        stateSetters.setEnemyWounds(prevWounds => Math.max(0, prevWounds - newWounds));
    }
    if (remainingCards > 0) {
        stateSetters.setEnemyLibrary(prevLibrary => {
            const newHandCards = prevLibrary.slice(0, remainingCards);
            const newLibrary = prevLibrary.slice(remainingCards);

            stateSetters.setEnemyHand(prevHand => [
                ...prevHand,
                ...newHandCards
            ]);

            return newLibrary;
        });
    }
}

function enemyPlayCard() {
    if (enemyHand.length === 0) return;

    const cardToPlay = enemyHand[0];
    const { category, magi, phys, tech } = cardToPlay.card;

    let realmToPlayIn = null;
    const priorityList = priorityLeft ? ['Solarium', 'Theater', 'Underpass', 'Grid'] : ['Grid', 'Underpass', 'Theater', 'Solarium'];

    for (let realmName of priorityList) {
        if (category === 'ENTITY') {
            if ((realmName === 'Solarium' && magi) ||
                (realmName === 'Theater' && (magi || phys)) ||
                (realmName === 'Underpass' && (tech || phys)) ||
                (realmName === 'Grid' && tech)) {
                realmToPlayIn = realmName;
                break;
            }
        } else if (category === 'LANDMARK' || category === 'LOCATION') {
            if (realmName === 'Theater' || realmName === 'Underpass') {
                realmToPlayIn = realmName;
                break;
            }
        } else if (category === 'SYM' || category === 'SNIP') {
            if (realmName === 'Grid' || realmName === 'Underpass') {
                realmToPlayIn = realmName;
                break;
            }
        }
    }

    if (realmToPlayIn) {
        const updatedCard = { ...cardToPlay, realm: realmToPlayIn, owner: 'ENEMY' };

        switch (category) {
            case 'ENTITY':
                switch (realmToPlayIn) {
                    case 'Solarium':
                        stateSetters.setEnemySolarium(prevRealm => ({
                            ...prevRealm,
                            people: [...prevRealm.people, updatedCard]
                        }));
                        break;
                    case 'Theater':
                        stateSetters.setEnemyTheater(prevRealm => ({
                            ...prevRealm,
                            people: [...prevRealm.people, updatedCard]
                        }));
                        break;
                    case 'Underpass':
                        stateSetters.setEnemyUnderpass(prevRealm => ({
                            ...prevRealm,
                            people: [...prevRealm.people, updatedCard]
                        }));
                        break;
                    case 'Grid':
                        stateSetters.setEnemyGrid(prevRealm => ({
                            ...prevRealm,
                            people: [...prevRealm.people, updatedCard]
                        }));
                        break;
                    default:
                        console.log('Unknown realm:', realmToPlayIn);
                        break;
                }
                break;
            case 'SYM':
            case 'SNIP':
                switch (realmToPlayIn) {
                    case 'Grid':
                        stateSetters.setEnemyGrid(prevRealm => ({
                            ...prevRealm,
                            things: [...prevRealm.things, updatedCard]
                        }));
                        break;
                    case 'Underpass':
                        stateSetters.setEnemyUnderpass(prevRealm => ({
                            ...prevRealm,
                            things: [...prevRealm.things, updatedCard]
                        }));
                        break;
                    default:
                        console.log('Unknown realm:', realmToPlayIn);
                        break;
                }
                break;
            default:
                console.log('Unknown category:', category);
                break;
        }

        // Trigger any on-play effects
        if (cardToPlay.abilities) {
            cardToPlay.abilities.forEach(ability => {
                const abilityDef = getAbilityDefinition(ability);
                if (abilityDef && abilityDef.onPlay) {
                    abilityDef.onPlay(updatedCard, null, 'ENEMY');
                }
            });
        }

        // Remove the card from the enemy's hand
        stateSetters.setEnemyHand(prevHand => prevHand.filter(card => card.id !== cardToPlay.id));
    } else {
        console.log('No realm to play in');
    }
}

export function performDetox(side) {
    if (side === 'PLAYER' && playerActions >= 3) {
        stateSetters.setPlayerActions(prev => prev - 3);
        detoxEntities(side);
    } else if (side === 'ENEMY' && enemyActions >= 3) {
        stateSetters.setEnemyActions(prev => prev - 3);
        detoxEntities(side);
    } else {
        console.log('Not enough actions to detox');
    }
}

function detoxEntities(side) { // todo apply effect
    const realms = side === 'PLAYER'
        ? [playerSolarium, playerTheater, playerUnderpass, playerGrid]
        : [enemySolarium, enemyTheater, enemyUnderpass, enemyGrid];

    const friendlyEntities = realms.flatMap(realm => realm.people);
    friendlyEntities.forEach(entity => {
        if (entity.freeze > 0) {
            entity.freeze = 0;
            console.log(`${entity.card.name}'s Freeze is removed.`);
        }
        if (entity.decay > 0) {
            entity.decay = 0;
            console.log(`${entity.card.name}'s Decay is removed.`);
        }
    });

    if (side !== 'PLAYER') { // Only enemy side clears venom from people, places, and things
        const enemySide = side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
        const enemyRealms = enemySide === 'PLAYER'
            ? [playerSolarium, playerTheater, playerUnderpass, playerGrid]
            : [enemySolarium, enemyTheater, enemyUnderpass, enemyGrid];

        const enemyEntities = enemyRealms.flatMap(realm => [
            ...realm.people,
            ...realm.places,
            ...realm.things
        ]);

        enemyEntities.forEach(entity => {
            if (entity.venom > 0) {
                entity.venom = 0;
                console.log(`${entity.card.name}'s Venom is removed.`);
            }
        });
    }

    console.log(`${side === 'PLAYER' ? 'Player' : 'Enemy'} performed Detox.`);
}

export const handleBoostButton = () => {
    playerLoseActions(1);
    playerLoseBits(1);
    stateSetters.setAttackMode('BOOST')
}

export const handleDevelopButton = () => {
    if (playerActions < 1 || playerBits < 1) {
        console.log('Not enough resources to develop a card.');
        return;
    }
    playerLoseActions(1);
    playerLoseBits(1);
    stateSetters.setAttackMode('DEVELOP');
    console.log('Select a card to develop.');
}

export const handleDrawButton = () => {
    playerDraw(1);
    playerLoseActions(1);
    stateSetters.setCurrentPlayer('ENEMY');
}

export const handleDraftButton = () => {
    playerDraft();
}

export function playerDraw(num) {
    console.log('draw ', num);
    let remainingCards = num;

    if (playerWounds > 0) {
        const newWounds = playerWounds - num;
        remainingCards = Math.max(0, -newWounds);
        stateSetters.setPlayerWounds(prevWounds => Math.max(0, prevWounds - newWounds));
    }

    if (remainingCards > 0) {
        stateSetters.setPlayerLibrary(prevLibrary => {
            const newHandCards = prevLibrary.slice(0, remainingCards);
            const newLibrary = prevLibrary.slice(remainingCards);

            stateSetters.setPlayerHand(prevHand => [
                ...prevHand,
                ...newHandCards
            ]);

            return newLibrary;
        });
    }
}

const playerDraft = () => {
    setSelectedCard(draft[0]);
    setDraftSelected(true);
    setSelectedInHand(true);
};

export function handlePlayerMine() {
    playerGainBits(1);
    playerLoseActions(1);
    setCurrentPlayer('ENEMY');
}


export function getFriendlyEntities(side, realmName = null) {
    const realms = side === 'PLAYER' ? getAllPlayerRealms() : getAllEnemyRealms();
    let entities = [];

    realms.forEach(realm => {
        if (!realmName || realm.name === realmName) {
            entities = entities.concat(realm.people);
        }
    });

    return entities;
}

export function getEnemyEntities(side, realmName = null) {
    const enemySide = getOppositeSide(side);
    return getFriendlyEntities(enemySide, realmName);
}

// These functions are now imported from utils.js
// function getAllPlayerRealms() {
//     return [playerSolarium, playerUnderpass, playerGrid, playerTheater];
// }

// function getAllEnemyRealms() {
//     return [enemySolarium, enemyUnderpass, enemyGrid, enemyTheater];
// }

function processEndOfTurnEffects() {
    // Reset death counters
    setPlayerEntitiesDiedThisTurn(0);
    setEnemyEntitiesDiedThisTurn(0);

    // Get all realms and their setters
    const playerRealms = [
        { realm: playerSolarium, setRealm: setPlayerSolarium },
        { realm: playerTheater, setRealm: setPlayerTheater },
        { realm: playerUnderpass, setRealm: setPlayerUnderpass },
        { realm: playerGrid, setRealm: setPlayerGrid },
    ];

    const enemyRealms = [
        { realm: enemySolarium, setRealm: setEnemySolarium },
        { realm: enemyTheater, setRealm: setEnemyTheater },
        { realm: enemyUnderpass, setRealm: setEnemyUnderpass },
        { realm: enemyGrid, setRealm: setEnemyGrid },
    ];

    const allRealms = [...playerRealms, ...enemyRealms];

    allRealms.forEach(({ realm, setRealm }) => {
        const newPeople = realm.people.map((entity) => {
            let newEntity = { ...entity };

            // Process effects
            if (newEntity.effects && newEntity.effects.length > 0) {
                newEntity.effects = newEntity.effects
                    .map((effect) => {
                        const updatedEffect = { ...effect };
                        if (updatedEffect.remainingDuration !== undefined) {
                            updatedEffect.remainingDuration -= 1;
                            if (updatedEffect.remainingDuration <= 0) {
                                // Remove effect
                                removeEffect(newEntity.id, realm.name, newEntity.owner, updatedEffect);
                                return null; // Mark for removal
                            }
                        }
                        return updatedEffect;
                    })
                    .filter((e) => e !== null); // Remove expired effects
            }

            // Handle status effects durations
            if (newEntity.decay > 0) {
                // Handle damage and update entity state
                handleDamage(realm.name, newEntity.id, newEntity.decay, newEntity.owner);
                console.log(`${newEntity.card.name} takes ${newEntity.decay} Decay damage.`);
                newEntity.decay -= 1;
                console.log(`${newEntity.card.name} Decay decreases to ${newEntity.decay}`);
            }

            return newEntity;
        });

        // Update the realm state
        setRealm({
            ...realm,
            people: newPeople,
            places: realm.places,
            things: realm.things
        });
    });
}

export function enemyPerformAction() {
    console.log('enemy perform action', enemyActions);
    if (enemyActions > 0) {
        enemyRezCards().then(() => {
            enemyPlanAttack().then(attackPlanned => {
                if (attackPlanned) {
                    enemyLoseActions(1);
                    return;
                }
                if (enemyHand.length > 0) {
                    enemyPlayCard();
                    enemyLoseActions(1);
                } else {
                    setCurrentPlayer('PLAYER');
                }
            });
        });
    } else {
        setCurrentPlayer('PLAYER');
    }
}


export function startTurn(currentPriorityLeft) {
    console.log('start turn', currentPriorityLeft)
    eventManager.publish('turnStart', { side: 'PLAYER' });
    eventManager.publish('turnStart', { side: 'ENEMY' });
    // Reset game state
    setDraftSelected(false);
    setPendingRitual(null);
    
    // Reset UI state via event manager
    eventManager.publish('resetUIState', {
        targetType: 'none',
        targetSelection: { enabled: false },
        awaitingFocus: true,
        focus: '',
        selectedCard: null,
        selectedInHand: false
    });
    const startingPlayer = currentPriorityLeft ? 'ENEMY' : 'PLAYER';
    setCurrentPlayer(startingPlayer);
    // Reset interface states after card processing
    Promise.resolve().then(() => {
        setPlayerInterfacedHeadSpace(false);
        setPlayerInterfacedPandora(false);
        setEnemyInterfacedHeadSpace(false);
        setEnemyInterfacedPandora(false);
    });

    const resetTurnFlags = (cardList) => {
        return cardList.map(cardEntity => {
            if (cardEntity.abilityActivated) {
                cardEntity.abilityActivated = false;
            }
            return cardEntity;
        });
    };

    setPlayerSolarium(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
    }));
    setPlayerTheater(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
        places: resetTurnFlags(prevRealm.places),
    }));
    setPlayerUnderpass(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
        places: resetTurnFlags(prevRealm.places),
        things: resetTurnFlags(prevRealm.things),
    }));
    setPlayerGrid(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
        things: resetTurnFlags(prevRealm.things),
    }));
    setPlayerElysium(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
        places: resetTurnFlags(prevRealm.places),
        things: resetTurnFlags(prevRealm.things),
    }));
    setEnemySolarium(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
    }));
    setEnemyTheater(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
        places: resetTurnFlags(prevRealm.places),
    }));
    setEnemyUnderpass(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
        places: resetTurnFlags(prevRealm.places),
        things: resetTurnFlags(prevRealm.things),
    }));
    setEnemyGrid(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
        things: resetTurnFlags(prevRealm.things),
    }));
    setEnemyElysium(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
        places: resetTurnFlags(prevRealm.places),
        things: resetTurnFlags(prevRealm.things),
    }));


    playerGainActions(3 + playerDriftCount);
    if (playerGlitchyAmount > 0) {
        setPlayerOverload((prev) => prev + playerGlitchyAmount);
        console.log(`Player gains ${playerGlitchyAmount} Overload due to Glitchy abilities.`);
    }
    if (enemyGlitchyAmount > 0) {
        setEnemyOverload((prev) => prev + enemyGlitchyAmount);
        console.log(`Enemy gains ${enemyGlitchyAmount} Overload due to Glitchy abilities.`);
    }
    enemyGainActions(2 + enemyDriftCount);
    enemyGainBits(enemyDividendAmount);
    playerGainBits(playerDividendAmount);
    playerDraw(1);
    enemyDraw(1);
    setPlayerFirstAttack(true);
    setEnemyFirstAttack(true);
    playerAdvanceCards();
    enemyAdvanceCards();
}

export function endTurn() {
    console.log('end turn');
    processEndOfTurnEffects();
    const newPriorityLeft = !priorityLeft;
    setPriorityLeft(newPriorityLeft);
    handleDominationPhase().then(() => {
        startTurn(newPriorityLeft);
    });
}



export const removeFromRealm = (realmName, entityId, category) => {
    const [realm, setRealm] = getRealmAndSetter(realmName);
    
    if (!realm || !setRealm) {
        console.error(`Invalid realm name: ${realmName}`);
        return;
    }

    setRealm(prev => {
        let updated = { ...prev };
        let removed = false;

        // Handle based on category
        switch (category) {
            case 'PEOPLE':
                if (Array.isArray(updated.people)) {
                    const originalLength = updated.people.length;
                    updated.people = updated.people.filter(c => c.id !== entityId);
                    removed = updated.people.length !== originalLength;
                }
                break;
            case 'PLACES':
                if (Array.isArray(updated.places)) {
                    const originalLength = updated.places.length;
                    updated.places = updated.places.filter(c => c.id !== entityId);
                    removed = updated.places.length !== originalLength;
                }
                break;
            case 'THINGS':
                if (Array.isArray(updated.things)) {
                    const originalLength = updated.things.length;
                    updated.things = updated.things.filter(c => c.id !== entityId);
                    removed = updated.things.length !== originalLength;
                }
                break;
            default:
                console.error(`Invalid category: ${category}`);
        }

        if (removed) {
            console.log(`Removed entity ID ${entityId} from ${category} in ${realmName} realm`);
        } else {
            console.warn(`Entity with ID ${entityId} not found in ${category} within ${realmName} realm`);
        }

        return updated;
    });
};

export function getGlobalEntityById(entityId, side, realmName) {
    const [realm] = getRealmAndSetter(realmName, side);

    if (!realm) {
        console.error(`Invalid realm: ${realmName}`);
        return null;
    }

    // Search the people array in the given realm for the entity
    const foundEntity = realm.people.find(card => card.id === entityId);
    return foundEntity || null;
}

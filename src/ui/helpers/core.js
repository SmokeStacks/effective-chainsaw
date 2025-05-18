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
import { enemyRezCards as performEnemyRez } from './enemy/rez';
import { enemyPlanAttack as planEnemyAttack } from './enemy/attack';
import { getAbilityDefinition, activateAbilities, abilitiesDefinitions } from '../abilities/glossary';
import { 
    removeEffect,
    playerGainOverload,
    enemyGainOverload
} from './effects';

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

// Import draft list
import { draftList } from '../../systemDecks/draft';

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
    setEnemyHand,
    setCurrentPlayer,

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
    console.log('!!! HANDLE REALM SELECT CALLED !!!');
    console.log('!!! REALM NAME:', realmName, '!!!');
    console.log('!!! SELECTED CARD:', selectedCard, '!!!');
    console.log('!!! GAME STATE:', state, '!!!');
    console.log('!!! REALMS:', { player: state.playerSolarium, enemy: state.enemySolarium }, '!!!');

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
            // Direct approach to fix card removal
            
            // 1. Update the global state directly
            state.playerHand = state.playerHand.filter(card => card.id !== selectedCard.id);
            
            // 2. Use stateSetters to ensure UI updates
            stateSetters.setPlayerHand(state.playerHand);
            
            // 3. Force a re-render by calling setSelectedCard
            setSelectedCard(null);
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

export function removeCardFromHand(card) {
    console.log('REMOVE CARD FROM HAND CALLED');
    console.log('Card to remove:', card);
    console.log('Current state.playerHand:', state.playerHand);
    
    // Get the current player hand from state
    const currentHand = [...state.playerHand];
    
    // Filter out the card to be removed
    const newHand = currentHand.filter(c => c.id !== card.id);
    console.log('New hand after filtering:', newHand);
    
    // Directly update the state.playerHand
    state.playerHand = newHand;
    console.log('Updated state.playerHand directly:', state.playerHand);
    
    // Use stateSetters.setPlayerHand to update the state
    stateSetters.setPlayerHand(newHand);
    console.log('Called stateSetters.setPlayerHand with:', newHand);
    
    // Deduct an action point
    playerLoseActions(1);
}

export function triggerRitualAbilities(entity, target, side) {
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

export function enemyPlayCard() {
    console.log('--- enemyPlayCard Invoked ---');
    
    // Debug the state to find discrepancies
    console.log('enemyPlayCard - Hand state check:', {
        stateEnemyHand: state.enemyHand,
        stateEnemyHandLength: state.enemyHand.length,
        localEnemyHand: enemyHand,
        localEnemyHandLength: enemyHand.length
    });
    
    // Use state.enemyHand instead of the local enemyHand variable
    if (state.enemyHand.length === 0) {
        console.log('Enemy hand is empty, cannot play a card');
        return false;
    }

    // Select the first card in the hand to play (matching original implementation)
    const cardToPlay = state.enemyHand[0];
    console.log('Card to play:', {
        id: cardToPlay.id,
        name: cardToPlay.card.name,
        category: cardToPlay.card.category,
        magi: cardToPlay.card.magi,
        phys: cardToPlay.card.phys,
        tech: cardToPlay.card.tech
    });

    const { category, magi, phys, tech } = cardToPlay.card;

    // Determine which realm to play the card in
    const priorityList = priorityLeft ? ['Solarium', 'Theater', 'Underpass', 'Grid'] : ['Grid', 'Underpass', 'Theater', 'Solarium'];
    console.log('Priority list for playing card:', priorityList);

    let realmToPlayIn = null;

    for (let realmName of priorityList) {
        console.log(`Checking if card can be played in realm: ${realmName}`);
        console.log(`Card is an ${category} with aspects - magi: ${magi}, phys: ${phys}, tech: ${tech}`);

        if (category === 'ENTITY') {
            if ((realmName === 'Solarium' && magi) ||
                (realmName === 'Theater' && (magi || phys)) ||
                (realmName === 'Underpass' && (tech || phys)) ||
                (realmName === 'Grid' && tech)) {
                realmToPlayIn = realmName;
                console.log(`Selected realm for ${category}: ${realmToPlayIn}`);
                break;
            }
        } else if (category === 'LANDMARK' || category === 'LOCATION') {
            if (realmName === 'Theater' || realmName === 'Underpass') {
                realmToPlayIn = realmName;
                console.log(`Selected realm for ${category}: ${realmToPlayIn}`);
                break;
            }
        } else if (category === 'SYM' || category === 'SNIP') {
            if (realmName === 'Grid' || realmName === 'Underpass') {
                realmToPlayIn = realmName;
                console.log(`Selected realm for ${category}: ${realmToPlayIn}`);
                break;
            }
        }
    }

    if (realmToPlayIn) {
        console.log(`Playing card in realm: ${realmToPlayIn}`);
        let updatedCard = { ...cardToPlay, realm: realmToPlayIn, owner: 'ENEMY' };
        console.log('Updated card:', updatedCard);

        switch (category) {
            case 'ENTITY':
                switch (realmToPlayIn) {
                    case 'Solarium':
                        // Create a copy of the current state to avoid function references
                        const currentSolariumState = { ...state.enemySolarium };
                        
                        // Ensure the people array exists
                        if (!currentSolariumState.people) {
                            currentSolariumState.people = [];
                        }
                        
                        // Create the updated state
                        const updatedSolariumState = {
                            ...currentSolariumState,
                            people: [...currentSolariumState.people, updatedCard]
                        };
                        
                        // Update the state using the object directly, not a function
                        stateSetters.setEnemySolarium(updatedSolariumState);
                        break;
                    case 'Theater':
                        // Create a copy of the current state to avoid function references
                        const currentTheaterState = { ...state.enemyTheater };
                        console.log('Enemy Theater before update:', currentTheaterState);
                        
                        // Ensure the people array exists
                        if (!currentTheaterState.people) {
                            currentTheaterState.people = [];
                        }
                        
                        // Create the updated state
                        const updatedTheaterState = {
                            ...currentTheaterState,
                            people: [...currentTheaterState.people, updatedCard]
                        };
                        
                        console.log('Enemy Theater updated state:', updatedTheaterState);
                        
                        // Update the state using the object directly, not a function
                        stateSetters.setEnemyTheater(updatedTheaterState);
                        
                        // Log the state after update
                        setTimeout(() => {
                            console.log('Enemy Theater after update (actual):', state.enemyTheater);
                        }, 0);
                        break;
                    case 'Underpass':
                        // Create a copy of the current state to avoid function references
                        const currentUnderpassState = { ...state.enemyUnderpass };
                        
                        // Ensure the people array exists
                        if (!currentUnderpassState.people) {
                            currentUnderpassState.people = [];
                        }
                        
                        // Create the updated state
                        const updatedUnderpassState = {
                            ...currentUnderpassState,
                            people: [...currentUnderpassState.people, updatedCard]
                        };
                        
                        // Update the state using the object directly, not a function
                        stateSetters.setEnemyUnderpass(updatedUnderpassState);
                        break;
                    case 'Grid':
                        // Create a copy of the current state to avoid function references
                        const currentGridState = { ...state.enemyGrid };
                        
                        // Ensure the people array exists
                        if (!currentGridState.people) {
                            currentGridState.people = [];
                        }
                        
                        // Create the updated state
                        const updatedGridState = {
                            ...currentGridState,
                            people: [...currentGridState.people, updatedCard]
                        };
                        
                        // Update the state using the object directly, not a function
                        stateSetters.setEnemyGrid(updatedGridState);
                        break;
                    default:
                        console.log('card not placed');
                }
                break;
            case 'LANDMARK':
            case 'LOCATION':
                switch (realmToPlayIn) {
                    case 'Solarium':
                        // Create a copy of the current state to avoid function references
                        const currentSolariumState = { ...state.enemySolarium };
                        
                        // Ensure the places array exists
                        if (!currentSolariumState.places) {
                            currentSolariumState.places = [];
                        }
                        
                        // Create the updated state
                        const updatedSolariumState = {
                            ...currentSolariumState,
                            places: [...currentSolariumState.places, updatedCard]
                        };
                        
                        // Update the state using the object directly, not a function
                        stateSetters.setEnemySolarium(updatedSolariumState);
                        break;
                    case 'Theater':
                        // Create a copy of the current state to avoid function references
                        const currentTheaterState = { ...state.enemyTheater };
                        
                        // Ensure the places array exists
                        if (!currentTheaterState.places) {
                            currentTheaterState.places = [];
                        }
                        
                        // Create the updated state
                        const updatedTheaterState = {
                            ...currentTheaterState,
                            places: [...currentTheaterState.places, updatedCard]
                        };
                        
                        // Update the state using the object directly, not a function
                        stateSetters.setEnemyTheater(updatedTheaterState);
                        break;
                    case 'Underpass':
                        // Create a copy of the current state to avoid function references
                        const currentUnderpassState = { ...state.enemyUnderpass };
                        
                        // Ensure the places array exists
                        if (!currentUnderpassState.places) {
                            currentUnderpassState.places = [];
                        }
                        
                        // Create the updated state
                        const updatedUnderpassState = {
                            ...currentUnderpassState,
                            places: [...currentUnderpassState.places, updatedCard]
                        };
                        
                        // Update the state using the object directly, not a function
                        stateSetters.setEnemyUnderpass(updatedUnderpassState);
                        break;
                    case 'Grid':
                        // Create a copy of the current state to avoid function references
                        const currentGridState = { ...state.enemyGrid };
                        
                        // Ensure the places array exists
                        if (!currentGridState.places) {
                            currentGridState.places = [];
                        }
                        
                        // Create the updated state
                        const updatedGridState = {
                            ...currentGridState,
                            places: [...currentGridState.places, updatedCard]
                        };
                        
                        // Update the state using the object directly, not a function
                        stateSetters.setEnemyGrid(updatedGridState);
                        break;
                    default:
                        console.log('card not placed');
                }
                break;
            case 'SYM':
            case 'SNIP':
                switch (realmToPlayIn) {
                    case 'Grid':
                        console.log('Placing SYM/SNIP in Grid');
                        // Create a copy of the current state to avoid function references
                        const currentGridState = { ...state.enemyGrid };
                        
                        // Ensure the things array exists
                        if (!currentGridState.things) {
                            currentGridState.things = [];
                        }
                        
                        // Create the updated state
                        const updatedGridState = {
                            ...currentGridState,
                            things: [...currentGridState.things, updatedCard]
                        };
                        
                        // Update the state using the object directly, not a function
                        stateSetters.setEnemyGrid(updatedGridState);
                        break;
                    case 'Underpass':
                        console.log('Placing SYM/SNIP in Underpass');
                        // Create a copy of the current state to avoid function references
                        const currentUnderpassState = { ...state.enemyUnderpass };
                        
                        // Ensure the things array exists
                        if (!currentUnderpassState.things) {
                            currentUnderpassState.things = [];
                        }
                        
                        // Create the updated state
                        const updatedUnderpassState = {
                            ...currentUnderpassState,
                            things: [...currentUnderpassState.things, updatedCard]
                        };
                        
                        // Update the state using the object directly, not a function
                        stateSetters.setEnemyUnderpass(updatedUnderpassState);
                        break;
                    default:
                        console.log('card not placed');
                }
                break;
        }

        // Remove the played card from the enemy's hand
        // Create a copy of the current state to avoid function references
        const currentHandState = [...state.enemyHand];
        
        // Filter out the played card
        const updatedHandState = currentHandState.filter(card => card.id !== cardToPlay.id);
        
        // Update the state using the object directly, not a function
        stateSetters.setEnemyHand(updatedHandState);

        // Automatically activate landmarks and locations
        if (category === 'LANDMARK' || category === 'LOCATION') {
            // Log the activation
            console.log(`Activating abilities for ${updatedCard.card.name} (${updatedCard.id})`);
            
            // In the original code, this would call a function to activate abilities
            // We'll just log it for now since activateAbilities might not be defined
            if (typeof activateAbilities === 'function') {
                activateAbilities(updatedCard, 'ENEMY');
            } else {
                console.log('activateAbilities function not available, skipping activation');
            }
        }
        
        return true;
    } else {
        console.log('No realm to play in');
        return false;
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

// Moved to actions.js

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

// Create a draft deck
export function createDraft() {
    const draftInstanceArray = [];
    for (let i = 0; i < draftList.length; i++) {
        const card = draftList[i];
        const cardEntityInstance = {
            id: `c${i.toString()}`,
            card: card,
            power: card.power || 0,
            HP: card.HP || 0,
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
            charge: card.charge || 0,
            sacrificed: false,
            cosmic: card.cosmic || 1,
            deathless: card.deathless || 0,
            pounce: card.pounce || 0,
            override: card.override || 0,
            stealth: card.stealth || 0,
            armored: card.armored || 0,
            solo: card.solo || 0,
            development: card.development || 0,
            plot: card.plot || 0,
            owner: 'ENEMY',
        };
        draftInstanceArray.push(cardEntityInstance);
    }
    return draftInstanceArray;
}

// Initialize draft array
let draftArray = createDraft();

export function playerDraft() {
    // Use the draft array
    if (draftArray && draftArray.length > 0) {
        stateSetters.setSelectedCard(draftArray[0]);
        stateSetters.setDraftSelected(true);
        stateSetters.setSelectedInHand(true);
    } else {
        console.error('Cannot draft: draft deck is empty or undefined');
    }
}

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

export async function enemyPerformAction() {
    console.log('Enemy perform action:', {
        enemyActions: state.enemyActions,
        enemyHandSize: state.enemyHand.length,
        enemyHandContents: state.enemyHand,
        currentPlayer: state.currentPlayer
    });
    
    // Debug the state to find discrepancies
    console.log('State debug - enemyHand:', {
        stateEnemyHand: state.enemyHand,
        stateEnemyHandLength: state.enemyHand.length,
        localEnemyHand: enemyHand,
        localEnemyHandLength: enemyHand.length
    });
    
    try {
        if (state.enemyActions > 0) {
            // First try to rez cards
            await performEnemyRez();
            
            // Then try to plan an attack
            const attackPlanned = await Promise.resolve(planEnemyAttack());
            
            if (attackPlanned) {
                console.log('Enemy planned an attack, consuming 1 action');
                enemyLoseActions(1);
                
                // Continue the enemy turn without passing back to player
                // This allows the enemy to use remaining actions
                if (state.enemyActions > 0) {
                    setTimeout(() => enemyPerformAction(), 1000); // Schedule next enemy action
                } else {
                    console.log('Enemy has no more actions, ending turn');
                    stateSetters.setCurrentPlayer('PLAYER');
                }
                return;
            } 
            
            // If no attack was planned, try to play a card
            if (state.enemyHand.length > 0) {
                console.log('Enemy attempting to play a card from hand');
                enemyPlayCard();
                enemyLoseActions(1);
                
                // Continue the enemy turn if there are actions left
                if (state.enemyActions > 0) {
                    setTimeout(() => enemyPerformAction(), 1000); // Schedule next enemy action
                } else {
                    console.log('Enemy has no more actions, ending turn');
                    stateSetters.setCurrentPlayer('PLAYER');
                }
            } else {
                // If no cards in hand, draw a card
                console.log('Enemy has no cards in hand, drawing a card');
                enemyDraw(1);
                enemyLoseActions(1);
                
                // Continue the enemy turn if there are actions left
                if (state.enemyActions > 0) {
                    setTimeout(() => enemyPerformAction(), 1000); // Schedule next enemy action
                } else {
                    console.log('Enemy has no more actions, ending turn');
                    stateSetters.setCurrentPlayer('PLAYER');
                }
            }
        } else {
            // No actions left, end turn
            console.log('Enemy has no actions, ending turn');
            stateSetters.setCurrentPlayer('PLAYER');
        }
    } catch (error) {
        console.error('Error in enemyPerformAction:', error);
        // Make sure we always pass the turn to the player in case of an error
        stateSetters.setCurrentPlayer('PLAYER');
    }
}


export function startTurn(currentPriorityLeft) {
    console.log('start turn', currentPriorityLeft);
    const startingPlayer = currentPriorityLeft ? 'PLAYER' : 'ENEMY';
    setCurrentPlayer(startingPlayer);
    stateSetters.setCurrentPlayer(startingPlayer);
    stateSetters.setMode('NORMAL');
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
        selectedInHand: false
    });

    // Reset turn flags for all realms
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

    // Handle start of turn effects
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
    enemyDraw(3); // Enemy draws 3 cards at start of turn
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

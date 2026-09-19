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
    enemyLoseSurge,
    playerGainFate,
    playerLoseFate,
    enemyGainFate,
    enemyLoseFate,
    playerGainActions,
    playerLoseActions,
    enemyGainActions,
    enemyLoseActions,
    playerGainWounds,
    playerLoseWounds,
    enemyGainWounds,
    enemyLoseWounds,
    playerGainBurden,
    playerLoseBurden,
    enemyGainBurden,
    enemyLoseBurden
} from './game';

// Import state and setters
import { state, stateSetters } from './state';

// Import draft list
import { draftList } from '../../systemDecks/draft';

// `draw` from player.js is the canonical implementation; we re-export it as
// `playerDraw` below so existing call sites keep working without the
// stale-destructuring bug the local implementation had.
import { draw as playerDraw, payRezCost } from './player';
import { draw as enemyDrawCanonical } from './enemy';
import { rezCostFor } from './activation';
import { healRegeneratingEntities } from './combatKeywords';

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
    enemyLoseSurge,
    // Fate / Actions / Wounds / Burden.
    //
    // These used to be defined locally in this file as bare increments, which
    // silently bypassed the status-absorption rule in notes.txt: Burden is
    // supposed to soak up Fate gains and Lag to soak up Action gains. Since
    // glossary.js imports the Fate helpers from here, every Fate-granting
    // ability ignored Burden entirely. They now resolve to the same canonical
    // player.js / enemy.js implementations used everywhere else.
    playerGainFate,
    playerLoseFate,
    enemyGainFate,
    enemyLoseFate,
    playerGainActions,
    playerLoseActions,
    enemyGainActions,
    enemyLoseActions,
    playerGainWounds,
    playerLoseWounds,
    enemyGainWounds,
    enemyLoseWounds,
    playerGainBurden,
    playerLoseBurden,
    enemyGainBurden,
    enemyLoseBurden
};

// This file used to destructure ~25 values out of `state` here at module load,
// with defaults like `playerActions = 0` and empty placeholder realm objects.
// Because `state` is still empty at import time, every one of those bindings was
// permanently frozen at its default. Any code reading the bare name therefore
// saw 0 Actions and empty Realms forever, silently, with no error -- which is
// what killed Detox and all end-of-turn effect processing.
//
// Read `state.<key>` and `stateSetters.set<Key>` at call time instead. Same
// reason the setters are not destructured here.

// The four playable Realms. Elysium is excluded: it is reached only by Ascension
// and takes no part in turn-effect processing or Detox.
const ACTIVE_REALM_NAMES = ['Solarium', 'Theater', 'Underpass', 'Grid'];

/**
 * Realm objects for one side, paired with their name and setter, read fresh
 * from `state` on every call.
 *
 * The name is carried explicitly because the realm objects in `state` are bare
 * `{ people, places, things }` and have no `name` field -- code that assumed
 * `realm.name` was passing undefined downstream.
 *
 * @param {string} side - 'PLAYER' or 'ENEMY'
 */
function realmsForSide(side) {
    const lower = side === 'PLAYER' ? 'player' : 'enemy';
    const upper = side === 'PLAYER' ? 'Player' : 'Enemy';
    return ACTIVE_REALM_NAMES.map(name => ({
        name,
        realm: state[`${lower}${name}`],
        setRealm: stateSetters[`set${upper}${name}`],
    }));
}

// Export functions
// `isAttacking` distinguishes the attacker's power calculation from the
// defender's, so Aggro/Aggressive (which only apply while attacking, and for
// Aggressive also penalize while defending) can be scored correctly.
export function adjustEntityPowerExternal(entity, side, isAttacking = false) {
    if (!entity) return 0;
    let power = entity.power || 0;
    
    // Apply any external modifiers
    if (entity.powerBoost) power += entity.powerBoost;
    if (entity.powerPenalty) power -= entity.powerPenalty;

    // Aggro: +1 Power while attacking.
    if (entity.aggro > 0 && isAttacking) power += 1;

    // Aggressive: +2 Power while attacking, -1 Power while defending.
    if (entity.aggressive > 0) {
        power += isAttacking ? 2 : -1;
    }
    
    return Math.max(0, power);
}

// Per-turn income granted during the maintenance phase. The player/enemy split
// is intentional and asymmetric: the enemy trades an action for extra Bits.
export const PER_TURN_PLAYER_ACTIONS = 3;
export const PER_TURN_PLAYER_BITS = 1;
export const PER_TURN_PLAYER_DRAW = 1;
export const PER_TURN_ENEMY_ACTIONS = 2;
export const PER_TURN_ENEMY_BITS = 2;
export const PER_TURN_ENEMY_DRAW = 1;

// Turn 1 is otherwise an ordinary turn; the player just receives extra Bits on
// top of the standard income, for 4 total.
export const FIRST_TURN_PLAYER_BONUS_BITS = 3;

// notes.txt: "Going second awards +1 Bit". Paid once, on turn 1, to whichever
// side did not start -- turn order is random, so this is not always the enemy.
// It stacks with FIRST_TURN_PLAYER_BONUS_BITS: a player who goes second gets
// both (1 income + 3 player bonus + 1 second bonus = 5).
export const GOING_SECOND_BONUS_BITS = 1;

// Maintenance-phase infection and depression (notes.txt: "If a player has 2 or
// more Wounds, they gain 1 Wound from infection. Likewise for Burden which
// causes depression.").
//
// The threshold is read from the pre-existing total, so a side sitting at
// exactly 2 gains one and a side at 1 does not. Both sides are evaluated from
// the same starting snapshot rather than sequentially, so the extra Wound one
// side gains can never push the other over the line in the same phase.
export function applyInfectionAndDepression() {
    const { playerWounds, enemyWounds, playerBurden, enemyBurden } = state;

    if (playerWounds >= 2) {
        playerGainWounds(1);
        console.log(`Player gains 1 Wound from infection (had ${playerWounds}).`);
    }
    if (enemyWounds >= 2) {
        enemyGainWounds(1);
        console.log(`Enemy gains 1 Wound from infection (had ${enemyWounds}).`);
    }
    if (playerBurden >= 2) {
        playerGainBurden(1);
        console.log(`Player gains 1 Burden from depression (had ${playerBurden}).`);
    }
    if (enemyBurden >= 2) {
        enemyGainBurden(1);
        console.log(`Enemy gains 1 Burden from depression (had ${enemyBurden}).`);
    }
}

// Spend one player action. If actions reach 0, automatically end the player's turn.
export function consumePlayerAction() {
    const remaining = Math.max(0, state.playerActions - 1);
    stateSetters.setPlayerActions(remaining);
    // Turns alternate after every action. Yield to enemy for ONE action if they have any,
    // but only once the player's own actions are exhausted.
    // When both reach 0, the domination useEffect in BoardContainer fires endTurn().
    if (remaining === 0 && state.enemyActions > 0) {
        endPlayerTurn();
    }
}

export function returnToOriginalRealm(cardEntity, side) {
    // Fetch the current (potentially wounded) version from the realm before
    // removing it, so we re-add the up-to-date copy rather than the stale
    // battle-slot snapshot (which would discard wounds taken during combat).
    const [realm] = getRealmAndSetter(cardEntity.realm, side);
    const current = realm?.people?.find(e => e.id === cardEntity.id) || cardEntity;

    removeFromRealm(cardEntity.realm, cardEntity.id, 'PEOPLE');

    const [, setRealm] = getRealmAndSetter(cardEntity.realm, side);
    setRealm(prev => ({
        ...prev,
        people: [...prev.people, current]
    }));
}

export function endPlayerTurn() {
    stateSetters.setSelectedCard(null);
    stateSetters.setSelectedInHand(false);
    stateSetters.setDraftSelected(false);
    stateSetters.setTargetType('none');
    stateSetters.setPendingRitual(null);
    stateSetters.setTargetSelection({ enabled: false });
    stateSetters.setMode('NORMAL');
    state.attackMode = 'NONE';
    stateSetters.setCurrentPlayer('ENEMY');
}


/**
 * Resolves a Ritual: spends the card, pays its cost, and fires its abilities.
 *
 * Both ritual paths (with and without a target) funnel through here so they
 * cannot drift apart.
 *
 * `triggerRitualAbilities` already fires every onPlay ability, including the
 * string form such as 'Duplicate', so there is no separate pass for those. An
 * earlier separate pass caused string abilities to resolve twice.
 *
 * @param {Object} entity - The ritual card entity from hand
 * @param {Object|null} target - The chosen target, or null if the ritual has none
 * @returns {void}
 */
export function resolveRitual(entity, target = null) {
    removeCardFromHand(entity);

    // A Ritual costs an action but does not end the turn (see comment below),
    // so decrement directly rather than going through consumePlayerAction.
    stateSetters.setPlayerActions(Math.max(0, state.playerActions - 1));

    // The ritual is resolving now, so its Activation cost is due.
    payRezCost(entity.card);

    triggerRitualAbilities(entity, target, 'PLAYER');

    // A spent Ritual goes to the graveyard rather than leaving the game.
    stateSetters.setPlayerGraveyard(prev => [...prev, entity]);

    // A Ritual costs an action but does not end the turn, so clear only the
    // selection state tied to the spent card. Calling endPlayerTurn here would
    // hand priority to the enemy after every ritual.
    stateSetters.setPendingRitual(null);
    stateSetters.setTargetSelection({ enabled: false });
    stateSetters.setSelectedCard(null);
    stateSetters.setSelectedInHand(false);
    stateSetters.setTargetType('none');
}

export function confirmRitualActivation(target) {
    // Access pendingRitual from state, not stateSetters
    if (!state.pendingRitual) {
        console.error('No pending ritual found in state');
        return;
    }

    resolveRitual(state.pendingRitual.entity, target);
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
    const advanceCardList = (cardList, side) => {
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
            people: advanceCardList(prevRealm.people, 'PLAYER')
        };
    });

    stateSetters.setPlayerTheater(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people, 'PLAYER')
        };
    });

    stateSetters.setPlayerUnderpass(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people, 'PLAYER')
        };
    });

    stateSetters.setPlayerGrid(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people, 'PLAYER')
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
            people: advanceCardList(prevRealm.people, 'ENEMY'),
            places: advanceCardList(prevRealm.places, 'ENEMY'),
            things: advanceCardList(prevRealm.things, 'ENEMY')
        };
    });

    stateSetters.setEnemyTheater(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people, 'ENEMY'),
            places: advanceCardList(prevRealm.places, 'ENEMY'),
            things: advanceCardList(prevRealm.things, 'ENEMY')
        };
    });

    stateSetters.setEnemyUnderpass(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people, 'ENEMY'),
            places: advanceCardList(prevRealm.places, 'ENEMY'),
            things: advanceCardList(prevRealm.things, 'ENEMY')
        };
    });

    stateSetters.setEnemyGrid(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people, 'ENEMY'),
            places: advanceCardList(prevRealm.places, 'ENEMY'),
            things: advanceCardList(prevRealm.things, 'ENEMY')
        };
    });
}

// Delegates to enemy.js, the canonical implementation, exactly as playerDraw
// does for player.js.
//
// The version that used to live here read a bare `enemyWounds` from the deleted
// module-level destructure, so it saw 0 Wounds forever and Wounds never blocked
// an enemy draw. Its Wound bookkeeping was also wrong independently of that:
// given w Wounds and a draw of n it subtracted (w - n) from the current total
// instead of setting the total to (w - n).
export function enemyDraw(num) {
    enemyDrawCanonical(num);
}

export function enemyPlayCard() {
    console.log('--- enemyPlayCard Invoked ---');
    
    // Debug the state to find discrepancies
    // This used to also log the stale module-level `enemyHand` binding for
    // comparison. That binding is gone; `state.enemyHand` is the only truth.
    console.log('enemyPlayCard - Hand state check:', {
        stateEnemyHand: state.enemyHand,
        stateEnemyHandLength: state.enemyHand.length,
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

    // Determine which realm to play the card in. This read a stale module-level
    // `priorityLeft` frozen at true, so the enemy always searched Realms
    // left-to-right no matter who actually held priority.
    const priorityList = state.priorityLeft
        ? ['Solarium', 'Theater', 'Underpass', 'Grid']
        : ['Grid', 'Underpass', 'Theater', 'Solarium'];
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
            eventManager.publish('entityEntered', {
                side: 'ENEMY',
                entity: updatedCard,
                realm: updatedCard.realm
            });
        }
        
        return true;
    } else {
        console.log('No realm to play in');
        return false;
    }
}

// notes.txt: "Detox (spend 3 actions to cleanse all Freeze, Decay and enemy
// Venom)."
export const DETOX_ACTION_COST = 3;

export function performDetox(side) {
    const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
    if (actions < DETOX_ACTION_COST) {
        console.log('Not enough actions to detox');
        return false;
    }

    if (side === 'PLAYER') {
        stateSetters.setPlayerActions(Math.max(0, state.playerActions - DETOX_ACTION_COST));
    } else {
        stateSetters.setEnemyActions(Math.max(0, state.enemyActions - DETOX_ACTION_COST));
    }
    detoxEntities(side);
    return true;
}

/**
 * Cleanses Freeze, Decay and Venom from the detoxing side's own cards.
 *
 * "enemy Venom" in the notes identifies whose Venom it is -- inflicted by the
 * opponent -- not whose cards are cleaned. The previous version cleaned the
 * *opponent's* cards, and only when the enemy detoxed. It also mutated entities
 * in place without going through a setter, so the UI never saw the change.
 *
 * @param {string} side - 'PLAYER' or 'ENEMY'
 */
export function detoxEntities(side) {
    const cleanse = (cards) => (cards || []).map(cardEntity => {
        if (!cardEntity.freeze && !cardEntity.decay && !cardEntity.venom) {
            return cardEntity;
        }
        const name = cardEntity.card?.name || cardEntity.id;
        const cleaned = { ...cardEntity };
        if (cleaned.freeze > 0) {
            cleaned.freeze = 0;
            console.log(`${name}'s Freeze is removed.`);
        }
        if (cleaned.decay > 0) {
            cleaned.decay = 0;
            console.log(`${name}'s Decay is removed.`);
        }
        if (cleaned.venom > 0) {
            cleaned.venom = 0;
            console.log(`${name}'s Venom is removed.`);
        }
        return cleaned;
    });

    realmsForSide(side).forEach(({ realm, setRealm }) => {
        if (!realm || !setRealm) return;
        setRealm({
            ...realm,
            people: cleanse(realm.people),
            places: cleanse(realm.places),
            things: cleanse(realm.things),
        });
    });

    console.log(`${side === 'PLAYER' ? 'Player' : 'Enemy'} performed Detox.`);
}

export const handleBoostButton = () => {
    if (state.playerActions < 1 || state.playerBits < 1) {
        console.log('Not enough resources to boost.');
        return;
    }
    stateSetters.setPlayerBits(prev => prev - 1);
    stateSetters.setMode('BOOST');
    state.attackMode = 'BOOST';
    consumePlayerAction();
    console.log('Select a card to boost.');
}

export const handleDevelopButton = () => {
    if (state.playerActions < 1 || state.playerBits < 1) {
        console.log('Not enough resources to develop a card.');
        return;
    }
    stateSetters.setPlayerBits(prev => prev - 1);
    stateSetters.setMode('DEVELOP');
    state.attackMode = 'DEVELOP';
    consumePlayerAction();
    console.log('Select a card to develop.');
}

// Moved to actions.js

export const handleDraftButton = () => {
    playerDraft();
}

// See top of file: playerDraw is an alias for player.draw to fix the
// stale-destructuring bug the old local implementation had.
export { playerDraw };

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

/**
 * notes.txt: "Draft a Dreamer (once per turn, costs 1 Bit)."
 *
 * This only *selects* the Dreamer; the Bit and the draft slot are spent in
 * `consumeDraftedCard` once the card is actually placed, so a cancelled draft
 * costs nothing. Both limits are checked here so the player is not offered a
 * draft they cannot complete.
 */
export function playerDraft() {
    if (!draftArray || draftArray.length === 0) {
        console.log('Cannot draft: the shared Dreamer deck is empty.');
        eventManager.publish('actionFailed', { action: 'DRAFT', reason: 'draft_deck_empty' });
        return false;
    }
    if (state.playerDrafted) {
        console.log('Cannot draft: already drafted this turn.');
        eventManager.publish('actionFailed', { action: 'DRAFT', reason: 'already_drafted' });
        return false;
    }
    if (state.playerBits < DRAFT_COST_BITS) {
        console.log('Cannot draft: not enough Bits.');
        eventManager.publish('actionFailed', { action: 'DRAFT', reason: 'insufficient_bits' });
        return false;
    }

    stateSetters.setSelectedCard(draftArray[0]);
    stateSetters.setDraftSelected(true);
    stateSetters.setSelectedInHand(true);
    return true;
}

// notes.txt: "Draft a Dreamer (once per turn, costs 1 Bit)."
export const DRAFT_COST_BITS = 1;

/**
 * Spends the drafted Dreamer: removes it from the shared 5-card draft deck,
 * charges the Bit, and marks the once-per-turn limit as used.
 *
 * Without this the placement path called `removeCardFromHand`, which only
 * filters `playerHand`. A drafted Dreamer is never in hand, so that was a
 * no-op: the draft deck never depleted and the same Dreamer could be drafted
 * an unlimited number of times.
 */
export function consumeDraftedCard() {
    const drafted = draftArray[0];
    draftArray = draftArray.slice(1);
    playerLoseBits(DRAFT_COST_BITS);
    stateSetters.setPlayerDrafted(true);
    console.log(`Drafted ${drafted?.card?.name}; ${draftArray.length} Dreamers remain.`);
    return drafted;
}

/** Test seam: the remaining shared Dreamer deck. */
export function getDraftArray() {
    return draftArray;
}

/** Test seam: restore the shared Dreamer deck to a full 5 cards. */
export function resetDraftArray() {
    draftArray = createDraft();
}

export function handlePlayerMine() {
    if (state.playerActions <= 0) {
        console.log('[Core handlePlayerMine] Not enough actions to Phish.');
        eventManager.publish('actionFailed', { action: 'PHISH', reason: 'insufficient_actions' });
        return false;
    }

    playerGainBits(1);
    eventManager.publish('actionTaken', { action: 'PHISH', cost: 1 });
    consumePlayerAction();
    console.log('[Core handlePlayerMine] Phish action performed.');
    return true;
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
    stateSetters.setPlayerEntitiesDiedThisTurn(0);
    stateSetters.setEnemyEntitiesDiedThisTurn(0);

    // Read the realms out of `state` now. These used to come from the frozen
    // module-level destructure, so this whole function iterated empty arrays and
    // no Decay or effect duration ever ticked.
    const allRealms = [...realmsForSide('PLAYER'), ...realmsForSide('ENEMY')];

    allRealms.forEach(({ name: realmName, realm, setRealm }) => {
        if (!realm || !setRealm) return;
        const newPeople = (realm.people || []).map((entity) => {
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
                                removeEffect(newEntity.id, realmName, newEntity.owner, updatedEffect);
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
                handleDamage(realmName, newEntity.id, newEntity.decay, newEntity.owner);
                console.log(`${newEntity.card.name} takes ${newEntity.decay} Decay damage.`);
                newEntity.decay -= 1;
                console.log(`${newEntity.card.name} Decay decreases to ${newEntity.decay}`);
            }

            return newEntity;
        });

        // Update the realm state using the appropriate setter from stateSetters directly
        // The setRealm variable already contains the correct stateSetters function reference
        setRealm({
            ...realm,
            people: newPeople,
            places: realm.places,
            things: realm.things,
        });
    });
}

export async function enemyPerformAction() {
    if (state.mode === 'GAME_OVER') {
        console.log('enemyPerformAction skipped: game is over.');
        return;
    }
    console.log('Enemy perform action:', {
        enemyActions: state.enemyActions,
        playerActions: state.playerActions,
        currentPlayer: state.currentPlayer
    });

    // Helper: called after enemy spends one action.
    // Returns to player if they have actions left; otherwise chains another
    // enemy action. Domination useEffect handles both reaching 0.
    function afterEnemyAction() {
        if (state.playerActions > 0) {
            stateSetters.setMode('NORMAL');
            stateSetters.setCurrentPlayer('PLAYER');
        } else if (state.enemyActions > 0) {
            setTimeout(() => enemyPerformAction(), 1000);
        }
        // Both 0 â†’ domination useEffect fires endTurn()
    }
    
    try {
        if (state.enemyActions <= 0) {
            afterEnemyAction();
            return;
        }

        // Rez (no action cost)
        await performEnemyRez();

        // Try to plan an attack
        const attackPlanned = await Promise.resolve(planEnemyAttack());
        if (attackPlanned) {
            console.log('Enemy planned an attack, consuming 1 action');
            stateSetters.setEnemyActions(prev => prev - 1);
            afterEnemyAction();
            return;
        }

        // Try to play a card
        if (state.enemyHand.length > 0) {
            console.log('Enemy playing a card from hand');
            enemyPlayCard();
            stateSetters.setEnemyActions(prev => prev - 1);
        } else {
            // Draw as last resort
            console.log('Enemy has no cards in hand, drawing');
            enemyDraw(1);
            stateSetters.setEnemyActions(prev => prev - 1);
        }

        afterEnemyAction();
    } catch (error) {
        console.error('Error in enemyPerformAction:', error);
        afterEnemyAction();
    }
}


/**
 * Randomly decides who takes the first turn.
 *
 * Split out from beginFirstTurn so tests can stub Math.random on a single,
 * obvious seam and assert both branches.
 *
 * @returns {boolean} true when the PLAYER starts (priority on the left).
 */
export function chooseStartingSide() {
    return Math.random() < 0.5;
}

/**
 * Starts turn 1.
 *
 * This did not previously exist, and its absence was a hard soft-lock at game
 * start: the only call to startTurn outside the turn loop was a BoardContainer
 * effect gated on both hands holding 5 cards, but setupNewRules deals 4 and the
 * mulligan refills to 4, so the condition was unreachable and turn 1 never
 * began. After choosing a Devotion the game sat in mode 'PLAY' with 0 actions,
 * no Focus prompt and no income -- nothing was clickable and no other effect
 * could advance it, because the domination hand-off requires mode 'NORMAL'.
 *
 * Turn order is randomised here rather than in startTurn: startTurn runs every
 * turn and alternates priority from the previous turn, so rolling inside it
 * would re-randomise the order on every single turn.
 */
export function beginFirstTurn() {
    const playerStarts = chooseStartingSide();
    stateSetters.setPriorityLeft(playerStarts);
    eventManager.publish('turnOrderDecided', {
        side: playerStarts ? 'PLAYER' : 'ENEMY',
    });
    startTurn(playerStarts);
}

export function startTurn(currentPriorityLeft) {
    // Once a win/loss condition has fired the game is over. Without this guard
    // the unconditional setMode('NORMAL') below would immediately clear the
    // GAME_OVER mode and play would continue forever.
    if (state.mode === 'GAME_OVER') {
        console.log('startTurn skipped: game is over.');
        return;
    }
    const turn = (state.turnNumber || 0) + 1;
    stateSetters.setTurnNumber(turn);
    console.log('start turn', turn, currentPriorityLeft);
    const startingPlayer = currentPriorityLeft ? 'PLAYER' : 'ENEMY';
    
    // Always use stateSetters object directly to avoid stale references
    stateSetters.setCurrentPlayer(startingPlayer);
    stateSetters.setMode('NORMAL');
    eventManager.publish('turnStart', { side: 'PLAYER' });
    eventManager.publish('turnStart', { side: 'ENEMY' });
    
    // Reset game state
    stateSetters.setDraftSelected(false);
    stateSetters.setPendingRitual(null);
    // Rapture's discount only applies on turns where something has already died.
    state.entityDiedThisTurn = false;
    
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
            if (cardEntity.abilityUsedThisTurn) {
                cardEntity.abilityUsedThisTurn = false;
            }
            return cardEntity;
        });
    };

    stateSetters.setPlayerSolarium(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
    }));
    stateSetters.setPlayerTheater(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
        places: resetTurnFlags(prevRealm.places),
    }));
    stateSetters.setPlayerUnderpass(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
        places: resetTurnFlags(prevRealm.places),
        things: resetTurnFlags(prevRealm.things),
    }));
    stateSetters.setPlayerGrid(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
        things: resetTurnFlags(prevRealm.things),
    }));
    stateSetters.setPlayerElysium(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
        places: resetTurnFlags(prevRealm.places),
        things: resetTurnFlags(prevRealm.things),
    }));
    stateSetters.setEnemySolarium(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
    }));
    stateSetters.setEnemyTheater(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
        places: resetTurnFlags(prevRealm.places),
    }));
    stateSetters.setEnemyUnderpass(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
        places: resetTurnFlags(prevRealm.places),
        things: resetTurnFlags(prevRealm.things),
    }));
    stateSetters.setEnemyGrid(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
        things: resetTurnFlags(prevRealm.things),
    }));
    stateSetters.setEnemyElysium(prevRealm => ({
        ...prevRealm,
        people: resetTurnFlags(prevRealm.people),
        places: resetTurnFlags(prevRealm.places),
        things: resetTurnFlags(prevRealm.things),
    }));

    // Handle start of turn effects
    playerGainActions(PER_TURN_PLAYER_ACTIONS + state.playerDriftCount);
    if (state.playerGlitchyAmount > 0) {
        stateSetters.setPlayerOverload((prev) => prev + state.playerGlitchyAmount);
        console.log(`Player gains ${state.playerGlitchyAmount} Overload due to Glitchy abilities.`);
    }
    if (state.enemyGlitchyAmount > 0) {
        stateSetters.setEnemyOverload((prev) => prev + state.enemyGlitchyAmount);
        console.log(`Enemy gains ${state.enemyGlitchyAmount} Overload due to Glitchy abilities.`);
    }
    enemyGainActions(PER_TURN_ENEMY_ACTIONS + state.enemyDriftCount);
    // Base per-turn Bit income, with any Dividend accumulation on top. The base
    // amounts used to be smuggled in via enemyDividendAmount defaulting to 2,
    // which conflated the keyword's accumulator with the income rule and left
    // the player with no income at all (playerDividendAmount was never declared,
    // so this read undefined).
    // "Going second awards +1 Bit", paid once on turn 1 to whoever did not
    // start. Turn order is randomised, so this can land on either side.
    const isFirstTurn = turn === 1;
    const enemyWentSecond = isFirstTurn && startingPlayer === 'PLAYER';
    const playerWentSecond = isFirstTurn && startingPlayer === 'ENEMY';

    enemyGainBits(
        PER_TURN_ENEMY_BITS
        + (enemyWentSecond ? GOING_SECOND_BONUS_BITS : 0)
        + state.enemyDividendAmount
    );
    const firstTurnBonus = isFirstTurn ? FIRST_TURN_PLAYER_BONUS_BITS : 0;
    playerGainBits(
        PER_TURN_PLAYER_BITS
        + firstTurnBonus
        + (playerWentSecond ? GOING_SECOND_BONUS_BITS : 0)
        + state.playerDividendAmount
    );
    // Infection / depression resolve before the maintenance draw, so a Wound
    // gained here can absorb that draw (Wounds block draws point-for-point).
    applyInfectionAndDepression();

    playerDraw(PER_TURN_PLAYER_DRAW);
    enemyDraw(PER_TURN_ENEMY_DRAW);
    stateSetters.setPlayerFirstAttack(true);
    stateSetters.setEnemyFirstAttack(true);
    // Looting is claimable once per side per turn.
    stateSetters.setPlayerLooted(false);
    stateSetters.setEnemyLooted(false);
    // Surge is turn-scoped: earned from unblocked Hack damage during the turn's
    // battles and spent in that turn's Dominance Phase. It used to be cleared at
    // the end of every battle, i.e. before the Dominance Phase could ever read
    // it, which made the entire Surge reward for Hacking a no-op.
    stateSetters.setPlayerSurge(0);
    stateSetters.setEnemySurge(0);
    // Drafting a Dreamer is once per turn.
    stateSetters.setPlayerDrafted && stateSetters.setPlayerDrafted(false);

    // "Interfaced Pandora/HeadSpace this turn" flags (Dead Drop, Precognition,
    // etc. key off these) were previously set to true on a successful hack but
    // never reset, so they stayed true for the rest of the game after the
    // first hit. They are per-turn flags, so reset them here.
    stateSetters.setPlayerInterfacedPandora && stateSetters.setPlayerInterfacedPandora(false);
    stateSetters.setEnemyInterfacedPandora && stateSetters.setEnemyInterfacedPandora(false);
    stateSetters.setPlayerInterfacedHeadSpace && stateSetters.setPlayerInterfacedHeadSpace(false);
    stateSetters.setEnemyInterfacedHeadSpace && stateSetters.setEnemyInterfacedHeadSpace(false);

    playerAdvanceCards();
    enemyAdvanceCards();

    // Maintain fires during the timer-reduction phase at the start of the turn.
    // It is a phase event, so it publishes once per side rather than once per
    // advancing card: the aura handlers listening on it (SylkWorm, CatPhish,
    // Chronomancer) do not filter by entity, so a per-card publish would apply
    // them repeatedly.
    eventManager.publish('maintain', { side: 'PLAYER' });
    eventManager.publish('maintain', { side: 'ENEMY' });

    // Regen: heal entities with the Regen keyword at the start of each turn.
    healRegeneratingEntities('PLAYER', stateSetters);
    healRegeneratingEntities('ENEMY', stateSetters);

    // If it's the enemy's turn, perform their action
    if (state.currentPlayer === 'ENEMY') {
        setTimeout(() => {
            enemyPerformAction();
        }, 1000); // Add a 1-second delay for a more natural feel
    }
}

export function endTurn() {
    if (state.mode === 'GAME_OVER') {
        console.log('endTurn skipped: game is over.');
        return;
    }
    console.log('end turn');
    eventManager.publish('endTurn', { side: 'PLAYER' });
    eventManager.publish('endTurn', { side: 'ENEMY' });
    processEndOfTurnEffects();
    const newPriorityLeft = !state.priorityLeft;
    stateSetters.setPriorityLeft(newPriorityLeft);
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

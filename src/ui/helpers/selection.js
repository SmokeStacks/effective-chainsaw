import { state, stateSetters } from './state';

import { abilitiesDefinitions } from '../abilities/glossary';
import { removeFromRealm } from './core';
import { handleDevelopCard } from './advancement';
import { handleBoostCard } from './boost';
import { setCardSacrificed } from './sacrifice';
import { handleImpostorPlacement, isLegalImpostorTarget } from './impostor';
import { confirmManualAbility } from './abilities';

export const handleCardSelect = (cardEntity, inHand) => {
    console.log('=== handleCardSelect ===');
    console.log('cardEntity:', cardEntity);
    console.log('inHand:', inHand);
    console.log('Current state:', state);

    // A click on a board card while a target request is open answers that
    // request. This has to happen before the resets below, which clear
    // targetSelection and pendingRitual and would otherwise cancel the very
    // selection this click is meant to make.
    if (!inHand && state.targetSelection && state.targetSelection.enabled) {
        const { filter, onSelect } = state.targetSelection;

        if (typeof onSelect === 'function') {
            if (typeof filter === 'function' && !filter(cardEntity)) {
                // Ignore the misclick and keep waiting rather than silently
                // cancelling the pending ability or ritual.
                console.log(`${cardEntity?.card?.name} is not a legal target.`);
                return;
            }

            onSelect(cardEntity);
            return;
        }
    }

    stateSetters.setSelectedCard(cardEntity);
    stateSetters.setSelectedInHand(inHand);
    stateSetters.setDraftSelected(false);
    stateSetters.setTargetType('none');
    stateSetters.setPendingRitual(null);
    stateSetters.setTargetSelection({ enabled: false });

    console.log('State after update:', state);
};

export const handleCancel = () => {
    stateSetters.setSelectedCard(null);
    stateSetters.setSelectedInHand(null);
    stateSetters.setDraftSelected(false);
    stateSetters.setTargetType('none');
    stateSetters.setPendingRitual(null);
    stateSetters.setTargetSelection({ enabled: false });
};

export const handleRealmCardSelect = (cardEntity) => {
        console.log('handle realm card select', cardEntity)
        console.log('attackMode', state.attackMode)
        if (state.awaitingImpostor) {
            // The victim must be an enemy Offline Entity in the same Realm the
            // Impostor is entering. A misclick leaves the request open rather
            // than silently consuming the Impostor.
            if (isLegalImpostorTarget(cardEntity, state.impostorRealm, 'PLAYER')) {
                const swapped = handleImpostorPlacement(
                    state.selectedCard,
                    cardEntity,
                    state.impostorRealm,
                    'PLAYER'
                );
                if (swapped) {
                    stateSetters.setAwaitingImpostor(false);
                    stateSetters.setImpostorRealm(null);
                    stateSetters.setSelectedCard(null);
                    stateSetters.setSelectedInHand(null);
                }
            } else {
                console.log('Select an enemy Offline entity in the same Realm to swap with.');
            }
            return;
        }
        if (state.awaitingSacrifices) {
            if (cardEntity.card.soulless) {
                console.log(`${cardEntity.card.name} is Soulless and cannot be sacrificed.`);
                return;
            }
            console.log('sacrifice selected ', cardEntity)
            stateSetters.setSoulSelections(prevSelections => {
                const index = prevSelections.findIndex(card => card.id === cardEntity.id);
                if (index > -1) {
                    setCardSacrificed(cardEntity.realm, cardEntity.id, false);
                    const newSelections = [...prevSelections];
                    newSelections.splice(index, 1);
                    return newSelections;
                } else {
                    setCardSacrificed(cardEntity.realm, cardEntity.id, true);
                    return [...prevSelections, cardEntity];
                }
            });
        } else if (state.attackMode === 'BOOST') {
            handleBoostCard(cardEntity);
        } else if (state.attackMode === 'DEVELOP') {
            handleDevelopCard(cardEntity);
        } else if (state.attackMode !== 'NONE') {
            console.log('attack mode: ', state.attackMode)
            if (state.attackMode === 'PLAYER_RAID') {
                if ((cardEntity.card.category === 'LANDMARK' || cardEntity.card.category === 'LOCATION') && cardEntity.owner === 'ENEMY') {
                    stateSetters.setPlayerTargetSelection(cardEntity);
                    stateSetters.setTargetType(cardEntity.card.category);
                    console.log('Raiding: ', cardEntity)
                    return;
                }
            }
            if (state.attackMode === 'PLAYER_HACK') {
                if ((cardEntity.card.category === 'SNIP' || cardEntity.card.category === 'SYM') && cardEntity.owner === 'ENEMY') {
                    stateSetters.setPlayerTargetSelection(cardEntity);
                    stateSetters.setTargetType(cardEntity.card.category);
                    console.log('Hacking: ', cardEntity)
                    return;
                }
            }
            if (cardEntity.owner === 'PLAYER') {
                console.log('Player selected: ', cardEntity)
                stateSetters.setBattleSelectedCard(cardEntity);
                stateSetters.setSelectedInHand(false);
            } else {
                console.log('Enemy was not selected for battle: ', cardEntity)
            }
        } else {
            console.log('No selection made')
        }
    };

export const handleAbilityClick = (entity) => {
        const manualAbilities = entity.card.abilities?.filter(
            ability => ability.type === 'manual'
        );

        if (manualAbilities && manualAbilities.length > 0) {
            manualAbilities.forEach(ability => {
                const abilityDef = abilitiesDefinitions[ability.name];

                // For Scheme abilities, check if the ability is unlocked
                if (entity.scheming && !entity.schemeUnlocked) {
                    console.log(`${entity.card.name}'s ability is not yet unlocked.`);
                    return;
                }

                if (abilityDef.requiresTarget) {
                    // Set up target selection
                    stateSetters.setPendingManualAbility({ entity, ability });
                    stateSetters.setTargetSelection({
                        enabled: true,
                        side: abilityDef.targetSide || 'ENEMY',
                        filter: (target) => {
                            if (target.card.category !== 'ENTITY') return false;
                            return abilityDef.targetFilter ? abilityDef.targetFilter(target) : true;
                        },
                        onSelect: (target) => {
                            confirmManualAbility(target);
                        },
                        onCancel: () => {
                            // Clear the pending manual ability
                            stateSetters.setPendingManualAbility(null);
                            // Disable target selection mode
                            stateSetters.setTargetSelection({ enabled: false });
                        },
                    });
                    console.log(`Select a target for ${entity.card.name}'s ability.`);
                } else {
                    // Execute the ability immediately
                    abilityDef.execute(entity, ability.effect, 'PLAYER');
                }
            });
        } else {
            console.log(`${entity.card.name} has no manual abilities.`);
        }
    }

export const handleBattleSlotSelect = (slotId) => {
        console.log('handle battle slot select', slotId)
        if (state.playerBattleSlots.includes(slotId)) {
            // Player is selecting their own battle slot
            if (state.selectedCard && state.selectedCard.owner === 'PLAYER') {
                if (state.battleRealm && state.selectedCard.realm !== state.battleRealm) {
                    console.log(`Cannot move card from ${state.selectedCard.realm} to ${state.battleRealm}`);
                    return;
                }
                // Check if the slot is empty
                if (state.playerBattleSlots[slotId]) {
                    console.log('Selected card:', state.selectedCard);
                    // Move card to battle slot
                    if (state.battleRealm) {
                        // Move from realm to battle
                        removeFromRealm(state.selectedCard, state.battleRealm, 'PLAYER');
                    }
                    // Clear selection
                    stateSetters.setSelectedCard(null);
                    stateSetters.setSelectedInHand(false);
                }
            }
        } else if (state.enemyBattleSlots.includes(slotId)) {
            // Player is selecting an enemy battle slot
            if (state.selectedCard && state.selectedCard.owner === 'PLAYER') {
                if (state.attackMode === 'PLAYER_QUEST') {
                    console.log('Quest attack');
                } else if (state.attackMode === 'PLAYER_RAID') {
                    console.log('Raid attack');
                } else if (state.attackMode === 'PLAYER_HACK') {
                    console.log('Hack attack');
                }
            }
        }
    };

export const handleEmptySlotSelect = (slotIndex) => {
        if (state.playerBattleSlots[slotIndex]) {
            return; // Return early if slot is not empty
        }

        if (state.selectedCard) {
            if (state.battleRealm && state.selectedCard.realm !== state.battleRealm) {
                console.log('Chosen card does not match: ', state.battleRealm)
                return;
            }
            if (!state.selectedCard.readied) {
                console.log('Chosen card is not readied', state.selectedCard)
                return;
            }
            if (!state.battleRealm) {
                stateSetters.setBattleRealm(state.selectedCard.realm);
            }
            const enemyAttacker = state.enemyBattleSlots[slotIndex];
            const enemyStealth = enemyAttacker?.stealth || 0;

            // Get selected card's stealth value
            const defenderStealth = state.selectedCard.stealth || 0;

            if (enemyStealth > 0 && defenderStealth <= 0) {
                console.log('Cannot place this defender. The attacker has Stealth, and the defender does not.');
                return;
            }

            // Existing defensive/offensive checks
            if (state.selectedCard.defensive) {
                if (
                    state.attackMode === 'PLAYER_QUEST' ||
                    state.attackMode === 'PLAYER_RAID' ||
                    state.attackMode === 'PLAYER_HACK'
                ) {
                    return;
                }
            }
            if (state.selectedCard.card.offensive) {
                if (
                    state.attackMode === 'ENEMY_magi' ||
                    state.attackMode === 'ENEMY_phys' ||
                    state.attackMode === 'ENEMY_tech'
                ) {
                    return;
                }
            }

            // Proceed to place the selected card into the battle slot
            removeFromRealm(state.selectedCard, state.selectedCard.realm, 'PLAYER');
            stateSetters.setPlayerBattleSlots((prev) => {
                const newSlots = [...prev];
                newSlots[slotIndex] = state.selectedCard;
                return newSlots;
            });
            stateSetters.setSelectedCard(null);
            stateSetters.setDraftSelected(false);
        }
    };


export const handleBattleCardSelect = (cardEntity, slotIndex) => {
        if (!state.battleSelectedCard) {
            stateSetters.setBattleSelectedCard(cardEntity);
        } else {
            // Get the enemy attacker in the slot
            const enemyAttacker = state.enemyBattleSlots[slotIndex];
            const enemyStealth = enemyAttacker?.stealth || 0;

            // Get the Stealth value of the card being moved into the slot
            const movingDefenderStealth = state.battleSelectedCard.stealth || 0;

            if (enemyAttacker && enemyStealth > 0 && movingDefenderStealth <= 0) {
                console.log('Cannot swap in this defender. The attacker has Stealth, and the defender does not.');
                stateSetters.setBattleSelectedCard(null);
                return;
            }

            stateSetters.setPlayerBattleSlots((prev) => {
                const newSlots = [...prev];
                const prevSelectedCardIndex = newSlots.findIndex(
                    (card) => card === state.battleSelectedCard
                );
                newSlots[prevSelectedCardIndex] = cardEntity;
                newSlots[slotIndex] = state.battleSelectedCard;
                return newSlots;
            });
            stateSetters.setBattleSelectedCard(null);
        }
    };

        // const handleCancelSelection = () => {
    //     setPlayerBattleSelection([]);
    //     setSelectedCard(null);
    // };

export const handleServerSelect = (targetType) => {
        console.log('______server selected ', targetType);
        stateSetters.setSelectedCard(null);
        stateSetters.setDraftSelected(false);
        stateSetters.setTargetType(targetType);
    }

export const handleFocusSelect = (focus) => {
        console.log('Focus selected:', focus);
        // The actual UI state update is handled in BoardContainer's onFocusSelect.
        // This function is for any game logic that needs to happen when focus changes.
        
        // Update the game state focus for use by other systems (e.g. domination.js)
        state.focus = focus;
    }
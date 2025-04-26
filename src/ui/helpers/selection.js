const handleCardSelect = (cardEntity, inHand) => {
    console.log('hand select')
    setSelectedCard(cardEntity);
    setSelectedInHand(inHand);
    setDraftSelected(false);
    setDraftSelected(false);
    setTargetType('none');
    setPendingRitual(null);
    setTargetSelection({ enabled: false });
};

const handleCancel = () => {
    setSelectedCard(null);
    setSelectedInHand(null);
    setDraftSelected(false);
    setDraftSelected(false);
    setTargetType('none');
    setPendingRitual(null);
    setTargetSelection({ enabled: false });
};

    const handleRealmCardSelect = (cardEntity) => {
        console.log('handle realm card select', cardEntity)
        console.log('attackMode', attackMode)
        if (awaitingImpostor) {
            console.log('_______________________________swap impostor')
            if (cardEntity.owner === 'ENEMY' && cardEntity.card.category === 'ENTITY') {
                let dreamer = selectedCard.card.name === 'Dreamer' ? true : false;
                handleImpostorPlacement(selectedCard, cardEntity, impostorRealm, 'PLAYER', dreamer);
                setAwaitingImpostor(false);
                setImpostorRealm(null);
                setSelectedCard(null);
                setSelectedInHand(false);
            } else {
                console.log('Please select a valid enemy entity to swap with.');
            }
            return;
        }
        if (awaitingSacrifices) {
            if (cardEntity.card.soulless) {
                console.log(`${cardEntity.card.name} is Soulless and cannot be sacrificed.`);
                return;
            }
            console.log('sacrifice selected ', cardEntity)
            setSoulSelections(prevSelections => {
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
        } else if (selectionMode === 'WAITING_FOR_ABILITY_TARGET') {
            if (isValidAbilityTarget(cardEntity)) {
                // Confirm target selection
                showModal({
                    title: `Confirm Target`,
                    message: `Do you want to target ${cardEntity.card.name}?`,
                    onConfirm: () => {
                        confirmAbilityTarget(cardEntity);
                        setModalVisible(false);
                    },
                    onCancel: () => {
                        setModalVisible(false);
                    },
                });
            } else {
                console.log('Invalid target selected.');
            }
        }
        else if (attackMode === 'BOOST') {
            handleBoostCard(cardEntity);
        } else if (attackMode === 'DEVELOP') {
            handleDevelopCard(cardEntity);
        } else if (selectionMode === 'WAITING') { //todo
            setPlayerTargetSelection(cardEntity);
            setTargetType(cardEntity.card.category);
        } else if (attackMode !== 'NONE') {
            console.log('attack mode: ', attackMode)
            if (attackMode === 'PLAYER_RAID') {
                if ((cardEntity.card.category === 'LANDMARK' || cardEntity.card.category === 'LOCATION') && cardEntity.owner === 'ENEMY') {
                    setPlayerTargetSelection(cardEntity);
                    setTargetType(cardEntity.card.category);
                    console.log('Raiding: ', cardEntity)
                    return;
                }
            }
            if (attackMode === 'PLAYER_HACK') {
                if ((cardEntity.card.category === 'SNIP' || cardEntity.card.category === 'SYM') && cardEntity.owner === 'ENEMY') {
                    setPlayerTargetSelection(cardEntity);
                    setTargetType(cardEntity.card.category);
                    console.log('Hacking: ', cardEntity)
                    return;
                }
            }
            if (cardEntity.owner === 'PLAYER') {
                console.log('Player selected: ', cardEntity)
                setSelectedCard(cardEntity);
                setSelectedInHand(false);
            } else {
                console.log('Enemy was not selected for battle: ', cardEntity)
            }
        } else {
            console.log('No selection made')
        }
    };

    function handleAbilityClick(entity) {
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
                    setPendingManualAbility({ entity, ability });
                    setTargetSelection({
                        enabled: true,
                        side: 'ENEMY', // Assuming you target enemy entities
                        filter: (target) => {
                            // Define any filters for valid targets
                            return target.card.category === 'ENTITY';
                        },
                        onSelect: (target) => {
                            confirmManualAbility(target);
                        },
                        onCancel: () => {
                            // Clear the pending manual ability
                            setPendingManualAbility(null);
                            // Disable target selection mode
                            setTargetSelection({ enabled: false });
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

    const handleEmptySlotSelect = (slotIndex) => {
        if (playerBattleSlots[slotIndex]) {
            return; // Return early if slot is not empty
        }

        if (selectedCard) {
            if (battleRealm && selectedCard.realm !== battleRealm) {
                console.log('Chosen card does not match: ', battleRealm)
                return;
            }
            if (!selectedCard.readied) {
                console.log('Chosen card is not readied', selectedCard)
                return;
            }
            if (!battleRealm) {
                setBattleRealm(selectedCard.realm);
            }
            const enemyAttacker = enemyBattleSlots[slotIndex];
            const enemyStealth = enemyAttacker?.stealth || 0;

            // Get selected card's stealth value
            const defenderStealth = selectedCard.stealth || 0;

            if (enemyStealth > 0 && defenderStealth <= 0) {
                console.log('Cannot place this defender. The attacker has Stealth, and the defender does not.');
                return;
            }

            // Existing defensive/offensive checks
            if (selectedCard.card.defensive) {
                if (
                    attackMode === 'PLAYER_QUEST' ||
                    attackMode === 'PLAYER_RAID' ||
                    attackMode === 'PLAYER_HACK'
                ) {
                    return;
                }
            }
            if (selectedCard.card.offensive) {
                if (
                    attackMode === 'ENEMY_magi' ||
                    attackMode === 'ENEMY_phys' ||
                    attackMode === 'ENEMY_tech'
                ) {
                    return;
                }
            }

            // Proceed to place the selected card into the battle slot
            removeFromRealm(selectedCard, selectedCard.realm, 'PLAYER');
            setPlayerBattleSlots((prev) => {
                const newSlots = [...prev];
                newSlots[slotIndex] = selectedCard;
                return newSlots;
            });
            setSelectedCard(null);
            setDraftSelected(false);
        }
    };


    const handleBattleCardSelect = (cardEntity, slotIndex) => {
        if (!battleSelectedCard) {
            setBattleSelectedCard(cardEntity);
        } else {
            // Get the enemy attacker in the slot
            const enemyAttacker = enemyBattleSlots[slotIndex];
            const enemyStealth = enemyAttacker?.stealth || 0;

            // Get the Stealth value of the card being moved into the slot
            const movingDefenderStealth = battleSelectedCard.stealth || 0;

            if (enemyAttacker && enemyStealth > 0 && movingDefenderStealth <= 0) {
                console.log('Cannot swap in this defender. The attacker has Stealth, and the defender does not.');
                setBattleSelectedCard(null);
                return;
            }

            setPlayerBattleSlots((prev) => {
                const newSlots = [...prev];
                const prevSelectedCardIndex = newSlots.findIndex(
                    (card) => card === battleSelectedCard
                );
                newSlots[prevSelectedCardIndex] = cardEntity;
                newSlots[slotIndex] = battleSelectedCard;
                return newSlots;
            });
            setBattleSelectedCard(null);
        }
    };

        // const handleCancelSelection = () => {
    //     setPlayerBattleSelection([]);
    //     setSelectedCard(null);
    // };

    const handleServerSelect = (targetType) => {
        console.log('______server selected ', targetType);
        setSelectedCard(null);
        setDraftSelected(false);
        setTargetType(targetType);
    }

    const handleFocusSelect = (focus) => {
        console.log('focus select ', focus)
        setFocus(focus);
        setAwaitingFocus(false);
    }
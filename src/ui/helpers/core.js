function endPlayerTurn() {
    setSelectedCard(null);
    setSelectedInHand(false);
    setDraftSelected(false);
    setTargetType('none');
    setPendingRitual(null);
    setTargetSelection({ enabled: false });
    setCurrentPlayer('ENEMY');
}

const handleRealmSelect = (realmName) => {
    console.log('selectedCard', selectedCard)
    if (!selectedCard) return;
    if (!selectedCard.card[focus]) {
        console.log('Focus does not match ', focus);
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
        const nonTargetAbilities = selectedCard.card.abilities.filter(
            ability => typeof ability === 'string' || !ability.requiresTarget
        );

        // Then set up targeting for abilities that need it
        const targetingAbilities = selectedCard.card.abilities.filter(
            ability => typeof ability === 'object' && ability.requiresTarget
        );

        if (targetingAbilities.length > 0) {
            const ability = targetingAbilities[0]; // Handle first targeting ability
            setPendingRitual({ entity: selectedCard, ability });
            setTargetSelection({
                enabled: true,
                side: 'PLAYER',
                filter: (target) => target.card.category === 'ENTITY' && target.owner === 'PLAYER',
                onSelect: (target) => {
                    confirmRitualActivation(target);
                },
                onCancel: () => {
                    setPendingRitual(null);
                    setTargetSelection({ enabled: false });
                },
            });
            // Don't remove from hand yet - wait for target confirmation
            return;
        }
    }

    if (battleSelectedCard) {
        returnToOriginalRealm(battleSelectedCard, 'PLAYER');
        setBattleSelectedCard(null);
        const occupiedPlayerSlots = playerBattleSlots.filter(slot => slot !== null).length;
        const occupiedEnemySlots = enemyBattleSlots.filter(slot => slot !== null).length;
        const isPlayerBattleEmpty = occupiedPlayerSlots === 1;
        const isEnemyBattleEmpty = occupiedEnemySlots === 0;

        if (isPlayerBattleEmpty && isEnemyBattleEmpty) {
            setBattleRealm(null);
        }
    }
    if (!selectedInHand) return;
    const isImpostor = selectedCard.card.abilities?.some(
        (ability) => ability.name === 'Impostor'
    ) || (draftSelected && recruiterCount > 0);

    if (isImpostor) {
        setAwaitingImpostor(true);
        setImpostorRealm(realmName);
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
    const { entity, ability } = pendingRitual;
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
    setPlayerHand((prevHand) => prevHand.filter((c) => c.id !== card.id));
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

    setPlayerSolarium(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people)
        };
    });

    setPlayerTheater(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people)
        };
    });

    setPlayerUnderpass(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people)
        };
    });

    setPlayerGrid(prevRealm => {
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


    setEnemySolarium(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people),
            places: advanceCardList(prevRealm.places),
            things: advanceCardList(prevRealm.things)
        };
    });

    setEnemyTheater(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people),
            places: advanceCardList(prevRealm.places),
            things: advanceCardList(prevRealm.things)
        };
    });

    setEnemyUnderpass(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people),
            places: advanceCardList(prevRealm.places),
            things: advanceCardList(prevRealm.things)
        };
    });

    setEnemyGrid(prevRealm => {
        return {
            ...prevRealm,
            people: advanceCardList(prevRealm.people),
            places: advanceCardList(prevRealm.places),
            things: advanceCardList(prevRealm.things)
        };
    });
}

function enemyDraw(num) {
    console.log('enemy draw', num)
    let remainingCards = num;

    if (enemyWounds > 0) {
        const newWounds = enemyWounds - num;
        remainingCards = Math.max(0, -newWounds);
        setEnemyWounds(Math.max(0, newWounds));
    }
    if (remainingCards > 0) {
        setEnemyLibrary(prevLibrary => {
            const newHandCards = prevLibrary.slice(0, remainingCards);
            const newLibrary = prevLibrary.slice(remainingCards);

            setEnemyHand(prevHand => [
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
        let updatedCard = { ...cardToPlay, realm: realmToPlayIn, owner: 'ENEMY' };

        switch (category) {
            case 'ENTITY':
                switch (realmToPlayIn) {
                    case 'Solarium':
                        setEnemySolarium(prevRealm => ({
                            ...prevRealm,
                            people: [...prevRealm.people, updatedCard]
                        }));
                        break;
                    case 'Theater':
                        setEnemyTheater(prevRealm => ({
                            ...prevRealm,
                            people: [...prevRealm.people, updatedCard]
                        }));
                        break;
                    case 'Underpass':
                        setEnemyUnderpass(prevRealm => ({
                            ...prevRealm,
                            people: [...prevRealm.people, updatedCard]
                        }));
                        break;
                    case 'Grid':
                        setEnemyGrid(prevRealm => ({
                            ...prevRealm,
                            people: [...prevRealm.people, updatedCard]
                        }));
                        break;
                    default:
                        console.log('card not placed')
                }
                break;
            case 'LANDMARK':
            case 'LOCATION':
                switch (realmToPlayIn) {
                    case 'Theater':
                        setEnemyTheater(prevRealm => ({
                            ...prevRealm,
                            places: [...prevRealm.places, updatedCard]
                        }));
                        break;
                    case 'Underpass':
                        setEnemyUnderpass(prevRealm => ({
                            ...prevRealm,
                            places: [...prevRealm.places, updatedCard]
                        }));
                        break;
                    default:
                        console.log('card not placed')
                }
                break;
            case 'SYM':
            case 'SNIP':
                switch (realmToPlayIn) {
                    case 'Grid':
                        setEnemyGrid(prevRealm => ({
                            ...prevRealm,
                            things: [...prevRealm.things, updatedCard]
                        }));
                        break;
                    case 'Underpass':
                        setEnemyUnderpass(prevRealm => ({
                            ...prevRealm,
                            things: [...prevRealm.things, updatedCard]
                        }));
                        break;
                    default:
                        console.log('card not placed')
                }
                break;
            default:
                console.log('card not placed')
        }

        setEnemyHand(prevHand => prevHand.filter(card => card.id !== cardToPlay.id));

        // Automatically activate landmarks and locations
        if (category === 'LANDMARK' || category === 'LOCATION') {
            handleRezEnemyCard(updatedCard);
        }
    } else {
        console.log('No realm to play in')
    }
}

// New function to handle enemy card activation
function handleRezEnemyCard(card) {
    // Always activate for free since it's an enemy card
    activateAbilities(card, 'ENEMY');
}

function performDetox(side) {
    if (side === 'PLAYER' && playerActions >= 3) {
        setPlayerActions(prev => prev - 3);
        detoxEntities(side);
    } else if (side === 'ENEMY' && enemyActions >= 3) {
        setEnemyActions(prev => prev - 3);
        detoxEntities(side);
    } else {
        console.log('Not enough actions to perform Detox.');
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




function handleBoostButton() {
    playerLoseActions(1);
    playerLoseBits(1);
    setAttackMode('BOOST')
}

function handleDevelopButton() {
    if (playerActions < 1 || playerBits < 1) {
        console.log('Not enough resources to develop a card.');
        return;
    }
    playerLoseActions(1);
    playerLoseBits(1);
    setAttackMode('DEVELOP');
    console.log('Select a card to develop.');
}

function handleDrawButton() {
    playerDraw(1);
    playerLoseActions(1);
    setCurrentPlayer('ENEMY');
}

function handleDraftButton() {
    playerDraft();
}

function playerDraw(num) {
    console.log('draw ', num);
    let remainingCards = num;

    if (playerWounds > 0) {
        const newWounds = playerWounds - num;
        remainingCards = Math.max(0, -newWounds);
        setPlayerWounds(Math.max(0, newWounds));
    }

    if (remainingCards > 0) {
        setPlayerLibrary(prevLibrary => {
            const newHandCards = prevLibrary.slice(0, remainingCards);
            const newLibrary = prevLibrary.slice(remainingCards);

            setPlayerHand(prevHand => [
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

function handlePlayerMine() {
    playerGainBits(1);
    playerLoseActions(1);
    setCurrentPlayer('ENEMY');
}

function playerGainBurden(num) {
    setPlayerBurden(prevBurden => prevBurden + num);
}

function playerLoseBurden(num) {
    setPlayerBurden(prevBurden => prevBurden - num);
}

function playerGainFate(num) {
    let remainingPoints = num;

    if (playerBurden > 0) {
        const newBurden = playerBurden - num;

        remainingPoints = Math.max(0, newBurden * -1);
        setPlayerBurden(Math.max(0, newBurden));
    }
    if (remainingPoints > 0) {
        setPlayerFate(prevFate => prevFate + remainingPoints);
    }
}

function playerLoseFate(num) {
    setPlayerBurden(prevFate => prevFate - num);
}

function enemyGainFate(num) {
    let remainingPoints = num;

    if (playerBurden > 0) {
        const newBurden = playerBurden - num;

        remainingPoints = Math.max(0, newBurden * -1);
        setEnemyBurden(Math.max(0, newBurden));
    }
    if (remainingPoints > 0) {
        setEnemyFate(prevFate => prevFate + remainingPoints);
    }
}

function enemyLoseFate(num) {
    setEnemyFate(prevFate => prevFate - num);
}

function playerGainWounds(num) {
    setPlayerWounds(prevWounds => prevWounds + num);
}

function playerLoseWounds(num) {
    setPlayerWounds(prevWounds => prevWounds - num);
}

function enemyGainBurden(num) {
    setEnemyBurden(prevBurden => prevBurden + num);
}

function enemyLoseBurden(num) {
    setEnemyBurden(prevBurden => prevBurden - num);
}

function enemyGainWounds(num) {
    setEnemyWounds(prevWounds => prevWounds + num);
}

function enemyLoseWounds(num) {
    setEnemyWounds(prevWounds => prevWounds - num);
}

function enemyGainOverload(num) {
    setEnemyOverload(prevOverload => prevOverload + num);
}

function playerGainOverload(num) {
    setPlayerOverload(prevOverload => prevOverload + num);
}

function playerGainBits(num) {
    let remainingBits = num;

    if (playerOverload > 0) {
        const newOverload = playerOverload - num;

        remainingBits = Math.max(0, newOverload * -1);
        setPlayerOverload(Math.max(0, newOverload));
    }
    setPlayerBits(prevBits => prevBits + remainingBits);
}

function playerLoseBits(num) {
    setPlayerBits(prevBits => prevBits - num);
}

function enemyGainBits(num) {
    let remainingBits = num;

    if (enemyOverload > 0) {
        const newOverload = enemyOverload - num;

        remainingBits = Math.max(0, newOverload * -1);
        setEnemyOverload(Math.max(0, newOverload));
    }
    setEnemyBits(prevBits => prevBits + remainingBits);
}

function enemyLoseBits(num) {
    setEnemyBits(prevBits => prevBits - num);
}

function enemyGainActions(num) {
    let remainingActions = num;

    if (enemyLag > 0) {
        const newLag = enemyLag - num;

        remainingActions = Math.max(0, newLag * -1);
        setEnemyLag(Math.max(0, newLag));
    }
    setEnemyActions(prevActions => prevActions + remainingActions);
}

function enemyLoseActions(num) {
    setEnemyActions(prevActions => Math.max(0, prevActions - num));
}

function playerGainAshes(num) {
    setPlayerAshes(prevAshes => prevAshes + num);
}

function enemyGainAshes(num) {
    setEnemyAshes(prevAshes => prevAshes + num);
}

function playerGainSurge(num) {
    setPlayerSurge(prev => prev + num);
}

function enemyGainSurge(num) {
    setEnemySurge(prev => prev + num);
}

function playerLoseAshes(num) {
    setPlayerAshes(prevAshes => prevAshes - num);
}

function enemyLoseAshes(num) {
    setEnemyAshes(prevAshes => prevAshes - num);
}

function playerGainActions(num) {
    let remainingActions = num;

    if (playerLag > 0) {
        const newLag = playerLag - num;

        remainingActions = Math.max(0, newLag * -1);
        setPlayerLag(Math.max(0, newLag));
    }
    setPlayerActions(prevActions => prevActions + remainingActions);
}

function playerLoseActions(num) {
    setPlayerActions(prevActions => prevActions - num);
}

function playerGainLag(num) {
    setPlayerLag(prevLag => prevLag + num);
}

function enemyGainLag(num) {
    setEnemyLag(prevLag => prevLag + num);
}

function playerLoseLag(num) {
    setPlayerLag(prevLag => prevLag - num);
}

function enemyLoseLag(num) {
    setEnemyLag(prevLag => prevLag - num);
}

function updateEntityPower(entity, side, powerAdjustment) {
    const realmName = entity.realm;
    const [realm, setRealm] = getRealmAndSetter(realmName, side);

    const entityIndex = realm.people.findIndex((e) => e.id === entity.id);
    if (entityIndex === -1) {
        console.error(`Entity with ID ${entity.id} not found in realm ${realmName}`);
        return;
    }

    const updatedEntity = { ...realm.people[entityIndex] };

    // Initialize currentPower if not already set
    if (updatedEntity.currentPower === undefined) {
        updatedEntity.currentPower = updatedEntity.power || 0;
    }

    updatedEntity.currentPower += powerAdjustment;

    // Update the realm's people array
    const newPeople = [...realm.people];
    newPeople[entityIndex] = updatedEntity;

    // Update the realm state
    setRealm({
        ...realm,
        people: newPeople,
    });

    console.log(`${updatedEntity.card.name}'s power adjusted by ${powerAdjustment}. New power: ${updatedEntity.currentPower}`);
}

function getFriendlyEntities(side, realmName = null) {
    const realms = side === 'PLAYER' ? getAllPlayerRealms() : getAllEnemyRealms();
    let entities = [];

    realms.forEach(realm => {
        if (!realmName || realm.name === realmName) {
            entities = entities.concat(realm.people);
        }
    });

    return entities;
}

function getEnemyEntities(side, realmName = null) {
    const enemySide = getOppositeSide(side);
    return getFriendlyEntities(enemySide, realmName);
}

function getAllPlayerRealms() {
    return [playerSolarium, playerUnderpass, playerGrid, playerTheater];
}

function getAllEnemyRealms() {
    return [enemySolarium, enemyUnderpass, enemyGrid, enemyTheater];
}


function adjustEntityPowerExternal(entity, side) {
    const realmName = entity.realm;
    const [realm] = getRealmAndSetter(realmName, side);

    let powerAdjustment = 0;

    // Check for friendly Inspire effects
    const friendlyEntities = realm.people.filter((e) => e.id !== entity.id);
    friendlyEntities.forEach((e) => {
        const inspireAbility = e.card.abilities?.find((ability) => ability.name === 'Inspire');
        if (inspireAbility) {
            const inspireAmount = inspireAbility.amount || 1;
            powerAdjustment += inspireAmount;
        }
    });

    // Check for enemy Rotten effects
    const oppositeSide = getOppositeSide(side);
    const [enemyRealm] = getRealmAndSetter(realmName, oppositeSide);
    const enemyEntities = enemyRealm.people;

    enemyEntities.forEach((e) => {
        const rottenAbility = e.card.abilities?.find((ability) => ability.name === 'Rotten');
        if (rottenAbility) {
            const rottenAmount = rottenAbility.amount || 1;
            powerAdjustment -= rottenAmount;
        }
    });

    // Update entity's power
    updateEntityPower(entity, side, powerAdjustment);
}

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
        });
    });
}

function getRealmAndSetter(realmName, owner) {
    if (owner === 'PLAYER') {
        switch (realmName) {
            case 'Solarium':
                return [playerSolarium, setPlayerSolarium];
            case 'Theater':
                return [playerTheater, setPlayerTheater];
            case 'Underpass':
                return [playerUnderpass, setPlayerUnderpass];
            case 'Grid':
                return [playerGrid, setPlayerGrid];
            default:
                throw new Error(`Unknown realm: ${realmName}`);
        }
    } else if (owner === 'ENEMY') {
        switch (realmName) {
            case 'Solarium':
                return [enemySolarium, setEnemySolarium];
            case 'Theater':
                return [enemyTheater, setEnemyTheater];
            case 'Underpass':
                return [enemyUnderpass, setEnemyUnderpass];
            case 'Grid':
                return [enemyGrid, setEnemyGrid];
            default:
                throw new Error(`Unknown realm: ${realmName}`);
        }
    } else {
        throw new Error(`Unknown owner: ${owner}`);
    }
}

async function enemyPerformAction() {
    console.log('enemy perform action', enemyActions)
    if (enemyActions > 0) {
        await enemyRezCards();
        const attackPlanned = enemyPlanAttack();
        if (attackPlanned) {
            enemyLoseActions(1);
            return;
        } else if (enemyHand.length > 0) { // todo check if playable
            enemyPlayCard();
            enemyLoseActions(1);
            setCurrentPlayer('PLAYER');
        } else {
            enemyDraw(1);
            enemyLoseActions(1);
            setCurrentPlayer('PLAYER');
        }
    } else {
        setCurrentPlayer('PLAYER');
    }
}


function startTurn(currentPriorityLeft) {
    console.log('start turn', currentPriorityLeft)
    eventManager.publish('turnStart', { side: 'PLAYER' });
    eventManager.publish('turnStart', { side: 'ENEMY' });
    setAwaitingFocus(true);
    setFocus('');
    setTurnNumber((prev) => prev + 1);
    setSelectedCard(null);
    setSelectedInHand(false);
    setDraftSelected(false);
    setTargetType('none');
    setPendingRitual(null);
    setTargetSelection({ enabled: false });
    const startingPlayer = currentPriorityLeft ? 'ENEMY' : 'PLAYER';
    setCurrentPlayer(startingPlayer);
    setPlayerInterfacedHeadSpace(false);
    setPlayerInterfacedPandora(false);
    setEnemyInterfacedHeadSpace(false);
    setEnemyInterfacedPandora(false);

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

function endTurn() {
    console.log('end turn');
    processEndOfTurnEffects();
    const newPriorityLeft = !priorityLeft;
    setPriorityLeft(newPriorityLeft);
    startTurn(newPriorityLeft);
}

function getPlayerRealmByName(realmName) {
    switch (realmName) {
        case 'Solarium':
            return playerSolarium;
        case 'Theater':
            return playerTheater;
        case 'Underpass':
            return playerUnderpass;
        case 'Grid':
            return playerGrid;
        default:
            return null;
    }
}

function getSetPlayerRealm(realmName) {
    switch (realmName) {
        case 'Solarium':
            return setPlayerSolarium;
        case 'Theater':
            return setPlayerTheater;
        case 'Underpass':
            return setPlayerUnderpass;
        case 'Grid':
            return setPlayerGrid;
        default:
            return null;
    }
}

// Define functions to get the enemy's realm and its setter by name
function getEnemyRealmByName(realmName) {
    switch (realmName) {
        case 'Solarium':
            return enemySolarium;
        case 'Theater':
            return enemyTheater;
        case 'Underpass':
            return enemyUnderpass;
        case 'Grid':
            return enemyGrid;
        default:
            return null;
    }
}

function getSetEnemyRealm(realmName) {
    switch (realmName) {
        case 'Solarium':
            return setEnemySolarium;
        case 'Theater':
            return setEnemyTheater;
        case 'Underpass':
            return setEnemyUnderpass;
        case 'Grid':
            return setEnemyGrid;
        default:
            return null;
    }
}

// Function to determine the array name based on the card's category
function getArrayNameForCategory(category) {
    switch (category) {
        case 'ENTITY':
            return 'people';
        case 'LOCATION':
        case 'LANDMARK':
            return 'places';
        case 'SNIP':
        case 'SYM':
        case 'THING':
            return 'things';
        default:
            console.error('Unknown card category:', category);
            return 'things'; // Default to 'things' if unknown
    }
}

function updateEntityInRealm(entity, updatedProperties, side) {
    const realmName = entity.realm;
    const [realm, setRealm] = getRealmAndSetter(realmName, side);
    const arrays = ['people', 'places', 'things'];
    let entityFound = false;

    arrays.forEach(arrayName => {
        if (realm[arrayName].some(card => card.id === entity.id)) {
            setRealm(prevRealm => ({
                ...prevRealm,
                [arrayName]: prevRealm[arrayName].map(card => {
                    if (card.id === entity.id) {
                        return {
                            ...card,
                            ...updatedProperties,
                        };
                    }
                    return card;
                }),
            }));
            entityFound = true;
        }
    });

    if (!entityFound) {
        console.error(`Entity ${entity.card.name} not found in realm ${realmName}.`);
    }
}





function updateCardInRealm(cardEntity, side) {
    const realmName = cardEntity.realm;
    const [realm, setRealm] = getRealmAndSetter(realmName, side);

    // Update the card in the appropriate array
    if (realm.people.some(card => card.id === cardEntity.id)) {
        setRealm({
            ...realm,
            people: realm.people.map(card => (card.id === cardEntity.id ? cardEntity : card)),
        });
    } else if (realm.places.some(card => card.id === cardEntity.id)) {
        setRealm({
            ...realm,
            places: realm.places.map(card => (card.id === cardEntity.id ? cardEntity : card)),
        });
    } else if (realm.things.some(card => card.id === cardEntity.id)) {
        setRealm({
            ...realm,
            things: realm.things.map(card => (card.id === cardEntity.id ? cardEntity : card)),
        });
    } else {
        console.error(`Card ${cardEntity.card.name} not found in realm ${realmName}.`);
    }
}

    const returnToOriginalRealm = (cardEntity, side) => {
        const realm = cardEntity.realm;
        const updatedCardEntity = { ...cardEntity }; // todo

        const updateRealm = (setRealmFunc) => {
            console.log('updatedCardEntity', updatedCardEntity)
            setRealmFunc(prev => ({ ...prev, people: [...prev.people, updatedCardEntity] }));
        };

        const updateBattleSlots = (setBattleSlotsFunc) => {
            setBattleSlotsFunc(prev => {
                const newSlots = [...prev];
                const cardIndex = newSlots.findIndex(card => card === cardEntity);
                if (cardIndex !== -1) newSlots[cardIndex] = null;
                return newSlots;
            });
        };

        if (side === 'PLAYER') {
            updateBattleSlots(setPlayerBattleSlots);
            switch (realm) {
                case 'Solarium': updateRealm(setPlayerSolarium); break;
                case 'Theater': updateRealm(setPlayerTheater); break;
                case 'Underpass': updateRealm(setPlayerUnderpass); break;
                case 'Grid': updateRealm(setPlayerGrid); break;
            }
        } else {
            updateBattleSlots(setEnemyBattleSlots);
            switch (realm) {
                case 'Solarium': updateRealm(setEnemySolarium); break;
                case 'Theater': updateRealm(setEnemyTheater); break;
                case 'Underpass': updateRealm(setEnemyUnderpass); break;
                case 'Grid': updateRealm(setEnemyGrid); break;
            }
        }
    };


    const removeFromRealm = (cardEntity, realm, side) => {
        const updateRealm = (setRealmFunction, realmName) => {
            setRealmFunction(prev => {
                let updated = { ...prev };
                let removed = false;
                Object.keys(updated).forEach(key => {
                    if (Array.isArray(updated[key])) {
                        const originalLength = updated[key].length;
                        updated[key] = updated[key].filter(c => c.id !== cardEntity.id);
                        if (updated[key].length !== originalLength) {
                            removed = true;
                            console.log(`Removed entity ID ${cardEntity.id} from ${key} in ${realmName} realm.`);
                        }
                    }
                });

                if (!removed) {
                    console.warn(`Entity with ID ${cardEntity.id} not found in any array within ${realmName} realm.`);
                }

                return updated;
            });
        };

        if (side === 'PLAYER') {
            switch (realm) {
                case 'Solarium':
                    updateRealm(setPlayerSolarium, 'Solarium');
                    break;
                case 'Theater':
                    updateRealm(setPlayerTheater, 'Theater');
                    break;
                case 'Underpass':
                    updateRealm(setPlayerUnderpass, 'Underpass');
                    break;
                case 'Grid':
                    updateRealm(setPlayerGrid, 'Grid');
                    break;
                default:
                    console.error('Invalid realm: ' + realm);
            }
        } else if (side === 'ENEMY') {
            switch (realm) {
                case 'Solarium':
                    updateRealm(setEnemySolarium, 'Solarium');
                    break;
                case 'Theater':
                    updateRealm(setEnemyTheater, 'Theater');
                    break;
                case 'Underpass':
                    updateRealm(setEnemyUnderpass, 'Underpass');
                    break;
                case 'Grid':
                    updateRealm(setEnemyGrid, 'Grid');
                    break;
                default:
                    console.error('Invalid realm: ' + realm);
            }
        } else {
            console.error('Invalid side: ' + side);
        }
    };

    function getOppositeSide(side) {
        return side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
    }

    function willEntitySurvive(entity, incomingDamage) {
        const currentWounds = entity.wounds || 0;
        const totalDamage = currentWounds + incomingDamage;
        return totalDamage < entity.card.HP;
    }

    const handlePlaceDamage = (location, id, num, side) => {
        let cardToWound;
        let setRealmFunction;
        let currentRealm;

        // Determine the correct realm and setter based on location and side
        switch (location) {
            case 'Theater':
                currentRealm = side === 'PLAYER' ? playerTheater : enemyTheater;
                setRealmFunction = side === 'PLAYER' ? setPlayerTheater : setEnemyTheater;
                break;
            case 'Underpass':
                currentRealm = side === 'PLAYER' ? playerUnderpass : enemyUnderpass;
                setRealmFunction = side === 'PLAYER' ? setPlayerUnderpass : setEnemyUnderpass;
                break;
            default:
                console.error('Invalid location');
                return;
        }

        // Find the card to wound
        cardToWound = currentRealm.places.find(cardEntity => cardEntity.id === id);

        // If card is not found, log and return
        if (!cardToWound) {
            console.log(`Card with id ${id} in ${location} is already destroyed`);
            return;
        }

        // Calculate new wounds
        const newWounds = cardToWound.wounds + num;

        // Handle card destruction
        if (newWounds >= cardToWound.card.HP) {
            handleDestroyedPlace(
                location,
                cardToWound.id,
                side,
                cardToWound.card.runes || 0
            );
        } else {
            // Update the realm with new wounds
            setRealmFunction(prevRealm => ({
                ...prevRealm,
                places: prevRealm.places.map(card =>
                    card.id === id
                        ? { ...card, wounds: newWounds }
                        : card
                )
            }));
        }
    }

    function getGlobalEntityById(entityId, side, realmName) {
        const [realm, _] = getRealmAndSetter(realmName, side);
    
        // Search the people array in the given realm for the entity
        const foundEntity = realm.people.find(card => card.id === entityId);
        return foundEntity || null;
    }





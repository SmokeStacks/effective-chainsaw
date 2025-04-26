    function handleDevelopCard(cardEntity) {
        setAttackMode('NONE');

        // Check if the card can be developed
        if (
            cardEntity.owner !== 'PLAYER' ||
            !(
                cardEntity.card.category === 'SYM' ||
                cardEntity.card.category === 'LANDMARK' ||
                cardEntity.scheming
            )
        ) {
            console.log('This card cannot be developed.');
            return;
        }

        // Increase Development or Scheme points
        if (cardEntity.card.category === 'SYM' || cardEntity.card.category === 'LANDMARK') {
            const newDevelopment = (cardEntity.development || 0) + 1;

            // Check for Ascension
            if (newDevelopment >= cardEntity.card.plot) {
                handleAscension(cardEntity, 'PLAYER');
            } else {
                // Update the entity in the state
                updateEntityInRealm(cardEntity, { development: newDevelopment }, 'PLAYER');
            }
        } else if (cardEntity.scheming) {
            const newScheme = (cardEntity.scheme || 0) + 1;

            // Check for Scheme Threshold
            if (newScheme >= cardEntity.card.schemeThreshold) {
                // Unlock Scheme Ability
                updateEntityInRealm(cardEntity, { scheme: newScheme, schemeUnlocked: true }, 'PLAYER');
                console.log(`${cardEntity.card.name} has unlocked its Scheme ability.`);
            } else {
                // Update the entity's scheme
                updateEntityInRealm(cardEntity, { scheme: newScheme }, 'PLAYER');
            }
        }
    }


    function applyBoost(entity, boostAmount, side) {
        console.log(`Applying ${boostAmount} Boost to ${entity.card.name}`);
        if (entity.freeze > 0) {
            const freezeReduction = Math.min(boostAmount, entity.freeze);
            entity.freeze -= freezeReduction;
            console.log(`${entity.card.name} reduces Freeze by ${freezeReduction} due to Boost.`);

            updateEntityInRealm(entity, { freeze: entity.freeze }, side);
            const remainingBoost = boostAmount - freezeReduction;
            if (remainingBoost > 0) {
                gainSteps(entity, remainingBoost, side);
            }
        } else {
            gainSteps(entity, boostAmount, side);
        }
    }


    function gainSteps(entity, steps, side) {
        const newSteps = (entity.steps || 0) + steps;
        let readied = entity.readied;
        console.log(`${entity.card.name} gains ${steps} Steps.`);
        if (entity.card.timer && newSteps >= entity.card.timer) {
            readied = true;
            console.log(`${entity.card.name} is now readied.`);
        }
        updateEntityInRealm(entity, {
            steps: newSteps,
            readied: readied,
        }, side);
    }



    function handleAscension(cardEntity, side) {
        const realmName = cardEntity.realm;
        const [realm, setRealm] = getRealmAndSetter(realmName, side);
        let cardFound = false;
        const arrays = ['things', 'places']; // Exclude 'people'


        if (side === 'PLAYER') {
            playerGainFate(cardEntity.card.runes);
        } else {
            enemyGainFate(cardEntity.card.runes);
        }

        arrays.forEach(arrayName => {
            if (realm[arrayName]?.some(card => card.id === cardEntity.id)) {
                if (arrayName === 'things') {
                    // Remove from current realm and move to Elysium
                    setRealm(prevRealm => ({
                        ...prevRealm,
                        [arrayName]: prevRealm[arrayName].filter(card => card.id !== cardEntity.id),
                    }));

                    // Set ascended to true
                    cardEntity.ascended = true;
                    cardEntity.realm = 'Elysium';

                    if (side === 'PLAYER') {
                        setPlayerElysium(prevElysium => ({
                            ...prevElysium,
                            things: [...prevElysium.things, cardEntity],
                        }));
                    } else {
                        setEnemyElysium(prevElysium => ({
                            ...prevElysium,
                            things: [...prevElysium.things, cardEntity],
                        }));
                    }
                } else if (arrayName === 'places') {
                    // Mark as ascended, but don't move
                    setRealm(prevRealm => ({
                        ...prevRealm,
                        [arrayName]: prevRealm[arrayName].map(card =>
                            card.id === cardEntity.id
                                ? { ...card, ascended: true }
                                : card
                        ),
                    }));
                }

                cardFound = true;
            }
        });

        if (cardFound) {
            // Trigger one-time onAscend abilities
            triggerAscendAbilities(cardEntity, side);

            // Activate ongoing Ascended abilities
            activateAscendedAbilities(cardEntity, side);

            console.log(`${cardEntity.card.name} has ascended.`);
        } else {
            console.error(`Card ${cardEntity.card.name} not found in realm ${realmName}.`);
        }
    }



    function triggerAscendAbilities(entity, side) {
        entity.card.abilities.forEach((ability) => {
            const abilityDef = abilitiesDefinitions[ability.name]; // Access using ability.name
            if (abilityDef && abilityDef.type === "onAscend" && abilityDef.onAscend) {
                console.log(`Triggering onAscend for ability: ${ability.name}`);
                abilityDef.onAscend(entity, null, side);
            }
        });
    }

    async function activateAscendedAbilities(cardEntity, side) {
        console.log('_____________________________activate ascended abilities', cardEntity);

        // Filter abilities to find those with type 'ascended'
        const ascendedAbilities = cardEntity.card.abilities.filter(
            ability => abilitiesDefinitions[ability.name]?.type === 'ascended'
        );

        if (ascendedAbilities.length === 0) {
            console.log('No ascended abilities to activate.');
            return [];
        }

        console.log('Ascended abilities ', ascendedAbilities);

        // Iterate over each ascended ability and activate them
        ascendedAbilities.forEach(ability => { // Changed parameter to 'ability'
            const abilityDef = abilitiesDefinitions[ability.name]; // Access using ability.name
            if (abilityDef) {
                if (abilityDef.typeCategory === 'static') {
                    // Apply static effect
                    abilityDef.applyEffect(cardEntity, gameState, side);
                } else if (abilityDef.typeCategory === 'triggered') {
                    console.log('_____________________________________________________-activate trigger listener');
                    abilityDef.triggers.forEach((eventType) => {
                        const handler = (eventData) => {
                            abilityDef.eventHandler(cardEntity, eventData, gameState, side);
                        };
                        eventManager.subscribe(eventType, handler);
                        console.log(`Subscribed to event "${eventType}" for ability "${ability.name}"`);

                        if (!cardEntity.activeAbilities) {
                            cardEntity.activeAbilities = [];
                        }
                        cardEntity.activeAbilities.push({ abilityName: ability.name, eventType, handler }); // Use ability.name
                    });
                }
                // Handle other ability categories as needed
            }
        });

        return ascendedAbilities.map(ability => ability.name); // Optionally return activated abilities
    }






    function handleBoostCard(cardEntity) {
        const { id, realm } = cardEntity;
        setAttackMode('NONE')
        const realmSetter = realm.charAt(0).toUpperCase() + realm.slice(1).toLowerCase(); // Convert to proper case

        let isReady = false;
        let newSteps = cardEntity.steps
        if (cardEntity.freeze > 0) {
            cardEntity.freeze -= 1;
            console.log(`${cardEntity.card.name} reduces Freeze by 1. Remaining Freeze: ${cardEntity.freeze}`);
        } else {
            newSteps++;
        }
        if (cardEntity.card.timer && newSteps >= cardEntity.card.timer) {
            isReady = true;
        }

        switch (realmSetter) {
            case 'Solarium':
                setPlayerSolarium(prevRealm => {
                    return {
                        ...prevRealm,
                        people: prevRealm.people.map(card => {
                            if (card.id === id) {
                                return {
                                    ...card,
                                    steps: (card.steps || 0) + 1,
                                    readied: isReady
                                };
                            }
                            return card;
                        })
                    };
                });
                break;
            case 'Theater':
                setPlayerTheater(prevRealm => {
                    return {
                        ...prevRealm,
                        people: prevRealm.people.map(card => {
                            if (card.id === id) {
                                return {
                                    ...card,
                                    steps: (card.steps || 0) + 1,
                                    readied: isReady
                                };
                            }
                            return card;
                        })
                    };
                });
                break;
            case 'Underpass':
                setPlayerUnderpass(prevRealm => {
                    return {
                        ...prevRealm,
                        people: prevRealm.people.map(card => {
                            if (card.id === id) {
                                return {
                                    ...card,
                                    steps: (card.steps || 0) + 1,
                                    readied: isReady
                                };
                            }
                            return card;
                        })
                    };
                });
                break;
            case 'Grid':
                setPlayerGrid(prevRealm => {
                    return {
                        ...prevRealm,
                        people: prevRealm.people.map(card => {
                            if (card.id === id) {
                                return {
                                    ...card,
                                    steps: (card.steps || 0) + 1,
                                    readied: isReady
                                };
                            }
                            return card;
                        })
                    };
                });
                break;

            default:
                console.error('Invalid realm:', realm);
        }
    }
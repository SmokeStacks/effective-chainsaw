    function enemyPlanAttack() {
        flushSync(() => {
            console.log('PLAN ATTACK');
            console.log(enemyUnderpass)
            let realms;
            if (priorityLeft) {
                realms = [
                    { realm: enemySolarium, name: 'Solarium', aspects: ['magi'] },
                    { realm: enemyTheater, name: 'Theater', aspects: ['phys', 'magi'] },
                    { realm: enemyUnderpass, name: 'Underpass', aspects: ['tech', 'phys'] },
                    { realm: enemyGrid, name: 'Grid', aspects: ['tech'] },
                ];
            } else {
                realms = [
                    { realm: enemyGrid, name: 'Grid', aspects: ['tech'] },
                    { realm: enemyUnderpass, name: 'Underpass', aspects: ['tech', 'phys'] },
                    { realm: enemyTheater, name: 'Theater', aspects: ['magi', 'phys'] },
                    { realm: enemySolarium, name: 'Solarium', aspects: ['magi'] },
                ];
            }

            const newSlots = Array(6).fill(null);

            for (const { realm, name, aspects } of realms) {
                for (const aspect of aspects) {
                    const matchingCreatures = realm.people.filter(
                        creature => creature.card[aspect] && creature.online && creature.readied && !creature.card.defensive
                    );

                    if (matchingCreatures.length > 0) {
                        setBattleRealm(name);

                        // Fill battle slots with attacking creatures from this realm
                        for (let i = 0; i < newSlots.length && matchingCreatures.length > 0; i++) {
                            const creature = matchingCreatures.shift();

                            // Set steps to 0 and readied to false
                            creature.steps = creature.charge;
                            if (creature.steps < creature.card.timer) {
                                creature.readied = false;
                            } else {
                                creature.readied = true;
                            }

                            removeFromRealm(creature, creature.realm, 'ENEMY');
                            newSlots[i] = creature;
                        }

                        setEnemyBattleSlots(newSlots);

                        // Determine attack mode based on aspect
                        let attackMode;
                        if (aspect === 'magi') {
                            attackMode = 'ENEMY_magi';
                        } else if (aspect === 'phys') {
                            attackMode = 'ENEMY_phys';
                        } else if (aspect === 'tech') {
                            attackMode = 'ENEMY_tech';
                        }
                        setAttackMode(attackMode);

                        // Select target based on attack type
                        selectEnemyAttackTarget(name, aspect);

                        setGameState('WAITING_FOR_PLAYER_DEFENSE');
                        return true; // Attack was planned
                        // setAttackPlanned(true);
                        // setAttackCount(prev => prev + 1);

                    }
                }
            }
            return false; // No attack possible
            // setAttackPlanned(false);
            // setAttackCount(prev => prev + 1);
        })
    }



    function selectEnemyAttackTarget(realmName, aspect) {
        // console.log('selectEnemyAttackTarget realmName', realmName)
        // console.log('selectEnemyAttackTarget aspect', aspect)
        if (aspect === 'phys') {
            // Raid logic
            const playerRealm = getPlayerRealmByName(realmName);
            const places = playerRealm.places;

            if (places.length > 0) {
                // Target the place with the lowest health
                const targetPlace = places.reduce((lowest, place) => {
                    return place.card.health < lowest.card.health ? place : lowest;
                }, places[0]);

                setEnemyTargetSelection(targetPlace);
                setEnemyTargetType('PLACE');
            } else {
                // No places, target player directly
                setEnemyTargetSelection(null);
                setEnemyTargetType('none');
            }
        } else if (aspect === 'tech') {
            // Hack logic
            const playerRealm = getPlayerRealmByName(realmName);
            const things = playerRealm.things;

            let targetRoll = Math.random();
            if (things.length > 0 && targetRoll < 2 / 3) {
                // Target a thing
                const targetThing = priorityLeft ? things[0] : things[things.length - 1];
                setEnemyTargetSelection(targetThing);
                setEnemyTargetType('THING');
            } else {
                // Target HeadSpace or Pandora
                if (realmName === 'Underpass') {
                    setEnemyTargetSelection(null);
                    setEnemyTargetType('HEADSPACE');
                } else if (realmName === 'Grid') {
                    setEnemyTargetSelection(null);
                    setEnemyTargetType('PANDORA');
                }
            }
        }
    }
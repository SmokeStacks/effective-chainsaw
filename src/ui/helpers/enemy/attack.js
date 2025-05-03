import { flushSync } from 'react-dom';
import { state, stateSetters } from '../state';
import { getPlayerRealmByName, removeFromRealm } from '../core';
import { setAttackMode, setGameState } from '../game';

export function enemyPlanAttack() {
        flushSync(() => {
            console.log('PLAN ATTACK');
            console.log(state.enemyUnderpass)
            let realms;
            if (state.priorityLeft) {
                realms = [
                    { realm: state.enemySolarium, name: 'Solarium', aspects: ['magi'] },
                    { realm: state.enemyTheater, name: 'Theater', aspects: ['phys', 'magi'] },
                    { realm: state.enemyUnderpass, name: 'Underpass', aspects: ['tech', 'phys'] },
                    { realm: state.enemyGrid, name: 'Grid', aspects: ['tech'] },
                ];
            } else {
                realms = [
                    { realm: state.enemyGrid, name: 'Grid', aspects: ['tech'] },
                    { realm: state.enemyUnderpass, name: 'Underpass', aspects: ['tech', 'phys'] },
                    { realm: state.enemyTheater, name: 'Theater', aspects: ['magi', 'phys'] },
                    { realm: state.enemySolarium, name: 'Solarium', aspects: ['magi'] },
                ];
            }

            const newSlots = Array(6).fill(null);

            for (const { realm, name, aspects } of realms) {
                for (const aspect of aspects) {
                    const matchingCreatures = realm.people.filter(
                        creature => creature.card[aspect] && creature.online && creature.readied && !creature.card.defensive
                    );

                    if (matchingCreatures.length > 0) {
                        stateSetters.setBattleRealm(name);

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

                            // Get the correct category (PEOPLE, PLACES, THINGS) based on the creature type
                            const category = 'PEOPLE'; // Assuming creatures are always people
                            removeFromRealm(name, creature.id, category);
                            newSlots[i] = creature;
                        }

                        stateSetters.setEnemyBattleSlots(newSlots);

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
                        // Pass the current priorityLeft value as a parameter
                        selectEnemyAttackTarget(name, aspect, state.priorityLeft);

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



export function selectEnemyAttackTarget(realmName, aspect, isPriorityLeft) {
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

                stateSetters.setEnemyTargetSelection(targetPlace);
                stateSetters.setEnemyTargetType('PLACE');
            } else {
                // No places, target player directly
                stateSetters.setEnemyTargetSelection(null);
                stateSetters.setEnemyTargetType('none');
            }
        } else if (aspect === 'tech') {
            // Hack logic
            const playerRealm = getPlayerRealmByName(realmName);
            const things = playerRealm.things;

            let targetRoll = Math.random();
            if (things.length > 0 && targetRoll < 2 / 3) {
                // Target a thing
                // Target a thing based on the current priority direction
                const targetThing = isPriorityLeft ? things[0] : things[things.length - 1];
                stateSetters.setEnemyTargetSelection(targetThing);
                stateSetters.setEnemyTargetType('THING');
            } else {
                // Target HeadSpace or Pandora
                if (realmName === 'Underpass') {
                    stateSetters.setEnemyTargetSelection(null);
                    stateSetters.setEnemyTargetType('HEADSPACE');
                } else if (realmName === 'Grid') {
                    stateSetters.setEnemyTargetSelection(null);
                    stateSetters.setEnemyTargetType('PANDORA');
                }
            }
        }
    }
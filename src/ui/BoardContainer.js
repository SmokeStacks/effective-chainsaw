import React, { Component, useEffect, useState } from 'react';

import {
    Solarium,
    Theater,
    Underpass,
    Grid
} from "./renders/Board";

import Gameboard from './Gameboard';

import { Realm, SharedSlot } from '/Users/wyrm/Documents/coding/TMP/tempi/src/rules/cards.ts'
import { libraryOne } from '/Users/wyrm/Documents/coding/TMP/tempi/src/playerDecks/deckOne.ts'
import { draftList } from '/Users/wyrm/Documents/coding/TMP/tempi/src/systemDecks/draft.ts'
import { enemyOne } from '/Users/wyrm/Documents/coding/TMP/tempi/src/systemDecks/enemyOne.ts'



const realmComponents = [
    Solarium,
    Theater,
    Underpass,
    Grid
];


export function BoardContainer() {
    const createLibrary = () => {
        const libraryInstanceArray = [];
        for (let i = 0; i < libraryOne.length; i++) {
            const card = libraryOne[i];
            const cardEntityInstance = {
                id: i.toString(),
                card: card,
                damage: 0,
                exposed: false,
                scored: false,
                rezzed: false,
                active: false,
                steps: 0,
                wounds: 0,
                sacrificed: false
            };
            libraryInstanceArray.push(cardEntityInstance);
        }
        return libraryInstanceArray;
    };

    const createEnemyLibrary = () => {
        const libraryInstanceArray = [];
        for (let i = 0; i < enemyOne.length; i++) {
            const card = enemyOne[i];
            const cardEntityInstance = {
                id: i.toString(),
                card: card,
                damage: 0,
                exposed: false,
                scored: false,
                rezzed: false,
                active: false,
                steps: 0,
                wounds: 0,
                sacrificed: false
            };
            libraryInstanceArray.push(cardEntityInstance);
        }
        return libraryInstanceArray;
    };

    const createDraft = () => {
        const draftInstanceArray = [];
        for (let i = 0; i < draftList.length; i++) {
            const card = draftList[i];
            const cardEntityInstance = {
                id: i.toString(),
                card: card,
                wounds: 0,
                exposed: false,
                scored: false,
                rezzed: false,
                active: false,
                steps: 0,
                wounds: 0,
                sacrificed: false
            };
            draftInstanceArray.push(cardEntityInstance);
        }
        return draftInstanceArray;
    };

    function createRealm(name, elements) {
        return new Realm(name, elements);
    }

    function createSlotOperator(max, type) {
        return new SharedSlot(max, type);
    }

    const [playerLibrary, setPlayerLibrary] = useState(createLibrary());
    const [draft, setDraft] = useState(createDraft());
    const [playerHand, setPlayerHand] = useState([]);
    const [graveyard, setPlayerGraveyard] = useState([]);
    const [playerBits, setPlayerBits] = useState(0);
    const [playerActions, setPlayerActions] = useState(0);
    const [playerAshes, setPlayerAshes] = useState(0);
    const [playerFate, setPlayerFate] = useState(0);
    const [playerDebt, setPlayerDebt] = useState(0);
    const [playerWounds, setPlayerWounds] = useState(0);
    const [playerBurden, setPlayerBurden] = useState(0);

    const [soulSelections, setSoulSelections] = useState([]);
    const [awaitingSacrifices, setAwaitingSacrifices] = useState(false);
    const [rezCard, setRezCard] = useState(null);

    const [enemyLibrary, setEnemyLibrary] = useState(createEnemyLibrary());
    const [enemyHand, setEnemyHand] = useState([]);
    const [enemyGraveyard, setEnemyGraveyard] = useState([]);
    const [priorityLeft, setPriorityLeft] = useState(true);
    const [enemyBits, setEnemyBits] = useState(0);
    const [enemyActions, setEnemyActions] = useState(0);
    const [enemyAshes, setEnemyAshes] = useState(0);
    const [enemyFate, setEnemyFate] = useState(0);
    const [enemyDebt, setEnemyDebt] = useState(0);
    const [enemyWounds, setEnemyWounds] = useState(0);
    const [enemyBurden, setEnemyBurden] = useState(0);

    const [playerBattleSlots, setPlayerBattleSlots] = useState(Array(6).fill(null));
    const [enemyBattleSlots, setEnemyBattleSlots] = useState(Array(6).fill(null));

    const [selectedCard, setSelectedCard] = useState(null);
    const [battleSelectedCard, setBattleSelectedCard] = useState(null);

    const [enemyTurnPhase, setEnemyTurnPhase] = useState(null);
    const [gameState, setGameState] = useState('BEGIN');
    const [battleRealm, setBattleRealm] = useState('NONE');
    const [attackMode, setAttackMode] = useState('NONE');
    const [gameMode, setGameMode] = useState('BEGIN');

    const [playerSolarium, setPlayerSolarium] = useState(createRealm('SOLARIUM', ['MAGI']));
    const [playerTheater, setPlayerTheater] = useState(createRealm('THEATER', ['MAGI', 'PHYS']));
    const [playerUnderpass, setPlayerUnderpass] = useState(createRealm('UNDERPASS', ['PHYS', 'TECH']));
    const [playerGrid, setPlayerGrid] = useState(createRealm('GRID', ['TECH']));

    const [enemySolarium, setEnemySolarium] = useState(createRealm('SOLARIUM', ['MAGI']));
    const [enemyTheater, setEnemyTheater] = useState(createRealm('THEATER', ['MAGI', 'PHYS']));
    const [enemyUnderpass, setEnemyUnderpass] = useState(createRealm('UNDERPASS', ['PHYS', 'TECH']));
    const [enemyGrid, setEnemyGrid] = useState(createRealm('GRID', ['TECH']));

    const [TheaterPlaces, setTheaterPlaces] = useState(createSlotOperator(4, ['PLACE']));
    const [UnderpassPlaces, setUnderpassPlaces] = useState(createSlotOperator(3, ['PLACE']));
    const [UnderpassThings, setUnderpassThings] = useState(createSlotOperator(3, ['THING']));
    const [GridThings, setGridThings] = useState(createSlotOperator(4, ['THING']));

    useEffect(() => {
        if (enemyTurnPhase === 'gainActionsAndBits') {
            enemyGainActions(2);
            enemyGainBits(2);
            setEnemyTurnPhase('advanceCards');
        } else if (enemyTurnPhase === 'advanceCards') {
            enemyAdvanceCards();
            setEnemyTurnPhase('draw');
        } else if (enemyTurnPhase === 'draw') {
            enemyDraw(1);
            setEnemyTurnPhase('action');
        } else if (enemyTurnPhase === 'action') {
            enemyAction();
            setEnemyTurnPhase('rezCards');
        } else if (enemyTurnPhase === 'rezCards') {
            enemyRezCards();
            setEnemyTurnPhase('planAttack');
        } else if (enemyTurnPhase === 'planAttack') {
            enemyPlanAttack();
            setEnemyTurnPhase('end');
        } else if (enemyTurnPhase === 'end') {
            setPriorityLeft(prevPriority => !prevPriority);
            setEnemyTurnPhase(null);
        }
    }, [enemyTurnPhase]);

    useEffect(() => {
        if (enemyActions > 0 && enemyTurnPhase === 'rezCards') {
            enemyAction();
        }
    }, [enemyActions]);

    useEffect(() => {
        if (gameState === 'ENEMY_PLANNING') {
            enemyPlanAttack();
        }
    }, [gameState]);

    useEffect(() => {
        if (gameMode === 'BEGIN') {
            playerGainBits(5);
            playerDraw(5)
            setGameMode('NONE')
        }
    }, [gameMode]);

    useEffect(() => {
        if (!awaitingSacrifices && rezCard) {
            if (rezCard.card.rezCost) {
                playerLoseBits(rezCard.card.rezCost);
            }
            if (rezCard.card.ash) {
                playerLoseAshes(rezCard.card.ash);
            }

            setRezCard(null);
            switch (rezCard.realm) {
                case 'SOLARIUM':
                    setPlayerSolarium(prevRealm => ({ ...prevRealm, people: prevRealm.people.map(c => (c.id === rezCard.id ? { ...c, rezzed: true } : c)) }));
                    break;
                case 'THEATER':
                    setPlayerTheater(prevRealm => ({ ...prevRealm, people: prevRealm.people.map(c => (c.id === rezCard.id ? { ...c, rezzed: true } : c)) }));
                    break;
                case 'UNDERPASS':
                    setPlayerUnderpass(prevRealm => ({ ...prevRealm, people: prevRealm.people.map(c => (c.id === rezCard.id ? { ...c, rezzed: true } : c)) }));
                    break;
                case 'GRID':
                    setPlayerGrid(prevRealm => ({ ...prevRealm, people: prevRealm.people.map(c => (c.id === rezCard.id ? { ...c, rezzed: true } : c)) }));
                    break;
            }
        }
    }, [awaitingSacrifices]);

    const handleCardSelect = (cardEntity) => {
        setSelectedCard(cardEntity);
    };

    const handleQuest = () => {
        setAttackMode('PLAYER_QUEST')
        playerLoseActions(1);
    };

    const handleRaid = () => {
        setAttackMode('PLAYER_RAID')
        playerLoseActions(1);
    };

    const handleRealmCardSelect = (cardEntity) => {
        if (awaitingSacrifices) {
            setSoulSelections(prevSelections => {
                const index = prevSelections.findIndex(card => card.id === cardEntity.id);
                if (index > -1) {
                    setCardSacrificed(cardEntity.realm, cardEntity.id, false)
                    const newSelections = [...prevSelections];
                    newSelections.splice(index, 1);
                    return newSelections;
                } else {
                    setCardSacrificed(cardEntity.realm, cardEntity.id, true)
                    return [...prevSelections, cardEntity];
                }
            });
        } else if (attackMode === 'BOOST') {
            handleBoostCard(cardEntity);
        } else if (attackMode !== 'NONE') {
            setSelectedCard(cardEntity);
        }
    };

    function handleBoostCard(cardEntity) {
        const { id, realm } = cardEntity;
        setAttackMode('NONE')
        const realmSetter = realm.charAt(0).toUpperCase() + realm.slice(1).toLowerCase(); // Convert to proper case

        switch (realmSetter) {
            case 'Solarium':
                setPlayerSolarium(prevRealm => {
                    return {
                        ...prevRealm,
                        people: prevRealm.people.map(card => {
                            if (card.id === id) {
                                return {
                                    ...card,
                                    steps: (card.steps || 0) + 1
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
                                    steps: (card.steps || 0) + 1
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
                                    steps: (card.steps || 0) + 1
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
                                    steps: (card.steps || 0) + 1
                                };
                            }
                            return card;
                        })
                    };
                });
                break;

            // Add cases for other realms as needed

            default:
                console.error('Invalid realm:', realm);
        }
    }

    const handleSacrificeConfirmation = () => {
        if (soulSelections.length >= rezCard.card.soul) {
            soulSelections.forEach(card => {
                handleDeadCard(card.realm, card.id, 'PLAYER');
            });
            setSoulSelections([]);
            setAwaitingSacrifices(false);
        } else {
            console.error("Not enough sacrifices selected!");
        }
    };

    const setCardSacrificed = (realm, cardId, sacrificed) => {
        if (realm === 'SOLARIUM') {
            setPlayerSolarium(prevRealm => {
                return {
                    ...prevRealm,
                    people: prevRealm.people.map(card =>
                        card.id === cardId ? { ...card, sacrificed: sacrificed } : card
                    ),
                };
            });
        }
        if (realm === 'THEATER') {
            setPlayerTheater(prevRealm => {
                return {
                    ...prevRealm,
                    people: prevRealm.people.map(card =>
                        card.id === cardId ? { ...card, sacrificed: sacrificed } : card
                    ),
                };
            });
        }
        if (realm === 'UNDERPASS') {
            setPlayerUnderpass(prevRealm => {
                return {
                    ...prevRealm,
                    people: prevRealm.people.map(card =>
                        card.id === cardId ? { ...card, sacrificed: sacrificed } : card
                    ),
                };
            });
        }
        if (realm === 'GRID') {
            setPlayerGrid(prevRealm => {
                return {
                    ...prevRealm,
                    people: prevRealm.people.map(card =>
                        card.id === cardId ? { ...card, sacrificed: sacrificed } : card
                    ),
                };
            });
        }
    };




    const handleEmptySlotSelect = (slotIndex) => {
        if (playerBattleSlots[slotIndex]) {
            return; // Return early if slot is not empty
        }
        if (selectedCard) {
            removeFromRealm(selectedCard, selectedCard.realm, 'PLAYER');
            setPlayerBattleSlots(prev => {
                const newSlots = [...prev];
                newSlots[slotIndex] = selectedCard;
                return newSlots;
            });
            setSelectedCard(null);
            setBattleRealm(selectedCard.realm.name)
        }
    };

    const handleBattleCardSelect = (cardEntity, slotIndex) => {
        if (!battleSelectedCard) {
            setBattleSelectedCard(cardEntity);
        } else {
            setPlayerBattleSlots(prev => {
                const newSlots = [...prev];
                const prevSelectedCardIndex = newSlots.findIndex(card => card === selectedCard);
                newSlots[prevSelectedCardIndex] = cardEntity;
                newSlots[slotIndex] = selectedCard;
                return newSlots;
            });
            setBattleSelectedCard(null);
        }
    };

    const returnToOriginalRealm = (cardEntity, side) => {
        const realm = cardEntity.realm;
        const updatedCardEntity = { ...cardEntity, steps: 0, active: false }; // todo

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

        if (side == 'PLAYER') {
            updateBattleSlots(setPlayerBattleSlots);
            switch (realm) {
                case 'SOLARIUM': updateRealm(setPlayerSolarium); break;
                case 'THEATER': updateRealm(setPlayerTheater); break;
                case 'UNDERPASS': updateRealm(setPlayerUnderpass); break;
                case 'GRID': updateRealm(setPlayerGrid); break;
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
        const updateRealm = (setRealmFunction) => {
            setRealmFunction(prev => ({
                ...prev,
                people: prev.people.filter(c => c.id !== cardEntity.id)
            }));
        };

        if (side === 'PLAYER') {
            switch (realm) {
                case 'SOLARIUM':
                    updateRealm(setPlayerSolarium);
                    break;
                case 'THEATER':
                    updateRealm(setPlayerTheater);
                    break;
                case 'UNDERPASS':
                    updateRealm(setPlayerUnderpass);
                    break;
                case 'GRID':
                    updateRealm(setPlayerGrid);
                    break;
                default:
                    console.error("Invalid realm: " + realm);
            }
        } else if (side === 'ENEMY') {
            switch (realm) {
                case 'Solarium':
                    updateRealm(setEnemySolarium);
                    break;
                case 'Theater':
                    updateRealm(setEnemyTheater);
                    break;
                case 'Underpass':
                    updateRealm(setEnemyUnderpass);
                    break;
                case 'Grid':
                    updateRealm(setEnemyGrid);
                    break;
                default:
                    console.error("Invalid realm: " + realm);
            }
        } else {
            console.error("Invalid side: " + side);
        }
    };


    const handleEnemyBattle = () => {
        for (let i = 0; i < 6; i++) {
            const attacker = enemyBattleSlots[i];
            const defenderSlot = playerBattleSlots[i];
            const defender = defenderSlot !== undefined ? playerBattleSlots[defenderSlot] : null;

            if (attacker) {
                commitAttack(attacker, defender, 'ENEMY');
            }
        }

        handleEndOfBattle();
    };

    const handlePlayerBattle = () => {
        for (let i = 0; i < 6; i++) {
            const attacker = playerBattleSlots[i];
            const defenderSlot = enemyBattleSlots[i];
            const defender = defenderSlot !== undefined ? enemyBattleSlots[defenderSlot] : null;

            if (attacker) {
                commitAttack(attacker, defender, 'PLAYER');
            }
        }
        handleEndOfBattle();
    };

    const handleEndOfBattle = () => {
        playerBattleSlots.forEach(cardEntity => {
            if (cardEntity) returnToOriginalRealm(cardEntity, 'PLAYER');
        });
        enemyBattleSlots.forEach(cardEntity => {
            if (cardEntity) returnToOriginalRealm(cardEntity, 'ENEMY');
        });

        // Clear battle slots for the next round
        setPlayerBattleSlots(Array(6).fill(null));
        setEnemyBattleSlots(Array(6).fill(null));
    };

    // TODO
    const handleConfirmDefenseSelection = () => {
        setGameState('ENEMY_ATTACKING');
        handleEnemyBattle()
        setGameState('ENEMY_PLANNING');
    };


    // const handleCancelSelection = () => {
    //     setPlayerBattleSelection([]);
    //     setSelectedCard(null);
    // };


    const handleDamage = (location, id, num, side) => {
        let cardToWound;

        switch (location) {
            case 'BATTLE':
                if (side == 'PLAYER') {
                    cardToWound = playerBattleSlots.find(cardEntity => cardEntity && cardEntity.id === id);
                } else {
                    cardToWound = enemyBattleSlots.find(cardEntity => cardEntity && cardEntity.id === id);
                }

                if (cardToWound) {
                    const newWounds = cardToWound.wounds + num;

                    if (newWounds >= cardToWound.card.HP) {
                        handleDeadCard(location, id, side);
                    }
                    else {
                        if (side == 'PLAYER') {
                            setPlayerBattleSlots(prev => {
                                return prev.map(card => {
                                    if (card && card.id === id) {
                                        return {
                                            ...card,
                                            wounds: newWounds
                                        };
                                    }
                                    return card;
                                });
                            });
                        } else {
                            setEnemyBattleSlots(prev => {
                                return prev.map(card => {
                                    if (card && card.id === id) {
                                        return {
                                            ...card,
                                            wounds: newWounds
                                        };
                                    }
                                    return card;
                                });
                            });
                        }
                    }
                }
                break;
            case 'SOLARIUM':
                if (side == 'PLAYER') {
                    cardToWound = playerSolarium.people.find(cardEntity => cardEntity.id === id);
                } else {
                    cardToWound = enemySolarium.people.find(cardEntity => cardEntity.id === id);
                }

                if (cardToWound) {
                    const newWounds = cardToWound.wounds + num;

                    if (newWounds >= cardToWound.card.HP) {
                        handleDeadCard(location, id, side);
                    }
                    else {
                        if (side == ' PLAYER') {
                            setPlayerSolarium(prevRealm => {
                                return {
                                    ...prevRealm,
                                    people: prevRealm.people.map(card => {
                                        if (card.id === id) {
                                            return {
                                                ...card,
                                                wounds: newWounds
                                            };
                                        }
                                        return card;
                                    })
                                };
                            });
                        } else {
                            setEnemySolarium(prevRealm => {
                                return {
                                    ...prevRealm,
                                    people: prevRealm.people.map(card => {
                                        if (card.id === id) {
                                            return {
                                                ...card,
                                                wounds: newWounds
                                            };
                                        }
                                        return card;
                                    })
                                };
                            });
                        }

                    }
                }
                break;
            case 'THEATER':
                if (side == 'PLAYER') {
                    cardToWound = playerTheater.people.find(cardEntity => cardEntity.id === id);
                } else {
                    cardToWound = enemyTheater.people.find(cardEntity => cardEntity.id === id);
                }
                if (cardToWound) {
                    const newWounds = cardToWound.wounds + num;

                    if (newWounds >= cardToWound.card.HP) {
                        handleDeadCard(location, id, side);
                    }
                    else {
                        if (side == ' PLAYER') {
                            setPlayerTheater(prevRealm => {
                                return {
                                    ...prevRealm,
                                    people: prevRealm.people.map(card => {
                                        if (card.id === id) {
                                            return {
                                                ...card,
                                                wounds: newWounds
                                            };
                                        }
                                        return card;
                                    })
                                };
                            });
                        } else {
                            setEnemyTheater(prevRealm => {
                                return {
                                    ...prevRealm,
                                    people: prevRealm.people.map(card => {
                                        if (card.id === id) {
                                            return {
                                                ...card,
                                                wounds: newWounds
                                            };
                                        }
                                        return card;
                                    })
                                };
                            });
                        }

                    }
                }
                break;
            case 'UNDERPASS':
                if (side == 'PLAYER') {
                    cardToWound = playerUnderpass.people.find(cardEntity => cardEntity.id === id);
                } else {
                    cardToWound = enemyUnderpass.people.find(cardEntity => cardEntity.id === id);
                }
                if (cardToWound) {
                    const newWounds = cardToWound.wounds + num;

                    if (newWounds >= cardToWound.card.HP) {
                        handleDeadCard(location, id, side);
                    }
                    else {
                        if (side == ' PLAYER') {
                            setPlayerUnderpass(prevRealm => {
                                return {
                                    ...prevRealm,
                                    people: prevRealm.people.map(card => {
                                        if (card.id === id) {
                                            return {
                                                ...card,
                                                wounds: newWounds
                                            };
                                        }
                                        return card;
                                    })
                                };
                            });
                        } else {
                            setEnemyUnderpass(prevRealm => {
                                return {
                                    ...prevRealm,
                                    people: prevRealm.people.map(card => {
                                        if (card.id === id) {
                                            return {
                                                ...card,
                                                wounds: newWounds
                                            };
                                        }
                                        return card;
                                    })
                                };
                            });
                        }

                    }
                }
                break;
            case 'GRID':
                if (side == 'PLAYER') {
                    cardToWound = playerGrid.people.find(cardEntity => cardEntity.id === id);
                } else {
                    cardToWound = enemyGrid.people.find(cardEntity => cardEntity.id === id);
                }

                if (cardToWound) {
                    const newWounds = cardToWound.wounds + num;

                    if (newWounds >= cardToWound.card.HP) {
                        handleDeadCard(location, id, side);
                    }
                    else {
                        if (side == ' PLAYER') {
                            setPlayerGrid(prevRealm => {
                                return {
                                    ...prevRealm,
                                    people: prevRealm.people.map(card => {
                                        if (card.id === id) {
                                            return {
                                                ...card,
                                                wounds: newWounds
                                            };
                                        }
                                        return card;
                                    })
                                };
                            });
                        } else {
                            setEnemyGrid(prevRealm => {
                                return {
                                    ...prevRealm,
                                    people: prevRealm.people.map(card => {
                                        if (card.id === id) {
                                            return {
                                                ...card,
                                                wounds: newWounds
                                            };
                                        }
                                        return card;
                                    })
                                };
                            });
                        }

                    }
                }
                break;

            default:
                console.error("Invalid location");
                return;
        }
    }


    const handleDeadCard = (location, id, side) => {
        let cardToRemove;
        switch (location) {
            case 'BATTLE':
                if (side == 'PLAYER') {
                    cardToRemove = playerBattleSlots.find(card => card && card.id === id);
                    setPlayerBattleSlots(prev => prev.filter(card => card && card.id !== id));
                } else {
                    cardToRemove = enemyBattleSlots.find(card => card && card.id === id);
                    setEnemyBattleSlots(prev => prev.filter(card => card && card.id !== id));
                }

                break;

            case 'SOLARIUM':
                if (side == 'PLAYER') {
                    cardToRemove = playerSolarium.people.find(card => card.id === id);
                    setPlayerSolarium(prevRealm => {
                        return {
                            ...prevRealm,
                            people: prevRealm.people.filter(card => card.id !== id)
                        };
                    });
                } else {
                    cardToRemove = enemySolarium.people.find(card => card.id === id);
                    setEnemySolarium(prevRealm => {
                        return {
                            ...prevRealm,
                            people: prevRealm.people.filter(card => card.id !== id)
                        };
                    });
                }
                break;

            case 'THEATER':
                if (side == 'PLAYER') {
                    cardToRemove = playerTheater.people.find(card => card.id === id);
                    setPlayerTheater(prevRealm => {
                        return {
                            ...prevRealm,
                            people: prevRealm.people.filter(card => card.id !== id)
                        };
                    });
                } else {
                    cardToRemove = enemyTheater.people.find(card => card.id === id);
                    setEnemyTheater(prevRealm => {
                        return {
                            ...prevRealm,
                            people: prevRealm.people.filter(card => card.id !== id)
                        };
                    });
                }

                break;

            case 'UNDERPASS':
                if (side == 'PLAYER') {
                    cardToRemove = playerUnderpass.people.find(card => card.id === id);
                    setPlayerUnderpass(prevRealm => {
                        return {
                            ...prevRealm,
                            people: prevRealm.people.filter(card => card.id !== id)
                        };
                    });
                    break;
                } else {
                    cardToRemove = enemyUnderpass.people.find(card => card.id === id);
                    setEnemyUnderpass(prevRealm => {
                        return {
                            ...prevRealm,
                            people: prevRealm.people.filter(card => card.id !== id)
                        };
                    });
                    break;
                }


            case 'GRID':
                if (side == 'PLAYER') {
                    cardToRemove = playerGrid.people.find(card => card.id === id);
                    setPlayerGrid(prevRealm => {
                        return {
                            ...prevRealm,
                            people: prevRealm.people.filter(card => card.id !== id)
                        };
                    });
                } else {
                    cardToRemove = enemyGrid.people.find(card => card.id === id);
                    setEnemyGrid(prevRealm => {
                        return {
                            ...prevRealm,
                            people: prevRealm.people.filter(card => card.id !== id)
                        };
                    });
                }
                break;

            default:
                console.error("Invalid location");
                return;
        }
        if (cardToRemove) {
            if (side == 'PLAYER') {
                setPlayerGraveyard(prev => [...prev, cardToRemove]);
                playerGainAshes(1);
            } else {
                setEnemyGraveyard(prev => [...prev, cardToRemove]);
                enemyGainAshes(1);
            }
        }

    }

    const handleRezPlayerCard = (entity) => {
        const soulsAvailable = calculateSoulsAvailable(entity.id);
        if (entity.rezzed) {
            return;
        }
        if (playerBits < entity.card.rezCost || playerAshes < entity.card.ash || soulsAvailable < entity.card.soul) {
            console.log('no resources')
            //console.error("Not enough resources to rez the card");
            return;
        }

        // const confirmation = window.confirm(`This will cost ${card.rezCost.bits} bits, ${card.rezCost.ashes} ashes, and ${card.rezCost.soul} soul. Do you want to proceed?`);
        // if (!confirmation) return;
        setRezCard(entity);
        setAwaitingSacrifices(true);
        if (entity.card.soul > 0) {
            // todo
        } else {
            setAwaitingSacrifices(false);
        }
    }

    const calculateSoulsAvailable = (id) => {
        const playerRealmsState = {
            Solarium: playerSolarium,
            Theater: playerTheater,
            Underpass: playerUnderpass,
            Grid: playerGrid,
        };

        return Object.values(playerRealmsState).reduce((sum, realm) => {
            if (realm.people) {
                // Filter out the card being rezzed, then count the remaining cards
                return sum + realm.people.filter(card => card.id !== id).length;
            }
            return sum;
        }, 0);
    };




    const handleRealmSelect = (realmName) => {
        if (!selectedCard) return;
        const { magi, phys, tech } = selectedCard.card;

        if (!selectedCard) return;
        if (battleSelectedCard) {
            returnToOriginalRealm(battleSelectedCard, 'PLAYER');
            setBattleSelectedCard(null);
        }

        switch (realmName) {
            case 'Solarium':
                if (magi) {
                    const updatedCard = { ...selectedCard, realm: 'SOLARIUM' };
                    setPlayerSolarium(prevRealm => {
                        return {
                            ...prevRealm,
                            people: [...prevRealm.people, updatedCard] // Add the updated card to the realm
                        };
                    });
                    playerLoseActions(1);

                    // Remove the original card from the player's hand
                    setPlayerHand(prevHand => prevHand.filter(card => card.id !== selectedCard.id));

                    setSelectedCard(null);
                }
                break;
            case 'Theater':
                if (magi || phys) {
                    const updatedCard = { ...selectedCard, realm: 'THEATER' };
                    setPlayerTheater(prevRealm => {
                        return {
                            ...prevRealm,
                            people: [...prevRealm.people, updatedCard]
                        };
                    });
                    playerLoseActions(1);
                    setPlayerHand(prevHand => prevHand.filter(card => card.id !== selectedCard.id));
                    setSelectedCard(null);
                }
                break;
            case 'Underpass':
                if (tech || phys) {
                    const updatedCard = { ...selectedCard, realm: 'UNDERPASS' };
                    setPlayerUnderpass(prevRealm => {
                        return {
                            ...prevRealm,
                            people: [...prevRealm.people, updatedCard]
                        };
                    });
                    playerLoseActions(1);
                    setPlayerHand(prevHand => prevHand.filter(card => card.id !== selectedCard.id));
                    setSelectedCard(null);
                }
                break;
            case 'Grid':
                if (tech) {
                    const updatedCard = { ...selectedCard, realm: 'GRID' };
                    setPlayerGrid(prevRealm => {
                        return {
                            ...prevRealm,
                            people: [...prevRealm.people, updatedCard]
                        };
                    });
                    playerLoseActions(1);
                    setPlayerHand(prevHand => prevHand.filter(card => card.id !== selectedCard.id));
                    setSelectedCard(null);
                }
                break;
        }
    };

    function enemyTurn() {
        setEnemyTurnPhase('gainActionsAndBits');
    }

    function handleEnemyTurn() {
        enemyTurn();
    }

    function handlePlayerTurn() {
        playerTurn();
    }

    function playerTurn() {
        playerGainActions(3);
        playerAdvanceCards();
        playerDraw(1);
    }

    function enemyRezCards() {
        const rezActiveCards = (cardList) => {
            return cardList.map(cardEntity => {
                if (cardEntity.card.timer && cardEntity.steps >= cardEntity.card.timer) {
                    return {
                        ...cardEntity,
                        rezzed: true
                    };
                }
                return cardEntity;
            });
        };

        setEnemySolarium(prevRealm => {
            return {
                ...prevRealm,
                people: rezActiveCards(prevRealm.people)
            };
        });

        setEnemyTheater(prevRealm => {
            return {
                ...prevRealm,
                people: rezActiveCards(prevRealm.people)
            };
        });

        setEnemyUnderpass(prevRealm => {
            return {
                ...prevRealm,
                people: rezActiveCards(prevRealm.people)
            };
        });

        setEnemyGrid(prevRealm => {
            return {
                ...prevRealm,
                people: rezActiveCards(prevRealm.people)
            };
        });
    }

    const getMatchingCreaturesForAspect = (realmCreatures, aspect, stat) => {
        return realmCreatures.filter(creature => {
            if (!creature.active) return false;

            if (creature.card[aspect]) {
                if (creature.card.magi && creature.card.phys ||
                    creature.card.magi && creature.card.tech ||
                    creature.card.phys && creature.card.tech) {
                    const maxStat = Math.max(creature.card.WIS, creature.card.STR, creature.card.DEX);
                    return creature.card[stat] === maxStat;
                }
                return true;
            }
            return false;
        });
    }
    const enemyPlanAttack = () => {
        const realms = [enemySolarium, enemyTheater, enemyUnderpass, enemyGrid];
        const attackOrder = [
            { aspect: 'magi', stat: 'WIS' },
            { aspect: 'phys', stat: 'STR' },
            { aspect: 'tech', stat: 'DEX' }
        ];
        const newSlots = Array(6).fill(null);

        for (const realm of realms) {
            for (const attack of attackOrder) {
                const matchingCreatures = getMatchingCreaturesForAspect(realm.people, attack.aspect, attack.stat);

                if (matchingCreatures.length > 0) {

                    setBattleRealm(realm.name);
                    for (let i = 0; i < newSlots.length; i++) {
                        if (!newSlots[i] && matchingCreatures.length > 0) {
                            const creature = matchingCreatures[0];

                            removeFromRealm(creature, creature.realm, 'ENEMY');
                            newSlots[i] = creature;
                            matchingCreatures.splice(0, 1);
                        }
                    }
                    setEnemyBattleSlots(newSlots);

                    setAttackMode(`ENEMY_${attack.aspect}`);
                    setGameState('WAITING_FOR_PLAYER_DEFENSE');
                    return;  // Exit after planning one attack
                }
            }
        }
        setGameState('ENEMY_ATTACK_COMPLETE');
    };



    function commitAttack(attacker, defender = null, side) {
        setAttackMode('NONE')
        let attackerDamage, defenderDamage;

        switch (attackMode) {
            case 'ENEMY_phys':
                attackerDamage = attacker.card.STR;
                defenderDamage = defender ? defender.card.STR : 0;
                break;
            case 'PLAYER_RAID':
                attackerDamage = attacker.card.STR;
                defenderDamage = defender ? defender.card.STR : 0;
                break;
            case 'ENEMY_magi':
                attackerDamage = attacker.card.WIS;
                defenderDamage = defender ? defender.card.WIS : 0;
                break;
            case 'PLAYER_QUEST':
                attackerDamage = attacker.card.WIS;
                defenderDamage = defender ? defender.card.WIS : 0;
                break;
            case 'HACK':
                attackerDamage = attacker.card.DEX;
                defenderDamage = defender ? defender.card.DEX : 0;
                // TODO: handle later
                break;
        }

        if (defender) {
            handleDamage('BATTLE', defender.id, attackerDamage, side); // Assumes the realm is passed or globally available
            handleDamage('BATTLE', attacker.id, defenderDamage, side);
        } else {
            // Handle unblocked damage
            switch (attackMode) {
                case 'ENEMY_phys':
                    if (['UNDERPASS', 'GRID'].includes(battleRealm)) {
                        playerGainWounds(attackerDamage);
                    } else if (['THEATER', 'SOLARIUM'].includes(battleRealm)) {
                        playerGainBurden(attackerDamage);
                    }
                    break;
                case 'PLAYER_RAID':
                    if (['UNDERPASS', 'GRID'].includes(battleRealm)) {
                        enemyGainWounds(attackerDamage);

                    } else if (['THEATER', 'SOLARIUM'].includes(battleRealm)) {
                        enemyGainBurden(attackerDamage);
                    }
                    break;
                case 'ENEMY_magi':
                    enemyGainFate(attackerDamage);
                    break;
                case 'PLAYER_QUEST':
                    playerGainFate(attackerDamage);
                    break;
                case 'HACK':
                    // TODO: handle later
                    break;
            }
        }

        // Return surviving creatures to their hosting realm
        // This may be done automatically based on how you've set up the game state
    }

    function playerAdvanceCards() {
        const advanceCardList = (cardList) => {
            return cardList.map(cardEntity => {
                if ("steps" in cardEntity) {
                    const newSteps = cardEntity.steps + 1;
                    let updatedCard = { ...cardEntity, steps: newSteps };

                    if (cardEntity.card.timer && newSteps >= cardEntity.card.timer) {
                        updatedCard.active = true;
                    }
                    return updatedCard;
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
                if ("steps" in cardEntity) {
                    const newSteps = cardEntity.steps + 1;
                    let updatedCard = { ...cardEntity, steps: newSteps };

                    // Check if the card should be activated
                    if (cardEntity.card.timer && newSteps >= cardEntity.card.timer) {
                        updatedCard.active = true;
                    }

                    // Placeholder for handling places/things scoring
                    if (cardEntity.card.promoCost && newSteps >= cardEntity.card.promoCost) {
                        // scoreEnemyCard();
                    }

                    return updatedCard;
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

    function generateRandomInteger(max) {
        return Math.floor(Math.random() * max) + 1;
    }

    function enemyAction() {
        if (enemyActions > 0) {
            if (enemyHand.length > 0) {
                enemyPlayCard();
                enemyLoseActions(1);
            } else {
                enemyDraw(1);
                enemyLoseActions(1);
            }
        }
    }


    function enemyDraw(num) {
        let remainingCards = num;

        if (enemyWounds > 0) {
            const newWounds = enemyWounds - num;

            remainingCards = Math.max(0, newWounds * -1);
            setEnemyWounds(Math.max(0, newWounds));
        }
        if (remainingCards > 0) {
            const newHandCards = enemyLibrary.slice(0, remainingCards);
            const newLibrary = enemyLibrary.slice(remainingCards, enemyLibrary.length);

            setEnemyHand(prevHand => [
                ...prevHand,
                ...newHandCards
            ]);
            setEnemyLibrary(newLibrary);
        }
    }

    function enemyPlayCard() {
        if (enemyHand.length === 0) return;

        const cardToPlay = enemyHand[0];
        const { magi, phys, tech } = cardToPlay.card;

        let realmToPlayIn = null;

        // Determine which realm to play the card based on priority and attributes
        const priorityList = priorityLeft ? ['Solarium', 'Theater', 'Underpass', 'Grid'] : ['Grid', 'Underpass', 'Theater', 'Solarium'];

        for (let realmName of priorityList) {
            if ((realmName === 'Solarium' && magi) ||
                (realmName === 'Theater' && (magi || phys)) ||
                (realmName === 'Underpass' && (tech || phys)) ||
                (realmName === 'Grid' && tech)) {
                realmToPlayIn = realmName;
                break;
            }
        }

        // Play the card in the determined realm and update states
        if (realmToPlayIn) {
            switch (realmToPlayIn) {
                case 'Solarium':
                    setEnemySolarium(prevRealm => {
                        const updatedCardToPlay = { ...cardToPlay, realm: realmToPlayIn };
                        return {
                            ...prevRealm,
                            people: [...prevRealm.people, updatedCardToPlay]
                        };
                    });
                    break;
                case 'Theater':
                    setEnemyTheater(prevRealm => {
                        const updatedCardToPlay = { ...cardToPlay, realm: realmToPlayIn };
                        return {
                            ...prevRealm,
                            people: [...prevRealm.people, updatedCardToPlay]
                        };
                    });
                    break;
                case 'Underpass':
                    setEnemyUnderpass(prevRealm => {
                        const updatedCardToPlay = { ...cardToPlay, realm: realmToPlayIn };
                        return {
                            ...prevRealm,
                            people: [...prevRealm.people, updatedCardToPlay]
                        };
                    });
                    break;
                case 'Grid':
                    setEnemyGrid(prevRealm => {
                        const updatedCardToPlay = { ...cardToPlay, realm: realmToPlayIn };
                        return {
                            ...prevRealm,
                            people: [...prevRealm.people, updatedCardToPlay]
                        };
                    });
                    break;
            }

            // Remove card from enemy's hand
            setEnemyHand(prevHand => prevHand.filter(card => card.id !== cardToPlay.id));
        }
    }

    function handleBoostButton() {
        playerLoseActions(1);
        playerLoseBits(1);
        setAttackMode('BOOST')
    }

    function handleDrawButton() {
        playerDraw(1);
        playerLoseActions(1);
    }

    function handleDraftButton() {
        playerDraft(1);
        playerLoseActions(1);
    }

    function playerDraw(num) {
        let remainingCards = num;

        if (playerWounds > 0) {
            const newWounds = playerWounds - num;

            remainingCards = Math.max(0, newWounds * -1);
            setPlayerWounds(Math.max(0, newWounds));
        }
        if (remainingCards > 0) {
            const newHandCards = playerLibrary.slice(0, remainingCards);
            const newLibrary = playerLibrary.slice(remainingCards, playerLibrary.length);

            setPlayerHand(prevHand => [
                ...prevHand,
                ...newHandCards
            ]);
            setPlayerLibrary(newLibrary);
        }
    }

    function playerGainBurden(num) {
        setPlayerBurden(prevBurden => prevBurden + num);
    }

    function playerLoseBurden(num) {
        setPlayerBurden(playerBurden - num);
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
        setPlayerFate(playerFate - num);
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
        setEnemyFate(enemyFate - num);
    }

    function playerGainWounds(num) {
        setPlayerWounds(prevWounds => prevWounds + num);
    }

    function playerLoseWounds(num) {
        setPlayerWounds(playerWounds - num);
    }

    function enemyGainBurden(num) {
        setEnemyBurden(prevBurden => prevBurden + num);
    }

    function enemyLoseBurden(num) {
        setEnemyBurden(enemyBurden - num);
    }

    function enemyGainWounds(num) {
        setEnemyWounds(prevWounds => prevWounds + num);
    }

    function enemyLoseWounds(num) {
        setEnemyWounds(enemyWounds - num);
    }

    function playerDraft(num) {
        let remainingCards = num;

        if (playerWounds > 0) {
            const newWounds = playerWounds - num;

            remainingCards = Math.max(0, newWounds * -1);
            setPlayerWounds(Math.max(0, newWounds));
        }
        if (remainingCards > 0) {
            const newHandCards = draft.slice(0, remainingCards);
            const newDraft = draft.slice(remainingCards, draft.length);

            setPlayerHand(prevHand => [
                ...prevHand,
                ...newHandCards
            ]);
            setDraft(newDraft);
        }
    }

    function handlePlayerMine() {
        playerGainBits(1);
        playerLoseActions(1);
    }

    function playerGainBits(num) {
        let remainingBits = num;

        if (playerDebt > 0) {
            const newDebt = playerDebt - num;

            remainingBits = Math.max(0, newDebt * -1);
            setPlayerDebt(Math.max(0, newDebt));
        }
        setPlayerBits(prevBits => prevBits + remainingBits);
    }

    function playerLoseBits(num) {
        setPlayerBits(playerBits - num);
    }

    function enemyGainBits(num) {
        let remainingBits = num;

        if (enemyDebt > 0) {
            const newDebt = enemyDebt - num;

            remainingBits = Math.max(0, newDebt * -1);
            setEnemyDebt(Math.max(0, newDebt));
        }
        setEnemyBits(prevBits => prevBits + remainingBits);
    }

    function enemyLoseBits(num) {
        setEnemyBits(enemyBits - num);
    }

    function enemyGainActions(num) {
        setEnemyActions(prevActions => prevActions + num);
    }

    function enemyLoseActions(num) {
        setEnemyActions(prevActions => Math.max(0, prevActions - num));
    }

    function enemyGainAshes(num) {
        setEnemyAshes(prevAshes => prevAshes + num);
    }

    function enemyLoseAshes(num) {
        setEnemyAshes(enemyAshes - num);
    }

    function playerGainActions(num) {
        setPlayerActions(prevActions => prevActions + num);
    }

    function playerLoseActions(num) {
        setPlayerActions(prevActions => prevActions - num);
    }

    function enemyLoseActions(num) {
        setEnemyActions(enemyActions - num);
    }

    function playerGainAshes(num) {
        setPlayerAshes(prevAshes => prevAshes + num);
    }

    function playerLoseAshes(num) {
        setPlayerAshes(playerAshes - num);
    }

    return (
        <div className="game-container">
            <Gameboard
                realmComponents={realmComponents}
                onRealmSelect={handleRealmSelect}
                playerOneLibrary={playerLibrary}
                playerOneHand={playerHand}
                playerBoost={handleBoostButton}
                playerDraw={handleDrawButton}
                playerDraft={handleDraftButton}
                playerActions={playerActions}
                playerFate={playerFate}
                playerWounds={playerWounds}
                playerBits={playerBits}
                playerDebt={playerDebt}
                playerBurden={playerBurden}
                playerMine={handlePlayerMine}
                playerAshes={playerAshes}
                playerSolarium={playerSolarium}
                playerTheater={playerTheater}
                playerUnderpass={playerUnderpass}
                playerGrid={playerGrid}
                onCardSelect={handleCardSelect}
                onRealmCardSelect={handleRealmCardSelect}
                onQuest={handleQuest}
                onRaid={handleRaid}
                playerBattleSlots={playerBattleSlots}
                enemyBattleSlots={enemyBattleSlots}
                onSlotSelect={handleEmptySlotSelect}
                onBattleCardSelect={handleBattleCardSelect}
                onConfirmDefenseSelection={handleConfirmDefenseSelection}
                onPlayerBattle={handlePlayerBattle}
                attackMode={attackMode}
                onRezPlayerCard={handleRezPlayerCard}
                onSacrificeConfirmation={handleSacrificeConfirmation}
                awaitingSacrifices={awaitingSacrifices}
                enemyHand={enemyHand}
                onEnemyTurn={handleEnemyTurn}
                onPlayerTurn={handlePlayerTurn}
                gameState={gameState}
                enemyActions={enemyActions}
                enemySolarium={enemySolarium}
                enemyTheater={enemyTheater}
                enemyUnderpass={enemyUnderpass}
                enemyGrid={enemyGrid}
                battleRealm={battleRealm}
            />
        </div>
    );
}

export default BoardContainer;
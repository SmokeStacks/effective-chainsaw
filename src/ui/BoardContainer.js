import React, { Component, useState } from 'react';

import Gameboard from "./Gameboard";
import RealmCreatures from "./RealmCreatures";

import { Realm, SharedSlot } from '/Users/wyrm/Documents/coding/TMP/tempi/src/rules/cards.ts'
import { libraryOne } from '/Users/wyrm/Documents/coding/TMP/tempi/src/playerDecks/deckOne.ts'
import { draftList } from '/Users/wyrm/Documents/coding/TMP/tempi/src/systemDecks/draft.ts'
import { enemyOne } from '/Users/wyrm/Documents/coding/TMP/tempi/src/systemDecks/enemyOne.ts'


// SolariumRealm.js
function Solarium({ onRealmSelect, onRealmCardSelect, realmState }) {
    return (
        <div className="realm solarium" onClick={() => onRealmSelect('SOLARIUM')}>
            Solarium
            <div className="slot-holder"></div>
            <div className="creatures-container">
                <RealmCreatures cards={realmState.people} onCardSelect={onRealmCardSelect} />
            </div>
        </div>
    );
}

function Theater({ onRealmSelect }) {
    return (
        <div className="realm theater" onClick={() => onRealmSelect('THEATER')}>
            Theater
            <div className="slot-container">
                <div className="slot-holder">
                    <div className="place-slot" id="1"></div>
                    <div className="place-slot" id="2"></div>
                    <div className="place-slot" id="3"></div>
                    <div className="place-slot" id="4"></div>
                </div>
            </div>
        </div>
    );
}

// UnderpassRealm.js
function Underpass({ onRealmSelect }) {
    return (
        <div className="realm underpass" onClick={() => onRealmSelect('UNDERPASS')}>
            Underpass
            <div className="slot-container">
                <div className="slot-holder">
                    <div className="place-slot" id="5"></div>
                    <div className="place-slot" id="6"></div>
                    <div className="place-slot" id="7"></div>
                </div>
                <div className="slot-holder">
                    <div className="thing-slot" id="8"></div>
                    <div className="thing-slot" id="9"></div>
                    <div className="thing-slot" id="10"></div>
                </div>
            </div>
        </div>
    );
}

// GridRealm.js
function Grid({ onRealmSelect }) {
    return (
        <div className="realm grid" onClick={() => onRealmSelect('GRID')}>
            Grid
            <div className="slot-container">
                <div className="slot-holder">
                    <div className="thing-slot" id="12"></div>
                    <div className="thing-slot" id="13"></div>
                    <div className="thing-slot" id="14"></div>
                    <div className="thing-slot" id="15"></div>
                </div>
            </div>
        </div>
    );
}

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
                steps: 0
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
                steps: 0
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
                steps: 0
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
    const [playerDebt, setPlayerDebt] = useState(3);
    const [playerWounds, setPlayerWounds] = useState(2);

    const [enemyLibrary, setEnemyLibrary] = useState(createEnemyLibrary());
    const [enemyHand, setEnemyHand] = useState([]);
    const [enemyGraveyard, setEnemyGraveyard] = useState([]);
    const [priorityLeft, setPriorityLeft] = useState(true);
    const [enemyBits, setEnemyBits] = useState(0);
    const [enemyActions, setEnemyActions] = useState(2);
    const [enemyFate, setEnemyFate] = useState(0);
    const [enemyDebt, setEnemyDebt] = useState(3);
    const [enemyWounds, setEnemyWounds] = useState(3);


    const [selectedCard, setSelectedCard] = useState(null);
    const [playerBattleCreatures, setPlayerBattleCreatures] = useState([]);
    const [playerBattleSelection, setPlayerBattleSelection] = useState({}); // select creatures in Realm for battle
    const [playerAttackMode, setPlayerAttackMode] = useState('NONE');

    const [enemyBattleCreatures, setEnemyBattleCreatures] = useState([]);
    const [enemyAttackMode, setEnemyAttackMode] = useState('NONE');

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

    const handleCardSelect = (cardEntity) => {
        console.log('card select ', cardEntity.id)
        setSelectedCard(cardEntity);
    };

    const handleQuest = () => {
        setPlayerAttackMode('QUEST')
    };

    const handleRealmCardSelect = (cardEntity) => {
        console.log('card select ', cardEntity.id);
        if (playerAttackMode !== 'none') {
            setPlayerBattleSelection(prev => {
                if (prev[cardEntity.id]) { // select
                    const newSelection = { ...prev };
                    delete newSelection[cardEntity.id];
                    return newSelection;
                } else {
                    return { ...prev, [cardEntity.id]: cardEntity }; // deselect
                }
            });
        }
    };

    const handleConfirmBattleSelection = () => {
        setPlayerBattleCreatures(prev => [...prev, ...Object.values(playerBattleSelection)]);
        setPlayerBattleSelection({});
    };


    const handleCancelSelection = () => {
        setPlayerBattleSelection([]);
        setSelectedCard(null);
    };

    const handleDamage = (location, id, num) => {
        let cardToWound;

        switch (location) {
            case 'BATTLE':
                cardToWound = playerBattleCreatures.find(cardEntity => cardEntity.id === id);
                if (cardToWound) {
                    const newWounds = cardToWound.wounds + num;

                    if (newWounds >= cardToWound.card.HP) {
                        handleDeadPlayerCard(location, id);
                    }
                    else {
                        setPlayerBattleCreatures(prev => {
                            return prev.map(card => {
                                if (card.id === id) {
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
                break;
            case 'SOLARIUM':
                cardToWound = playerSolarium.people.find(cardEntity => cardEntity.id === id);
                if (cardToWound) {
                    const newWounds = cardToWound.wounds + num;

                    if (newWounds >= cardToWound.card.HP) {
                        handleDeadPlayerCard(location, id);
                    }
                    else {
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
                    }
                }
                break;
            case 'THEATER':
                cardToWound = playerTheater.people.find(cardEntity => cardEntity.id === id);
                if (cardToWound) {
                    const newWounds = cardToWound.wounds + num;

                    if (newWounds >= cardToWound.card.HP) {
                        handleDeadPlayerCard(location, id);
                    }
                    else {
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
                    }
                }
                break;
            case 'UNDERPASS':
                cardToWound = playerUnderpass.people.find(cardEntity => cardEntity.id === id);
                if (cardToWound) {
                    const newWounds = cardToWound.wounds + num;

                    if (newWounds >= cardToWound.card.HP) {
                        handleDeadPlayerCard(location, id);
                    }
                    else {
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
                    }
                }
                break;
            case 'GRID':
                cardToWound = playerGrid.people.find(cardEntity => cardEntity.id === id);
                if (cardToWound) {
                    const newWounds = cardToWound.wounds + num;

                    // If the new wounds are greater than or equal to the card's HP, remove it from Solarium
                    if (newWounds >= cardToWound.card.HP) {
                        handleDeadPlayerCard(location, id);
                    }
                    // If the card isn't dead, just update its wounds
                    else {
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
                    }
                }
                break;

            default:
                console.error("Invalid location");
                return;
        }
    }


    const handleDeadPlayerCard = (location, id) => {
        let cardToRemove;

        // Based on the location, find and remove the card
        switch (location) {
            case 'BATTLE':
                cardToRemove = playerBattleCreatures.find(card => card.id === id);
                setPlayerBattleCreatures(prev => prev.filter(card => card.id !== id));
                break;

            case 'SOLARIUM':
                cardToRemove = playerSolarium.people.find(card => card.id === id);
                setPlayerSolarium(prevRealm => {
                    return {
                        ...prevRealm,
                        people: prevRealm.people.filter(card => card.id !== id)
                    };
                });
                break;

            case 'THEATER':
                cardToRemove = playerTheater.people.find(card => card.id === id);
                setPlayerTheater(prevRealm => {
                    return {
                        ...prevRealm,
                        people: prevRealm.people.filter(card => card.id !== id)
                    };
                });
                break;

            case 'UNDERPASS':
                cardToRemove = playerUnderpass.people.find(card => card.id === id);
                setPlayerUnderpass(prevRealm => {
                    return {
                        ...prevRealm,
                        people: prevRealm.people.filter(card => card.id !== id)
                    };
                });
                break;

            case 'GRID':
                cardToRemove = playerGrid.people.find(card => card.id === id);
                setPlayerGrid(prevRealm => {
                    return {
                        ...prevRealm,
                        people: prevRealm.people.filter(card => card.id !== id)
                    };
                });
                break;

            default:
                console.error("Invalid location");
                return;
        }
        if (cardToRemove) {
            setPlayerGraveyard(prev => [...prev, cardToRemove]);
        }
        playerGainAshes(1);
    }

    const handleRezPlayerCard = (id) => {
        // check if rez cost can be paid

        // pay bits cost, playerLoseBits

        // pay soul cost
        // sacrifice # of creatures in any realm equal to cost
        // select creatures and then press confirm button

        // pay ash cost, playerLoseAshes

        // set rezzed to true on card entity
    }


    const handleRealmSelect = (realmName) => {
        console.log('realm ', realmName)
        console.log('selectedCard ', selectedCard)
        const {magi, phys, tech } = selectedCard.card;

        if (!selectedCard) return;

        switch (realmName) {
            case 'Solarium':
                if (magi) {
                    setPlayerSolarium(prevRealm => {
                        return {
                            ...prevRealm,
                            people: [...prevRealm.people, selectedCard]
                        };
                    });
                    playerLoseActions(1);
                    setPlayerHand(prevHand => prevHand.filter(card => card.id !== selectedCard.id));
                    setSelectedCard(null);
                }
                break;
            case 'Theater':
                if (magi || phys) {
                    setPlayerTheater(prevRealm => {
                        return {
                            ...prevRealm,
                            people: [...prevRealm.people, selectedCard]
                        };
                    });
                    playerLoseActions(1);
                    setPlayerHand(prevHand => prevHand.filter(card => card.id !== selectedCard.id));
                    setSelectedCard(null);
                }
                break;
            case 'Underpass':
                if (tech || phys) {
                    setPlayerUnderpass(prevRealm => {
                        return {
                            ...prevRealm,
                            people: [...prevRealm.people, selectedCard]
                        };
                    });
                    playerLoseActions(1);
                    setPlayerHand(prevHand => prevHand.filter(card => card.id !== selectedCard.id));
                    setSelectedCard(null);
                }
                break;
            case 'Grid':
                if (tech) {
                    setPlayerGrid(prevRealm => {
                        return {
                            ...prevRealm,
                            people: [...prevRealm.people, selectedCard]
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
        enemyGainActions(2);
        enemyGainBits(2);
        enemyAdvanceCards();
        enemyDraw(1);
        enemyAction();
        enemyRezCards();
        enemyPlanAttack();
        setPriorityLeft(!priorityLeft);
    }

    function enemyRezCards() {
        // for each creature in every realm Rez that card (for free) if it has steps >= that card's timer
    }

    function enemyPlanAttack() {
        // for each realm commence an attack with each creature who is active one at a time
    }

    function enemyAdvanceCards() {
        // Helper function to advance cards based on logic
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

    function enemyAction() {
        if (enemyHand.length > 0) {
            enemyPlayCard();
            enemyLoseActions(1);
        } else {
            enemyDraw(1);
            enemyLoseActions(1);
        }
        if (enemyActions > 0) {
            enemyAction();
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
        const {magi, phys, tech } = cardToPlay.card;
    
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
                        return {
                            ...prevRealm,
                            people: [...prevRealm.people, cardToPlay]
                        };
                    });
                    break;
                case 'Theater':
                    setEnemyTheater(prevRealm => {
                        return {
                            ...prevRealm,
                            people: [...prevRealm.people, cardToPlay]
                        };
                    });
                    break;
                case 'Underpass':
                    setEnemyUnderpass(prevRealm => {
                        return {
                            ...prevRealm,
                            people: [...prevRealm.people, cardToPlay]
                        };
                    });
                    break;
                case 'Grid':
                    setEnemyGrid(prevRealm => {
                        return {
                            ...prevRealm,
                            people: [...prevRealm.people, cardToPlay]
                        };
                    });
                    break;
            }
    
            // Remove card from enemy's hand
            setEnemyHand(prevHand => prevHand.filter(card => card.id !== cardToPlay.id));
        }
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



    function playerDraft(cardNum) {
        const newHandCards = draft.slice(0, cardNum);
        const newDraft = draft.slice(cardNum, draft.length);

        setPlayerHand(prevHand => [
            ...prevHand,
            ...newHandCards
        ]);
        setDraft(newDraft);
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
        setEnemyBits(playerBits - num);
    }

    function playerGainActions(num) {
        setPlayerActions(playerActions + num);
    }

    function playerLoseActions(num) {
        setPlayerActions(playerActions - num);
    }

    function enemyLoseActions(num) {
        setEnemyActions(enemyActions - num);
    }

    function playerGainAshes(num) {
        setPlayerAshes(playerAshes + num);
    }

    function playerLoseAshes(num) {
        setPlayerAshes(playerAshes - num);
    }

    function playerGainAshes(num) {
        setPlayerAshes(playerAshes + num);
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
                playerDraw={playerDraw}
                playerDraft={playerDraft}
                playerWounds={playerWounds}
                playerBits={playerBits}
                playerDebt={playerDebt}
                playerGainBits={playerGainBits}
                playerAshes={playerAshes}
                playerSolarium={playerSolarium}
                playerTheater={playerTheater}
                playerUnderpass={playerUnderpass}
                playerGrid={playerGrid}
                onCardSelect={handleCardSelect}
                onRealmCardSelect={handleRealmCardSelect}
                onQuest={handleQuest}
                onConfirmBattleSelection={handleConfirmBattleSelection}
                onCancelSelection={handleCancelSelection}
                playerBattleCreatures={playerBattleCreatures}
                enemyBattleCreatures={enemyBattleCreatures}
                playerAttackMode={playerAttackMode}
            />
        </div>
    );
}

export default BoardContainer;
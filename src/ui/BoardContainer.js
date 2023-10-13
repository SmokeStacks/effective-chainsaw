import React, { Component, useState } from 'react';

import Gameboard from "./Gameboard";

import { Realm, SharedSlot } from '/Users/wyrm/Documents/coding/TMP/tempi/src/rules/cards.ts'
import { libraryOne } from '/Users/wyrm/Documents/coding/TMP/tempi/src/playerDecks/deckOne.ts'
import { draftList } from '/Users/wyrm/Documents/coding/TMP/tempi/src/systemDecks/draft.ts'


// SolariumRealm.js
function Solarium({ onRealmSelect }) {
    return <div className="realm solarium" onClick={() => onRealmSelect('SOLARIUM')}>Solarium</div>;
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

const realms = [
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
    const [playerBits, setPlayerBits] = useState(0);
    const [playerActions, setPlayerActions] = useState(0);
    const [playerAshes, setPlayerAshes] = useState(0);
    const [playerFate, setPlayerFate] = useState(0);
    const [playerDebt, setPlayerDebt] = useState(3);
    const [playerWounds, setPlayerWounds] = useState(2);

    const [playerSolarium, setPlayerSolarium] = useState(createRealm('SOLARIUM', ['MAGI']));
    const [playerTheater, setPlayerTheater] = useState(createRealm('THEATER', ['MAGI', 'PHYS']));
    const [playerUnderpass, setPlayerUnderpass] = useState(createRealm('UNDERPASS', ['PHYS', 'TECH']));
    const [playerGrid, setPlayerGrid] = useState(createRealm('GRID', ['TECH']));

    const [playerTheaterPlaces, setPlayerTheaterPlaces] = useState(createSlotOperator(4, ['PLACE']));
    const [playerUnderpassPlaces, setPlayerUnderpassPlaces] = useState(createSlotOperator(3, ['PLACE']));
    const [playerUnderpassThings, setPlayerUnderpassThings] = useState(createSlotOperator(3, ['THING']));
    const [playerGridThings, setPlayerGridThings] = useState(createSlotOperator(4, ['THING']));

    const [selectedCard, setSelectedCard] = useState(null);

    const handleCardSelect = (cardEntity) => {
        console.log('card select ', cardEntity.id )
        setSelectedCard(cardEntity);
    };

    const handleRealmSelect = (realmName) => {
        console.log('realm ', realmName)
        console.log('selectedCard ', selectedCard)
        if (!selectedCard) return;

        switch (realmName) {
            case 'Solarium':
                setPlayerSolarium(prevRealm => {
                    return {
                        ...prevRealm,
                        people: [...prevRealm.people, selectedCard]
                    };
                });
                break;
            case 'Theater':
                setPlayerTheater(prevRealm => {
                    return {
                        ...prevRealm,
                        people: [...prevRealm.people, selectedCard]
                    };
                });
            case 'Underpass':
                setPlayerUnderpass(prevRealm => {
                    return {
                        ...prevRealm,
                        people: [...prevRealm.people, selectedCard]
                    };
                });
            case 'Grid':
                setPlayerGrid(prevRealm => {
                    return {
                        ...prevRealm,
                        people: [...prevRealm.people, selectedCard]
                    };
                });
                break;
        }

        // Remove card from hand
        setPlayerHand(prevHand => prevHand.filter(card => card.id !== selectedCard.id));
        // Reset selected card state
        setSelectedCard(null);
    };



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

    function playerGainActions(num) {
        setPlayerActions(playerActions + num);
    }

    function playerLoseActions(num) {
        setPlayerActions(playerActions - num);
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
            realms={realms}
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
            onCardSelect={handleCardSelect} />
        </div>
    );
}

export default BoardContainer;
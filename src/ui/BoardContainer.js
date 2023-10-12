import React, { Component, useState } from 'react';

import Gameboard from "./Gameboard";
import { libraryOne } from '/Users/wyrm/Documents/coding/TMP/tempi/src/playerDecks/deckOne.ts'
import { draftList } from '/Users/wyrm/Documents/coding/TMP/tempi/src/systemDecks/draft.ts'

function TheaterRealm() {
    return (
        <div className="realm theater">
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

// SolariumRealm.js
function SolariumRealm() {
    return <div className="realm solarium">Solarium</div>;
}

// UnderpassRealm.js
function UnderpassRealm() {
    return (
        <div className="realm underpass">
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
                    <div className="thing-slot" id="11"></div>
                </div>
            </div>
        </div>
    );
}

// GridRealm.js
function GridRealm() {
    return (
        <div className="realm grid">
            Grid
            <div className="slot-container">
                <div className="slot-holder">
                    <div className="thing-slot" id="12"></div>
                    <div className="thing-slot" id="13"></div>
                    <div className="thing-slot" id="14"></div>
                    <div className="thing-slot" id="15"></div>
                    <div className="thing-slot" id="16"></div>
                </div>
            </div>
        </div>
    );
}

const realms = [
    <SolariumRealm />,
    <TheaterRealm />,
    <UnderpassRealm />,
    <GridRealm />
];

// class PlayerBoard {
//     graveyard: Graveyard = new Graveyard();
//     hand: Hand = new Hand();
//     library: Library = new Library();
//     realms: Realm[] = [
//         new Realm('SOLARIUM'),
//         new Realm('THEATER'),
//         new Realm('UNDERPASS'),
//         new Realm('GRID'),
//     ];
//     focus: Focus = 'MIND'; // Set the initial focus
//     // Other properties and methods as needed
// }

export function BoardContainer() {
    const createLibrary = () => {
        const libraryInstanceArray = [];
        for (let i = 0; i < libraryOne.length; i++) {
            const card = libraryOne[i];
            const cardEntityInstance = {
                id: i.toString(),
                card: card,
                wounds: 0,
                online: false,
                exposed: false,
                scored: false
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
                online: false,
                exposed: false,
                scored: false
            };
            draftInstanceArray.push(cardEntityInstance);
        }
        return draftInstanceArray;
    };

    const [playerLibrary, setPlayerLibrary] = useState(createLibrary());
    const [draft, setDraft] = useState(createDraft());
    const [playerHand, setPlayerHand] = useState([]);
    const [playerBits, setPlayerBits] = useState(0);
    const [playerActions, setPlayerActions] = useState(0);
    const [playerAshes, setPlayerAshes] = useState(0);
    const [playerFate, setPlayerFate] = useState(0);
    const [playerDebt, setPlayerDebt] = useState(3);
    const [playerWounds, setPlayerWounds] = useState(2);

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
            <Gameboard realms={realms} playerOneLibrary={playerLibrary} playerOneHand={playerHand} playerDraw={playerDraw} playerDraft={playerDraft} playerWounds={playerWounds} playerBits={playerBits} playerDebt={playerDebt} playerGainBits={playerGainBits} playerAshes={playerAshes} />
        </div>
    );
}

export default BoardContainer;
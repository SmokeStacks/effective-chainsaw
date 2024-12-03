import React, { Component, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import {
    Solarium,
    Theater,
    Underpass,
    Grid,
    Elysium
} from './renders/Board';
import BidInputModal from './BidInputModal';
import { eventManager } from "./Tools";

import Gameboard from './Gameboard';

import { Realm, SharedSlot } from '../rules/cards.ts'
import { cardList1 } from '../playerDecks/deckTwo.ts'
import { draftList } from '../systemDecks/draft.ts'
import { cardList2 } from '../systemDecks/enemyOne.ts'

import { cardList } from '../rules/binder.ts'

const realmComponents = [
    Solarium,
    Theater,
    Underpass,
    Grid,
    Elysium
];


export function BoardContainer() {
    function shuffle(array) {
        let currentIndex = array.length;
        while (currentIndex !== 0) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
    }

    const createLibrary = () => {
        const libraryInstanceArray = [];
        for (let i = 0; i < cardList1.length; i++) { //todo1 scheming
            const card = cardList1[i];
            const cardEntityInstance = {
                id: `a${i.toString()}`,
                card: card,
                power: card.power || 0,
                HP: card.HP || 0,
                wounds: 0,
                exposed: false,
                scored: false,
                online: false,
                readied: false,
                steps: 0,
                freeze: 0,
                decay: 0,
                venom: 0,
                charge: card.charge || 0,
                sacrificed: false,
                cosmic: card.cosmic || 1,
                deathless: card.deathless || 0,
                pounce: card.pounce || 0,
                override: card.override || 0,
                stealth: card.stealth || 0,
                armored: card.armored || 0,
                development: card.development || 0,
                plot: card.plot || 0,
                owner: 'PLAYER',
            };
            libraryInstanceArray.push(cardEntityInstance);
        }
        shuffle(libraryInstanceArray);
        return libraryInstanceArray;
    };

    const createEnemyLibrary = () => {
        const libraryInstanceArray = [];
        for (let i = 0; i < cardList2.length; i++) {
            const card = cardList2[i];
            const cardEntityInstance = {
                id: `b${i.toString()}`,
                card: card,
                power: card.power || 0,
                HP: card.HP || 0,
                wounds: 0,
                exposed: false,
                scored: false,
                online: false,
                readied: false,
                steps: 0,
                freeze: 0,
                decay: 0,
                venom: 0,
                charge: card.charge || 0,
                sacrificed: false,
                cosmic: card.cosmic || 1,
                deathless: card.deathless || 0, //todo1
                pounce: card.pounce || 0,
                override: card.override || 0,
                stealth: card.stealth || 0,
                armored: card.armored || 0,
                development: card.development || 0,
                plot: card.plot || 0,
                owner: 'ENEMY',
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
                id: `c${i.toString()}`,
                card: card,
                power: card.power || 0,
                HP: card.HP || 0,
                wounds: 0,
                exposed: false,
                scored: false,
                online: false,
                readied: false,
                steps: 0,
                freeze: 0,
                decay: 0,
                venom: 0,
                charge: card.charge || 0,
                sacrificed: false,
                cosmic: card.cosmic || 1,
                deathless: card.deathless || 0, //todo1
                pounce: card.pounce || 0,
                override: card.override || 0,
                stealth: card.stealth || 0,
                armored: card.armored || 0,
                development: card.development || 0,
                plot: card.plot || 0,
                owner: 'ENEMY',
            };
            draftInstanceArray.push(cardEntityInstance);
        }
        return draftInstanceArray;
    };

    function createRealm(name, elements) {
        return new Realm(name, elements);
    }

    const [playerLibrary, setPlayerLibrary] = useState(createLibrary());
    const [draft, setDraft] = useState(createDraft());
    const [playerHand, setPlayerHand] = useState([]);
    const [playerGraveyard, setPlayerGraveyard] = useState([]);
    const [playerBits, setPlayerBits] = useState(0);
    const [playerActions, setPlayerActions] = useState(0);
    const [playerAshes, setPlayerAshes] = useState(0);
    const [playerFate, setPlayerFate] = useState(0);
    const [playerOverload, setPlayerOverload] = useState(0);
    const [playerWounds, setPlayerWounds] = useState(0);
    const [playerBurden, setPlayerBurden] = useState(0);
    const [playerSurge, setPlayerSurge] = useState(0);
    const [playerLag, setPlayerLag] = useState(0);
    const [focus, setFocus] = useState('');
    const [awaitingFocus, setAwaitingFocus] = useState(true);

    const [playerPandoraAccess, setPlayerPandoraAccess] = useState(1);
    const [playerHeadSpaceAccess, setPlayerHeadSpaceAccess] = useState(1);
    const [playerGlitchyAmount, setPlayerGlitchyAmount] = useState(0);
    const [playerDividendAmount, setPlayerDividendAmount] = useState(0);
    const [enemyGlitchyAmount, setEnemyGlitchyAmount] = useState(0);
    const [enemyDividendAmount, setEnemyDividendAmount] = useState(2);


    const [soulSelections, setSoulSelections] = useState([]);
    const [awaitingSacrifices, setAwaitingSacrifices] = useState(false);
    const [rezCard, setRezCard] = useState(null);

    const [pendingManualAbility, setPendingManualAbility] = useState(null); // todo
    const [selectionMode, setSelectionMode] = useState('NONE');
    const [pendingAbilityTarget, setPendingAbilityTarget] = useState(null);
    const [pendingAbility, setPendingAbility] = useState(null);
    const [awaitingImpostor, setAwaitingImpostor] = useState(false);
    const [impostorRealm, setImpostorRealm] = useState(null);
    const [pendingRitual, setPendingRitual] = useState(null);
    const [targetSelection, setTargetSelection] = useState({
        enabled: false,
        side: null,
        filter: null,
        onSelect: null,
        onCancel: null,
    });
    const [bidInput, setBidInput] = useState(0);

    const [enemyLibrary, setEnemyLibrary] = useState(createEnemyLibrary());
    const [enemyHand, setEnemyHand] = useState([]);
    const [enemyGraveyard, setEnemyGraveyard] = useState([]);
    const [priorityLeft, setPriorityLeft] = useState(true);
    const [enemyBits, setEnemyBits] = useState(0);
    const [enemyOverload, setEnemyOverload] = useState(0);
    const [enemyActions, setEnemyActions] = useState(0);
    const [enemyAshes, setEnemyAshes] = useState(0);
    const [enemyFate, setEnemyFate] = useState(0);
    const [enemyWounds, setEnemyWounds] = useState(0);
    const [enemyBurden, setEnemyBurden] = useState(0);
    const [enemySurge, setEnemySurge] = useState(0);
    const [enemyLag, setEnemyLag] = useState(0);

    const [turnNumber, setTurnNumber] = useState(0);
    const [playerFocus, setPlayerFocus] = useState(0);

    const [isDominationPhase, setIsDominationPhase] = useState(false);
    const [playerBid, setPlayerBid] = useState(0);
    const [playerBidInput, setPlayerBidInput] = useState('');

    const [enemyPandoraAccess, setEnemyPandoraAccess] = useState(1);
    const [enemyHeadSpaceAccess, setEnemyHeadSpaceAccess] = useState(1);

    const [playerBattleSlots, setPlayerBattleSlots] = useState(Array(6).fill(null));
    const [enemyBattleSlots, setEnemyBattleSlots] = useState(Array(6).fill(null));

    const [selectedCard, setSelectedCard] = useState(null);
    const [battleSelectedCard, setBattleSelectedCard] = useState(null);
    const [selectedInHand, setSelectedInHand] = useState(false);
    const [draftSelected, setDraftSelected] = useState(false);
    const [selectedRealm, setSelectedRealm] = useState(null);


    const [targetType, setTargetType] = useState('none');
    const [playerTargetSelection, setPlayerTargetSelection] = useState(null);
    const [enemyTargetSelection, setEnemyTargetSelection] = useState(null);
    const [enemyTargetType, setEnemyTargetType] = useState('none');

    const [modalVisible, setModalVisible] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: '',
        message: '',
        renderContent: null,
        onConfirm: () => { },
        onCancel: () => { },
    });

    const [trashPromptVisible, setTrashPromptVisible] = useState(false);
    const [currentPromptCard, setCurrentPromptCard] = useState(null);
    const [decisionCallback, setDecisionCallback] = useState(null)

    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [gameState, setGameState] = useState('NORMAL');
    const [battleRealm, setBattleRealm] = useState('NONE');
    const [attackMode, setAttackMode] = useState('NONE');
    const [gameMode, setGameMode] = useState('BEGIN');

    const [attackPlanned, setAttackPlanned] = useState(false);
    const [attackCount, setAttackCount] = useState(0);

    const [playerDriftCount, setPlayerDriftCount] = useState(0);
    const [enemyDriftCount, setEnemyDriftCount] = useState(0);
    const [playerFirstAttack, setPlayerFirstAttack] = useState(true);
    const [enemyFirstAttack, setEnemyFirstAttack] = useState(true);
    const [playerInterfacedHeadSpace, setPlayerInterfacedHeadSpace] = useState(false);
    const [playerInterfacedPandora, setPlayerInterfacedPandora] = useState(false);
    const [enemyInterfacedHeadSpace, setEnemyInterfacedHeadSpace] = useState(false);
    const [enemyInterfacedPandora, setEnemyInterfacedPandora] = useState(false);
    const [playerInterfaced, setPlayerInterfaced] = useState(false);
    const [enemyInterfaced, setEnemyInterfaced] = useState(false);

    const [playerSolarium, setPlayerSolarium] = useState({ people: [], places: [], things: [] });
    const [playerTheater, setPlayerTheater] = useState({ people: [], places: [], things: [] });
    const [playerUnderpass, setPlayerUnderpass] = useState({ people: [], places: [], things: [] });
    const [playerGrid, setPlayerGrid] = useState({ people: [], places: [], things: [] });
    const [playerElysium, setPlayerElysium] = useState({ people: [], places: [], things: [] });

    const [enemySolarium, setEnemySolarium] = useState({ people: [], places: [], things: [] });
    const [enemyTheater, setEnemyTheater] = useState({ people: [], places: [], things: [] });
    const [enemyUnderpass, setEnemyUnderpass] = useState({ people: [], places: [], things: [] });
    const [enemyGrid, setEnemyGrid] = useState({ people: [], places: [], things: [] });
    const [enemyElysium, setEnemyElysium] = useState({ people: [], places: [], things: [] });

    const [playerEntitiesDiedThisTurn, setPlayerEntitiesDiedThisTurn] = useState(0);
    const [enemyEntitiesDiedThisTurn, setEnemyEntitiesDiedThisTurn] = useState(0);
    const [recruiterCount, setRecruiterCount] = useState(0);
    const [enemyRecruiterCount, setEnemyRecruiterCount] = useState(0); // todo

    const showModal = ({ title, message, renderContent, onCancel }) => {
        setModalProps({
            title,
            message,
            renderContent,
            onConfirm: () => {
                setModalVisible(false);
            },
            onCancel: () => {
                setModalVisible(false);
            },
        });
        setModalVisible(true);
    };

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

    async function enemyPerformAction() {
        console.log('enemy perform action', enemyActions)
        await new Promise(resolve => setTimeout(resolve, 10));
        if (enemyActions > 0) {
            const attackPlanned = await enemyPlanAttack();
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

    useEffect(() => {
        if (
            playerActions <= 0 &&
            enemyActions <= 0 &&
            gameState === 'NORMAL' &&
            gameMode !== 'BEGIN' &&
            attackMode === 'NONE'
        ) {
            handleDominationPhase();
        }
    }, [playerActions, enemyActions, gameState]);

    async function handleDominationPhase() {
        if (turnNumber >= 2) {
            // Calculate scores
            const playerScore = calculateDominationScore('PLAYER');
            const enemyScore = calculateDominationScore('ENEMY');

            // Determine the AI's bid
            const enemyBid = determineEnemyBid(enemyScore, playerScore, enemyBits, playerBits);

            // Prompt the player to spend Bits
            const playerBid = await promptPlayerBid(playerBits);
            setPlayerBits((prev) => prev - playerBid);
            setEnemyBits((prev) => prev - enemyBid);

            // Calculate final scores
            const finalPlayerScore = playerScore + playerBid;
            const finalEnemyScore = enemyScore + enemyBid;

            // Log bids (for debugging)
            console.log(`Player bid: ${playerBid}, Enemy bid: ${enemyBid}`);

            let winner = null;
            let loser = null;

            // Determine the winner
            if (finalPlayerScore > finalEnemyScore) {
                // Player wins
                applyDominationReward('PLAYER');
                winner = 'PLAYER';
                loser = 'ENEMY';
            } else if (finalEnemyScore > finalPlayerScore) {
                // Enemy wins
                applyDominationReward('ENEMY');
                winner = 'ENEMY';
                loser = 'PLAYER';
            } else {
                // Tie - nothing happens
                console.log('Domination phase ended in a tie.');
            }

            // Publish the dominationResolved event
            eventManager.publish('dominationResolved', { winner, loser });
            console.log('dominationResolved')
            // Proceed to end the turn
            endTurn();
        } else {
            // If it's before turn 2, just end the turn
            endTurn();
        }
    }



    function calculateDominationScore(side) {
        const realms = side === 'PLAYER'
            ? [playerSolarium, playerTheater, playerUnderpass, playerGrid]
            : [enemySolarium, enemyTheater, enemyUnderpass, enemyGrid];

        const entities = realms.flatMap(realm => realm.people).filter(entity => entity.online && entity.readied);
        const totalPower = entities.reduce((sum, entity) => {
            const vengeance = entity.statusEffects?.Vengeance || 0;
            const totalEntityPower = (entity.card.power || 0) + vengeance;
            return sum + totalEntityPower;
        }, 0);

        const surge = side === 'PLAYER' ? playerSurge : enemySurge;

        return totalPower + surge;
    }

    function promptPlayerBid(maxBid) {
        return new Promise((resolve) => {
            displayBidPrompt(maxBid, (playerBid) => {
                const validBid = Math.max(0, Math.min(playerBid, maxBid));
                resolve(validBid);
            });
        });
    }


    function determineEnemyBid(enemyScore, playerScore, enemyBits, playerBits) {
        console.log('enemyScore', enemyScore);
        console.log('playerScore', playerScore);
        console.log('enemyBits', enemyBits);
        console.log('playerBits', playerBits);

        const currentPlayerScore = playerScore;
        const maxPlayerPossibleScore = playerScore + playerBits;
        const maxEnemyPossibleScore = enemyScore + enemyBits;

        console.log('currentPlayerScore', currentPlayerScore);
        console.log('maxPlayerPossibleScore', maxPlayerPossibleScore);
        console.log('maxEnemyPossibleScore', maxEnemyPossibleScore);

        // If enemy cannot surpass player's current score even with all bits
        if (maxEnemyPossibleScore <= currentPlayerScore) {
            console.log('Enemy cannot exceed player score even with all bits.');
            return 0;
        }

        // Calculate the minimum bid needed to surpass the player's current score
        let minBidToWin = (currentPlayerScore - enemyScore) + 1;
        minBidToWin = Math.max(minBidToWin, 0); // Ensure non-negative
        minBidToWin = Math.min(minBidToWin, enemyBits); // Clamp to available bits
        console.log('minBidToWin', minBidToWin);

        // Calculate the maximum bid to ensure the enemy doesn't bid excessively
        let maxBid = (maxPlayerPossibleScore - enemyScore) + 1;
        maxBid = Math.min(maxBid, enemyBits); // Clamp to available bits
        console.log('maxBid', maxBid);

        // Ensure that minBidToWin does not exceed maxBid
        if (minBidToWin > maxBid) {
            console.log('No valid bids to exceed player score.');
            return 0;
        }

        // Generate possible bids from minBidToWin to maxBid inclusive
        const possibleBids = [];
        for (let bid = minBidToWin; bid <= maxBid; bid++) {
            possibleBids.push(bid);
        }
        console.log('possibleBids', possibleBids);

        // Randomly select a bid from the possibleBids array
        if (possibleBids.length === 0) {
            console.log('No valid bids available.');
            return 0;
        }

        const enemyBid = possibleBids[Math.floor(Math.random() * possibleBids.length)];
        console.log('enemyBid', enemyBid);

        return enemyBid;
    }



    function applyDominationReward(winnerSide) {
        if (focus === 'magi') {
            if (winnerSide === 'PLAYER') {
                setPlayerFate(prev => prev + 1);
                setEnemyBurden(prev => prev + 1);
            } else {
                setEnemyFate(prev => prev + 1);
                setPlayerBurden(prev => prev + 1);
            }
        } else if (focus === 'phys') {
            if (winnerSide === 'PLAYER') {
                enemySacrificeEntity();
            } else {
                playerSacrificeEntity();
            }
        } else if (focus === 'tech') {
            if (winnerSide === 'PLAYER') {
                setPlayerActions(prev => prev + 2);
                setPlayerBits(prev => prev + 1);
            } else {
                setEnemyActions(prev => prev + 2);
                setEnemyBits(prev => prev + 1);
            }
        } else {
            console.log('no focus for domination')
        }
    }

    function enemySacrificeEntity() {

        const realms = [enemySolarium, enemyTheater, enemyUnderpass, enemyGrid];
        const entities = realms.flatMap(realm => realm.people);

        if (entities.length > 0) {
            const randomIndex = Math.floor(Math.random() * entities.length);
            const entityToSacrifice = entities[randomIndex];
            // Remove the entity from its realm
            handleDeadCard(entityToSacrifice.realm, entityToSacrifice.id, 'ENEMY')
            console.log(`Enemy sacrificed ${entityToSacrifice.card.name}`);
        }
    }

    function playerSacrificeEntity() {
        // Similar logic for the player
        const realms = [playerSolarium, playerTheater, playerUnderpass, playerGrid];
        const entities = realms.flatMap(realm => realm.people);

        if (entities.length > 0) {
            // Prompt the player to choose an entity to sacrifice
            promptPlayerToSacrifice(entities).then(entityToSacrifice => {
                handleDeadCard(entityToSacrifice.realm, entityToSacrifice.id, 'PLAYER')
                console.log(`Player sacrificed ${entityToSacrifice.card.name}`);
            });
        }
    }

    function promptPlayerToSacrifice(entities) {
        return new Promise((resolve) => {
            showModal({
                title: 'Sacrifice an Entity',
                message: 'Choose an entity to sacrifice:',
                renderContent: ({ closeModal }) => (
                    <div>
                        {entities.map((entity, index) => (
                            <div key={entity.id}>
                                <div
                                    onClick={() => {
                                        resolve(entity);
                                        setModalVisible(false);
                                    }}
                                >
                                    {entity.card.name}
                                </div>
                            </div>
                        ))}
                    </div>
                ),
            });
        });
    }


    function displayBidPrompt(maxBid, decisionCallback) {
        showModal({
            title: 'Domination Phase',
            message: `Enter the amount of Bits to spend (0 to ${maxBid}):`,
            renderContent: ({ closeModal }) => (
                <BidInputModal
                    maxBid={maxBid}
                    decisionCallback={decisionCallback}
                    closeModal={closeModal}
                />
            ),
        });
    }

    function endTurn() {
        console.log('end turn');
        processEndOfTurnEffects();
        const newPriorityLeft = !priorityLeft;
        setPriorityLeft(newPriorityLeft);
        startTurn(newPriorityLeft);
    }

    async function enemyPlanAttack() {
            await new Promise(resolve => setTimeout(resolve, 10));
            console.log('PLAN ATTACK');
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
                    console.log('__________________realm people', realm.people)
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




    // When attack is resolved
    useEffect(() => {
        if (gameState === 'ATTACK_RESOLVED') {
            if (currentPlayer === 'ENEMY') {
                setCurrentPlayer('PLAYER');
            }
            else {
                setCurrentPlayer('ENEMY');
            }
            setGameState('NORMAL');
        }
    }, [gameState]);

    // Start the game or turn
    useEffect(() => {
        if (gameMode === 'BEGIN') {
            console.log('begin game')
            playerGainBits(3);
            playerDraw(3);
            enemyDraw(3);
            setGameMode('NONE');
            startTurn(priorityLeft);
        }
    }, [gameMode]);

    // Enemy action continues if player has no actions
    useEffect(() => {
        if (currentPlayer === 'ENEMY' && enemyActions > 0 && gameState === 'NORMAL') {
            console.log('dispatch action')
            console.log('currentPlayer', currentPlayer)
            enemyRezCards();
            enemyPerformAction();
        }
    }, [currentPlayer, enemyActions, gameState]);


    async function enemyRezCards() {
        console.log('--- enemyRezCards Invoked ---');
        // Function to activate abilities for entities being rez'd
        const rezActiveEntities = async (cardList) => {
            return Promise.all(cardList.map(async (cardEntity) => {
                if (
                    cardEntity.card.timer &&
                    cardEntity.steps >= cardEntity.card.timer &&
                    cardEntity.freeze === 0 &&
                    !cardEntity.online
                ) {
                    console.log(`ACTIVATING ABILITIES for entity "${cardEntity.card.name}" (ID: ${cardEntity.id}) in realm.`);
                    await activateAbilities(cardEntity, 'ENEMY');
                    // Explicitly set online to true
                    cardEntity.online = true;
                    return cardEntity;
                }
                return cardEntity;
            }));
        };
    
        // Function to activate abilities for things being rez'd (traps)
        const rezActiveThings = async (cardList) => {
            return Promise.all(cardList.map(async (cardEntity) => {
                if (!cardEntity.card.trap && !cardEntity.online) {
                    console.log(`ACTIVATING ABILITIES for thing "${cardEntity.card.name}" (ID: ${cardEntity.id}) in realm.`);
                    await activateAbilities(cardEntity, 'ENEMY');
                    // Explicitly set online to true
                    cardEntity.online = true;
                    return cardEntity;
                } else {
                    console.log(`Trap skipped: "${cardEntity.card.name}"`);
                }
                return cardEntity;
            }));
        };
    
        // Update Enemy Solarium Realm
        const updatedSolariumPeople = await rezActiveEntities(enemySolarium.people);
        await rezActiveThings(enemySolarium.things);
        setEnemySolarium(prevRealm => ({
            ...prevRealm,
            people: updatedSolariumPeople
        }));
    
        // Update Enemy Theater Realm
        const updatedTheaterPeople = await rezActiveEntities(enemyTheater.people);
        await rezActiveThings(enemyTheater.things);
        setEnemyTheater(prevRealm => ({
            ...prevRealm,
            people: updatedTheaterPeople
        }));
    
        // Update Enemy Underpass Realm
        const updatedUnderpassPeople = await rezActiveEntities(enemyUnderpass.people);
        await rezActiveThings(enemyUnderpass.things);
        setEnemyUnderpass(prevRealm => ({
            ...prevRealm,
            people: updatedUnderpassPeople
        }));
    
        // Update Enemy Grid Realm
        const updatedGridPeople = await rezActiveEntities(enemyGrid.people);
        await rezActiveThings(enemyGrid.things);
        setEnemyGrid(prevRealm => ({
            ...prevRealm,
            people: updatedGridPeople
        }));
    
        console.log('--- enemyRezCards Completed ---');
    }

    function calculateActivationCost(card, side) {
        let rezCost = card.rezCost || 0;

        // Check for Rapture ability
        const raptureAbility = card.abilities?.find((ability) => ability.name === 'Rapture');
        if (raptureAbility) {
            const amount = raptureAbility.amount || 0;
            const deathsThisTurn = side === 'PLAYER' ? playerEntitiesDiedThisTurn : enemyEntitiesDiedThisTurn;
            const costReduction = amount * deathsThisTurn;
            rezCost = Math.max(0, rezCost - costReduction);
        }

        return rezCost;
    }

    useEffect(() => {
        if (!awaitingSacrifices && rezCard) {
            console.log('rezzing card');
            let activationCost = calculateActivationCost(rezCard.card, 'PLAYER');
            console.log('rez cost ', activationCost);
            if (activationCost) {
                console.log('lost bits');
                playerLoseBits(activationCost);
            }
            if (rezCard.card.ash) {
                console.log('lost ash');
                playerLoseAshes(rezCard.card.ash);
            }

            setRezCard(null);
            activateAbilities(rezCard, 'PLAYER');

            switch (rezCard.realm) {
                case 'Solarium':
                    if (rezCard.card.category === 'ENTITY') {
                        setPlayerSolarium(prevRealm => ({
                            ...prevRealm,
                            people: prevRealm.people.map(c =>
                                c.id === rezCard.id ? { ...c, online: true } : c
                            ),
                        }));
                    } else if (rezCard.card.category === 'SNIP') {
                        setPlayerSolarium(prevRealm => ({
                            ...prevRealm,
                            things: prevRealm.things.map(c =>
                                c.id === rezCard.id ? { ...c, online: true } : c
                            ),
                        }));
                    }
                    break;
                case 'Theater':
                    if (rezCard.card.category === 'ENTITY') {
                        setPlayerTheater(prevRealm => ({
                            ...prevRealm,
                            people: prevRealm.people.map(c =>
                                c.id === rezCard.id ? { ...c, online: true } : c
                            ),
                        }));
                    } else if (rezCard.card.category === 'SNIP') {
                        setPlayerTheater(prevRealm => ({
                            ...prevRealm,
                            things: prevRealm.things.map(c =>
                                c.id === rezCard.id ? { ...c, online: true } : c
                            ),
                        }));
                    }
                    break;
                case 'Underpass':
                    if (rezCard.card.category === 'ENTITY') {
                        setPlayerUnderpass(prevRealm => ({
                            ...prevRealm,
                            people: prevRealm.people.map(c =>
                                c.id === rezCard.id ? { ...c, online: true } : c
                            ),
                        }));
                    } else if (rezCard.card.category === 'SNIP') {
                        setPlayerUnderpass(prevRealm => ({
                            ...prevRealm,
                            things: prevRealm.things.map(c =>
                                c.id === rezCard.id ? { ...c, online: true } : c
                            ),
                        }));
                    }
                    break;
                case 'Grid':
                    if (rezCard.card.category === 'ENTITY') {
                        setPlayerGrid(prevRealm => ({
                            ...prevRealm,
                            people: prevRealm.people.map(c =>
                                c.id === rezCard.id ? { ...c, online: true } : c
                            ),
                        }));
                    } else if (rezCard.card.category === 'SNIP') {
                        setPlayerGrid(prevRealm => ({
                            ...prevRealm,
                            things: prevRealm.things.map(c =>
                                c.id === rezCard.id ? { ...c, online: true } : c
                            ),
                        }));
                    }
                    break;
                default:
                    console.error(`Unknown realm: ${rezCard.realm}`);
            }
        }
    }, [awaitingSacrifices, rezCard]);


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


    const handleQuest = () => {
        setAttackMode('PLAYER_QUEST')
        playerLoseActions(1);
    };

    const handleRaid = () => {
        setAttackMode('PLAYER_RAID')
        playerLoseActions(1);
    };

    const handleHack = () => {
        console.log('handle hack')
        setAttackMode('PLAYER_HACK')
        playerLoseActions(1);
    };

    function isValidAbilityTarget(cardEntity) {
        // Check if the card is a friendly Online entity
        return (
            cardEntity.online &&
            cardEntity.owner === 'PLAYER' &&
            cardEntity !== pendingAbility.entity // Cannot target itself
        );
    }

    function confirmAbilityTarget(target) {
        const { entity, ability } = pendingAbility;

        // Apply the effect
        applyAbilityEffect(entity, ability.effect, 'PLAYER', target);

        // Reset state
        setPendingAbility(null);
        setSelectionMode('NONE');
    }



    const handleRealmCardSelect = (cardEntity) => {
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
            setSelectedCard(cardEntity);
            setSelectedInHand(false);
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





    function exhaustEntity(entity, side) {
        const realmName = entity.realm; // Ensure the entity has a 'realm' property
        const [realm, setRealm] = getRealmAndSetter(realmName, side);

        const entityIndex = realm.people.findIndex((e) => e.id === entity.id);
        if (entityIndex === -1) {
            console.error(`Entity with ID ${entity.id} not found in realm ${realmName}`);
            return;
        }

        const updatedEntity = { ...realm.people[entityIndex] };

        // Set steps to 0 to exhaust the entity
        updatedEntity.steps = 0;

        // Update the realm's people array
        const newPeople = [...realm.people];
        newPeople[entityIndex] = updatedEntity;

        // Update the realm state
        setRealm({
            ...realm,
            people: newPeople,
        });

        console.log(`${entity.card.name} is now exhausted.`);
    }



    function confirmManualAbility(target) {
        const { entity, ability } = pendingManualAbility;

        // Apply the ability effect
        const abilityDef = abilitiesDefinitions[ability.name];
        if (abilityDef && typeof abilityDef.execute === 'function') {
            abilityDef.execute(entity, ability.effect, 'PLAYER', target);
        } else {
            console.error(`Ability ${ability.name} not found or invalid.`);
        }

        // Clear the pending manual ability and disable target selection
        setPendingManualAbility(null);
        setTargetSelection({ enabled: false });
    }

    function applyOverload(side, amount) {
        if (side === 'PLAYER') {
            setPlayerOverload(prevOverload => prevOverload + amount);
            console.log(`Player gains ${amount} Overload.`);
        } else {
            setEnemyOverload(prevOverload => prevOverload + amount);
            console.log(`Enemy gains ${amount} Overload.`);
        }
    }




    function applyAbilityEffect(entity, effect, side) {
        const abilityDef = abilitiesDefinitions[effect.name];
        if (abilityDef && typeof abilityDef.execute === 'function') {
            abilityDef.execute(entity, effect, side);
        } else {
            console.error(`Ability effect ${effect.name} not found or invalid.`);
        }
    }


    function grantAbility(entity, abilityName, amount = 1, side) {
        const realmName = entity.realm;
        const [realm, setRealm] = getRealmAndSetter(realmName, side);

        const entityIndex = realm.people.findIndex((e) => e.id === entity.id);
        if (entityIndex === -1) {
            console.error(`Entity with ID ${entity.id} not found in realm ${realmName}`);
            return;
        }

        const updatedEntity = { ...realm.people[entityIndex] };

        if (!updatedEntity.abilities) {
            updatedEntity.abilities = {};
        }

        updatedEntity[abilityName] = (updatedEntity[abilityName] || 0) + amount;

        // Update the realm's people array
        const newPeople = [...realm.people];
        newPeople[entityIndex] = updatedEntity;

        // Update the realm state
        setRealm({
            ...realm,
            people: newPeople,
        });

        console.log(`${entity.card.name} gains ${abilityName} (${updatedEntity.abilities[abilityName]}).`);
    }

    function removeAbility(entity, abilityName, amount = 1, side) {
        const realmName = entity.realm;
        const [realm, setRealm] = getRealmAndSetter(realmName, side);

        const entityIndex = realm.people.findIndex((e) => e.id === entity.id);
        if (entityIndex === -1) {
            console.error(`Entity with ID ${entity.id} not found in realm ${realmName}`);
            return;
        }

        const updatedEntity = { ...realm.people[entityIndex] };

        if (updatedEntity.abilities && updatedEntity.abilities[abilityName]) {
            updatedEntity.abilities[abilityName] -= amount;
            if (updatedEntity.abilities[abilityName] <= 0) {
                delete updatedEntity.abilities[abilityName];
            }

            // Update the realm's people array
            const newPeople = [...realm.people];
            newPeople[entityIndex] = updatedEntity;

            // Update the realm state
            setRealm({
                ...realm,
                people: newPeople,
            });

            console.log(`${entity.card.name} loses ${abilityName}. Remaining: ${updatedEntity.abilities[abilityName] || 0}`);
        } else {
            console.log(`${entity.card.name} does not have ${abilityName}.`);
        }
    }


    function applyBoost(entity, boostAmount, side) {
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

    function handleAscension(cardEntity, side) {
        const realmName = cardEntity.realm;
        const [realm, setRealm] = getRealmAndSetter(realmName, side);
        let cardFound = false;
        const arrays = ['places', 'things'];

        arrays.forEach(arrayName => {
            if (realm[arrayName].some(card => card.id === cardEntity.id)) {
                setRealm(prevRealm => ({
                    ...prevRealm,
                    [arrayName]: prevRealm[arrayName].filter(card => card.id !== cardEntity.id),
                }));
                cardFound = true;
            }
        });

        if (cardFound) {
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

            // Trigger one-time onAscend abilities
            triggerAscendAbilities(cardEntity, side);

            // Activate ongoing Ascended abilities
            activateAscendedAbilities(cardEntity, side);

            console.log(`${cardEntity.card.name} has ascended to Elysium.`);
        } else {
            console.error(`Card ${cardEntity.card.name} not found in realm ${realmName}.`);
        }
    }



    function triggerAscendAbilities(entity, side) {
        entity.card.abilities.forEach((abilityName) => {
            const abilityDef = abilitiesDefinitions[abilityName];
            if (abilityDef && abilityDef.type === "onAscend" && abilityDef.onAscend) {
                abilityDef.onAscend(entity, null, side);
            }
        });
    }

    function activateAscendedAbilities(cardEntity, side) {
        const ascendedAbilities = cardEntity.card.abilities.filter(
            abilityName => abilitiesDefinitions[abilityName]?.type === 'Ascended'
        );

        ascendedAbilities.forEach(abilityName => {
            const abilityDef = abilitiesDefinitions[abilityName];
            if (abilityDef) {
                if (abilityDef.typeCategory === 'static') {
                    // Apply static effect
                    abilityDef.applyEffect(cardEntity, gameState, side);
                } else if (abilityDef.typeCategory === 'triggered') {
                    // Subscribe to events
                    abilityDef.triggers.forEach(eventType => {
                        const handler = eventData => {
                            abilityDef.eventHandler(cardEntity, eventData, gameState, side);
                        };
                        const unsubscribe = eventManager.subscribe(eventType, handler);
                        // Store active abilities for cleanup
                        if (!cardEntity.activeAbilities) {
                            cardEntity.activeAbilities = [];
                        }
                        cardEntity.activeAbilities.push({ abilityName, eventType, handler, unsubscribe });
                    });
                }
                // Handle other ability categories as needed
            }
        });
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

    const handleSacrificeConfirmation = () => {
        console.log('confirm sacrifice');
        const totalCosmicValue = soulSelections.reduce((sum, card) => sum + (card.cosmic || 1), 0);

        if (totalCosmicValue >= rezCard.card.soul) {
            soulSelections.forEach(card => {
                // Handle Covenant
                if (!card.card.covenant) {
                    handleDeadCard(card.realm, card.id, 'PLAYER');
                } else {
                    console.log(`${card.card.name} has Covenant and is not destroyed.`);
                }
                // Regardless of Covenant, mark the card as having been used for sacrifice
                //setCardSacrificed(card.realm, card.id, false);
            });
            setSoulSelections([]);
            setAwaitingSacrifices(false);
        } else {
            console.error('Not enough cosmic value in sacrifices selected!');
        }
    };


    function setCardSacrificed(realmName, entityId, isSelected) {
        const [realm, setRealm] = getRealmAndSetter(realmName, 'PLAYER');

        const entityIndex = realm.people.findIndex((e) => e.id === entityId);
        if (entityIndex === -1) {
            console.error(`Entity with ID ${entityId} not found in realm ${realmName}`);
            return;
        }

        const updatedEntity = { ...realm.people[entityIndex] };
        updatedEntity.isSelectedForSacrifice = isSelected;

        const newPeople = [...realm.people];
        newPeople[entityIndex] = updatedEntity;

        setRealm({
            ...realm,
            people: newPeople,
        });
    }





    const handleEmptySlotSelect = (slotIndex) => {
        if (playerBattleSlots[slotIndex]) {
            return; // Return early if slot is not empty
        }

        if (selectedCard) {
            // Check if the enemy is attacking this slot with a stealthy attacker
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
            setBattleRealm(selectedCard.realm.name);
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



    const handleEnemyBattle = () => {
        // Update player's battle slots if necessary
        const updatedPlayerBattleSlots = playerBattleSlots.map(creature => {
            if (creature) {
                return {
                    ...creature,
                    steps: 1,
                    readied: creature.timer <= 1 ? creature.readied : false
                };
            } else {
                return creature;
            }
        });
        setPlayerBattleSlots(updatedPlayerBattleSlots);

        let unblockedHacking = false;

        // Determine if only one attacker is present on the enemy side
        const enemyAttackers = enemyBattleSlots.filter(attacker => attacker !== null);
        const isEnemySoloAttack = enemyAttackers.length === 1;

        // Proceed with the battle using the enemy battle slots
        for (let i = 0; i < 6; i++) {
            const attacker = enemyBattleSlots[i];
            const defender = updatedPlayerBattleSlots[i] || null;

            if (attacker) {
                // Implement solo event dispatch for enemy attackers
                if (isEnemySoloAttack && attacker.card.abilities.some(a => a.name === 'Solo')) {
                    // Dispatch the 'soloAttack' event for the enemy side
                    eventManager.publish('soloAttack', { entityId: attacker.id, side: 'ENEMY' });
                }

                const attackResult = commitAttack(attacker, defender, 'ENEMY', enemyTargetSelection, enemyTargetType);
                if (attackResult.unblockedHacking) {
                    unblockedHacking = true;
                }
            }
        }

        if (unblockedHacking && attackMode === 'ENEMY_tech') {
            setEnemyInterfaced(true);
            if (enemyTargetType === 'HEADSPACE') {
                setEnemyInterfacedHeadSpace(true);
            }
            if (enemyTargetType === 'PANDORA') {
                setEnemyInterfacedPandora(true);
            }
            eventManager.publish('successfulHack', {
                side: 'ENEMY',
                targetType: enemyTargetType,
                success: true,
            });
            handleAccessPhase('ENEMY');
        } else {
            eventManager.publish('failedHack', {
                side: 'ENEMY',
                targetType: enemyTargetType,
                success: false,
            });
        }

        handleEndOfBattle();
    };



    function enemyPlanDefense() {
        // First, the enemy rezzes their cards
        enemyRezCards();

        // Map attackMode to aspect
        let aspect;
        if (attackMode === 'PLAYER_QUEST') {
            aspect = 'magi';
        } else if (attackMode === 'PLAYER_RAID') {
            aspect = 'phys';
        } else if (attackMode === 'PLAYER_HACK') {
            aspect = 'tech';
        }

        // Get the enemy realm corresponding to battleRealm
        let enemyRealm;
        switch (battleRealm) {
            case 'Solarium':
                enemyRealm = enemySolarium;
                break;
            case 'Theater':
                enemyRealm = enemyTheater;
                break;
            case 'Underpass':
                enemyRealm = enemyUnderpass;
                break;
            case 'Grid':
                enemyRealm = enemyGrid;
                break;
            default:
                console.error('Invalid battleRealm:', battleRealm);
                return;
        }

        // Get online entities in that realm matching the aspect, ignoring 'aggressive' creatures
        let availableDefenders = enemyRealm.people.filter(
            (creature) => creature.card[aspect] && creature.online && !creature.card.aggressive
        );

        // Identify player attackers
        const playerAttackers = playerBattleSlots.map((attacker, index) => ({
            attacker,
            index,
        })).filter(({ attacker }) => attacker !== null);

        // Limit the number of defenders to the number of attackers
        const maxDefendersNeeded = playerAttackers.length;

        // Separate attackers with and without Stealth
        const stealthyAttackers = playerAttackers.filter(
            ({ attacker }) => (attacker.stealth || 0) > 0
        );
        const normalAttackers = playerAttackers.filter(
            ({ attacker }) => (attacker.stealth || 0) === 0
        );

        // Prepare enemyBattleSlots
        const enemyDefenseSlots = Array(6).fill(null);

        // Defend against stealthy attackers with stealthy defenders
        const stealthyDefenders = availableDefenders.filter(
            (defender) => (defender.stealth || 0) > 0
        );

        for (const { attacker, index } of stealthyAttackers) {
            if (stealthyDefenders.length > 0) {
                const defender = stealthyDefenders.shift();

                // Update defender properties
                prepareDefenderForBattle(defender);

                // Remove defender from realm
                removeFromRealm(defender, defender.realm, 'ENEMY');

                // Place defender in the corresponding slot
                enemyDefenseSlots[index] = defender;

                // Remove from available defenders
                availableDefenders = availableDefenders.filter((d) => d.id !== defender.id);
            }
        }

        // Defend against normal attackers with any available defenders
        for (const { attacker, index } of normalAttackers) {
            if (availableDefenders.length > 0) {
                const defender = availableDefenders.shift();

                // Update defender properties
                prepareDefenderForBattle(defender);

                // Remove defender from realm
                removeFromRealm(defender, defender.realm, 'ENEMY');

                // Place defender in the corresponding slot
                enemyDefenseSlots[index] = defender;
            }
        }

        // Set enemyBattleSlots
        setEnemyBattleSlots(enemyDefenseSlots);

        // Proceed to handle the battle
        handlePlayerBattle();
    }

    function prepareDefenderForBattle(defender) {
        // Update defender properties as per your instruction
        if (defender.timer >= 2) {
            defender.readied = false;
        }
        defender.steps = 1;
    }

    function decreaseStealth(entity, side) {
        if (!entity.stealth || entity.stealth <= 0) {
            return;
        }

        const realmName = entity.realm; // Ensure the entity has a 'realm' property
        const [realm, setRealm] = getRealmAndSetter(realmName, side);

        const entityIndex = realm.people.findIndex((e) => e.id === entity.id);
        if (entityIndex === -1) {
            console.error(`Entity with ID ${entity.id} not found in realm ${realmName}`);
            return;
        }

        const updatedEntity = { ...realm.people[entityIndex] };
        updatedEntity.stealth = updatedEntity.stealth - 1;

        // Ensure stealth doesn't go below 0
        if (updatedEntity.stealth < 0) {
            updatedEntity.stealth = 0;
        }

        // Update the realm's people array
        const newPeople = [...realm.people];
        newPeople[entityIndex] = updatedEntity;

        // Update the realm state
        setRealm({
            ...realm,
            people: newPeople,
        });

        console.log(`${entity.card.name}'s Stealth decreased by 1. New Stealth: ${updatedEntity.stealth}`);
    }





    const handlePlayerBattle = () => {
        const updatedBattleSlots = playerBattleSlots.map(attacker => {
            if (attacker) {
                let isReadied = attacker.charge < attacker.card.timer ? false : true;
                return {
                    ...attacker,
                    readied: isReadied,
                    steps: attacker.charge
                };
            } else {
                return attacker;
            }
        });

        // Update the state with the modified battle slots
        setPlayerBattleSlots(updatedBattleSlots);

        let unblockedHacking = false;

        // Determine if only one attacker is present
        const attackers = updatedBattleSlots.filter(a => a !== null);
        const isSoloAttack = attackers.length === 1;

        // Proceed with the battle using the updated battle slots
        for (let i = 0; i < 6; i++) {
            const attacker = updatedBattleSlots[i];
            const defender = enemyBattleSlots[i] || null;

            if (attacker) {
                // Implement solo event dispatch here
                if (isSoloAttack && attacker.card.abilities.some(a => a.name === 'Solo')) {
                    // Dispatch the 'soloAttack' event
                    eventManager.publish('soloAttack', { entityId: attacker.id, side: 'PLAYER' });
                }

                const attackResult = commitAttack(attacker, defender, 'PLAYER', playerTargetSelection, targetType);
                if (attackResult.unblockedHacking) {
                    unblockedHacking = true;
                }
            }
        }

        if (unblockedHacking && attackMode === 'PLAYER_HACK') {
            setPlayerInterfaced(true);
            if (enemyTargetType === 'HEADSPACE') {
                setPlayerInterfacedHeadSpace(true);
            }
            if (enemyTargetType === 'PANDORA') {
                setPlayerInterfacedPandora(true);
            }
            eventManager.publish('successfulHack', {
                side: 'PLAYER',
                targetType: targetType,
                success: true,
            });
            handleAccessPhase('PLAYER');
        } else {
            eventManager.publish('failedHack', {
                side: 'PLAYER',
                targetType: targetType,
                success: false,
            });
        }

        handleEndOfBattle();
    };


    function getOppositeSide(side) {
        return side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
    }

    function willEntitySurvive(entity, incomingDamage) {
        const currentWounds = entity.wounds || 0;
        const totalDamage = currentWounds + incomingDamage;
        return totalDamage < entity.card.HP;
    }

    function clearVengeance(entity, side) {
        const realmName = entity.realm; // Ensure the entity has a 'realm' property
        const [realm, setRealm] = getRealmAndSetter(realmName, side);

        const entityIndex = realm.people.findIndex((e) => e.id === entity.id);
        if (entityIndex === -1) {
            console.error(`Entity with ID ${entity.id} not found in realm ${realmName}`);
            return;
        }

        const updatedEntity = { ...realm.people[entityIndex] };

        if (updatedEntity.statusEffects && updatedEntity.statusEffects.Vengeance) {
            // Remove Vengeance
            delete updatedEntity.statusEffects.Vengeance;

            // Update the realm's people array
            const newPeople = [...realm.people];
            newPeople[entityIndex] = updatedEntity;

            // Update the realm state
            setRealm({
                ...realm,
                people: newPeople,
            });

            console.log(`Vengeance cleared from ${updatedEntity.card.name}`);
        }
    }


    function commitAttack(attacker, defender = null, side, target = null, targetType = null, slotIndex) { // todo1
        if (side === 'PLAYER' && playerFirstAttack) {
            eventManager.publish('firstAttack', { side: 'PLAYER' });
            setPlayerFirstAttack(false);
        } else if (side === 'ENEMY' && enemyFirstAttack) {
            eventManager.publish('firstAttack', { side: 'ENEMY' });
            setEnemyFirstAttack(false);
        }

        let attackerBasePower = attacker.card.power || 0;
        let attackerVengeance = attacker.statusEffects?.Vengeance || 0;
        let attackerPower = attackerBasePower + attackerVengeance;

        // Get attacker's Stealth value
        let attackerStealth = attacker.stealth || 0;

        let defenderPower = 0;
        let defenderStealth = 0;
        if (defender) {
            // Calculate defender's total power including Vengeance
            let defenderBasePower = defender.card.power || 0;
            let defenderVengeance = defender.statusEffects?.Vengeance || 0;
            defenderPower = defenderBasePower + defenderVengeance;

            // Get defender's Stealth value
            defenderStealth = defender.stealth || 0;
        }

        let unblockedHacking = false;
        let attackSuccessful = false;
        let damageDealt = 0;

        // Check if defender can block attacker based on Stealth
        const defenderCanBlock = defender
            ? attackerStealth <= 0 || defenderStealth > 0
            : false;

        if (defender && defenderCanBlock) {
            // Determine if attacker and defender have Pounce
            const attackerHasPounce = attacker.pounce > 0 || false;
            const defenderHasPounce = defender?.pounce > 0 || false;

            if (attackerHasPounce && !defenderHasPounce) {
                // Attacker deals damage first
                const damageDealtToDefender = handleDamage('BATTLE', defender.id, attackerPower, getOppositeSide(side));

                // Handle Override
                if (attacker.override > 0 && damageDealtToDefender.excessDamage > 0) {
                    applyOverrideDamage(attacker, damageDealtToDefender.excessDamage, side, battleRealm);
                }

                // Check if defender survives
                const defenderSurvives = willEntitySurvive(defender, attackerPower);

                if (defenderSurvives) {
                    const damageDealtToAttacker = handleDamage('BATTLE', attacker.id, defenderPower, side);

                    // After defender deals damage, decrease defender's Stealth by 1 if damage was dealt
                    if (defenderPower > 0) {
                        decreaseStealth(defender, getOppositeSide(side));
                        clearVengeance(defender, getOppositeSide(side));
                    }
                }

                // After attacker deals damage, decrease attacker's Stealth by 1 if damage was dealt
                if (attackerPower > 0) {
                    decreaseStealth(attacker, side);
                    clearVengeance(attacker, side);
                    attackSuccessful = damageDealtToDefender.damageDealt > 0;
                    damageDealt = damageDealtToDefender.damageDealt;
                }

            } else if (!attackerHasPounce && defenderHasPounce) {
                // Defender deals damage first
                const damageDealtToAttacker = handleDamage('BATTLE', attacker.id, defenderPower, side);

                // Check if attacker survives
                const attackerSurvives = willEntitySurvive(attacker, defenderPower);

                if (attackerSurvives) {
                    const damageDealtToDefender = handleDamage('BATTLE', defender.id, attackerPower, getOppositeSide(side));

                    // Handle Override
                    if (attacker.override > 0 && damageDealtToDefender.excessDamage > 0) {
                        applyOverrideDamage(attacker, damageDealtToDefender.excessDamage, side, battleRealm);
                    }

                    // After attacker deals damage, decrease attacker's Stealth by 1 if damage was dealt
                    if (attackerPower > 0) {
                        decreaseStealth(attacker, side);
                        clearVengeance(attacker, side);
                        attackSuccessful = damageDealtToDefender.damageDealt > 0;
                        damageDealt = damageDealtToDefender.damageDealt;
                    }
                }

                // After defender deals damage, decrease defender's Stealth by 1 if damage was dealt
                if (defenderPower > 0) {
                    decreaseStealth(defender, getOppositeSide(side));
                    clearVengeance(defender, getOppositeSide(side));
                }

            } else {
                // Both have Pounce or neither have Pounce; combat proceeds simultaneously
                const damageDealtToDefender = handleDamage('BATTLE', defender.id, attackerPower, getOppositeSide(side));
                const damageDealtToAttacker = handleDamage('BATTLE', attacker.id, defenderPower, side);

                // Handle Override
                if (attacker.override > 0 && damageDealtToDefender.excessDamage > 0) {
                    applyOverrideDamage(attacker, damageDealtToDefender.excessDamage, side, battleRealm);
                }

                // After attacker deals damage, decrease attacker's Stealth by 1 if damage was dealt
                if (attackerPower > 0) {
                    decreaseStealth(attacker, side);
                    clearVengeance(attacker, side);
                    attackSuccessful = damageDealtToDefender.damageDealt > 0;
                    damageDealt = damageDealtToDefender.damageDealt;
                }

                // After defender deals damage, decrease defender's Stealth by 1 if damage was dealt
                if (defenderPower > 0) {
                    decreaseStealth(defender, getOppositeSide(side));
                    clearVengeance(defender, getOppositeSide(side));
                }
            }

        } else if (defender && !defenderCanBlock) {
            // Defender cannot block attacker due to Stealth
            console.log(
                `${defender.card.name} cannot block ${attacker.card.name} due to Stealth.`
            );

            // The attack is unblocked; handle unblocked damage
            handleUnblockedAttack(attacker, side, slotIndex);
            unblockedHacking = true;
            // Decrease attacker's Stealth by 1 if damage was dealt
            if (attackerPower > 0) {
                decreaseStealth(attacker, side);
                clearVengeance(attacker, side);
                attackSuccessful = true;
                damageDealt = attackerPower;
            }
        } else if (!defender) {
            // No defender; handle unblocked attack
            handleUnblockedAttack(attacker, side, slotIndex);
            unblockedHacking = true;
            // Decrease attacker's Stealth by 1 if damage was dealt
            if (attackerPower > 0) {
                decreaseStealth(attacker, side);
                clearVengeance(attacker, side);
                attackSuccessful = true;
                damageDealt = attackerPower;
            }
        }

        // Publish the event if the attack was successful
        if (attackSuccessful) {
            const eventData = {
                attackerId: attacker.id,
                side: side,
                targetType: targetType || 'ENTITY',
                damageDealt: damageDealt,
                type: attackMode,
            };
            eventManager.publish('attackSuccessful', eventData);
            unblockedHacking = true;
        }

        setAttackMode('NONE');
        return { unblockedHacking };
    }



    function handleUnblockedAttack(attacker, side, slotIndex) {
        const attackerPower = (attacker.card.power || 0) + (attacker.statusEffects?.Vengeance || 0);
        const opponentSide = getOppositeSide(side);
        let unblockedHacking = false;

        // Determine the target selection and type based on the side
        const targetSelection = side === 'PLAYER' ? playerTargetSelection : enemyTargetSelection;
        const thisTargetType = side === 'PLAYER' ? targetType : enemyTargetType;

        // Check if a Place is being targeted during a raid
        if (
            attackMode === 'PLAYER_RAID' &&
            targetSelection &&
            (targetSelection.card.category === 'LOCATION' || targetSelection.card.category === 'LANDMARK')
        ) {
            // Player is attacking an enemy Place during a raid
            handlePlaceDamage(targetSelection.realm, targetSelection.id, attackerPower, opponentSide);
            console.log(`${attacker.card.name} deals ${attackerPower} damage to ${targetSelection.card.name}.`);
        } else if (
            attackMode === 'ENEMY_RAID' &&
            targetSelection &&
            (targetSelection.card.category === 'LOCATION' || targetSelection.card.category === 'LANDMARK')
        ) {
            // Enemy is attacking a player's Place during a raid
            handlePlaceDamage(targetSelection.realm, targetSelection.id, attackerPower, opponentSide);
            console.log(`${attacker.card.name} deals ${attackerPower} damage to ${targetSelection.card.name}.`);
        } else {
            // Apply damage based on the battle realm and attack mode
            switch (attackMode) {
                case 'ENEMY_phys':
                    if (['Underpass', 'Grid'].includes(battleRealm)) {
                        playerGainWounds(attackerPower);
                    } else if (['Theater', 'Solarium'].includes(battleRealm)) {
                        playerGainBurden(attackerPower);
                    }
                    break;
                case 'PLAYER_RAID':
                    if (['Underpass', 'Grid'].includes(battleRealm)) {
                        enemyGainWounds(attackerPower);
                    } else if (['Theater', 'Solarium'].includes(battleRealm)) {
                        enemyGainBurden(attackerPower);
                    }
                    break;
                case 'ENEMY_magi':
                    playerGainFate(attackerPower);
                    break;
                case 'PLAYER_QUEST':
                    enemyGainFate(attackerPower);
                    break;
                case 'ENEMY_tech':
                case 'PLAYER_HACK':
                    // Handle unblocked hacking
                    if (attackerPower > 0) {
                        unblockedHacking = true;
                        if (attackMode === 'PLAYER_HACK') {
                            setPlayerSurge(prevSurge => prevSurge + attackerPower);
                        } else {
                            setEnemySurge(prevSurge => prevSurge + attackerPower);
                        }
                    }
                    break;
                default:
                    console.error('Invalid attack mode:', attackMode);
                    break;
            }

            console.log(`${attacker.card.name} deals ${attackerPower} unblocked damage.`);
        }
    }







    const handleEndOfBattle = () => {
        playerBattleSlots.forEach(cardEntity => {
            if (cardEntity) returnToOriginalRealm(cardEntity, 'PLAYER');
        });
        enemyBattleSlots.forEach(cardEntity => {
            if (cardEntity) returnToOriginalRealm(cardEntity, 'ENEMY');
        });

        setPlayerBattleSlots(Array(6).fill(null));
        setEnemyBattleSlots(Array(6).fill(null));
        setGameState('ATTACK_RESOLVED');
        setEnemyTargetSelection(null);
        setEnemyTargetType('none');
    };

    const handleConfirmDefenseSelection = () => {
        handleEnemyBattle()
    };


    // const handleCancelSelection = () => {
    //     setPlayerBattleSelection([]);
    //     setSelectedCard(null);
    // };

    const handlePlaceDamage = (location, id, num, side) => {
        let cardToWound;
        if (cardToWound.wounds < cardToWound.card.HP) {
            switch (location) {
                case 'Theater':
                    if (side == 'PLAYER') {
                        cardToWound = playerTheater.places.find(cardEntity => cardEntity.id === id);
                    } else {
                        cardToWound = enemyTheater.places.find(cardEntity => cardEntity.id === id);
                    }
                    if (cardToWound) {
                        const newWounds = cardToWound.wounds + num;

                        if (newWounds >= cardToWound.card.HP) {
                            handleDestroyedPlace(location, cardToWound, side, cardToWound.card.runes ? cardToWound.card.runes : 0);
                        }
                        else {
                            if (side == ' PLAYER') {
                                setPlayerTheater(prevRealm => {
                                    return {
                                        ...prevRealm,
                                        places: prevRealm.places.map(card => {
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
                                        places: prevRealm.places.map(card => {
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
                case 'Underpass':
                    if (side == 'PLAYER') {
                        cardToWound = playerUnderpass.places.find(cardEntity => cardEntity.id === id);
                    } else {
                        cardToWound = enemyUnderpass.places.find(cardEntity => cardEntity.id === id);
                    }
                    if (cardToWound) {
                        const newWounds = cardToWound.wounds + num;

                        if (newWounds >= cardToWound.card.HP) {
                            handleDestroyedPlace(location, cardToWound, side, cardToWound.card.runes ? cardToWound.card.runes : 0);
                        }
                        else {
                            if (side == ' PLAYER') {
                                setPlayerUnderpass(prevRealm => {
                                    return {
                                        ...prevRealm,
                                        places: prevRealm.places.map(card => {
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
                                        places: prevRealm.places.map(card => {
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
                    console.error('Invalid location');
                    return;
            }
        }
    }

    function handleAccessPhase(side) {
        let accessTarget;
        let acessTargetType;
        let numAccesses = 1; // Base access count
        let library;
        let hand;
        if (side === 'PLAYER') {
            library = enemyLibrary;
            hand = enemyHand;
            accessTarget = playerTargetSelection;
            acessTargetType = targetType;
            if (targetType === 'PANDORA') {
                numAccesses = playerPandoraAccess;
            } else if (targetType === 'HEADSPACE') {
                numAccesses = playerHeadSpaceAccess;
            }
        } else {
            library = playerLibrary;
            hand = playerHand;
            accessTarget = enemyTargetSelection;
            acessTargetType = enemyTargetType;
            if (enemyTargetType === 'PANDORA') {
                numAccesses = enemyPandoraAccess;
            } else if (enemyTargetType === 'HEADSPACE') {
                numAccesses = enemyHeadSpaceAccess;
            }
        }

        console.log('access phase', accessTarget)
        console.log('access type', acessTargetType)

        const accessCards = [];
        if (acessTargetType === 'PANDORA') {
            accessCards.push(...library.slice(0, numAccesses));
        } else if (acessTargetType === 'HEADSPACE') {
            for (let i = 0; i < numAccesses; i++) {
                if (hand.length > 0) {
                    let chosenIndex = Math.floor(Math.random() * hand.length);
                    accessCards.push(hand[chosenIndex]);
                }
            }
        } else if (acessTargetType === 'SYM' || acessTargetType === 'SNIP') {
            accessCards.push(accessTarget);
        }
        processAccessQueue(accessCards, battleRealm, side);
    }

    function processAccessQueue(accessCards, battleRealm, side) {
        if (accessCards.length === 0) {
            console.log('No cards to access.');
            return;
        }
        let index = 0;

        const accessNextCard = () => {
            if (index < accessCards.length) {
                const card = accessCards[index];
                presentAccessedCard(card, battleRealm, side, () => {
                    index++;
                    accessNextCard(); // Proceed to the next card
                });
            } else {
                console.log('Access phase complete.');
            }
        };

        accessNextCard();
    }

    function presentAccessedCard(card, battleRealm, side, callback) {
        displayCardToPlayer(card);
        let location;
        let currentTargetType;
        if (side === 'PLAYER') {
            currentTargetType = targetType;
        } else {
            currentTargetType = enemyTargetType;
        }
        if (currentTargetType === 'PANDORA' || currentTargetType === 'HEADSPACE') {
            location = currentTargetType;
        } else {
            location = battleRealm;
        }

        // Handle card-specific interactions
        if (card.card.category === 'SYM' || card.card.category === 'LANDMARK') {
            handleStolenCard(card, location, side, false, () => {
                callback(); // Proceed after handling stolen card
            });
        } else if (card.card.category === 'SNIP') {
            eventManager.publish('snipAccessed', { card, side });
            if (side === 'PLAYER') {
                promptPlayerToTrashCard(card, location, side, () => {
                    callback(); // Proceed after player decision
                });
            } else {
                handleEnemyTrashCard(card, location, side, () => {
                    callback(); // Proceed after enemy decision
                });
            }
        } else {
            console.log('handle exposed')
            handleExposedCard(card, location, side, () => {
                callback(); // Proceed after exposing card
            });
        }
    }


    function displayCardToPlayer(card) {
        console.log(`Accessed: ${card.card.name}`);
    }

    const handleStolenCard = (card, location, side, scrap, callback) => {
        console.log(`You have stolen: ${card.card.name}`);
        eventManager.publish('cardStolen', { card, location, side });

        // Determine the array to update based on the card's category
        const category = card.card.category;
        let arrayName;
        if (category === 'SYM' || category === 'SNIP') {
            arrayName = 'things';
        } else if (category === 'LANDMARK' || category === 'LOCATION') {
            arrayName = 'places';
        } else {
            arrayName = 'people'; // For ENTITY or other types
        }

        // Helper function to get the appropriate realm setter function
        const getRealmSetter = (location, side) => {
            if (side === 'PLAYER') {
                switch (location) {
                    case 'Underpass':
                        return setPlayerUnderpass;
                    case 'Grid':
                        return setPlayerGrid;
                    case 'Theater':
                        return setPlayerTheater;
                    case 'Solarium':
                        return setPlayerSolarium;
                    default:
                        return null;
                }
            } else {
                switch (location) {
                    case 'Underpass':
                        return setEnemyUnderpass;
                    case 'Grid':
                        return setEnemyGrid;
                    case 'Theater':
                        return setEnemyTheater;
                    case 'Solarium':
                        return setEnemySolarium;
                    default:
                        return null;
                }
            }
        };

        // Get the realm setter based on location and side
        const realmSetter = getRealmSetter(location, side);

        if (realmSetter) {
            // Remove the card from the appropriate array in the realm
            realmSetter(prevRealm => ({
                ...prevRealm,
                [arrayName]: prevRealm[arrayName].filter(item => item.id !== card.id),
            }));
        } else if (location === 'HEADSPACE') {
            // Handle cards in the player's or enemy's hand
            if (side === 'PLAYER') {
                setEnemyHand(prevHand => prevHand.filter(item => item.id !== card.id));
            } else {
                setPlayerHand(prevHand => prevHand.filter(item => item.id !== card.id));
            }
        } else if (location === 'PANDORA') {
            // Handle cards in the player's or enemy's library
            if (side === 'PLAYER') {
                setEnemyLibrary(prevLibrary => prevLibrary.filter(item => item.id !== card.id));
            } else {
                setPlayerLibrary(prevLibrary => prevLibrary.filter(item => item.id !== card.id));
            }
        } else {
            console.error('Invalid location');
            return;
        }

        // Prepare to add the card to the appropriate graveyard
        const cardToRemove = card; // The card being removed
        const runes = card.card.runes || 0; // Assume 'runes' is a property of the card

        // Add the card to the graveyard and adjust Fate
        if (side === 'PLAYER') {
            setEnemyGraveyard(prev => [...prev, cardToRemove]);
            if (!scrap) {
                playerGainFate(runes);
            }
        } else {
            setPlayerGraveyard(prev => [...prev, cardToRemove]);
            if (!scrap) {
                enemyGainFate(runes);
            }
        }

        // Execute the callback function
        callback();
    };


    function promptPlayerToTrashCard(card, location, side, callback) {
        // Display the card and prompt to the player
        console.log(`You may pay ${card.card.trashCost} to trash ${card.card.name}.`);
        displayTrashPrompt(card, (playerChoosesToTrash) => {
            if (playerChoosesToTrash) { // todo
                // Deduct cost from player resources
                playerLoseBits(card.card.scrap);
                handleStolenCard(card, location, side, true, () => {
                    callback(); // Proceed after handling stolen card
                });
                // Implement your resource deduction logic here
                removeFromRealm(card, card.realm, side);


                console.log(`${card.card.name} has been trashed.`);
            } else {
                console.log(`You chose not to trash ${card.card.name}.`);
            }
            // Proceed to the next action
            callback();
        });
    }

    function handleEnemyTrashCard(card, location, side, callback) {
        console.log(`Enemy attempts to pay ${card.card.trashCost} to trash ${card.card.name}.`);
        if (enemyBits >= card.card.trashCost) { // todo display prompt
            // Deduct cost from player resources
            enemyLoseBits(card.card.scrap);
            handleStolenCard(card, location, side, true, () => {
                callback(); // Proceed after handling stolen card
            });
        }
        // Proceed to the next action
        callback();
    };

    function displayTrashPrompt(card, decisionCallback) {
        showModal({
            title: `Delete ${card.card.name}?`,
            message: `You may pay ${card.card.scrap} to trash this card.`,
            onConfirm: () => {
                decisionCallback(true);
            },
            onCancel: () => {
                decisionCallback(false);
            },
        });
    }

    function handleTrashDecision(decision) {
        setTrashPromptVisible(false);
        if (decisionCallback) {
            decisionCallback(decision);
        }
    }

    function handleExposedCard(card, location, side, callback) {
        //console.log('expose ', card)
        console.log('exposed from ', location)

        // Check if the card is already exposed
        if (!card.exposed) {
            // Mark the card as exposed
            card.exposed = true;
            console.log(`${card.card.name} is now exposed.`);

            // Inflict 2 Overload on the opponent
            if (side === 'ENEMY') {
                playerGainOverload(2);
            } else {
                enemyGainOverload(2);
            }

            // Update the card in the relevant array
            if (location === 'HEADSPACE') {
                if (side === 'PLAYER') {
                    console.log('update enemy hand')
                    setEnemyHand(prevHand => prevHand.map(c => (c.id === card.id ? card : c)));
                } else {
                    console.log('update player hand')
                    setPlayerHand(prevHand => prevHand.map(c => (c.id === card.id ? card : c)));
                }
            } else if (location === 'PANDORA') {
                if (side === 'PLAYER') {
                    setEnemyLibrary(prevLibrary => prevLibrary.map(c => (c.id === card.id ? card : c)));
                } else {
                    setPlayerLibrary(prevLibrary => prevLibrary.map(c => (c.id === card.id ? card : c)));
                }
            }
        } else {
            // Card is already exposed
            console.log(`${card.card.name} was already exposed and is now discarded.`);

            // Inflict 3 Overload on the opponent
            if (side === 'ENEMY') {
                playerGainOverload(3);
            } else {
                enemyGainOverload(3);
            }

            // Remove the card from the player's or enemy's zone and add to graveyard
            if (location === 'HEADSPACE') {
                if (side === 'PLAYER') {
                    setEnemyHand(prevHand => prevHand.filter(c => c.id !== card.id));
                    setEnemyGraveyard(prevGraveyard => [...prevGraveyard, card]);
                } else {
                    setPlayerHand(prevHand => prevHand.filter(c => c.id !== card.id));
                    setPlayerGraveyard(prevGraveyard => [...prevGraveyard, card]);
                }
            } else if (location === 'PANDORA') {
                if (side === 'PLAYER') {
                    setEnemyLibrary(prevLibrary => prevLibrary.filter(c => c.id !== card.id));
                    setEnemyGraveyard(prevGraveyard => [...prevGraveyard, card]);
                } else {
                    setPlayerLibrary(prevLibrary => prevLibrary.filter(c => c.id !== card.id));
                    setPlayerGraveyard(prevGraveyard => [...prevGraveyard, card]);
                }
            }
        }

        // Execute the callback function
        if (callback) {
            callback();
        }
    }

    function applyOverrideDamage(attacker, excessDamage, side, currentRealm) {
        const opponentSide = getOppositeSide(side);

        // Determine the target selection and type based on the side
        const targetSelection = side === 'PLAYER' ? playerTargetSelection : enemyTargetSelection;
        const targetTypeVar = side === 'PLAYER' ? targetType : enemyTargetType;

        if (
            targetSelection &&
            (targetSelection.card.category === 'LOCATION' || targetSelection.card.category === 'LANDMARK')
        ) {
            // Apply excess damage to the Place
            handlePlaceDamage(targetSelection.realm, targetSelection.id, excessDamage, opponentSide);
            console.log(`${attacker.card.name} deals ${excessDamage} Override damage to ${targetSelection.card.name}.`);
        } else {
            // Apply the excess damage as unblocked damage to the opponent directly, based on the realm
            if (['Underpass', 'Grid'].includes(currentRealm)) {
                // Apply wounds in Underpass and Grid realms
                if (opponentSide === 'PLAYER') {
                    playerGainWounds(excessDamage);
                    console.log(`${attacker.card.name} deals ${excessDamage} Override damage as wounds to the player.`);
                } else {
                    enemyGainWounds(excessDamage);
                    console.log(`${attacker.card.name} deals ${excessDamage} Override damage as wounds to the enemy.`);
                }
            } else if (['Theater', 'Solarium'].includes(currentRealm)) {
                // Apply burden in Theater and Solarium realms
                if (opponentSide === 'PLAYER') {
                    playerGainBurden(excessDamage);
                    console.log(`${attacker.card.name} deals ${excessDamage} Override damage as burden to the player.`);
                } else {
                    enemyGainBurden(excessDamage);
                    console.log(`${attacker.card.name} deals ${excessDamage} Override damage as burden to the enemy.`);
                }
            } else {
                // Handle other realms if necessary
                console.error(`Unknown realm '${currentRealm}' for Override damage application.`);
            }
        }
    }

    function handleDamage(location, entityId, damageAmount, owner) {
        let cardToWound;
        let setRealmOrBattleSlots;
        let damageDealt = 0;
        let excessDamage = 0;

        // Handle the 'BATTLE' location separately
        if (location === 'BATTLE') {
            if (owner === 'PLAYER') {
                cardToWound = playerBattleSlots.find((card) => card && card.id === entityId);
                setRealmOrBattleSlots = setPlayerBattleSlots;
            } else {
                cardToWound = enemyBattleSlots.find((card) => card && card.id === entityId);
                setRealmOrBattleSlots = setEnemyBattleSlots;
            }

            if (cardToWound) {
                // Get Armor amount
                const armorAmount = cardToWound.armored || 0;

                // Adjust damage amount by Armor
                const adjustedDamageAmount = Math.max(damageAmount - armorAmount, 0);

                const currentWounds = cardToWound.wounds || 0;
                const maxHealth = cardToWound.card.HP;
                const remainingHealth = maxHealth - currentWounds;
                const actualDamage = Math.min(remainingHealth, adjustedDamageAmount);
                damageDealt = actualDamage;
                excessDamage = adjustedDamageAmount - actualDamage;

                const newWounds = currentWounds + actualDamage;
                console.log(
                    `${cardToWound.card.name} receives ${actualDamage} damage after Armor. Total wounds: ${newWounds}`
                );

                if (newWounds >= maxHealth) {
                    handleDeadCard(location, entityId, owner);
                } else {
                    setRealmOrBattleSlots((prev) =>
                        prev.map((card) =>
                            card && card.id === entityId ? { ...card, wounds: newWounds } : card
                        )
                    );
                }
            }
        } else {
            // Use getRealmAndSetter for realm locations
            const [realm, setRealm] = getRealmAndSetter(location, owner);

            const entityIndex = realm.people.findIndex((e) => e.id === entityId);
            if (entityIndex === -1) return { damageDealt: 0, excessDamage: 0 };

            const oldEntity = realm.people[entityIndex];

            // Get Armor amount
            const armorAmount = oldEntity.armored || 0;

            // Adjust damage amount by Armor
            const adjustedDamageAmount = Math.max(damageAmount - armorAmount, 0);

            const currentWounds = oldEntity.wounds || 0;
            const maxHealth = oldEntity.card.HP;
            const remainingHealth = maxHealth - currentWounds;
            const actualDamage = Math.min(remainingHealth, adjustedDamageAmount);
            damageDealt = actualDamage;
            excessDamage = adjustedDamageAmount - actualDamage;

            const newEntity = { ...oldEntity, wounds: currentWounds + actualDamage };
            console.log(
                `${newEntity.card.name} receives ${actualDamage} damage after Armor. Total wounds: ${newEntity.wounds}`
            );

            if (newEntity.wounds >= maxHealth) {
                handleDeadCard(location, entityId, owner);
            } else {
                const newPeople = [...realm.people];
                newPeople[entityIndex] = newEntity;

                setRealm({
                    ...realm,
                    people: newPeople,
                });
            }
        }

        return { damageDealt, excessDamage };
    }




    function handleDeadCard(location, entityId, side) {
        let cardToRemove;
        console.log("handleDeadCard called with:", { location, entityId, side })

        // Convert entityId to number if necessary
        const numericEntityId = typeof entityId === 'string' ? entityId : entityId;
        console.log('Numeric Entity ID:', numericEntityId, 'Type:', typeof numericEntityId);

        if (location === 'BATTLE') {
            let battleSlots, setBattleSlots;

            if (side === 'PLAYER') {
                battleSlots = playerBattleSlots;
                setBattleSlots = setPlayerBattleSlots;
            } else {
                battleSlots = enemyBattleSlots;
                setBattleSlots = setEnemyBattleSlots;
            }

            cardToRemove = battleSlots.find(card => card && card.id === numericEntityId);
            console.log('Card to remove in BATTLE:', cardToRemove);

            if (cardToRemove) {
                // Remove the card from battle slots
                setBattleSlots(prev => {
                    const newSlots = [...prev];
                    const index = newSlots.findIndex(card => card && card.id === numericEntityId);
                    if (index !== -1) {
                        newSlots[index] = null;
                        console.log(`BattleSlots updated. Slot ${index} set to null.`);
                    } else {
                        console.log('Card not found in battleSlots.');
                    }
                    return newSlots;
                });
            } else {
                console.log('Card not found in battleSlots.');
            }
        } else {
            const [realm, setRealm] = getRealmAndSetter(location, side);
            console.log('Retrieved realm and setter:', { realm, setRealm });

            // Check the structure of the realm.people array
            console.log(`Current people in ${location}:`, realm.people);

            cardToRemove = realm.people.find(card => card.id === numericEntityId);
            console.log('cardToRemove:', cardToRemove);
            console.log('filter ', playerUnderpass.people.filter(card => card.id !== numericEntityId))
            if (cardToRemove) {
                console.log('Removing card');
                setRealm(prevRealm => ({
                    ...prevRealm,
                    people: prevRealm.people.filter(card => card.id !== numericEntityId),
                }));
                console.log(`Card with ID ${numericEntityId} removed from ${location}.`);
            }
        }

        if (cardToRemove) {
            console.log('Proceeding to deactivate abilities and handle Deathless.');

            // Deactivate abilities
            deactivateAbilities(cardToRemove, side);
            console.log(`Abilities of ${cardToRemove.card.name} deactivated.`);

            // Check if the card has Deathless
            const hasDeathless = cardToRemove.deathless > 0;
            console.log(`Card has Deathless: ${hasDeathless}`);

            // Publish death event
            eventManager.publish('entityDied', { entityId: numericEntityId, realmName: location, owner: side });

            // Gain ashes based on side
            if (side === 'PLAYER') {
                playerGainAshes(1);
                console.log('Player gains 1 Ash.');
            } else {
                enemyGainAshes(1);
                console.log('Enemy gains 1 Ash.');
            }

            if (hasDeathless) {
                // Reset the card's stats
                const resetCard = {
                    ...cardToRemove,
                    power: cardToRemove.card.power || 0,
                    HP: cardToRemove.card.HP || 0,
                    wounds: 0, // Assuming 'wounds' is used for damage
                    exposed: false,
                    scored: false,
                    online: false,
                    readied: false,
                    steps: 0,
                    freeze: 0,
                    decay: 0,
                    venom: 0,
                    charge: cardToRemove.card.charge || 0,
                    sacrificed: false,
                    cosmic: cardToRemove.card.cosmic || 1,
                    deathless: cardToRemove.deathless || 0,
                    pounce: cardToRemove.pounce || 0,
                    override: cardToRemove.override || 0,
                    stealth: cardToRemove.stealth || 0,
                    armored: cardToRemove.armored || 0,
                    statusEffects: {},
                };

                // Add the reset card to HeadSpace
                if (side === 'PLAYER') {
                    setPlayerHand(prev => [...prev, resetCard]);
                    console.log(`Added reset card to Player Hand:`, resetCard);
                } else {
                    setEnemyHand(prev => [...prev, resetCard]);
                    console.log(`Added reset card to Enemy Hand:`, resetCard);
                }

                console.log(`${cardToRemove.card.name} is Deathless and returns to HeadSpace.`);
            } else {
                if (side === 'PLAYER') {
                    setPlayerGraveyard(prev => [...prev, cardToRemove]);
                    console.log(`Added card to Player Graveyard:`, cardToRemove);
                } else {
                    setEnemyGraveyard(prev => [...prev, cardToRemove]);
                    console.log(`Added card to Enemy Graveyard:`, cardToRemove);
                }
            }
        } else {
            console.error(`Card with ID ${entityId} not found in ${location} for side ${side}`);
        }

        setAwaitingSacrifices(false); // Indicate that sacrifices are complete
    }


    function handleDestroyedThing(location, entityId, side, runes = 0) {
        const [realm, setRealm] = getRealmAndSetter(location, side);

        // Find the thing to remove
        const thingToRemove = realm.things.find(card => card.id === entityId);

        if (thingToRemove) {
            // Publish an event if necessary (e.g., 'thingDestroyed')
            eventManager.publish('thingDestroyed', {
                entityId: thingToRemove.id,
                side: side,
                realm: location,
            });

            // Remove the thing from the realm
            setRealm(prevRealm => ({
                ...prevRealm,
                things: prevRealm.things.filter(card => card.id !== entityId),
            }));

            // Check if the Thing is a Sym
            if (thingToRemove.card.category === 'SYM') {
                // Award Fate equal to the Sym's Runes to the opposing player
                const fateAmount = thingToRemove.card.runes || 0; // Assuming 'runes' is a property on the card
                const opposingSide = getOppositeSide(side);
                if (opposingSide === 'PLAYER') {
                    playerGainFate(fateAmount);
                    console.log(`${thingToRemove.card.name} was destroyed. Player gains ${fateAmount} Fate.`);
                } else {
                    enemyGainFate(fateAmount);
                    console.log(`${thingToRemove.card.name} was destroyed. Enemy gains ${fateAmount} Fate.`);
                }
            }

            // Add the thing to the graveyard
            if (side === 'PLAYER') {
                setPlayerGraveyard(prev => [...prev, thingToRemove]);
            } else {
                setEnemyGraveyard(prev => [...prev, thingToRemove]);
            }

            // Log the destruction
            console.log(`${thingToRemove.card.name} has been destroyed and moved to the graveyard.`);
        } else {
            console.error(`Thing with ID ${entityId} not found in ${location} for side ${side}`);
        }
    }


    function handleDestroyedPlace(location, entityId, side, runes = 0) {

        const [realm, setRealm] = getRealmAndSetter(location, side);

        // Find the place to remove
        const placeToRemove = realm.places.find(card => card.id === entityId);

        if (placeToRemove) {
            eventManager.publish('placeDestroyed', {
                entityId: placeToRemove.id,
                side: side,
                realm: location,
            });
            setRealm(prevRealm => ({
                ...prevRealm,
                places: prevRealm.places.filter(card => card.id !== entityId),
            }));

            // Check if the place is a 'LANDMARK'
            if (placeToRemove.card.category === 'LANDMARK') {
                if (side === 'PLAYER') {
                    enemyGainFate(runes);
                } else {
                    playerGainFate(runes);
                }
            }

            // Add the place to the graveyard
            if (side === 'PLAYER') {
                setPlayerGraveyard(prev => [...prev, placeToRemove]);
            } else {
                setEnemyGraveyard(prev => [...prev, placeToRemove]);
            }
        } else {
            console.error(`Place with ID ${entityId} not found in ${location} for side ${side}`);
        }
    }



    const handleRezPlayerCard = (entity) => {
        console.log('handle rez', entity)
        const soulsAvailable = calculateSoulsAvailable(entity.id);
        if ((entity.card.category !== 'LANDMARK' && entity.online) && (entity.card.category !== 'LOCATION' && entity.online)) {
            console.log('already online')
            return;
        }

        if (playerBits < entity.card.rezCost || playerAshes < entity.card.ash || soulsAvailable < entity.card.soul) {
            console.log('no resources')
            //console.error('Not enough resources to rez the card');
            return;
        }
        console.log('rezzing now')
        setRezCard(entity);
        setAwaitingSacrifices(true);
        if (!entity.card.soul || entity.card.soul === 0) {
            console.log('no soul cost')
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
                // Filter out the card being online, then count the remaining cards
                return sum + realm.people.filter(card => card.id !== id).length;
            }
            return sum;
        }, 0);
    };

    const handleServerSelect = (targetType) => {
        setSelectedCard(null);
        setDraftSelected(false);
        setTargetType(targetType);
    }

    const handleFocusSelect = (focus) => {
        console.log('focus select ', focus)
        setFocus(focus);
        setAwaitingFocus(false);
    }

    function handleImpostorPlacement(selectedCard, enemyCard, realmName, side, dreamer) {
        // Determine the realms and setter functions based on the side
        let ownRealm, setOwnRealm, opponentRealm, setOpponentRealm;

        if (side === 'PLAYER') {
            ownRealm = getPlayerRealmByName(realmName);
            setOwnRealm = getSetPlayerRealm(realmName);
            opponentRealm = getEnemyRealmByName(realmName);
            setOpponentRealm = getSetEnemyRealm(realmName);
        } else {
            ownRealm = getEnemyRealmByName(realmName);
            setOwnRealm = getSetEnemyRealm(realmName);
            opponentRealm = getPlayerRealmByName(realmName);
            setOpponentRealm = getSetPlayerRealm(realmName);
        }

        // Swap the cards
        swapEntitiesForImpostor(selectedCard, enemyCard, realmName, setOwnRealm, setOpponentRealm, side, dreamer);

        // Remove the selected card from the player's or enemy's hand
        if (side === 'PLAYER') {
            setPlayerHand((prevHand) => prevHand.filter((card) => card.id !== selectedCard.id));
        } else {
            setEnemyHand((prevHand) => prevHand.filter((card) => card.id !== selectedCard.id));
        }

        // Deduct an action point from the acting player
        if (side === 'PLAYER') {
            playerLoseActions(1);
        } else {
            enemyLoseActions(1);
        }

        // Reset selection states
        setSelectedCard(null);
        setSelectedInHand(false);
        setDraftSelected(false);
        setTargetType('none');
        setCurrentPlayer(getOppositeSide(side));
    }

    function swapEntitiesForImpostor(selectedCard, enemyEntity, realmName, setOwnRealm, setOpponentRealm, side, dreamer) {
        // Update ownership and realm properties
        const updatedSelectedCard = { ...selectedCard, realm: realmName, owner: getOppositeSide(side) };
        const updatedEnemyEntity = { ...enemyEntity, realm: realmName, owner: side };

        // Determine which arrays to use based on card categories
        const selectedCardArrayName = getArrayNameForCategory(selectedCard.card.category);
        const enemyCardArrayName = getArrayNameForCategory(enemyEntity.card.category);

        // Remove enemy entity from opponent realm
        setOpponentRealm((prevRealm) => ({
            ...prevRealm,
            [enemyCardArrayName]: prevRealm[enemyCardArrayName].filter((entity) => entity.id !== enemyEntity.id),
        }));

        // Add enemy entity to own realm
        setOwnRealm((prevRealm) => ({
            ...prevRealm,
            [enemyCardArrayName]: [...prevRealm[enemyCardArrayName], updatedEnemyEntity],
        }));

        // Add selected card to opponent realm
        setOpponentRealm((prevRealm) => ({
            ...prevRealm,
            [selectedCardArrayName]: [...prevRealm[selectedCardArrayName], updatedSelectedCard],
        }));

        // Activate abilities for a Dreamer
        if (dreamer) {
            activateAbilities(updatedSelectedCard, getOppositeSide(side));
        }
    }

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
            const ritualAbilities = selectedCard.card.abilities.filter(
                (ability) => typeof ability === 'object' && ability.requiresTarget
            );

            ritualAbilities.forEach((ability) => {
                if (ability.requiresTarget) {
                    const abilityDef = abilitiesDefinitions[ability.name];
                    if (abilityDef && abilityDef.targetFilter) {
                        setPendingRitual({ entity: selectedCard, ability: abilityDef });
                        setTargetSelection({
                            enabled: true,
                            side: 'PLAYER',
                            filter: abilityDef.targetFilter,
                            onSelect: (target) => {
                                confirmRitualActivation(target);
                            },
                            onCancel: () => {
                                setPendingRitual(null);
                                setTargetSelection({ enabled: false });
                            },
                        });
                    }
                }
            });

            // Handle rituals without target requirements
            const nonTargetRitualAbilities = selectedCard.card.abilities.filter(
                (ability) => !(typeof ability === 'object' && ability.requiresTarget)
            );

            if (nonTargetRitualAbilities.length > 0) {
                removeCardFromHand(selectedCard);
                triggerRitualAbilities(selectedCard, null, 'PLAYER');
                endPlayerTurn();
            }

            return;
        }

        if (battleSelectedCard) {
            returnToOriginalRealm(battleSelectedCard, 'PLAYER');
            setBattleSelectedCard(null);
        }
        if (!selectedInHand) return;
        const isImpostor = selectedCard.card.abilities?.some(
            (ability) => ability.name === 'Impostor'
        ) || (draftSelected && recruiterCount > 0);

        if (isImpostor) {
            console.log('___________awaiting impostor')
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
                    updatedCard.online = true; // Played face up
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
            // Handle activation cost for Locations
            if (category === 'LOCATION' && activationCost > 0) {
                if (playerBits >= activationCost) {
                    playerLoseBits(activationCost); // Deduct bits
                } else {
                    // Not enough bits to place the card
                    return;
                }
            }

            // Add the card to the appropriate array in the realm
            targetRealmSetter((prevRealm) => ({
                ...prevRealm,
                [placementArray]: [...prevRealm[placementArray], updatedCard],
            }));

            playerLoseActions(1); // Deduct an action point

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

    function confirmRitualActivation(target) {
        const { entity, ability } = pendingRitual;
        removeCardFromHand(entity);
        triggerRitualAbilities(entity, target, 'PLAYER', ability);
        endPlayerTurn();
    }

    function removeCardFromHand(card) {
        setPlayerHand((prevHand) => prevHand.filter((c) => c.id !== card.id));
        playerLoseActions(1);
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




    //effects

    const abilitiesDefinitions = {
        'Extortion': {
            name: 'Extortion',
            type: 'onPlay',
            onPlay: function (entity, gameState, side) {
                const countEntities = () => {
                    let count = 0;
                    const realms = ['playerSolarium', 'enemySolarium', 'playerTheater', 'enemyTheater', 'playerUnderpass', 'enemyUnderpass', 'playerGrid', 'enemyGrid'];
                    realms.forEach(realmName => {
                        const realm = gameState[realmName];
                        if (realm) {
                            count += realm.people.length;
                        }
                    });
                    return count;
                };

                const totalEntities = countEntities();
                const bitsToGain = totalEntities * 2;
                if (side === 'PLAYER') {
                    playerGainBits(bitsToGain);
                } else {
                    enemyGainBits(bitsToGain);
                }
                console.log(`${side} gains ${bitsToGain} Bits from Extortion.`);
            }
        },
        'SplinterFactionAscend': {
            name: "SplinterFactionAscend",
            type: "onAscend",
            onAscend: function (entity, gameState, side) {
                const enemySide = side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
                const library = enemySide === 'PLAYER' ? playerLibrary : enemyLibrary;
                library.forEach(card => {
                    handleDamage(card.realm, card.id, 2, enemySide);
                });
                console.log(`${entity.card.name} dealt 2 damage to all enemy entities.`);
            },
        },
        'ForgottenIsland': {
            name: "ForgottenIslandAscend",
            type: "onAscend",
            onAscend: function (entity, gameState, side) {
                if (side === 'PLAYER') {
                    playerGainBits(10);
                } else {
                    enemyGainBits(10);
                }
                console.log(`${entity.card.name} grants 10 Bits to ${side}.`);
            },
        },
        'Wasteland': {
            name: "Wasteland",
            type: "Ascended",
            typeCategory: "triggered",
            triggers: ["cardStolen", "placeDestroyed"],
            eventHandler: function (entity, eventData, gameState, side) {
                if (
                    (eventData.card && eventData.card.id === entity.id) ||
                    (eventData.entityId && eventData.entityId === entity.id)
                ) {
                    const opponentSide = side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
                    if (opponentSide === 'PLAYER') {
                        playerGainWounds(1);
                    } else {
                        enemyGainWounds(1);
                    }
                    console.log(`${entity.card.name} inflicted 1 Wound to ${opponentSide}.`);
                }
            },
        },
        'CatCafeAscended': {
            name: "CatCafeAscendedAbility",
            type: "Ascended",
            typeCategory: "triggered", // Indicates it's a triggered ability
            triggers: ["turnStart"], // List of events it listens to
            eventHandler: function (entity, eventData, gameState, side) {
                if (eventData.side === side && entity.realm === 'Elysium') {
                    if (side === 'PLAYER') {
                        playerGainOverload(3);
                    } else {
                        enemyGainOverload(3);
                    }
                    console.log(`${entity.card.name} has inflicted 3 Overload to ${side}.`);
                }
            },
        },
        'AdrenochromeAscend': {
            name: 'AdrenochromeAscend',
            type: 'onAscend',
            onAscend: function (entity, gameState, side) {
                if (side === 'PLAYER') {
                    playerGainActions(prevActions => prevActions + 2);
                    playerGainAshes(prevAsh => prevAsh + 3);
                    playerGainOverload(prevOverload => prevOverload + 4);
                } else {
                    enemyGainActions(prevActions => prevActions + 2);
                    enemyGainAshes(prevAsh => prevAsh + 3);
                    enemyGainOverload(prevOverload => prevOverload + 4);
                }
                console.log(`${entity.card.name} has granted 2 Actions, 3 Ash, and 4 Overload to ${side}.`);
            },
        },
        'ImplantsEffect': {
            name: 'ImplantsEffect',
            type: 'onPlay',
            onPlay: function (entity, gameState, side) {
                // Grant +2 Surge and +2 Ash
                if (side === 'PLAYER') {
                    playerGainSurge(2);
                    playerGainAshes(2);
                } else {
                    enemyGainSurge(2);
                    enemyGainAshes(2);
                }

                // Search Pandora for JAWbreaker entities
                const pandora = side === 'PLAYER' ? playerLibrary : enemyLibrary; // Ensure these state variables exist
                //console.log(pandora)
                const jawbreakerEntities = pandora.filter(entity =>
                    entity.card.subTypes?.includes('JAWbreaker')
                );
                console.log(jawbreakerEntities)
                if (jawbreakerEntities.length > 0) {
                    showModal({
                        title: 'Search Pandora',
                        message: 'Select a JAWbreaker to draw:',
                        renderContent: () => (
                            <div>
                                <ul>
                                    {jawbreakerEntities.map(jb => (
                                        <li
                                            key={jb.id}
                                            onClick={() => {
                                                drawSpecificCard(jb, side);
                                                setModalVisible(false);
                                            }}
                                            style={{ cursor: 'pointer', marginBottom: '5px' }}
                                        >
                                            {jb.card.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ),
                        onConfirm: setModalVisible(false),
                        onCancel: setModalVisible(false),
                    });
                } else {
                    // No valid JAWbreaker found, proceed without drawing
                    console.log('No JAWbreaker entities found in Pandora.');
                }
            },
        },
        'ExploitEffect': {
            name: 'ExploitEffect',
            type: 'onPlay',
            condition: 'successfulHack',
            requiresTarget: true,
            targetFilter: (target) =>
                target.card.subTypes?.includes('JAWbreaker') &&
                target.owner === 'PLAYER' &&
                target.online,
            onPlay: function (entity, gameState, side, target) {
                const hasHacked = side === 'PLAYER' ? playerInterfaced : enemyInterfaced;
                if (hasHacked && target) {
                    applyEffect(target.id, target.realm, side, {
                        type: 'stat',
                        field: 'power',
                        value: 2,
                    });
                    applyEffect(target.id, target.realm, side, {
                        type: 'stat',
                        field: 'HP',
                        value: 2,
                    });
                    applyEffect(target.id, target.realm, side, {
                        type: 'status',
                        status: 'Stealth',
                        amount: 1,
                    });
                }
            },
        },
        'Duplicate': {
            name: 'Duplicate',
            type: 'onPlay',
            onPlay: function (entity, gameState, side) {
                const duplicateAbility = entity.card.abilities.find(
                    (ability) => ability.name === 'Duplicate'
                );
                const duplicateAmount = duplicateAbility?.amount || 1;

                if (duplicateAmount >= 1) {
                    const newCardEntity = { //todo1
                        ...entity,
                        id: `z${Math.random()}`,
                        realm: 'HEADSPACE',
                        owner: side,
                        card: {
                            ...entity.card,
                            abilities: entity.card.abilities.map((ability) => {
                                if (ability.name === 'Duplicate') {
                                    return { ...ability, amount: duplicateAmount - 1 };
                                }
                                return ability;
                            }),
                        },
                    };

                    if (side === 'PLAYER') {
                        setPlayerHand((prevHeadSpace) => [...prevHeadSpace, newCardEntity]);
                    } else {
                        setEnemyHand((prevHeadSpace) => [...prevHeadSpace, newCardEntity]);
                    }
                }
            },
        },
        'MultiThreadingEffect': {
            name: 'MultiThreadingEffect',
            type: 'onPlay',
            requiresTarget: true,
            onPlay: function (entity, gameState, side, target) {
                if (side === 'PLAYER') {
                    playerDraw(2);
                } else {
                    enemyDraw(2);
                }

                if (target && target.owner === side) {
                    applyBoost(target, 1, side);
                }

                setAttackMode(side === 'PLAYER' ? 'PLAYER_HACK' : 'ENEMY_tech');
            },
        },
        'ForgeryEffect': {
            name: 'ForgeryEffect',
            type: 'onPlay',
            onPlay: function (entity, gameState, side) {
                if (side === 'PLAYER' && playerInterfacedHeadSpace) {
                    playerGainBits(10);
                    const CatPhishCard = cardList.find(card => card.name === 'CatPhish');

                    if (CatPhishCard) {
                        const newCatPhishEntity = {
                            id: `z${Math.random()}`,
                            card: CatPhishCard,
                            power: CatPhishCard.power || 0,
                            HP: CatPhishCard.HP || 0,
                            damage: 0,
                            exposed: false,
                            scored: false,
                            online: false,
                            readied: false,
                            steps: 0,
                            freeze: 0,
                            decay: 0,
                            venom: 0,
                            charge: CatPhishCard.charge || 0,
                            sacrificed: false,
                            cosmic: CatPhishCard.cosmic || 1,
                            deathless: CatPhishCard.deathless || 0, //todo1
                            pounce: CatPhishCard.pounce || 0,
                            override: CatPhishCard.override || 0,
                            stealth: CatPhishCard.stealth || 0,
                            armored: CatPhishCard.armored || 0,
                            development: CatPhishCard.development || 0,
                            plot: CatPhishCard.plot || 0,
                            owner: 'ENEMY',
                        };
                        setEnemyUnderpass(prevRealm => ({
                            ...prevRealm,
                            people: [...prevRealm.people, newCatPhishEntity],
                        }));
                    } else {
                        console.error('CatPhish card not found in the library.');
                    }
                } else if (side === 'ENEMY' && enemyInterfacedHeadSpace) {
                    enemyGainBits(10);
                    const CatPhishCard = cardList.find(card => card.name === 'CatPhish');

                    if (CatPhishCard) {
                        const newCatPhishEntity = {
                            id: `z${Math.random()}`,
                            card: CatPhishCard,
                            power: CatPhishCard.power || 0,
                            HP: CatPhishCard.HP || 0,
                            damage: 0,
                            exposed: false,
                            scored: false,
                            online: false,
                            readied: false,
                            steps: 0,
                            freeze: 0,
                            decay: 0,
                            venom: 0,
                            charge: CatPhishCard.charge || 0,
                            sacrificed: false,
                            cosmic: CatPhishCard.cosmic || 1,
                            deathless: CatPhishCard.deathless || 0,
                            pounce: CatPhishCard.pounce || 0,
                            override: CatPhishCard.override || 0,
                            stealth: CatPhishCard.stealth || 0,
                            armored: CatPhishCard.armored || 0,
                            development: CatPhishCard.development || 0,
                            plot: CatPhishCard.plot || 0,
                            owner: 'ENEMY',
                        };
                        setPlayerUnderpass(prevRealm => ({
                            ...prevRealm,
                            people: [...prevRealm.people, newCatPhishEntity],
                        }));
                    } else {
                        console.error('CatPhish card not found in the library.');
                    }
                }
            },
        },
        'GainAshAndOverload': {
            name: 'GainAshAndOverload',
            type: 'onPlay',
            onPlay: function (entity, gameState, side) {
                // Gain 6 Ash
                if (side === 'PLAYER') {
                    playerGainAshes(6);
                } else {
                    enemyGainAshes(6);
                }

                // Gain 3 Overload
                if (side === 'PLAYER') {
                    setPlayerOverload(prevOverload => prevOverload + 3);
                } else {
                    setEnemyOverload(prevOverload => prevOverload + 3);
                }
            },
        },
        'BrainFreezeHackPandora': {
            name: 'BrainFreezeHackPandora',
            type: 'onPlay',
            onPlay: function (entity, gameState, side) {
                // Set up a one-time listener for successfulHack and failedHack events
                const handler = (eventData) => {
                    if (eventData.side === side && eventData.targetType === 'PANDORA') {
                        if (eventData.success) {
                            // Apply Freeze 3 to all entities
                            applyFreezeToAllEntities(3);
                        }
                        // Unsubscribe the handler
                        eventManager.unsubscribe('successfulHack', handler);
                        eventManager.unsubscribe('failedHack', handler);
                    }
                };

                eventManager.subscribe('successfulHack', handler);
                eventManager.subscribe('failedHack', handler);

                // Initiate hack attack mode targeting Pandora
                setAttackMode('PLAYER_HACK');
                setTargetType('PANDORA');
                setSelectedRealm('Grid'); // Only Grid can perform the hack
            },
        },
        'ImitationGameInflictOverload': {
            name: 'ImitationGameInflictOverload',
            type: 'manual',
            execute: function (entity, effect, side) {
                const overloadAmount = effect.overloadAmount || 3;
                const opposingSide = getOppositeSide(side);
                applyOverload(opposingSide, overloadAmount);
                console.log(`${entity.card.name} inflicts ${overloadAmount} Overload to ${opposingSide}.`);
            },
        },
        'DataBombWhenInterfaced': {
            name: 'DataBombWhenInterfaced',
            type: 'triggered',
            triggers: ['snipAccessed'],
            eventHandler: function (entity, eventData, gameState, side) {
                // Check if the accessed card is this entity
                if (eventData.cardId !== entity.id) {
                    return; // Not the correct card
                }

                // Calculate Overload amount
                const overloadAmount = (entity.development || 0) * 2;

                // Apply Overload to the opposing side
                const opposingSide = getOppositeSide(side);
                applyOverload(opposingSide, overloadAmount);

                console.log(`${entity.card.name} inflicts ${overloadAmount} Overload to ${opposingSide} when interfaced.`);
            },
        },
        'DataBombSacrificeForFreeze': {
            name: 'DataBombSacrificeForFreeze',
            type: 'manual',
            requiresTarget: true,
            execute: function (entity, effect, side, target) {
                if (entity.scheming && !entity.schemeUnlocked) {
                    console.log(`${entity.card.name}'s Scheme ability is not yet unlocked.`);
                    return;
                }
                if (target) {
                    handleDestroyedThing(entity.realm, entity.id, side);
                    applyEffect(target.id, target.realm, getOppositeSide(side), {
                        type: 'status',
                        status: 'Freeze',
                        amount: effect.freezeAmount,
                    });
                    console.log(`${target.card.name} gains Freeze ${effect.freezeAmount} from ${entity.card.name}.`);
                } else {
                    console.log('No target selected for Data Bomb\'s ability.');
                }
            },
        },
        'PandoraAccess': {
            name: 'PandoraAccess',
            type: 'static',
            applyEffect: function (entity, gameState, side) {
                if (side === 'PLAYER') {
                    setPlayerPandoraAccess(prev => prev + 1);
                } else {
                    setEnemyPandoraAccess(prev => prev + 1);
                }
                console.log(`${entity.card.name} increases Pandora Access by 1.`);
            },
            removeEffect: function (entity, gameState, side) {
                if (side === 'PLAYER') {
                    setPlayerPandoraAccess(prev => prev - 1);
                } else {
                    setEnemyPandoraAccess(prev => prev - 1);
                }
                console.log(`${entity.card.name} decreases Pandora Access by 1.`);
            },
        },
        'Drift': {
            name: 'Drift',
            type: 'static',
            applyEffect: function (entity, gameState, side) {
                if (side === 'PLAYER') {
                    setPlayerDriftCount(prev => prev + 1);
                } else {
                    setEnemyDriftCount(prev => prev + 1);
                }
                console.log(`${entity.card.name} increases Drift count by 1.`);
            },
            removeEffect: function (entity, gameState, side) {
                if (side === 'PLAYER') {
                    setPlayerDriftCount(prev => prev - 1);
                } else {
                    setEnemyDriftCount(prev => prev - 1);
                }
                console.log(`${entity.card.name} decreases Drift count by 1.`);
            },
        },
        'Dividend': (amount) => ({
            name: 'Dividend',
            type: 'static',
            applyEffect: function (entity, gameState, side) {
                if (side === 'PLAYER') {
                    setPlayerDividendAmount(prev => prev + amount);
                } else {
                    setEnemyDividendAmount(prev => prev + amount);
                }
                console.log(`${entity.card.name} increases Dividend count.`);
            },
            removeEffect: function (entity, gameState, side) {
                if (side === 'PLAYER') {
                    setPlayerDividendAmount(prev => prev - amount);
                } else {
                    setEnemyDividendAmount(prev => prev - amount);
                }
                console.log(`${entity.card.name} decreases Dividend count.`);
            },
        }),
        'GainActionsOnPandoraInterface': {
            name: 'GainActionsOnPandoraInterface',
            type: 'triggered',
            triggers: ['successfulHack'],
            eventHandler: function (entity, eventData, gameState, side) {
                if (entity.scheming && !entity.schemeUnlocked) {
                    return;
                }
                if (eventData.side === side && eventData.targetType === 'PANDORA') {
                    if (!entity.abilityActivated) {
                        const amount = entity.card.abilities.find(ability => ability.name === 'GainActionsOnPandoraInterface').effect.amount || 3;
                        if (side === 'PLAYER') {
                            setPlayerActions(prevActions => prevActions + amount);
                        } else {
                            setEnemyActions(prevActions => prevActions + amount);
                        }
                        console.log(`${entity.card.name} grants ${amount} Actions upon interfacing with Pandora.`);
                        entity.abilityActivated = true;
                    }
                }
            },
        },
        'GainSurgeAndAshOnPlaceDestroyed': {
            name: 'GainSurgeAndAshOnPlaceDestroyed',
            type: 'triggered',
            triggers: ['placeDestroyed'],
            eventHandler: function (entity, eventData, gameState, side) {
                if (eventData.entityId !== entity.id && eventData.side !== side) {
                    if (side === 'PLAYER') {
                        playerGainSurge(3);
                        playerGainAshes(3);
                    } else {
                        enemyGainSurge(3);
                        enemyGainAshes(3);
                    }
                    console.log(`${entity.name} gains +3 Surge and +3 Ash because another Place was destroyed.`);
                }
            },
        },
        'DamageTargetPlace': {
            name: 'DamageTargetPlace',
            type: 'manual',
            execute: function (entity, effect, side, target) {
                if (!target || !(target.card.category === 'LOCATION' || target.card.category === 'LANDMARK')) {
                    console.log('No valid target Place provided for DamageTargetPlace ability.');
                    return;
                }
                if (side === 'PLAYER') {
                    if (playerActions < 2) {
                        console.log('Not enough actions to activate this ability.');
                        return;
                    }
                    setPlayerActions(prev => prev - 2);
                } else {
                    if (enemyActions < 2) {
                        console.log('Not enough actions to activate this ability.');
                        return;
                    }
                    setEnemyActions(prev => prev - 2);
                }
                handlePlaceDamage(target.realm, target.id, effect.damageAmount, getOppositeSide(side));

                console.log(`${entity.name} deals ${effect.damageAmount} damage to ${target.card.name}.`);
            },
        },
        'GainResourcesOnInterface': {
            name: 'GainResourcesOnInterface',
            type: 'triggered',
            triggers: ['successfulHack'],
            eventHandler: function (entity, eventData, gameState, side) {
                if (eventData.side === side && eventData.targetType === 'HEADSPACE') {
                    if (side === 'PLAYER') {
                        setPlayerBits(prevBits => prevBits + 2);
                        playerGainAshes(2);
                    } else {
                        setEnemyBits(prevBits => prevBits + 2);
                        enemyGainAshes(2);
                    }

                    console.log(`${entity.card.name} grants +2 Bits and +2 Ash upon interfacing with HeadSpace.`);
                }
            },
        },
        'Solo': {
            name: 'Solo',
            type: 'triggered',
            triggers: ['soloAttack'],
            eventHandler: function (entity, eventData, gameState, side) {
                if (eventData.entityId === entity.id) {
                    const soloLevel = entity.card.abilities.find(a => a.name === 'Solo').amount || 1;

                    // Apply Solo effects
                    // Increase power and HP by +1 per level
                    entity.currentPower = (entity.currentPower || entity.card.power || 0) + soloLevel;
                    entity.HP = (entity.HP || entity.card.HP || 0) + soloLevel;

                    // Apply Boost per level
                    applyBoost(entity, soloLevel, side);

                    // Update the entity in its realm or battle slot
                    updateEntityInRealm(entity, side);

                    console.log(`${entity.card.name} gains Solo effects: +${soloLevel} Power, +${soloLevel} HP, +${soloLevel} Boost.`);
                }
            },
        },
        'GainStealth': {
            name: 'GainStealth',
            type: 'manual',
            execute: function (entity, effect, side) {
                // Use grantAbility to give Stealth to the entity
                const amount = effect.amount || 1;
                grantAbility(entity, 'stealth', amount, side);
                console.log(`${entity.card.name} gains Stealth (${amount}).`);
            },
        },
        'DestroyTargetWithVenom': {
            name: 'DestroyTargetWithVenom',
            type: 'manual',
            requiresTarget: true,
            targetFilter: function (target, entity) {
                // Only Online enemy entities with HP less than Leviathan's Venom
                const targetHP = target.card.HP - (target.wounds || 0);
                const leviathanVenom = entity.venom || 0;
                return (
                    target.owner !== entity.owner &&
                    target.online &&
                    targetHP < leviathanVenom
                );
            },
            execute: function (entity, effect, side, target) {
                // Exhaust Leviathan
                exhaustEntity(entity, side);

                // Destroy the target
                handleDeadCard(target.realm, target.id, getOppositeSide(side));

                console.log(`${entity.card.name} destroys ${target.card.name} using Venom (${entity.venom}).`);
            }
        },
        'GainVenomOnInterface': {
            name: 'GainVenomOnInterface',
            type: 'triggered',
            triggers: ['successfulHack'],
            eventHandler: function (entity, eventData, gameState, side) {
                if (eventData.side === side && eventData.targetType === 'HEADSPACE') {
                    // Increase Leviathan's Venom by 3
                    const venomIncrease = 3;
                    entity.venom = (entity.venom || 0) + venomIncrease;

                    // Update the entity in its realm
                    updateEntityInRealm(entity, side);

                    console.log(`${entity.card.name} gains ${venomIncrease} Venom (Total Venom: ${entity.venom}).`);
                }
            },
        },
        'Armored': {
            name: 'Armored',
            type: 'static',
            applyEffect: function (entity, gameState, side, amount = 1) {
                grantAbility(entity, 'armored', amount, side);
                console.log(`${entity.card.name} gains Armored (${amount}).`);
            },
            removeEffect: function (entity, gameState, side, amount = 1) {
                removeAbility(entity, 'armored', amount, side);
                console.log(`${entity.card.name} loses Armored.`);
            },
        },
        'GainAshOnSteal': {
            name: 'GainAshOnSteal',
            type: 'triggered',
            triggers: ['cardStolen'],
            eventHandler: function (entity, eventData, gameState, side) {
                // Only trigger if the enemy card was stolen
                if (eventData.side !== side) {
                    const amount = entity.card.abilities.find((a) => a.name === 'GainAshOnSteal').amount || 3;
                    if (side === 'PLAYER') {
                        playerGainAshes(amount);
                    } else {
                        enemyGainAshes(amount);
                    }
                    console.log(`${entity.card.name} gains ${amount} Ash because an enemy card was stolen.`);
                }
            },
        },
        'Crusade': {
            name: 'Crusade',
            type: 'triggered',
            triggers: ['firstAttack'],
            eventHandler: function (entity, eventData, gameState, side) {
                if (eventData.side === side) {
                    // Grant 1 bonus action
                    if (side === 'PLAYER') {
                        playerGainActions(1);
                    } else {
                        enemyGainActions(1);
                    }
                    console.log(`${entity.card.name} triggers Crusade, granting 1 bonus action.`);
                }
            },
        },
        'BoostAllAllies': {
            name: 'BoostAllAllies',
            type: 'manual',
            execute: function (entity, effect, side) {
                // Check if the entity is already exhausted
                if (entity.exhausted) {
                    console.log(`${entity.card.name} is already exhausted and cannot activate this ability.`);
                    return;
                }

                // Exhaust the entity
                exhaustEntity(entity, side);

                // Apply Boost 2 to all friendly entities in the same realm
                const realmName = entity.realm;
                const [realm, setRealm] = getRealmAndSetter(realmName, side);

                const boostAmount = effect.boostAmount || 2; // Default to 2 if not specified

                realm.people.forEach((e) => {
                    if (e.id !== entity.id) {
                        // Apply Boost
                        applyBoost(e, boostAmount, side);
                        console.log(`${e.card.name} gains Boost ${boostAmount} from ${entity.card.name}.`);
                    }
                });

                console.log(`${entity.card.name} is exhausted to boost all friendly entities in ${realmName}.`);
            },
        },
        'Inspire': {
            name: 'Inspire',
            type: 'static',
            applyEffect: function (entity, gameState, side) {
                const isLocal = entity.card.abilities.includes('Locality');
                const targets = getFriendlyEntities(side, isLocal ? entity.realm : null).filter(
                    e => e.id !== entity.id && e.online
                );
                targets.forEach(target => {
                    applyEffect(target, {
                        type: 'stat',
                        field: 'power',
                        value: 1,
                    });
                });
            },
            removeEffect: function (entity, gameState, side) {
                const isLocal = entity.card.abilities.includes('Locality');
                const targets = getFriendlyEntities(side, isLocal ? entity.realm : null).filter(
                    e => e.id !== entity.id && e.online
                );
                targets.forEach(target => {
                    removeEffect(target, {
                        type: 'stat',
                        field: 'power',
                        value: 1,
                    });
                });
            },
        },
        'Rotten': {
            name: 'Rotten',
            type: 'static',
            applyEffect: function (entity, gameState, side) {
                // Apply effect to enemy entities
                const enemySide = side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
                const enemyRealms = enemySide === 'PLAYER'
                    ? [
                        { realm: playerSolarium, setRealm: setPlayerSolarium },
                        // Add other player realms...
                    ]
                    : [
                        { realm: enemySolarium, setRealm: setEnemySolarium },
                        // Add other enemy realms...
                    ];

                enemyRealms.forEach(({ realm, setRealm }) => {
                    const newPeople = realm.people.map((enemyEntity) => {
                        const newEnemyEntity = { ...enemyEntity };

                        // Apply power reduction
                        const effect = {
                            type: 'stat',
                            field: 'power',
                            value: -1,
                        };

                        applyEffect(newEnemyEntity.id, realm.name, enemySide, effect);

                        return newEnemyEntity;
                    });

                    // Update realm state
                    setRealm({
                        ...realm,
                        people: newPeople,
                    });
                });
            },
            removeEffect: function (entity, gameState, side) {
                // Remove effect from enemy entities
                const enemySide = side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
                const enemyRealms = enemySide === 'PLAYER'
                    ? [
                        { realm: playerSolarium, setRealm: setPlayerSolarium },
                        { realm: playerTheater, setRealm: setPlayerTheater },
                        { realm: playerUnderpass, setRealm: setPlayerUnderpass },
                        { realm: playerGrid, setRealm: setPlayerGrid },
                    ]
                    : [
                        { realm: enemySolarium, setRealm: setEnemySolarium },
                        { realm: enemyTheater, setRealm: setEnemyTheater },
                        { realm: enemyUnderpass, setRealm: setEnemyUnderpass },
                        { realm: enemyGrid, setRealm: setEnemyGrid },
                    ];

                enemyRealms.forEach(({ realm, setRealm }) => {
                    const newPeople = realm.people.map((enemyEntity) => {
                        const newEnemyEntity = { ...enemyEntity };

                        // Remove power reduction
                        const effect = {
                            type: 'stat',
                            field: 'power',
                            value: -1,
                        };

                        removeEffect(newEnemyEntity.id, realm.name, enemySide, effect);

                        return newEnemyEntity;
                    });

                    // Update realm state
                    setRealm({
                        ...realm,
                        people: newPeople,
                    });
                });
            }
        },
        'FleshHive': {
            name: 'FleshHive',
            type: 'triggered',
            triggers: ['entityDied'],
            eventHandler: function (entity, eventData, gameState, side) {
                const { deadEntity, deadSide } = eventData;
                if (deadEntity.card.abilities.includes('Decay')) {
                    if (side === 'PLAYER') {
                        gameState.playerGainFate(1);
                        gameState.playerGainOverload(2);
                    } else {
                        gameState.enemyGainFate(1);
                        gameState.enemyGainOverload(2);
                    }
                }
            },
        },
        'DominanceGainCharge': {
            name: 'DominanceGainCharge',
            type: 'triggered',
            triggers: ['dominationResolved'],
            eventHandler: function (entity, eventData, gameState, side) {
                console.log('gain charge')
                if (eventData.winner === side) {
                    entity.charge = (entity.charge || 0) + 1;
                    console.log(`${entity.card.name} gains 1 Charge (total: ${entity.charge})`);
                    updateCardInRealm(entity, side);
                }
            },
        },
        'DominanceInflictFreeze': {
            name: 'DominanceInflictFreeze',
            type: 'triggered',
            triggers: ['dominationResolved'],
            eventHandler: function (entity, eventData, gameState, side) {
                if (eventData.winner === side) {
                    // Inflict Freeze 1 on enemy entities
                    const isLocal = entity.card.abilities.includes('Locality');
                    const targets = getEnemyEntities(side, isLocal ? entity.realm : null).filter(e => e.online);
                    targets.forEach(target => {
                        applyEffect(target, {
                            type: 'status',
                            status: 'Freeze',
                            amount: 1,
                        });
                        console.log(`${target.card.name} is Frozen by ${entity.card.name}`);
                    });
                }
            }
        },
        'DominanceInflictBurden': {
            name: 'DominanceInflictBurden',
            type: 'triggered',
            triggers: ['dominationResolved'],
            eventHandler: function (entity, eventData, gameState, side) {
                if (eventData.winner === side) {
                    // Inflict 3 Burden on opponent
                    if (side === 'PLAYER') {
                        setEnemyBurden(prev => prev + 3);
                        console.log('Enemy gains 3 Burden due to Dread\'s Dominance effect.');
                    } else {
                        setPlayerBurden(prev => prev + 3);
                        console.log('Player gains 3 Burden due to Dread\'s Dominance effect.');
                    }
                }
            },
        },
        'SurrenderGainBurden': {
            name: 'SurrenderGainBurden',
            type: 'triggered',
            triggers: ['dominationResolved'],
            eventHandler: function (entity, eventData, gameState, side) {
                if (eventData.winner !== side && eventData.winner !== null) {
                    // Gain 3 Burden
                    if (side === 'PLAYER') {
                        setPlayerBurden(prev => prev + 3);
                        console.log('Player gains 3 Burden due to Dread\'s Surrender effect.');
                    } else {
                        setEnemyBurden(prev => prev + 3);
                        console.log('Enemy gains 3 Burden due to Dread\'s Surrender effect.');
                    }
                }
            },
        },
        'MassFreezeEnemies': {
            name: 'MassFreezeEnemies',
            type: 'onActivate',
            onActivate: function (entity, gameState, side) {
                console.log('mass freeze')
                // Get enemy side
                const enemySide = side === 'PLAYER' ? 'ENEMY' : 'PLAYER';

                // Get enemy realms
                const enemyRealms = enemySide === 'PLAYER'
                    ? [
                        { realm: playerSolarium, setRealm: setPlayerSolarium },
                        // Add other player realms...
                    ]
                    : [
                        { realm: enemySolarium, setRealm: setEnemySolarium },
                        // Add other enemy realms...
                    ];

                // Collect online enemy entities
                const enemyEntities = enemyRealms.flatMap(({ realm }) =>
                    realm.people.filter((e) => e.online)
                );

                // Apply Freeze 2 to each online enemy entity
                enemyEntities.forEach((enemyEntity) => {
                    applyEffect(enemyEntity.id, enemyEntity.realm.name, enemySide, {
                        type: 'status',
                        status: 'Freeze',
                        amount: 2,
                    });
                    console.log(`${enemyEntity.card.name} gains 2 Freeze due to massFreezeEnemies's effect.`);
                });
            },
        },
        'Buffer': (amount) => ({
            name: 'Buffer',
            type: 'onActivate',
            onActivate: function (entity, gameState, side) {
                console.log('apply buffer')
                applyEffect(entity.id, entity.realm, side, {
                    type: 'status',
                    status: 'Freeze',
                    amount: amount,
                });
                console.log(`${entity.card.name} gains ${amount} Freeze due to Buffer.`);
            },
        }),
        Plague: (amount) => ({
            name: 'Plague',
            type: 'onActivate',
            onActivate: function (entity, gameState, side) {
                // Apply Decay to the entity itself
                applyEffect(entity.id, entity.realm, side, {
                    type: 'status',
                    status: 'Decay',
                    amount: amount,
                });
                console.log(`${entity.card.name} gains ${amount} Decay due to Plague.`);
            },
        }),
        Vicious: (amount) => ({
            name: 'Vicious',
            type: 'onActivate',
            onActivate: function (entity, gameState, side) {
                if (side === 'PLAYER') {
                    playerGainWounds(amount);
                    console.log(`Player takes ${amount} damage due to Vicious.`);
                } else {
                    enemyGainWounds(amount);
                    console.log(`Enemy takes ${amount} damage due to Vicious.`);
                }
            },
        }),
        GainVengeance: (amount) => ({
            name: 'GainVengeance',
            type: 'manual',
            execute: function (entity, amount, side) {
                addStatusEffect(entity, 'Vengeance', amount, side);
                console.log(`${entity.card.name} gains Vengeance ${amount}.`);
            },
        }),
        'GrantBoostAndPounce': {
            name: 'GrantBoostAndPounce',
            type: 'manual',
            execute: function (entity, effect, side, target) {
                if (!target) {
                    console.log('No target provided for GrantBoostAndPounce.');
                    return;
                }

                // Apply Boost
                applyBoost(target, effect.boostAmount, side);

                // Grant Pounce with specified amount
                const pounceAmount = effect.pounceAmount || 1;
                grantAbility(target, 'pounce', pounceAmount, side);

                console.log(`${target.card.name} gains Boost ${effect.boostAmount} and Pounce (${pounceAmount}).`);
            },
        },
        'InflictOverloadAndLag': {
            name: 'InflictOverloadAndLag',
            type: 'onEnter',
            onActivate: function (entity, gameState, side) {
                // Inflict Overload and Lag on the opponent
                if (side === 'PLAYER') {
                    enemyGainOverload(2);
                    enemyGainLag(1);
                } else {
                    playerGainOverload(2);
                    playerGainLag(1);
                }
                console.log(`${entity.card.name} inflicts 2 Overload and 1 Lag on the opponent.`);
            },
        },
        'Gravity': {
            name: 'Gravity',
            type: 'onEnter',
            onActivate: function (entity, gameState, side) {
                if (side === 'PLAYER') {
                    playerGainLag(1);
                } else {
                    enemyGainLag(1);
                }
                console.log(`${entity.card.name} inflicts 1 Lag on owner.`);
            },
        },
        'Glitchy': {
            name: 'Glitchy',
            type: 'static',
            applyEffect: function (entity, gameState, side) {
                if (side === 'PLAYER') {
                    setPlayerGlitchyAmount((prev) => prev + 1);
                } else {
                    setEnemyGlitchyAmount((prev) => prev + 1);
                }
                console.log(`${entity.card.name} increases Glitchy by 1.`);
            },
            removeEffect: function (entity, gameState, side) {
                if (side === 'PLAYER') {
                    setPlayerGlitchyAmount((prev) => prev - 1);
                } else {
                    setEnemyGlitchyAmount((prev) => prev - 1);
                }
                console.log(`${entity.card.name} increases Glitchy by 1.`);
            },
        },
        'InflictOverloadOnHack': {
            name: 'InflictOverloadOnHack',
            type: 'triggered',
            triggers: ['attackSuccessful'],
            eventHandler: function (entity, eventData, gameState, side) {
                // Check if the side matches
                if (eventData.type === 'PLAYER_HACK' || 'ENEMY_tech') {
                    // Inflict Overload on the opponent
                    if (side === 'PLAYER') {
                        setEnemyOverload((prev) => prev + 3);
                    } else {
                        setPlayerOverload((prev) => prev + 3);
                    }
                    console.log(`${entity.card.name} inflicts 3 Overload on the opponent due to successful Hack.`);
                }
            },
        },
        'GrantImpostorToDreamers': {
            name: 'GrantImpostorToDreamers',
            type: 'static',
            applyEffect: function (entity, gameState, side) {
                // Increase the Recruiter count
                if (side === 'PLAYER') {
                    setRecruiterCount((prev) => prev + 1);
                } else {
                    setEnemyRecruiterCount((prev) => prev + 1);
                }
                console.log(`${entity.card.name} is granting Impostor to your Dreamers.`);
            },
            removeEffect: function (entity, gameState, side) {
                // Decrease the Recruiter count
                if (side === 'PLAYER') {
                    setRecruiterCount((prev) => prev - 1);
                } else {
                    setEnemyRecruiterCount((prev) => prev - 1);
                }
                console.log(`${entity.card.name} has left play. Adjusting Recruiter count.`);
            }
        },
        'OnEnterGainActions': {
            name: 'OnEnterGainActions',
            type: 'onEnter',
            onActivate: function (entity, gameState, side) {
                const actionsGained = entity.card.abilities.find(a => a.name === 'OnEnterGainActions').actionsGained || 0;
                if (side === 'PLAYER') {
                    setPlayerActions((prev) => prev + actionsGained);
                } else {
                    setEnemyActions((prev) => prev + actionsGained);
                }
                console.log(`${entity.card.name} gains ${actionsGained} Actions.`);
            }
        },
        // Define other abilities here
    }

    function triggerAscendAbilities(entity, side) {
        entity.card.abilities.forEach((abilityName) => {
            const abilityDef = abilitiesDefinitions[abilityName];
            if (abilityDef && abilityDef.type === "onAscend" && abilityDef.onAscend) {
                abilityDef.onAscend(entity, null, side);
            }
        });
    }

    function drawSpecificCard(card, side) {
        const library = side === 'PLAYER' ? playerLibrary : enemyLibrary;
        const setLibrary = side === 'PLAYER' ? setPlayerLibrary : setEnemyLibrary;
        const setHand = side === 'PLAYER' ? setPlayerHand : setEnemyHand;
        const updatedLibrary = library.filter(entity => entity.id !== card.id);
        setLibrary(updatedLibrary);
        setHand(prevHand => [...prevHand, card]);

        console.log(`${card.card.name} has been drawn.`);
    }


    function addStatusEffect(entity, status, amount, side) {
        // Determine the realm and setter
        const realmName = entity.realm; // Ensure the entity has a 'realm' property
        const [realm, setRealm] = getRealmAndSetter(realmName, side);

        const entityIndex = realm.people.findIndex((e) => e.id === entity.id);
        if (entityIndex === -1) return;

        // Create a new entity object
        const updatedEntity = { ...realm.people[entityIndex] };

        // Initialize statusEffects if not present
        if (!updatedEntity.statusEffects) {
            updatedEntity.statusEffects = {};
        }

        // Update the status effect
        updatedEntity.statusEffects[status] = (updatedEntity.statusEffects[status] || 0) + amount;

        // Update the realm's people array
        const newPeople = [...realm.people];
        newPeople[entityIndex] = updatedEntity;

        // Update the realm state
        setRealm({
            ...realm,
            people: newPeople,
        });
    }

    // todo1 no activeAbilities update
    async function activateAbilities(entity, side) {
        console.log('ACTIVATE ABILITIES ', entity);

        // Set online first before processing abilities
        await applyEffect(entity.id, entity.realm, side, { //todo1 set firstActivation to true
            type: 'setOnline',
            value: true,
        });

        if (!entity.activeAbilities) {
            entity.activeAbilities = [];
        }

        const abilities = entity.card.abilities || [];
        for (const ability of abilities) {
            console.log('activating ability ', ability);
            const abilityName = ability.name;
            let abilityDef = abilitiesDefinitions[abilityName];

            if (abilityDef) {
                if (typeof abilityDef === 'function') {
                    abilityDef = abilityDef(ability.amount);
                }

                const isAbilityActive = entity.activeAbilities.some(ab => ab.abilityName === abilityName);
                if (isAbilityActive) {
                    console.log(`Ability "${abilityName}" is already active for "${entity.card.name}". Skipping.`);
                    continue;
                }

                if (abilityDef.type === 'static') {
                    abilityDef.applyEffect(entity, gameState, side);
                    entity.activeAbilities.push({ abilityName, abilityDef });
                } else if (abilityDef.type === 'triggered') {
                    console.log('activate trigger listener');
                    abilityDef.triggers.forEach((eventType) => {
                        const handler = (eventData) => {
                            if (entity.scheming && !entity.schemeUnlocked) {
                                return;
                            }
                            abilityDef.eventHandler(entity, eventData, gameState, side);
                        };
                        eventManager.subscribe(eventType, handler);
                        entity.activeAbilities.push({ abilityName, eventType, handler });
                    });
                } else if (abilityDef.type === 'manual') {
                    entity.activeAbilities.push({ abilityName, abilityDef });
                } else if (abilityDef.type === 'onActivate') {
                    console.log('on activate');
                    abilityDef.onActivate(entity, gameState, side);
                    entity.activeAbilities.push({ abilityName, abilityDef });
                }
            }
        }
    }


    async function applyEffect(entityId, realmName, owner, effect) {
        console.log('________APPLY EFFECT', effect);

        const [realm, setRealmFunction] = getRealmAndSetter(realmName, owner);

        setRealmFunction(prevRealm => {
            // Create a deep copy of the entire realm to ensure immutability
            const newRealm = {
                ...prevRealm,
                people: prevRealm.people.map(entity => {
                    // Only modify the specific entity matching the ID
                    if (entity.id === entityId) {
                        const newEntity = { ...entity };

                        newEntity.effects = newEntity.effects ? [...newEntity.effects] : [];

                        if (effect.type === 'stat') {
                            newEntity[effect.field] =
                                (newEntity[effect.field] || newEntity.card[effect.field] || 0) + effect.value;
                        } else if (effect.type === 'keyword') {
                            newEntity.modifiedAbilities = new Set(newEntity.modifiedAbilities || (entity.card.abilities || []));
                            newEntity.modifiedAbilities.add(effect.value);
                        } else if (effect.type === 'status') {
                            if (effect.status === 'Freeze') {
                                newEntity.freeze = (newEntity.freeze || 0) + effect.amount;
                                if (effect.amount > 0) {
                                    newEntity.readied = false;
                                }
                                console.log(`${newEntity.card.name} gains ${effect.amount} Freeze (total Freeze: ${newEntity.freeze})`);
                            } else if (effect.status === 'Decay') {
                                newEntity.decay = (newEntity.decay || 0) + effect.amount;
                                console.log(`${newEntity.card.name} gains ${effect.amount} Decay (total Decay: ${newEntity.decay})`);
                            } else if (effect.status === 'Venom') {
                                newEntity.venom = (newEntity.venom || 0) + effect.amount;
                                console.log(`${newEntity.card.name} gains ${effect.amount} Venom (total Venom: ${newEntity.venom})`);
                            }
                        } else if (effect.type === 'setOnline') {
                            newEntity.online = effect.value;
                            console.log(`${newEntity.card.name} is set to online: ${newEntity.online}`);
                        } else if (effect.type === 'swap') {
                            // Handle swapping entities if needed
                            // This could be a placeholder for more complex swap logic
                            return effect.swapEntity;
                        }

                        if (effect.duration && effect.duration > 0) {
                            newEntity.effects.push({
                                ...effect,
                                remainingDuration: effect.duration,
                            });
                        }

                        console.log('_________________NEW ENTITY AFTER EFFECT ', newEntity);
                        return newEntity;
                    }

                    // Return other entities unchanged
                    return entity;
                }),
            };

            return newRealm;
        });
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
            updatedEntity.currentPower = updatedEntity.card.power || 0;
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


    function deactivateAbilities(entity, side) {
        if (!entity.activeAbilities) return;

        entity.activeAbilities.forEach((activeAbility) => {
            const abilityDef = activeAbility.abilityDef;
            if (abilityDef.type === 'static' && abilityDef.removeEffect) {
                // Remove static effect
                abilityDef.removeEffect(entity, gameState, side);
            } else if (abilityDef.type === 'triggered') {
                // Unsubscribe from events
                eventManager.unsubscribe(activeAbility.eventType, activeAbility.handler);
            }
            // Handle other ability types as needed
        });

        // Clear the active abilities
        entity.activeAbilities = [];

        // Adjust entity's power based on external effects
        adjustEntityPowerExternal(entity, side);
    }




    function removeEffect(entityId, realmName, owner, effect) {
        const [realm, setRealm] = getRealmAndSetter(realmName, owner);

        const entityIndex = realm.people.findIndex((e) => e.id === entityId);
        if (entityIndex === -1) return;

        const oldEntity = realm.people[entityIndex];
        const newEntity = { ...oldEntity };

        if (effect.type === 'stat') {
            // Reverse the stat adjustment
            newEntity[effect.field] -= effect.value;
        } else if (effect.type === 'keyword') {
            if (newEntity.modifiedAbilities) {
                newEntity.modifiedAbilities = new Set(newEntity.modifiedAbilities);
                newEntity.modifiedAbilities.delete(effect.value);
            }
        } else if (effect.type === 'status') {
            if (effect.status === 'Freeze') {
                newEntity.freeze = Math.max(0, (newEntity.freeze || 0) - effect.amount);
                console.log(`${newEntity.card.name} loses ${effect.amount} Freeze (remaining Freeze: ${newEntity.freeze})`);
            } else if (effect.status === 'Decay') {
                newEntity.decay = Math.max(0, (newEntity.decay || 0) - effect.amount);
                console.log(`${newEntity.card.name} loses ${effect.amount} Decay (remaining Decay: ${newEntity.decay})`);
            } else if (effect.status === 'Venom') {
                newEntity.venom = Math.max(0, (newEntity.venom || 0) - effect.amount);
                console.log(`${newEntity.card.name} loses ${effect.amount} Venom (remaining Venom: ${newEntity.venom})`);
            }
        }

        // Remove effect from effects array
        if (newEntity.effects) {
            newEntity.effects = newEntity.effects.filter((e) => e !== effect);
        }

        // Update the realm state
        const newPeople = [...realm.people];
        newPeople[entityIndex] = newEntity;

        setRealm({
            ...realm,
            people: newPeople,
        });
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

    function applyFreezeToAllEntities(amount) {
        ['PLAYER', 'ENEMY'].forEach((side) => {
            const realms = side === 'PLAYER' ? getAllPlayerRealms() : getAllEnemyRealms();
            realms.forEach((realm) => {
                ['people'].forEach((arrayName) => {
                    realm[arrayName].forEach((entity) => {
                        if (entity.card.category === 'ENTITY' && entity.online) {
                            applyEffect(entity.id, realm.name, side, {
                                type: 'status',
                                status: 'Freeze',
                                amount: amount,
                            });
                        }
                    });
                });
            });
        });
        console.log(`All entities gain Freeze ${amount} due to Brain Freeze.`);
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

    function createFleshHiveListener(ownerSide) {
        function onEntityDeath(eventData) {
            const { entity, side } = eventData;
            if (entity.card.abilities.includes('Decay')) {
                if (ownerSide === 'PLAYER') {
                    playerGainFate(1);
                    playerGainOverload(2);
                } else {
                    enemyGainFate(1);
                    enemyGainOverload(2);
                }
            }
        }

        // Subscribe to the 'entityDied' event
        eventManager.subscribe('entityDied', onEntityDeath);

        // Return a function to unsubscribe when Flesh Hive leaves play
        return function removeFleshHiveListener() {
            eventManager.unsubscribe('entityDied', onEntityDeath);
        };
    }

    return (
        <div className='game-container'>
            <Gameboard
                realmComponents={realmComponents}
                onRealmSelect={handleRealmSelect}
                onServerSelect={handleServerSelect}
                playerOneLibrary={playerLibrary}
                playerOneHand={playerHand}
                playerBoost={handleBoostButton}
                playerDraw={handleDrawButton}
                playerDraft={handleDraftButton}
                playerMine={handlePlayerMine}
                playerDevelop={handleDevelopButton}
                playerDetox={performDetox}
                onAbilityClick={handleAbilityClick}
                playerActions={playerActions}
                playerFate={playerFate}
                playerWounds={playerWounds}
                playerBits={playerBits}
                playerOverload={playerOverload}
                playerBurden={playerBurden}
                playerAshes={playerAshes}
                playerSurge={playerSurge}
                enemyActions={enemyActions}
                enemyFate={enemyFate}
                enemyWounds={enemyWounds}
                enemyBits={enemyBits}
                enemyOverload={enemyOverload}
                enemyBurden={enemyBurden}
                enemyAshes={enemyAshes}
                enemySurge={enemySurge}
                playerSolarium={playerSolarium}
                playerTheater={playerTheater}
                playerUnderpass={playerUnderpass}
                playerGrid={playerGrid}
                playerElysium={playerElysium}
                onCardSelect={handleCardSelect}
                onRealmCardSelect={handleRealmCardSelect}
                onFocusSelect={handleFocusSelect}
                focus={focus}
                awaitingFocus={awaitingFocus}
                awaitingImpostor={awaitingImpostor}
                onQuest={handleQuest}
                onRaid={handleRaid}
                onHack={handleHack}
                playerBattleSlots={playerBattleSlots}
                enemyBattleSlots={enemyBattleSlots}
                onSlotSelect={handleEmptySlotSelect}
                onBattleCardSelect={handleBattleCardSelect}
                onConfirmDefenseSelection={handleConfirmDefenseSelection}
                onPlayerBattle={enemyPlanDefense}
                attackMode={attackMode}
                onRezPlayerCard={handleRezPlayerCard}
                onSacrificeConfirmation={handleSacrificeConfirmation}
                awaitingSacrifices={awaitingSacrifices}
                enemyHand={enemyHand}
                gameState={gameState}
                enemySolarium={enemySolarium}
                enemyTheater={enemyTheater}
                enemyUnderpass={enemyUnderpass}
                enemyGrid={enemyGrid}
                enemyElysium={enemyElysium}
                battleRealm={battleRealm}
                trashPromptVisible={trashPromptVisible}
                currentPromptCard={currentPromptCard}
                handleTrashDecision={handleTrashDecision}
                modalVisible={modalVisible}
                modalProps={modalProps}
            />
        </div>
    );
}

export default BoardContainer;

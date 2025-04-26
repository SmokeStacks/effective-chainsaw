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
import CardDisplay from './CardDisplay';

import { Realm, SharedSlot } from '../rules/cards.ts'
import { cardList1 } from '../playerDecks/deckTwo.ts'
import { draftList } from '../systemDecks/draft.ts'
import { cardList2 } from '../systemDecks/enemyOne.ts'

import { cardList } from '../rules/binder.ts'


import abilitiesDefinitions from '../ui/abilities/glossary.js'

const realmComponents = [
    Solarium,
    Theater,
    Underpass,
    Grid,
    Elysium
];


export function BoardContainer() {


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
    const [battleRealm, setBattleRealm] = useState(null);
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

    const [playerSolarium, setPlayerSolarium] = useState({ name: 'Solarium', people: [], places: [], things: [] });
    const [playerTheater, setPlayerTheater] = useState({ name: 'Theater', people: [], places: [], things: [] });
    const [playerUnderpass, setPlayerUnderpass] = useState({ name: 'Underpass', people: [], places: [], things: [] });
    const [playerGrid, setPlayerGrid] = useState({ name: 'Grid', people: [], places: [], things: [] });
    const [playerElysium, setPlayerElysium] = useState({ name: 'Elysium', people: [], places: [], things: [] });

    const [enemySolarium, setEnemySolarium] = useState({ name: 'Solarium', people: [], places: [], things: [] });
    const [enemyTheater, setEnemyTheater] = useState({ name: 'Theater', people: [], places: [], things: [] });
    const [enemyUnderpass, setEnemyUnderpass] = useState({ name: 'Underpass', people: [], places: [], things: [] });
    const [enemyGrid, setEnemyGrid] = useState({ name: 'Grid', people: [], places: [], things: [] });
    const [enemyElysium, setEnemyElysium] = useState({ name: 'Elysium', people: [], places: [], things: [] });

    const [playerEntitiesDiedThisTurn, setPlayerEntitiesDiedThisTurn] = useState(0);
    const [enemyEntitiesDiedThisTurn, setEnemyEntitiesDiedThisTurn] = useState(0);
    const [recruiterCount, setRecruiterCount] = useState(0);
    const [enemyRecruiterCount, setEnemyRecruiterCount] = useState(0); // todo

    function showModal({ title, message, renderContent, onConfirm, onCancel }) {
        setModalProps({
            title,
            message,
            renderContent,
            onConfirm: () => {
                // Call the user's onConfirm callback before closing
                if (onConfirm && typeof onConfirm === 'function') {
                    onConfirm();
                }
                setModalVisible(false);
            },
            onCancel: () => {
                // Call the user's onCancel callback before closing
                if (onCancel && typeof onCancel === 'function') {
                    onCancel();
                }
                setModalVisible(false);
            },
        });
    
        setModalVisible(true);
    }
    


    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
            enemyPerformAction();
        }
    }, [currentPlayer, enemyActions, gameState]);


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




    
    // function createFleshHiveListener(ownerSide) {
    //     function onEntityDeath(eventData) {
    //         const { entity, side } = eventData;
    //         if (entity.card.abilities.includes('Decay')) {
    //             if (ownerSide === 'PLAYER') {
    //                 playerGainFate(1);
    //                 playerGainOverload(2);
    //             } else {
    //                 enemyGainFate(1);
    //                 enemyGainOverload(2);
    //             }
    //         }
    //     }

    //     // Subscribe to the 'entityDied' event
    //     eventManager.subscribe('entityDied', onEntityDeath);

    //     // Return a function to unsubscribe when Flesh Hive leaves play
    //     return function removeFleshHiveListener() {
    //         eventManager.unsubscribe('entityDied', onEntityDeath);
    //     };
    // }

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
                playerInterfacedHeadSpace={playerInterfacedHeadSpace}
                playerInterfacedPandora={playerInterfacedPandora}
                enemyActions={enemyActions}
                enemyFate={enemyFate}
                enemyWounds={enemyWounds}
                enemyBits={enemyBits}
                enemyOverload={enemyOverload}
                enemyBurden={enemyBurden}
                enemyAshes={enemyAshes}
                enemySurge={enemySurge}
                enemyInterfacedHeadSpace={enemyInterfacedHeadSpace}
                enemyInterfacedPandora={enemyInterfacedPandora}
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
                modalVisible={modalVisible}
                modalProps={modalProps}
            />
        </div>
    );
}

export default BoardContainer;
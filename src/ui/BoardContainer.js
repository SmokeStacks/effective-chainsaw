import React, { useState, useEffect, useCallback } from 'react';
import { startTurn, playerGainBits, enemyLoseBits } from './helpers/core';
import { eventManager } from './helpers/eventManager';
import { handleSacrificeConfirmation } from './helpers/sacrifice';
import { initializeSetters, stateSetters, state } from './helpers/state';
import { createLibrary, createEnemyLibrary } from './helpers/setup';
import { activateAbilities } from './abilities/glossary';
import Gameboard from './Gameboard';
import { draw as playerDraw } from './helpers/player';
import { draw as enemyDraw } from './helpers/enemy';
import { Solarium, Theater, Underpass, Grid, Elysium } from './renders/Board';

export default function BoardContainer() {
    // Realm state
    const [realms, setRealms] = useState({

        player: {
            solarium: { name: 'Solarium', people: [], places: [], things: [] },
            theater: { name: 'Theater', people: [], places: [], things: [] },
            underpass: { name: 'Underpass', people: [], places: [], things: [] },
            grid: { name: 'Grid', people: [], places: [], things: [] },
            elysium: { name: 'Elysium', people: [], places: [], things: [] }
        },
        enemy: {
            solarium: { name: 'Solarium', people: [], places: [], things: [] },
            theater: { name: 'Theater', people: [], places: [], things: [] },
            underpass: { name: 'Underpass', people: [], places: [], things: [] },
            grid: { name: 'Grid', people: [], places: [], things: [] },
            elysium: { name: 'Elysium', people: [], places: [], things: [] }
        }
    });

    // Game state
    const [gameState, setGameState] = useState({
        mode: 'NONE',
        attackMode: false,
        priorityLeft: true,
        awaitingTrash: false,
        awaitingSacrifices: false,
        battleRealm: null,
        currentPlayer: 'PLAYER',
        rezCard: null,
        targetType: null
    });

    // UI state
    const [uiState, setUiState] = useState({
        trashPromptVisible: false,
        currentPromptCard: null,
        modalVisible: false,
        modalProps: {},
        modalTitle: '',
        modalContent: '',
        modalButtons: [],
        playerBattleSlots: Array(6).fill(null),
        enemyBattleSlots: Array(6).fill(null),
        selectedCard: null,
        battleSelectedCard: null,
        selectedInHand: false,
        focus: '',
        awaitingFocus: false,
        draftSelected: false
    });

    // Interface access state - currently unused but kept for future features
    useState({
        player: {
            headSpace: {
                interfaced: false,
                access: false
            },
            pandora: {
                interfaced: false,
                access: false
            }
        },
        enemy: {
            headSpace: {
                interfaced: false,
                access: false
            },
            pandora: {
                interfaced: false,
                access: false
            }
        }
    });

    // Initialize state setters and libraries
    useEffect(() => {
        console.log('Initializing game state...');
        // Initialize state setters
        initializeSetters({
            setPlayerHand: (value) => stateSetters.setPlayerHand = value,
            setPlayerLibrary: (value) => stateSetters.setPlayerLibrary = value,
            setEnemyHand: (value) => stateSetters.setEnemyHand = value,
            setEnemyLibrary: (value) => stateSetters.setEnemyLibrary = value,
            setPlayerBits: (value) => stateSetters.setPlayerBits(value),
            setPlayerAshes: (value) => stateSetters.setPlayerAshes(value),
            setPlayerBurden: (value) => stateSetters.setPlayerBurden(value),
            setPlayerFate: (value) => stateSetters.setPlayerFate(value),
            setPlayerWounds: (value) => stateSetters.setPlayerWounds(value),
            setPlayerOverload: (value) => stateSetters.setPlayerOverload(value),
            setPlayerLag: (value) => stateSetters.setPlayerLag(value),
            setPlayerActions: (value) => stateSetters.setPlayerActions(value),
            setPlayerSurge: (value) => stateSetters.setPlayerSurge(value),
            setEnemyBits: (value) => stateSetters.setEnemyBits(value),
            setEnemyAshes: (value) => stateSetters.setEnemyAshes(value),
            setEnemyBurden: (value) => stateSetters.setEnemyBurden(value),
            setEnemyFate: (value) => stateSetters.setEnemyFate(value),
            setEnemyWounds: (value) => stateSetters.setEnemyWounds(value),
            setEnemyOverload: (value) => stateSetters.setEnemyOverload(value),
            setEnemyLag: (value) => stateSetters.setEnemyLag(value),
            setEnemyActions: (value) => stateSetters.setEnemyActions(value),
            setEnemySurge: (value) => stateSetters.setEnemySurge(value),
            setPlayerBattleSlots: (value) => stateSetters.setPlayerBattleSlots(value),
            setEnemyBattleSlots: (value) => stateSetters.setEnemyBattleSlots(value),
            setPlayerDevelopSlots: (value) => stateSetters.setPlayerDevelopSlots(value),
            setEnemyDevelopSlots: (value) => stateSetters.setEnemyDevelopSlots(value),
            setPlayerDraftSlots: (value) => stateSetters.setPlayerDraftSlots(value),
            setPlayerElysium: (value) => stateSetters.setPlayerElysium(value),
            setEnemyElysium: (value) => stateSetters.setEnemyElysium(value),
            setEnemyDraftSlots: (value) => stateSetters.setEnemyDraftSlots(value),
            setPlayerBoostSlots: (value) => stateSetters.setPlayerBoostSlots(value),
            setEnemyBoostSlots: (value) => stateSetters.setEnemyBoostSlots(value),
            setPlayerHandSlots: (value) => stateSetters.setPlayerHandSlots(value),
            setEnemyHandSlots: (value) => stateSetters.setEnemyHandSlots(value),
            setPlayerSurgeSlots: (value) => stateSetters.setPlayerSurgeSlots(value),
            setEnemySurgeSlots: (value) => stateSetters.setEnemySurgeSlots(value),
            setPlayerOverloadSlots: (value) => stateSetters.setPlayerOverloadSlots(value),
            setEnemyOverloadSlots: (value) => stateSetters.setEnemyOverloadSlots(value),
            setPlayerLagSlots: (value) => stateSetters.setPlayerLagSlots(value),
            setEnemyLagSlots: (value) => stateSetters.setEnemyLagSlots(value),
            setPlayerSolariumSlots: (value) => stateSetters.setPlayerSolariumSlots(value),
            setEnemySolariumSlots: (value) => stateSetters.setEnemySolariumSlots(value),
            setPlayerTheaterSlots: (value) => stateSetters.setPlayerTheaterSlots(value),
            setEnemyTheaterSlots: (value) => stateSetters.setEnemyTheaterSlots(value),
            setPlayerUnderpassSlots: (value) => stateSetters.setPlayerUnderpassSlots(value),
            setEnemyUnderpassSlots: (value) => stateSetters.setEnemyUnderpassSlots(value),
            setPlayerGridSlots: (value) => stateSetters.setPlayerGridSlots(value),
            setEnemyGridSlots: (value) => stateSetters.setEnemyGridSlots(value),
            setPlayerElysiumSlots: (value) => stateSetters.setPlayerElysiumSlots(value),
            setEnemyElysiumSlots: (value) => stateSetters.setEnemyElysiumSlots(value),
            setTargetType: (value) => stateSetters.setTargetType(value),
            setCurrentPlayer: (value) => stateSetters.setCurrentPlayer(value),
            setMode: (value) => stateSetters.setMode(value),
            setAwaitingFocus: (value) => stateSetters.setAwaitingFocus(value),
            setFocus: (value) => stateSetters.setFocus(value),
            setDraftSelected: (value) => stateSetters.setDraftSelected(value),
        });

        // Create libraries
        console.log('Creating libraries...');
        const playerLibrary = createLibrary();
        const enemyLibrary = createEnemyLibrary();

        console.log('Setting up libraries and initial state...');
        // Initialize all state at once to avoid multiple re-renders
        console.log('Initial playerLibrary:', playerLibrary);
        stateSetters.setPlayerLibrary(() => {
            console.log('Setting player library');
            return playerLibrary;
        });
        stateSetters.setPlayerHand(() => {
            console.log('Setting initial player hand');
            return [];
        });
        stateSetters.setEnemyLibrary(() => enemyLibrary);
        stateSetters.setEnemyHand(() => []);

        setGameState(prev => ({
            ...prev,
            mode: 'MULLIGAN',
            currentPlayer: 'PLAYER',
        }));

        // Draw opening hands after state is initialized
        console.log('Drawing initial hands...');
        // Remove the setTimeout to ensure state updates happen synchronously
        playerDraw(5);
        console.log('Player hand after draw:', state.playerHand);
        enemyDraw(5);

        return () => {
            console.log('Cleaning up game initialization...');
        };
    }, []);

    // Set up UI state reset listener
    useEffect(() => {
        const resetUIStateHandler = () => {
            setUiState({
                trashPromptVisible: false,
                currentPromptCard: null,
                modalVisible: false,
                modalProps: null,
                selectedCard: null,
                selectedInHand: false,
                battleSelectedCard: null,
                selectedRealm: null
            });
        };

        eventManager.subscribe('resetUIState', resetUIStateHandler);
        return () => eventManager.unsubscribe('resetUIState', resetUIStateHandler);
    }, [setUiState]);

    // Start first turn after hands are drawn
    useEffect(() => {
        if (state.playerHand.length === 5 && state.enemyHand.length === 5 && state.attackMode) {
            startTurn(true);
        }
    }, []);

    useEffect(() => {
        if (state.playerBurden >= 10) {
            stateSetters.setMode('GAME_OVER');
        }
    }, []);

    // Handle player realm updates
    useEffect(() => {
        if (state.playerSolarium.people.length === 0 &&
            state.playerTheater.people.length === 0 &&
            state.playerUnderpass.people.length === 0 &&
            state.playerGrid.people.length === 0 &&
            state.playerElysium.people.length === 0) {
            eventManager.publish('PLAYER_LOST');
        }
    }, []);

    useEffect(() => {
        if (state.mode === 'GAME_OVER') {
            if (state.currentPlayer === 'ENEMY') {
                state.enemyBits = 0;
            }
        }
    }, []);

    // Handle burden effects
    useEffect(() => {
        if (state.playerBurden >= 10) {
            stateSetters.setMode('GAME_OVER');
        }
    }, [state.playerBurden, stateSetters]);

    // Handle player realm updates
    useEffect(() => {
        if (state.playerSolarium) {
            setRealms(prev => ({
                ...prev,
                player: {
                    ...prev.player,
                    solarium: state.playerSolarium
                }
            }));
        }
        if (state.playerTheater) {
            setRealms(prev => ({
                ...prev,
                player: {
                    ...prev.player,
                    theater: state.playerTheater
                }
            }));
        }
        if (state.playerUnderpass) {
            setRealms(prev => ({
                ...prev,
                player: {
                    ...prev.player,
                    underpass: state.playerUnderpass
                }
            }));
        }
        if (state.playerGrid) {
            setRealms(prev => ({
                ...prev,
                player: {
                    ...prev.player,
                    grid: state.playerGrid
                }
            }));
        }
        if (state.playerElysium) {
            setRealms(prev => ({
                ...prev,
                player: {
                    ...prev.player,
                    elysium: state.playerElysium
                }
            }));
        }
    }, [state.playerSolarium, state.playerTheater, state.playerUnderpass, state.playerGrid, state.playerElysium]);

    // Effect to handle hand size limit
    useEffect(() => {
        if (state.playerHand.length >= 7 || state.enemyHand.length >= 7) {
            console.log('Hand size limit reached');
        }
    }, []);

    // Effect to handle player win conditions
    useEffect(() => {
        // Check burden win
        if (state.playerBurden >= 10) {
            console.log('Player wins by burden!');
        }

        // Check realm win
        if (state.playerElysium >= 10 ||
            state.playerGrid >= 10 ||
            state.playerSolarium >= 10 ||
            state.playerTheater >= 10 ||
            state.playerUnderpass >= 10) {
            console.log('Player wins by realm!');
        }

        // Check bits win
        if (state.playerBits >= 10) {
            console.log('Player wins by bits!');
        }

        // Check ashes win
        if (state.playerAshes >= 10) {
            console.log('Player wins by ashes!');
        }

        // Check fate win
        if (state.playerFate >= 10) {
            console.log('Player wins by fate!');
        }
    }, []);

    // Effect to handle player loss conditions
    useEffect(() => {
        // Check wounds loss
        if (state.playerWounds >= 10) {
            console.log('Player loses by wounds!');
        }

        // Check overload loss
        if (state.playerOverload >= 10) {
            console.log('Player loses by overload!');
        }

        // Check actions loss
        if (state.playerActions <= 0) {
            console.log('Player out of actions');
        }
    }, []);

    // Effect to handle attack resolution
    useEffect(() => {
        if (state.mode === 'ATTACK_RESOLVED') {
            if (state.currentPlayer === 'PLAYER') {
                if (state.enemyBits >= 1) {
                    enemyLoseBits(1);
                }
            } else {
                stateSetters.setCurrentPlayer('PLAYER');
            }
            stateSetters.setMode('NORMAL');
        }
    }, [state.mode, state.currentPlayer, state.enemyBits]);

    // Effect to handle enemy win condition
    useEffect(() => {
        if (state.enemyBits >= 10) {
            console.log('Enemy wins!');
        }
    }, []);

    // Effect to handle enemy win condition with no actions
    useEffect(() => {
        if (state.enemyActions <= 0 && state.enemyBits >= 10) {
            console.log('Enemy wins!');
        }
    }, []);

    // Start the game or turn
    useEffect(() => {
        if (state.mode === 'BEGIN' && state.attackMode) {
            console.log('begin game');
            playerGainBits(1);
            playerDraw();
        }
    }, []);

    // Handle domination phase
    useEffect(() => {
        if (state.playerActions <= 0 &&
            state.enemyActions <= 0 &&
            state.mode === 'NORMAL' &&
            state.mode !== 'BEGIN' &&
            !state.attackMode) {
            stateSetters.setMode('DOMINATION');
        }
    }, []);

    // Effect to handle rez card
    useEffect(() => {
        if (gameState.rezCard) {
            switch (gameState.rezCard.realm) {
                case 'Solarium':
                    if (gameState.rezCard.card.category === 'ENTITY') {
                        setRealms(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                solarium: {
                                    ...prev.player.solarium,
                                    people: prev.player.solarium.people.map(c =>
                                        c.id === gameState.rezCard.id ? { ...c, online: true } : c
                                    ),
                                }
                            }
                        }));
                    } else if (gameState.rezCard.card.category === 'SNIP') {
                        setRealms(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                solarium: {
                                    ...prev.player.solarium,
                                    things: prev.player.solarium.things.map(c =>
                                        c.id === gameState.rezCard.id ? { ...c, online: true } : c
                                    ),
                                }
                            }
                        }));
                    }
                    break;
                case 'Theater':
                    if (gameState.rezCard.card.category === 'ENTITY') {
                        setRealms(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                theater: {
                                    ...prev.player.theater,
                                    people: prev.player.theater.people.map(c =>
                                        c.id === gameState.rezCard.id ? { ...c, online: true } : c
                                    ),
                                }
                            }
                        }));
                    } else if (gameState.rezCard.card.category === 'SNIP') {
                        setRealms(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                theater: {
                                    ...prev.player.theater,
                                    things: prev.player.theater.things.map(c =>
                                        c.id === gameState.rezCard.id ? { ...c, online: true } : c
                                    ),
                                }
                            }
                        }));
                    }
                    break;
                case 'Underpass':
                    if (gameState.rezCard.card.category === 'ENTITY') {
                        setRealms(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                underpass: {
                                    ...prev.player.underpass,
                                    people: prev.player.underpass.people.map(c =>
                                        c.id === gameState.rezCard.id ? { ...c, online: true } : c
                                    ),
                                }
                            }
                        }));
                    } else if (gameState.rezCard.card.category === 'SNIP') {
                        setRealms(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                underpass: {
                                    ...prev.player.underpass,
                                    things: prev.player.underpass.things.map(c =>
                                        c.id === gameState.rezCard.id ? { ...c, online: true } : c
                                    ),
                                }
                            }
                        }));
                    }
                    break;
                case 'Grid':
                    if (gameState.rezCard.card.category === 'ENTITY') {
                        setRealms(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                grid: {
                                    ...prev.player.grid,
                                    people: prev.player.grid.people.map(c =>
                                        c.id === gameState.rezCard.id ? { ...c, online: true } : c
                                    ),
                                }
                            }
                        }));
                    } else if (gameState.rezCard.card.category === 'SNIP') {
                        setRealms(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                grid: {
                                    ...prev.player.grid,
                                    things: prev.player.grid.things.map(c =>
                                        c.id === gameState.rezCard.id ? { ...c, online: true } : c
                                    ),
                                }
                            }
                        }));
                    }
                    break;
                case 'Elysium':
                    if (gameState.rezCard.card.category === 'ENTITY') {
                        setRealms(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                elysium: {
                                    ...prev.player.elysium,
                                    people: prev.player.elysium.people.map(c =>
                                        c.id === gameState.rezCard.id ? { ...c, online: true } : c
                                    ),
                                }
                            }
                        }));
                    } else if (gameState.rezCard.card.category === 'SNIP') {
                        setRealms(prev => ({
                            ...prev,
                            player: {
                                ...prev.player,
                                elysium: {
                                    ...prev.player.elysium,
                                    things: prev.player.elysium.things.map(c =>
                                        c.id === gameState.rezCard.id ? { ...c, online: true } : c
                                    ),
                                }
                            }
                        }));
                    }
                    break;
                default:
                    console.error(`Unknown realm: ${gameState.rezCard.realm}`);
            }
            
            setGameState(prev => ({ ...prev, rezCard: null }));
            activateAbilities(gameState.rezCard, 'PLAYER');
        }
    }, [gameState, setRealms]);

    const handleRezPlayerCard = useCallback((entity) => {
        if (entity) {
            setGameState(prev => ({ 
                ...prev, 
                rezCard: null,
                awaitingSacrifices: false
            }));
        }
    }, []);

    // Action handlers
    const handleCardSelect = useCallback((card) => {
        setUiState(prev => ({
            ...prev,
            selectedCard: card,
            selectedInHand: true
        }));
    }, []);

    const handleRealmSelect = useCallback((realmName) => {
        if (uiState.selectedCard && uiState.selectedInHand) {
            handleRezPlayerCard(uiState.selectedCard, realmName);
        }
    }, [uiState.selectedCard, uiState.selectedInHand, handleRezPlayerCard]);

    const handleBattleCardSelect = useCallback((card) => {
        setUiState(prev => ({
            ...prev,
            battleSelectedCard: card
        }));
    }, []);

    const handleSlotSelect = useCallback((index) => {
        // Handle slot selection logic
    }, []);

    // Create a component for each realm type
    const createRealmComponent = (RealmComponent) => {
        const WrappedComponent = ({ onRealmSelect, onRealmCardSelect, onAbilityClick, onRezPlayerCard }) => {
            const realmName = RealmComponent.realmName.toLowerCase();
            const playerRealmState = realms.player[realmName];
            const enemyRealmState = realms.enemy[realmName];
            return (
                <RealmComponent
                    onRealmSelect={onRealmSelect}
                    onRealmCardSelect={onRealmCardSelect}
                    onAbilityClick={onAbilityClick}
                    onRezPlayerCard={onRezPlayerCard}
                    playerState={playerRealmState}
                    enemyState={enemyRealmState}
                />
            );
        };
        WrappedComponent.realmName = RealmComponent.realmName;
        return WrappedComponent;
    };

    const realmComponents = [
        createRealmComponent(Solarium),
        createRealmComponent(Theater),
        createRealmComponent(Underpass),
        createRealmComponent(Grid),
        createRealmComponent(Elysium)
    ];

    return (
        <div className="board-container">
            <Gameboard 
                realmComponents={realmComponents}
                playerOneHand={state.playerHand}
                enemyHand={state.enemyHand}
                playerElysium={realms.player.elysium}
                enemySolarium={realms.enemy.solarium}
                enemyTheater={realms.enemy.theater}
                enemyUnderpass={realms.enemy.underpass}
                enemyGrid={realms.enemy.grid}
                enemyElysium={realms.enemy.elysium}
                
                // Battle state
                enemyBattleSlots={uiState.enemyBattleSlots}
                playerBattleSlots={uiState.playerBattleSlots}
                attackMode={gameState.attackMode}
                battleRealm={gameState.battleRealm}
                
                // UI handlers
                onCardSelect={handleCardSelect}
                onRealmSelect={handleRealmSelect}
                onRealmCardSelect={handleCardSelect}
                onBattleCardSelect={handleBattleCardSelect}
                onSlotSelect={handleSlotSelect}
                onConfirmDefenseSelection={() => {
                    setGameState(prev => ({ ...prev, mode: 'NONE' }));
                }}
                onPlayerBattle={() => {
                    setGameState(prev => ({ ...prev, mode: 'BATTLE' }));
                }}
                onRezPlayerCard={handleRezPlayerCard}
                onAbilityClick={(ability, entity) => {
                    if (ability && entity) {
                        activateAbilities(entity, 'PLAYER');
                    }
                }}
                onQuest={() => {
                    setGameState(prev => ({ ...prev, attackMode: 'PLAYER_QUEST' }));
                }}
                onRaid={() => {
                    setGameState(prev => ({ ...prev, attackMode: 'PLAYER_RAID' }));
                }}
                onHack={() => {
                    setGameState(prev => ({ ...prev, attackMode: 'PLAYER_HACK' }));
                }}

                // Focus state
                awaitingFocus={uiState.awaitingFocus}
                focus={uiState.focus}
                onFocusSelect={(newFocus) => {
                    setUiState(prev => ({ ...prev, focus: newFocus }));
                    setUiState(prev => ({ ...prev, awaitingFocus: false }));
                }}

                // Modal state
                modalVisible={uiState.modalVisible}
                modalTitle={uiState.modalTitle}
                modalContent={uiState.modalContent}
                modalButtons={uiState.modalButtons}
                onCloseModal={() => setUiState(prev => ({ ...prev, modalVisible: false }))}
                awaitingSacrifices={gameState.awaitingSacrifices}
                onSacrificeConfirmation={handleSacrificeConfirmation}
            />
        </div>
    );
}

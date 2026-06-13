import React, { useState, useEffect, useCallback } from 'react';
import { startTurn, endTurn, playerGainBits, enemyLoseBits, enemyPerformAction, endPlayerTurn, triggerRitualAbilities, playerDraft, removeCardFromHand, handleBoostButton, handleDevelopButton, handlePlayerMine } from './helpers/core';
import { eventManager } from './helpers/eventManager';
import { handleSacrificeConfirmation } from './helpers/sacrifice';
import { state, stateSetters, initializeSetters, currentPlayer, enemyActions } from './helpers/state';
import { createLibrary, createEnemyLibrary } from './helpers/setup';
import { activateAbilities, abilitiesDefinitions } from './abilities/glossary';
import { handleFocusSelect, handleCardSelect, handleRealmCardSelect as handleRealmCardSelectFromHelper, handleCancel } from './helpers/selection';
import { draw as enemyDraw } from './helpers/enemy';
import { Solarium, Theater, Underpass, Grid, Elysium } from './renders/Board';
import { calculateSoulsAvailable } from './helpers/activation';
import Gameboard from './Gameboard';
import { draw } from './helpers/player';
import { canPlaceInRealm } from './helpers/placement';

// Factory for the 10 realm setters (player & enemy x 5 realms each). Each
// returned setter:
//   1. Supports both `setX(value)` and `setX(prev => ...)` (updater form).
//   2. Writes the new value into `state.<key>` (used by game logic).
//   3. Writes the new value into `gameState.<key>` (used by some components).
//   4. Mirrors the new value into `realms.<side>.<lowerName>` (rendered UI).
// Side effect of the previous bug: player setters did NONE of 1, 3, 4. They
// stored updater functions literally and never updated `realms`, so the UI
// only reflected placements thanks to a redundant write in handleRealmSelect.
function buildRealmSetters({ setGameState, setRealms }) {
    const REALMS = [
        { side: 'player', key: 'playerSolarium',  lower: 'solarium',  name: 'setPlayerSolarium' },
        { side: 'player', key: 'playerTheater',   lower: 'theater',   name: 'setPlayerTheater' },
        { side: 'player', key: 'playerUnderpass', lower: 'underpass', name: 'setPlayerUnderpass' },
        { side: 'player', key: 'playerGrid',      lower: 'grid',      name: 'setPlayerGrid' },
        { side: 'player', key: 'playerElysium',   lower: 'elysium',   name: 'setPlayerElysium' },
        { side: 'enemy',  key: 'enemySolarium',   lower: 'solarium',  name: 'setEnemySolarium' },
        { side: 'enemy',  key: 'enemyTheater',    lower: 'theater',   name: 'setEnemyTheater' },
        { side: 'enemy',  key: 'enemyUnderpass',  lower: 'underpass', name: 'setEnemyUnderpass' },
        { side: 'enemy',  key: 'enemyGrid',       lower: 'grid',      name: 'setEnemyGrid' },
        { side: 'enemy',  key: 'enemyElysium',    lower: 'elysium',   name: 'setEnemyElysium' },
    ];
    const setters = {};
    for (const { side, key, lower, name } of REALMS) {
        setters[name] = (value) => {
            const prev = state[key];
            const next = typeof value === 'function' ? value(prev) : value;
            state[key] = next;
            setGameState(g => ({ ...g, [key]: next }));
            setRealms(r => ({ ...r, [side]: { ...r[side], [lower]: next } }));
        };
    }
    return setters;
}

export default function BoardContainer() {
    // Card state - using global state instead of local state
    const [, setPlayerHand] = useState([]);
    const [, setPlayerLibrary] = useState([]);
    const [, setEnemyHand] = useState([]);
    const [, setEnemyLibrary] = useState([]);

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

    // State setters will be initialized in the main initialization useEffect below

    // Game state
    const [gameState, setGameState] = useState({
        mode: 'NONE',
        attackMode: false,
        priorityLeft: true,
        awaitingTrash: false,
        awaitingSacrifices: false,
        battleRealm: null,
        currentPlayer: 'PLAYER',
        playerBits: state.playerBits, // Initialize from global state
        playerActions: state.playerActions, // Initialize from global state
        rezCard: null,
        targetType: null,
        selectedCard: null,
        selectedInHand: false,
        focus: '',
        playerAshes: 0,
        playerSouls: 0,
        battleSelectedCard: null,
        playerBattleSlots: [],
        enemyBattleSlots: [],
        draftSelected: false,
        recruiterCount: 0
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

        // Create libraries
        console.log('Creating libraries...');
        const playerLib = createLibrary();
        const enemyLib = createEnemyLibrary();

        // Setting up libraries and initial state
        console.log('Setting up libraries and initial state...');
        console.log('Initial playerLibrary:', playerLib);
        console.log('Initial enemyLibrary:', enemyLib);

        // Initialize all state setters in one place to avoid conflicts
        console.log('[BoardContainer useEffect] Running to initialize all setters.');
        initializeSetters({
            // Resource setters
            setPlayerAshes: (updater) => {
                const newValue = typeof updater === 'function' ? updater(state.playerAshes) : updater;
                state.playerAshes = newValue;
                setGameState(prev => ({
                    ...prev,
                    playerAshes: newValue
                }));
            },
            setPlayerSouls: (updater) => {
                const newValue = typeof updater === 'function' ? updater(state.playerSouls) : updater;
                state.playerSouls = newValue;
                setGameState(prev => ({
                    ...prev,
                    playerSouls: newValue
                }));
            },
            setPlayerBits: (updater) => {
                console.log(`[BoardContainer setPlayerBits] Called with updater:`, updater);
                const newValue = typeof updater === 'function' ? updater(state.playerBits) : updater;
                state.playerBits = newValue;
                setGameState(prev => {
                    console.log(`[BoardContainer setPlayerBits] Previous gameState.playerBits: ${prev.playerBits}`);
                    console.log(`[BoardContainer setPlayerBits] New playerBits: ${newValue}`);
                    return {
                        ...prev,
                        playerBits: newValue
                    };
                });
            },
            setPlayerActions: (updater) => {
                console.log(`[BoardContainer setPlayerActions] Called with updater:`, updater);
                const newValue = typeof updater === 'function' ? updater(state.playerActions) : updater;
                state.playerActions = newValue;
                setGameState(prev => {
                    console.log(`[BoardContainer setPlayerActions] Previous gameState.playerActions: ${prev.playerActions}`);
                    console.log(`[BoardContainer setPlayerActions] New playerActions: ${newValue}`);
                    return {
                        ...prev,
                        playerActions: newValue
                    };
                });
            },
            setPlayerOverload: (updater) => {
                const newValue = typeof updater === 'function' ? updater(state.playerOverload) : updater;
                state.playerOverload = newValue;
                setGameState(prev => ({
                    ...prev,
                    playerOverload: newValue
                }));
            },
            setEnemyOverload: (updater) => {
                const newValue = typeof updater === 'function' ? updater(state.enemyOverload) : updater;
                state.enemyOverload = newValue;
                setGameState(prev => ({
                    ...prev,
                    enemyOverload: newValue
                }));
            },
            setPlayerWounds: (updater) => {
                const newValue = typeof updater === 'function' ? updater(state.playerWounds) : updater;
                state.playerWounds = newValue;
                setGameState(prev => ({
                    ...prev,
                    playerWounds: newValue
                }));
            },
            setEnemyWounds: (updater) => {
                const newValue = typeof updater === 'function' ? updater(state.enemyWounds) : updater;
                state.enemyWounds = newValue;
                setGameState(prev => ({
                    ...prev,
                    enemyWounds: newValue
                }));
            },
            setPlayerBurden: (updater) => {
                const newValue = typeof updater === 'function' ? updater(state.playerBurden) : updater;
                state.playerBurden = newValue;
                setGameState(prev => ({
                    ...prev,
                    playerBurden: newValue
                }));
            },
            setPlayerFate: (updater) => {
                const newValue = typeof updater === 'function' ? updater(state.playerFate) : updater;
                state.playerFate = newValue;
                setGameState(prev => ({
                    ...prev,
                    playerFate: newValue
                }));
            },
            setPlayerSurge: (updater) => {
                const newValue = typeof updater === 'function' ? updater(state.playerSurge) : updater;
                state.playerSurge = newValue;
                setGameState(prev => ({
                    ...prev,
                    playerSurge: newValue
                }));
            },
            setEnemyBits: (updater) => {
                const newValue = typeof updater === 'function' ? updater(state.enemyBits) : updater;
                state.enemyBits = newValue;
                setGameState(prev => ({
                    ...prev,
                    enemyBits: newValue
                }));
            },
            setEnemyActions: (updater) => {
                const newValue = typeof updater === 'function' ? updater(state.enemyActions) : updater;
                state.enemyActions = newValue;
                setGameState(prev => ({
                    ...prev,
                    enemyActions: newValue
                }));
            },
            setEnemySurge: (updater) => {
                const newValue = typeof updater === 'function' ? updater(state.enemySurge) : updater;
                state.enemySurge = newValue;
                setGameState(prev => ({
                    ...prev,
                    enemySurge: newValue
                }));
            },
            // Card setters
            setPlayerHand: (value) => {
                // Calculate the new hand value
                const newValue = typeof value === 'function' 
                    ? value(state.playerHand) 
                    : value;
                
                // Log the change for debugging
                console.log('setPlayerHand - Old hand:', JSON.stringify(state.playerHand));
                console.log('setPlayerHand - New hand:', JSON.stringify(newValue));
                
                // Update global state
                state.playerHand = newValue;
                
                // Update the React state directly
                setGameState(prev => {
                    const updatedState = {
                        ...prev,
                        playerHand: newValue
                    };
                    console.log('setPlayerHand - Updated React state:', updatedState.playerHand);
                    return updatedState;
                });
            },
            setPlayerLibrary: (value) => {
                setPlayerLibrary(value);
                state.playerLibrary = value;
            },
            setEnemyHand: (value) => {
                setEnemyHand(value);
                state.enemyHand = value;
            },
            setEnemyLibrary: (value) => {
                setEnemyLibrary(value);
                state.enemyLibrary = value;
            },
            setMode: (value) => {
                setGameState(prev => ({ ...prev, mode: value }));
                state.mode = value;
            },
            setSelectedCard: (value) => {
                setGameState(prev => ({ ...prev, selectedCard: value }));
                state.selectedCard = value;
            },
            setSelectedInHand: (value) => {
                setGameState(prev => ({ ...prev, selectedInHand: value }));
                state.selectedInHand = value;
            },
            setTargetType: (value) => {
                setGameState(prev => ({ ...prev, targetType: value }));
                state.targetType = value;
            },
            setTargetSelection: (value) => {
                setGameState(prev => ({ ...prev, targetSelection: value }));
                state.targetSelection = value;
            },
            setPlayerTargetSelection: (value) => {
                setGameState(prev => ({ ...prev, playerTargetSelection: value }));
                state.playerTargetSelection = value;
            },
            setEnemyTargetSelection: (value) => {
                setGameState(prev => ({ ...prev, enemyTargetSelection: value }));
                state.enemyTargetSelection = value;
            },
            setDraftSelected: (value) => {
                setGameState(prev => ({ ...prev, draftSelected: value }));
                state.draftSelected = value;
            },
            setSelectedRealm: (value) => {
                setGameState(prev => ({ ...prev, selectedRealm: value }));
                state.selectedRealm = value;
            },
            setCurrentPlayer: (value) => {
                setGameState(prev => ({ ...prev, currentPlayer: value }));
                state.currentPlayer = value;
            },
            setPendingRitual: (value) => {
                setGameState(prev => ({ ...prev, pendingRitual: value }));
                state.pendingRitual = value;
            },
            setPendingManualAbility: (value) => {
                setGameState(prev => ({ ...prev, pendingManualAbility: value }));
                state.pendingManualAbility = value;
            },
            setAwaitingSacrifices: (value) => {
                setGameState(prev => ({ ...prev, awaitingSacrifices: value }));
                state.awaitingSacrifices = value;
            },
            setRezCard: (value) => {
                setGameState(prev => ({ ...prev, rezCard: value }));
                state.rezCard = value;
            },
            // Realm setters. Each one:
            //   1. Supports both direct-value and updater-function form
            //      (callers do `setPlayerSolarium(prev => ({...prev, people: [...]}))`).
            //   2. Writes to `state.<realm>` and `gameState.<realm>` (game logic).
            //   3. Mirrors into `realms.<side>.<lowerName>` (rendered UI).
            // Previously the player setters did neither (1) nor (3), causing
            // updater functions to be stored literally in state.playerX, and
            // game-logic mutations to never show up in the UI.
            ...buildRealmSetters({ setGameState, setRealms }),
            // Battle setters
            setBattleRealm: (value) => {
                setGameState(prev => ({ ...prev, battleRealm: value }));
                state.battleRealm = value;
            },
            setPlayerBattleSlots: (value) => {
                setGameState(prev => ({ ...prev, playerBattleSlots: value }));
                state.playerBattleSlots = value;
            },
            setEnemyBattleSlots: (value) => {
                setGameState(prev => ({ ...prev, enemyBattleSlots: value }));
                state.enemyBattleSlots = value;
            },
            setBattleSelectedCard: (value) => {
                setGameState(prev => ({ ...prev, battleSelectedCard: value }));
                state.battleSelectedCard = value;
            },

            // Additional setters for player/enemy entities died this turn
            setPlayerEntitiesDiedThisTurn: (value) => {
                const newValue = typeof value === 'function' ? value(state.playerEntitiesDiedThisTurn || []) : value;
                state.playerEntitiesDiedThisTurn = newValue;
                setGameState(prev => ({
                    ...prev,
                    playerEntitiesDiedThisTurn: newValue
                }));
            },
            setEnemyEntitiesDiedThisTurn: (value) => {
                const newValue = typeof value === 'function' ? value(state.enemyEntitiesDiedThisTurn || []) : value;
                state.enemyEntitiesDiedThisTurn = newValue;
                setGameState(prev => ({
                    ...prev,
                    enemyEntitiesDiedThisTurn: newValue
                }));
            },
            
            // Turn management setter
            setPriorityLeft: (value) => {
                const newValue = typeof value === 'function' ? value(state.priorityLeft) : value;
                state.priorityLeft = newValue;
                setGameState(prev => ({
                    ...prev,
                    priorityLeft: newValue
                }));
            },
        });

        // Initialize state
        state.playerLibrary = playerLib;
        state.enemyLibrary = enemyLib;
        state.playerHand = [];
        state.enemyHand = [];
        
        // Update React state
        setPlayerLibrary(playerLib);
        setEnemyLibrary(enemyLib);
        setPlayerHand([]);
        setEnemyHand([]);

        // Set game state
        setGameState(prev => ({
            ...prev,
            mode: 'MULLIGAN',
            currentPlayer: 'PLAYER',
        }));

        // Draw initial hands
        console.log('Drawing initial hands...');
        console.log('State before draw:', state);
        draw(5);
        enemyDraw(5);

        console.log('Libraries initialized, ready for drawing initial hands...');
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

    // Start first turn once both hands reach 5 cards (after mulligan draw).
    // Wired to gameState.playerHand/enemyHand so it fires when the draw completes,
    // not just at mount where the hands are still empty.
    useEffect(() => {
        if (
            gameState.playerHand?.length === 5 &&
            gameState.enemyHand?.length === 5 &&
            gameState.mode === 'MULLIGAN'
        ) {
            startTurn(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState.playerHand?.length, gameState.enemyHand?.length, gameState.mode]);

    // Win conditions (notes.txt: threshold = 8, not 10).
    // Fires whenever the tracked resource changes.
    useEffect(() => {
        if (gameState.mode === 'GAME_OVER' || gameState.mode === 'NONE' || gameState.mode === 'MULLIGAN') return;
        // Player wins: Fate >= 8 (Ascend to Divinity)
        if (gameState.playerFate >= 8) {
            console.log('Player wins by Fate (Ascend to Divinity)!');
            stateSetters.setMode('GAME_OVER');
        }
    }, [gameState.playerFate, gameState.mode]);

    useEffect(() => {
        if (gameState.mode === 'GAME_OVER' || gameState.mode === 'NONE' || gameState.mode === 'MULLIGAN') return;
        // Enemy loses: enemy Fate >= 8
        if (gameState.enemyFate >= 8) {
            console.log('Enemy loses by Fate — player wins!');
            stateSetters.setMode('GAME_OVER');
        }
    }, [gameState.enemyFate, gameState.mode]);

    // Loss conditions: Burden + Wounds >= 8 (Destroy their Corporeal Form)
    useEffect(() => {
        if (gameState.mode === 'GAME_OVER' || gameState.mode === 'NONE' || gameState.mode === 'MULLIGAN') return;
        if ((gameState.playerBurden || 0) + (gameState.playerWounds || 0) >= 8) {
            console.log('Player loses by Burden + Wounds!');
            stateSetters.setMode('GAME_OVER');
        }
    }, [gameState.playerBurden, gameState.playerWounds, gameState.mode]);

    useEffect(() => {
        if (gameState.mode === 'GAME_OVER' || gameState.mode === 'NONE' || gameState.mode === 'MULLIGAN') return;
        if ((gameState.enemyBurden || 0) + (gameState.enemyWounds || 0) >= 8) {
            console.log('Enemy loses by Burden + Wounds — player wins!');
            stateSetters.setMode('GAME_OVER');
        }
    }, [gameState.enemyBurden, gameState.enemyWounds, gameState.mode]);

    // Loss conditions: Overload >= 8 (System Meltdown)
    useEffect(() => {
        if (gameState.mode === 'GAME_OVER' || gameState.mode === 'NONE' || gameState.mode === 'MULLIGAN') return;
        if (gameState.playerOverload >= 8) {
            console.log('Player loses by Overload (System Meltdown)!');
            stateSetters.setMode('GAME_OVER');
        }
    }, [gameState.playerOverload, gameState.mode]);

    useEffect(() => {
        if (gameState.mode === 'GAME_OVER' || gameState.mode === 'NONE' || gameState.mode === 'MULLIGAN') return;
        if (gameState.enemyOverload >= 8) {
            console.log('Enemy loses by Overload — player wins!');
            stateSetters.setMode('GAME_OVER');
        }
    }, [gameState.enemyOverload, gameState.mode]);

    // End-of-actions → domination phase.
    // Fires when either side's action count changes.
    useEffect(() => {
        if (
            gameState.mode !== 'NORMAL' ||
            (gameState.playerActions ?? 1) > 0 ||
            (gameState.enemyActions ?? 1) > 0
        ) return;
        stateSetters.setMode('DOMINATION');
    }, [gameState.playerActions, gameState.enemyActions, gameState.mode]);

    // Domination phase → endTurn (calls handleDominationPhase then startTurn).
    useEffect(() => {
        if (gameState.mode !== 'DOMINATION') return;
        endTurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState.mode]);

    // Enemy AI turn: fire only when currentPlayer switches to ENEMY.
    // The enemyPerformAction function uses setTimeout recursion to chain actions —
    // including enemyActions in deps would fire this multiple times per turn.
    useEffect(() => {
        if (gameState.currentPlayer !== 'ENEMY') return;
        if (gameState.mode !== 'NORMAL') return;
        console.log('Dispatching enemy turn start');
        // Small delay to let startTurn settle before checking actions
        const t = setTimeout(() => {
            if (state.enemyActions > 0) {
                enemyPerformAction();
            } else {
                // No actions granted yet — pass back immediately
                stateSetters.setCurrentPlayer('PLAYER');
            }
        }, 200);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState.currentPlayer, gameState.mode]);

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

    // Destructure state variables
    const {
        selectedCard,
        playerBits,
        playerAshes
    } = gameState;
    
    const handleRezPlayerCard = useCallback((entity) => {
        console.log('handle rez', entity);
        const soulsAvailable = calculateSoulsAvailable(entity.id);
        if ((entity.card.category !== 'LANDMARK' && entity.online) && (entity.card.category !== 'LOCATION' && entity.online)) {
            console.log('already online');
            return;
        }

        if (playerBits < entity.card.rezCost || playerAshes < entity.card.ash || soulsAvailable < entity.card.soul) {
            console.log('no resources');
            //console.error('Not enough resources to rez the card');
            return;
        }
        console.log('rezzing now');
        setGameState(prev => ({
            ...prev,
            rezCard: entity,
            awaitingSacrifices: true
        }));
        if (!entity.card.soul || entity.card.soul === 0) {
            console.log('no soul cost');
            setGameState(prev => ({
                ...prev,
                awaitingSacrifices: false
            }));
        }
    }, [playerBits, playerAshes]);

    // Destructure setters from stateSetters
    const {
        setSelectedCard,
        setDraftSelected,
        setTargetType,
        setCurrentPlayer,
        setPendingRitual,
        setTargetSelection,
        setPlayerSolarium,
        setPlayerTheater,
        setPlayerUnderpass,
        setPlayerGrid,
        setPlayerElysium,
        setPlayerBits,
        setPlayerAshes,
        setPlayerSouls
    } = stateSetters;

    const confirmRitualActivation = (target) => {
        const { entity, ability } = gameState.pendingRitual;
        triggerRitualAbilities(entity, target, 'PLAYER', ability);
        endPlayerTurn();
    };

    // Using removeCardFromHand imported from core.js

    // New function to handle boost functionality correctly
    const handleBoostInRealm = (cardId, realmName) => {
        console.log('=== handleBoostInRealm ===');
        console.log('cardId:', cardId);
        console.log('realmName:', realmName);
        
        // Find the card in the realm
        const realmData = realms.player[realmName.toLowerCase()];
        if (!realmData) {
            console.error(`Realm ${realmName} not found`);
            return;
        }
        
        // Look in people, places, and things arrays
        const arrays = ['people', 'places', 'things'];
        let cardEntity = null;
        let arrayName = null;
        
        for (const array of arrays) {
            const found = realmData[array].find(card => card.id === cardId);
            if (found) {
                cardEntity = found;
                arrayName = array;
                break;
            }
        }
        
        if (!cardEntity) {
            console.error(`Card ${cardId} not found in realm ${realmName}`);
            return;
        }
        
        console.log('Found card in realm:', cardEntity);
        
        // Update the card directly in the realm
        let newSteps = cardEntity.steps || 0;
        let newFreeze = cardEntity.freeze || 0;
        
        // Handle freeze reduction or step gain
        if (newFreeze > 0) {
            newFreeze -= 1;
            console.log(`${cardEntity.card.name} reduces Freeze by 1. Remaining Freeze: ${newFreeze}`);
        } else {
            newSteps += 1;
            console.log(`${cardEntity.card.name} gains 1 step. Total steps: ${newSteps}`);
        }
        
        // Check if card should be readied
        const isReady = cardEntity.card.timer && newSteps >= cardEntity.card.timer;
        
        // Update the realm state
        const updatedCard = {
            ...cardEntity,
            steps: newSteps,
            freeze: newFreeze,
            readied: isReady
        };
        
        // Update the realm
        const updatedRealm = {
            ...realmData,
            [arrayName]: realmData[arrayName].map(card => 
                card.id === cardId ? updatedCard : card
            )
        };
        
        // Update the realms state
        setRealms(prev => ({
            ...prev,
            player: {
                ...prev.player,
                [realmName.toLowerCase()]: updatedRealm
            }
        }));
        
        // Reset attack mode
        state.attackMode = 'NONE';
        
        // Emit event for readied status change if needed
        if (isReady && !cardEntity.readied) {
            const { eventManager } = require('./helpers/eventManager');
            eventManager.publish('cardReadied', { cardEntity: updatedCard });
        }
    };
    
    // New function to handle develop functionality correctly
    const handleDevelopInRealm = (cardId, realmName) => {
        console.log('=== handleDevelopInRealm ===');
        console.log('cardId:', cardId);
        console.log('realmName:', realmName);
        
        // Find the card in the realm
        const realmData = realms.player[realmName.toLowerCase()];
        if (!realmData) {
            console.error(`Realm ${realmName} not found`);
            return;
        }
        
        // Look in people, places, and things arrays
        const arrays = ['people', 'places', 'things'];
        let cardEntity = null;
        let arrayName = null;
        
        for (const array of arrays) {
            const found = realmData[array].find(card => card.id === cardId);
            if (found) {
                cardEntity = found;
                arrayName = array;
                break;
            }
        }
        
        if (!cardEntity) {
            console.error(`Card ${cardId} not found in realm ${realmName}`);
            return;
        }
        
        console.log('Found card in realm:', cardEntity);
        
        // Reset attack mode
        state.attackMode = 'NONE';
        
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
        
        let updatedCard = { ...cardEntity };
        
        // Increase Development or Scheme points
        if (cardEntity.card.category === 'SYM' || cardEntity.card.category === 'LANDMARK') {
            const newDevelopment = (cardEntity.development || 0) + 1;
            
            // Check for Ascension
            if (newDevelopment >= cardEntity.card.plot) {
                // Import handleAscension from advancement.js
                const { handleAscension } = require('./helpers/advancement');
                handleAscension(cardEntity, 'PLAYER');
                return; // handleAscension will update the state
            } else {
                // Update development
                updatedCard.development = newDevelopment;
            }
        } else if (cardEntity.scheming) {
            const newScheme = (cardEntity.scheme || 0) + 1;
            
            // Check for Scheme Threshold
            if (newScheme >= cardEntity.card.schemeThreshold) {
                // Unlock Scheme Ability
                updatedCard.scheme = newScheme;
                updatedCard.schemeUnlocked = true;
                console.log(`${cardEntity.card.name} has unlocked its Scheme ability.`);
            } else {
                // Update scheme
                updatedCard.scheme = newScheme;
            }
        }
        
        // Update the realm
        const updatedRealm = {
            ...realmData,
            [arrayName]: realmData[arrayName].map(card => 
                card.id === cardId ? updatedCard : card
            )
        };
        
        // Update the realms state
        setRealms(prev => ({
            ...prev,
            player: {
                ...prev.player,
                [realmName.toLowerCase()]: updatedRealm
            }
        }));
    };

    const handleRealmSelect = (realmName) => {
        console.log('=== handleRealmSelect ===');
        console.log('realmName:', realmName);
        console.log('selectedCard:', selectedCard);
        console.log('gameState:', gameState);
        console.log('realms:', realms);
        console.log('state.attackMode:', state.attackMode);
        console.log('state.selectedCard:', state.selectedCard);

        // Check if we're in BOOST or DEVELOP mode
        if (state.attackMode === 'BOOST' && state.selectedCard) {
            console.log('Handling boost for card:', state.selectedCard);
            handleBoostInRealm(state.selectedCard.id, realmName);
            return;
        } else if (state.attackMode === 'DEVELOP' && state.selectedCard) {
            console.log('Handling develop for card:', state.selectedCard);
            handleDevelopInRealm(state.selectedCard.id, realmName);
            return;
        }

        // Continue with normal realm selection logic
        if (!selectedCard) {
            console.log('No card selected');
            return;
        }

        const { focus } = state;
        const card = selectedCard.card;
        const cardFocusAttrs = {
            magi: card.magi || false,
            tech: card.tech || false,
            phys: card.phys || false,
        };

        // Focus filter: a card must match the currently-active focus to be
        // playable this turn.
        if (!cardFocusAttrs[focus]) {
            console.log('Focus does not match (focus=', focus, ', card attrs=', cardFocusAttrs, ')');
            return;
        }

        // Rituals don't go to a realm -- they trigger their ability and
        // (optionally) request a target via setTargetSelection.
        if (card.category === 'RITUAL' && card.abilities) {
            const ritualAbilities = card.abilities.filter(
                (ability) => typeof ability === 'object' && ability.requiresTarget
            );
            if (ritualAbilities.length > 0) {
                const ability = ritualAbilities[0];
                const abilityDef = abilitiesDefinitions[ability.name];
                if (abilityDef && abilityDef.targetFilter) {
                    setPendingRitual({ entity: selectedCard, ability: abilityDef });
                    setTargetSelection({
                        enabled: true,
                        side: 'PLAYER',
                        filter: abilityDef.targetFilter,
                        callback: (target) => {
                            confirmRitualActivation(target);
                            removeCardFromHand(selectedCard);
                        },
                    });
                    return;
                }
            }
            return;
        }

        // Single source of truth for placement rules: src/ui/helpers/placement.js
        // (covered by src/ui/helpers/__tests__/placement.test.js).
        const normalizedRealm = realmName.charAt(0).toUpperCase() + realmName.slice(1).toLowerCase();
        const decision = canPlaceInRealm(card, normalizedRealm);
        if (!decision.canPlace) {
            console.log(`Cannot place ${card.name || 'card'} in ${normalizedRealm}: ${decision.reason}`);
            return;
        }

        const playerRealmSetters = {
            Solarium: setPlayerSolarium,
            Theater: setPlayerTheater,
            Underpass: setPlayerUnderpass,
            Grid: setPlayerGrid,
            // Elysium intentionally omitted: ascension-only, not directly playable.
        };
        const targetRealmSetter = playerRealmSetters[normalizedRealm];
        if (!targetRealmSetter) {
            console.log('No setter for realm:', normalizedRealm);
            return;
        }

        // Places (Landmarks / Locations) come online immediately; everything
        // else starts offline and must be activated.
        const placedOnline = decision.array === 'places';
        const updatedCard = {
            ...selectedCard,
            realm: normalizedRealm,
            owner: 'PLAYER',
            readied: false,
            online: placedOnline,
            activated: false,
        };

        targetRealmSetter(prevRealm => ({
            ...prevRealm,
            [decision.array]: [...(prevRealm[decision.array] || []), updatedCard],
        }));

        // Resources are deducted at activation time, not at placement time.
        removeCardFromHand(selectedCard);
        setSelectedCard(null);
        setDraftSelected(false);
        setTargetType('none');
        setCurrentPlayer('ENEMY');
    };

    const handleBattleCardSelect = useCallback((card) => {
        setUiState(prev => ({
            ...prev,
            battleSelectedCard: card
        }));
    }, [setUiState]);

    const handleBattleTargetSelect = useCallback((target) => {
        const { battleSelectedCard } = uiState;
        if (!battleSelectedCard) return;

        // Handle battle logic here
        console.log('Battle between:', battleSelectedCard, 'and', target);

        setUiState(prev => ({
            ...prev,
            battleSelectedCard: null
        }));
    }, [uiState, setUiState]);

    const handleRealmCardSelect = useCallback((card, realmName) => {
        console.log('Selected card in realm:', card, 'from realm:', realmName);
        // Call the implemented handleRealmCardSelect from selection.js
        handleRealmCardSelectFromHelper(card);
    }, []);

    const handleAbilityClick = useCallback((ability, card) => {
        console.log('Clicked ability:', ability, 'on card:', card);
        // Add your ability click logic here
    }, []);

    const handleBattleCancel = useCallback(() => {
        setUiState(prev => ({
            ...prev,
            battleSelectedCard: null
        }));
    }, [setUiState]);

    const handleBattleStart = useCallback(() => {
        const { battleSelectedCard } = uiState;
        if (!battleSelectedCard) return;

        // Start battle logic here
        console.log('Starting battle with:', battleSelectedCard);
    }, [uiState]);

    const handleBattleAction = useCallback((action) => {
        const { battleSelectedCard } = uiState;
        if (!battleSelectedCard) return;

        // Handle battle action
        console.log('Battle action:', action, 'for card:', battleSelectedCard);
    }, [uiState]);

    const handleSlotSelect = useCallback((index) => {
        // Handle slot selection logic
        console.log('Selected slot:', index);
    }, []);

    // Create a component for each realm type
    const createRealmComponent = (RealmComponent, realmName) => {
        const WrappedComponent = ({ onRealmSelect, onServerSelect, onRealmCardSelect, onAbilityClick, onRezPlayerCard }) => {
            const playerRealmState = realms.player[realmName.toLowerCase()];
            const enemyRealmState = realms.enemy[realmName.toLowerCase()];

            return (
                <RealmComponent
                    onRealmSelect={onRealmSelect}
                    onServerSelect={onServerSelect}
                    onRealmCardSelect={onRealmCardSelect}
                    onAbilityClick={onAbilityClick}
                    onRezPlayerCard={onRezPlayerCard}
                    playerState={playerRealmState}
                    enemyState={enemyRealmState}
                />
            );
        };
        return WrappedComponent;
    };

    const SolariumRealm = createRealmComponent(Solarium, 'Solarium');
    const TheaterRealm = createRealmComponent(Theater, 'Theater');
    const UnderpassRealm = createRealmComponent(Underpass, 'Underpass');
    const GridRealm = createRealmComponent(Grid, 'Grid');
    const ElysiumRealm = createRealmComponent(Elysium, 'Elysium');


    const realmComponents = [SolariumRealm, TheaterRealm, UnderpassRealm, GridRealm, ElysiumRealm];

    return (
        <div className="board-container">
            <Gameboard 
                realmComponents={realmComponents}
                playerOneHand={state.playerHand}
                enemyHand={state.enemyHand}
                playerSolarium={realms.player.solarium}
                playerTheater={realms.player.theater}
                playerUnderpass={realms.player.underpass}
                playerGrid={realms.player.grid}
                playerElysium={realms.player.elysium}
                enemySolarium={realms.enemy.solarium}
                enemyTheater={realms.enemy.theater}
                enemyUnderpass={realms.enemy.underpass}
                enemyGrid={realms.enemy.grid}
                enemyElysium={realms.enemy.elysium}
                
                // Player resources
                playerBits={gameState.playerBits}
                playerAshes={state.playerAshes}
                playerBurden={state.playerBurden}
                playerFate={state.playerFate}
                playerWounds={state.playerWounds}
                playerOverload={state.playerOverload}
                playerLag={state.playerLag}
                playerActions={gameState.playerActions}
                playerSurge={state.playerSurge}
                
                // Enemy resources
                enemyBits={state.enemyBits}
                enemyAshes={state.enemyAshes}
                enemyBurden={state.enemyBurden}
                enemyFate={state.enemyFate}
                enemyWounds={state.enemyWounds}
                enemyOverload={state.enemyOverload}
                enemyLag={state.enemyLag}
                enemyActions={state.enemyActions}
                enemySurge={state.enemySurge}
                enemyDebt={state.enemyDebt || 0}
                
                // Battle state
                enemyBattleSlots={uiState.enemyBattleSlots}
                playerBattleSlots={uiState.playerBattleSlots}
                attackMode={gameState.attackMode}
                battleRealm={gameState.battleRealm}
                
                // UI handlers
                onCardSelect={(card) => handleCardSelect(card, true)}
                onRealmSelect={handleRealmSelect}
                onRealmCardSelect={(card) => handleCardSelect(card, false)}
                onBattleCardSelect={handleBattleCardSelect}
                onBattleStart={handleBattleStart}
                onBattleCancel={handleBattleCancel}
                onBattleAction={handleBattleAction}
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
                
                // Action handlers
                playerBoost={handleBoostButton}
                playerDevelop={handleDevelopButton}
                playerMine={handlePlayerMine}

                // Focus state
                awaitingFocus={uiState.awaitingFocus}
                focus={uiState.focus}
                onFocusSelect={(newFocus) => {
                    console.log('Focus selected in BoardContainer:', newFocus);
                    handleFocusSelect(newFocus);
                    setUiState(prev => ({
                        ...prev,
                        focus: newFocus,
                        awaitingFocus: false
                    }));
                }}

                // Modal state
                modalVisible={uiState.modalVisible}
                modalTitle={uiState.modalTitle}
                modalContent={uiState.modalContent}
                modalButtons={uiState.modalButtons}
                onCloseModal={() => setUiState(prev => ({ ...prev, modalVisible: false }))}
                awaitingSacrifices={gameState.awaitingSacrifices}
                onSacrificeConfirmation={handleSacrificeConfirmation}
                playerDraw={draw}
                playerDraft={playerDraft}
                selectedCard={gameState.selectedCard}
                selectedInHand={gameState.selectedInHand}
                onCancelSelection={handleCancel}
            />
        </div>
    );
}

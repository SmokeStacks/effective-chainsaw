import React, { useState, useEffect, useCallback } from 'react';
import { startTurn, playerGainBits, enemyLoseBits, enemyPerformAction, playerLoseBits, playerLoseActions, endPlayerTurn, returnToOriginalRealm, triggerRitualAbilities, playerDraft, removeCardFromHand } from './helpers/core';
import { eventManager } from './helpers/eventManager';
import { handleSacrificeConfirmation } from './helpers/sacrifice';
import { state, stateSetters, initializeSetters, currentPlayer, enemyActions } from './helpers/state';
import { createLibrary, createEnemyLibrary } from './helpers/setup';
import { activateAbilities, abilitiesDefinitions } from './abilities/glossary';
import { handleFocusSelect, handleCardSelect } from './helpers/selection';
import { draw as enemyDraw } from './helpers/enemy';
import { Solarium, Theater, Underpass, Grid, Elysium } from './renders/Board';
import { calculateSoulsAvailable } from './helpers/activation';
import Gameboard from './Gameboard';
import { draw } from './helpers/player';

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

    // Initialize state setters
    useEffect(() => {
        initializeSetters({
            setPlayerAshes: (updater) => {
                setGameState(prev => ({
                    ...prev,
                    playerAshes: typeof updater === 'function' ? updater(prev.playerAshes) : updater
                }));
            },
            setPlayerSouls: (updater) => {
                setGameState(prev => ({
                    ...prev,
                    playerSouls: typeof updater === 'function' ? updater(prev.playerSouls) : updater
                }));
            }
            // Add other setters as needed
        });
    }, []);

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
        targetType: null,
        selectedCard: null,
        selectedInHand: false,
        focus: '',
        playerBits: 0,
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

        // Initialize state setters
        initializeSetters({
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
            // Realm setters
            setPlayerSolarium: (value) => {
                setGameState(prev => ({ ...prev, playerSolarium: value }));
                state.playerSolarium = value;
            },
            setPlayerTheater: (value) => {
                setGameState(prev => ({ ...prev, playerTheater: value }));
                state.playerTheater = value;
            },
            setPlayerUnderpass: (value) => {
                setGameState(prev => ({ ...prev, playerUnderpass: value }));
                state.playerUnderpass = value;
            },
            setPlayerGrid: (value) => {
                setGameState(prev => ({ ...prev, playerGrid: value }));
                state.playerGrid = value;
            },
            setPlayerElysium: (value) => {
                setGameState(prev => ({ ...prev, playerElysium: value }));
                state.playerElysium = value;
            },
            setEnemySolarium: (value) => {
                setGameState(prev => ({ ...prev, enemySolarium: value }));
                state.enemySolarium = value;
                // Sync with React component state
                setRealms(prevRealms => ({
                    ...prevRealms,
                    enemy: {
                        ...prevRealms.enemy,
                        solarium: value
                    }
                }));
            },
            setEnemyTheater: (value) => {
                setGameState(prev => ({ ...prev, enemyTheater: value }));
                state.enemyTheater = value;
                // Sync with React component state
                setRealms(prevRealms => ({
                    ...prevRealms,
                    enemy: {
                        ...prevRealms.enemy,
                        theater: value
                    }
                }));
            },
            setEnemyUnderpass: (value) => {
                setGameState(prev => ({ ...prev, enemyUnderpass: value }));
                state.enemyUnderpass = value;
                // Sync with React component state
                setRealms(prevRealms => ({
                    ...prevRealms,
                    enemy: {
                        ...prevRealms.enemy,
                        underpass: value
                    }
                }));
            },
            setEnemyGrid: (value) => {
                setGameState(prev => ({ ...prev, enemyGrid: value }));
                state.enemyGrid = value;
                // Sync with React component state
                setRealms(prevRealms => ({
                    ...prevRealms,
                    enemy: {
                        ...prevRealms.enemy,
                        grid: value
                    }
                }));
            },
            setEnemyElysium: (value) => {
                setGameState(prev => ({ ...prev, enemyElysium: value }));
                state.enemyElysium = value;
                // Sync with React component state
                setRealms(prevRealms => ({
                    ...prevRealms,
                    enemy: {
                        ...prevRealms.enemy,
                        elysium: value
                    }
                }));
            },
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
            // Resource setters
            setPlayerBits: (value) => {
                setGameState(prev => ({ ...prev, playerBits: value }));
                state.playerBits = value;
            },
            setPlayerActions: (value) => {
                setGameState(prev => ({ ...prev, playerActions: value }));
                state.playerActions = value;
            },
            setEnemyActions: (value) => {
                setGameState(prev => ({ ...prev, enemyActions: value }));
                state.enemyActions = value;
            },
            setEnemyWounds: (value) => {
                setGameState(prev => ({ ...prev, enemyWounds: value }));
                state.enemyWounds = value;
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
        // Only check for player loss after game has started and first turn has begun
        if (gameState.mode !== 'NONE' && gameState.mode !== 'MULLIGAN') {
            // Add null checks to prevent undefined errors during initialization
            const solariumEmpty = !state.playerSolarium?.people || state.playerSolarium.people.length === 0;
            const theaterEmpty = !state.playerTheater?.people || state.playerTheater.people.length === 0;
            const underpassEmpty = !state.playerUnderpass?.people || state.playerUnderpass.people.length === 0;
            const gridEmpty = !state.playerGrid?.people || state.playerGrid.people.length === 0;
            const elysiumEmpty = !state.playerElysium?.people || state.playerElysium.people.length === 0;
            
            if (solariumEmpty && theaterEmpty && underpassEmpty && gridEmpty && elysiumEmpty) {
                eventManager.publish('PLAYER_LOST');
            }
        }
    }, [gameState.mode]);

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
    }, []);

    // Check for player loss
    useEffect(() => {
        // Only check for player loss after game has started and first turn has begun
        if (gameState.mode !== 'NONE' && gameState.mode !== 'MULLIGAN') {
            // Add null checks to prevent undefined errors during initialization
            const solariumEmpty = !state.playerSolarium?.people || state.playerSolarium.people.length === 0;
            const theaterEmpty = !state.playerTheater?.people || state.playerTheater.people.length === 0;
            const underpassEmpty = !state.playerUnderpass?.people || state.playerUnderpass.people.length === 0;
            const gridEmpty = !state.playerGrid?.people || state.playerGrid.people.length === 0;
            const elysiumEmpty = !state.playerElysium?.people || state.playerElysium.people.length === 0;
            
            if (solariumEmpty && theaterEmpty && underpassEmpty && gridEmpty && elysiumEmpty) {
                eventManager.publish('PLAYER_LOST');
            }
        }
    }, [gameState.mode]);

    // Handle player realm updates
    useEffect(() => {
        setRealms(prev => {
            const playerRealmsChanged = state.playerSolarium || state.playerTheater || state.playerUnderpass || state.playerGrid || state.playerElysium;
            const enemyRealmsChanged = state.enemySolarium || state.enemyTheater || state.enemyUnderpass || state.enemyGrid || state.enemyElysium;
            
            if (!playerRealmsChanged && !enemyRealmsChanged) {
                return prev;
            }

            return {
                ...prev,
                player: {
                    solarium: state.playerSolarium,
                    theater: state.playerTheater,
                    underpass: state.playerUnderpass,
                    grid: state.playerGrid,
                    elysium: state.playerElysium
                },
                enemy: {
                    solarium: state.enemySolarium,
                    theater: state.enemyTheater,
                    underpass: state.enemyUnderpass,
                    grid: state.enemyGrid,
                    elysium: state.enemyElysium
                }
            };
        });
    }, []);

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
    }, []);

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

    // Effect to handle enemy turn
    useEffect(() => {
        const currentPlayerValue = currentPlayer();
        const enemyActionsValue = enemyActions();
        const gameStateValue = state.mode;
        
        console.log('Enemy turn check:', {
            currentPlayer: currentPlayerValue,
            enemyActions: enemyActionsValue,
            gameState: gameStateValue
        });
        
        // If it's the enemy's turn and they have actions
        if (currentPlayerValue === 'ENEMY' && enemyActionsValue > 0) {
            // If in BEGIN mode, transition to NORMAL mode first
            if (gameStateValue === 'BEGIN') {
                console.log('Transitioning from BEGIN to NORMAL mode for enemy turn');
                stateSetters.setMode('NORMAL');
            }
            // Then dispatch enemy action if in NORMAL mode
            else if (gameStateValue === 'NORMAL') {
                console.log('Dispatching enemy action');
                enemyPerformAction();
            }
        }
    });

    // Start the game or turn
    useEffect(() => {
        if (state.mode === 'BEGIN' && state.attackMode) {
            console.log('begin game');
            playerGainBits(1);
            draw(1);
            stateSetters.setMode('NORMAL');
            console.log('Set mode to NORMAL');
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

    // Destructure state variables
    const {
        selectedCard,
        playerBits,
        playerAshes,
        playerSouls
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
    }, [playerBits, playerAshes, playerSouls]);

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

    const handleRealmSelect = (realmName) => {
        console.log('=== handleRealmSelect ===');
        console.log('realmName:', realmName);
        console.log('selectedCard:', selectedCard);
        console.log('gameState:', gameState);
        console.log('realms:', realms);

        if (!selectedCard) {
            console.log('No card selected');
            return;
        }

        const { focus } = state;
        console.log('Current focus:', focus);
        
        // Extract focus attributes from the card
        const cardFocusAttrs = {
            magi: selectedCard.card.magi || false,
            tech: selectedCard.card.tech || false,
            phys: selectedCard.card.phys || false
        };

        // Check if card matches current focus
        const matchesFocus = cardFocusAttrs[focus] || false;

        console.log('Card focus attributes:', cardFocusAttrs);
        console.log('Matches current focus:', matchesFocus);

        if (!matchesFocus) {
            console.log('Focus does not match');
            return;
        }

        // Set initial card state
        let updatedCard = { 
            ...selectedCard, 
            realm: realmName, 
            owner: 'PLAYER',
            readied: false,  // Card starts unreadied
            online: false,   // Card starts offline
            activated: false // Card starts unactivated
        };
        console.log('Initial card state:', updatedCard);

        // Handle activation based on card category
        if (updatedCard.card.category === 'LOCATION' || updatedCard.card.category === 'LANDMARK') {
            updatedCard = {
                ...updatedCard,
                online: true,     // Places and landmarks come online immediately
                activated: false  // But still need to be activated
            };
        } else if (updatedCard.card.category === 'ENTITY') {
            updatedCard = {
                ...updatedCard,
                online: false,    // Entities start offline
                readied: false,   // Entities start unreadied
                activated: false  // Entities start unactivated
            };
        }

        console.log('Card state after activation rules:', updatedCard);

        // Create new realm state
        const updatedRealms = {
            ...realms,
            player: {
                ...realms.player,
                [realmName.toLowerCase()]: {
                    ...realms.player[realmName.toLowerCase()],
                    people: updatedCard.card.category === 'ENTITY' ? [...realms.player[realmName.toLowerCase()].people, updatedCard] : realms.player[realmName.toLowerCase()].people,
                    places: (updatedCard.card.category === 'LOCATION' || updatedCard.card.category === 'LANDMARK') ? [...realms.player[realmName.toLowerCase()].places, updatedCard] : realms.player[realmName.toLowerCase()].places,
                    things: updatedCard.card.category === 'THING' ? [...realms.player[realmName.toLowerCase()].things, updatedCard] : realms.player[realmName.toLowerCase()].things
                }
            }
        };

        // Update realm state
        setRealms(updatedRealms);
        console.log('Updated realms:', updatedRealms);

        let canPlace = false;
        let targetRealmSetter = null;
        let placementArray = null;
        const category = selectedCard.card.category;
        // Re-use the focus attributes we already extracted
        const { magi, tech, phys } = cardFocusAttrs;

        // Handle ritual cards
        if (category === 'RITUAL' && selectedCard.card.abilities) {
            const ritualAbilities = selectedCard.card.abilities.filter(
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
                            setPlayerBits(prev => prev - selectedCard.card.rezCost);
                            setPlayerAshes(prev => prev - selectedCard.card.ash);
                        }
                    });
                    return;
                }
            }
            return;
        }

        // Handle card placement based on realm
        switch (realmName.toLowerCase()) {
            case 'solarium':
                if (category === 'ENTITY' && magi) {
                    canPlace = true;
                    targetRealmSetter = setPlayerSolarium;
                    placementArray = 'people';
                }
                break;
            case 'theater':
                if (category === 'ENTITY' && (magi || tech || phys)) {
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
            case 'underpass':
                if (category === 'ENTITY' && (tech || phys)) {
                    canPlace = true;
                    targetRealmSetter = setPlayerUnderpass;
                    placementArray = 'people';
                } else if (category === 'LOCATION' || category === 'LANDMARK') {
                    canPlace = true;
                    targetRealmSetter = setPlayerUnderpass;
                    placementArray = 'places';
                    updatedCard.online = true;
                } else if (category === 'SNIP' || category === 'SYM') {
                    canPlace = true;
                    targetRealmSetter = setPlayerUnderpass;
                    placementArray = 'things';
                    updatedCard.online = false;
                }
                break;
            case 'grid':
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
            case 'elysium':
                if (category === 'ENTITY' && (magi || tech || phys)) {
                    canPlace = true;
                    targetRealmSetter = setPlayerElysium;
                    placementArray = 'people';
                } else if (category === 'LOCATION' || category === 'LANDMARK') {
                    canPlace = true;
                    targetRealmSetter = setPlayerElysium;
                    placementArray = 'places';
                    updatedCard.online = true;
                } else if (category === 'SNIP' || category === 'SYM') {
                    canPlace = true;
                    targetRealmSetter = setPlayerElysium;
                    placementArray = 'things';
                    updatedCard.online = false;
                }
                break;
            default:
                console.log('Invalid realm selected:', realmName);
                return;
        }

        if (!canPlace || !targetRealmSetter || !placementArray) {
            console.log('Cannot place the card in this realm.');
            return;
        }

        // Add the card to the appropriate array in the realm
        targetRealmSetter(prevRealm => ({
            ...prevRealm,
            [placementArray]: [...(prevRealm[placementArray] || []), updatedCard]
        }));

        // Deduct resources
        if (selectedCard.card.rezCost) {
            setPlayerBits(prev => prev - selectedCard.card.rezCost);
        }
        if (selectedCard.card.ash) {
            setPlayerAshes(prev => prev - selectedCard.card.ash);
        }
        if (selectedCard.card.soul) {
            setPlayerSouls(prev => prev - selectedCard.card.soul);
        }

        // Handle post-placement effects
        removeCardFromHand(selectedCard);
        
        setSelectedCard(null);
        setDraftSelected(false);
        setTargetType('none');
        setCurrentPlayer('ENEMY');

        // Handle rezzing for certain card types
        if (category === 'LANDMARK' || category === 'LOCATION' || selectedCard.card.name === 'Dreamer') {
            console.log('rez place');
            handleRezPlayerCard(updatedCard);
        }
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
        // Add your realm card selection logic here
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
            />
        </div>
    );
}

import React, { useState, useEffect, useCallback } from 'react';
import { startTurn, playerGainBits, enemyLoseBits, playerDraw, enemyDraw } from './helpers/core';
import { eventManager } from './helpers/eventManager';
import { handleSacrificeConfirmation } from './helpers/sacrifice';
import { initializeSetters } from './helpers/state';
import { activateAbilities } from './abilities/glossary';
import { createLibrary, createEnemyLibrary } from './helpers/setup';
import Gameboard from './Gameboard';
import { Solarium, Theater, Underpass, Grid } from './renders/Board';

export function BoardContainer() {

    // Player state
    const [playerState, setPlayerState] = useState({
        library: [],
        hand: [],
        graveyard: [],
        actions: 3,
        bits: 0,
        ashes: 0,
        fate: 0,
        wounds: 0,
        burden: 0,
        overload: 0,
        surge: 0,
        lag: 0
    });

    // Enemy state
    const [enemyState, setEnemyState] = useState({
        library: [],
        hand: [],
        graveyard: [],
        actions: 3,
        bits: 0,
        ashes: 0,
        fate: 0,
        wounds: 0,
        burden: 0,
        overload: 0,
        surge: 0,
        lag: 0
    });

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
            setPlayerHand: (setter) => setPlayerState(prev => ({ ...prev, hand: setter(prev.hand) })),
            setPlayerLibrary: (setter) => setPlayerState(prev => ({ ...prev, library: setter(prev.library) })),
            setEnemyHand: (setter) => setEnemyState(prev => ({ ...prev, hand: setter(prev.hand) })),
            setEnemyLibrary: (setter) => setEnemyState(prev => ({ ...prev, library: setter(prev.library) })),
            setPlayerBits: (setter) => setPlayerState(prev => ({ ...prev, bits: typeof setter === 'function' ? setter(prev.bits) : setter })),
            setPlayerAshes: (setter) => setPlayerState(prev => ({ ...prev, ashes: typeof setter === 'function' ? setter(prev.ashes) : setter })),
            setPlayerBurden: (setter) => setPlayerState(prev => ({ ...prev, burden: typeof setter === 'function' ? setter(prev.burden) : setter })),
            setPlayerFate: (setter) => setPlayerState(prev => ({ ...prev, fate: typeof setter === 'function' ? setter(prev.fate) : setter })),
            setPlayerWounds: (setter) => setPlayerState(prev => ({ ...prev, wounds: typeof setter === 'function' ? setter(prev.wounds) : setter })),
            setPlayerOverload: (setter) => setPlayerState(prev => ({ ...prev, overload: typeof setter === 'function' ? setter(prev.overload) : setter })),
            setPlayerLag: (setter) => setPlayerState(prev => ({ ...prev, lag: typeof setter === 'function' ? setter(prev.lag) : setter })),
            setPlayerActions: (setter) => setPlayerState(prev => ({ ...prev, actions: typeof setter === 'function' ? setter(prev.actions) : setter })),
            setPlayerSurge: (setter) => setPlayerState(prev => ({ ...prev, surge: typeof setter === 'function' ? setter(prev.surge) : setter })),
            setEnemyBits: (setter) => setEnemyState(prev => ({ ...prev, bits: typeof setter === 'function' ? setter(prev.bits) : setter })),
            setEnemyAshes: (setter) => setEnemyState(prev => ({ ...prev, ashes: typeof setter === 'function' ? setter(prev.ashes) : setter })),
            setEnemyBurden: (setter) => setEnemyState(prev => ({ ...prev, burden: typeof setter === 'function' ? setter(prev.burden) : setter })),
            setEnemyFate: (setter) => setEnemyState(prev => ({ ...prev, fate: typeof setter === 'function' ? setter(prev.fate) : setter })),
            setEnemyWounds: (setter) => setEnemyState(prev => ({ ...prev, wounds: typeof setter === 'function' ? setter(prev.wounds) : setter })),
            setEnemyOverload: (setter) => setEnemyState(prev => ({ ...prev, overload: typeof setter === 'function' ? setter(prev.overload) : setter })),
            setEnemyLag: (setter) => setEnemyState(prev => ({ ...prev, lag: typeof setter === 'function' ? setter(prev.lag) : setter })),
            setEnemyActions: (setter) => setEnemyState(prev => ({ ...prev, actions: typeof setter === 'function' ? setter(prev.actions) : setter })),
            setEnemySurge: (setter) => setEnemyState(prev => ({ ...prev, surge: typeof setter === 'function' ? setter(prev.surge) : setter })),
            setPlayerBattleSlots: (setter) => setUiState(prev => ({ ...prev, playerBattleSlots: setter(prev.playerBattleSlots) })),
            setEnemyBattleSlots: (setter) => setUiState(prev => ({ ...prev, enemyBattleSlots: setter(prev.enemyBattleSlots) })),
            setTargetType: (setter) => setGameState(prev => ({ ...prev, targetType: setter(prev.targetType) })),
            setCurrentPlayer: (value) => setGameState(prev => ({ ...prev, currentPlayer: value })),
            setMode: (value) => setGameState(prev => ({ ...prev, mode: value })),
            setAwaitingFocus: (value) => setUiState(prev => ({ ...prev, awaitingFocus: value })),
            setFocus: (value) => setUiState(prev => ({ ...prev, focus: value })),
            setDraftSelected: (value) => setUiState(prev => ({ ...prev, draftSelected: value })),
        });

        // Create libraries
        console.log('Creating libraries...');
        const playerLibrary = createLibrary();
        const enemyLibrary = createEnemyLibrary();

        console.log('Setting up libraries and initial state...');
        // Initialize all state at once to avoid multiple re-renders
        setPlayerState(prev => ({
            ...prev,
            library: playerLibrary,
            hand: [],
        }));

        setEnemyState(prev => ({
            ...prev,
            library: enemyLibrary,
            hand: [],
        }));

        setGameState(prev => ({
            ...prev,
            mode: 'MULLIGAN',
            currentPlayer: 'PLAYER',
        }));

        // Draw opening hands after state is initialized
        console.log('Drawing initial hands...');
        setTimeout(() => {
            playerDraw(5);
            enemyDraw(5);
        }, 0);

        return () => {
            console.log('Cleaning up game initialization...');
        };
    }, []);

    // Set up UI state reset listener
    useEffect(() => {
        console.log('Setting up UI state reset listener...');
        const resetUIStateHandler = (data) => {
            setUiState(prev => ({
                ...prev,
                ...data
            }));
        };

        eventManager.subscribe('resetUIState', resetUIStateHandler);
        return () => eventManager.unsubscribe('resetUIState', resetUIStateHandler);
    }, []);

    // Start first turn after hands are drawn
    useEffect(() => {
        if (playerState.hand.length === 5 && enemyState.hand.length === 5 && gameState.attackMode) {
            startTurn(true);
        }
    }, [playerState.hand.length, enemyState.hand.length, gameState.attackMode]);

    // Handle burden effects
    useEffect(() => {
        if (playerState.burden >= 10) {
            setGameState(prev => ({ ...prev, mode: 'GAME_OVER' }));
        }
    }, [playerState.burden, setGameState]);

    // Handle player realm updates
    useEffect(() => {
        if (playerState.solarium) {
            setRealms(prev => ({
                ...prev,
                player: {
                    ...prev.player,
                    solarium: playerState.solarium
                }
            }));
        }
        if (playerState.theater) {
            setRealms(prev => ({
                ...prev,
                player: {
                    ...prev.player,
                    theater: playerState.theater
                }
            }));
        }
        if (playerState.underpass) {
            setRealms(prev => ({
                ...prev,
                player: {
                    ...prev.player,
                    underpass: playerState.underpass
                }
            }));
        }
        if (playerState.grid) {
            setRealms(prev => ({
                ...prev,
                player: {
                    ...prev.player,
                    grid: playerState.grid
                }
            }));
        }
        if (playerState.elysium) {
            setRealms(prev => ({
                ...prev,
                player: {
                    ...prev.player,
                    elysium: playerState.elysium
                }
            }));
        }
    }, [playerState]);

    // Focus effects
    useEffect(() => {
        if (uiState.focus) {
            setUiState(prev => ({
                ...prev,
                focus: false,
                awaitingFocus: false
            }));
        }
    }, [uiState.focus]);

    // Import button handlers from actions.js
    const { handleDrawButton, handleDraftButton, handleBoostButton, handleDevelopButton } = require('./helpers/actions');

    useEffect(() => {
        if (playerState.actions <= 0 &&
            enemyState.actions <= 0 &&
            gameState.mode === 'NORMAL' &&
            gameState.mode !== 'BEGIN' &&
            !gameState.attackMode
        ) {
            // Handle domination phase logic
            setGameState(prev => ({ ...prev, mode: 'DOMINATION' }));
        }
    }, [playerState.actions, enemyState.actions, gameState.mode, gameState.attackMode]);

    useEffect(() => {
        if (gameState.mode === 'ATTACK_RESOLVED') {
            if (gameState.currentPlayer === 'PLAYER') {
                if (enemyState.bits >= 1) {
                    enemyLoseBits(1);
                }
            } else {
                setGameState(prev => ({ ...prev, currentPlayer: 'ENEMY' }));
            }
            setGameState(prev => ({ ...prev, mode: 'NORMAL' }));
        }
    }, [gameState.mode, gameState.currentPlayer, enemyState.bits]);

    // Start the game or turn
    useEffect(() => {
        if (gameState.mode === 'BEGIN') {
            if (gameState.attackMode) {
                console.log('begin game');
                playerGainBits(1);
                playerDraw();
            }
        }
    }, [gameState.mode, gameState.priorityLeft, gameState.attackMode]);

    useEffect(() => {
        if (gameState.currentPlayer === 'ENEMY' && enemyState.actions > 0) {
            if (enemyState.bits >= 2) {
                setGameState(prev => ({ ...prev, currentPlayer: 'PLAYER' }));
            }
        }
    }, [gameState.currentPlayer, enemyState.bits, enemyState.actions]);

    useEffect(() => {
        if (gameState.awaitingSacrifices && gameState.rezCard) {
            const soulsAvailable = gameState.rezCard.card.souls || 0;
            if (soulsAvailable >= gameState.rezCard.card.soul) {
                setGameState(prev => ({ ...prev, awaitingSacrifices: false }));
            }
            
            // Update realm state based on card type
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

    // Define realm components for the board
    const realmComponents = [
        Solarium,
        Theater,
        Underpass,
        Grid
    ];

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

    return (
        <div className="board-container">
            <Gameboard 
                // Player state
                playerOneHand={playerState.hand}
                playerDraft={handleDraftButton}
                playerDraw={handleDrawButton}
                playerBoost={handleBoostButton}
                playerDevelop={handleDevelopButton}
                playerWounds={playerState.wounds}
                playerBits={playerState.bits}
                playerActions={playerState.actions}
                playerFate={playerState.fate}
                playerBurden={playerState.burden}
                playerAshes={playerState.ashes}
                playerSurge={playerState.surge}
                playerOverload={playerState.overload}
                
                // Enemy state
                enemyWounds={enemyState.wounds}
                enemyBits={enemyState.bits}
                enemyActions={enemyState.actions}
                enemyFate={enemyState.fate}
                enemyBurden={enemyState.burden}
                enemyAshes={enemyState.ashes}
                enemySurge={enemyState.surge}
                enemyOverload={enemyState.overload}
                enemyHand={enemyState.hand}
                
                // Realm state
                realmComponents={realmComponents}
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

export default BoardContainer;
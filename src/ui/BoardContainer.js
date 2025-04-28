import React, { useState, useEffect, useCallback } from 'react';
import { playerGainBits, 
    startTurn,
    enemyLoseBits
} from './helpers/core';
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
        overload: 0
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
        surge: 0
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
        currentPlayer: 'PLAYER'
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
    const [, setInterfaceState] = useState({
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

    // Draw functions
    const playerDraw = useCallback((num) => {
        console.log('draw ', num);
        let remainingCards = num;

        if (playerState.wounds > 0) {
            const newWounds = playerState.wounds - num;
            remainingCards = Math.max(0, -newWounds);
            setPlayerState(prev => ({ ...prev, wounds: Math.max(0, newWounds) }));
        }

        if (remainingCards > 0) {
            setPlayerState(prev => {
                const newHandCards = prev.library.slice(0, remainingCards);
                const newLibrary = prev.library.slice(remainingCards);
                return {
                    ...prev,
                    library: newLibrary,
                    hand: [...prev.hand, ...newHandCards]
                };
            });
        }
    }, [playerState.wounds]);

    const enemyDraw = useCallback((num) => {
        console.log('enemy draw ', num);
        let remainingCards = num;

        if (enemyState.wounds > 0) {
            const newWounds = enemyState.wounds - num;
            remainingCards = Math.max(0, -newWounds);
            setEnemyState(prev => ({ ...prev, wounds: Math.max(0, newWounds) }));
        }

        if (remainingCards > 0) {
            setEnemyState(prev => {
                const newHandCards = prev.library.slice(0, remainingCards);
                const newLibrary = prev.library.slice(remainingCards);
                return {
                    ...prev,
                    library: newLibrary,
                    hand: [...prev.hand, ...newHandCards]
                };
            });
        }
    }, [enemyState.wounds]);

    // Listen for UI state reset events
    useEffect(() => {
        const resetUIStateHandler = (data) => {
            setUiState(prev => ({
                ...prev,
                ...data
            }));
        };

        eventManager.subscribe('resetUIState', resetUIStateHandler);
        return () => eventManager.unsubscribe('resetUIState', resetUIStateHandler);
    }, []);

    // Initialize global setters
    useEffect(() => {
        const initGame = () => {
            initializeSetters({
                setPlayerState,
                setEnemyState,
                setRealms,
                setGameState,
                setInterfaceState,
                playerDraw,
                enemyDraw,
                setAwaitingFocus: (value) => setUiState(prev => ({ ...prev, awaitingFocus: value })),
                setFocus: (value) => setUiState(prev => ({ ...prev, focus: value })),
                setDraftSelected: (value) => setUiState(prev => ({ ...prev, draftSelected: value })),
                setUiState
            });

            // Initialize game
            const playerLibrary = createLibrary();
            const enemyLibrary = createEnemyLibrary();
            setPlayerState(prev => ({ ...prev, library: playerLibrary }));
            setEnemyState(prev => ({ ...prev, library: enemyLibrary }));
            playerDraw(5); // Draw initial hand
            enemyDraw(5);
        };

        initGame();
    }, [setPlayerState, setEnemyState, setRealms, setGameState, setUiState, setInterfaceState, playerDraw, enemyDraw]);

    // Start first turn after initialization
    useEffect(() => {
        if (playerState.library.length > 0 && enemyState.library.length > 0) {
            startTurn(true);
        }
    }, [playerState.library, enemyState.library]);

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

    function handleDrawButton() {
        if (playerState.bits >= 1) {
            setPlayerState(prev => ({ ...prev, bits: prev.bits - 1 }));
        }
        setGameState(prev => ({ ...prev, currentPlayer: 'ENEMY' }));
    }

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
                console.log('begin game')
                playerGainBits(1);
                playerDraw();
                enemyDraw(3);
                setGameState(prev => ({ ...prev, mode: 'NONE' }));
                startTurn(gameState.priorityLeft);
            }
        }
    }, [gameState.mode, gameState.attackMode, gameState.priorityLeft, playerDraw, enemyDraw, setGameState]);

    useEffect(() => {
        if (gameState.mode === 'MULLIGAN') {
            if (gameState.priorityLeft) {
                // Handle mulligan phase
            }
        }
    }, [gameState.mode, gameState.priorityLeft]);

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
                playerDraft={handleDrawButton}
                playerDraw={handleDrawButton}
                playerBoost={() => {}}
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
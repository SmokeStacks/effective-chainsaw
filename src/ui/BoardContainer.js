import React, { useState, useEffect, useCallback } from 'react';
import { playerGainBits, playerDraw, enemyDraw, startTurn, activateAbilities } from './helpers/core';
import { enemyLoseBits } from './helpers/enemy';
import { handleSacrificeConfirmation } from './helpers/sacrifice';
import { initializeSetters } from './helpers/state';

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
        playerBattleSlots: Array(6).fill(null),
        enemyBattleSlots: Array(6).fill(null),
        selectedCard: null,
        battleSelectedCard: null,
        selectedInHand: false,
        focus: false,
        awaitingFocus: false
    });

    // Interface access state
    const [interfaceState, setInterfaceState] = useState({
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

    // Initialize global setters
    useEffect(() => {
        initializeSetters({
            setPlayerState,
            setEnemyState,
            setRealms,
            setGameState,
            setUiState,
            setInterfaceState
        });
    }, []);

    // Handle burden effects
    useEffect(() => {
        if (playerState.burden >= 10) {
            setGameState(prev => ({ ...prev, mode: 'GAME_OVER' }));
        }
    }, [playerState.burden]);

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
    }, [gameState.mode, gameState.attackMode, gameState.priorityLeft]);

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

    return (
        <div className="board-container">
            <div className="player-stats">
                <div>Library: {playerState.library.length}</div>
                <div>Hand: {playerState.hand.length}</div>
                <div>Graveyard: {playerState.graveyard.length}</div>
                <div>Actions: {playerState.actions}</div>
                <div>Fate: {playerState.fate}</div>
                <div>Wounds: {playerState.wounds}</div>
                <div>Bits: {playerState.bits}</div>
                <div>Overload: {playerState.overload}</div>
                <div>Burden: {playerState.burden}</div>
                <div>Ashes: {playerState.ashes}</div>
            </div>

            <div className="enemy-stats">
                <div>Actions: {enemyState.actions}</div>
                <div>Fate: {enemyState.fate}</div>
                <div>Wounds: {enemyState.wounds}</div>
                <div>Bits: {enemyState.bits}</div>
                <div>Overload: {enemyState.overload}</div>
                <div>Burden: {enemyState.burden}</div>
                <div>Ashes: {enemyState.ashes}</div>
                <div>Surge: {enemyState.surge}</div>
            </div>

            <div className="player-realms">
                <div>Solarium: {realms.player.solarium ? realms.player.solarium.length : 0}</div>
                <div>Theater: {realms.player.theater ? realms.player.theater.length : 0}</div>
                <div>Underpass: {realms.player.underpass ? realms.player.underpass.length : 0}</div>
                <div>Grid: {realms.player.grid ? realms.player.grid.length : 0}</div>
                <div>Elysium: {realms.player.elysium ? realms.player.elysium.length : 0}</div>
            </div>

            <div className="enemy-realms">
                <div>Hand: {enemyState.hand ? enemyState.hand.length : 0}</div>
                <div>Solarium: {realms.enemy.solarium ? realms.enemy.solarium.length : 0}</div>
                <div>Theater: {realms.enemy.theater ? realms.enemy.theater.length : 0}</div>
                <div>Underpass: {realms.enemy.underpass ? realms.enemy.underpass.length : 0}</div>
                <div>Grid: {realms.enemy.grid ? realms.enemy.grid.length : 0}</div>
                <div>Elysium: {realms.enemy.elysium ? realms.enemy.elysium.length : 0}</div>
            </div>

            <div className="interface-status">
                <div>Player HeadSpace: {interfaceState.player.headSpace ? 'Yes' : 'No'}</div>
                <div>Player Pandora: {interfaceState.player.pandora ? 'Yes' : 'No'}</div>
                <div>Enemy HeadSpace: {interfaceState.enemy.headSpace ? 'Yes' : 'No'}</div>
                <div>Enemy Pandora: {interfaceState.enemy.pandora ? 'Yes' : 'No'}</div>
            </div>

            <div className="selected-info">
                <div>Selected Card: {uiState.selectedCard ? uiState.selectedCard.name : 'None'}</div>
                <div>Selected in Hand: {uiState.selectedInHand ? 'Yes' : 'No'}</div>
            </div>

            <button onClick={handleDrawButton}>Draw</button>

            <div className="game-actions">
                <button onClick={handleRezPlayerCard}>Rez Card</button>
                <button onClick={handleSacrificeConfirmation}>Confirm Sacrifice</button>
            </div>

            {uiState.modalVisible && (
                <div className="modal">
                    {/* Modal content */}
                </div>
            )}
        </div>
    );
}

export default BoardContainer;
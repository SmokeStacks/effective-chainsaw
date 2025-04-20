import { createContext } from 'react';
import { gameLogic } from '../logic/gameLogic';

// Action Types
export const ACTIONS = {
    START_GAME: 'START_GAME',
    DRAW_CARD: 'DRAW_CARD',
    PLAY_CARD: 'PLAY_CARD',
    ATTACK: 'ATTACK',
    END_TURN: 'END_TURN',
    UPDATE_RESOURCES: 'UPDATE_RESOURCES',
    UPDATE_ENTITY: 'UPDATE_ENTITY',
    RESOLVE_ABILITY: 'RESOLVE_ABILITY',
    DRAFT: 'DRAFT',
    RAID: 'RAID',
    QUEST: 'QUEST',
    HACK: 'HACK',
    DOMINATE: 'DOMINATE',
    BOOST: 'BOOST',
    SCORE: 'SCORE',
};

// Initial game state
export const initialState = {
    playerState: {
        library: [],
        hand: [],
        bits: 0,
        fate: 0,
        wounds: 0,
        overload: 0,
        burden: 0,
        ashes: 0,
        surge: 0,
        actions: 3,
        realms: {
            solarium: { cards: [] },
            theater: { cards: [] },
            underpass: { cards: [] },
            grid: { cards: [] },
            elysium: { cards: [] }
        }
    },
    enemyState: {
        library: [],
        hand: [],
        bits: 0,
        fate: 0,
        wounds: 0,
        overload: 0,
        burden: 0,
        ashes: 0,
        surge: 0,
        actions: 3,
        realms: {
            solarium: { cards: [] },
            theater: { cards: [] },
            underpass: { cards: [] },
            grid: { cards: [] },
            elysium: { cards: [] }
        }
    },
    gamePhase: 'SETUP', // SETUP, MAIN, COMBAT, END
    currentTurn: 'PLAYER',
    battleState: {
        attackingRealm: null,
        defendingRealm: null,
        attackers: [],
        defenders: [],
        resolved: false
    }
};

// Game state reducer
export function gameReducer(state, action) {
    switch (action.type) {
        case ACTIONS.START_GAME:
            return {
                ...state,
                playerState: {
                    ...state.playerState,
                    library: action.payload.playerDeck,
                    hand: action.payload.playerDeck.slice(0, 5)
                },
                enemyState: {
                    ...state.enemyState,
                    library: action.payload.enemyDeck,
                    hand: action.payload.enemyDeck.slice(0, 5)
                },
                gamePhase: 'MAIN'
            };

        case ACTIONS.QUEST:
        case ACTIONS.HACK:
        case ACTIONS.DOMINATE: {
            const { card, realm, target } = action.payload;
            const targetState = action.payload.player ? 'playerState' : 'enemyState';
            const currentRealm = state[targetState].realms[realm];
            
            // Check if we can take this action
            if (state[targetState].actions < 1) return state;
            
            // Trigger the appropriate ability
            const result = gameLogic.resolveAbility(
                { name: action.type, target },
                card,
                currentRealm,
                state
            );
            
            if (!result) return state;
            
            return {
                ...state,
                [targetState]: {
                    ...state[targetState],
                    actions: state[targetState].actions - 1,
                    realms: {
                        ...state[targetState].realms,
                        [realm]: {
                            ...currentRealm,
                            cards: currentRealm.cards.map(c => 
                                c.id === card.id ? { ...c, ...result.effects } : c
                            )
                        }
                    }
                }
            };
        }

        case ACTIONS.BOOST:
        case ACTIONS.SCORE: {
            const { card, realm } = action.payload;
            const targetState = action.payload.player ? 'playerState' : 'enemyState';
            const currentRealm = state[targetState].realms[realm];
            
            // Check if we can take this action
            if (state[targetState].actions < 1) return state;
            
            // Apply the effect
            const result = gameLogic.resolveAbility(
                { name: action.type },
                card,
                currentRealm,
                state
            );
            
            if (!result) return state;
            
            return {
                ...state,
                [targetState]: {
                    ...state[targetState],
                    actions: state[targetState].actions - 1,
                    [result.resource]: state[targetState][result.resource] + result.amount
                }
            };
        }

        case ACTIONS.DRAFT:
        case ACTIONS.RAID: {
            const targetState = action.payload.player ? 'playerState' : 'enemyState';
            const currentHand = state[targetState].hand;
            const currentLibrary = state[targetState].library;
            const drawCount = action.type === ACTIONS.RAID ? 2 : 1;
            const actionCost = action.type === ACTIONS.RAID ? 2 : 1;
            
            if (currentLibrary.length === 0 || state[targetState].actions < actionCost) return state;
            
            return {
                ...state,
                [targetState]: {
                    ...state[targetState],
                    hand: [...currentHand, ...currentLibrary.slice(0, drawCount)],
                    library: currentLibrary.slice(drawCount),
                    actions: state[targetState].actions - actionCost
                }
            };
        }

        case ACTIONS.DRAW_CARD: {
            const targetState = action.payload.player ? 'playerState' : 'enemyState';
            const currentHand = state[targetState].hand;
            const currentLibrary = state[targetState].library;
            
            if (currentLibrary.length === 0) return state;
            
            return {
                ...state,
                [targetState]: {
                    ...state[targetState],
                    hand: [...currentHand, currentLibrary[0]],
                    library: currentLibrary.slice(1)
                }
            };
        }

        case ACTIONS.UPDATE_RESOURCES: {
            const targetState = action.payload.player ? 'playerState' : 'enemyState';
            return {
                ...state,
                [targetState]: {
                    ...state[targetState],
                    ...action.payload.resources
                }
            };
        }

        case ACTIONS.UPDATE_ENTITY: {
            const { realmName, cardId, updates, player } = action.payload;
            const targetState = player ? 'playerState' : 'enemyState';
            
            return {
                ...state,
                [targetState]: {
                    ...state[targetState],
                    realms: {
                        ...state[targetState].realms,
                        [realmName]: {
                            ...state[targetState].realms[realmName],
                            cards: state[targetState].realms[realmName].cards.map(card =>
                                card.id === cardId ? { ...card, ...updates } : card
                            )
                        }
                    }
                }
            };
        }

        case ACTIONS.END_TURN:
            return {
                ...state,
                currentTurn: state.currentTurn === 'PLAYER' ? 'ENEMY' : 'PLAYER',
                [state.currentTurn === 'PLAYER' ? 'playerState' : 'enemyState']: {
                    ...state[state.currentTurn === 'PLAYER' ? 'playerState' : 'enemyState'],
                    actions: 3
                }
            };

        default:
            return state;
    }
}

// Create context for global state access
export const GameStateContext = createContext();

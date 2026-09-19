import { state, stateSetters } from './state';
import { sleep } from './utils';
// components/Modal's showModal writes to module-local variables that nothing
// subscribes to, so none of the Interface prompts below ever rendered and the
// callbacks they gate never fired. helpers/modal is the one wired through
// gameState to the rendered <Modal>.
import { showModal } from './modal';
import { CardDisplay } from '../components/CardDisplay';
import { eventManager } from './eventManager';
import { playerLoseBits, enemyLoseBits } from './game';

const getRealmAndSetter = (location, side) => {
    if (side === 'ENEMY') {
        switch (location) {
            case 'Underpass':
                return [location, stateSetters.setPlayerUnderpass];
            case 'Grid':
                return [location, stateSetters.setPlayerGrid];
            case 'Theater':
                return [location, stateSetters.setPlayerTheater];
            case 'Solarium':
                return [location, stateSetters.setPlayerSolarium];
            default:
                return [null, null];
        }
    } else {
        switch (location) {
            case 'Underpass':
                return [location, stateSetters.setEnemyUnderpass];
            case 'Grid':
                return [location, stateSetters.setEnemyGrid];
            case 'Theater':
                return [location, stateSetters.setEnemyTheater];
            case 'Solarium':
                return [location, stateSetters.setEnemySolarium];
            default:
                return [null, null];
        }
    }
};

export function handleAccessPhase(side) {
    let accessTarget;
    let acessTargetType;
    let numAccesses = 1; // Base access count
    let library;
    let hand;

    // Realms/hands/libraries and the access-count auras are read live from
    // state here (not destructured at module load) so this reflects auras
    // and one-shot access bonuses granted after the module first loaded.
    if (side === 'PLAYER') {
        library = state.enemyLibrary;
        hand = state.enemyHand;
        accessTarget = state.playerTargetSelection;
        acessTargetType = state.targetType;
        if (state.targetType === 'PANDORA') {
            numAccesses = (state.playerPandoraAccess ?? 1) + (state.playerAccessBonus || 0);
            stateSetters.setPlayerAccessBonus && stateSetters.setPlayerAccessBonus(0);
        } else if (state.targetType === 'HEADSPACE') {
            numAccesses = (state.playerHeadSpaceAccess ?? 1) + (state.playerAccessBonus || 0);
            stateSetters.setPlayerAccessBonus && stateSetters.setPlayerAccessBonus(0);
        }
    } else {
        library = state.playerLibrary;
        hand = state.playerHand;
        accessTarget = state.enemyTargetSelection;
        acessTargetType = state.enemyTargetType;
        if (state.enemyTargetType === 'PANDORA') {
            numAccesses = (state.enemyPandoraAccess ?? 1) + (state.enemyAccessBonus || 0);
            stateSetters.setEnemyAccessBonus && stateSetters.setEnemyAccessBonus(0);
        } else if (state.enemyTargetType === 'HEADSPACE') {
            numAccesses = (state.enemyHeadSpaceAccess ?? 1) + (state.enemyAccessBonus || 0);
            stateSetters.setEnemyAccessBonus && stateSetters.setEnemyAccessBonus(0);
        }
    }

    console.log('access phase', accessTarget);
    console.log('access type', acessTargetType);

    const accessCards = [];
    if (acessTargetType === 'PANDORA') {
        accessCards.push(...library.slice(0, numAccesses));
        if (side === 'PLAYER') {
            stateSetters.setEnemyInterfacedPandora(true);
        } else {
            stateSetters.setPlayerInterfacedPandora(true);
        }
    } else if (acessTargetType === 'HEADSPACE') {
        if (side === 'PLAYER') {
            stateSetters.setEnemyInterfacedHeadSpace(true);
        } else {
            stateSetters.setPlayerInterfacedHeadSpace(true);
        }
        for (let i = 0; i < numAccesses; i++) {
            if (hand.length > 0) {
                let chosenIndex = Math.floor(Math.random() * hand.length);
                accessCards.push(hand[chosenIndex]);
            }
        }
    } else if (acessTargetType === 'SYM' || acessTargetType === 'SNIP') {
        accessCards.push(accessTarget);
    }

    // 'side' is the side performing the Interface (Access) action
    eventManager.publish('interface', {
        side,
        targetType: acessTargetType,
        battleRealm: state.battleRealm,
        count: accessCards.length
    });

    processAccessQueue(accessCards, state.battleRealm, side);
}

export function processAccessQueue(accessCards, battleRealm, side) {
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

export async function presentAccessedCard(card, battleRealm, side, callback) {
    let location;
    let currentTargetType;
    if (side === 'PLAYER') {
        currentTargetType = state.targetType;
    } else {
        currentTargetType = state.enemyTargetType;
    }

    if (currentTargetType === 'PANDORA' || currentTargetType === 'HEADSPACE') {
        location = currentTargetType;
    } else {
        location = battleRealm;
    }
    await sleep(100);
    showModal({
        title: `Accessed: ${card.card.name}`,
        message: side === 'PLAYER'
            ? `You have accessed ${card.card.name}.`
            : `The enemy has accessed ${card.card.name}.`,
        renderContent: () => (
            <div>
                <CardDisplay entity={card} revealed={true} />
            </div>
        ),
        onConfirm: () => {
            if (card.card.category === 'SYM' || card.card.category === 'LANDMARK') {
                handleStolenCard(card, location, side, false, () => {
                    callback();
                });
            } else if (card.card.category === 'SNIP') {
                eventManager.publish('snipAccessed', { card, side });
                if (side === 'PLAYER') {
                    promptPlayerToTrashCard(card, location, side, () => {
                        callback();
                    });
                } else {
                    handleEnemyTrashCard(card, location, side, () => {
                        callback();
                    });
                }
            } else {
                console.log('_________________handle exposed')
                // For exposed card or any other category (like a normal ENTITY)
                handleExposedCard(card, location, side, () => {
                    callback();
                });
            }
        },
        onCancel: () => {
            callback();
        },
    });
}

export const handleStolenCard = (card, location, side, scrap, callback) => {
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

    // Get the realm setter based on location and side
    const [, realmSetter] = getRealmAndSetter(location, side === 'PLAYER' ? 'ENEMY' : 'PLAYER');

    if (realmSetter) {
        // Remove the card from the appropriate array in the realm
        realmSetter(prevRealm => ({
            ...prevRealm,
            [arrayName]: prevRealm[arrayName].filter(item => item.id !== card.id),
        }));
    } else if (location === 'HEADSPACE') {
        // Handle cards in the player's or enemy's hand
        if (side === 'PLAYER') {
            stateSetters.setEnemyHand(prevHand => prevHand.filter(item => item.id !== card.id));
        } else {
            stateSetters.setPlayerHand(prevHand => prevHand.filter(item => item.id !== card.id));
        }
    } else if (location === 'PANDORA') {
        // Handle cards in the player's or enemy's library
        if (side === 'PLAYER') {
            stateSetters.setEnemyLibrary(prevLibrary => prevLibrary.filter(item => item.id !== card.id));
        } else {
            stateSetters.setPlayerLibrary(prevLibrary => prevLibrary.filter(item => item.id !== card.id));
        }
    }

    // Prepare to add the card to the appropriate graveyard
    const cardToRemove = card;
    const runes = card.card.runes || 0;

    // Add the card to the graveyard and adjust Fate
    if (side === 'PLAYER') {
        stateSetters.setEnemyGraveyard(prev => [...prev, cardToRemove]);
        if (!scrap) {
            stateSetters.setPlayerFate && stateSetters.setPlayerFate(prev => prev + runes);
        }
    } else {
        stateSetters.setPlayerGraveyard(prev => [...prev, cardToRemove]);
        if (!scrap) {
            stateSetters.setEnemyFate && stateSetters.setEnemyFate(prev => prev + runes);
        }
    }

    callback();
};

export async function promptPlayerToTrashCard(card, location, side, callback) {
    await sleep(100);
    showModal({
        title: `Delete ${card.card.name}?`,
        message: `You may pay ${card.card.scrap} to trash this card.`,
        renderContent: () => (
            <div>
                <CardDisplay entity={card} revealed={true} />
            </div>
        ),
        onConfirm: () => {
            if (state.playerBits >= card.card.scrap) {
                playerLoseBits(card.card.scrap);
                handleStolenCard(card, location, side, true, () => {
                    callback();
                });
            } else {
                callback();
            }
        },
        onCancel: () => {
            callback();
        },
    });
}

export async function handleEnemyTrashCard(card, location, side, callback) {
    await sleep(100);
    showModal({
        title: `Enemy Action`,
        message: `The enemy may pay ${card.card.scrap} to trash ${card.card.name}.`,
        renderContent: () => (
            <div>
                <CardDisplay entity={card} revealed={true} />
            </div>
        ),
        onConfirm: () => {
            if (state.enemyBits >= card.card.scrap) {
                enemyLoseBits(card.card.scrap);
                handleStolenCard(card, location, side, true, () => {
                    callback();
                });
            } else {
                callback();
            }
        },
        onCancel: () => {
            callback();
        },
    });
}

export async function handleExposedCard(card, location, side, callback) {
    console.log('_________________Expose invoked');
    await sleep(100);
    showModal({
        title: `Exposed Card: ${card.card.name}`,
        message: `You have exposed ${card.card.name}.`,
        renderContent: () => (
            <div>
                <CardDisplay entity={card} revealed={true} />
            </div>
        ),
        onConfirm: () => {
            // No Overload is applied here. notes.txt: "Every successful Hack
            // inflicts 2 Overload (regardless of damage dealt)" -- once, in
            // resolveSuccessfulHack, which is what invokes this whole Interface
            // flow. Granting it again here would make Exposing a card cost the
            // victim 4 while stealing a Sym cost them 2.
            if (!card.exposed) {
                card.exposed = true;

                if (location === 'HEADSPACE') {
                    if (side === 'PLAYER') {
                        stateSetters.setEnemyHand(prevHand => prevHand.map(c => (c.id === card.id ? card : c)));
                    } else {
                        stateSetters.setPlayerHand(prevHand => prevHand.map(c => (c.id === card.id ? card : c)));
                    }
                } else if (location === 'PANDORA') {
                    if (side === 'PLAYER') {
                        stateSetters.setEnemyLibrary(prevLibrary => prevLibrary.map(c => (c.id === card.id ? card : c)));
                    } else {
                        stateSetters.setPlayerLibrary(prevLibrary => prevLibrary.map(c => (c.id === card.id ? card : c)));
                    }
                }
            } else {
                // Already Exposed: it is discarded (notes.txt line 230).
                if (location === 'HEADSPACE') {
                    if (side === 'PLAYER') {
                        stateSetters.setEnemyHand(prevHand => prevHand.filter(c => c.id !== card.id));
                        stateSetters.setEnemyGraveyard(prev => [...prev, card]);
                    } else {
                        stateSetters.setPlayerHand(prevHand => prevHand.filter(c => c.id !== card.id));
                        stateSetters.setPlayerGraveyard(prev => [...prev, card]);
                    }
                } else if (location === 'PANDORA') {
                    if (side === 'PLAYER') {
                        stateSetters.setEnemyLibrary(prevLibrary => prevLibrary.filter(c => c.id !== card.id));
                        stateSetters.setEnemyGraveyard(prev => [...prev, card]);
                    } else {
                        stateSetters.setPlayerLibrary(prevLibrary => prevLibrary.filter(c => c.id !== card.id));
                        stateSetters.setPlayerGraveyard(prev => [...prev, card]);
                    }
                }
            }
            callback();
        },
        onCancel: () => {
            // Even if cancel is clicked, just proceed
            callback();
        },
    });
}
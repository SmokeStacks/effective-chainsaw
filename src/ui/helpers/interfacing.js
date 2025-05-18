import { state } from './state';
import { sleep } from './utils';
import { showModal } from '../components/Modal';
import { CardDisplay } from '../components/CardDisplay';
import { eventManager } from './eventManager';
import { stateSetters } from './state';

const {
    enemyLibrary, enemyHand, playerLibrary, playerHand,
    playerTargetSelection, enemyTargetSelection,
    targetType, enemyTargetType,
    playerPandoraAccess, playerHeadSpaceAccess,
    enemyPandoraAccess, enemyHeadSpaceAccess,
    setEnemyHand, setPlayerHand,
    setEnemyLibrary, setPlayerLibrary,
    setEnemyGraveyard, setPlayerGraveyard,
    enemyBits, enemyLoseBits, playerBits, playerLoseBits,
    playerGainOverload, enemyGainOverload,
    playerGainFate, enemyGainFate,
    setPlayerUnderpass, setPlayerGrid, setPlayerTheater, setPlayerSolarium,
    setEnemyUnderpass, setEnemyGrid, setEnemyTheater, setEnemySolarium,
    setPlayerInterfacedHeadSpace, setEnemyInterfacedHeadSpace,
    setPlayerInterfacedPandora, setEnemyInterfacedPandora,
    battleRealm
} = state;

const getRealmAndSetter = (location, side) => {
    if (side === 'ENEMY') {
        switch (location) {
            case 'Underpass':
                return [location, setPlayerUnderpass];
            case 'Grid':
                return [location, setPlayerGrid];
            case 'Theater':
                return [location, setPlayerTheater];
            case 'Solarium':
                return [location, setPlayerSolarium];
            default:
                return [null, null];
        }
    } else {
        switch (location) {
            case 'Underpass':
                return [location, setEnemyUnderpass];
            case 'Grid':
                return [location, setEnemyGrid];
            case 'Theater':
                return [location, setEnemyTheater];
            case 'Solarium':
                return [location, setEnemySolarium];
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

    console.log('access phase', accessTarget);
    console.log('access type', acessTargetType);

    const accessCards = [];
    if (acessTargetType === 'PANDORA') {
        accessCards.push(...library.slice(0, numAccesses));
        if (side === 'PLAYER') {
            setEnemyInterfacedPandora(true);
        } else {
            setPlayerInterfacedPandora(true);
        }
    } else if (acessTargetType === 'HEADSPACE') {
        if (side === 'PLAYER') {
            setEnemyInterfacedHeadSpace(true);
        } else {
            setPlayerInterfacedHeadSpace(true);
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
    processAccessQueue(accessCards, battleRealm, side);
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
        currentTargetType = targetType;
    } else {
        currentTargetType = enemyTargetType;
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
            setEnemyHand(prevHand => prevHand.filter(item => item.id !== card.id));
        } else {
            stateSetters.setPlayerHand(prevHand => prevHand.filter(item => item.id !== card.id));
        }
    } else if (location === 'PANDORA') {
        // Handle cards in the player's or enemy's library
        if (side === 'PLAYER') {
            setEnemyLibrary(prevLibrary => prevLibrary.filter(item => item.id !== card.id));
        } else {
            setPlayerLibrary(prevLibrary => prevLibrary.filter(item => item.id !== card.id));
        }
    }

    // Prepare to add the card to the appropriate graveyard
    const cardToRemove = card;
    const runes = card.card.runes || 0;

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
            if (playerBits >= card.card.trashCost) {
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
        message: `The enemy may pay ${card.card.trashCost} to trash ${card.card.name}.`,
        renderContent: () => (
            <div>
                <CardDisplay entity={card} revealed={true} />
            </div>
        ),
        onConfirm: () => {
            if (enemyBits >= card.card.trashCost) {
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
            // Proceed with original exposed logic after confirm
            if (!card.exposed) {
                card.exposed = true;
                if (side === 'ENEMY') {
                    playerGainOverload(2);
                } else {
                    enemyGainOverload(2);
                }

                if (location === 'HEADSPACE') {
                    if (side === 'PLAYER') {
                        setEnemyHand(prevHand => prevHand.map(c => (c.id === card.id ? card : c)));
                    } else {
                        stateSetters.setPlayerHand(prevHand => prevHand.map(c => (c.id === card.id ? card : c)));
                    }
                } else if (location === 'PANDORA') {
                    if (side === 'PLAYER') {
                        setEnemyLibrary(prevLibrary => prevLibrary.map(c => (c.id === card.id ? card : c)));
                    } else {
                        setPlayerLibrary(prevLibrary => prevLibrary.map(c => (c.id === card.id ? card : c)));
                    }
                }
            } else {
                if (side === 'ENEMY') {
                    playerGainOverload(2);
                } else {
                    enemyGainOverload(2);
                }

                if (location === 'HEADSPACE') {
                    if (side === 'PLAYER') {
                        setEnemyHand(prevHand => prevHand.filter(c => c.id !== card.id));
                        setEnemyGraveyard(prev => [...prev, card]);
                    } else {
                        stateSetters.setPlayerHand(prevHand => prevHand.filter(c => c.id !== card.id));
                        setPlayerGraveyard(prev => [...prev, card]);
                    }
                } else if (location === 'PANDORA') {
                    if (side === 'PLAYER') {
                        setEnemyLibrary(prevLibrary => prevLibrary.filter(c => c.id !== card.id));
                        setEnemyGraveyard(prev => [...prev, card]);
                    } else {
                        setPlayerLibrary(prevLibrary => prevLibrary.filter(c => c.id !== card.id));
                        setPlayerGraveyard(prev => [...prev, card]);
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
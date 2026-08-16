import { state } from './state';
import { eventManager } from './eventManager';

/**
 * Resolves a card's effective rez cost, applying any cost-modifying keywords.
 *
 * Rapture: while any entity has died this turn, a card carrying the keyword
 * costs 1 less to rez. Cards express their non-Bits cost as either Ash or Soul,
 * so the reduction applies to whichever one the card actually uses. This holds
 * for cards still in hand, so it is keyed off the card rather than a board
 * entity.
 *
 * @param {Object} card - The raw card definition
 * @returns {{bits: number, ash: number, soul: number}} effective cost
 */
export const rezCostFor = (card) => {
    const cost = {
        bits: card.rezCost || 0,
        ash: card.ash || 0,
        soul: card.soul || 0,
    };

    const hasRapture = card.rapture > 0 ||
        (card.abilities || []).some(a => a && a.name === 'Rapture');

    if (hasRapture && state.entityDiedThisTurn) {
        if (cost.ash > 0) {
            cost.ash -= 1;
        } else if (cost.soul > 0) {
            cost.soul -= 1;
        }
    }

    return cost;
};

/**
 * Handles the rezzing (activation) of a player card
 * @param {Object} entity - The card entity to be rezzed
 * @returns {void}
 */
export const handleRezPlayerCard = (entity) => {
    const {
        playerBits,
        playerAshes,
        setRezCard,
        setAwaitingSacrifices
    } = state;

    const soulsAvailable = calculateSoulsAvailable(entity.id);
    
    // Check if card is already online (except for LANDMARK and LOCATION)
    const isOnlineNonLandmark = entity.online && 
        entity.card.category !== 'LANDMARK' && 
        entity.card.category !== 'LOCATION';

    if (isOnlineNonLandmark) {
        eventManager.publish('cardActivationFailed', { reason: 'Card is already online' });
        return;
    }

    // Check if player has enough resources
    const cost = rezCostFor(entity.card);
    const hasEnoughResources = 
        playerBits >= cost.bits && 
        playerAshes >= cost.ash && 
        soulsAvailable >= cost.soul;

    if (!hasEnoughResources) {
        eventManager.publish('cardActivationFailed', { 
            reason: 'Insufficient resources',
            required: {
                bits: cost.bits,
                ash: cost.ash,
                souls: cost.soul
            },
            available: {
                bits: playerBits,
                ash: playerAshes,
                souls: soulsAvailable
            }
        });
        return;
    }

    // Start the rez process
    setRezCard(entity);
    setAwaitingSacrifices(true);

    // If no soul cost, we don't need to wait for sacrifices
    if (cost.soul === 0) {
        setAwaitingSacrifices(false);
    }

    eventManager.publish('cardActivationStarted', { entity });
};

/**
 * Calculates the number of souls available for sacrificing
 * @param {string} id - ID of the card being rezzed (to exclude from count)
 * @returns {number} - Number of available souls
 */
export const calculateSoulsAvailable = (id) => {
    const { 
        playerSolarium,
        playerTheater,
        playerUnderpass,
        playerGrid 
    } = state;

    const playerRealmsState = {
        Solarium: playerSolarium,
        Theater: playerTheater,
        Underpass: playerUnderpass,
        Grid: playerGrid,
    };

    return Object.values(playerRealmsState).reduce((sum, realm) => {
        if (realm.people) {
            // Filter out the card being rezzed, then count the remaining cards
            return sum + realm.people.filter(card => card.id !== id).length;
        }
        return sum;
    }, 0);
};
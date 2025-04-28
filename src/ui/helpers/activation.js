import { gameState } from './state';
import { eventManager } from './eventManager';

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
    } = gameState;

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
    const hasEnoughResources = 
        playerBits >= entity.card.rezCost && 
        playerAshes >= entity.card.ash && 
        soulsAvailable >= entity.card.soul;

    if (!hasEnoughResources) {
        eventManager.publish('cardActivationFailed', { 
            reason: 'Insufficient resources',
            required: {
                bits: entity.card.rezCost,
                ash: entity.card.ash,
                souls: entity.card.soul
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
    if (!entity.card.soul || entity.card.soul === 0) {
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
    } = gameState;

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
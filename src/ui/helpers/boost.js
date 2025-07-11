import { state, stateSetters } from './state';
import { eventManager } from './eventManager';

// Get state variables directly - no destructuring to avoid stale references

export function handleBoostCard(cardEntity) {
    if (!cardEntity || !cardEntity.card) {
        console.error('Invalid card entity');
        return;
    }

    // Reset attack mode
    state.attackMode = 'NONE';
    stateSetters.setAttackMode('NONE');

    const boostCost = cardEntity.card.boostCost || 1;

    // Access state directly to ensure we have the latest value
    if (state.playerBits < boostCost) {
        console.log(`Not enough bits to boost. Required: ${boostCost}, Available: ${state.playerBits}`);
        return;
    }

    // Deduct bits using stateSetters directly
    stateSetters.setPlayerBits(state.playerBits - boostCost);

    // Handle steps and freeze (from advancement.js implementation)
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

    // Apply power boost effect
    let newPower = cardEntity.power || 0;
    if (cardEntity.card.boostEffect) {
        // If the card has a specific boost effect defined, apply it
        cardEntity.card.boostEffect(cardEntity);
    } else {
        // Default boost effect: increase power by 1
        newPower += 1;
        console.log(`${cardEntity.card.name}'s power increased to ${newPower}`);
    }
    
    // Mark the card as boosted for this turn
    const boosted = true;
    
    // Use updateEntityInRealm to update the entity in its realm
    // This ensures the UI is properly updated
    import('./entity').then(({ updateEntityInRealm }) => {
        updateEntityInRealm(
            cardEntity,
            {
                steps: newSteps,
                freeze: newFreeze,
                readied: isReady,
                power: newPower,
                boosted
            },
            'PLAYER'
        );
    });
    
    console.log(`Boosted ${cardEntity.card.name}`);
    
    // Emit events for UI updates
    eventManager.publish('cardBoosted', { cardEntity });
    
    // Emit event for readied status change if needed
    if (isReady && !cardEntity.readied) {
        eventManager.publish('cardReadied', { cardEntity });
    }
}

import { gameState, setters } from './state';

const {
    playerBits = 0,
} = gameState;

const {
    setPlayerBits,
} = setters;

export function handleBoostCard(cardEntity) {
    if (!cardEntity || !cardEntity.card) {
        console.error('Invalid card entity');
        return;
    }

    const boostCost = cardEntity.card.boostCost || 1;

    if (playerBits < boostCost) {
        console.log(`Not enough bits to boost. Required: ${boostCost}, Available: ${playerBits}`);
        return;
    }

    // Deduct bits
    setPlayerBits(playerBits - boostCost);

    // TODO: Implement boost effect
    console.log(`Boosted ${cardEntity.card.name}`);
}

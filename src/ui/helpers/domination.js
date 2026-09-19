import { state, stateSetters } from './state';
import { eventManager } from './eventManager';
// Two traps here, both of which silently prevented the bid prompt from ever
// appearing and so hung handleDominationPhase forever:
//   1. `components/Modal`'s showModal writes to module-local variables that no
//      component subscribes to, so it never renders. `helpers/modal` is the one
//      wired through gameState to the rendered <Modal>.
//   2. `components/BidInputModal` takes { isVisible, onClose, onSubmit }, which
//      is not what displayBidPrompt passes. The root BidInputModal takes
//      { maxBid, decisionCallback, closeModal } and matches.
import { showModal } from './modal';
import BidInputModal from '../BidInputModal';
import { enemySacrificeEntity, playerSacrificeEntity } from './sacrifice';
import { adjustEntityPowerExternal } from './core';

export async function handleDominationPhase() {
    const turnCount = eventManager.getTurnCount();
    if (turnCount >= 2) {
        // Calculate scores
        const playerScore = calculateDominationScore('PLAYER');
        const enemyScore = calculateDominationScore('ENEMY');

        // Determine the AI's bid
        const enemyBid = determineEnemyBid(enemyScore, playerScore, state.enemyBits, state.playerBits);

        // Prompt the player to spend Bits
        const playerBid = await promptPlayerBid(state.playerBits);
        stateSetters.setPlayerBits((prev) => prev - playerBid);
        stateSetters.setEnemyBits((prev) => prev - enemyBid);

        // Calculate final scores
        const finalPlayerScore = playerScore + playerBid;
        const finalEnemyScore = enemyScore + enemyBid;

        // Log bids (for debugging)
        console.log(`Player bid: ${playerBid}, Enemy bid: ${enemyBid}`);

        let winner = null;
        let loser = null;

        // Determine the winner
        if (finalPlayerScore > finalEnemyScore) {
            // Player wins
            applyDominationReward('PLAYER');
            winner = 'PLAYER';
            loser = 'ENEMY';

            // Publish dominance won/lost events
            eventManager.publish('dominanceWon', { side: 'PLAYER' });
            eventManager.publish('dominanceLost', { side: 'ENEMY' });

            // Update state
            stateSetters.setPlayerWonDominance && stateSetters.setPlayerWonDominance(true);
            stateSetters.setEnemyLostDominance && stateSetters.setEnemyLostDominance(true);
        } else if (finalEnemyScore > finalPlayerScore) {
            // Enemy wins
            applyDominationReward('ENEMY');
            winner = 'ENEMY';
            loser = 'PLAYER';

            // Publish dominance won/lost events
            eventManager.publish('dominanceWon', { side: 'ENEMY' });
            eventManager.publish('dominanceLost', { side: 'PLAYER' });

            // Update state
            stateSetters.setEnemyWonDominance && stateSetters.setEnemyWonDominance(true);
            stateSetters.setPlayerLostDominance && stateSetters.setPlayerLostDominance(true);
        } else {
            // Tie - nothing happens
            console.log('Domination phase ended in a tie.');
        }

        // Publish the dominationResolved event
        eventManager.publish('dominationResolved', { winner, loser });
        console.log('dominationResolved')
        // startTurn() is chained by the caller (endTurn) via .then()
    } else {
        // Before turn 2 — startTurn() is chained by the caller via .then()
    }
}



export function calculateDominationScore(side) {
    const realms = side === 'PLAYER'
        ? [state.playerSolarium, state.playerTheater, state.playerUnderpass, state.playerGrid]
        : [state.enemySolarium, state.enemyTheater, state.enemyUnderpass, state.enemyGrid];

    const entities = realms.flatMap(realm => realm.people).filter(entity => entity.online && entity.readied);
    const totalPower = entities.reduce((sum, entity) => {
        // Current Skill, not the printed value. This read entity.card.power, so
        // Boosts and any other power modifier were ignored by Dominance.
        const power = adjustEntityPowerExternal(entity, side);
        // Vengeance counts toward the Dominance score (confirmed rule). It
        // lives on the entity itself everywhere else in the codebase; this read
        // entity.statusEffects.Vengeance, which nothing populates, so the term
        // always contributed 0.
        const vengeance = entity.vengeance || 0;
        return sum + power + vengeance;
    }, 0);

    const surge = side === 'PLAYER' ? state.playerSurge : state.enemySurge;

    return totalPower + surge;
}

export function promptPlayerBid(maxBid) {
    return new Promise((resolve) => {
        displayBidPrompt(maxBid, (playerBid) => {
            const validBid = Math.max(0, Math.min(playerBid, maxBid));
            resolve(validBid);
        });
    });
}


export function determineEnemyBid(enemyScore, playerScore, enemyBits, playerBits) {
    console.log('enemyScore', enemyScore);
    console.log('playerScore', playerScore);
    console.log('enemyBits', enemyBits);
    console.log('playerBits', playerBits);

    const currentPlayerScore = playerScore;
    const maxPlayerPossibleScore = playerScore + playerBits;
    const maxEnemyPossibleScore = enemyScore + enemyBits;

    console.log('currentPlayerScore', currentPlayerScore);
    console.log('maxPlayerPossibleScore', maxPlayerPossibleScore);
    console.log('maxEnemyPossibleScore', maxEnemyPossibleScore);

    // If enemy cannot surpass player's current score even with all bits
    if (maxEnemyPossibleScore <= currentPlayerScore) {
        console.log('Enemy cannot exceed player score even with all bits.');
        return 0;
    }

    // Calculate the minimum bid needed to surpass the player's current score
    let minBidToWin = (currentPlayerScore - enemyScore) + 1;
    minBidToWin = Math.max(minBidToWin, 0); // Ensure non-negative
    minBidToWin = Math.min(minBidToWin, enemyBits); // Clamp to available bits
    console.log('minBidToWin', minBidToWin);

    // Calculate the maximum bid to ensure the enemy doesn't bid excessively
    let maxBid = (maxPlayerPossibleScore - enemyScore) + 1;
    maxBid = Math.min(maxBid, enemyBits); // Clamp to available bits
    console.log('maxBid', maxBid);

    // Ensure that minBidToWin does not exceed maxBid
    if (minBidToWin > maxBid) {
        console.log('No valid bids to exceed player score.');
        return 0;
    }

    // Generate possible bids from minBidToWin to maxBid inclusive
    const possibleBids = [];
    for (let bid = minBidToWin; bid <= maxBid; bid++) {
        possibleBids.push(bid);
    }
    console.log('possibleBids', possibleBids);

    // Randomly select a bid from the possibleBids array
    if (possibleBids.length === 0) {
        console.log('No valid bids available.');
        return 0;
    }

    const enemyBid = possibleBids[Math.floor(Math.random() * possibleBids.length)];
    console.log('enemyBid', enemyBid);

    return enemyBid;
}



export function applyDominationReward(winnerSide) {
    if (state.focus === 'magi') {
        if (winnerSide === 'PLAYER') {
            stateSetters.setPlayerFate(prev => prev + 1);
            stateSetters.setEnemyBurden(prev => prev + 1);
        } else {
            stateSetters.setEnemyFate(prev => prev + 1);
            stateSetters.setPlayerBurden(prev => prev + 1);
        }
    } else if (state.focus === 'phys') {
        if (winnerSide === 'PLAYER') {
            enemySacrificeEntity();
        } else {
            playerSacrificeEntity();
        }
    } else if (state.focus === 'tech') {
        if (winnerSide === 'PLAYER') {
            stateSetters.setPlayerActions(prev => prev + 2);
            stateSetters.setPlayerBits(prev => prev + 1);
        } else {
            stateSetters.setEnemyActions(prev => prev + 2);
            stateSetters.setEnemyBits(prev => prev + 1);
        }
    } else {
        console.log('no focus for domination')
    }
}

export function displayBidPrompt(maxBid, decisionCallback) {
        showModal({
            title: 'Domination Phase',
            message: `Enter the amount of Bits to spend (0 to ${maxBid}):`,
            renderContent: ({ closeModal }) => (
                <BidInputModal
                    maxBid={maxBid}
                    decisionCallback={decisionCallback}
                    closeModal={closeModal}
                />
            ),
        });
    }
async function handleDominationPhase() {
    if (turnNumber >= 2) {
        // Calculate scores
        const playerScore = calculateDominationScore('PLAYER');
        const enemyScore = calculateDominationScore('ENEMY');

        // Determine the AI's bid
        const enemyBid = determineEnemyBid(enemyScore, playerScore, enemyBits, playerBits);

        // Prompt the player to spend Bits
        const playerBid = await promptPlayerBid(playerBits);
        setPlayerBits((prev) => prev - playerBid);
        setEnemyBits((prev) => prev - enemyBid);

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
        } else if (finalEnemyScore > finalPlayerScore) {
            // Enemy wins
            applyDominationReward('ENEMY');
            winner = 'ENEMY';
            loser = 'PLAYER';
        } else {
            // Tie - nothing happens
            console.log('Domination phase ended in a tie.');
        }

        // Publish the dominationResolved event
        eventManager.publish('dominationResolved', { winner, loser });
        console.log('dominationResolved')
        // Proceed to end the turn
        endTurn();
    } else {
        // If it's before turn 2, just end the turn
        endTurn();
    }
}



function calculateDominationScore(side) {
    const realms = side === 'PLAYER'
        ? [playerSolarium, playerTheater, playerUnderpass, playerGrid]
        : [enemySolarium, enemyTheater, enemyUnderpass, enemyGrid];

    const entities = realms.flatMap(realm => realm.people).filter(entity => entity.online && entity.readied);
    const totalPower = entities.reduce((sum, entity) => {
        const vengeance = entity.statusEffects?.Vengeance || 0;
        const totalEntityPower = (entity.card.power || 0) + vengeance;
        return sum + totalEntityPower;
    }, 0);

    const surge = side === 'PLAYER' ? playerSurge : enemySurge;

    return totalPower + surge;
}

function promptPlayerBid(maxBid) {
    return new Promise((resolve) => {
        displayBidPrompt(maxBid, (playerBid) => {
            const validBid = Math.max(0, Math.min(playerBid, maxBid));
            resolve(validBid);
        });
    });
}


function determineEnemyBid(enemyScore, playerScore, enemyBits, playerBits) {
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



function applyDominationReward(winnerSide) {
    if (focus === 'magi') {
        if (winnerSide === 'PLAYER') {
            setPlayerFate(prev => prev + 1);
            setEnemyBurden(prev => prev + 1);
        } else {
            setEnemyFate(prev => prev + 1);
            setPlayerBurden(prev => prev + 1);
        }
    } else if (focus === 'phys') {
        if (winnerSide === 'PLAYER') {
            enemySacrificeEntity();
        } else {
            playerSacrificeEntity();
        }
    } else if (focus === 'tech') {
        if (winnerSide === 'PLAYER') {
            setPlayerActions(prev => prev + 2);
            setPlayerBits(prev => prev + 1);
        } else {
            setEnemyActions(prev => prev + 2);
            setEnemyBits(prev => prev + 1);
        }
    } else {
        console.log('no focus for domination')
    }
}

    function displayBidPrompt(maxBid, decisionCallback) {
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
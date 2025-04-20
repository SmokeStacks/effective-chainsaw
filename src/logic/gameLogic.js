// Game mechanics and rules
export const gameLogic = {
    canPlayCard: (card, resources) => {
        return resources.bits >= card.rezCost;
    },

    calculateDamage: (attacker, defender) => {
        let damage = attacker.power;
        if (attacker.abilities?.some(a => a.name === "Vicious")) {
            damage += attacker.abilities.find(a => a.name === "Vicious").amount;
        }
        if (defender.abilities?.some(a => a.name === "Armored")) {
            damage -= defender.abilities.find(a => a.name === "Armored").amount;
        }
        return Math.max(0, damage);
    },

    resolveAbility: (ability, source, target, gameState) => {
        switch (ability.name) {
            case "Buffer":
                return {
                    type: "STAT_BOOST",
                    value: ability.amount,
                    target: "POWER"
                };
            
            case "Rapture":
                return {
                    type: "DAMAGE",
                    value: ability.amount,
                    target: "ALL_ENEMY"
                };

            case "Drift":
                return {
                    type: "MOVE",
                    value: 1,
                    target: "SELF"
                };

            case "Glitchy":
                return {
                    type: "STATUS",
                    value: ability.amount,
                    status: "GLITCH",
                    target: "SELF"
                };

            case "Quest":
                return {
                    type: "QUEST",
                    effects: {
                        readied: true,
                        steps: (target.steps || 0) + 1
                    }
                };

            case "Hack":
                return {
                    type: "HACK",
                    effects: {
                        exposed: true,
                        glitch: (target.glitch || 0) + 1
                    }
                };

            case "Dominate":
                return {
                    type: "DOMINATE",
                    effects: {
                        controlled: true,
                        power: Math.max(0, (target.power || 0) - 1)
                    }
                };

            case "Boost":
                return {
                    type: "BOOST",
                    resource: "surge",
                    amount: 1
                };

            case "Score":
                return {
                    type: "SCORE",
                    resource: "fate",
                    amount: target.power || 1
                };

            // Add more ability resolutions as needed
            default:
                return null;
        }
    },

    checkWinCondition: (gameState) => {
        const { playerState, enemyState } = gameState;
        
        if (playerState.wounds >= 10) return 'ENEMY_WINS';
        if (enemyState.wounds >= 10) return 'PLAYER_WINS';
        
        // Check if either player has no cards left in library and hand
        if (playerState.library.length === 0 && playerState.hand.length === 0) {
            return 'ENEMY_WINS';
        }
        if (enemyState.library.length === 0 && enemyState.hand.length === 0) {
            return 'PLAYER_WINS';
        }
        
        return null;
    },

    calculateDominationScore: (realmCards) => {
        return realmCards.reduce((score, card) => {
            let cardScore = card.power;
            if (card.abilities?.some(a => a.name === "Buffer")) {
                cardScore += card.abilities.find(a => a.name === "Buffer").amount;
            }
            return score + cardScore;
        }, 0);
    },

    determineAIMove: (gameState) => {
        const { enemyState, playerState } = gameState;
        
        // Simple AI logic - prioritize playing cards if possible
        if (enemyState.hand.length > 0) {
            const playableCards = enemyState.hand.filter(card => 
                gameLogic.canPlayCard(card, enemyState)
            );
            
            if (playableCards.length > 0) {
                // Play the highest power card first
                const bestCard = playableCards.reduce((best, current) => 
                    (current.power > best.power) ? current : best
                );
                
                return {
                    type: 'PLAY_CARD',
                    card: bestCard
                };
            }
        }
        
        // If no cards can be played, try to attack
        const attackingRealm = Object.keys(enemyState.realms)
            .find(realm => enemyState.realms[realm].cards.length > 0);
            
        if (attackingRealm) {
            return {
                type: 'ATTACK',
                realm: attackingRealm
            };
        }
        
        // If nothing else, end turn
        return {
            type: 'END_TURN'
        };
    }
};

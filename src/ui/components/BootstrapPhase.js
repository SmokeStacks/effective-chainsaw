import React, { useState, useEffect } from 'react';
import { state, stateSetters } from '../helpers/state';
import { bootstrapMechanic } from '../../rules/bootstrapMechanic';

const BootstrapPhase = ({ onComplete }) => {
    const [selectedCard, setSelectedCard] = useState(null);
    const [availableCards, setAvailableCards] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showBootstrap, setShowBootstrap] = useState(true);
    const [enemyCard, setEnemyCard] = useState(null);
    const [phase, setPhase] = useState('selection'); // 'selection', 'reveal', 'placement'

    useEffect(() => {
        // Get available JAW/JAWbreaker cards
        const cards = bootstrapMechanic.getAvailableBootstrapCards();
        setAvailableCards(cards);
        
        // Enemy automatically selects their card
        const enemySelection = bootstrapMechanic.selectEnemyBootstrap();
        if (enemySelection) {
            setEnemyCard(enemySelection);
        }
    }, []);

    const selectCard = (cardReference) => {
        if (isProcessing) return;
        
        const success = bootstrapMechanic.selectPlayerBootstrap(cardReference);
        if (success) {
            setSelectedCard(cardReference);
        }
    };

    const confirmSelection = () => {
        if (!selectedCard || isProcessing) return;
        
        setIsProcessing(true);
        
        try {
            // Reveal both cards
            const revealed = bootstrapMechanic.revealBootstrapCards();
            
            setPhase('reveal');
            
            // After 2 seconds, proceed to placement
            setTimeout(() => {
                setPhase('placement');
                performPlacement();
            }, 2000);
            
        } catch (error) {
            console.error('Error during bootstrap reveal:', error);
            setIsProcessing(false);
        }
    };

    const performPlacement = () => {
        try {
            // Get the resolved cards
            const playerCardRef = bootstrapMechanic.getBootstrapCards().player;
            const enemyCardRef = bootstrapMechanic.getBootstrapCards().enemy;
            
            if (playerCardRef) {
                // Player chooses where to place (simplified - auto-place in Grid)
                const playerCardInstance = bootstrapMechanic.installBootstrapCard(playerCardRef, 'player');
                
                // Add to player's Grid realm
                const currentGrid = [...state.playerGrid];
                currentGrid.push({
                    ...playerCardInstance,
                    realm: 'Grid'
                });
                
                state.playerGrid = currentGrid;
                stateSetters.setPlayerGrid(currentGrid);
            }
            
            if (enemyCardRef) {
                // Enemy flips coin for tech realm placement
                const techRealms = ['Grid', 'Theater']; // Tech realms
                const coinFlip = Math.random() < 0.5;
                const selectedRealm = techRealms[coinFlip ? 0 : 1];
                
                const enemyCardInstance = bootstrapMechanic.installBootstrapCard(enemyCardRef, 'enemy');
                
                // Add to enemy's selected realm
                const currentRealm = [...state[`enemy${selectedRealm}`]];
                currentRealm.push({
                    ...enemyCardInstance,
                    realm: selectedRealm
                });
                
                state[`enemy${selectedRealm}`] = currentRealm;
                stateSetters[`setEnemy${selectedRealm}`](currentRealm);
                
                console.log(`Enemy placed bootstrap card in ${selectedRealm} (coin flip: ${coinFlip ? 'heads' : 'tails'})`);
            }
            
            // Complete bootstrap phase
            setTimeout(() => {
                setShowBootstrap(false);
                onComplete();
            }, 1500);
            
        } catch (error) {
            console.error('Error during bootstrap placement:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const skipBootstrap = () => {
        setIsProcessing(true);
        
        // Enemy still places their card if they selected one
        if (enemyCard) {
            setTimeout(() => {
                performPlacement();
            }, 1000);
        } else {
            setTimeout(() => {
                setShowBootstrap(false);
                onComplete();
            }, 500);
        }
    };

    if (!showBootstrap) {
        return null;
    }

    const getCardName = (cardReference) => {
        if (!cardReference) return 'Unknown';
        // This would need to be implemented to resolve card reference to name
        return `Card ${cardReference.index}`;
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#2a2a2a',
                padding: '20px',
                borderRadius: '10px',
                maxWidth: '800px',
                maxHeight: '80vh',
                overflow: 'auto'
            }}>
                <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
                    Bootstrap Phase
                </h2>
                
                {phase === 'selection' && (
                    <>
                        <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '20px' }}>
                            Select 1 JAW or JAWbreaker card to install before the game begins.
                        </p>
                        
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(3, 1fr)', 
                            gap: '10px', 
                            marginBottom: '20px' 
                        }}>
                            {availableCards.map((card, index) => (
                                <div
                                    key={`${card.faction}-${card.index}`}
                                    onClick={() => selectCard(card)}
                                    style={{
                                        border: selectedCard?.faction === card.faction && selectedCard?.index === card.index 
                                            ? '3px solid #4CAF50' 
                                            : '2px solid #666',
                                        borderRadius: '8px',
                                        padding: '10px',
                                        backgroundColor: selectedCard?.faction === card.faction && selectedCard?.index === card.index 
                                            ? '#1a1a1a' 
                                            : '#333',
                                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.2s',
                                        pointerEvents: isProcessing ? 'none' : 'auto'
                                    }}
                                >
                                    <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '5px' }}>
                                        {getCardName(card)}
                                    </div>
                                    <div style={{ color: '#ccc', fontSize: '12px' }}>
                                        {card.faction}
                                    </div>
                                    <div style={{ color: '#888', fontSize: '11px', marginTop: '5px' }}>
                                        Index: {card.index}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '15px' 
                        }}>
                            <div style={{ color: '#ccc' }}>
                                Selected: {selectedCard ? getCardName(selectedCard) : 'None'}
                            </div>
                            <div style={{ color: '#ccc' }}>
                                Enemy has selected their card
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={skipBootstrap}
                                disabled={isProcessing}
                                style={{
                                    backgroundColor: '#666',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                                    opacity: isProcessing ? 0.5 : 1
                                }}
                            >
                                Skip Bootstrap
                            </button>
                            
                            <button
                                onClick={confirmSelection}
                                disabled={!selectedCard || isProcessing}
                                style={{
                                    backgroundColor: selectedCard ? '#4CAF50' : '#888',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                                    opacity: isProcessing ? 0.5 : 1
                                }}
                            >
                                {isProcessing ? 'Processing...' : 'Confirm Selection'}
                            </button>
                        </div>
                    </>
                )}
                
                {phase === 'reveal' && (
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ color: 'white', marginBottom: '20px' }}>
                            Bootstrap Cards Revealed!
                        </h3>
                        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                            <div style={{ color: '#4CAF50' }}>
                                <div style={{ fontWeight: 'bold' }}>Player:</div>
                                <div>{selectedCard ? getCardName(selectedCard) : 'None'}</div>
                            </div>
                            <div style={{ color: '#f44336' }}>
                                <div style={{ fontWeight: 'bold' }}>Enemy:</div>
                                <div>{enemyCard ? getCardName(enemyCard) : 'None'}</div>
                            </div>
                        </div>
                        <div style={{ color: '#ccc' }}>
                            Installing cards to realms...
                        </div>
                    </div>
                )}
                
                {phase === 'placement' && (
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ color: 'white', marginBottom: '20px' }}>
                            Placing Bootstrap Cards
                        </h3>
                        <div style={{ color: '#ccc' }}>
                            Player card installed in Grid realm<br/>
                            Enemy card installing in tech realm...
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BootstrapPhase;

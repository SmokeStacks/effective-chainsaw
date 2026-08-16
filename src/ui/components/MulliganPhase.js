import React, { useState, useEffect } from 'react';
import { state, stateSetters } from '../helpers/state';
import { playerMulligan, enemyMulligan } from '../helpers/setupNewRules';

const MulliganPhase = ({ onComplete }) => {
    const [selectedCards, setSelectedCards] = useState([]);
    const [playerHand, setPlayerHand] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showMulligan, setShowMulligan] = useState(true);

    useEffect(() => {
        // Get current player hand from state
        console.log('MulliganPhase useEffect - playerHand:', state.playerHand);
        if (state.playerHand && state.playerHand.length > 0) {
            setPlayerHand([...state.playerHand]);
        }
    }, [state.playerHand]); // Add dependency on state.playerHand

    const toggleCardSelection = (index) => {
        console.log('Card clicked:', index, 'Current selected:', selectedCards);
        if (selectedCards.includes(index)) {
            setSelectedCards(selectedCards.filter(i => i !== index));
        } else {
            setSelectedCards([...selectedCards, index]);
        }
    };

    const confirmMulligan = async () => {
        setIsProcessing(true);
        
        try {
            // Perform player mulligan
            const currentPlayerLibrary = [...state.playerLibrary];
            const currentPlayerHand = [...state.playerHand];
            
            const mulliganResult = playerMulligan(
                currentPlayerHand.map(card => card.card), 
                currentPlayerLibrary.map(card => card.card), 
                selectedCards
            );
            
            // Convert back to card instances
            const newHandInstances = mulliganResult.hand.map((card, index) => ({
                ...currentPlayerHand.find(c => c.card.id === card.id) || {
                    id: `p_mulligan_${index}`,
                    card,
                    power: card.power || 0,
                    HP: card.HP || 0,
                    wounds: 0,
                    exposed: false,
                    scored: false,
                    readied: false,
                    ascended: false,
                    online: false,
                    tapped: false,
                    sacrificed: false,
                    steps: 0,
                    freeze: 0,
                    decay: 0,
                    venom: 0,
                    damage: 0,
                    shield: 0,
                    counters: 0,
                    development: card.development || 0,
                    charge: card.charge || 0,
                    cosmic: card.cosmic || 1,
                    deathless: card.deathless || 0,
                    pounce: card.pounce || 0,
                    override: card.override || 0,
                    stealth: card.stealth || 0,
                    armored: card.armored || 0,
                    solo: card.solo || 0,
                    plot: card.plot || 0,
                    tokens: [],
                    abilities: card.abilities || [],
                    keywords: card.keywords || [],
                    faction: card.faction,
                    category: card.category,
                    owner: 'PLAYER'
                }
            }));
            
            const newLibraryInstances = mulliganResult.deck.map((card, index) => ({
                id: `p_lib_${index}`,
                card,
                power: card.power || 0,
                HP: card.HP || 0,
                wounds: 0,
                exposed: false,
                scored: false,
                readied: false,
                ascended: false,
                online: false,
                tapped: false,
                sacrificed: false,
                steps: 0,
                freeze: 0,
                decay: 0,
                venom: 0,
                damage: 0,
                shield: 0,
                counters: 0,
                development: card.development || 0,
                charge: card.charge || 0,
                cosmic: card.cosmic || 1,
                deathless: card.deathless || 0,
                pounce: card.pounce || 0,
                override: card.override || 0,
                stealth: card.stealth || 0,
                armored: card.armored || 0,
                solo: card.solo || 0,
                plot: card.plot || 0,
                tokens: [],
                abilities: card.abilities || [],
                keywords: card.keywords || [],
                faction: card.faction,
                category: card.category,
                owner: 'PLAYER'
            }));
            
            // Update state with new hand and library
            stateSetters.setPlayerHand(newHandInstances);
            stateSetters.setPlayerLibrary(newLibraryInstances);
            
            // Perform enemy mulligan automatically
            const currentEnemyHand = [...state.enemyHand];
            const currentEnemyLibrary = [...state.enemyLibrary];
            
            const enemyMulliganResult = enemyMulligan(
                currentEnemyHand.map(card => card.card),
                currentEnemyLibrary.map(card => card.card)
            );
            
            // Convert enemy cards back to instances
            const newEnemyHandInstances = enemyMulliganResult.hand.map((card, index) => ({
                ...currentEnemyHand.find(c => c.card.id === card.id) || {
                    id: `e_mulligan_${index}`,
                    card,
                    power: card.power || 0,
                    HP: card.HP || 0,
                    wounds: 0,
                    exposed: false,
                    scored: false,
                    readied: false,
                    ascended: false,
                    online: false,
                    tapped: false,
                    sacrificed: false,
                    steps: 0,
                    freeze: 0,
                    decay: 0,
                    venom: 0,
                    damage: 0,
                    shield: 0,
                    counters: 0,
                    development: card.development || 0,
                    charge: card.charge || 0,
                    cosmic: card.cosmic || 1,
                    deathless: card.deathless || 0,
                    pounce: card.pounce || 0,
                    override: card.override || 0,
                    stealth: card.stealth || 0,
                    armored: card.armored || 0,
                    solo: card.solo || 0,
                    plot: card.plot || 0,
                    tokens: [],
                    abilities: card.abilities || [],
                    keywords: card.keywords || [],
                    faction: card.faction,
                    category: card.category,
                    owner: 'ENEMY'
                }
            }));
            
            const newEnemyLibraryInstances = enemyMulliganResult.deck.map((card, index) => ({
                id: `e_lib_${index}`,
                card,
                power: card.power || 0,
                HP: card.HP || 0,
                wounds: 0,
                exposed: false,
                scored: false,
                readied: false,
                ascended: false,
                online: false,
                tapped: false,
                sacrificed: false,
                steps: 0,
                freeze: 0,
                decay: 0,
                venom: 0,
                damage: 0,
                shield: 0,
                counters: 0,
                development: card.development || 0,
                charge: card.charge || 0,
                cosmic: card.cosmic || 1,
                deathless: card.deathless || 0,
                pounce: card.pounce || 0,
                override: card.override || 0,
                stealth: card.stealth || 0,
                armored: card.armored || 0,
                solo: card.solo || 0,
                plot: card.plot || 0,
                tokens: [],
                abilities: card.abilities || [],
                keywords: card.keywords || [],
                faction: card.faction,
                category: card.category,
                owner: 'ENEMY'
            }));
            
            // Update enemy state
            stateSetters.setEnemyHand(newEnemyHandInstances);
            stateSetters.setEnemyLibrary(newEnemyLibraryInstances);
            
            console.log('Mulligan phase completed');
            
            // Hide mulligan UI and complete
            setShowMulligan(false);
            setTimeout(() => {
                onComplete();
            }, 500);
            
        } catch (error) {
            console.error('Error during mulligan:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const keepHand = () => {
        // No mulligan, just proceed with enemy mulligan
        setIsProcessing(true);
        
        try {
            // Perform enemy mulligan automatically
            const currentEnemyHand = [...state.enemyHand];
            const currentEnemyLibrary = [...state.enemyLibrary];
            
            const enemyMulliganResult = enemyMulligan(
                currentEnemyHand.map(card => card.card),
                currentEnemyLibrary.map(card => card.card)
            );
            
            // Convert enemy cards back to instances and update state
            const newEnemyHandInstances = enemyMulliganResult.hand.map((card, index) => ({
                ...currentEnemyHand.find(c => c.card.id === card.id) || {
                    id: `e_mulligan_${index}`,
                    card,
                    power: card.power || 0,
                    HP: card.HP || 0,
                    wounds: 0,
                    exposed: false,
                    scored: false,
                    readied: false,
                    ascended: false,
                    online: false,
                    tapped: false,
                    sacrificed: false,
                    steps: 0,
                    freeze: 0,
                    decay: 0,
                    venom: 0,
                    damage: 0,
                    shield: 0,
                    counters: 0,
                    development: card.development || 0,
                    charge: card.charge || 0,
                    cosmic: card.cosmic || 1,
                    deathless: card.deathless || 0,
                    pounce: card.pounce || 0,
                    override: card.override || 0,
                    stealth: card.stealth || 0,
                    armored: card.armored || 0,
                    solo: card.solo || 0,
                    plot: card.plot || 0,
                    tokens: [],
                    abilities: card.abilities || [],
                    keywords: card.keywords || [],
                    faction: card.faction,
                    category: card.category,
                    owner: 'ENEMY'
                }
            }));
            
            const newEnemyLibraryInstances = enemyMulliganResult.deck.map((card, index) => ({
                id: `e_lib_${index}`,
                card,
                power: card.power || 0,
                HP: card.HP || 0,
                wounds: 0,
                exposed: false,
                scored: false,
                readied: false,
                ascended: false,
                online: false,
                tapped: false,
                sacrificed: false,
                steps: 0,
                freeze: 0,
                decay: 0,
                venom: 0,
                damage: 0,
                shield: 0,
                counters: 0,
                development: card.development || 0,
                charge: card.charge || 0,
                cosmic: card.cosmic || 1,
                deathless: card.deathless || 0,
                pounce: card.pounce || 0,
                override: card.override || 0,
                stealth: card.stealth || 0,
                armored: card.armored || 0,
                solo: card.solo || 0,
                plot: card.plot || 0,
                tokens: [],
                abilities: card.abilities || [],
                keywords: card.keywords || [],
                faction: card.faction,
                category: card.category,
                owner: 'ENEMY'
            }));
            
            stateSetters.setEnemyHand(newEnemyHandInstances);
            stateSetters.setEnemyLibrary(newEnemyLibraryInstances);
            
            setShowMulligan(false);
            setTimeout(() => {
                onComplete();
            }, 500);
            
        } catch (error) {
            console.error('Error during enemy mulligan:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!showMulligan) {
        return null;
    }

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
                    Mulligan Phase
                </h2>
                
                <p style={{ color: '#ccc', textAlign: 'center', marginBottom: '20px' }}>
                    Select cards to reshuffle back into your deck, then draw new cards to reach 4.
                </p>
                
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '10px', 
                    marginBottom: '20px' 
                }}>
                    {playerHand.map((card, index) => (
                        <div
                            key={card.id}
                            onClick={() => !isProcessing && toggleCardSelection(index)}
                            style={{
                                border: selectedCards.includes(index) ? '3px solid #4CAF50' : '2px solid #666',
                                borderRadius: '8px',
                                padding: '10px',
                                backgroundColor: selectedCards.includes(index) ? '#1a1a1a' : '#333',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.2s',
                                pointerEvents: isProcessing ? 'none' : 'auto',
                                userSelect: 'none',
                                position: 'relative'
                            }}
                        >
                            <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '5px' }}>
                                {card.card.name}
                            </div>
                            <div style={{ color: '#ccc', fontSize: '12px' }}>
                                {card.card.category}
                            </div>
                            <div style={{ color: '#888', fontSize: '11px', marginTop: '5px' }}>
                                Cost: {card.card.rezCost || 0}
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
                        Selected: {selectedCards.length} cards to reshuffle
                    </div>
                    <div style={{ color: '#ccc' }}>
                        Will draw: {selectedCards.length} new cards
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                        onClick={keepHand}
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
                        Keep Hand
                    </button>
                    
                    <button
                        onClick={confirmMulligan}
                        disabled={isProcessing}
                        style={{
                            backgroundColor: selectedCards.length > 0 ? '#4CAF50' : '#888',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            opacity: isProcessing ? 0.5 : 1
                        }}
                    >
                        {isProcessing ? 'Processing...' : 'Reshuffle Selected'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MulliganPhase;

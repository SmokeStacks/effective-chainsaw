import React, { useState, useEffect } from 'react';
import { state } from '../helpers/state';
import { getBootstrapCard, bootstrapConfig } from '../../playerDecks/playerDeck';
import { resolveCardReference } from '../../rules/deckResolver';

const ProperBootstrapPhase = ({ onComplete }) => {
    const [showBootstrap, setShowBootstrap] = useState(true);
    const [selectedRealm, setSelectedRealm] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [bootstrapCard, setBootstrapCard] = useState(null);

    useEffect(() => {
        console.log('Loading bootstrap card...');
        try {
            // Get the designated bootstrap card from the deck
            const card = getBootstrapCard();
            console.log('Bootstrap card reference:', card);
            const resolvedCard = resolveCardReference(card);
            console.log('Resolved bootstrap card:', resolvedCard);
            setBootstrapCard(resolvedCard);
        } catch (error) {
            console.error('Error loading bootstrap card:', error);
        }
    }, []);

    const confirmBootstrap = () => {
        console.log('Confirm bootstrap clicked. selectedRealm:', selectedRealm, 'bootstrapCard:', bootstrapCard);
        
        if (!selectedRealm) {
            console.error('No realm selected');
            return;
        }
        
        if (isProcessing) {
            console.log('Already processing');
            return;
        }
        
        if (!bootstrapCard) {
            console.error('Bootstrap card not loaded yet');
            alert('Bootstrap card not loaded. Please wait a moment and try again.');
            return;
        }
        
        setIsProcessing(true);
        
        try {
            console.log('Creating card instance for:', bootstrapCard.name);
            
            // Create card instance for the bootstrap card
            const cardInstance = {
                id: 'player_bootstrap',
                card: bootstrapCard,
                power: bootstrapCard.power || 0,
                HP: bootstrapCard.HP || 0,
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
                development: 0,
                charge: 0,
                cosmic: 1,
                deathless: 0,
                pounce: 0,
                override: 0,
                stealth: 0,
                armored: 0,
                solo: 0,
                plot: 0,
                tokens: [],
                abilities: bootstrapCard.abilities || [],
                keywords: bootstrapCard.keywords || '',
                faction: bootstrapCard.faction,
                category: bootstrapCard.category,
                owner: 'PLAYER',
                isBootstrap: true,
                realm: selectedRealm
            };
            
            console.log(`Bootstrap card ${bootstrapCard.name} placed in ${selectedRealm}`);
            
            // Simulate enemy bootstrap (they also get their bootstrap card)
            setTimeout(() => {
                // Enemy gets their bootstrap card in a random realm (Underpass or Grid)
                const enemyRealms = ['Underpass', 'Grid'];
                const enemyRealm = enemyRealms[Math.floor(Math.random() * enemyRealms.length)];
                
                // For now, enemy gets the same card type but from their deck
                const enemyCardInstance = {
                    id: 'enemy_bootstrap',
                    card: bootstrapCard, // Simplified - using same card for now
                    power: bootstrapCard.power || 0,
                    HP: bootstrapCard.HP || 0,
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
                    development: 0,
                    charge: 0,
                    cosmic: 1,
                    deathless: 0,
                    pounce: 0,
                    override: 0,
                    stealth: 0,
                    armored: 0,
                    solo: 0,
                    plot: 0,
                    tokens: [],
                    abilities: bootstrapCard.abilities || [],
                    keywords: bootstrapCard.keywords || '',
                    faction: bootstrapCard.faction,
                    category: bootstrapCard.category,
                    owner: 'ENEMY',
                    isBootstrap: true,
                    realm: enemyRealm
                };
                
                console.log(`Enemy bootstrap card placed in ${enemyRealm}`);
                
                // Complete bootstrap phase — pass placement data to BoardContainer
                setTimeout(() => {
                    setShowBootstrap(false);
                    onComplete({
                        playerCard: cardInstance,
                        playerRealm: selectedRealm,
                        enemyCard: enemyCardInstance,
                        enemyRealm,
                    });
                }, 1000);
            }, 1000);
            
        } catch (error) {
            console.error('Error during bootstrap placement:', error);
            alert('Error: ' + error.message);
            setIsProcessing(false);
        }
    };

    if (!showBootstrap) {
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
                padding: '30px',
                borderRadius: '10px',
                maxWidth: '600px',
                textAlign: 'center'
            }}>
                <h2 style={{ color: 'white', marginBottom: '20px' }}>
                    Bootstrap Phase
                </h2>
                
                <p style={{ color: '#ccc', marginBottom: '30px' }}>
                    Your designated JAW/JAWbreaker entity starts in play. Choose which realm to place it in.
                </p>
                
                {bootstrapCard && (
                    <div style={{ 
                        backgroundColor: '#1a1a1a', 
                        padding: '20px', 
                        borderRadius: '8px',
                        border: '2px solid #4CAF50',
                        marginBottom: '30px'
                    }}>
                        <h3 style={{ color: '#4CAF50', marginBottom: '10px' }}>
                            Bootstrap Card
                        </h3>
                        <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '5px' }}>
                            {bootstrapCard.name}
                        </div>
                        <div style={{ color: '#888', fontSize: '12px', marginBottom: '5px' }}>
                            {bootstrapCard.faction} • {bootstrapCard.category}
                        </div>
                        <div style={{ color: '#ccc', fontSize: '11px', marginBottom: '10px' }}>
                            Cost: {bootstrapCard.rezCost || 0} | Power: {bootstrapCard.power || 0} | HP: {bootstrapCard.HP || 0}
                        </div>
                        {bootstrapCard.subTypes && bootstrapCard.subTypes.length > 0 && (
                            <div style={{ 
                                backgroundColor: '#4CAF50', 
                                color: 'white', 
                                padding: '4px 8px', 
                                borderRadius: '4px',
                                fontSize: '10px',
                                display: 'inline-block'
                            }}>
                                {bootstrapCard.subTypes.join(' • ')}
                            </div>
                        )}
                    </div>
                )}
                
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ color: 'white', marginBottom: '15px' }}>
                        Choose Realm (3rd or 4th only):
                    </h3>
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                        <button
                            onClick={() => setSelectedRealm('Underpass')}
                            disabled={isProcessing}
                            style={{
                                backgroundColor: selectedRealm === 'Underpass' ? '#4CAF50' : '#666',
                                color: 'white',
                                border: 'none',
                                padding: '15px 20px',
                                borderRadius: '5px',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                opacity: isProcessing ? 0.5 : 1,
                                fontSize: '14px'
                            }}
                        >
                            Underpass<br/>
                            <span style={{ fontSize: '10px', opacity: 0.8 }}>3rd Realm</span>
                        </button>
                        
                        <button
                            onClick={() => setSelectedRealm('Grid')}
                            disabled={isProcessing}
                            style={{
                                backgroundColor: selectedRealm === 'Grid' ? '#4CAF50' : '#666',
                                color: 'white',
                                border: 'none',
                                padding: '15px 20px',
                                borderRadius: '5px',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                opacity: isProcessing ? 0.5 : 1,
                                fontSize: '14px'
                            }}
                        >
                            Grid<br/>
                            <span style={{ fontSize: '10px', opacity: 0.8 }}>4th Realm</span>
                        </button>
                    </div>
                </div>
                
                <div style={{ color: '#ccc', marginBottom: '20px' }}>
                    Selected: {selectedRealm || 'None'}
                </div>
                
                <button
                    onClick={confirmBootstrap}
                    disabled={!selectedRealm || isProcessing}
                    style={{
                        backgroundColor: selectedRealm && !isProcessing ? '#4CAF50' : '#888',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '5px',
                        cursor: !selectedRealm || isProcessing ? 'not-allowed' : 'pointer',
                        opacity: isProcessing ? 0.5 : 1,
                        fontSize: '16px'
                    }}
                >
                    {isProcessing ? 'Installing Bootstrap Cards...' : 'Confirm Placement'}
                </button>
            </div>
        </div>
    );
};

export default ProperBootstrapPhase;

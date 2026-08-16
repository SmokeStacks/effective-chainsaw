import React, { useState, useEffect } from 'react';

const SimpleBootstrapPhase = ({ onComplete }) => {
    const [showBootstrap, setShowBootstrap] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Hardcoded bootstrap cards like Commander MTG
    const playerBootstrapCard = {
        name: "Adrenochrome",
        faction: "orange",
        description: "Your designated bootstrap card"
    };

    const enemyBootstrapCard = {
        name: "Adrenochrome", 
        faction: "orange",
        description: "Enemy's designated bootstrap card"
    };

    const confirmBootstrap = () => {
        if (isProcessing) return;
        
        setIsProcessing(true);
        
        // Simulate bootstrap placement
        setTimeout(() => {
            console.log('Bootstrap completed - Player:', playerBootstrapCard.name, 'Enemy:', enemyBootstrapCard.name);
            setShowBootstrap(false);
            onComplete();
        }, 1500);
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
                    Each player has a designated bootstrap card that starts in play.
                </p>
                
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-around', 
                    marginBottom: '30px' 
                }}>
                    <div style={{ 
                        backgroundColor: '#1a1a1a', 
                        padding: '15px', 
                        borderRadius: '8px',
                        border: '2px solid #4CAF50'
                    }}>
                        <h3 style={{ color: '#4CAF50', marginBottom: '10px' }}>
                            Player Bootstrap
                        </h3>
                        <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '5px' }}>
                            {playerBootstrapCard.name}
                        </div>
                        <div style={{ color: '#888', fontSize: '12px' }}>
                            {playerBootstrapCard.faction}
                        </div>
                        <div style={{ 
                            backgroundColor: '#4CAF50', 
                            color: 'white', 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            fontSize: '10px',
                            marginTop: '8px',
                            display: 'inline-block'
                        }}>
                            BOOTSTRAP
                        </div>
                    </div>
                    
                    <div style={{ 
                        backgroundColor: '#1a1a1a', 
                        padding: '15px', 
                        borderRadius: '8px',
                        border: '2px solid #f44336'
                    }}>
                        <h3 style={{ color: '#f44336', marginBottom: '10px' }}>
                            Enemy Bootstrap
                        </h3>
                        <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '5px' }}>
                            {enemyBootstrapCard.name}
                        </div>
                        <div style={{ color: '#888', fontSize: '12px' }}>
                            {enemyBootstrapCard.faction}
                        </div>
                        <div style={{ 
                            backgroundColor: '#f44336', 
                            color: 'white', 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            fontSize: '10px',
                            marginTop: '8px',
                            display: 'inline-block'
                        }}>
                            BOOTSTRAP
                        </div>
                    </div>
                </div>
                
                <div style={{ color: '#ccc', marginBottom: '20px' }}>
                    Bootstrap cards are automatically placed in starting realms.
                </div>
                
                <button
                    onClick={confirmBootstrap}
                    disabled={isProcessing}
                    style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '5px',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        opacity: isProcessing ? 0.5 : 1,
                        fontSize: '16px'
                    }}
                >
                    {isProcessing ? 'Installing Bootstrap Cards...' : 'Continue'}
                </button>
            </div>
        </div>
    );
};

export default SimpleBootstrapPhase;

import React, { useState, useEffect } from 'react';
import { playerMainDeck } from '../../playerDecks/playerDeck';
import { resolveCardReference } from '../../rules/deckResolver';
import { cardRegistry } from '../../rules/cardRegistry';
import { orangeCardList } from '../../rules/orangeBinder';
import Card from '../renders/Card';
import { imgObj } from '../Tools';

const DeckVerification = ({ onConfirm }) => {
    const [resolvedCards, setResolvedCards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Log card registry info for debugging
        console.log('Direct orange import:', orangeCardList?.length);
        console.log('Card Registry object:', cardRegistry);
        console.log('Card Registry keys:', Object.keys(cardRegistry || {}));
        console.log('Card Registry:', {
            orange: cardRegistry?.orange?.length,
            gray: cardRegistry?.gray?.length,
            purple: cardRegistry?.purple?.length,
            green: cardRegistry?.green?.length
        });

        // Resolve all cards in the deck
        const resolved = playerMainDeck.map((ref, index) => {
            const card = resolveCardReference(ref);
            if (!card) {
                console.error(`Failed to resolve card at deck index ${index}:`, ref);
            }
            return {
                deckIndex: index,
                reference: ref,
                card: card,
                error: !card ? `Failed to resolve ${ref.faction} index ${ref.index}` : null
            };
        });

        setResolvedCards(resolved);
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px'
            }}>
                Loading deck...
            </div>
        );
    }

    const errorCount = resolvedCards.filter(c => c.error).length;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 2000
        }}>
            {/* Header */}
            <div style={{
                backgroundColor: '#1a1a1a',
                borderBottom: '2px solid #333',
                padding: '15px 30px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
            }}>
                <div>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>
                        Deck Verification
                    </h2>
                    <p style={{ color: '#888', margin: '5px 0 0 0', fontSize: '14px' }}>
                        {resolvedCards.length} cards | {errorCount > 0 ? (
                            <span style={{ color: '#f44336' }}>{errorCount} errors</span>
                        ) : (
                            <span style={{ color: '#4CAF50' }}>All {resolvedCards.length} cards resolved</span>
                        )}
                    </p>
                </div>
                <button
                    onClick={onConfirm}
                    style={{
                        backgroundColor: errorCount === 0 ? '#4CAF50' : '#ff9800',
                        color: 'white',
                        border: 'none',
                        padding: '15px 40px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}
                >
                    {errorCount === 0 ? '✓ Confirm & Start Game' : '⚠ Start Anyway'}
                </button>
            </div>

            {/* Scrollable Card Grid */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '30px',
                backgroundColor: '#0a0a0a'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '20px',
                    maxWidth: '1600px',
                    margin: '0 auto'
                }}>
                    {resolvedCards.map((item, idx) => (
                        <div
                            key={idx}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            {/* Card Index Badge */}
                            <div style={{
                                backgroundColor: item.error ? '#f44336' : '#333',
                                color: 'white',
                                padding: '5px 15px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                fontWeight: 'bold'
                            }}>
                                #{item.deckIndex}: {item.reference.faction}[{item.reference.index}]
                                {item.error && ' - ERROR'}
                            </div>

                            {/* Card Render */}
                            {item.error ? (
                                <div style={{
                                    width: '250px',
                                    height: '350px',
                                    backgroundColor: '#3a1a1a',
                                    border: '2px solid #f44336',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '20px',
                                    color: '#f44336'
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠</div>
                                    <div style={{ textAlign: 'center', fontSize: '14px' }}>
                                        {item.error}
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    transform: 'scale(0.85)',
                                    transformOrigin: 'top center'
                                }}>
                                    <Card
                                        entity={{
                                            id: `deck-verification-${idx}`,
                                            card: item.card,
                                            wounds: 0,
                                            steps: 0,
                                            freeze: 0,
                                            venom: 0,
                                            online: false,
                                            readied: false,
                                            exposed: false,
                                            scored: false,
                                            tapped: false,
                                            sacrificed: false,
                                            ascended: false,
                                            owner: 'PLAYER',
                                            isBootstrap: false
                                        }}
                                        imgSrc={item.card ? imgObj[item.card.name] || require('../../images/unknown.png') : require('../../images/unknown.png')}
                                        onCardSelect={() => {}}
                                        onAbilityClick={() => {}}
                                        selected={false}
                                    />
                                </div>
                            )}

                            {/* Card Name */}
                            {!item.error && (
                                <div style={{
                                    color: '#aaa',
                                    fontSize: '14px',
                                    textAlign: 'center',
                                    maxWidth: '250px'
                                }}>
                                    {item.card.name}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DeckVerification;

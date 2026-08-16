import React, { Component } from 'react';

import CardDisplay from "./CardDisplay";

function RealmCards({ cards, onCardSelect, onRezPlayerCard, onAbilityClick, isPlayerCard }) {
    var cardsEntities = [];
    for (var i = 0; i < cards.length; i++) {
        cardsEntities.push(<CardDisplay isFaceUp={cards[i].online} isPlayerCard={isPlayerCard} key={i} entity={cards[i]} onCardSelect={onCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} inHand={false} />);
    }
    return <>{cardsEntities}</>;
}

class RealmStuff extends Component {
    render() {
        const { cards, onCardSelect, onRezPlayerCard, onAbilityClick, isPlayerCard, className } = this.props;
        
        // Debug log to see when cards is undefined
        if (!cards) {
            console.log('RealmStuff: cards prop is undefined', {
                isPlayerCard,
                componentProps: this.props
            });
        }

        return (
            <div className={`realm-creatures${className ? ' ' + className : ''}`}>
                <RealmCards cards={cards || []} onCardSelect={onCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} isPlayerCard={isPlayerCard} />
            </div>
        );
    }
}

export default RealmStuff;

import React, { Component } from 'react';

import CardDisplay from "./CardDisplay";

function RealmCards({ cards = [], onCardSelect, onRezPlayerCard, isPlayerCard }) {
    var cardsEntities = [];
    if (cards) {
        for (var i = 0; i < cards.length; i++) {
            cardsEntities.push(<CardDisplay isFaceUp={cards[i].online} isPlayerCard={isPlayerCard} key={i} entity={cards[i]} onCardSelect={onCardSelect} onRezPlayerCard={onRezPlayerCard} inHand={false} />);
        }
    }
    return <>{cardsEntities}</>;
}

class RealmCreatures extends Component {
    render() {
        const { cards, onCardSelect, onRezPlayerCard, isPlayerCard } = this.props;

        return (
            <div className="realm-creatures">
                <RealmCards cards={cards} onCardSelect={onCardSelect} onRezPlayerCard={onRezPlayerCard} isPlayerCard={isPlayerCard} />
            </div>
        );
    }
}

export default RealmCreatures;

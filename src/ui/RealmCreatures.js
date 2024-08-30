import React, { Component } from 'react';

import RealmCardDisplay from "./RealmCardDisplay";

function RealmCards({ cards, onCardSelect, onRezPlayerCard, isPlayerCard }) {
    var cardsEntities = [];
    for (var i = 0; i < cards.length; i++) {
        cardsEntities.push(<RealmCardDisplay isFaceDown={true} isPlayerCard={isPlayerCard} key={i} entity={cards[i]} onCardSelect={onCardSelect} onRezPlayerCard={onRezPlayerCard}/>);
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
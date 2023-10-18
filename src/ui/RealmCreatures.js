import React, { Component } from 'react';

import RealmCardDisplay from "./RealmCardDisplay";

function RealmCards({ cards, onCardSelect }) {
    var cardsEntities = [];
    for (var i = 0; i < cards.length; i++) {
        cardsEntities.push(<RealmCardDisplay isFaceDown={true} isPlayerCard={true} key={i} entity={cards[i]} onCardSelect={onCardSelect} />);
    }
    return <>{cardsEntities}</>;
}

class RealmCreatures extends Component {
    render() {
        const { cards, onCardSelect } = this.props;

        return (
            <div className="realm-creatures">
                <RealmCards cards={cards} onCardSelect={onCardSelect} />
            </div>
        );
    }
}

export default RealmCreatures;
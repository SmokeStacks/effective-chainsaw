import React, { Component } from 'react';

import CardDisplay from "./CardDisplay";

function HandCards({ cards, onCardSelect }) {
    var cardsEntities = [];
    for (var i = 0; i < cards.length; i++) {
        cardsEntities.push(<CardDisplay key={i} entity={cards[i]} onCardSelect={onCardSelect} />);
    }
    return <>{cardsEntities}</>;
}

class PlayerHandDisplay extends Component {
    render() {
        const { cards, onCardSelect } = this.props;

        return (
            <div className="player-hand">
                <HandCards cards={cards} onCardSelect={onCardSelect} />
            </div>
        );
    }
}

export default PlayerHandDisplay;
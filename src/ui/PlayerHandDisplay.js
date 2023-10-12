import React, { Component } from 'react';

import CardDisplay from "./CardDisplay";

function HandCards({ cards }) {
    var cardsEntities = [];
    for (var i = 0; i < cards.length; i++) {
        cardsEntities.push(<CardDisplay key={i} card={cards[i].card} />);
    }
    return <>{cardsEntities}</>;
}

class PlayerHandDisplay extends Component {
    render() {
        const { cards } = this.props;

        return (
            <div className="player-hand">
                <HandCards cards={cards} />
            </div>
        );
    }
}

export default PlayerHandDisplay;
import React, { Component } from 'react';

import CardDisplay from "./CardDisplay";

function HandCards({ cards }) {
    var cardsEntities = [];
    for (var i = 0; i < cards.length; i++) {
        cardsEntities.push(<CardDisplay key={i} entity={cards[i]} inHand={true} />);
    }
    return <>{cardsEntities}</>;
}

class EnemyHandDisplay extends Component {
    render() {
        const { cards } = this.props;

        return (
            <div className="player-hand">
                <HandCards cards={cards} />
            </div>
        );
    }
}

export default EnemyHandDisplay;
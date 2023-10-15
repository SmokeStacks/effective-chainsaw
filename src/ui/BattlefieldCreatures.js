import React, { Component } from 'react';

import BattleCardDisplay from "./BattleCardDisplay";

function BattleCards({ cards, onCardSelect }) {
    var cardsEntities = [];
    for (var i = 0; i < cards.length; i++) {
        cardsEntities.push(<BattleCardDisplay key={i} entity={cards[i]} onCardSelect={onCardSelect} />);
    }
    return <>{cardsEntities}</>;
}

class BattlefieldCreatures extends Component {
    render() {
        const { cards, onCardSelect } = this.props;

        return (
            <div className="battlefield-creatures">
                <BattleCards cards={cards} onCardSelect={onCardSelect} />
            </div>
        );
    }
}

export default BattlefieldCreatures;
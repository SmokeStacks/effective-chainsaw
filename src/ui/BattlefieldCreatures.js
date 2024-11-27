import React, { Component } from 'react';

import Card from "./renders/Card";

function BattleCards({ cards, onCardSelect, onSlotSelect }) {
    return (
        <div className="battle-cards">
            {cards.map((card, index) => (
                <div 
                    key={index} 
                    className="battle-slot" 
                    onClick={() => onSlotSelect(index)}
                >
                    {card && <Card key={index} entity={cards[index]} onCardSelect={onCardSelect} inHand={false}/>}
                </div>
            ))}
        </div>
    );
}

class BattlefieldCreatures extends Component {
    render() {
        const { cards, onCardSelect, onSlotSelect } = this.props;

        return (
            <div className="battlefield-creatures">
                <BattleCards cards={cards} onCardSelect={onCardSelect} onSlotSelect={onSlotSelect}/>
            </div>
        );
    }
}

export default BattlefieldCreatures;
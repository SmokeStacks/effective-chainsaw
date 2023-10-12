import React, { Component } from 'react';

//import { Graveyard, Hand, Realm, Library, Focus, Card, CardEntity } from '../rules/cards';

import PlayerHandDisplay from "./PlayerHandDisplay";
import Actions from "./Actions";
import HUD from './HUD';
import FocusDisplay from './FocusDisplay';

class Gameboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentRealmIndex: 0
        }

        this.handlePanLeft = this.handlePanLeft.bind(this);
        this.handlePanRight = this.handlePanRight.bind(this);
    }

    handlePanLeft = () => {
        if (this.state.currentRealmIndex > 0) {
            this.setState({ currentRealmIndex: this.state.currentRealmIndex - 1 });
        }
    };

    handlePanRight = () => {
        if (this.state.currentRealmIndex < this.props.realms.length - 2) {
            this.setState({ currentRealmIndex: this.state.currentRealmIndex + 1 });
        }
    };

    render() {
        const { playerOneHand, playerDraft, playerDraw, playerWounds, playerBits, playerDebt, playerGainBits, playerAshes, realms } = this.props;
        const currentRealm = realms[this.state.currentRealmIndex];
        const nextRealm = realms[this.state.currentRealmIndex + 1];

        return (
            <div className="game-boardz">
                <div className="board-top">
                    <button
                        className="nav-button pan-left-button"
                        onClick={this.handlePanLeft}
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <div className="realms-container">
                        {realms[this.state.currentRealmIndex]}
                        {realms[this.state.currentRealmIndex + 1]}
                    </div>
                    <button
                        className="nav-button pan-right-button"
                        onClick={this.handlePanRight}
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
                <div className="board-bottom">
                    <div className="action-hud">
                        <Actions playerDraw={playerDraw} playerDraft={playerDraft} playerGainBits={playerGainBits} />
                        <FocusDisplay />
                        <HUD ashes={playerAshes} wounds={playerWounds} bits={playerBits} debt={playerDebt}/>
                    </div>
                    <PlayerHandDisplay cards={playerOneHand} />
                </div>
            </div>
        );
    }
}

export default Gameboard;
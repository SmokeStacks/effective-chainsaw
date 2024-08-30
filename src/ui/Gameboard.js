import React, { Component } from 'react';

//import { Graveyard, Hand, Realm, Library, Focus, Card, CardEntity } from '../rules/cards';

import PlayerHandDisplay from "./PlayerHandDisplay";
import EnemyHandDisplay from "./PlayerHandDisplay";
import TimeController from "./TimeController";
import Actions from "./Actions";
import HUD from './HUD';
import FocusDisplay from './FocusDisplay';
//import ConfirmButton from './ConfirmButton';
import BattlefieldCreatures from './BattlefieldCreatures';

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
        if (this.state.currentRealmIndex < this.props.realmComponents.length - 2) {
            this.setState({ currentRealmIndex: this.state.currentRealmIndex + 1 });
        }
    };

    render() {
        const {
            playerOneHand,
            playerDraft,
            playerDraw,
            playerBoost,
            playerWounds,
            playerBits,
            playerDebt,
            playerMine,
            playerActions,
            playerFate,
            playerBurden,
            playerAshes,
            realmComponents,
            onCardSelect,
            onRealmSelect,
            playerSolarium,
            playerTheater,
            playerUnderpass,
            playerGrid,
            enemySolarium,
            enemyTheater,
            enemyUnderpass,
            enemyGrid,
            onRealmCardSelect,
            enemyBattleSlots,
            playerBattleSlots,
            attackMode,
            onQuest,
            onSlotSelect,
            onBattleCardSelect,
            onConfirmDefenseSelection,
            onPlayerBattle,
            awaitingSacrifices,
            onSacrificeConfirmation,
            onRezPlayerCard,
            enemyHand,
            onPlayerTurn,
            onEnemyTurn,
            gameState,
            battleRealm,
            onRaid
        } = this.props;

        const displayedRealms = [
            realmComponents[this.state.currentRealmIndex],
            realmComponents[this.state.currentRealmIndex + 1]
        ];

        const playerRealmsState = {
            Solarium: playerSolarium,
            Theater: playerTheater,
            Underpass: playerUnderpass,
            Grid: playerGrid,
        };

        const enemyRealmsState = {
            Solarium: enemySolarium,
            Theater: enemyTheater,
            Underpass: enemyUnderpass,
            Grid: enemyGrid,
        };

        return (
            <div className="game-boardz">
                <EnemyHandDisplay cards={enemyHand} />
                <div className="board-top">
                    <button
                        className="nav-button pan-left-button"
                        onClick={this.handlePanLeft}
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <div className="realms-container">
                        {displayedRealms.map((RealmComponent, index) => {
                            return (
                                <RealmComponent
                                    key={index}
                                    onRealmSelect={() => onRealmSelect(RealmComponent.name)}
                                    onRealmCardSelect={onRealmCardSelect}
                                    onRezPlayerCard={onRezPlayerCard}
                                    playerState={playerRealmsState[RealmComponent.name]}
                                    enemyState={enemyRealmsState[RealmComponent.name]}
                                    name={RealmComponent.name}
                                />
                            );
                        })}
                    </div>
                    <button
                        className="nav-button pan-right-button"
                        onClick={this.handlePanRight}
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
                <div className="board-bottom">
                    <div className={`battlefield ${battleRealm ? battleRealm.toLowerCase() : ''}`}>
                        <BattlefieldCreatures cards={enemyBattleSlots} />
                        <BattlefieldCreatures cards={playerBattleSlots} onCardSelect={onBattleCardSelect} onSlotSelect={onSlotSelect} />
                    </div>
                    <div className="action-hud">
                        <Actions
                            playerDraw={playerDraw}
                            playerDraft={playerDraft}
                            playerBoost={playerBoost}
                            playerMine={playerMine}
                            attackMode={attackMode}
                            onQuest={onQuest}
                            onRaid={onRaid}
                            onConfirmDefenseSelection={onConfirmDefenseSelection}
                            onPlayerBattle={onPlayerBattle}
                        />
                        <FocusDisplay awaitingSacrifices={awaitingSacrifices} onSacrificeConfirmation={onSacrificeConfirmation} />
                        <HUD
                            ashes={playerAshes}
                            wounds={playerWounds}
                            bits={playerBits}
                            debt={playerDebt}
                            actions={playerActions}
                            fate={playerFate}
                            burden={playerBurden}
                            surge={0}
                            wishes={0}
                        />
                    </div>
                    <TimeController onPlayerTurn={onPlayerTurn} onEnemyTurn={onEnemyTurn} gameState={gameState} />
                    <PlayerHandDisplay cards={playerOneHand} onCardSelect={onCardSelect} />
                </div>
            </div>
        );
    }
}

export default Gameboard;
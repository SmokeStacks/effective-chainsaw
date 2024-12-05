import React, { Component } from 'react';

//import { Graveyard, Hand, Realm, Library, Focus, Card, CardEntity } from '../rules/cards';

import PlayerHandDisplay from "./PlayerHandDisplay";
import EnemyHandDisplay from "./PlayerHandDisplay";
import Actions from "./Actions";
import HUD from './HUD';
import FocusDisplay from './FocusDisplay';
//import ConfirmButton from './ConfirmButton';
import BattlefieldCreatures from './BattlefieldCreatures';
import Modal from './Modal';
import { Elysium } from './renders/Board';

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
            playerMine,
            playerDevelop,
            playerDetox,
            onAbilityClick,
            playerActions,
            playerFate,
            playerBurden,
            playerAshes,
            playerSurge,
            playerOverload,
            enemyWounds,
            enemyBits,
            enemyDebt,
            enemyActions,
            enemyFate,
            enemyBurden,
            enemyAshes,
            enemySurge,
            enemyOverload,
            realmComponents,
            onCardSelect,
            onRealmSelect,
            onFocusSelect,
            awaitingFocus,
            focus,
            onServerSelect,
            playerSolarium,
            playerTheater,
            playerUnderpass,
            playerGrid,
            playerElysium,
            enemySolarium,
            enemyTheater,
            enemyUnderpass,
            enemyGrid,
            enemyElysium,
            onRealmCardSelect,
            enemyBattleSlots,
            playerBattleSlots,
            attackMode,
            onSlotSelect,
            onBattleCardSelect,
            onConfirmDefenseSelection,
            onPlayerBattle,
            awaitingSacrifices,
            onSacrificeConfirmation,
            onRezPlayerCard,
            enemyHand,
            battleRealm,
            onQuest,
            onRaid,
            onHack,
            trashPromptVisible,
            currentPromptCard,
            handleTrashDecision,
            modalVisible,
            modalProps,
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
            Elysium: playerElysium,
        };

        const enemyRealmsState = {
            Solarium: enemySolarium,
            Theater: enemyTheater,
            Underpass: enemyUnderpass,
            Grid: enemyGrid,
            Elysium: enemyElysium,
        };

        return (
            <div className="screen">
                <div className="left-side">
                    {/* <EnemyHandDisplay cards={enemyHand} /> */}
                    <div className="board-top">
                        <button
                            className="nav-button pan-left-button"
                            onClick={this.handlePanLeft}
                        >
                            <div className='pan-arrow'>REGRESS</div>
                        </button>
                        <div className="realms-container">
                            {displayedRealms.map((RealmComponent, index) => {
                                return (
                                    <RealmComponent
                                        key={index}
                                        onRealmSelect={() => onRealmSelect(RealmComponent.name)}
                                        onServerSelect={onServerSelect}
                                        onRealmCardSelect={onRealmCardSelect}
                                        onRezPlayerCard={onRezPlayerCard}
                                        onAbilityClick={onAbilityClick}
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
                            <div className='pan-arrow'>PREDICT</div>
                        </button>
                    </div>
                    {attackMode === 'PLAYER_QUEST' || attackMode === 'PLAYER_RAID' || attackMode === 'PLAYER_HACK' || attackMode === 'ENEMY_magi' || attackMode === 'ENEMY_phys' || attackMode === 'ENEMY_tech' ?
                        <div className={`battlefield ${battleRealm ? battleRealm.toLowerCase() : ''}`}>
                            {battleRealm}
                            <BattlefieldCreatures cards={enemyBattleSlots} />
                            <BattlefieldCreatures cards={playerBattleSlots} onCardSelect={onBattleCardSelect} onSlotSelect={onSlotSelect} />
                        </div> :
                        null}
                    <div className="buttons-container">
                        <Actions
                            playerDraw={playerDraw}
                            playerDraft={playerDraft}
                            playerBoost={playerBoost}
                            playerMine={playerMine}
                            playerDevelop={playerDevelop}
                            playerDetox={playerDetox}
                            attackMode={attackMode}
                            onQuest={onQuest}
                            onRaid={onRaid}
                            onHack={onHack}
                            onConfirmDefenseSelection={onConfirmDefenseSelection}
                            onPlayerBattle={onPlayerBattle}
                        />
                        <FocusDisplay awaitingFocus={awaitingFocus} focus={focus} onFocusSelect={onFocusSelect} awaitingSacrifices={awaitingSacrifices} onSacrificeConfirmation={onSacrificeConfirmation} />
                    </div>
                    {attackMode === 'PLAYER_QUEST' || attackMode === 'PLAYER_RAID' || attackMode === 'PLAYER_HACK' || attackMode === 'ENEMY_magi' || attackMode === 'ENEMY_phys' || attackMode === 'ENEMY_tech' ?
                        null :
                        <PlayerHandDisplay cards={playerOneHand} onCardSelect={onCardSelect} />}
                </div>
                <div className="status-menu">
                    <HUD
                        ashes={playerAshes}
                        wounds={playerWounds}
                        bits={playerBits}
                        overload={playerOverload}
                        actions={playerActions}
                        fate={playerFate}
                        burden={playerBurden}
                        surge={playerSurge}
                        enemyAshes={enemyAshes}
                        enemyWounds={enemyWounds}
                        enemyBits={enemyBits}
                        enemyDebt={enemyDebt}
                        enemyActions={enemyActions}
                        enemyFate={enemyFate}
                        enemyBurden={enemyBurden}
                        enemySurge={enemySurge}
                        enemyOverload={enemyOverload}
                        enemyHand={enemyHand}
                    />
                </div>
                {modalVisible && <Modal {...modalProps} />}
            </div>
        );
    }
}

export default Gameboard;
import React, { Component } from 'react';

import PlayerHandDisplay from "./PlayerHandDisplay";
import Actions from "./Actions";
import HUD from './HUD';
import FocusDisplay from './FocusDisplay';
import BattlefieldCreatures from './BattlefieldCreatures';
import RealmCreatures from './RealmCreatures';
import Modal from './Modal';

const REALM_NAMES = ['solarium', 'theater', 'underpass', 'grid', 'elysium'];
const REALM_LABELS = ['SOLARIUM', 'TRENCHES', 'IRL', 'NEXUS', 'ELYSIUM'];

class Gameboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentRealmIndex: 0,
            showHand: true,
        };
    }

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
            modalVisible,
            modalProps,
            selectedCard,
            selectedInHand,
            onCancelSelection,
        } = this.props;

        const { currentRealmIndex, showHand } = this.state;

        const playerRealmsState = {
            solarium: playerSolarium,
            theater: playerTheater,
            underpass: playerUnderpass,
            grid: playerGrid,
            elysium: playerElysium,
        };

        const enemyRealmsState = {
            solarium: enemySolarium,
            theater: enemyTheater,
            underpass: enemyUnderpass,
            grid: enemyGrid,
            elysium: enemyElysium,
        };

        const currentRealmName = REALM_NAMES[currentRealmIndex];
        const CurrentRealmComponent = realmComponents[currentRealmIndex];
        const currentPlayerEntities = (playerRealmsState[currentRealmName] || {}).people || [];

        const inTargetingMode = !!(selectedInHand && selectedCard);

        const renderBottomPanel = () => {
            // In targeting mode, always show the player's entities so they can pick a target.
            // Otherwise, hand or entities based on the toggle.
            if (showHand && !inTargetingMode) {
                return <PlayerHandDisplay cards={playerOneHand} onCardSelect={onCardSelect} />;
            }
            return (
                <div className="player-entities-panel">
                    <RealmCreatures
                        cards={currentPlayerEntities}
                        onCardSelect={onRealmCardSelect}
                        onRezPlayerCard={onRezPlayerCard}
                        isPlayerCard={true}
                    />
                </div>
            );
        };

        const battleActive = attackMode === 'PLAYER_QUEST' || attackMode === 'PLAYER_RAID' ||
            attackMode === 'PLAYER_HACK' || attackMode === 'ENEMY_magi' ||
            attackMode === 'ENEMY_phys' || attackMode === 'ENEMY_tech';

        return (
            <div className="screen">
                <div className="left-side">
                    {/* Realm tab navigation */}
                    <div className="realm-tabs">
                        {REALM_LABELS.map((label, i) => (
                            <button
                                key={i}
                                className={`realm-tab${currentRealmIndex === i ? ' realm-tab--active' : ''}`}
                                onClick={() => this.setState({ currentRealmIndex: i })}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Single realm display */}
                    <div className="board-main">
                        {CurrentRealmComponent && (
                            <CurrentRealmComponent
                                onRealmSelect={() => onRealmSelect(currentRealmName)}
                                onServerSelect={onServerSelect}
                                onRealmCardSelect={onRealmCardSelect}
                                onRezPlayerCard={onRezPlayerCard}
                                onAbilityClick={onAbilityClick}
                                playerState={playerRealmsState[currentRealmName]}
                                enemyState={enemyRealmsState[currentRealmName]}
                            />
                        )}
                        {battleActive && (
                            <div className={`battlefield ${battleRealm ? battleRealm.toLowerCase() : ''}`}>
                                {battleRealm}
                                <BattlefieldCreatures cards={enemyBattleSlots} />
                                <BattlefieldCreatures cards={playerBattleSlots} onCardSelect={onBattleCardSelect} onSlotSelect={onSlotSelect} />
                            </div>
                        )}
                    </div>

                    {/* Action bar */}
                    <div className="action-bar">
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
                        <FocusDisplay
                            awaitingFocus={awaitingFocus}
                            focus={focus}
                            onFocusSelect={onFocusSelect}
                            awaitingSacrifices={awaitingSacrifices}
                            onSacrificeConfirmation={onSacrificeConfirmation}
                        />
                        {!inTargetingMode && (
                            <button
                                className={`panel-toggle-btn${!showHand ? ' panel-toggle-btn--active' : ''}`}
                                onClick={() => this.setState(prev => ({ showHand: !prev.showHand }))}
                            >
                                {showHand ? '[ ENTITIES ]' : '[ HAND ]'}
                            </button>
                        )}
                        {inTargetingMode && (
                            <span className="targeting-label-bar">TARGETING — pick a card or realm</span>
                        )}
                    </div>

                    {/* Bottom panel: hand / player entities / targeting */}
                    <div className="bottom-panel">
                        {renderBottomPanel()}
                    </div>
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
                        selectedCard={selectedCard}
                        selectedInHand={selectedInHand}
                        onCancelSelection={onCancelSelection}
                        onRezPlayerCard={onRezPlayerCard}
                    />
                </div>
                {modalVisible && <Modal {...modalProps} />}
            </div>
        );
    }
}

export default Gameboard;
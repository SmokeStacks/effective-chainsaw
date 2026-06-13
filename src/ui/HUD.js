import React, { Component } from 'react';
import { imgObj } from './Tools';

class StatRow extends Component {
    render() {
        const { label, value, highlight } = this.props;
        return (
            <div className={`hud-stat-row${highlight ? ' hud-stat-row--highlight' : ''}`}>
                <span className="hud-stat-label">{label}</span>
                <span className="hud-stat-value">{value}</span>
            </div>
        );
    }
}

class HUD extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        const {
            bits,
            actions,
            ashes,
            fate,
            overload,
            burden,
            wounds,
            surge,
            enemyWounds,
            enemyBits,
            enemyOverload,
            enemyActions,
            enemyFate,
            enemyBurden,
            enemyAshes,
            enemySurge,
            enemyHand,
            selectedCard,
            selectedInHand,
            onCancelSelection,
            onRezPlayerCard,
        } = this.props;

        const inTargetingMode = !!(selectedInHand && selectedCard);

        return (
            <div className="hud">
                {/* Hostile stats */}
                <div className="hud-section hud-section--hostile">
                    <div className="hud-section-title">HOSTILE</div>
                    <StatRow label="WOUNDS" value={enemyWounds} highlight={enemyWounds > 0} />
                    <StatRow label="BURDEN" value={enemyBurden} highlight={enemyBurden > 0} />
                    <StatRow label="OVERLOAD" value={enemyOverload} highlight={enemyOverload > 0} />
                    <StatRow label="FATE" value={enemyFate} />
                    <StatRow label="BITS" value={enemyBits} />
                    <StatRow label="ASH" value={enemyAshes} />
                    <StatRow label="SURGE" value={enemySurge} />
                    <StatRow label="ACTIONS" value={enemyActions} />
                    <StatRow label="HEADSPACE" value={enemyHand ? enemyHand.length : 0} />
                </div>

                <div className="hud-divider" />

                {/* Player stats */}
                <div className="hud-section hud-section--player">
                    <div className="hud-section-title">PLAYER</div>
                    <StatRow label="WOUNDS" value={wounds} highlight={wounds > 0} />
                    <StatRow label="BURDEN" value={burden} highlight={burden > 0} />
                    <StatRow label="OVERLOAD" value={overload} highlight={overload > 0} />
                    <StatRow label="FATE" value={fate} />
                    <StatRow label="BITS" value={bits} />
                    <StatRow label="ASH" value={ashes} />
                    <StatRow label="SURGE" value={surge} />
                    <StatRow label="ACTIONS" value={actions} />
                </div>

                {/* Selected card preview — shown only when targeting */}
                {inTargetingMode && (
                    <>
                        <div className="hud-divider" />
                        <div className="hud-section hud-section--selected">
                            <div className="hud-section-title">SELECTED</div>
                            {selectedCard.card && imgObj[selectedCard.card.name] && (
                                <img
                                    className="hud-card-art"
                                    src={imgObj[selectedCard.card.name]}
                                    alt={selectedCard.card.name}
                                />
                            )}
                            <div className="hud-selected-name">{selectedCard.card ? selectedCard.card.name : '—'}</div>
                            <div className="hud-selected-type">{selectedCard.card ? selectedCard.card.category : ''}</div>
                            {selectedCard.card && selectedCard.card.rezCost !== undefined && (
                                <div className="hud-selected-cost">REZ: {selectedCard.card.rezCost} bits</div>
                            )}
                            <div className="hud-selected-hint">Click realm to install</div>
                            <button className="hud-cancel-btn" onClick={onCancelSelection}>CANCEL</button>
                        </div>
                    </>
                )}
            </div>
        );
    }
}

export default HUD;
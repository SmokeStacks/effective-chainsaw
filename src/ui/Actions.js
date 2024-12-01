import React, { Component } from 'react';
import { Button } from 'react-bootstrap';

class Actions extends Component {
    constructor(props) {
        super(props);
        this.state = {}

        this.actionClick = this.actionClick.bind(this);
    }

    actionClick = (type) => {
        console.log('click ', type)
    };

    render() {
        const { playerDraft, playerDraw, playerMine, playerDevelop, playerDetox,attackMode, onConfirmDefenseSelection, onPlayerBattle, playerBoost, onRaid, onQuest, onHack } = this.props;

        const renderQuestAction = () => {
            if (attackMode === 'PLAYER_QUEST') {
                return (
                    <div className="action-item" onClick={onPlayerBattle}>CONFIRM</div>
                );
            }
            if (attackMode === 'ENEMY_magi') {
                return (
                    <div className="action-item" onClick={onConfirmDefenseSelection}>CONFIRM</div>
                );
            }
            return (
                <div className="action-item" onClick={onQuest}>EXPLORE</div>
            );
        };

        const renderRaidAction = () => {
            if (attackMode === 'PLAYER_RAID') {
                return (
                    <div className="action-item" onClick={onPlayerBattle}>CONFIRM</div>
                );
            }
            if (attackMode === 'ENEMY_phys') {
                return (
                    <div className="action-item" onClick={onConfirmDefenseSelection}>CONFIRM</div>
                );
            }
            return (
                <div className="action-item" onClick={onRaid}>RAID</div>
            );
        };

        const renderHackAction = () => {
            if (attackMode === 'PLAYER_HACK') {
                return (
                    <div className="action-item" onClick={onPlayerBattle}>CONFIRM</div>
                );
            }
            if (attackMode === 'ENEMY_tech') {
                return (
                    <div className="action-item" onClick={onConfirmDefenseSelection}>CONFIRM</div>
                );
            }
            return (
                <div className="action-item" onClick={onHack}>HACK</div>
            );
        };
        // todo1 
        return (
            <div className="action-menu">
                <div className="action-item" onClick={() => playerDraw()}>DRAW</div>
                <div className="action-item" onClick={() => playerDraft()}>DRAFT</div>
                <div className="action-item" onClick={() => playerMine()}>PHISH</div>
                <div className="action-item" onClick={() => playerBoost()}>BOOST</div>
                <div className="action-item" onClick={() => playerDevelop()}>DEVELOP</div>
                <div className="action-item" onClick={() => playerDetox('PLAYER')}>DETOX</div>
                {renderQuestAction()}
                {renderRaidAction()}
                {renderHackAction()}
            </div>
        );
    }

}

export default Actions;

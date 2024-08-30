import React, { Component } from 'react';
import { Button } from 'react-bootstrap';

const mineIcon = "https://i.pinimg.com/564x/b2/85/4c/b2854c4650a40b8f571034b6824e51a7.jpg";

const drawIcon = "https://cdn2.iconfinder.com/data/icons/hands-3/100/hold_card-512.png";
const drafticon = "https://media.istockphoto.com/id/1455786040/vector/identification-icon-with-silhouette-of-a-person-vector.jpg?s=612x612&w=0&k=20&c=30EYofP2hmvTsxDTDf-g_oPOsfMjfRqdR5St34k3MVg=";
const promoIcon = "https://static.thenounproject.com/png/1590801-200.png";
const timerIcon = 'https://cdn-icons-png.flaticon.com/512/992/992700.png'
const wishIcon = 'https://cdn.pixabay.com/photo/2016/12/18/11/02/star-1915449_1280.png';

const questIcon = 'https://cdn-icons-png.flaticon.com/512/1299/1299456.png';
const raidIcon = 'https://t4.ftcdn.net/jpg/04/65/06/67/360_F_465066712_3UrkO1MQ1jMyrmgE0VdDn8Qfi95aKvAE.jpg';
const hackIcon = 'https://static.vecteezy.com/system/resources/thumbnails/000/569/420/small/vector60-3894-01.jpg';

class Actions extends Component {
    constructor(props) {
        super(props);
        this.state = {}

        this.actionClick = this.actionClick.bind(this);
    }

    actionClick = (type) => {
        console.log('click ', type)
        if (type === 'QUEST') {
            this.props.onQuest();
        }
    };

    render() {
        const { playerDraft, playerDraw, playerMine, attackMode, onConfirmDefenseSelection, onPlayerBattle, playerBoost, onRaid, onQuest } = this.props;

        const renderQuestAction = () => {
            if (attackMode === 'PLAYER_QUEST') {
                return (
                    <div className="action">
                        <img className="big-icon" src={questIcon} alt="Quest Icon" />
                        <Button className="action-button" onClick={onPlayerBattle}>
                            Confirm
                        </Button>
                    </div>
                );
            }
            if (attackMode === 'ENEMY_magi') {
                return (
                    <div className="action">
                        <img className="big-icon" src={questIcon} alt="Quest Icon" />
                        <Button className="action-button" onClick={onConfirmDefenseSelection}>
                            Confirm
                        </Button>
                    </div>
                );
            }
            return (
                <div className="action">
                    <img className="big-icon" src={questIcon} alt="Quest Icon" />
                    <Button className="action-button blue-button" onClick={onQuest}>Quest</Button>
                </div>
            );
        };

        const renderRaidAction = () => {
            if (attackMode === 'PLAYER_RAID') {
                return (
                    <div className="action">
                        <img className="action-icon" src={raidIcon} alt="Raid Icon" />
                        <Button className="action-button" onClick={onPlayerBattle}>
                            Confirm
                        </Button>
                    </div>
                );
            }
            if (attackMode === 'ENEMY_phys') {
                return (
                    <div className="action">
                        <img className="action-icon" src={raidIcon} alt="Raid Icon" />
                        <Button className="action-button" onClick={onConfirmDefenseSelection}>
                            Confirm
                        </Button>
                    </div>
                );
            }
            return (
                <div className="action">
                    <img className="action-icon" src={raidIcon}></img>
                    <Button className="action-button red-button" onClick={onRaid}>
                        Raid
                    </Button>
                </div>
            );
        };

        return (

            <div className="action-list">
                <div className="actions">
                    <div className="action"><img className="action-icon" src={drawIcon}></img><Button className="action-button" onClick={() => playerDraw()}>Draw</Button></div>
                    <div className="action"><img className="action-icon" src={drafticon}></img><Button className="action-button" onClick={() => playerDraft()}>Draft</Button></div>
                    <div className="action"><img className="action-icon" src={mineIcon}></img><Button className="action-button" onClick={() => playerMine()}>Mine</Button></div>
                </div>
                <div className="actions">
                    <div className="action"><img className="big-icon" src={timerIcon}></img><Button className="action-button" onClick={() => playerBoost()}>Boost</Button></div>
                    <div className="action"><img className="action-icon" src={promoIcon}></img><Button className="action-button" onClick={() => this.actionClick('PROMOTE')}>Promote</Button></div>
                    <div className="action"><img className="big-icon" src={wishIcon}></img><Button className="action-button" onClick={() => this.actionClick('WISH')}>Wish</Button></div>
                </div>
                <div className="actions">
                    {renderQuestAction()}
                    {renderRaidAction()}
                    <div className="action"><img className="action-icon" src={hackIcon}></img><Button className="action-button yellow-button" onClick={() => this.actionClick('HACK')}>Hack</Button></div>
                </div>
            </div>
        );
    }

}

export default Actions;
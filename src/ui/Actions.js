import React, { Component } from 'react';
import { Button } from 'react-bootstrap';

import phishIcon from '../images/phishIcon.png'

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
        const { playerDraft, playerDraw, playerGainBits, playerAttackMode, onConfirmBattleSelection, onCancelSelection } = this.props;

        const renderQuestAction = () => {
            if (playerAttackMode === 'QUEST') {
                return (
                    <div className="action">
                        <Button className="action-button" onClick={onConfirmBattleSelection}>
                            <img className="action-icon" src="path_to_confirm_icon.png" alt="Confirm" />
                        </Button>
                        <Button className="action-button" onClick={onCancelSelection}>
                            <img className="action-icon" src="path_to_cancel_icon.png" alt="Cancel" />
                        </Button>
                    </div>
                );
            } else {
                return (
                    <div className="action">
                        <img className="big-icon" src={questIcon} alt="Quest Icon" />
                        <Button className="action-button blue-button" onClick={() => this.actionClick('QUEST')}>Quest</Button>
                    </div>
                );
            }
        };

        return (

            <div className="action-list">
                <div className="actions">
                    <div className="action"><img className="action-icon" src={drawIcon}></img><Button className="action-button" onClick={() => playerDraw(1)}>Draw</Button></div>
                    <div className="action"><img className="action-icon" src={drafticon}></img><Button className="action-button" onClick={() => playerDraft(1)}>Draft</Button></div>
                    <div className="action"><img className="action-icon" src={phishIcon}></img><Button className="action-button" onClick={() => playerGainBits(1)}>Phish</Button></div>
                </div>
                <div className="actions">
                    <div className="action"><img className="big-icon" src={timerIcon}></img><Button className="action-button" onClick={() => this.actionClick('BOOST')}>Boost</Button></div>
                    <div className="action"><img className="action-icon" src={promoIcon}></img><Button className="action-button" onClick={() => this.actionClick('PROMOTE')}>Promote</Button></div>
                    <div className="action"><img className="big-icon" src={wishIcon}></img><Button className="action-button" onClick={() => this.actionClick('WISH')}>Wish</Button></div>
                </div>
                <div className="actions">
                    {renderQuestAction()}
                    <div className="action"><img className="action-icon" src={raidIcon}></img><Button className="action-button red-button" onClick={() => this.actionClick('RAID')}>Raid</Button></div>
                    <div className="action"><img className="action-icon" src={hackIcon}></img><Button className="action-button yellow-button" onClick={() => this.actionClick('HACK')}>Hack</Button></div>
                </div>
            </div>
        );
    }

}

export default Actions;
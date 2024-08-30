import React, { Component } from 'react';

const heartIcon = "https://www.iconpacks.net/icons/2/free-heart-icon-3510-thumb.png";
const trashIcon = 'https://cdn-icons-png.flaticon.com/512/2891/2891491.png'
const timerIcon = 'https://cdn-icons-png.flaticon.com/512/992/992700.png'

class PlaceHP extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    render() {
        const { HP } = this.props;
        return (
            <div className="place-hp">
                {HP}
                <img className="heart-icon" src={heartIcon}></img>
            </div>
        );
    }
}

class ScrapCost extends Component {

    constructor(props) {
        super(props);
        this.state = {}
    }
    render() {
        const { scrap } = this.props;

        return (
            <div className="scrap-cost">
                {scrap}
                <img className="trash-icon" src={trashIcon}></img>
            </div>
        );
    }
}


class BottomSection extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    render() {
        const { category, HP, timer, scrap, text, mode, steps } = this.props;

        return (
            <div className="bottom">
                {mode !== "SHORT" && <div className="text">{text}</div>}
                {category == "LANDMARK" && <PlaceHP HP={HP} />}
                {category == "LOCATION" && <PlaceHP HP={HP} />}
                {category == "SNIP" && <ScrapCost scrap={scrap} />}
                {category == "CREATURE" && (
                    <div className="timer-container">
                        <div className="timer">{steps ? timer-steps: timer}</div>
                        <img
                            className="timer-icon"
                            src={timerIcon}
                        ></img>
                    </div>
                )}
            </div>
        );
    }
}

export default BottomSection;
import React, { Component } from 'react';

const gemIcon =
    "data:image/png;base64,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";

const imageWIP =
    "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";

class Stats extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    render() {
        const { magi, phys, tech, WIS, STR, DEX, HP } = this.props;

        return (
            <div className="stats">
                <div className="attack-block">
                    {magi && <div className="blue-stat">{WIS}</div>}
                    {phys && <div className="red-stat">{STR}</div>}
                    {tech && <div className="yellow-stat">{DEX}</div>}
                </div>
                <div className="creature-hp">{HP}</div>
            </div>
        );
    }
}

class Runes extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    render() {
        const { runes } = this.props;

        return (
            <div className="score">
                <div className="runes">
                    <div>{runes}</div>
                    <img className="runes-icon" src={gemIcon}></img>
                </div>
            </div>
        );
    }
}

class MidSection extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    render() {
        const { runes, category, magi, phys, tech, WIS, STR, DEX, HP } = this.props;

        return (
            <div className="mid">
                {category === "ENTITY" && (
                    <Stats
                        magi={magi}
                        phys={phys}
                        tech={tech}
                        WIS={WIS}
                        STR={STR}
                        DEX={DEX}
                        HP={HP}
                    />
                )}
                {category === "LANDMARK" && <Runes runes={runes} />}
                {category === "SYM" && <Runes runes={runes} />}
            </div>
        );
    }
}

export default MidSection;
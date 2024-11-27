import React, { Component } from 'react';

import BottomSection from "./BottomSection";
import MidSection from "./MidSection";

import dnaIcon from '../images/repeat.png'

const promoIcon = "https://static.thenounproject.com/png/1590801-200.png";
const soulIcon = "https://www.svgrepo.com/download/192067/ghost.svg";

class SoulAndAsh extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        const { ash, soul } = this.props;

        const soulIcons = [];
        for (let i = 0; i < soul; i++) {
            soulIcons.push(
                <img
                    key={i}
                    className="soul-icon"
                    src={soulIcon}
                />
            );
        }

        return (
            <div className="soul-ash-container">
                {soul > 0 && <div>{soulIcons}</div>}
                {ash > 0 && <div className="ash">
                    {ash}
                    <img className="ash-icon" src={dnaIcon}></img>
                </div>}
            </div>
        );
    }
}

class Title extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    render() {
        const { ash, category, name, soul } = this.props;

        return (
            <div className="title-container">
                <div className="title">{name}</div>
                {category !== "LANDMARK" && category !== "SYM" && (
                    <div className="cat-right">{category}</div>
                )}
                {category == "LANDMARK" && <div className="cat-left">{category}</div>}
                {category == "SYM" && <div className="cat-left">{category}</div>}
            </div>
        );
    }
}

class RezCost extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    render() {
        const { rezCost } = this.props;

        return (
            <div className="rez">
                {rezCost}
                <img
                    className="rez-icon"
                    src="https://cdn4.iconfinder.com/data/icons/biticon-weather-line/24/weather_sun_sunny_day-512.png"
                ></img>
            </div>
        );
    }
}

class Plot extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    render() {
        const { plot } = this.props;

        return (
            <div className="promo">
                {plot}
                <img className="promo-icon" src={promoIcon}></img>
            </div>
        );
    }
}

class BattleCardDisplay extends Component {
    constructor(props) {
        super(props)

        this.state = {}
    }

    render() {
        const {
            category,
            plot,
            name,
            rezCost,
            soul,
            ash,
            runes,
            magi,
            phys,
            tech,
            WIS,
            STR,
            DEX,
            HP,
            timer,
            scrap,
            text,
            flavor,
            art
        } = this.props.entity.card;

        const {
            onCardSelect,
            entity,
            mode
        } = this.props;

        const isCreatureOrRitual = category === "ENTITY" || category === "RITUAL";
        const isOtherCategory =
            category === "SNIP" ||
            category === "SYM" ||
            category === "LANDMARK" ||
            category === "LOCATION";
        const isMundane = category !== "LANDMARK" && category !== "SYM";

        return (
            <div className="card card-realm battle-card" onClick={() => onCardSelect(entity, inHand)}>
                <div className="top-bar">
                    {<RezCost rezCost={rezCost} />}
                    <Title ash={category} name={name} category={category} soul={soul} />
                    {plot && <Plot plot={plot} />}
                    {category == "ENTITY" && <SoulAndAsh ash={ash} soul={soul} />}
                    {category == "RITUAL" && <SoulAndAsh ash={ash} oul={soul} />}
                </div>
                <MidSection
                    runes={runes}
                    category={category}
                    magi={magi}
                    phys={phys}
                    tech={tech}
                    WIS={WIS}
                    STR={STR}
                    DEX={DEX}
                    HP={HP-entity.wounds}
                    plot={plot}
                />
                <BottomSection
                        category={category}
                        HP={HP-entity.wounds}
                        mode={'SHORT'}
                        scrap={scrap}
                        text={text}
                        timer={timer}
                        steps={entity.steps} // todo
                    />
            </div>
        );
    }
}

export default BattleCardDisplay;
import React, { Component } from 'react';

import BottomSection from "./BottomSection";
import MidSection from "./MidSection";

import dnaIcon from '../images/dna.png'

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

class PromoCost extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    render() {
        const { promoCost } = this.props;

        return (
            <div className="promo">
                {promoCost}
                <img className="promo-icon" src={promoIcon}></img>
            </div>
        );
    }
}

class CardDisplay extends Component {
    constructor(props) {
        super(props)

        this.state = {}
    }

    render() {
        const {
            category,
            promoCost,
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
        } = this.props.card;

        const isCreatureOrRitual = category === "CREATURE" || category === "RITUAL";
        const isOtherCategory =
            category === "SNIP" ||
            category === "SYM" ||
            category === "LANDMARK" ||
            category === "LOCATION";
        const isMundane = category !== "LANDMARK" && category !== "SYM";

        if (isCreatureOrRitual) {
            return (
                <div className="card">
                    <div className="top-bar">
                        {<RezCost rezCost={rezCost} />}
                        <Title ash={category} name={name} category={category} soul={soul} />
                        {promoCost && <PromoCost promoCost={promoCost} />}
                        {category == "CREATURE" && <SoulAndAsh ash={ash} soul={soul} />}
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
                        HP={HP}
                        promoCost={promoCost}
                    />
                    <BottomSection
                        category={category}
                        HP={HP}
                        scrap={scrap}
                        text={text}
                        timer={timer}
                    />
                </div>
            );
        } else if (isOtherCategory) {
            return (
                <div className="card">
                    <div className="top-bar">
                        {isMundane && <RezCost rezCost={rezCost} />}
                        <Title category={category} name={name} />
                        {promoCost && <PromoCost promoCost={promoCost} />}
                    </div>
                    <BottomSection
                        category={category}
                        HP={HP}
                        scrap={scrap}
                        text={text}
                        timer={timer}
                    />
                    <MidSection
                        runes={runes}
                        category={category}
                        magi={magi}
                        phys={phys}
                        tech={tech}
                        WIS={WIS}
                        STR={STR}
                        DEX={DEX}
                        HP={HP}
                        promoCost={promoCost}
                    />
                </div>
            );
        } else {
            return null;
        }
    }
}

export default CardDisplay;
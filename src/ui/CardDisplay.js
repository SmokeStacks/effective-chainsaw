import React, { Component } from 'react';

// import BottomSection from "./BottomSection";
// import MidSection from "./MidSection";

// import dnaIcon from '../images/repeat.png'

// const promoIcon = "https://static.thenounproject.com/png/1590801-200.png";
// const soulIcon = "https://www.svgrepo.com/download/192067/ghost.svg";

import Card from "./renders/Card";
import LCard from "./renders/LCard";
import SCard from "./renders/SCard";
import RCard from "./renders/RCard";

import { imgObj } from "./Tools"; 

class CardDisplay extends Component {
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
            power,
            HP,
            timer,
            scrap,
            abilities,
            description,
            imgSrc,
            art
        } = this.props.entity.card;

        const {
            onCardSelect,
            entity
        } = this.props;

        switch (category) {
            case "ENTITY":
              return <Card imgSrc={imgObj[name]} {...this.props} />;
            case "LOCATION":
            case "LANDMARK":
              return <LCard imgSrc={imgObj[name]} {...this.props} />;
            case "SNIP":
            case "SYM":
              return <SCard imgSrc={imgObj[name]} {...this.props} />;
            case "RITUAL":
              return <RCard imgSrc={imgObj[name]} {...this.props} />;
            default:
              return null;
          }
    }
}

export default CardDisplay;
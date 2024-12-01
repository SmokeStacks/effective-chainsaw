//import "./styles.css";
import React, { Component } from "react";
import FeatherIcon from "feather-icons-react";

class MiniCard extends Component {
  renderSoulAshes(soul, ash) {
    if (soul > 0) {
      return (
        <div className="spirit">
          {soul > 1 && <span className="cost-number">{soul}</span>}
          <FeatherIcon className="icon" icon="user" />
        </div>
      );
    } else if (ash > 0) {
      return (
        <div className="spirit">
          {ash > 0 && <span className="cost-number">{ash}</span>}
          <FeatherIcon className="icon" icon="refresh-cw" />
        </div>
      );
    } else {
      return null;
    }
  }

  renderTypes(magi, phys, tech) {
    const types = [];
    if (magi) {
      types.push(
        <FeatherIcon key="magi" className="type-icon" icon="book-open" />
      );
    }
    if (phys) {
      types.push(
        <FeatherIcon key="phys" className="type-icon" icon="anchor" />
      );
    }
    if (tech) {
      types.push(
        <FeatherIcon key="tech" className="type-icon" icon="monitor" />
      );
    }
    if (types.length > 0) {
      return <div className="types">{types}</div>;
    } else {
      return null;
    }
  }

  render() {
    const {
      name,
      faction,
      subTypes,
      rezCost,
      soul,
      ash,
      magi,
      phys,
      tech,
      keywords,
      description,
      timer,
    } = this.props.entity.card;

    const {
      power,
      HP,
      steps,
      wounds,
      freeze,
      online,
    } = this.props.entity;

    const {
      inHand,
      onCardSelect,
      entity,
      imgSrc,
      onRezPlayerCard,
    } = this.props;

    return (
      <div className={`mini-card-container card-container ${faction}`} onClick={() => onCardSelect(entity, inHand)}>
        <div className="mini-art-container art-container">
          <img className="art" src={imgSrc} alt={name} />
          <div className="overlay-content">
            <div className="top-container">
              <div className="title-container">
                <div className={`name ${faction}`}>{name}</div>
              </div>
              {subTypes ? <div className="mini-type type">{subTypes}</div> : null}
            </div>
            {this.renderTypes(magi, phys, tech)}
            <div className="bottom-container">
              {keywords ? <div className="abilities">{keywords}</div> : null}
              <div className="body">
                <div className="power">
                  {power}
                  <FeatherIcon className="stats-icon" icon="crosshair" />
                </div>
                <div className="health">
                  <FeatherIcon className="stats-icon" icon="heart" />
                  {HP - wounds}
                </div>
              </div>
            </div>
            <div className={`mini-timer timer ${faction}`}>
              <div className="timer-content">
                {Math.max(0, timer - steps + freeze)}
                <FeatherIcon className="icon timer-icon" icon="clock" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default MiniCard;

//import "./styles.css";
import React, { Component } from "react";
import FeatherIcon from "feather-icons-react";

class LCard extends Component {
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

  renderTop(category, name, rezCost, faction) {
    const types = [];
    if (category === "LANDMARK") {
      return (
        <div className="top-container">
          <div className="title-container">
            <div className="rez">
              <FeatherIcon className="eye-icon" icon="sun" />
            </div>
            <div className={`name name-rune ${faction}`}>{name}</div>
          </div>
          <div className="type rune-type">{category.toLowerCase()}</div>
        </div>
      );
    }
    if (category === "LOCATION") {
      return (
        <div className="top-container">
          <div className="title-container">
            <div className={`name ${faction}`}>{name}</div>
            <div className="rez">
              <FeatherIcon className="eye-icon" icon="sun" />
              {rezCost}
            </div>
          </div>
          <div className="type">{category.toLowerCase()}</div>
        </div>
      );
    } else {
      return null;
    }
  }

  render() {
    const {
      category,
      faction,
      name,
      rezCost,
      magi,
      phys,
      tech,
      keywords,
      description,
      HP,
      plot,
      runes,
    } = this.props.entity.card;

    const {
      development,
      wounds
    } = this.props.entity;

    const {
      inHand,
      onCardSelect,
      entity,
      imgSrc,
  } = this.props;

    return (
      <div className={`card-container ${faction}`} onClick={() => onCardSelect(entity, inHand)}>
        <div className="art-container">
          <img className="art" src={imgSrc} alt={name} />
          <div className="overlay-content">
            {this.renderTop(category, name, rezCost, faction)}
            {this.renderTypes(magi, phys, tech)}
            <div className="bottom-container">
              {runes ? (
                <div className="runes-container">
                  <FeatherIcon className="icon star-icon" icon="star" />
                  {runes}
                </div>
              ) : null}
              {keywords ? <div className="abilities">{keywords}</div> : null}
              {description ? (
                <div className="description">{description}</div>
              ) : null}
              <div className="location-body">
                <div className="health">
                  <FeatherIcon className="stats-icon" icon="shield" />
                  {HP-wounds}
                </div>
              </div>
            </div>
            {plot ? (
              <div className={`timer ${faction}`}>
                <div className="timer-content">
                  <FeatherIcon className="icon plot-icon" icon="calendar" />
                  {plot-development}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

export default LCard;

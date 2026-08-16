//import "./styles.css";
import React, { Component } from "react";
import FeatherIcon from "feather-icons-react";
import virus from "../../images/virus.png";
import AbilityDescription from "./AbilityDescription";

class SCard extends Component {
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

  renderTop(category, name, rezCost, faction, onRezPlayerCard, entity, online) {
    if (category === "SYM") {
      return (
        <div className="top-container">
          <div className="title-container">
            <div className="rez">
              <FeatherIcon className="eye-icon" icon="eye-off" />
            </div>
            <div className={`name name-rune ${faction}`}>{name}</div>
          </div>
          <div className="type rune-type">{category.toLowerCase()}</div>
        </div>
      );
    }
    if (category === "SNIP") {
      return (
        <div className="top-container">
          <div className="title-container">
            <div className={`name ${faction}`}>{name}</div>
            <div className="rez" onClick={() => onRezPlayerCard(entity)}>
              <FeatherIcon className="eye-icon" icon={`${online ? 'sun' : 'eye-off'}`} />
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
      scrap,
      plot,
      runes,
    } = this.props.entity.card;

    const {
      development,
      online
    } = this.props.entity;

    const {
      inHand,
      onCardSelect,
      entity,
      imgSrc,
      onRezPlayerCard,
      revealed,
      onAbilityClick
    } = this.props;

    if (!entity.online && entity.owner === 'ENEMY' && !revealed) {
      return (
        <div className={`card-container ${faction}`} onClick={() => onCardSelect(entity, inHand)}>
          <div className="art-container">
            <img className="art" src={virus} alt='virus' />
            <div className="overlay-content">
              <div className="top-container">
                <div className="title-container">
                  <div className="rez">
                    <FeatherIcon className="eye-icon" icon="eye-off" />
                  </div>
                  <div className={`name name-rune ${faction}`}>Unknown</div>
                </div>
                {/* <div className="type rune-type">{category.toLowerCase()}</div> */}
              </div>
              {/* {this.renderTypes(magi, phys, tech)} */}
              <div className="bottom-container">
                {/* {runes ? (
                  <div className="runes-container">
                    <FeatherIcon className="icon star-icon" icon="star" />
                    {runes}
                  </div>
                ) : null} */}
                <div className="abilities">unknown</div>
                {/* {description ? (
                  <div className="description">{description}</div>
                ) : null} */}
                <div
                  className={
                    category === "SNIP" ? "location-body snip-body" : "location-body"
                  }
                >
                  {/* {scrap ? (
                    <div className="power">
                      <FeatherIcon className="icon plot-icon" icon="trash-2" />
                      {scrap}
                    </div>
                  ) : null} */}
                </div>
              </div>
                <div className={`timer ${faction}`}>
                  <div className="timer-content">
                    <FeatherIcon className="icon plot-icon" icon="calendar" />
                    {development ? `-${development}` : '?'}
                  </div>
                </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`card-container ${faction}`} onClick={() => onCardSelect(entity, inHand)}>
        <div className="art-container">
          <img className="art" src={imgSrc} alt={name} />
          <div className="overlay-content">
            {this.renderTop(category, name, rezCost, faction, onRezPlayerCard, entity, online)}
            {this.renderTypes(magi, phys, tech)}
            <div className="bottom-container">
              {runes ? (
                <div className="runes-container">
                  <FeatherIcon className="icon star-icon" icon="star" />
                  {runes}
                </div>
              ) : null}
              {keywords ? <div className="abilities">{keywords}</div> : null}
              <AbilityDescription
                description={description}
                entity={entity}
                onAbilityClick={onAbilityClick}
              />
              <div
                className={
                  category === "SNIP" ? "location-body snip-body" : "location-body"
                }
              >
                {scrap ? (
                  <div className="power">
                    <FeatherIcon className="icon plot-icon" icon="trash-2" />
                    {scrap}
                  </div>
                ) : null}
              </div>
            </div>
            {plot ? (
              <div className={`timer ${faction}`}>
                <div className="timer-content">
                  <FeatherIcon className="icon plot-icon" icon="calendar" />
                  {plot - development}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

export default SCard;

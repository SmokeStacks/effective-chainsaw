//import "./styles.css";
import React, { Component } from "react";
import FeatherIcon from "feather-icons-react";
import unknown from "../../images/unknown.png";


class Card extends Component {
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


  renderHiddenSteps(steps, freeze) {
    if(steps)
    {
      return(freeze > steps ? `${freeze - steps}` : `-${steps - freeze}`)
    } else {
      return(freeze)
    }
  }

  render() {
    const {
      name,
      faction,
      category,
      subTypes,
      rezCost,
      power,
      HP,
      runes,
      plot,
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
      revealed,
    } = this.props;


    if(!entity.online && entity.owner === 'ENEMY' && !revealed) {
      return (
        <div className={`card-container ${faction}`} onClick={() => onCardSelect(entity, inHand)}>
          <div className="art-container">
            <img className="art" src={unknown} alt='unknown' />
            <div className="overlay-content">
              <div className="top-container">
                <div className="title-container">
                  <div className={`name neutral-border`}>Unknown</div>
                  {online ?
                    <div className="rez">
                      <FeatherIcon className="eye-icon" icon="sun" />
                      {rezCost}
                    </div> :
                    <div className="rez" onClick={() => onRezPlayerCard(entity)}>
                      <FeatherIcon className="eye-icon" icon="eye-off" />
                    </div>}
                </div>
                <div className="type">entity</div>
                {/* {subTypes ? <div className="type">{subTypes}</div> : null} */}
              </div>
              {/* {this.renderSoulAshes(soul, ash)}
              {this.renderTypes(magi, phys, tech)} */}
              <div className="bottom-container">
                <div className="abilities">unknown</div>
                {/* {description ? (
                  <div className="description">{description}</div>
                ) : null} */}
                <div className="body">
                  <div className="power">
                    ?
                    <FeatherIcon className="stats-icon" icon="crosshair" />
                  </div>
                  <div className="health">
                    <FeatherIcon className="stats-icon" icon="heart" />
                    {wounds ? `-${wounds}` : '?'}
                  </div>
                </div>
              </div>
              <div className={`timer neutral-border`}>
                <div className="timer-content">
                  {this.renderHiddenSteps(steps, freeze)}
                  <FeatherIcon className="icon timer-icon" icon="clock" />
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
            <div className="top-container">
              <div className="title-container">
                <div className={`name ${faction}`}>{name}</div>
                {online ?
                  <div className="rez">
                    <FeatherIcon className="eye-icon" icon="sun" />
                    {rezCost}
                  </div> :
                  <div className="rez" onClick={() => onRezPlayerCard(entity)}>
                    <FeatherIcon className="eye-icon" icon="eye-off" />
                    {rezCost}
                  </div>}
              </div>
              <div className="type">{category?.toLowerCase() || 'entity'}</div>
              {subTypes ? <div className="type">{subTypes}</div> : null}
            </div>
            {this.renderSoulAshes(soul, ash)}
            {this.renderTypes(magi, phys, tech)}
            <div className="bottom-container">
              {(category === 'LANDMARK' || category === 'SYM' || category === 'LOCATION') && runes ? (
                <div className="runes-container">
                  <FeatherIcon className="icon star-icon" icon="star" />
                  {runes}
                </div>
              ) : null}
              {keywords ? <div className="abilities">{keywords}</div> : null}
              {description ? (
                <div className="description">{description}</div>
              ) : null}
              {category === 'ENTITY' && (
                <div className="body">
                  <div className="power">
                    {power || 0}
                    <FeatherIcon className="stats-icon" icon="crosshair" />
                  </div>
                  <div className="health">
                    <FeatherIcon className="stats-icon" icon="heart" />
                    {(HP || 0) - (wounds || 0)}
                  </div>
                </div>
              )}
              {(category === 'LANDMARK' || category === 'SYM' || category === 'LOCATION') && (
                <div className="location-body">
                  <div className="health">
                    <FeatherIcon className="stats-icon" icon="shield" />
                    {(HP || 0) - (wounds || 0)}
                  </div>
                </div>
              )}
            </div>
            {category === 'ENTITY' && (
              <div className={`timer ${faction}`}>
                <div className="timer-content">
                  {Math.max(0, (timer || 0) - (steps || 0) + (freeze || 0))}
                  <FeatherIcon className="icon timer-icon" icon="clock" />
                </div>
              </div>
            )}
            {(category === 'LANDMARK' || category === 'SYM' || category === 'LOCATION') && plot ? (
              <div className={`timer ${faction}`}>
                <div className="timer-content">
                  <FeatherIcon className="icon plot-icon" icon="calendar" />
                  {(plot || 0) - (this.props.entity.development || 0)}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

export default Card;

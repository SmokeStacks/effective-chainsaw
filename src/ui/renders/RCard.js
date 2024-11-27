import "./styles.css";
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

  render() {
    const {
      type,
      faction,
      name,
      rezCost,
      magi,
      phys,
      tech,
      keywords,
      description,
    } = this.props.entity.card;

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
            <div className="top-container">
              <div className="title-container">
                <div className={`name ${faction}`}>{name}</div>
                <div className="rez">
                  <FeatherIcon className="eye-icon" icon="sun" />
                  {rezCost}
                </div>
              </div>
              <div className="type">{type.toLowerCase()}</div>
            </div>
            {this.renderTypes(magi, phys, tech)}
            <div className="bottom-container">
              {keywords ? <div className="abilities">{keywords}</div> : null}
              {description ? (
                <div className="description">{description}</div>
              ) : null}
              <div className="location-body"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default LCard;

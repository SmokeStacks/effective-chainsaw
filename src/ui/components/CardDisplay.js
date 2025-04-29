import React from 'react';

export const CardDisplay = ({ card, onClick, className }) => {
  if (!card) return null;

  // Get name from card.card if it exists, otherwise from card
  const name = card.card ? card.card.name : card.name;

  return (
    <div className={`card-display ${className || ''}`} onClick={onClick}>
      <h3>{name}</h3>
      <div className="card-stats">
        {card.HP > 0 && <div>HP: {card.HP}</div>}
        {card.power > 0 && <div>Power: {card.power}</div>}
        {card.keywords && <div>Keywords: {card.keywords}</div>}
      </div>
      {card.abilities && card.abilities.length > 0 && (
        <div className="card-abilities">
          {card.abilities.map((ability, index) => (
            <div key={index} className="ability">
              {ability.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CardDisplay;

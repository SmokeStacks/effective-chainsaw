import React from 'react';

export const CardDisplay = ({ card, onClick, className }) => {
  if (!card) return null;

  return (
    <div className={`card-display ${className || ''}`} onClick={onClick}>
      <h3>{card.name}</h3>
      <div className="card-stats">
        <div>HP: {card.HP}</div>
        {card.power && <div>Power: {card.power}</div>}
        {card.runes && <div>Runes: {card.runes}</div>}
      </div>
      {card.abilities && (
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

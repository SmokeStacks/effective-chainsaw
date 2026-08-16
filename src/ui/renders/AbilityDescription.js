import React from "react";
import {
  getManualAbility,
  splitAbilityCost,
  canActivateManualAbility,
  COST_ARROW
} from "../helpers/manualAbility";

/**
 * Renders a card's description. When the card has a manual ability, the cost
 * clause immediately before the arrow becomes the clickable affordance that
 * activates it. Any preceding prose and any "Scheme N:" gate render as plain
 * text. Only the local player's own cards are interactive.
 */
function AbilityDescription({ description, entity, onAbilityClick }) {
  if (!description) return null;

  const ability = getManualAbility(entity);
  const { prefix, condition, cost, effect } = splitAbilityCost(description);

  if (!ability || !cost || !onAbilityClick || entity.owner !== 'PLAYER') {
    return <div className="description">{description}</div>;
  }

  const enabled = canActivateManualAbility(entity, ability, 'PLAYER');

  const activate = (e) => {
    e.stopPropagation();
    if (enabled) onAbilityClick(ability, entity);
  };

  return (
    <div className="description">
      {prefix ? `${prefix} ` : ''}
      {condition ? `${condition} ` : ''}
      <span
        className={`ability-cost${enabled ? '' : ' ability-cost-disabled'}`}
        role="button"
        tabIndex={enabled ? 0 : -1}
        aria-disabled={!enabled}
        title={enabled ? `Activate: ${effect}` : 'Cost cannot be paid right now'}
        onClick={activate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activate(e);
          }
        }}
      >
        {cost}
      </span>
      {` ${COST_ARROW} ${effect}`}
    </div>
  );
}

export default AbilityDescription;

import { abilitiesDefinitions } from '../abilities/glossary';
import { state } from './state';

export const COST_ARROW = '\u2794';

export function getManualAbilities(entity) {
    const abilities = entity?.card?.abilities || [];
    return abilities.filter((ability) => ability && ability.type === 'manual');
}

export function getManualAbility(entity) {
    return getManualAbilities(entity)[0] || null;
}

/**
 * Splits a card description around the cost arrow into:
 *   prefix    - unrelated prose before the cost clause (e.g. a triggered ability
 *               sentence), rendered as plain text
 *   condition - a "Scheme N:" style unlock gate, which is not a payable cost
 *   cost      - the actual payable cost, used as the clickable affordance
 *   effect    - what happens once the cost is paid
 *
 * Only the clause immediately before the arrow is the cost. Descriptions such as
 * "When Interfaced, inflict 2 Overload... Scheme 2: Sacrifice ➔ ..." would
 * otherwise make the entire leading sentence clickable.
 */
export function splitAbilityCost(description) {
    if (typeof description !== 'string') {
        return { prefix: '', condition: '', cost: '', effect: '' };
    }
    const index = description.indexOf(COST_ARROW);
    if (index === -1) {
        return { prefix: '', condition: '', cost: '', effect: description.trim() };
    }

    const before = description.slice(0, index);
    const effect = description.slice(index + COST_ARROW.length).trim();

    const boundary = before.lastIndexOf('.');
    const prefix = boundary === -1 ? '' : before.slice(0, boundary + 1).trim();
    let cost = (boundary === -1 ? before : before.slice(boundary + 1)).trim();

    let condition = '';
    const schemeGate = cost.match(/^Scheme\s+\d+\s*:\s*/i);
    if (schemeGate) {
        condition = schemeGate[0].trim();
        cost = cost.slice(schemeGate[0].length).trim();
    }

    return { prefix, condition, cost, effect };
}

export function canActivateManualAbility(entity, ability, side) {
    if (!entity || !ability) return false;

    const abilityDef = abilitiesDefinitions[ability.name];
    if (!abilityDef) return false;

    if (!entity.online) return false;
    if (entity.scheming && !entity.schemeUnlocked) return false;

    const cost = abilityDef.cost || {};

    if (cost.exhaust && entity.exhausted) return false;

    if (cost.bits) {
        const bits = side === 'PLAYER' ? state.playerBits : state.enemyBits;
        if ((bits || 0) < cost.bits) return false;
    }

    if (cost.actions) {
        const actions = side === 'PLAYER' ? state.playerActions : state.enemyActions;
        if ((actions || 0) < cost.actions) return false;
    }

    return true;
}

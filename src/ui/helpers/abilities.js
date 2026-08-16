import { abilitiesDefinitions } from '../abilities/glossary';
import { state, stateSetters } from './state';

export function getAbilityDefinition(abilityName) {
    return abilitiesDefinitions[abilityName] || null;
}

export function isValidAbilityTarget(cardEntity) {
    const ability = state.pendingManualAbility?.ability;
    if (!ability) return false;

    const targetFilter = abilitiesDefinitions[ability.name]?.targetFilter;
    return targetFilter ? targetFilter(cardEntity) : true;
}

export function confirmAbilityTarget(cardEntity) {
    const abilityDef = state.selectedCard?.abilities?.find(a => a.name === state.pendingManualAbility);
    if (!abilityDef) return;

    const ability = abilitiesDefinitions[abilityDef.name];
    if (ability?.onPlay) {
        ability.onPlay(state.selectedCard, state, state.selectedCard.owner, cardEntity);
    }
}

export function confirmManualAbility(target) {
    const pending = state.pendingManualAbility;
    if (!pending?.entity || !pending?.ability) return;

    const { entity, ability } = pending;
    const abilityDef = abilitiesDefinitions[ability.name];

    if (typeof abilityDef?.execute === 'function') {
        abilityDef.execute(entity, ability.effect, entity.owner, target);
    } else if (typeof abilityDef?.onPlay === 'function') {
        abilityDef.onPlay(entity, state, entity.owner, target);
    }

    stateSetters.setPendingManualAbility(null);
    stateSetters.setTargetSelection({ enabled: false });
}

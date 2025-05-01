import { abilitiesDefinitions } from '../abilities/glossary';
import { state } from './state';

export function getAbilityDefinition(abilityName) {
    return abilitiesDefinitions[abilityName] || null;
}

export function isValidAbilityTarget(cardEntity) {
    const abilityDef = state.selectedCard?.abilities?.find(a => a.name === state.pendingManualAbility);
    if (!abilityDef) return false;
    
    const targetFilter = abilitiesDefinitions[abilityDef.name]?.targetFilter;
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
    const abilityDef = state.selectedCard?.abilities?.find(a => a.name === state.pendingManualAbility);
    if (!abilityDef) return;

    const ability = abilitiesDefinitions[abilityDef.name];
    if (ability?.onPlay) {
        ability.onPlay(state.selectedCard, state, state.selectedCard.owner, target);
    }
}

import { abilitiesDefinitions } from '../abilities/glossary';
import { state, stateSetters } from './state';

export function getAbilityDefinition(abilityName) {
    return abilitiesDefinitions[abilityName] || null;
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

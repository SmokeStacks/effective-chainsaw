import { abilitiesDefinitions } from '../abilities/glossary';

export function getAbilityDefinition(abilityName) {
    return abilitiesDefinitions[abilityName] || null;
}

import { Card } from './cards';
import { cardRegistry } from './cardRegistry';

export interface CardReference {
  faction: 'green' | 'orange' | 'purple' | 'gray';
  index: number;
}

/**
 * Resolves a card reference to the actual card object
 */
export function resolveCardReference(reference: CardReference): Card | undefined {
  const { faction, index } = reference;
  const factionCards = cardRegistry[faction];
  
  if (!factionCards) {
    console.error(`Faction ${faction} not found in cardRegistry. Available:`, Object.keys(cardRegistry));
    return undefined;
  }
  
  if (factionCards.length === 0) {
    console.error(`Faction ${faction} has 0 cards`);
    return undefined;
  }
  
  if (index < 0 || index >= factionCards.length) {
    console.error(`Invalid card index ${index} for faction ${faction} (length: ${factionCards.length})`);
    return undefined;
  }
  
  return factionCards[index] as Card;
}

/**
 * Resolves an array of card references to actual card objects
 */
export function resolveDeckReferences(references: CardReference[]): Card[] {
  const resolvedCards: Card[] = [];
  
  for (const reference of references) {
    const card = resolveCardReference(reference);
    if (card) {
      resolvedCards.push(card);
    } else {
      console.warn(`Failed to resolve card reference:`, reference);
    }
  }
  
  return resolvedCards;
}

/**
 * Creates a card reference from a card object
 */
export function createCardReference(card: Card): CardReference | undefined {
  // Find which faction this card belongs to
  for (const [factionName, factionCards] of Object.entries(cardRegistry)) {
    const index = factionCards.findIndex(c => c.id === card.id);
    if (index !== -1) {
      return {
        faction: factionName as 'green' | 'orange' | 'purple' | 'gray',
        index
      };
    }
  }
  
  console.error(`Card not found in any faction binder:`, card);
  return undefined;
}

/**
 * Validates that all card references in a deck are valid
 */
export function validateDeckReferences(references: CardReference[]): boolean {
  for (const reference of references) {
    const card = resolveCardReference(reference);
    if (!card) {
      console.error(`Invalid card reference in deck:`, reference);
      return false;
    }
  }
  return true;
}

/**
 * Gets deck statistics by faction
 */
export function getDeckStatistics(references: CardReference[]) {
  const stats = {
    green: 0,
    orange: 0,
    purple: 0,
    gray: 0,
    total: references.length
  };
  
  for (const reference of references) {
    stats[reference.faction]++;
  }
  
  return stats;
}

// Enemy Deck - Mostly Orange with Simple AI
// Enemy will flip coin for HS or Pandora realm
// Auto-advances snips, syms, and LMS every turn
// No rituals or special abilities, mostly defensive/passive effects

import { CardReference } from '../playerDecks/deckTwoRefactored';

// Enemy deck configuration (mostly orange cards)
export const enemyDeck: CardReference[] = [
  // Orange entities (20 cards) - aggressive and straightforward
  { faction: 'orange', index: 0 },   // TerraBite
  { faction: 'orange', index: 0 },   // TerraBite
  { faction: 'orange', index: 1 },   // GooTooth
  { faction: 'orange', index: 1 },   // GooTooth
  { faction: 'orange', index: 2 },   // MouseByte
  { faction: 'orange', index: 2 },   // MouseByte
  { faction: 'orange', index: 3 },   // VyperDrive
  { faction: 'orange', index: 3 },   // VyperDrive
  { faction: 'orange', index: 4 },   // CatPhish
  { faction: 'orange', index: 5 },   // SylkWorm
  { faction: 'orange', index: 6 },   // Pharmacist
  { faction: 'orange', index: 6 },   // Pharmacist
  { faction: 'orange', index: 7 },   // Operator
  { faction: 'orange', index: 7 },   // Operator
  { faction: 'orange', index: 10 },  // Con Artist
  { faction: 'orange', index: 11 },  // Blood Sugar
  { faction: 'orange', index: 14 },  // Freight Train
  { faction: 'orange', index: 15 },  // Z0MBI
  { faction: 'orange', index: 16 },  // Dread

  // Orange locations and landmarks (8 cards) - defensive effects
  { faction: 'orange', index: 31 },  // Cat Cafe
  { faction: 'orange', index: 31 },  // Cat Cafe
  { faction: 'orange', index: 32 },  // Wasteland
  { faction: 'orange', index: 32 },  // Wasteland
  { faction: 'orange', index: 33 },  // Forgotten Island
  { faction: 'orange', index: 33 },  // Forgotten Island
  { faction: 'orange', index: 34 },  // Splinter Faction
  { faction: 'orange', index: 34 },  // Splinter Faction

  // Orange snips (4 cards) - simple passive effects
  { faction: 'orange', index: 20 },  // Precognition
  { faction: 'orange', index: 20 },  // Precognition
  { faction: 'orange', index: 21 },  // Quantum Stabilizer
  { faction: 'orange', index: 21 },  // Quantum Stabilizer

  // Gray cards (8 cards) - simple defensive entities
  { faction: 'gray', index: 6 },     // Dingo
  { faction: 'gray', index: 6 },     // Dingo
  { faction: 'gray', index: 7 },     // Conscripts
  { faction: 'gray', index: 7 },     // Conscripts
  { faction: 'gray', index: 10 },    // Combat Medic
  { faction: 'gray', index: 10 },    // Combat Medic
  { faction: 'gray', index: 12 },    // Embedding
  { faction: 'gray', index: 13 },    // IceBorg
];

// Enemy AI configuration
export const enemyAI = {
  // Realm selection (coin flip)
  selectRealm(): 'HS' | 'Pandora' {
    return Math.random() < 0.5 ? 'HS' : 'Pandora';
  },

  // Auto-advance configuration
  autoAdvance: {
    snips: true,    // Automatically advance snips each turn
    syms: true,     // Automatically advance syms each turn  
    landmarks: true // Automatically advance landmarks each turn
  },

  // Simple AI behavior patterns
  behavior: {
    // Prioritize playing low-cost entities early
    playLowCostFirst: true,
    
    // Focus on building board presence
    prioritizeEntities: true,
    
    // Use defensive abilities when available
    useDefense: true,
    
    // Simple aggression - attack when possible
    attackWhenPossible: true,
    
    // No complex combo planning
    avoidComplexCombos: true
  },

  // Turn priorities (in order)
  turnPriorities: [
    'autoAdvanceStructures',  // 1. Auto-advance snips/syms/LMS
    'playLowCostEntities',    // 2. Play affordable entities
    'useDefensiveAbilities',  // 3. Use defensive abilities
    'attackWithEntities',     // 4. Attack with ready entities
    'playHighCostCards',      // 5. Play expensive cards if resources allow
    'endTurn'                 // 6. End turn
  ] as const,

  // Resource management
  resourceManagement: {
    // Keep some resources for defense
    reserveForDefense: 2,
    
    // Don't overextend
    maxEntitiesPerTurn: 3,
    
    // Prioritize ash for expensive cards
    prioritizeAshForBigCards: true
  }
};

// Helper function to get enemy deck
export function getEnemyDeck(): CardReference[] {
  return enemyDeck;
}

// Helper function to get AI configuration
export function getEnemyAI() {
  return enemyAI;
}

export type { CardReference };

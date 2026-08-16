// Player Deck with Bootstrap Mechanic
// Bootstrap: 1 JAW or JAWbreaker installed before game begins

import { CardReference } from './deckTwoRefactored';

// Main player deck (40 cards)
export const playerMainDeck: CardReference[] = [
  // Orange cards (30 total - 24 entities + 6 locations)
  { faction: 'orange', index: 4 },   // CatPhish (bootstrap) - JAWbreaker
  { faction: 'orange', index: 1 },   // GooTooth
  { faction: 'orange', index: 1 },   // GooTooth
  { faction: 'orange', index: 1 },   // GooTooth
  { faction: 'orange', index: 3 },   // VyperDrive
  { faction: 'orange', index: 3 },   // VyperDrive
  { faction: 'orange', index: 3 },   // VyperDrive
  { faction: 'orange', index: 5 },   // SylkWorm
  { faction: 'orange', index: 5 },   // SylkWorm
  { faction: 'orange', index: 8 },   // Poser
  { faction: 'orange', index: 8 },   // Poser
  { faction: 'orange', index: 9 },   // Recruiter
  { faction: 'orange', index: 18 },  // Memory Leak
  { faction: 'orange', index: 19 },  // Insurgency
  { faction: 'orange', index: 20 },  // Precognition
  { faction: 'orange', index: 21 },  // Quantum Stabilizer
  { faction: 'orange', index: 23 },  // Imitation Game
  { faction: 'orange', index: 23 },  // Imitation Game
  { faction: 'orange', index: 25 },  // Stolen Briefcase
  { faction: 'orange', index: 25 },  // Stolen Briefcase
  { faction: 'orange', index: 26 },  // Dead Drop
  { faction: 'orange', index: 27 },  // Multi Threading
  { faction: 'orange', index: 29 },  // Implants
  { faction: 'orange', index: 29 },  // Implants

  // Purple cards (2 total - Crystalize)
  { faction: 'purple', index: 25 },  // Crystalize
  { faction: 'purple', index: 25 },  // Crystalize

  // Purple cards (3 total - Reliquary)
  { faction: 'purple', index: 22 },  // Reliquary
  { faction: 'purple', index: 22 },  // Reliquary
  { faction: 'purple', index: 22 },  // Reliquary

  // Gray cards (3 total - Bloodletting)
  { faction: 'gray', index: 20 },    // Bloodletting
  { faction: 'gray', index: 20 },    // Bloodletting
  { faction: 'gray', index: 20 },    // Bloodletting

  // Gray cards (2 total - Dingo)
  { faction: 'gray', index: 5 },     // Dingo
  { faction: 'gray', index: 5 },     // Dingo

  // Orange locations and SYM (6 total - Forgotten Island, Splinter Faction, Adrenochrome)
  { faction: 'orange', index: 33 },  // Forgotten Island
  { faction: 'orange', index: 33 },  // Forgotten Island
  { faction: 'orange', index: 33 },  // Forgotten Island
  { faction: 'orange', index: 34 },  // Splinter Faction
  { faction: 'orange', index: 34 },  // Splinter Faction
  { faction: 'orange', index: 30 },  // Adrenochrome
];

// Bootstrap configuration
export const bootstrapConfig = {
  // CatPhish is the designated bootstrap card (JAWbreaker)
  bootstrapCard: { faction: 'orange' as const, index: 4 }, // CatPhish
  
  // Available JAW/JAWbreaker cards for bootstrap selection
  availableBootstrapCards: [
    { faction: 'orange', index: 4 },   // CatPhish (JAWbreaker)
    { faction: 'orange', index: 2 },   // MouseByte (JAW)
    { faction: 'orange', index: 5 },   // SylkWorm (JAW)
    { faction: 'gray', index: 11 },    // Troll (JAW)
    { faction: 'gray', index: 12 },    // Embedding (JAW)
    { faction: 'gray', index: 13 },    // IceBorg (JAW)
    { faction: 'gray', index: 14 },    // Daemon (JAWbreaker)
    { faction: 'gray', index: 15 },    // CarJack (JAWbreaker)
    { faction: 'gray', index: 16 },    // Leech (JAWbreaker)
  ]
};

// Helper function to get bootstrap card
export function getBootstrapCard(): CardReference {
  return bootstrapConfig.bootstrapCard;
}

// Helper function to check if a card is eligible for bootstrap
export function isBootstrapEligible(reference: CardReference): boolean {
  return bootstrapConfig.availableBootstrapCards.some(
    card => card.faction === reference.faction && card.index === reference.index
  );
}

export type { CardReference };

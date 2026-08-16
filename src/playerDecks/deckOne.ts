// Green Faction Decks
// Decks are arrays of indices into greenBinder from cardRegistry.ts

// Basic green starter deck
export const greenStarterDeck: number[] = [
  0,   // PingWin
  1,   // Ram
  2,   // PawPups
  3,   // ScriptKitty
  4,   // DeadHerring
  5,   // Bau
  6,   // Lich Queen
  7,   // Plague Priestess
  8,   // Lamia
  9,   // Incubus
  10,  // Harpies
  11,  // Surrogate
  12,  // Flesh Hive
  13,  // Husk
  14,  // Hostess
  15,  // WebCrawler
  16,  // Terminal
  17,  // Remnant
];

// Tech-focused green deck
export const greenTechDeck: number[] = [
  0,   // PingWin
  1,   // Ram
  2,   // PawPups
  3,   // ScriptKitty
  4,   // DeadHerring
  5,   // Bau
  13,  // Husk
  15,  // WebCrawler
  16,  // Terminal
];

// Magic-focused green deck
export const greenMagicDeck: number[] = [
  6,   // Lich Queen
  7,   // Plague Priestess
  8,   // Lamia
  9,   // Incubus
  10,  // Harpies
  11,  // Surrogate
  12,  // Flesh Hive
  14,  // Hostess
  15,  // WebCrawler
  16,  // Terminal
];

// All green cards for testing
export const allGreenCards: number[] = Array.from({ length: 18 }, (_, i) => i);
// Orange Faction Decks
// Decks are arrays of indices into orangeBinder from rules/orangeBinder.ts

// Starter deck with basic orange cards
export const orangeStarterDeck: number[] = [
  0,   // TerraBite
  1,   // GooTooth
  2,   // MouseByte
  5,   // Pharmacist
  6,   // Operator
  10,  // Blood Sugar
  13,  // Freight Train
  20,  // Precognition
  21,  // Quantum Stabilizer
  25,  // Stolen Briefcase
  29,  // Adrenochrome
  32,  // Wasteland
];

// Aggressive JAWbreaker deck
export const jawbreakerDeck: number[] = [
  0,   // TerraBite
  1,   // GooTooth
  2,   // MouseByte
  3,   // VyperDrive
  4,   // CatPhish
  5,   // SylkWorm
  15,  // Z0MBI
  16,  // Nova Kane
  24,  // Brain Freeze
  27,  // Multi Threading
  28,  // Exploit
];

// Physical/Control deck
export const physControlDeck: number[] = [
  6,   // Operator
  7,   // Poser
  8,   // Recruiter
  9,   // Con Artist
  10,  // Blood Sugar
  11,  // Chronomancer
  12,  // Architect
  17,  // Memory Leak
  18,  // Insurgency
  30,  // Cat Cafe
  33,  // Splinter Faction
];

// All orange cards for testing
export const allOrangeCards: number[] = Array.from({ length: 34 }, (_, i) => i);

// Mixed Faction Deck - References to cardRegistry
// Decks are arrays of objects with faction and index

interface CardReference {
  faction: 'green' | 'orange' | 'purple' | 'gray';
  index: number;
}

// Mixed deck with cards from multiple factions
export const mixedDeckOne: CardReference[] = [
  // Orange cards
  { faction: 'orange', index: 0 },   // TerraBite
  { faction: 'orange', index: 1 },   // GooTooth
  { faction: 'orange', index: 2 },   // MouseByte
  { faction: 'orange', index: 3 },   // VyperDrive
  { faction: 'orange', index: 4 },   // CatPhish
  { faction: 'orange', index: 5 },   // SylkWorm
  { faction: 'orange', index: 6 },   // Pharmacist
  { faction: 'orange', index: 7 },   // Operator
  { faction: 'orange', index: 8 },   // Poser
  { faction: 'orange', index: 9 },   // Recruiter
  { faction: 'orange', index: 10 },  // Con Artist
  { faction: 'orange', index: 11 },  // Blood Sugar
  { faction: 'orange', index: 12 },  // Chronomancer
  { faction: 'orange', index: 13 },  // Architect
  { faction: 'orange', index: 14 },  // Freight Train
  { faction: 'orange', index: 15 },  // Z0MBI
  { faction: 'orange', index: 16 },  // Nova Kane
  { faction: 'orange', index: 17 },  // Dread
  { faction: 'orange', index: 18 },  // Memory Leak
  { faction: 'orange', index: 19 },  // Insurgency
  { faction: 'orange', index: 20 },  // Precognition
  { faction: 'orange', index: 21 },  // Quantum Stabilizer
  { faction: 'orange', index: 22 },  // Data Bomb
  { faction: 'orange', index: 23 },  // Imitation Game
  { faction: 'orange', index: 24 },  // Brain Freeze
  { faction: 'orange', index: 25 },  // Stolen Briefcase
  { faction: 'orange', index: 26 },  // Dead Drop
  { faction: 'orange', index: 27 },  // Multi Threading
  { faction: 'orange', index: 28 },  // Exploit
  { faction: 'orange', index: 29 },  // Implants
  { faction: 'orange', index: 30 },  // Adrenochrome
  { faction: 'orange', index: 31 },  // Cat Cafe
  { faction: 'orange', index: 32 },  // Wasteland
  { faction: 'orange', index: 33 },  // Forgotten Island
  { faction: 'orange', index: 34 },  // Splinter Faction
  
  // Purple cards
  { faction: 'purple', index: 0 },   // Dryad
  { faction: 'purple', index: 1 },   // Viceroy
  { faction: 'purple', index: 2 },   // Sarcophagus
  { faction: 'purple', index: 3 },   // Sovereign
  { faction: 'purple', index: 4 },   // Gladiator
  { faction: 'purple', index: 5 },   // Archivist
  { faction: 'purple', index: 6 },   // Baroness
  { faction: 'purple', index: 7 },   // Oracle
  { faction: 'purple', index: 8 },   // Mortician
  { faction: 'purple', index: 9 },   // Demiurge
  { faction: 'purple', index: 10 },  // Acolyte
  { faction: 'purple', index: 11 },  // Pyromancer
  { faction: 'purple', index: 12 },  // Poltergeist
  { faction: 'purple', index: 13 },  // False Prophet
  { faction: 'purple', index: 14 },  // Merchant Guild
  { faction: 'purple', index: 15 },  // Automaton
  { faction: 'purple', index: 16 },  // Archon
  { faction: 'purple', index: 17 },  // Technopagan
  { faction: 'purple', index: 18 },  // RATs
  { faction: 'purple', index: 19 },  // Tyranny
  { faction: 'purple', index: 20 },  // Lighthouse
  { faction: 'purple', index: 21 },  // Alchemy Lab
  { faction: 'purple', index: 22 },  // Reliquary
  { faction: 'purple', index: 23 },  // Apocrypha
  { faction: 'purple', index: 24 },  // Entropy
  { faction: 'purple', index: 25 },  // Crystalize
  { faction: 'purple', index: 26 },  // Tithing
  { faction: 'purple', index: 27 },  // Acceptable Losses
  { faction: 'purple', index: 28 },  // Seance
  { faction: 'purple', index: 29 },  // Ignition
  { faction: 'purple', index: 30 },  // Royal Decree
  { faction: 'purple', index: 31 },  // True Self
  { faction: 'purple', index: 32 },  // Ancient Tomb
  { faction: 'purple', index: 33 },  // Witch Hunt
  { faction: 'purple', index: 34 },  // Volcano
  
  // Gray cards
  { faction: 'gray', index: 0 },     // Conscripts
  { faction: 'gray', index: 1 },     // Embedding
  { faction: 'gray', index: 2 },     // Extortion
];

// Orange-focused deck
export const orangeFocusedDeck: CardReference[] = [
  { faction: 'orange', index: 0 },   // TerraBite
  { faction: 'orange', index: 1 },   // GooTooth
  { faction: 'orange', index: 2 },   // MouseByte
  { faction: 'orange', index: 3 },   // VyperDrive
  { faction: 'orange', index: 4 },   // CatPhish
  { faction: 'orange', index: 5 },   // SylkWorm
  { faction: 'orange', index: 6 },   // Pharmacist
  { faction: 'orange', index: 7 },   // Operator
  { faction: 'orange', index: 8 },   // Poser
  { faction: 'orange', index: 9 },   // Recruiter
  { faction: 'orange', index: 10 },  // Con Artist
  { faction: 'orange', index: 11 },  // Blood Sugar
  { faction: 'orange', index: 12 },  // Chronomancer
  { faction: 'orange', index: 13 },  // Architect
  { faction: 'orange', index: 14 },  // Freight Train
  { faction: 'orange', index: 15 },  // Z0MBI
  { faction: 'orange', index: 16 },  // Nova Kane
  { faction: 'orange', index: 17 },  // Dread
  { faction: 'orange', index: 18 },  // Memory Leak
  { faction: 'orange', index: 19 },  // Insurgency
  { faction: 'orange', index: 20 },  // Precognition
  { faction: 'orange', index: 21 },  // Quantum Stabilizer
  { faction: 'orange', index: 22 },  // Data Bomb
  { faction: 'orange', index: 23 },  // Imitation Game
  { faction: 'orange', index: 24 },  // Brain Freeze
  { faction: 'orange', index: 25 },  // Stolen Briefcase
  { faction: 'orange', index: 26 },  // Dead Drop
  { faction: 'orange', index: 27 },  // Multi Threading
  { faction: 'orange', index: 28 },  // Exploit
  { faction: 'orange', index: 29 },  // Implants
  { faction: 'orange', index: 30 },  // Adrenochrome
  { faction: 'orange', index: 31 },  // Cat Cafe
  { faction: 'orange', index: 32 },  // Wasteland
  { faction: 'orange', index: 33 },  // Forgotten Island
  { faction: 'orange', index: 34 },  // Splinter Faction
];

// Purple-focused deck
export const purpleFocusedDeck: CardReference[] = [
  { faction: 'purple', index: 0 },   // Dryad
  { faction: 'purple', index: 1 },   // Viceroy
  { faction: 'purple', index: 2 },   // Sarcophagus
  { faction: 'purple', index: 3 },   // Sovereign
  { faction: 'purple', index: 4 },   // Gladiator
  { faction: 'purple', index: 5 },   // Archivist
  { faction: 'purple', index: 6 },   // Baroness
  { faction: 'purple', index: 7 },   // Oracle
  { faction: 'purple', index: 8 },   // Mortician
  { faction: 'purple', index: 9 },   // Demiurge
  { faction: 'purple', index: 10 },  // Acolyte
  { faction: 'purple', index: 11 },  // Pyromancer
  { faction: 'purple', index: 12 },  // Poltergeist
  { faction: 'purple', index: 13 },  // False Prophet
  { faction: 'purple', index: 14 },  // Merchant Guild
  { faction: 'purple', index: 15 },  // Automaton
  { faction: 'purple', index: 16 },  // Archon
  { faction: 'purple', index: 17 },  // Technopagan
  { faction: 'purple', index: 18 },  // RATs
  { faction: 'purple', index: 19 },  // Tyranny
  { faction: 'purple', index: 20 },  // Lighthouse
  { faction: 'purple', index: 21 },  // Alchemy Lab
  { faction: 'purple', index: 22 },  // Reliquary
  { faction: 'purple', index: 23 },  // Apocrypha
  { faction: 'purple', index: 24 },  // Entropy
  { faction: 'purple', index: 25 },  // Crystalize
  { faction: 'purple', index: 26 },  // Tithing
  { faction: 'purple', index: 27 },  // Acceptable Losses
  { faction: 'purple', index: 28 },  // Seance
  { faction: 'purple', index: 29 },  // Ignition
  { faction: 'purple', index: 30 },  // Royal Decree
  { faction: 'purple', index: 31 },  // True Self
  { faction: 'purple', index: 32 },  // Ancient Tomb
  { faction: 'purple', index: 33 },  // Witch Hunt
  { faction: 'purple', index: 34 },  // Volcano
];

export type { CardReference };

# Orange Cards Audit: OrangeCardsNew.txt vs binder.ts

## Cards MISSING from binder.ts (need to add):
1. **GooTooth** - Tech Entity (JAWbreaker)
2. **MouseByte** - Tech Entity (JAWbreaker)
3. **Operator** - Phys Entity
4. **Chronomancer** - Phys/Magi Entity
5. **Architect** - Phys/Tech Entity
6. **Z0MBI** - Magi/Tech Entity
7. **Memory Leak** - Location (Phys/Tech)

## Cards in binder.ts NOT in OrangeCardsNew.txt (need to decide):
- BotFlies (Tech)
- BluTooth (Tech)
- Saboteur (Phys)
- Frost Witch (Phys/Magi)
- Wendy 500 (Tech)
- Leviathan (Tech)
- Pirate Vessel (Location)
- Foresight (Snip) - similar to Precognition
- Forgery (Ritual) - similar to Exploit

## DUPLICATE IDs in binder.ts (need to fix):
- ID 112: Con Artist AND Blood Sugar
- ID 114: Wendy 500 AND Dread
- ID 115: Freight Train AND Pirate Vessel
- ID 116: Leviathan AND Insurgency
- ID 117: Nova Kane AND Foresight

## Cards needing stat updates (from OrangeCardsNew):
| Card | binder.ts | OrangeCardsNew |
|------|-----------|----------------|
| TerraBite | rez:4, soul:1, power:5, HP:3 | rez:3, soul:1, power:3, HP:3 |
| SilkWorm | rez:1, ash:5, HP:3 | rez:1, ash:5, power:1, HP:2 |
| (others need checking)

## Faction Structure Proposal:
```typescript
// masterCards.ts - four faction arrays
export const techCards: Card[] = [...];      // tech = orange-border
export const physCards: Card[] = [...];       // phys = white-border  
export const magiCards: Card[] = [...];      // magi = purple-border
export const neutralCards: Card[] = [...];    // neutral/gray = gray-border

// deck references indices
export const deckOne = [0, 1, 2, 5, 8, ...]; // indices into faction arrays
```

## Impostor Ability Cleanup:
- Current implementation in glossary.js has `swapEntitiesForImpostor` helper
- Used by Poser, Imitation Game, and Recruiter (GrantImpostorToDreamers)
- Need to verify it works correctly with the realm placement flow

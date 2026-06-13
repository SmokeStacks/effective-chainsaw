# New/Renamed Orange Cards Needing Images

## Completely New Cards (not in binder.ts at all):
1. **GooTooth** - Tech JAWbreaker entity
2. **MouseByte** - Tech JAWbreaker entity  
3. **Operator** - Phys entity
4. **Chronomancer** - Phys/Magi entity
5. **Architect** - Phys/Tech entity
6. **Z0MBI** - Magi/Tech entity
7. **Memory Leak** - Location (Phys/Tech)

## Renamed Cards (old name → new name):
| Old Name (binder.ts) | New Name (OrangeCardsNew) | Type |
|---------------------|---------------------------|------|
| SilkWorm | **SylkWorm** | Tech JAWbreaker |
| BotFlies | ? | Not in new list - REMOVE? |
| BluTooth | ? | Not in new list - REMOVE? |
| Saboteur | ? | Not in new list - REMOVE? |
| Frost Witch | ? | Not in new list - REMOVE? |
| Wendy 500 | ? | Not in new list - REMOVE? |
| Leviathan | ? | Not in new list - REMOVE? |
| Pirate Vessel | **Memory Leak** | Location (renamed?) |
| Foresight | **Precognition** | Snip (renamed) |
| Forgery | ? | Not in new list - REMOVE? |

## Cards with Stat Changes (same name, different stats):
- TerraBite: rez 4→3, power 5→3
- VyperDrive: rez 1, HP 4, timer 2 → rez 1, HP 4, timer 1
- CatPhish: rez 2, HP 3 → rez 1, HP 3
- Pharmacist: unchanged
- Poser: unchanged
- Recruiter: unchanged
- Con Artist: unchanged
- Blood Sugar: unchanged
- Freight Train: unchanged
- Nova Kane: unchanged
- Dread: unchanged
- Insurgency: unchanged
- Quantum Stabilizer: unchanged
- Data Bomb: unchanged
- Imitation Game: unchanged
- Brain Freeze: unchanged
- Stolen Briefcase: unchanged
- Multi Threading: unchanged
- Exploit: unchanged
- Implants: unchanged
- Adrenochrome: unchanged
- Cat Cafe: unchanged
- Wasteland: unchanged
- Forgotten Island: unchanged
- Splinter Faction: unchanged

## Image Files Needed (7 total new):
1. `gootooth.png`
2. `mousebyte.png`
3. `operator.png`
4. `chronomancer.png`
5. `architect.png`
6. `z0mbi.png`
7. `memoryleak.png`

## To Remove from binder.ts (not in OrangeCardsNew):
- BotFlies
- BluTooth
- Saboteur
- Frost Witch
- Wendy 500
- Leviathan
- Forgery
- Pirate Vessel (replaced by Memory Leak)
- Foresight (replaced by Precognition)

## Faction Structure:
```typescript
// Each faction has its own master array
const orangeBinder: Card[] = [...];  // All orange cards
const greenBinder: Card[] = [...];   // All green cards (future)
const purpleBinder: Card[] = [...];  // All purple cards (future)
const grayBinder: Card[] = [...];   // All gray cards (future)

// Decks are just arrays of indices into their faction binder
const deckOne = [0, 1, 2, 5, 8, ...]; // indices into orangeBinder
```

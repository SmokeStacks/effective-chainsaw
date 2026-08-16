# Orange Cards Implementation Status

## ✅ COMPLETED (Implemented + Tested)

### Ability Handlers Added to `orangeBinder.ts`:
- GooTooth - ActionGainVengeanceAndWound
- MouseByte - ExhaustTargetJAWFreeze
- Pharmacist - ExhaustGrantBoostAndPounce
- Con Artist - DominanceInflictOverloadAndLifeless
- Blood Sugar - BitPaymentGainStatsAndFreeze
- Chronomancer - AuraGrantBufferToOthers
- Architect - ActionDevelopPlacesAndThings
- Freight Train - ExhaustGrantBoostToAllies
- Nova Kane - BitPaymentGainBoost
- Memory Leak - BitPaymentGainActionAndWound
- Insurgency - ActionDamagePlaceAndGainAsh
- CatPhish - AuraAllEntitiesSurgical
- SylkWorm - AuraEnemyEntitiesFreeze
- Dread - DominanceInflictOverload + SurrenderGainOverload

### Ability Logic Implemented in `glossary.js`:
- All 13 new ability handlers with proper resource validation
- Aura effects with apply/remove hooks
- Target filtering for JAWbreaker, friendly online entities, Places
- Bit payment validation and deduction
- Unit tests for all abilities (17 tests, all passing)

### Fixed Issues:
- Duplicate ID 117 (Dread) removed
- Card definitions updated with abilities arrays

---

## ⚠️ PENDING (Needs Verification/Clarification)

### 1. **Sabotage Trigger** - TerraBite, Operator
- Handler exists but trigger event `cardStolen` needs verification
- **Question:** What game action triggers Sabotage?

### 2. **Hacking State Properties** - Poser, Z0MBI, Dread
- Code references `playerInterfaced`, `enemyInterfaced` which may not exist in state.js
- **Needs:** Verify state properties exist or add them

### 3. **Maintain Trigger** - VyperDrive
- Effect: "Gain 2 Vengeance when timer is reduced"
- **Question:** Is "Maintain" the start-of-turn timer reduction?

### 4. **Surrender Mechanic** - Dread
- Effect: "Surrender ➔ Gain 3 Overload"
- **Question:** What triggers "Surrender"?

### 5. **Scheme System** - Precognition, Data Bomb, Imitation Game
- Scaffolding exists but needs thorough testing
- Scheme threshold unlocking logic present

### 6. **Interface Mechanic** - Multiple cards
- Referenced in many cards but unclear definition
- **Question:** Is "Interface" same as "Access" or "Steal"?

### 7. **Search Pandora** - Implants, Archivist, Acolyte
- "Search and draw specific card type" mechanic
- Needs deck search UI implementation

### 8. **Impostor** - Poser, Recruiter
- Card exchange logic exists (`swapEntitiesForImpostor`)
- Needs edge case testing (costs, realms, ownership)

### 9. **Venom System** - Z0MBI
- Venom property tracked but accumulation/infliction needs verification

---

## ❌ NOT STARTED (Missing Implementation)

### Rituals:
- Stolen Briefcase - "Gain 5 Bits and 5 Ash"
- Dead Drop - "If Interfaced HeadSpace this turn, +8 bits..."
- Multi Threading - "Hack HeadSpace, Interface +2 cards"
- Exploit - "Hacker: give target JAWbreaker +1/+1, Stealth, Charge"
- Implants - "+4 Surge, +4 Ash, Search Pandora for JAWbreaker"

### Sym Effects:
- Adrenochrome - "Ascend ➔ Gain 4 Actions, 3 Ash, 2 Wounds"

### Landmark Effects:
- Wasteland - "Interface, Departed ➔ Inflict 1 Wound"
- Splinter Faction - "Ascend ➔ Deal 2 damage to enemy entities"

---

## Recommendation

**Critical to finish before Purple:**
1. Verify Sabotage trigger event
2. Add `playerInterfaced`/`enemyInterfaced` to state.js if missing
3. Clarify Interface vs Access/Steal mechanics

**Can parallelize with Purple:**
- Search Pandora UI (needed for Archivist, Acolyte in Purple too)
- Impostor edge case fixes
- Venom system polish

**Lower priority:**
- Ritual on-play effects (simple, can add as needed)
- Scheme system polish

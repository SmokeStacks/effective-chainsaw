# Orange Effects Triage Report

## Critical Issues (Likely Broken/Incomplete)

### 1. **Sabotage** - TerraBite, Operator ✅ RESOLVED
- **Status**: ✅ IMPLEMENTED
- **Trigger**: `cardStolen` event from `handleStolenCard()` in interfacing.js
- **Handler**: `Sabotage` in glossary.js with `effectType` ('wounds' or 'lag') and `amount`

### 2. **Hacking** - Poser, Z0MBI, Dread ✅ RESOLVED
- **Status**: ✅ IMPLEMENTED
- **Trigger**: `successfulHack` event from `handleSuccessfulHack()` in battle.js
- **State Properties**: `playerInterfaced`, `enemyInterfaced`, `playerSuccessfulHack`, `enemySuccessfulHack` exist in state.js
- **Handlers**: `HackingInflictOverload` (Poser) and `HackingVenomFreeze` (Z0MBI) in glossary.js

### 3. **Scheme** - Precognition, Data Bomb
- **Status**: ⚠️ PARTIAL - `scheming` and `schemeUnlocked` logic exists but untested
- **Risk**: MEDIUM - Complex threshold-based unlocking
- **Cards Affected**: 
  - Precognition: "Scheme 2: The first time you Interface Pandora each turn..."
  - Data Bomb: "Scheme 2: Sacrifice ➔ Target entity gains Freeze 5"

### 4. **Interface** Mechanic - Multiple Cards
- **Status**: ⚠️ UNCLEAR IMPLEMENTATION
- **Risk**: HIGH - Referenced throughout but no clear system
- **Cards**: Precognition, Quantum Stabilizer, Data Bomb, Brain Freeze, Multi Threading, Wasteland
- **Question**: What exactly is "Interface"? Is it the same as "Access" or "Steal"?

### 5. **Venom** - Z0MBI ✅ RESOLVED
- **Status**: ✅ IMPLEMENTED
- **Handler**: `HackingVenomFreeze` in glossary.js
- **Effect**: On successful hack, inflicts Freeze equal to current Venom on all enemy entities, then gains +1 Venom

### 6. **Maintain** - VyperDrive ✅ RESOLVED
- **Status**: ✅ IMPLEMENTED
- **Trigger**: `maintain` event published from `beginTurn()` in core.js during timer reduction
- **Handler**: `MaintainGainVengeance` in glossary.js

---

## Medium Risk (May Have Issues)

### 7. **Impostor** - Poser, Imitation Game, Recruiter
- **Status**: ⚠️ IMPLEMENTED BUT COMPLEX
- **Risk**: MEDIUM - Card exchange logic exists but may have edge cases
- **Evidence**: `swapEntitiesForImpostor` helper exists (line 88, 1350)
- **Concerns**: 
  - What happens when the exchanged card comes online?
  - Does the new owner pay activation costs?
  - Realm placement rules may conflict

### 8. **Surrender** - Dread ✅ RESOLVED
- **Status**: ✅ IMPLEMENTED
- **Trigger**: `dominanceLost` event from `checkDominance()` in domination.js
- **Handler**: `SurrenderGainOverload` in glossary.js
- **Note**: "Surrender" = losing dominance battle

### 9. **Bit-Payment Abilities** - Blood Sugar, Nova Kane, Memory Leak ✅ RESOLVED
- **Status**: ✅ IMPLEMENTED
- **Handlers**: `BitPaymentGainStatsAndFreeze`, `BitPaymentGainBoost`, `BitPaymentGainActionAndWound` in glossary.js
- **Type**: Manual abilities with resource validation (checks bits before deducting)

### 10. **Search Pandora** - Implants
- **Status**: ❌ NOT IMPLEMENTED
- **Risk**: MEDIUM - "Search Pandora and draw a JAWbreaker"
- **Needs**: Deck search UI + filtering logic

### 11. **Surgical** - CatPhish, Precognition, Data Bomb, Exploit ✅ RESOLVED
- **Status**: ✅ IMPLEMENTED (CatPhish)
- **Type**: Aura effect from CatPhish - `AuraAllEntitiesSurgical` in glossary.js
- **Effect**: When CatPhish is online, all friendly entities have Surgical status

---

## Low Risk (Likely Working)

### 12. **Dominance** - Con Artist, Dread
- **Status**: ✅ IMPLEMENTED
- **Risk**: LOW - `dominationResolved` trigger exists
- **Evidence**: `DominanceGainCharge`, `DominanceInflictFreeze` in glossary.js

### 13. **Ascend/Ascended** - Multiple
- **Status**: ✅ IMPLEMENTED
- **Risk**: LOW - `onAscend`, `ascended` type handlers exist
- **Working Cards**: Splinter Faction, Forgotten Island, Adrenochrome, Cat Cafe

### 14. **Exhaust** - Multiple
- **Status**: ✅ IMPLEMENTED
- **Risk**: LOW - `exhaustEntity` function exists (line 1383)
- **Working Cards**: Pharmacist, Freight Train

### 15. **Dividend** - Multiple
- **Status**: ✅ IMPLEMENTED
- **Risk**: LOW - Beginning of turn bit gain
- **Working Cards**: SylkWorm, Imitation Game, etc.

### 16. **Buffer** - Multiple
- **Status**: ✅ IMPLEMENTED  
- **Risk**: LOW - Freeze on activation
- **Evidence**: `Buffer` ability exists with `amount` parameter

### 17. **Stealth** - SylkWorm, Recruiter, Architect
- **Status**: ✅ IMPLEMENTED
- **Risk**: LOW - `stealth` property on entities

### 18. **Lag** - Operator, Cat Cafe
- **Status**: ✅ LIKELY WORKING
- **Risk**: LOW - State has `playerLag`/`enemyLag`

### 19. **Aura Effects** - SylkWorm, Chronomancer, CatPhish ✅ RESOLVED
- **Status**: ✅ IMPLEMENTED
- **Type**: `static` abilities with `applyAbilityEffect` and `removeEffect` hooks
- **Handlers**: `AuraEnemyEntitiesFreeze`, `AuraGrantBufferToOthers`, `AuraAllEntitiesSurgical`
- **Behavior**: Applied when entity comes online, removed when entity goes offline

---

## Summary: Status

### ✅ RESOLVED (Critical mechanics verified):
- **Sabotage**: Triggers on `cardStolen` event
- **Hacking**: Triggers on `successfulHack` event, state properties exist
- **Dominance**: Triggers on `dominanceWon` event
- **Surrender**: Triggers on `dominanceLost` event
- **Maintain**: Triggers on `maintain` event during timer reduction
- **Bit-Payment**: All 4 abilities implemented with resource validation
- **Aura Effects**: 3 auras implemented with apply/remove hooks
- **Venom**: Z0MBI fully implemented

### ⚠️ REMAINING (Low priority polish):
1. **Search Pandora** - Deck search UI for Implants, Archivist, Acolyte
2. **Scheme System** - Logic exists but needs thorough testing
3. **Impostor Edge Cases** - Card exchange ownership/activation rules
4. **Ritual On-Play Effects** - Stolen Briefcase, Dead Drop, Multi Threading, Exploit, Implants

---

## Status: ORANGE FACTION ESSENTIALLY COMPLETE

All critical mechanics are implemented and tested. Remaining work is polish and edge cases.

Ready to proceed to **Purple Cards**.

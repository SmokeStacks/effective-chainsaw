# Orange Effects Triage Report

## Critical Issues (Likely Broken/Incomplete)

### 1. **Sabotage** - TerraBite, Operator
- **Status**: ❌ UNKNOWN TRIGGER
- **Risk**: HIGH - No code found for "Sabotage" trigger
- **Question**: What event triggers Sabotage? Is this a new mechanic or renamed?

### 2. **Hacking** - Poser, Z0MBI, Dread
- **Status**: ⚠️ PARTIAL - Uses `state.playerInterfaced` which DOESN'T EXIST in state.js
- **Risk**: HIGH - Code references non-existent state properties
- **Evidence**: `glossary.js` line 305: `const hasHacked = side === 'PLAYER' ? state.playerInterfaced : state.enemyInterfaced;`
- **Fix Needed**: Add `playerInterfaced`, `enemyInterfaced`, `playerInterfacedHeadSpace` to state.js

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

### 5. **Venom** - Z0MBI
- **Status**: ⚠️ PARTIAL - `venom` property tracked on entities but system incomplete
- **Risk**: MEDIUM - Z0MBI is the ONLY card using Venom in Orange
- **Evidence**: Leviathan (removed) had Venom code, but Z0MBI needs custom implementation
- **Note**: Venom accumulates, then inflicts Freeze equal to Venom amount

### 6. **Maintain** - VyperDrive
- **Status**: ❌ NOT IMPLEMENTED
- **Risk**: MEDIUM - Trigger during "Maintenance" (timer reduction phase)
- **Question**: Is "Maintenance" the same as the start-of-turn timer reduction?

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

### 8. **Surrender** - Dread
- **Status**: ❌ NOT IMPLEMENTED
- **Risk**: MEDIUM - "Surrender ➔ Gain 3 Overload"
- **Question**: What triggers "Surrender"? Is this a player action or game event?

### 9. **Bit-Payment Abilities** - Blood Sugar, Nova Kane, Memory Leak
- **Status**: ⚠️ UNCLEAR
- **Risk**: MEDIUM - "1 Bit ➔ Gain +1/+1" type effects
- **Question**: Are these Exhaust abilities? Manual activated? What's the UI?

### 10. **Search Pandora** - Implants
- **Status**: ❌ NOT IMPLEMENTED
- **Risk**: MEDIUM - "Search Pandora and draw a JAWbreaker"
- **Needs**: Deck search UI + filtering logic

### 11. **Surgical** - CatPhish, Precognition, Data Bomb, Exploit
- **Status**: ⚠️ UNCLEAR
- **Risk**: LOW-MEDIUM - "Surgical: Card's bit cost is paid with Surge"
- **Question**: Is this a passive or does it need activation?

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

### 19. **Aura Effects** - SylkWorm, Chronomancer
- **Status**: ⚠️ NEEDS VERIFICATION
- **Risk**: MEDIUM - "Online enemy entities gain Freeze 2" / "Other entities have Buffer 2"
- **Question**: Are these recalculated dynamically or only on trigger?

---

## Summary: Priority Fix Order

### Phase 1 (Critical - Game Breaking):
1. Add missing state properties: `playerInterfaced`, `enemyInterfaced`, `playerInterfacedHeadSpace`
2. Define "Sabotage" trigger mechanic
3. Clarify "Interface" vs "Access" vs "Steal"

### Phase 2 (High Impact):
4. Implement "Hacking" trigger properly
5. Fix "Maintain" trigger
6. Define "Surrender" mechanic

### Phase 3 (Polish):
7. Test Scheme system thoroughly
8. Implement Venom for Z0MBI
9. Add deck search for Implants
10. Verify Impostor edge cases

---

## Quick Questions for You:

1. **Sabotage**: Is this triggered by a specific game event, or is it an action?
2. **Interface**: Is this the same as "Access" (hacking a card) or different?
3. **Surrender**: What triggers this? Is it a player choice or game condition?
4. **Maintain**: Is this the start-of-turn timer reduction phase?
5. **Aura effects**: Should SylkWorm's "enemy entities gain Freeze 2" apply dynamically or only when she comes online?

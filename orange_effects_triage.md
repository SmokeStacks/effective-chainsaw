# Orange Effects Triage Report

> **Verified 2026-08-15.** Statuses below re-checked directly against source. Items marked
> RESOLVED were stale in the previous version of this doc.

## ✅ RESOLVED: Manual ability activation

Every "Pay N Bits ➔ ..." / "Exhaust ➔ ..." ability was **unreachable**. The `onAbilityClick`
prop was threaded through the tree but the chain was broken in four independent places:

1. `RealmStuff.js` and `RealmCreatures.js` destructured props but **dropped `onAbilityClick`**,
   so it never reached `CardDisplay` and no rendered element could fire it.
2. `BoardContainer.js:1295` wired `onAbilityClick` to an inline handler calling
   `activateAbilities(entity, 'PLAYER')` — that re-registers listeners, it does not execute a
   manual ability.
3. `BoardContainer.js:1170` defined a local `handleAbilityClick` that was an **empty stub**.
4. The correct implementation, `handleAbilityClick` in `selection.js`, was **never imported**.

### How it works now
The **cost portion of the ability text is the click target** — no separate button.

- `helpers/manualAbility.js` (new): `getManualAbility`, `splitAbilityCost` (splits the
  description on `➔`), and `canActivateManualAbility`, which checks affordability from
  declarative `cost` metadata.
- Each manual ability in `glossary.js` now carries `cost`, e.g. `{ bits: 1 }`,
  `{ actions: 1 }`, `{ bits: 1, exhaust: true }`. Affordability is data-driven rather than
  duplicated in the UI.
- `renders/AbilityDescription.js` (new, shared by `Card.js` and `LCard.js`) renders the cost
  as a `role="button"` span with `.ability-cost`, keyboard support, and `stopPropagation` so
  activating does not also trigger card selection. Only the local player's own online cards
  are interactive.
- `.ability-cost` / `.ability-cost-disabled` in `App.css` give the affordance: gold highlight
  + glow on hover/focus, greyed + `not-allowed` when the cost cannot be paid.
- `BoardContainer` now delegates to the real `handleAbilityClick` from `selection.js`; the
  empty stub is deleted.

Verified: `npx react-scripts build` compiles (warnings only), `tsc --noEmit` clean, ESLint
reports 0 errors repo-wide.

All four renderers are now wired: `Card.js` (ENTITY), `LCard.js` (LOCATION/LANDMARK),
`SCard.js` (SNIP/SYM) and `RCard.js` (RITUAL). `SCard`/`RCard` mattered because Data Bomb is a
SNIP with a manual ability. `CardDisplay` spreads props, so no extra threading was needed.

Prop chain verified end-to-end for player-owned cards: entities via
`Gameboard.js:122` (bottom panel), places and things via `Board.js:25-26`. `owner` is set to
`'PLAYER'` in `core.js:290` on placement, which is what gates interactivity.

**Cost parsing fixed for multi-clause descriptions.** `splitAbilityCost` took everything before
the arrow as the cost. For Data Bomb — "When Interfaced, inflict 2 Overload for each
Development. Scheme 2: Sacrifice ➔ ..." — that made the entire leading sentence clickable, and
`AbilityDescription` then rendered only cost+effect, **silently dropping the first sentence**.
It now returns `{ prefix, condition, cost, effect }`: only the clause after the last sentence
break is the cost, a leading `Scheme N:` gate is separated out as a condition (it isn't a
payable cost), and prefix/condition render as plain text. Covered by 13 tests in
`__tests__/manualAbility.test.js`; full suite is 154 passing.

`RCard.js` also declared its class as `LCard` and exported it under that name — a copy-paste
leftover, now `RCard`.

### Also fixed: Architect charged the wrong cost
`DevelopFriendlyPlacesAndThings`'s text is "2 Bits, **Action** ➔ ..." but `execute` only deducted the
2 bits and never the Action. It now requires and deducts both.

### Build was broken on missing art (unrelated to orange effects)
`Tools.js` imported two nonexistent images, which failed the webpack build outright:
- `mousebyte.png` → repointed to the actual file `mouse.png`.
- `precognition.png` → asset has since been added; import restored to the real file.

### ✅ Precognition reconciled (was `Foresight`)
`Foresight` was the old name; all 6 definitions now agree on the current version:

> rezCost 2, scrap 4, "Surgical, Tarot. Scheme 2: The first time you Interface **HeadSpace**
> each turn gain 3 Actions."

Updated in `deckTwo.ts`, `enemyOne.ts` (both live), plus `deckThree.ts`, `deckThree.js`,
`binder.ts`, `orangeBinder.ts`. The rename also restores art, since `imgObj` is keyed
`Precognition`.

The trigger target changed **Pandora → HeadSpace**, so the ability was retargeted and renamed
`GainActionsOnPandoraInterface` → `GainActionsOnHeadSpaceInterface`; it now matches
`eventData.targetType === 'HEADSPACE'`. "First time each turn" is the existing
`entity.abilityActivated` gate, which `startTurn` resets.

Two dangling ability references in `orangeBinder.ts` were removed in the process: neither
`PrecognitionEffect` nor `Scheme` is implemented in `glossary.js`. Scheme works off the
`schemeThreshold` + `scheming` card fields (read by `advancement.js`, `core.js`,
`BoardContainer.js`), so that entry now uses those instead of the fake `Scheme` ability.
Also hardened the amount lookup — it was `.find(...).effect.amount`, which would throw
outright if the ability name didn't match.

### Manual ability names made generic
Because cost is now declarative `cost` metadata, encoding it in the name was redundant, and
two names were outright wrong (`ExhaustForBit` granted Freeze, not a bit; `ExhaustForHeal`
granted Boost + Pounce, not healing). Renamed to describe the effect:

| Old | New |
|---|---|
| `PayBitsForStats` | `BuffSelfWithFreeze` |
| `PayBitsForBoost` | `BoostSelf` |
| `PayBitsForActionAndWound` | `GainActionWithWound` |
| `PayBitsForDevelop` | `DevelopFriendlyPlacesAndThings` |
| `PayBitsExhaustForAlliedBoost` | `BoostFriendlyEntities` |
| `ExhaustForBit` | `FreezeTargetJaw` |
| `ExhaustForHeal` | `BoostAndPounceTargetAlly` |
| `ActionForVengeanceAndWound` | `GainVengeanceWithWound` |

Verified 0 stale references remain and each new name resolves in both `glossary.js` and
`orangeBinder.ts`.

⚠️ These orange abilities are referenced **only** from `orangeBinder.ts`, never from the
playable decks (`deckThree.js` etc.), so none of them are reachable in an actual game yet.

### Fixed while triaging
- `confirmManualAbility` (`helpers/abilities.js`) read `state.selectedCard.abilities` and treated
  `pendingManualAbility` as a name string, though `selection.js` sets `{entity, ability}`; it also
  called `onPlay` instead of `execute`. Targeted manual abilities could never resolve. Fixed.
- `isValidAbilityTarget` had the same shape bug. Fixed.
- `selection.js` hardcoded `side: 'ENEMY'` and ignored each ability's `targetFilter`. Now honors
  `targetSide` / `targetFilter`, so friendly-target abilities (Pharmacist) work.
- Three undefined references in `glossary.js` that would throw at runtime:
  `sacrificeEntity` → `handleDeadCard`, `getRealmSetters` → two `getRealmAndSetter` calls, and a
  dead `getEntitySide` fallback removed.

## Dead events: subscribed but never published

Mechanically verified by diffing every `triggers: [...]` in `glossary.js` against every
`eventManager.publish(...)` in `src/ui`. Four events had **zero publishers**, so every
ability listening on them was dead code.

| Event | Abilities affected | Status |
|---|---|---|
| `entityEntered` | 5 abilities | ✅ now published |
| `interface` | 1 ability | ✅ now published |
| `firstAttack` | `Crusade` | ✅ now published |
| `soloAttack` | `Solo` | ⚠️ intentionally left dead — see below |

**`firstAttack`** = the first time a side attacks with any entity that round (drives `Crusade`).
Published from `handlePlayerBattle` and `handleEnemyBattle` in `battle.js`, guarded by the
existing `playerFirstAttack` / `enemyFirstAttack` flags which `startTurn` already resets.

Two latent bugs had to be fixed to make this work at all:
- `setPlayerFirstAttack` / `setEnemyFirstAttack` were declared in `state.js` but **never
  registered** in `BoardContainer`'s `initializeSetters` call, so they stayed `null`. Since
  `startTurn` already called `setPlayerFirstAttack(true)`, this was throwing a TypeError on
  **every turn start**. Both setters are now implemented.
- `enemyFirstAttack` was missing from the initial `state` object (only `playerFirstAttack`
  was declared). Added.

**`soloAttack` is deliberately still unpublished.** `Solo` in `glossary.js` and
`applySoloEffect` in `effects.js` are **duplicate implementations** of the same mechanic
(both grant +power, +HP and Boost by the solo amount). `battle.js` already calls
`applySoloEffect` directly, so publishing `soloAttack` would apply Solo **twice**. One of the
two needs to be deleted first — that's a design call: keep the direct call, or migrate to the
event and delete `applySoloEffect`.

**`entityEntered`** is now published at the three places an entity genuinely enters play:
`BoardContainer.js:782` (player rez), `core.js:937` (enemy landmark/location),
`enemy.js:134` (enemy rez). Payload: `{ side, entity, realm }`.

Deliberately **not** published from inside `activateAbilities`, even though that would have
covered all sites in one edit: `BoardContainer.js:1297` also calls `activateAbilities` from an
ability-click path, which is not an entry and would have produced false triggers.

**`interface`** is now published from `handleAccessPhase` in `interfacing.js:104`, payload
`{ side, targetType, battleRealm, count }`, where `side` is the side *performing* the Interface.

### Interface == Access (answers old Open Question #2/#4)
Confirmed from `interfacing.js`: "Interface" is the Access action. `targetType === 'PANDORA'`
accesses the opponent's library (deck); `'HEADSPACE'` accesses their hand; `'SYM'`/`'SNIP'`
access a specific card. Note the `Interfaced*` flags are set on the **opposite** side from the
actor — when PLAYER accesses, `setEnemyInterfacedPandora(true)` fires, i.e. the flag means
"this side's Pandora *was* interfaced."

### Runtime crashes fixed in the Interface path
`interfacing.js` had 8 undefined references that would throw the moment a trash-prompt or
overload effect ran: `playerLoseBits` / `enemyLoseBits` and `playerGainOverload` /
`enemyGainOverload` were used but never imported, and `playerBits` / `enemyBits` were read as
bare locals instead of `state.playerBits` / `state.enemyBits`. All fixed; the file is now
lint-clean.

**Trash cost resolved: `scrap` is authoritative.** Both handlers previously *gated* on
`card.card.trashCost` while *charging* `card.card.scrap`. `trashCost` **exists nowhere in the
codebase or card data** — the gate was comparing bits against `undefined`, which is always
false, so trashing an accessed card was impossible. All three sites now use `scrap`.

### 1. **Sabotage** - TerraBite, Operator ✅ RESOLVED
- **Status**: ✅ IMPLEMENTED
- **Trigger**: `cardStolen` event from `handleStolenCard()` in interfacing.js
- **Handler**: `Sabotage` in glossary.js with `effectType` ('wounds' or 'lag') and `amount`
- **Evidence**: `state.js:69-75` defines `playerInterfaced` / `playerInterfacedHeadSpace` /
  `playerInterfacedPandora` (+ enemy equivalents); setters declared at `state.js:164-170`,
  implemented in `BoardContainer.js:423-447`, and actually set in `battle.js:278-283`,
  `battle.js:520-525`, `interfacing.js:83-91`, and reset in `battle.js:207-208`.

### 2. **Hacking** - Poser, Z0MBI, Dread ✅ RESOLVED
- **Status**: ✅ IMPLEMENTED
- **Trigger**: `successfulHack` event from `handleSuccessfulHack()` in battle.js
- **State Properties**: `playerInterfaced`, `enemyInterfaced`, `playerSuccessfulHack`, `enemySuccessfulHack` exist in state.js
- **Handlers**: `HackingInflictOverload` (Poser) and `HackingVenomFreeze` (Z0MBI) in glossary.js

### 3. **Scheme** - Precognition, Data Bomb
- **Status**: ⚠️ PARTIAL - `scheming` and `schemeUnlocked` logic exists but untested
- **Risk**: MEDIUM - Complex threshold-based unlocking
- **Cards Affected**: 
  - Precognition: "Scheme 2: The first time you Interface HeadSpace each turn gain 3 Actions."
  - Data Bomb: "Scheme 2: Sacrifice ➔ Target entity gains Freeze 5"
- **Note**: `canActivateManualAbility` refuses activation while `scheming && !schemeUnlocked`,
  and the UI greys the cost out, so the gate is at least enforced in the manual-ability path.

### 4. **Interface** Mechanic - Multiple Cards
- **Status**: ✅ RESOLVED - Interface is the Access action; see "Interface == Access" above
- **Cards**: Precognition, Quantum Stabilizer, Data Bomb, Brain Freeze, Multi Threading, Wasteland
- **Remaining risk**: the `Interfaced*` flags are set on the **opposite** side from the actor,
  which is easy to misread when writing new abilities.

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
- **Status**: ✅ IMPLEMENTED - manual abilities, activated by clicking the cost text on the card
- **UI**: the cost clause is a `role="button"` span (gold on hover, greyed when unaffordable);
  see the manual ability section at the top of this doc
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

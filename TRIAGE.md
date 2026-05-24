# Triage — effective-chainsaw

A read-only pass through the active code paths to identify what's wired up, what's dead, and what's likely broken. This drives the fix + test plan.

## What's actually wired up

`src/App.js` only renders `BoardContainer`. The active graph is:

- **UI orchestrator:** `src/ui/BoardContainer.js` (1569 lines, owns React state + setter wiring)
- **Game logic:** everything under `src/ui/helpers/` — core.js, battle.js, damage.js, effects.js, game.js, player.js, enemy.js, enemy/{attack,rez}.js, advancement.js, interfacing.js, selection.js, activation.js, domination.js, sacrifice.js, boost.js, abilities.js, actions.js, eventManager.js, entity.js, modal.js, setup.js, utils.js, state.js
- **Card data:** `src/ui/abilities/glossary.js` (1469 lines of ability definitions)

## Defunct / dead code

- `src/rules/` — entire folder is commented-out TypeScript stubs. Never imported.
- `src/logic/gameLogic.js` + `src/state/gameReducer.js` — an unfinished reducer-based architecture parallel to `helpers/`. Not imported by App.
- `src/ui/GameboardOld.js` and `src/appCopy.css` — leftover.
- `src/ui/helpers/core.js` `handleRealmSelect` (lines 205–381) is exported but `BoardContainer` defines and uses its own. Dead.
- `src/App.test.js` — default CRA "learn react" test; will fail.
- Commented-out `confirmRitualActivation` in `core.js` (lines 383–388).

## Architectural smells (these cause real bugs)

1. **Stale top-level destructuring across helpers.** `battle.js`, `damage.js`, `core.js`, `glossary.js`, and `state.js` itself destructure `state` and `stateSetters` at module-load time, before `BoardContainer`'s `useEffect` runs `initializeSetters`. Setter destructures are `null`; state destructures are initial empty arrays — frozen. Single biggest source of "nothing works" bugs in combat/damage. Fix: always reference `state.X` and `stateSetters.setX` at call time.

2. **Dual sources of truth for realms.** Global `state.playerSolarium` etc. and `BoardContainer`'s local `realms.player.solarium` are both written. `setEnemySolarium` writes to both; `setPlayerSolarium` only writes to gameState. Asymmetric. `handleRealmSelect` in BoardContainer writes to both `realms` and the realm setter — likely double-adds.

2a. **Player realm setter wrappers don't handle updater-function form.** `setPlayerSolarium: (value) => { ... state.playerSolarium = value; }` stores the value as-is. But `handleRealmSelect` (line 1352) and `startTurn` (core.js line 1320 etc.) pass an updater function: `setPlayerSolarium(prevRealm => ({...prevRealm, people: [...]}))`. The wrapper stores the literal function into `state.playerSolarium`. The UI happens to look right because it reads from the separate `realms` state, but any game logic that reads `state.playerSolarium` sees a function. The bits/actions setters do handle updater functions; the realm setters need the same fix.

3. **Dead useEffects.** ~12 useEffects in BoardContainer with empty `[]` deps read state inside, so they only run once at mount. Win/loss checks never fire; "begin game" block doesn't trigger after mount; domination-phase trigger never fires; burden check is duplicated 3x.

4. **Two `playerGainBits` implementations with different semantics.**
   - `game.js` — ignores overload.
   - `player.js` — honors overload (correct).
   - `core.js` re-exports the broken `game.js` one; most callers bypass overload.

5. **Rule/data drift between `notes.txt` and code:**
   - Notes: 4 realms. Code: 5 (added Elysium).
   - Notes: starting bits = 4. Code: 5.
   - Notes: win thresholds = 8. Code: checks `>= 10`.
   - Notes: "Each point you would gain decreases the status by the same amount." Code subtracts the status from gain but never decrements the status itself.

6. **Library card instances have wrong types for keyword stats.** `setup.js` initializes `charge/deathless/override/stealth/armored/solo` as booleans, but `draft.js` correctly uses numbers, and damage code treats them as numbers. Library cards have broken keyword stats.

7. **1-player AI** matches the user's mental model: `enemyPerformAction` never checks rezCost; `enemyGainBits(enemyDividendAmount=2)` per turn. Recursion via `setTimeout(1000)` races with React state updates.

8. **`endTurn`/`startTurn` mismatch.** Player gets 3 actions, enemy gets 2 (`enemyGainActions(2 + drift)`).

9. **`endTurn` never gets called** in normal play — its sole trigger is a dead useEffect.

## Prioritized fix + test plan

1. **Foundation:** delete CRA default test. Set up Jest harness with a `createTestState()` factory that resets `state` and installs plain function setters into `stateSetters`, synchronously, without React.
2. **Resource math** (`game.js`/`player.js`/`enemy.js`): consolidate duplicate `playerGainBits`; fix status-decrement semantics.
3. **Card setup** (`setup.js`): fix boolean→number keyword init.
4. **Simple actions:** mine, draft, draw.
5. **Play card → realm placement:** consolidate the two paths; pick one source of truth for realms.
6. **Boost / Develop.**
7. **Combat** (`battle.js` + `damage.js`): kill top-level destructuring.
8. **Attack types** Quest/Raid/Hack with unblocked damage.
9. **Interfacing** (Hack stealing/exposing).
10. **Entity effects / abilities** — `glossary.js`, card-by-card.
11. **Turn loop / domination:** revive dead useEffects.
12. **Win conditions:** reconcile thresholds (8 vs 10).
13. **Cleanup pass:** delete `src/rules/`, `src/logic/`, `src/state/`, `GameboardOld.js`, `appCopy.css`, dead `handleRealmSelect` in `core.js`.

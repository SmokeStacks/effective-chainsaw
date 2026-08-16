# Orange Effects Implementation Checklist

## Entity Effects

| Card | Effect | Status |
|------|--------|--------|
| **TerraBite** | Sabotage ➔ Inflict 3 Wounds | ✅ Handler exists, triggers on 'cardStolen' |
| **GooTooth** | Action ➔ Gain 2 Vengeance and 1 Wound | ✅ Implemented |
| **MouseByte** | Exhaust ➔ Target JAW gains 1 Freeze | ✅ Implemented |
| **VyperDrive** | Maintain ➔ Gain 2 Vengeance | ✅ Implemented, triggers on 'maintain' event |
| **CatPhish** | Your entities are Surgical | ✅ Aura implemented |
| **SylkWorm** | Online enemy entities gain Freeze 2 | ✅ Aura implemented |
| **Pharmacist** | Exhaust ➔ Target friendly Online entity gains 2 Boost and Pounce | ✅ Implemented |
| **Operator** | Sabotage ➔ Inflict 2 Lag | ✅ Handler exists, triggers on 'cardStolen' |
| **Poser** | Hacking ➔ inflict 3 Overload | ✅ Implemented, triggers on 'successfulHack' |
| **Recruiter** | Your Dreamers are Impostors | ⚠️ Impostor logic exists, needs testing |
| **Con Artist** | Dominance ➔ Inflict 2 Overload and gain Lifeless | ✅ Implemented |
| **Blood Sugar** | 1 Bit ➔ Gain +1/+1 and 1 Freeze | ✅ Implemented |
| **Chronomancer** | Other entities have Buffer 2 | ✅ Aura implemented |
| **Architect** | 2 Bits, Action ➔ Friendly Places and Things gain 2 Develop | ✅ Implemented |
| **Freight Train** | 1 Bit, Exhaust ➔ Friendly entities gain 1 Boost | ✅ Implemented |
| **Z0MBI** | Hacking ➔ Inflict Freeze equal to Venom on enemy entities, then +1 Venom | ✅ Implemented |
| **Nova Kane** | 1 Bit ➔ Gain 1 Boost | ✅ Implemented |
| **Dread** | Dominance ➔ Inflict 3 Overload. Surrender ➔ Gain 3 Overload | ✅ Implemented (Surrender = 'dominanceLost') |

## Location Effects

| Card | Effect | Status |
|------|--------|--------|
| **Memory Leak** | 1 Bit ➔ Gain 1 Action and 1 Wound | ✅ Implemented |
| **Insurgency** | 2 Actions ➔ Deal 2 Damage to target Place and gain 2 Ash | ✅ Implemented |

## Snip Effects

| Card | Effect | Status |
|------|--------|--------|
| **Precognition** | Scheme 2: The first time you Interface Pandora each turn gain 2 Actions | Needs scheme system + pandora interface hook |
| **Quantum Stabilizer** | When you Interface Pandora, Interface 1 additional card | Needs pandora interface hook |
| **Data Bomb** | Interface: Inflict 2 Overload for each Development. Scheme 2: Sacrifice ➔ Target entity gains Freeze 5 | Needs complex interface/scheme logic |
| **Imitation Game** | Dividend 2. Impostor | Passive dividend + Impostor ability |

## Ritual Effects

| Card | Effect | Status |
|------|--------|--------|
| **Brain Freeze** | Perform a Hack on HeadSpace. If successful, give all entities Freeze 3 and inflict 2 Overload | Needs complex hack execution |
| **Stolen Briefcase** | Gain 5 Bits and 5 Ash | Simple on-play effect |
| **Dead Drop** | If you Interfaced HeadSpace this turn, +8 bits and place an enemy Adrenochrome IRL | Needs turn state tracking + card placement |
| **Multi Threading** | Perform a Hack on HeadSpace. If succesful, Interface +2 cards and gain 2 Actions | Needs hack execution |
| **Exploit** | Hacker: give target friendly online JAWbreaker +1/+1, Stealth, and Charge | Needs hacker check + stat buffs |
| **Implants** | +4 Surge and +4 Ash. Search Pandora and draw a JAWbreaker | Needs deck search mechanic |

## Sym Effects

| Card | Effect | Status |
|------|--------|--------|
| **Adrenochrome** | Ascend ➔ Gain 4 Actions, 3 Ash, and 2 Wounds | Needs ascend trigger |
| **Cat Cafe** | Ascended: Beginning of Turn ➔ Inflict 1 Lag | Needs ascended state + turn trigger |

## Landmark Effects

| Card | Effect | Status |
|------|--------|--------|
| **Wasteland** | Interface, Departed ➔ Inflict 1 Wound | Needs interface/departed hooks |
| **Forgotten Island** | (no description effect) | Pure ascend/fate mechanic |
| **Splinter Faction** | Ascend ➔ Deal 2 damage to enemy entities | Needs ascend trigger |

## Key Mechanics to Verify:

- [x] **Sabotage** - ✅ Triggers on 'cardStolen' event
- [x] **Hacking** trigger - ✅ Triggers on 'successfulHack' event
- [x] **Dominance** trigger - ✅ Triggers on 'dominanceWon' event
- [x] **Surrender** mechanic - ✅ Implemented as 'dominanceLost' event
- [x] **Maintain** trigger - ✅ Fires during timer reduction phase
- [ ] **Scheme** system - ⚠️ Logic exists, needs thorough testing
- [x] **Interface** mechanic - ✅ Published as 'successfulHack' event
- [ ] **Impostor** - ⚠️ Logic exists, needs edge case testing
- [x] **Venom** tracking - ✅ Z0MBI fully implemented
- [x] **Ascend/Ascended** state - ✅ Handlers exist
- [x] **Lifeless** - ✅ Status effect implemented
- [x] **Surgical** - ✅ Aura implemented for CatPhish

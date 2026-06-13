# Orange Effects Implementation Checklist

## Entity Effects

| Card | Effect | Status |
|------|--------|--------|
| **TerraBite** | Sabotage ➔ Inflict 3 Wounds | Needs ability handler |
| **GooTooth** | Action ➔ Gain 2 Vengeance and 1 Wound | Needs ability handler |
| **MouseByte** | Exhaust ➔ Target JAW gains 1 Freeze | Needs ability handler |
| **VyperDrive** | Maintain ➔ Gain 2 Vengeance | Needs trigger on timer reduce |
| **CatPhish** | Your entities are Surgical | Passive - needs combat check |
| **SylkWorm** | Online enemy entities gain Freeze 2 | Aura - needs game state hook |
| **Pharmacist** | Exhaust ➔ Target friendly Online entity gains 2 Boost and Pounce | Needs ability handler |
| **Operator** | Sabotage ➔ Inflict 2 Lag | Needs ability handler |
| **Poser** | Hacking ➔ inflict 3 Overload | Needs hack success trigger |
| **Recruiter** | Your Dreamers are Impostors | Needs deck/card creation hook |
| **Con Artist** | Dominance ➔ Inflict 2 Overload and gain Lifeless | Needs domination trigger |
| **Blood Sugar** | 1 Bit ➔ Gain +1/+1 and 1 Freeze | Needs bit-payment ability |
| **Chronomancer** | Other entities have Buffer 2 | Aura - needs stat calc hook |
| **Architect** | 2 Bits, Action ➔ Friendly Places and Things gain 2 Develop | Needs ability handler |
| **Freight Train** | 1 Bit, Exhaust ➔ Friendly entities gain 1 Boost | Needs ability handler |
| **Z0MBI** | Hacking ➔ Inflict Freeze equal to Venom on enemy entities, then +1 Venom | Needs hack trigger + venom tracking |
| **Nova Kane** | 1 Bit ➔ Gain 1 Boost | Needs bit-payment ability |
| **Dread** | Dominance ➔ Inflict 3 Overload. Surrender ➔ Gain 3 Overload | Needs dominance/surrender triggers |

## Location Effects

| Card | Effect | Status |
|------|--------|--------|
| **Memory Leak** | 1 Bit ➔ Gain 1 Action and 1 Wound | Needs ability handler |
| **Insurgency** | 2 Actions ➔ Deal 2 Damage to target Place and gain 2 Ash | Needs ability handler |

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

- [ ] **Sabotage** - Is this implemented? What triggers it?
- [ ] **Hacking** trigger - For Poser, Z0MBI, Dread
- [ ] **Dominance** trigger - For Con Artist, Dread
- [ ] **Surrender** mechanic - For Dread
- [ ] **Maintain** - Timer reduction trigger (VyperDrive)
- [ ] **Scheme** system - For Precognition, Data Bomb
- [ ] **Interface** mechanic - For Pandora/HeadSpace interfacing
- [ ] **Impostor** - Card exchange control mechanic
- [ ] **Venom** tracking - For Z0MBI
- [ ] **Ascend/Ascended** state - For Syms and Landmarks
- [ ] **Lifeless** - End of turn sacrifice
- [ ] **Surgical** - Bit cost paid with Surge

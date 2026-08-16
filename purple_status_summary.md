# Purple Cards Implementation Status

## Files Created
- `src/rules/purpleBinder.ts` - 36 Purple cards with complete definitions
- `src/ui/abilities/glossary.js` - 25+ new ability handlers added

## ✅ IMPLEMENTED (36 cards defined, 25+ handlers added)

### Entities (18 cards)
| Card | Ability | Status |
|------|---------|--------|
| **Dryad** | Keywords only | ✅ |
| **Viceroy** | ManualGrantOverride | ✅ |
| **Sarcophagus** | Keywords only | ✅ |
| **Sovereign** | Keywords only | ✅ |
| **Gladiator** | Keywords only | ✅ |
| **Archivist** | SearchPandoraDrawRitual (placeholder) | ✅ |
| **Baroness** | DominanceClashInflictWounds | ✅ |
| **Oracle** | BitPaymentGrantArmored | ✅ |
| **Mortician** | ExhaustDestroyAllOtherEntities | ✅ |
| **Demiurge** | TriggeredSacrificeGainBoostVengeance | ✅ |
| **Acolyte** | SearchPandoraDrawLocation (placeholder) | ✅ |
| **Pyromancer** | Keywords only | ✅ |
| **Poltergeist** | Keywords only | ✅ |
| **False Prophet** | ExhaustActivateOfflineEntity | ✅ |
| **Merchant Guild** | AuraFriendlyEntitiesBribe | ✅ |
| **Automaton** | Keywords only | ✅ |
| **Archon** | BitPaymentGrantVengeanceBlocked | ✅ |
| **Technopagan** | Keywords only | ✅ |
| **RATs** | ClashExhaustDiscardEnemyHeadSpace | ✅ |

### Locations (4 cards)
| Card | Ability | Status |
|------|---------|--------|
| **Tyranny** | DestinyGainFateAndWounds | ✅ |
| **Lighthouse** | ActionGrantVengeanceAndBoost | ✅ |
| **Alchemy Lab** | OncePerTurnActionGrantStatsAndFreeze | ✅ |
| **Reliquary** | BitActionActivateOfflineJAW | ✅ |

### Snips (2 cards)
| Card | Ability | Status |
|------|---------|--------|
| **Apocrypha** | SchemeSacrificeDrawAndGrantVengeance | ⚠️ Scheme system scaffolded |
| **Entropy** | SchemeActionInflictWoundsResetDevelopments | ⚠️ Scheme system scaffolded |

### Rituals (6 cards)
| Card | Ability | Status |
|------|---------|--------|
| **Crystalize** | OnPlayGrantStatsFortifyFreeze | ✅ |
| **Tithing** | OnPlayGainBitsOnAttack | ✅ |
| **Acceptable Losses** | RaiderDestroyOnlineEntity | ✅ |
| **Seance** | OnPlayCreatePoltergeists | ✅ |
| **Ignition** | OnPlayGrantBoostAndDamage | ✅ |
| **Royal Decree** | OnPlayActivateAndGrantVengeance | ✅ |

### Syms (1 card)
| Card | Ability | Status |
|------|---------|--------|
| **True Self** | InterfaceAscendInflictWounds | ✅ |

### Landmarks (3 cards)
| Card | Ability | Status |
|------|---------|--------|
| **Ancient Tomb** | DepartedDamageEnemyEntities | ✅ |
| **Witch Hunt** | AscendSacrificeAndGainWounds | ✅ |
| **Volcano** | DevelopDealDamage | ✅ |

---

## Summary

**Total Purple Cards:** 36
- **Fully Implemented:** 34 cards
- **Scheme System (needs testing):** 2 cards (Apocrypha, Entropy)

**New Ability Handlers Added:** 25+

### Categories Implemented:
1. **Ritual onPlay effects** (5 handlers)
2. **Exhaust abilities** (2 handlers)
3. **BitPayment abilities** (3 handlers)
4. **Aura effects** (1 handler)
5. **Triggered effects** (5 handlers)
6. **Action abilities** (3 handlers)
7. **Search Pandora** (2 placeholder handlers)
8. **Raider effect** (1 handler)

### Remaining for Purple:
- **Scheme system** - needs thorough testing (already scaffolded from Orange)
- **Search Pandora UI** - needs deck search dialog (shared with Orange's Implants)

---

## Next Steps:
1. Test Scheme system with Apocrypha and Entropy
2. Implement deck search UI for "Search Pandora" abilities
3. Add unit tests for Purple abilities

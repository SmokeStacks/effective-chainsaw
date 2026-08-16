# Purple Cards - Missing Images Report (CORRECTED)

Cross-referenced against the actual `imgObj` mapping in `src/ui/Tools.js` (not guessed filenames).

## Purple Cards from purpeCardsNew.txt (36 cards total)

### Physical Entities (5 cards)
| Card | Image (file / imgObj key) | Status |
|------|------------|--------|
| Dryad | dryad.png (`Dryad`) | ✅ EXISTS |
| Viceroy | viceroy.png (`Viceroy`) | ✅ EXISTS |
| Sarcophagus | sarcophagus.png (`Sarcophagus`) | ✅ EXISTS |
| Sovereign | sovereign.png (`Sovereign`) | ✅ EXISTS |
| Gladiator | gladiator.png (`Gladiator`) | ✅ EXISTS |

### Magic Entities (5 cards)
| Card | Image (file / imgObj key) | Status |
|------|------------|--------|
| Archivist | — | ⚠️ NO MAPPING (archeologist.png exists, keyed as `Archeologist` — possible rename) |
| Baroness | — | ⚠️ NO MAPPING (empress.png exists, keyed as `Exiled Empress` — possible rename) |
| Oracle | oracle.png (`Oracle`) | ✅ EXISTS |
| Mortician | — | ❌ MISSING (no file, no mapping) |
| Demiurge | demiurge.png (`Demiurge`) | ✅ EXISTS |

### Phys/Magi Entities (4 cards)
| Card | Image (file / imgObj key) | Status |
|------|------------|--------|
| Acolyte | acolyte.png (`Acolyte`) | ✅ EXISTS |
| Pyromancer | pyromancer.png (`Pyromancer`) | ✅ EXISTS |
| Poltergeist | poltergeist.png (`Poltergeist`) | ✅ EXISTS |
| False Prophet | prophet.png (`False Prophet`) | ✅ EXISTS |

### Phys/Tech Entities (2 cards)
| Card | Image (file / imgObj key) | Status |
|------|------------|--------|
| Merchant Guild | merchant.png (`Merchant`) | ⚠️ IMAGE EXISTS, key is `Merchant` not `Merchant Guild` — needs mapping fix |
| Automaton | automaton.png (`Automaton`) | ✅ EXISTS |

### Magi/Tech Entities (3 cards)
| Card | Image (file / imgObj key) | Status |
|------|------------|--------|
| Archon | archon.png (`Archon`) | ✅ EXISTS |
| Technopagan | technopagan.png (`Technopagan`) | ✅ EXISTS |
| RATs | rats.png (`RATs`) | ✅ EXISTS |

### Locations (4 cards)
| Card | Image (file / imgObj key) | Status |
|------|------------|--------|
| Tyranny | tyranny.png (`Tyranny`) | ✅ EXISTS |
| Lighthouse | — | ❌ MISSING (no file, no mapping) |
| Alchemy Lab | alchemy.png (`Alchemy Lab`) | ✅ EXISTS |
| Reliquary | — | ❌ MISSING (no file, no mapping) |

### Snips (2 cards)
| Card | Image (file / imgObj key) | Status |
|------|------------|--------|
| Apocrypha | apocrypha.png (`Apocrypha`) | ✅ EXISTS |
| Entropy | — | ❌ MISSING (no file, no mapping) |

### Rituals (6 cards)
| Card | Image (file / imgObj key) | Status |
|------|------------|--------|
| Crystalize | crystalize.png (`Crystalize`) | ✅ EXISTS |
| Tithing | tithing.png (`Tithing`) | ✅ EXISTS |
| Acceptable Losses | losses.png (`Acceptable Losses`) | ✅ EXISTS |
| Seance | seance.png (`Seance`) | ✅ EXISTS |
| Ignition | ignite.png (`Ignite`) | ⚠️ IMAGE EXISTS, key is `Ignite` not `Ignition` — needs mapping fix |
| Royal Decree | — | ❌ MISSING (no file, no mapping) |

### Syms (1 card)
| Card | Image (file / imgObj key) | Status |
|------|------------|--------|
| True Self | trueself.png (`True Self`) | ✅ EXISTS |

### Landmarks (3 cards)
| Card | Image (file / imgObj key) | Status |
|------|------------|--------|
| Ancient Tomb | tomb.png (`Ancient Tomb`) | ✅ EXISTS |
| Witch Hunt | witch.png (`Witch Hunt`) | ✅ EXISTS |
| Volcano | volcano.png (`Volcano`) | ✅ EXISTS |

---

## Summary — ✅ ALL RESOLVED

**Total Purple Cards:** 36 — **all 36 now have image mappings in `src/ui/Tools.js`.**

### Resolutions applied:
```
Merchant Guild  -> merchant.png   (added "Merchant Guild" key)
Ignition        -> ignite.png     (added "Ignition" key)
Archivist       -> archeologist.png (rename of Archeologist)
Baroness        -> empress.png      (rename of Exiled Empress)
Mortician       -> mortician.png     (rename of Nurse; filename typo fixed)
Lighthouse      -> lighthouse.png   (new image)
Reliquary       -> reliquary.png    (new image)
Entropy         -> entropy.png      (new image)
Royal Decree    -> decree.png       (new image)
```

**Missing images: 0**

---

## Note
The first version of this report was wrong — it guessed filenames (e.g. `viceroy.png` style) rather than checking the real `imgObj` map in `src/ui/Tools.js`. The naming convention uses shortened keys (e.g. `prophet.png` for False Prophet, `tomb.png` for Ancient Tomb, `losses.png` for Acceptable Losses, `moritican.png` for Mortician).

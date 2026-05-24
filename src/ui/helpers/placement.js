// Pure placement-decision logic for "play a card to a realm".
//
// This module owns the rules for "can this card be placed in this realm, and
// if so which array (people / places / things) does it go into?".
// Per notes.txt:
//
//   - Entities may only be placed in Realms matching at least one of their
//     Affinities. Affinity-realm map:
//         Solarium  : Magi
//         Theater   : Magi or Phys           (a.k.a. Trenches)
//         Underpass : Phys or Tech           (a.k.a. IRL)
//         Grid      : Tech                   (a.k.a. Nexus)
//   - Landmarks and Locations only appear in Theater and Underpass.
//   - Syms and Snips only appear in Underpass and Grid.
//   - Elysium is an ascension-destination zone. Cards reach Elysium only
//     through ascension, never via direct play -- so direct-placement always
//     fails for Elysium.
//   - Rituals are not "placed" anywhere -- they have an immediate effect and
//     go straight to the graveyard. They are not handled here.
//
// `canPlaceInRealm` returns `{ canPlace, array, reason }`:
//   canPlace : boolean
//   array    : 'people' | 'places' | 'things' | null
//   reason   : null if canPlace, otherwise one of:
//              'unknown-realm', 'elysium-not-directly-playable',
//              'affinity-mismatch', 'category-not-allowed-in-realm',
//              'no-category', 'ritual'

const PLAYABLE_REALMS = new Set(['Solarium', 'Theater', 'Underpass', 'Grid']);

// Realms that accept each category. Used to derive `array` after we've
// checked affinity for entities.
const CATEGORY_ARRAY = {
    ENTITY: 'people',
    LOCATION: 'places',
    LANDMARK: 'places',
    SNIP: 'things',
    SYM: 'things',
};

const ENTITY_AFFINITY_BY_REALM = {
    Solarium:  ({ magi })            => !!magi,
    Theater:   ({ magi, phys })      => !!magi || !!phys,
    Underpass: ({ phys, tech })      => !!phys || !!tech,
    Grid:      ({ tech })            => !!tech,
};

const PLACE_REALMS = new Set(['Theater', 'Underpass']);
const THING_REALMS = new Set(['Underpass', 'Grid']);

export function canPlaceInRealm(card, realmName) {
    if (!card || !card.category) {
        return { canPlace: false, array: null, reason: 'no-category' };
    }
    if (card.category === 'RITUAL') {
        // Rituals don't go to a realm at all; caller should route them
        // through ritual activation instead.
        return { canPlace: false, array: null, reason: 'ritual' };
    }
    if (realmName === 'Elysium') {
        return { canPlace: false, array: null, reason: 'elysium-not-directly-playable' };
    }
    if (!PLAYABLE_REALMS.has(realmName)) {
        return { canPlace: false, array: null, reason: 'unknown-realm' };
    }

    switch (card.category) {
        case 'ENTITY': {
            const check = ENTITY_AFFINITY_BY_REALM[realmName];
            if (!check(card)) {
                return { canPlace: false, array: null, reason: 'affinity-mismatch' };
            }
            return { canPlace: true, array: 'people', reason: null };
        }
        case 'LOCATION':
        case 'LANDMARK':
            if (!PLACE_REALMS.has(realmName)) {
                return { canPlace: false, array: null, reason: 'category-not-allowed-in-realm' };
            }
            return { canPlace: true, array: CATEGORY_ARRAY[card.category], reason: null };

        case 'SNIP':
        case 'SYM':
            if (!THING_REALMS.has(realmName)) {
                return { canPlace: false, array: null, reason: 'category-not-allowed-in-realm' };
            }
            return { canPlace: true, array: CATEGORY_ARRAY[card.category], reason: null };

        default:
            return { canPlace: false, array: null, reason: 'no-category' };
    }
}

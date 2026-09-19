// Tests for the pure placement-decision function in placement.js.
//
// These tests document the rules from notes.txt as executable specifications.
// The play path (src/ui/helpers/playCard.js) now routes every placement through
// canPlaceInRealm, so these rules are enforced in game rather than only here;
// playCard.test.js covers that integration.

import { canPlaceInRealm } from '../placement';

// Convenience constructors so tests read close to the rule.
const entity = (aff) => ({ category: 'ENTITY', ...aff });
const location = () => ({ category: 'LOCATION' });
const landmark = () => ({ category: 'LANDMARK' });
const snip = () => ({ category: 'SNIP' });
const sym = () => ({ category: 'SYM' });
const ritual = () => ({ category: 'RITUAL' });

describe('canPlaceInRealm — Entities by affinity', () => {
    test('Solarium accepts Magi entities', () => {
        expect(canPlaceInRealm(entity({ magi: true }), 'Solarium').canPlace).toBe(true);
    });

    test('Solarium rejects Phys-only and Tech-only entities', () => {
        expect(canPlaceInRealm(entity({ phys: true }), 'Solarium').reason).toBe('affinity-mismatch');
        expect(canPlaceInRealm(entity({ tech: true }), 'Solarium').reason).toBe('affinity-mismatch');
    });

    test('Theater accepts Magi OR Phys entities', () => {
        expect(canPlaceInRealm(entity({ magi: true }), 'Theater').canPlace).toBe(true);
        expect(canPlaceInRealm(entity({ phys: true }), 'Theater').canPlace).toBe(true);
    });

    test('Theater rejects Tech-only entities (regression vs notes.txt)', () => {
        expect(canPlaceInRealm(entity({ tech: true }), 'Theater').reason).toBe('affinity-mismatch');
    });

    test('Underpass accepts Phys OR Tech entities', () => {
        expect(canPlaceInRealm(entity({ phys: true }), 'Underpass').canPlace).toBe(true);
        expect(canPlaceInRealm(entity({ tech: true }), 'Underpass').canPlace).toBe(true);
    });

    test('Underpass rejects Magi-only entities', () => {
        expect(canPlaceInRealm(entity({ magi: true }), 'Underpass').reason).toBe('affinity-mismatch');
    });

    test('Grid accepts Tech entities only', () => {
        expect(canPlaceInRealm(entity({ tech: true }), 'Grid').canPlace).toBe(true);
        expect(canPlaceInRealm(entity({ magi: true }), 'Grid').reason).toBe('affinity-mismatch');
        expect(canPlaceInRealm(entity({ phys: true }), 'Grid').reason).toBe('affinity-mismatch');
    });

    test('multi-affinity entities work in any qualifying realm', () => {
        const magiPhys = entity({ magi: true, phys: true });
        expect(canPlaceInRealm(magiPhys, 'Solarium').canPlace).toBe(true);
        expect(canPlaceInRealm(magiPhys, 'Theater').canPlace).toBe(true);
        expect(canPlaceInRealm(magiPhys, 'Underpass').canPlace).toBe(true);
        expect(canPlaceInRealm(magiPhys, 'Grid').reason).toBe('affinity-mismatch');
    });

    test('an entity with no affinity flags cannot be placed anywhere', () => {
        const drifter = entity({});
        for (const realm of ['Solarium', 'Theater', 'Underpass', 'Grid']) {
            expect(canPlaceInRealm(drifter, realm).reason).toBe('affinity-mismatch');
        }
    });

    test('entities go to the `people` array', () => {
        expect(canPlaceInRealm(entity({ magi: true }), 'Solarium').array).toBe('people');
    });
});

describe('canPlaceInRealm — Landmarks & Locations', () => {
    test('Landmarks may go to Theater or Underpass', () => {
        expect(canPlaceInRealm(landmark(), 'Theater').canPlace).toBe(true);
        expect(canPlaceInRealm(landmark(), 'Underpass').canPlace).toBe(true);
    });

    test('Landmarks may NOT go to Solarium or Grid', () => {
        expect(canPlaceInRealm(landmark(), 'Solarium').reason).toBe('category-not-allowed-in-realm');
        expect(canPlaceInRealm(landmark(), 'Grid').reason).toBe('category-not-allowed-in-realm');
    });

    test('Locations follow the same rule', () => {
        expect(canPlaceInRealm(location(), 'Theater').canPlace).toBe(true);
        expect(canPlaceInRealm(location(), 'Underpass').canPlace).toBe(true);
        expect(canPlaceInRealm(location(), 'Solarium').reason).toBe('category-not-allowed-in-realm');
        expect(canPlaceInRealm(location(), 'Grid').reason).toBe('category-not-allowed-in-realm');
    });

    test('Landmarks/Locations go to the `places` array', () => {
        expect(canPlaceInRealm(landmark(), 'Theater').array).toBe('places');
        expect(canPlaceInRealm(location(), 'Underpass').array).toBe('places');
    });
});

describe('canPlaceInRealm — Syms & Snips', () => {
    test('Syms may go to Underpass or Grid', () => {
        expect(canPlaceInRealm(sym(), 'Underpass').canPlace).toBe(true);
        expect(canPlaceInRealm(sym(), 'Grid').canPlace).toBe(true);
    });

    test('Syms may NOT go to Solarium or Theater', () => {
        expect(canPlaceInRealm(sym(), 'Solarium').reason).toBe('category-not-allowed-in-realm');
        expect(canPlaceInRealm(sym(), 'Theater').reason).toBe('category-not-allowed-in-realm');
    });

    test('Snips follow the same rule', () => {
        expect(canPlaceInRealm(snip(), 'Underpass').canPlace).toBe(true);
        expect(canPlaceInRealm(snip(), 'Grid').canPlace).toBe(true);
        expect(canPlaceInRealm(snip(), 'Solarium').reason).toBe('category-not-allowed-in-realm');
        expect(canPlaceInRealm(snip(), 'Theater').reason).toBe('category-not-allowed-in-realm');
    });

    test('Syms/Snips go to the `things` array', () => {
        expect(canPlaceInRealm(sym(), 'Underpass').array).toBe('things');
        expect(canPlaceInRealm(snip(), 'Grid').array).toBe('things');
    });
});

describe('canPlaceInRealm — special cases', () => {
    test('Elysium can never be directly played to', () => {
        // Elysium is reserved for ascended cards; direct placement always fails.
        for (const card of [entity({ magi: true, phys: true, tech: true }), landmark(), sym(), snip(), location()]) {
            expect(canPlaceInRealm(card, 'Elysium').reason).toBe('elysium-not-directly-playable');
        }
    });

    test('Rituals are not placeable -- routed through activation instead', () => {
        expect(canPlaceInRealm(ritual(), 'Theater').reason).toBe('ritual');
    });

    test('Unknown realms are rejected', () => {
        expect(canPlaceInRealm(entity({ magi: true }), 'NotARealm').reason).toBe('unknown-realm');
    });

    test('Missing/unknown category is rejected', () => {
        expect(canPlaceInRealm({}, 'Theater').reason).toBe('no-category');
        expect(canPlaceInRealm({ category: 'NEW_CATEGORY' }, 'Theater').reason).toBe('no-category');
    });

    test('null / undefined card is rejected', () => {
        expect(canPlaceInRealm(null, 'Theater').reason).toBe('no-category');
        expect(canPlaceInRealm(undefined, 'Theater').reason).toBe('no-category');
    });
});

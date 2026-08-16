// Validates that every card reference in player and enemy decks resolves to a
// real entry in the card registry. This prevents out-of-bounds index bugs like
// the "Firewall"/"Data Mine" incident where index 35-36 don't exist in the
// orange binder (which only has indices 0-34).

import { resolveCardReference, validateDeckReferences } from '../../../rules/deckResolver';
import { playerMainDeck, bootstrapConfig } from '../../../playerDecks/playerDeck';
import { enemyDeck } from '../../../systemDecks/enemyDeck';

describe('Player deck — all references resolve', () => {
    test('all main deck cards resolve', () => {
        expect(validateDeckReferences(playerMainDeck)).toBe(true);
    });

    test('each main deck entry resolves to a named card', () => {
        playerMainDeck.forEach((ref, i) => {
            const card = resolveCardReference(ref);
            expect(card).toBeDefined();
            expect(card && card.name).toBeTruthy();
        });
    });

    test('bootstrap card resolves', () => {
        const card = resolveCardReference(bootstrapConfig.bootstrapCard);
        expect(card).toBeDefined();
        expect(card.name).toBeTruthy();
    });

    test('all available bootstrap cards resolve', () => {
        bootstrapConfig.availableBootstrapCards.forEach((ref) => {
            const card = resolveCardReference(ref);
            expect(card).toBeDefined();
        });
    });
});

describe('Enemy deck — all references resolve', () => {
    test('all enemy deck cards resolve', () => {
        expect(validateDeckReferences(enemyDeck)).toBe(true);
    });

    test('each enemy deck entry resolves to a named card', () => {
        enemyDeck.forEach((ref, i) => {
            const card = resolveCardReference(ref);
            expect(card).toBeDefined();
            expect(card && card.name).toBeTruthy();
        });
    });
});

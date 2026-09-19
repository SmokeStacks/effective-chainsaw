// Impostor was a stub: handleImpostorPlacement logged its arguments and did
// nothing, so the whole keyword was inert. The player could select a target and
// no exchange happened.
//
// glossary.txt: "This card may only be placed in Realms where your opponent has
// placed one or more offline entities. When placed (before activation), choose
// an enemy offline entity in that realm and exchange control of it with the
// Impostor. Both cards remain offline but can be activated by the new owner at
// any time as normal."

import { setupTestEnv } from '../testHarness';
import { state } from '../state';
import {
    handleImpostorPlacement,
    isLegalImpostorTarget,
    legalImpostorTargets,
    canPlaceImpostorInRealm,
} from '../impostor';
import { handleRealmCardSelect } from '../selection';

beforeEach(() => {
    setupTestEnv();
});

const enemyEntity = (over = {}) => ({
    id: 'e1',
    owner: 'ENEMY',
    realm: 'Underpass',
    online: false,
    card: { name: 'Victim', category: 'ENTITY', HP: 4 },
    ...over,
});

const impostorCard = (over = {}) => ({
    id: 'imp1',
    owner: 'PLAYER',
    card: {
        name: 'Splinter Faction',
        category: 'ENTITY',
        abilities: [{ name: 'Impostor' }],
    },
    ...over,
});

describe('isLegalImpostorTarget', () => {
    test('accepts an enemy Offline entity in the same realm', () => {
        expect(isLegalImpostorTarget(enemyEntity(), 'Underpass', 'PLAYER')).toBe(true);
    });

    test('rejects an Online entity', () => {
        expect(isLegalImpostorTarget(enemyEntity({ online: true }), 'Underpass', 'PLAYER')).toBe(false);
    });

    test('rejects a friendly entity', () => {
        expect(isLegalImpostorTarget(enemyEntity({ owner: 'PLAYER' }), 'Underpass', 'PLAYER')).toBe(false);
    });

    test('rejects an entity in a different realm', () => {
        expect(isLegalImpostorTarget(enemyEntity({ realm: 'Grid' }), 'Underpass', 'PLAYER')).toBe(false);
    });

    test('rejects non-entity cards', () => {
        const place = enemyEntity({ card: { name: 'Site', category: 'LOCATION' } });
        expect(isLegalImpostorTarget(place, 'Underpass', 'PLAYER')).toBe(false);
    });

    test('rejects null', () => {
        expect(isLegalImpostorTarget(null, 'Underpass', 'PLAYER')).toBe(false);
    });
});

describe('placement restriction', () => {
    test('a realm with no enemy Offline entity is not a legal destination', () => {
        expect(canPlaceImpostorInRealm('Underpass', 'PLAYER')).toBe(false);
    });

    test('an Online-only enemy presence is still not enough', () => {
        state.enemyUnderpass.people.push(enemyEntity({ online: true }));
        expect(canPlaceImpostorInRealm('Underpass', 'PLAYER')).toBe(false);
    });

    test('one enemy Offline entity makes the realm legal', () => {
        state.enemyUnderpass.people.push(enemyEntity());
        expect(canPlaceImpostorInRealm('Underpass', 'PLAYER')).toBe(true);
        expect(legalImpostorTargets('Underpass', 'PLAYER')).toHaveLength(1);
    });
});

describe('handleImpostorPlacement — exchanging control', () => {
    let victim;
    let impostor;

    beforeEach(() => {
        victim = enemyEntity();
        impostor = impostorCard();
        state.enemyUnderpass.people.push(victim);
        state.playerHand = [impostor];
        state.playerActions = 3;
    });

    test('the victim moves to the player realm under player control', () => {
        handleImpostorPlacement(impostor, victim, 'Underpass', 'PLAYER');

        const acquired = state.playerUnderpass.people.find(e => e.id === victim.id);
        expect(acquired).toBeDefined();
        expect(acquired.owner).toBe('PLAYER');
        expect(acquired.realm).toBe('Underpass');
        expect(state.enemyUnderpass.people.find(e => e.id === victim.id)).toBeUndefined();
    });

    test('the Impostor moves to the enemy realm under enemy control', () => {
        handleImpostorPlacement(impostor, victim, 'Underpass', 'PLAYER');

        const planted = state.enemyUnderpass.people.find(e => e.id === impostor.id);
        expect(planted).toBeDefined();
        expect(planted.owner).toBe('ENEMY');
        expect(planted.realm).toBe('Underpass');
        expect(state.playerUnderpass.people.find(e => e.id === impostor.id)).toBeUndefined();
    });

    test('both cards remain Offline', () => {
        handleImpostorPlacement(impostor, victim, 'Underpass', 'PLAYER');

        const acquired = state.playerUnderpass.people.find(e => e.id === victim.id);
        const planted = state.enemyUnderpass.people.find(e => e.id === impostor.id);
        expect(acquired.online).toBe(false);
        expect(planted.online).toBe(false);
    });

    test('the Impostor leaves hand and the action is spent', () => {
        handleImpostorPlacement(impostor, victim, 'Underpass', 'PLAYER');

        expect(state.playerHand.find(c => c.id === impostor.id)).toBeUndefined();
        expect(state.playerActions).toBe(2);
    });

    test('an illegal target resolves nothing and reports failure', () => {
        const online = enemyEntity({ id: 'e2', online: true });
        state.enemyUnderpass.people.push(online);

        const result = handleImpostorPlacement(impostor, online, 'Underpass', 'PLAYER');

        expect(result).toBe(false);
        expect(state.playerHand).toHaveLength(1);
        expect(state.playerActions).toBe(3);
        expect(state.enemyUnderpass.people.find(e => e.id === online.id)).toBeDefined();
    });

    test('the exchange is not a no-op (regression on the old stub)', () => {
        const before = JSON.stringify({
            player: state.playerUnderpass.people,
            enemy: state.enemyUnderpass.people,
        });

        handleImpostorPlacement(impostor, victim, 'Underpass', 'PLAYER');

        const after = JSON.stringify({
            player: state.playerUnderpass.people,
            enemy: state.enemyUnderpass.people,
        });
        expect(after).not.toBe(before);
    });
});

describe('handleRealmCardSelect — answering the Impostor request', () => {
    beforeEach(() => {
        state.awaitingImpostor = true;
        state.impostorRealm = 'Underpass';
        state.playerActions = 3;
    });

    test('clicking a legal victim performs the swap and closes the request', () => {
        const victim = enemyEntity();
        const impostor = impostorCard();
        state.enemyUnderpass.people.push(victim);
        state.playerHand = [impostor];
        state.selectedCard = impostor;

        handleRealmCardSelect(victim);

        expect(state.playerUnderpass.people.find(e => e.id === victim.id)).toBeDefined();
        expect(state.awaitingImpostor).toBe(false);
        expect(state.impostorRealm).toBeNull();
    });

    test('clicking an Online enemy leaves the request open', () => {
        const online = enemyEntity({ online: true });
        const impostor = impostorCard();
        state.enemyUnderpass.people.push(online);
        state.playerHand = [impostor];
        state.selectedCard = impostor;

        handleRealmCardSelect(online);

        expect(state.awaitingImpostor).toBe(true);
        expect(state.playerHand).toHaveLength(1);
        expect(state.enemyUnderpass.people.find(e => e.id === online.id)).toBeDefined();
    });
});

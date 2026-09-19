// activateAbilities dispatched on abilityDef.type but had no branch for
// 'onPlay', so the ability was dropped with no error. Every non-Ritual card
// carrying an onPlay ability was therefore inert -- it entered play and its
// text simply never happened.
//
// Rituals were unaffected because they resolve through triggerRitualAbilities.

import { setupTestEnv } from '../testHarness';
import { state } from '../state';
import { abilitiesDefinitions, activateAbilities } from '../../abilities/glossary';
import { handleCardSelect } from '../selection';

// activateAbilities awaits applyEffect internally; this drains anything it
// queued behind that.
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
    setupTestEnv();
});

const ENTITY = (abilities, over = {}) => ({
    id: 'src1',
    owner: 'PLAYER',
    realm: 'Underpass',
    card: { name: 'Source', category: 'ENTITY', HP: 3, abilities },
    ...over,
});

const victim = (over = {}) => ({
    id: 'v1',
    owner: 'ENEMY',
    realm: 'Underpass',
    online: true,
    card: { name: 'Victim', category: 'ENTITY', HP: 5 },
    ...over,
});

describe('untargeted onPlay abilities', () => {
    test('fire when the card enters play', async () => {
        const spy = jest.fn();
        abilitiesDefinitions.__TestPlain = {
            name: '__TestPlain',
            type: 'onPlay',
            onPlay: spy,
        };

        const entity = ENTITY([{ name: '__TestPlain' }]);
        await activateAbilities(entity, 'PLAYER');
        await flushPromises();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0][0]).toBe(entity);
        expect(spy.mock.calls[0][2]).toBe('PLAYER');

        delete abilitiesDefinitions.__TestPlain;
    });

    test('do not fire twice if the card is activated again', async () => {
        const spy = jest.fn();
        abilitiesDefinitions.__TestOnce = {
            name: '__TestOnce',
            type: 'onPlay',
            onPlay: spy,
        };

        const entity = ENTITY([{ name: '__TestOnce' }]);
        await activateAbilities(entity, 'PLAYER');
        await activateAbilities(entity, 'PLAYER');
        await flushPromises();

        expect(spy).toHaveBeenCalledTimes(1);

        delete abilitiesDefinitions.__TestOnce;
    });
});

describe('targeted onPlay abilities — player', () => {
    beforeEach(() => {
        abilitiesDefinitions.__TestTargeted = {
            name: '__TestTargeted',
            type: 'onPlay',
            requiresTarget: true,
            targetFilter: (target, entity) => target.owner !== entity.owner,
            onPlay: jest.fn(),
        };
    });

    afterEach(() => {
        delete abilitiesDefinitions.__TestTargeted;
    });

    test('open a target request instead of resolving immediately', async () => {
        state.enemyUnderpass.people.push(victim());

        await activateAbilities(ENTITY([{ name: '__TestTargeted' }]), 'PLAYER');
        await flushPromises();

        expect(state.targetSelection.enabled).toBe(true);
        expect(abilitiesDefinitions.__TestTargeted.onPlay).not.toHaveBeenCalled();
    });

    test('resolve with the clicked target and close the request', async () => {
        const target = victim();
        state.enemyUnderpass.people.push(target);
        const entity = ENTITY([{ name: '__TestTargeted' }]);

        await activateAbilities(entity, 'PLAYER');
        await flushPromises();
        handleCardSelect(target, false);

        const spy = abilitiesDefinitions.__TestTargeted.onPlay;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0][3]).toBe(target);
        expect(state.targetSelection.enabled).toBe(false);
    });

    test('reject an illegal target and keep the request open', async () => {
        state.enemyUnderpass.people.push(victim());
        const friendly = victim({ id: 'f1', owner: 'PLAYER' });
        state.playerUnderpass.people.push(friendly);

        await activateAbilities(ENTITY([{ name: '__TestTargeted' }]), 'PLAYER');
        await flushPromises();
        handleCardSelect(friendly, false);

        expect(abilitiesDefinitions.__TestTargeted.onPlay).not.toHaveBeenCalled();
        expect(state.targetSelection.enabled).toBe(true);
    });

    test('resolve with null when no legal target exists, rather than stalling', async () => {
        // An empty board means the request could never be answered.
        await activateAbilities(ENTITY([{ name: '__TestTargeted' }]), 'PLAYER');
        await flushPromises();

        const spy = abilitiesDefinitions.__TestTargeted.onPlay;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0][3]).toBeNull();
        expect(state.targetSelection.enabled).toBe(false);
    });
});

describe('targeted onPlay abilities — enemy', () => {
    test('auto-resolve against a legal target, since the AI cannot click', async () => {
        const spy = jest.fn();
        abilitiesDefinitions.__TestEnemyTargeted = {
            name: '__TestEnemyTargeted',
            type: 'onPlay',
            requiresTarget: true,
            targetFilter: (target, entity) => target.owner !== entity.owner,
            onPlay: spy,
        };

        const target = victim({ id: 'p1', owner: 'PLAYER' });
        state.playerUnderpass.people.push(target);

        await activateAbilities(
            ENTITY([{ name: '__TestEnemyTargeted' }], { id: 'e9', owner: 'ENEMY' }),
            'ENEMY'
        );
        await flushPromises();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0][3]).toBe(target);
        // The enemy must never leave a request open for the player to answer.
        expect(state.targetSelection.enabled).toBe(false);

        delete abilitiesDefinitions.__TestEnemyTargeted;
    });
});

describe('unknown ability types', () => {
    test('are reported rather than silently dropped', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        abilitiesDefinitions.__TestWeird = { name: '__TestWeird', type: 'nonsense' };

        await activateAbilities(ENTITY([{ name: '__TestWeird' }]), 'PLAYER');
        await flushPromises();

        expect(warn).toHaveBeenCalled();
        expect(warn.mock.calls.some(([msg]) => String(msg).includes('__TestWeird'))).toBe(true);

        delete abilitiesDefinitions.__TestWeird;
        warn.mockRestore();
    });
});

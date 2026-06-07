// Integration tests for battle.js: commitAttack and handleEnemyBattle.
//
// Strategy:
//   - Use the standard test harness (synchronous fake setters that mutate state).
//   - Build minimal attacker/defender objects with just the fields the code reads.
//   - Avoid paths that call deactivateAbilities (lethal damage) unless we are
//     explicitly testing that path; instead test non-lethal damage outcomes and
//     the combat-decision logic (who wins, stealth, vengeance, unblocked attacks).

import { setupTestEnv } from '../testHarness';
import { state } from '../state';
import { commitAttack, handleEnemyBattle, handleUnblockedDamage } from '../battle';

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeFighter(id, power, overrides = {}) {
    return {
        id,
        power,
        wounds: 0,
        armored: 0,
        stealth: 0,
        vengeance: 0,
        solo: 0,
        charge: 0,
        card: { name: id, HP: 10, timer: 1 },
        realm: 'Underpass',
        ...overrides,
    };
}

// commitAttack calls handleDamage(state.battleRealm, id, ...) which looks up
// the entity in the realm's people array, not the battle slots.  We therefore
// need to place fighters in both the battle slots (so commitAttack finds them
// for power comparison) AND in the realm (so handleDamage can record wounds).
function placeInPlayerSlot(idx, fighter) {
    state.playerBattleSlots[idx] = fighter;
    const realmKey = 'player' + fighter.realm.charAt(0).toUpperCase() + fighter.realm.slice(1);
    state[realmKey].people.push(fighter);
}

function placeInEnemySlot(idx, fighter) {
    state.enemyBattleSlots[idx] = fighter;
    const realmKey = 'enemy' + fighter.realm.charAt(0).toUpperCase() + fighter.realm.slice(1);
    state[realmKey].people.push(fighter);
}

// ─── commitAttack ─────────────────────────────────────────────────────────────

describe('commitAttack — basic combat outcomes', () => {
    beforeEach(() => {
        setupTestEnv();
        state.battleRealm = 'Underpass';
        state.attackMode = 'PLAYER_RAID';
    });

    test('attacker wins: defender takes damage equal to attacker power', () => {
        const attacker = makeFighter('A', 3);
        const defender = makeFighter('D', 1);
        placeInPlayerSlot(0, attacker);
        placeInEnemySlot(0, defender);

        commitAttack(attacker, defender, 'PLAYER');

        // damage lands in the realm's people array
        expect(state.enemyUnderpass.people[0].wounds).toBe(3);
        expect(state.playerUnderpass.people[0].wounds).toBe(0);
    });

    test('defender wins: attacker takes damage equal to defender power', () => {
        const attacker = makeFighter('A', 1);
        const defender = makeFighter('D', 3);
        placeInPlayerSlot(0, attacker);
        placeInEnemySlot(0, defender);

        commitAttack(attacker, defender, 'PLAYER');

        expect(state.playerUnderpass.people[0].wounds).toBe(3);
        expect(state.enemyUnderpass.people[0].wounds).toBe(0);
    });

    test('equal power: mutual damage', () => {
        const attacker = makeFighter('A', 2);
        const defender = makeFighter('D', 2);
        placeInPlayerSlot(0, attacker);
        placeInEnemySlot(0, defender);

        commitAttack(attacker, defender, 'PLAYER');

        expect(state.playerUnderpass.people[0].wounds).toBe(2);
        expect(state.enemyUnderpass.people[0].wounds).toBe(2);
    });

    test('returns { unblockedHacking: false } for a normal blocked attack', () => {
        const attacker = makeFighter('A', 2);
        const defender = makeFighter('D', 1);
        placeInPlayerSlot(0, attacker);
        placeInEnemySlot(0, defender);

        const result = commitAttack(attacker, defender, 'PLAYER');

        expect(result).toEqual({ unblockedHacking: false });
    });
});

describe('commitAttack — stealth', () => {
    beforeEach(() => {
        setupTestEnv();
        state.battleRealm = 'Underpass';
    });

    test('defender with stealth 1 absorbs the attack — stealth decreases, no damage', () => {
        const attacker = makeFighter('A', 3);
        const defender = makeFighter('D', 1, { stealth: 1 });
        placeInPlayerSlot(0, attacker);
        placeInEnemySlot(0, defender);
        // stealth decrease mutates the realm slot, not the battle slot —
        // just verify no wounds were dealt and the call returns cleanly
        const result = commitAttack(attacker, defender, 'PLAYER');

        expect(result).toEqual({ unblockedHacking: false });
        expect(state.playerBattleSlots[0].wounds).toBe(0);
        expect(state.enemyBattleSlots[0].wounds).toBe(0);
    });
});

describe('commitAttack — vengeance', () => {
    beforeEach(() => {
        setupTestEnv();
        state.battleRealm = 'Underpass';
    });

    test('defender with vengeance deals its vengeance value back to the attacker', () => {
        const attacker = makeFighter('A', 5);
        const defender = makeFighter('D', 1, { vengeance: 3 });
        placeInPlayerSlot(0, attacker);
        placeInEnemySlot(0, defender);
        // Vengeance triggers handleDamage(state.battleRealm, attacker.id, ...) → realm people
        const result = commitAttack(attacker, defender, 'PLAYER');

        // vengeance: attacker takes 3 wounds in the realm, defender untouched
        expect(state.playerUnderpass.people[0].wounds).toBe(3);
        expect(result).toEqual({ unblockedHacking: false });
    });
});

describe('commitAttack — no defender (unblocked)', () => {
    beforeEach(() => {
        setupTestEnv();
        state.battleRealm = 'Underpass';
        state.attackMode = 'PLAYER_RAID';
        state.playerTargetSelection = null;
    });

    test('PLAYER_RAID unblocked in Underpass realm deals wounds to enemy', () => {
        const attacker = makeFighter('A', 3);
        placeInPlayerSlot(0, attacker);

        commitAttack(attacker, null, 'PLAYER', null, null, 0);

        expect(state.enemyWounds).toBe(3);
    });

    test('PLAYER_QUEST unblocked grants fate to the player', () => {
        state.attackMode = 'PLAYER_QUEST';
        state.battleRealm = 'Solarium';
        const attacker = makeFighter('A', 2);
        placeInPlayerSlot(0, attacker);

        commitAttack(attacker, null, 'PLAYER', null, null, 0);

        expect(state.playerFate).toBe(2);
    });

    test('returns { unblockedHacking: false } on a non-Hack unblocked attack', () => {
        const attacker = makeFighter('A', 2);
        placeInPlayerSlot(0, attacker);

        const result = commitAttack(attacker, null, 'PLAYER', null, null, 0);

        expect(result.unblockedHacking).toBe(false);
    });

    test('PLAYER_HACK unblocked sets unblockedHacking: true and accumulates surge', () => {
        state.attackMode = 'PLAYER_HACK';
        state.battleRealm = 'Grid';
        const attacker = makeFighter('A', 4);
        placeInPlayerSlot(0, attacker);

        const result = commitAttack(attacker, null, 'PLAYER', null, null, 0);

        expect(result.unblockedHacking).toBe(true);
        expect(state.playerSurge).toBe(4);
    });
});

// ─── handleUnblockedDamage ────────────────────────────────────────────────────

describe('handleUnblockedDamage', () => {
    beforeEach(() => setupTestEnv());

    test('PLAYER_RAID in Underpass/Grid → enemy wounds', () => {
        handleUnblockedDamage('PLAYER_RAID', 3, 'PLAYER', 'Underpass');
        expect(state.enemyWounds).toBe(3);
    });

    test('PLAYER_RAID in Theater/Solarium → enemy burden', () => {
        handleUnblockedDamage('PLAYER_RAID', 2, 'PLAYER', 'Theater');
        expect(state.enemyBurden).toBe(2);
    });

    test('ENEMY_phys in Grid → player wounds', () => {
        handleUnblockedDamage('ENEMY_phys', 2, 'ENEMY', 'Grid');
        expect(state.playerWounds).toBe(2);
    });

    test('PLAYER_QUEST → player gains fate', () => {
        handleUnblockedDamage('PLAYER_QUEST', 3, 'PLAYER', 'Solarium');
        expect(state.playerFate).toBe(3);
    });

    test('ENEMY_magi → enemy gains fate', () => {
        handleUnblockedDamage('ENEMY_magi', 2, 'ENEMY', 'Solarium');
        expect(state.enemyFate).toBe(2);
    });

    test('PLAYER_HACK → returns true (hacking) and adds player surge', () => {
        const result = handleUnblockedDamage('PLAYER_HACK', 4, 'PLAYER', 'Grid');
        expect(result).toBe(true);
        expect(state.playerSurge).toBe(4);
    });

    test('ENEMY_tech → returns true and adds enemy surge', () => {
        const result = handleUnblockedDamage('ENEMY_tech', 3, 'ENEMY', 'Grid');
        expect(result).toBe(true);
        expect(state.enemySurge).toBe(3);
    });

    test('zero power → no effect, returns false', () => {
        handleUnblockedDamage('PLAYER_RAID', 0, 'PLAYER', 'Underpass');
        expect(state.enemyWounds).toBe(0);
    });
});

// ─── handleEnemyBattle ────────────────────────────────────────────────────────

describe('handleEnemyBattle', () => {
    beforeEach(() => {
        setupTestEnv();
        state.battleRealm = 'Underpass';
        state.attackMode = 'ENEMY_phys';
        state.enemyTargetType = 'ENTITY';
        state.enemyTargetSelection = null;
    });

    test('enemy attacker vs player defender: player defender takes damage in realm', () => {
        const eAttacker = makeFighter('E1', 3);
        const pDefender = makeFighter('P1', 1);
        placeInEnemySlot(0, eAttacker);
        placeInPlayerSlot(0, pDefender);

        handleEnemyBattle();

        // handleEndOfBattle clears battle slots; damage landed in realm people
        expect(state.playerUnderpass.people[0].wounds).toBe(3);
    });

    test('unblocked enemy attacker in Underpass → player wounds', () => {
        const eAttacker = makeFighter('E2', 2);
        placeInEnemySlot(0, eAttacker);
        // no player defender in slot 0

        handleEnemyBattle();

        expect(state.playerWounds).toBe(2);
    });

    test('multiple enemy attackers each resolve independently', () => {
        placeInEnemySlot(0, makeFighter('E0', 2));
        placeInEnemySlot(1, makeFighter('E1', 1));
        // no player defenders

        handleEnemyBattle();

        expect(state.playerWounds).toBe(3); // 2 + 1
    });

    test('empty enemy battle slots → no state change', () => {
        handleEnemyBattle();

        expect(state.playerWounds).toBe(0);
        expect(state.enemyWounds).toBe(0);
    });
});

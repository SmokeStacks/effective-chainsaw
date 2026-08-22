// Implementations for combat keywords that are pure passive/instance stats
// (parsed by `keywordStacks` in setup.js) rather than dispatched abilities:
// Sting, Ambush, Regen, and Bribe. Aggro/Aggressive/Defensive are handled
// directly in core.js (adjustEntityPowerExternal) and selection.js/enemy/attack.js.
import { state } from './state';
import { handleDamage } from './damage';
import { getOppositeSide } from './utils';

// Sting N: when this entity clashes with an opponent (whether attacking or
// blocking), it deals N bonus damage directly to the opposing entity, in
// addition to normal combat math. Mirrors the realm-name-as-location
// convention already used by commitAttack's handleDamage calls.
export function applyStingOnClash(entityId, entitySide, opponentEntityId) {
    if (!opponentEntityId) return;
    const battleSlots = entitySide === 'PLAYER' ? state.playerBattleSlots : state.enemyBattleSlots;
    const entity = battleSlots.find(c => c && c.id === entityId);
    if (!entity || !(entity.sting > 0)) return;

    const opponentSide = getOppositeSide(entitySide);
    handleDamage(state.battleRealm, opponentEntityId, entity.sting, opponentSide);
    console.log(`${entity.card.name} Sting: dealt ${entity.sting} damage to clashing opponent.`);
}

// Ambush N: when this entity enters play (becomes Online), it immediately
// deals N damage to a random Online enemy entity in the same realm, if any.
export function applyAmbushOnEntry(entity, side) {
    if (!(entity.ambush > 0)) return;
    const opponentSide = getOppositeSide(side);
    const [enemyRealm] = getRealmAndSetterForKeywords(entity.realm, opponentSide);
    const targets = (enemyRealm?.people || []).filter(e => e && e.online);
    if (targets.length === 0) return;

    const target = targets[Math.floor(Math.random() * targets.length)];
    handleDamage(entity.realm, target.id, entity.ambush, opponentSide);
    console.log(`${entity.card.name} Ambush: dealt ${entity.ambush} damage to ${target.card.name}.`);
}

// Local helper: avoids a circular import with utils.js's getRealmAndSetter by
// reading realm state directly (Ambush only needs the realm, not a setter).
function getRealmAndSetterForKeywords(realmName, owner) {
    if (!realmName) return [null, null];
    const normalized = realmName.charAt(0).toUpperCase() + realmName.slice(1).toLowerCase();
    const key = (owner === 'PLAYER' ? 'player' : 'enemy') + normalized;
    return [state[key], null];
}

// Regen N: at the start of each of its controller's turns (Maintain), this
// entity heals N wounds.
export function healRegeneratingEntities(side, stateSetters) {
    const realmSetterPairs = side === 'PLAYER' ? [
        ['playerSolarium', stateSetters.setPlayerSolarium],
        ['playerTheater', stateSetters.setPlayerTheater],
        ['playerUnderpass', stateSetters.setPlayerUnderpass],
        ['playerGrid', stateSetters.setPlayerGrid],
    ] : [
        ['enemySolarium', stateSetters.setEnemySolarium],
        ['enemyTheater', stateSetters.setEnemyTheater],
        ['enemyUnderpass', stateSetters.setEnemyUnderpass],
        ['enemyGrid', stateSetters.setEnemyGrid],
    ];

    realmSetterPairs.forEach(([realmKey, setRealm]) => {
        const realm = state[realmKey];
        if (!realm || !realm.people || !realm.people.some(e => e && e.regen > 0 && e.wounds > 0)) return;

        setRealm(prev => ({
            ...prev,
            people: prev.people.map(e => {
                if (e && e.regen > 0 && e.wounds > 0) {
                    const healed = Math.max(0, e.wounds - e.regen);
                    if (healed !== e.wounds) {
                        console.log(`${e.card.name} regenerates ${e.wounds - healed} wounds.`);
                    }
                    return { ...e, wounds: healed };
                }
                return e;
            }),
        }));
    });
}

// Bribe: when this entity would die from wounds reaching its max HP, its
// controller may automatically pay a fixed Bit cost to prevent the
// destruction, instead capping its wounds one below max HP. Usable once per
// entity instance (tracked via `bribeUsed`). The keyword carries no explicit
// numeric amount in any card text, so a flat cost is used here.
const BRIBE_COST = 3;

export function tryBribe(entity, owner, stateSetters) {
    if (!(entity.bribe > 0) || entity.bribeUsed) return false;

    const cost = BRIBE_COST;
    const bits = owner === 'PLAYER' ? state.playerBits : state.enemyBits;
    if (bits < cost) return false;

    if (owner === 'PLAYER') {
        stateSetters.setPlayerBits(prev => prev - cost);
    } else {
        stateSetters.setEnemyBits(prev => prev - cost);
    }
    console.log(`${entity.card.name} Bribe: paid ${cost} Bits to avoid destruction.`);
    return true;
}

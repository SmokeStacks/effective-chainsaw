import { state, stateSetters, getRealmAndSetter } from '../state';
import { activateAbilities } from '../../abilities/glossary';

const REALM_NAMES = ['Solarium', 'Theater', 'Underpass', 'Grid'];

const realmSetterMap = () => ({
    Solarium:  stateSetters.setEnemySolarium,
    Theater:   stateSetters.setEnemyTheater,
    Underpass: stateSetters.setEnemyUnderpass,
    Grid:      stateSetters.setEnemyGrid,
});

// Returns true if an enemy entity is ready to rez right before combat:
// timer met (steps >= timer), not frozen, not yet online.
function canEnemyRez(e) {
    return (
        e && e.card &&
        e.card.category === 'ENTITY' &&
        !e.online &&
        e.freeze === 0 &&
        e.card.timer != null &&
        e.steps >= e.card.timer
    );
}

// Rez eligible entities in one realm — called right before enemy attacks/defends.
export function rezEnemyEntitiesInRealm(realmName) {
    const setter = realmSetterMap()[realmName];
    if (!setter) return;
    const realm = state[`enemy${realmName}`];
    if (!realm) return;
    const rezIds = new Set(
        (realm.people || []).filter(canEnemyRez).map(e => e.id)
    );
    if (rezIds.size === 0) return;
    setter(prev => ({
        ...prev,
        people: (prev.people || []).map(e =>
            rezIds.has(e.id) ? { ...e, online: true } : e
        ),
    }));
    (realm.people || []).filter(e => rezIds.has(e.id)).forEach(e => {
        activateAbilities({ ...e, online: true }, 'ENEMY');
    });
}

// Main function to handle enemy rez cards (general pre-action pass).
// Entities only rez right before attacking/defending (see rezEnemyEntitiesInRealm).
// This pass only handles SNIPs/traps that come online automatically.
export async function enemyRezCards() {
    console.log('--- enemyRezCards Invoked ---');
    try {
        const setters = realmSetterMap();
        for (const realmName of REALM_NAMES) {
            const realm = state[`enemy${realmName}`];
            if (!realm) continue;
            const setter = setters[realmName];

            // SNIPs that aren't traps come online automatically
            let changed = false;
            const updatedThings = (realm.things || []).map(e => {
                if (e && e.card && e.card.category === 'SNIP' && !e.card.trap && !e.online) {
                    activateAbilities(e, 'ENEMY');
                    changed = true;
                    return { ...e, online: true };
                }
                return e;
            });
            if (changed) setter(prev => ({ ...prev, things: updatedThings }));
        }
        console.log('--- enemyRezCards Completed ---');
        return true;
    } catch (error) {
        console.error('Error in enemyRezCards:', error);
        return false;
    }
}

export async function handleRezPlayerCard(card, realm) {
    if (!card || !realm) {
        console.error('Invalid card or realm for player rez');
        return;
    }

    // Add the card to the specified realm
    const [, setRealm] = getRealmAndSetter(realm, 'PLAYER');
    
    const newEntity = {
        id: Date.now(),
        card: card,
        realm: realm,
        steps: 0,
        freeze: 0,
        online: false,
        stealth: card.stealth || 0,
        vengeance: card.vengeance || 0
    };

    setRealm(prevRealm => ({
        ...prevRealm,
        people: [...prevRealm.people, newEntity]
    }));

    // Activate abilities if needed
    if (!card.timer) {
        await activateAbilities(newEntity, 'PLAYER');
    }
}

// This is a duplicate declaration that was removed
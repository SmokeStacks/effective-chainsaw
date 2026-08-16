    import { state, stateSetters, getRealmAndSetter } from '../state';
import { activateAbilities } from '../../abilities/glossary';

const ENEMY_REALMS = ['Solarium', 'Theater', 'Underpass', 'Grid'];

// Main function to handle enemy rez cards.
//
// The enemy rezzes on a timer and deliberately pays no Bits/Ash cost; that is
// how the single-player opponent works for now.
//
// Realms are read from `state` on every call. This module used to destructure
// them once at import time, but the realm setters replace those objects rather
// than mutating them, so the snapshot stayed pointed at the original empty
// realms and the enemy never rezzed anything placed after load.
export async function enemyRezCards() {
    console.log('--- enemyRezCards Invoked ---');

    try {
        // Function to activate abilities for entities being rez'd
        const rezActiveEntities = async (cardList) => {
            if (!cardList || !Array.isArray(cardList)) {
                console.log('Warning: cardList is undefined or not an array in rezActiveEntities');
                return Promise.resolve([]);
            }
            
            return Promise.all(cardList.map(async (cardEntity) => {
                if (
                    cardEntity && 
                    cardEntity.card && 
                    cardEntity.card.timer &&
                    cardEntity.steps >= cardEntity.card.timer &&
                    cardEntity.freeze === 0 &&
                    !cardEntity.online
                ) {
                    console.log(`ACTIVATING ABILITIES for entity "${cardEntity.card.name}" (ID: ${cardEntity.id}) in realm.`);
                    await activateAbilities(cardEntity, 'ENEMY');
                }
                return cardEntity;
            }));
        };

        // Function to activate abilities for things being rez'd (traps)
        const rezActiveThings = async (cardList) => {
            if (!cardList || !Array.isArray(cardList)) {
                console.log('Warning: cardList is undefined or not an array in rezActiveThings');
                return Promise.resolve([]);
            }
            
            return Promise.all(cardList.map(async (cardEntity) => {
                if (
                    cardEntity && 
                    cardEntity.card && 
                    !cardEntity.card.trap && 
                    !cardEntity.online && 
                    cardEntity.card.category === 'SNIP'
                ) {
                    console.log(`ACTIVATING ABILITIES for thing "${cardEntity.card.name}" (ID: ${cardEntity.id}) in realm.`);
                    await activateAbilities(cardEntity, 'ENEMY');
                } else if (cardEntity && cardEntity.card) {
                    console.log(`Trap skipped: "${cardEntity.card.name}"`);
                }
                return cardEntity;
            }));
        };

        for (const name of ENEMY_REALMS) {
            const realm = state[`enemy${name}`];

            if (!realm) {
                console.log(`Warning: enemy${name} is undefined`);
                continue;
            }

            await rezActiveEntities(realm.people);
            await rezActiveThings(realm.things);
            stateSetters[`setEnemy${name}`](prevRealm => ({ ...prevRealm }));
        }


        console.log('--- enemyRezCards Completed ---');
        return Promise.resolve(true);
    } catch (error) {
        console.error('Error in enemyRezCards:', error);
        return Promise.resolve(false);
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
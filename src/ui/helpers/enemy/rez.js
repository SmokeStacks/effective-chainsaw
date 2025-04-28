    import { 
    enemySolarium, enemyTheater, enemyUnderpass, enemyGrid,
    setEnemySolarium, setEnemyTheater, setEnemyUnderpass, setEnemyGrid,
    getRealmAndSetter 
} from '../state';
import { activateAbilities } from '../../abilities/glossary';

// Function to activate abilities for entities being rez'd
const rezActiveEntities = async (cardList) => {
    return Promise.all(cardList.map(async (cardEntity) => {
        if (
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
    return Promise.all(cardList.map(async (cardEntity) => {
        if (!cardEntity.card.trap && !cardEntity.online && cardEntity.card.category === 'SNIP') {
            console.log(`ACTIVATING ABILITIES for thing "${cardEntity.card.name}" (ID: ${cardEntity.id}) in realm.`);
            await activateAbilities(cardEntity, 'ENEMY');
        } else {
            console.log(`Trap skipped: "${cardEntity.card.name}"`);
        }
        return cardEntity;
    }));
};

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

export async function enemyRezCards() {
    console.log('--- enemyRezCards Invoked ---');

    // Update Enemy Solarium Realm
    await rezActiveEntities(enemySolarium.people);
    await rezActiveThings(enemySolarium.things);
    setEnemySolarium(prevRealm => ({ ...prevRealm }));

    // Update Enemy Theater Realm
    await rezActiveEntities(enemyTheater.people);
    await rezActiveThings(enemyTheater.things);
    setEnemyTheater(prevRealm => ({ ...prevRealm }));

    // Update Enemy Underpass Realm
    await rezActiveEntities(enemyUnderpass.people);
    await rezActiveThings(enemyUnderpass.things);
    setEnemyUnderpass(prevRealm => ({ ...prevRealm }));

    // Update Enemy Grid Realm
    await rezActiveEntities(enemyGrid.people);
    await rezActiveThings(enemyGrid.things);
    setEnemyGrid(prevRealm => ({ ...prevRealm }));
    console.log('--- enemyRezCards Completed ---');
}
import { handleDeadCard, handleDeadCards } from './damage';
import { showModal, setModalVisible } from './modal';
import { 
    enemySolarium, enemyTheater, enemyUnderpass, enemyGrid,
    playerSolarium, playerTheater, playerUnderpass, playerGrid,
    soulSelections, rezCard, setSoulSelections, setAwaitingSacrifices,
    getRealmAndSetter
} from './state';

export function enemySacrificeEntity() {

    const realms = [enemySolarium, enemyTheater, enemyUnderpass, enemyGrid];
    const entities = realms.flatMap(realm => realm.people);

    if (entities.length > 0) {
        const randomIndex = Math.floor(Math.random() * entities.length);
        const entityToSacrifice = entities[randomIndex];
        // Remove the entity from its realm
        handleDeadCard(entityToSacrifice.realm, entityToSacrifice.id, 'ENEMY')
        console.log(`Enemy sacrificed ${entityToSacrifice.card.name}`);
    }
}

export function playerSacrificeEntity() {
    // Similar logic for the player
    const realms = [playerSolarium, playerTheater, playerUnderpass, playerGrid];
    const entities = realms.flatMap(realm => realm.people);

    if (entities.length > 0) {
        // Prompt the player to choose an entity to sacrifice
        promptPlayerToSacrifice(entities).then(entityToSacrifice => {
            handleDeadCard(entityToSacrifice.realm, entityToSacrifice.id, 'PLAYER')
            console.log(`Player sacrificed ${entityToSacrifice.card.name}`);
        });
    }
}

export function promptPlayerToSacrifice(entities) {
    return new Promise((resolve) => {
        showModal({
            title: 'Sacrifice an Entity',
            message: 'Choose an entity to sacrifice:',
            renderContent: ({ closeModal }) => (
                <div>
                    {entities.map((entity, index) => (
                        <div key={entity.id}>
                            <div
                                onClick={() => {
                                    resolve(entity);
                                    setModalVisible(false);
                                }}
                            >
                                {entity.card.name}
                            </div>
                        </div>
                    ))}
                </div>
            ),
        });
    });
}

export const handleSacrificeConfirmation = () => {
    console.log('confirm sacrifice');
    const totalCosmicValue = soulSelections.reduce((sum, card) => sum + (card.cosmic || 1), 0);

    if (totalCosmicValue >= rezCard.card.soul) {
        let selectionArray = [];
        soulSelections.forEach(card => {
            // Handle Covenant
            if (!card.card.covenant) {
                //handleDeadCard(card.realm, card.id, 'PLAYER');
                selectionArray.push({location: card.realm, entityId: card.id})
            } else {
                console.log(`${card.card.name} has Covenant and is not destroyed.`);
            }
            // Regardless of Covenant, mark the card as having been used for sacrifice
            //setCardSacrificed(card.realm, card.id, false);
        });
        handleDeadCards(selectionArray, 'PLAYER');
        setSoulSelections([]);
        setAwaitingSacrifices(false);
    } else {
        console.error('Not enough cosmic value in sacrifices selected!');
    }
};


export function setCardSacrificed(realmName, entityId, isSelected) {
    const [realm, setRealm] = getRealmAndSetter(realmName, 'PLAYER');

    const entityIndex = realm.people.findIndex((e) => e.id === entityId);
    if (entityIndex === -1) {
        console.error(`Entity with ID ${entityId} not found in realm ${realmName}`);
        return;
    }

    const updatedEntity = { ...realm.people[entityIndex] };
    updatedEntity.isSelectedForSacrifice = isSelected;

    const newPeople = [...realm.people];
    newPeople[entityIndex] = updatedEntity;

    setRealm({
        ...realm,
        people: newPeople,
    });
}
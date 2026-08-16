import { handleDeadCard, handleDeadCards } from './damage';
import { showModal, setModalVisible } from '../components/Modal';
import { state, stateSetters } from './state';
import { rezCostFor } from './activation';

export function enemySacrificeEntity() {

    const realms = [state.enemySolarium, state.enemyTheater, state.enemyUnderpass, state.enemyGrid];
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
    const realms = [state.playerSolarium, state.playerTheater, state.playerUnderpass, state.playerGrid];
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
    const totalCosmicValue = state.soulSelections.reduce((sum, card) => sum + (card.cosmic || 1), 0);

    if (totalCosmicValue >= rezCostFor(state.rezCard.card).soul) {
        let selectionArray = [];
        state.soulSelections.forEach(card => {
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
        stateSetters.setSoulSelections([]);
        stateSetters.setAwaitingSacrifices(false);
    } else {
        console.error('Not enough cosmic value in sacrifices selected!');
    }
};


export function setCardSacrificed(realmName, entityId, isSelected) {
    const [realm, setRealm] = state.getRealmAndSetter(realmName, 'PLAYER');

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
import { getRealmAndSetter } from './utils';
import { state, stateSetters } from './state';

export function updateEntityInRealm(entity, updatedProperties, side) {
    const realmName = entity.realm;
    const [realm, setRealm] = getRealmAndSetter(realmName, side);
    const arrays = ['people', 'places', 'things'];
    let entityFound = false;

    arrays.forEach(arrayName => {
        if (realm[arrayName].some(card => card.id === entity.id)) {
            setRealm(prevRealm => ({
                ...prevRealm,
                [arrayName]: prevRealm[arrayName].map(card => {
                    if (card.id === entity.id) {
                        return {
                            ...card,
                            ...updatedProperties,
                        };
                    }
                    return card;
                }),
            }));
            entityFound = true;
        }
    });

    if (!entityFound) {
        console.error(`Entity ${entity.card.name} not found in realm ${realmName}.`);
    }
}

export function drawSpecificCard(card, side) {
    const setLibrary = side === 'PLAYER' ? stateSetters.setPlayerLibrary : stateSetters.setEnemyLibrary;
    const setHand = side === 'PLAYER' ? stateSetters.setPlayerHand : stateSetters.setEnemyHand;
    setLibrary(prevLibrary => prevLibrary.filter(entity => entity.id !== card.id));
    setHand(prevHand => [...prevHand, card]);

    console.log(`${card.card.name} has been drawn.`);
}

import { getRealmAndSetter } from './utils';
import { state, stateSetters } from './state';

const {
    playerLibrary,
    enemyLibrary
} = state;

const {
    setPlayerLibrary,
    setEnemyLibrary,
    setPlayerHand,
    setEnemyHand
} = stateSetters;

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
    const library = side === 'PLAYER' ? playerLibrary : enemyLibrary;
    const setLibrary = side === 'PLAYER' ? setPlayerLibrary : setEnemyLibrary;
    const setHand = side === 'PLAYER' ? setPlayerHand : setEnemyHand;
    const updatedLibrary = library.filter(entity => entity.id !== card.id);
    setLibrary(updatedLibrary);
    setHand(prevHand => [...prevHand, card]);

    console.log(`${card.card.name} has been drawn.`);
}

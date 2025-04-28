import { gameState, stateSetters } from './state';

// Resource Management
export function gainBits(num) {
    let remainingBits = num;
    if (gameState.playerOverload > 0) {
        remainingBits = Math.max(0, remainingBits - gameState.playerOverload);
    }
    stateSetters.setPlayerBits(prevBits => prevBits + remainingBits);
}

export function loseBits(num) {
    stateSetters.setPlayerBits(prevBits => prevBits - num);
}

export function gainAshes(num) {
    stateSetters.setPlayerAshes(prevAshes => prevAshes + num);
}

export function loseAshes(num) {
    stateSetters.setPlayerAshes(prevAshes => prevAshes - num);
}

export function gainActions(num) {
    let remainingActions = num;
    if (gameState.playerLag > 0) {
        remainingActions = Math.max(0, remainingActions - gameState.playerLag);
    }
    stateSetters.setPlayerActions(prevActions => prevActions + remainingActions);
}

export function loseActions(num) {
    stateSetters.setPlayerActions(prevActions => prevActions - num);
}

export function gainBurden(num) {
    stateSetters.setPlayerBurden(prevBurden => prevBurden + num);
}

export function loseBurden(num) {
    stateSetters.setPlayerBurden(prevBurden => prevBurden - num);
}

export function gainFate(num) {
    let remainingPoints = num;
    if (gameState.playerBurden > 0) {
        remainingPoints = Math.max(0, remainingPoints - gameState.playerBurden);
    }
    stateSetters.setPlayerFate(prevFate => prevFate + remainingPoints);
}

export function loseFate(num) {
    stateSetters.setPlayerFate(prevFate => prevFate - num);
}

export function gainWounds(num) {
    stateSetters.setPlayerWounds(prevWounds => prevWounds + num);
}

export function loseWounds(num) {
    stateSetters.setPlayerWounds(prevWounds => prevWounds - num);
}

export function gainOverload(num) {
    stateSetters.setPlayerOverload(prevOverload => prevOverload + num);
}

export function gainLag(num) {
    stateSetters.setPlayerLag(prevLag => prevLag + num);
}

export function loseLag(num) {
    stateSetters.setPlayerLag(prevLag => prevLag - num);
}

export function gainSurge(num) {
    stateSetters.setPlayerSurge(prev => prev + num);
}

// Card Management
export function draw(num) {
    console.log('draw ', num);
    let remainingCards = num;

    if (gameState.playerWounds > 0) {
        const newWounds = gameState.playerWounds - num;
        remainingCards = Math.max(0, -newWounds);
        stateSetters.setPlayerWounds(Math.max(0, newWounds));
    }

    if (remainingCards > 0) {
        stateSetters.setPlayerLibrary(prevLibrary => {
            const newHandCards = prevLibrary.slice(0, remainingCards);
            const newLibrary = prevLibrary.slice(remainingCards);

            stateSetters.setPlayerHand(prevHand => [
                ...prevHand,
                ...newHandCards
            ]);

            return newLibrary;
        });
    }
}

export function draft() {
    stateSetters.setSelectedCard(gameState.draft[0]);
    stateSetters.setDraftSelected(true);
    stateSetters.setSelectedInHand(true);
}

// Actions
export function mine() {
    gainBits(1);
    loseActions(1);
    stateSetters.setCurrentPlayer('ENEMY');
}

export function boost() {
    loseActions(1);
    loseBits(1);
    stateSetters.setAttackMode('BOOST');
}

export function develop() {
    if (gameState.playerActions < 1 || gameState.playerBits < 1) {
        console.log('Not enough resources to develop a card.');
        return;
    }
    loseActions(1);
    loseBits(1);
    stateSetters.setAttackMode('DEVELOP');
    console.log('Select a card to develop.');
}

// Card Activation
export function handleRez(entity) {
    console.log('handle rez', entity);
    const soulsAvailable = calculateSoulsAvailable(entity.id);
    
    if ((entity.card.category !== 'LANDMARK' && entity.online) && 
        (entity.card.category !== 'LOCATION' && entity.online)) {
        console.log('already online');
        return;
    }

    if (gameState.playerBits < entity.card.rezCost || 
        gameState.playerAshes < entity.card.ash || 
        soulsAvailable < entity.card.soul) {
        console.log('no resources');
        return;
    }

    console.log('rezzing now');
    stateSetters.setRezCard(entity);
    stateSetters.setAwaitingSacrifices(true);
    
    if (!entity.card.soul || entity.card.soul === 0) {
        console.log('no soul cost');
        stateSetters.setAwaitingSacrifices(false);
    }
}

// Helper Functions
export function calculateSoulsAvailable(id) {
    const playerRealmsState = {
        Solarium: gameState.playerSolarium,
        Theater: gameState.playerTheater,
        Underpass: gameState.playerUnderpass,
        Grid: gameState.playerGrid,
    };

    return Object.values(playerRealmsState).reduce((sum, realm) => {
        if (realm.people) {
            return sum + realm.people.filter(card => card.id !== id).length;
        }
        return sum;
    }, 0);
}

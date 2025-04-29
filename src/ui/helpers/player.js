import { state, stateSetters } from './state';

// Resource Management
export function gainBits(num) {
    let remainingBits = num;
    if (state.playerOverload > 0) {
        remainingBits = Math.max(0, remainingBits - state.playerOverload);
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
    if (state.playerLag > 0) {
        remainingActions = Math.max(0, remainingActions - state.playerLag);
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
    if (state.playerBurden > 0) {
        remainingPoints = Math.max(0, remainingPoints - state.playerBurden);
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
    console.log('Player draw called with num:', num);
    console.log('Current player library:', state.playerLibrary);
    console.log('Current player hand:', state.playerHand);
    let remainingCards = num;

    if (state.playerWounds > 0) {
        const newWounds = state.playerWounds - num;
        remainingCards = Math.max(0, -newWounds);
        stateSetters.setPlayerWounds(Math.max(0, newWounds));
        console.log('Player has wounds, adjusted remainingCards:', remainingCards);
    }

    if (remainingCards > 0 && state.playerLibrary.length > 0) {
        // Get current state values
        const currentLibrary = state.playerLibrary;
        const currentHand = state.playerHand;

        // Calculate new values
        const newHandCards = currentLibrary.slice(0, remainingCards);
        const newLibrary = currentLibrary.slice(remainingCards);
        const newHand = [...currentHand, ...newHandCards];

        console.log('Cards being drawn:', newHandCards);
        console.log('New library state:', newLibrary);
        console.log('New hand state:', newHand);

        // Update state in sequence
        stateSetters.setPlayerLibrary(newLibrary);
        stateSetters.setPlayerHand(newHand);
    }
}

export function draft() {
    stateSetters.setSelectedCard(state.draft[0]);
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
    if (state.playerActions < 1 || state.playerBits < 1) {
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

    if (state.playerBits < entity.card.rezCost || 
        state.playerAshes < entity.card.ash || 
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
        Solarium: state.playerSolarium,
        Theater: state.playerTheater,
        Underpass: state.playerUnderpass,
        Grid: state.playerGrid,
    };

    return Object.values(playerRealmsState).reduce((sum, realm) => {
        if (realm.people) {
            return sum + realm.people.filter(card => card.id !== id).length;
        }
        return sum;
    }, 0);
}

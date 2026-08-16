import { state, stateSetters } from './state';
import { rezCostFor } from './activation';

// Resource Management
//
// Per notes.txt: "Cannot gain Fate if Burdened, ..., gain Bits if Overloaded,
// .... Each point you would gain decreases the status by the same amount."
//
// So a status absorbs gains 1-for-1 and is itself reduced by the absorbed
// amount, until either the status hits 0 (then remaining points are gained
// normally) or the gain amount hits 0 (then no points are gained but the
// status is reduced).
export function gainBits(num) {
    if (num <= 0) return;
    const absorbed = Math.min(num, state.playerOverload);
    const gained = num - absorbed;
    if (absorbed > 0) {
        stateSetters.setPlayerOverload(prev => Math.max(0, prev - absorbed));
    }
    if (gained > 0) {
        stateSetters.setPlayerBits(prev => prev + gained);
    }
}

export function loseBits(num) {
    stateSetters.setPlayerBits(prev => Math.max(0, prev - num));
}

export function gainAshes(num) {
    stateSetters.setPlayerAshes(prevAshes => prevAshes + num);
}

export function loseAshes(num) {
    stateSetters.setPlayerAshes(prev => Math.max(0, prev - num));
}

export function gainActions(num) {
    if (num <= 0) return;
    const absorbed = Math.min(num, state.playerLag);
    const gained = num - absorbed;
    if (absorbed > 0) {
        stateSetters.setPlayerLag(prev => Math.max(0, prev - absorbed));
    }
    if (gained > 0) {
        stateSetters.setPlayerActions(prev => prev + gained);
    }
}

export function loseActions(num) {
    stateSetters.setPlayerActions(prev => Math.max(0, prev - num));
}

export function gainBurden(num) {
    stateSetters.setPlayerBurden(prevBurden => prevBurden + num);
}

export function loseBurden(num) {
    stateSetters.setPlayerBurden(prev => Math.max(0, prev - num));
}

export function gainFate(num) {
    if (num <= 0) return;
    const absorbed = Math.min(num, state.playerBurden);
    const gained = num - absorbed;
    if (absorbed > 0) {
        stateSetters.setPlayerBurden(prev => Math.max(0, prev - absorbed));
    }
    if (gained > 0) {
        stateSetters.setPlayerFate(prev => prev + gained);
    }
}

export function loseFate(num) {
    stateSetters.setPlayerFate(prev => Math.max(0, prev - num));
}

export function gainWounds(num) {
    stateSetters.setPlayerWounds(prevWounds => prevWounds + num);
}

export function loseWounds(num) {
    stateSetters.setPlayerWounds(prev => Math.max(0, prev - num));
}

export function gainOverload(num) {
    stateSetters.setPlayerOverload(prevOverload => prevOverload + num);
}

export function gainLag(num) {
    stateSetters.setPlayerLag(prevLag => prevLag + num);
}

export function loseLag(num) {
    stateSetters.setPlayerLag(prev => Math.max(0, prev - num));
}

export function gainSurge(num) {
    stateSetters.setPlayerSurge(prev => prev + num);
}

export function loseSurge(num) {
    stateSetters.setPlayerSurge(prev => Math.max(0, prev - num));
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

    const cost = rezCostFor(entity.card);
    if (state.playerBits < cost.bits || 
        state.playerAshes < cost.ash || 
        soulsAvailable < cost.soul) {
        console.log('no resources');
        return;
    }

    console.log('rezzing now');
    stateSetters.setRezCard(entity);
    stateSetters.setAwaitingSacrifices(true);
    
    if (cost.soul === 0) {
        console.log('no soul cost');
        stateSetters.setAwaitingSacrifices(false);
    }
}

/**
 * Pays a card's rez cost. Called once the rez completes, so a cancelled or
 * rejected rez never charges the player.
 *
 * Only Bits and Ash are deducted here. The Soul cost is not a pool to spend
 * from — it is paid by destroying entities during the sacrifice step, which
 * `handleSacrificeConfirmation` handles separately.
 *
 * The amounts come from `rezCostFor`, so keyword discounts such as Rapture
 * reduce what is actually paid rather than only what is required to start.
 *
 * @param {Object} card - The raw card definition being rezzed
 * @returns {{bits: number, ash: number, soul: number}} the cost that was paid
 */
export function payRezCost(card) {
    const cost = rezCostFor(card);

    if (cost.bits > 0) {
        loseBits(cost.bits);
    }
    if (cost.ash > 0) {
        loseAshes(cost.ash);
    }

    console.log(`Paid rez cost for ${card?.name}: ${cost.bits} Bits, ${cost.ash} Ash`);
    return cost;
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

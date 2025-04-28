import { state, stateSetters } from './state';
import { activateAbilities } from '../abilities/glossary';

// Resource Management
export function gainBits(num) {
    let remainingBits = num;
    if (state.enemyOverload > 0) {
        remainingBits = Math.max(0, remainingBits - state.enemyOverload);
    }
    stateSetters.setEnemyBits(prevBits => prevBits + remainingBits);
}

export function loseBits(num) {
    stateSetters.setEnemyBits(prevBits => prevBits - num);
}

export function gainAshes(num) {
    stateSetters.setEnemyAshes(prevAshes => prevAshes + num);
}

export function loseAshes(num) {
    stateSetters.setEnemyAshes(prevAshes => prevAshes - num);
}

export function gainActions(num) {
    let remainingActions = num;
    if (state.enemyLag > 0) {
        remainingActions = Math.max(0, remainingActions - state.enemyLag);
    }
    stateSetters.setEnemyActions(prevActions => prevActions + remainingActions);
}

export function loseActions(num) {
    stateSetters.setEnemyActions(prevActions => Math.max(0, prevActions - num));
}

export function gainBurden(num) {
    stateSetters.setEnemyBurden(prevBurden => prevBurden + num);
}

export function loseBurden(num) {
    stateSetters.setEnemyBurden(prevBurden => prevBurden - num);
}

export function gainFate(num) {
    let remainingPoints = num;
    if (state.enemyBurden > 0) {
        remainingPoints = Math.max(0, remainingPoints - state.enemyBurden);
    }
    stateSetters.setEnemyFate(prevFate => prevFate + remainingPoints);
}

export function loseFate(num) {
    stateSetters.setEnemyFate(prevFate => prevFate - num);
}

export function gainWounds(num) {
    stateSetters.setEnemyWounds(prevWounds => prevWounds + num);
}

export function loseWounds(num) {
    stateSetters.setEnemyWounds(prevWounds => prevWounds - num);
}

export function gainOverload(num) {
    stateSetters.setEnemyOverload(prevOverload => prevOverload + num);
}

export function gainLag(num) {
    stateSetters.setEnemyLag(prevLag => prevLag + num);
}

export function loseLag(num) {
    stateSetters.setEnemyLag(prevLag => prevLag - num);
}

export function gainSurge(num) {
    stateSetters.setEnemySurge(prev => prev + num);
}

// Card Management
export function draw(num) {
    console.log('enemy draw ', num);
    let remainingCards = num;

    if (state.enemyWounds > 0) {
        const newWounds = state.enemyWounds - num;
        remainingCards = Math.max(0, -newWounds);
        stateSetters.setEnemyWounds(Math.max(0, newWounds));
    }

    if (remainingCards > 0) {
        stateSetters.setEnemyLibrary(prevLibrary => {
            const newHandCards = prevLibrary.slice(0, remainingCards);
            const newLibrary = prevLibrary.slice(remainingCards);

            stateSetters.setEnemyHand(prevHand => [
                ...prevHand,
                ...newHandCards
            ]);

            return newLibrary;
        });
    }
}

// Card Activation
export function handleRez(card) {
    // Always activate for free since it's an enemy card
    activateAbilities(card, 'ENEMY');
}

// Helper Functions
export function calculateSoulsAvailable(id) {
    const enemyRealmsState = {
        Solarium: state.enemySolarium,
        Theater: state.enemyTheater,
        Underpass: state.enemyUnderpass,
        Grid: state.enemyGrid,
    };

    return Object.values(enemyRealmsState).reduce((sum, realm) => {
        if (realm.people) {
            return sum + realm.people.filter(card => card.id !== id).length;
        }
        return sum;
    }, 0);
}

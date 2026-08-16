import { state, stateSetters } from './state';
import { activateAbilities } from '../abilities/glossary';
import { eventManager } from './eventManager';

// Resource Management
// See player.js for semantics: gains are absorbed 1-for-1 by their paired
// status, and the status itself is decremented by the absorbed amount.
export function gainBits(num) {
    if (num <= 0) return;
    const absorbed = Math.min(num, state.enemyOverload);
    const gained = num - absorbed;
    if (absorbed > 0) {
        stateSetters.setEnemyOverload(prev => Math.max(0, prev - absorbed));
    }
    if (gained > 0) {
        stateSetters.setEnemyBits(prev => prev + gained);
    }
}

export function loseBits(num) {
    stateSetters.setEnemyBits(prev => Math.max(0, prev - num));
}

export function gainAshes(num) {
    stateSetters.setEnemyAshes(prevAshes => prevAshes + num);
}

export function loseAshes(num) {
    stateSetters.setEnemyAshes(prev => Math.max(0, prev - num));
}

export function gainActions(num) {
    if (num <= 0) return;
    const absorbed = Math.min(num, state.enemyLag);
    const gained = num - absorbed;
    if (absorbed > 0) {
        stateSetters.setEnemyLag(prev => Math.max(0, prev - absorbed));
    }
    if (gained > 0) {
        stateSetters.setEnemyActions(prev => prev + gained);
    }
}

export function loseActions(num) {
    stateSetters.setEnemyActions(prevActions => Math.max(0, prevActions - num));
}

export function gainBurden(num) {
    stateSetters.setEnemyBurden(prevBurden => prevBurden + num);
}

export function loseBurden(num) {
    stateSetters.setEnemyBurden(prev => Math.max(0, prev - num));
}

export function gainFate(num) {
    if (num <= 0) return;
    const absorbed = Math.min(num, state.enemyBurden);
    const gained = num - absorbed;
    if (absorbed > 0) {
        stateSetters.setEnemyBurden(prev => Math.max(0, prev - absorbed));
    }
    if (gained > 0) {
        stateSetters.setEnemyFate(prev => prev + gained);
    }
}

export function loseFate(num) {
    stateSetters.setEnemyFate(prev => Math.max(0, prev - num));
}

export function gainWounds(num) {
    stateSetters.setEnemyWounds(prevWounds => prevWounds + num);
}

export function loseWounds(num) {
    stateSetters.setEnemyWounds(prev => Math.max(0, prev - num));
}

export function gainOverload(num) {
    stateSetters.setEnemyOverload(prevOverload => prevOverload + num);
}

export function gainLag(num) {
    stateSetters.setEnemyLag(prevLag => prevLag + num);
}

export function loseLag(num) {
    stateSetters.setEnemyLag(prev => Math.max(0, prev - num));
}

export function gainSurge(num) {
    stateSetters.setEnemySurge(prev => prev + num);
}

export function loseSurge(num) {
    stateSetters.setEnemySurge(prev => Math.max(0, prev - num));
}

// Card Management
export function draw(num) {
    console.log('Enemy draw called with num:', num);
    console.log('Current enemy library:', state.enemyLibrary);
    console.log('Current enemy hand:', state.enemyHand);
    let remainingCards = num;

    if (state.enemyWounds > 0) {
        const newWounds = state.enemyWounds - num;
        remainingCards = Math.max(0, -newWounds);
        stateSetters.setEnemyWounds(Math.max(0, newWounds));
        console.log('Enemy has wounds, adjusted remainingCards:', remainingCards);
    }

    if (remainingCards > 0 && state.enemyLibrary.length > 0) {
        // Get current state values
        const currentLibrary = state.enemyLibrary;
        const currentHand = state.enemyHand;

        // Calculate new values
        const newHandCards = currentLibrary.slice(0, remainingCards);
        const newLibrary = currentLibrary.slice(remainingCards);
        const newHand = [...currentHand, ...newHandCards];

        console.log('Cards being drawn:', newHandCards);
        console.log('New library state:', newLibrary);
        console.log('New hand state:', newHand);

        // Update state in sequence
        stateSetters.setEnemyLibrary(newLibrary);
        stateSetters.setEnemyHand(newHand);
    }
}

// Card Activation
export function handleRez(card) {
    // Always activate for free since it's an enemy card
    activateAbilities(card, 'ENEMY');
    eventManager.publish('entityEntered', {
        side: 'ENEMY',
        entity: card,
        realm: card.realm
    });
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

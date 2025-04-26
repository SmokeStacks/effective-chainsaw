import { gameState, setters } from './state';

// Resource Management
export function gainBits(num) {
    let remainingBits = num;
    if (gameState.enemyOverload > 0) {
        remainingBits = Math.max(0, remainingBits - gameState.enemyOverload);
    }
    setters.setEnemyBits(prevBits => prevBits + remainingBits);
}

export function loseBits(num) {
    setters.setEnemyBits(prevBits => prevBits - num);
}

export function gainAshes(num) {
    setters.setEnemyAshes(prevAshes => prevAshes + num);
}

export function loseAshes(num) {
    setters.setEnemyAshes(prevAshes => prevAshes - num);
}

export function gainActions(num) {
    let remainingActions = num;
    if (gameState.enemyLag > 0) {
        remainingActions = Math.max(0, remainingActions - gameState.enemyLag);
    }
    setters.setEnemyActions(prevActions => prevActions + remainingActions);
}

export function loseActions(num) {
    setters.setEnemyActions(prevActions => Math.max(0, prevActions - num));
}

export function gainBurden(num) {
    setters.setEnemyBurden(prevBurden => prevBurden + num);
}

export function loseBurden(num) {
    setters.setEnemyBurden(prevBurden => prevBurden - num);
}

export function gainFate(num) {
    let remainingPoints = num;
    if (gameState.enemyBurden > 0) {
        remainingPoints = Math.max(0, remainingPoints - gameState.enemyBurden);
    }
    setters.setEnemyFate(prevFate => prevFate + remainingPoints);
}

export function loseFate(num) {
    setters.setEnemyFate(prevFate => prevFate - num);
}

export function gainWounds(num) {
    setters.setEnemyWounds(prevWounds => prevWounds + num);
}

export function loseWounds(num) {
    setters.setEnemyWounds(prevWounds => prevWounds - num);
}

export function gainOverload(num) {
    setters.setEnemyOverload(prevOverload => prevOverload + num);
}

export function gainLag(num) {
    setters.setEnemyLag(prevLag => prevLag + num);
}

export function loseLag(num) {
    setters.setEnemyLag(prevLag => prevLag - num);
}

export function gainSurge(num) {
    setters.setEnemySurge(prev => prev + num);
}

// Card Management
export function draw(num) {
    console.log('enemy draw ', num);
    let remainingCards = num;

    if (gameState.enemyWounds > 0) {
        const newWounds = gameState.enemyWounds - num;
        remainingCards = Math.max(0, -newWounds);
        setters.setEnemyWounds(Math.max(0, newWounds));
    }

    if (remainingCards > 0) {
        setters.setEnemyLibrary(prevLibrary => {
            const newHandCards = prevLibrary.slice(0, remainingCards);
            const newLibrary = prevLibrary.slice(remainingCards);

            setters.setEnemyHand(prevHand => [
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
        Solarium: gameState.enemySolarium,
        Theater: gameState.enemyTheater,
        Underpass: gameState.enemyUnderpass,
        Grid: gameState.enemyGrid,
    };

    return Object.values(enemyRealmsState).reduce((sum, realm) => {
        if (realm.people) {
            return sum + realm.people.filter(card => card.id !== id).length;
        }
        return sum;
    }, 0);
}

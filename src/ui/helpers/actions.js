import { state, stateSetters } from './state';
import { draw, draft } from './player';

// Button handlers
export const handleBoostButton = () => {
    if (state.playerActions < 1 || state.playerBits < 1) {
        console.log('Not enough resources to boost.');
        return;
    }
    stateSetters.setPlayerActions(prev => prev - 1);
    stateSetters.setPlayerBits(prev => prev - 1);
    stateSetters.setAttackMode('BOOST');
};

export const handleDevelopButton = () => {
    if (state.playerActions < 1 || state.playerBits < 1) {
        console.log('Not enough resources to develop a card.');
        return;
    }
    stateSetters.setPlayerActions(prev => prev - 1);
    stateSetters.setPlayerBits(prev => prev - 1);
    stateSetters.setAttackMode('DEVELOP');
    console.log('Select a card to develop.');
};

export const handleDrawButton = () => {
    if (state.playerActions < 1) {
        console.log('Not enough actions to draw.');
        return;
    }
    draw(1);
    stateSetters.setPlayerActions(prev => prev - 1);
    stateSetters.setCurrentPlayer('ENEMY');
};

export const handleDraftButton = () => {
    draft();
};

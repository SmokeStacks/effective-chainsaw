import { setAttackMode } from './state';
import { playerLoseActions } from './player';
import { eventManager } from './eventManager';

export const handleQuest = () => {
    setAttackMode('PLAYER_QUEST');
    playerLoseActions(1);
    eventManager.publish('questStarted', { type: 'QUEST' });
};

export const handleRaid = () => {
    setAttackMode('PLAYER_RAID');
    playerLoseActions(1);
    eventManager.publish('raidStarted', { type: 'RAID' });
};

export const handleHack = () => {
    setAttackMode('PLAYER_HACK');
    playerLoseActions(1);
    eventManager.publish('hackStarted', { type: 'HACK' });
    console.log('Starting hack attack');
};
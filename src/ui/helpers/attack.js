const handleQuest = () => {
    setAttackMode('PLAYER_QUEST')
    playerLoseActions(1);
};

const handleRaid = () => {
    setAttackMode('PLAYER_RAID')
    playerLoseActions(1);
};

const handleHack = () => {
    console.log('handle hack')
    setAttackMode('PLAYER_HACK')
    playerLoseActions(1);
};
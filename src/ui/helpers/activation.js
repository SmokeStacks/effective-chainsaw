const handleRezPlayerCard = (entity) => {
    console.log('handle rez', entity)
    const soulsAvailable = calculateSoulsAvailable(entity.id);
    if ((entity.card.category !== 'LANDMARK' && entity.online) && (entity.card.category !== 'LOCATION' && entity.online)) {
        console.log('already online')
        return;
    }

    if (playerBits < entity.card.rezCost || playerAshes < entity.card.ash || soulsAvailable < entity.card.soul) {
        console.log('no resources')
        //console.error('Not enough resources to rez the card');
        return;
    }
    console.log('rezzing now')
    setRezCard(entity);
    setAwaitingSacrifices(true);
    if (!entity.card.soul || entity.card.soul === 0) {
        console.log('no soul cost')
        setAwaitingSacrifices(false);
    }
}

const calculateSoulsAvailable = (id) => {
    const playerRealmsState = {
        Solarium: playerSolarium,
        Theater: playerTheater,
        Underpass: playerUnderpass,
        Grid: playerGrid,
    };

    return Object.values(playerRealmsState).reduce((sum, realm) => {
        if (realm.people) {
            // Filter out the card being online, then count the remaining cards
            return sum + realm.people.filter(card => card.id !== id).length;
        }
        return sum;
    }, 0);
};
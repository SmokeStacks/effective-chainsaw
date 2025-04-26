    function shuffle(array) {
        let currentIndex = array.length;
        while (currentIndex !== 0) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
    }

    const createLibrary = () => {
        const libraryInstanceArray = [];
        for (let i = 0; i < cardList1.length; i++) { //todo1 scheming
            const card = cardList1[i];
            const cardEntityInstance = {
                id: `a${i.toString()}`,
                card: card,
                power: card.power || 0,
                HP: card.HP || 0,
                wounds: 0,
                exposed: false,
                scored: false,
                online: false,
                readied: false,
                ascended: false,
                steps: 0,
                freeze: 0,
                decay: 0,
                venom: 0,
                charge: card.charge || 0,
                sacrificed: false,
                cosmic: card.cosmic || 1,
                deathless: card.deathless || 0,
                pounce: card.pounce || 0,
                override: card.override || 0,
                stealth: card.stealth || 0,
                armored: card.armored || 0,
                solo: card.solo || 0,
                development: card.development || 0,
                plot: card.plot || 0,
                owner: 'PLAYER',
            };
            libraryInstanceArray.push(cardEntityInstance);
        }
        //shuffle(libraryInstanceArray);
        return libraryInstanceArray;
    };

    const createEnemyLibrary = () => {
        const libraryInstanceArray = [];
        for (let i = 0; i < cardList2.length; i++) {
            const card = cardList2[i];
            const cardEntityInstance = {
                id: `b${i.toString()}`,
                card: card,
                power: card.power || 0,
                HP: card.HP || 0,
                wounds: 0,
                exposed: false,
                scored: false,
                online: false,
                readied: false,
                ascended: false,
                steps: 0,
                freeze: 0,
                decay: 0,
                venom: 0,
                charge: card.charge || 0,
                sacrificed: false,
                cosmic: card.cosmic || 1,
                deathless: card.deathless || 0, //todo1
                pounce: card.pounce || 0,
                override: card.override || 0,
                stealth: card.stealth || 0,
                armored: card.armored || 0,
                solo: card.solo || 0,
                development: card.development || 0,
                plot: card.plot || 0,
                owner: 'ENEMY',
            };
            libraryInstanceArray.push(cardEntityInstance);
        }
        shuffle(libraryInstanceArray);
        return libraryInstanceArray;
    };

    const createDraft = () => {
        const draftInstanceArray = [];
        for (let i = 0; i < draftList.length; i++) {
            const card = draftList[i];
            const cardEntityInstance = {
                id: `c${i.toString()}`,
                card: card,
                power: card.power || 0,
                HP: card.HP || 0,
                wounds: 0,
                exposed: false,
                scored: false,
                online: false,
                readied: false,
                ascended: false,
                steps: 0,
                freeze: 0,
                decay: 0,
                venom: 0,
                charge: card.charge || 0,
                sacrificed: false,
                cosmic: card.cosmic || 1,
                deathless: card.deathless || 0, //todo1
                pounce: card.pounce || 0,
                override: card.override || 0,
                stealth: card.stealth || 0,
                armored: card.armored || 0,
                solo: card.solo || 0,
                development: card.development || 0,
                plot: card.plot || 0,
                owner: 'ENEMY',
            };
            draftInstanceArray.push(cardEntityInstance);
        }
        return draftInstanceArray;
    };

    function createRealm(name, elements) {
        return new Realm(name, elements);
    }

    
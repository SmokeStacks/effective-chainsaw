import { cardList1 } from '../../playerDecks/deckTwo';
import enemyOne from '../../systemDecks/enemyOne';

export function shuffle(array) {
        let currentIndex = array.length;
        while (currentIndex !== 0) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
    }

export const createLibrary = () => {
    console.log('Creating player library...');
    console.log('Player deck source:', cardList1);
    const libraryInstanceArray = [];
    for (let i = 0; i < cardList1.length; i++) {
        const card = cardList1[i];
        const cardEntityInstance = {
            id: `a${i.toString()}`,
            card: card,
            power: card.power || 0,
            HP: card.HP || 0,
            online: false,
            tapped: false,
            damage: 0,
            shield: 0,
            counters: 0,
            tokens: [],
            abilities: card.abilities || [],
            keywords: card.keywords || [],
            faction: card.faction,
            category: card.category,
        };
        libraryInstanceArray.push(cardEntityInstance);
    }
    console.log('Created player library:', libraryInstanceArray);
    shuffle(libraryInstanceArray);
    return libraryInstanceArray;
};

export const createEnemyLibrary = () => {
    console.log('Creating enemy library...');
    console.log('Enemy deck source:', enemyOne);
    const libraryInstanceArray = [];
    for (let i = 0; i < enemyOne.length; i++) {
        const card = enemyOne[i];
        const cardEntityInstance = {
            id: `b${i.toString()}`,
            card: card,
            power: card.power || 0,
            HP: card.HP || 0,
            online: false,
            tapped: false,
            damage: 0,
            shield: 0,
            counters: 0,
            tokens: [],
            abilities: card.abilities || [],
            keywords: card.keywords || [],
            faction: card.faction,
            category: card.category,
        };
        libraryInstanceArray.push(cardEntityInstance);
    }
    console.log('Created enemy library:', libraryInstanceArray);
    shuffle(libraryInstanceArray);
    return libraryInstanceArray;
};

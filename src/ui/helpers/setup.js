import { cardList1, cardList2 } from '../data/cardList';
import { setPlayerLibrary, setEnemyLibrary } from './state';

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
        shuffle(libraryInstanceArray);
        setPlayerLibrary(libraryInstanceArray);
        return libraryInstanceArray;
    };

export const createEnemyLibrary = () => {
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
        setEnemyLibrary(libraryInstanceArray);
        return libraryInstanceArray;
    };

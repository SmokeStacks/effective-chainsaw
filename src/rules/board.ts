// //import { v4 as uuidv4 } from 'uuid';

// // Import the necessary types and enums
// import { CardEntity, Focus, RealmName } from './cards';
// import { cardList } from './binder';


// enum Element {
//     MAGI = 'MAGI',
//     PHYS = 'PHYS',
//     TECH = 'TECH',
// }

// // Define a class for Realms
// class Realm {
//     name: RealmName;
//     elements: Element[];
//     people: CardEntity[] = [];
//     places: CardEntity[] = [];
//     things: CardEntity[] = [];
//     constructor(name: RealmName, elements: Element[]) {
//         this.name = name;
//         this.elements = elements;
//     }
// }


// // Define a class for shared slots (Landmarks, Locations, ISO Servers)
// class SharedSlot {
//     max: number;
//     current: number;
//     type: 'PLACE' | 'THING';

//     constructor(maxSlots: number, typeSpec: 'PLACE' | 'THING') {
//         this.max = maxSlots;
//         this.current = 0;
//         this.type = typeSpec;
//     }
// }

// class SharedSlotOperator {
//     theaterPlaces: SharedSlot;
//     underpassPlaces: SharedSlot;
//     underpassThings: SharedSlot;
//     gridThings: SharedSlot;

//     constructor() {
//         this.theaterPlaces = new SharedSlot(4, 'PLACE');
//         this.underpassPlaces = new SharedSlot(3, 'PLACE');
//         this.underpassThings = new SharedSlot(4, 'THING');
//         this.gridThings = new SharedSlot(5, 'THING');
//     }
// }

// // Define a class for the player board
// class PlayerBoard {
//     graveyard: Graveyard = new Graveyard();
//     hand: Hand = new Hand();
//     library: Library = new Library();
//     realms: Realm[] = [
//         new Realm('SOLARIUM'),
//         new Realm('THEATER'),
//         new Realm('UNDERPASS'),
//         new Realm('GRID'),
//     ];
//     focus: Focus = 'MIND'; // Set the initial focus
//     // Other properties and methods as needed
// }

// // Now, you can create instances of these classes to represent the game board.
// const player1Board = new PlayerBoard();
// const player2Board = new PlayerBoard();

// // Initialize hand and library as empty arrays
// player1Board.hand.cards = [];
// player1Board.library.cards = [];
// player2Board.hand.cards = [];
// player2Board.library.cards = [];

// // Assign the realm types and elements for player1Board and player2Board
// player1Board.realms[0].elements.push(Element.MAGIC); // Solarium - Magi
// player1Board.realms[1].elements.push(Element.MAGIC, Element.PHYSICAL); // Theater - Magi+Phys
// player1Board.realms[2].elements.push(Element.PHYSICAL, Element.TECHNOLOGY); // Underpass - Phys+Tech
// player1Board.realms[3].elements.push(Element.TECHNOLOGY); // Grid - Tech

// player2Board.realms[0].elements.push(Element.MAGIC); // Solarium - Magi
// player2Board.realms[1].elements.push(Element.MAGIC, Element.PHYSICAL); // Theater - Magi+Phys
// player2Board.realms[2].elements.push(Element.PHYSICAL, Element.TECHNOLOGY); // Underpass - Phys+Tech
// player2Board.realms[3].elements.push(Element.TECHNOLOGY); // Grid - Tech

// // Initialize hand and library as empty arrays
// player1Board.hand.cards = [];
// player1Board.library.cards = [];

// for (let i = 0; i < 5; i++) { 
//     const card = cardList[i]; // Get the card from cardList

//     // Create a CardEntity instance for the card
//     const cardEntityInstance: CardEntity = {
//         id: i.toString(), // You can use any unique identifier here
//         card: card,
//         wounds: 0, // Set any initial values as needed
//         online: false,
//         exposed: false,
//         scored: false
//     };

//     // Add the cardEntityInstance to both the hand and library
//     player1Board.hand.cards.push(cardEntityInstance);
//     player1Board.library.cards.push(cardEntityInstance);
// }

// // Usage:
// const slopOperatorInstance = new SharedSlotOperator();


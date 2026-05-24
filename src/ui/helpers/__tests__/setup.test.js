// Unit tests for src/ui/helpers/setup.js card-instance construction.
//
// Regression for the bug where keyword stats like armored/deathless/stealth
// were initialized to `false` on player/enemy libraries while the damage and
// ability code treats them as numeric counters.

import { buildCardInstance } from '../setup';

describe('buildCardInstance', () => {
    test('keyword stats default to numbers, not booleans', () => {
        const card = { name: 'Plain Entity', category: 'ENTITY' };
        const instance = buildCardInstance('x0', card, 'PLAYER');

        for (const key of ['charge', 'deathless', 'pounce', 'override', 'stealth', 'armored', 'solo']) {
            expect(typeof instance[key]).toBe('number');
            expect(instance[key]).toBe(0);
        }
        // Cosmic defaults to 1 to match the draft-list convention
        expect(instance.cosmic).toBe(1);
    });

    test('keyword stats pass through values from the card definition', () => {
        const card = {
            name: 'Armored Guard',
            category: 'ENTITY',
            armored: 2,
            deathless: 1,
            stealth: 3,
            power: 4,
            HP: 5,
        };
        const instance = buildCardInstance('x1', card, 'ENEMY');

        expect(instance.armored).toBe(2);
        expect(instance.deathless).toBe(1);
        expect(instance.stealth).toBe(3);
        expect(instance.power).toBe(4);
        expect(instance.HP).toBe(5);
        expect(instance.owner).toBe('ENEMY');
        expect(instance.id).toBe('x1');
        expect(instance.card).toBe(card);
    });

    test('runtime counters start at zero', () => {
        const card = { name: 'X', category: 'ENTITY' };
        const instance = buildCardInstance('x2', card, 'PLAYER');

        for (const key of ['wounds', 'steps', 'freeze', 'decay', 'venom', 'damage', 'shield', 'counters']) {
            expect(instance[key]).toBe(0);
        }
    });

    test('boolean flags really are booleans', () => {
        const card = { name: 'X', category: 'ENTITY' };
        const instance = buildCardInstance('x3', card, 'PLAYER');

        for (const key of ['exposed', 'scored', 'readied', 'ascended', 'online', 'tapped', 'sacrificed']) {
            expect(typeof instance[key]).toBe('boolean');
            expect(instance[key]).toBe(false);
        }
    });
});

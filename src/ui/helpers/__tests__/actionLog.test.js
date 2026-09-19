// The action log subscribes to the game's existing events. It must never be
// able to affect play, so the important properties are: it renders sensible
// text, it skips events it cannot make sense of, and a formatter that throws is
// swallowed rather than propagating into the publisher.

import { eventManager } from '../eventManager';
import { EVENT_FORMATTERS, subscribeActionLog } from '../actionLog';

describe('formatters', () => {
    test('a turn start is logged once, for the player side only', () => {
        expect(EVENT_FORMATTERS.turnStart({ side: 'ENEMY' })).toBeNull();
        const entry = EVENT_FORMATTERS.turnStart({ side: 'PLAYER' });
        expect(entry.side).toBe('SYSTEM');
        expect(entry.text).toMatch(/Turn/);
    });

    test('a successful hack names the target zone', () => {
        expect(EVENT_FORMATTERS.successfulHack({ side: 'PLAYER', targetType: 'PANDORA' }).text)
            .toBe('You hacked Pandora.');
        expect(EVENT_FORMATTERS.successfulHack({ side: 'ENEMY', targetType: 'HEADSPACE' }).text)
            .toBe('Enemy hacked HeadSpace.');
    });

    test('an unblocked attack reports the attacker and power', () => {
        const entry = EVENT_FORMATTERS.unblockedAttack({
            attacker: { card: { name: 'Ripper' } },
            power: 3,
            side: 'PLAYER',
        });
        expect(entry.text).toBe('Ripper got through for 3.');
    });

    test('an event with no identifiable entity is skipped rather than logged as undefined', () => {
        expect(EVENT_FORMATTERS.unblockedAttack({ side: 'PLAYER', power: 2 })).toBeNull();
        expect(EVENT_FORMATTERS.cardStolen({ side: 'PLAYER' })).toBeNull();
        expect(EVENT_FORMATTERS.entityEntered({ side: 'PLAYER' })).toBeNull();
    });

    test('entity names are read from either the instance or the raw card', () => {
        expect(EVENT_FORMATTERS.entityEntered({ side: 'PLAYER', entity: { card: { name: 'A' } }, realm: 'Grid' }).text)
            .toBe('You played A to Grid.');
        expect(EVENT_FORMATTERS.entityEntered({ side: 'PLAYER', entity: { name: 'B' } }).text)
            .toBe('You played B.');
    });

    test('a tied Dominance is reported as a tie', () => {
        expect(EVENT_FORMATTERS.dominationResolved({ winner: null }).text)
            .toBe('Dominance ended in a tie.');
        expect(EVENT_FORMATTERS.dominationResolved({ winner: 'ENEMY' }).text)
            .toBe('Enemy won Dominance.');
    });

    test('failure reasons are made readable', () => {
        expect(EVENT_FORMATTERS.actionFailed({ action: 'DRAFT', reason: 'insufficient_bits' }).text)
            .toBe('DRAFT failed (insufficient bits).');
    });

    test('every formatter tolerates a missing payload', () => {
        for (const [name, format] of Object.entries(EVENT_FORMATTERS)) {
            expect(() => format(undefined)).not.toThrow(`${name} threw on an undefined payload`);
        }
    });
});

describe('subscribeActionLog', () => {
    let unsubscribe;

    afterEach(() => {
        if (unsubscribe) unsubscribe();
        unsubscribe = undefined;
    });

    test('appends an entry when a subscribed event is published', () => {
        const entries = [];
        unsubscribe = subscribeActionLog(entry => entries.push(entry));

        eventManager.publish('successfulHack', { side: 'PLAYER', targetType: 'PANDORA' });

        expect(entries).toHaveLength(1);
        expect(entries[0].text).toBe('You hacked Pandora.');
    });

    test('ignores events it has no formatter for', () => {
        const entries = [];
        unsubscribe = subscribeActionLog(entry => entries.push(entry));

        eventManager.publish('someUnrelatedEvent', { foo: 'bar' });

        expect(entries).toHaveLength(0);
    });

    test('unsubscribing stops the log', () => {
        const entries = [];
        const stop = subscribeActionLog(entry => entries.push(entry));
        stop();

        eventManager.publish('successfulHack', { side: 'PLAYER', targetType: 'PANDORA' });

        expect(entries).toHaveLength(0);
    });

    test('a throwing consumer cannot escape into the publisher', () => {
        unsubscribe = subscribeActionLog(() => {
            throw new Error('render blew up');
        });

        // The log must not be able to break the game loop that published this.
        expect(() => eventManager.publish('successfulHack', { side: 'PLAYER', targetType: 'PANDORA' }))
            .not.toThrow();
    });
});

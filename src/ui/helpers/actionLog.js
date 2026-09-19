// A running log of what each side did, for the UI.
//
// This deliberately subscribes to the events the game already publishes rather
// than adding logging calls throughout the game logic. Nothing here can change
// game behaviour: it only reads event payloads and formats strings.
//
// If an event's payload shape is not what we expect, the formatter returns null
// and the entry is skipped rather than rendering "undefined" or throwing.

import { eventManager } from './eventManager';

const sideLabel = (side) => (side === 'ENEMY' ? 'Enemy' : 'You');

// Entity payloads are inconsistent across events: some carry the built instance
// (with .card), some the raw card, some only an id.
const entityName = (entity) => {
    if (!entity) return null;
    if (entity.card?.name) return entity.card.name;
    if (entity.name) return entity.name;
    if (entity.id) return `#${entity.id}`;
    return null;
};

const target = (targetType) => {
    if (targetType === 'PANDORA') return 'Pandora';
    if (targetType === 'HEADSPACE') return 'HeadSpace';
    return targetType ? String(targetType) : 'their System';
};

// Maps an event to { side, text }, or null to skip it.
// `side` is only used to colour the entry; 'SYSTEM' for neutral lines.
export const EVENT_FORMATTERS = {
    turnStart: (d) => {
        // Published once per side per turn; log it once.
        if (d?.side !== 'PLAYER') return null;
        return { side: 'SYSTEM', text: `— Turn ${eventManager.getTurnCount()} —` };
    },

    turnOrderDecided: (d) => ({
        side: 'SYSTEM',
        text: d?.side === 'ENEMY'
            ? 'Enemy goes first. You take +1 Bit for going second.'
            : 'You go first. Enemy takes +1 Bit for going second.',
    }),

    actionTaken: (d) => ({ side: 'PLAYER', text: `You used ${d?.action || 'an action'}.` }),
    actionFailed: (d) => ({
        side: 'PLAYER',
        text: `${d?.action || 'Action'} failed (${(d?.reason || 'unknown').replace(/_/g, ' ')}).`,
    }),

    questStarted: () => ({ side: 'PLAYER', text: 'You declared an Explore.' }),
    raidStarted: () => ({ side: 'PLAYER', text: 'You declared a Raid.' }),
    hackStarted: () => ({ side: 'PLAYER', text: 'You declared a Hack.' }),

    firstAttack: (d) => ({
        side: d?.side,
        text: `${sideLabel(d?.side)} attacked in ${d?.realm || 'a Realm'}.`,
    }),

    unblockedAttack: (d) => {
        const name = entityName(d?.attacker);
        if (!name) return null;
        return { side: d?.side, text: `${name} got through for ${d?.power ?? 0}.` };
    },

    questSuccess: (d) => ({ side: d?.side, text: `${sideLabel(d?.side)} gained Fate from an Explore.` }),

    successfulHack: (d) => ({
        side: d?.side,
        text: `${sideLabel(d?.side)} hacked ${target(d?.targetType)}.`,
    }),
    failedHack: (d) => ({
        side: d?.side,
        text: `${sideLabel(d?.side)}'s Hack was blocked.`,
    }),

    cardStolen: (d) => {
        const name = entityName(d?.card);
        if (!name) return null;
        return { side: d?.side, text: `${sideLabel(d?.side)} took ${name}.` };
    },

    entityEntered: (d) => {
        const name = entityName(d?.entity);
        if (!name) return null;
        return {
            side: d?.side,
            text: `${sideLabel(d?.side)} played ${name}${d?.realm ? ` to ${d.realm}` : ''}.`,
        };
    },

    cardBoosted: (d) => {
        const name = entityName(d?.cardEntity);
        if (!name) return null;
        return { side: 'SYSTEM', text: `${name} was Boosted.` };
    },

    entityDied: (d) => ({
        side: d?.owner,
        text: `${sideLabel(d?.owner)} lost an Entity in ${d?.realmName || 'a Realm'}.`,
    }),
    placeDestroyed: (d) => ({
        side: d?.side,
        text: `${sideLabel(d?.side)}'s Place in ${d?.realm || 'a Realm'} was destroyed.`,
    }),
    thingDestroyed: (d) => ({
        side: d?.side,
        text: `${sideLabel(d?.side)}'s Thing in ${d?.realm || 'a Realm'} was destroyed.`,
    }),

    // Otherwise the game would just end with no indication of why.
    deckedOut: (d) => ({
        side: d?.side,
        text: `${sideLabel(d?.side)} drew from an empty Pandora.`,
    }),

    dominationResolved: (d) => {
        if (!d?.winner) return { side: 'SYSTEM', text: 'Dominance ended in a tie.' };
        return { side: d.winner, text: `${sideLabel(d.winner)} won Dominance.` };
    },
};

/**
 * Subscribes the log to the game's events.
 *
 * @param {(entry: {side: string, text: string}) => void} append
 * @returns {() => void} unsubscribe
 */
export function subscribeActionLog(append) {
    const handlers = Object.entries(EVENT_FORMATTERS).map(([eventType, format]) => {
        const handler = (data) => {
            // The log must never be able to break the game, so both the
            // formatting and the consumer are guarded: eventManager.publish
            // calls subscribers synchronously, so anything thrown here would
            // otherwise propagate into the game code that published the event.
            try {
                const entry = format(data);
                if (entry && entry.text) append(entry);
            } catch (err) {
                console.warn(`actionLog: dropped "${eventType}"`, err);
            }
        };
        eventManager.subscribe(eventType, handler);
        return [eventType, handler];
    });

    return () => handlers.forEach(([eventType, handler]) => eventManager.unsubscribe(eventType, handler));
}

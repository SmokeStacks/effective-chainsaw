// Event management system for game-wide events
export const eventManager = {
    events: {},
    turnCount: 0,

    subscribe: (eventType, callback) => {
        console.log('SUBSCRIBED', eventType);
        if (!eventManager.events[eventType]) {
            eventManager.events[eventType] = [];
        }
        eventManager.events[eventType].push(callback);
        console.log('new event ', eventManager.events);
    },

    unsubscribe: (eventType, callback) => {
        if (eventManager.events[eventType]) {
            eventManager.events[eventType] = eventManager.events[eventType].filter(cb => cb !== callback);
            console.log('UNSUBSCRIBED', eventType);
        }
    },

    publish: (eventType, data) => {
        console.log('PUBLISH', eventType);
        console.log('PUBLISH DATA', data);
        console.log('EVENTS', eventManager.events);
        if (eventType === 'turnStart' && data.side === 'PLAYER') {
            eventManager.turnCount++;
        }
        if (eventManager.events[eventType] && eventManager.events[eventType].length > 0) {
            console.log('CALLBACK');
            eventManager.events[eventType].forEach(callback => callback(data));
        } else {
            console.log(`No callbacks subscribed for event: ${eventType}`);
        }
    },

    getTurnCount: () => {
        return eventManager.turnCount;
    },
};

import RealmCreatures from "../RealmCreatures";

// todo
// SolariumRealm.js
export function Solarium({ onRealmSelect, onRealmCardSelect, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className="realm solarium" onClick={() => onRealmSelect('SOLARIUM')}>
            Solarium
            <div className="creatures-container">
                <RealmCreatures cards={enemyState.people} isPlayerCard={false} />
            </div>
            <div className="slot-holder"></div>
            <div className="creatures-container">
                <RealmCreatures cards={playerState.people} onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true} />
            </div>
        </div>
    );
}

export function Theater({ onRealmSelect, onRealmCardSelect, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className="realm theater" onClick={() => onRealmSelect('THEATER')}>
            Theater
            <div className="creatures-container">
                <RealmCreatures cards={enemyState.people} isPlayerCard={false} />
            </div>
            <div className="slot-container">
                <div className="slot-holder">
                    <div className="place-slot" id="1"></div>
                    <div className="place-slot" id="2"></div>
                    <div className="place-slot" id="3"></div>
                    <div className="place-slot" id="4"></div>
                </div>
            </div>
            <div className="creatures-container">
                <RealmCreatures cards={playerState.people} onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true}/>
            </div>
        </div>
    );
}

// UnderpassRealm.js
export function Underpass({ onRealmSelect, onRealmCardSelect, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className="realm underpass" onClick={() => onRealmSelect('UNDERPASS')}>
            Underpass
            <div className="creatures-container">
                <RealmCreatures cards={enemyState.people} isPlayerCard={false} />
            </div>
            <div className="slot-container">
                <div className="slot-holder">
                    <div className="place-slot" id="5"></div>
                    <div className="place-slot" id="6"></div>
                    <div className="place-slot" id="7"></div>
                </div>
                <div className="slot-holder">
                    <div className="thing-slot" id="8"></div>
                    <div className="thing-slot" id="9"></div>
                    <div className="thing-slot" id="10"></div>
                </div>
            </div>
            <div className="creatures-container">
                <RealmCreatures cards={playerState.people} onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true}/>
            </div>
        </div>
    );
}

// GridRealm.js
export function Grid({ onRealmSelect, onRealmCardSelect, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className="realm grid" onClick={() => onRealmSelect('GRID')}>
            Grid
            <div className="creatures-container">
                <RealmCreatures cards={enemyState.people} isPlayerCard={false} />
            </div>
            <div className="slot-container">
                <div className="slot-holder">
                    <div className="thing-slot" id="12"></div>
                    <div className="thing-slot" id="13"></div>
                    <div className="thing-slot" id="14"></div>
                    <div className="thing-slot" id="15"></div>
                </div>
            </div>
            <div className="creatures-container">
                <RealmCreatures cards={playerState.people} onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true}/>
            </div>
        </div>
    );
}

Solarium.realmName = 'Solarium';
Theater.realmName = 'Theater';
Underpass.realmName = 'Underpass';
Grid.realmName = 'Grid';

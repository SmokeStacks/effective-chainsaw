import RealmCreatures from "../RealmCreatures";
import CardDisplay from "../CardDisplay";
import RealmStuff from "../RealmStuff";

// todo
// SolariumRealm.js
export function Solarium({ onRealmSelect, onRealmCardSelect, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className="realm solarium" onClick={() => onRealmSelect('SOLARIUM')}>
            <div className="realm-name">SOLARIUM</div>
            <div className="cards-container">
                <div className="creatures-container">
                    <RealmCreatures cards={enemyState.people} isPlayerCard={false} />
                </div>
                <div className="slot-holder"></div>
                <div className="creatures-container player-container">
                    <RealmCreatures cards={playerState.people} onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true} />
                </div>
            </div>
        </div>
    );
}

export function Theater({ onRealmSelect, onRealmCardSelect, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className="realm theater" onClick={() => onRealmSelect('THEATER')}>
            <div className="realm-name">TRENCHES</div>
            <div className="cards-container">
                <div className="creatures-container">
                    <RealmCreatures cards={enemyState.people} isPlayerCard={false} />
                </div>
                <div className="places-container">
                    <div className="enemy-places-container">
                        <RealmStuff cards={enemyState.places} isPlayerCard={false} />
                    </div>
                    <div className="player-places-container player-container">
                        <RealmStuff  onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} cards={playerState.places} isPlayerCard={true} />
                    </div>
                </div>
                <div className="creatures-container player-container">
                    <RealmCreatures cards={playerState.people} onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true} />
                </div>
            </div>
        </div>
    );
}

// UnderpassRealm.js
export function Underpass({ onRealmSelect, onServerSelect, onRealmCardSelect, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className="realm underpass" onClick={() => onRealmSelect('UNDERPASS')}>
            <div className="realm-name">IRL</div>
            <div className="cards-container">
                <div className="creatures-container">
                    <RealmCreatures cards={enemyState.people} isPlayerCard={false} />
                </div>
                <div className="things-places-container">
                    <div className="enemy-things-places-container">
                        <RealmStuff cards={enemyState.places} isPlayerCard={false} />
                        <RealmStuff cards={enemyState.things} isPlayerCard={false} />
                    </div>
                    <div className="player-things-places-container player-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} cards={playerState.places} isPlayerCard={true} />
                        <RealmStuff onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} cards={playerState.things} isPlayerCard={true} />
                    </div>
                </div>
                <div className="creatures-container player-container">
                    <RealmCreatures cards={playerState.people} onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true} />
                </div>
            </div>
        </div>
    );
}

// GridRealm.js
export function Grid({ onRealmSelect, onServerSelect, onRealmCardSelect, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className="realm grid" onClick={() => onRealmSelect('GRID')}>
            <div className="realm-name">NEXUS</div>
            <div className="cards-container">
                <div className="creatures-container">
                    <RealmCreatures cards={enemyState.people} isPlayerCard={false} />
                </div>
                <div className="things-container">
                    <div className="enemy-things-container">
                        <RealmStuff cards={enemyState.things} isPlayerCard={false} />
                    </div>
                    <div className="player-things-container player-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} cards={playerState.things} isPlayerCard={true} />
                    </div>
                </div>
                <div className="creatures-container player-container">
                    <RealmCreatures cards={playerState.people} onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true} />
                </div>
            </div>
        </div>
    );
}

export function Elysium({ onRealmSelect, onServerSelect, onRealmCardSelect, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className="realm elysium">
            <div className="realm-name">ELYSIUM</div>
            <div className="cards-container">
                <div className="things-container">
                    <div className="enemy-things-container">
                        <RealmStuff cards={enemyState.things} isPlayerCard={false} />
                    </div>
                    <div className="player-things-container player-container">
                        <RealmStuff cards={playerState.things} isPlayerCard={true} />
                    </div>
                </div>
            </div>
        </div>
    );
}

Solarium.realmName = 'Solarium';
Theater.realmName = 'Theater';
Underpass.realmName = 'Underpass';
Grid.realmName = 'Grid';
Elysium.realmName = 'Elysium';

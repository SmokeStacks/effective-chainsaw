import RealmCreatures from "../RealmCreatures";

import RealmStuff from "../RealmStuff";

// todo
// SolariumRealm.js
export function Solarium({ onRealmSelect, onRealmCardSelect, onAbilityClick, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className="realm solarium" onClick={() => onRealmSelect('solarium')}>
            <div className="realm-name">SOLARIUM</div>
            <div className="cards-container">
                <div className="creatures-container">
                    <RealmCreatures onCardSelect={onRealmCardSelect} cards={enemyState.people} isPlayerCard={false} />
                </div>
                <div className="places-container">
                </div>
                <div className="creatures-container player-container">
                    <RealmCreatures cards={playerState.people} onCardSelect={onRealmCardSelect} onAbilityClick={onAbilityClick} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true} />
                </div>
            </div>
        </div>
    );
}

export function Theater({ onRealmSelect, onRealmCardSelect, onAbilityClick, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className="realm theater" onClick={() => onRealmSelect('theater')}>
            <div className="realm-name">TRENCHES</div>
            <div className="cards-container">
                <div className="creatures-container">
                    <RealmCreatures onCardSelect={onRealmCardSelect} cards={enemyState.people} isPlayerCard={false} />
                </div>
                <div className="places-container">
                    <div className="enemy-places-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} cards={enemyState.places} isPlayerCard={false} />
                    </div>
                    <div className="player-places-container player-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} cards={playerState.places} isPlayerCard={true} />
                    </div>
                </div>
                <div className="creatures-container player-container">
                    <RealmCreatures cards={playerState.people} onCardSelect={onRealmCardSelect} onAbilityClick={onAbilityClick} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true} />
                </div>
            </div>
        </div>
    );
}

// UnderpassRealm.js
export function Underpass({ onRealmSelect, onServerSelect, onRealmCardSelect, onAbilityClick, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className="realm underpass" onClick={() => onRealmSelect('underpass')}>
            <div className="realm-name">
                IRL
                <div className="server" onClick={() => onServerSelect('HEADSPACE')}>HEADSPACE</div>
            </div>
            <div className="cards-container">
                <div className="creatures-container">
                    <RealmCreatures onCardSelect={onRealmCardSelect} cards={enemyState.people} isPlayerCard={false} />
                </div>
                <div className="things-places-container">
                    <div className="enemy-things-places-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} cards={enemyState.places} isPlayerCard={false} />
                        <RealmStuff onCardSelect={onRealmCardSelect} cards={enemyState.things} isPlayerCard={false} />
                    </div>
                    <div className="player-things-places-container player-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} cards={playerState.places} isPlayerCard={true} />
                        <RealmStuff onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} cards={playerState.things} isPlayerCard={true} />
                    </div>
                </div>
                <div className="creatures-container player-container">
                    <RealmCreatures cards={playerState.people} onCardSelect={onRealmCardSelect} onAbilityClick={onAbilityClick} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true} />
                </div>
            </div>
        </div>
    );
}

// GridRealm.js
export function Grid({ onRealmSelect, onServerSelect, onRealmCardSelect, onAbilityClick, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className="realm grid" onClick={() => onRealmSelect('grid')}>
            <div className="realm-name">
                NEXUS
                <div className="server" onClick={() => onServerSelect('PANDORA')}>PANDORA</div>
            </div>
            <div className="cards-container">
                <div className="creatures-container">
                    <RealmCreatures onCardSelect={onRealmCardSelect} cards={enemyState.people} isPlayerCard={false} />
                </div>
                <div className="things-container">
                    <div className="enemy-things-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} cards={enemyState.things} isPlayerCard={false} />
                    </div>
                    <div className="player-things-container player-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} onAbilityClick={onAbilityClick} onRezPlayerCard={onRezPlayerCard} cards={playerState.things} isPlayerCard={true} />
                    </div>
                </div>
                <div className="creatures-container player-container">
                    <RealmCreatures cards={playerState.people} onAbilityClick={onAbilityClick} onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true} />
                </div>
            </div>
        </div>
    );
}

export function Elysium({ onRealmSelect, onServerSelect, onRealmCardSelect, onAbilityClick, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className="realm elysium">
            <div className="realm-name">ELYSIUM</div>
            <div className="cards-container">
                <div className="things-container">
                    <div className="enemy-things-container">
                        <RealmStuff cards={enemyState.things} isPlayerCard={false} />
                    </div>
                    <div className="player-things-container player-container">
                        <RealmStuff cards={playerState.things} onAbilityClick={onAbilityClick} isPlayerCard={true} />
                    </div>
                </div>
            </div>
        </div>
    );
}

Solarium.realmName = 'solarium';
Theater.realmName = 'theater';
Underpass.realmName = 'underpass';
Grid.realmName = 'grid';
Elysium.realmName = 'elysium';

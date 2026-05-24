import RealmCreatures from "../RealmCreatures";
import RealmStuff from "../RealmStuff";

// SolariumRealm.js
export function Solarium({ onRealmSelect, onRealmCardSelect, onAbilityClick, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className="realm solarium" onClick={() => onRealmSelect('solarium')}>
            <div className="realm-name">SOLARIUM</div>
            <div className="cards-container">
                {/* Enemy non-entity cards (top row) */}
                <div className="non-entity-container enemy-non-entity-container">
                    <div className="places-container enemy-places-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} cards={enemyState.places} isPlayerCard={false} />
                    </div>
                    <div className="things-container enemy-things-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} cards={enemyState.things} isPlayerCard={false} />
                    </div>
                </div>
                
                {/* Entities (middle row) */}
                <div className="entities-container">
                    <div className="player-entities-left">
                        <RealmCreatures cards={playerState.people} onCardSelect={onRealmCardSelect} onAbilityClick={onAbilityClick} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true} />
                    </div>
                    <div className="enemy-entities-right">
                        <RealmCreatures onCardSelect={onRealmCardSelect} cards={enemyState.people} isPlayerCard={false} />
                    </div>
                </div>
                
                {/* Player non-entity cards (bottom row) */}
                <div className="non-entity-container player-non-entity-container">
                    <div className="places-container player-places-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} cards={playerState.places} isPlayerCard={true} />
                    </div>
                    <div className="things-container player-things-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} cards={playerState.things} isPlayerCard={true} />
                    </div>
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
                {/* Enemy non-entity cards (top row) */}
                <div className="non-entity-container enemy-non-entity-container">
                    <div className="places-container enemy-places-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} cards={enemyState.places} isPlayerCard={false} />
                    </div>
                    <div className="things-container enemy-things-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} cards={enemyState.things} isPlayerCard={false} />
                    </div>
                </div>
                
                {/* Entities (middle row) */}
                <div className="entities-container">
                    <div className="player-entities-left">
                        <RealmCreatures cards={playerState.people} onCardSelect={onRealmCardSelect} onAbilityClick={onAbilityClick} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true} />
                    </div>
                    <div className="enemy-entities-right">
                        <RealmCreatures onCardSelect={onRealmCardSelect} cards={enemyState.people} isPlayerCard={false} />
                    </div>
                </div>
                
                {/* Player non-entity cards (bottom row) */}
                <div className="non-entity-container player-non-entity-container">
                    <div className="places-container player-places-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} cards={playerState.places} isPlayerCard={true} />
                    </div>
                    <div className="things-container player-things-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} cards={playerState.things} isPlayerCard={true} />
                    </div>
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
                {/* Enemy non-entity cards (top row) */}
                <div className="non-entity-container enemy-non-entity-container">
                    <div className="places-container enemy-places-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} cards={enemyState.places} isPlayerCard={false} />
                    </div>
                    <div className="things-container enemy-things-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} cards={enemyState.things} isPlayerCard={false} />
                    </div>
                </div>
                
                {/* Entities (middle row) */}
                <div className="entities-container">
                    <div className="player-entities-left">
                        <RealmCreatures cards={playerState.people} onCardSelect={onRealmCardSelect} onAbilityClick={onAbilityClick} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true} />
                    </div>
                    <div className="enemy-entities-right">
                        <RealmCreatures onCardSelect={onRealmCardSelect} cards={enemyState.people} isPlayerCard={false} />
                    </div>
                </div>
                
                {/* Player non-entity cards (bottom row) */}
                <div className="non-entity-container player-non-entity-container">
                    <div className="places-container player-places-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} cards={playerState.places} isPlayerCard={true} />
                    </div>
                    <div className="things-container player-things-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} cards={playerState.things} isPlayerCard={true} />
                    </div>
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
                {/* Enemy non-entity cards (top row) */}
                <div className="non-entity-container enemy-non-entity-container">
                    <div className="places-container enemy-places-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} cards={enemyState.places} isPlayerCard={false} />
                    </div>
                    <div className="things-container enemy-things-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} cards={enemyState.things} isPlayerCard={false} />
                    </div>
                </div>
                
                {/* Entities (middle row) */}
                <div className="entities-container">
                    <div className="player-entities-left">
                        <RealmCreatures cards={playerState.people} onAbilityClick={onAbilityClick} onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true} />
                    </div>
                    <div className="enemy-entities-right">
                        <RealmCreatures onCardSelect={onRealmCardSelect} cards={enemyState.people} isPlayerCard={false} />
                    </div>
                </div>
                
                {/* Player non-entity cards (bottom row) */}
                <div className="non-entity-container player-non-entity-container">
                    <div className="places-container player-places-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} cards={playerState.places} isPlayerCard={true} />
                    </div>
                    <div className="things-container player-things-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} cards={playerState.things} isPlayerCard={true} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function Elysium({ onRealmSelect, onServerSelect, onRealmCardSelect, onAbilityClick, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className="realm elysium" onClick={() => onRealmSelect('elysium')}>
            <div className="realm-name">ELYSIUM</div>
            <div className="cards-container">
                {/* Enemy non-entity cards (top row) */}
                <div className="non-entity-container enemy-non-entity-container">
                    <div className="places-container enemy-places-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} cards={enemyState.places} isPlayerCard={false} />
                    </div>
                    <div className="things-container enemy-things-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} cards={enemyState.things} isPlayerCard={false} />
                    </div>
                </div>
                
                {/* Entities (middle row) */}
                <div className="entities-container">
                    <div className="player-entities-left">
                        <RealmCreatures cards={playerState.people} onCardSelect={onRealmCardSelect} onAbilityClick={onAbilityClick} onRezPlayerCard={onRezPlayerCard} isPlayerCard={true} />
                    </div>
                    <div className="enemy-entities-right">
                        <RealmCreatures onCardSelect={onRealmCardSelect} cards={enemyState.people} isPlayerCard={false} />
                    </div>
                </div>
                
                {/* Player non-entity cards (bottom row) */}
                <div className="non-entity-container player-non-entity-container">
                    <div className="places-container player-places-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} cards={playerState.places} isPlayerCard={true} />
                    </div>
                    <div className="things-container player-things-container">
                        <RealmStuff onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} cards={playerState.things} isPlayerCard={true} />
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

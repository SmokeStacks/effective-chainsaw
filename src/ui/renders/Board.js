import RealmCreatures from "../RealmCreatures";
import RealmStuff from "../RealmStuff";

function RealmLayout({ realmClass, label, serverNode, onRealmSelect, onRealmCardSelect, onAbilityClick, onRezPlayerCard, playerState, enemyState }) {
    return (
        <div className={`realm ${realmClass}`} onClick={onRealmSelect}>
            <div className="realm-name" onClick={e => e.stopPropagation()}>
                {label}
                {serverNode}
            </div>
            <div className="realm-board">
                {/* Places & things for both sides */}
                <div className="realm-row realm-row--stuff">
                    <RealmStuff className="stuff-enemy-card" onCardSelect={onRealmCardSelect} cards={enemyState.places} isPlayerCard={false} />
                    <RealmStuff className="stuff-enemy-card" onCardSelect={onRealmCardSelect} cards={enemyState.things} isPlayerCard={false} />
                    <RealmStuff className="stuff-player-card" onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} cards={playerState.places} isPlayerCard={true} />
                    <RealmStuff className="stuff-player-card" onCardSelect={onRealmCardSelect} onRezPlayerCard={onRezPlayerCard} onAbilityClick={onAbilityClick} cards={playerState.things} isPlayerCard={true} />
                </div>
            </div>
        </div>
    );
}

export function Solarium({ onRealmSelect, onRealmCardSelect, onAbilityClick, onRezPlayerCard, playerState, enemyState }) {
    return <RealmLayout realmClass="solarium" label="SOLARIUM" onRealmSelect={onRealmSelect} onRealmCardSelect={onRealmCardSelect} onAbilityClick={onAbilityClick} onRezPlayerCard={onRezPlayerCard} playerState={playerState} enemyState={enemyState} />;
}

export function Theater({ onRealmSelect, onRealmCardSelect, onAbilityClick, onRezPlayerCard, playerState, enemyState }) {
    return <RealmLayout realmClass="theater" label="TRENCHES" onRealmSelect={onRealmSelect} onRealmCardSelect={onRealmCardSelect} onAbilityClick={onAbilityClick} onRezPlayerCard={onRezPlayerCard} playerState={playerState} enemyState={enemyState} />;
}

export function Underpass({ onRealmSelect, onServerSelect, onRealmCardSelect, onAbilityClick, onRezPlayerCard, playerState, enemyState }) {
    const serverNode = <div className="server" onClick={(e) => { e.stopPropagation(); onServerSelect('HEADSPACE'); }}>HEADSPACE</div>;
    return <RealmLayout realmClass="underpass" label="IRL" serverNode={serverNode} onRealmSelect={onRealmSelect} onRealmCardSelect={onRealmCardSelect} onAbilityClick={onAbilityClick} onRezPlayerCard={onRezPlayerCard} playerState={playerState} enemyState={enemyState} />;
}

export function Grid({ onRealmSelect, onServerSelect, onRealmCardSelect, onAbilityClick, onRezPlayerCard, playerState, enemyState }) {
    const serverNode = <div className="server" onClick={(e) => { e.stopPropagation(); onServerSelect('PANDORA'); }}>PANDORA</div>;
    return <RealmLayout realmClass="grid" label="NEXUS" serverNode={serverNode} onRealmSelect={onRealmSelect} onRealmCardSelect={onRealmCardSelect} onAbilityClick={onAbilityClick} onRezPlayerCard={onRezPlayerCard} playerState={playerState} enemyState={enemyState} />;
}

export function Elysium({ onRealmSelect, onServerSelect, onRealmCardSelect, onAbilityClick, onRezPlayerCard, playerState, enemyState }) {
    return <RealmLayout realmClass="elysium" label="ELYSIUM" onRealmSelect={onRealmSelect} onRealmCardSelect={onRealmCardSelect} onAbilityClick={onAbilityClick} onRezPlayerCard={onRezPlayerCard} playerState={playerState} enemyState={enemyState} />;
}

Solarium.realmName = 'solarium';
Theater.realmName = 'theater';
Underpass.realmName = 'underpass';
Grid.realmName = 'grid';
Elysium.realmName = 'elysium';

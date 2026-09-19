// Single source of truth for playing a card from HeadSpace into a Realm.
//
// This logic used to exist twice: once inside BoardContainer (the live copy,
// wired to onRealmSelect) and once in core.js (an exported copy that nothing
// imported and that referenced undeclared identifiers, so it would have thrown
// on its first line). Fixes were applied to whichever copy the author happened
// to open, so the Impostor branch and the Landmark/Location ability activation
// only ever existed in the dead one and never ran in a real game.
//
// Keeping the rules here -- reading `state` and writing through `stateSetters`
// like the rest of the helpers -- means the behaviour is directly testable and
// there is only one place left to change.

import { state, stateSetters } from './state';
import { eventManager } from './eventManager';
import { canPlaceInRealm } from './placement';
import { canPlaceImpostorInRealm } from './impostor';
import { abilitiesDefinitions, activateAbilities } from '../abilities/glossary';
import { rezCostFor } from './activation';
import { payRezCost, calculateSoulsAvailable } from './player';
import {
    resolveRitual,
    confirmRitualActivation,
    removeCardFromHand,
    consumePlayerAction,
    consumeDraftedCard,
    getFriendlyEntities,
} from './core';

/**
 * Normalises a realm name to the capitalised form used by state and placement.
 * @param {string} realmName
 * @returns {string}
 */
function normalizeRealm(realmName) {
    if (typeof realmName !== 'string' || realmName.length === 0) return '';
    return realmName.charAt(0).toUpperCase() + realmName.slice(1).toLowerCase();
}

/**
 * Elysium is intentionally absent: it is reached by ascension, not by playing
 * a card into it.
 */
const PLAYER_REALM_SETTER_NAMES = {
    Solarium: 'setPlayerSolarium',
    Theater: 'setPlayerTheater',
    Underpass: 'setPlayerUnderpass',
    Grid: 'setPlayerGrid',
};

/**
 * notes.txt: Impostor cards may only be placed in Realms where the opponent has
 * an Offline entity to exchange with. Recruiter grants the keyword to Dreamers.
 * @param {Object} cardEntity
 * @returns {boolean}
 */
export function isImpostorCard(cardEntity) {
    const hasOnlineRecruiter = getFriendlyEntities('PLAYER').some(
        (e) => e.card?.name === 'Recruiter' && e.online
    );
    const declaresImpostor = (cardEntity.card?.abilities || []).some(
        (ability) => ability?.name === 'Impostor' || ability === 'Impostor'
    );
    return declaresImpostor || (cardEntity.card?.name === 'Dreamer' && hasOnlineRecruiter);
}

/**
 * Plays `state.selectedCard` into `realmName`.
 *
 * @param {string} realmName - Realm clicked by the player, any capitalisation
 * @returns {{placed: boolean, reason?: string, realm?: string, array?: string}}
 *   `placed` is false for rejections *and* for the two flows that legitimately
 *   do not put a card into a realm here: rituals and Impostor target selection.
 *   The `reason` distinguishes them.
 */
export function playCardToRealm(realmName) {
    const selectedCard = state.selectedCard;
    if (!selectedCard || !selectedCard.card) {
        return { placed: false, reason: 'no-selection' };
    }

    const card = selectedCard.card;

    // notes.txt: "Your Focus each turn determines which Affinity you can use:
    // It sets which cards you may play from your HeadSpace." Only Entities
    // carry affinities; Landmarks, Locations, Syms, Snips and Rituals do not.
    if (card.category === 'ENTITY') {
        const affinities = { magi: !!card.magi, phys: !!card.phys, tech: !!card.tech };
        if (!affinities[state.focus]) {
            return { placed: false, reason: 'focus-mismatch' };
        }
    }

    // Rituals never enter a Realm: they resolve and are discarded.
    if (card.category === 'RITUAL') {
        return playRitual(selectedCard);
    }

    const realm = normalizeRealm(realmName);

    // Impostor resolves by exchanging control of an enemy Offline entity, so it
    // opens a target request instead of placing the card now. selection.js
    // completes the swap once a legal target is clicked.
    if (isImpostorCard(selectedCard)) {
        if (!canPlaceImpostorInRealm(realm, 'PLAYER')) {
            return { placed: false, reason: 'no-impostor-target' };
        }
        stateSetters.setAwaitingImpostor(true);
        stateSetters.setImpostorRealm(realm);
        return { placed: false, reason: 'awaiting-impostor', realm };
    }

    const decision = canPlaceInRealm(card, realm);
    if (!decision.canPlace) {
        return { placed: false, reason: decision.reason };
    }

    const setterName = PLAYER_REALM_SETTER_NAMES[realm];
    if (!setterName) {
        return { placed: false, reason: 'unknown-realm' };
    }

    // glossary.txt: a Location "enters its Realm Online and must therefore have
    // its Activation cost paid immediately like a Ritual." Charge it through
    // payRezCost so keyword discounts such as Rapture apply, and refuse the play
    // up front when it is unaffordable -- the previous code subtracted bits with
    // a flooring helper, so a broke player got Locations for free.
    if (card.category === 'LOCATION') {
        const cost = rezCostFor(card);
        const soulsAvailable = calculateSoulsAvailable(selectedCard.id);
        if (state.playerBits < cost.bits || state.playerAshes < cost.ash || soulsAvailable < cost.soul) {
            return { placed: false, reason: 'insufficient-resources' };
        }
    }

    // Places (Landmarks / Locations) come online immediately; Entities, Syms
    // and Snips enter Offline and pay when later rezzed.
    const placedOnline = decision.array === 'places';
    const placedCard = {
        ...selectedCard,
        realm,
        owner: 'PLAYER',
        readied: false,
        online: placedOnline,
        activated: false,
    };

    stateSetters[setterName]((prevRealm) => ({
        ...prevRealm,
        [decision.array]: [...(prevRealm[decision.array] || []), placedCard],
    }));

    if (card.category === 'LOCATION') {
        payRezCost(card);
    }

    // Anything entering Online is active now, so its abilities fire here rather
    // than waiting for a rez step that will never come for these categories.
    if (placedOnline) {
        activateAbilities(placedCard, 'PLAYER');
        eventManager.publish('entityEntered', {
            side: 'PLAYER',
            entity: placedCard,
            realm,
        });
    }

    // A drafted Dreamer is not in hand, so filtering the hand would not consume
    // it. consumeDraftedCard spends the draft slot and its 1 Bit instead.
    if (state.draftSelected) {
        consumeDraftedCard();
    } else {
        removeCardFromHand(selectedCard);
    }

    stateSetters.setSelectedCard(null);
    stateSetters.setDraftSelected(false);
    stateSetters.setTargetType('none');
    consumePlayerAction();

    return { placed: true, realm, array: decision.array };
}

/**
 * Resolves a Ritual, requesting a target first when it needs one.
 * @param {Object} selectedCard
 * @returns {{placed: boolean, reason: string}}
 */
function playRitual(selectedCard) {
    const targeting = (selectedCard.card.abilities || []).filter(
        (ability) => typeof ability === 'object' && ability.requiresTarget
    );

    if (targeting.length > 0) {
        const ability = targeting[0];
        const abilityDef = abilitiesDefinitions[ability.name];
        if (abilityDef && abilityDef.targetFilter) {
            stateSetters.setPendingRitual({ entity: selectedCard, ability: abilityDef });
            stateSetters.setTargetSelection({
                enabled: true,
                side: 'PLAYER',
                filter: abilityDef.targetFilter,
                // Must be named onSelect: that is the key handleCardSelect looks
                // for. A 'callback' key was never invoked.
                onSelect: (target) => confirmRitualActivation(target),
                onCancel: () => {
                    stateSetters.setPendingRitual(null);
                    stateSetters.setTargetSelection({ enabled: false });
                },
            });
            return { placed: false, reason: 'awaiting-ritual-target' };
        }
    }

    // A Ritual with nothing to target resolves immediately. Six of the eight
    // rituals in the live deck are non-targeting and used to fall out of the
    // placement switch, leaving the card stuck in hand and unplayable.
    resolveRitual(selectedCard, null);
    return { placed: false, reason: 'ritual-resolved' };
}

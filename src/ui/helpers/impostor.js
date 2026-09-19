import { getRealmAndSetter, getOppositeSide, getArrayNameForCategory } from './utils';
import { removeCardFromHand, consumePlayerAction } from './core';
import { eventManager } from './eventManager';

// Impostor (glossary.txt): "This card may only be placed in Realms where your
// opponent has placed one or more offline entities. When placed (before
// activation), choose an enemy offline entity in that realm and exchange
// control of it with the Impostor. Both cards remain offline but can be
// activated by the new owner at any time as normal."
//
// Because both cards stay Offline, nothing is activated here and no rez cost is
// paid -- each side pays when they later rez their newly acquired card, exactly
// as with a normally placed Entity.

/**
 * Is `target` a legal Impostor victim for an Impostor being placed in `realm`?
 * Must be an opposing, Offline Entity sitting in that same Realm.
 *
 * @param {Object} target - The candidate target entity
 * @param {string} realm - The Realm the Impostor is being placed into
 * @param {string} side - The side playing the Impostor ('PLAYER' | 'ENEMY')
 * @returns {boolean}
 */
export function isLegalImpostorTarget(target, realm, side) {
    if (!target?.card) return false;
    if (target.card.category !== 'ENTITY') return false;
    if (target.owner === side) return false;
    if (target.online) return false;
    return target.realm === realm;
}

/**
 * Every legal Impostor target in `realm` for the given side.
 *
 * @param {string} realm - The Realm the Impostor is being placed into
 * @param {string} side - The side playing the Impostor ('PLAYER' | 'ENEMY')
 * @returns {Object[]}
 */
export function legalImpostorTargets(realm, side) {
    const [opponentRealm] = getRealmAndSetter(realm, getOppositeSide(side));
    const people = opponentRealm?.people || [];
    return people.filter((entity) => isLegalImpostorTarget(entity, realm, side));
}

/**
 * Can an Impostor legally be placed into `realm` at all? False when the
 * opponent has no Offline entity there to exchange with.
 *
 * @param {string} realm - The Realm the Impostor would be placed into
 * @param {string} side - The side playing the Impostor ('PLAYER' | 'ENEMY')
 * @returns {boolean}
 */
export function canPlaceImpostorInRealm(realm, side) {
    return legalImpostorTargets(realm, side).length > 0;
}

/**
 * Resolves an Impostor placement: exchanges control of the Impostor and the
 * chosen enemy entity, spends the card from hand, and consumes the action.
 *
 * @param {Object} selectedCard - The Impostor card being played from hand
 * @param {Object} targetCard - The enemy Offline entity to exchange with
 * @param {string} impostorRealm - The Realm the exchange happens in
 * @param {string} side - The side playing the Impostor ('PLAYER' | 'ENEMY')
 * @returns {boolean} True if the exchange resolved
 */
export const handleImpostorPlacement = (selectedCard, targetCard, impostorRealm, side) => {
    if (!selectedCard?.card || !impostorRealm) {
        console.log('Impostor placement aborted: missing card or realm.');
        return false;
    }
    if (!isLegalImpostorTarget(targetCard, impostorRealm, side)) {
        console.log('Impostor placement aborted: illegal target.');
        return false;
    }

    const opponentSide = getOppositeSide(side);
    const [, setOwnRealm] = getRealmAndSetter(impostorRealm, side);
    const [, setOpponentRealm] = getRealmAndSetter(impostorRealm, opponentSide);
    if (!setOwnRealm || !setOpponentRealm) {
        console.log(`Impostor placement aborted: no realm setter for ${impostorRealm}.`);
        return false;
    }

    // Both cards stay Offline, so `online` is forced false rather than carried
    // over -- the exchanged entity must be re-rezzed by its new owner.
    const impostorArray = getArrayNameForCategory(selectedCard.card.category);
    const targetArray = getArrayNameForCategory(targetCard.card.category);
    const impostorToOpponent = {
        ...selectedCard,
        realm: impostorRealm,
        owner: opponentSide,
        online: false,
    };
    const targetToOwner = {
        ...targetCard,
        realm: impostorRealm,
        owner: side,
        online: false,
    };

    // Remove the victim from its owner's realm and hand them the Impostor in
    // the same update, so the two writes cannot interleave with a stale copy.
    setOpponentRealm((prevRealm) => {
        const withoutTarget = (prevRealm[targetArray] || []).filter(
            (entity) => entity.id !== targetCard.id
        );
        const next = { ...prevRealm, [targetArray]: withoutTarget };
        next[impostorArray] = [...(next[impostorArray] || []), impostorToOpponent];
        return next;
    });

    setOwnRealm((prevRealm) => ({
        ...prevRealm,
        [targetArray]: [...(prevRealm[targetArray] || []), targetToOwner],
    }));

    removeCardFromHand(selectedCard);
    consumePlayerAction();

    eventManager.publish('impostorSwap', {
        side,
        realm: impostorRealm,
        impostor: impostorToOpponent,
        acquired: targetToOwner,
    });

    console.log(
        `Impostor: ${selectedCard.card.name} exchanged control with ${targetCard.card.name} in ${impostorRealm}.`
    );
    return true;
};

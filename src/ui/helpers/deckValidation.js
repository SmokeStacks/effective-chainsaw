// Deck-construction validation.
//
// Per notes.txt:
//   "Include at least 20 Runes worth of Landmarks and/or Syms (modified by
//    Cursed and Karmic cards)."
//
// Per glossary.txt:
//   Karmic: "For every 2 cards with Karmic, increase the total effective Rune
//            score of your deck by 1."
//   Cursed: "Every 2 Cursed cards in your deck decreases the effective total
//            Rune score by 1."
//
// Note both keywords are counted per *pair* of cards, so an odd card out
// contributes nothing. They adjust the deck's effective Rune score rather than
// the requirement itself; the two framings are equivalent, and this follows the
// glossary's wording so the numbers line up with the printed rules.

// Only Landmarks and Syms contribute Runes toward the deck requirement, even
// though other categories may carry a Runes value for scoring purposes.
export const RUNE_BEARING_CATEGORIES = ['LANDMARK', 'SYM'];

export const RUNE_REQUIREMENT = 20;

// Deck lists hold raw card definitions, while a built library holds card
// instances that wrap the definition in `.card`. Accept either.
const toCard = (entry) => (entry && entry.card) ? entry.card : entry;

/**
 * Counts cards carrying a keyword, honoring both authoring conventions:
 * a bare numeric/boolean field (`karmic: 1`) or an abilities entry
 * (`{ name: 'Karmic' }`).
 *
 * @param {Array} deck - card definitions or card instances
 * @param {string} field - lowercase card field name, e.g. 'karmic'
 * @param {string} abilityName - capitalized ability name, e.g. 'Karmic'
 * @returns {number} number of cards carrying the keyword
 */
export function countCardsWithKeyword(deck, field, abilityName) {
    return (deck || []).reduce((count, entry) => {
        const card = toCard(entry);
        if (!card) return count;
        const hasField = !!card[field];
        const hasAbility = (card.abilities || []).some(a => a && a.name === abilityName);
        return count + ((hasField || hasAbility) ? 1 : 0);
    }, 0);
}

/**
 * Sums the printed Rune values of the deck's Landmarks and Syms.
 *
 * @param {Array} deck - card definitions or card instances
 * @returns {number}
 */
export function baseRuneScore(deck) {
    return (deck || []).reduce((sum, entry) => {
        const card = toCard(entry);
        if (!card) return sum;
        if (!RUNE_BEARING_CATEGORIES.includes(card.category)) return sum;
        return sum + (card.runes || 0);
    }, 0);
}

/**
 * Resolves the deck's effective Rune score and whether it meets the
 * construction requirement.
 *
 * @param {Array} deck - card definitions or card instances
 * @returns {{base: number, karmicCards: number, cursedCards: number,
 *            karmicBonus: number, cursedPenalty: number, effective: number,
 *            required: number, valid: boolean, shortfall: number}}
 */
export function evaluateDeckRunes(deck) {
    const base = baseRuneScore(deck);

    const karmicCards = countCardsWithKeyword(deck, 'karmic', 'Karmic');
    const cursedCards = countCardsWithKeyword(deck, 'cursed', 'Cursed');

    const karmicBonus = Math.floor(karmicCards / 2);
    const cursedPenalty = Math.floor(cursedCards / 2);

    // A deck's effective score can be dragged below zero by Cursed only in
    // theory; clamp so callers never see a negative total.
    const effective = Math.max(0, base + karmicBonus - cursedPenalty);

    return {
        base,
        karmicCards,
        cursedCards,
        karmicBonus,
        cursedPenalty,
        effective,
        required: RUNE_REQUIREMENT,
        valid: effective >= RUNE_REQUIREMENT,
        shortfall: Math.max(0, RUNE_REQUIREMENT - effective),
    };
}

/**
 * Logs a readable summary of a deck's Rune legality. Called during setup so an
 * illegal deck is visible rather than silently playable.
 *
 * @param {Array} deck - card definitions or card instances
 * @param {string} label - deck name for the log line
 * @returns {Object} the evaluation result
 */
export function reportDeckRunes(deck, label = 'Deck') {
    const result = evaluateDeckRunes(deck);

    const adjustments = [];
    if (result.karmicCards > 0) {
        adjustments.push(`Karmic ${result.karmicCards} card(s) => +${result.karmicBonus}`);
    }
    if (result.cursedCards > 0) {
        adjustments.push(`Cursed ${result.cursedCards} card(s) => -${result.cursedPenalty}`);
    }
    const detail = adjustments.length ? ` (${adjustments.join(', ')})` : '';

    if (result.valid) {
        console.log(
            `${label} Rune score: ${result.effective}/${result.required}${detail} — legal.`
        );
    } else {
        console.warn(
            `${label} Rune score: ${result.effective}/${result.required}${detail} — ` +
            `illegal, ${result.shortfall} Rune(s) short of the requirement.`
        );
    }

    return result;
}

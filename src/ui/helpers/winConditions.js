// Win / loss condition evaluation.
//
// Thresholds come from notes.txt: every condition triggers at 8, not 10.
// Kept as a pure function so the precedence rules are unit-testable and so the
// UI layer only has to decide *when* to check, not *what* the rules are.

export const WIN_THRESHOLD = 8;

export const WIN_REASONS = {
    DIVINITY: `Ascended to Divinity (${WIN_THRESHOLD} Fate)`,
    CORPOREAL: `Destroyed their Corporeal Form (${WIN_THRESHOLD} Burden + Wounds)`,
    MELTDOWN: `System Meltdown (${WIN_THRESHOLD} Overload)`,
    DECKED_OUT: 'Opponent drew from an empty Pandora',
};

// Deck-out is not in notes.txt; it is the standard TCG rule, chosen so that an
// exhausted Pandora ends the game instead of leaving both sides drawing nothing
// forever. It is not a Devotion-eligible condition: a Devotion lowers a numeric
// threshold, and this has none.
export const DECKED_OUT = 'DECKED_OUT';

// Devotion (notes.txt): "At the start of the game, you may secretly choose a
// Devotion that lowers one of these thresholds by 1. Devotion is only revealed
// when the game ends."
//
// A Devotion lowers the bar for one of *your own* win conditions, so it never
// makes you easier to defeat -- picking CORPOREAL means you need 1 less Burden
// + Wounds on your opponent, not that you die 1 sooner. Only the player may
// take a Devotion; the enemy always plays to the full threshold.
export const DEVOTIONS = {
    DIVINITY: 'DIVINITY',
    CORPOREAL: 'CORPOREAL',
    MELTDOWN: 'MELTDOWN',
};

export const DEVOTION_LABELS = {
    [DEVOTIONS.DIVINITY]: 'Divinity',
    [DEVOTIONS.CORPOREAL]: 'Corporeal Form',
    [DEVOTIONS.MELTDOWN]: 'System Meltdown',
};

export const DEVOTION_DESCRIPTIONS = {
    [DEVOTIONS.DIVINITY]: `Ascend to Divinity with ${WIN_THRESHOLD - 1} Fate instead of ${WIN_THRESHOLD}.`,
    [DEVOTIONS.CORPOREAL]: `Destroy their Corporeal Form with ${WIN_THRESHOLD - 1} Burden + Wounds instead of ${WIN_THRESHOLD}.`,
    [DEVOTIONS.MELTDOWN]: `Trigger a System Meltdown with ${WIN_THRESHOLD - 1} Overload instead of ${WIN_THRESHOLD}.`,
};

/**
 * The threshold the player must reach for a given win condition, accounting for
 * their Devotion. Returns the full threshold for any other condition, for no
 * Devotion, and for an unrecognised value.
 *
 * @param {string} condition - A key of DEVOTIONS
 * @param {string|null} devotion - The player's chosen Devotion, if any
 * @returns {number}
 */
export function thresholdFor(condition, devotion = null) {
    return devotion && devotion === condition && DEVOTIONS[devotion]
        ? WIN_THRESHOLD - 1
        : WIN_THRESHOLD;
}

/**
 * Human-readable win reason, noting the Devotion when it was the thing that
 * lowered the bar. Devotion stays hidden until the game ends, and this is only
 * ever called at that point.
 *
 * @param {string} condition - A key of DEVOTIONS
 * @param {string|null} devotion - The player's chosen Devotion, if any
 * @returns {string}
 */
function reasonFor(condition, devotion) {
    const base = WIN_REASONS[condition];
    if (!devotion || devotion !== condition) return base;
    return `${base.replace(String(WIN_THRESHOLD), String(WIN_THRESHOLD - 1))} — Devotion to ${DEVOTION_LABELS[condition]}`;
}

/**
 * Evaluate the game-ending conditions against a resource snapshot.
 *
 * Precedence: reaching divinity is checked before the two defeat conditions, so
 * if a side hits 8 Fate on the same update that it would otherwise lose, the
 * win takes priority. Within each condition the acting side is checked first.
 *
 * `playerDevotion` lowers the threshold on the matching *player* win check by
 * 1. The enemy's checks are untouched, so a Devotion can only ever help.
 *
 * Deck-out is checked last so that a side reaching a win threshold on the same
 * update that it decks out still wins, matching the precedence note above.
 *
 * @returns {{winner: 'PLAYER'|'ENEMY', reason: string}|null} null while the
 *          game is still in progress.
 */
export function evaluateWinConditions({
    playerFate = 0,
    enemyFate = 0,
    playerBurden = 0,
    playerWounds = 0,
    enemyBurden = 0,
    enemyWounds = 0,
    playerOverload = 0,
    enemyOverload = 0,
    playerDevotion = null,
    playerDeckedOut = false,
    enemyDeckedOut = false,
} = {}) {
    const playerCorporeal = playerBurden + playerWounds;
    const enemyCorporeal = enemyBurden + enemyWounds;

    const devotion = DEVOTIONS[playerDevotion] ? playerDevotion : null;
    const playerWin = (condition) => ({
        winner: 'PLAYER',
        reason: reasonFor(condition, devotion),
    });
    const enemyWin = (condition) => ({
        winner: 'ENEMY',
        reason: WIN_REASONS[condition],
    });

    if (playerFate >= thresholdFor(DEVOTIONS.DIVINITY, devotion)) return playerWin(DEVOTIONS.DIVINITY);
    if (enemyFate >= WIN_THRESHOLD) return enemyWin(DEVOTIONS.DIVINITY);
    if (enemyCorporeal >= thresholdFor(DEVOTIONS.CORPOREAL, devotion)) return playerWin(DEVOTIONS.CORPOREAL);
    if (playerCorporeal >= WIN_THRESHOLD) return enemyWin(DEVOTIONS.CORPOREAL);
    if (enemyOverload >= thresholdFor(DEVOTIONS.MELTDOWN, devotion)) return playerWin(DEVOTIONS.MELTDOWN);
    if (playerOverload >= WIN_THRESHOLD) return enemyWin(DEVOTIONS.MELTDOWN);

    // The side that could not draw is the side that loses.
    if (enemyDeckedOut) return playerWin(DECKED_OUT);
    if (playerDeckedOut) return enemyWin(DECKED_OUT);

    return null;
}

// Tests for which zones the realm layout renders.
//
// RealmLayout deliberately renders only enemy entities plus places and things
// for both sides. The player's own entities are NOT shown here -- they live in
// the bottom panel behind Gameboard's [ ENTITIES ] toggle. Adding a player
// entity row to the realm renders every played card twice, once squashed in the
// realm and once full size in the panel, so these tests pin that down.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Solarium } from '../Board';

const entity = (name, over = {}) => ({
    id: name,
    owner: 'PLAYER',
    online: false,
    steps: 0,
    wounds: 0,
    freeze: 0,
    card: {
        name,
        category: 'ENTITY',
        faction: 'orange-border',
        rezCost: 4,
        power: 5,
        HP: 3,
        timer: 3,
        abilities: [],
        description: '',
        magi: false,
        phys: false,
        tech: true,
    },
    ...over,
});

const place = (name) => ({
    id: name,
    owner: 'PLAYER',
    online: true,
    steps: 0,
    wounds: 0,
    freeze: 0,
    card: {
        name,
        category: 'LANDMARK',
        faction: 'orange-border',
        rezCost: 0,
        abilities: [],
        description: '',
    },
});

const emptyRealm = () => ({ people: [], places: [], things: [] });

const renderRealm = (playerState, enemyState = emptyRealm()) =>
    render(
        <Solarium
            playerState={playerState}
            enemyState={enemyState}
            onRealmSelect={() => {}}
            onRealmCardSelect={() => {}}
            onAbilityClick={() => {}}
            onRezPlayerCard={() => {}}
            onServerSelect={() => {}}
        />
    );

describe('RealmLayout — player entities belong to the bottom panel', () => {
    test('does not render the player\'s own entities', () => {
        renderRealm({ ...emptyRealm(), people: [entity('Freight Train')] });

        expect(screen.queryByText('Freight Train')).toBeNull();
    });

    test('does not render player entities even alongside places', () => {
        renderRealm({
            ...emptyRealm(),
            people: [entity('Freight Train')],
            places: [place('Wasteland')],
        });

        expect(screen.queryByText('Freight Train')).toBeNull();
        expect(screen.getByText('Wasteland')).toBeTruthy();
    });
});

describe('RealmLayout — the other zones still render', () => {
    test('enemy entities render face down as Unknown', () => {
        renderRealm(emptyRealm(), {
            ...emptyRealm(),
            people: [entity('Hidden Thing', { owner: 'ENEMY' })],
        });

        expect(screen.getByText('Unknown')).toBeTruthy();
        expect(screen.queryByText('Hidden Thing')).toBeNull();
    });

    test('player places render', () => {
        renderRealm({ ...emptyRealm(), places: [place('Wasteland')] });

        expect(screen.getByText('Wasteland')).toBeTruthy();
    });

    test('an empty realm renders no cards and does not error', () => {
        renderRealm(emptyRealm());

        expect(screen.queryAllByRole('img')).toHaveLength(0);
    });

    test('enemy entities render while the player\'s stay hidden', () => {
        renderRealm(
            { ...emptyRealm(), people: [entity('Freight Train')] },
            { ...emptyRealm(), people: [entity('Hidden Thing', { owner: 'ENEMY' })] }
        );

        expect(screen.getByText('Unknown')).toBeTruthy();
        expect(screen.queryByText('Freight Train')).toBeNull();
    });
});

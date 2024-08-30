import { Card, Category, CostType, EffectType, SkillType, Trigger } from './cards';

const cards: Card[] = [
    {
        id: 0,
        name: 'Hell Hound',
        category: 'CREATURE',
        rezCost: 2,
        magi: false,
        phys: true,
        tech: false,
        WIS: 0,
        STR: 1,
        DEX: 0,
        HP: 3,
        timer: 2,
        text: '',
        flavor: '',
    },
    {
        id: 1,
        name: 'Double Time',
        category: 'RITUAL',
        rezCost: 2,
        magi: true,
        phys: false,
        tech: false,
        effect1: {
            type: 'RUNE',
            amount: 1,
            side: 'FRIEND',
            motive: 'AVATAR',
            dynamic: false
        },
        effect2: {
            type: 'ACTION',
            amount: 2,
            side: 'FRIEND',
            motive: 'AVATAR',
            dynamic: false
        },
        text: 'Gain two actions',
        flavor: '',
    },
    {
        id: 2,
        name: 'Black Fog',
        category: 'LOCATION',
        rezCost: 3,
        magi: true,
        phys: false,
        tech: true,
        HP: 4,
        skill: {
            triggered: true,
            trigger: 'ATTACKED',
            permanent: false,
            type: 'EFFECT',
            effect1: {
                type: 'BURDEN',
                amount: 1,
                side: 'FOE',
                motive: 'AVATAR',
                dynamic: false
            }
        },
        text: 'When you are attacked, opponent gains 1 Burden',
        flavor: '',
    },
    {
        id: 3,
        name: 'Hackathon',
        category: 'LANDMARK',
        bones: 1,
        promoCost: 3,
        magi: true,
        phys: true,
        tech: true,
        HP: 2,
        skill: {
            triggered: true,
            trigger: 'BOOST_SELF',
            permanent: false,
            type: 'EFFECT',
            effect1: {
                type: 'FUMBLE',
                amount: 1,
                side: 'FOE',
                motive: 'AVATAR',
                dynamic: false
            }
        },
        text: 'When you Boost this, opponent Fumbles 1',
        flavor: '',
    },
    {
        id: 4,
        name: 'Brain Rot',
        category: 'SNIP',
        magi: false,
        phys: false,
        tech: true,
        scrap: 0,
        skill: {
            triggered: true,
            trigger: 'ACCESS',
            permanent: false,
            type: 'EFFECT',
            effect1: {
                type: 'WOUND',
                side: 'FOE',
                motive: 'AVATAR',
                dynamic: true,
                variable: {
                    selfTarget: true,
                    variableType: 'BOOSTS'
                }
            }
        },
        text: 'When you Boost this, opponent Fumbles 1',
        flavor: '',
    },
    {
        id: 5,
        name: 'Night Terrors',
        category: 'SYM',
        bones: 1,
        memory: 2,
        magi: true,
        phys: true,
        tech: true,
        skill: {
            triggered: true,
            trigger: 'SCORE_SELF',
            permanent: false,
            type: 'EFFECT',
            effect1: {
                type: 'DISCARD',
                amount: 3,
                side: 'FOE',
                motive: 'AVATAR',
                dynamic: false
            }
        },
        cleanup: {
            condition: 'SCORED',
            type: 'DRAW',
            amount: 2,
            side: 'FOE',
            motive: 'AVATAR',
            dynamic: false
        },
        text: 'When you Boost this, opponent Fumbles 1',
        flavor: '',
    },
    {
        id: 6,
        name: 'A Gun',
        category: 'CREATURE',
        rezCost: 4,
        keywords: ['POUNCE'],
        magi: false,
        phys: true,
        tech: false,
        WIS: 0,
        STR: 4,
        DEX: 0,
        HP: 2,
        timer: 2,
        text: '',
        flavor: '',
    },
];

// Export the array of cards
export const cardList: Card[] = cards;
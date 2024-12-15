export type Permanents = 'ENTITY' | 'LOCATION' | 'LANDMARK' | 'SNIP' | 'SYM';

export type Category = Permanents | 'RITUAL';

export type Motive = Permanents | 'AVATAR';

export type DamageType = 'DAMAGE';

export type TransactionType = 'RUNE' | 'BURDEN' | 'BITS' | 'DEBT' | 'DRAW' | 'WOUND' | 'DISCARD' | 'FUMBLE' | 'INSIGHT' | 'ACTION' | 'DESTROY';

export type EffectType = TransactionType | DamageType;

export type VariableType = 'BOOSTS';

export type ConditionType = 'SCORED' | 'SELF_ATTACK' | 'PLAYER_ATK';

type Variable = {
  avatar?: 'FRIENDLY' | 'FOE';
  selfTarget: boolean;
  target?: number;
  variableType: VariableType;
};

type Effect = {
  actions?: number;
  condition?: ConditionType;
  type: EffectType;
  amount?: number;
  side: Side;
  motive: Motive[];
  dynamic: boolean;
  variable?: Variable;
};

export type Side = 'FRIEND' | 'FOE' | 'FREE4ALL';

export type Stats = 'WIS' | 'STR' | 'DEX' | 'HP' | 'TIMER';

export type SkillType = Stats | 'EFFECT';

export type Trigger = 'ATK' | 'ATK_SUCCESS' | 'ATTACKED' | 'DEF' | 'DEF_SUCCESS' | 'QUEST' | 'QUEST_SUCCESS' | 'RAID' | 'RAID_SUCCESS' | 'HACK' | 'HACK_SUCCESS' | 'DOMINATE' | 'DIE' | 'SCORE_SELF' | 'BOOST_SELF' | 'ACCESS' | 'STOLEN_SELF';

type Skill = {
  triggered: boolean;
  trigger: Trigger;
  permanent: boolean;
  type: SkillType;
  effect1?: Effect;
  effect2?: Effect;
  amount?: number;
};

export type Keyword = 'POUNCE' | 'OVERRIDE' | 'DEVOUR' | 'STREAMING' | 'HASTE' | 'CHARGE' | 'STING' | 'HYPNO' | 'SPRINT' | 'JAW' 
| 'JAWBREAKER' | 'AGGRESSIVE' | 'DEFENSIVE' | 'TASTY' | 'LOOP' | 'ASCENDED' | 'BARRICADE' | 'VENOM' | 'INSPIRE' | 'SLIMY' | 'HARVEST' 
| 'STREAMING' | 'CONTAMINATED' | 'BONY' | 'STEALTH' | 'SCAVENGER' | 'PIRACY' | 'DEBTTOUCH' | 'GENESIS' | 'HUSK' | 'POSTMORTEM';

export type Subtype = 'JAWbreaker' | 'JAW';

export type Card = {
  faction: string,
  id: number;
  name: string;
  category: Category;
  subTypes?: Subtype[];
  rezCost?: number;
  soul?: number;
  ash?: number;
  runes?: number;
  plot?: number;
  development?: number;
  schemeThreshold?: number;
  keywords?: String;
  description?: string;
  scheming?: boolean;
  magi: Boolean;
  phys: Boolean;
  tech: Boolean
  power?: number;
  HP?: number;
  timer?: number;
  scrap?: number;
  abilities?: object[];
  trap?: boolean;
  soulless?: boolean;
  locality?: boolean;
  aggressive?: boolean;
  defensive?: boolean;
  deathless?: number;
  pounce?: number;
  override?: number;
  stealth?: number;
  armored?: number;
  solo?: number;
};

export class CardEntity {
  id: string;
  card: Card;
  wounds: number;
  steps: number;
  online: boolean;
  readied: boolean;
  exposed: boolean;
  scored: boolean;
  realm: RealmName;

  constructor(id: string, card: Card) {
    this.id = id;
    this.card = card;
    this.wounds = 0;
    this.steps = 0;
    this.online = false;
    this.readied = false;
    this.exposed = false;
    this.scored = false;
  }
}

export type Library = {
  cards: [CardEntity]
};

export type Hand = {
  cards: [CardEntity]
};

export type Graveyard = {
  cards: [CardEntity]
};

export type Focus = 'MIND' | 'BODY' | 'SOUL'; // can only cast and attack with cards that share aspect with current Focus (Tech, Phys, Magi)

export type PlayerBoard = {
  graveyard: Graveyard;
  hand: Hand;
  library: Library;
  solarium: Realm; // Magi, 0 Landmarks, 1 Neutral LM
  theater: Realm; // Magi, Phys, 4 Landmarks, 0 Server, 1 Neutral LM/SYM
  underpass: Realm; // Tech, Phys, 3 Landmarks, 4 Servers, 1 Neutral LM/SYM
  grid: Realm; // Tech, 0 Landmarks, 5 Servers, 1 Neutral SYM
  focus: Focus;
  wins: number; // 2 to win Game
  runes: number;
  wishes: number; // 2 to win Round
  burden: number; // negate the next Rune earned for each
  wounds: number; // reduce max hand by 1 for each
  bits: number; // pay costs
  debt: number; // negate the next Bit earned for each
  actions: number;
  insight: number; // temp points added to Domination score
  dominated: boolean; // won Domination last round
};

export type CardType = 'INSTALL' | 'RITUAL';

export type Aspect = 'MAGI' | 'PHYS' | 'TECH';

export class Realm {
  name: RealmName;
  aspects: Aspect[];
  people: CardEntity[] = [];
  places: CardEntity[] = [];
  things: CardEntity[] = [];
  constructor(name: RealmName, aspects: Aspect[]) {
      this.name = name;
      this.aspects = aspects;
  }
}


// Define a class for shared slots (Landmarks, Locations, ISO Servers)
export class SharedSlot {
  max: number;
  current: number;
  type: 'PLACE' | 'THING';

  constructor(maxSlots: number, typeSpec: 'PLACE' | 'THING') {
      this.max = maxSlots;
      this.current = 0;
      this.type = typeSpec;
  }
}

export type RealmName = 'SOLARIUM' | 'THEATER' | 'UNDERPASS' | 'GRID';

export type Roadmap = { // indication of where a card should be played
  realmName: RealmName;
  category: Category;
};

export type EventTemplate = { // used when playing cards or perforimg some kind of effect
  name: string;
  slow: boolean; // ends control
  cardEntity?: CardEntity;
  cardType?: CardType;
  effect?: Effect;  
  roadmap?: Roadmap;
  target?: number; // id of card being targeted
  discard: boolean; // discard card after completion
};
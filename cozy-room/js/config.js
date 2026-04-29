// ─── config.js ───────────────────────────────────────────
// Global constants, palette, activity defs, dialogue lines

window.CFG = {
  // canvas (chunky pixel-art resolution)
  W: 320,
  H: 180,

  // isometric tile system
  TILE_W: 32,
  TILE_H: 16,
  WALL_H_TILES: 4,
  ROOM_W: 7,
  ROOM_D: 5,
  ISO_OX: 144,
  ISO_OY: 72,

  // game time: 1 real second = TIME_SCALE in-game seconds
  // default: 1 real minute = 1 in-game hour, so 24min = 1 day
  TIME_SCALE: 60,

  // stat decay (per in-game hour)
  DECAY: {
    hunger:     -4.0,
    energy:     -1.5,
    happiness:  -0.8,
    health:     -0.2,
    cleanliness:-2.5,
    stress:     +0.6,
    loneliness: +1.2,
    inspiration:-1.0,
  },

  // mood thresholds
  MOOD_LOW: 30,
  MOOD_HI:  70,

  // offline cap (real hours)
  OFFLINE_CAP_HOURS: 10,

  // bond progression — hours between organic +1
  BOND_TICK_HOURS: 4,

  // tile-coord positions inside the iso room
  // tx ∈ [0, ROOM_W], ty ∈ [0, ROOM_D]; faceTx/Ty is where the character STANDS
  POS: {
    bed:       { tx: 0.7, ty: 3.0, faceTx: 1.6, faceTy: 3.4 },
    desk:      { tx: 3.2, ty: 0.4, faceTx: 3.5, faceTy: 1.4 },
    chair:     { tx: 3.5, ty: 1.2, faceTx: 3.5, faceTy: 1.2 },
    bookshelf: { tx: 0.5, ty: 0.3, faceTx: 1.0, faceTy: 1.2 },
    plant:     { tx: 6.0, ty: 4.1, faceTx: 5.4, faceTy: 4.0 },
    window:    { tx: 4.7, ty: 0.4, faceTx: 4.8, faceTy: 1.2 },
    kitchen:   { tx: 6.0, ty: 0.4, faceTx: 5.7, faceTy: 1.2 },
    rugMid:    { tx: 3.5, ty: 2.7 },
    door:      { tx: 0.3, ty: 4.4, faceTx: 1.0, faceTy: 4.4 },
    sofa:      { tx: 3.0, ty: 4.4, faceTx: 3.0, faceTy: 4.0 },
    table:     { tx: 3.2, ty: 3.6 },
  },

  // pixel palette — punched-up colors with strong dark outlines
  PAL: {
    cream:   '#f5e6d3',
    creamSoft:'#fff5e0',
    ivory:   '#fffaf0',
    paper:   '#f0dec3',
    peach:   '#ffc89a',
    rose:    '#f4a8b0',
    roseDeep:'#d56a78',
    sage:    '#a8c294',
    sageDeep:'#5e7a58',
    amber:   '#f0bc5e',
    amberDeep:'#b8783a',
    lavender:'#c4b5c7',
    night:   '#1a1622',
    nightBlue:'#2a3a52',
    warmGray:'#7a6a5a',
    shadow:  '#3a2820',          // mid outline / shading
    ink:     '#1f1410',          // primary outline (near-black brown)
    inkSoft: '#4a3526',

    // skin/hair (character) — vivid rose hair, peachy skin
    skin:    '#fcd5b0',
    skinShadow:'#d89878',
    hair:    '#ec8aa0',
    hairLight:'#f8c0d0',
    hairAccent:'#fff1de',
    cloth:   '#fff5e0',          // bright cream sweater
    clothShadow:'#e8a8b0',       // pink shadow
    pants:   '#3a4866',          // navy denim
    pantsShadow:'#1f2a44',
    shoe:    '#1f1410',
    cheek:   '#ec8a90',

    // wood / wall tones (warmer, brighter)
    wallBg:   '#f4d699',          // sunny cream-yellow back wall
    wallBg2:  '#e2c184',          // shadow-side wall (darker)
    wallTrim: '#fff5e0',          // bright wood-paneling
    floor:    '#d49b5a',          // warm orange wood
    floor2:   '#b27238',          // shadow plank row
    floorBoard:'#3a1f10',         // deep dark plank seams

    // outfit (olive pinafore + cream sweater + yellow bow)
    olive:        '#6e8a4a',
    oliveShadow:  '#4a6230',
    oliveLight:   '#88a560',
    bow:          '#f0c850',
    bowShadow:    '#b88a28',
    daisyYellow:  '#f0bc5e',

    // accents
    blanket:  '#f0a0a8',
    blanket2: '#c66070',
    pillow:   '#fff5e0',
    deskWood: '#a87144',
    deskWood2:'#5a3a1a',
    bookA:    '#5a78a0',
    bookB:    '#d56a78',
    bookC:    '#7da078',
    bookD:    '#e8a850',
    rugA:     '#d56a78',
    rugB:     '#f4a8b0',
    plantPot: '#c0894a',
    plantLeaf:'#6e8a6c',
    plantLeaf2:'#8aae7a',
    lampGlow: 'rgba(232,184,111,0.55)',
    sky:      '#9bc4cf',
    skyDay:   '#cfe5ed',
    skySunset:'#f4b18a',
    skyNight: '#3d4f66',
    cloud:    '#fff8ec',
    moon:     '#fff8ec',
    star:     '#fff1de',
  },

  // stats UI definitions
  STAT_DEFS: [
    { key:'hunger',      label:'fed',         color:'var(--hunger)',     invert:false },
    { key:'energy',      label:'rested',      color:'var(--energy)',     invert:false },
    { key:'happiness',   label:'happy',       color:'var(--happiness)',  invert:false },
    { key:'health',      label:'health',      color:'var(--health)',     invert:false },
    { key:'cleanliness', label:'clean',       color:'var(--clean)',      invert:false },
    { key:'stress',      label:'calm',        color:'var(--stress)',     invert:true  },
    { key:'loneliness',  label:'connected',   color:'var(--lonely)',     invert:true  },
    { key:'inspiration', label:'inspired',    color:'var(--inspire)',    invert:false },
  ],

  // bond tiers (label + threshold)
  BOND_TIERS: [
    { t: 0,   label: 'a stranger' },
    { t: 15,  label: 'familiar' },
    { t: 35,  label: 'a friend' },
    { t: 60,  label: 'someone close' },
    { t: 85,  label: 'a quiet refuge' },
  ],

  // weather odds per hour roll
  WEATHER_ODDS: {
    spring: { clear: .45, cloudy: .25, rain: .25, wind: .05 },
    summer: { clear: .55, cloudy: .20, rain: .20, wind: .05 },
    autumn: { clear: .35, cloudy: .35, rain: .20, wind: .10 },
    winter: { clear: .30, cloudy: .25, snow: .35, wind: .10 },
  },

  SEASONS: ['spring', 'summer', 'autumn', 'winter'],
  DAYS_PER_SEASON: 7,
  DAYNAMES: ['sun','mon','tue','wed','thu','fri','sat'],

  WEATHER_ICONS: {
    clear:  '☀',
    cloudy: '☁',
    rain:   '☂',
    snow:   '❄',
    wind:   '〜',
  },
  WEATHER_NAMES: {
    clear: 'soft sun',
    cloudy: 'cloudy',
    rain: 'gentle rain',
    snow: 'snow falling',
    wind: 'breeze',
  },

  // selectable character variants — same outfit, different hair/skin
  CHAR_VARIANTS: [
    {
      id: 'pink',
      name: 'Lin',
      tagline: 'soft and dreamy',
      hair:      '#ec8aa0',
      hairLight: '#f8c0d0',
      skin:      '#fcd5b0',
      skinShadow:'#d89878',
    },
    {
      id: 'brown',
      name: 'Mira',
      tagline: 'warm and quiet',
      hair:      '#7a4a2c',
      hairLight: '#a06a40',
      skin:      '#f3d5b5',
      skinShadow:'#cf9c7a',
    },
  ],
};

// activity definitions (id -> def)
window.ACTIVITIES = {
  check: {
    label: 'check in',
    duration: 4,         // in-game seconds
    target: null,
    pose: 'idle',
    effects: { loneliness: -8, stress: -3, happiness: +3 },
    bond: +1,
    line: ['thanks for checking on me.', 'oh — you\'re here.', 'i\'m glad you came by.'],
  },
  eat: {
    label: 'eat',
    duration: 30,
    target: 'kitchen',
    pose: 'eat',
    requires: { money: 4 },
    cost: { money: 4 },
    effects: { hunger: +45, happiness: +6, energy: +6 },
    line: ['this tastes nice.', 'thank you for the meal.', 'i needed this.'],
  },
  sleep: {
    label: 'rest',
    duration: 90,
    target: 'bed',
    pose: 'sleep',
    effects: { energy: +60, health: +6, stress: -10, hunger: -8 },
    line: ['just a little nap...', 'mmm... thank you.', 'the pillow smells like sunlight.'],
  },
  bathe: {
    label: 'bathe',
    duration: 25,
    target: 'door',
    pose: 'idle',
    effects: { cleanliness: +55, stress: -8, happiness: +4 },
    line: ['warm water helps everything.', 'i feel like myself again.'],
  },
  work: {
    label: 'small job',
    duration: 60,
    target: 'desk',
    pose: 'work',
    effects: { energy: -20, stress: +12, happiness: -2 },
    rewards: { money: 22, inspiration: -3 },
    line: ['i\'ll just finish this part.', 'okay. focus.', 'a little progress is okay.'],
  },
  read: {
    label: 'read',
    duration: 40,
    target: 'bookshelf',
    pose: 'read',
    effects: { stress: -8, inspiration: +12, happiness: +4, loneliness: -3 },
    line: ['this story is gentle.', 'i underlined a sentence today.'],
  },
  paint: {
    label: 'paint',
    duration: 50,
    target: 'desk',
    pose: 'paint',
    effects: { inspiration: +18, happiness: +8, energy: -10, stress: -6 },
    line: ['the colors came out softly today.', 'i wasn\'t sure what i\'d make. i made this.'],
  },
  exercise: {
    label: 'stretch',
    duration: 30,
    target: 'rugMid',
    pose: 'stretch',
    effects: { energy: -8, health: +10, stress: -6, happiness: +4 },
    line: ['my shoulders feel lighter.', 'a little movement, a little bigger sky.'],
  },
  clean: {
    label: 'tidy up',
    duration: 35,
    target: 'rugMid',
    pose: 'clean',
    effects: { cleanliness: +35, stress: -5, happiness: +3, energy: -4 },
    line: ['the room can breathe again.', 'small order, small calm.'],
  },
  window: {
    label: 'look outside',
    duration: 25,
    target: 'window',
    pose: 'window',
    effects: { stress: -6, happiness: +2, inspiration: +6, loneliness: +2 },
    line: ['the world is still moving out there.', 'i think it might rain tonight.', 'someone is walking a dog.'],
  },
  // idle behaviors (not player-callable, used by AI)
  idle_wander:    { duration: 8,  target: null,        pose: 'walk', effects:{} },
  idle_sit:       { duration: 30, target: 'chair',     pose: 'sit',  effects:{ stress: -1 } },
  idle_phone:     { duration: 20, target: 'bed',       pose: 'sit',  effects:{ happiness: +1, loneliness: -1 } },
  idle_window:    { duration: 25, target: 'window',    pose: 'window', effects:{ stress: -2 } },
  idle_water:     { duration: 12, target: 'plant',     pose: 'water',  effects:{ stress: -2, happiness: +2 } },
};

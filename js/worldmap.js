// ============================================================
// WORLD MAP — Multiple zones, portals, zone transitions
// ============================================================

// --- ZONE MONSTER DATA ---
const ZONE_MON_DATA = {
  // Zone 1 — Desert Wasteland
  sand_scorpion:   { hpR:[100,140],  atkR:[14,20],  def:8,   spd:2.2, expR:[60,90],   goldR:[15,30],  lvR:[10,13] },
  desert_bandit:   { hpR:[130,180],  atkR:[18,26],  def:10,  spd:2.8, expR:[80,120],  goldR:[25,45],  lvR:[12,16] },
  cactus_golem:    { hpR:[200,260],  atkR:[22,30],  def:16,  spd:1.2, expR:[110,160], goldR:[30,55],  lvR:[14,18] },
  dust_devil:      { hpR:[160,220],  atkR:[28,36],  def:12,  spd:3.2, expR:[140,200], goldR:[40,65],  lvR:[16,20] },
  // Zone 2 — Frozen Peaks
  ice_wolf:        { hpR:[180,240],  atkR:[26,34],  def:14,  spd:3.5, expR:[160,220], goldR:[40,65],  lvR:[20,23] },
  frost_giant:     { hpR:[350,450],  atkR:[34,44],  def:22,  spd:1.5, expR:[220,300], goldR:[60,90],  lvR:[22,26] },
  snow_wraith:     { hpR:[220,280],  atkR:[38,48],  def:10,  spd:3.0, expR:[260,340], goldR:[55,85],  lvR:[24,28] },
  crystal_golem:   { hpR:[400,500],  atkR:[40,52],  def:28,  spd:1.0, expR:[300,400], goldR:[70,110], lvR:[26,30] }
};

// --- ZONE DEFINITIONS ---
const worldMap = {
  currentZone: 0,
  zoneTiles: {},       // zoneTiles[zoneId] = 2D array
  visitedZones: [0],
  announcement: null,  // {text, timer, maxTimer}
  fadeAlpha: 0,        // 0=no fade, 1=full black
  fadeDir: 0,          // 1=fading out, -1=fading in, 0=idle
  fadeCallback: null,
  snowParticles: [],
  portalAnimTimer: 0,
  transitionCooldown: 0,

  zones: [
    {
      id: 0,
      name: 'Green Forest',
      subtitle: 'A peaceful woodland',
      levelRange: [1, 10],
      tint: null,
      monsters: [
        { type: 'slime',    count: 8 },
        { type: 'goblin',   count: 5 },
        { type: 'wolf',     count: 5 },
        { type: 'skeleton', count: 5 },
        { type: 'dragon',   count: 2 }
      ],
      portals: [
        { targetZone: 1, side: 'east', col: 48, row: 25, color: '#4488ff', label: 'Desert Wasteland' }
      ],
      dungeonConfig: null, // uses default dungeon
      townCenter: null     // uses default map.generate()
    },
    {
      id: 1,
      name: 'Desert Wasteland',
      subtitle: 'Scorching sands stretch endlessly',
      levelRange: [10, 20],
      tint: 'rgba(255,180,50,0.08)',
      monsters: [
        { type: 'sand_scorpion', count: 7 },
        { type: 'desert_bandit', count: 6 },
        { type: 'cactus_golem',  count: 5 },
        { type: 'dust_devil',    count: 4 }
      ],
      portals: [
        { targetZone: 0, side: 'west',  col: 1,  row: 25, color: '#44ff88', label: 'Green Forest' },
        { targetZone: 2, side: 'east',  col: 48, row: 25, color: '#88ccff', label: 'Frozen Peaks' }
      ],
      dungeonConfig: {
        name: 'Sand Tomb',
        floors: 5,
        levelRange: [12, 22],
        bossName: 'Mummy Lord',
        bossHp: 2000,
        bossAtk: 45,
        bossDef: 20
      },
      townCenter: { x: 10, y: 25 }
    },
    {
      id: 2,
      name: 'Frozen Peaks',
      subtitle: 'An icy wasteland of eternal winter',
      levelRange: [20, 30],
      tint: 'rgba(100,150,255,0.06)',
      monsters: [
        { type: 'ice_wolf',      count: 7 },
        { type: 'frost_giant',   count: 5 },
        { type: 'snow_wraith',   count: 5 },
        { type: 'crystal_golem', count: 4 }
      ],
      portals: [
        { targetZone: 1, side: 'west', col: 1, row: 25, color: '#ffaa44', label: 'Desert Wasteland' }
      ],
      dungeonConfig: {
        name: 'Ice Cavern',
        floors: 5,
        levelRange: [22, 32],
        bossName: 'Ice Dragon',
        bossHp: 3000,
        bossAtk: 55,
        bossDef: 28
      },
      townCenter: { x: 10, y: 25 }
    }
  ],

  // --- ZONE MONSTER SPAWN CONFIG ---
  zoneMonsterData: {
    0: null, // uses MON_DATA + spawnMonsters()
    1: [
      { type: 'sand_scorpion', count: 7, zoneR: [8, 22] },
      { type: 'desert_bandit', count: 6, zoneR: [10, 20] },
      { type: 'cactus_golem',  count: 5, zoneR: [15, 24] },
      { type: 'dust_devil',    count: 4, zoneR: [18, 24] }
    ],
    2: [
      { type: 'ice_wolf',      count: 7, zoneR: [8, 22] },
      { type: 'frost_giant',   count: 5, zoneR: [12, 22] },
      { type: 'snow_wraith',   count: 5, zoneR: [15, 24] },
      { type: 'crystal_golem', count: 4, zoneR: [18, 24] }
    ]
  },

  // ============================================================
  // SPRITE GENERATION
  // ============================================================
  generateSprites() {
    // --- Desert tile sprites ---
    genSprite('sand_0', 32, 32, (c) => {
      c.fillStyle = '#f0d9a0'; c.fillRect(0, 0, 32, 32);
      c.fillStyle = '#e8cf90';
      for (let i = 0; i < 10; i++) c.fillRect((i * 73 + 5) % 28 + 2, (i * 59 + 3) % 28 + 2, 3, 2);
      c.fillStyle = '#f5e3b0';
      for (let i = 0; i < 6; i++) c.fillRect((i * 47 + 11) % 26 + 3, (i * 67 + 7) % 26 + 3, 2, 1);
    });
    genSprite('sand_1', 32, 32, (c) => {
      c.fillStyle = '#f0d9a0'; c.fillRect(0, 0, 32, 32);
      c.fillStyle = '#dcc888';
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(0, 8 + i * 7);
        for (let x = 0; x < 32; x += 4) c.lineTo(x, 8 + i * 7 + Math.sin(x * 0.3 + i) * 2);
        c.strokeStyle = '#dcc888'; c.lineWidth = 1; c.stroke();
      }
    });
    genSprite('sandstone', 32, 32, (c) => {
      c.fillStyle = '#d4a574'; c.fillRect(0, 0, 32, 32);
      c.fillStyle = '#c49464';
      c.fillRect(0, 0, 32, 4); c.fillRect(0, 15, 32, 2);
      c.fillStyle = '#b88454';
      for (let i = 0; i < 5; i++) c.fillRect((i * 61 + 3) % 24 + 4, (i * 43 + 7) % 24 + 4, 4, 3);
      c.fillStyle = '#e4b584'; c.fillRect(2, 2, 8, 3); c.fillRect(18, 10, 6, 3);
    });
    genSprite('cactus', 32, 32, (c) => {
      // Sand base
      c.fillStyle = '#f0d9a0'; c.fillRect(0, 0, 32, 32);
      // Shadow
      c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(16, 30, 8, 3, 0, 0, Math.PI * 2); c.fill();
      // Main trunk
      c.fillStyle = '#2d7a2d'; c.fillRect(13, 8, 6, 22);
      // Arms
      c.fillRect(7, 12, 6, 4); c.fillRect(7, 12, 4, 10);
      c.fillRect(19, 16, 6, 4); c.fillRect(21, 16, 4, 8);
      // Highlight
      c.fillStyle = '#3a9a3a'; c.fillRect(14, 9, 2, 20);
      c.fillRect(8, 13, 2, 8); c.fillRect(22, 17, 2, 6);
      // Spines
      c.fillStyle = '#aaddaa';
      c.fillRect(12, 10, 1, 1); c.fillRect(19, 14, 1, 1); c.fillRect(12, 20, 1, 1);
      c.fillRect(6, 14, 1, 1); c.fillRect(25, 18, 1, 1);
    });
    genSprite('oasis', 32, 32, (c) => {
      c.fillStyle = '#f0d9a0'; c.fillRect(0, 0, 32, 32);
      c.fillStyle = '#3d95c6'; c.beginPath(); c.ellipse(16, 16, 12, 10, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#5eb8e6'; c.beginPath(); c.ellipse(14, 14, 6, 4, -0.3, 0, Math.PI * 2); c.fill();
      // Palm fronds hint at edge
      c.fillStyle = '#4a9a3a'; c.fillRect(26, 6, 3, 3); c.fillRect(27, 9, 2, 2);
    });

    // --- Frozen tile sprites ---
    genSprite('snow_0', 32, 32, (c) => {
      c.fillStyle = '#eef2f7'; c.fillRect(0, 0, 32, 32);
      c.fillStyle = '#dde6ef';
      for (let i = 0; i < 8; i++) c.fillRect((i * 71 + 3) % 26 + 3, (i * 53 + 5) % 26 + 3, 4, 2);
      c.fillStyle = '#f5f8fc';
      for (let i = 0; i < 6; i++) c.fillRect((i * 43 + 7) % 28 + 2, (i * 67 + 11) % 28 + 2, 2, 2);
    });
    genSprite('snow_1', 32, 32, (c) => {
      c.fillStyle = '#e4eaf2'; c.fillRect(0, 0, 32, 32);
      c.fillStyle = '#eef2f7';
      for (let i = 0; i < 12; i++) c.fillRect((i * 59) % 28 + 2, (i * 41 + 9) % 28 + 2, 3, 3);
      c.fillStyle = '#d8e0ea';
      for (let i = 0; i < 4; i++) c.fillRect((i * 83 + 5) % 24 + 4, (i * 37 + 3) % 24 + 4, 5, 2);
    });
    genSprite('ice', 32, 32, (c) => {
      c.fillStyle = '#c8e6f5'; c.fillRect(0, 0, 32, 32);
      c.fillStyle = '#a8d4f0';
      c.fillRect(2, 2, 12, 12); c.fillRect(18, 18, 12, 12);
      c.fillStyle = '#e0f0ff';
      c.fillRect(4, 4, 4, 4); c.fillRect(20, 20, 4, 4);
      c.strokeStyle = '#b0daf5'; c.lineWidth = 0.5;
      c.beginPath(); c.moveTo(0, 16); c.lineTo(32, 16); c.stroke();
      c.beginPath(); c.moveTo(16, 0); c.lineTo(16, 32); c.stroke();
    });
    genSprite('frozen_tree', 32, 32, (c) => {
      // Snow base
      c.fillStyle = '#eef2f7'; c.fillRect(0, 0, 32, 32);
      // Shadow
      c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(17, 30, 10, 3, 0, 0, Math.PI * 2); c.fill();
      // Trunk
      c.fillStyle = '#5d4a3a'; c.fillRect(13, 22, 6, 10);
      // Snow-covered branches
      c.fillStyle = '#7a9aaa'; c.beginPath(); c.moveTo(16, 2); c.lineTo(24, 16); c.lineTo(8, 16); c.closePath(); c.fill();
      c.fillStyle = '#8aacbc'; c.beginPath(); c.moveTo(16, 7); c.lineTo(26, 22); c.lineTo(6, 22); c.closePath(); c.fill();
      // Snow on top
      c.fillStyle = '#eef2f7'; c.fillRect(12, 2, 8, 3);
      c.fillStyle = '#dde8f0'; c.fillRect(9, 14, 14, 3); c.fillRect(7, 20, 18, 3);
    });
    genSprite('mountain', 32, 32, (c) => {
      c.fillStyle = '#eef2f7'; c.fillRect(0, 0, 32, 32);
      // Mountain body
      c.fillStyle = '#6b7a8a'; c.beginPath(); c.moveTo(16, 0); c.lineTo(32, 32); c.lineTo(0, 32); c.closePath(); c.fill();
      // Snow cap
      c.fillStyle = '#dde8f0'; c.beginPath(); c.moveTo(16, 0); c.lineTo(22, 10); c.lineTo(10, 10); c.closePath(); c.fill();
      // Dark face
      c.fillStyle = '#5a6a7a'; c.beginPath(); c.moveTo(16, 0); c.lineTo(32, 32); c.lineTo(16, 32); c.closePath(); c.fill();
      // Snow cap shadow side
      c.fillStyle = '#ccdae4'; c.beginPath(); c.moveTo(16, 0); c.lineTo(22, 10); c.lineTo(16, 10); c.closePath(); c.fill();
    });

    // --- Portal sprites (multi-frame) ---
    for (let f = 0; f < 4; f++) {
      genSprite('portal_blue_' + f, 32, 32, (c) => {
        const grd = c.createRadialGradient(16, 16, 2, 16, 16, 14);
        grd.addColorStop(0, '#aaddff'); grd.addColorStop(0.4, '#4488ff'); grd.addColorStop(1, 'transparent');
        c.fillStyle = grd; c.fillRect(0, 0, 32, 32);
        // Swirl lines
        c.strokeStyle = 'rgba(150,200,255,0.6)'; c.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const a = (f * Math.PI / 2) + i * Math.PI * 2 / 3;
          c.beginPath();
          c.arc(16, 16, 6 + i * 2, a, a + Math.PI * 0.8);
          c.stroke();
        }
        c.fillStyle = '#ddeeff'; c.beginPath(); c.arc(16, 16, 3, 0, Math.PI * 2); c.fill();
      });
      genSprite('portal_orange_' + f, 32, 32, (c) => {
        const grd = c.createRadialGradient(16, 16, 2, 16, 16, 14);
        grd.addColorStop(0, '#ffeebb'); grd.addColorStop(0.4, '#ff8844'); grd.addColorStop(1, 'transparent');
        c.fillStyle = grd; c.fillRect(0, 0, 32, 32);
        c.strokeStyle = 'rgba(255,180,100,0.6)'; c.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const a = (f * Math.PI / 2) + i * Math.PI * 2 / 3;
          c.beginPath();
          c.arc(16, 16, 6 + i * 2, a, a + Math.PI * 0.8);
          c.stroke();
        }
        c.fillStyle = '#ffeedd'; c.beginPath(); c.arc(16, 16, 3, 0, Math.PI * 2); c.fill();
      });
      genSprite('portal_green_' + f, 32, 32, (c) => {
        const grd = c.createRadialGradient(16, 16, 2, 16, 16, 14);
        grd.addColorStop(0, '#bbffcc'); grd.addColorStop(0.4, '#44ff88'); grd.addColorStop(1, 'transparent');
        c.fillStyle = grd; c.fillRect(0, 0, 32, 32);
        c.strokeStyle = 'rgba(100,255,150,0.6)'; c.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const a = (f * Math.PI / 2) + i * Math.PI * 2 / 3;
          c.beginPath();
          c.arc(16, 16, 6 + i * 2, a, a + Math.PI * 0.8);
          c.stroke();
        }
        c.fillStyle = '#ddffee'; c.beginPath(); c.arc(16, 16, 3, 0, Math.PI * 2); c.fill();
      });
    }

    // --- Desert monster sprites ---
    for (let f = 0; f < 2; f++) {
      genSprite('sand_scorpion_' + f, 32, 32, (c) => {
        const bob = f === 1 ? 1 : 0;
        c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(16, 30, 10, 3, 0, 0, Math.PI * 2); c.fill();
        // Body
        c.fillStyle = '#c4956a'; c.beginPath(); c.ellipse(16, 20 + bob, 10, 6, 0, 0, Math.PI * 2); c.fill();
        // Head
        c.fillStyle = '#b88555'; c.fillRect(8, 14 + bob, 6, 5);
        // Claws
        c.fillStyle = '#d4a574';
        c.fillRect(4, 12 + bob, 5, 3); c.fillRect(2, 10 + bob, 3, 4);
        c.fillRect(23, 12 + bob, 5, 3); c.fillRect(27, 10 + bob, 3, 4);
        // Tail curving up
        c.fillStyle = '#b88555';
        c.fillRect(14, 10 + bob, 4, 6);
        c.fillRect(15, 6 + bob, 3, 5);
        c.fillRect(17, 4 + bob, 3, 4);
        // Stinger
        c.fillStyle = '#8a3030'; c.fillRect(18, 2 + bob, 2, 3);
        // Eyes
        c.fillStyle = '#111'; c.fillRect(9, 15 + bob, 2, 2); c.fillRect(12, 15 + bob, 2, 2);
        // Legs
        c.fillStyle = '#a07550';
        c.fillRect(8, 24 + bob, 2, 4); c.fillRect(12, 25 + bob, 2, 4);
        c.fillRect(18, 25 + bob, 2, 4); c.fillRect(22, 24 + bob, 2, 4);
      });

      genSprite('desert_bandit_' + f, 32, 32, (c) => {
        const sw = f === 1 ? -2 : 0;
        c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(16, 31, 7, 2, 0, 0, Math.PI * 2); c.fill();
        // Legs
        c.fillStyle = '#6b4530'; c.fillRect(11, 22, 4, 9); c.fillRect(17, 22, 4, 9);
        c.fillStyle = '#333'; c.fillRect(11, 30, 4, 2); c.fillRect(17, 30, 4, 2);
        // Body
        c.fillStyle = '#8b3030'; c.fillRect(9, 12, 14, 12);
        // Arms
        c.fillStyle = '#8b3030'; c.fillRect(5, 12 + sw, 4, 9); c.fillRect(23, 12 - sw, 4, 9);
        // Scimitar
        c.fillStyle = '#bdc3c7'; c.fillRect(27, 8 - sw, 2, 12);
        c.fillStyle = '#d4a017'; c.fillRect(26, 18 - sw, 4, 2);
        // Head with turban
        c.fillStyle = '#c4956a'; c.fillRect(10, 4, 12, 10);
        c.fillStyle = '#cc4444'; c.fillRect(8, 2, 16, 5);
        c.fillStyle = '#aa3333'; c.fillRect(10, 0, 12, 3);
        // Face mask
        c.fillStyle = '#8b3030'; c.fillRect(10, 10, 12, 4);
        // Eyes
        c.fillStyle = '#111'; c.fillRect(12, 7, 2, 2); c.fillRect(18, 7, 2, 2);
      });

      genSprite('cactus_golem_' + f, 32, 32, (c) => {
        const bob = f === 1 ? -1 : 0;
        c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(16, 31, 10, 3, 0, 0, Math.PI * 2); c.fill();
        // Legs
        c.fillStyle = '#2d6a2d'; c.fillRect(10, 24 + bob, 5, 7); c.fillRect(17, 24 + bob, 5, 7);
        // Body (cactus trunk)
        c.fillStyle = '#3a8a3a'; c.fillRect(8, 8 + bob, 16, 18);
        // Arms (cactus arms)
        c.fillStyle = '#3a8a3a';
        c.fillRect(3, 10 + bob, 5, 5); c.fillRect(3, 10 + bob, 4, 10);
        c.fillRect(24, 14 + bob, 5, 5); c.fillRect(25, 14 + bob, 4, 8);
        // Highlight
        c.fillStyle = '#4aaa4a'; c.fillRect(10, 10 + bob, 3, 14);
        c.fillRect(4, 12 + bob, 2, 6); c.fillRect(26, 16 + bob, 2, 4);
        // Spines
        c.fillStyle = '#cceecc';
        c.fillRect(7, 12 + bob, 1, 1); c.fillRect(24, 16 + bob, 1, 1);
        c.fillRect(7, 20 + bob, 1, 1); c.fillRect(24, 22 + bob, 1, 1);
        // Eyes
        c.fillStyle = '#ff6600'; c.fillRect(11, 12 + bob, 3, 3); c.fillRect(18, 12 + bob, 3, 3);
        c.fillStyle = '#111'; c.fillRect(12, 13 + bob, 1, 1); c.fillRect(19, 13 + bob, 1, 1);
        // Mouth
        c.fillStyle = '#2d6a2d'; c.fillRect(13, 18 + bob, 6, 2);
      });

      genSprite('dust_devil_' + f, 32, 32, (c) => {
        const off = f * 3;
        // Swirling gray/brown tornado shape
        c.globalAlpha = 0.7;
        c.fillStyle = '#a09080';
        c.beginPath(); c.ellipse(16, 28, 12, 4, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#908070';
        c.beginPath(); c.ellipse(16 + off - 1, 22, 9, 4, 0.1, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#807060';
        c.beginPath(); c.ellipse(16 - off + 1, 16, 7, 3, -0.1, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#706050';
        c.beginPath(); c.ellipse(16 + off, 10, 5, 3, 0.15, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#605040';
        c.beginPath(); c.ellipse(16 - off, 5, 3, 2, -0.1, 0, Math.PI * 2); c.fill();
        c.globalAlpha = 1;
        // Debris particles
        c.fillStyle = '#c4956a'; c.fillRect(10 + off, 20, 2, 2); c.fillRect(20 - off, 12, 2, 2);
        c.fillStyle = '#8b6040'; c.fillRect(14 + off, 8, 1, 1); c.fillRect(18 - off, 24, 1, 1);
        // Eyes (glowing in the storm)
        c.fillStyle = '#ffcc00'; c.fillRect(13, 14, 2, 2); c.fillRect(19, 14, 2, 2);
      });
    }

    // --- Frozen monster sprites ---
    for (let f = 0; f < 2; f++) {
      genSprite('ice_wolf_' + f, 32, 32, (c) => {
        const run = f === 1;
        c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(16, 31, 12, 2, 0, 0, Math.PI * 2); c.fill();
        // Body
        c.fillStyle = '#c8dae8'; c.fillRect(6, 16, 22, 10);
        // Legs
        c.fillStyle = '#b0c4d4'; const lo = run ? 3 : 0;
        c.fillRect(7, 25, 3, 6 - lo); c.fillRect(11, 25, 3, 6 + lo);
        c.fillRect(18, 25, 3, 6 + lo); c.fillRect(22, 25, 3, 6 - lo);
        // Tail
        c.fillStyle = '#c8dae8'; c.beginPath();
        c.moveTo(28, 17); c.quadraticCurveTo(34, run ? 10 : 14, 30, run ? 12 : 15); c.fill();
        // Head
        c.fillRect(4, 9, 12, 8);
        // Ears
        c.beginPath(); c.moveTo(6, 9); c.lineTo(4, 4); c.lineTo(9, 8); c.fill();
        c.beginPath(); c.moveTo(13, 9); c.lineTo(15, 5); c.lineTo(15, 9); c.fill();
        // Blue ice markings
        c.fillStyle = '#8ab8d8'; c.fillRect(8, 18, 4, 3); c.fillRect(20, 18, 4, 3);
        // Eyes
        c.fillStyle = '#66ccff'; c.fillRect(5, 11, 2, 2); c.fillRect(11, 11, 2, 2);
        c.fillStyle = '#000'; c.fillRect(6, 11, 1, 2); c.fillRect(12, 11, 1, 2);
        // Muzzle
        c.fillStyle = '#b0c4d4'; c.fillRect(2, 13, 2, 2);
      });

      genSprite('frost_giant_' + f, 48, 48, (c) => {
        const sw = f === 1 ? -2 : 0;
        c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(24, 46, 14, 4, 0, 0, Math.PI * 2); c.fill();
        // Legs
        c.fillStyle = '#6688aa'; c.fillRect(14, 32, 7, 14); c.fillRect(27, 32, 7, 14);
        c.fillStyle = '#556688'; c.fillRect(14, 44, 7, 3); c.fillRect(27, 44, 7, 3);
        // Body
        c.fillStyle = '#7799bb'; c.fillRect(12, 14, 24, 20);
        // Ice armor plates
        c.fillStyle = '#99bbdd'; c.fillRect(14, 16, 8, 4); c.fillRect(26, 16, 8, 4);
        c.fillStyle = '#88aacc'; c.fillRect(16, 22, 16, 6);
        // Arms
        c.fillStyle = '#7799bb';
        c.fillRect(6, 14 + sw, 6, 14); c.fillRect(36, 14 - sw, 6, 14);
        // Club
        c.fillStyle = '#aabbcc'; c.fillRect(40, 6 - sw, 4, 20);
        c.fillStyle = '#88aacc'; c.fillRect(38, 4 - sw, 8, 6);
        // Head
        c.fillStyle = '#7799bb'; c.fillRect(16, 2, 16, 14);
        // Ice crown / horns
        c.fillStyle = '#aaddee';
        c.fillRect(16, 0, 3, 4); c.fillRect(29, 0, 3, 4);
        // Eyes
        c.fillStyle = '#ccffff'; c.fillRect(19, 7, 3, 3); c.fillRect(26, 7, 3, 3);
        c.fillStyle = '#111'; c.fillRect(20, 8, 1, 1); c.fillRect(27, 8, 1, 1);
        // Beard (ice)
        c.fillStyle = '#bbddee'; c.fillRect(20, 12, 8, 5);
        c.fillStyle = '#aaccdd'; c.fillRect(22, 16, 2, 3); c.fillRect(26, 16, 2, 3);
      });

      genSprite('snow_wraith_' + f, 32, 32, (c) => {
        const bob = f === 1 ? -2 : 0;
        // Ghostly translucent white
        c.globalAlpha = 0.6;
        // Wispy body
        c.fillStyle = '#e8eeff';
        c.beginPath(); c.ellipse(16, 16 + bob, 10, 12, 0, 0, Math.PI * 2); c.fill();
        // Tattered bottom
        c.fillStyle = '#d0d8ee';
        c.beginPath();
        c.moveTo(6, 22 + bob); c.lineTo(8, 30 + bob); c.lineTo(12, 26 + bob);
        c.lineTo(16, 31 + bob); c.lineTo(20, 26 + bob); c.lineTo(24, 30 + bob);
        c.lineTo(26, 22 + bob); c.closePath(); c.fill();
        c.globalAlpha = 1;
        // Eyes (glowing blue)
        c.fillStyle = '#44aaff'; c.fillRect(11, 12 + bob, 3, 3); c.fillRect(18, 12 + bob, 3, 3);
        c.fillStyle = '#88ddff'; c.fillRect(12, 13 + bob, 1, 1); c.fillRect(19, 13 + bob, 1, 1);
        // Mouth
        c.fillStyle = '#3388cc'; c.fillRect(14, 18 + bob, 4, 2);
        // Ice aura particles
        c.fillStyle = 'rgba(150,200,255,0.4)';
        c.fillRect(4, 8 + bob, 2, 2); c.fillRect(26, 10 + bob, 2, 2);
        c.fillRect(8, 26 + bob, 2, 2); c.fillRect(22, 24 + bob, 2, 2);
      });

      genSprite('crystal_golem_' + f, 32, 32, (c) => {
        const bob = f === 1 ? -1 : 0;
        c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(16, 31, 10, 3, 0, 0, Math.PI * 2); c.fill();
        // Legs (crystalline)
        c.fillStyle = '#88ccdd'; c.fillRect(10, 24 + bob, 5, 7); c.fillRect(17, 24 + bob, 5, 7);
        // Body (faceted crystal)
        c.fillStyle = '#aaddee';
        c.beginPath();
        c.moveTo(8, 24 + bob); c.lineTo(10, 8 + bob); c.lineTo(16, 4 + bob);
        c.lineTo(22, 8 + bob); c.lineTo(24, 24 + bob); c.closePath(); c.fill();
        // Facet lines
        c.strokeStyle = '#99ccdd'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(16, 4 + bob); c.lineTo(16, 24 + bob); c.stroke();
        c.beginPath(); c.moveTo(10, 8 + bob); c.lineTo(24, 8 + bob); c.stroke();
        c.beginPath(); c.moveTo(10, 16 + bob); c.lineTo(22, 16 + bob); c.stroke();
        // Arms (crystal shards)
        c.fillStyle = '#99ccee';
        c.beginPath(); c.moveTo(8, 12 + bob); c.lineTo(3, 8 + bob); c.lineTo(4, 16 + bob); c.lineTo(8, 20 + bob); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(24, 12 + bob); c.lineTo(29, 8 + bob); c.lineTo(28, 16 + bob); c.lineTo(24, 20 + bob); c.closePath(); c.fill();
        // Highlight
        c.fillStyle = '#cceeff'; c.fillRect(12, 8 + bob, 3, 4);
        // Eyes
        c.fillStyle = '#fff'; c.fillRect(12, 10 + bob, 2, 2); c.fillRect(18, 10 + bob, 2, 2);
        c.fillStyle = '#44aaff'; c.fillRect(12, 11 + bob, 2, 1); c.fillRect(18, 11 + bob, 2, 1);
        // Glow
        c.fillStyle = 'rgba(100,200,255,0.2)';
        c.beginPath(); c.arc(16, 14 + bob, 8, 0, Math.PI * 2); c.fill();
      });
    }
  },

  // ============================================================
  // ZONE MAP GENERATION
  // ============================================================
  generateZone(zoneId) {
    const tiles = [];
    for (let y = 0; y < MAP_H; y++) { tiles[y] = []; for (let x = 0; x < MAP_W; x++) tiles[y][x] = 0; }

    if (zoneId === 0) {
      // Zone 0: reuse existing map generation
      map.generate();
      // Deep copy tiles
      for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) tiles[y][x] = map.tiles[y][x];
      // Place east portal (clear area around it)
      const portal = this.zones[0].portals[0];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const py = portal.row + dy, px = portal.col + dx;
        if (py >= 0 && py < MAP_H && px >= 0 && px < MAP_W) tiles[py][px] = 0;
      }
    } else if (zoneId === 1) {
      this._generateDesert(tiles);
    } else if (zoneId === 2) {
      this._generateFrozen(tiles);
    }

    this.zoneTiles[zoneId] = tiles;
    return tiles;
  },

  _generateDesert(tiles) {
    // Fill with sand (tile 10)
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) tiles[y][x] = 10;

    // Camp area (tile 5) at center-west
    const cx = 10, cy = Math.floor(MAP_H / 2);
    for (let y = cy - 3; y < cy + 3; y++) for (let x = cx - 3; x < cx + 3; x++) {
      if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W) tiles[y][x] = 5;
    }
    // Camp buildings
    for (const [bx, by] of [[cx - 2, cy - 2], [cx + 1, cy - 2], [cx + 1, cy + 1]]) {
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        if (bx + dx >= 0 && bx + dx < MAP_W && by + dy >= 0 && by + dy < MAP_H) tiles[by + dy][bx + dx] = 6;
      }
    }

    // Paths (dirt tile 1)
    for (let x = 0; x < MAP_W; x++) if (tiles[cy][x] === 10) tiles[cy][x] = 1;
    for (let y = 0; y < MAP_H; y++) if (tiles[y][cx][0] !== undefined || tiles[y][cx] === 10) tiles[y][cx] = 1;

    // Sandstone formations (tile 11 — unwalkable)
    for (const [sx, sy] of [[20, 10], [35, 8], [42, 20], [30, 35], [15, 40], [25, 20], [40, 40]]) {
      const r = 1 + Math.floor(Math.abs(Math.sin(sx * sy)) * 2);
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const nx = sx + dx, ny = sy + dy;
          if (nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H && tiles[ny][nx] === 10) tiles[ny][nx] = 11;
        }
      }
    }

    // Cacti clusters (tile 12 — unwalkable)
    for (const [cx2, cy2] of [[18, 6], [38, 12], [8, 30], [28, 42], [45, 35], [12, 15], [32, 18]]) {
      const r = 1 + Math.floor(Math.abs(Math.cos(cx2 + cy2)) * 1.5);
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= r) {
          const nx = cx2 + dx, ny = cy2 + dy;
          if (nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H && tiles[ny][nx] === 10) tiles[ny][nx] = 12;
        }
      }
    }

    // Oasis pools (tile 13)
    for (const [ox, oy] of [[22, 15], [38, 30], [10, 42]]) {
      const r = 2 + Math.floor(Math.abs(Math.sin(ox * oy)) * 1.5);
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const nx = ox + dx, ny = oy + dy;
          if (nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H && tiles[ny][nx] === 10) tiles[ny][nx] = 13;
        }
      }
    }

    // Clear portal areas
    for (const p of this.zones[1].portals) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const py = p.row + dy, px = p.col + dx;
        if (py >= 0 && py < MAP_H && px >= 0 && px < MAP_W) tiles[py][px] = 10;
      }
    }
  },

  _generateFrozen(tiles) {
    // Fill with snow (tile 14)
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) tiles[y][x] = 14;

    // Camp area (tile 5) at center-west
    const cx = 10, cy = Math.floor(MAP_H / 2);
    for (let y = cy - 3; y < cy + 3; y++) for (let x = cx - 3; x < cx + 3; x++) {
      if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W) tiles[y][x] = 5;
    }
    // Camp buildings
    for (const [bx, by] of [[cx - 2, cy - 2], [cx + 1, cy - 2], [cx + 1, cy + 1]]) {
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        if (bx + dx >= 0 && bx + dx < MAP_W && by + dy >= 0 && by + dy < MAP_H) tiles[by + dy][bx + dx] = 6;
      }
    }

    // Paths (dirt tile 1)
    for (let x = 0; x < MAP_W; x++) if (tiles[cy][x] === 14) tiles[cy][x] = 1;
    for (let y = 0; y < MAP_H; y++) if (tiles[y][cx] === 14) tiles[y][cx] = 1;

    // Ice patches (tile 15 — walkable, 1.5x speed)
    for (const [ix, iy] of [[20, 12], [35, 22], [15, 38], [40, 35], [28, 8]]) {
      const r = 2 + Math.floor(Math.abs(Math.sin(ix + iy)) * 2);
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const nx = ix + dx, ny = iy + dy;
          if (nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H && tiles[ny][nx] === 14) tiles[ny][nx] = 15;
        }
      }
    }

    // Frozen trees (tile 16 — unwalkable)
    for (const [tx, ty] of [[5, 5], [18, 6], [42, 10], [8, 20], [35, 18], [14, 35], [44, 28], [25, 44]]) {
      const r = 2 + Math.floor(Math.abs(Math.sin(tx + ty)) * 2);
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const nx = tx + dx, ny = ty + dy;
          if (nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H && tiles[ny][nx] === 14) tiles[ny][nx] = 16;
        }
      }
    }

    // Mountain ranges along edges (tile 17 — unwalkable)
    for (let x = 0; x < MAP_W; x++) {
      for (let d = 0; d < 3; d++) {
        if (Math.random() < 0.6) { if (d < MAP_H) tiles[d][x] = 17; }
        if (Math.random() < 0.6) { if (MAP_H - 1 - d >= 0) tiles[MAP_H - 1 - d][x] = 17; }
      }
    }
    for (let y = 0; y < MAP_H; y++) {
      for (let d = 0; d < 2; d++) {
        if (Math.random() < 0.4) { if (MAP_W - 1 - d >= 0) tiles[y][MAP_W - 1 - d] = 17; }
      }
    }

    // Clear portal areas
    for (const p of this.zones[2].portals) {
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const py = p.row + dy, px = p.col + dx;
        if (py >= 0 && py < MAP_H && px >= 0 && px < MAP_W) tiles[py][px] = 14;
      }
    }

    // Clear paths near camp
    for (let x = 0; x < 20; x++) {
      if (tiles[cy][x] === 17 || tiles[cy][x] === 16) tiles[cy][x] = 1;
    }
  },

  // ============================================================
  // ZONE TRANSITION
  // ============================================================
  init() {
    this.generateSprites();
    // Generate all zones on startup
    this.generateZone(0);
    this.generateZone(1);
    this.generateZone(2);
    // Apply zone 0 tiles to map
    this._applyZoneTiles(0);
    // Init snow particles
    for (let i = 0; i < 60; i++) {
      this.snowParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 2,
        speedY: 20 + Math.random() * 30,
        speedX: -10 + Math.random() * 20,
        opacity: 0.3 + Math.random() * 0.5
      });
    }
  },

  _applyZoneTiles(zoneId) {
    const src = this.zoneTiles[zoneId];
    if (!src) return;
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
      map.tiles[y][x] = src[y][x];
    }
  },

  checkPortalProximity(player) {
    if (!player || player.isDead) return null;
    if (this.transitionCooldown > 0) return null;
    if (typeof dungeon !== 'undefined' && dungeon.active) return null;

    const zone = this.zones[this.currentZone];
    if (!zone || !zone.portals) return null;

    const px = Math.floor(player.x / TILE);
    const py = Math.floor(player.y / TILE);

    for (const portal of zone.portals) {
      const dx = Math.abs(px - portal.col);
      const dy = Math.abs(py - portal.row);
      if (dx <= 1 && dy <= 1) {
        return portal.targetZone;
      }
    }
    return null;
  },

  transitionToZone(zoneId) {
    if (this.fadeDir !== 0) return; // already transitioning
    if (zoneId < 0 || zoneId >= this.zones.length) return;
    if (typeof dungeon !== 'undefined' && dungeon.active) return;

    const targetZone = this.zones[zoneId];

    // Start fade out
    this.fadeDir = 1;
    this.fadeAlpha = 0;
    this.fadeCallback = () => {
      // At peak black: swap zone
      const prevZone = this.currentZone;
      this.currentZone = zoneId;

      // Add to visited
      if (!this.visitedZones.includes(zoneId)) this.visitedZones.push(zoneId);

      // Generate zone tiles if not already done
      if (!this.zoneTiles[zoneId]) this.generateZone(zoneId);

      // Swap tiles into map
      this._applyZoneTiles(zoneId);

      // Respawn zone monsters
      game.monsters = this.spawnZoneMonsters(zoneId);

      // Respawn NPCs in new zone
      game.npcPlayers = createNPCs(6);

      // Place player at opposite edge
      const prevPortals = this.zones[prevZone].portals;
      const usedPortal = prevPortals.find(p => p.targetZone === zoneId);
      if (usedPortal) {
        // Player arrives at the portal that leads back, offset inward so they
        // don't immediately re-trigger the portal after transitionCooldown expires
        const arrivalPortal = targetZone.portals.find(p => p.targetZone === prevZone);
        if (arrivalPortal) {
          let col = arrivalPortal.col;
          let row = arrivalPortal.row;
          if (arrivalPortal.side === 'west') col += 3;
          else if (arrivalPortal.side === 'east') col -= 3;
          else if (arrivalPortal.side === 'north') row += 3;
          else if (arrivalPortal.side === 'south') row -= 3;
          game.player.x = col * TILE + TILE / 2;
          game.player.y = row * TILE + TILE / 2;
        } else {
          // Fallback: place at center
          game.player.x = Math.floor(MAP_W / 2) * TILE + TILE / 2;
          game.player.y = Math.floor(MAP_H / 2) * TILE + TILE / 2;
        }
      }

      // Reset bot state
      if (typeof botAI !== 'undefined') {
        botAI.state = 'idle';
        botAI.target = null;
        botAI.stuckTimer = 0;
        game.player._path = null;
        game.player._pathIdx = 0;
      }

      // Clear drops and effects
      game.itemDrops = [];

      // Update camera
      camera.update(game.player);

      // Transition cooldown to prevent instant re-trigger
      this.transitionCooldown = 2;

      // Start fade in
      this.fadeDir = -1;
      this.fadeCallback = null;

      // Show zone announcement
      this.announcement = {
        text: '~ ' + targetZone.name + ' ~',
        subtitle: targetZone.subtitle,
        timer: 3,
        maxTimer: 3
      };

      addLog('Entered ' + targetZone.name + ' (Lv.' + targetZone.levelRange[0] + '-' + targetZone.levelRange[1] + ')', '#44DDFF');
      addNotification('Entered ' + targetZone.name, '#44DDFF');

      try { sfx.spell(); } catch (e) {}
    };
  },

  // ============================================================
  // ZONE MONSTER SPAWNING
  // ============================================================
  spawnZoneMonsters(zoneId) {
    if (zoneId === 0) return spawnMonsters(); // use existing function

    const monDefs = this.zoneMonsterData[zoneId];
    if (!monDefs) return [];

    const mons = [];
    const cx = Math.floor(MAP_W / 2) * TILE, cy = Math.floor(MAP_H / 2) * TILE;

    for (const def of monDefs) {
      const d = ZONE_MON_DATA[def.type];
      if (!d) continue;

      for (let i = 0; i < def.count; i++) {
        let sx, sy, att = 0;
        do {
          const a = Math.random() * Math.PI * 2;
          const dist = rf(def.zoneR[0], Math.min(def.zoneR[1], 48)) * TILE;
          sx = Math.max(TILE, Math.min(cx + Math.cos(a) * dist, (MAP_W - 2) * TILE));
          sy = Math.max(TILE, Math.min(cy + Math.sin(a) * dist, (MAP_H - 2) * TILE));
          att++;
        } while (!this.isZoneWalkable(zoneId, Math.floor(sx / TILE), Math.floor(sy / TILE)) && att < 30);

        const lv = ri(d.lvR[0], d.lvR[1]);
        const hp = ri(d.hpR[0], d.hpR[1]);
        mons.push({
          entityType: 'monster',
          type: def.type,
          level: lv,
          hp: hp,
          maxHp: hp,
          atk: ri(d.atkR[0], d.atkR[1]),
          def: d.def,
          spd: d.spd,
          expReward: ri(d.expR[0], d.expR[1]),
          goldReward: ri(d.goldR[0], d.goldR[1]),
          x: sx,
          y: sy,
          dir: 'down',
          frame: 0,
          animTimer: 0,
          state: 'patrol',
          patrolCenter: { x: sx, y: sy },
          patrolAngle: Math.random() * Math.PI * 2,
          target: null,
          respawnTimer: 0,
          attackTimer: 0,
          aggroRange: TILE * 5,
          attackRange: TILE * 1.2,
          slowTimer: 0,
          isDead: false,
          crit: 0.05
        });
      }
    }
    return mons;
  },

  isZoneWalkable(zoneId, x, y) {
    if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return false;
    const t = this.zoneTiles[zoneId][y][x];
    // Walkable tiles: grass(0), dirt(1), townFloor(5), sand(10), oasis(13), snow(14), ice(15)
    return t === 0 || t === 1 || t === 5 || t === 10 || t === 13 || t === 14 || t === 15;
  },

  // ============================================================
  // UPDATE (called each frame)
  // ============================================================
  update(dt) {
    // Portal animation
    this.portalAnimTimer += dt;

    // Transition cooldown
    if (this.transitionCooldown > 0) this.transitionCooldown -= dt;

    // Fade transition
    if (this.fadeDir !== 0) {
      this.fadeAlpha += this.fadeDir * dt * 2; // 0.5s fade
      if (this.fadeDir === 1 && this.fadeAlpha >= 1) {
        this.fadeAlpha = 1;
        if (this.fadeCallback) this.fadeCallback();
      }
      if (this.fadeDir === -1 && this.fadeAlpha <= 0) {
        this.fadeAlpha = 0;
        this.fadeDir = 0;
      }
    }

    // Announcement timer
    if (this.announcement) {
      this.announcement.timer -= dt;
      if (this.announcement.timer <= 0) this.announcement = null;
    }

    // Snow particles (frozen zone)
    if (this.currentZone === 2) {
      this.updateParticles(dt);
    }

    // Check portal proximity for player (auto-transition when bot enabled)
    if (game.player && !game.player.isDead && this.fadeDir === 0) {
      const targetZone = this.checkPortalProximity(game.player);
      if (targetZone !== null && typeof botAI !== 'undefined' && botAI.enabled) {
        this.transitionToZone(targetZone);
      }
    }
  },

  // ============================================================
  // SNOW PARTICLES
  // ============================================================
  updateParticles(dt) {
    for (const p of this.snowParticles) {
      p.y += p.speedY * dt;
      p.x += p.speedX * dt;
      if (p.y > canvas.height) { p.y = -5; p.x = Math.random() * canvas.width; }
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
    }
  },

  // ============================================================
  // VISUAL OVERLAYS & DRAWING
  // ============================================================
  drawOverlay() {
    const zone = this.zones[this.currentZone];

    // Zone tint
    if (zone && zone.tint) {
      ctx.fillStyle = zone.tint;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Snow particles for frozen zone
    if (this.currentZone === 2) {
      ctx.fillStyle = '#fff';
      for (const p of this.snowParticles) {
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Fade transition overlay
    if (this.fadeAlpha > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + this.fadeAlpha + ')';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Zone name announcement
    if (this.announcement) {
      const a = this.announcement;
      const progress = 1 - a.timer / a.maxTimer;
      let alpha;
      if (progress < 0.15) alpha = progress / 0.15;
      else if (progress > 0.7) alpha = (1 - progress) / 0.3;
      else alpha = 1;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';

      // Zone name
      ctx.font = 'bold 28px monospace';
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 8;
      ctx.fillText(a.text, canvas.width / 2, canvas.height / 2 - 15);

      // Subtitle
      if (a.subtitle) {
        ctx.font = '14px monospace';
        ctx.fillStyle = '#ccddee';
        ctx.fillText(a.subtitle, canvas.width / 2, canvas.height / 2 + 15);
      }

      // Level range
      const zone = this.zones[this.currentZone];
      if (zone) {
        ctx.font = '12px monospace';
        ctx.fillStyle = '#aabbcc';
        ctx.fillText('Lv.' + zone.levelRange[0] + ' - ' + zone.levelRange[1], canvas.width / 2, canvas.height / 2 + 35);
      }

      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      ctx.restore();
    }
  },

  drawPortals() {
    if (typeof dungeon !== 'undefined' && dungeon.active) return;

    const zone = this.zones[this.currentZone];
    if (!zone || !zone.portals) return;

    const frame = Math.floor(this.portalAnimTimer * 3) % 4;

    for (const portal of zone.portals) {
      const wx = portal.col * TILE + TILE / 2;
      const wy = portal.row * TILE + TILE / 2;
      const { x: sx, y: sy } = camera.worldToScreen(wx, wy);

      // Check if on screen
      if (sx < -TILE * 2 || sx > canvas.width + TILE * 2 || sy < -TILE * 2 || sy > canvas.height + TILE * 2) continue;

      // Draw portal sprite
      let sprName;
      if (portal.color === '#4488ff') sprName = 'portal_blue_' + frame;
      else if (portal.color === '#88ccff') sprName = 'portal_blue_' + frame;
      else if (portal.color === '#ffaa44') sprName = 'portal_orange_' + frame;
      else if (portal.color === '#44ff88') sprName = 'portal_green_' + frame;
      else sprName = 'portal_blue_' + frame;

      const spr = spriteCache[sprName];
      if (spr) {
        ctx.drawImage(spr, sx - TILE, sy - TILE, TILE * 2, TILE * 2);
      }

      // Portal label
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = portal.color;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(portal.label, sx, sy - TILE - 4);

      // Level range indicator
      const tz = this.zones[portal.targetZone];
      if (tz) {
        ctx.font = '9px monospace';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Lv.' + tz.levelRange[0] + '-' + tz.levelRange[1], sx, sy - TILE - 16);
      }

      // Show "Press F" hint when player is near
      if(game.player&&!game.player.isDead){
        const pd=Math.hypot(game.player.x-wx,game.player.y-wy);
        if(pd<TILE*1.5){
          ctx.font='bold 11px monospace';
          ctx.fillStyle='#ffffff';
          ctx.fillText('Press F to enter',sx,sy+TILE+8);
        }
      }

      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      ctx.restore();
    }
  },

  // Extended tile rendering for new tile types
  // Called from drawMapTiles in ui.js — returns sprite for tile ID, or null to use default
  getTileSprite(tileId, col, row) {
    switch (tileId) {
      case 10: return spriteCache['sand_' + ((col * 7 + row * 13) % 2)];
      case 11: return spriteCache['sandstone'];
      case 12: return spriteCache['cactus'];
      case 13: return spriteCache['oasis'];
      case 14: return spriteCache['snow_' + ((col * 7 + row * 13) % 2)];
      case 15: return spriteCache['ice'];
      case 16: return spriteCache['frozen_tree'];
      case 17: return spriteCache['mountain'];
      default: return null;
    }
  },

  // Extended monster sprite lookup
  // Returns sprite canvas for zone-specific monsters, or null
  getMonsterSprite(type, frame) {
    const name = type + '_' + (frame % 2);
    return spriteCache[name] || null;
  },

  // ============================================================
  // WALKABILITY — extend map.isWalkable for new tile types
  // ============================================================
  extendWalkability() {
    const origIsWalkable = map.isWalkable.bind(map);
    map.isWalkable = function (x, y) {
      const t = map.getTile(x, y);
      if (t < 0) return false;
      // Original walkable: 0(grass), 1(dirt), 5(townFloor)
      if (t === 0 || t === 1 || t === 5) return true;
      // New walkable tiles
      if (t === 10) return true;  // sand
      if (t === 13) return true;  // oasis (shallow water)
      if (t === 14) return true;  // snow
      if (t === 15) return true;  // ice
      // Unwalkable: 2(water), 3(tree), 4(rock), 6(building), 11(sandstone), 12(cactus), 16(frozen_tree), 17(mountain)
      return false;
    };
  },

  // ============================================================
  // BOT ZONE TRAVEL
  // ============================================================
  getBestZone(playerLevel) {
    let best = 0;
    for (const zone of this.zones) {
      if (playerLevel >= zone.levelRange[0] && zone.id > best) best = zone.id;
    }
    return best;
  },

  // Bot checks if zone change is needed; returns portal target position or null
  botCheckZoneTravel(player) {
    if (!player || player.isDead) return null;
    if (this.fadeDir !== 0) return null;
    if (this.transitionCooldown > 0) return null;
    if (typeof dungeon !== 'undefined' && dungeon.active) return null;

    const bestZone = this.getBestZone(player.level);
    if (bestZone === this.currentZone) return null;

    // Find portal leading to best zone (or closer to it)
    const zone = this.zones[this.currentZone];
    if (!zone || !zone.portals) return null;

    // Direct portal to best zone
    let portal = zone.portals.find(p => p.targetZone === bestZone);
    // Or portal toward higher/lower zones
    if (!portal) {
      if (bestZone > this.currentZone) portal = zone.portals.find(p => p.targetZone > this.currentZone);
      else portal = zone.portals.find(p => p.targetZone < this.currentZone);
    }
    if (!portal) return null;

    return { x: portal.col * TILE + TILE / 2, y: portal.row * TILE + TILE / 2 };
  },

  // ============================================================
  // MINIMAP
  // ============================================================
  getZoneName() {
    const zone = this.zones[this.currentZone];
    return zone ? zone.name : 'Unknown';
  },

  getMinimapColor(tileId) {
    switch (tileId) {
      case 10: return '#d4b878'; // sand
      case 11: return '#b08050'; // sandstone
      case 12: return '#3a7a3a'; // cactus
      case 13: return '#3080b0'; // oasis
      case 14: return '#d0dae8'; // snow
      case 15: return '#a0c8e0'; // ice
      case 16: return '#506878'; // frozen tree
      case 17: return '#506070'; // mountain
      default: return null;
    }
  },

  // ============================================================
  // DUNGEON ZONE-AWARENESS
  // ============================================================
  getZoneDungeonConfig(zoneId) {
    const zone = this.zones[zoneId];
    if (!zone) return null;
    return zone.dungeonConfig || null;
  },

  // ============================================================
  // SAVE / LOAD
  // ============================================================
  save() {
    return {
      currentZone: this.currentZone,
      visitedZones: this.visitedZones.slice()
    };
  },

  load(data) {
    if (!data) return;
    if (typeof data.currentZone === 'number') {
      this.currentZone = data.currentZone;
    }
    if (Array.isArray(data.visitedZones)) {
      this.visitedZones = data.visitedZones;
    }
    // Regenerate zones and apply current
    this.generateZone(0);
    this.generateZone(1);
    this.generateZone(2);
    this._applyZoneTiles(this.currentZone);
    game.monsters = this.spawnZoneMonsters(this.currentZone);
  },

  // ============================================================
  // ICE TILE SPEED BONUS
  // ============================================================
  getSpeedMultiplier(entity) {
    if (this.currentZone !== 2) return 1;
    const tx = Math.floor(entity.x / TILE);
    const ty = Math.floor(entity.y / TILE);
    const t = map.getTile(tx, ty);
    if (t === 15) return 1.5; // ice tile
    return 1;
  }
};

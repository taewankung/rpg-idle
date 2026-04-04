// ============================================================
// DUNGEON — Procedural dungeon floors, boss fights, loot
// ============================================================

// --- DUNGEON MONSTER DATA ---
// Same format as MON_DATA: {hpR, atkR, def, spd, expR, goldR, lvR, zone, floors}
const DUNGEON_MON_DATA = {
  dark_slime:      { hpR:[60,90],   atkR:[10,14],  def:4,  spd:1.2, expR:[40,60],   goldR:[15,25],  lvR:[5,7],   floors:[1] },
  cave_bat:        { hpR:[45,70],   atkR:[12,16],  def:3,  spd:3.0, expR:[35,55],   goldR:[10,20],  lvR:[5,7],   floors:[1] },
  undead_warrior:  { hpR:[120,160], atkR:[18,24],  def:10, spd:1.8, expR:[70,100],  goldR:[25,40],  lvR:[8,10],  floors:[2] },
  ghost:           { hpR:[80,110],  atkR:[20,28],  def:5,  spd:2.5, expR:[80,110],  goldR:[20,35],  lvR:[8,10],  floors:[2] },
  fire_elemental:  { hpR:[150,200], atkR:[25,32],  def:12, spd:2.0, expR:[110,150], goldR:[35,55],  lvR:[11,13], floors:[3] },
  dark_mage:       { hpR:[100,140], atkR:[30,38],  def:8,  spd:2.2, expR:[120,160], goldR:[40,60],  lvR:[11,13], floors:[3] },
  demon_guard:     { hpR:[220,280], atkR:[32,40],  def:18, spd:1.5, expR:[160,220], goldR:[50,80],  lvR:[14,16], floors:[4] },
  shadow_assassin: { hpR:[140,180], atkR:[38,48],  def:10, spd:3.5, expR:[180,240], goldR:[55,85],  lvR:[14,16], floors:[4] },
  demon_lord:      { hpR:[1500,1500], atkR:[55,55], def:30, spd:2.0, expR:[1000,1000], goldR:[500,500], lvR:[20,20], floors:[5] }
};

// Rarity upgrade order for dungeon loot
const RARITY_ORDER = ['common','uncommon','rare','epic','legendary'];

// --- DUNGEON STATE ---
const dungeon = {
  active: false,        // true when player is inside dungeon
  floor: 1,             // current floor (1-5)
  maxFloor: 5,
  tiles: [],            // 20x20 dungeon tile grid
  rooms: [],            // generated rooms for current floor
  monsters: [],         // dungeon-only monsters
  stairsPos: null,      // {x,y} world coords of stairs down
  portalPos: null,      // overworld portal position (near town edge)
  exitPos: null,        // dungeon exit position (return to overworld)
  DG_W: 20, DG_H: 20,  // dungeon map size
  openedChests: new Set(), // track opened chest positions "x,y"
  savedOverworld: null,  // saved overworld state when entering
  bossPhase: 0,          // boss special attack tracking
  bossAoeTimer: 0,       // timer for boss AoE slam
  bossMinionsSpawned: false, // whether boss has summoned minions
  portalAnimTimer: 0,    // animation timer for portal glow
  transitionCooldown: 0, // prevents instant re-triggering of stairs/exit after floor change
  stairsUnlocked: false, // tracks whether "stairs unlocked" has been announced this floor
};

// Set portal position near town edge (right side of town)
// cx/cy from town.js = Math.floor(MAP_W/2), Math.floor(MAP_H/2)
(function initPortalPos() {
  const tcx = Math.floor(MAP_W / 2), tcy = Math.floor(MAP_H / 2);
  dungeon.portalPos = { x: (tcx + 6) * TILE + TILE / 2, y: tcy * TILE + TILE / 2 };
  console.log('Portal spawned at tile (' + (tcx + 6) + ', ' + tcy + ')');
})();


// ============================================================
// SPRITE GENERATION
// ============================================================
function generateDungeonSprites() {
  // --- Tile sprites ---
  genSprite('dg_floor', 32, 32, (c) => {
    c.fillStyle = '#2a2a2a'; c.fillRect(0, 0, 32, 32);
    // Stone texture
    c.fillStyle = '#333'; for (let i = 0; i < 8; i++) c.fillRect((i * 73) % 28 + 2, (i * 47) % 28 + 2, 3, 3);
    c.fillStyle = '#222'; for (let i = 0; i < 5; i++) c.fillRect((i * 59 + 3) % 28, (i * 41 + 7) % 28, 4, 2);
    // Tile border
    c.strokeStyle = '#1a1a1a'; c.lineWidth = 1; c.strokeRect(0.5, 0.5, 31, 31);
  });

  genSprite('dg_wall', 32, 32, (c) => {
    c.fillStyle = '#1a1a1a'; c.fillRect(0, 0, 32, 32);
    // Brick pattern
    c.fillStyle = '#222'; c.fillRect(1, 1, 14, 6); c.fillRect(17, 1, 14, 6);
    c.fillRect(8, 9, 14, 6); c.fillRect(24, 9, 7, 6); c.fillRect(1, 9, 5, 6);
    c.fillRect(1, 17, 14, 6); c.fillRect(17, 17, 14, 6);
    c.fillRect(8, 25, 14, 6); c.fillRect(24, 25, 7, 6); c.fillRect(1, 25, 5, 6);
    // Cracks
    c.strokeStyle = '#111'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(10, 5); c.lineTo(14, 10); c.lineTo(12, 16); c.stroke();
    c.beginPath(); c.moveTo(22, 20); c.lineTo(25, 26); c.stroke();
  });

  genSprite('dg_lava', 32, 32, (c) => {
    c.fillStyle = '#441100'; c.fillRect(0, 0, 32, 32);
    // Lava glow
    c.fillStyle = '#882200'; for (let i = 0; i < 6; i++) c.fillRect((i * 67) % 24 + 2, (i * 43) % 24 + 2, 8, 8);
    c.fillStyle = '#cc4400'; for (let i = 0; i < 4; i++) c.fillRect((i * 53 + 4) % 24 + 4, (i * 37 + 3) % 24 + 4, 5, 5);
    c.fillStyle = '#ff6600'; for (let i = 0; i < 3; i++) c.fillRect((i * 41 + 8) % 20 + 6, (i * 29 + 5) % 20 + 6, 3, 3);
  });

  genSprite('dg_chest', 16, 16, (c) => {
    // Brown chest body
    c.fillStyle = '#8B4513'; c.fillRect(2, 5, 12, 9);
    // Gold trim
    c.fillStyle = '#DAA520'; c.fillRect(2, 5, 12, 2); c.fillRect(2, 12, 12, 2);
    c.fillRect(6, 7, 4, 3); // Lock
    // Highlight
    c.fillStyle = '#A0522D'; c.fillRect(3, 7, 4, 4);
  });

  genSprite('dg_stairs', 32, 32, (c) => {
    c.fillStyle = '#2a2a2a'; c.fillRect(0, 0, 32, 32);
    // Steps going down
    for (let i = 0; i < 5; i++) {
      const shade = 60 - i * 10;
      c.fillStyle = `rgb(${shade},${shade},${shade})`;
      c.fillRect(4, 4 + i * 5, 24, 5);
      c.fillStyle = `rgb(${shade - 20},${shade - 20},${shade - 20})`;
      c.fillRect(4, 4 + i * 5, 24, 1);
    }
    // Arrow indicator
    c.fillStyle = '#888'; c.beginPath();
    c.moveTo(16, 28); c.lineTo(12, 24); c.lineTo(20, 24); c.fill();
  });

  genSprite('dg_portal', 32, 32, (c) => {
    // Purple glowing circle
    const grd = c.createRadialGradient(16, 16, 2, 16, 16, 14);
    grd.addColorStop(0, '#ff88ff'); grd.addColorStop(0.5, '#8833cc'); grd.addColorStop(1, 'transparent');
    c.fillStyle = grd; c.fillRect(0, 0, 32, 32);
    // Center bright spot
    c.fillStyle = '#eeccff'; c.beginPath(); c.arc(16, 16, 4, 0, Math.PI * 2); c.fill();
  });

  genSprite('dg_exit', 32, 32, (c) => {
    // Blue glowing portal
    const grd = c.createRadialGradient(16, 16, 2, 16, 16, 14);
    grd.addColorStop(0, '#88ccff'); grd.addColorStop(0.5, '#3366cc'); grd.addColorStop(1, 'transparent');
    c.fillStyle = grd; c.fillRect(0, 0, 32, 32);
    // Center
    c.fillStyle = '#ccddff'; c.beginPath(); c.arc(16, 16, 4, 0, Math.PI * 2); c.fill();
  });

  // --- Dungeon monster sprites ---
  genSprite('mon_dark_slime', 24, 24, (c) => {
    // Dark purple blob
    c.fillStyle = '#4a1166';
    c.beginPath(); c.ellipse(12, 16, 10, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#6622aa';
    c.beginPath(); c.ellipse(12, 14, 8, 6, 0, 0, Math.PI * 2); c.fill();
    // Eyes
    c.fillStyle = '#ff44ff'; c.fillRect(8, 12, 3, 3); c.fillRect(14, 12, 3, 3);
  });

  genSprite('mon_cave_bat', 24, 24, (c) => {
    // Brown wings
    c.fillStyle = '#5a3a1a';
    // Left wing
    c.beginPath(); c.moveTo(12, 12); c.lineTo(1, 6); c.lineTo(3, 14); c.fill();
    // Right wing
    c.beginPath(); c.moveTo(12, 12); c.lineTo(23, 6); c.lineTo(21, 14); c.fill();
    // Body
    c.fillStyle = '#3d2810'; c.beginPath(); c.ellipse(12, 12, 4, 5, 0, 0, Math.PI * 2); c.fill();
    // Eyes
    c.fillStyle = '#ff4444'; c.fillRect(10, 10, 2, 2); c.fillRect(14, 10, 2, 2);
  });

  genSprite('mon_undead_warrior', 24, 32, (c) => {
    // Gray humanoid
    c.fillStyle = '#666'; c.fillRect(9, 2, 6, 6); // Head
    c.fillStyle = '#555'; c.fillRect(7, 8, 10, 12); // Body
    c.fillStyle = '#444'; c.fillRect(5, 10, 3, 8); c.fillRect(16, 10, 3, 8); // Arms
    c.fillRect(8, 20, 4, 8); c.fillRect(12, 20, 4, 8); // Legs
    // Sword
    c.fillStyle = '#aaa'; c.fillRect(19, 6, 2, 14);
    c.fillStyle = '#888'; c.fillRect(18, 12, 4, 2); // Crossguard
    // Eyes
    c.fillStyle = '#ff2222'; c.fillRect(10, 4, 2, 2); c.fillRect(13, 4, 2, 2);
  });

  genSprite('mon_ghost', 24, 28, (c) => {
    // Translucent white shape
    c.globalAlpha = 0.7;
    c.fillStyle = '#ddeeff';
    c.beginPath(); c.ellipse(12, 10, 8, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillRect(4, 10, 16, 12);
    // Wavy bottom
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.arc(6 + i * 4, 22, 2, 0, Math.PI); c.fill();
    }
    c.globalAlpha = 1;
    // Eyes
    c.fillStyle = '#112244'; c.fillRect(8, 8, 3, 4); c.fillRect(14, 8, 3, 4);
  });

  genSprite('mon_fire_elemental', 24, 28, (c) => {
    // Orange/red flame shape
    c.fillStyle = '#cc3300';
    c.beginPath(); c.moveTo(12, 1); c.lineTo(4, 20); c.lineTo(20, 20); c.fill();
    c.fillStyle = '#ff6600';
    c.beginPath(); c.moveTo(12, 5); c.lineTo(6, 18); c.lineTo(18, 18); c.fill();
    c.fillStyle = '#ffaa00';
    c.beginPath(); c.moveTo(12, 9); c.lineTo(8, 16); c.lineTo(16, 16); c.fill();
    // Eyes
    c.fillStyle = '#fff'; c.fillRect(9, 12, 2, 2); c.fillRect(14, 12, 2, 2);
  });

  genSprite('mon_dark_mage', 24, 32, (c) => {
    // Dark robed figure
    c.fillStyle = '#1a0033';
    // Robe body
    c.beginPath(); c.moveTo(12, 6); c.lineTo(4, 28); c.lineTo(20, 28); c.fill();
    // Hood
    c.fillStyle = '#220044';
    c.beginPath(); c.arc(12, 8, 6, 0, Math.PI * 2); c.fill();
    // Face shadow
    c.fillStyle = '#000'; c.fillRect(8, 6, 8, 5);
    // Glowing eyes
    c.fillStyle = '#ff00ff'; c.fillRect(9, 7, 2, 2); c.fillRect(13, 7, 2, 2);
    // Staff
    c.fillStyle = '#553300'; c.fillRect(20, 4, 2, 22);
    c.fillStyle = '#aa00ff'; c.beginPath(); c.arc(21, 4, 3, 0, Math.PI * 2); c.fill();
  });

  genSprite('mon_demon_guard', 24, 32, (c) => {
    // Red armored figure
    c.fillStyle = '#881111'; c.fillRect(9, 2, 6, 6); // Head
    c.fillStyle = '#aa2222'; c.fillRect(6, 8, 12, 14); // Body armor
    c.fillStyle = '#771111'; c.fillRect(3, 10, 4, 10); c.fillRect(17, 10, 4, 10); // Arms
    c.fillRect(7, 22, 5, 8); c.fillRect(12, 22, 5, 8); // Legs
    // Horns
    c.fillStyle = '#440000'; c.fillRect(8, 0, 2, 4); c.fillRect(14, 0, 2, 4);
    // Eyes
    c.fillStyle = '#ffff00'; c.fillRect(10, 3, 2, 2); c.fillRect(13, 3, 2, 2);
  });

  genSprite('mon_shadow_assassin', 24, 32, (c) => {
    // Black hooded figure
    c.fillStyle = '#111';
    // Hood
    c.beginPath(); c.arc(12, 7, 6, 0, Math.PI * 2); c.fill();
    // Body
    c.fillRect(7, 10, 10, 14);
    // Cloak edges
    c.fillStyle = '#222'; c.fillRect(5, 12, 3, 10); c.fillRect(16, 12, 3, 10);
    c.fillRect(8, 24, 4, 6); c.fillRect(12, 24, 4, 6);
    // Eyes
    c.fillStyle = '#00ff88'; c.fillRect(9, 5, 2, 2); c.fillRect(13, 5, 2, 2);
    // Daggers
    c.fillStyle = '#888'; c.fillRect(3, 16, 1, 8); c.fillRect(20, 16, 1, 8);
  });

  genSprite('mon_demon_lord', 64, 64, (c) => {
    // Large red demon with horns
    // Body
    c.fillStyle = '#881111'; c.fillRect(20, 18, 24, 30);
    // Head
    c.fillStyle = '#aa1111'; c.fillRect(22, 6, 20, 14);
    // Horns
    c.fillStyle = '#440000';
    c.beginPath(); c.moveTo(22, 8); c.lineTo(14, 0); c.lineTo(24, 8); c.fill();
    c.beginPath(); c.moveTo(42, 8); c.lineTo(50, 0); c.lineTo(40, 8); c.fill();
    // Eyes
    c.fillStyle = '#ffff00'; c.fillRect(26, 10, 4, 4); c.fillRect(34, 10, 4, 4);
    c.fillStyle = '#ff0000'; c.fillRect(27, 11, 2, 2); c.fillRect(35, 11, 2, 2);
    // Mouth
    c.fillStyle = '#330000'; c.fillRect(28, 16, 8, 3);
    c.fillStyle = '#fff'; // Fangs
    c.fillRect(29, 16, 2, 2); c.fillRect(33, 16, 2, 2);
    // Arms
    c.fillStyle = '#771111';
    c.fillRect(10, 22, 10, 8); c.fillRect(44, 22, 10, 8); // Upper arms
    c.fillRect(8, 28, 6, 12); c.fillRect(50, 28, 6, 12); // Forearms
    // Claws
    c.fillStyle = '#440000';
    c.fillRect(7, 38, 2, 4); c.fillRect(10, 38, 2, 4); c.fillRect(13, 38, 2, 4);
    c.fillRect(49, 38, 2, 4); c.fillRect(52, 38, 2, 4); c.fillRect(55, 38, 2, 4);
    // Legs
    c.fillStyle = '#661111';
    c.fillRect(22, 48, 8, 14); c.fillRect(34, 48, 8, 14);
    // Chest plate
    c.fillStyle = '#aa4400';
    c.fillRect(24, 22, 16, 8);
    c.fillStyle = '#cc6600'; c.fillRect(28, 24, 8, 4);
    // Wings (dark)
    c.fillStyle = 'rgba(40,0,0,0.8)';
    c.beginPath(); c.moveTo(20, 20); c.lineTo(2, 8); c.lineTo(6, 30); c.fill();
    c.beginPath(); c.moveTo(44, 20); c.lineTo(62, 8); c.lineTo(58, 30); c.fill();
  });
}


// ============================================================
// DUNGEON FLOOR GENERATION
// ============================================================
dungeon.generateFloor = function(floor) {
  const W = this.DG_W, H = this.DG_H;

  // Initialize all tiles as walls
  this.tiles = [];
  for (let y = 0; y < H; y++) {
    this.tiles[y] = [];
    for (let x = 0; x < W; x++) this.tiles[y][x] = 1;
  }

  this.rooms = [];
  this.monsters = [];
  this.openedChests = new Set();
  this.stairsPos = null;
  this.exitPos = null;
  this.stairsUnlocked = false;

  // --- Place 4-6 random rooms ---
  const numRooms = ri(4, 6);
  for (let i = 0; i < numRooms; i++) {
    const rw = ri(4, 7), rh = ri(4, 7);
    let rx, ry, placed = false;
    for (let att = 0; att < 30; att++) {
      rx = ri(1, W - rw - 1);
      ry = ri(1, H - rh - 1);
      // Check no overlap with existing rooms (with 1-tile margin)
      let overlap = false;
      for (const room of this.rooms) {
        if (rx - 1 < room.x + room.w && rx + rw + 1 > room.x &&
            ry - 1 < room.y + room.h && ry + rh + 1 > room.y) {
          overlap = true; break;
        }
      }
      if (!overlap) { placed = true; break; }
    }
    if (!placed) continue;

    // Carve room
    for (let dy = 0; dy < rh; dy++)
      for (let dx = 0; dx < rw; dx++)
        this.tiles[ry + dy][rx + dx] = 0;

    this.rooms.push({ x: rx, y: ry, w: rw, h: rh,
      cx: Math.floor(rx + rw / 2), cy: Math.floor(ry + rh / 2) });
  }

  // --- Connect rooms with corridors ---
  for (let i = 1; i < this.rooms.length; i++) {
    const a = this.rooms[i - 1], b = this.rooms[i];
    let cx = a.cx, cy = a.cy;
    const tx = b.cx, ty = b.cy;
    // Horizontal then vertical (or random order)
    const hFirst = Math.random() < 0.5;
    if (hFirst) {
      while (cx !== tx) { cx += cx < tx ? 1 : -1; if (cx >= 0 && cx < W) this.tiles[cy][cx] = 0; }
      while (cy !== ty) { cy += cy < ty ? 1 : -1; if (cy >= 0 && cy < H) this.tiles[cy][cx] = 0; }
    } else {
      while (cy !== ty) { cy += cy < ty ? 1 : -1; if (cy >= 0 && cy < H) this.tiles[cy][cx] = 0; }
      while (cx !== tx) { cx += cx < tx ? 1 : -1; if (cx >= 0 && cx < W) this.tiles[cy][cx] = 0; }
    }
    // Widen some corridors to 2 tiles
    if (Math.random() < 0.4) {
      cx = a.cx; cy = a.cy;
      if (hFirst) {
        while (cx !== tx) { cx += cx < tx ? 1 : -1; if (cy + 1 < H) this.tiles[cy + 1][cx] = 0; }
      } else {
        while (cy !== ty) { cy += cy < ty ? 1 : -1; if (cx + 1 < W) this.tiles[cy][cx + 1] = 0; }
      }
    }
  }

  // --- Scatter lava pools (never in spawn room or near room centers/stairs) ---
  const spawnRoomForLava = this.rooms[0];
  const numLava = ri(2, 4);
  for (let i = 0; i < numLava; i++) {
    const lx = ri(2, W - 3), ly = ri(2, H - 3);
    const ls = ri(2, 3); // cluster size
    for (let dy = 0; dy < ls; dy++)
      for (let dx = 0; dx < ls; dx++) {
        const tx = lx + dx, ty = ly + dy;
        if (tx < W && ty < H && this.tiles[ty][tx] === 0) {
          // Don't place lava in spawn room (room 0)
          if (tx >= spawnRoomForLava.x && tx < spawnRoomForLava.x + spawnRoomForLava.w &&
              ty >= spawnRoomForLava.y && ty < spawnRoomForLava.y + spawnRoomForLava.h) continue;
          // Don't place lava within 2 tiles of any room center
          let nearCenter = false;
          for (const r of this.rooms) {
            if (Math.abs(tx - r.cx) <= 1 && Math.abs(ty - r.cy) <= 1) { nearCenter = true; break; }
          }
          if (!nearCenter) this.tiles[ty][tx] = 2;
        }
      }
  }

  // --- Ensure lava doesn't block connectivity between rooms ---
  this._ensureConnectivity();

  // --- Place treasure chests in rooms (1-3) ---
  const numChests = ri(1, 3);
  const chestRooms = this.rooms.slice().sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(numChests, chestRooms.length); i++) {
    const room = chestRooms[i];
    // Place chest at random position in room (not center, to keep path clear)
    let cx, cy;
    for (let att = 0; att < 10; att++) {
      cx = ri(room.x + 1, room.x + room.w - 2);
      cy = ri(room.y + 1, room.y + room.h - 2);
      if (this.tiles[cy][cx] === 0 && !(cx === room.cx && cy === room.cy)) {
        this.tiles[cy][cx] = 3;
        break;
      }
    }
  }

  // --- Place stairs (not on floor 5) ---
  if (floor < this.maxFloor) {
    // Stairs in the farthest room from room 0
    const spawnRoom = this.rooms[0];
    let farthest = this.rooms[this.rooms.length - 1];
    let maxDist = 0;
    for (let i = 1; i < this.rooms.length; i++) {
      const d = Math.abs(this.rooms[i].cx - spawnRoom.cx) + Math.abs(this.rooms[i].cy - spawnRoom.cy);
      if (d > maxDist) { maxDist = d; farthest = this.rooms[i]; }
    }
    // Guarantee 3x3 walkable area around stairs
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const sx = farthest.cx + dx, sy = farthest.cy + dy;
        if (sx >= 0 && sx < W && sy >= 0 && sy < H && this.tiles[sy][sx] !== 0) this.tiles[sy][sx] = 0;
      }
    this.stairsPos = { x: farthest.cx * TILE + TILE / 2, y: farthest.cy * TILE + TILE / 2 };
  }

  // --- Place exit portal in a CORNER of spawn room (not center, to avoid bot pathing through it) ---
  const spawnRoom = this.rooms[0];
  // Pick top-left corner of spawn room for exit portal
  const exitTX = spawnRoom.x + 1;
  const exitTY = spawnRoom.y + 1;
  // Guarantee 3x3 walkable area around exit portal
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const sx = exitTX + dx, sy = exitTY + dy;
      if (sx >= 0 && sx < W && sy >= 0 && sy < H && this.tiles[sy][sx] !== 0) this.tiles[sy][sx] = 0;
    }
  this.exitPos = { x: exitTX * TILE + TILE / 2, y: exitTY * TILE + TILE / 2 };

  // --- Guarantee 3x3 walkable area around spawn room center ---
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const sx = spawnRoom.cx + dx, sy = spawnRoom.cy + dy;
      if (sx >= 0 && sx < W && sy >= 0 && sy < H) this.tiles[sy][sx] = 0;
    }

  // --- Find safe player spawn: room center, guaranteed far from exit portal and stairs ---
  let spawnTX = spawnRoom.cx, spawnTY = spawnRoom.cy;
  // If spawn is on exit tile, move to opposite side of room
  if (spawnTX === exitTX && spawnTY === exitTY) {
    spawnTX = spawnRoom.x + spawnRoom.w - 2;
    spawnTY = spawnRoom.y + spawnRoom.h - 2;
  }
  // If spawn is on stairs tile, nudge away
  if (this.stairsPos) {
    const stairsTX = Math.floor(this.stairsPos.x / TILE);
    const stairsTY = Math.floor(this.stairsPos.y / TILE);
    if (spawnTX === stairsTX && spawnTY === stairsTY) {
      spawnTX = spawnRoom.cx;
      spawnTY = spawnRoom.cy + 1;
    }
  }
  // Final walkability check with outward scan fallback
  if (!this.isWalkable(spawnTX, spawnTY)) {
    for (let r = 1; r < 10; r++) {
      let found = false;
      for (let dy = -r; dy <= r && !found; dy++)
        for (let dx = -r; dx <= r && !found; dx++) {
          const tx = spawnRoom.cx + dx, ty = spawnRoom.cy + dy;
          if (this.isWalkable(tx, ty) && !(tx === exitTX && ty === exitTY)) {
            spawnTX = tx; spawnTY = ty; found = true;
          }
        }
      if (found) break;
    }
  }

  // --- Spawn dungeon monsters ---
  this._spawnFloorMonsters(floor);

  // --- Validate path from spawn to stairs (regenerate if impossible) ---
  if (this.stairsPos) {
    const testPath = this.findPath(
      spawnTX * TILE + TILE / 2, spawnTY * TILE + TILE / 2,
      this.stairsPos.x, this.stairsPos.y, 25
    );
    if (testPath === null) {
      console.log('Dungeon floor ' + floor + ': no path from spawn to stairs, regenerating...');
      return this.generateFloor(floor);
    }
  }

  // --- Set player position ---
  const p = game.player;
  if (p) {
    p.x = spawnTX * TILE + TILE / 2;
    p.y = spawnTY * TILE + TILE / 2;
    p._path = null; p._pathIdx = 0;
    console.log('DUNGEON: Floor', floor, 'spawn at tile (' + spawnTX + ',' + spawnTY + ') walkable:', this.isWalkable(spawnTX, spawnTY),
      'exit at (' + exitTX + ',' + exitTY + ')',
      this.stairsPos ? 'stairs at (' + Math.floor(this.stairsPos.x/TILE) + ',' + Math.floor(this.stairsPos.y/TILE) + ')' : 'no stairs (boss floor)');
  }
};

// Spawn monsters appropriate for the floor
dungeon._spawnFloorMonsters = function(floor) {
  // Get monster types for this floor
  const floorTypes = [];
  for (const [type, data] of Object.entries(DUNGEON_MON_DATA)) {
    if (data.floors.includes(floor)) floorTypes.push(type);
  }
  if (floorTypes.length === 0) return;

  // Floor 5: just the boss
  if (floor === 5) {
    // Find farthest room for boss placement
    const spawnRoom = this.rooms[0];
    let bossRoom = this.rooms[this.rooms.length - 1];
    let maxDist = 0;
    for (let i = 1; i < this.rooms.length; i++) {
      const d = Math.abs(this.rooms[i].cx - spawnRoom.cx) + Math.abs(this.rooms[i].cy - spawnRoom.cy);
      if (d > maxDist) { maxDist = d; bossRoom = this.rooms[i]; }
    }
    const boss = createDungeonMon('demon_lord', bossRoom.cx * TILE + TILE / 2, bossRoom.cy * TILE + TILE / 2, floor);
    this.monsters.push(boss);
    this.bossPhase = 0;
    this.bossAoeTimer = 5;
    this.bossMinionsSpawned = false;
    return;
  }

  // Regular floors: 6-10 monsters
  const count = ri(6, 10);
  for (let i = 0; i < count; i++) {
    const type = floorTypes[ri(0, floorTypes.length - 1)];
    // Pick a random room (not spawn room)
    const roomIdx = ri(1, this.rooms.length - 1);
    const room = this.rooms[roomIdx];
    // Find a walkable tile within this room
    let sx, sy, placed = false;
    for (let att = 0; att < 15; att++) {
      const tx = ri(room.x, room.x + room.w - 1);
      const ty = ri(room.y, room.y + room.h - 1);
      if (dungeon.isWalkable(tx, ty)) {
        sx = tx * TILE + TILE / 2;
        sy = ty * TILE + TILE / 2;
        placed = true; break;
      }
    }
    if (!placed) { sx = room.cx * TILE + TILE / 2; sy = room.cy * TILE + TILE / 2; }
    this.monsters.push(createDungeonMon(type, sx, sy, floor));
  }
};


// ============================================================
// ENTER / EXIT / NEXT FLOOR
// ============================================================
dungeon.enterDungeon = function() {
  const p = game.player;
  if (!p || p.level < 5) {
    addNotification('Requires Level 5 to enter dungeon!', '#FF4444');
    return false;
  }

  // Save overworld state
  this.savedOverworld = {
    playerX: p.x,
    playerY: p.y,
    monsters: game.monsters,
    playerPath: p._path,
    playerPathIdx: p._pathIdx
  };

  this.active = true;
  this.floor = 1;
  this.transitionCooldown = 1.5; // Prevent instant stairs/exit trigger
  this.generateFloor(1);

  // Swap to dungeon monsters
  game.monsters = this.monsters;

  // Reset bot state so it picks up dungeon targets fresh
  botAI.state='idle';botAI.target=null;botAI.stuckTimer=0;

  console.log('DUNGEON: entering floor 1');
  addNotification('Entered the Dungeon! Floor 1/' + this.maxFloor, '#AA44FF');
  addLog('You descend into the dark dungeon...', '#AA44FF');
  sfx.spell();
  if(typeof achievementSystem!=='undefined')achievementSystem.onDungeonEnter();
  return true;
};

dungeon.exitDungeon = function() {
  if (!this.active) return;
  console.log('DUNGEON: exiting to overworld from floor', this.floor);
  const p = game.player;

  // Restore overworld state
  if (this.savedOverworld) {
    p.x = this.savedOverworld.playerX;
    p.y = this.savedOverworld.playerY;
    game.monsters = this.savedOverworld.monsters;
    p._path = null; p._pathIdx = 0;
    this.savedOverworld = null;
  }

  this.active = false;
  this.floor = 1;
  this.tiles = [];
  this.monsters = [];
  this.rooms = [];
  this.stairsPos = null;
  this.exitPos = null;
  this.openedChests = new Set();
  this.bossPhase = 0;
  this.transitionCooldown = 0;

  // Reset bot state for overworld
  botAI.state='idle';botAI.target=null;botAI.stuckTimer=0;

  addNotification('Returned to the overworld.', '#88CCFF');
  addLog('You emerge from the dungeon.', '#88CCFF');
};

dungeon.nextFloor = function() {
  const p = game.player;
  const prevFloor = this.floor;
  this.floor++;

  if (this.floor > this.maxFloor) {
    // Completed dungeon — only exit here
    console.log('DUNGEON: boss defeated on floor', prevFloor, '- dungeon cleared!');
    addNotification('Dungeon Cleared!', '#FFD700');
    sfx.victoryFanfare();
    this.exitDungeon();
    return;
  }

  console.log('DUNGEON: entering floor', this.floor);
  this.transitionCooldown = 1.5; // Prevent instant stairs/exit trigger on new floor
  this.generateFloor(this.floor);
  game.monsters = this.monsters;

  // Reset bot state for new floor
  botAI.state='idle';botAI.target=null;botAI.stuckTimer=0;

  // Refill 20% HP/MP
  if (p) {
    p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.2));
    p.mp = Math.min(p.maxMp, p.mp + Math.round(p.maxMp * 0.2));
  }

  if(typeof achievementSystem!=='undefined')achievementSystem.onDungeonFloorClear(prevFloor);
  addNotification('Floor ' + this.floor + '/' + this.maxFloor, '#AA44FF');
  addLog('Descended to floor ' + this.floor + '.', '#AA44FF');
  sfx.spell();
};


// ============================================================
// DUNGEON PATHFINDING & WALKABILITY
// ============================================================
dungeon.isWalkable = function(x, y) {
  if (x < 0 || x >= this.DG_W || y < 0 || y >= this.DG_H) return false;
  const t = this.tiles[y][x];
  return t === 0 || t === 3; // floor and chests are walkable
};

dungeon.getTile = function(x, y) {
  if (x < 0 || x >= this.DG_W || y < 0 || y >= this.DG_H) return -1;
  return this.tiles[y][x];
};

// A* pathfinding within dungeon grid (mirrors map.findPath logic)
dungeon.findPath = function(wx1, wy1, wx2, wy2, maxR) {
  maxR = maxR || 20;
  const W = this.DG_W, H = this.DG_H;
  const sx = Math.floor(wx1 / TILE), sy = Math.floor(wy1 / TILE);
  const ex = Math.floor(wx2 / TILE), ey = Math.floor(wy2 / TILE);

  if (sx === ex && sy === ey) return [];
  if (!this.isWalkable(ex, ey)) {
    // Find nearest walkable tile to target
    let best = null, bd = Infinity;
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const nx = ex + dx, ny = ey + dy;
        if (this.isWalkable(nx, ny)) {
          const d = Math.abs(dx) + Math.abs(dy);
          if (d < bd) { bd = d; best = { x: nx, y: ny }; }
        }
      }
    if (!best) return null;
    return this.findPath(wx1, wy1, best.x * TILE + TILE / 2, best.y * TILE + TILE / 2, maxR);
  }
  if (Math.abs(sx - ex) > maxR || Math.abs(sy - ey) > maxR) return null;

  const key = (x, y) => x + y * W;
  const open = [];
  const gMap = new Map();
  const parent = new Map();
  const closed = new Set();

  const h = (x, y) => Math.abs(x - ex) + Math.abs(y - ey);
  open.push({ x: sx, y: sy, g: 0, f: h(sx, sy) });
  gMap.set(key(sx, sy), 0);

  const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
  const dirCost = [1,1,1,1,1.41,1.41,1.41,1.41];

  let iters = 0;
  const maxIters = maxR * maxR * 8;
  const self = this;

  while (open.length > 0 && iters++ < maxIters) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) { if (open[i].f < open[bi].f) bi = i; }
    const cur = open[bi];
    open[bi] = open[open.length - 1]; open.pop();

    const ck = key(cur.x, cur.y);
    if (closed.has(ck)) continue;
    closed.add(ck);

    if (cur.x === ex && cur.y === ey) {
      // Reconstruct path
      const path = [];
      let k = key(ex, ey);
      while (k !== key(sx, sy)) {
        const px = k % W, py = Math.floor(k / W);
        path.push({ x: px * TILE + TILE / 2, y: py * TILE + TILE / 2 });
        k = parent.get(k);
        if (k === undefined) break;
      }
      path.reverse();
      return path;
    }

    for (let d = 0; d < 8; d++) {
      const nx = cur.x + dirs[d][0], ny = cur.y + dirs[d][1];
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      if (!self.isWalkable(nx, ny)) continue;
      const nk = key(nx, ny);
      if (closed.has(nk)) continue;
      // Diagonal corner-cutting check
      if (d >= 4) {
        if (!self.isWalkable(cur.x + dirs[d][0], cur.y) || !self.isWalkable(cur.x, cur.y + dirs[d][1])) continue;
      }
      if (Math.abs(nx - sx) > maxR || Math.abs(ny - sy) > maxR) continue;

      const ng = cur.g + dirCost[d];
      const prev = gMap.get(nk);
      if (prev !== undefined && ng >= prev) continue;
      gMap.set(nk, ng);
      parent.set(nk, ck);
      open.push({ x: nx, y: ny, g: ng, f: ng + h(nx, ny) });
    }
  }
  return null;
};

// Ensure all rooms, stairs, and exit remain reachable after lava placement.
// Flood-fills from spawn room; iteratively removes blocking lava until connected.
dungeon._ensureConnectivity = function() {
  const W = this.DG_W, H = this.DG_H;
  if (this.rooms.length === 0) return;
  const spawnRoom = this.rooms[0];
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  const key = (x, y) => x + y * W;

  // Collect all tiles that must be reachable
  const targets = [];
  for (const room of this.rooms) targets.push(key(room.cx, room.cy));
  if (this.stairsPos) targets.push(key(Math.floor(this.stairsPos.x / TILE), Math.floor(this.stairsPos.y / TILE)));
  if (this.exitPos) {
    const etx = Math.floor(this.exitPos.x / TILE), ety = Math.floor(this.exitPos.y / TILE);
    targets.push(key(etx, ety));
  }

  for (let iter = 0; iter < 30; iter++) {
    // BFS flood fill from spawn room center
    const reachable = new Set();
    const queue = [[spawnRoom.cx, spawnRoom.cy]];
    reachable.add(key(spawnRoom.cx, spawnRoom.cy));

    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      for (const [dx, dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
        const nk = key(nx, ny);
        if (reachable.has(nk)) continue;
        if (this.isWalkable(nx, ny)) { reachable.add(nk); queue.push([nx, ny]); }
      }
    }

    // All targets reachable? Done.
    if (targets.every(t => reachable.has(t))) return;

    // Remove all lava tiles adjacent to reachable area (peel one layer)
    let removed = false;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (this.tiles[y][x] !== 2) continue;
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H && reachable.has(key(nx, ny))) {
            this.tiles[y][x] = 0;
            removed = true;
            break;
          }
        }
      }
    }
    if (!removed) break; // No adjacent lava to remove — unreachable for other reasons
  }
};

// Find a random walkable tile within dungeon
dungeon.findRandomWalkable = function(wx, wy, minR, maxR) {
  const cx = Math.floor(wx / TILE), cy = Math.floor(wy / TILE);
  for (let att = 0; att < 20; att++) {
    const a = Math.random() * Math.PI * 2;
    const r = minR + Math.random() * (maxR - minR);
    const tx = Math.round(cx + Math.cos(a) * r);
    const ty = Math.round(cy + Math.sin(a) * r);
    if (tx >= 0 && tx < this.DG_W && ty >= 0 && ty < this.DG_H && this.isWalkable(tx, ty)) {
      return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
    }
  }
  return null;
};


// ============================================================
// DUNGEON MONSTER CREATION
// ============================================================
function createDungeonMon(type, sx, sy, floor) {
  const d = DUNGEON_MON_DATA[type];
  if (!d) return null;
  const lv = ri(d.lvR[0], d.lvR[1]);
  let hp = ri(d.hpR[0], d.hpR[1]);
  let atk = ri(d.atkR[0], d.atkR[1]);
  let def = d.def;

  // Scale stats per floor
  const floorMult = 1 + (floor - 1) * 0.15;
  hp = Math.round(hp * floorMult);
  atk = Math.round(atk * floorMult);
  def = Math.round(def * floorMult);
  if(type==='demon_lord'&&typeof progressionSystem!=='undefined'){
    hp = Math.round(hp * progressionSystem.getBossHpMultiplier('dungeonBoss'));
  }
  const goldMul=(type==='demon_lord'&&typeof progressionSystem!=='undefined')?progressionSystem.getBossGoldMultiplier('dungeonBoss'):1;

  return {
    entityType: 'monster', type, level: lv,
    hp, maxHp: hp, atk, def, spd: d.spd,
    expReward: ri(d.expR[0], d.expR[1]),
    goldReward: Math.round(ri(d.goldR[0], d.goldR[1]) * goldMul),
    x: sx, y: sy, dir: 'down', frame: 0, animTimer: 0,
    state: 'patrol',
    patrolCenter: { x: sx, y: sy },
    patrolAngle: Math.random() * Math.PI * 2,
    target: null, respawnTimer: 0, attackTimer: 0,
    aggroRange: TILE * 5, attackRange: TILE * 1.2,
    slowTimer: 0, isDead: false,
    isDungeon: true,  // flag to identify dungeon monsters
    isBoss: type === 'demon_lord'
  };
}


// ============================================================
// DUNGEON UPDATE (per-frame)
// ============================================================
dungeon.update = function(dt) {
  if (!this.active) return;
  const p = game.player;
  if (!p || p.isDead) return;

  // Update portal animation timer
  this.portalAnimTimer += dt;

  // Transition cooldown — prevents instant re-triggering after floor change
  if (this.transitionCooldown > 0) this.transitionCooldown -= dt;

  // --- Update dungeon monsters ---
  for (const m of this.monsters) {
    if (m.isDead) {
      // Dungeon monsters don't respawn
      continue;
    }
    this._updateDungeonMonster(m, dt);
  }

  // --- Boss special attacks ---
  const boss = this.monsters.find(m => m.isBoss && !m.isDead);
  if (boss) {
    // AoE slam every 5 seconds
    this.bossAoeTimer -= dt;
    if (this.bossAoeTimer <= 0) {
      this.bossAoeTimer = 5;
      this._bossAoeSlam(boss);
    }
    // Summon minions at 50% HP
    if (!this.bossMinionsSpawned && boss.hp <= boss.maxHp * 0.5) {
      this.bossMinionsSpawned = true;
      this._bossSummonMinions(boss);
    }
  }

  // Skip stairs/exit checks during transition cooldown
  if (this.transitionCooldown > 0) return;

  // --- Check if player reaches stairs (only when all monsters dead) ---
  if (this.stairsPos) {
    const alive = this.monsters.filter(m => !m.isDead);
    if (alive.length === 0) {
      if (!this.stairsUnlocked) {
        this.stairsUnlocked = true;
        console.log('DUNGEON: all monsters dead on floor', this.floor, '- stairs unlocked');
        addNotification('All monsters defeated! Stairs unlocked.', '#FFD700');
      }
      const sd = Math.hypot(p.x - this.stairsPos.x, p.y - this.stairsPos.y);
      if (sd < TILE * 1.2) {
        console.log('STAIRS: going from floor', this.floor, 'to floor', this.floor + 1);
        this.nextFloor();
        return;
      }
    }
  }

  // --- Floor 5 boss defeated: trigger dungeon clear ---
  if (this.floor === this.maxFloor && !this.stairsPos) {
    const alive = this.monsters.filter(m => !m.isDead);
    if (alive.length === 0 && !this.stairsUnlocked) {
      this.stairsUnlocked = true; // reuse flag to prevent repeat
      console.log('DUNGEON: boss defeated on floor', this.floor, '- dungeon cleared!');
      addNotification('Dungeon Cleared!', '#FFD700');
      sfx.victoryFanfare();
      if(typeof achievementSystem!=='undefined')achievementSystem.onDungeonFloorClear(this.floor);
      if(typeof guildSystem!=='undefined'&&guildSystem.onDungeonClear)guildSystem.onDungeonClear(this.floor);
      // Drop Enhancement Stone from boss
      if(typeof enchantSystem!=='undefined'&&game.player){const stone={name:'Enhancement Stone',type:'material',matKey:'enhance_stone',rarity:'uncommon',stats:{},level:1,value:50};game.itemDrops.push({item:stone,x:game.player.x+rf(-16,16),y:game.player.y+rf(-16,16),timer:60});addNotification('Enhancement Stone dropped!','#4FC3F7');console.log('Enhancement Stone dropped from boss')}
    }
  }

  // --- Check if player reaches exit portal ---
  if (this.exitPos) {
    const ed = Math.hypot(p.x - this.exitPos.x, p.y - this.exitPos.y);
    if (ed < TILE * 1.0) {
      console.log('DUNGEON: exiting to overworld from floor', this.floor);
      this.exitDungeon();
      return;
    }
  }

  // --- Check treasure chest interaction ---
  const ptx = Math.floor(p.x / TILE), pty = Math.floor(p.y / TILE);
  if (ptx >= 0 && ptx < this.DG_W && pty >= 0 && pty < this.DG_H) {
    if (this.tiles[pty][ptx] === 3) {
      const chestKey = ptx + ',' + pty;
      if (!this.openedChests.has(chestKey)) {
        this.openedChests.add(chestKey);
        this.tiles[pty][ptx] = 0; // Remove chest tile

        // Generate random item with +1 rarity tier
        const item = genItem(p.level + this.floor * 2);
        if (item) {
          // Upgrade rarity by 1 tier
          const rIdx = RARITY_ORDER.indexOf(item.rarity);
          if (rIdx >= 0 && rIdx < RARITY_ORDER.length - 1) {
            item.rarity = RARITY_ORDER[rIdx + 1];
            item.value = Math.round(item.value * 1.5);
          }
          game.itemDrops.push({ item, x: p.x, y: p.y, timer: 60 });
          addNotification('Treasure! ' + item.name, RARITY_COLORS[item.rarity]);
          addLog('Found ' + item.name + ' in a chest!', RARITY_COLORS[item.rarity]);
        } else {
          // Give gold as fallback
          const gold = ri(50, 150) * this.floor;
          p.gold += gold;
          addNotification('+' + gold + ' Gold from chest!', '#FFD700');
          addLog('Found ' + gold + ' gold in a chest!', '#FFD700');
        }
        sfx.spell();
      }
    }
  }
};

// Update a single dungeon monster (similar to updateMonster but uses dungeon walkability)
dungeon._updateDungeonMonster = function(m, dt) {
  if (m.isDead) return;
  if (m.slowTimer > 0) m.slowTimer -= dt;
  m.animTimer += dt;
  if (m.animTimer > 0.25) { m.frame = (m.frame + 1) % 2; m.animTimer = 0; }
  if (m.attackTimer > 0) m.attackTimer -= dt;

  const spd = m.slowTimer > 0 ? m.spd * 0.5 : m.spd;
  const p = game.player;

  switch (m.state) {
    case 'patrol': {
      if (p && !p.isDead) {
        const dx = p.x - m.x, dy = p.y - m.y;
        if (Math.sqrt(dx * dx + dy * dy) < m.aggroRange) { m.state = 'chase'; m.target = p; break; }
      }
      m.patrolAngle += dt * 0.4;
      const px = m.patrolCenter.x + Math.cos(m.patrolAngle) * TILE * 2;
      const py = m.patrolCenter.y + Math.sin(m.patrolAngle) * TILE * 2;
      const dx = px - m.x, dy = py - m.y, dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 4) {
        const s = spd * TILE * dt;
        const nx = m.x + (dx / dist) * s, ny = m.y + (dy / dist) * s;
        if (dungeon.isWalkable(Math.floor(nx / TILE), Math.floor(ny / TILE))) { m.x = nx; m.y = ny; }
      }
      break;
    }
    case 'chase': {
      if (!m.target || m.target.isDead) { m.state = 'patrol'; m.target = null; break; }
      const dx = m.target.x - m.x, dy = m.target.y - m.y, dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > m.aggroRange * 2) { m.state = 'patrol'; m.target = null; break; }
      if (dist <= m.attackRange) { m.state = 'attack'; break; }
      const s = spd * TILE * dt;
      const nx = m.x + (dx / dist) * s, ny = m.y + (dy / dist) * s;
      if (dungeon.isWalkable(Math.floor(nx / TILE), Math.floor(ny / TILE))) { m.x = nx; m.y = ny; }
      else if (dungeon.isWalkable(Math.floor(nx / TILE), Math.floor(m.y / TILE))) m.x = nx;
      else if (dungeon.isWalkable(Math.floor(m.x / TILE), Math.floor(ny / TILE))) m.y = ny;
      if (Math.abs(dx) > Math.abs(dy)) m.dir = dx > 0 ? 'right' : 'left';
      else m.dir = dy > 0 ? 'down' : 'up';
      break;
    }
    case 'attack': {
      if (!m.target || m.target.isDead) { m.state = 'patrol'; m.target = null; break; }
      const dx = m.target.x - m.x, dy = m.target.y - m.y, dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > m.attackRange * 1.5) { m.state = 'chase'; break; }
      if (m.attackTimer <= 0) {
        const r = calcDamage(m, m.target);
        m.target.hp = Math.max(0, m.target.hp - r.dmg);
        addDmg(m.target.x, m.target.y - TILE, '-' + r.dmg, r.crit ? '#FF4444' : '#FF8888');
        m.attackTimer = 1 / (spd * 0.5 + 0.5);
        sfx.hit();
        if (m.target && m.target.hp <= 0) {
          m.target.isDead = true; m.target.respawnTimer = 3;
          addLog(m.target.name + ' was killed by ' + m.type + '!', '#FF4444');
          m.target.gold = Math.max(0, Math.round(m.target.gold * 0.95));
          m.target = null; m.state = 'patrol';
        }
      }
      break;
    }
  }
};

// Boss AoE slam attack
dungeon._bossAoeSlam = function(boss) {
  const p = game.player;
  if (!p || p.isDead) return;
  const dist = Math.hypot(p.x - boss.x, p.y - boss.y);
  if (dist > TILE * 6) return; // Only if player is somewhat close

  screenShake(8, 0.4);
  addEffect(boss.x, boss.y, 'aoe', 0.8);
  sfx.spell();
  addLog('Demon Lord slams the ground!', '#FF4444');

  // Damage in AoE radius
  if (dist < TILE * 3) {
    const dmg = Math.round(boss.atk * 1.5 - p.def * 0.3);
    const finalDmg = Math.max(1, dmg);
    p.hp = Math.max(0, p.hp - finalDmg);
    addDmg(p.x, p.y - TILE, '-' + finalDmg, '#FF2222');
    if (p.hp <= 0) {
      p.isDead = true; p.respawnTimer = 3;
      addLog(p.name + ' was crushed by Demon Lord!', '#FF4444');
    }
  }
};

// Boss summon minions
dungeon._bossSummonMinions = function(boss) {
  addLog('Demon Lord summons dark minions!', '#FF4444');
  addNotification('Boss summons reinforcements!', '#FF4444');
  screenShake(6, 0.3);
  sfx.spell();

  // Summon 3 shadow assassins near boss
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 / 3) * i;
    const sx = boss.x + Math.cos(angle) * TILE * 2;
    const sy = boss.y + Math.sin(angle) * TILE * 2;
    const minion = createDungeonMon('shadow_assassin', sx, sy, 5);
    this.monsters.push(minion);
  }
  // Update game.monsters reference
  game.monsters = this.monsters;
};


// ============================================================
// DUNGEON KILL — Override loot with +1 rarity tier
// ============================================================
// Patch killMon behavior for dungeon monsters by checking isDungeon flag
// This is handled by wrapping genItem result in dungeon.update and
// using a global hook. We add a helper that the main killMon can call.
function dungeonLootDrop(m) {
  // Generate item with boosted rarity
  const item = genItem(m.level + dungeon.floor * 2);
  if (item) {
    // Upgrade rarity by 1 tier
    const rIdx = RARITY_ORDER.indexOf(item.rarity);
    if (rIdx >= 0 && rIdx < RARITY_ORDER.length - 1) {
      item.rarity = RARITY_ORDER[rIdx + 1];
      item.value = Math.round(item.value * rarMult(item.rarity));
    }
    game.itemDrops.push({ item, x: m.x, y: m.y, timer: 60 });
    addNotification(item.name, RARITY_COLORS[item.rarity]);
  }
}


// ============================================================
// DUNGEON DRAWING
// ============================================================
dungeon.drawTiles = function() {
  if (!this.active || !this.tiles.length) return;
  const W = this.DG_W, H = this.DG_H;

  // Calculate visible tile range
  const sC = Math.max(0, Math.floor(camera.x / TILE));
  const sR = Math.max(0, Math.floor(camera.y / TILE));
  const eC = Math.min(W - 1, Math.ceil((camera.x + canvas.width) / TILE));
  const eR = Math.min(H - 1, Math.ceil((camera.y + canvas.height) / TILE));

  for (let r = sR; r <= eR; r++) {
    for (let c = sC; c <= eC; c++) {
      const t = this.tiles[r][c];
      if (t < 0) continue;
      const sx = c * TILE - camera.x, sy = r * TILE - camera.y;
      let spr;

      if (t === 0) spr = spriteCache['dg_floor'];
      else if (t === 1) spr = spriteCache['dg_wall'];
      else if (t === 2) spr = spriteCache['dg_lava'];
      else if (t === 3) {
        // Draw floor underneath then chest
        spr = spriteCache['dg_floor'];
        if (spr) ctx.drawImage(spr, sx, sy, TILE, TILE);
        // Draw chest centered
        const chestSpr = spriteCache['dg_chest'];
        if (chestSpr) ctx.drawImage(chestSpr, sx + 8, sy + 8, 16, 16);
        continue;
      }

      if (spr) ctx.drawImage(spr, sx, sy, TILE, TILE);
    }
  }

  // Draw stairs
  if (this.stairsPos) {
    const sp = camera.worldToScreen(this.stairsPos.x - TILE / 2, this.stairsPos.y - TILE / 2);
    const spr = spriteCache['dg_stairs'];
    if (spr) ctx.drawImage(spr, sp.x, sp.y, TILE, TILE);
  }

  // Draw exit portal with glow animation
  if (this.exitPos) {
    const ep = camera.worldToScreen(this.exitPos.x - TILE / 2, this.exitPos.y - TILE / 2);
    const spr = spriteCache['dg_exit'];
    if (spr) {
      const pulse = 0.7 + 0.3 * Math.sin(this.portalAnimTimer * 3);
      ctx.globalAlpha = pulse;
      ctx.drawImage(spr, ep.x, ep.y, TILE, TILE);
      ctx.globalAlpha = 1;
    }
  }

  // Draw black border around dungeon (hide void outside)
  ctx.fillStyle = '#000';
  // Left
  if (camera.x < 0) ctx.fillRect(0, 0, -camera.x, canvas.height);
  // Top
  if (camera.y < 0) ctx.fillRect(0, 0, canvas.width, -camera.y);
  // Right
  const rightEdge = W * TILE - camera.x;
  if (rightEdge < canvas.width) ctx.fillRect(rightEdge, 0, canvas.width - rightEdge, canvas.height);
  // Bottom
  const bottomEdge = H * TILE - camera.y;
  if (bottomEdge < canvas.height) ctx.fillRect(0, bottomEdge, canvas.width, canvas.height - bottomEdge);
};

dungeon.drawHUD = function() {
  if (!this.active) return;

  // Dark ambient overlay (subtle)
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Floor indicator (top center)
  const floorText = 'Floor ' + this.floor + '/' + this.maxFloor;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';

  // Background bar
  const tw = ctx.measureText(floorText).width + 24;
  const bx = canvas.width / 2 - tw / 2, by = 8;
  ctx.fillStyle = 'rgba(20,0,40,0.8)';
  roundRect(ctx, bx, by, tw, 28, 6); ctx.fill();
  ctx.strokeStyle = '#8833cc'; ctx.lineWidth = 1;
  roundRect(ctx, bx, by, tw, 28, 6); ctx.stroke();

  // Text
  ctx.fillStyle = '#ddbbff';
  ctx.fillText(floorText, canvas.width / 2, by + 20);

  // Boss HP bar (if boss alive)
  const boss = this.monsters.find(m => m.isBoss && !m.isDead);
  if (boss) {
    const bw = 300, bh = 20;
    const bbx = canvas.width / 2 - bw / 2, bby = 44;
    // Background
    ctx.fillStyle = 'rgba(20,0,0,0.8)';
    roundRect(ctx, bbx - 2, bby - 2, bw + 4, bh + 4, 4); ctx.fill();
    // HP bar
    const hpPct = Math.max(0, boss.hp / boss.maxHp);
    ctx.fillStyle = '#661111';
    ctx.fillRect(bbx, bby, bw, bh);
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(bbx, bby, bw * hpPct, bh);
    // Boss name and HP
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Demon Lord  ' + boss.hp + '/' + boss.maxHp, canvas.width / 2, bby + 15);
  }

  // Exit button (top-right)
  const ebx = canvas.width - 110, eby = 8, ebw = 100, ebh = 28;
  ctx.fillStyle = 'rgba(40,10,10,0.8)';
  roundRect(ctx, ebx, eby, ebw, ebh, 6); ctx.fill();
  ctx.strokeStyle = '#cc4444'; ctx.lineWidth = 1;
  roundRect(ctx, ebx, eby, ebw, ebh, 6); ctx.stroke();
  ctx.fillStyle = '#ff8888';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Exit Dungeon', ebx + ebw / 2, eby + 19);
  ctx.textAlign = 'left';

  // Monsters remaining count + stairs status
  const alive = this.monsters.filter(m => !m.isDead).length;
  const total = this.monsters.length;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  if(alive > 0){
    ctx.fillStyle = '#ff8888';
    ctx.fillText('Monsters: ' + alive + '/' + total + ' remaining', canvas.width / 2, canvas.height - 12);
  }else if(this.stairsPos){
    const pulse = Math.sin(Date.now()/300)*0.3+0.7;
    ctx.fillStyle = 'rgba(255,255,68,'+pulse+')';
    ctx.fillText('Find the stairs! [F] to descend', canvas.width / 2, canvas.height - 12);
  }else if(this.floor === this.maxFloor){
    const pulse = Math.sin(Date.now()/300)*0.3+0.7;
    ctx.fillStyle = 'rgba(136,204,255,'+pulse+')';
    ctx.fillText('Dungeon Cleared! Exit portal is nearby', canvas.width / 2, canvas.height - 12);
  }
  ctx.textAlign = 'left';
};

// Check if exit button was clicked
dungeon.checkExitClick = function(sx, sy) {
  if (!this.active) return false;
  const ebx = canvas.width - 110, eby = 8, ebw = 100, ebh = 28;
  if (sx >= ebx && sx <= ebx + ebw && sy >= eby && sy <= eby + ebh) {
    this.exitDungeon();
    return true;
  }
  return false;
};


// ============================================================
// DUNGEON MONSTER DRAWING
// ============================================================
dungeon.drawMonsters = function() {
  if (!this.active) return;
  for (const m of this.monsters) {
    if (m.isDead) continue;
    const sp = camera.worldToScreen(m.x, m.y);
    // Check if on screen
    if (sp.x < -64 || sp.x > canvas.width + 64 || sp.y < -64 || sp.y > canvas.height + 64) continue;

    const sprName = 'mon_' + m.type;
    const spr = spriteCache[sprName];
    if (!spr) continue;

    const w = spr.width, h = spr.height;
    // Bob animation
    const bob = Math.sin(game.time * 3 + m.x) * 2;

    ctx.drawImage(spr, sp.x - w / 2, sp.y - h / 2 + bob, w, h);

    // HP bar above monster
    const barW = Math.max(w, 24);
    const barH = 3;
    const barX = sp.x - barW / 2;
    const barY = sp.y - h / 2 - 6 + bob;
    const hpPct = Math.max(0, m.hp / m.maxHp);

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = m.isBoss ? '#cc2222' : '#44cc44';
    ctx.fillRect(barX, barY, barW * hpPct, barH);

    // Level text
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'center';
    ctx.fillText('Lv.' + m.level, sp.x, barY - 2);
    ctx.textAlign = 'left';
  }
};


// ============================================================
// OVERWORLD PORTAL (drawn on main map when not in dungeon)
// ============================================================
function drawDungeonPortal() {
  if (dungeon.active || !dungeon.portalPos) return;

  dungeon.portalAnimTimer += game.dt;

  const pp = camera.worldToScreen(dungeon.portalPos.x - TILE / 2, dungeon.portalPos.y - TILE / 2);
  // Check if on screen
  if (pp.x < -64 || pp.x > canvas.width + 64 || pp.y < -64 || pp.y > canvas.height + 64) return;

  const spr = spriteCache['dg_portal'];
  if (spr) {
    // Pulsing glow effect
    const pulse = 0.6 + 0.4 * Math.sin(dungeon.portalAnimTimer * 2.5);
    ctx.globalAlpha = pulse;
    ctx.drawImage(spr, pp.x, pp.y, TILE, TILE);
    ctx.globalAlpha = 1;
  }

  // Label
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#cc88ff';
  ctx.fillText('Dungeon', pp.x + TILE / 2, pp.y - 4);

  // Pulsing ground glow circle
  const glowR = TILE * 0.8 + Math.sin(dungeon.portalAnimTimer * 3) * 4;
  ctx.beginPath();
  ctx.arc(pp.x + TILE / 2, pp.y + TILE / 2, glowR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(170, 68, 255, ' + (0.08 + 0.06 * Math.sin(dungeon.portalAnimTimer * 2.5)) + ')';
  ctx.fill();

  // Level requirement or interaction prompt
  const p = game.player;
  if (p && p.level < 5) {
    ctx.fillStyle = '#ff6666';
    ctx.font = '9px sans-serif';
    ctx.fillText('Lv.5+', pp.x + TILE / 2, pp.y + TILE + 10);
  } else if (isNearPortal()) {
    const bob = Math.sin(dungeon.portalAnimTimer * 4) * 3;
    ctx.fillStyle = '#eedd88';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('Press F to Enter', pp.x + TILE / 2, pp.y - 14 + bob);
  }
  ctx.textAlign = 'left';
}

// Check if player clicked the overworld portal (clickX/clickY are screen coords)
function checkPortalClick(clickX, clickY) {
  if (dungeon.active || !dungeon.portalPos) return false;
  const world = camera.screenToWorld(clickX, clickY);
  const dist = Math.hypot(world.x - dungeon.portalPos.x, world.y - dungeon.portalPos.y);
  if (dist < TILE * 1.5) {
    return dungeon.enterDungeon();
  }
  return false;
}

// Check if player is near portal (for F key / proximity prompt)
function isNearPortal() {
  if (dungeon.active || !dungeon.portalPos || !game.player) return false;
  return Math.hypot(game.player.x - dungeon.portalPos.x, game.player.y - dungeon.portalPos.y) < TILE * 1.5;
}


// ============================================================
// DUNGEON PATH HELPERS (mirrors overworld followPath/assignPath)
// ============================================================
// These wrap dungeon pathfinding so movement in dungeon uses dungeon tiles.
function dungeonFollowPath(ent, dt) {
  if (!ent._path || ent._pathIdx >= ent._path.length) return true;
  const target = ent._path[ent._pathIdx];
  const dx = target.x - ent.x, dy = target.y - ent.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 6) { ent._pathIdx++; return ent._pathIdx >= ent._path.length; }
  const s = ent.spd * TILE * dt;
  const nx = ent.x + (dx / dist) * s, ny = ent.y + (dy / dist) * s;
  if (dungeon.isWalkable(Math.floor(nx / TILE), Math.floor(ny / TILE))) { ent.x = nx; ent.y = ny; }
  else if (dungeon.isWalkable(Math.floor(nx / TILE), Math.floor(ent.y / TILE))) ent.x = nx;
  else if (dungeon.isWalkable(Math.floor(ent.x / TILE), Math.floor(ny / TILE))) ent.y = ny;
  if (Math.abs(dx) > Math.abs(dy)) ent.dir = dx > 0 ? 'right' : 'left';
  else ent.dir = dy > 0 ? 'down' : 'up';
  return false;
}

function dungeonAssignPath(ent, wx, wy, maxR) {
  const path = dungeon.findPath(ent.x, ent.y, wx, wy, maxR || 20);
  if (path && path.length > 0) { ent._path = path; ent._pathIdx = 0; return true; }
  ent._path = null; ent._pathIdx = 0; return false;
}


// ============================================================
// BOT AI FOR DUNGEON
// ============================================================
// Returns target world coords {x,y} for bot to move toward, or null.
// The main bot AI should call this when dungeon.active is true.
function dungeonBotLogic(p) {
  if (!dungeon.active || !p || p.isDead) return null;

  // Find alive dungeon monsters
  const alive = dungeon.monsters.filter(m => !m.isDead);

  // If monsters remain, target the nearest one
  if (alive.length > 0) {
    let nearest = null, nd = Infinity;
    for (const m of alive) {
      const d = Math.hypot(m.x - p.x, m.y - p.y);
      if (d < nd) { nd = d; nearest = m; }
    }
    if (nearest) {
      return { x: nearest.x, y: nearest.y };
    }
  }

  // Floor clear — navigate to stairs (or exit if floor 5)
  if (dungeon.stairsPos && dungeon.floor < dungeon.maxFloor) {
    return { x: dungeon.stairsPos.x, y: dungeon.stairsPos.y };
  }

  // Floor 5 cleared — exit dungeon
  if (dungeon.exitPos) {
    return { x: dungeon.exitPos.x, y: dungeon.exitPos.y };
  }

  return null;
}


// ============================================================
// DUNGEON CAMERA CLAMPING
// ============================================================
dungeon.clampCamera = function() {
  if (!this.active) return;
  // Center smaller dungeon floors inside large viewports instead of pinning them to the top-left.
  const mapWidth = this.DG_W * TILE;
  const mapHeight = this.DG_H * TILE;
  const minX = mapWidth <= canvas.width ? (mapWidth - canvas.width) / 2 : 0;
  const maxX = mapWidth <= canvas.width ? minX : mapWidth - canvas.width;
  const minY = mapHeight <= canvas.height ? (mapHeight - canvas.height) / 2 : 0;
  const maxY = mapHeight <= canvas.height ? minY : mapHeight - canvas.height;

  camera.x = Math.max(minX, Math.min(camera.x, maxX));
  camera.y = Math.max(minY, Math.min(camera.y, maxY));
};

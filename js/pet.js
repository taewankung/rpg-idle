// ============================================================
// PET — Companion system: soul gems, summoning, pet AI, rendering
// ============================================================

// --- PET DATA TABLE ---
const PET_DATA = {
  slime:    { name: 'Slime Pet',    ability: 'taunt',    hpMul: 0.6, atkMul: 0.3, defMul: 0.5, spdMul: 0.8 },
  goblin:   { name: 'Goblin Pet',   ability: 'autoloot', hpMul: 0.4, atkMul: 0.4, defMul: 0.3, spdMul: 1.2 },
  wolf:     { name: 'Wolf Pet',     ability: 'assist',   hpMul: 0.5, atkMul: 0.6, defMul: 0.3, spdMul: 1.0 },
  skeleton: { name: 'Skeleton Pet', ability: 'ranged',   hpMul: 0.4, atkMul: 0.5, defMul: 0.2, spdMul: 0.9 },
  dragon:   { name: 'Baby Dragon',  ability: 'fireAoe',  hpMul: 0.7, atkMul: 0.7, defMul: 0.4, spdMul: 1.1 }
};

// --- PET STATE ---
const petSystem = {
  active: null,     // current pet entity or null
  gems: {},         // {slime: 2, wolf: 1, ...} collected soul gems (tracking count)

  // Create and activate a pet of given monster type
  createPet(type) {
    const data = PET_DATA[type];
    if (!data || !game.player) return null;
    const p = game.player;

    // Position 2 tiles behind player based on facing direction
    const dirOffsets = { up: { x: 0, y: 2 }, down: { x: 0, y: -2 }, left: { x: 2, y: 0 }, right: { x: -2, y: 0 } };
    const off = dirOffsets[p.dir] || dirOffsets.down;

    const pet = {
      entityType: 'pet',
      type: type,
      name: data.name,
      ability: data.ability,
      level: p.level,
      hp: Math.round(p.maxHp * data.hpMul),
      maxHp: Math.round(p.maxHp * data.hpMul),
      atk: Math.round(p.atk * data.atkMul),
      def: Math.round(p.def * data.defMul),
      spd: p.spd * data.spdMul,
      crit: 0.05,
      x: p.x + off.x * TILE,
      y: p.y + off.y * TILE,
      dir: p.dir,
      frame: 0,
      animTimer: 0,
      state: 'following',   // 'following', 'attacking', 'dead'
      isDead: false,
      attackTimer: 0,
      respawnTimer: 0,
      _path: null,
      _pathIdx: 0,
      _followTimer: 0,      // cooldown between path recalcs
      _lootTarget: null,     // for autoloot ability
      _atkTarget: null,      // current attack target
      _aoeTimer: 0           // for fireAoe cooldown
    };

    this.active = pet;
    addLog(data.name + ' has been summoned!', '#FF88CC');
    addEffect(pet.x, pet.y, 'buff', 0.8);
    return pet;
  },

  // Remove active pet
  dismissPet() {
    if (!this.active) return;
    addLog(this.active.name + ' dismissed.', '#AAAAAA');
    this.active = null;
  },

  // Add a soul gem drop (called from killMon with small chance)
  addGem(monsterType) {
    const data = PET_DATA[monsterType];
    if (!data) return;

    // Track gem count
    this.gems[monsterType] = (this.gems[monsterType] || 0) + 1;

    // Create gem item and add to player inventory
    const typeName = monsterType.charAt(0).toUpperCase() + monsterType.slice(1);
    const gemItem = {
      name: typeName + ' Soul Gem',
      type: 'gem',
      rarity: 'rare',
      monsterType: monsterType,
      stats: {},
      level: 1,
      value: 100
    };
    game.player.inventory.push(gemItem);
    addNotification(typeName + ' Soul Gem obtained!', RARITY_COLORS.rare);
    sfx.itemPickup();
  },

  // Summon pet from a gem item in inventory
  summonFromGem(gemItem) {
    if (!gemItem || gemItem.type !== 'gem' || !gemItem.monsterType) return false;
    const p = game.player;
    if (!p) return false;

    // Remove gem from inventory
    const idx = p.inventory.indexOf(gemItem);
    if (idx === -1) return false;
    p.inventory.splice(idx, 1);

    // Dismiss current pet if any
    if (this.active) this.dismissPet();

    // Create the new pet
    this.createPet(gemItem.monsterType);
    addEffect(p.x, p.y, 'buff', 1.0);
    return true;
  },

  // Recalculate pet stats when player levels up
  recalcStats() {
    const pet = this.active;
    if (!pet || pet.isDead) return;
    const p = game.player;
    const data = PET_DATA[pet.type];
    if (!data) return;

    pet.level = p.level;
    pet.maxHp = Math.round(p.maxHp * data.hpMul);
    pet.hp = Math.min(pet.hp, pet.maxHp);
    pet.atk = Math.round(p.atk * data.atkMul);
    pet.def = Math.round(p.def * data.defMul);
    pet.spd = p.spd * data.spdMul;
  }
};

// --- SPRITE GENERATION ---
// Generate pet sprites (smaller 24x24 versions of monster sprites with heart overlay)
function generatePetSprites() {
  const dirs = ['down']; // pets use a simpler sprite set (no directional sprites)

  // Helper: draw a small pink heart at top-right of sprite
  function drawHeart(c, ox, oy) {
    c.fillStyle = '#FF69B4';
    c.beginPath();
    c.arc(ox - 2, oy + 1, 2, 0, Math.PI * 2);
    c.arc(ox + 2, oy + 1, 2, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(ox - 4, oy + 2);
    c.lineTo(ox, oy + 6);
    c.lineTo(ox + 4, oy + 2);
    c.fill();
  }

  // Pet slime: small green blob
  for (let f = 0; f < 2; f++) {
    genSprite('pet_slime_' + f, 24, 24, (c) => {
      const sq = f === 0, bw = sq ? 16 : 14, bh = sq ? 10 : 13;
      const by = 24 - bh - 2;
      c.fillStyle = 'rgba(0,0,0,0.15)';
      c.beginPath(); c.ellipse(12, 23, bw / 2, 2, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2ecc71';
      c.beginPath(); c.ellipse(12, by + bh / 2, bw / 2, bh / 2, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#27ae60';
      c.beginPath(); c.ellipse(12, by + bh / 2 + 1, bw / 2, bh / 2 - 1, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.3)';
      c.beginPath(); c.ellipse(10, by + 2, 3, 1.5, -0.3, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.fillRect(9, by + 2, 3, 2); c.fillRect(14, by + 2, 3, 2);
      c.fillStyle = '#1a1a1a'; c.fillRect(10, by + 3, 1, 1); c.fillRect(15, by + 3, 1, 1);
      drawHeart(c, 20, 1);
    });
  }

  // Pet goblin: small green imp
  for (let f = 0; f < 2; f++) {
    genSprite('pet_goblin_' + f, 24, 24, (c) => {
      c.fillStyle = 'rgba(0,0,0,0.15)';
      c.beginPath(); c.ellipse(12, 23, 5, 1.5, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#5a7a2e'; c.fillRect(8, 17, 3, 6); c.fillRect(13, 17, 3, 6);
      c.fillStyle = '#7d9a3e'; c.fillRect(7, 10, 10, 8);
      c.fillStyle = '#7d9a3e'; c.fillRect(7, 4, 10, 8);
      c.beginPath(); c.moveTo(7, 6); c.lineTo(4, 2); c.lineTo(7, 8); c.fill();
      c.beginPath(); c.moveTo(17, 6); c.lineTo(20, 2); c.lineTo(17, 8); c.fill();
      c.fillStyle = '#e74c3c'; c.fillRect(9, 7, 2, 2); c.fillRect(13, 7, 2, 2);
      drawHeart(c, 20, 0);
    });
  }

  // Pet wolf: small gray wolf
  for (let f = 0; f < 2; f++) {
    genSprite('pet_wolf_' + f, 24, 24, (c) => {
      const run = f === 1;
      c.fillStyle = 'rgba(0,0,0,0.15)';
      c.beginPath(); c.ellipse(12, 23, 9, 1.5, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#5d6d7e'; c.fillRect(4, 12, 16, 7);
      c.fillStyle = '#4a5568';
      const lo = run ? 2 : 0;
      c.fillRect(5, 18, 2, 5 - lo); c.fillRect(8, 18, 2, 5 + lo);
      c.fillRect(13, 18, 2, 5 + lo); c.fillRect(16, 18, 2, 5 - lo);
      c.fillStyle = '#5d6d7e';
      c.fillRect(3, 7, 9, 6);
      c.beginPath(); c.moveTo(4, 7); c.lineTo(3, 3); c.lineTo(7, 6); c.fill();
      c.beginPath(); c.moveTo(10, 7); c.lineTo(11, 4); c.lineTo(11, 7); c.fill();
      c.fillStyle = '#f1c40f'; c.fillRect(4, 9, 2, 1); c.fillRect(8, 9, 2, 1);
      drawHeart(c, 20, 1);
    });
  }

  // Pet skeleton: small white bones figure
  for (let f = 0; f < 2; f++) {
    genSprite('pet_skeleton_' + f, 24, 24, (c) => {
      c.fillStyle = 'rgba(0,0,0,0.1)';
      c.beginPath(); c.ellipse(12, 23, 6, 1.5, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f5f0e1'; c.fillRect(9, 17, 2, 6); c.fillRect(13, 17, 2, 6);
      c.fillStyle = '#e8e0cc'; c.fillRect(8, 14, 8, 4);
      c.fillStyle = '#f5f0e1'; c.fillRect(8, 9, 8, 6);
      c.fillStyle = '#f5f0e1'; c.fillRect(8, 2, 8, 8);
      c.fillStyle = '#111'; c.fillRect(9, 5, 2, 3); c.fillRect(13, 5, 2, 3);
      c.fillRect(11, 7, 2, 1);
      drawHeart(c, 20, 0);
    });
  }

  // Pet dragon: small red dragon (24x24, much smaller than 64x64 boss)
  for (let f = 0; f < 2; f++) {
    genSprite('pet_dragon_' + f, 24, 24, (c) => {
      const b = f === 1;
      c.fillStyle = 'rgba(0,0,0,0.15)';
      c.beginPath(); c.ellipse(12, 23, 8, 2, 0, 0, Math.PI * 2); c.fill();
      // Body
      c.fillStyle = '#c0392b'; c.fillRect(7, 12, 12, 8);
      // Belly
      c.fillStyle = '#e67e22';
      c.beginPath(); c.ellipse(13, 17, 4, 3, 0, 0, Math.PI * 2); c.fill();
      // Legs
      c.fillStyle = '#a93226'; c.fillRect(7, 19, 3, 4); c.fillRect(15, 19, 3, 4);
      // Wings
      const wf = b ? -2 : 0;
      c.fillStyle = '#a93226';
      c.beginPath(); c.moveTo(9, 13); c.lineTo(2, 5 + wf); c.lineTo(6, 13); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(17, 13); c.lineTo(22, 5 + wf); c.lineTo(19, 13); c.closePath(); c.fill();
      // Head
      c.fillStyle = '#c0392b'; c.fillRect(8, 3, 8, 6);
      // Horns
      c.fillStyle = '#7b241c';
      c.beginPath(); c.moveTo(9, 3); c.lineTo(8, 0); c.lineTo(10, 3); c.fill();
      c.beginPath(); c.moveTo(15, 3); c.lineTo(16, 0); c.lineTo(14, 3); c.fill();
      // Eyes
      c.fillStyle = '#f1c40f'; c.fillRect(9, 5, 2, 2); c.fillRect(13, 5, 2, 2);
      c.fillStyle = '#1a1a1a'; c.fillRect(10, 5, 1, 2); c.fillRect(14, 5, 1, 2);
      drawHeart(c, 20, 0);
    });
  }

  // Pet golden_slime: shiny gold blob with sparkle
  for (let f = 0; f < 2; f++) {
    genSprite('pet_golden_slime_' + f, 24, 24, (c) => {
      const sq = f === 0, bw = sq ? 16 : 14, bh = sq ? 10 : 13;
      const by = 24 - bh - 2;
      // Shadow
      c.fillStyle = 'rgba(0,0,0,0.15)';
      c.beginPath(); c.ellipse(12, 23, bw / 2, 2, 0, 0, Math.PI * 2); c.fill();
      // Body — gold
      c.fillStyle = '#f1c40f';
      c.beginPath(); c.ellipse(12, by + bh / 2, bw / 2, bh / 2, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#d4a017';
      c.beginPath(); c.ellipse(12, by + bh / 2 + 1, bw / 2, bh / 2 - 1, 0, 0, Math.PI * 2); c.fill();
      // Shine
      c.fillStyle = 'rgba(255,255,255,0.5)';
      c.beginPath(); c.ellipse(10, by + 2, 3, 1.5, -0.3, 0, Math.PI * 2); c.fill();
      // Eyes
      c.fillStyle = '#fff'; c.fillRect(9, by + 2, 3, 2); c.fillRect(14, by + 2, 3, 2);
      c.fillStyle = '#1a1a1a'; c.fillRect(10, by + 3, 1, 1); c.fillRect(15, by + 3, 1, 1);
      // Sparkle
      c.fillStyle = '#fff';
      c.fillRect(18, 2, 1, 3); c.fillRect(17, 3, 3, 1);
      c.fillRect(4, 5, 1, 2); c.fillRect(3, 6, 3, 1);
      drawHeart(c, 20, 1);
    });
  }

  // Pet shadow_wolf: dark purple wolf with glowing red eyes
  for (let f = 0; f < 2; f++) {
    genSprite('pet_shadow_wolf_' + f, 24, 24, (c) => {
      const run = f === 1;
      // Shadow
      c.fillStyle = 'rgba(0,0,0,0.2)';
      c.beginPath(); c.ellipse(12, 23, 9, 1.5, 0, 0, Math.PI * 2); c.fill();
      // Body — dark purple-black
      c.fillStyle = '#2c1e3f'; c.fillRect(4, 12, 16, 7);
      // Legs
      c.fillStyle = '#1a1230';
      const lo = run ? 2 : 0;
      c.fillRect(5, 18, 2, 5 - lo); c.fillRect(8, 18, 2, 5 + lo);
      c.fillRect(13, 18, 2, 5 + lo); c.fillRect(16, 18, 2, 5 - lo);
      // Head
      c.fillStyle = '#2c1e3f';
      c.fillRect(3, 7, 9, 6);
      // Ears
      c.beginPath(); c.moveTo(4, 7); c.lineTo(3, 3); c.lineTo(7, 6); c.fill();
      c.beginPath(); c.moveTo(10, 7); c.lineTo(11, 4); c.lineTo(11, 7); c.fill();
      // Red glowing eyes
      c.fillStyle = '#e74c3c'; c.fillRect(4, 9, 2, 1); c.fillRect(8, 9, 2, 1);
      // Shadow aura particles
      c.fillStyle = 'rgba(128,0,255,0.3)';
      c.fillRect(2, 14, 1, 1); c.fillRect(20, 11, 1, 1); c.fillRect(18, 16, 1, 1);
      drawHeart(c, 20, 1);
    });
  }

  // Pet phoenix: majestic fire bird with flame wings
  for (let f = 0; f < 2; f++) {
    genSprite('pet_phoenix_' + f, 24, 24, (c) => {
      const b = f === 1;
      // Shadow
      c.fillStyle = 'rgba(255,100,0,0.15)';
      c.beginPath(); c.ellipse(12, 23, 7, 2, 0, 0, Math.PI * 2); c.fill();
      // Tail feathers — flame
      c.fillStyle = '#e74c3c';
      c.beginPath(); c.moveTo(12, 18); c.lineTo(6, 22); c.lineTo(10, 17); c.fill();
      c.beginPath(); c.moveTo(12, 18); c.lineTo(18, 22); c.lineTo(14, 17); c.fill();
      c.fillStyle = '#f39c12';
      c.beginPath(); c.moveTo(12, 19); c.lineTo(8, 23); c.lineTo(11, 18); c.fill();
      // Body — orange-red
      c.fillStyle = '#e67e22'; c.fillRect(8, 12, 8, 7);
      // Belly
      c.fillStyle = '#f9e79f';
      c.beginPath(); c.ellipse(12, 16, 3, 3, 0, 0, Math.PI * 2); c.fill();
      // Legs
      c.fillStyle = '#d4a017'; c.fillRect(9, 19, 2, 3); c.fillRect(13, 19, 2, 3);
      // Wings — flame gradient
      const wf = b ? -2 : 0;
      c.fillStyle = '#e74c3c';
      c.beginPath(); c.moveTo(8, 13); c.lineTo(1, 6 + wf); c.lineTo(5, 14); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(16, 13); c.lineTo(23, 6 + wf); c.lineTo(19, 14); c.closePath(); c.fill();
      c.fillStyle = '#f39c12';
      c.beginPath(); c.moveTo(8, 14); c.lineTo(3, 8 + wf); c.lineTo(6, 14); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(16, 14); c.lineTo(21, 8 + wf); c.lineTo(18, 14); c.closePath(); c.fill();
      // Head
      c.fillStyle = '#e67e22'; c.fillRect(8, 4, 8, 6);
      // Crest — flame on head
      c.fillStyle = '#e74c3c';
      c.beginPath(); c.moveTo(10, 4); c.lineTo(9, 0); c.lineTo(12, 4); c.fill();
      c.fillStyle = '#f39c12';
      c.beginPath(); c.moveTo(13, 4); c.lineTo(14, 1); c.lineTo(15, 4); c.fill();
      // Eyes
      c.fillStyle = '#f1c40f'; c.fillRect(9, 6, 2, 2); c.fillRect(13, 6, 2, 2);
      c.fillStyle = '#1a1a1a'; c.fillRect(10, 6, 1, 2); c.fillRect(14, 6, 1, 2);
      // Beak
      c.fillStyle = '#d4a017'; c.fillRect(11, 8, 2, 2);
      drawHeart(c, 20, 0);
    });
  }

  // Soul gem item sprite (16x16): glowing purple/blue crystal
  genSprite('soul_gem', 16, 16, (c) => {
    // Glow
    const g = c.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(128,0,255,0.4)');
    g.addColorStop(1, 'rgba(64,0,128,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(8, 8, 8, 0, Math.PI * 2); c.fill();
    // Crystal body
    c.fillStyle = '#8844FF';
    c.beginPath();
    c.moveTo(8, 1); c.lineTo(13, 6); c.lineTo(11, 14); c.lineTo(5, 14); c.lineTo(3, 6);
    c.closePath(); c.fill();
    // Highlight facet
    c.fillStyle = '#AA88FF';
    c.beginPath();
    c.moveTo(8, 2); c.lineTo(11, 6); c.lineTo(8, 8); c.lineTo(5, 6);
    c.closePath(); c.fill();
    // Bright highlight
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.beginPath();
    c.moveTo(7, 3); c.lineTo(9, 5); c.lineTo(7, 6);
    c.closePath(); c.fill();
  });
}

// --- PET UPDATE ---
// Called every frame to update pet AI and state
function updatePet(dt) {
  const pet = petSystem.active;
  if (!pet) return;
  const p = game.player;
  if (!p) return;

  // --- Dead state: wait for respawn ---
  if (pet.isDead) {
    pet.respawnTimer -= dt;
    if (pet.respawnTimer <= 0) {
      // Respawn at player position
      pet.isDead = false;
      pet.state = 'following';
      pet.hp = pet.maxHp;
      pet.x = p.x;
      pet.y = p.y;
      pet._path = null;
      pet._pathIdx = 0;
      pet._atkTarget = null;
      addLog(pet.name + ' has returned!', '#FF88CC');
      addEffect(pet.x, pet.y, 'heal', 0.8);
    }
    return;
  }

  // Reduce attack timer
  if (pet.attackTimer > 0) pet.attackTimer -= dt;
  if (pet._aoeTimer > 0) pet._aoeTimer -= dt;

  // Update animation
  pet.animTimer += dt;
  if (pet.animTimer > 0.2) {
    pet.frame = (pet.frame + 1) % 2;
    pet.animTimer = 0;
  }

  // --- State machine ---
  if (pet.state === 'following') {
    _petFollowing(pet, p, dt);
  } else if (pet.state === 'attacking') {
    _petAttacking(pet, p, dt);
  }

  // Check if pet died
  if (pet.hp <= 0 && !pet.isDead) {
    pet.isDead = true;
    pet.state = 'dead';
    pet.respawnTimer = 30;
    addLog(pet.name + ' was defeated! Respawning in 30s...', '#FF4444');
    addEffect(pet.x, pet.y, 'hit', 0.5);
  }
}

// Pet following state logic
function _petFollowing(pet, p, dt) {
  const distToPlayer = Math.hypot(pet.x - p.x, pet.y - p.y);

  // --- Ability: autoloot — pick up nearby item drops ---
  if (pet.ability === 'autoloot') {
    // Find nearest item drop
    let nearDrop = null, nearDist = Infinity;
    for (const d of game.itemDrops) {
      const dd = Math.hypot(d.x - pet.x, d.y - pet.y);
      if (dd < nearDist) { nearDist = dd; nearDrop = d; }
    }
    if (nearDrop && nearDist < TILE * 8) {
      // Walk to item
      if (nearDist < TILE * 0.8) {
        // Pick it up
        const idx = game.itemDrops.indexOf(nearDrop);
        if (idx !== -1) {
          game.itemDrops.splice(idx, 1);
          p.inventory.push(nearDrop.item);
          autoEquip(p, nearDrop.item);
          addLog(pet.name + ' picked up ' + nearDrop.item.name, '#88CCFF');
          addNotification(nearDrop.item.name + ' (pet)', RARITY_COLORS[nearDrop.item.rarity] || '#aaa');
          sfx.itemPickup();
        }
      } else {
        // Path to item
        pet._followTimer -= dt;
        if (pet._followTimer <= 0 || !pet._path) {
          assignPath(pet, nearDrop.x, nearDrop.y, 15);
          pet._followTimer = 0.5;
        }
        followPath(pet, dt);
      }
      return;
    }
  }

  // --- Ability: taunt — attract nearby monsters to pet ---
  if (pet.ability === 'taunt') {
    for (const m of game.monsters) {
      if (m.isDead) continue;
      const dm = Math.hypot(m.x - pet.x, m.y - pet.y);
      // If monster is close and currently targeting player, redirect to pet
      if (dm < TILE * 5 && m.target === p) {
        m.target = pet;
      }
    }
  }

  // --- Check if should switch to attacking ---
  if (pet.ability === 'assist' || pet.ability === 'fireAoe' || pet.ability === 'ranged') {
    // Find bot's current target or nearest monster the player is fighting
    const target = _findPetTarget(pet, p);
    if (target) {
      pet._atkTarget = target;
      pet.state = 'attacking';
      return;
    }
  }

  // --- Follow player (stay ~2 tiles behind) ---
  if (distToPlayer > TILE * 2.5) {
    pet._followTimer -= dt;
    if (pet._followTimer <= 0 || !pet._path) {
      // Target a point behind the player
      const dirOffsets = { up: { x: 0, y: 1 }, down: { x: 0, y: -1 }, left: { x: 1, y: 0 }, right: { x: -1, y: 0 } };
      const off = dirOffsets[p.dir] || dirOffsets.down;
      const tx = p.x + off.x * TILE * 2;
      const ty = p.y + off.y * TILE * 2;
      assignPath(pet, tx, ty, 15);
      pet._followTimer = 0.8;
    }
    followPath(pet, dt);
  } else if (distToPlayer > TILE * 10) {
    // Teleport to player if too far away
    pet.x = p.x;
    pet.y = p.y;
    pet._path = null;
  }
}

// Pet attacking state logic
function _petAttacking(pet, p, dt) {
  const target = pet._atkTarget;

  // Validate target
  if (!target || target.isDead || target.hp <= 0) {
    pet.state = 'following';
    pet._atkTarget = null;
    pet._path = null;
    return;
  }

  const dist = Math.hypot(target.x - pet.x, target.y - pet.y);
  const atkRange = pet.ability === 'ranged' ? TILE * 3 : TILE * 1.2;

  // Check if out of leash range (don't wander too far from player)
  const distToPlayer = Math.hypot(pet.x - p.x, pet.y - p.y);
  if (distToPlayer > TILE * 10) {
    pet.state = 'following';
    pet._atkTarget = null;
    pet._path = null;
    return;
  }

  if (dist <= atkRange) {
    // In range — attack
    if (pet.attackTimer <= 0) {
      const r = calcDamage(pet, target);
      target.hp -= r.dmg;
      addDmg(target.x, target.y - TILE, r.dmg + (r.crit ? '!' : ''), r.crit ? '#FFD700' : '#FFAACC');
      addEffect(target.x, target.y, 'hit', 0.2);
      if (r.crit) sfx.crit(); else sfx.hit();
      pet.attackTimer = 1 / pet.spd;

      // Face the target
      const dx = target.x - pet.x, dy = target.y - pet.y;
      if (Math.abs(dx) > Math.abs(dy)) pet.dir = dx > 0 ? 'right' : 'left';
      else pet.dir = dy > 0 ? 'down' : 'up';

      // Kill check
      if (target.hp <= 0 && !target.isDead) {
        killMon(target, p); // Credit kill to player
        pet.state = 'following';
        pet._atkTarget = null;
        pet._path = null;
        return;
      }
    }

    // Fire AoE ability: deal area damage every 5 seconds
    if (pet.ability === 'fireAoe' && pet._aoeTimer <= 0) {
      pet._aoeTimer = 5;
      for (const m of game.monsters) {
        if (m.isDead) continue;
        const dm = Math.hypot(m.x - pet.x, m.y - pet.y);
        if (dm < TILE * 2.5) {
          const aoeDmg = Math.max(1, Math.round(pet.atk * 0.8 - m.def * 0.3));
          m.hp -= aoeDmg;
          addDmg(m.x, m.y - TILE, aoeDmg, '#FF6644');
          if (m.hp <= 0 && !m.isDead) killMon(m, p);
        }
      }
      addEffect(pet.x, pet.y, 'aoe', 0.5);
      addLog(pet.name + ' breathes fire!', '#FF6644');
    }
  } else {
    // Move toward target
    pet._followTimer -= dt;
    if (pet._followTimer <= 0 || !pet._path) {
      assignPath(pet, target.x, target.y, 15);
      pet._followTimer = 0.5;
    }
    followPath(pet, dt);
  }
}

// Find a valid target for the pet to attack
function _findPetTarget(pet, p) {
  // Check if bot has a target
  if (typeof botAI !== 'undefined' && botAI.target && !botAI.target.isDead && botAI.target.entityType === 'monster') {
    return botAI.target;
  }
  // Otherwise find nearest monster within range that player is close to
  let nearest = null, nd = Infinity;
  for (const m of game.monsters) {
    if (m.isDead) continue;
    const dp = Math.hypot(m.x - p.x, m.y - p.y);
    if (dp > TILE * 6) continue; // only attack monsters near player
    const d = Math.hypot(m.x - pet.x, m.y - pet.y);
    if (d < nd) { nd = d; nearest = m; }
  }
  return nd < TILE * 8 ? nearest : null;
}

// --- PET DRAWING ---
// Draw pet entity on screen (called from entity render pass)
function drawPet() {
  const pet = petSystem.active;
  if (!pet) return;
  const { x: sx, y: sy } = camera.worldToScreen(pet.x, pet.y);

  ctx.save();

  // Ghost effect when dead
  if (pet.isDead) {
    ctx.globalAlpha = 0.25;
  }

  ctx.imageSmoothingEnabled = false;

  // Draw pet sprite (24x24)
  const key = 'pet_' + pet.type + '_' + (pet.frame % 2);
  const spr = spriteCache[key];
  if (spr) {
    ctx.drawImage(spr, sx - 12, sy - 12, 24, 24);
  } else {
    // Fallback colored square
    ctx.fillStyle = '#FF88CC';
    ctx.fillRect(sx - 10, sy - 10, 20, 20);
  }

  if (!pet.isDead) {
    // Draw name + level label above pet
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    const label = 'Lv.' + pet.level + ' ' + pet.name;
    ctx.strokeText(label, sx, sy - 18);
    ctx.fillStyle = '#FFAACC';
    ctx.fillText(label, sx, sy - 18);

    // Draw small HP bar (20px wide)
    const bw = 20, bh = 3, bx = sx - bw / 2, by = sy - 14;
    ctx.fillStyle = '#330000';
    ctx.fillRect(bx, by, bw, bh);
    const hpRatio = Math.max(0, pet.hp / pet.maxHp);
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(bx, by, bw * hpRatio, bh);

    // Draw heart icon when following
    if (pet.state === 'following') {
      const hb = Math.sin(Date.now() / 500) * 1.5; // bobbing
      ctx.fillStyle = '#FF69B4';
      ctx.font = '8px sans-serif';
      ctx.fillText('\u2665', sx + 14, sy - 10 + hb);
    }
  }

  ctx.restore();
}

// --- PET HUD PANEL ---
// Draw pet info panel below player HUD (left side)
function drawPetPanel() {
  const pet = petSystem.active;
  if (!pet) return;

  const px = 10, py = 135, pw = 160, ph = 60;

  ctx.save();

  // Panel background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  roundRect(ctx, px, py, pw, ph, 8);
  ctx.fill();
  ctx.strokeStyle = '#FF69B4';
  ctx.lineWidth = 1;
  roundRect(ctx, px, py, pw, ph, 8);
  ctx.stroke();

  // Pet name + level
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFAACC';
  ctx.fillText(pet.name + ' Lv.' + pet.level, px + 8, py + 14);

  // HP bar
  const hbx = px + 8, hby = py + 20, hbw = pw - 16, hbh = 6;
  ctx.fillStyle = '#330000';
  ctx.fillRect(hbx, hby, hbw, hbh);
  const hpR = Math.max(0, pet.hp / pet.maxHp);
  ctx.fillStyle = pet.isDead ? '#666' : '#FF69B4';
  ctx.fillRect(hbx, hby, hbw * hpR, hbh);
  // HP text
  ctx.font = '8px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText(Math.max(0, pet.hp) + '/' + pet.maxHp, hbx, hby + hbh + 10);

  // Ability label
  const abilityNames = {
    taunt: 'Taunt',
    autoloot: 'Auto Loot',
    assist: 'Assist',
    ranged: 'Ranged',
    fireAoe: 'Fire AoE'
  };
  ctx.fillStyle = '#AAAAAA';
  ctx.font = '9px monospace';
  ctx.fillText('Ability: ' + (abilityNames[pet.ability] || pet.ability), hbx, hby + hbh + 22);

  // Status
  if (pet.isDead) {
    const secs = Math.ceil(pet.respawnTimer);
    ctx.fillStyle = '#FF4444';
    ctx.fillText('Dead (respawn ' + secs + 's)', hbx + 70, hby + hbh + 10);
  } else {
    ctx.fillStyle = '#88FF88';
    ctx.fillText(pet.state, hbx + 70, hby + hbh + 10);
  }

  // Dismiss button (small X)
  const dbx = px + pw - 18, dby = py + 4, dbs = 12;
  ctx.fillStyle = 'rgba(255,0,0,0.4)';
  ctx.fillRect(dbx, dby, dbs, dbs);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(dbx + 2, dby + 2); ctx.lineTo(dbx + dbs - 2, dby + dbs - 2);
  ctx.moveTo(dbx + dbs - 2, dby + 2); ctx.lineTo(dbx + 2, dby + dbs - 2);
  ctx.stroke();

  ctx.restore();
}

// Check if dismiss button is clicked (called from click handler)
function handlePetPanelClick(mx, my) {
  const pet = petSystem.active;
  if (!pet) return false;
  const dbx = 10 + 160 - 18, dby = 135 + 4, dbs = 12;
  if (mx >= dbx && mx <= dbx + dbs && my >= dby && my <= dby + dbs) {
    petSystem.dismissPet();
    return true;
  }
  return false;
}

// --- GEM CLICK HANDLER ---
// Called when player clicks a soul gem in inventory
// Returns true if the item was a gem and was handled
function handlePetGemClick(item, index) {
  if (!item || item.type !== 'gem' || !item.monsterType) return false;
  petSystem.summonFromGem(item);
  return true;
}

// --- BOT INTEGRATION ---
// Returns true if pet has autoloot and there are nearby items (bot can skip looting)
function petBotIntegration() {
  const pet = petSystem.active;
  if (!pet || pet.isDead || pet.ability !== 'autoloot') return false;
  // Check if any item drops exist nearby
  for (const d of game.itemDrops) {
    const dist = Math.hypot(d.x - pet.x, d.y - pet.y);
    if (dist < TILE * 8) return true;
  }
  return false;
}

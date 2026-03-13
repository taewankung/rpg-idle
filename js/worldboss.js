// ============================================================
// WORLDBOSS — World Boss system: spawn, combat, rewards, HUD
// ============================================================

// --- Boss type definitions ---
const WB_TYPES = {
  golem: {
    name: 'Ancient Golem',
    element: 'earth',
    hp: 5000,
    atk: 60,
    def: 30,
    spd: 1.2,
    color: '#8B6914',
    glowColor: '#44FF44',
    barColor: '#A07830',
    barGlow: '#FFD700',
    spriteName: 'wb_golem',
    abilities: [
      { name: 'Stomp', type: 'stomp', cd: 4, cdTimer: 0 }
    ]
  },
  hydra: {
    name: 'Hydra',
    element: 'poison',
    hp: 4000,
    atk: 50,
    def: 20,
    spd: 1.8,
    color: '#228822',
    glowColor: '#88FF44',
    barColor: '#2E7D32',
    barGlow: '#76FF03',
    spriteName: 'wb_hydra',
    abilities: [
      { name: 'Multi-Bite', type: 'multibite', cd: 3, cdTimer: 0 },
      { name: 'Poison Pool', type: 'poisonpool', cd: 8, cdTimer: 0 }
    ]
  },
  lich: {
    name: 'Lich King',
    element: 'dark',
    hp: 3500,
    atk: 70,
    def: 15,
    spd: 1.5,
    color: '#6A0DAD',
    glowColor: '#00FF88',
    barColor: '#4A148C',
    barGlow: '#EA80FC',
    spriteName: 'wb_lich',
    abilities: [
      { name: 'Death Ray', type: 'deathray', cd: 5, cdTimer: 0 },
      { name: 'Summon Minions', type: 'summon', cd: 99999, cdTimer: 0, triggered: false }
    ]
  }
};

// --- World boss poison pools for Hydra ---
const wbPoisonPools = [];

// --- World Boss State Object ---
const worldBoss = {
  active: null,           // current boss entity or null
  spawnTimer: 300,        // seconds until next spawn
  warningTimer: 0,        // warning countdown (30s)
  warningActive: false,
  damageRanking: {},      // { name: totalDmg }
  participants: new Set(), // entity names that dealt damage
  celebration: 0,         // victory celebration timer (3s)
  fireworks: [],          // particle objects
  minions: [],            // skeleton minions spawned by Lich
  halfHpAnnounced: false,
  quarterHpAnnounced: false,

  // Record damage from an attacker
  recordDamage(attackerName, amount) {
    if (!attackerName || !this.active) return;
    this.damageRanking[attackerName] = (this.damageRanking[attackerName] || 0) + amount;
    this.participants.add(attackerName);
  },

  // Get save data
  getSaveData() {
    return { spawnTimer: this.spawnTimer };
  },

  // Restore from save
  loadSaveData(data) {
    if (data && typeof data.spawnTimer === 'number') {
      this.spawnTimer = data.spawnTimer;
    }
  },

  // Distribute rewards on boss death
  distributeRewards() {
    const boss = this.active;
    if (!boss) return;

    // Sort participants by damage
    const sorted = Object.entries(this.damageRanking)
      .sort((a, b) => b[1] - a[1]);

    // Build lookup for all known entities: player + npcs
    const entityMap = {};
    if (game.player) entityMap[game.player.name] = game.player;
    for (const npc of game.npcPlayers) entityMap[npc.name] = npc;

    sorted.forEach(([name, dmg], rank) => {
      const ent = entityMap[name];
      const totalDmg = sorted.reduce((s, x) => s + x[1], 0) || 1;
      const dmgRatio = dmg / totalDmg;

      // EXP: base 2000 scaled by boss level, weighted by damage share
      const expAmt = Math.round(2000 * boss.level * (0.1 + dmgRatio * 0.9));
      // Gold: base 500 scaled, weighted by damage
      const goldAmt = Math.round(500 * boss.level * (0.1 + dmgRatio * 0.9));

      // Item rarity by rank
      let itemRarity = 'rare';
      if (rank === 0) itemRarity = 'legendary';
      else if (rank <= 2) itemRarity = 'epic';

      if (ent && !ent.isDead) {
        // Grant EXP
        gainExp(ent, expAmt);
        // Grant gold
        ent.gold = (ent.gold || 0) + goldAmt;
        // Grant item
        const item = _genBossItem(boss.level, itemRarity);
        if (item) {
          if (ent === game.player) {
            ent.inventory.push(item);
            autoEquip(ent, item);
            addNotification('[World Boss] ' + item.name, RARITY_COLORS[itemRarity]);
          }
        }
        if (ent === game.player) {
          addLog('[World Boss] You earned ' + expAmt + ' EXP, ' + goldAmt + ' Gold! (Rank #' + (rank + 1) + ')', '#FFD700');
        }
      }
    });

    // Victory announcement
    _wbChat('SYSTEM', boss.name + ' has been slain! Rewards distributed!');
    addLog('[World Boss] ' + boss.name + ' defeated!', '#FF8800');
    sfx.victoryFanfare();

    // Start celebration
    this.celebration = 3;
    _spawnFireworks(40);
  }
};

// --- Helper: generate a boss-tier item ---
function _genBossItem(level, rarity) {
  const mult = rarMult(rarity) * (1 + level * 0.12);
  const tr = Math.random();
  let type, name;
  if (tr < 0.4) { type = 'weapon'; name = PRFX[ri(0, PRFX.length - 1)] + WPNS[ri(0, WPNS.length - 1)]; }
  else if (tr < 0.75) { type = 'armor'; name = PRFX[ri(0, PRFX.length - 1)] + ARMRS[ri(0, ARMRS.length - 1)]; }
  else { type = 'accessory'; name = PRFX[ri(0, PRFX.length - 1)] + ACCS[ri(0, ACCS.length - 1)]; }
  const stats = {};
  if (type === 'weapon') { stats.atk = Math.round((4 + level * 2) * mult); if (Math.random() < 0.5) stats.crit = parseFloat((0.03 * mult).toFixed(2)); }
  else if (type === 'armor') { stats.def = Math.round((2 + level * 1.5) * mult); stats.hp = Math.round((20 + level * 8) * mult); }
  else { stats.spd = parseFloat((0.2 * mult).toFixed(2)); if (Math.random() < 0.5) stats.mp = Math.round((10 + level * 4) * mult); }
  return { name, type, rarity, stats, level, value: Math.round((20 + level * 15) * rarMult(rarity)) };
}

// --- Helper: add a world chat message ---
function _wbChat(name, text) {
  worldChat.unshift({ name, text, timer: 15 });
  if (worldChat.length > 20) worldChat.pop();
}

// --- Helper: spawn firework particles ---
function _spawnFireworks(count) {
  const W = canvas.width, H = canvas.height;
  for (let i = 0; i < count; i++) {
    worldBoss.fireworks.push({
      x: rf(W * 0.1, W * 0.9),
      y: rf(H * 0.1, H * 0.6),
      vx: rf(-120, 120),
      vy: rf(-200, -40),
      color: ['#FF4400', '#FFDD00', '#44FF88', '#44AAFF', '#FF44FF', '#FFFFFF'][ri(0, 5)],
      timer: rf(0.8, 2.0),
      maxTimer: 0,
      size: rf(3, 6)
    });
    worldBoss.fireworks[worldBoss.fireworks.length - 1].maxTimer = worldBoss.fireworks[worldBoss.fireworks.length - 1].timer;
  }
}

// --- Helper: find nearest living entity to world position ---
function _wbNearestTarget(wx, wy) {
  let nearest = null, nd = Infinity;
  const candidates = [];
  if (game.player && !game.player.isDead) candidates.push(game.player);
  for (const npc of game.npcPlayers) { if (!npc.isDead) candidates.push(npc); }
  for (const c of candidates) {
    const d = Math.hypot(c.x - wx, c.y - wy);
    if (d < nd) { nd = d; nearest = c; }
  }
  return nearest;
}

// ============================================================
// SPRITE GENERATION
// ============================================================
function generateWorldBossSprites() {
  // Ancient Golem — frame 0 (standing), frame 1 (stomp)
  for (let f = 0; f < 2; f++) {
    genSprite('wb_golem_' + f, 96, 96, (c, w, h) => {
      const stomp = f === 1;
      // Shadow
      c.fillStyle = 'rgba(0,0,0,0.3)';
      c.beginPath(); c.ellipse(48, 92, 30, 6, 0, 0, Math.PI * 2); c.fill();

      // Legs
      c.fillStyle = '#6B5A3A';
      if (stomp) {
        c.fillRect(18, 64, 18, 26);  // left leg raised slightly
        c.fillRect(60, 68, 18, 22);  // right leg down (stomp)
      } else {
        c.fillRect(18, 64, 18, 24);
        c.fillRect(60, 64, 18, 24);
      }
      // Rocky texture on legs
      c.fillStyle = '#7A6848';
      c.fillRect(20, 68, 6, 4); c.fillRect(30, 72, 5, 3);
      c.fillRect(62, 70, 6, 4); c.fillRect(70, 66, 5, 3);

      // Body
      c.fillStyle = '#8B6914';
      c.fillRect(16, 28, 64, 40);
      // Rock seams
      c.strokeStyle = '#6B5A3A';
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(16, 45); c.lineTo(80, 45); c.stroke();
      c.beginPath(); c.moveTo(40, 28); c.lineTo(40, 68); c.stroke();
      c.beginPath(); c.moveTo(60, 28); c.lineTo(60, 68); c.stroke();

      // Arms
      c.fillStyle = '#8B6914';
      if (stomp) {
        c.fillRect(0, 26, 16, 32);
        c.fillRect(80, 20, 16, 32); // right arm raised for stomp
      } else {
        c.fillRect(0, 30, 16, 28);
        c.fillRect(80, 30, 16, 28);
      }
      // Fists
      c.fillStyle = '#A07830';
      c.beginPath(); c.arc(8, stomp ? 58 : 60, 8, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(88, stomp ? 52 : 60, 8, 0, Math.PI * 2); c.fill();

      // Head
      c.fillStyle = '#8B6914';
      c.fillRect(22, 4, 52, 28);
      // Head rock details
      c.fillStyle = '#7A6020';
      c.fillRect(24, 6, 16, 8);
      c.fillRect(56, 8, 14, 6);

      // Crown-like rocky protrusions
      c.fillStyle = '#9A7830';
      c.fillRect(22, 0, 10, 8);
      c.fillRect(38, 0, 8, 6);
      c.fillRect(58, 0, 10, 8);

      // Glowing eyes
      const eyeGlow = c.createRadialGradient(34, 16, 0, 34, 16, 8);
      eyeGlow.addColorStop(0, 'rgba(160,255,80,1)');
      eyeGlow.addColorStop(1, 'rgba(80,200,0,0)');
      c.fillStyle = eyeGlow;
      c.beginPath(); c.arc(34, 16, 8, 0, Math.PI * 2); c.fill();

      const eyeGlow2 = c.createRadialGradient(62, 16, 0, 62, 16, 8);
      eyeGlow2.addColorStop(0, 'rgba(160,255,80,1)');
      eyeGlow2.addColorStop(1, 'rgba(80,200,0,0)');
      c.fillStyle = eyeGlow2;
      c.beginPath(); c.arc(62, 16, 8, 0, Math.PI * 2); c.fill();

      // Pupils
      c.fillStyle = '#004400';
      c.fillRect(31, 13, 6, 6);
      c.fillRect(59, 13, 6, 6);

      if (stomp) {
        // Stomp shockwave hint
        c.strokeStyle = 'rgba(160,120,20,0.5)';
        c.lineWidth = 3;
        c.beginPath(); c.ellipse(48, 90, 38, 8, 0, 0, Math.PI * 2); c.stroke();
      }
    });
  }

  // Hydra — frame 0 (idle), frame 1 (attack)
  for (let f = 0; f < 2; f++) {
    genSprite('wb_hydra_' + f, 96, 96, (c, w, h) => {
      const attack = f === 1;
      // Shadow
      c.fillStyle = 'rgba(0,0,0,0.3)';
      c.beginPath(); c.ellipse(48, 90, 34, 7, 0, 0, Math.PI * 2); c.fill();

      // Body (serpentine)
      c.fillStyle = '#1A6B1A';
      c.beginPath();
      c.ellipse(48, 65, 28, 24, 0, 0, Math.PI * 2); c.fill();
      // Belly
      c.fillStyle = '#2ECC40';
      c.beginPath();
      c.ellipse(48, 68, 18, 16, 0, 0, Math.PI * 2); c.fill();
      // Scales pattern
      c.fillStyle = '#155A15';
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          c.beginPath();
          c.arc(26 + col * 14 + (row % 2) * 7, 55 + row * 10, 5, 0, Math.PI * 2);
          c.fill();
        }
      }

      // Tail
      c.fillStyle = '#1A6B1A';
      c.beginPath();
      c.moveTo(76, 70); c.quadraticCurveTo(90, 80, 82, 90);
      c.quadraticCurveTo(78, 95, 70, 90);
      c.quadraticCurveTo(75, 80, 62, 75);
      c.fill();

      // Three necks
      const neckData = [
        { ox: 28, oy: 46, hx: attack ? 14 : 16, hy: attack ? 8 : 14, angle: -0.4 },
        { ox: 48, oy: 42, hx: 48, hy: attack ? 4 : 8, angle: 0 },
        { ox: 68, oy: 46, hx: attack ? 80 : 78, hy: attack ? 10 : 14, angle: 0.4 }
      ];
      const headColors = ['#1A8020', '#1A9020', '#1A7A18'];
      neckData.forEach((neck, i) => {
        // Neck
        c.strokeStyle = '#1A6B1A';
        c.lineWidth = 10;
        c.beginPath();
        c.moveTo(neck.ox, neck.oy);
        c.quadraticCurveTo(neck.ox + (neck.hx - neck.ox) * 0.5, neck.oy - 10, neck.hx, neck.hy + 10);
        c.stroke();
        // Head
        c.fillStyle = headColors[i];
        c.beginPath(); c.ellipse(neck.hx, neck.hy + 6, 12, 9, neck.angle, 0, Math.PI * 2); c.fill();
        // Forked tongue
        c.strokeStyle = '#FF2244';
        c.lineWidth = 1.5;
        const tx = neck.hx + Math.cos(neck.angle) * 12;
        const ty = neck.hy + 6 + Math.sin(neck.angle) * 12;
        c.beginPath();
        c.moveTo(tx - Math.cos(neck.angle + Math.PI / 2) * 2, ty - Math.sin(neck.angle + Math.PI / 2) * 2);
        c.lineTo(tx + Math.cos(neck.angle) * 6, ty + Math.sin(neck.angle) * 6);
        c.stroke();
        // Eyes
        c.fillStyle = '#FFFF00';
        c.beginPath(); c.arc(neck.hx - Math.sin(neck.angle) * 4, neck.hy + 3, 3, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#000';
        c.beginPath(); c.arc(neck.hx - Math.sin(neck.angle) * 4, neck.hy + 3, 1.5, 0, Math.PI * 2); c.fill();
      });

      if (attack) {
        // Poison drip
        c.fillStyle = 'rgba(80,220,60,0.6)';
        c.beginPath(); c.arc(14, 22, 5, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(80, 18, 4, 0, Math.PI * 2); c.fill();
      }
    });
  }

  // Lich King — frame 0 (idle), frame 1 (casting)
  for (let f = 0; f < 2; f++) {
    genSprite('wb_lich_' + f, 96, 96, (c, w, h) => {
      const cast = f === 1;
      // Ethereal glow beneath
      const baseGlow = c.createRadialGradient(48, 85, 0, 48, 85, 30);
      baseGlow.addColorStop(0, 'rgba(100,0,160,0.4)');
      baseGlow.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = baseGlow;
      c.beginPath(); c.ellipse(48, 85, 30, 10, 0, 0, Math.PI * 2); c.fill();

      // Robe (main body)
      c.fillStyle = '#3A0068';
      c.beginPath();
      c.moveTo(20, 40);
      c.lineTo(10, 92);
      c.lineTo(86, 92);
      c.lineTo(76, 40);
      c.closePath();
      c.fill();

      // Robe trim
      c.fillStyle = '#6600AA';
      c.beginPath(); c.moveTo(10, 92); c.lineTo(20, 40); c.lineTo(26, 40); c.lineTo(16, 92); c.fill();
      c.beginPath(); c.moveTo(86, 92); c.lineTo(76, 40); c.lineTo(70, 40); c.lineTo(80, 92); c.fill();
      // Rune markings
      c.fillStyle = '#AA00FF';
      c.font = 'bold 10px monospace';
      c.textAlign = 'center';
      c.fillText('᛫', 48, 58);
      c.fillText('᛫', 36, 72);
      c.fillText('᛫', 60, 72);

      // Arms
      if (cast) {
        // Arms raised for spell
        c.fillStyle = '#3A0068';
        c.beginPath(); c.moveTo(20, 44); c.lineTo(2, 22); c.lineTo(8, 20); c.lineTo(26, 44); c.fill();
        c.beginPath(); c.moveTo(76, 44); c.lineTo(92, 20); c.lineTo(96, 24); c.lineTo(80, 44); c.fill();
        // Spell glow on hands
        const hg1 = c.createRadialGradient(4, 18, 0, 4, 18, 10);
        hg1.addColorStop(0, 'rgba(0,255,160,0.9)');
        hg1.addColorStop(1, 'rgba(0,120,80,0)');
        c.fillStyle = hg1;
        c.beginPath(); c.arc(4, 18, 10, 0, Math.PI * 2); c.fill();
        const hg2 = c.createRadialGradient(92, 18, 0, 92, 18, 10);
        hg2.addColorStop(0, 'rgba(0,255,160,0.9)');
        hg2.addColorStop(1, 'rgba(0,120,80,0)');
        c.fillStyle = hg2;
        c.beginPath(); c.arc(92, 18, 10, 0, Math.PI * 2); c.fill();
      } else {
        c.fillStyle = '#3A0068';
        c.fillRect(4, 44, 16, 22);
        c.fillRect(76, 44, 16, 22);
        // Boney hands
        c.fillStyle = '#DDD8C4';
        c.fillRect(4, 62, 16, 6);
        c.fillRect(76, 62, 16, 6);
      }

      // Neck
      c.fillStyle = '#DDD8C4';
      c.fillRect(38, 32, 20, 12);

      // Skull head
      c.fillStyle = '#EDE8D0';
      c.beginPath();
      c.ellipse(48, 20, 22, 20, 0, 0, Math.PI * 2); c.fill();
      // Skull cheekbones
      c.fillStyle = '#D4CEB8';
      c.beginPath(); c.ellipse(32, 24, 8, 5, -0.4, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(64, 24, 8, 5, 0.4, 0, Math.PI * 2); c.fill();
      // Dark eye sockets
      c.fillStyle = '#1A001A';
      c.beginPath(); c.ellipse(38, 16, 8, 7, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(58, 16, 8, 7, 0, 0, Math.PI * 2); c.fill();
      // Green glowing eyes
      const eg1 = c.createRadialGradient(38, 16, 0, 38, 16, 7);
      eg1.addColorStop(0, 'rgba(0,255,120,1)');
      eg1.addColorStop(1, 'rgba(0,80,40,0)');
      c.fillStyle = eg1;
      c.beginPath(); c.arc(38, 16, 7, 0, Math.PI * 2); c.fill();
      const eg2 = c.createRadialGradient(58, 16, 0, 58, 16, 7);
      eg2.addColorStop(0, 'rgba(0,255,120,1)');
      eg2.addColorStop(1, 'rgba(0,80,40,0)');
      c.fillStyle = eg2;
      c.beginPath(); c.arc(58, 16, 7, 0, Math.PI * 2); c.fill();
      // Pupils
      c.fillStyle = '#003300';
      c.beginPath(); c.arc(38, 16, 3, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(58, 16, 3, 0, Math.PI * 2); c.fill();
      // Nose cavity
      c.fillStyle = '#2A1A2A';
      c.beginPath(); c.moveTo(46, 24); c.lineTo(50, 24); c.lineTo(48, 28); c.fill();
      // Jaw / teeth
      c.fillStyle = '#EDE8D0';
      c.fillRect(36, 30, 24, 6);
      c.fillStyle = '#2A1A2A';
      for (let t = 0; t < 5; t++) {
        c.fillRect(37 + t * 5, 31, 3, 4);
      }
      // Crown
      c.fillStyle = '#8B006B';
      c.beginPath();
      c.moveTo(26, 4); c.lineTo(30, 0); c.lineTo(34, 5);
      c.lineTo(40, 0); c.lineTo(48, 3);
      c.lineTo(56, 0); c.lineTo(62, 5);
      c.lineTo(66, 0); c.lineTo(70, 4);
      c.lineTo(70, 10); c.lineTo(26, 10); c.closePath(); c.fill();
      // Crown gems
      c.fillStyle = '#00FF88';
      c.beginPath(); c.arc(48, 4, 3, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#FF44AA';
      c.beginPath(); c.arc(34, 4, 2, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(62, 4, 2, 0, Math.PI * 2); c.fill();

      if (cast) {
        // Dark aura pulses
        c.strokeStyle = 'rgba(180,0,255,0.4)';
        c.lineWidth = 2;
        c.beginPath(); c.arc(48, 48, 44, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = 'rgba(0,255,120,0.3)';
        c.lineWidth = 1.5;
        c.beginPath(); c.arc(48, 48, 38, 0, Math.PI * 2); c.stroke();
      }
    });
  }
}

// ============================================================
// BOSS ENTITY CREATION
// ============================================================
function _createBossEntity(typeKey, wx, wy) {
  const def = WB_TYPES[typeKey];
  const hpMul = typeof progressionSystem !== 'undefined' ? progressionSystem.getBossHpMultiplier('worldBoss') : 1;
  const bossHp = Math.round(def.hp * hpMul);
  return {
    entityType: 'worldboss',
    bossType: typeKey,
    name: def.name,
    element: def.element,
    level: 20,
    hp: bossHp,
    maxHp: bossHp,
    atk: def.atk,
    def: def.def,
    spd: def.spd,
    crit: 0.1,
    x: wx,
    y: wy,
    dir: 'down',
    frame: 0,
    animTimer: 0,
    state: 'combat',
    target: null,
    attackTimer: 0,
    attackRange: TILE * 2,
    aggroRange: TILE * 20,
    isDead: false,
    // Abilities have their own cooldown state (deep copy per instance)
    abilities: def.abilities.map(a => ({ ...a })),
    // Extra state flags
    halfHpTriggered: false,
    quarterHpTriggered: false
  };
}

// ============================================================
// BOSS ABILITIES
// ============================================================
function _bossAbility_stomp(boss) {
  screenShake(10, 0.4);
  sfx.spell();
  addEffect(boss.x, boss.y, 'aoe', 0.8);
  const aoeR = TILE * 4;
  const targets = [];
  if (game.player && !game.player.isDead) targets.push(game.player);
  for (const npc of game.npcPlayers) { if (!npc.isDead) targets.push(npc); }
  let hitCount = 0;
  for (const t of targets) {
    const d = Math.hypot(t.x - boss.x, t.y - boss.y);
    if (d <= aoeR) {
      const dmg = Math.max(1, Math.round(boss.atk * 1.4 - t.def * 0.5 + rf(-5, 5)));
      t.hp = Math.max(0, t.hp - dmg);
      addDmg(t.x, t.y - TILE, '-' + dmg + '!', '#FF6600');
      addEffect(t.x, t.y, 'hit', 0.35);
      hitCount++;
      if (t.hp <= 0) { t.isDead = true; t.respawnTimer = 5; addLog(t.name + ' was crushed by ' + boss.name + '!', '#FF4444'); }
    }
  }
  addLog('[' + boss.name + '] STOMP! ' + hitCount + ' targets hit!', '#FF8800');
  _wbChat(boss.name, '*STOMP* Feel the earth tremble!');
}

function _bossAbility_multibite(boss) {
  sfx.hit();
  addEffect(boss.x, boss.y, 'slash', 0.5);
  const target = boss.target;
  if (!target || target.isDead) return;
  const dist = Math.hypot(target.x - boss.x, target.y - boss.y);
  if (dist > TILE * 5) return;
  for (let h = 0; h < 3; h++) {
    const dmg = Math.max(1, Math.round(boss.atk * 0.8 - target.def * 0.5 + rf(-3, 3)));
    target.hp = Math.max(0, target.hp - dmg);
    addDmg(target.x + ri(-10, 10), target.y - TILE + ri(-5, 5), '-' + dmg, '#88FF44');
    worldBoss.recordDamage('__boss', 0); // placeholder; real damage tracked via player attacks
    if (target.hp <= 0) { target.isDead = true; target.respawnTimer = 5; addLog(target.name + ' was bitten by ' + boss.name + '!', '#FF4444'); break; }
  }
  addLog('[' + boss.name + '] Multi-Bite! (3-hit combo)', '#88FF44');
}

function _bossAbility_poisonpool(boss) {
  sfx.spell();
  addEffect(boss.x, boss.y, 'aoe', 0.6);
  // Drop 3 poison pools around boss
  for (let i = 0; i < 3; i++) {
    const a = (Math.PI * 2 * i / 3) + Math.random() * 0.5;
    const r = TILE * (2 + Math.random() * 2);
    wbPoisonPools.push({
      x: boss.x + Math.cos(a) * r,
      y: boss.y + Math.sin(a) * r,
      timer: 8,
      tickTimer: 0,
      radius: TILE * 1.5
    });
  }
  addLog('[' + boss.name + '] POISON POOL!', '#88FF44');
  _wbChat(boss.name, 'Taste my venom!');
}

function _bossAbility_deathray(boss) {
  if (!boss.target || boss.target.isDead) return;
  sfx.spell();
  screenShake(6, 0.3);
  addEffect(boss.x, boss.y, 'buff', 0.4);
  // Hit all targets in a line from boss toward its target
  const dx = boss.target.x - boss.x, dy = boss.target.y - boss.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / len, ny = dy / len;
  const lineR = TILE * 6;
  const targets = [];
  if (game.player && !game.player.isDead) targets.push(game.player);
  for (const npc of game.npcPlayers) { if (!npc.isDead) targets.push(npc); }
  let hitCount = 0;
  for (const t of targets) {
    // Project target onto ray, measure perpendicular distance
    const tx = t.x - boss.x, ty2 = t.y - boss.y;
    const dot = tx * nx + ty2 * ny;
    if (dot < 0 || dot > lineR) continue;
    const perpX = tx - dot * nx, perpY = ty2 - dot * ny;
    const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);
    if (perpDist > TILE * 1.2) continue;
    const dmg = Math.max(1, Math.round(boss.atk * 1.8 - t.def * 0.5 + rf(-4, 4)));
    t.hp = Math.max(0, t.hp - dmg);
    addDmg(t.x, t.y - TILE, '-' + dmg + '!', '#AA00FF');
    addEffect(t.x, t.y, 'hit', 0.3);
    hitCount++;
    if (t.hp <= 0) { t.isDead = true; t.respawnTimer = 5; addLog(t.name + ' was disintegrated by ' + boss.name + '!', '#FF4444'); }
  }
  addLog('[' + boss.name + '] DEATH RAY! ' + hitCount + ' targets hit!', '#AA00FF');
}

function _bossAbility_summon(boss) {
  if (boss.halfHpTriggered) return; // already summoned
  boss.halfHpTriggered = true;
  sfx.spell();
  screenShake(5, 0.3);
  // Spawn 3 skeleton minions near boss
  for (let i = 0; i < 3; i++) {
    const a = (Math.PI * 2 * i / 3);
    const r = TILE * (3 + Math.random() * 2);
    const mx = boss.x + Math.cos(a) * r;
    const my = boss.y + Math.sin(a) * r;
    const minion = createMon('skeleton', mx, my);
    minion.name = 'Skeleton Servant';
    minion.level = 15;
    minion.maxHp = 300; minion.hp = 300;
    minion.atk = 25; minion.def = 10;
    minion.aggroRange = TILE * 12;
    worldBoss.minions.push(minion);
    game.monsters.push(minion);
  }
  addLog('[' + boss.name + '] Summons skeleton minions!', '#AA00FF');
  _wbChat(boss.name, 'Rise, my servants! Destroy them!');
  addNotification(boss.name + ' summons skeleton minions!', '#AA44FF');
}

// ============================================================
// MAIN UPDATE
// ============================================================
function updateWorldBoss(dt) {
  // --- Countdown phase ---
  if (!worldBoss.active) {
    worldBoss.spawnTimer -= dt;

    // Warning phase at 30s
    if (worldBoss.spawnTimer <= 30 && !worldBoss.warningActive) {
      worldBoss.warningActive = true;
      worldBoss.warningTimer = 30;
      const typeNames = Object.values(WB_TYPES).map(t => t.name).join(' / ');
      _wbChat('SYSTEM', 'WARNING: A World Boss approaches! [' + typeNames + ']');
      addNotification('World Boss spawning in 30s!', '#FF4400');
      addLog('[World Boss] WARNING: A world boss will spawn in 30 seconds!', '#FF4400');
    }

    if (worldBoss.warningActive) {
      worldBoss.warningTimer -= dt;
    }

    // Spawn
    if (worldBoss.spawnTimer <= 0) {
      _spawnWorldBoss();
    }
  } else {
    // --- Active boss logic ---
    _updateActiveBoss(dt);
  }

  // --- Update celebration ---
  if (worldBoss.celebration > 0) {
    worldBoss.celebration -= dt;
    // Keep spawning more fireworks during celebration
    if (Math.random() < dt * 20) _spawnFireworks(3);
    if (worldBoss.celebration <= 0) {
      worldBoss.celebration = 0;
      worldBoss.fireworks = [];
    }
  }

  // --- Update firework particles ---
  for (let i = worldBoss.fireworks.length - 1; i >= 0; i--) {
    const fw = worldBoss.fireworks[i];
    fw.x += fw.vx * dt;
    fw.y += fw.vy * dt;
    fw.vy += 120 * dt; // gravity
    fw.timer -= dt;
    if (fw.timer <= 0) worldBoss.fireworks.splice(i, 1);
  }

  // --- Update poison pools ---
  for (let i = wbPoisonPools.length - 1; i >= 0; i--) {
    const pool = wbPoisonPools[i];
    pool.timer -= dt;
    if (pool.timer <= 0) { wbPoisonPools.splice(i, 1); continue; }
    pool.tickTimer -= dt;
    if (pool.tickTimer <= 0) {
      pool.tickTimer = 1.0;
      const targets = [];
      if (game.player && !game.player.isDead) targets.push(game.player);
      for (const npc of game.npcPlayers) { if (!npc.isDead) targets.push(npc); }
      for (const t of targets) {
        if (Math.hypot(t.x - pool.x, t.y - pool.y) <= pool.radius) {
          const dmg = Math.max(1, ri(8, 18));
          t.hp = Math.max(0, t.hp - dmg);
          addDmg(t.x, t.y - TILE, '-' + dmg + ' PSN', '#88FF44');
          if (t.hp <= 0) { t.isDead = true; t.respawnTimer = 5; addLog(t.name + ' was poisoned to death!', '#FF4444'); }
        }
      }
    }
  }
}

function _spawnWorldBoss() {
  // Reset timers
  worldBoss.spawnTimer = 300;
  worldBoss.warningActive = false;
  worldBoss.warningTimer = 0;
  worldBoss.damageRanking = {};
  worldBoss.participants = new Set();
  worldBoss.halfHpAnnounced = false;
  worldBoss.quarterHpAnnounced = false;
  worldBoss.minions = [];
  wbPoisonPools.length = 0;

  // Pick a random boss type
  const types = Object.keys(WB_TYPES);
  const typeKey = types[ri(0, types.length - 1)];

  // Find a walkable position 20-40 tiles from town center
  const cx = Math.floor(MAP_W / 2) * TILE + TILE / 2;
  const cy = Math.floor(MAP_H / 2) * TILE + TILE / 2;
  const pos = map.findRandomWalkable(cx, cy, 20, 40);
  if (!pos) {
    // Fallback: edge of map
    worldBoss.spawnTimer = 60;
    return;
  }

  worldBoss.active = _createBossEntity(typeKey, pos.x, pos.y);

  const bossName = WB_TYPES[typeKey].name;
  _wbChat('SYSTEM', '!!! ' + bossName + ' has appeared! Rally to defeat it! !!!');
  addNotification('WORLD BOSS: ' + bossName + ' has spawned!', '#FF4400');
  addLog('[World Boss] ' + bossName + ' has appeared! All heroes, rush to battle!', '#FF4400');
  screenShake(12, 0.6);
  sfx.spell();
}

function _updateActiveBoss(dt) {
  const boss = worldBoss.active;
  if (!boss || boss.isDead) return;

  // Animation
  boss.animTimer += dt;
  if (boss.animTimer > 0.3) {
    boss.frame = (boss.frame + 1) % 2;
    boss.animTimer = 0;
  }

  // Attack cooldown
  if (boss.attackTimer > 0) boss.attackTimer -= dt;

  // Ability cooldowns
  for (const ab of boss.abilities) {
    if (ab.cdTimer > 0) ab.cdTimer -= dt;
  }

  // Find nearest target
  boss.target = _wbNearestTarget(boss.x, boss.y);
  if (!boss.target) return;

  const dx = boss.target.x - boss.x;
  const dy = boss.target.y - boss.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Direction
  if (Math.abs(dx) > Math.abs(dy)) boss.dir = dx > 0 ? 'right' : 'left';
  else boss.dir = dy > 0 ? 'down' : 'up';

  // Move toward target if out of melee range
  if (dist > boss.attackRange) {
    const s = boss.spd * TILE * dt;
    const nx = boss.x + (dx / dist) * s;
    const ny = boss.y + (dy / dist) * s;
    if (map.isWalkable(Math.floor(nx / TILE), Math.floor(ny / TILE))) { boss.x = nx; boss.y = ny; }
    else if (map.isWalkable(Math.floor(nx / TILE), Math.floor(boss.y / TILE))) boss.x = nx;
    else if (map.isWalkable(Math.floor(boss.x / TILE), Math.floor(ny / TILE))) boss.y = ny;
  }

  // Basic melee attack
  if (dist <= boss.attackRange * 1.5 && boss.attackTimer <= 0) {
    const dmg = Math.max(1, Math.round(boss.atk - boss.target.def * 0.5 + rf(-4, 4)));
    boss.target.hp = Math.max(0, boss.target.hp - dmg);
    addDmg(boss.target.x, boss.target.y - TILE, '-' + dmg, '#FF8888');
    addEffect(boss.target.x, boss.target.y, 'hit', 0.3);
    sfx.hit();
    boss.attackTimer = 1 / boss.spd;
    if (boss.target.hp <= 0) {
      boss.target.isDead = true;
      boss.target.respawnTimer = 5;
      addLog(boss.target.name + ' was killed by ' + boss.name + '!', '#FF4444');
      if (boss.target === game.player && typeof questSystem !== 'undefined') questSystem.onPlayerDeath();
      boss.target = null;
    }
  }

  // Special abilities
  for (const ab of boss.abilities) {
    if (ab.cdTimer > 0) continue;
    if (ab.type === 'summon' && ab.triggered) continue; // already triggered
    // Summon triggers at 50% HP only
    if (ab.type === 'summon') {
      if (boss.hp / boss.maxHp > 0.5) continue;
      ab.triggered = true;
      ab.cdTimer = ab.cd;
      _bossAbility_summon(boss);
      continue;
    }
    // Other abilities check range
    if (!boss.target || boss.target.isDead) continue;
    ab.cdTimer = ab.cd;
    switch (ab.type) {
      case 'stomp':       _bossAbility_stomp(boss); break;
      case 'multibite':   _bossAbility_multibite(boss); break;
      case 'poisonpool':  _bossAbility_poisonpool(boss); break;
      case 'deathray':    _bossAbility_deathray(boss); break;
    }
  }

  // HP milestone announcements
  const hpR = boss.hp / boss.maxHp;
  if (!worldBoss.halfHpAnnounced && hpR <= 0.5) {
    worldBoss.halfHpAnnounced = true;
    _wbChat('SYSTEM', boss.name + ' is at 50% HP! Push harder!');
    addLog('[World Boss] ' + boss.name + ' is at 50% HP!', '#FFAA00');
    addNotification(boss.name + ' - 50% HP!', '#FFAA00');
    screenShake(8, 0.4);
  }
  if (!worldBoss.quarterHpAnnounced && hpR <= 0.25) {
    worldBoss.quarterHpAnnounced = true;
    _wbChat('SYSTEM', boss.name + ' is at 25% HP! Almost down!');
    addLog('[World Boss] ' + boss.name + ' is at 25% HP! Finish it!', '#FF4400');
    addNotification(boss.name + ' - 25% HP! FINISH IT!', '#FF4400');
    screenShake(10, 0.5);
  }

  // Death check
  if (boss.hp <= 0 && !boss.isDead) {
    boss.isDead = true;
    boss.hp = 0;
    _wbChat('SYSTEM', boss.name + ' has been DEFEATED!');
    addLog('[World Boss] ' + boss.name + ' has been defeated! Heroes victorious!', '#FFD700');
    screenShake(14, 0.8);
    sfx.victoryFanfare();
    worldBoss.distributeRewards();
    // Remove minions
    for (const minion of worldBoss.minions) {
      if (!minion.isDead) { minion.isDead = true; minion.respawnTimer = 0; }
    }
    worldBoss.minions = [];
    wbPoisonPools.length = 0;
    // Delay clearing the active boss so it can be seen dying
    setTimeout(() => { worldBoss.active = null; }, 3000);
  }
}

// ============================================================
// NPC INTEGRATION
// ============================================================
// Returns target coords for NPCs to path toward boss, or null
function worldBossNPCLogic(npc) {
  if (!worldBoss.active || worldBoss.active.isDead) return null;
  const boss = worldBoss.active;
  // NPCs within aggro range of boss should rush it
  const d = Math.hypot(npc.x - boss.x, npc.y - boss.y);
  if (d < TILE * 30) {
    // Return approximate melee position near boss
    const a = Math.random() * Math.PI * 2;
    return {
      x: boss.x + Math.cos(a) * TILE * 2,
      y: boss.y + Math.sin(a) * TILE * 2
    };
  }
  return null;
}

// Called from combat when an entity hits the world boss.
// attackerName: string, amount: number
function onWorldBossHit(attackerName, amount) {
  worldBoss.recordDamage(attackerName, amount);
}

// ============================================================
// DRAWING FUNCTIONS
// ============================================================

// Draw the world boss entity in the game world
function drawWorldBoss() {
  const boss = worldBoss.active;
  if (!boss || boss.isDead) return;

  const { x: sx, y: sy } = camera.worldToScreen(boss.x, boss.y);
  const def = WB_TYPES[boss.bossType];
  const sprKey = def.spriteName + '_' + boss.frame;
  const spr = spriteCache[sprKey];

  ctx.save();

  // Outer glow
  const glowR = 60 + Math.sin(Date.now() / 300) * 8;
  const grd = ctx.createRadialGradient(sx, sy, 10, sx, sy, glowR);
  grd.addColorStop(0, def.glowColor + '55');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(sx, sy, glowR, 0, Math.PI * 2); ctx.fill();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 46, 44, 10, 0, 0, Math.PI * 2); ctx.fill();

  // Boss sprite (96x96)
  ctx.imageSmoothingEnabled = false;
  if (spr) {
    ctx.drawImage(spr, sx - 48, sy - 48, 96, 96);
  } else {
    ctx.fillStyle = def.color;
    ctx.fillRect(sx - 48, sy - 48, 96, 96);
  }

  // Name label
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.strokeText(boss.name, sx, sy - 58);
  ctx.fillStyle = def.glowColor;
  ctx.fillText(boss.name, sx, sy - 58);

  // Small HP bar above boss
  const bw = 80, bh = 6, bx = sx - bw / 2, by = sy - 68;
  const hpR = Math.max(0, boss.hp / boss.maxHp);
  ctx.fillStyle = '#330000';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = def.barColor;
  ctx.fillRect(bx, by, bw * hpR, bh);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, bw, bh);

  ctx.restore();

  // Draw poison pools for Hydra
  for (const pool of wbPoisonPools) {
    const { x: px, y: py } = camera.worldToScreen(pool.x, pool.y);
    ctx.save();
    ctx.globalAlpha = 0.55 * (pool.timer / 8);
    const pGrd = ctx.createRadialGradient(px, py, 0, px, py, pool.radius);
    pGrd.addColorStop(0, 'rgba(60,220,20,0.8)');
    pGrd.addColorStop(1, 'rgba(20,100,0,0)');
    ctx.fillStyle = pGrd;
    ctx.beginPath(); ctx.arc(px, py, pool.radius, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// Draw death ray visual effect
function drawWorldBossDeathRay() {
  const boss = worldBoss.active;
  if (!boss || boss.bossType !== 'lich' || !boss.target || boss.target.isDead) return;
  // Check if death ray ability is on very short cooldown (just fired)
  const ab = boss.abilities.find(a => a.type === 'deathray');
  if (!ab || ab.cdTimer < ab.cd - 0.4) return; // only show for 0.4s after fire

  const { x: bsx, y: bsy } = camera.worldToScreen(boss.x, boss.y);
  const { x: tsx, y: tsy } = camera.worldToScreen(boss.target.x, boss.target.y);
  ctx.save();
  ctx.globalAlpha = (ab.cdTimer - (ab.cd - 0.4)) / 0.4;
  const rayGrd = ctx.createLinearGradient(bsx, bsy, tsx, tsy);
  rayGrd.addColorStop(0, '#AA00FF');
  rayGrd.addColorStop(0.5, '#00FF88');
  rayGrd.addColorStop(1, '#AA00FF');
  ctx.strokeStyle = rayGrd;
  ctx.lineWidth = 8;
  ctx.shadowColor = '#AA00FF';
  ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.moveTo(bsx, bsy); ctx.lineTo(tsx, tsy); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#FFFFFF';
  ctx.beginPath(); ctx.moveTo(bsx, bsy); ctx.lineTo(tsx, tsy); ctx.stroke();
  ctx.restore();
}

// Full-screen warning overlay during countdown
function drawWorldBossWarning() {
  if (!worldBoss.warningActive || worldBoss.active) return;
  const t = worldBoss.warningTimer;
  if (t <= 0) return;

  const W = canvas.width, H = canvas.height;
  const pulse = 0.15 + 0.1 * Math.sin(Date.now() / 200);

  ctx.save();
  // Red vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(180,0,0,' + pulse.toFixed(2) + ')');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Warning text
  const alpha = t < 2 ? t / 2 : 1;
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';

  // Title
  ctx.font = 'bold 36px sans-serif';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  ctx.strokeText('! WORLD BOSS INCOMING !', W / 2, H / 2 - 40);
  ctx.fillStyle = '#FF4400';
  ctx.fillText('! WORLD BOSS INCOMING !', W / 2, H / 2 - 40);

  // Countdown
  ctx.font = 'bold 64px monospace';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 8;
  ctx.strokeText(Math.ceil(t) + 's', W / 2, H / 2 + 30);
  ctx.fillStyle = '#FFD700';
  ctx.fillText(Math.ceil(t) + 's', W / 2, H / 2 + 30);

  // Sub-text
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#FFAAAA';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.strokeText('Prepare for battle, heroes!', W / 2, H / 2 + 80);
  ctx.fillText('Prepare for battle, heroes!', W / 2, H / 2 + 80);

  ctx.restore();
}

// Live damage leaderboard on the right side
function drawWorldBossDamageRanking() {
  const boss = worldBoss.active;
  if (!boss) return;

  const entries = Object.entries(worldBoss.damageRanking)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  if (!entries.length) return;

  const panelW = 200, rowH = 20;
  const panelH = 28 + entries.length * rowH + 10;
  const px = canvas.width - panelW - 10;
  const py = 160;

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  roundRect(ctx, px, py, panelW, panelH, 8);
  ctx.fill();
  ctx.strokeStyle = WB_TYPES[boss.bossType].glowColor + '88';
  ctx.lineWidth = 1.5;
  roundRect(ctx, px, py, panelW, panelH, 8);
  ctx.stroke();

  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('DAMAGE RANKING', px + panelW / 2, py + 16);

  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#AAAAAA'];
  const totalDmg = entries.reduce((s, x) => s + x[1], 0) || 1;

  entries.forEach(([name, dmg], i) => {
    const ry = py + 28 + i * rowH;
    const pct = dmg / totalDmg;
    // Background bar
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(px + 4, ry, (panelW - 8) * pct, rowH - 2);
    // Rank number
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = rankColors[Math.min(i, 3)];
    ctx.fillText('#' + (i + 1), px + 6, ry + 14);
    // Name
    ctx.fillStyle = '#fff';
    ctx.fillText(name.substring(0, 12), px + 26, ry + 14);
    // Damage
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FF8888';
    ctx.fillText(dmg.toLocaleString(), px + panelW - 6, ry + 14);
    ctx.textAlign = 'left';
  });

  ctx.restore();
}

// Large boss HP bar at the top of the screen
function drawWorldBossHPBar() {
  const boss = worldBoss.active;
  if (!boss || boss.isDead) return;
  const def = WB_TYPES[boss.bossType];

  const bw = 500, bh = 28, bx = (canvas.width - bw) / 2, by = 30;

  ctx.save();
  // Panel background
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  roundRect(ctx, bx - 8, by - 22, bw + 16, bh + 36, 8);
  ctx.fill();
  ctx.strokeStyle = def.glowColor + 'AA';
  ctx.lineWidth = 2;
  roundRect(ctx, bx - 8, by - 22, bw + 16, bh + 36, 8);
  ctx.stroke();

  // Boss name + element
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = def.glowColor;
  ctx.fillText('⚔ ' + boss.name + ' [' + boss.element.toUpperCase() + ']', canvas.width / 2, by - 7);

  // HP bar background
  ctx.fillStyle = '#1A0000';
  ctx.fillRect(bx, by, bw, bh);

  // HP bar fill
  const hpR = Math.max(0, boss.hp / boss.maxHp);
  const barGrd = ctx.createLinearGradient(bx, by, bx + bw * hpR, by);
  barGrd.addColorStop(0, def.barColor);
  barGrd.addColorStop(1, def.barGlow);
  ctx.fillStyle = barGrd;
  ctx.fillRect(bx, by, bw * hpR, bh);

  // Segmented lines
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  for (let seg = 1; seg < 10; seg++) {
    const lx = bx + bw * seg / 10;
    ctx.beginPath(); ctx.moveTo(lx, by); ctx.lineTo(lx, by + bh); ctx.stroke();
  }

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, bw, bh);

  // HP text
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText(boss.hp.toLocaleString() + ' / ' + boss.maxHp.toLocaleString(), canvas.width / 2, by + bh - 6);

  // Participants count
  ctx.font = '10px monospace';
  ctx.fillStyle = '#AAAAAA';
  ctx.fillText('Combatants: ' + worldBoss.participants.size, canvas.width / 2, by + bh + 12);

  ctx.restore();
}

// Victory celebration: fireworks + VICTORY text
function drawWorldBossCelebration() {
  if (worldBoss.celebration <= 0 && worldBoss.fireworks.length === 0) return;

  const W = canvas.width, H = canvas.height;

  // Draw fireworks
  ctx.save();
  for (const fw of worldBoss.fireworks) {
    const alpha = fw.timer / fw.maxTimer;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fw.color;
    ctx.beginPath();
    ctx.arc(fw.x, fw.y, Math.max(0.5, fw.size * alpha), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Victory banner
  if (worldBoss.celebration > 0) {
    const fadeIn = Math.min(1, (3 - worldBoss.celebration) / 0.3);
    const pulse = 1 + 0.06 * Math.sin(Date.now() / 120);

    ctx.save();
    ctx.globalAlpha = fadeIn;
    ctx.textAlign = 'center';

    ctx.save();
    ctx.translate(W / 2, H / 2 - 30);
    ctx.scale(pulse, pulse);
    ctx.font = 'bold 72px sans-serif';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 8;
    ctx.strokeText('VICTORY!', 0, 0);
    const vGrd = ctx.createLinearGradient(-200, -60, 200, 0);
    vGrd.addColorStop(0, '#FFD700');
    vGrd.addColorStop(0.5, '#FFFFFF');
    vGrd.addColorStop(1, '#FFD700');
    ctx.fillStyle = vGrd;
    ctx.fillText('VICTORY!', 0, 0);
    ctx.restore();

    ctx.font = 'bold 22px sans-serif';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText('World Boss Defeated!', W / 2, H / 2 + 30);
    ctx.fillStyle = '#FF8800';
    ctx.fillText('World Boss Defeated!', W / 2, H / 2 + 30);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#AACCFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText('Rewards have been distributed', W / 2, H / 2 + 58);
    ctx.fillText('Rewards have been distributed', W / 2, H / 2 + 58);

    ctx.restore();
  }
}

// Blinking red dot on minimap for world boss
function drawWorldBossMinimapIcon() {
  if (typeof dungeon !== 'undefined' && dungeon.active) return; // Hide in dungeon
  const boss = worldBoss.active;
  if (!boss || boss.isDead) return;

  const mm = 140;
  const mx = canvas.width - mm - 10, my = 10;
  const ts = mm / MAP_W, th = mm / MAP_H;

  const blink = Math.floor(Date.now() / 300) % 2 === 0;

  ctx.save();
  if (blink) {
    // Outer glow ring
    const dotX = mx + (boss.x / (MAP_W * TILE)) * mm;
    const dotY = my + (boss.y / (MAP_H * TILE)) * mm;
    ctx.strokeStyle = 'rgba(255,80,0,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(dotX, dotY, 7, 0, Math.PI * 2); ctx.stroke();
    // Main dot
    ctx.fillStyle = '#FF2200';
    ctx.beginPath(); ctx.arc(dotX, dotY, 5, 0, Math.PI * 2); ctx.fill();
    // Inner white core
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(dotX, dotY, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// Draw the spawn countdown timer (small, when not in warning phase)
function drawWorldBossSpawnTimer() {
  if (worldBoss.active || worldBoss.warningActive) return;
  if (typeof dungeon !== 'undefined' && dungeon.active) return; // Hide in dungeon
  const t = worldBoss.spawnTimer;
  const mm = 140;
  const mx = canvas.width - mm - 10, my = 10;

  ctx.save();
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FF6622';
  const mins = Math.floor(t / 60);
  const secs = Math.floor(t % 60);
  ctx.fillText('BOSS: ' + mins + ':' + (secs < 10 ? '0' : '') + secs, mx + mm / 2, my + mm + 24);
  ctx.restore();
}

// ============================================================
// MAIN WORLD BOSS DRAW (called each frame from render)
// ============================================================
function drawWorldBossSystem() {
  drawWorldBoss();
  if (worldBoss.active && worldBoss.active.bossType === 'lich') drawWorldBossDeathRay();
  drawWorldBossWarning();
  drawWorldBossCelebration();
  if (worldBoss.active && !worldBoss.active.isDead) {
    drawWorldBossHPBar();
    drawWorldBossDamageRanking();
  }
}

function drawWorldBossHUDOverlays() {
  drawWorldBossMinimapIcon();
  drawWorldBossSpawnTimer();
}

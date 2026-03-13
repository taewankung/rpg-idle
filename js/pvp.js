// ============================================================
// PVP ARENA — 1v1 PvP matches against AI opponents
// ============================================================
const pvpArena = {
  active: false,
  panelOpen: false,
  opponent: null,
  timer: 60,
  countdown: 3,
  state: 'idle', // 'idle' | 'countdown' | 'fighting' | 'result'
  result: null,   // 'win' | 'lose' | null
  stats: { wins: 0, losses: 0, winStreak: 0, bestStreak: 0, arenaPoints: 0 },
  arenaMap: [],
  autoArena: false,
  autoTimer: 300,
  // Saved player position to restore after match
  _savedPos: null,
  _savedBotState: null,
  _resultRewards: null,
  // Shop tab
  _shopTab: false,
  // Leaderboard tab
  _leaderTab: false,
  // Arena NPC position
  arenaNPC: null,

  // ---- Arena NPC names pool ----
  _opponentNames: [
    'Gladiator', 'Warlord', 'BladeStorm', 'ShadowFang', 'IronJaw',
    'CrimsonBlade', 'FrostBite', 'ThunderAxe', 'DarkFlame', 'SilverWolf',
    'VoidWalker', 'StormBreaker', 'BoneKnight', 'SoulReaper', 'PhantomEdge'
  ],

  // ---- SHOP ITEMS ----
  _shopItems: [
    { name: 'Arena Potion', desc: 'Fully restores HP & MP in overworld', cost: 50, type: 'potion' },
    { name: 'Arena Weapon', desc: 'Powerful class-specific weapon', cost: 100, type: 'weapon' },
    { name: 'Arena Armor', desc: 'Top tier defensive armor', cost: 200, type: 'armor' },
    { name: 'Champion Title', desc: 'Golden name + glowing aura', cost: 500, type: 'title' },
    { name: 'Arena Pet', desc: 'Gladiator companion pet', cost: 1000, type: 'pet' }
  ],

  // ---- LEADERBOARD ----
  _leaderboardData: [],

  // ============================================================
  //  SPRITES
  // ============================================================
  generateSprites() {
    // Arena master: armored figure with sword (16x16 pixel art)
    genSprite('arena_master', 16, 16, (c) => {
      // Helmet
      c.fillStyle = '#9ca3af'; c.fillRect(5, 0, 6, 4);
      c.fillStyle = '#6b7280'; c.fillRect(5, 3, 6, 2);
      // Visor slit
      c.fillStyle = '#111'; c.fillRect(6, 2, 4, 1);
      // Head
      c.fillStyle = '#f4c99a'; c.fillRect(6, 4, 4, 3);
      // Body armor
      c.fillStyle = '#bdc3c7'; c.fillRect(4, 7, 8, 5);
      c.fillStyle = '#c0392b'; c.fillRect(6, 7, 4, 5);
      // Shoulder plates
      c.fillStyle = '#9ca3af'; c.fillRect(2, 7, 3, 3);
      c.fillStyle = '#9ca3af'; c.fillRect(11, 7, 3, 3);
      // Arms
      c.fillStyle = '#bdc3c7'; c.fillRect(2, 10, 2, 3);
      c.fillStyle = '#bdc3c7'; c.fillRect(12, 10, 2, 3);
      // Sword in right hand
      c.fillStyle = '#d4d4d4'; c.fillRect(13, 3, 1, 8);
      c.fillStyle = '#d4a017'; c.fillRect(12, 10, 3, 1);
      // Legs
      c.fillStyle = '#555'; c.fillRect(5, 12, 3, 4);
      c.fillStyle = '#555'; c.fillRect(8, 12, 3, 4);
      // Boots
      c.fillStyle = '#333'; c.fillRect(5, 15, 3, 1);
      c.fillStyle = '#333'; c.fillRect(8, 15, 3, 1);
    });

    // Arena sign: crossed swords
    genSprite('sign_arena', 12, 16, (c) => {
      // Post
      c.fillStyle = '#8B4513'; c.fillRect(5, 6, 2, 10);
      // Sign board
      c.fillStyle = '#a0522d'; c.fillRect(1, 1, 10, 6);
      c.fillStyle = '#8B4513'; c.strokeStyle = '#5d3a1a'; c.lineWidth = 0.5;
      c.strokeRect(1, 1, 10, 6);
      // Crossed swords icon
      c.fillStyle = '#ccc';
      c.save(); c.translate(6, 4); c.rotate(-0.4); c.fillRect(-1, -3, 1, 6); c.restore();
      c.save(); c.translate(6, 4); c.rotate(0.4); c.fillRect(0, -3, 1, 6); c.restore();
      c.fillStyle = '#d4a017'; c.fillRect(4, 4, 4, 1);
    });

    // Arena floor tile
    genSprite('arena_floor', 32, 32, (c) => {
      c.fillStyle = '#8b7355'; c.fillRect(0, 0, 32, 32);
      c.strokeStyle = '#7a6348'; c.lineWidth = 1;
      for (let i = 8; i < 32; i += 8) {
        c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 32); c.stroke();
        c.beginPath(); c.moveTo(0, i); c.lineTo(32, i); c.stroke();
      }
      c.fillStyle = '#9a845f';
      for (let i = 0; i < 6; i++) c.fillRect((i * 73 + 5) % 28, (i * 47 + 3) % 28, 2, 2);
    });

    // Arena wall tile
    genSprite('arena_wall', 32, 32, (c) => {
      c.fillStyle = '#5a4a3a'; c.fillRect(0, 0, 32, 32);
      c.fillStyle = '#4a3a2a'; c.fillRect(0, 0, 32, 4);
      c.fillStyle = '#4a3a2a'; c.fillRect(0, 28, 32, 4);
      c.strokeStyle = '#3a2a1a'; c.lineWidth = 1;
      for (let y = 0; y < 32; y += 8) {
        c.beginPath(); c.moveTo(0, y); c.lineTo(32, y); c.stroke();
      }
      for (let x = (Math.floor(Math.random() * 4)) * 4; x < 32; x += 16) {
        c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 32); c.stroke();
      }
    });
  },

  // ============================================================
  //  TOWN NPC
  // ============================================================
  initTownNPC() {
    const tcx = Math.floor(MAP_W / 2), tcy = Math.floor(MAP_H / 2);
    this.arenaNPC = {
      x: (tcx - 3) * TILE + TILE / 2,
      y: (tcy + 3) * TILE + TILE / 2,
      name: 'Arena Master'
    };
  },

  // ============================================================
  //  DRAW ARENA NPC (called from drawTownNPCs or separately)
  // ============================================================
  drawArenaNPC() {
    if (!this.arenaNPC || game.state !== 'playing' || this.active) return;
    const npc = this.arenaNPC;
    const { x: sx, y: sy } = camera.worldToScreen(npc.x, npc.y);
    if (sx < -64 || sx > canvas.width + 64 || sy < -64 || sy > canvas.height + 64) return;

    const spr = spriteCache['arena_master'];
    if (spr) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spr, sx - 16, sy - 16, 32, 32);
      ctx.restore();
    }

    const sign = spriteCache['sign_arena'];
    if (sign) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sign, sx - 36, sy + 4, 24, 32);
      ctx.restore();
    }

    ctx.save();
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.strokeText(npc.name, sx, sy - 22);
    ctx.fillStyle = '#FF6644';
    ctx.fillText(npc.name, sx, sy - 22);

    if (game.player) {
      const dist = Math.hypot(game.player.x - npc.x, game.player.y - npc.y);
      if (dist < TILE * 2.5) {
        ctx.font = '9px monospace';
        ctx.strokeText('[Click for PvP]', sx, sy - 32);
        ctx.fillStyle = '#FFAA88';
        ctx.fillText('[Click for PvP]', sx, sy - 32);
      }
    }
    ctx.restore();
  },

  // ============================================================
  //  CHECK ARENA NPC CLICK
  // ============================================================
  checkNPCClick(clickX, clickY) {
    if (!this.arenaNPC || game.state !== 'playing' || !game.player || this.active) return false;
    const { x: sx, y: sy } = camera.worldToScreen(this.arenaNPC.x, this.arenaNPC.y);
    if (Math.hypot(clickX - sx, clickY - sy) < TILE * 1.5) {
      const dist = Math.hypot(game.player.x - this.arenaNPC.x, game.player.y - this.arenaNPC.y);
      if (dist < TILE * 3) {
        this.panelOpen = true;
        this._shopTab = false;
        this._leaderTab = false;
        return true;
      }
    }
    return false;
  },

  // ============================================================
  //  GENERATE ARENA MAP (15x15)
  // ============================================================
  _generateArenaMap() {
    this.arenaMap = [];
    for (let y = 0; y < 15; y++) {
      const row = [];
      for (let x = 0; x < 15; x++) {
        // 0 = floor, 1 = wall
        if (x === 0 || x === 14 || y === 0 || y === 14) row.push(1);
        else row.push(0);
      }
      this.arenaMap.push(row);
    }
  },

  // ============================================================
  //  START MATCH
  // ============================================================
  startMatch() {
    if (this.active || !game.player || game.player.isDead) return;
    const p = game.player;

    // Save player state
    this._savedPos = { x: p.x, y: p.y };
    this._savedBotState = botAI.state;

    // Generate arena map
    this._generateArenaMap();

    // Create opponent
    const oppClass = CLASSES[ri(0, 3)];
    const minLv = Math.max(1, p.level - 3);
    const maxLv = p.level + 3;
    const oppLv = ri(minLv, maxLv);
    const oppName = this._opponentNames[ri(0, this._opponentNames.length - 1)];

    const opp = createPlayer(oppClass, oppName);
    for (let l = 1; l < oppLv; l++) levelUp(opp);
    opp.level = oppLv;
    opp.exp = 0;
    opp.isNPC = true;
    opp.entityType = 'pvp_opponent';
    opp.attackTimer = 0;
    opp.buffs = opp.buffs || [];

    this.opponent = opp;

    // Position player and opponent in arena
    // Arena center in world coords: use a fixed position away from regular map
    const arenaBaseX = -500 * TILE;
    const arenaBaseY = -500 * TILE;
    p.x = arenaBaseX + 4 * TILE + TILE / 2;
    p.y = arenaBaseY + 7 * TILE + TILE / 2;
    opp.x = arenaBaseX + 10 * TILE + TILE / 2;
    opp.y = arenaBaseY + 7 * TILE + TILE / 2;

    // Full heal both
    p.hp = p.maxHp; p.mp = p.maxMp;
    opp.hp = opp.maxHp; opp.mp = opp.maxMp;

    // Reset skill cooldowns
    for (const sk of p.skills) sk.cdTimer = 0;
    for (const sk of opp.skills) sk.cdTimer = 0;

    // Reset paths
    p._path = null; p._pathIdx = 0;

    // Set state
    this.active = true;
    this.state = 'countdown';
    this.countdown = 3;
    this.timer = 60;
    this.result = null;
    this._resultRewards = null;
    this.panelOpen = false;

    camera.update(p);
    addLog('PvP Arena match starting!', '#FF6644');
    addNotification('Arena Match: vs ' + oppName + ' (' + oppClass + ' Lv.' + oppLv + ')', '#FF6644');
  },

  // ============================================================
  //  UPDATE
  // ============================================================
  update(dt) {
    if (!this.active || !game.player) return;
    const p = game.player;
    const opp = this.opponent;
    if (!opp) return;

    if (this.state === 'countdown') {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.state = 'fighting';
        this.countdown = 0;
        addLog('FIGHT!', '#FFD700');
      }
      return;
    }

    if (this.state === 'fighting') {
      this.timer -= dt;

      // Update opponent AI
      this.updateOpponentAI(dt, opp, p);

      // Update opponent buffs and skill cooldowns
      updateBuffs(opp, dt);
      for (const sk of opp.skills) if (sk.cdTimer > 0) sk.cdTimer = Math.max(0, sk.cdTimer - dt);
      if (opp.attackTimer > 0) opp.attackTimer -= dt;

      // Animate opponent
      opp.animTimer = (opp.animTimer || 0) + dt;
      if (opp.animTimer > 0.15) { opp.frame = (opp.frame + 1) % 3; opp.animTimer = 0; }

      // Bot AI fights opponent if enabled
      if (botAI.enabled) {
        this._botFight(dt, p, opp);
      }

      // Check match end conditions
      if (p.isDead || p.hp <= 0) {
        p.hp = 0; p.isDead = true;
        this._endMatch('lose');
        return;
      }
      if (opp.hp <= 0) {
        opp.hp = 0; opp.isDead = true;
        this._endMatch('win');
        return;
      }
      if (this.timer <= 0) {
        this.timer = 0;
        const pPct = p.hp / p.maxHp;
        const oPct = opp.hp / opp.maxHp;
        this._endMatch(pPct >= oPct ? 'win' : 'lose');
        return;
      }
    }

    // Auto arena timer
    if (!this.active && this.autoArena && botAI.enabled) {
      this.autoTimer -= dt;
      if (this.autoTimer <= 0) {
        this.autoTimer = 300;
        this.startMatch();
      }
    }
  },

  // ============================================================
  //  OPPONENT AI
  // ============================================================
  updateOpponentAI(dt, opp, target) {
    if (!opp || opp.isDead || !target || target.isDead) return;

    const dx = target.x - opp.x;
    const dy = target.y - opp.y;
    const dist = Math.hypot(dx, dy);
    const cls = opp.className;
    const hpR = opp.hp / opp.maxHp;

    // Clamp opponent within arena bounds
    const arenaBaseX = -500 * TILE;
    const arenaBaseY = -500 * TILE;
    const minX = arenaBaseX + 1.5 * TILE;
    const maxX = arenaBaseX + 13.5 * TILE;
    const minY = arenaBaseY + 1.5 * TILE;
    const maxY = arenaBaseY + 13.5 * TILE;

    // Skill usage based on class
    if (cls === 'Knight') {
      if (hpR < 0.5) this._oppUseSkill(opp, 1); // Iron Wall
      if (dist < TILE * 2) this._oppUseSkill(opp, 0); // Sword Slash
      if (hpR < 0.3) this._oppUseSkill(opp, 3); // Berserk
      if (dist < TILE * 3) this._oppUseSkill(opp, 2); // War Cry
    } else if (cls === 'Mage') {
      if (hpR < 0.4) this._oppUseSkill(opp, 2); // Mana Shield
      this._oppUseSkill(opp, 0); // Fireball
      if (dist < TILE * 3) this._oppUseSkill(opp, 1); // Frost Nova
      if (dist < TILE * 6) this._oppUseSkill(opp, 3); // Meteor
    } else if (cls === 'Ranger') {
      this._oppUseSkill(opp, 0); // Power Shot
      this._oppUseSkill(opp, 1); // Multi-Arrow
      if (hpR < 0.5) this._oppUseSkill(opp, 2); // Evasion
      if (dist < TILE * 10) this._oppUseSkill(opp, 3); // Snipe
    } else if (cls === 'Priest') {
      if (hpR < 0.5) this._oppUseSkill(opp, 1); // Heal
      this._oppUseSkill(opp, 0); // Holy Smite
      this._oppUseSkill(opp, 2); // Purify
      if (dist < TILE * 4) this._oppUseSkill(opp, 3); // Divine Judgment
    }

    // Movement
    const spd = opp.spd * TILE * dt;
    if (cls === 'Ranger' && dist < TILE * 2) {
      // Kite: move away from player
      if (dist > 0) {
        const nx = opp.x - (dx / dist) * spd;
        const ny = opp.y - (dy / dist) * spd;
        opp.x = Math.max(minX, Math.min(maxX, nx));
        opp.y = Math.max(minY, Math.min(maxY, ny));
      }
    } else if (dist > opp.attackRange) {
      // Move toward target
      if (dist > 0) {
        const nx = opp.x + (dx / dist) * spd;
        const ny = opp.y + (dy / dist) * spd;
        opp.x = Math.max(minX, Math.min(maxX, nx));
        opp.y = Math.max(minY, Math.min(maxY, ny));
      }
    }

    // Update direction for sprite
    if (Math.abs(dx) > Math.abs(dy)) opp.dir = dx > 0 ? 'right' : 'left';
    else opp.dir = dy > 0 ? 'down' : 'up';

    // Auto attack when in range
    if (dist <= opp.attackRange && opp.attackTimer <= 0) {
      const r = calcDamage(opp, target);
      target.hp = Math.max(0, target.hp - r.dmg);
      addDmg(target.x, target.y - TILE, '-' + r.dmg, r.crit ? '#FF4444' : '#FF8888');
      if (r.crit) { screenShake(3, 0.1); sfx.crit(); } else { sfx.hit(); }
      addEffect(target.x, target.y, 'hit', 0.25);
      opp.attackTimer = 1 / opp.spd;
    }
  },

  // Opponent uses a skill targeting the player
  _oppUseSkill(opp, idx) {
    const sk = opp.skills[idx];
    if (!sk || sk.cdTimer > 0) return;
    if (sk.reqLv && opp.level < sk.reqLv) return;
    const target = game.player;
    if (!target || target.isDead) return;

    sk.cdTimer = sk.cd;

    if (sk.heal) {
      const amt = Math.round(opp.maxHp * sk.heal);
      opp.hp = Math.min(opp.maxHp, opp.hp + amt);
      addDmg(opp.x, opp.y - TILE, '+' + amt, '#44FF44');
      addEffect(opp.x, opp.y, 'heal', 0.8);
      sfx.spell();
      return;
    }
    if (sk.buff) {
      const b = { ...sk.buff, timer: sk.buff.dur };
      opp.buffs = opp.buffs.filter(x => x.type !== b.type);
      if (b.type === 'def') { b.val = Math.round(opp.def * b.pct); opp.def += b.val; }
      else if (b.type === 'berserk') { b.atkVal = Math.round(opp.atk * b.atkPct); b.defVal = Math.round(opp.def * Math.abs(b.defPct)); opp.atk += b.atkVal; opp.def -= b.defVal; }
      else if (b.type === 'evasion') { b.spdVal = Math.round(opp.spd * b.spdPct); opp.spd += b.spdVal; }
      else if (b.type === 'purify') { opp.mp = Math.min(opp.maxMp, opp.mp + Math.round(opp.maxMp * b.mpPct)); }
      else if (b.type === 'manaShield') { /* mana shield active */ }
      opp.buffs.push(b);
      addEffect(opp.x, opp.y, 'buff', 0.6);
      sfx.spell();
      return;
    }
    if (sk.dmgPct > 0) {
      const dist = Math.hypot(target.x - opp.x, target.y - opp.y);
      if (dist > sk.range) return;
      const base = Math.round(opp.atk * sk.dmgPct);
      const dmg = Math.max(1, Math.round(base - target.def * 0.5 + rf(-2, 2)));
      const crit = Math.random() < (opp.crit || 0.05);
      const fd = crit ? dmg * 2 : dmg;
      target.hp = Math.max(0, target.hp - fd);
      addDmg(target.x, target.y - TILE, fd + (crit ? '!' : ''), crit ? '#FF4444' : '#FF8888');
      if (crit) { screenShake(4, 0.15); sfx.crit(); } else { sfx.hit(); }
      if (sk.slow && target.slowTimer !== undefined) target.slowTimer = 2;
      addEffect(target.x, target.y, sk.aoe ? 'aoe' : 'slash', 0.5);
      if (sk.healPct) {
        const ha = Math.round(opp.maxHp * sk.healPct);
        opp.hp = Math.min(opp.maxHp, opp.hp + ha);
        addDmg(opp.x, opp.y - TILE * 2, '+' + ha, '#88FF88');
      }
    }
  },

  // ============================================================
  //  BOT FIGHT LOGIC (when bot AI is enabled in arena)
  // ============================================================
  _botFight(dt, p, opp) {
    if (!p || p.isDead || !opp || opp.isDead) return;
    const dx = opp.x - p.x;
    const dy = opp.y - p.y;
    const dist = Math.hypot(dx, dy);
    const cls = p.className;
    const hpR = p.hp / p.maxHp;

    // Clamp within arena
    const arenaBaseX = -500 * TILE;
    const arenaBaseY = -500 * TILE;
    const minX = arenaBaseX + 1.5 * TILE;
    const maxX = arenaBaseX + 13.5 * TILE;
    const minY = arenaBaseY + 1.5 * TILE;
    const maxY = arenaBaseY + 13.5 * TILE;

    // Move toward opponent
    const spd = p.spd * TILE * dt;
    if (cls === 'Ranger' && dist < p.attackRange * 0.7 && dist > 0) {
      // Kite
      const nx = p.x - (dx / dist) * spd;
      const ny = p.y - (dy / dist) * spd;
      p.x = Math.max(minX, Math.min(maxX, nx));
      p.y = Math.max(minY, Math.min(maxY, ny));
      p.state = 'walking';
    } else if (dist > p.attackRange) {
      const nx = p.x + (dx / dist) * spd;
      const ny = p.y + (dy / dist) * spd;
      p.x = Math.max(minX, Math.min(maxX, nx));
      p.y = Math.max(minY, Math.min(maxY, ny));
      p.state = 'walking';
    } else {
      p.state = 'combat';
    }

    // Update direction
    if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 'right' : 'left';
    else p.dir = dy > 0 ? 'down' : 'up';

    // Auto attack
    if (dist <= p.attackRange && p.attackTimer <= 0) {
      const r = calcDamage(p, opp);
      opp.hp = Math.max(0, opp.hp - r.dmg);
      addDmg(opp.x, opp.y - TILE, r.dmg + (r.crit ? '!' : ''), r.crit ? '#FFD700' : '#FFFFFF');
      addEffect(opp.x, opp.y, 'hit', 0.25);
      if (r.crit) { screenShake(4, 0.15); sfx.crit(); } else { sfx.hit(); }
      p.attackTimer = 1 / p.spd;
    }

    // Auto skills
    if (cls === 'Knight') {
      if (hpR < 0.5) useSkill(p, 1);
      if (dist < TILE * 2) useSkill(p, 0);
      if (hpR < 0.3) { useSkill(p, 3); useSkill(p, 2); }
    } else if (cls === 'Mage') {
      if (hpR < 0.4) useSkill(p, 2);
      useSkill(p, 0);
      if (dist < TILE * 3) useSkill(p, 1);
      useSkill(p, 3);
    } else if (cls === 'Ranger') {
      useSkill(p, 0); useSkill(p, 1);
      if (hpR < 0.5) useSkill(p, 2);
      useSkill(p, 3);
    } else if (cls === 'Priest') {
      if (hpR < 0.7) useSkill(p, 1);
      useSkill(p, 2); useSkill(p, 0);
      useSkill(p, 3);
    }
  },

  // ============================================================
  //  END MATCH
  // ============================================================
  _endMatch(result) {
    this.state = 'result';
    this.result = result;
    const p = game.player;
    const opp = this.opponent;

    let apReward = 0, goldReward = 0, expReward = 0;
    if (result === 'win') {
      apReward = ri(10, 20);
      goldReward = 50 * p.level;
      expReward = 100 * p.level;
      this.stats.wins++;
      this.stats.winStreak++;
      if (this.stats.winStreak > this.stats.bestStreak) this.stats.bestStreak = this.stats.winStreak;
      sfx.victoryFanfare();
      screenShake(6, 0.3);
      addLog('VICTORY! You defeated ' + opp.name + '!', '#FFD700');
      addNotification('Arena Victory! +' + apReward + ' AP', '#FFD700');
    } else {
      apReward = 3;
      goldReward = 0;
      expReward = 0;
      this.stats.losses++;
      this.stats.winStreak = 0;
      addLog('Defeated by ' + opp.name + '...', '#FF4444');
      addNotification('Arena Defeat. +3 AP consolation.', '#FF8888');
    }

    this.stats.arenaPoints += apReward;
    p.gold += goldReward;
    if (expReward > 0) gainExp(p, expReward);

    this._resultRewards = { ap: apReward, gold: goldReward, exp: expReward };

    // Update leaderboard
    this._updateLeaderboard();
  },

  // ============================================================
  //  RETURN TO TOWN
  // ============================================================
  _returnToTown() {
    const p = game.player;
    if (!p) return;

    // Restore position
    if (this._savedPos) {
      p.x = this._savedPos.x;
      p.y = this._savedPos.y;
    } else {
      p.x = Math.floor(MAP_W / 2) * TILE + TILE / 2;
      p.y = Math.floor(MAP_H / 2) * TILE + TILE / 2;
    }

    // Revive player if dead
    p.isDead = false;
    p.hp = Math.max(1, Math.round(p.maxHp * 0.5));
    p.mp = Math.round(p.maxMp * 0.5);
    p._path = null; p._pathIdx = 0;

    // Reset state
    this.active = false;
    this.state = 'idle';
    this.opponent = null;
    this.result = null;
    this._resultRewards = null;
    this.autoTimer = 300;

    // Reset bot
    botAI.state = 'idle';
    botAI.target = null;

    camera.update(p);
    addLog('Returned to town from arena.', '#AAAAAA');
  },

  // ============================================================
  //  DRAW ARENA MAP
  // ============================================================
  drawArenaMap() {
    if (!this.active || this.arenaMap.length === 0) return;
    const arenaBaseX = -500 * TILE;
    const arenaBaseY = -500 * TILE;

    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        const wx = arenaBaseX + x * TILE;
        const wy = arenaBaseY + y * TILE;
        const { x: sx, y: sy } = camera.worldToScreen(wx, wy);
        if (sx < -TILE || sx > canvas.width + TILE || sy < -TILE || sy > canvas.height + TILE) continue;

        const tile = this.arenaMap[y][x];
        const spriteName = tile === 1 ? 'arena_wall' : 'arena_floor';
        const spr = spriteCache[spriteName];
        if (spr) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(spr, sx, sy, TILE, TILE);
          ctx.restore();
        }
      }
    }
  },

  // ============================================================
  //  DRAW OPPONENT HP BAR (boss-style at top)
  // ============================================================
  drawOpponentHPBar() {
    if (!this.active || !this.opponent || this.state === 'countdown') return;
    const opp = this.opponent;
    const W = canvas.width;
    const bw = Math.min(400, W - 40);
    const bh = 20;
    const bx = (W - bw) / 2;
    const by = 10;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    roundRect(ctx, bx - 4, by - 4, bw + 8, bh + 22, 6);
    ctx.fill();

    // Name and class
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = CLASS_DEFS[opp.className] ? CLASS_DEFS[opp.className].color : '#fff';
    ctx.fillText(opp.name + ' [' + opp.className + ' Lv.' + opp.level + ']', W / 2, by + 10);

    // HP bar background
    ctx.fillStyle = '#333';
    roundRect(ctx, bx, by + 14, bw, bh, 4);
    ctx.fill();

    // HP bar fill
    const hpPct = Math.max(0, opp.hp / opp.maxHp);
    const hpColor = hpPct > 0.5 ? '#e74c3c' : hpPct > 0.25 ? '#e67e22' : '#c0392b';
    if (hpPct > 0) {
      ctx.fillStyle = hpColor;
      roundRect(ctx, bx, by + 14, bw * hpPct, bh, 4);
      ctx.fill();
    }

    // HP text
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(opp.hp + ' / ' + opp.maxHp, W / 2, by + 28);
  },

  // ============================================================
  //  DRAW TIMER
  // ============================================================
  drawTimer() {
    if (!this.active || this.state !== 'fighting') return;
    const W = canvas.width;
    const secs = Math.ceil(this.timer);
    const col = secs <= 10 ? '#FF4444' : secs <= 30 ? '#FFAA44' : '#FFFFFF';

    ctx.save();
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.strokeText(secs + 's', W / 2, 58);
    ctx.fillStyle = col;
    ctx.fillText(secs + 's', W / 2, 58);
    ctx.restore();
  },

  // ============================================================
  //  DRAW COUNTDOWN
  // ============================================================
  drawCountdown() {
    if (!this.active || this.state !== 'countdown') return;
    const W = canvas.width, H = canvas.height;
    const num = Math.ceil(this.countdown);
    const text = num > 0 ? '' + num : 'FIGHT!';
    const scale = 1 + (1 - (this.countdown % 1)) * 0.3;

    ctx.save();
    ctx.font = 'bold ' + Math.round(60 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
    ctx.strokeText(text, W / 2, H / 2);
    ctx.fillStyle = num > 0 ? '#FFFFFF' : '#FFD700';
    ctx.fillText(text, W / 2, H / 2);
    ctx.restore();
  },

  // ============================================================
  //  DRAW RESULT SCREEN
  // ============================================================
  drawResult() {
    if (!this.active || this.state !== 'result') return;
    const W = canvas.width, H = canvas.height;
    const opp = this.opponent;
    const rewards = this._resultRewards;

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);

    // Result text with glow
    const isWin = this.result === 'win';
    const title = isWin ? 'VICTORY!' : 'DEFEAT';
    const titleColor = isWin ? '#FFD700' : '#FF4444';

    ctx.save();
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Glow
    ctx.shadowColor = titleColor;
    ctx.shadowBlur = 20;
    ctx.fillStyle = titleColor;
    ctx.fillText(title, W / 2, H / 2 - 80);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Opponent info
    if (opp) {
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#AAA';
      ctx.fillText('vs ' + opp.name + ' [' + opp.className + ' Lv.' + opp.level + ']', W / 2, H / 2 - 30);
    }

    // Rewards
    if (rewards) {
      ctx.font = '14px monospace';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('+' + rewards.ap + ' Arena Points', W / 2, H / 2 + 10);
      if (rewards.gold > 0) {
        ctx.fillStyle = '#FFCC00';
        ctx.fillText('+' + rewards.gold + ' Gold', W / 2, H / 2 + 30);
      }
      if (rewards.exp > 0) {
        ctx.fillStyle = '#88CCFF';
        ctx.fillText('+' + rewards.exp + ' EXP', W / 2, H / 2 + 50);
      }
    }

    // Return button
    const bw = 180, bh = 36;
    const bx = W / 2 - bw / 2, by = H / 2 + 80;
    ctx.fillStyle = 'rgba(20,80,120,0.9)';
    roundRect(ctx, bx, by, bw, bh, 8);
    ctx.fill();
    ctx.strokeStyle = '#4488AA';
    ctx.lineWidth = 2;
    roundRect(ctx, bx, by, bw, bh, 8);
    ctx.stroke();
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Return to Town', W / 2, by + 23);
  },

  // ============================================================
  //  DRAW OPPONENT ENTITY (render the opponent character)
  // ============================================================
  drawOpponent() {
    if (!this.active || !this.opponent || this.opponent.isDead) return;
    const opp = this.opponent;
    const { x: sx, y: sy } = camera.worldToScreen(opp.x, opp.y);
    if (sx < -64 || sx > canvas.width + 64 || sy < -64 || sy > canvas.height + 64) return;

    const clsKey = opp.className.toLowerCase();
    const sprName = clsKey + '_' + (opp.dir || 'down') + '_' + (opp.frame || 0);
    const spr = spriteCache[sprName];
    if (spr) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spr, sx - 16, sy - 16, 32, 32);
      ctx.restore();
    }

    // Name and HP bar above head
    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.strokeText(opp.name, sx, sy - 22);
    ctx.fillStyle = '#FF6644';
    ctx.fillText(opp.name, sx, sy - 22);

    // Small HP bar
    const barW = 28, barH = 3;
    const barX = sx - barW / 2, barY = sy - 18;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    const hpPct = Math.max(0, opp.hp / opp.maxHp);
    ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#e67e22' : '#e74c3c';
    ctx.fillRect(barX, barY, barW * hpPct, barH);
    ctx.restore();
  },

  // ============================================================
  //  IS ACTIVE (integration hook)
  // ============================================================
  isActive() {
    return this.active;
  },

  // ============================================================
  //  ARENA PANEL UI
  // ============================================================

  // ============================================================
  //  AP SHOP: BUY ITEM
  // ============================================================
  buyItem(shopIdx) {
    const item = this._shopItems[shopIdx];
    if (!item || !game.player) return;
    if (this.stats.arenaPoints < item.cost) {
      addNotification('Not enough Arena Points!', '#FF4444');
      return;
    }

    const p = game.player;
    this.stats.arenaPoints -= item.cost;

    if (item.type === 'potion') {
      // Arena Potion: full heal consumable
      const pot = { name: 'Arena Potion', type: 'potion', rarity: 'epic', stats: { hp: 9999, mp: 9999 }, level: p.level, value: 500 };
      if (p.inventory.length < 20) {
        p.inventory.push(pot);
        addNotification('Bought Arena Potion!', '#AA44FF');
        addLog('Bought Arena Potion (Full HP/MP restore)', '#AA44FF');
      } else {
        addNotification('Inventory full!', '#FF4444');
        this.stats.arenaPoints += item.cost;
        return;
      }
    } else if (item.type === 'weapon') {
      // Class-specific arena weapon
      const wpnNames = { Knight: 'Arena Blade', Mage: 'Arena Staff', Ranger: 'Arena Bow', Priest: 'Arena Scepter' };
      const wpn = {
        name: wpnNames[p.className] || 'Arena Weapon',
        type: 'weapon', rarity: 'legendary',
        stats: { atk: Math.round(8 + p.level * 2.5), crit: 0.08 },
        level: p.level, value: 1000
      };
      if (p.inventory.length < 20) {
        p.inventory.push(wpn);
        addNotification('Bought ' + wpn.name + '!', '#FF8800');
        addLog('Bought ' + wpn.name, '#FF8800');
      } else {
        addNotification('Inventory full!', '#FF4444');
        this.stats.arenaPoints += item.cost;
        return;
      }
    } else if (item.type === 'armor') {
      // Arena armor
      const arm = {
        name: 'Arena Plate', type: 'armor', rarity: 'legendary',
        stats: { def: Math.round(6 + p.level * 2), hp: Math.round(30 + p.level * 8) },
        level: p.level, value: 1500
      };
      if (p.inventory.length < 20) {
        p.inventory.push(arm);
        addNotification('Bought Arena Plate!', '#FF8800');
        addLog('Bought Arena Plate', '#FF8800');
      } else {
        addNotification('Inventory full!', '#FF4444');
        this.stats.arenaPoints += item.cost;
        return;
      }
    } else if (item.type === 'title') {
      // Champion title
      game.player.title = 'Champion';
      game.player.titleColor = '#FFD700';
      addNotification('Champion Title unlocked!', '#FFD700');
      addLog('You are now a Champion!', '#FFD700');
    } else if (item.type === 'pet') {
      // Arena pet
      if (typeof petSystem !== 'undefined') {
        petSystem.addGem('arena');
        addNotification('Arena Pet unlocked!', '#AA44FF');
        addLog('Unlocked Gladiator Pet!', '#AA44FF');
      } else {
        addNotification('Pet system not available!', '#FF4444');
        this.stats.arenaPoints += item.cost;
        return;
      }
    }

    sfx.itemPickup();
  },

  // ============================================================
  //  LEADERBOARD
  // ============================================================
  _updateLeaderboard() {
    // Generate fake leaderboard entries + player entry
    this._leaderboardData = [];
    const fakeNames = ['xXDarkKnightXx', 'SakuraHime', 'ProGamer99', 'L33tSlayer', 'MoonWitch', 'IronFist', 'ShadowArcher', 'HolyLight', 'DragonBorn', 'PixelHero'];
    for (let i = 0; i < 10; i++) {
      this._leaderboardData.push({
        name: fakeNames[i],
        wins: ri(Math.max(0, this.stats.wins - 5), this.stats.wins + 20),
        cls: CLASSES[ri(0, 3)]
      });
    }
    // Add player
    this._leaderboardData.push({
      name: game.player ? game.player.name : 'Hero',
      wins: this.stats.wins,
      cls: game.player ? game.player.className : 'Knight',
      isPlayer: true
    });
    // Sort by wins descending
    this._leaderboardData.sort((a, b) => b.wins - a.wins);
  },

  // ============================================================
  //  SAVE / LOAD
  // ============================================================
  save() {
    return {
      stats: { ...this.stats },
      autoArena: this.autoArena
    };
  },

  load(data) {
    if (!data) return;
    if (data.stats) {
      this.stats.wins = data.stats.wins || 0;
      this.stats.losses = data.stats.losses || 0;
      this.stats.winStreak = data.stats.winStreak || 0;
      this.stats.bestStreak = data.stats.bestStreak || 0;
      this.stats.arenaPoints = data.stats.arenaPoints || 0;
    }
    if (data.autoArena !== undefined) this.autoArena = data.autoArena;
  }
};

// ============================================================
//  GLOBAL FUNCTIONS (integration hooks)
// ============================================================

function drawArenaPanel() {
  if (!pvpArena.panelOpen || !game.player) return;
  const p = game.player;
  const W = canvas.width, H = canvas.height;
  const pw = 350, ph = 420;
  const px = (W - pw) / 2, py = (H - ph) / 2;

  // Dark overlay
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);

  // Panel background
  ctx.fillStyle = 'rgba(10,10,30,0.95)';
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.fill();
  ctx.strokeStyle = '#884422';
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.stroke();

  // Header: PvP Arena with crossed swords
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FF6644';
  ctx.fillText('\u2694 PvP Arena \u2694', px + pw / 2, py + 28);

  // X close button
  const closeX = px + pw - 28, closeY = py + 8;
  ctx.fillStyle = 'rgba(180,40,40,0.8)';
  roundRect(ctx, closeX, closeY, 20, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('X', closeX + 10, closeY + 15);

  // Tab buttons
  const tabY = py + 40;
  const tabs = ['Stats', 'Shop', 'Ranks'];
  const tabW = (pw - 30) / 3;
  for (let i = 0; i < 3; i++) {
    const tx = px + 10 + i * (tabW + 5);
    const isActive = (i === 0 && !pvpArena._shopTab && !pvpArena._leaderTab) ||
                     (i === 1 && pvpArena._shopTab) ||
                     (i === 2 && pvpArena._leaderTab);
    ctx.fillStyle = isActive ? 'rgba(136,68,34,0.8)' : 'rgba(40,40,60,0.8)';
    roundRect(ctx, tx, tabY, tabW, 22, 4);
    ctx.fill();
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = isActive ? '#FFD700' : '#888';
    ctx.textAlign = 'center';
    ctx.fillText(tabs[i], tx + tabW / 2, tabY + 15);
  }

  const contentY = tabY + 30;

  if (pvpArena._shopTab) {
    // ---- AP SHOP ----
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('AP: ' + pvpArena.stats.arenaPoints, px + 12, contentY + 14);

    const items = pvpArena._shopItems;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const iy = contentY + 24 + i * 58;

      // Item background
      ctx.fillStyle = 'rgba(40,30,20,0.6)';
      roundRect(ctx, px + 10, iy, pw - 20, 52, 6);
      ctx.fill();
      ctx.strokeStyle = '#553322';
      ctx.lineWidth = 1;
      roundRect(ctx, px + 10, iy, pw - 20, 52, 6);
      ctx.stroke();

      // Name
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FF8800';
      ctx.fillText(item.name, px + 18, iy + 16);

      // Description
      ctx.font = '9px monospace';
      ctx.fillStyle = '#AAA';
      ctx.fillText(item.desc, px + 18, iy + 30);

      // Cost
      ctx.fillStyle = '#FFD700';
      ctx.font = '10px monospace';
      ctx.fillText(item.cost + ' AP', px + 18, iy + 44);

      // Buy button
      const canBuy = pvpArena.stats.arenaPoints >= item.cost;
      const bbx = px + pw - 60, bby = iy + 14;
      ctx.fillStyle = canBuy ? 'rgba(20,120,40,0.9)' : 'rgba(60,60,60,0.5)';
      roundRect(ctx, bbx, bby, 40, 22, 4);
      ctx.fill();
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = canBuy ? '#fff' : '#666';
      ctx.textAlign = 'center';
      ctx.fillText('BUY', bbx + 20, bby + 15);
    }

  } else if (pvpArena._leaderTab) {
    // ---- LEADERBOARD ----
    if (pvpArena._leaderboardData.length === 0) pvpArena._updateLeaderboard();

    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('Arena Leaderboard', px + pw / 2, contentY + 14);

    // Column headers
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#888';
    ctx.fillText('#', px + 16, contentY + 32);
    ctx.fillText('Name', px + 36, contentY + 32);
    ctx.fillText('Class', px + 160, contentY + 32);
    ctx.fillText('Wins', px + 240, contentY + 32);

    const entries = pvpArena._leaderboardData.slice(0, 10);
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const ey = contentY + 46 + i * 20;

      if (e.isPlayer) {
        ctx.fillStyle = 'rgba(80,60,20,0.4)';
        ctx.fillRect(px + 10, ey - 10, pw - 20, 18);
      }

      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = i < 3 ? '#FFD700' : (e.isPlayer ? '#88CCFF' : '#AAA');
      ctx.fillText((i + 1) + '.', px + 16, ey);
      ctx.fillText(e.name, px + 36, ey);
      ctx.fillStyle = CLASS_DEFS[e.cls] ? CLASS_DEFS[e.cls].color : '#aaa';
      ctx.fillText(e.cls, px + 160, ey);
      ctx.fillStyle = '#FFD700';
      ctx.fillText('' + e.wins, px + 240, ey);
    }

  } else {
    // ---- STATS TAB ----
    const stats = pvpArena.stats;
    const winRate = stats.wins + stats.losses > 0 ? Math.round(stats.wins / (stats.wins + stats.losses) * 100) : 0;

    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    const labels = [
      ['Wins', '' + stats.wins, '#44FF44'],
      ['Losses', '' + stats.losses, '#FF4444'],
      ['Win Rate', winRate + '%', '#FFCC00'],
      ['Current Streak', '' + stats.winStreak, '#88CCFF'],
      ['Best Streak', '' + stats.bestStreak, '#FFD700'],
      ['Arena Points', '' + stats.arenaPoints, '#FF8800']
    ];

    for (let i = 0; i < labels.length; i++) {
      const ly = contentY + 18 + i * 24;
      ctx.fillStyle = '#AAA';
      ctx.fillText(labels[i][0] + ':', px + 20, ly);
      ctx.fillStyle = labels[i][2];
      ctx.textAlign = 'right';
      ctx.fillText(labels[i][1], px + pw - 20, ly);
      ctx.textAlign = 'left';
    }

    // Find Match button
    const btnW = 200, btnH = 36;
    const btnX = px + (pw - btnW) / 2, btnY = contentY + 180;

    // Golden gradient button
    ctx.fillStyle = 'rgba(180,120,20,0.9)';
    roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.stroke();
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText('Find Match', px + pw / 2, btnY + 24);

    // Auto Arena toggle
    const autoY = btnY + 50;
    const checkSize = 14;
    const checkX = px + 20, checkY2 = autoY;

    // Checkbox
    ctx.fillStyle = pvpArena.autoArena ? 'rgba(20,120,40,0.9)' : 'rgba(40,40,60,0.8)';
    roundRect(ctx, checkX, checkY2, checkSize, checkSize, 3);
    ctx.fill();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    roundRect(ctx, checkX, checkY2, checkSize, checkSize, 3);
    ctx.stroke();
    if (pvpArena.autoArena) {
      ctx.fillStyle = '#44FF44';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u2713', checkX + checkSize / 2, checkY2 + 12);
    }

    ctx.font = '11px monospace';
    ctx.fillStyle = '#AAA';
    ctx.textAlign = 'left';
    ctx.fillText('Auto Arena (every 5 min)', checkX + checkSize + 8, autoY + 11);
  }

  ctx.restore();
}

function handleArenaClick(cx2, cy2) {
  if (!pvpArena.panelOpen) return false;
  const W = canvas.width, H = canvas.height;
  const pw = 350, ph = 420;
  const px = (W - pw) / 2, py = (H - ph) / 2;

  // Outside panel
  if (cx2 < px || cx2 > px + pw || cy2 < py || cy2 > py + ph) {
    pvpArena.panelOpen = false;
    return true;
  }

  // X close button
  const closeX = px + pw - 28, closeY = py + 8;
  if (cx2 >= closeX && cx2 <= closeX + 20 && cy2 >= closeY && cy2 <= closeY + 20) {
    pvpArena.panelOpen = false;
    return true;
  }

  // Tab buttons
  const tabY = py + 40;
  const tabW = (pw - 30) / 3;
  for (let i = 0; i < 3; i++) {
    const tx = px + 10 + i * (tabW + 5);
    if (cx2 >= tx && cx2 <= tx + tabW && cy2 >= tabY && cy2 <= tabY + 22) {
      pvpArena._shopTab = (i === 1);
      pvpArena._leaderTab = (i === 2);
      return true;
    }
  }

  const contentY = tabY + 30;

  if (pvpArena._shopTab) {
    // Shop buy buttons
    const items = pvpArena._shopItems;
    for (let i = 0; i < items.length; i++) {
      const iy = contentY + 24 + i * 58;
      const bbx = px + pw - 60, bby = iy + 14;
      if (cx2 >= bbx && cx2 <= bbx + 40 && cy2 >= bby && cy2 <= bby + 22) {
        pvpArena.buyItem(i);
        return true;
      }
    }
  } else if (!pvpArena._leaderTab) {
    // Stats tab: Find Match button
    const btnW = 200, btnH = 36;
    const btnX = px + (pw - btnW) / 2, btnY = contentY + 180;
    if (cx2 >= btnX && cx2 <= btnX + btnW && cy2 >= btnY && cy2 <= btnY + btnH) {
      pvpArena.panelOpen = false;
      pvpArena.startMatch();
      return true;
    }

    // Auto Arena checkbox
    const autoY = btnY + 50;
    const checkX = px + 20;
    if (cx2 >= checkX && cx2 <= checkX + 200 && cy2 >= autoY && cy2 <= autoY + 14) {
      pvpArena.autoArena = !pvpArena.autoArena;
      pvpArena.autoTimer = 300;
      return true;
    }
  }

  return true; // consumed click inside panel
}

// Handle result screen click
function handleArenaResultClick(cx2, cy2) {
  if (!pvpArena.active || pvpArena.state !== 'result') return false;
  const W = canvas.width, H = canvas.height;
  const bw = 180, bh = 36;
  const bx = W / 2 - bw / 2, by = H / 2 + 80;

  if (cx2 >= bx && cx2 <= bx + bw && cy2 >= by && cy2 <= by + bh) {
    pvpArena._returnToTown();
    return true;
  }
  return false;
}

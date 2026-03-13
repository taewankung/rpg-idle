// ============================================================
// TALENTS — Talent tree / specialization system
// ============================================================

// --- TALENT TREE DATA ---
// Each class has 2 branches with 5 talent nodes each.
// Talents are unlocked sequentially within a branch.
const TALENT_TREES = {
  Knight: {
    branches: [
      { name: 'Guardian', color: '#3498db', talents: [
        {name:'Tough Skin',     desc:'+15% Max HP',       type:'passive', stat:'maxHp', pct:0.15},
        {name:'Iron Will',      desc:'+20% DEF',          type:'passive', stat:'def', pct:0.20},
        {name:'Shield Block',   desc:'10% chance block',  type:'passive', stat:'blockChance', val:0.10},
        {name:'Taunt Aura',     desc:'AoE taunt 3 tiles', type:'skill', skill:{name:'Taunt Aura',key:'Q',dmgPct:0,cd:12,range:TILE*3,aoe:true,aoeR:TILE*3,aggro:5}},
        {name:'Iron Fortress',  desc:'Invincible 3s',     type:'skill', skill:{name:'Iron Fortress',key:'R',dmgPct:0,cd:60,range:0,buff:{type:'invincible',dur:3}}},
      ]},
      { name: 'Berserker', color: '#e74c3c', talents: [
        {name:'Fury',           desc:'+20% ATK',          type:'passive', stat:'atk', pct:0.20},
        {name:'Keen Edge',      desc:'+10% CRIT',         type:'passive', stat:'crit', val:0.10},
        {name:'Whirlwind',      desc:'360 AoE slash',     type:'skill', skill:{name:'Whirlwind',key:'Q',dmgPct:2.0,cd:8,range:TILE*2,aoe:true,aoeR:TILE*2}},
        {name:'Bloodlust',      desc:'Lifesteal 15%',     type:'passive', stat:'lifesteal', val:0.15},
        {name:'Rampage',        desc:'ATK+50% SPD+50% 6s',type:'skill', skill:{name:'Rampage',key:'R',dmgPct:0,cd:50,range:0,buff:{type:'rampage',atkPct:0.5,spdPct:0.5,dur:6}}},
      ]}
    ]
  },
  Mage: {
    branches: [
      { name: 'Pyromancer', color: '#e67e22', talents: [
        {name:'Ignite',         desc:'+25% Fire dmg',     type:'passive', stat:'fireDmg', pct:0.25},
        {name:'Flame Wall',     desc:'Line AoE fire',     type:'skill', skill:{name:'Flame Wall',key:'W',dmgPct:1.5,cd:10,range:TILE*4,aoe:true,aoeR:TILE*1.5,slow:true}},
        {name:'Inferno',        desc:'Huge fire AoE',     type:'skill', skill:{name:'Inferno',key:'E',dmgPct:2.5,cd:20,range:TILE*5,aoe:true,aoeR:TILE*4}},
        {name:'Combustion',     desc:'+15% ATK',          type:'passive', stat:'atk', pct:0.15},
        {name:'Phoenix Rebirth',desc:'Self-res once/120s',type:'passive', stat:'phoenixRes', val:1, cd:120},
      ]},
      { name: 'Frost Mage', color: '#3498db', talents: [
        {name:'Frost Mastery',  desc:'+30% Slow dur',     type:'passive', stat:'slowBonus', pct:0.30},
        {name:'Blizzard',       desc:'AoE slow+dmg',      type:'skill', skill:{name:'Blizzard',key:'W',dmgPct:1.8,cd:12,range:TILE*5,aoe:true,aoeR:TILE*3,slow:true}},
        {name:'Ice Prison',     desc:'Stun 2s single',    type:'skill', skill:{name:'Ice Prison',key:'E',dmgPct:1.0,cd:15,range:TILE*4}},
        {name:'Frost Armor',    desc:'+20% DEF',          type:'passive', stat:'def', pct:0.20},
        {name:'Frozen Orb',     desc:'Orbiting AoE',      type:'skill', skill:{name:'Frozen Orb',key:'R',dmgPct:3.0,cd:45,range:TILE*6,aoe:true,aoeR:TILE*3,slow:true}},
      ]}
    ]
  },
  Ranger: {
    branches: [
      { name: 'Sharpshooter', color: '#f39c12', talents: [
        {name:'Eagle Eye',      desc:'+15% CRIT',         type:'passive', stat:'crit', val:0.15},
        {name:'Long Range',     desc:'+50% Range',        type:'passive', stat:'attackRange', pct:0.50},
        {name:'Headshot',       desc:'3x crit shot',      type:'skill', skill:{name:'Headshot',key:'Q',dmgPct:3.0,cd:6,range:TILE*8}},
        {name:'Piercing Arrow', desc:'Pierce all enemies', type:'skill', skill:{name:'Piercing Arrow',key:'E',dmgPct:2.0,cd:10,range:TILE*8,piercing:true}},
        {name:'Sniper Mode',    desc:'+ATK +Range 8s',    type:'skill', skill:{name:'Sniper Mode',key:'R',dmgPct:0,cd:50,range:0,buff:{type:'sniper',atkPct:0.4,dur:8}}},
      ]},
      { name: 'Beastmaster', color: '#27ae60', talents: [
        {name:'Bond',           desc:'+30% Pet stats',    type:'passive', stat:'petBonus', pct:0.30},
        {name:'Call Wolf',      desc:'Temp wolf 10s',     type:'skill', skill:{name:'Call Wolf',key:'W',dmgPct:0,cd:30,range:0,summon:'wolf',dur:10}},
        {name:'Multi-Trap',     desc:'Slow zone AoE',     type:'skill', skill:{name:'Multi-Trap',key:'E',dmgPct:1.2,cd:15,range:TILE*3,aoe:true,aoeR:TILE*2,slow:true}},
        {name:'Wild Growth',    desc:'+20% HP',           type:'passive', stat:'maxHp', pct:0.20},
        {name:'Stampede',       desc:'Massive AoE rush',  type:'skill', skill:{name:'Stampede',key:'R',dmgPct:3.5,cd:55,range:TILE*6,aoe:true,aoeR:TILE*4}},
      ]}
    ]
  },
  Priest: {
    branches: [
      { name: 'Holy', color: '#f1c40f', talents: [
        {name:'Divine Grace',   desc:'+30% Heal power',   type:'passive', stat:'healBonus', pct:0.30},
        {name:'Group Heal',     desc:'Heal self+nearby',   type:'skill', skill:{name:'Group Heal',key:'W',dmgPct:0,cd:12,range:0,heal:0.25}},
        {name:'Resurrection',   desc:'Self-res passive',   type:'passive', stat:'phoenixRes', val:1, cd:90},
        {name:'Divine Shield',  desc:'Shield 4s',          type:'skill', skill:{name:'Divine Shield',key:'E',dmgPct:0,cd:25,range:0,buff:{type:'invincible',dur:4}}},
        {name:'Angel Form',     desc:'+All stats 10s',     type:'skill', skill:{name:'Angel Form',key:'R',dmgPct:0,cd:60,range:0,buff:{type:'angel',atkPct:0.3,defPct:0.3,spdPct:0.3,dur:10}}},
      ]},
      { name: 'Shadow', color: '#8e44ad', talents: [
        {name:'Dark Power',     desc:'+25% ATK',          type:'passive', stat:'atk', pct:0.25},
        {name:'Shadow Bolt',    desc:'Dark ranged shot',   type:'skill', skill:{name:'Shadow Bolt',key:'Q',dmgPct:2.2,cd:4,range:TILE*5}},
        {name:'Drain Life',     desc:'Dmg+heal self',      type:'skill', skill:{name:'Drain Life',key:'W',dmgPct:1.5,cd:8,range:TILE*3,healPct:0.20}},
        {name:'Curse',          desc:'AoE weaken',         type:'skill', skill:{name:'Curse',key:'E',dmgPct:1.0,cd:15,range:TILE*4,aoe:true,aoeR:TILE*3,slow:true}},
        {name:'Void Eruption',  desc:'Massive dark AoE',   type:'skill', skill:{name:'Void Eruption',key:'R',dmgPct:4.0,cd:55,range:TILE*5,aoe:true,aoeR:TILE*4}},
      ]}
    ]
  }
};

// --- TALENT STATE ---
const talentSystem = {
  chosenBranch: -1,   // 0 or 1, -1 = not chosen yet
  unlocked: [],       // array of talent indices unlocked [0, 1, 3, ...]
  panelOpen: false,
  baseStats: null,    // snapshot of player stats before talent modifications

  // --- Point calculations ---

  // Total talent points earned (1 per level starting at Lv.5)
  getTalentPoints() {
    if (!game.player) return 0;
    return Math.max(0, game.player.level - 4);
  },

  // Points already spent
  getSpentPoints() {
    return this.unlocked.length;
  },

  // Points available to spend
  getAvailablePoints() {
    return this.getTalentPoints() - this.getSpentPoints();
  },

  // Alias
  getPoints() {
    return this.getAvailablePoints();
  },

  // --- Get the tree for the current player class ---
  getTree() {
    if (!game.player) return null;
    return TALENT_TREES[game.player.className] || null;
  },

  // --- Snapshot base stats (call once when player is created or loaded before talents) ---
  snapshotBaseStats() {
    const p = game.player;
    if (!p) return;
    this.baseStats = {
      maxHp: p.maxHp,
      hp: p.hp,
      maxMp: p.maxMp,
      mp: p.mp,
      atk: p.atk,
      def: p.def,
      spd: p.spd,
      crit: p.crit,
      attackRange: p.attackRange || 0
    };
  },

  // --- Check if a talent at the given index can be unlocked ---
  canUnlock(talentIdx) {
    if (this.getAvailablePoints() <= 0) return false;
    if (this.unlocked.includes(talentIdx)) return false;

    const tree = this.getTree();
    if (!tree) return false;

    // Determine which branch this talent belongs to
    let branchIdx = -1;
    if (talentIdx < 5) branchIdx = 0;
    else if (talentIdx < 10) branchIdx = 1;
    else return false;

    // If branch already chosen, can only unlock from that branch
    if (this.chosenBranch >= 0 && this.chosenBranch !== branchIdx) return false;

    // Talents must be unlocked in order within the branch
    const localIdx = talentIdx % 5;
    for (let i = 0; i < localIdx; i++) {
      const prevIdx = branchIdx * 5 + i;
      if (!this.unlocked.includes(prevIdx)) return false;
    }

    return true;
  },

  // --- Unlock a talent ---
  unlock(talentIdx) {
    if (!this.canUnlock(talentIdx)) return false;

    const tree = this.getTree();
    if (!tree) return false;

    const branchIdx = talentIdx < 5 ? 0 : 1;
    const localIdx = talentIdx % 5;
    const talent = tree.branches[branchIdx].talents[localIdx];

    // First unlock sets the chosen branch
    if (this.chosenBranch < 0) {
      this.chosenBranch = branchIdx;
    }

    this.unlocked.push(talentIdx);

    // Apply passive stat bonus
    if (talent.type === 'passive') {
      this._applyPassive(talent);
    }

    // Replace skill slot if talent grants a skill
    if (talent.type === 'skill' && talent.skill) {
      this._replaceSkill(talent.skill);
    }

    // Feedback
    sfx.levelUp();
    addNotification('Talent: ' + talent.name, '#FFD700');
    addLog('Unlocked talent: ' + talent.name, '#FFD700');

    return true;
  },

  // --- Apply a single passive talent to the player ---
  _applyPassive(talent) {
    const p = game.player;
    if (!p || !this.baseStats) return;

    if (talent.pct !== undefined && talent.stat) {
      // Percentage bonus — calculated from base stats
      const base = this.baseStats[talent.stat] || 0;
      const bonus = Math.round(base * talent.pct);
      p[talent.stat] = (p[talent.stat] || 0) + bonus;
      // Keep HP in sync if maxHp changed
      if (talent.stat === 'maxHp') {
        p.hp = Math.min(p.hp + bonus, p.maxHp);
      }
    } else if (talent.val !== undefined && talent.stat) {
      // Flat value bonus
      p[talent.stat] = (p[talent.stat] || 0) + talent.val;
    }
  },

  // --- Reapply all unlocked passives (used on load) ---
  applyPassives() {
    if (!game.player) return;
    // Ensure base stats are captured before applying
    if (!this.baseStats) this.snapshotBaseStats();

    const tree = this.getTree();
    if (!tree) return;

    for (const idx of this.unlocked) {
      const branchIdx = idx < 5 ? 0 : 1;
      const localIdx = idx % 5;
      const talent = tree.branches[branchIdx].talents[localIdx];
      if (talent.type === 'passive') {
        this._applyPassive(talent);
      }
    }
  },

  // --- Replace the appropriate skill slot based on skill key ---
  _replaceSkill(skillDef) {
    const p = game.player;
    if (!p) return;
    const keyMap = { Q: 0, W: 1, E: 2, R: 3 };
    const slotIdx = keyMap[skillDef.key];
    if (slotIdx === undefined) return;
    // Copy skill def with a fresh cooldown timer
    p.skills[slotIdx] = { ...skillDef, cdTimer: 0 };
  },

  // --- Return list of skill objects granted by unlocked talents ---
  getUnlockedSkills() {
    const tree = this.getTree();
    if (!tree) return [];
    const skills = [];
    for (const idx of this.unlocked) {
      const branchIdx = idx < 5 ? 0 : 1;
      const localIdx = idx % 5;
      const talent = tree.branches[branchIdx].talents[localIdx];
      if (talent.type === 'skill' && talent.skill) {
        skills.push(talent.skill);
      }
    }
    return skills;
  },

  // --- Reset talents (new game) ---
  reset() {
    // Remove applied stat bonuses by reverting to base stats
    if (game.player && this.baseStats) {
      const p = game.player;
      for (const key of Object.keys(this.baseStats)) {
        p[key] = this.baseStats[key];
      }
    }
    this.chosenBranch = -1;
    this.unlocked = [];
    this.baseStats = null;
    this.panelOpen = false;
  },

  // --- Reset talents in-game (refund points, keep stats) ---
  resetTalents() {
    const p = game.player;
    if (!p) return false;
    const tree = this.getTree();
    if (!tree || this.unlocked.length === 0) return false;
    // Cost: 100 * player level gold
    const cost = 100 * p.level;
    if (p.gold < cost) {
      addNotification('Need ' + cost + ' Gold to reset!', '#e74c3c');
      return false;
    }
    p.gold -= cost;
    // Remove each unlocked passive bonus
    for (const idx of this.unlocked) {
      const bIdx = idx < 5 ? 0 : 1;
      const lIdx = idx % 5;
      const talent = tree.branches[bIdx].talents[lIdx];
      if (talent.type === 'passive') {
        this._removePassive(talent);
      }
    }
    // Restore default class skills
    const cls = p._baseClassName || p.className;
    const cd = CLASS_DATA[cls];
    if (cd) p.skills = cd.skills.map(s => ({...s, cdTimer: 0}));
    this.chosenBranch = -1;
    this.unlocked = [];
    this.snapshotBaseStats();
    addNotification('Talents reset! (-' + cost + 'G)', '#FFD700');
    addLog('Reset all talents for ' + cost + ' gold.', '#FFD700');
    sfx.spell();
    return true;
  },

  // --- Remove a single passive talent bonus ---
  _removePassive(talent) {
    const p = game.player;
    if (!p || !this.baseStats) return;
    if (talent.pct !== undefined && talent.stat) {
      const base = this.baseStats[talent.stat] || 0;
      const bonus = Math.round(base * talent.pct);
      p[talent.stat] = (p[talent.stat] || 0) - bonus;
      if (talent.stat === 'maxHp') p.hp = Math.min(p.hp, p.maxHp);
      if (talent.stat === 'maxMp') p.mp = Math.min(p.mp, p.maxMp);
    } else if (talent.val !== undefined && talent.stat) {
      p[talent.stat] = (p[talent.stat] || 0) - talent.val;
    }
  },

  // --- Save/Load ---
  getSaveData() {
    return {
      chosenBranch: this.chosenBranch,
      unlocked: [...this.unlocked]
    };
  },

  loadSaveData(data) {
    if (!data) return;
    this.chosenBranch = data.chosenBranch !== undefined ? data.chosenBranch : -1;
    this.unlocked = data.unlocked ? [...data.unlocked] : [];
    // Snapshot base stats before applying talent passives
    this.snapshotBaseStats();
    this.applyPassives();
    // Replace skill slots for unlocked skill talents
    const skills = this.getUnlockedSkills();
    for (const sk of skills) {
      this._replaceSkill(sk);
    }
  }
};

// ============================================================
// TALENT PANEL UI
// ============================================================

// Panel dimensions
const _TP_W = 500, _TP_H = 450;

function drawTalentPanel() {
  if (!talentSystem.panelOpen) return;
  const p = game.player;
  if (!p) return;
  const tree = talentSystem.getTree();
  if (!tree) return;

  const cx = canvas.width / 2, cy = canvas.height / 2;
  const px = cx - _TP_W / 2, py = cy - _TP_H / 2;

  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Panel background
  ctx.fillStyle = '#1a1a2e';
  roundRect(ctx, px, py, _TP_W, _TP_H, 12);
  ctx.fill();
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, _TP_W, _TP_H, 12);
  ctx.stroke();

  // Title
  const classColor = CLASS_DEFS[p.className] ? CLASS_DEFS[p.className].color : '#fff';
  ctx.fillStyle = classColor;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(p.className + ' Talents', cx, py + 28);

  // Available points
  const pts = talentSystem.getAvailablePoints();
  ctx.font = '13px sans-serif';
  ctx.fillStyle = pts > 0 ? '#FFD700' : '#888';
  ctx.fillText('Talent Points: ' + pts + ' / ' + talentSystem.getTalentPoints(), cx, py + 48);

  // Draw two branches side by side
  const branchW = 210, branchGap = 30;
  const startX = px + (_TP_W - branchW * 2 - branchGap) / 2;
  const startY = py + 65;

  for (let b = 0; b < 2; b++) {
    const branch = tree.branches[b];
    const bx = startX + b * (branchW + branchGap);
    const by = startY;
    const isChosen = talentSystem.chosenBranch === b;
    const isOther = talentSystem.chosenBranch >= 0 && !isChosen;

    // Branch header
    ctx.fillStyle = isOther ? '#555' : branch.color;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(branch.name, bx + branchW / 2, by + 12);

    // Talent nodes
    const nodeR = 18;
    const nodeSpacing = 68;
    const nodeX = bx + branchW / 2;
    const firstNodeY = by + 40;

    for (let t = 0; t < branch.talents.length; t++) {
      const talent = branch.talents[t];
      const talentIdx = b * 5 + t;
      const ny = firstNodeY + t * nodeSpacing;
      const unlocked = talentSystem.unlocked.includes(talentIdx);
      const canUnlock = talentSystem.canUnlock(talentIdx);

      // Vertical connector line to next node
      if (t < branch.talents.length - 1) {
        ctx.strokeStyle = unlocked ? '#FFD700' : (isOther ? '#333' : '#555');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(nodeX, ny + nodeR);
        ctx.lineTo(nodeX, ny + nodeSpacing - nodeR);
        ctx.stroke();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(nodeX, ny, nodeR, 0, Math.PI * 2);

      if (unlocked) {
        // Golden filled circle for unlocked
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (canUnlock) {
        // Glowing outline for available
        ctx.fillStyle = '#2a2a3e';
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Glow effect
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(nodeX, ny, nodeR, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Gray locked
        ctx.fillStyle = isOther ? '#222' : '#333';
        ctx.fill();
        ctx.strokeStyle = isOther ? '#444' : '#555';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Icon letter inside circle (first letter of talent name)
      ctx.fillStyle = unlocked ? '#1a1a2e' : (isOther ? '#555' : '#aaa');
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(talent.name.charAt(0), nodeX, ny);
      ctx.textBaseline = 'alphabetic';

      // Talent name + desc to the right or left
      const textX = b === 0 ? nodeX - nodeR - 8 : nodeX + nodeR + 8;
      const textAlign = b === 0 ? 'right' : 'left';
      ctx.textAlign = textAlign;

      ctx.fillStyle = unlocked ? '#FFD700' : (isOther ? '#555' : '#ddd');
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(talent.name, textX, ny - 4);

      ctx.fillStyle = unlocked ? '#DAA520' : (isOther ? '#444' : '#999');
      ctx.font = '10px sans-serif';
      ctx.fillText(talent.desc, textX, ny + 10);
    }
  }

  // Close button (X) — top right of panel
  const closeX = px + _TP_W - 28, closeY = py + 8;
  ctx.fillStyle = '#c0392b';
  roundRect(ctx, closeX, closeY, 20, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('X', closeX + 10, closeY + 10);
  ctx.textBaseline = 'alphabetic';

  // Bottom buttons row: Auto toggle + Reset
  const autoOn = game.settings.autoTalentAllocate;
  const abx = px + _TP_W / 2 - 90, aby = py + _TP_H - 36;
  ctx.fillStyle = autoOn ? 'rgba(20,120,40,0.9)' : 'rgba(80,30,30,0.9)';
  roundRect(ctx, abx, aby, 80, 24, 5); ctx.fill();
  ctx.strokeStyle = autoOn ? '#44ff88' : '#cc4444'; ctx.lineWidth = 1;
  roundRect(ctx, abx, aby, 80, 24, 5); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Auto: ' + (autoOn ? 'ON' : 'OFF'), abx + 40, aby + 16);

  // Reset button
  const rbx = px + _TP_W / 2 + 10, rby = aby;
  const hasPoints = talentSystem.unlocked.length > 0;
  const resetCost = 100 * (p.level || 1);
  ctx.fillStyle = hasPoints ? 'rgba(140,50,50,0.9)' : 'rgba(50,50,50,0.7)';
  roundRect(ctx, rbx, rby, 80, 24, 5); ctx.fill();
  ctx.strokeStyle = hasPoints ? '#ff6666' : '#555'; ctx.lineWidth = 1;
  roundRect(ctx, rbx, rby, 80, 24, 5); ctx.stroke();
  ctx.fillStyle = hasPoints ? '#fff' : '#666'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Reset ' + resetCost + 'G', rbx + 40, rby + 16);

  // Reset text align
  ctx.textAlign = 'left';
}

// ============================================================
// CLICK HANDLING
// ============================================================

function handleTalentClick(mx, my) {
  if (!talentSystem.panelOpen) return false;
  const p = game.player;
  if (!p) return false;
  const tree = talentSystem.getTree();
  if (!tree) return false;

  const cxP = canvas.width / 2, cyP = canvas.height / 2;
  const px = cxP - _TP_W / 2, py = cyP - _TP_H / 2;

  // Close button check
  const closeX = px + _TP_W - 28, closeY = py + 8;
  if (mx >= closeX && mx <= closeX + 20 && my >= closeY && my <= closeY + 20) {
    talentSystem.panelOpen = false;
    return true;
  }

  // Auto toggle button
  const abx = px + _TP_W / 2 - 90, aby = py + _TP_H - 36;
  if (mx >= abx && mx <= abx + 80 && my >= aby && my <= aby + 24) {
    game.settings.autoTalentAllocate = !game.settings.autoTalentAllocate;
    if (typeof saveSettings === 'function') saveSettings();
    return true;
  }

  // Reset button
  const rbx = px + _TP_W / 2 + 10, rby = aby;
  if (mx >= rbx && mx <= rbx + 80 && my >= rby && my <= rby + 24) {
    talentSystem.resetTalents();
    return true;
  }

  // Click outside panel to close
  if (mx < px || mx > px + _TP_W || my < py || my > py + _TP_H) {
    talentSystem.panelOpen = false;
    return true;
  }

  // Check talent node clicks
  const branchW = 210, branchGap = 30;
  const startX = px + (_TP_W - branchW * 2 - branchGap) / 2;
  const startY = py + 65;
  const nodeR = 18;
  const nodeSpacing = 68;

  for (let b = 0; b < 2; b++) {
    const nodeX = startX + b * (branchW + branchGap) + branchW / 2;
    const firstNodeY = startY + 40;

    for (let t = 0; t < 5; t++) {
      const ny = firstNodeY + t * nodeSpacing;
      const dx = mx - nodeX, dy = my - ny;
      if (dx * dx + dy * dy <= (nodeR + 4) * (nodeR + 4)) {
        const talentIdx = b * 5 + t;
        if (talentSystem.canUnlock(talentIdx)) {
          talentSystem.unlock(talentIdx);
          return true;
        }
        return true; // Consumed click even if can't unlock
      }
    }
  }

  return true; // Click was inside panel
}

// ============================================================
// BOT INTEGRATION
// ============================================================

// Auto-pick talents for bot players
function talentBotLogic() {
  const p = game.player;
  if (!p) return;
  if (p.level < 5) return;
  if (talentSystem.getAvailablePoints() <= 0) return;

  // Ensure base stats are captured
  if (!talentSystem.baseStats) {
    talentSystem.snapshotBaseStats();
  }

  // Auto-choose branch 0 (first branch) if not chosen yet
  if (talentSystem.chosenBranch < 0) {
    talentSystem.chosenBranch = 0;
  }

  // Find next available talent in chosen branch and unlock it
  const branch = talentSystem.chosenBranch;
  for (let t = 0; t < 5; t++) {
    const idx = branch * 5 + t;
    if (talentSystem.canUnlock(idx)) {
      talentSystem.unlock(idx);
      return;
    }
  }
}

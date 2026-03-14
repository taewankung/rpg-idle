// ============================================================
// QUEST — Quest/mission system with board NPC, tracking, rewards
// ============================================================

// Town center coords (same as town.js)
const qcx = Math.floor(MAP_W / 2), qcy = Math.floor(MAP_H / 2);

// Monster types available for kill quests
const QUEST_MON_TYPES = ['slime', 'goblin', 'wolf', 'skeleton', 'dragon'];

// Quest descriptions per type
const QUEST_DESCS = {
  kill:    ['Hunt them down in the wild', 'Clear the area of threats', 'Thin the herd for safety'],
  collect: ['Gather materials from fallen foes', 'Stockpile supplies for the town', 'Collect valuables from the field'],
  dungeon: ['Descend into the depths', 'Explore the dungeon below', 'Brave the dark corridors'],
  damage:  ['Unleash destruction on your enemies', 'Show your combat prowess', 'Deal massive damage to foes'],
  survive: ['Stay alive against all odds', 'Endure the dangers of the wild', 'Prove your resilience']
};

// ---- QUEST STATE ----
const questSystem = {
  available: [],    // quests on the board (max 3)
  active: [],       // accepted quests (max 3)
  completed: [],    // completed quest IDs (for tracking)
  boardNPC: { x: (qcx - 2) * TILE + TILE / 2, y: (qcy + 3) * TILE + TILE / 2, name: 'Quest Board' },
  boardOpen: false,
  lastRefresh: 0,       // timestamp of last quest refresh
  refreshInterval: 300000, // 5 minutes in ms
  totalDmgDealt: 0,     // tracks total damage for damage quests
  surviveTimer: 0,      // tracks survival time for survive quests (seconds)
  questIdCounter: 0,

  // ---- REFRESH ----
  // Generate new available quests if enough time has passed
  refresh() {
    const now = Date.now();
    if (this.available.length === 0 || now - this.lastRefresh >= this.refreshInterval) {
      this.available = generateQuests();
      this.lastRefresh = now;
    }
  },

  // ---- ACCEPT ----
  // Move a quest from available to active (max 3 active)
  accept(questId) {
    if (this.active.length >= 3) {
      addNotification('Max 3 active quests!', '#FF4444');
      return;
    }
    const idx = this.available.findIndex(q => q.id === questId);
    if (idx === -1) return;
    const quest = this.available.splice(idx, 1)[0];
    // Reset progress trackers for specific types
    if (quest.type === 'damage') this.totalDmgDealt = 0;
    if (quest.type === 'survive') this.surviveTimer = 0;
    this.active.push(quest);
    addNotification('Quest accepted: ' + quest.title, '#44FF44');
    sfx.itemPickup();
  },

  // ---- CHECK PROGRESS ----
  // Called each frame to check all active quests for completion
  checkProgress() {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const q = this.active[i];
      if (q.completed) continue;

      let done = false;
      switch (q.type) {
        case 'kill':
          done = q.progress >= q.target.count;
          break;
        case 'collect':
          done = q.progress >= q.target.count;
          break;
        case 'dungeon':
          // Check dungeon floor if dungeon system exists
          if (typeof dungeon !== 'undefined' && dungeon.floor >= q.target.floor) {
            q.progress = dungeon.floor;
            done = true;
          }
          break;
        case 'damage':
          q.progress = this.totalDmgDealt;
          done = q.progress >= q.target.amount;
          break;
        case 'survive':
          q.progress = Math.floor(this.surviveTimer);
          done = q.progress >= q.target.minutes * 60;
          break;
      }

      if (done) {
        q.completed = true;
        this.completeQuest(q, i);
      }
    }
  },

  // ---- COMPLETE QUEST ----
  // Give rewards and move quest to completed list
  completeQuest(quest, idx) {
    const p = game.player;
    if (!p) return;

    const r = quest.reward;

    // Gold reward
    if (r.gold) {
      p.gold += r.gold;
      addDmg(p.x, p.y - TILE * 2, '+' + r.gold + 'G', '#FFD700');
    }

    // EXP reward
    if (r.exp) {
      gainExp(p, r.exp);
      addDmg(p.x, p.y - TILE * 2.5, '+' + r.exp + 'XP', '#88FF88');
    }

    // Item reward
    if (r.item) {
      p.inventory.push(r.item);
      addNotification('Received: ' + r.item.name, RARITY_COLORS[r.item.rarity] || '#FFF');
    }

    // Potion reward
    if (r.potions && r.potions > 0) {
      for (let i = 0; i < r.potions; i++) {
        p.inventory.push({
          name: 'HP Potion', type: 'potion', rarity: 'common',
          stats: { hp: 30 + p.level * 5 }, level: p.level, value: 10 + p.level * 2
        });
      }
      addNotification('Received ' + r.potions + ' HP Potions', '#44FF44');
    }

    // Quest complete effects
    addDmg(p.x, p.y - TILE * 3, 'QUEST COMPLETE!', '#FFD700');
    addEffect(p.x, p.y, 'buff', 1.0);
    sfx.victoryFanfare();
    addNotification('Quest Complete: ' + quest.title, '#FFD700');
    addLog('Quest Complete: ' + quest.title, '#FFD700');

    // Move to completed list
    this.completed.push(quest.id);
    if (typeof idx === 'number') {
      this.active.splice(idx, 1);
    } else {
      const i = this.active.indexOf(quest);
      if (i !== -1) this.active.splice(i, 1);
    }
  },

  // ---- EVENT HOOKS ----

  // Called from killMon when a monster is killed
  onMonsterKill(monsterType) {
    for (const q of this.active) {
      if (q.completed) continue;
      if (q.type === 'kill' && q.target.type === monsterType) {
        q.progress++;
      }
    }
  },

  // Called from combat when damage is dealt by player
  onDamageDealt(amount) {
    this.totalDmgDealt += amount;
    // Damage quest progress is updated in checkProgress via totalDmgDealt
  },

  // Called when player picks up an item
  onItemPickup() {
    for (const q of this.active) {
      if (q.completed) continue;
      if (q.type === 'collect') {
        q.progress++;
      }
    }
  },

  // Called when player dies — reset survive timer
  onPlayerDeath() {
    this.surviveTimer = 0;
  },

  // Called each frame to increment survive timer if player alive
  updateSurvival(dt) {
    const p = game.player;
    if (p && !p.isDead) {
      this.surviveTimer += dt;
    }
  }
};

// ---- QUEST GENERATION ----

// Generate 3 random quests from templates
function generateQuests() {
  const quests = [];
  const types = ['kill', 'collect', 'dungeon', 'damage', 'survive'];

  // Pick 3 unique types (or allow duplicates if fewer than 3 types)
  const chosen = [];
  while (chosen.length < 3) {
    const t = types[ri(0, types.length - 1)];
    // Allow duplicates of kill/collect but not others
    if (chosen.indexOf(t) === -1 || t === 'kill' || t === 'collect') {
      chosen.push(t);
    }
  }

  for (const type of chosen) {
    quests.push(createQuest(type));
  }
  return quests;
}

// Create a single quest of the given type
function createQuest(type) {
  const pLv = game.player ? game.player.level : 1;
  const id = questSystem.questIdCounter++;
  const desc = QUEST_DESCS[type][ri(0, QUEST_DESCS[type].length - 1)];

  switch (type) {
    case 'kill': {
      const count = ri(10, 30);
      const monType = QUEST_MON_TYPES[ri(0, QUEST_MON_TYPES.length - 1)];
      const typeName = monType.charAt(0).toUpperCase() + monType.slice(1);
      return {
        id, type,
        title: 'Slay ' + count + ' ' + typeName + 's',
        description: desc,
        target: { type: monType, count },
        progress: 0,
        completed: false,
        reward: {
          gold: count * 5,
          exp: count * 10,
          item: genItem(pLv),
          potions: 0
        }
      };
    }

    case 'collect': {
      const count = ri(5, 15);
      // Force rare rarity on reward item
      const item = genItem(pLv + 2);
      if (item) item.rarity = 'rare';
      return {
        id, type,
        title: 'Collect ' + count + ' Items',
        description: desc,
        target: { count },
        progress: 0,
        completed: false,
        reward: {
          gold: count * 20,
          exp: 0,
          item: item,
          potions: 0
        }
      };
    }

    case 'dungeon': {
      const floor = ri(2, 5);
      // Epic quality reward item
      const rar = 'epic';
      const mult = rarMult(rar) * (1 + pLv * 0.1);
      const tr = Math.random();
      let itype, iname;
      if (tr < 0.4) { itype = 'weapon'; iname = PRFX[ri(0, PRFX.length - 1)] + WPNS[ri(0, WPNS.length - 1)]; }
      else if (tr < 0.75) { itype = 'armor'; iname = PRFX[ri(0, PRFX.length - 1)] + ARMRS[ri(0, ARMRS.length - 1)]; }
      else { itype = 'accessory'; iname = PRFX[ri(0, PRFX.length - 1)] + ACCS[ri(0, ACCS.length - 1)]; }
      const stats = {};
      if (itype === 'weapon') { stats.atk = Math.round((2 + pLv * 1.5) * mult); if (Math.random() < 0.5) stats.crit = parseFloat((0.02 * mult).toFixed(2)); }
      else if (itype === 'armor') { stats.def = Math.round((1 + pLv) * mult); stats.hp = Math.round((10 + pLv * 5) * mult); }
      else { stats.spd = parseFloat((0.15 * mult).toFixed(2)); if (Math.random() < 0.5) stats.mp = Math.round((5 + pLv * 3) * mult); }
      const epicItem = { name: iname, type: itype, rarity: rar, stats, level: pLv, value: Math.round((5 + pLv * 10) * rarMult(rar)) };

      return {
        id, type,
        title: 'Reach Floor ' + floor + ' in Dungeon',
        description: desc,
        target: { floor },
        progress: 0,
        completed: false,
        reward: {
          gold: 0,
          exp: floor * 200,
          item: epicItem,
          potions: 0
        }
      };
    }

    case 'damage': {
      const amount = ri(1, 5) * 1000;
      return {
        id, type,
        title: 'Deal ' + amount + ' Total Damage',
        description: desc,
        target: { amount },
        progress: 0,
        completed: false,
        reward: {
          gold: Math.floor(amount / 2),
          exp: 0,
          item: null,
          potions: ri(3, 5)
        }
      };
    }

    case 'survive': {
      const minutes = ri(3, 5);
      return {
        id, type,
        title: 'Survive ' + minutes + ' Minutes',
        description: desc,
        target: { minutes },
        progress: 0,
        completed: false,
        reward: {
          gold: 0,
          exp: minutes * 100,
          item: genItem(pLv + 1),
          potions: 0
        }
      };
    }
  }
}

// ---- SPRITE GENERATION ----

function generateQuestSprites() {
  // Quest board: wooden board with yellow "!" (16x16)
  genSprite('quest_board', 16, 16, (c, w, h) => {
    // Wooden board background
    c.fillStyle = '#8B5E3C';
    c.fillRect(1, 1, 14, 14);
    c.fillStyle = '#6B3F1F';
    c.fillRect(1, 1, 14, 2);
    c.fillRect(1, 13, 14, 2);
    // Board posts
    c.fillStyle = '#5C3310';
    c.fillRect(2, 14, 2, 2);
    c.fillRect(12, 14, 2, 2);
    // Paper on board
    c.fillStyle = '#F5E6C8';
    c.fillRect(3, 3, 10, 9);
    // Yellow "!" exclamation mark
    c.fillStyle = '#FFD700';
    c.font = 'bold 9px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('!', 8, 7);
  });

  // Quest icon: yellow "!" for HUD tracking (12x12)
  genSprite('quest_icon', 12, 12, (c, w, h) => {
    // Circle background
    c.fillStyle = 'rgba(255,215,0,0.3)';
    c.beginPath();
    c.arc(6, 6, 5, 0, Math.PI * 2);
    c.fill();
    // Yellow "!" mark
    c.fillStyle = '#FFD700';
    c.font = 'bold 9px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('!', 6, 6);
  });
}

// ---- DRAWING ----

// Draw the quest board NPC on the overworld
function drawQuestBoard() {
  const npc = questSystem.boardNPC;
  const scr = camera.worldToScreen(npc.x, npc.y);

  // Draw quest board sprite
  const spr = spriteCache['quest_board'];
  if (spr) {
    ctx.drawImage(spr, scr.x - 16, scr.y - 24, 32, 32);
  } else {
    // Fallback rectangle
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(scr.x - 12, scr.y - 20, 24, 28);
  }

  // Name label
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(npc.name, scr.x, scr.y - 28);

  // "!" indicator if quests available
  if (questSystem.available.length > 0) {
    const bob = Math.sin(game.time * 4) * 3;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('!', scr.x, scr.y - 38 + bob);
  }

  // "[Click]" hint if player is nearby (within 3 tiles)
  const p = game.player;
  if (p) {
    const dist = Math.hypot(p.x - npc.x, p.y - npc.y);
    if (dist < TILE * 3) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '9px monospace';
      ctx.fillText('[Click]', scr.x, scr.y + 14);
    }
  }
}

// Draw the full quest panel UI (when boardOpen)
function drawQuestPanel() {
  if (!questSystem.boardOpen) return;

  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Panel dimensions
  const pw = 420, ph = 400;
  const px = Math.floor((canvas.width - pw) / 2);
  const py = Math.floor((canvas.height - ph) / 2);

  // Panel background
  roundRect(ctx, px, py, pw, ph, 8);
  ctx.fillStyle = 'rgba(20,20,40,0.95)';
  ctx.fill();
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Quest Board', px + pw / 2, py + 24);

  // Player gold display
  ctx.fillStyle = '#FFD700';
  ctx.font = '11px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('Gold: ' + (game.player ? game.player.gold : 0), px + pw - 12, py + 24);

  // Close button (X)
  ctx.fillStyle = '#FF4444';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('X', px + pw - 16, py + 18);

  let curY = py + 45;

  // ---- AVAILABLE QUESTS SECTION ----
  ctx.fillStyle = '#AADDFF';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Available Quests', px + 12, curY);
  curY += 18;

  if (questSystem.available.length === 0) {
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.fillText('No quests available. Check back later.', px + 16, curY);
    curY += 20;
  } else {
    for (const q of questSystem.available) {
      // Quest card background
      roundRect(ctx, px + 8, curY - 10, pw - 16, 48, 4);
      ctx.fillStyle = 'rgba(40,40,80,0.8)';
      ctx.fill();
      ctx.strokeStyle = '#556';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Quest title
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(q.title, px + 14, curY + 4);

      // Quest description
      ctx.fillStyle = '#AAA';
      ctx.font = '9px monospace';
      ctx.fillText(q.description, px + 14, curY + 18);

      // Reward preview
      let rewardText = 'Reward:';
      if (q.reward.gold) rewardText += ' ' + q.reward.gold + 'G';
      if (q.reward.exp) rewardText += ' ' + q.reward.exp + 'XP';
      if (q.reward.item) rewardText += ' [' + q.reward.item.rarity + ' item]';
      if (q.reward.potions) rewardText += ' ' + q.reward.potions + ' potions';
      ctx.fillStyle = '#FFD700';
      ctx.font = '8px monospace';
      ctx.fillText(rewardText, px + 14, curY + 30);

      // Accept button
      const btnX = px + pw - 70, btnY = curY - 2, btnW = 52, btnH = 18;
      roundRect(ctx, btnX, btnY, btnW, btnH, 3);
      ctx.fillStyle = questSystem.active.length >= 3 ? '#444' : '#227722';
      ctx.fill();
      ctx.strokeStyle = '#44AA44';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ACCEPT', btnX + btnW / 2, btnY + 12);

      curY += 54;
    }
  }

  curY += 8;

  // ---- ACTIVE QUESTS SECTION ----
  ctx.fillStyle = '#AAFFAA';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Active Quests (' + questSystem.active.length + '/3)', px + 12, curY);
  curY += 18;

  if (questSystem.active.length === 0) {
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.fillText('No active quests.', px + 16, curY);
  } else {
    for (const q of questSystem.active) {
      // Quest card background
      roundRect(ctx, px + 8, curY - 10, pw - 16, 42, 4);
      ctx.fillStyle = 'rgba(30,50,30,0.8)';
      ctx.fill();
      ctx.strokeStyle = '#4A4';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Quest title
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(q.title, px + 14, curY + 4);

      // Progress bar
      const barX = px + 14, barY = curY + 10, barW = pw - 80, barH = 10;
      let maxVal = 1, curVal = q.progress;
      switch (q.type) {
        case 'kill': maxVal = q.target.count; break;
        case 'collect': maxVal = q.target.count; break;
        case 'dungeon': maxVal = q.target.floor; break;
        case 'damage': maxVal = q.target.amount; break;
        case 'survive': maxVal = q.target.minutes * 60; break;
      }
      const pct = Math.min(1, curVal / maxVal);

      // Bar background
      ctx.fillStyle = '#222';
      ctx.fillRect(barX, barY, barW, barH);
      // Bar fill
      ctx.fillStyle = pct >= 1 ? '#FFD700' : '#44AA44';
      ctx.fillRect(barX, barY, barW * pct, barH);
      // Bar border
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      // Progress text
      ctx.fillStyle = '#FFF';
      ctx.font = '8px monospace';
      ctx.textAlign = 'right';
      const progText = Math.floor(curVal) + '/' + maxVal;
      ctx.fillText(progText, px + pw - 16, curY + 19);

      curY += 48;
    }
  }
}

// Draw the HUD quest tracker (left side, below player HUD)
function drawQuestTracker() {
  if (questSystem.active.length === 0) return;

  const startY = 135;
  const panelW = 180;
  const lineH = 36;
  const panelH = 20 + questSystem.active.length * lineH;

  // Semi-transparent background
  roundRect(ctx, 6, startY, panelW, panelH, 6);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();

  // Header
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Quests', 12, startY + 13);

  let y = startY + 24;

  for (let i = 0; i < Math.min(3, questSystem.active.length); i++) {
    const q = questSystem.active[i];

    // Quest icon
    const icon = spriteCache['quest_icon'];
    if (icon) ctx.drawImage(icon, 10, y - 5, 10, 10);

    // Title (truncated)
    const title = q.title.length > 20 ? q.title.slice(0, 18) + '..' : q.title;
    ctx.fillStyle = '#DDD';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(title, 24, y + 2);

    // Progress bar
    const barX = 24, barY = y + 7, barW = 130, barH = 6;
    let maxVal = 1, curVal = q.progress;
    switch (q.type) {
      case 'kill': maxVal = q.target.count; break;
      case 'collect': maxVal = q.target.count; break;
      case 'dungeon': maxVal = q.target.floor; break;
      case 'damage': maxVal = q.target.amount; break;
      case 'survive': maxVal = q.target.minutes * 60; break;
    }
    const pct = Math.min(1, curVal / maxVal);

    ctx.fillStyle = '#222';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = pct >= 1 ? '#FFD700' : '#44AA44';
    ctx.fillRect(barX, barY, barW * pct, barH);

    // Progress count
    ctx.fillStyle = '#AAA';
    ctx.font = '7px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(Math.floor(curVal) + '/' + maxVal, barX + barW + 22, barY + 5);

    y += lineH;
  }
}

// ---- CLICK HANDLING ----

// Handle clicks within the quest panel
function handleQuestClick(clickX, clickY) {
  const pw = 420, ph = 400;
  const px = Math.floor((canvas.width - pw) / 2);
  const py = Math.floor((canvas.height - ph) / 2);

  // Close button check (top-right X)
  if (clickX >= px + pw - 26 && clickX <= px + pw - 6 && clickY >= py + 4 && clickY <= py + 26) {
    questSystem.boardOpen = false;
    return true;
  }

  // Click outside panel to close
  if (clickX < px || clickX > px + pw || clickY < py || clickY > py + ph) {
    questSystem.boardOpen = false;
    return true;
  }

  // Accept button clicks — check each available quest
  let curY = py + 45 + 18; // starting Y for quest cards
  for (let i = 0; i < questSystem.available.length; i++) {
    const q = questSystem.available[i];
    const btnX = px + pw - 70, btnY = curY - 2, btnW = 52, btnH = 18;
    if (clickX >= btnX && clickX <= btnX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
      questSystem.accept(q.id);
      return true;
    }
    curY += 54;
  }

  return true; // consumed click (panel is open)
}

// Check if player clicked on the quest board NPC
function checkQuestBoardClick(clickX, clickY) {
  // If panel is open, delegate to panel handler
  if (questSystem.boardOpen) {
    return handleQuestClick(clickX, clickY);
  }

  // Check if clicking near the quest board NPC
  const npc = questSystem.boardNPC;
  const scr = camera.worldToScreen(npc.x, npc.y);
  const dist = Math.hypot(clickX - scr.x, clickY - scr.y);

  if (dist < TILE * 1.5) {
    // Player must be within 3 tiles of the board
    const p = game.player;
    if (p) {
      const pDist = Math.hypot(p.x - npc.x, p.y - npc.y);
      if (pDist < TILE * 3) {
        questSystem.refresh();
        questSystem.boardOpen = true;
        return true;
      }
    }
  }

  return false;
}

// ---- BOT LOGIC ----

// Bot auto-accepts available quests when near the quest board
function questBotLogic() {
  const p = game.player;
  if (!p) return;

  // Check if bot is near the quest board
  const npc = questSystem.boardNPC;
  const dist = Math.hypot(p.x - npc.x, p.y - npc.y);
  if (dist > TILE * 3) return;

  // Refresh quests if needed
  questSystem.refresh();

  // Auto-accept available quests up to the limit
  while (questSystem.active.length < 3 && questSystem.available.length > 0) {
    questSystem.accept(questSystem.available[0].id);
  }
}

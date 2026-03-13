// ============================================================
// ACHIEVEMENTS — Achievement system: definitions, tracking, UI
// ============================================================

// --- ACHIEVEMENT DEFINITIONS ---
const ACHIEVEMENTS = [
  // COMBAT
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Kill your first monster',
    category: 'COMBAT',
    icon: '⚔️',
    target: 1,
    reward: { type: 'gold', amount: 50 },
    points: 10
  },
  {
    id: 'slayer_100',
    name: 'Century Slayer',
    description: 'Kill 100 monsters',
    category: 'COMBAT',
    icon: '💀',
    target: 100,
    reward: { type: 'item', rarity: 'rare', itemType: 'weapon' },
    points: 25
  },
  {
    id: 'slayer_500',
    name: 'Mass Slaughter',
    description: 'Kill 500 monsters',
    category: 'COMBAT',
    icon: '☠️',
    target: 500,
    reward: { type: 'item', rarity: 'epic', itemType: 'weapon' },
    points: 50
  },
  {
    id: 'boss_hunter',
    name: 'Boss Hunter',
    description: 'Slay a Dragon boss',
    category: 'COMBAT',
    icon: '🐉',
    target: 1,
    reward: { type: 'item', rarity: 'epic', itemType: 'accessory' },
    points: 40
  },
  {
    id: 'world_savior',
    name: 'World Savior',
    description: 'Participate in 5 World Boss kills',
    category: 'COMBAT',
    icon: '🌍',
    target: 5,
    reward: { type: 'item', rarity: 'legendary', itemType: 'weapon' },
    points: 100
  },
  {
    id: 'streak_50',
    name: 'Unstoppable',
    description: 'Reach a 50 Kill Streak',
    category: 'COMBAT',
    icon: '🔥',
    target: 50,
    reward: { type: 'title', title: 'Unstoppable' },
    points: 30
  },
  // EXPLORATION
  {
    id: 'dungeon_clear',
    name: 'Dungeon Conqueror',
    description: 'Clear all 5 dungeon floors',
    category: 'EXPLORATION',
    icon: '🗡️',
    target: 5,
    reward: { type: 'item', rarity: 'epic', itemType: 'armor' },
    points: 50
  },
  {
    id: 'spelunker',
    name: 'Spelunker',
    description: 'Enter the dungeon 10 times',
    category: 'EXPLORATION',
    icon: '🕳️',
    target: 10,
    reward: { type: 'item', rarity: 'rare', itemType: 'accessory' },
    points: 25
  },
  // COLLECTION
  {
    id: 'treasure_50',
    name: 'Treasure Hunter',
    description: 'Find 50 items',
    category: 'COLLECTION',
    icon: '💎',
    target: 50,
    reward: { type: 'gold', amount: 500 },
    points: 20
  },
  {
    id: 'legendary_3',
    name: 'Legendary Collector',
    description: 'Find 3 Legendary items',
    category: 'COLLECTION',
    icon: '⭐',
    target: 3,
    reward: { type: 'title', title: 'Legendary' },
    points: 50
  },
  {
    id: 'pet_collector',
    name: 'Pet Collector',
    description: 'Own all 5 pet types',
    category: 'COLLECTION',
    icon: '🐾',
    target: 5,
    reward: { type: 'special', effect: 'glow' },
    points: 40
  },
  {
    id: 'shopaholic',
    name: 'Shopaholic',
    description: 'Spend 10000 Gold at the shop',
    category: 'COLLECTION',
    icon: '🛒',
    target: 10000,
    reward: { type: 'special', effect: 'shopDiscount' },
    points: 30
  },
  // PROGRESSION
  {
    id: 'level_10',
    name: 'Rising Hero',
    description: 'Reach level 10',
    category: 'PROGRESSION',
    icon: '📈',
    target: 10,
    reward: { type: 'item', rarity: 'uncommon', itemType: 'potion' },
    points: 10
  },
  {
    id: 'level_20',
    name: 'Seasoned Warrior',
    description: 'Reach level 20',
    category: 'PROGRESSION',
    icon: '🏅',
    target: 20,
    reward: { type: 'item', rarity: 'rare', itemType: 'potion' },
    points: 25
  },
  {
    id: 'level_30',
    name: 'Veteran Legend',
    description: 'Reach level 30',
    category: 'PROGRESSION',
    icon: '🏆',
    target: 30,
    reward: { type: 'item', rarity: 'epic', itemType: 'potion' },
    points: 50
  },
  {
    id: 'talent_master',
    name: 'Talent Master',
    description: 'Unlock all 5 talents in a branch',
    category: 'PROGRESSION',
    icon: '✨',
    target: 5,
    reward: { type: 'special', effect: 'goldenAura' },
    points: 40
  },
  {
    id: 'quest_50',
    name: 'Questmaster',
    description: 'Complete 50 quests',
    category: 'PROGRESSION',
    icon: '📜',
    target: 50,
    reward: { type: 'title', title: 'Questmaster' },
    points: 50
  }
];

// --- ACHIEVEMENT SYSTEM STATE ---
const achievementSystem = {
  unlocked: new Set(),     // Set of achievement IDs that are completed
  progress: {},            // {id: currentCount} partial progress tracking
  titles: [],              // array of unlocked title strings
  activeTitle: null,       // currently selected title string or null
  panelOpen: false,        // toggled with H key
  popup: { achievement: null, timer: 0, slideY: -80 }, // unlock animation
  totalPoints: 0,          // sum of points from unlocked achievements
  activeCategory: 'COMBAT', // currently viewed category tab
  shopDiscount: false,     // whether 20% shop discount is active
  hasGoldenAura: false,    // golden aura effect from talent_master
  hasPetGlow: false,       // special glow from pet_collector

  // Tracking stats object
  stats: {
    kills: 0,
    itemsFound: 0,
    legendariesFound: 0,
    dungeonEnters: 0,
    dungeonFloorsCleared: 0,
    goldSpent: 0,
    worldBossKills: 0,
    maxStreak: 0,
    dragonKills: 0
  },

  // --- CHECK ALL ACHIEVEMENTS ---
  // Compare stats/progress against targets; unlock newly completed ones
  check() {
    for (const ach of ACHIEVEMENTS) {
      if (this.unlocked.has(ach.id)) continue;
      let current = 0;

      switch (ach.id) {
        case 'first_blood':   current = this.stats.kills; break;
        case 'slayer_100':    current = this.stats.kills; break;
        case 'slayer_500':    current = this.stats.kills; break;
        case 'boss_hunter':   current = this.stats.dragonKills; break;
        case 'world_savior':  current = this.stats.worldBossKills; break;
        case 'streak_50':     current = this.stats.maxStreak; break;
        case 'dungeon_clear': current = this.stats.dungeonFloorsCleared; break;
        case 'spelunker':     current = this.stats.dungeonEnters; break;
        case 'treasure_50':   current = this.stats.itemsFound; break;
        case 'legendary_3':   current = this.stats.legendariesFound; break;
        case 'pet_collector': current = this._countOwnedPetTypes(); break;
        case 'shopaholic':    current = this.stats.goldSpent; break;
        case 'level_10':      current = (game.player ? game.player.level : 0); break;
        case 'level_20':      current = (game.player ? game.player.level : 0); break;
        case 'level_30':      current = (game.player ? game.player.level : 0); break;
        case 'talent_master': current = this._checkTalentBranch(); break;
        case 'quest_50':      current = (typeof questSystem !== 'undefined' ? questSystem.completed.length : 0); break;
      }

      // Update progress
      this.progress[ach.id] = current;

      // Check if target met
      if (current >= ach.target) {
        this._unlock(ach);
      }
    }
  },

  // Count how many distinct pet types are owned (have at least 1 gem)
  _countOwnedPetTypes() {
    if (typeof petSystem === 'undefined') return 0;
    const petTypes = ['slime', 'goblin', 'wolf', 'skeleton', 'dragon'];
    let count = 0;
    for (const t of petTypes) {
      if (petSystem.gems[t] && petSystem.gems[t] > 0) count++;
    }
    return count;
  },

  // Check if any talent branch has all 5 unlocked
  _checkTalentBranch() {
    if (typeof talentSystem === 'undefined') return 0;
    if (!talentSystem.unlocked || !Array.isArray(talentSystem.unlocked)) return 0;
    if (!game.player) return 0;

    const cls = game.player.className;
    if (typeof TALENT_TREES === 'undefined' || !TALENT_TREES[cls]) return 0;

    let maxInBranch = 0;
    const branches = TALENT_TREES[cls].branches;
    for (let bi = 0; bi < branches.length; bi++) {
      let count = 0;
      const branch = branches[bi];
      for (let ti = 0; ti < branch.talents.length; ti++) {
        if (talentSystem.unlocked.some(u => u.branch === bi && u.index === ti)) {
          count++;
        }
      }
      if (count > maxInBranch) maxInBranch = count;
    }
    return maxInBranch;
  },

  // --- UNLOCK ACHIEVEMENT ---
  _unlock(ach) {
    this.unlocked.add(ach.id);
    this.totalPoints += ach.points;

    // Grant reward
    this._grantReward(ach);

    // Trigger popup
    this.popup.achievement = ach;
    this.popup.timer = 4.0;
    this.popup.slideY = -80;

    // Sound
    if (typeof sfx !== 'undefined') sfx.victoryFanfare();

    // Log
    if (typeof addLog !== 'undefined') addLog('Achievement unlocked: ' + ach.name, '#FFD700');
    if (typeof addNotification !== 'undefined') addNotification('Achievement: ' + ach.name, '#FFD700');
  },

  // --- GRANT REWARD ---
  _grantReward(ach) {
    const p = game.player;
    if (!p) return;
    const r = ach.reward;

    if (r.type === 'gold') {
      p.gold += r.amount;
      if (typeof addDmg !== 'undefined') addDmg(p.x, p.y - TILE * 2, '+' + r.amount + 'G', '#FFD700');

    } else if (r.type === 'item') {
      const item = this._genRewardItem(r.rarity, r.itemType, p.level);
      if (item) {
        p.inventory.push(item);
        if (typeof addNotification !== 'undefined') {
          addNotification('Reward: ' + item.name, RARITY_COLORS[item.rarity] || '#fff');
        }
      }

    } else if (r.type === 'title') {
      if (!this.titles.includes(r.title)) {
        this.titles.push(r.title);
        if (typeof addNotification !== 'undefined') {
          addNotification('New Title Unlocked: ' + r.title, '#AA44FF');
        }
      }

    } else if (r.type === 'special') {
      if (r.effect === 'glow') {
        this.hasPetGlow = true;
        if (typeof addNotification !== 'undefined') addNotification('Pet Glow effect unlocked!', '#FF88CC');
      } else if (r.effect === 'shopDiscount') {
        this.shopDiscount = true;
        if (typeof addNotification !== 'undefined') addNotification('Shop Discount 20% activated!', '#44FF88');
      } else if (r.effect === 'goldenAura') {
        this.hasGoldenAura = true;
        if (typeof addNotification !== 'undefined') addNotification('Golden Aura unlocked!', '#FFD700');
      }
    }
  },

  // Generate a reward item based on rarity and type
  _genRewardItem(rarity, itemType, level) {
    if (!level) level = 1;

    if (itemType === 'potion') {
      const healAmt = 30 + level * 5;
      return { name: 'Stat Potion', type: 'potion', rarity: rarity, stats: { hp: healAmt }, level, value: 50 + level * 5 };
    }

    const mult = (typeof rarMult !== 'undefined') ? rarMult(rarity) * (1 + level * 0.1) : (1 + level * 0.1);
    const prefixes = (typeof PRFX !== 'undefined') ? PRFX : ['', 'Iron ', 'Steel '];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

    let type = itemType;
    let name = '';
    const stats = {};

    if (type === 'weapon') {
      const wpns = (typeof WPNS !== 'undefined') ? WPNS : ['Sword', 'Axe', 'Staff'];
      name = prefix + wpns[Math.floor(Math.random() * wpns.length)];
      stats.atk = Math.round((3 + level * 1.5) * mult);
      if (Math.random() < 0.4) stats.crit = parseFloat((0.02 * mult).toFixed(2));
    } else if (type === 'armor') {
      const armrs = (typeof ARMRS !== 'undefined') ? ARMRS : ['Robe', 'Plate', 'Leather'];
      name = prefix + armrs[Math.floor(Math.random() * armrs.length)];
      stats.def = Math.round((1 + level) * mult);
      stats.hp = Math.round((15 + level * 5) * mult);
    } else if (type === 'accessory') {
      const accs = (typeof ACCS !== 'undefined') ? ACCS : ['Ring', 'Amulet'];
      name = prefix + accs[Math.floor(Math.random() * accs.length)];
      stats.spd = parseFloat((0.15 * mult).toFixed(2));
      if (Math.random() < 0.5) stats.mp = Math.round((5 + level * 3) * mult);
    }

    const value = Math.round((5 + level * 10) * ((typeof rarMult !== 'undefined') ? rarMult(rarity) : 1));
    return { name, type, rarity, stats, level, value };
  },

  // --- EVENT HOOKS ---

  // Called when player kills a monster
  onKill(monsterType) {
    this.stats.kills++;
    if (monsterType === 'dragon') {
      this.stats.dragonKills++;
    }
    this.check();
  },

  // Called when player picks up an item
  onItemFound(item) {
    if (!item) return;
    this.stats.itemsFound++;
    if (item.rarity === 'legendary') {
      this.stats.legendariesFound++;
    }
    this.check();
  },

  // Called on player level up
  onLevelUp(level) {
    // Level milestones checked via check() since they read game.player.level
    this.check();
  },

  // Called when player enters dungeon
  onDungeonEnter() {
    this.stats.dungeonEnters++;
    this.check();
  },

  // Called when player clears a dungeon floor
  onDungeonFloorClear(floor) {
    if (floor > this.stats.dungeonFloorsCleared) {
      this.stats.dungeonFloorsCleared = floor;
    }
    this.check();
  },

  // Called when player spends gold at shop
  onGoldSpent(amount) {
    this.stats.goldSpent += amount;
    this.check();
  },

  // Called when player participates in a world boss kill
  onWorldBossKill() {
    this.stats.worldBossKills++;
    this.check();
  },

  // Called when player achieves a kill streak count
  onStreak(count) {
    if (count > this.stats.maxStreak) {
      this.stats.maxStreak = count;
    }
    this.check();
  },

  // Get the active title string (used by drawEntity)
  getActiveTitle() {
    return this.activeTitle;
  },

  // --- SAVE / LOAD ---
  getSaveData() {
    return {
      unlocked: [...this.unlocked],
      progress: { ...this.progress },
      titles: [...this.titles],
      activeTitle: this.activeTitle,
      stats: { ...this.stats },
      shopDiscount: this.shopDiscount,
      hasGoldenAura: this.hasGoldenAura,
      hasPetGlow: this.hasPetGlow,
      totalPoints: this.totalPoints
    };
  },

  loadSaveData(data) {
    if (!data) return;
    this.unlocked = new Set(data.unlocked || []);
    this.progress = data.progress || {};
    this.titles = data.titles || [];
    this.activeTitle = data.activeTitle || null;
    this.stats = Object.assign({
      kills: 0, itemsFound: 0, legendariesFound: 0,
      dungeonEnters: 0, dungeonFloorsCleared: 0,
      goldSpent: 0, worldBossKills: 0, maxStreak: 0, dragonKills: 0
    }, data.stats || {});
    this.shopDiscount = data.shopDiscount || false;
    this.hasGoldenAura = data.hasGoldenAura || false;
    this.hasPetGlow = data.hasPetGlow || false;
    this.totalPoints = data.totalPoints || 0;

    // Recalculate totalPoints from unlocked in case of mismatch
    let pts = 0;
    for (const id of this.unlocked) {
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) pts += ach.points;
    }
    this.totalPoints = pts;
  }
};

// --- DRAW ACHIEVEMENT POPUP ---
// Golden banner slides down from top, stays 4s then slides up
function drawAchievementPopup() {
  const pop = achievementSystem.popup;
  if (!pop.achievement || pop.timer <= 0) return;

  const ach = pop.achievement;
  const W = canvas.width;
  const bannerW = 340;
  const bannerH = 72;
  const targetY = 14;
  const hiddenY = -bannerH - 4;

  // Animate slide
  const elapsed = 4.0 - pop.timer;
  let slideY;
  if (elapsed < 0.4) {
    // Slide in: ease out
    const t = elapsed / 0.4;
    slideY = hiddenY + (targetY - hiddenY) * (1 - Math.pow(1 - t, 2));
  } else if (pop.timer < 0.5) {
    // Slide out: ease in
    const t = 1 - pop.timer / 0.5;
    slideY = targetY + (hiddenY - targetY) * t * t;
  } else {
    slideY = targetY;
  }

  const bx = (W - bannerW) / 2;
  const by = slideY;

  ctx.save();

  // Drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 16;

  // Panel background
  const grad = ctx.createLinearGradient(bx, by, bx, by + bannerH);
  grad.addColorStop(0, '#2a1a00');
  grad.addColorStop(1, '#1a0f00');
  ctx.fillStyle = grad;
  roundRect(ctx, bx, by, bannerW, bannerH, 10);
  ctx.fill();

  // Gold border with glow
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, bannerW, bannerH, 10);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  // Icon area
  const iconSize = 48;
  const iconX = bx + 12;
  const iconY = by + (bannerH - iconSize) / 2;
  ctx.fillStyle = '#3a2200';
  roundRect(ctx, iconX, iconY, iconSize, iconSize, 6);
  ctx.fill();
  ctx.strokeStyle = '#AA7700';
  ctx.lineWidth = 1;
  roundRect(ctx, iconX, iconY, iconSize, iconSize, 6);
  ctx.stroke();

  // Category color square in icon
  const catColor = _achCategoryColor(ach.category);
  ctx.fillStyle = catColor;
  ctx.fillRect(iconX + 10, iconY + 10, 28, 28);

  // Achievement label
  const textX = iconX + iconSize + 12;
  ctx.textAlign = 'left';

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('ACHIEVEMENT UNLOCKED', textX, by + 22);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(ach.name, textX, by + 40);

  ctx.fillStyle = '#BBBBBB';
  ctx.font = '10px monospace';
  ctx.fillText(ach.description, textX, by + 56);

  // Points badge
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('+' + ach.points + 'pts', bx + bannerW - 12, by + 22);

  // Reward text
  ctx.fillStyle = '#88FFAA';
  ctx.font = '10px monospace';
  ctx.fillText(_achRewardText(ach.reward), bx + bannerW - 12, by + 56);

  ctx.restore();
}

// Update popup timer (call from game update loop)
function updateAchievementPopup(dt) {
  const pop = achievementSystem.popup;
  if (pop.timer > 0) {
    pop.timer -= dt;
    if (pop.timer <= 0) {
      pop.achievement = null;
      pop.timer = 0;
    }
  }
}

// --- DRAW ACHIEVEMENT PANEL ---
function drawAchievementPanel() {
  if (!achievementSystem.panelOpen) return;

  const W = canvas.width, H = canvas.height;
  const pw = 500, ph = 400;
  const px = Math.floor((W - pw) / 2);
  const py = Math.floor((H - ph) / 2);
  const as = achievementSystem;

  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, W, H);

  // Panel background
  ctx.save();
  roundRect(ctx, px, py, pw, ph, 10);
  ctx.fillStyle = 'rgba(10,10,28,0.97)';
  ctx.fill();
  ctx.strokeStyle = '#557799';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Achievements  [H]', px + pw / 2, py + 24);

  // Total points (top right)
  ctx.fillStyle = '#AAAAFF';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(as.totalPoints + ' pts', px + pw - 38, py + 24);

  // Close button
  ctx.fillStyle = 'rgba(180,40,40,0.85)';
  roundRect(ctx, px + pw - 28, py + 8, 20, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('X', px + pw - 18, py + 23);

  // --- CATEGORY TABS ---
  const categories = ['COMBAT', 'EXPLORATION', 'COLLECTION', 'PROGRESSION'];
  const tabW = Math.floor((pw - 20) / categories.length);
  const tabH = 26;
  const tabY = py + 32;
  const tabX = px + 10;

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const tx = tabX + i * tabW;
    const isActive = as.activeCategory === cat;
    ctx.fillStyle = isActive ? '#224466' : 'rgba(20,20,40,0.8)';
    roundRect(ctx, tx, tabY, tabW - 4, tabH, 4);
    ctx.fill();
    ctx.strokeStyle = isActive ? '#44AAFF' : '#334';
    ctx.lineWidth = 1;
    roundRect(ctx, tx, tabY, tabW - 4, tabH, 4);
    ctx.stroke();
    ctx.fillStyle = isActive ? '#44AAFF' : '#778899';
    ctx.font = (isActive ? 'bold ' : '') + '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(cat, tx + (tabW - 4) / 2, tabY + 17);
  }

  // --- ACHIEVEMENT LIST ---
  const listY = tabY + tabH + 8;
  const listH = ph - (listY - py) - 80; // leave room for title section
  const catAchs = ACHIEVEMENTS.filter(a => a.category === as.activeCategory);
  const itemH = 56;

  // Clip to list area
  ctx.save();
  ctx.beginPath();
  ctx.rect(px + 8, listY, pw - 16, listH);
  ctx.clip();

  for (let i = 0; i < catAchs.length; i++) {
    const ach = catAchs[i];
    const iy = listY + i * itemH;
    const isDone = as.unlocked.has(ach.id);
    const progress = as.progress[ach.id] || 0;
    const pct = Math.min(1, progress / ach.target);

    // Item background
    ctx.fillStyle = isDone ? 'rgba(30,50,30,0.7)' : 'rgba(20,20,40,0.7)';
    roundRect(ctx, px + 10, iy + 2, pw - 20, itemH - 4, 6);
    ctx.fill();
    ctx.strokeStyle = isDone ? '#44AA44' : '#334';
    ctx.lineWidth = 1;
    roundRect(ctx, px + 10, iy + 2, pw - 20, itemH - 4, 6);
    ctx.stroke();

    // Category color icon square
    const catColor = _achCategoryColor(ach.category);
    ctx.fillStyle = isDone ? catColor : '#444';
    ctx.fillRect(px + 18, iy + 10, 28, 28);
    ctx.strokeStyle = isDone ? catColor : '#556';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 18, iy + 10, 28, 28);

    // Name
    ctx.fillStyle = isDone ? '#FFFFFF' : '#AAAAAA';
    ctx.font = (isDone ? 'bold ' : '') + '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(ach.name, px + 54, iy + 20);

    // Description
    ctx.fillStyle = '#888';
    ctx.font = '9px monospace';
    ctx.fillText(ach.description, px + 54, iy + 33);

    // Reward text
    ctx.fillStyle = isDone ? '#88FFAA' : '#665533';
    ctx.font = '9px monospace';
    ctx.fillText('Reward: ' + _achRewardText(ach.reward), px + 54, iy + 46);

    // Points
    ctx.fillStyle = isDone ? '#FFD700' : '#664';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(ach.points + 'pts', px + pw - 14, iy + 20);

    // Checkmark or progress bar
    if (isDone) {
      ctx.fillStyle = '#44FF88';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('✓', px + pw - 14, iy + 44);
    } else {
      // Progress bar
      const barX = px + 54, barY = iy + 38, barW = pw - 140, barH = 8;
      ctx.fillStyle = '#111';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = pct >= 1 ? '#44FF88' : '#2255AA';
      ctx.fillRect(barX, barY, barW * pct, barH);
      ctx.strokeStyle = '#335';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);
      // Progress text
      ctx.fillStyle = '#AAA';
      ctx.font = '8px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.floor(progress) + '/' + ach.target, px + pw - 14, iy + 46);
    }
  }

  ctx.restore(); // unclip

  // --- TOTAL POINTS BAR ---
  const botY = py + ph - 78;
  ctx.strokeStyle = '#334';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + 10, botY);
  ctx.lineTo(px + pw - 10, botY);
  ctx.stroke();

  ctx.fillStyle = '#AACCEE';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Total Points: ' + as.totalPoints, px + 14, botY + 16);

  const unlockedCount = as.unlocked.size;
  ctx.fillStyle = '#778899';
  ctx.font = '10px monospace';
  ctx.fillText(unlockedCount + '/' + ACHIEVEMENTS.length + ' achievements unlocked', px + 14, botY + 30);

  // --- TITLE SELECTOR ---
  const titleY = botY + 38;
  ctx.fillStyle = '#AACCEE';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Titles:', px + 14, titleY);

  if (as.titles.length === 0) {
    ctx.fillStyle = '#445';
    ctx.font = '10px monospace';
    ctx.fillText('No titles unlocked yet', px + 70, titleY);
  } else {
    let tx = px + 70;
    for (let i = 0; i < as.titles.length; i++) {
      const title = as.titles[i];
      const isActive = as.activeTitle === title;
      const tw = Math.max(80, ctx.measureText(title).width + 20);

      ctx.fillStyle = isActive ? '#553300' : 'rgba(30,30,50,0.8)';
      roundRect(ctx, tx, titleY - 12, tw, 20, 4);
      ctx.fill();
      ctx.strokeStyle = isActive ? '#FFD700' : '#445';
      ctx.lineWidth = 1;
      roundRect(ctx, tx, titleY - 12, tw, 20, 4);
      ctx.stroke();

      ctx.fillStyle = isActive ? '#FFD700' : '#AAAAAA';
      ctx.font = (isActive ? 'bold ' : '') + '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(title, tx + tw / 2, titleY + 2);

      tx += tw + 8;
    }
  }

  ctx.restore();
}

// --- HANDLE ACHIEVEMENT CLICK ---
function handleAchievementClick(cx, cy) {
  if (!achievementSystem.panelOpen) return false;

  const W = canvas.width, H = canvas.height;
  const pw = 500, ph = 400;
  const px = Math.floor((W - pw) / 2);
  const py = Math.floor((H - ph) / 2);
  const as = achievementSystem;

  // Click outside panel → close
  if (cx < px || cx > px + pw || cy < py || cy > py + ph) {
    as.panelOpen = false;
    return true;
  }

  // Close button
  if (cx >= px + pw - 28 && cx <= px + pw - 8 && cy >= py + 8 && cy <= py + 28) {
    as.panelOpen = false;
    return true;
  }

  // Tab switching
  const categories = ['COMBAT', 'EXPLORATION', 'COLLECTION', 'PROGRESSION'];
  const tabW = Math.floor((pw - 20) / categories.length);
  const tabH = 26;
  const tabY = py + 32;
  const tabX = px + 10;

  for (let i = 0; i < categories.length; i++) {
    const tx = tabX + i * tabW;
    if (cx >= tx && cx <= tx + tabW - 4 && cy >= tabY && cy <= tabY + tabH) {
      as.activeCategory = categories[i];
      return true;
    }
  }

  // Title selector clicks
  const botY = py + ph - 78;
  const titleY = botY + 38;

  if (as.titles.length > 0 && cy >= titleY - 14 && cy <= titleY + 10) {
    let tx = px + 70;
    for (const title of as.titles) {
      // Approximate tile width
      const tw = Math.max(80, title.length * 7 + 20);
      if (cx >= tx && cx <= tx + tw) {
        if (as.activeTitle === title) {
          as.activeTitle = null; // deselect
        } else {
          as.activeTitle = title;
        }
        return true;
      }
      tx += tw + 8;
    }
  }

  return true; // consumed
}

// --- UTILITY: Category color ---
function _achCategoryColor(category) {
  switch (category) {
    case 'COMBAT':      return '#FF4444';
    case 'EXPLORATION': return '#44AAFF';
    case 'COLLECTION':  return '#AA44FF';
    case 'PROGRESSION': return '#FFD700';
    default:            return '#888888';
  }
}

// --- UTILITY: Human-readable reward text ---
function _achRewardText(reward) {
  if (!reward) return '';
  switch (reward.type) {
    case 'gold':    return reward.amount + ' Gold';
    case 'item':    return (reward.rarity ? reward.rarity.charAt(0).toUpperCase() + reward.rarity.slice(1) + ' ' : '') + (reward.itemType || 'item');
    case 'title':   return 'Title: "' + reward.title + '"';
    case 'special':
      if (reward.effect === 'glow')          return 'Special Pet Glow';
      if (reward.effect === 'shopDiscount')  return '20% Shop Discount';
      if (reward.effect === 'goldenAura')    return 'Golden Aura';
      return 'Special Effect';
    default:        return '';
  }
}

// --- DRAW ACTIVE TITLE UNDER PLAYER NAME ---
// Called from drawEntity or after drawing player name label
function drawPlayerTitle(sx, sy, halfSize) {
  const title = achievementSystem.getActiveTitle();
  if (!title) return;

  ctx.save();
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeText('<' + title + '>', sx, sy - halfSize - 26);
  ctx.fillStyle = '#FFD700';
  ctx.fillText('<' + title + '>', sx, sy - halfSize - 26);
  ctx.restore();
}

// --- GOLDEN AURA EFFECT (drawn around player if hasGoldenAura) ---
function drawGoldenAura(sx, sy) {
  if (!achievementSystem.hasGoldenAura) return;
  ctx.save();
  const t = Date.now() / 1000;
  const pulseR = 18 + Math.sin(t * 3) * 4;
  const grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, pulseR);
  grad.addColorStop(0, 'rgba(255,215,0,0.3)');
  grad.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(sx, sy, pulseR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

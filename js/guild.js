// ============================================================
// GUILD — Guild system: creation, quests, shop, members, chat
// ============================================================

const gcx = Math.floor(MAP_W / 2), gcy = Math.floor(MAP_H / 2);

const GUILD_NAME_OPTIONS = [
  'Iron Legion', 'Storm Riders', 'Phoenix Guard', 'Eclipse Order',
  'Crystal Wolves', 'Crimson Vanguard', 'Frost Sentinels', 'Solar Knights',
  'Void Walkers', 'Thunder Hawks', 'Emerald Pact', 'Obsidian Claw'
];

const GUILD_CHAT_LINES = [
  'Anyone want to party up?', 'Just hit a new level!', 'This quest is tough...',
  'GG everyone!', 'Need heals please', 'Found a legendary drop!',
  'Heading to the dungeon', 'brb afk', 'Let\'s go boss hunting!',
  'Who\'s online?', 'Nice crit!', 'I love this guild',
  'Can someone help with skeletons?', 'Just enchanted my weapon!',
  'Where are the dragons?', 'This guild rocks!', 'Almost done with the quest'
];

const NPC_GUILD_DEFS = [
  { name: 'Silver Knights', level: 3, memberCount: 8, desc: 'Noble warriors of the realm' },
  { name: 'Shadow Mages', level: 2, memberCount: 6, desc: 'Masters of arcane darkness' },
  { name: 'Wild Hunters', level: 1, memberCount: 5, desc: 'Rangers of the untamed wilds' },
  { name: 'Holy Order', level: 4, memberCount: 9, desc: 'Blessed champions of light' },
  { name: 'Dark Brotherhood', level: 5, memberCount: 10, desc: 'Feared assassins guild' }
];

const GUILD_QUEST_POOL = ['hunt', 'dungeon', 'donation', 'craft', 'boss'];

// ---- GUILD STATE ----
const guildSystem = {
  guild: null,
  panelOpen: false,
  panelTab: 'info',
  createMode: false,
  guildNameInput: '',
  guildNameIdx: 0,
  joinMode: false,
  npcGuilds: [],
  leaveConfirm: false,
  memberScroll: 0,
  chatScroll: 0,
  questIdCounter: 0,

  // NPC position in town
  npcPos: { x: (gcx + 4) * TILE + TILE / 2, y: (gcy + 3) * TILE + TILE / 2, name: 'Guild Master' },

  // ---- INIT ----
  init() {
    this.npcGuilds = NPC_GUILD_DEFS.map(def => {
      const members = [];
      for (let i = 0; i < def.memberCount; i++) {
        members.push({
          name: NPC_NAMES[ri(0, NPC_NAMES.length - 1)] + ri(1, 99),
          className: CLASSES[ri(0, 3)],
          level: ri(1, def.level * 3 + 5),
          contribution: ri(0, def.level * 50)
        });
      }
      return {
        name: def.name,
        level: def.level,
        desc: def.desc,
        members,
        exp: 0,
        expToNext: def.level * 500,
        treasury: ri(100, def.level * 500),
        quests: [],
        questRefreshTimer: 0,
        coins: 0,
        guildChat: [{ name: 'System', text: def.name + ' was founded long ago.', time: 0 }]
      };
    });
  },

  // ---- GUILD CREATION ----
  createGuild(name) {
    const p = game.player;
    if (!p) return;
    if (this.guild) { addNotification('Already in a guild!', '#FF4444'); return; }
    if (p.gold < 1000) { addNotification('Need 1000 gold to create a guild!', '#FF4444'); return; }
    if (!name || name.trim().length === 0) { addNotification('Enter a guild name!', '#FF4444'); return; }

    p.gold -= 1000;

    // Recruit NPC members
    const members = [{ name: p.name, className: p.className, level: p.level, contribution: 0, isPlayer: true }];
    const npcPool = game.npcPlayers ? [...game.npcPlayers] : [];
    const recruitCount = ri(5, Math.min(8, npcPool.length));
    const shuffled = npcPool.sort(() => Math.random() - 0.5).slice(0, recruitCount);
    for (const npc of shuffled) {
      members.push({ name: npc.name, className: npc.className, level: npc.level, contribution: 0 });
    }

    this.guild = {
      name: name.trim(),
      level: 1,
      exp: 0,
      expToNext: 500,
      members,
      treasury: 0,
      quests: [],
      questRefreshTimer: 0,
      coins: 0,
      guildChat: [{ name: 'System', text: 'Guild "' + name.trim() + '" has been created!', time: game.time }]
    };

    this.refreshQuests();
    this.panelTab = 'info';
    this.createMode = false;
    this.joinMode = false;

    addNotification('Guild "' + name.trim() + '" created!', '#FFD700');
    addLog('You created the guild "' + name.trim() + '"!', '#FFD700');
    sfx.victoryFanfare();
  },

  // ---- JOIN NPC GUILD ----
  joinGuild(idx) {
    if (this.guild) { addNotification('Already in a guild!', '#FF4444'); return; }
    if (idx < 0 || idx >= this.npcGuilds.length) return;

    const npcGuild = this.npcGuilds[idx];
    const p = game.player;
    if (!p) return;

    // Add player to the guild
    const members = [...npcGuild.members];
    members.unshift({ name: p.name, className: p.className, level: p.level, contribution: 0, isPlayer: true });

    this.guild = {
      name: npcGuild.name,
      level: npcGuild.level,
      exp: npcGuild.exp || 0,
      expToNext: npcGuild.level * 500,
      members,
      treasury: npcGuild.treasury,
      quests: [],
      questRefreshTimer: 0,
      coins: 0,
      guildChat: [
        ...npcGuild.guildChat,
        { name: 'System', text: p.name + ' has joined the guild!', time: game.time }
      ]
    };

    this.refreshQuests();
    this.panelTab = 'info';
    this.createMode = false;
    this.joinMode = false;

    addNotification('Joined "' + npcGuild.name + '"!', '#44FF44');
    addLog('You joined the guild "' + npcGuild.name + '"!', '#44FF44');
    sfx.itemPickup();
  },

  // ---- LEAVE GUILD ----
  leaveGuild() {
    if (!this.guild) return;
    const name = this.guild.name;
    this.guild = null;
    this.leaveConfirm = false;
    this.panelTab = 'info';
    addNotification('Left guild "' + name + '"', '#FF8844');
    addLog('You left the guild "' + name + '"', '#FF8844');
  },

  // ---- LEVEL SYSTEM ----
  addGuildExp(amount) {
    if (!this.guild) return;
    this.guild.exp += amount;
    while (this.guild.exp >= this.guild.expToNext && this.guild.level < 10) {
      this.guild.exp -= this.guild.expToNext;
      this.guild.level++;
      this.guild.expToNext = this.guild.level * 500;
      this.addChat('System', 'Guild reached Level ' + this.guild.level + '!');
      addNotification('Guild Level ' + this.guild.level + '!', '#FFD700');
      addLog('Guild leveled up to ' + this.guild.level + '!', '#FFD700');
      sfx.victoryFanfare();
    }
    if (this.guild.level >= 10) this.guild.exp = 0;
  },

  getBonus(type) {
    if (!this.guild) return type === 'petSlot' ? 0 : (type === 'enchantCost' ? 1 : 1);
    const lv = this.guild.level;
    switch (type) {
      case 'exp':       return 1 + (lv >= 1 ? 0.05 : 0) + (lv >= 6 ? 0.10 : 0);
      case 'gold':      return 1 + (lv >= 2 ? 0.05 : 0);
      case 'atk':       return 1 + (lv >= 3 ? 0.03 : 0);
      case 'def':       return 1 + (lv >= 4 ? 0.03 : 0);
      case 'dropRate':  return 1 + (lv >= 5 ? 0.10 : 0);
      case 'crit':      return 1 + (lv >= 7 ? 0.05 : 0);
      case 'enchantCost': return lv >= 8 ? 0.90 : 1;
      case 'afk':       return 1 + (lv >= 9 ? 0.20 : 0);
      case 'petSlot':   return lv >= 10 ? 1 : 0;
      default:          return 1;
    }
  },

  getBonusList() {
    if (!this.guild) return [];
    const lv = this.guild.level;
    const list = [];
    if (lv >= 1)  list.push({ lv: 1,  text: '+5% EXP gain',       color: '#88FF88' });
    if (lv >= 2)  list.push({ lv: 2,  text: '+5% Gold gain',      color: '#FFD700' });
    if (lv >= 3)  list.push({ lv: 3,  text: '+3% ATK',            color: '#FF6666' });
    if (lv >= 4)  list.push({ lv: 4,  text: '+3% DEF',            color: '#6688FF' });
    if (lv >= 5)  list.push({ lv: 5,  text: '+10% Drop rate',     color: '#AA44FF' });
    if (lv >= 6)  list.push({ lv: 6,  text: '+10% EXP gain',      color: '#88FF88' });
    if (lv >= 7)  list.push({ lv: 7,  text: '+5% CRIT rate',      color: '#FF8844' });
    if (lv >= 8)  list.push({ lv: 8,  text: '-10% Enchant cost',  color: '#44DDFF' });
    if (lv >= 9)  list.push({ lv: 9,  text: '+20% AFK rewards',   color: '#AADDAA' });
    if (lv >= 10) list.push({ lv: 10, text: '+1 Pet slot',        color: '#FFAAFF' });
    return list;
  },

  // ---- GUILD QUESTS ----
  refreshQuests() {
    if (!this.guild) return;
    const lv = this.guild.level;
    this.guild.quests = [];
    const chosen = [];
    while (chosen.length < 3) {
      const t = GUILD_QUEST_POOL[ri(0, GUILD_QUEST_POOL.length - 1)];
      if (chosen.indexOf(t) === -1) chosen.push(t);
    }
    for (const type of chosen) {
      this.guild.quests.push(this._createQuest(type, lv));
    }
    this.guild.questRefreshTimer = 600; // 10 minutes in-game
  },

  _createQuest(type, lv) {
    const id = this.questIdCounter++;
    switch (type) {
      case 'hunt': {
        const target = 20 + lv * 10;
        return { id, type, name: 'Guild Hunt', desc: 'Kill ' + target + ' monsters', target, progress: 0, completed: false, claimed: false, reward: { guildExp: 50 + lv * 20, coins: 20 + lv * 5 } };
      }
      case 'dungeon': {
        const floor = lv;
        return { id, type, name: 'Guild Dungeon', desc: 'Clear dungeon floor ' + floor, target: floor, progress: 0, completed: false, claimed: false, reward: { guildExp: 80 + lv * 30, coins: 30 + lv * 10 } };
      }
      case 'donation': {
        const gold = 200 + lv * 100;
        return { id, type, name: 'Guild Donation', desc: 'Donate ' + gold + ' gold', target: gold, progress: 0, completed: false, claimed: false, reward: { guildExp: 40 + lv * 15, coins: 15 + lv * 5 } };
      }
      case 'craft': {
        const count = 2 + lv;
        return { id, type, name: 'Guild Craft', desc: 'Craft ' + count + ' items', target: count, progress: 0, completed: false, claimed: false, reward: { guildExp: 60 + lv * 20, coins: 25 + lv * 8 } };
      }
      case 'boss': {
        const dmg = 5000 + lv * 2000;
        return { id, type, name: 'Guild Boss', desc: 'Deal ' + dmg + ' total damage', target: dmg, progress: 0, completed: false, claimed: false, reward: { guildExp: 100 + lv * 40, coins: 40 + lv * 12 } };
      }
    }
  },

  updateQuests(dt) {
    if (!this.guild) return;
    // Refresh timer
    this.guild.questRefreshTimer -= dt;
    if (this.guild.questRefreshTimer <= 0) {
      // Only refresh if all quests are claimed or none remain
      const unclaimed = this.guild.quests.filter(q => !q.claimed);
      if (unclaimed.length === 0) {
        this.refreshQuests();
        this.addChat('System', 'New guild quests available!');
      } else {
        this.guild.questRefreshTimer = 60; // check again in 60s
      }
    }
    // NPC auto-progress
    this._npcQuestProgress(dt);
    // Check completion
    for (const q of this.guild.quests) {
      if (!q.completed && q.progress >= q.target) {
        q.completed = true;
        this.addChat('System', 'Quest "' + q.name + '" completed!');
      }
    }
  },

  _npcQuestProgress(dt) {
    if (!this.guild) return;
    const npcCount = this.guild.members.filter(m => !m.isPlayer).length;
    if (npcCount === 0) return;
    // Each NPC contributes 1-3 per minute => total per second = npcCount * rf(1,3) / 60
    const rate = npcCount * rf(1, 3) / 60;
    for (const q of this.guild.quests) {
      if (q.completed || q.claimed) continue;
      q.progress += rate * dt;
      q.progress = Math.min(q.progress, q.target);
    }
  },

  claimQuest(idx) {
    if (!this.guild) return;
    const q = this.guild.quests[idx];
    if (!q || !q.completed || q.claimed) return;
    q.claimed = true;
    this.addGuildExp(q.reward.guildExp);
    this.guild.coins += q.reward.coins;
    addNotification('+' + q.reward.coins + ' Guild Coins, +' + q.reward.guildExp + ' Guild EXP', '#FFD700');
    addLog('Claimed guild quest: ' + q.name, '#FFD700');
    sfx.itemPickup();
  },

  donateGold(questIdx) {
    if (!this.guild || !game.player) return;
    const q = this.guild.quests[questIdx];
    if (!q || q.type !== 'donation' || q.completed || q.claimed) return;
    const p = game.player;
    const needed = q.target - Math.floor(q.progress);
    const amount = Math.min(needed, p.gold);
    if (amount <= 0) { addNotification('Not enough gold!', '#FF4444'); return; }
    p.gold -= amount;
    q.progress += amount;
    this.guild.treasury += amount;
    addNotification('Donated ' + amount + ' gold!', '#FFD700');
    if (q.progress >= q.target) {
      q.completed = true;
      this.addChat('System', 'Quest "' + q.name + '" completed!');
    }
  },

  // ---- EVENT HOOKS ----
  onMonsterKill() {
    if (!this.guild) return;
    for (const q of this.guild.quests) {
      if (q.type === 'hunt' && !q.completed && !q.claimed) q.progress++;
    }
  },

  onDungeonClear(floor) {
    if (!this.guild) return;
    for (const q of this.guild.quests) {
      if (q.type === 'dungeon' && !q.completed && !q.claimed) q.progress = Math.max(q.progress, floor);
    }
  },

  onCraft() {
    if (!this.guild) return;
    for (const q of this.guild.quests) {
      if (q.type === 'craft' && !q.completed && !q.claimed) q.progress++;
    }
  },

  onDamageDealt(amount) {
    if (!this.guild) return;
    for (const q of this.guild.quests) {
      if (q.type === 'boss' && !q.completed && !q.claimed) q.progress += amount;
    }
  },

  // ---- GUILD SHOP ----
  shopItems: [
    { name: 'Guild Potion', desc: 'Full HP restore', cost: 50, icon: 'potion_hp' },
    { name: 'Guild Weapon', desc: 'Powerful class weapon', cost: 200, icon: 'sword' },
    { name: 'Guild Mount Skin', desc: 'Cosmetic +10% SPD aura', cost: 500, icon: 'accessory' },
    { name: 'Guild Pet', desc: 'Exclusive guild mascot', cost: 1000, icon: 'loot_bag' }
  ],

  buyShopItem(idx) {
    if (!this.guild || !game.player) return;
    const item = this.shopItems[idx];
    if (!item) return;
    if (this.guild.coins < item.cost) { addNotification('Not enough Guild Coins!', '#FF4444'); return; }
    const p = game.player;

    this.guild.coins -= item.cost;

    switch (idx) {
      case 0: // Guild Potion
        p.inventory.push({ name: 'Guild Potion', type: 'potion', stats: { hp: 9999 }, rarity: 'rare', value: 100 });
        addNotification('Bought Guild Potion!', '#4488FF');
        break;
      case 1: { // Guild Weapon
        const wpnStats = { atk: Math.round(10 + p.level * 3), crit: 0.05 };
        const wpnName = 'Guild ' + (p.className === 'Mage' ? 'Staff' : p.className === 'Ranger' ? 'Bow' : p.className === 'Priest' ? 'Scepter' : 'Sword');
        p.inventory.push({ name: wpnName, type: 'weapon', stats: wpnStats, rarity: 'epic', level: p.level, value: 500 });
        addNotification('Bought ' + wpnName + '!', '#AA44FF');
        break;
      }
      case 2: // Guild Mount Skin
        p.guildMountSkin = true;
        addNotification('Guild Mount Skin unlocked!', '#FFD700');
        break;
      case 3: // Guild Pet
        if (typeof petSystem !== 'undefined') {
          // Add a guild mascot pet
          const mascot = { name: 'Guild Mascot', type: 'mascot', rarity: 'legendary', level: 1, stats: { atk: 5, def: 5, hp: 50 }, bonusType: 'exp', bonusPct: 0.05 };
          if (petSystem.pets) petSystem.pets.push(mascot);
          addNotification('Guild Mascot pet acquired!', '#FF8800');
        } else {
          addNotification('Guild Mascot acquired! (cosmetic)', '#FF8800');
        }
        break;
    }
    sfx.itemPickup();
    addLog('Purchased ' + item.name + ' for ' + item.cost + ' Guild Coins', '#FFD700');
  },

  // ---- GUILD CHAT ----
  addChat(name, text) {
    if (!this.guild) return;
    this.guild.guildChat.push({ name, text, time: game.time });
    if (this.guild.guildChat.length > 50) this.guild.guildChat.shift();
  },

  // ---- MEMBER UPDATES ----
  _memberChatTimer: 0,
  _memberLevelTimer: 0,

  updateMembers(dt) {
    if (!this.guild) return;

    // Random NPC chat messages every 30-60 seconds
    this._memberChatTimer -= dt;
    if (this._memberChatTimer <= 0) {
      const npcMembers = this.guild.members.filter(m => !m.isPlayer);
      if (npcMembers.length > 0) {
        const m = npcMembers[ri(0, npcMembers.length - 1)];
        const msg = GUILD_CHAT_LINES[ri(0, GUILD_CHAT_LINES.length - 1)];
        this.addChat(m.name, msg);
      }
      this._memberChatTimer = rf(30, 60);
    }

    // NPC level ups (cosmetic, every few minutes)
    this._memberLevelTimer -= dt;
    if (this._memberLevelTimer <= 0) {
      const npcMembers = this.guild.members.filter(m => !m.isPlayer);
      if (npcMembers.length > 0) {
        const m = npcMembers[ri(0, npcMembers.length - 1)];
        m.level++;
        m.contribution += ri(5, 15);
        this.addChat('System', m.name + ' reached level ' + m.level + '!');
      }
      this._memberLevelTimer = rf(120, 300);
    }

    // Keep player member entry up to date
    if (game.player) {
      const pm = this.guild.members.find(m => m.isPlayer);
      if (pm) {
        pm.level = game.player.level;
        pm.className = game.player.className;
        pm.name = game.player.name;
      }
    }
  },

  // ---- GUILD TAG ----
  getGuildTag() {
    if (!this.guild) return '';
    return '[' + this.guild.name + ']';
  },

  // ---- SPRITES ----
  generateSprites() {
    // Guild NPC: character holding banner/flag
    genSprite('guild_npc', 16, 16, (c) => {
      // Body
      c.fillStyle = '#f4c99a'; c.fillRect(6, 4, 4, 4); // head
      c.fillStyle = '#2c3e50'; c.fillRect(5, 1, 6, 3);  // hat
      c.fillStyle = '#2980b9'; c.fillRect(5, 8, 6, 6);  // body
      c.fillStyle = '#555'; c.fillRect(5, 14, 3, 2);     // left leg
      c.fillStyle = '#555'; c.fillRect(8, 14, 3, 2);     // right leg
      c.fillStyle = '#f4c99a'; c.fillRect(3, 9, 2, 4);   // left arm
      c.fillStyle = '#f4c99a'; c.fillRect(11, 9, 2, 4);  // right arm
      // Eyes
      c.fillStyle = '#111'; c.fillRect(7, 5, 1, 1); c.fillRect(9, 5, 1, 1);
      // Banner pole in right hand
      c.fillStyle = '#8B4513'; c.fillRect(13, 0, 1, 14);
      // Colored pennant
      c.fillStyle = '#e74c3c'; c.beginPath(); c.moveTo(14, 1); c.lineTo(14, 7); c.lineTo(11, 4); c.closePath(); c.fill();
      c.fillStyle = '#f1c40f'; c.fillRect(14, 1, 1, 1);
    });

    // Sign guild: signpost sprite
    genSprite('sign_guild', 12, 16, (c) => {
      // Post
      c.fillStyle = '#8B4513'; c.fillRect(5, 6, 2, 10);
      // Sign board
      c.fillStyle = '#a0522d'; c.fillRect(1, 1, 10, 6);
      c.strokeStyle = '#5d3a1a'; c.lineWidth = 0.5;
      c.strokeRect(1, 1, 10, 6);
      // Shield/crest icon
      c.fillStyle = '#2980b9'; c.beginPath();
      c.moveTo(4, 2); c.lineTo(8, 2); c.lineTo(8, 5); c.lineTo(6, 7); c.lineTo(4, 5); c.closePath(); c.fill();
      c.fillStyle = '#f1c40f'; c.fillRect(5, 3, 2, 1); c.fillRect(5, 4, 1, 2);
    });

    // Guild banner: decorative
    genSprite('guild_banner', 16, 24, (c) => {
      // Pole
      c.fillStyle = '#8B4513'; c.fillRect(7, 0, 2, 24);
      // Banner fabric
      c.fillStyle = '#c0392b'; c.fillRect(2, 2, 12, 14);
      c.fillStyle = '#e74c3c'; c.fillRect(3, 3, 10, 12);
      // Gold trim
      c.fillStyle = '#d4a017'; c.fillRect(2, 2, 12, 1); c.fillRect(2, 15, 12, 1);
      // Emblem (star)
      c.fillStyle = '#f1c40f';
      c.fillRect(7, 5, 2, 2);
      c.fillRect(6, 7, 4, 1);
      c.fillRect(5, 8, 6, 2);
      c.fillRect(6, 10, 4, 1);
      c.fillRect(7, 11, 2, 1);
      // Banner tails
      c.fillStyle = '#c0392b';
      c.beginPath(); c.moveTo(2, 16); c.lineTo(5, 16); c.lineTo(2, 20); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(14, 16); c.lineTo(11, 16); c.lineTo(14, 20); c.closePath(); c.fill();
    });
  },

  // ---- TOWN NPC ----
  initTownNPC() {
    this.init();
  },

  drawGuildNPC() {
    if (game.state !== 'playing') return;
    const npc = this.npcPos;
    const scr = camera.worldToScreen(npc.x, npc.y);

    // Viewport culling
    if (scr.x < -64 || scr.x > canvas.width + 64 || scr.y < -64 || scr.y > canvas.height + 64) return;

    // Draw NPC sprite
    const spr = spriteCache['guild_npc'];
    if (spr) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spr, scr.x - 16, scr.y - 16, 32, 32);
      ctx.restore();
    }

    // Draw sign
    const sign = spriteCache['sign_guild'];
    if (sign) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sign, scr.x - 36, scr.y + 4, 24, 32);
      ctx.restore();
    }

    // Name label
    ctx.save();
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(npc.name, scr.x, scr.y - 22);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(npc.name, scr.x, scr.y - 22);

    // Interaction hint
    if (game.player) {
      const dist = Math.hypot(game.player.x - npc.x, game.player.y - npc.y);
      if (dist < TILE * 2.5) {
        ctx.font = '9px monospace';
        ctx.strokeText('[Click] Guild', scr.x, scr.y - 32);
        ctx.fillStyle = '#AADDFF';
        ctx.fillText('[Click] Guild', scr.x, scr.y - 32);
      }
    }
    ctx.restore();
  },

  checkNPCClick(clickX, clickY) {
    if (game.state !== 'playing' || !game.player) return false;

    // If panel open, delegate
    if (this.panelOpen) return handleGuildClick(clickX, clickY);

    const scr = camera.worldToScreen(this.npcPos.x, this.npcPos.y);
    if (Math.hypot(clickX - scr.x, clickY - scr.y) < TILE * 1.5) {
      const dist = Math.hypot(game.player.x - this.npcPos.x, game.player.y - this.npcPos.y);
      if (dist < TILE * 3) {
        this.panelOpen = true;
        this.createMode = false;
        this.joinMode = false;
        this.leaveConfirm = false;
        return true;
      }
    }
    return false;
  },

  // ---- SAVE / LOAD ----
  save() {
    if (!this.guild) return null;
    return {
      name: this.guild.name,
      level: this.guild.level,
      exp: this.guild.exp,
      expToNext: this.guild.expToNext,
      members: this.guild.members,
      treasury: this.guild.treasury,
      coins: this.guild.coins,
      quests: this.guild.quests,
      questRefreshTimer: this.guild.questRefreshTimer,
      questIdCounter: this.questIdCounter
    };
  },

  load(data) {
    if (!data) { this.guild = null; return; }
    this.guild = {
      name: data.name,
      level: data.level,
      exp: data.exp,
      expToNext: data.expToNext || data.level * 500,
      members: data.members || [],
      treasury: data.treasury || 0,
      coins: data.coins || 0,
      quests: data.quests || [],
      questRefreshTimer: data.questRefreshTimer || 0,
      guildChat: [{ name: 'System', text: 'Welcome back to ' + data.name + '!', time: 0 }]
    };
    if (data.questIdCounter) this.questIdCounter = data.questIdCounter;
    if (this.guild.quests.length === 0) this.refreshQuests();
  }
};

// ============================================================
// GUILD PANEL UI
// ============================================================

function drawGuildPanel() {
  if (!guildSystem.panelOpen) return;

  const W = canvas.width, H = canvas.height;

  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);

  // Panel dimensions
  const pw = 400, ph = 450;
  const px = Math.floor((W - pw) / 2);
  const py = Math.floor((H - ph) / 2);

  // Panel background
  ctx.fillStyle = 'rgba(15,15,35,0.95)';
  roundRect(ctx, px, py, pw, ph, 10);
  ctx.fill();
  ctx.strokeStyle = '#4488CC';
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, pw, ph, 10);
  ctx.stroke();

  // Close button
  ctx.fillStyle = 'rgba(180,40,40,0.8)';
  roundRect(ctx, px + pw - 28, py + 8, 20, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('X', px + pw - 18, py + 23);

  // Title
  ctx.fillStyle = '#4488CC';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Guild Hall', px + pw / 2, py + 24);

  if (!guildSystem.guild) {
    _drawNoGuildPanel(px, py, pw, ph);
  } else {
    _drawGuildTabs(px, py, pw, ph);
  }
}

// ---- NO GUILD STATE ----
function _drawNoGuildPanel(px, py, pw, ph) {
  let curY = py + 50;

  if (guildSystem.createMode) {
    // Guild creation mode
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Choose a Guild Name', px + pw / 2, curY);
    curY += 24;

    // Show name options
    for (let i = 0; i < GUILD_NAME_OPTIONS.length; i++) {
      const name = GUILD_NAME_OPTIONS[i];
      const isSelected = i === guildSystem.guildNameIdx;
      const bx = px + 30, by = curY, bw = pw - 60, bh = 22;

      roundRect(ctx, bx, by, bw, bh, 4);
      ctx.fillStyle = isSelected ? 'rgba(40,100,180,0.8)' : 'rgba(40,40,60,0.6)';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#4488CC' : '#334';
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, bw, bh, 4);
      ctx.stroke();

      ctx.fillStyle = isSelected ? '#FFF' : '#AAA';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(name, px + pw / 2, by + 15);

      curY += 26;
      if (i >= 7) break; // show max 8 options to fit
    }

    curY += 8;

    // Create button
    roundRect(ctx, px + pw / 2 - 80, curY, 160, 28, 6);
    ctx.fillStyle = game.player && game.player.gold >= 1000 ? 'rgba(40,140,40,0.9)' : 'rgba(60,60,60,0.9)';
    ctx.fill();
    ctx.strokeStyle = '#44AA44';
    ctx.lineWidth = 1;
    roundRect(ctx, px + pw / 2 - 80, curY, 160, 28, 6);
    ctx.stroke();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Create (1000 Gold)', px + pw / 2, curY + 19);

    curY += 36;

    // Back button
    roundRect(ctx, px + pw / 2 - 40, curY, 80, 24, 4);
    ctx.fillStyle = 'rgba(80,40,40,0.8)';
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = '10px monospace';
    ctx.fillText('Back', px + pw / 2, curY + 16);

  } else if (guildSystem.joinMode) {
    // Join NPC guild mode
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Join an Existing Guild', px + pw / 2, curY);
    curY += 20;

    for (let i = 0; i < guildSystem.npcGuilds.length; i++) {
      const g = guildSystem.npcGuilds[i];
      const bx = px + 16, by = curY, bw = pw - 32, bh = 58;

      roundRect(ctx, bx, by, bw, bh, 6);
      ctx.fillStyle = 'rgba(30,30,60,0.8)';
      ctx.fill();
      ctx.strokeStyle = '#556';
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, bw, bh, 6);
      ctx.stroke();

      // Guild name + level
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(g.name + '  Lv.' + g.level, bx + 8, by + 16);

      // Description
      ctx.fillStyle = '#AAA';
      ctx.font = '9px monospace';
      ctx.fillText(NPC_GUILD_DEFS[i].desc, bx + 8, by + 30);

      // Members count
      ctx.fillStyle = '#88AACC';
      ctx.fillText('Members: ' + g.members.length, bx + 8, by + 44);

      // Join button
      const jbx = bx + bw - 52, jby = by + 20;
      roundRect(ctx, jbx, jby, 44, 20, 4);
      ctx.fillStyle = 'rgba(40,120,40,0.9)';
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('JOIN', jbx + 22, jby + 14);

      curY += 64;
    }

    curY += 4;

    // Back button
    roundRect(ctx, px + pw / 2 - 40, curY, 80, 24, 4);
    ctx.fillStyle = 'rgba(80,40,40,0.8)';
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Back', px + pw / 2, curY + 16);

  } else {
    // Main no-guild screen
    ctx.fillStyle = '#AAA';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('You are not in a guild.', px + pw / 2, curY + 10);
    curY += 40;

    // Create Guild button
    roundRect(ctx, px + pw / 2 - 100, curY, 200, 36, 6);
    ctx.fillStyle = 'rgba(40,80,140,0.9)';
    ctx.fill();
    ctx.strokeStyle = '#4488CC';
    ctx.lineWidth = 1;
    roundRect(ctx, px + pw / 2 - 100, curY, 200, 36, 6);
    ctx.stroke();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('Create Guild (1000 Gold)', px + pw / 2, curY + 23);
    curY += 52;

    // Join Guild button
    roundRect(ctx, px + pw / 2 - 100, curY, 200, 36, 6);
    ctx.fillStyle = 'rgba(40,120,40,0.9)';
    ctx.fill();
    ctx.strokeStyle = '#44AA44';
    ctx.lineWidth = 1;
    roundRect(ctx, px + pw / 2 - 100, curY, 200, 36, 6);
    ctx.stroke();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('Join Guild (Free)', px + pw / 2, curY + 23);
  }
}

// ---- GUILD TABS ----
function _drawGuildTabs(px, py, pw, ph) {
  const tabs = ['info', 'quests', 'shop', 'chat'];
  const tabNames = ['Info', 'Quests', 'Shop', 'Chat'];
  const tabW = (pw - 20) / 4;
  const tabY = py + 34;

  for (let i = 0; i < tabs.length; i++) {
    const tx = px + 10 + i * tabW;
    const isActive = guildSystem.panelTab === tabs[i];

    roundRect(ctx, tx, tabY, tabW - 4, 22, 4);
    ctx.fillStyle = isActive ? 'rgba(40,80,140,0.9)' : 'rgba(30,30,50,0.7)';
    ctx.fill();
    ctx.strokeStyle = isActive ? '#4488CC' : '#334';
    ctx.lineWidth = 1;
    roundRect(ctx, tx, tabY, tabW - 4, 22, 4);
    ctx.stroke();

    ctx.fillStyle = isActive ? '#FFF' : '#888';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(tabNames[i], tx + (tabW - 4) / 2, tabY + 15);
  }

  const contentY = tabY + 30;
  const contentH = ph - (contentY - py) - 10;

  switch (guildSystem.panelTab) {
    case 'info': _drawInfoTab(px, contentY, pw, contentH); break;
    case 'quests': _drawQuestsTab(px, contentY, pw, contentH); break;
    case 'shop': _drawShopTab(px, contentY, pw, contentH); break;
    case 'chat': _drawChatTab(px, contentY, pw, contentH); break;
  }
}

// ---- INFO TAB ----
function _drawInfoTab(px, startY, pw, ch) {
  const g = guildSystem.guild;
  let y = startY;

  // Guild name + level
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(g.name + '  [Lv.' + g.level + ']', px + pw / 2, y + 4);
  y += 18;

  // EXP bar
  const barX = px + 30, barW = pw - 60, barH = 12;
  ctx.fillStyle = '#222';
  ctx.fillRect(barX, y, barW, barH);
  const expPct = g.level >= 10 ? 1 : Math.min(1, g.exp / g.expToNext);
  ctx.fillStyle = '#2980b9';
  ctx.fillRect(barX, y, barW * expPct, barH);
  ctx.strokeStyle = '#556';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, y, barW, barH);
  ctx.fillStyle = '#FFF';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(g.level >= 10 ? 'MAX' : g.exp + '/' + g.expToNext + ' EXP', px + pw / 2, y + 10);
  y += 20;

  // Treasury + coins
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFD700';
  ctx.font = '10px monospace';
  ctx.fillText('Treasury: ' + g.treasury + 'g', px + 16, y);
  ctx.fillStyle = '#44DDFF';
  ctx.fillText('Guild Coins: ' + g.coins, px + pw / 2, y);
  y += 18;

  // Active bonuses
  const bonuses = guildSystem.getBonusList();
  if (bonuses.length > 0) {
    ctx.fillStyle = '#AADDFF';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('Active Bonuses:', px + 16, y);
    y += 14;
    for (const b of bonuses) {
      ctx.fillStyle = b.color;
      ctx.font = '9px monospace';
      ctx.fillText('Lv.' + b.lv + ': ' + b.text, px + 24, y);
      y += 12;
    }
  }
  y += 6;

  // Members header
  ctx.fillStyle = '#AADDFF';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('Members (' + g.members.length + '):', px + 16, y);
  y += 14;

  // Member list
  const maxVisible = 6;
  const startIdx = guildSystem.memberScroll;
  for (let i = startIdx; i < Math.min(startIdx + maxVisible, g.members.length); i++) {
    const m = g.members[i];
    const mx = px + 16, mw = pw - 32, mh = 18;

    ctx.fillStyle = m.isPlayer ? 'rgba(40,80,40,0.4)' : 'rgba(30,30,50,0.4)';
    ctx.fillRect(mx, y - 2, mw, mh);

    ctx.fillStyle = m.isPlayer ? '#44FF44' : '#CCC';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    const nameStr = (m.isPlayer ? '* ' : '') + m.name;
    ctx.fillText(nameStr.substring(0, 14), mx + 4, y + 10);

    ctx.fillStyle = CLASS_DEFS[m.className] ? CLASS_DEFS[m.className].color : '#888';
    ctx.fillText(m.className, mx + 120, y + 10);

    ctx.fillStyle = '#AAA';
    ctx.fillText('Lv.' + m.level, mx + 190, y + 10);

    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'right';
    ctx.fillText('Contrib: ' + Math.floor(m.contribution), mx + mw - 4, y + 10);

    y += mh + 2;
  }

  // Scroll indicator
  if (g.members.length > maxVisible) {
    ctx.fillStyle = '#666';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Scroll: ' + (startIdx + 1) + '-' + Math.min(startIdx + maxVisible, g.members.length) + ' of ' + g.members.length, px + pw / 2, y + 8);
    y += 14;
  }

  // Leave button
  y = startY + ch - 30;
  if (guildSystem.leaveConfirm) {
    ctx.fillStyle = '#FF4444';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Are you sure?', px + pw / 2, y);
    y += 16;

    // Yes button
    roundRect(ctx, px + pw / 2 - 70, y, 60, 20, 4);
    ctx.fillStyle = 'rgba(180,40,40,0.9)';
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('YES', px + pw / 2 - 40, y + 14);

    // No button
    roundRect(ctx, px + pw / 2 + 10, y, 60, 20, 4);
    ctx.fillStyle = 'rgba(40,80,40,0.9)';
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.fillText('NO', px + pw / 2 + 40, y + 14);
  } else {
    roundRect(ctx, px + pw / 2 - 60, y, 120, 24, 4);
    ctx.fillStyle = 'rgba(120,40,40,0.8)';
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Leave Guild', px + pw / 2, y + 16);
  }
}

// ---- QUESTS TAB ----
function _drawQuestsTab(px, startY, pw, ch) {
  const g = guildSystem.guild;
  let y = startY;

  // Refresh timer
  ctx.fillStyle = '#888';
  ctx.font = '9px monospace';
  ctx.textAlign = 'right';
  const mins = Math.floor(g.questRefreshTimer / 60);
  const secs = Math.floor(g.questRefreshTimer % 60);
  ctx.fillText('Refresh in: ' + mins + ':' + (secs < 10 ? '0' : '') + secs, px + pw - 16, y + 4);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#AADDFF';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('Guild Quests', px + 16, y + 4);
  y += 18;

  for (let i = 0; i < g.quests.length; i++) {
    const q = g.quests[i];
    const cardX = px + 12, cardW = pw - 24, cardH = 80;

    // Card background
    roundRect(ctx, cardX, y, cardW, cardH, 6);
    ctx.fillStyle = q.claimed ? 'rgba(40,40,40,0.5)' : q.completed ? 'rgba(40,80,20,0.6)' : 'rgba(30,30,60,0.7)';
    ctx.fill();
    ctx.strokeStyle = q.completed ? '#44AA44' : '#445';
    ctx.lineWidth = 1;
    roundRect(ctx, cardX, y, cardW, cardH, 6);
    ctx.stroke();

    // Quest name
    ctx.fillStyle = q.claimed ? '#666' : '#FFF';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(q.name, cardX + 8, y + 16);

    // Description
    ctx.fillStyle = q.claimed ? '#555' : '#AAA';
    ctx.font = '9px monospace';
    ctx.fillText(q.desc, cardX + 8, y + 30);

    // Progress bar
    const barX = cardX + 8, barY2 = y + 38, barW2 = cardW - 16, barH2 = 10;
    ctx.fillStyle = '#222';
    ctx.fillRect(barX, barY2, barW2, barH2);
    const pct = Math.min(1, q.progress / q.target);
    ctx.fillStyle = q.completed ? '#FFD700' : '#2980b9';
    ctx.fillRect(barX, barY2, barW2 * pct, barH2);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY2, barW2, barH2);

    ctx.fillStyle = '#FFF';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(Math.floor(q.progress) + '/' + q.target, cardX + cardW / 2, barY2 + 8);

    // Reward info
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFD700';
    ctx.font = '8px monospace';
    ctx.fillText('Reward: ' + q.reward.guildExp + ' GuildEXP, ' + q.reward.coins + ' Coins', cardX + 8, y + 62);

    // Claim / Donate buttons
    if (q.completed && !q.claimed) {
      const cbx = cardX + cardW - 60, cby = y + 52;
      roundRect(ctx, cbx, cby, 52, 20, 4);
      ctx.fillStyle = 'rgba(180,140,20,0.9)';
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CLAIM', cbx + 26, cby + 14);
    } else if (q.type === 'donation' && !q.completed && !q.claimed) {
      const cbx = cardX + cardW - 68, cby = y + 52;
      roundRect(ctx, cbx, cby, 60, 20, 4);
      ctx.fillStyle = 'rgba(180,140,20,0.9)';
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DONATE', cbx + 30, cby + 14);
    }

    if (q.claimed) {
      ctx.fillStyle = '#666';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('CLAIMED', cardX + cardW - 8, y + 66);
    }

    y += cardH + 8;
  }
}

// ---- SHOP TAB ----
function _drawShopTab(px, startY, pw, ch) {
  const g = guildSystem.guild;
  let y = startY;

  // Coins display
  ctx.fillStyle = '#44DDFF';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Guild Coins: ' + g.coins, px + 16, y + 4);
  y += 20;

  for (let i = 0; i < guildSystem.shopItems.length; i++) {
    const item = guildSystem.shopItems[i];
    const cardX = px + 12, cardW = pw - 24, cardH = 56;

    roundRect(ctx, cardX, y, cardW, cardH, 6);
    ctx.fillStyle = 'rgba(30,30,60,0.7)';
    ctx.fill();
    ctx.strokeStyle = '#445';
    ctx.lineWidth = 1;
    roundRect(ctx, cardX, y, cardW, cardH, 6);
    ctx.stroke();

    // Icon
    const iconSpr = spriteCache[item.icon];
    if (iconSpr) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(iconSpr, cardX + 8, y + 8, 32, 32);
      ctx.restore();
    }

    // Item name
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(item.name, cardX + 48, y + 18);

    // Description
    ctx.fillStyle = '#AAA';
    ctx.font = '9px monospace';
    ctx.fillText(item.desc, cardX + 48, y + 32);

    // Cost
    ctx.fillStyle = '#44DDFF';
    ctx.font = '9px monospace';
    ctx.fillText(item.cost + ' Coins', cardX + 48, y + 45);

    // Buy button
    const canBuy = g.coins >= item.cost;
    const bbx = cardX + cardW - 52, bby = y + 16;
    roundRect(ctx, bbx, bby, 44, 22, 4);
    ctx.fillStyle = canBuy ? 'rgba(40,120,40,0.9)' : 'rgba(60,60,60,0.9)';
    ctx.fill();
    ctx.fillStyle = canBuy ? '#FFF' : '#666';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BUY', bbx + 22, bby + 15);

    y += cardH + 8;
  }
}

// ---- CHAT TAB ----
function _drawChatTab(px, startY, pw, ch) {
  const g = guildSystem.guild;
  let y = startY;

  ctx.fillStyle = '#AADDFF';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Guild Chat', px + 16, y + 4);
  y += 16;

  // Chat area background
  const chatX = px + 12, chatW = pw - 24, chatH = ch - 30;
  roundRect(ctx, chatX, y, chatW, chatH, 4);
  ctx.fillStyle = 'rgba(10,10,20,0.8)';
  ctx.fill();
  ctx.strokeStyle = '#334';
  ctx.lineWidth = 1;
  roundRect(ctx, chatX, y, chatW, chatH, 4);
  ctx.stroke();

  // Render chat messages (most recent at bottom)
  ctx.save();
  ctx.beginPath();
  ctx.rect(chatX, y, chatW, chatH);
  ctx.clip();

  const lineH = 14;
  const maxLines = Math.floor(chatH / lineH);
  const msgs = g.guildChat;
  const startIdx = Math.max(0, msgs.length - maxLines - guildSystem.chatScroll);
  const endIdx = Math.min(msgs.length, startIdx + maxLines);
  let my = y + 12;

  for (let i = startIdx; i < endIdx; i++) {
    const msg = msgs[i];
    const isSystem = msg.name === 'System';

    if (isSystem) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('[' + msg.name + '] ' + msg.text, chatX + 6, my);
    } else {
      ctx.fillStyle = '#88AACC';
      ctx.font = '9px monospace';
      ctx.fillText('[' + msg.name + ']', chatX + 6, my);
      const nameW = ctx.measureText('[' + msg.name + '] ').width;
      ctx.fillStyle = '#CCC';
      ctx.fillText(msg.text, chatX + 6 + nameW, my);
    }
    my += lineH;
  }

  ctx.restore();

  // Scroll indicator
  if (msgs.length > maxLines) {
    ctx.fillStyle = '#555';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Scroll with mouse wheel', px + pw / 2, y + chatH + 12);
  }
}

// ============================================================
// CLICK HANDLER
// ============================================================

function handleGuildClick(clickX, clickY) {
  const pw = 400, ph = 450;
  const px = Math.floor((canvas.width - pw) / 2);
  const py = Math.floor((canvas.height - ph) / 2);

  // Close button
  if (clickX >= px + pw - 28 && clickX <= px + pw - 8 && clickY >= py + 8 && clickY <= py + 28) {
    guildSystem.panelOpen = false;
    guildSystem.createMode = false;
    guildSystem.joinMode = false;
    guildSystem.leaveConfirm = false;
    return true;
  }

  // Click outside panel
  if (clickX < px || clickX > px + pw || clickY < py || clickY > py + ph) {
    guildSystem.panelOpen = false;
    guildSystem.createMode = false;
    guildSystem.joinMode = false;
    guildSystem.leaveConfirm = false;
    return true;
  }

  if (!guildSystem.guild) {
    return _handleNoGuildClick(clickX, clickY, px, py, pw, ph);
  } else {
    return _handleGuildTabClick(clickX, clickY, px, py, pw, ph);
  }
}

function _handleNoGuildClick(cx, cy, px, py, pw, ph) {
  const startY = py + 50;

  if (guildSystem.createMode) {
    let curY = startY + 24;

    // Name option clicks
    for (let i = 0; i < Math.min(GUILD_NAME_OPTIONS.length, 8); i++) {
      const bx = px + 30, by = curY, bw = pw - 60, bh = 22;
      if (cx >= bx && cx <= bx + bw && cy >= by && cy <= by + bh) {
        guildSystem.guildNameIdx = i;
        return true;
      }
      curY += 26;
    }
    curY += 8;

    // Create button
    if (cx >= px + pw / 2 - 80 && cx <= px + pw / 2 + 80 && cy >= curY && cy <= curY + 28) {
      guildSystem.createGuild(GUILD_NAME_OPTIONS[guildSystem.guildNameIdx]);
      return true;
    }
    curY += 36;

    // Back button
    if (cx >= px + pw / 2 - 40 && cx <= px + pw / 2 + 40 && cy >= curY && cy <= curY + 24) {
      guildSystem.createMode = false;
      return true;
    }

  } else if (guildSystem.joinMode) {
    let curY = startY + 20;

    // NPC guild join buttons
    for (let i = 0; i < guildSystem.npcGuilds.length; i++) {
      const bx = px + 16, by = curY, bw = pw - 32, bh = 58;
      const jbx = bx + bw - 52, jby = by + 20;
      if (cx >= jbx && cx <= jbx + 44 && cy >= jby && cy <= jby + 20) {
        guildSystem.joinGuild(i);
        return true;
      }
      curY += 64;
    }
    curY += 4;

    // Back button
    if (cx >= px + pw / 2 - 40 && cx <= px + pw / 2 + 40 && cy >= curY && cy <= curY + 24) {
      guildSystem.joinMode = false;
      return true;
    }

  } else {
    // Main no-guild buttons
    const curY1 = startY + 40;
    if (cx >= px + pw / 2 - 100 && cx <= px + pw / 2 + 100 && cy >= curY1 && cy <= curY1 + 36) {
      guildSystem.createMode = true;
      guildSystem.guildNameIdx = 0;
      return true;
    }

    const curY2 = curY1 + 52;
    if (cx >= px + pw / 2 - 100 && cx <= px + pw / 2 + 100 && cy >= curY2 && cy <= curY2 + 36) {
      guildSystem.joinMode = true;
      return true;
    }
  }

  return true;
}

function _handleGuildTabClick(cx, cy, px, py, pw, ph) {
  // Tab clicks
  const tabs = ['info', 'quests', 'shop', 'chat'];
  const tabW = (pw - 20) / 4;
  const tabY = py + 34;
  for (let i = 0; i < tabs.length; i++) {
    const tx = px + 10 + i * tabW;
    if (cx >= tx && cx <= tx + tabW - 4 && cy >= tabY && cy <= tabY + 22) {
      guildSystem.panelTab = tabs[i];
      return true;
    }
  }

  const contentY = tabY + 30;
  const contentH = ph - (contentY - py) - 10;

  switch (guildSystem.panelTab) {
    case 'info': return _handleInfoClick(cx, cy, px, contentY, pw, contentH);
    case 'quests': return _handleQuestsClick(cx, cy, px, contentY, pw, contentH);
    case 'shop': return _handleShopClick(cx, cy, px, contentY, pw, contentH);
    case 'chat': return true; // chat has no clickable elements besides scroll
  }
  return true;
}

function _handleInfoClick(cx, cy, px, startY, pw, ch) {
  // Leave guild button / confirmation
  const leaveY = startY + ch - 30;
  if (guildSystem.leaveConfirm) {
    const confirmY = leaveY + 16;
    // Yes
    if (cx >= px + pw / 2 - 70 && cx <= px + pw / 2 - 10 && cy >= confirmY && cy <= confirmY + 20) {
      guildSystem.leaveGuild();
      return true;
    }
    // No
    if (cx >= px + pw / 2 + 10 && cx <= px + pw / 2 + 70 && cy >= confirmY && cy <= confirmY + 20) {
      guildSystem.leaveConfirm = false;
      return true;
    }
  } else {
    if (cx >= px + pw / 2 - 60 && cx <= px + pw / 2 + 60 && cy >= leaveY && cy <= leaveY + 24) {
      guildSystem.leaveConfirm = true;
      return true;
    }
  }

  // Member scroll (up/down area)
  const g = guildSystem.guild;
  if (g && g.members.length > 6) {
    // Click in upper half of member area = scroll up, lower half = scroll down
    const memberAreaY = startY + 100;
    if (cy >= memberAreaY && cy <= memberAreaY + 130) {
      if (cy < memberAreaY + 65) {
        guildSystem.memberScroll = Math.max(0, guildSystem.memberScroll - 1);
      } else {
        guildSystem.memberScroll = Math.min(g.members.length - 6, guildSystem.memberScroll + 1);
      }
      return true;
    }
  }

  return true;
}

function _handleQuestsClick(cx, cy, px, startY, pw, ch) {
  const g = guildSystem.guild;
  let y = startY + 18;

  for (let i = 0; i < g.quests.length; i++) {
    const q = g.quests[i];
    const cardX = px + 12, cardW = pw - 24, cardH = 80;

    // Claim button
    if (q.completed && !q.claimed) {
      const cbx = cardX + cardW - 60, cby = y + 52;
      if (cx >= cbx && cx <= cbx + 52 && cy >= cby && cy <= cby + 20) {
        guildSystem.claimQuest(i);
        return true;
      }
    }

    // Donate button
    if (q.type === 'donation' && !q.completed && !q.claimed) {
      const cbx = cardX + cardW - 68, cby = y + 52;
      if (cx >= cbx && cx <= cbx + 60 && cy >= cby && cy <= cby + 20) {
        guildSystem.donateGold(i);
        return true;
      }
    }

    y += cardH + 8;
  }

  return true;
}

function _handleShopClick(cx, cy, px, startY, pw, ch) {
  let y = startY + 20;

  for (let i = 0; i < guildSystem.shopItems.length; i++) {
    const cardX = px + 12, cardW = pw - 24, cardH = 56;
    const bbx = cardX + cardW - 52, bby = y + 16;

    if (cx >= bbx && cx <= bbx + 44 && cy >= bby && cy <= bby + 22) {
      guildSystem.buyShopItem(i);
      return true;
    }

    y += cardH + 8;
  }

  return true;
}

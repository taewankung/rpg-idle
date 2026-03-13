// ============================================================
//  save.js — Save / Load system using localStorage
// ============================================================

const SAVE_KEY = 'idle_rpg_save';
const SETTINGS_KEY = 'idle_rpg_settings';

// ------------------------------------------------------------
//  Save the current game state to localStorage
// ------------------------------------------------------------
function saveGame() {
  const p = game.player;
  if (!p) return;

  const data = {
    version: 1,
    timestamp: Date.now(),
    playTime: game.time,
    player: {
      className: p.className,
      name: p.name,
      level: p.level,
      exp: p.exp,
      gold: p.gold,
      hp: p.hp, maxHp: p.maxHp,
      mp: p.mp, maxMp: p.maxMp,
      atk: p.atk, def: p.def,
      spd: p.spd, crit: p.crit,
      killCount: p.killCount,
      jobLevel: p.jobLevel || 1,
      jobExp: p.jobExp || 0,
      skillPoints: p.skillPoints || 0,
      skillLevels: p.skillLevels || [0,0,0,0]
    },
    inventory: p.inventory.map(i => i ? {...i} : null),
    equipment: {
      weapon: p.equipment.weapon ? {...p.equipment.weapon} : null,
      armor: p.equipment.armor ? {...p.equipment.armor} : null,
      accessory: p.equipment.accessory ? {...p.equipment.accessory} : null
    },
    killCount: game.killCount,
    sessionExp: game.sessionExp,
    bot: {
      enabled: botAI.enabled,
      hpThreshold: botAI.settings.hpThreshold,
      targetPriority: botAI.settings.targetPriority,
      autoSkill: botAI.settings.autoSkill,
      maxChaseDistance: botAI.settings.maxChaseDistance,
      preferWeaker: botAI.settings.preferWeaker,
      lootNearbyFirst: botAI.settings.lootNearbyFirst,
      stopWhenInventoryAlmostFull: botAI.settings.stopWhenInventoryAlmostFull,
      avoidDangerousTargets: botAI.settings.avoidDangerousTargets,
      inventorySoftLimit: botAI.settings.inventorySoftLimit
    },
    // New systems
    talents: typeof talentSystem!=='undefined' ? talentSystem.getSaveData() : null,
    pet: typeof petSystem!=='undefined' ? { gems: petSystem.gems, activeType: petSystem.active ? petSystem.active.type : null } : null,
    quest: typeof questSystem!=='undefined' ? {
      available: questSystem.available,
      active: questSystem.active,
      completed: questSystem.completed,
      questIdCounter: questSystem.questIdCounter,
      totalDmgDealt: questSystem.totalDmgDealt,
      surviveTimer: questSystem.surviveTimer
    } : null,
    dungeon: typeof dungeon!=='undefined' ? { floor: dungeon.active ? dungeon.floor : 1 } : null,
    achievements: typeof achievementSystem!=='undefined' ? achievementSystem.getSaveData() : null,
    leaderboard: typeof leaderboard!=='undefined' ? leaderboard.getSaveData() : null,
    party: typeof partySystem!=='undefined' ? partySystem.getSaveData() : null,
    worldBoss: typeof worldBoss!=='undefined' ? { spawnTimer: worldBoss.spawnTimer } : null,
    crafting: typeof craftingSystem!=='undefined' ? craftingSystem.save() : null,
    offlineExpedition: typeof offlineExpeditionSystem!=='undefined' ? offlineExpeditionSystem.save() : null,
    worldMapData: typeof worldMap!=='undefined' ? worldMap.save() : null,
    pvp: typeof pvpArena!=='undefined' ? pvpArena.save() : null,
    classChange: typeof classChangeSystem!=='undefined' ? classChangeSystem.save() : null,
    enchant: typeof enchantSystem!=='undefined' ? enchantSystem.save() : null,
    guild: typeof guildSystem!=='undefined' ? guildSystem.save() : null,
    gacha: typeof gachaSystem!=='undefined' ? gachaSystem.save() : null,
    statPoints: typeof statPointSystem!=='undefined' ? statPointSystem.save() : null
  };

  try {
    const json = JSON.stringify(data);
    localStorage.setItem(SAVE_KEY, json);
    console.log('SAVED:', json.length, 'bytes, Lv.' + data.player.level, data.player.className);
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

// ------------------------------------------------------------
//  Save settings separately (persist across New Game)
// ------------------------------------------------------------
function saveSettings() {
  const s = game.settings;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      volume: s.volume,
      muted: s.muted,
      gameSpeed: s.gameSpeed,
      showDmgNumbers: s.showDmgNumbers,
      showNPCs: s.showNPCs,
      showChat: s.showChat,
      autoBuyPotions: s.autoBuyPotions,
      autoStatAllocate: s.autoStatAllocate,
      autoTalentAllocate: s.autoTalentAllocate,
      autoSkillAllocate: s.autoSkillAllocate
    }));
  } catch (e) {}
}

// ------------------------------------------------------------
//  Load settings from localStorage and apply defaults
// ------------------------------------------------------------
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    game.settings.volume         = s.volume         ?? 0.3;
    game.settings.muted          = s.muted          ?? false;
    game.settings.gameSpeed      = s.gameSpeed      ?? 1;
    game.settings.showDmgNumbers = s.showDmgNumbers ?? true;
    game.settings.showNPCs       = s.showNPCs       ?? true;
    game.settings.showChat       = s.showChat       ?? true;
    game.settings.autoBuyPotions = s.autoBuyPotions ?? true;
    game.settings.autoStatAllocate = s.autoStatAllocate ?? true;
    game.settings.autoTalentAllocate = s.autoTalentAllocate ?? true;
    game.settings.autoSkillAllocate = s.autoSkillAllocate ?? true;
    sfx.volume = game.settings.volume;
    sfx.muted  = game.settings.muted;
  } catch (e) {}
}

// ------------------------------------------------------------
//  Load a saved game — returns true if successful
// ------------------------------------------------------------
function loadGame() {
  console.log('LOAD CHECK:', localStorage.getItem(SAVE_KEY) ? 'SAVE EXISTS (' + localStorage.getItem(SAVE_KEY).length + ' bytes)' : 'NO SAVE');
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data.version || !data.player) { console.warn('LOAD: invalid save data'); return false; }
    const savedExpeditionConsumesAfk = !!(
      data.offlineExpedition &&
      (data.offlineExpedition.activeRun || data.offlineExpedition.pendingSummary)
    );
    let shouldResave = false;

    // Initialize world
    initSprites();
    generateTownSprites();
    generateDungeonSprites();
    generatePetSprites();
    generateQuestSprites();
    map.generate();
    game.monsters = spawnMonsters();
    game.npcPlayers = createNPCs(ri(8, 12));
    game.itemDrops = [];
    game.notifications = [];
    game.streakPopup = null;
    game.trails = [];
    game.sessionStart = Date.now();

    // Create fresh player then overwrite with saved stats
    const p = createPlayer(data.player.className, data.player.name);
    p.level     = data.player.level;
    p.exp       = data.player.exp;
    p.gold      = data.player.gold;
    p.hp        = data.player.hp;
    p.maxHp     = data.player.maxHp;
    p.mp        = data.player.mp;
    p.maxMp     = data.player.maxMp;
    p.atk       = data.player.atk;
    p.def       = data.player.def;
    p.spd       = data.player.spd;
    p.crit      = data.player.crit;
    p.killCount = data.player.killCount || 0;
    p.jobLevel = data.player.jobLevel || 1;
    p.jobExp = data.player.jobExp || 0;
    p.skillPoints = data.player.skillPoints || 0;
    p.skillLevels = data.player.skillLevels || [0,0,0,0];
    if(typeof applyAllJobPassives==='function')applyAllJobPassives(p);
    // Catch-up: if job level seems too low for player level, grant missing job exp
    if(p.jobLevel<Math.min(30,Math.floor(p.level*0.8))&&typeof jobLevelCatchUp==='function')jobLevelCatchUp(p);
    if(data.statPoints&&typeof statPointSystem!=='undefined')statPointSystem.load(data.statPoints);

    // Restore inventory (filter nulls)
    p.inventory = (data.inventory || []).filter(i => i != null);

    // Restore equipment directly — stats already restored above
    p.equipment.weapon    = data.equipment.weapon    || null;
    p.equipment.armor     = data.equipment.armor     || null;
    p.equipment.accessory = data.equipment.accessory || null;

    game.player = p;

    // Restore bot settings
    if (data.bot) {
      botAI.applySettings({
        hpThreshold: data.bot.hpThreshold ?? BOT_DEFAULT_SETTINGS.hpThreshold,
        targetPriority: data.bot.targetPriority ?? BOT_DEFAULT_SETTINGS.targetPriority,
        autoSkill: data.bot.autoSkill ?? true,
        maxChaseDistance: data.bot.maxChaseDistance ?? BOT_DEFAULT_SETTINGS.maxChaseDistance,
        preferWeaker: data.bot.preferWeaker ?? BOT_DEFAULT_SETTINGS.preferWeaker,
        lootNearbyFirst: data.bot.lootNearbyFirst ?? BOT_DEFAULT_SETTINGS.lootNearbyFirst,
        stopWhenInventoryAlmostFull: data.bot.stopWhenInventoryAlmostFull ?? BOT_DEFAULT_SETTINGS.stopWhenInventoryAlmostFull,
        avoidDangerousTargets: data.bot.avoidDangerousTargets ?? BOT_DEFAULT_SETTINGS.avoidDangerousTargets,
        inventorySoftLimit: data.bot.inventorySoftLimit ?? BOT_DEFAULT_SETTINGS.inventorySoftLimit
      });
      botAI.enabled = data.bot.enabled ?? true;
      botAI.state = 'idle';
      botAI.target = null;
      botAI.roamTarget = null;
      botAI.retreatTarget = null;
      botAI.lootTarget = null;
      botAI.stopReason = 'ready';
      botAI.statusText = botAI.enabled ? 'Scanning' : 'Paused';
      botAI.focusText = botAI.enabled ? 'Scanning' : 'Manual';
    } else {
      botAI.applySettings();
      botAI.enabled = true;
      botAI.state = 'idle';
      botAI.target = null;
      botAI.roamTarget = null;
      botAI.retreatTarget = null;
      botAI.lootTarget = null;
      botAI.stopReason = 'ready';
      botAI.statusText = 'Scanning';
      botAI.focusText = 'Scanning';
    }

    // Restore counters
    game.killCount  = data.killCount  || 0;
    game.sessionExp = data.sessionExp || 0;
    game.time       = data.playTime   || 0;
    game.state      = 'playing';

    // Restore new systems
    if (data.talents && typeof talentSystem !== 'undefined') {
      talentSystem.loadSaveData(data.talents);
      talentSystem.snapshotBaseStats();
    }
    if (data.pet && typeof petSystem !== 'undefined') {
      petSystem.gems = data.pet.gems || {};
      if (data.pet.activeType) petSystem.createPet(data.pet.activeType);
    }
    if (data.quest && typeof questSystem !== 'undefined') {
      questSystem.available = data.quest.available || [];
      questSystem.active = data.quest.active || [];
      questSystem.completed = data.quest.completed || [];
      questSystem.questIdCounter = data.quest.questIdCounter || 0;
      questSystem.totalDmgDealt = data.quest.totalDmgDealt || 0;
      questSystem.surviveTimer = data.quest.surviveTimer || 0;
      questSystem.lastRefresh = Date.now();
    }
    // Dungeon state resets on load (player starts in overworld)

    // Restore new atmosphere systems
    if (data.achievements && typeof achievementSystem !== 'undefined') {
      achievementSystem.loadSaveData(data.achievements);
    }
    if (data.leaderboard && typeof leaderboard !== 'undefined') {
      leaderboard.loadSaveData(data.leaderboard);
    }
    if (typeof partySystem !== 'undefined') {
      if (data.party) partySystem.loadSaveData(data.party);
      else partySystem.init();
    }
    if (data.worldBoss && typeof worldBoss !== 'undefined') {
      worldBoss.spawnTimer = data.worldBoss.spawnTimer || 300;
    }
    if (typeof offlineExpeditionSystem !== 'undefined') {
      offlineExpeditionSystem.load(data.offlineExpedition || null);
      if (offlineExpeditionSystem.pendingSummary) offlineExpeditionSystem.panelOpen = true;
    }

    // Restore new content systems
    if(typeof craftingSystem!=='undefined'){craftingSystem.generateSprites();craftingSystem.initTownNPC();if(data.crafting)craftingSystem.load(data.crafting)}
    if(typeof worldMap!=='undefined'){worldMap.generateSprites();worldMap.extendWalkability();if(data.worldMapData){worldMap.load(data.worldMapData);worldMap.generateZone(worldMap.currentZone)}else{worldMap.generateZone(0)}}
    if(typeof pvpArena!=='undefined'){pvpArena.generateSprites();pvpArena.initTownNPC();if(data.pvp)pvpArena.load(data.pvp)}
    if(typeof classChangeSystem!=='undefined'){classChangeSystem.generateSprites();classChangeSystem.initTownNPC();if(data.classChange)classChangeSystem.load(data.classChange)}
    if(typeof afkSystem!=='undefined'){afkSystem.generateSprites()}
    if(typeof enchantSystem!=='undefined'){enchantSystem.generateSprites();enchantSystem.initTownNPC();if(data.enchant)enchantSystem.load(data.enchant)}
    if(typeof guildSystem!=='undefined'){guildSystem.generateSprites();guildSystem.initTownNPC();if(data.guild)guildSystem.load(data.guild)}
    if(typeof gachaSystem!=='undefined'){gachaSystem.generateSprites();gachaSystem.initTownNPC();if(data.gacha)gachaSystem.load(data.gacha)}

    // Init audio with fade
    sfx.init();
    sfx.startFadeIn();
    camera.update(game.player);

    if (typeof offlineExpeditionSystem !== 'undefined') {
      const resolved = offlineExpeditionSystem.resolveOfflineExpedition(Date.now(), true);
      if (resolved) shouldResave = true;
    }

    console.log('LOADED: Lv.' + p.level, p.className, 'HP:' + p.hp + '/' + p.maxHp, 'Gold:' + p.gold);
    addNotification('Welcome back, ' + p.name + '! Lv.' + p.level + ' ' + p.className, '#4fc3f7');
    addLog('Welcome back, ' + p.name + '!', '#FFD700');

    // AFK rewards check
    if(typeof afkSystem!=='undefined'&&data.timestamp&&!savedExpeditionConsumesAfk){afkSystem.checkAfk(data.timestamp)}
    if (shouldResave) saveGame();

    return true;
  } catch (e) {
    console.warn('LOAD FAILED:', e);
    return false;
  }
}

function hasSaveData() {
  return !!localStorage.getItem(SAVE_KEY);
}

function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

// Auto-save every 30 seconds
let autoSaveTimer = 0;
function updateAutoSave(dt) {
  autoSaveTimer += dt;
  if (autoSaveTimer >= 30) {
    autoSaveTimer = 0;
    console.log('Auto-save triggered');
    saveGame();
  }
}

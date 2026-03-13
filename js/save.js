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
      killCount: p.killCount
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
      autoSkill: botAI.settings.autoSkill
    }
  };

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
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
      autoBuyPotions: s.autoBuyPotions
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
    sfx.volume = game.settings.volume;
    sfx.muted  = game.settings.muted;
  } catch (e) {}
}

// ------------------------------------------------------------
//  Load a saved game — returns true if successful
// ------------------------------------------------------------
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data.version || !data.player) return false;

    // Initialize world
    initSprites();
    generateTownSprites();
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

    // Restore inventory (filter nulls)
    p.inventory = (data.inventory || []).filter(i => i != null);

    // Restore equipment directly — stats already restored above
    p.equipment.weapon    = data.equipment.weapon    || null;
    p.equipment.armor     = data.equipment.armor     || null;
    p.equipment.accessory = data.equipment.accessory || null;

    game.player = p;

    // Restore bot settings
    if (data.bot) {
      botAI.enabled                 = data.bot.enabled ?? true;
      botAI.settings.hpThreshold    = data.bot.hpThreshold ?? 30;
      botAI.settings.targetPriority = data.bot.targetPriority ?? 'nearest';
      botAI.settings.autoSkill      = data.bot.autoSkill ?? true;
    }

    // Restore counters
    game.killCount  = data.killCount  || 0;
    game.sessionExp = data.sessionExp || 0;
    game.time       = data.playTime   || 0;
    game.state      = 'playing';

    // Init audio with fade
    sfx.init();
    sfx.startFadeIn();
    camera.update(game.player);

    addNotification('Welcome back, ' + p.name + '! Lv.' + p.level + ' ' + p.className, '#4fc3f7');
    addLog('Welcome back, ' + p.name + '!', '#FFD700');

    return true;
  } catch (e) {
    console.warn('Load failed:', e);
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
    saveGame();
  }
}

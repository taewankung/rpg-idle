// ============================================================
// OFFLINE EXPEDITION — Deep offline planning system
// ============================================================

const OFFLINE_EXPEDITION_VERSION = 2;

const OFFLINE_EXPEDITION_STRATEGIES = [
  {
    id: 'safe',
    name: 'Safe',
    desc: 'Prioritize survival and steady returns.',
    successMod: 0.14,
    injuryMod: -0.14,
    expMult: 0.86,
    goldMult: 0.9,
    materialMult: 0.92,
    rareMod: -0.03,
    scoreBias: 8
  },
  {
    id: 'balanced',
    name: 'Balanced',
    desc: 'Default formation with no extreme tradeoff.',
    successMod: 0,
    injuryMod: 0,
    expMult: 1,
    goldMult: 1,
    materialMult: 1,
    rareMod: 0,
    scoreBias: 0
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    desc: 'Push deeper for combat gains at higher risk.',
    successMod: -0.06,
    injuryMod: 0.1,
    expMult: 1.22,
    goldMult: 1.08,
    materialMult: 0.94,
    rareMod: 0.03,
    scoreBias: -4
  },
  {
    id: 'loot_hunter',
    name: 'Loot Hunter',
    desc: 'Scout side paths and rare caches.',
    successMod: -0.03,
    injuryMod: 0.05,
    expMult: 0.9,
    goldMult: 0.98,
    materialMult: 1.16,
    rareMod: 0.08,
    scoreBias: -2
  },
  {
    id: 'material_focus',
    name: 'Material Focus',
    desc: 'Favor salvage routes and gathering windows.',
    successMod: 0.02,
    injuryMod: 0.02,
    expMult: 0.82,
    goldMult: 0.84,
    materialMult: 1.34,
    rareMod: -0.01,
    scoreBias: 2
  }
];

const OFFLINE_EXPEDITION_EVENTS = {
  ambush: {
    id: 'ambush',
    name: 'Ambush',
    log: 'A hostile pack hit the route and forced a rough skirmish.',
    successDelta: -0.08,
    injuryDelta: 0.13,
    gradeDelta: -11,
    goldMult: 0.92,
    expMult: 1.03
  },
  treasure_cache: {
    id: 'treasure_cache',
    name: 'Treasure Cache',
    log: 'A hidden stash was recovered from an abandoned waypoint.',
    successDelta: 0.02,
    injuryDelta: -0.02,
    gradeDelta: 10,
    goldMult: 1.22,
    expMult: 1.02,
    rareDelta: 0.08
  },
  merchant_encounter: {
    id: 'merchant_encounter',
    name: 'Merchant Encounter',
    log: 'A passing trader paid well for escort work and spare trinkets.',
    successDelta: 0.03,
    injuryDelta: -0.01,
    gradeDelta: 7,
    goldMult: 1.16,
    materialMult: 1.08
  },
  injury: {
    id: 'injury',
    name: 'Injury',
    log: 'The team returned battered after a bad exchange.',
    successDelta: -0.06,
    injuryDelta: 0.18,
    gradeDelta: -14,
    goldMult: 0.88,
    expMult: 0.94
  },
  hidden_shortcut: {
    id: 'hidden_shortcut',
    name: 'Hidden Shortcut',
    log: 'A hidden trail cut through patrol routes and saved valuable effort.',
    successDelta: 0.08,
    injuryDelta: -0.03,
    gradeDelta: 9,
    goldMult: 1.08,
    expMult: 1.08,
    materialMult: 1.06
  },
  rare_elite: {
    id: 'rare_elite',
    name: 'Rare Elite',
    log: 'An elite target was tracked down and brought down for premium spoils.',
    successDelta: -0.04,
    injuryDelta: 0.08,
    gradeDelta: 8,
    goldMult: 1.12,
    expMult: 1.16,
    rareDelta: 0.12
  },
  supply_loss: {
    id: 'supply_loss',
    name: 'Supply Loss',
    log: 'Critical supplies were lost in transit and part of the haul was abandoned.',
    successDelta: -0.05,
    injuryDelta: 0.04,
    gradeDelta: -10,
    goldMult: 0.84,
    materialMult: 0.72
  },
  blessed_shrine: {
    id: 'blessed_shrine',
    name: 'Blessed Shrine',
    log: 'A shrine blessing steadied the team and sharpened their timing.',
    successDelta: 0.09,
    injuryDelta: -0.04,
    gradeDelta: 12,
    goldMult: 1.06,
    expMult: 1.12,
    rareDelta: 0.05
  }
};

const OFFLINE_EXPEDITION_DEFINITIONS = [
  {
    id: 'short_safe_patrol',
    name: 'Short Safe Patrol',
    zone: 'Town Outskirts',
    zoneIndex: 0,
    minLevel: 1,
    recommendedLevel: 3,
    riskLevel: 1,
    rewardBias: 'gold',
    unlockRules: { level: 1 },
    durationOptions: [
      { label: '20m', seconds: 20 * 60, rewardMult: 0.88, riskMod: -0.04, successMod: 0.05, eventRolls: 1 },
      { label: '45m', seconds: 45 * 60, rewardMult: 1.08, riskMod: 0, successMod: 0.01, eventRolls: 1 },
      { label: '90m', seconds: 90 * 60, rewardMult: 1.28, riskMod: 0.05, successMod: -0.03, eventRolls: 2 }
    ],
    eventPool: ['treasure_cache', 'merchant_encounter', 'hidden_shortcut', 'supply_loss'],
    baseRewards: {
      goldFactor: 0.42,
      expFactor: 0.28,
      materialRolls: 1,
      itemChance: 0.03,
      materialTable: ['wood', 'leather']
    },
    summaryTags: ['guard rotation', 'stable route'],
    flavor: 'A disciplined patrol keeps the frontier calm and pockets full.'
  },
  {
    id: 'forest_beast_hunt',
    name: 'Forest Beast Hunt',
    zone: 'Forest Rim',
    zoneIndex: 0,
    minLevel: 4,
    recommendedLevel: 8,
    riskLevel: 2,
    rewardBias: 'exp',
    unlockRules: { level: 4 },
    durationOptions: [
      { label: '30m', seconds: 30 * 60, rewardMult: 0.92, riskMod: -0.02, successMod: 0.03, eventRolls: 1 },
      { label: '60m', seconds: 60 * 60, rewardMult: 1.12, riskMod: 0.04, successMod: -0.01, eventRolls: 2 },
      { label: '120m', seconds: 120 * 60, rewardMult: 1.34, riskMod: 0.09, successMod: -0.05, eventRolls: 2 }
    ],
    eventPool: ['ambush', 'hidden_shortcut', 'rare_elite', 'blessed_shrine'],
    baseRewards: {
      goldFactor: 0.34,
      expFactor: 0.46,
      materialRolls: 1.2,
      itemChance: 0.05,
      materialTable: ['wood', 'leather', 'iron_ore']
    },
    summaryTags: ['tracking', 'pack control'],
    flavor: 'This hunt rewards clean combat rotations and fast recovery.'
  },
  {
    id: 'desert_supply_run',
    name: 'Desert Supply Run',
    zone: 'Sunscorch Desert',
    zoneIndex: 1,
    minLevel: 10,
    recommendedLevel: 14,
    riskLevel: 3,
    rewardBias: 'material',
    unlockRules: { level: 10 },
    durationOptions: [
      { label: '45m', seconds: 45 * 60, rewardMult: 0.94, riskMod: 0.01, successMod: 0.02, eventRolls: 2 },
      { label: '90m', seconds: 90 * 60, rewardMult: 1.18, riskMod: 0.07, successMod: -0.02, eventRolls: 2 },
      { label: '180m', seconds: 180 * 60, rewardMult: 1.42, riskMod: 0.13, successMod: -0.06, eventRolls: 3 }
    ],
    eventPool: ['merchant_encounter', 'supply_loss', 'ambush', 'treasure_cache'],
    baseRewards: {
      goldFactor: 0.46,
      expFactor: 0.31,
      materialRolls: 1.8,
      itemChance: 0.06,
      materialTable: ['iron_ore', 'fire_gem', 'lightning_gem', 'leather']
    },
    summaryTags: ['escort', 'heat management'],
    flavor: 'Long routes and thin margins make planning matter more than brute force.'
  },
  {
    id: 'frozen_relic_search',
    name: 'Frozen Relic Search',
    zone: 'Frozen Peaks',
    zoneIndex: 2,
    minLevel: 18,
    recommendedLevel: 22,
    riskLevel: 4,
    rewardBias: 'rare',
    unlockRules: { level: 18 },
    durationOptions: [
      { label: '60m', seconds: 60 * 60, rewardMult: 0.96, riskMod: 0.03, successMod: 0.01, eventRolls: 2 },
      { label: '120m', seconds: 120 * 60, rewardMult: 1.2, riskMod: 0.09, successMod: -0.03, eventRolls: 3 },
      { label: '240m', seconds: 240 * 60, rewardMult: 1.48, riskMod: 0.16, successMod: -0.07, eventRolls: 3 }
    ],
    eventPool: ['blessed_shrine', 'hidden_shortcut', 'rare_elite', 'injury', 'treasure_cache'],
    baseRewards: {
      goldFactor: 0.32,
      expFactor: 0.4,
      materialRolls: 2.2,
      itemChance: 0.1,
      materialTable: ['ice_gem', 'shield_gem', 'soul_gem', 'iron_bar']
    },
    summaryTags: ['relic dive', 'cold resistance'],
    flavor: 'Cold attrition punishes thin defenses, but relic finds can spike progression.'
  },
  {
    id: 'elite_boss_trail',
    name: 'Elite Boss Trail',
    zone: 'Ruined Warpath',
    zoneIndex: 2,
    minLevel: 24,
    recommendedLevel: 28,
    riskLevel: 4,
    rewardBias: 'balanced',
    unlockRules: { level: 24 },
    durationOptions: [
      { label: '75m', seconds: 75 * 60, rewardMult: 1.02, riskMod: 0.06, successMod: 0.01, eventRolls: 2 },
      { label: '150m', seconds: 150 * 60, rewardMult: 1.28, riskMod: 0.12, successMod: -0.03, eventRolls: 3 },
      { label: '300m', seconds: 300 * 60, rewardMult: 1.56, riskMod: 0.18, successMod: -0.08, eventRolls: 3 }
    ],
    eventPool: ['ambush', 'rare_elite', 'blessed_shrine', 'injury'],
    baseRewards: {
      goldFactor: 0.4,
      expFactor: 0.46,
      materialRolls: 1.9,
      itemChance: 0.15,
      materialTable: ['steel_bar', 'fire_gem', 'ice_gem', 'soul_gem']
    },
    summaryTags: ['boss tracking', 'burst windows'],
    flavor: 'A trail of elite signatures demands damage, discipline, and a build that can finish fights.'
  },
  {
    id: 'forbidden_rift_survey',
    name: 'Forbidden Rift Survey',
    zone: 'Forbidden Rift',
    zoneIndex: 2,
    minLevel: 30,
    recommendedLevel: 34,
    riskLevel: 5,
    rewardBias: 'rare',
    unlockRules: { level: 30 },
    durationOptions: [
      { label: '90m', seconds: 90 * 60, rewardMult: 1.08, riskMod: 0.08, successMod: 0, eventRolls: 2 },
      { label: '180m', seconds: 180 * 60, rewardMult: 1.36, riskMod: 0.15, successMod: -0.04, eventRolls: 3 },
      { label: '360m', seconds: 360 * 60, rewardMult: 1.66, riskMod: 0.22, successMod: -0.1, eventRolls: 3 }
    ],
    eventPool: ['rare_elite', 'ambush', 'injury', 'blessed_shrine', 'treasure_cache', 'supply_loss'],
    baseRewards: {
      goldFactor: 0.38,
      expFactor: 0.52,
      materialRolls: 2.6,
      itemChance: 0.2,
      materialTable: ['soul_gem', 'shield_gem', 'fire_gem', 'ice_gem', 'lightning_gem']
    },
    summaryTags: ['rift study', 'late-game gamble'],
    flavor: 'This survey is a controlled gamble for optimized late-game builds.'
  }
];

function clampExpeditionValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const offlineExpeditionSystem = {
  panelOpen: false,
  selectedExpeditionId: OFFLINE_EXPEDITION_DEFINITIONS[0].id,
  selectedStrategyId: OFFLINE_EXPEDITION_STRATEGIES[1].id,
  selectedDurationSec: OFFLINE_EXPEDITION_DEFINITIONS[0].durationOptions[0].seconds,
  activeRun: null,
  pendingSummary: null,
  lastReport: null,
  unlockedExpeditionIds: [],
  definitions: OFFLINE_EXPEDITION_DEFINITIONS,
  strategies: OFFLINE_EXPEDITION_STRATEGIES,
  _clickMap: {},

  reset() {
    this.panelOpen = false;
    this.selectedExpeditionId = this.definitions[0].id;
    this.selectedStrategyId = this.strategies[1].id;
    this.selectedDurationSec = this.definitions[0].durationOptions[0].seconds;
    this.activeRun = null;
    this.pendingSummary = null;
    this.lastReport = null;
    this.unlockedExpeditionIds = [];
    this._clickMap = {};
  },

  init() {
    this.reset();
    this.refreshUnlockedExpeditions();
  },

  getPlayer() {
    return typeof game !== 'undefined' ? game.player : null;
  },

  getDefinition(id) {
    for (let i = 0; i < this.definitions.length; i++) {
      if (this.definitions[i].id === id) return this.definitions[i];
    }
    return null;
  },

  getStrategy(id) {
    for (let i = 0; i < this.strategies.length; i++) {
      if (this.strategies[i].id === id) return this.strategies[i];
    }
    return null;
  },

  getSelectedDefinition() {
    return this.getDefinition(this.selectedExpeditionId) || this.definitions[0];
  },

  getSelectedStrategy() {
    return this.getStrategy(this.selectedStrategyId) || this.strategies[1];
  },

  getDurationOption(definition, seconds) {
    const def = definition || this.getSelectedDefinition();
    if (!def || !def.durationOptions || !def.durationOptions.length) return null;
    for (let i = 0; i < def.durationOptions.length; i++) {
      if (def.durationOptions[i].seconds === seconds) return def.durationOptions[i];
    }
    return def.durationOptions[0];
  },

  ensureSelectedDuration(definition) {
    const def = definition || this.getSelectedDefinition();
    const option = this.getDurationOption(def, this.selectedDurationSec);
    this.selectedDurationSec = option ? option.seconds : (def.durationOptions[0] ? def.durationOptions[0].seconds : 0);
  },

  refreshUnlockedExpeditions() {
    const unlocked = [];
    for (let i = 0; i < this.definitions.length; i++) {
      const def = this.definitions[i];
      if (this.isExpeditionUnlocked(def)) unlocked.push(def.id);
    }
    this.unlockedExpeditionIds = unlocked;
    return unlocked;
  },

  isExpeditionUnlocked(definition) {
    const def = definition || this.getSelectedDefinition();
    const p = this.getPlayer();
    if (!def || !p) return false;
    const rules = def.unlockRules || {};
    if (rules.level && p.level < rules.level) return false;
    if (rules.jobLevel && (p.jobLevel || 1) < rules.jobLevel) return false;
    if (rules.guildLevel && typeof guildSystem !== 'undefined' && guildSystem.guild && guildSystem.guild.level < rules.guildLevel) return false;
    return true;
  },

  getAvailableExpeditions() {
    this.refreshUnlockedExpeditions();
    const p = this.getPlayer();
    const list = [];
    for (let i = 0; i < this.definitions.length; i++) {
      const def = this.definitions[i];
      list.push({
        id: def.id,
        name: def.name,
        zone: def.zone,
        minLevel: def.minLevel,
        recommendedLevel: def.recommendedLevel,
        riskLevel: def.riskLevel,
        rewardBias: def.rewardBias,
        durationOptions: def.durationOptions,
        unlocked: !!p && this.isExpeditionUnlocked(def),
        selected: this.selectedExpeditionId === def.id,
        active: !!this.activeRun && this.activeRun.id === def.id
      });
    }
    return list;
  },

  getExpeditionStrategies() {
    const list = [];
    for (let i = 0; i < this.strategies.length; i++) {
      const strategy = this.strategies[i];
      list.push({
        id: strategy.id,
        name: strategy.name,
        desc: strategy.desc,
        selected: strategy.id === this.selectedStrategyId
      });
    }
    return list;
  },

  getSavePayloadFromReport(report) {
    if (!report) return null;
    return {
      expeditionId: report.expeditionId,
      name: report.name,
      zone: report.zone,
      zoneIndex: report.zoneIndex || 0,
      strategyId: report.strategyId,
      strategyName: report.strategyName,
      durationSec: report.durationSec,
      durationLabel: report.durationLabel,
      riskLevel: report.riskLevel,
      outcomeGrade: report.outcomeGrade,
      gradeIndex: report.gradeIndex,
      successChance: report.successChance,
      injuryChance: report.injuryChance,
      exp: report.exp,
      gold: report.gold,
      materials: Array.isArray(report.materials) ? report.materials.map(item => item ? { ...item } : null).filter(Boolean) : [],
      items: Array.isArray(report.items) ? report.items.map(item => item ? { ...item } : null).filter(Boolean) : [],
      eventLog: Array.isArray(report.eventLog) ? report.eventLog.slice(0, 6) : [],
      eventNames: Array.isArray(report.eventNames) ? report.eventNames.slice(0, 6) : [],
      events: Array.isArray(report.events) ? report.events.map(event => event ? { ...event } : null).filter(Boolean) : [],
      flavorSummary: report.flavorSummary || '',
      penalty: report.penalty ? { ...report.penalty } : null,
      buildScores: report.buildScores ? { ...report.buildScores } : null,
      rewardPreview: report.rewardPreview ? { ...report.rewardPreview } : null,
      resolvedAt: report.resolvedAt || Date.now(),
      startedAt: report.startedAt || 0,
      endedAt: report.endedAt || 0
    };
  },

  save() {
    return {
      version: OFFLINE_EXPEDITION_VERSION,
      selectedExpeditionId: this.selectedExpeditionId,
      selectedStrategyId: this.selectedStrategyId,
      selectedDurationSec: this.selectedDurationSec,
      unlockedExpeditionIds: this.refreshUnlockedExpeditions().slice(),
      activeRun: this.activeRun ? {
        id: this.activeRun.id,
        strategyId: this.activeRun.strategyId,
        durationSec: this.activeRun.durationSec,
        startedAt: this.activeRun.startedAt,
        endsAt: this.activeRun.endsAt,
        expectedEndAt: this.activeRun.endsAt
      } : null,
      pendingSummary: this.getSavePayloadFromReport(this.pendingSummary),
      lastReport: this.getSavePayloadFromReport(this.lastReport)
    };
  },

  migrateLegacySummary(raw) {
    if (!raw || !raw.expeditionId) return null;
    const def = this.getDefinition(raw.expeditionId) || this.definitions[0];
    const durationOption = this.getDurationOption(def, raw.durationSec || raw.elapsedSec);
    const strategy = this.getStrategy(raw.strategyId) || this.getSelectedStrategy();
    return {
      expeditionId: raw.expeditionId,
      name: raw.name || def.name,
      zone: raw.zone || def.zone,
      zoneIndex: raw.zoneIndex || def.zoneIndex || 0,
      strategyId: strategy.id,
      strategyName: raw.strategyName || strategy.name,
      durationSec: raw.durationSec || (durationOption ? durationOption.seconds : def.durationOptions[0].seconds),
      durationLabel: raw.durationLabel || (durationOption ? durationOption.label : this.formatDuration(raw.elapsedSec || 0)),
      riskLevel: raw.riskLevel || def.riskLevel,
      outcomeGrade: raw.outcomeGrade || (raw.success ? 'Success' : 'Failed'),
      gradeIndex: typeof raw.gradeIndex === 'number' ? raw.gradeIndex : (raw.success ? 1 : 3),
      successChance: raw.success ? 0.7 : 0.35,
      injuryChance: raw.penalty && raw.penalty.type === 'injury' ? 0.3 : 0.1,
      exp: Number(raw.exp) || 0,
      gold: Number(raw.gold) || 0,
      materials: Array.isArray(raw.materials) ? raw.materials.map(item => item ? { ...item } : null).filter(Boolean) : [],
      items: Array.isArray(raw.items) ? raw.items.map(item => item ? { ...item } : null).filter(Boolean) : [],
      eventLog: Array.isArray(raw.eventLog) ? raw.eventLog.slice() : [],
      eventNames: Array.isArray(raw.eventNames) ? raw.eventNames.slice() : [],
      events: Array.isArray(raw.events) ? raw.events.map(event => event ? { ...event } : null).filter(Boolean) : [],
      flavorSummary: raw.flavorSummary || raw.flavorText || def.flavor,
      penalty: raw.penalty ? { ...raw.penalty } : null,
      buildScores: raw.buildScores ? { ...raw.buildScores } : null,
      rewardPreview: raw.rewardPreview ? { ...raw.rewardPreview } : null,
      resolvedAt: Number(raw.resolvedAt) || Date.now(),
      startedAt: Number(raw.startedAt) || 0,
      endedAt: Number(raw.endedAt) || Number(raw.resolvedAt) || Date.now()
    };
  },

  load(data) {
    this.reset();
    if (!data || typeof data !== 'object') {
      this.refreshUnlockedExpeditions();
      return;
    }

    if (typeof data.selectedExpeditionId === 'string' && this.getDefinition(data.selectedExpeditionId)) {
      this.selectedExpeditionId = data.selectedExpeditionId;
    }
    if (typeof data.selectedStrategyId === 'string' && this.getStrategy(data.selectedStrategyId)) {
      this.selectedStrategyId = data.selectedStrategyId;
    }
    if (typeof data.selectedDurationSec === 'number') {
      this.selectedDurationSec = data.selectedDurationSec;
    }

    if (data.activeRun && this.getDefinition(data.activeRun.id)) {
      const activeDef = this.getDefinition(data.activeRun.id);
      const durationSec = Number(data.activeRun.durationSec) || activeDef.durationOptions[0].seconds;
      const strategyId = this.getStrategy(data.activeRun.strategyId) ? data.activeRun.strategyId : this.selectedStrategyId;
      const endsAt = Number(data.activeRun.endsAt || data.activeRun.expectedEndAt) || Date.now();
      this.activeRun = {
        id: data.activeRun.id,
        strategyId: strategyId,
        durationSec: durationSec,
        startedAt: Number(data.activeRun.startedAt) || (endsAt - durationSec * 1000),
        endsAt: endsAt
      };
    }

    this.pendingSummary = this.migrateLegacySummary(data.pendingSummary || null);
    this.lastReport = this.migrateLegacySummary(data.lastReport || null);

    if (Array.isArray(data.unlockedExpeditionIds)) {
      this.unlockedExpeditionIds = data.unlockedExpeditionIds.filter(id => !!this.getDefinition(id));
    }

    this.refreshUnlockedExpeditions();
    this.ensureSelectedDuration(this.getSelectedDefinition());

    if (this.pendingSummary) {
      this.panelOpen = true;
      this.selectedExpeditionId = this.pendingSummary.expeditionId || this.selectedExpeditionId;
    }
  },

  canStartExpedition(id, options) {
    const p = this.getPlayer();
    const def = this.getDefinition(id);
    const opts = options || {};
    const strategy = this.getStrategy(opts.strategyId || this.selectedStrategyId);
    const duration = this.getDurationOption(def, opts.durationSec || this.selectedDurationSec);
    if (!p) return { ok: false, reason: 'No active player.', expedition: def, strategy: strategy, duration: duration };
    if (!def) return { ok: false, reason: 'Unknown expedition.', expedition: null, strategy: strategy, duration: duration };
    if (!this.isExpeditionUnlocked(def)) {
      return { ok: false, reason: 'Requires Lv.' + def.minLevel + '.', expedition: def, strategy: strategy, duration: duration };
    }
    if (!strategy) {
      return { ok: false, reason: 'Choose a valid strategy.', expedition: def, strategy: null, duration: duration };
    }
    if (!duration) {
      return { ok: false, reason: 'Choose a valid duration.', expedition: def, strategy: strategy, duration: null };
    }
    if (this.pendingSummary) {
      return { ok: false, reason: 'Claim the previous debrief first.', expedition: def, strategy: strategy, duration: duration };
    }
    if (this.activeRun) {
      return { ok: false, reason: 'Another expedition is already active.', expedition: def, strategy: strategy, duration: duration };
    }
    return { ok: true, reason: '', expedition: def, strategy: strategy, duration: duration };
  },

  startExpedition(id, options) {
    const check = this.canStartExpedition(id, options);
    if (!check.ok) {
      if (typeof addNotification === 'function') addNotification(check.reason, '#ff7777');
      return false;
    }

    const now = Date.now();
    this.selectedExpeditionId = check.expedition.id;
    this.selectedStrategyId = check.strategy.id;
    this.selectedDurationSec = check.duration.seconds;
    this.activeRun = {
      id: check.expedition.id,
      strategyId: check.strategy.id,
      durationSec: check.duration.seconds,
      startedAt: now,
      endsAt: now + check.duration.seconds * 1000
    };
    this.pendingSummary = null;

    if (typeof addNotification === 'function') {
      addNotification('Expedition started: ' + check.expedition.name + ' [' + check.strategy.name + ']', '#5dade2');
    }
    if (typeof addLog === 'function') {
      addLog('Expedition started: ' + check.expedition.name + ' / ' + check.duration.label + ' / ' + check.strategy.name, '#5dade2');
    }
    if (typeof saveGame === 'function') saveGame();
    return true;
  },

  cancelExpedition() {
    if (!this.activeRun) {
      if (typeof addNotification === 'function') addNotification('No expedition is active.', '#ff7777');
      return false;
    }
    const def = this.getDefinition(this.activeRun.id);
    this.activeRun = null;
    if (typeof addNotification === 'function') addNotification('Expedition canceled.', '#f0ad4e');
    if (typeof addLog === 'function') addLog('Expedition canceled: ' + (def ? def.name : 'Unknown'), '#f0ad4e');
    if (typeof saveGame === 'function') saveGame();
    return true;
  },

  update() {
    this.refreshUnlockedExpeditions();
    if (!this.activeRun || this.pendingSummary) return;
    this.resolveOfflineExpedition(Date.now());
  },

  getGuildMultiplier(type) {
    if (typeof guildSystem === 'undefined' || !guildSystem || typeof guildSystem.getBonus !== 'function') return 1;
    return guildSystem.getBonus(type);
  },

  getOptionalBonuses(player, definition, strategy) {
    const bonuses = {
      petCombat: 0,
      petUtility: 0,
      talentDepth: 0,
      guildLevel: 0,
      achievementPoints: 0,
      enchantPower: 0,
      dropRateBonus: 0,
      classBonus: 0,
      zoneKnowledge: 0,
      botDiscipline: 0
    };

    if (typeof petSystem !== 'undefined' && petSystem.active) {
      const pet = petSystem.active;
      bonuses.petCombat += (pet.atk || 0) * 0.9 + (pet.level || 0) * 3;
      bonuses.petUtility += (pet.spd || 0) * 10 + (pet.def || 0) * 0.8;
      if (pet.ability === 'autoloot') bonuses.dropRateBonus += 0.03;
      if (pet.ability === 'assist' || pet.ability === 'fireAoe') bonuses.classBonus += 6;
    }

    if (typeof talentSystem !== 'undefined') {
      bonuses.talentDepth += Array.isArray(talentSystem.unlocked) ? talentSystem.unlocked.length * 5 : 0;
      const tree = typeof talentSystem.getTree === 'function' ? talentSystem.getTree() : null;
      if (tree && Array.isArray(talentSystem.unlocked)) {
        for (let i = 0; i < talentSystem.unlocked.length; i++) {
          const idx = talentSystem.unlocked[i];
          const branchIdx = idx < 5 ? 0 : 1;
          const localIdx = idx % 5;
          const talent = tree.branches && tree.branches[branchIdx] && tree.branches[branchIdx].talents ? tree.branches[branchIdx].talents[localIdx] : null;
          if (!talent) continue;
          if (talent.stat === 'petBonus') bonuses.petCombat += 10;
          if (talent.stat === 'attackRange') bonuses.petUtility += 8;
          if (talent.stat === 'crit') bonuses.dropRateBonus += 0.01;
        }
      }
    }

    if (typeof achievementSystem !== 'undefined') {
      bonuses.achievementPoints += achievementSystem.totalPoints || 0;
      if (achievementSystem.activeTitle) bonuses.classBonus += 4;
    }

    if (typeof guildSystem !== 'undefined' && guildSystem.guild) {
      bonuses.guildLevel += guildSystem.guild.level || 0;
      bonuses.dropRateBonus += Math.max(0, this.getGuildMultiplier('dropRate') - 1);
    }

    bonuses.enchantPower += this.getEnchantPower(player);

    if (typeof worldMap !== 'undefined' && typeof worldMap.currentZone === 'number') {
      bonuses.zoneKnowledge += worldMap.currentZone >= (definition.zoneIndex || 0) ? 10 : 0;
    }

    if (typeof botAI !== 'undefined' && botAI && botAI.settings) {
      if (strategy && strategy.id === 'safe' && (botAI.settings.hpThreshold || 0) >= 40) bonuses.botDiscipline += 8;
      if (strategy && strategy.id === 'aggressive' && botAI.settings.targetPriority === 'highestLevel') bonuses.botDiscipline += 6;
      if (strategy && strategy.id === 'loot_hunter' && botAI.settings.autoSkill) bonuses.botDiscipline += 4;
    }

    return bonuses;
  },

  getEnchantPower(player) {
    const p = player || this.getPlayer();
    if (!p || !p.equipment) return 0;
    let power = 0;
    const slots = ['weapon', 'armor', 'accessory'];
    for (let i = 0; i < slots.length; i++) {
      const item = p.equipment[slots[i]];
      if (!item) continue;
      power += (item.enhanceLevel || 0) * (slots[i] === 'weapon' ? 5 : 3);
    }
    return power;
  },

  calculateExpeditionScores(definition, options) {
    const def = definition && definition.id ? definition : this.getDefinition(definition) || this.getSelectedDefinition();
    const opts = options || {};
    const p = opts.player || this.getPlayer();
    const strategy = this.getStrategy(opts.strategyId || this.selectedStrategyId) || this.getSelectedStrategy();
    if (!p || !def) {
      return {
        combatScore: 0,
        survivalScore: 0,
        utilityScore: 0,
        luckScore: 0,
        overallScore: 0,
        challengeScore: 1,
        successBaseline: 0.1,
        optionalBonuses: {}
      };
    }

    const optional = this.getOptionalBonuses(p, def, strategy);
    const jobPassives = p._jobPassives || {};
    const guildExpMult = this.getGuildMultiplier('exp');
    const guildGoldMult = this.getGuildMultiplier('gold');
    const guildCritMult = this.getGuildMultiplier('crit');

    const combatScore =
      p.level * 9 +
      (p.atk || 0) * 3.6 +
      (p.matk || 0) * 1.8 +
      (p.spd || 0) * 16 +
      (p.crit || 0) * 220 +
      (p.skillLevels ? p.skillLevels.reduce((sum, level) => sum + level, 0) * 4 : 0) +
      optional.petCombat +
      optional.enchantPower +
      optional.classBonus +
      (jobPassives.atkMult ? jobPassives.atkMult * 90 : 0) +
      (guildExpMult - 1) * 40;

    const survivalScore =
      (p.maxHp || 0) * 0.22 +
      (p.def || 0) * 4 +
      (p.evasion || 0) * 260 +
      ((p.hp || p.maxHp || 1) / Math.max(1, p.maxHp || 1)) * 24 +
      optional.petUtility +
      optional.guildLevel * 5 +
      (jobPassives.hpMult ? jobPassives.hpMult * 100 : 0) +
      (jobPassives.defMult ? jobPassives.defMult * 95 : 0) +
      (jobPassives.hpRegen ? jobPassives.hpRegen * 650 : 0);

    const utilityScore =
      p.level * 4 +
      (p.maxMp || 0) * 0.14 +
      (p.spd || 0) * 14 +
      (p.attackRange || 0) / 4 +
      optional.talentDepth +
      optional.zoneKnowledge +
      optional.botDiscipline +
      (p.jobLevel || 1) * 2;

    const luckScore =
      (p.crit || 0) * 180 * guildCritMult +
      (p.dropRate || 0) * 280 +
      ((p.critDmg || 1.5) - 1.5) * 220 +
      optional.achievementPoints * 0.9 +
      optional.dropRateBonus * 400 +
      (guildGoldMult - 1) * 65;

    const overallScore = combatScore * 0.4 + survivalScore * 0.3 + utilityScore * 0.15 + luckScore * 0.15;
    const challengeScore =
      def.recommendedLevel * 26 +
      def.riskLevel * 90 +
      this.getDurationOption(def, opts.durationSec || this.selectedDurationSec).seconds / 90;
    const scoreGap = (overallScore - challengeScore) / Math.max(1, challengeScore);
    const successBaseline = clampExpeditionValue(0.54 + scoreGap * 0.78, 0.08, 0.93);

    return {
      combatScore: Math.round(combatScore),
      survivalScore: Math.round(survivalScore),
      utilityScore: Math.round(utilityScore),
      luckScore: Math.round(luckScore),
      overallScore: Math.round(overallScore),
      challengeScore: Math.round(challengeScore),
      successBaseline: successBaseline,
      optionalBonuses: optional
    };
  },

  getBaseOfflineReward(durationSec) {
    const player = this.getPlayer();
    const level = player ? player.level : 1;
    let gold = 0;
    let exp = 0;
    const totalSec = clampExpeditionValue(Math.floor(durationSec || 0), 0, 24 * 3600);
    const brackets = [
      { start: 0, end: 3600, mult: 1 },
      { start: 3600, end: 28800, mult: 0.8 },
      { start: 28800, end: 86400, mult: 0.5 }
    ];
    for (let i = 0; i < brackets.length; i++) {
      const bracket = brackets[i];
      if (totalSec <= bracket.start) break;
      const seconds = Math.min(totalSec, bracket.end) - bracket.start;
      if (seconds <= 0) continue;
      gold += seconds * level * 0.5 * bracket.mult;
      exp += seconds * level * 0.3 * bracket.mult;
    }
    return { gold: Math.floor(gold), exp: Math.floor(exp) };
  },

  rollExpeditionEvents(definition, strategy, durationOption, scorePayload) {
    const def = definition || this.getSelectedDefinition();
    const strategyDef = strategy || this.getSelectedStrategy();
    const duration = durationOption || this.getDurationOption(def, this.selectedDurationSec);
    const scoreInfo = scorePayload || this.calculateExpeditionScores(def, { strategyId: strategyDef.id, durationSec: duration.seconds });
    const pool = Array.isArray(def.eventPool) ? def.eventPool.slice() : [];
    const modifiers = {
      successDelta: 0,
      injuryDelta: 0,
      gradeDelta: 0,
      goldMult: 1,
      expMult: 1,
      materialMult: 1,
      rareDelta: 0
    };
    const log = [];
    const events = [];
    const eventCount = Math.min(3, Math.max(1, (duration.eventRolls || 1) + (Math.random() < 0.35 ? 1 : 0) - (def.riskLevel <= 1 ? 1 : 0)));
    let luckBuffer = (scoreInfo.luckScore || 0) / 400;

    for (let i = 0; i < eventCount && pool.length > 0; i++) {
      const pickIndex = ri(0, pool.length - 1);
      const eventId = pool.splice(pickIndex, 1)[0];
      const event = OFFLINE_EXPEDITION_EVENTS[eventId];
      if (!event) continue;
      const goodEventBias = clampExpeditionValue(0.35 + luckBuffer * 0.02 + (strategyDef.id === 'safe' ? 0.08 : 0), 0.1, 0.8);
      const isHarshEvent = event.gradeDelta < 0;
      if (isHarshEvent && Math.random() < goodEventBias * 0.3) continue;
      modifiers.successDelta += event.successDelta || 0;
      modifiers.injuryDelta += event.injuryDelta || 0;
      modifiers.gradeDelta += event.gradeDelta || 0;
      modifiers.goldMult *= event.goldMult || 1;
      modifiers.expMult *= event.expMult || 1;
      modifiers.materialMult *= event.materialMult || 1;
      modifiers.rareDelta += event.rareDelta || 0;
      log.push(event.log);
      events.push({
        id: event.id,
        name: event.name,
        log: event.log
      });
      luckBuffer *= 0.7;
    }

    if (!events.length) {
      const fallback = OFFLINE_EXPEDITION_EVENTS.hidden_shortcut;
      modifiers.successDelta += fallback.successDelta;
      modifiers.injuryDelta += fallback.injuryDelta;
      modifiers.gradeDelta += fallback.gradeDelta;
      modifiers.goldMult *= fallback.goldMult || 1;
      modifiers.expMult *= fallback.expMult || 1;
      modifiers.materialMult *= fallback.materialMult || 1;
      log.push(fallback.log);
      events.push({ id: fallback.id, name: fallback.name, log: fallback.log });
    }

    return {
      events: events,
      eventLog: log,
      modifiers: modifiers
    };
  },

  determineOutcomeGrade(scoreValue) {
    if (scoreValue >= 34) return { name: 'Great Success', index: 0, rewardMult: 1.3, itemBonus: 0.08, materialMult: 1.22 };
    if (scoreValue >= 8) return { name: 'Success', index: 1, rewardMult: 1, itemBonus: 0.02, materialMult: 1 };
    if (scoreValue >= -18) return { name: 'Partial Success', index: 2, rewardMult: 0.68, itemBonus: -0.02, materialMult: 0.74 };
    if (scoreValue >= -42) return { name: 'Failed', index: 3, rewardMult: 0.38, itemBonus: -0.08, materialMult: 0.45 };
    return { name: 'Disaster', index: 4, rewardMult: 0.18, itemBonus: -0.14, materialMult: 0.25 };
  },

  getItemChance(definition, strategy, durationOption, eventPack, scorePayload, grade) {
    const def = definition || this.getSelectedDefinition();
    const strategyDef = strategy || this.getSelectedStrategy();
    const duration = durationOption || this.getDurationOption(def, this.selectedDurationSec);
    const events = eventPack || { modifiers: { rareDelta: 0 } };
    const scoreInfo = scorePayload || this.calculateExpeditionScores(def, { strategyId: strategyDef.id, durationSec: duration.seconds });
    const gradeInfo = grade || this.determineOutcomeGrade(0);
    const baseChance = def.baseRewards.itemChance || 0.02;
    return clampExpeditionValue(
      baseChance +
      (scoreInfo.luckScore || 0) / 3500 +
      (strategyDef.rareMod || 0) +
      (duration.riskMod || 0) * 0.35 +
      (events.modifiers.rareDelta || 0) +
      (gradeInfo.itemBonus || 0),
      0.01,
      0.6
    );
  },

  rollRewardItems(definition, strategy, durationOption, eventPack, scorePayload, grade) {
    const def = definition || this.getSelectedDefinition();
    const duration = durationOption || this.getDurationOption(def, this.selectedDurationSec);
    const itemChance = this.getItemChance(def, strategy, duration, eventPack, scorePayload, grade);
    const items = [];
    if (typeof genItem !== 'function') return items;

    const rolls = grade.index <= 1 ? 1 + (Math.random() < 0.25 ? 1 : 0) : 1;
    for (let i = 0; i < rolls; i++) {
      if (Math.random() > itemChance) continue;
      const item = genItem(Math.max(def.recommendedLevel, (this.getPlayer() ? this.getPlayer().level : def.minLevel)) + def.riskLevel + i);
      if (item) items.push(item);
    }
    return items;
  },

  rollMaterialRewards(definition, strategy, durationOption, eventPack, scorePayload, grade) {
    const def = definition || this.getSelectedDefinition();
    const strategyDef = strategy || this.getSelectedStrategy();
    const duration = durationOption || this.getDurationOption(def, this.selectedDurationSec);
    const events = eventPack || { modifiers: { materialMult: 1 } };
    const scoreInfo = scorePayload || this.calculateExpeditionScores(def, { strategyId: strategyDef.id, durationSec: duration.seconds });
    if (typeof craftingSystem === 'undefined' || !craftingSystem.materials) return [];

    const materialKeys = Array.isArray(def.baseRewards.materialTable) ? def.baseRewards.materialTable.slice() : [];
    if (!materialKeys.length) return [];

    const materialRolls = Math.max(
      0,
      Math.round(
        (def.baseRewards.materialRolls || 0) *
        (duration.rewardMult || 1) *
        (strategyDef.materialMult || 1) *
        (events.modifiers.materialMult || 1) *
        (grade.materialMult || 1) +
        (scoreInfo.utilityScore || 0) / 220
      )
    );

    const materials = [];
    for (let i = 0; i < materialRolls; i++) {
      const matKey = materialKeys[ri(0, materialKeys.length - 1)];
      const matDef = craftingSystem.materials[matKey];
      if (!matDef) continue;
      materials.push({
        name: matDef.name,
        type: 'material',
        rarity: matDef.rarity,
        stats: {},
        level: 1,
        value: matDef.value,
        matKey: matKey
      });
    }
    return materials;
  },

  buildFlavorSummary(definition, strategy, grade, eventPack, scorePayload) {
    const def = definition || this.getSelectedDefinition();
    const strategyDef = strategy || this.getSelectedStrategy();
    const scoreInfo = scorePayload || this.calculateExpeditionScores(def, { strategyId: strategyDef.id, durationSec: this.selectedDurationSec });
    const bestScore = [
      ['combat', scoreInfo.combatScore],
      ['survival', scoreInfo.survivalScore],
      ['utility', scoreInfo.utilityScore],
      ['luck', scoreInfo.luckScore]
    ].sort((a, b) => b[1] - a[1])[0][0];
    const roleText = {
      combat: 'damage pacing',
      survival: 'survivability',
      utility: 'route discipline',
      luck: 'drop efficiency'
    }[bestScore] || 'overall balance';
    const eventName = eventPack && eventPack.events && eventPack.events.length ? eventPack.events[0].name : 'Clean Route';
    return def.name + ' leaned on your ' + roleText + ' under the ' + strategyDef.name + ' plan. ' + eventName + ' defined the report, ending in ' + grade.name + '.';
  },

  generateExpeditionReport(expeditionId, options, now) {
    const def = this.getDefinition(expeditionId) || this.getSelectedDefinition();
    const opts = options || {};
    const strategy = this.getStrategy(opts.strategyId || this.selectedStrategyId) || this.getSelectedStrategy();
    const duration = this.getDurationOption(def, opts.durationSec || this.selectedDurationSec);
    const ts = typeof now === 'number' ? now : Date.now();
    const startedAt = Number(opts.startedAt) || (ts - duration.seconds * 1000);
    const scoreInfo = this.calculateExpeditionScores(def, {
      strategyId: strategy.id,
      durationSec: duration.seconds,
      player: opts.player || this.getPlayer()
    });
    const baseOffline = this.getBaseOfflineReward(duration.seconds);
    const eventPack = this.rollExpeditionEvents(def, strategy, duration, scoreInfo);
    const buildPressure = ((scoreInfo.overallScore - scoreInfo.challengeScore) / Math.max(1, scoreInfo.challengeScore)) * 0.12;
    const successChance = clampExpeditionValue(
      scoreInfo.successBaseline +
      buildPressure +
      strategy.successMod +
      duration.successMod +
      eventPack.modifiers.successDelta -
      def.riskLevel * 0.04 +
      Math.max(0, (scoreInfo.optionalBonuses.zoneKnowledge || 0) / 180),
      0.08,
      0.97
    );
    const injuryChance = clampExpeditionValue(
      0.06 +
      def.riskLevel * 0.08 +
      (duration.riskMod || 0) +
      strategy.injuryMod +
      eventPack.modifiers.injuryDelta -
      (scoreInfo.survivalScore / Math.max(1, scoreInfo.challengeScore)) * 0.22,
      0.02,
      0.78
    );
    const resultRoll = Math.random();
    const variance = rf(-0.18, 0.18);
    const injuryRoll = Math.random();
    const injured = injuryRoll < injuryChance;
    const scoreValue =
      (successChance - resultRoll) * 90 +
      ((scoreInfo.overallScore - scoreInfo.challengeScore) / Math.max(1, scoreInfo.challengeScore)) * 55 +
      strategy.scoreBias +
      eventPack.modifiers.gradeDelta +
      variance * 30 -
      (injured ? 12 : 0);
    const grade = this.determineOutcomeGrade(scoreValue);

    let gold = baseOffline.gold * (def.baseRewards.goldFactor || 0.3);
    let exp = baseOffline.exp * (def.baseRewards.expFactor || 0.3);
    gold *= (duration.rewardMult || 1) * (strategy.goldMult || 1) * (eventPack.modifiers.goldMult || 1) * grade.rewardMult;
    exp *= (duration.rewardMult || 1) * (strategy.expMult || 1) * (eventPack.modifiers.expMult || 1) * grade.rewardMult;
    gold *= 1 + Math.max(0, this.getGuildMultiplier('gold') - 1) * 0.5;
    exp *= 1 + Math.max(0, this.getGuildMultiplier('exp') - 1) * 0.4;
    gold = Math.max(0, Math.floor(gold));
    exp = Math.max(0, Math.floor(exp));

    const materials = this.rollMaterialRewards(def, strategy, duration, eventPack, scoreInfo, grade);
    const items = this.rollRewardItems(def, strategy, duration, eventPack, scoreInfo, grade);
    const penalty = injured || grade.index >= 3 ? {
      type: 'injury',
      label: injured ? 'Wounded Return' : 'Exhausted Return',
      hpLossPct: injured ? clampExpeditionValue(0.1 + def.riskLevel * 0.03, 0.12, 0.28) : clampExpeditionValue(0.06 + def.riskLevel * 0.02, 0.08, 0.18),
      text: injured ? 'The team returned injured and needs time to recover.' : 'The run drained resources and left the team exhausted.'
    } : null;

    return {
      expeditionId: def.id,
      name: def.name,
      zone: def.zone,
      zoneIndex: def.zoneIndex || 0,
      strategyId: strategy.id,
      strategyName: strategy.name,
      durationSec: duration.seconds,
      durationLabel: duration.label,
      riskLevel: def.riskLevel,
      outcomeGrade: grade.name,
      gradeIndex: grade.index,
      successChance: successChance,
      injuryChance: injuryChance,
      exp: exp,
      gold: gold,
      materials: materials,
      items: items,
      eventLog: eventPack.eventLog.slice(0, 6),
      eventNames: eventPack.events.map(event => event.name),
      events: eventPack.events,
      flavorSummary: this.buildFlavorSummary(def, strategy, grade, eventPack, scoreInfo),
      penalty: penalty,
      buildScores: {
        combat: scoreInfo.combatScore,
        survival: scoreInfo.survivalScore,
        utility: scoreInfo.utilityScore,
        luck: scoreInfo.luckScore
      },
      rewardPreview: {
        baseGold: baseOffline.gold,
        baseExp: baseOffline.exp
      },
      startedAt: startedAt,
      endedAt: ts,
      resolvedAt: ts
    };
  },

  resolveOfflineExpedition(now, skipSave) {
    const ts = typeof now === 'number' ? now : Date.now();
    if (!this.activeRun || this.pendingSummary) return null;
    if (ts < this.activeRun.endsAt) return null;

    const report = this.generateExpeditionReport(this.activeRun.id, {
      strategyId: this.activeRun.strategyId,
      durationSec: this.activeRun.durationSec,
      startedAt: this.activeRun.startedAt
    }, ts);

    this.activeRun = null;
    this.pendingSummary = report;
    this.lastReport = report;
    this.selectedExpeditionId = report.expeditionId;
    this.selectedStrategyId = report.strategyId;
    this.selectedDurationSec = report.durationSec;
    this.panelOpen = true;

    if (typeof addNotification === 'function') {
      addNotification(report.name + ': ' + report.outcomeGrade, report.gradeIndex <= 1 ? '#2ecc71' : report.gradeIndex === 2 ? '#f1c40f' : '#e67e22');
    }
    if (typeof addLog === 'function') {
      addLog('Expedition resolved: ' + report.name + ' [' + report.outcomeGrade + ']', report.gradeIndex <= 1 ? '#2ecc71' : '#f0ad4e');
    }
    if (!skipSave && typeof saveGame === 'function') saveGame();
    return report;
  },

  groupRewardsByName(items) {
    const grouped = {};
    const list = Array.isArray(items) ? items : [];
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (!item || !item.name) continue;
      if (!grouped[item.name]) {
        grouped[item.name] = { name: item.name, count: 0, rarity: item.rarity || 'common' };
      }
      grouped[item.name].count++;
    }
    return Object.keys(grouped).map(key => grouped[key]);
  },

  claimExpeditionRewards() {
    const player = this.getPlayer();
    const report = this.pendingSummary;
    if (!player || !report) return false;

    player.gold += report.gold || 0;
    if (typeof gainExp === 'function') gainExp(player, report.exp || 0);

    let overflowGold = 0;
    const rewards = [].concat(report.materials || [], report.items || []);
    for (let i = 0; i < rewards.length; i++) {
      const reward = rewards[i];
      if (!reward) continue;
      if (player.inventory.length < 20) {
        const pushed = { ...reward };
        player.inventory.push(pushed);
        if (pushed.type !== 'material' && pushed.type !== 'potion' && typeof autoEquip === 'function') {
          autoEquip(player, pushed);
        }
      } else {
        overflowGold += reward.value || 10;
      }
    }

    if (report.penalty && report.penalty.type === 'injury') {
      const hpLoss = Math.max(1, Math.floor(player.maxHp * report.penalty.hpLossPct));
      player.hp = Math.max(1, player.hp - hpLoss);
      if (typeof addNotification === 'function') {
        addNotification(report.penalty.label + ': -' + hpLoss + ' HP', '#ff8c69');
      }
    }

    if (overflowGold > 0) {
      player.gold += overflowGold;
      if (typeof addNotification === 'function') {
        addNotification('Inventory overflow converted into ' + this.formatNum(overflowGold) + 'g', '#ffd166');
      }
    }

    if (typeof sfx !== 'undefined' && typeof sfx.itemPickup === 'function') sfx.itemPickup();
    if (typeof addLog === 'function') {
      addLog('Claimed expedition rewards: +' + this.formatNum(report.gold) + 'g +' + this.formatNum(report.exp) + ' EXP', '#2ecc71');
    }

    this.lastReport = report;
    this.pendingSummary = null;
    this.panelOpen = false;
    if (typeof saveGame === 'function') saveGame();
    return true;
  },

  getOfflineExpeditionSummary() {
    return this.pendingSummary;
  },

  formatNum(value) {
    return Math.floor(value || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  formatDuration(seconds) {
    const total = Math.max(0, Math.floor(seconds || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (hours > 0) return hours + 'h ' + minutes + 'm';
    return minutes + 'm';
  },

  getRiskLabel(level) {
    return ['Trivial', 'Low', 'Guarded', 'Dangerous', 'Extreme', 'Forbidden'][level] || 'Unknown';
  },

  getRewardBiasLabel(bias) {
    return {
      gold: 'Gold',
      exp: 'EXP',
      material: 'Materials',
      balanced: 'Balanced',
      rare: 'Rare Drops'
    }[bias] || 'Balanced';
  },

  getPanelLayout() {
    const width = Math.min(980, canvas.width - 40);
    const height = Math.min(640, canvas.height - 40);
    return {
      x: Math.floor((canvas.width - width) / 2),
      y: Math.floor((canvas.height - height) / 2),
      w: width,
      h: height
    };
  },

  registerClickable(id, rect) {
    this._clickMap[id] = {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h
    };
  },

  drawWrappedText(drawCtx, text, x, y, maxWidth, lineHeight, color, font) {
    const words = String(text || '').split(' ');
    let line = '';
    let offsetY = 0;
    drawCtx.fillStyle = color || '#d8e6f5';
    drawCtx.font = font || '12px sans-serif';
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (drawCtx.measureText(test).width > maxWidth && line) {
        drawCtx.fillText(line, x, y + offsetY);
        line = words[i];
        offsetY += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) drawCtx.fillText(line, x, y + offsetY);
    return offsetY + lineHeight;
  },

  drawHudStatus(drawCtx) {
    const ctxRef = drawCtx || ctx;
    if (!this.activeRun && !this.pendingSummary) return;

    const x = canvas.width - 288;
    const y = 148;
    const w = 272;
    const h = this.pendingSummary ? 70 : 84;
    ctxRef.save();
    ctxRef.fillStyle = 'rgba(8,14,26,0.82)';
    roundRect(ctxRef, x, y, w, h, 10);
    ctxRef.fill();
    ctxRef.strokeStyle = this.pendingSummary ? '#ffd166' : '#66c2ff';
    ctxRef.lineWidth = 1.5;
    roundRect(ctxRef, x, y, w, h, 10);
    ctxRef.stroke();
    ctxRef.textAlign = 'left';
    ctxRef.fillStyle = '#eef6ff';
    ctxRef.font = 'bold 13px sans-serif';

    if (this.pendingSummary) {
      ctxRef.fillText('Expedition Debrief Ready', x + 12, y + 22);
      ctxRef.fillStyle = '#ffd166';
      ctxRef.font = '11px monospace';
      ctxRef.fillText(this.pendingSummary.name + ' [' + this.pendingSummary.outcomeGrade + ']', x + 12, y + 42);
      ctxRef.fillStyle = '#9db7d1';
      ctxRef.fillText('Open from TAB menu or press X', x + 12, y + 58);
    } else if (this.activeRun) {
      const def = this.getDefinition(this.activeRun.id) || this.getSelectedDefinition();
      const strategy = this.getStrategy(this.activeRun.strategyId) || this.getSelectedStrategy();
      const remaining = Math.max(0, Math.ceil((this.activeRun.endsAt - Date.now()) / 1000));
      ctxRef.fillText('Offline Expedition Active', x + 12, y + 22);
      ctxRef.fillStyle = '#66c2ff';
      ctxRef.font = '11px monospace';
      ctxRef.fillText(def.name, x + 12, y + 42);
      ctxRef.fillStyle = '#9db7d1';
      ctxRef.fillText(strategy.name + '  |  ' + this.formatDuration(this.activeRun.durationSec), x + 12, y + 58);
      ctxRef.fillText('Remaining: ' + this.formatDuration(remaining), x + 12, y + 74);
    }

    ctxRef.restore();
  },

  renderOfflineExpeditionPanel(drawCtx) {
    if (!this.panelOpen) return;
    const ctxRef = drawCtx || ctx;
    const layout = this.getPanelLayout();
    this._clickMap = {};

    ctxRef.save();
    ctxRef.fillStyle = 'rgba(0,0,0,0.74)';
    ctxRef.fillRect(0, 0, canvas.width, canvas.height);

    ctxRef.fillStyle = 'rgba(9,14,24,0.98)';
    roundRect(ctxRef, layout.x, layout.y, layout.w, layout.h, 14);
    ctxRef.fill();
    ctxRef.strokeStyle = '#37516e';
    ctxRef.lineWidth = 2;
    roundRect(ctxRef, layout.x, layout.y, layout.w, layout.h, 14);
    ctxRef.stroke();

    ctxRef.textAlign = 'left';
    ctxRef.fillStyle = '#eef6ff';
    ctxRef.font = 'bold 22px sans-serif';
    ctxRef.fillText(this.pendingSummary ? 'Expedition Debrief' : 'Offline Expedition Command', layout.x + 20, layout.y + 30);
    ctxRef.fillStyle = '#89a8c4';
    ctxRef.font = '11px sans-serif';
    ctxRef.fillText(
      this.pendingSummary
        ? 'Review the mission report, then claim rewards and penalties in one step.'
        : 'Plan one offline mission at a time. Expedition sessions replace normal AFK rewards for that offline save window.',
      layout.x + 20,
      layout.y + 48
    );

    if (this.pendingSummary) {
      const report = this.pendingSummary;
      ctxRef.fillStyle = '#eef6ff';
      ctxRef.font = 'bold 18px sans-serif';
      ctxRef.fillText(report.name, layout.x + 20, layout.y + 72);
      ctxRef.fillStyle = '#8eb1cb';
      ctxRef.font = '11px monospace';
      ctxRef.fillText(report.zone + '  |  ' + report.durationLabel + '  |  ' + report.strategyName, layout.x + 20, layout.y + 92);
      ctxRef.fillStyle = report.gradeIndex <= 1 ? '#5ed39d' : report.gradeIndex === 2 ? '#ffd166' : '#ff8b8b';
      ctxRef.font = 'bold 12px monospace';
      ctxRef.fillText('Outcome Grade: ' + report.outcomeGrade, layout.x + 20, layout.y + 110);
    }

    const closeRect = { x: layout.x + layout.w - 34, y: layout.y + 10, w: 22, h: 22 };
    this.registerClickable('close', closeRect);
    ctxRef.fillStyle = 'rgba(180,40,40,0.85)';
    roundRect(ctxRef, closeRect.x, closeRect.y, closeRect.w, closeRect.h, 5);
    ctxRef.fill();
    ctxRef.fillStyle = '#fff';
    ctxRef.font = 'bold 14px sans-serif';
    ctxRef.textAlign = 'center';
    ctxRef.fillText('X', closeRect.x + closeRect.w / 2, closeRect.y + 16);

    if (this.pendingSummary) {
      this.drawSummaryPanel(ctxRef, layout);
      ctxRef.restore();
      return;
    }

    this.drawPlanningPanel(ctxRef, layout);
    ctxRef.restore();
  },

  drawPlanningPanel(drawCtx, layout) {
    const listRect = { x: layout.x + 16, y: layout.y + 70, w: 270, h: layout.h - 88 };
    const detailRect = { x: listRect.x + listRect.w + 16, y: listRect.y, w: layout.w - listRect.w - 48, h: listRect.h };
    const available = this.getAvailableExpeditions();
    const selected = this.getSelectedDefinition();
    const selectedDuration = this.getDurationOption(selected, this.selectedDurationSec);
    const selectedStrategy = this.getSelectedStrategy();
    const canStart = this.canStartExpedition(selected.id, { strategyId: selectedStrategy.id, durationSec: selectedDuration.seconds });
    const scorePreview = this.calculateExpeditionScores(selected, { strategyId: selectedStrategy.id, durationSec: selectedDuration.seconds });

    drawCtx.fillStyle = 'rgba(15,22,36,0.94)';
    roundRect(drawCtx, listRect.x, listRect.y, listRect.w, listRect.h, 10);
    drawCtx.fill();
    drawCtx.strokeStyle = '#23384d';
    roundRect(drawCtx, listRect.x, listRect.y, listRect.w, listRect.h, 10);
    drawCtx.stroke();

    drawCtx.textAlign = 'left';
    drawCtx.fillStyle = '#dcecff';
    drawCtx.font = 'bold 14px sans-serif';
    drawCtx.fillText('Expeditions', listRect.x + 12, listRect.y + 22);

    const rowH = 80;
    for (let i = 0; i < available.length; i++) {
      const expedition = available[i];
      const rowY = listRect.y + 34 + i * (rowH + 8);
      const rowRect = { x: listRect.x + 10, y: rowY, w: listRect.w - 20, h: rowH };
      this.registerClickable('expedition:' + expedition.id, rowRect);
      drawCtx.fillStyle = expedition.selected ? 'rgba(40,72,108,0.9)' : 'rgba(10,16,26,0.94)';
      roundRect(drawCtx, rowRect.x, rowRect.y, rowRect.w, rowRect.h, 8);
      drawCtx.fill();
      drawCtx.strokeStyle = expedition.selected ? '#7ec8ff' : '#23384d';
      roundRect(drawCtx, rowRect.x, rowRect.y, rowRect.w, rowRect.h, 8);
      drawCtx.stroke();

      drawCtx.fillStyle = expedition.unlocked ? '#ecf5ff' : '#71879b';
      drawCtx.font = 'bold 13px sans-serif';
      drawCtx.fillText(expedition.name, rowRect.x + 10, rowRect.y + 18);
      drawCtx.fillStyle = '#88abc6';
      drawCtx.font = '11px monospace';
      drawCtx.fillText(expedition.zone, rowRect.x + 10, rowRect.y + 36);
      drawCtx.fillText('Lv.' + expedition.minLevel + ' / Rec Lv.' + expedition.recommendedLevel, rowRect.x + 10, rowRect.y + 52);
      drawCtx.fillStyle = expedition.unlocked ? '#ffd166' : '#ff8b8b';
      drawCtx.fillText(expedition.unlocked ? this.getRiskLabel(expedition.riskLevel) : 'Locked', rowRect.x + rowRect.w - 92, rowRect.y + 18);
      drawCtx.fillStyle = '#8aa0b5';
      drawCtx.fillText(this.getRewardBiasLabel(expedition.rewardBias), rowRect.x + rowRect.w - 92, rowRect.y + 36);
      drawCtx.fillText(this.formatDuration(expedition.durationOptions[0].seconds) + '+', rowRect.x + rowRect.w - 92, rowRect.y + 52);
      if (expedition.active) {
        drawCtx.fillStyle = '#5ed39d';
        drawCtx.fillText('ACTIVE', rowRect.x + rowRect.w - 92, rowRect.y + 68);
      }
    }

    drawCtx.fillStyle = 'rgba(15,22,36,0.94)';
    roundRect(drawCtx, detailRect.x, detailRect.y, detailRect.w, detailRect.h, 10);
    drawCtx.fill();
    drawCtx.strokeStyle = '#23384d';
    roundRect(drawCtx, detailRect.x, detailRect.y, detailRect.w, detailRect.h, 10);
    drawCtx.stroke();

    drawCtx.textAlign = 'left';
    drawCtx.fillStyle = '#eef6ff';
    drawCtx.font = 'bold 18px sans-serif';
    drawCtx.fillText(selected.name, detailRect.x + 16, detailRect.y + 26);
    drawCtx.fillStyle = '#8eb1cb';
    drawCtx.font = '11px monospace';
    drawCtx.fillText(selected.zone + '  |  ' + this.getRiskLabel(selected.riskLevel) + '  |  Bias: ' + this.getRewardBiasLabel(selected.rewardBias), detailRect.x + 16, detailRect.y + 46);
    drawCtx.fillStyle = this.isExpeditionUnlocked(selected) ? '#71d69d' : '#ff8b8b';
    drawCtx.fillText(this.isExpeditionUnlocked(selected) ? 'Unlocked' : 'Requires Lv.' + selected.minLevel, detailRect.x + 16, detailRect.y + 64);

    drawCtx.fillStyle = '#d5e3f0';
    this.drawWrappedText(drawCtx, selected.flavor, detailRect.x + 16, detailRect.y + 86, detailRect.w - 32, 16, '#d5e3f0', '12px sans-serif');

    const contentW = detailRect.w - 32;
    const durationGroup = { x: detailRect.x + 16, y: detailRect.y + 126, w: contentW, h: 66 };
    const strategyGroup = { x: detailRect.x + 16, y: durationGroup.y + durationGroup.h + 10, w: contentW, h: 102 };
    const scoreGroup = { x: detailRect.x + 16, y: strategyGroup.y + strategyGroup.h + 10, w: contentW, h: 96 };
    const footerButtonH = 28;
    const footerButtonY = detailRect.y + detailRect.h - 42;
    const actionGroup = {
      x: detailRect.x + 16,
      y: scoreGroup.y + scoreGroup.h + 10,
      w: contentW,
      h: Math.max(84, footerButtonY - (scoreGroup.y + scoreGroup.h + 10) - 10)
    };

    this.drawOptionGroup(drawCtx, 'Duration', durationGroup, selected.durationOptions, function(option) {
      return option.label;
    }, this.selectedDurationSec, 'duration');

    this.drawOptionGroup(drawCtx, 'Strategy', strategyGroup, this.strategies, function(strategy) {
      return strategy.name;
    }, this.selectedStrategyId, 'strategy');

    drawCtx.fillStyle = 'rgba(10,18,30,0.9)';
    roundRect(drawCtx, scoreGroup.x, scoreGroup.y, scoreGroup.w, scoreGroup.h, 8);
    drawCtx.fill();
    drawCtx.strokeStyle = '#23384d';
    roundRect(drawCtx, scoreGroup.x, scoreGroup.y, scoreGroup.w, scoreGroup.h, 8);
    drawCtx.stroke();
    drawCtx.fillStyle = '#dcecff';
    drawCtx.font = 'bold 13px sans-serif';
    drawCtx.textAlign = 'left';
    drawCtx.fillText('Build Forecast', scoreGroup.x + 12, scoreGroup.y + 20);
    drawCtx.fillStyle = '#8eb1cb';
    drawCtx.font = '11px monospace';
    drawCtx.fillText('Combat ' + scorePreview.combatScore, scoreGroup.x + 12, scoreGroup.y + 40);
    drawCtx.fillText('Survival ' + scorePreview.survivalScore, scoreGroup.x + 152, scoreGroup.y + 40);
    drawCtx.fillText('Utility ' + scorePreview.utilityScore, scoreGroup.x + 12, scoreGroup.y + 58);
    drawCtx.fillText('Luck ' + scorePreview.luckScore, scoreGroup.x + 152, scoreGroup.y + 58);
    drawCtx.fillStyle = '#d5e3f0';
    drawCtx.font = '12px sans-serif';
    drawCtx.fillText('Success est.: ' + Math.round(scorePreview.successBaseline * 100) + '% pre-events', scoreGroup.x + 12, scoreGroup.y + 78);
    drawCtx.fillText('Challenge score: ' + scorePreview.challengeScore, scoreGroup.x + 12, scoreGroup.y + 94);

    drawCtx.fillStyle = 'rgba(10,18,30,0.9)';
    roundRect(drawCtx, actionGroup.x, actionGroup.y, actionGroup.w, actionGroup.h, 8);
    drawCtx.fill();
    drawCtx.strokeStyle = '#23384d';
    roundRect(drawCtx, actionGroup.x, actionGroup.y, actionGroup.w, actionGroup.h, 8);
    drawCtx.stroke();
    drawCtx.fillStyle = '#dcecff';
    drawCtx.font = 'bold 13px sans-serif';
    drawCtx.textAlign = 'left';
    drawCtx.fillText('Mission Notes', actionGroup.x + 12, actionGroup.y + 20);
    drawCtx.fillStyle = '#9ab4ca';
    drawCtx.font = '11px sans-serif';
    drawCtx.fillText('- Expedition rewards start from AFK base values.', actionGroup.x + 12, actionGroup.y + 40);
    drawCtx.fillText('- Strategy changes success, injury, materials, and rares.', actionGroup.x + 12, actionGroup.y + 56);
    drawCtx.fillText('- One active run only. The offline window replaces AFK rewards.', actionGroup.x + 12, actionGroup.y + 72);

    if (this.activeRun) {
      const activeDef = this.getDefinition(this.activeRun.id) || selected;
      const activeStrategy = this.getStrategy(this.activeRun.strategyId) || selectedStrategy;
      const remaining = Math.max(0, Math.ceil((this.activeRun.endsAt - Date.now()) / 1000));
      drawCtx.fillStyle = '#5ed39d';
      drawCtx.fillText(activeDef.name + ' is active with ' + activeStrategy.name + '.', actionGroup.x + 12, actionGroup.y + 88);
      drawCtx.fillText('Remaining: ' + this.formatDuration(remaining), actionGroup.x + 12, actionGroup.y + 104);
      const cancelRect = { x: detailRect.x + detailRect.w - 176, y: footerButtonY, w: 160, h: footerButtonH };
      this.registerClickable('cancel', cancelRect);
      drawCtx.fillStyle = 'rgba(190,92,66,0.95)';
      roundRect(drawCtx, cancelRect.x, cancelRect.y, cancelRect.w, cancelRect.h, 6);
      drawCtx.fill();
      drawCtx.strokeStyle = '#ffc0aa';
      roundRect(drawCtx, cancelRect.x, cancelRect.y, cancelRect.w, cancelRect.h, 6);
      drawCtx.stroke();
      drawCtx.fillStyle = '#fff';
      drawCtx.font = 'bold 13px sans-serif';
      drawCtx.textAlign = 'center';
      drawCtx.fillText('Cancel Expedition', cancelRect.x + cancelRect.w / 2, cancelRect.y + 19);
    } else {
      const startRect = { x: detailRect.x + detailRect.w - 176, y: footerButtonY, w: 160, h: footerButtonH };
      this.registerClickable('start', startRect);
      drawCtx.fillStyle = canStart.ok ? 'rgba(56,142,60,0.95)' : 'rgba(82,88,97,0.95)';
      roundRect(drawCtx, startRect.x, startRect.y, startRect.w, startRect.h, 6);
      drawCtx.fill();
      drawCtx.strokeStyle = canStart.ok ? '#abefb0' : '#a0a8b2';
      roundRect(drawCtx, startRect.x, startRect.y, startRect.w, startRect.h, 6);
      drawCtx.stroke();
      drawCtx.fillStyle = '#fff';
      drawCtx.font = 'bold 13px sans-serif';
      drawCtx.textAlign = 'center';
      drawCtx.fillText(canStart.ok ? 'Launch Expedition' : canStart.reason, startRect.x + startRect.w / 2, startRect.y + 19);
    }
  },

  drawOptionGroup(drawCtx, title, rect, options, labelFn, selectedValue, prefix) {
    drawCtx.textAlign = 'left';
    drawCtx.fillStyle = 'rgba(10,18,30,0.9)';
    roundRect(drawCtx, rect.x, rect.y, rect.w, rect.h, 8);
    drawCtx.fill();
    drawCtx.strokeStyle = '#23384d';
    roundRect(drawCtx, rect.x, rect.y, rect.w, rect.h, 8);
    drawCtx.stroke();
    drawCtx.textAlign = 'left';
    drawCtx.fillStyle = '#dcecff';
    drawCtx.font = 'bold 13px sans-serif';
    drawCtx.fillText(title, rect.x + 12, rect.y + 20);

    const gap = 8;
    const buttonW = Math.floor((rect.w - 24 - gap * (options.length - 1)) / options.length);
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const value = prefix === 'duration' ? option.seconds : option.id;
      const buttonRect = { x: rect.x + 12 + i * (buttonW + gap), y: rect.y + 32, w: buttonW, h: rect.h - 44 };
      this.registerClickable(prefix + ':' + value, buttonRect);
      const selected = value === selectedValue;
      drawCtx.fillStyle = selected ? 'rgba(56,96,142,0.95)' : 'rgba(16,28,44,0.95)';
      roundRect(drawCtx, buttonRect.x, buttonRect.y, buttonRect.w, buttonRect.h, 6);
      drawCtx.fill();
      drawCtx.strokeStyle = selected ? '#9fd6ff' : '#2a4158';
      roundRect(drawCtx, buttonRect.x, buttonRect.y, buttonRect.w, buttonRect.h, 6);
      drawCtx.stroke();
      drawCtx.fillStyle = '#eef6ff';
      drawCtx.font = 'bold 12px sans-serif';
      drawCtx.textAlign = 'center';
      drawCtx.fillText(labelFn(option), buttonRect.x + buttonRect.w / 2, buttonRect.y + 17);
    }
    drawCtx.textAlign = 'left';
  },

  drawSummaryPanel(drawCtx, layout) {
    const report = this.pendingSummary;
    const rewardRect = { x: layout.x + 18, y: layout.y + 126, w: Math.floor((layout.w - 54) * 0.52), h: layout.h - 196 };
    const debriefRect = { x: rewardRect.x + rewardRect.w + 18, y: rewardRect.y, w: layout.w - rewardRect.w - 54, h: rewardRect.h };
    const claimRect = { x: layout.x + layout.w - 188, y: layout.y + layout.h - 48, w: 172, h: 30 };
    this.registerClickable('claim', claimRect);

    drawCtx.fillStyle = 'rgba(15,22,36,0.94)';
    roundRect(drawCtx, rewardRect.x, rewardRect.y, rewardRect.w, rewardRect.h, 10);
    drawCtx.fill();
    drawCtx.strokeStyle = '#23384d';
    roundRect(drawCtx, rewardRect.x, rewardRect.y, rewardRect.w, rewardRect.h, 10);
    drawCtx.stroke();

    drawCtx.fillStyle = '#dcecff';
    drawCtx.font = 'bold 14px sans-serif';
    drawCtx.fillText('Mission Rewards', rewardRect.x + 14, rewardRect.y + 22);
    drawCtx.fillStyle = '#ffd166';
    drawCtx.font = 'bold 18px sans-serif';
    drawCtx.fillText('+' + this.formatNum(report.gold) + ' Gold', rewardRect.x + 18, rewardRect.y + 54);
    drawCtx.fillStyle = '#74c7ff';
    drawCtx.fillText('+' + this.formatNum(report.exp) + ' EXP', rewardRect.x + 18, rewardRect.y + 82);
    drawCtx.fillStyle = '#d5e3f0';
    drawCtx.font = '12px sans-serif';
    drawCtx.fillText('Success chance: ' + Math.round((report.successChance || 0) * 100) + '%', rewardRect.x + 18, rewardRect.y + 108);
    drawCtx.fillText('Injury chance: ' + Math.round((report.injuryChance || 0) * 100) + '%', rewardRect.x + 18, rewardRect.y + 126);

    const materialGroups = this.groupRewardsByName(report.materials);
    const itemGroups = this.groupRewardsByName(report.items);
    drawCtx.fillStyle = '#eef6ff';
    drawCtx.font = 'bold 13px sans-serif';
    drawCtx.fillText('Materials', rewardRect.x + 18, rewardRect.y + 156);
    drawCtx.fillText('Item Drops', rewardRect.x + 18, rewardRect.y + 248);

    drawCtx.font = '11px sans-serif';
    if (!materialGroups.length) {
      drawCtx.fillStyle = '#8ca2b7';
      drawCtx.fillText('None', rewardRect.x + 20, rewardRect.y + 176);
    } else {
      for (let i = 0; i < materialGroups.length && i < 4; i++) {
        const material = materialGroups[i];
        drawCtx.fillStyle = RARITY_COLORS[material.rarity] || '#fff';
        drawCtx.fillText(material.name + (material.count > 1 ? ' x' + material.count : ''), rewardRect.x + 20, rewardRect.y + 176 + i * 18);
      }
    }
    if (!itemGroups.length) {
      drawCtx.fillStyle = '#8ca2b7';
      drawCtx.fillText('None', rewardRect.x + 20, rewardRect.y + 268);
    } else {
      for (let i = 0; i < itemGroups.length && i < 4; i++) {
        const item = itemGroups[i];
        drawCtx.fillStyle = RARITY_COLORS[item.rarity] || '#fff';
        drawCtx.fillText(item.name + (item.count > 1 ? ' x' + item.count : ''), rewardRect.x + 20, rewardRect.y + 268 + i * 18);
      }
    }

    drawCtx.fillStyle = '#eef6ff';
    drawCtx.font = 'bold 13px sans-serif';
    drawCtx.fillText('Build Match', rewardRect.x + 18, rewardRect.y + 344);
    drawCtx.fillStyle = '#8eb1cb';
    drawCtx.font = '11px monospace';
    drawCtx.fillText('Combat ' + (report.buildScores ? report.buildScores.combat : 0), rewardRect.x + 18, rewardRect.y + 364);
    drawCtx.fillText('Survival ' + (report.buildScores ? report.buildScores.survival : 0), rewardRect.x + 18, rewardRect.y + 382);
    drawCtx.fillText('Utility ' + (report.buildScores ? report.buildScores.utility : 0), rewardRect.x + 18, rewardRect.y + 400);
    drawCtx.fillText('Luck ' + (report.buildScores ? report.buildScores.luck : 0), rewardRect.x + 18, rewardRect.y + 418);

    drawCtx.fillStyle = 'rgba(15,22,36,0.94)';
    roundRect(drawCtx, debriefRect.x, debriefRect.y, debriefRect.w, debriefRect.h, 10);
    drawCtx.fill();
    drawCtx.strokeStyle = '#23384d';
    roundRect(drawCtx, debriefRect.x, debriefRect.y, debriefRect.w, debriefRect.h, 10);
    drawCtx.stroke();

    drawCtx.fillStyle = '#dcecff';
    drawCtx.font = 'bold 14px sans-serif';
    drawCtx.fillText('Debrief', debriefRect.x + 14, debriefRect.y + 22);
    drawCtx.fillStyle = '#d5e3f0';
    this.drawWrappedText(drawCtx, report.flavorSummary, debriefRect.x + 16, debriefRect.y + 48, debriefRect.w - 32, 18, '#d5e3f0', '12px sans-serif');

    drawCtx.fillStyle = '#eef6ff';
    drawCtx.font = 'bold 13px sans-serif';
    drawCtx.fillText('Event Log', debriefRect.x + 16, debriefRect.y + 130);
    drawCtx.font = '11px sans-serif';
    if (!report.eventLog || !report.eventLog.length) {
      drawCtx.fillStyle = '#8ca2b7';
      drawCtx.fillText('No notable events.', debriefRect.x + 16, debriefRect.y + 150);
    } else {
      for (let i = 0; i < report.eventLog.length && i < 5; i++) {
        drawCtx.fillStyle = '#a6bdd0';
        this.drawWrappedText(drawCtx, '- ' + report.eventLog[i], debriefRect.x + 16, debriefRect.y + 150 + i * 34, debriefRect.w - 32, 14, '#a6bdd0', '11px sans-serif');
      }
    }

    drawCtx.fillStyle = '#eef6ff';
    drawCtx.font = 'bold 13px sans-serif';
    drawCtx.fillText('Penalty / Injury', debriefRect.x + 16, debriefRect.y + 344);
    drawCtx.fillStyle = report.penalty ? '#ff9d7a' : '#8ccca0';
    drawCtx.font = '11px sans-serif';
    drawCtx.fillText(report.penalty ? report.penalty.label + '  |  -' + Math.round(report.penalty.hpLossPct * 100) + '% HP on claim' : 'No lasting penalty.', debriefRect.x + 16, debriefRect.y + 364);
    if (report.penalty) {
      this.drawWrappedText(drawCtx, report.penalty.text, debriefRect.x + 16, debriefRect.y + 384, debriefRect.w - 32, 14, '#ffb59c', '11px sans-serif');
    }

    drawCtx.fillStyle = 'rgba(56,142,60,0.95)';
    roundRect(drawCtx, claimRect.x, claimRect.y, claimRect.w, claimRect.h, 6);
    drawCtx.fill();
    drawCtx.strokeStyle = '#abefb0';
    roundRect(drawCtx, claimRect.x, claimRect.y, claimRect.w, claimRect.h, 6);
    drawCtx.stroke();
    drawCtx.fillStyle = '#fff';
    drawCtx.font = 'bold 13px sans-serif';
    drawCtx.textAlign = 'center';
    drawCtx.fillText('Claim Expedition Rewards', claimRect.x + claimRect.w / 2, claimRect.y + 20);
  },

  handleClick(cx, cy) {
    if (!this.panelOpen) return false;
    const layout = this.getPanelLayout();

    if (cx < layout.x || cx > layout.x + layout.w || cy < layout.y || cy > layout.y + layout.h) {
      this.panelOpen = false;
      return true;
    }

    const clickKeys = Object.keys(this._clickMap);
    for (let i = 0; i < clickKeys.length; i++) {
      const key = clickKeys[i];
      const rect = this._clickMap[key];
      if (cx < rect.x || cx > rect.x + rect.w || cy < rect.y || cy > rect.y + rect.h) continue;

      if (key === 'close') {
        this.panelOpen = false;
        return true;
      }
      if (key === 'start') {
        this.startExpedition(this.selectedExpeditionId, {
          strategyId: this.selectedStrategyId,
          durationSec: this.selectedDurationSec
        });
        return true;
      }
      if (key === 'cancel') {
        this.cancelExpedition();
        return true;
      }
      if (key === 'claim') {
        this.claimExpeditionRewards();
        return true;
      }
      if (key.indexOf('expedition:') === 0) {
        this.selectedExpeditionId = key.split(':')[1];
        this.ensureSelectedDuration(this.getSelectedDefinition());
        return true;
      }
      if (key.indexOf('strategy:') === 0) {
        this.selectedStrategyId = key.split(':')[1];
        return true;
      }
      if (key.indexOf('duration:') === 0) {
        this.selectedDurationSec = Number(key.split(':')[1]) || this.selectedDurationSec;
        return true;
      }
    }

    return true;
  }
};

function initOfflineExpedition() {
  offlineExpeditionSystem.init();
}

function getAvailableExpeditions() {
  return offlineExpeditionSystem.getAvailableExpeditions();
}

function getExpeditionStrategies() {
  return offlineExpeditionSystem.getExpeditionStrategies();
}

function canStartExpedition(id, options) {
  return offlineExpeditionSystem.canStartExpedition(id, options);
}

function startExpedition(id, options) {
  return offlineExpeditionSystem.startExpedition(id, options);
}

function cancelExpedition() {
  return offlineExpeditionSystem.cancelExpedition();
}

function resolveOfflineExpedition(now, skipSave) {
  return offlineExpeditionSystem.resolveOfflineExpedition(now, skipSave);
}

function calculateExpeditionScores(definition, options) {
  return offlineExpeditionSystem.calculateExpeditionScores(definition, options);
}

function rollExpeditionEvents(definition, strategy, durationOption, scorePayload) {
  return offlineExpeditionSystem.rollExpeditionEvents(definition, strategy, durationOption, scorePayload);
}

function generateExpeditionReport(expeditionId, options, now) {
  return offlineExpeditionSystem.generateExpeditionReport(expeditionId, options, now);
}

function claimExpeditionRewards() {
  return offlineExpeditionSystem.claimExpeditionRewards();
}

function getOfflineExpeditionSummary() {
  return offlineExpeditionSystem.getOfflineExpeditionSummary();
}

function renderOfflineExpeditionPanel(drawCtx) {
  return offlineExpeditionSystem.renderOfflineExpeditionPanel(drawCtx);
}

function handleOfflineExpeditionClick(cx, cy) {
  return offlineExpeditionSystem.handleClick(cx, cy);
}

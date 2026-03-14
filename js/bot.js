// ============================================================
// BOT AI — Smarter state machine built on top of the original flow
// ============================================================
const BOT_DEFAULT_SETTINGS = {
  hpThreshold: 35,
  autoSkill: true,
  targetPriority: 'smart',
  maxChaseDistance: 9,
  preferWeaker: true,
  lootNearbyFirst: true,
  stopWhenInventoryAlmostFull: true,
  avoidDangerousTargets: true,
  inventorySoftLimit: 18
};

const BOT_STATE_LABELS = {
  idle: 'Idle',
  roaming: 'Roaming',
  approaching: 'Approaching',
  combat: 'Combat',
  looting: 'Looting',
  retreating: 'Retreating'
};

const BOT_REASON_LABELS = {
  ready: 'Ready',
  scanning: 'Scanning',
  manual_stop: 'Manual stop',
  no_valid_targets: 'No targets',
  target_unreachable: 'Target unreachable',
  target_invalid: 'Target lost',
  low_hp: 'Low HP',
  low_mp: 'Low MP',
  danger_detected: 'Danger detected',
  loot_nearby: 'Loot nearby',
  inventory_full: 'Inventory almost full',
  path_stuck: 'Path stuck',
  reposition_farm: 'Repositioning',
  retreating_to_town: 'Returning to town'
};

const BOT_RARITY_SCORE = { common: 0, uncommon: 10, rare: 24, epic: 40, legendary: 64 };

function _botClamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function _botStatScore(item) {
  if (!item || !item.stats) return 0;
  if (typeof statScore === 'function') return statScore(item.stats);
  const s = item.stats;
  return (s.atk || 0) * 2 + (s.def || 0) * 2 + (s.hp || 0) * 0.5 + (s.mp || 0) * 0.5 + (s.spd || 0) * 10 + (s.crit || 0) * 100;
}

function _botItemShortName(item) {
  return item && item.name ? item.name.substring(0, 16) : 'None';
}

const botAI = {
  enabled: true,
  state: 'idle',
  target: null,
  roamTarget: null,
  retreatTarget: null,
  lootTarget: null,
  stopReason: 'ready',
  statusText: 'Ready',
  focusText: 'None',
  stuckTimer: 0,
  progressTimer: 0,
  progressX: 0,
  progressY: 0,
  lastX: 0,
  lastY: 0,
  pathTimer: 0,
  _debugTimer: 0,
  _potionCd: 0,
  stateTimer: 0,
  targetLockTimer: 0,
  noTargetTimer: 0,
  farmTimer: 0,
  decisionTimer: 0,
  lastCombatTime: 0,
  farmAnchor: null,
  settings: { ...BOT_DEFAULT_SETTINGS },

  applySettings(partial) {
    const merged = { ...BOT_DEFAULT_SETTINGS, ...(this.settings || {}), ...(partial || {}) };
    merged.hpThreshold = _botClamp(Math.round(merged.hpThreshold || BOT_DEFAULT_SETTINGS.hpThreshold), 15, 80);
    merged.maxChaseDistance = _botClamp(Math.round(merged.maxChaseDistance || BOT_DEFAULT_SETTINGS.maxChaseDistance), 4, 18);
    merged.inventorySoftLimit = _botClamp(Math.round(merged.inventorySoftLimit || BOT_DEFAULT_SETTINGS.inventorySoftLimit), 12, 20);
    merged.autoSkill = merged.autoSkill !== false;
    merged.preferWeaker = merged.preferWeaker !== false;
    merged.lootNearbyFirst = merged.lootNearbyFirst !== false;
    merged.stopWhenInventoryAlmostFull = merged.stopWhenInventoryAlmostFull !== false;
    merged.avoidDangerousTargets = merged.avoidDangerousTargets !== false;
    merged.targetPriority = ['smart', 'nearest', 'lowestHp', 'highestExp'].includes(merged.targetPriority) ? merged.targetPriority : 'smart';
    this.settings = merged;
    return merged;
  },

  getStateLabel() {
    return BOT_STATE_LABELS[this.state] || 'Idle';
  },

  getReasonLabel(reason) {
    return BOT_REASON_LABELS[reason || this.stopReason] || 'Ready';
  },

  getFocusLabel() {
    if (this.isValidTarget(this.target)) {
      return (this.target.type || 'monster') + ' Lv.' + (this.target.level || '?');
    }
    if (this.lootTarget && this.lootTarget.item) {
      return _botItemShortName(this.lootTarget.item);
    }
    if (this.state === 'retreating' && this.retreatTarget) {
      return 'Safe point';
    }
    if (this.farmAnchor) {
      return 'Farm ' + Math.floor(this.farmAnchor.x / TILE) + ',' + Math.floor(this.farmAnchor.y / TILE);
    }
    return this.focusText || 'Scanning';
  },

  setEnabled(flag, player) {
    this.enabled = !!flag;
    if (!this.enabled) {
      this.state = 'idle';
      this.target = null;
      this.roamTarget = null;
      this.retreatTarget = null;
      this.lootTarget = null;
      this.stopReason = 'manual_stop';
      this.statusText = 'Paused';
      this.focusText = 'Manual';
      if (player) {
        player._path = null;
        player._pathIdx = 0;
        player.state = 'idle';
      }
      this.resetMotionTracking(player);
      return;
    }
    this.stopReason = 'ready';
    this.statusText = 'Scanning';
    this.focusText = 'Scanning';
    this.state = 'idle';
    this.stateTimer = 0;
    this.resetMotionTracking(player);
  },

  cycleSetting(key) {
    this.applySettings();
    if (key === 'targetPriority') {
      const opts = ['smart', 'nearest', 'lowestHp', 'highestExp'];
      const idx = opts.indexOf(this.settings.targetPriority);
      this.settings.targetPriority = opts[(idx + 1) % opts.length];
    } else if (key === 'hpThreshold') {
      const opts = [25, 35, 45, 55];
      const idx = opts.indexOf(this.settings.hpThreshold);
      this.settings.hpThreshold = opts[(idx + 1) % opts.length];
    } else if (key === 'maxChaseDistance') {
      const opts = [6, 8, 10, 12];
      const idx = opts.indexOf(this.settings.maxChaseDistance);
      this.settings.maxChaseDistance = opts[(idx + 1) % opts.length];
    } else if (key in this.settings) {
      this.settings[key] = !this.settings[key];
    }
    this.applySettings();
  },

  setState(next, reason, status, force) {
    const sticky = { idle: 0, roaming: 0.8, approaching: 0.7, combat: 0.45, looting: 0.8, retreating: 1.1 }[this.state] || 0;
    if (!force && next !== this.state && this.stateTimer < sticky && next !== 'retreating') return false;
    if (next !== this.state) {
      this.state = next;
      this.stateTimer = 0;
      if (next !== 'approaching' && next !== 'combat') this.targetLockTimer = 0;
    }
    if (reason) this.stopReason = reason;
    if (status) this.statusText = status;
    return true;
  },

  isValidTarget(t) {
    return t && !t.isDead && t.entityType === 'monster';
  },

  getRetreatThreshold(p) {
    const classMin = { Knight: 25, Mage: 38, Ranger: 33, Priest: 45 }[p && p.className] || 30;
    return Math.max(this.settings.hpThreshold || BOT_DEFAULT_SETTINGS.hpThreshold, classMin);
  },

  getPotionCount(p) {
    return p && p.inventory ? p.inventory.filter(i => i && i.type === 'potion').length : 0;
  },

  isSkillHungryBuild(p) {
    if (!p || !p.maxMp) return false;
    return (p.className === 'Mage' || p.className === 'Priest') && p.maxMp >= 40;
  },

  getMaxChaseDistance(p) {
    let chase = this.settings.maxChaseDistance || BOT_DEFAULT_SETTINGS.maxChaseDistance;
    if (this.isSkillHungryBuild(p) && p.maxMp > 0 && p.mp / p.maxMp < 0.25) chase -= 2;
    if (dungeon.active) chase += 4;
    return _botClamp(chase, 4, dungeon.active ? 22 : 16);
  },

  getNearbyMonsters(mons, x, y, range) {
    return mons.filter(m => this.isValidTarget(m) && Math.hypot(m.x - x, m.y - y) <= range);
  },

  getThreatScoreAt(p, mons, x, y) {
    let score = 0;
    for (const m of mons) {
      if (!this.isValidTarget(m)) continue;
      const dist = Math.hypot(m.x - x, m.y - y);
      if (dist > TILE * 4) continue;
      const threatDiff = typeof progressionSystem!=='undefined'&&progressionSystem.getRelativeThreat ? progressionSystem.getRelativeThreat(m,p) : ((m.level || 1) - (p.level || 1)) * 2;
      score += Math.max(3, 22 - dist / TILE * 4);
      score += Math.max(0, threatDiff) * 7;
      score += Math.max(0, (m.atk || 0) - (p.def || 0)) * 0.5;
    }
    return score;
  },

  markTargetBlocked(monster, seconds) {
    if (monster) monster._botBlockedUntil = game.time + (seconds || 4);
  },

  canConsiderTarget(monster) {
    return !monster || !monster._botBlockedUntil || monster._botBlockedUntil <= game.time;
  },

  evaluateMonsterTarget(monster, p, mons) {
    if (!this.isValidTarget(monster)) return { valid: false, reason: 'target_invalid', score: -9999 };
    if (!this.canConsiderTarget(monster)) return { valid: false, reason: 'target_unreachable', score: -9999 };

    const dist = Math.hypot(monster.x - p.x, monster.y - p.y);
    const distTiles = dist / TILE;
    const maxChase = this.getMaxChaseDistance(p);
    if (distTiles > maxChase) return { valid: false, reason: 'no_valid_targets', score: -9999 };

    const maxR = dungeon.active ? 25 : 20;
    const path = _findPath(p.x, p.y, monster.x, monster.y, maxR);
    let pathTiles = path ? Math.max(1, path.length) : Math.ceil(distTiles);
    if (!path) {
      if (!(dungeon.active && distTiles <= 3)) return { valid: false, reason: 'target_unreachable', score: -9999 };
      pathTiles += 2;
    }

    const threatDiff = typeof progressionSystem!=='undefined'&&progressionSystem.getRelativeThreat ? progressionSystem.getRelativeThreat(monster,p) : ((monster.level || 1) - (p.level || 1)) * 2;
    const hpRatio = monster.maxHp > 0 ? monster.hp / monster.maxHp : 1;
    const packCount = Math.max(0, this.getNearbyMonsters(mons, monster.x, monster.y, TILE * 2.8).length - 1);
    const pressureNearPlayer = Math.max(0, this.getNearbyMonsters(mons, p.x, p.y, TILE * 3).length - 1);
    const reward = (monster.expReward || 0) + (monster.goldReward || 0) * 0.35;
    const dmgBudget = Math.max(1, (p.atk || 0) + (p.matk || 0) * 0.35);
    const timeToKill = monster.hp / dmgBudget;
    const cautiousMul = this.isSkillHungryBuild(p) && p.maxMp > 0 && p.mp / p.maxMp < 0.25 ? 1.3 : 1;
    const danger = Math.max(0, threatDiff) * 10 + packCount * 12 + pressureNearPlayer * 5 + Math.max(0, (monster.atk || 0) - (p.def || 0)) * 0.65;

    if (this.settings.avoidDangerousTargets && danger * cautiousMul > 72) {
      return { valid: false, reason: 'danger_detected', score: -9999 };
    }

    let score = reward * 1.5;
    score += (1 - hpRatio) * 18;
    score -= pathTiles * 7;
    score -= timeToKill * 4;
    score -= danger * cautiousMul;

    if (this.settings.preferWeaker) score += threatDiff <= 0 ? 14 + Math.max(0, -threatDiff * 1.5) : -threatDiff * 8;
    if (monster === this.target) score += 14;

    if (this.settings.targetPriority === 'nearest') score += Math.max(0, 24 - distTiles * 4);
    else if (this.settings.targetPriority === 'lowestHp') score += (1 - hpRatio) * 24;
    else if (this.settings.targetPriority === 'highestExp') score += (monster.expReward || 0) * 1.2;

    return {
      valid: true,
      monster,
      score,
      dist,
      pathTiles,
      levelDiff: threatDiff,
      packCount,
      danger,
      timeToKill
    };
  },

  chooseBestBotTarget(p, mons) {
    const scored = [];
    for (const m of mons) {
      const info = this.evaluateMonsterTarget(m, p, mons);
      if (info.valid) scored.push(info);
    }
    if (!scored.length) {
      this.noTargetTimer += game.dt || 0;
      return null;
    }
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    if (this.isValidTarget(this.target)) {
      const current = scored.find(s => s.monster === this.target);
      if (current && this.targetLockTimer < 3.5 && current.score >= best.score - 10) return current.monster;
    }

    this.noTargetTimer = 0;
    return best.monster;
  },

  getBestNearbyLoot(p) {
    if (!game.itemDrops || !game.itemDrops.length || p.inventory.length >= getMaxInventory()) return null;
    let best = null;
    let bestScore = -9999;
    for (const drop of game.itemDrops) {
      if (!drop || !drop.item) continue;
      const dist = Math.hypot(drop.x - p.x, drop.y - p.y);
      if (dist > TILE * 5) continue;

      const item = drop.item;
      const distTiles = dist / TILE;
      const rarityScore = BOT_RARITY_SCORE[item.rarity] || 0;
      const potionBonus = item.type === 'potion' && this.getPotionCount(p) < 3 ? 18 : 0;
      const slot = item.type === 'weapon' ? 'weapon' : item.type === 'armor' ? 'armor' : item.type === 'accessory' ? 'accessory' : null;
      const cur = slot ? p.equipment[slot] : null;
      const upgradeScore = slot ? Math.max(0, _botStatScore(item) - _botStatScore(cur)) : 0;
      const highPriority = rarityScore >= BOT_RARITY_SCORE.rare || upgradeScore >= 8;

      let score = rarityScore + potionBonus + upgradeScore * 0.8 - distTiles * 8;
      if (item.type !== 'potion' && rarityScore === 0 && upgradeScore <= 0) score -= 12;
      if (highPriority) score += 14;

      if (score > bestScore) {
        bestScore = score;
        best = drop;
      }
    }
    return bestScore > -5 ? best : null;
  },

  shouldLootNearby(p, mons) {
    if (typeof petBotIntegration === 'function' && petBotIntegration()) return null;
    const bestLoot = this.getBestNearbyLoot(p);
    if (!bestLoot) return null;

    const dist = Math.hypot(bestLoot.x - p.x, bestLoot.y - p.y);
    const nearbyThreats = this.getNearbyMonsters(mons, p.x, p.y, TILE * 2.5).length;
    const rarityScore = BOT_RARITY_SCORE[bestLoot.item.rarity] || 0;
    const urgent = dist < TILE * 1.6 || rarityScore >= BOT_RARITY_SCORE.rare || nearbyThreats === 0;

    if (!this.settings.lootNearbyFirst && !urgent) return null;
    if (nearbyThreats >= 2 && !urgent && p.hp / p.maxHp < 0.7) return null;
    return bestLoot;
  },

  shouldRetreat(p, mons) {
    const hpR = p.maxHp > 0 ? p.hp / p.maxHp : 1;
    const mpR = p.maxMp > 0 ? p.mp / p.maxMp : 1;
    const nearbyThreats = this.getNearbyMonsters(mons, p.x, p.y, TILE * 3);
    const threatScore = this.getThreatScoreAt(p, mons, p.x, p.y);
    const softFull = this.settings.stopWhenInventoryAlmostFull && p.inventory.length >= this.settings.inventorySoftLimit;
    const hardFull = p.inventory.length >= getMaxInventory();
    const inTown = !dungeon.active && map.getTile(Math.floor(p.x / TILE), Math.floor(p.y / TILE)) === 5;

    if ((softFull || hardFull) && inTown) return { retreat: false, hold: true, reason: 'inventory_full' };
    if (softFull || hardFull) return { retreat: true, hold: false, reason: 'inventory_full' };
    if (hpR <= this.getRetreatThreshold(p) / 100) return { retreat: true, hold: false, reason: 'low_hp' };
    if (nearbyThreats.length >= 3 && hpR < 0.65) return { retreat: true, hold: false, reason: 'danger_detected' };
    if (threatScore > 78 && hpR < 0.75) return { retreat: true, hold: false, reason: 'danger_detected' };
    if (this.isSkillHungryBuild(p) && mpR < 0.12 && nearbyThreats.length > 0 && hpR < 0.85) return { retreat: true, hold: false, reason: 'low_mp' };
    if (this.getPotionCount(p) === 0 && hpR < 0.4 && nearbyThreats.length > 0) return { retreat: true, hold: false, reason: 'low_hp' };
    return { retreat: false, hold: false, reason: 'ready' };
  },

  usePotion(p, statKey) {
    if (this._potionCd > 0) return false;
    const idx = p.inventory.findIndex(i => i && i.type === 'potion' && i.stats && i.stats[statKey]);
    if (idx < 0) return false;
    const pot = p.inventory[idx];
    const amt = pot.stats[statKey] || 0;
    if (statKey === 'hp') {
      p.hp = Math.min(p.maxHp, p.hp + amt);
      addDmg(p.x, p.y - TILE, '+' + amt, '#44FF44');
    } else if (statKey === 'mp') {
      p.mp = Math.min(p.maxMp, p.mp + amt);
      addDmg(p.x, p.y - TILE, '+' + amt + ' MP', '#3498db');
    }
    p.inventory.splice(idx, 1);
    if (typeof sfx !== 'undefined' && sfx.itemPickup) sfx.itemPickup();
    this._potionCd = 1;
    return true;
  },

  maybeUseSurvivalTools(p, reason) {
    const hpR = p.maxHp > 0 ? p.hp / p.maxHp : 1;
    const mpR = p.maxMp > 0 ? p.mp / p.maxMp : 1;
    if (hpR < (this.getRetreatThreshold(p) + 10) / 100) this.usePotion(p, 'hp');
    if (this.isSkillHungryBuild(p) && (reason === 'low_mp' || mpR < 0.2)) this.usePotion(p, 'mp');
    if (p.className === 'Priest') {
      const healIdx = p.skills.findIndex(s => s && s.name === 'Heal');
      if (healIdx >= 0) useSkill(p, healIdx);
    } else if (reason === 'danger_detected' && p.className === 'Mage') {
      useSkill(p, 2);
    } else if (reason === 'danger_detected' && p.className === 'Knight') {
      useSkill(p, 1);
    }
  },

  getRetreatDestination(p, mons) {
    const threats = this.getNearbyMonsters(mons, p.x, p.y, TILE * 4).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    if (!threats.length) return _findRandomWalkable(p.x, p.y, 3, 6);

    const nearest = threats[0];
    let best = null;
    let bestScore = -9999;
    for (let i = 0; i < 12; i++) {
      const ang = Math.PI * 2 * i / 12;
      const dist = TILE * (3 + i % 3);
      const tx = p.x + Math.cos(ang) * dist;
      const ty = p.y + Math.sin(ang) * dist;
      if (!_isWalkable(Math.floor(tx / TILE), Math.floor(ty / TILE))) continue;
      const score = Math.hypot(tx - nearest.x, ty - nearest.y) - Math.hypot(tx - p.x, ty - p.y) * 0.4 - this.getThreatScoreAt(p, mons, tx, ty);
      if (score > bestScore) {
        bestScore = score;
        best = { x: tx, y: ty };
      }
    }
    return best || _findRandomWalkable(p.x, p.y, 3, 6);
  },

  findFarmSpot(p, mons) {
    let best = null;
    let bestScore = -9999;
    for (const m of mons) {
      if (!this.isValidTarget(m) || !this.canConsiderTarget(m)) continue;
      const distTiles = Math.hypot(m.x - p.x, m.y - p.y) / TILE;
      if (distTiles > this.getMaxChaseDistance(p) + 4) continue;
      const path = _findPath(p.x, p.y, m.x, m.y, dungeon.active ? 25 : 20);
      if (!path && !(dungeon.active && distTiles < 3)) continue;
      const cluster = this.getNearbyMonsters(mons, m.x, m.y, TILE * 4).length;
      const pressure = this.getThreatScoreAt(p, mons, m.x, m.y);
      const reward = (m.expReward || 0) + (m.goldReward || 0) * 0.25;
      let score = cluster * 12 + reward - distTiles * 4 - pressure * 0.35;
      if (this.settings.preferWeaker) {
        const threatDiff = typeof progressionSystem!=='undefined'&&progressionSystem.getRelativeThreat ? progressionSystem.getRelativeThreat(m,p) : ((m.level || 1) - (p.level || 1)) * 2;
        if (threatDiff <= 0) score += 10;
      }
      if (score > bestScore) {
        const spot = _findRandomWalkable(m.x, m.y, 1, 3) || { x: m.x, y: m.y };
        best = spot;
        bestScore = score;
      }
    }
    return best;
  },

  shouldRepositionFarm(p, mons) {
    if (!mons.length) return false;
    const nearby = this.getNearbyMonsters(mons, p.x, p.y, TILE * 5).length;
    if (nearby >= 2 && this.noTargetTimer < 1.25) return false;
    if (this.state !== 'idle' && this.state !== 'roaming') return false;
    if (this.state === 'roaming' && this.stateTimer < 1.1) return false;

    const spot = this.findFarmSpot(p, mons);
    if (!spot) return false;
    const focusText = 'Farm ' + Math.floor(spot.x / TILE) + ',' + Math.floor(spot.y / TILE);
    if (!this.beginRoam(p, spot, 'reposition_farm', 'Repositioning', focusText)) return false;
    this.farmAnchor = { x: spot.x, y: spot.y };
    return true;
  },

  requestPath(p, tx, ty) {
    this.pathTimer = 0;
    return assignPath(p, tx, ty, dungeon.active ? 25 : 20);
  },

  resetMotionTracking(p) {
    this.stuckTimer = 0;
    this.progressTimer = 0;
    if (p) {
      this.progressX = p.x;
      this.progressY = p.y;
      this.lastX = p.x;
      this.lastY = p.y;
    }
  },

  beginRoam(p, target, reason, status, focusText) {
    if (!target) return false;
    if (!this.requestPath(p, target.x, target.y)) return false;
    this.roamTarget = { x: target.x, y: target.y };
    this.focusText = focusText || this.focusText;
    this.setState('roaming', reason, status, true);
    this.resetMotionTracking(p);
    return true;
  },

  shouldRepath(p, tx, ty) {
    this.pathTimer += game.dt || 0;
    if (this.pathTimer > 1.25) return true;
    if (!p._path || !p._path.length) return true;
    const end = p._path[p._path.length - 1];
    return Math.hypot(end.x - tx, end.y - ty) > TILE * 2.5;
  },

  checkStuck(p, dt, mons) {
    if (!p._path || p._pathIdx >= p._path.length) {
      this.progressTimer = 0;
      this.progressX = p.x;
      this.progressY = p.y;
      this.lastX = p.x;
      this.lastY = p.y;
      return false;
    }

    if (!this.progressTimer) {
      this.progressX = p.x;
      this.progressY = p.y;
      this.progressTimer = 0;
    }

    this.progressTimer += dt;
    this.lastX = p.x;
    this.lastY = p.y;

    if (this.progressTimer < 0.45) return false;

    const moved = Math.hypot(p.x - this.progressX, p.y - this.progressY);
    const expectedProgress = Math.max(6, (p.spd || 1) * TILE * this.progressTimer * 0.2);
    if (moved < expectedProgress) this.stuckTimer += this.progressTimer;
    else this.stuckTimer = 0;

    this.progressX = p.x;
    this.progressY = p.y;
    this.progressTimer = 0;

    if (this.stuckTimer < 2.4) return false;

    this.stuckTimer = 0;
    this.progressTimer = 0;
    if (this.target) this.markTargetBlocked(this.target, 6);
    this.target = null;
    p._path = null;
    p._pathIdx = 0;
    const fallback = this.getRetreatDestination(p, mons) || this.findFarmSpot(p, mons) || _findRandomWalkable(p.x, p.y, 2, 6);
    if (fallback && this.beginRoam(p, fallback, 'path_stuck', 'Unsticking', 'Unsticking')) {
      this.farmAnchor = null;
    } else {
      this.setState('idle', 'path_stuck', 'Stuck', true);
    }
    p.state = 'idle';
    return true;
  },

  updateBotDecisionLayer(dt, p, mons) {
    const survival = this.shouldRetreat(p, mons);
    if (survival.hold) {
      if (this.state === 'idle' && this.stopReason === survival.reason && !p._path) return true;
      this.target = null;
      this.roamTarget = null;
      this.lootTarget = null;
      p._path = null;
      p._pathIdx = 0;
      p.state = 'idle';
      this.setState('idle', survival.reason, this.getReasonLabel(survival.reason), true);
      this.focusText = 'Town';
      return true;
    }

    if (survival.retreat) {
      if (this.state === 'retreating' && this.stopReason === survival.reason) return false;
      this.target = null;
      this.lootTarget = null;
      this.retreatTarget = dungeon.active ? this.getRetreatDestination(p, mons) : null;
      p._path = null;
      p._pathIdx = 0;
      this.maybeUseSurvivalTools(p, survival.reason);
      this.setState('retreating', survival.reason, this.getReasonLabel(survival.reason), true);
      this.focusText = survival.reason === 'inventory_full' ? 'Town' : 'Safe point';
      this.resetMotionTracking(p);
      return true;
    }

    if (this.target && this.isValidTarget(this.target)) {
      const info = this.evaluateMonsterTarget(this.target, p, mons);
      if (!info.valid) {
        this.markTargetBlocked(this.target, info.reason === 'target_unreachable' ? 8 : 4);
        this.target = null;
        p._path = null;
        p._pathIdx = 0;
        this.setState('idle', info.reason, this.getReasonLabel(info.reason), true);
      }
    }

    const loot = this.shouldLootNearby(p, mons);
    if (loot && this.state !== 'combat' && (this.state !== 'looting' || this.lootTarget !== loot)) {
      this.target = null;
      this.lootTarget = loot;
      p._path = null;
      p._pathIdx = 0;
      this.focusText = _botItemShortName(loot.item);
      this.setState('looting', 'loot_nearby', 'Looting ' + _botItemShortName(loot.item), true);
      return true;
    }

    if (!this.target && this.shouldRepositionFarm(p, mons)) return true;
    if (!this.target && this.state === 'idle' && this.noTargetTimer > 1.5) {
      this.stopReason = 'no_valid_targets';
      this.statusText = this.getReasonLabel('no_valid_targets');
    }
    return false;
  },

  update(dt, p, mons) {
    this.applySettings();
    if (!p || p.isDead) return;
    mons = Array.isArray(mons) ? mons : [];
    this.stateTimer += dt;
    this.targetLockTimer += dt;
    this.farmTimer += dt;
    this.decisionTimer += dt;
    if (this._potionCd > 0) this._potionCd = Math.max(0, this._potionCd - dt);

    if (dungeon.active) {
      this._debugTimer -= dt;
      if (this._debugTimer <= 0) {
        this._debugTimer = 2;
        const alive = mons.filter(m => !m.isDead);
        console.log('BOT STATE:', this.state, 'targets:', alive.length, 'reason:', this.stopReason, 'focus:', this.getFocusLabel());
      }
    }

    if (this.state === 'approaching' || this.state === 'combat' || this.state === 'roaming' || this.state === 'retreating') {
      if (this.checkStuck(p, dt, mons)) return;
    } else {
      this.lastX = p.x;
      this.lastY = p.y;
    }

    if (this.updateBotDecisionLayer(dt, p, mons)) return;

    switch (this.state) {
      case 'idle': {
        this.stuckTimer = 0;
        this.statusText = this.noTargetTimer > 1.5 ? this.getReasonLabel('no_valid_targets') : 'Scanning';
        this.focusText = this.farmAnchor ? 'Farm anchor' : 'Scanning';

        if (!dungeon.active && typeof worldMap !== 'undefined' && worldMap.botCheckZoneTravel) {
          const zt = worldMap.botCheckZoneTravel(p);
          if (zt && !p._path) {
            if (this.beginRoam(p, zt, 'reposition_farm', 'Travelling', 'Portal')) break;
            this.setState('idle', 'target_unreachable', this.getReasonLabel('target_unreachable'), true);
            break;
          }
        }

        if (!dungeon.active) {
          const inTown = map.getTile(Math.floor(p.x / TILE), Math.floor(p.y / TILE)) === 5;
          if (inTown) {
            if (typeof craftingSystem !== 'undefined' && craftingSystem.botAutoCraft) craftingSystem.botAutoCraft(p);
            if (typeof enchantSystem !== 'undefined' && enchantSystem.botAutoEnchant) enchantSystem.botAutoEnchant(p);
            if (typeof gachaSystem !== 'undefined' && gachaSystem.botAutoSummon) gachaSystem.botAutoSummon(p);
          }
        }

        if (dungeon.active) {
          const nav = this._dungeonNav(p, mons);
          if (nav) break;
        }

        this.target = this.chooseBestBotTarget(p, mons);
        if (this.target) {
          this.focusText = (this.target.type || 'monster') + ' Lv.' + (this.target.level || '?');
          this.targetLockTimer = 0;
          this.farmAnchor = { x: this.target.x, y: this.target.y };
          if (this.requestPath(p, this.target.x, this.target.y)) {
            this.setState('approaching', 'ready', 'Approaching', true);
            this.resetMotionTracking(p);
            break;
          }
          this.markTargetBlocked(this.target, 8);
          this.target = null;
          this.setState('idle', 'target_unreachable', this.getReasonLabel('target_unreachable'), true);
        }

        if (!this.shouldRepositionFarm(p, mons)) {
          const dest = _findRandomWalkable(p.x, p.y, 2, 5);
          if (dest) {
            if (!this.beginRoam(p, dest, 'no_valid_targets', 'Exploring', 'Exploring')) {
              this.setState('idle', 'no_valid_targets', this.getReasonLabel('no_valid_targets'), true);
            }
          }
        }
        break;
      }

      case 'roaming': {
        if (!this.roamTarget) {
          this.setState('idle', 'ready', 'Scanning', true);
          break;
        }

        const target = this.chooseBestBotTarget(p, mons);
        if (target) {
          this.target = target;
          this.focusText = (target.type || 'monster') + ' Lv.' + (target.level || '?');
          this.targetLockTimer = 0;
          if (this.requestPath(p, target.x, target.y)) {
            this.setState('approaching', 'ready', 'Approaching', true);
            this.resetMotionTracking(p);
            break;
          }
          this.markTargetBlocked(target, 8);
          this.target = null;
        }

        if (dungeon.active) {
          const nav = this._dungeonNav(p, mons);
          if (nav) break;
        }

        const arrived = followPath(p, dt);
        p.state = arrived ? 'idle' : 'walking';
        this.statusText = this.getReasonLabel(this.stopReason || 'reposition_farm');
        if (arrived) this.setState('idle', 'ready', 'Scanning', true);
        break;
      }

      case 'approaching': {
        if (!this.isValidTarget(this.target)) {
          this.target = null;
          this.setState('idle', 'target_invalid', this.getReasonLabel('target_invalid'), true);
          p._path = null;
          break;
        }

        const dist = Math.hypot(this.target.x - p.x, this.target.y - p.y);
        if (dist / TILE > this.getMaxChaseDistance(p) + 1) {
          this.markTargetBlocked(this.target, 8);
          this.target = null;
          this.setState('idle', 'target_unreachable', this.getReasonLabel('target_unreachable'), true);
          p._path = null;
          break;
        }

        if (dist <= p.attackRange) {
          this.setState('combat', 'ready', 'Combat', true);
          p.state = 'combat';
          this.stuckTimer = 0;
          break;
        }

        if (this.shouldRepath(p, this.target.x, this.target.y) && !this.requestPath(p, this.target.x, this.target.y)) {
          this.markTargetBlocked(this.target, 8);
          this.target = null;
          this.setState('idle', 'target_unreachable', this.getReasonLabel('target_unreachable'), true);
          p._path = null;
          break;
        }

        followPath(p, dt);
        p.state = 'walking';
        this.statusText = 'Approaching';

        if (p.className === 'Mage' && dist < TILE * 2) {
          const dx = p.x - this.target.x;
          const dy = p.y - this.target.y;
          const d = Math.hypot(dx, dy);
          if (d > 0) {
            const s = p.spd * TILE * dt;
            const nx = p.x + dx / d * s;
            const ny = p.y + dy / d * s;
            if (_isWalkable(Math.floor(nx / TILE), Math.floor(ny / TILE))) {
              p.x = nx;
              p.y = ny;
            }
          }
        }
        break;
      }

      case 'combat': {
        if (!this.isValidTarget(this.target)) {
          this.target = null;
          this.lootTarget = this.shouldLootNearby(p, mons);
          if (this.lootTarget) this.setState('looting', 'loot_nearby', 'Looting', true);
          else this.setState('idle', 'ready', 'Scanning', true);
          p.state = 'idle';
          p._path = null;
          break;
        }

        const dist = Math.hypot(this.target.x - p.x, this.target.y - p.y);
        if (dist > p.attackRange * 1.6) {
          this.setState('approaching', 'ready', 'Approaching', true);
          this.requestPath(p, this.target.x, this.target.y);
          break;
        }

        if (p.className === 'Ranger' && dist < p.attackRange * 0.75) {
          const dx = p.x - this.target.x;
          const dy = p.y - this.target.y;
          const d = Math.hypot(dx, dy);
          if (d > 0) {
            const s = p.spd * TILE * dt;
            const nx = p.x + dx / d * s;
            const ny = p.y + dy / d * s;
            if (_isWalkable(Math.floor(nx / TILE), Math.floor(ny / TILE))) {
              p.x = nx;
              p.y = ny;
            }
          }
        }

        this.statusText = 'Combat';
        this.focusText = (this.target.type || 'monster') + ' Lv.' + (this.target.level || '?');
        if (this.settings.autoSkill) this.autoSkills(p, mons);
        if (!dungeon.active && typeof questBotLogic === 'function') questBotLogic();
        if (!dungeon.active && typeof partyBotLogic === 'function') partyBotLogic();
        break;
      }

      case 'looting': {
        const targetLoot = this.lootTarget && game.itemDrops.includes(this.lootTarget) ? this.lootTarget : this.getBestNearbyLoot(p);
        if (!targetLoot) {
          this.lootTarget = null;
          this.setState('idle', 'ready', 'Scanning', true);
          break;
        }

        this.lootTarget = targetLoot;
        const dist = Math.hypot(targetLoot.x - p.x, targetLoot.y - p.y);
        this.statusText = 'Looting';
        this.focusText = _botItemShortName(targetLoot.item);

        if (dist < TILE) {
          if (p.inventory.length < getMaxInventory()) {
            p.inventory.push(targetLoot.item);
            autoEquip(p, targetLoot.item);
            addLog('Picked up ' + targetLoot.item.name, '#FFDD44');
            sfx.itemPickup();
            if (typeof questSystem !== 'undefined') questSystem.onItemPickup(targetLoot.item);
          }
          const idx = game.itemDrops.indexOf(targetLoot);
          if (idx >= 0) game.itemDrops.splice(idx, 1);
          this.lootTarget = null;
          p._path = null;
          p._pathIdx = 0;
          this.setState('idle', 'ready', 'Scanning', true);
        } else {
          if (!p._path || p._pathIdx >= p._path.length) this.requestPath(p, targetLoot.x, targetLoot.y);
          followPath(p, dt);
          p.state = 'walking';
        }
        break;
      }

      case 'retreating': {
        this.maybeUseSurvivalTools(p, this.stopReason);
        if (dungeon.active) {
          const healthy = p.hp / p.maxHp > 0.75 && (!this.isSkillHungryBuild(p) || p.mp / p.maxMp > 0.35);
          if (healthy && this.getThreatScoreAt(p, mons, p.x, p.y) < 20 && this.stopReason !== 'inventory_full') {
            this.retreatTarget = null;
            this.setState('idle', 'ready', 'Scanning', true);
            p._path = null;
            break;
          }
          if (!this.retreatTarget || this.stateTimer > 1.5) this.retreatTarget = this.getRetreatDestination(p, mons);
          if (this.retreatTarget) {
            if (!p._path || p._pathIdx >= p._path.length) this.requestPath(p, this.retreatTarget.x, this.retreatTarget.y);
            followPath(p, dt);
            p.state = 'walking';
          } else {
            p.state = 'idle';
          }
          break;
        }

        const inTown = map.getTile(Math.floor(p.x / TILE), Math.floor(p.y / TILE)) === 5;
        if (this.stopReason === 'inventory_full' && inTown) {
          // Try auto-sell first
          if (game.settings.autoSellItems && typeof botAutoSell === 'function' && botAutoSell(p)) {
            this.focusText = 'Selling';
            this.statusText = 'Selling items';
            break; // stay in retreating state, sell one per tick
          }
          this.target = null;
          this.roamTarget = null;
          this.retreatTarget = null;
          p._path = null;
          p._pathIdx = 0;
          p.state = 'idle';
          // If still full after selling, hold in town; otherwise resume
          if (p.inventory.length >= this.settings.inventorySoftLimit) {
            this.setState('idle', 'inventory_full', this.getReasonLabel('inventory_full'), true);
            this.focusText = 'Town';
          } else {
            this.setState('idle', 'ready', 'Scanning', true);
          }
          break;
        }

        if (this.stopReason === 'inventory_full') {
          const tcx = Math.floor(MAP_W / 2) * TILE + TILE / 2;
          const tcy = Math.floor(MAP_H / 2) * TILE + TILE / 2;
          this.statusText = this.getReasonLabel('inventory_full');
          this.focusText = 'Town';
          if (!p._path || p._pathIdx >= p._path.length) this.requestPath(p, tcx, tcy);
          followPath(p, dt);
          p.state = 'walking';
          break;
        }

        const townTarget = townBotLogic(p);
        if (townTarget) {
          this.statusText = this.stopReason === 'inventory_full' ? this.getReasonLabel('inventory_full') : 'Retreating';
          this.focusText = 'Town';
          if (!p._path || p._pathIdx >= p._path.length) this.requestPath(p, townTarget.x, townTarget.y);
          followPath(p, dt);
          p.state = 'walking';
        } else {
          const hpR = p.hp / p.maxHp;
          const mpSafe = !this.isSkillHungryBuild(p) || p.mp / p.maxMp > 0.45;
          if (hpR > 0.82 && mpSafe) {
            this.retreatTarget = null;
            this.setState('idle', 'ready', 'Scanning', true);
            p._path = null;
          } else {
            const tcx = Math.floor(MAP_W / 2) * TILE + TILE / 2;
            const tcy = Math.floor(MAP_H / 2) * TILE + TILE / 2;
            if (!p._path || p._pathIdx >= p._path.length) this.requestPath(p, tcx, tcy);
            followPath(p, dt);
            p.state = 'walking';
          }
        }
        break;
      }
    }
  },

  // Dungeon navigation: walk to stairs or exit when floor is clear
  _dungeonNav(p, mons) {
    const alive = mons.filter(m => !m.isDead);
    if (alive.length > 0) return false;

    if (dungeon.stairsPos && dungeon.floor < dungeon.maxFloor) {
      const sd = Math.hypot(p.x - dungeon.stairsPos.x, p.y - dungeon.stairsPos.y);
      if (sd < TILE * 1.0 && dungeon.transitionCooldown <= 0) {
        console.log('BOT: auto-descending stairs on floor', dungeon.floor);
        dungeon.nextFloor();
        return true;
      }
      if ((!p._path || p._pathIdx >= p._path.length) && !this.beginRoam(p, dungeon.stairsPos, 'reposition_farm', 'Moving to stairs', 'Stairs')) {
        this.setState('idle', 'target_unreachable', this.getReasonLabel('target_unreachable'), true);
        return false;
      }
      followPath(p, game.dt);
      p.state = 'walking';
      this.state = 'roaming';
      this.roamTarget = { x: dungeon.stairsPos.x, y: dungeon.stairsPos.y };
      this.stopReason = 'reposition_farm';
      this.statusText = 'Moving to stairs';
      this.focusText = 'Stairs';
      return true;
    }

    if (dungeon.exitPos) {
      const ed = Math.hypot(p.x - dungeon.exitPos.x, p.y - dungeon.exitPos.y);
      if (ed < TILE * 1.0 && dungeon.transitionCooldown <= 0) {
        console.log('BOT: auto-exiting dungeon');
        dungeon.exitDungeon();
        return true;
      }
      if ((!p._path || p._pathIdx >= p._path.length) && !this.beginRoam(p, dungeon.exitPos, 'reposition_farm', 'Moving to exit', 'Exit')) {
        this.setState('idle', 'target_unreachable', this.getReasonLabel('target_unreachable'), true);
        return false;
      }
      followPath(p, game.dt);
      p.state = 'walking';
      this.state = 'roaming';
      this.roamTarget = { x: dungeon.exitPos.x, y: dungeon.exitPos.y };
      this.stopReason = 'reposition_farm';
      this.statusText = 'Moving to exit';
      this.focusText = 'Exit';
      return true;
    }
    return false;
  },

  autoSkills(p, mons) {
    const hpR = p.hp / p.maxHp;
    const mpR = p.maxMp > 0 ? p.mp / p.maxMp : 1;
    const nearby = mons.filter(m => m.entityType === 'monster' && !m.isDead && Math.hypot(m.x - p.x, m.y - p.y) < TILE * 5).length;
    if (p.className === 'Knight') {
      if (hpR < 0.65) useSkill(p, 1);
      if (nearby >= 2) useSkill(p, 0);
      if (nearby >= 3) {
        useSkill(p, 3);
        useSkill(p, 2);
      }
    } else if (p.className === 'Mage') {
      if (mpR < 0.15) return;
      if (nearby >= 3) useSkill(p, 3);
      if (nearby >= 2) useSkill(p, 1);
      useSkill(p, 0);
      if (hpR < 0.5) useSkill(p, 2);
    } else if (p.className === 'Ranger') {
      useSkill(p, 0);
      useSkill(p, 1);
      if (hpR < 0.6) useSkill(p, 2);
      if (this.target) useSkill(p, 3);
    } else if (p.className === 'Priest') {
      if (hpR < 0.8) useSkill(p, 1);
      useSkill(p, 2);
      useSkill(p, 0);
      if (nearby >= 2) useSkill(p, 3);
    }
  }
};

botAI.applySettings();

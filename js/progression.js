// ============================================================
// PROGRESSION — Gold-driven power growth with level gating
// ============================================================

const progressionSystem = {
  version: 2,
  levelGrowthScale: 0.12,
  legacyStatPointGold: 60,
  legacySkillPointGold: 140,

  getAccessTier(level) {
    const lv = level || 1;
    if (lv >= 30) return 4;
    if (lv >= 20) return 3;
    if (lv >= 10) return 2;
    if (lv >= 5) return 1;
    return 0;
  },

  getAccessLabel(level) {
    return ['Novice', 'Adventurer', 'Veteran', 'Elite', 'Mythic'][this.getAccessTier(level)] || 'Novice';
  },

  getLevelRoleSummary(level) {
    const lv = level || 1;
    return 'Access Lv.' + lv + ' unlocks zones, dungeons, systems, and training caps.';
  },

  getLevelUnlockHint(level) {
    const lv = level || 1;
    if (lv < 5) return 'Lv.5 unlocks dungeon access and a higher training cap.';
    if (lv < 10) return 'Lv.10 unlocks the next training tier and stronger skill caps.';
    if (lv < 20) return 'Lv.20 unlocks late-game classes and higher mastery caps.';
    if (lv < 30) return 'Lv.30 unlocks mythic training caps.';
    return 'Max access tier reached. Gold is now the main power lever.';
  },

  getScaledGrowth(level, growthValue) {
    return Math.round(Math.max(0, (level || 1) - 1) * (growthValue || 0) * this.levelGrowthScale * 100) / 100;
  },

  getBaseStats(className, level) {
    const cd = CLASS_DATA[className];
    if (!cd) return null;
    const g = cd.growth || {};
    return {
      maxHp: cd.hp + this.getScaledGrowth(level, g.hp),
      maxMp: cd.mp + this.getScaledGrowth(level, g.mp),
      atk: cd.atk + this.getScaledGrowth(level, g.atk),
      def: cd.def + this.getScaledGrowth(level, g.def),
      spd: cd.spd + this.getScaledGrowth(level, g.spd),
      crit: cd.crit || 0.05
    };
  },

  getStatPointTotal(level) {
    return 12 + (level || 1) * 4 + (level >= 10 ? 6 : 0) + (level >= 20 ? 14 : 0) + (level >= 30 ? 24 : 0);
  },

  getStatPointSoftCap(level) {
    return Math.floor(this.getStatPointTotal(level) * 0.7);
  },

  getStatPointPerStatCap(level) {
    return Math.max(6, Math.floor(this.getStatPointTotal(level) / 3));
  },

  getStatPointCost(totalOwned) {
    const owned = Math.max(0, totalOwned || 0);
    let cost = 28 * Math.pow(1.16, owned);
    if (owned >= 20) cost *= 1 + (owned - 19) * 0.035;
    return Math.max(25, Math.round(cost));
  },

  getSkillCap(p) {
    const maxLv = (typeof SKILL_LEVEL_MAX !== 'undefined') ? SKILL_LEVEL_MAX : 10;
    const levelCap = 1 + Math.floor(((p && p.level) || 1) / 5);
    const jobCap = Math.floor(((p && p.jobLevel) || 1) / 10);
    return Math.max(1, Math.min(maxLv, levelCap + jobCap));
  },

  getSkillUpgradeCost(p, skillIdx, nextLevel) {
    const sk = p && p.skills ? p.skills[skillIdx] : null;
    let cost = 90 + nextLevel * nextLevel * 55 + nextLevel * nextLevel * nextLevel * 6;
    if (sk && sk.reqLv && sk.reqLv >= 10) cost = Math.round(cost * 1.18);
    return Math.round(cost);
  },

  getSkillResetCost(p) {
    const totalSpent = (p && p.skillLevels ? p.skillLevels : [0, 0, 0, 0]).reduce((sum, lv) => sum + lv, 0);
    return Math.max(180, 120 + totalSpent * 90);
  },

  getAutoSpendReserve(p) {
    return 140 + ((p && p.level) || 1) * 35;
  },

  getPowerRating(ent) {
    if (!ent) return 0;
    return (ent.maxHp || ent.hp || 0) * 0.05 +
      (ent.maxMp || ent.mp || 0) * 0.02 +
      (ent.atk || 0) * 2.8 +
      (ent.def || 0) * 2.2 +
      (ent.spd || 0) * 24 +
      (ent.crit || 0) * 130 +
      (ent.matk || 0) * 1.8;
  },

  getRelativeThreat(attacker, defender) {
    return (this.getPowerRating(attacker) - this.getPowerRating(defender)) / 18;
  },

  getBossHpMultiplier(kind) {
    switch (kind) {
      case 'dragon': return 4;
      case 'dungeonBoss': return 4.5;
      case 'worldBoss': return 8;
      default: return 1;
    }
  },

  getBossGoldMultiplier(kind) {
    switch (kind) {
      case 'dragon': return 2.5;
      case 'dungeonBoss': return 1.8;
      default: return 1;
    }
  },

  migrateLegacySave(data) {
    if (!data || !data.player) return { changed: false, bonusGold: 0 };
    if (data.progression && data.progression.version >= this.version) return { changed: false, bonusGold: 0 };

    let bonusGold = 0;
    const migrated = { changed: false, bonusGold: 0, statPoints: 0, skillPoints: 0 };

    if (data.player.skillPoints > 0) {
      migrated.skillPoints = data.player.skillPoints;
      bonusGold += data.player.skillPoints * this.legacySkillPointGold;
      data.player.skillPoints = 0;
      migrated.changed = true;
    }

    if (data.statPoints && data.statPoints.unspent > 0) {
      migrated.statPoints = data.statPoints.unspent;
      bonusGold += data.statPoints.unspent * this.legacyStatPointGold;
      data.statPoints.unspent = 0;
      migrated.changed = true;
    }

    if (bonusGold > 0) {
      data.player.gold = (data.player.gold || 0) + bonusGold;
      migrated.bonusGold = bonusGold;
    }

    data.progression = {
      version: this.version,
      legacyMigrated: migrated.changed,
      migrationBonusGold: bonusGold
    };

    return migrated;
  }
};

window.progressionSystem = progressionSystem;

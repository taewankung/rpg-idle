// ============================================================
// OFFLINE EXPEDITION — Lightweight real-time idle expeditions
// ============================================================

const offlineExpeditionSystem = {
  panelOpen: false,
  selectedExpeditionId: 'short_patrol',
  activeRun: null,
  pendingSummary: null,

  expeditions: [
    {
      id: 'short_patrol',
      name: 'Short Patrol',
      zone: 'Town Outskirts',
      minLevel: 1,
      durationSec: 10 * 60,
      rewardBias: 'gold',
      riskLevel: 0,
      materialTable: ['wood', 'leather'],
      flavorSuccess: 'The patrol route stayed quiet, but your pack came back heavier.',
      flavorFail: 'The route was interrupted by trouble and the team returned early.'
    },
    {
      id: 'forest_hunt',
      name: 'Forest Hunt',
      zone: 'Green Forest',
      minLevel: 4,
      durationSec: 20 * 60,
      rewardBias: 'exp',
      riskLevel: 1,
      materialTable: ['wood', 'leather', 'iron_ore'],
      flavorSuccess: 'Fresh tracks led to an efficient hunt through the forest edge.',
      flavorFail: 'The hunt scattered in bad weather and only scraps made it back.'
    },
    {
      id: 'desert_supply_run',
      name: 'Desert Supply Run',
      zone: 'Desert Wasteland',
      minLevel: 10,
      durationSec: 30 * 60,
      rewardBias: 'material',
      riskLevel: 2,
      materialTable: ['iron_ore', 'fire_gem', 'lightning_gem'],
      flavorSuccess: 'Merchants paid well for a guarded run across the dunes.',
      flavorFail: 'A sandstorm forced the caravan to abandon part of the haul.'
    },
    {
      id: 'frozen_relic_search',
      name: 'Frozen Relic Search',
      zone: 'Frozen Peaks',
      minLevel: 18,
      durationSec: 40 * 60,
      rewardBias: 'material',
      riskLevel: 2,
      materialTable: ['ice_gem', 'shield_gem', 'soul_gem'],
      flavorSuccess: 'Buried caches beneath the ice yielded relic fragments and coin.',
      flavorFail: 'The search party lost the trail beneath drifting snow.'
    },
    {
      id: 'risky_boss_trail',
      name: 'Risky Boss Trail',
      zone: 'Unknown Lair',
      minLevel: 24,
      durationSec: 45 * 60,
      rewardBias: 'balanced',
      riskLevel: 3,
      materialTable: ['soul_gem', 'fire_gem', 'ice_gem'],
      flavorSuccess: 'The trail ended in a brutal clash, but valuable spoils survived.',
      flavorFail: 'The trail went cold after a dangerous encounter forced a retreat.'
    }
  ],

  reset() {
    this.panelOpen = false;
    this.selectedExpeditionId = this.expeditions[0].id;
    this.activeRun = null;
    this.pendingSummary = null;
  },

  init() {
    this.reset();
  },

  save() {
    return {
      selectedExpeditionId: this.selectedExpeditionId,
      activeRun: this.activeRun ? {
        id: this.activeRun.id,
        startedAt: this.activeRun.startedAt,
        expectedEndAt: this.activeRun.expectedEndAt
      } : null,
      pendingSummary: this.pendingSummary ? {
        expeditionId: this.pendingSummary.expeditionId,
        name: this.pendingSummary.name,
        zone: this.pendingSummary.zone,
        success: !!this.pendingSummary.success,
        riskLevel: this.pendingSummary.riskLevel || 0,
        elapsedSec: this.pendingSummary.elapsedSec || 0,
        gold: this.pendingSummary.gold || 0,
        exp: this.pendingSummary.exp || 0,
        items: (this.pendingSummary.items || []).map(item => item ? { ...item } : null).filter(Boolean),
        materials: (this.pendingSummary.materials || []).map(item => item ? { ...item } : null).filter(Boolean),
        flavorText: this.pendingSummary.flavorText || '',
        resolvedAt: this.pendingSummary.resolvedAt || Date.now()
      } : null
    };
  },

  load(data) {
    this.reset();
    if (!data || typeof data !== 'object') return;

    if (typeof data.selectedExpeditionId === 'string' && this.getDefinition(data.selectedExpeditionId)) {
      this.selectedExpeditionId = data.selectedExpeditionId;
    }

    if (data.activeRun && this.getDefinition(data.activeRun.id)) {
      this.activeRun = {
        id: data.activeRun.id,
        startedAt: Number(data.activeRun.startedAt) || Date.now(),
        expectedEndAt: Number(data.activeRun.expectedEndAt) || Date.now()
      };
    }

    if (data.pendingSummary && this.getDefinition(data.pendingSummary.expeditionId)) {
      this.pendingSummary = {
        expeditionId: data.pendingSummary.expeditionId,
        name: data.pendingSummary.name || this.getDefinition(data.pendingSummary.expeditionId).name,
        zone: data.pendingSummary.zone || this.getDefinition(data.pendingSummary.expeditionId).zone,
        success: !!data.pendingSummary.success,
        riskLevel: data.pendingSummary.riskLevel || 0,
        elapsedSec: Number(data.pendingSummary.elapsedSec) || 0,
        gold: Number(data.pendingSummary.gold) || 0,
        exp: Number(data.pendingSummary.exp) || 0,
        items: Array.isArray(data.pendingSummary.items) ? data.pendingSummary.items.map(item => item ? { ...item } : null).filter(Boolean) : [],
        materials: Array.isArray(data.pendingSummary.materials) ? data.pendingSummary.materials.map(item => item ? { ...item } : null).filter(Boolean) : [],
        flavorText: data.pendingSummary.flavorText || '',
        resolvedAt: Number(data.pendingSummary.resolvedAt) || Date.now()
      };
    }
  },

  update() {
    if (!this.activeRun || this.pendingSummary) return;
    this.resolveOfflineExpedition(Date.now());
  },

  getPlayer() {
    return typeof game !== 'undefined' ? game.player : null;
  },

  getDefinition(id) {
    return this.expeditions.find(exp => exp.id === id) || null;
  },

  getSelectedDefinition() {
    return this.getDefinition(this.selectedExpeditionId) || this.expeditions[0];
  },

  getAvailableExpeditions() {
    const p = this.getPlayer();
    return this.expeditions.map(exp => ({
      ...exp,
      unlocked: !!p && p.level >= exp.minLevel,
      active: !!this.activeRun && this.activeRun.id === exp.id,
      selected: this.selectedExpeditionId === exp.id
    }));
  },

  canStartExpedition(id) {
    const p = this.getPlayer();
    const def = this.getDefinition(id);
    if (!p) return { ok: false, reason: 'No active player.', expedition: def };
    if (!def) return { ok: false, reason: 'Unknown expedition.', expedition: null };
    if (this.pendingSummary) return { ok: false, reason: 'Claim the previous expedition first.', expedition: def };
    if (this.activeRun) return { ok: false, reason: 'Another expedition is already in progress.', expedition: def };
    if (p.level < def.minLevel) return { ok: false, reason: 'Requires Lv.' + def.minLevel + '.', expedition: def };
    return { ok: true, reason: '', expedition: def };
  },

  startExpedition(id) {
    const check = this.canStartExpedition(id);
    if (!check.ok) {
      if (typeof addNotification === 'function') addNotification(check.reason, '#ff6666');
      return false;
    }

    const def = check.expedition;
    const now = Date.now();
    this.selectedExpeditionId = def.id;
    this.activeRun = {
      id: def.id,
      startedAt: now,
      expectedEndAt: now + def.durationSec * 1000
    };
    this.pendingSummary = null;

    if (typeof addNotification === 'function') addNotification('Started expedition: ' + def.name, '#5dade2');
    if (typeof addLog === 'function') addLog('Expedition started: ' + def.name, '#5dade2');
    if (typeof saveGame === 'function') saveGame();
    return true;
  },

  cancelExpedition() {
    if (!this.activeRun) {
      if (typeof addNotification === 'function') addNotification('No expedition to cancel.', '#ff6666');
      return false;
    }

    const now = Date.now();
    if (now >= this.activeRun.expectedEndAt) {
      this.resolveOfflineExpedition(now);
      return false;
    }

    const def = this.getDefinition(this.activeRun.id);
    this.activeRun = null;
    if (typeof addNotification === 'function') addNotification('Canceled expedition: ' + (def ? def.name : 'Unknown'), '#f39c12');
    if (typeof addLog === 'function') addLog('Expedition canceled.', '#f39c12');
    if (typeof saveGame === 'function') saveGame();
    return true;
  },

  resolveOfflineExpedition(now, skipSave) {
    const ts = typeof now === 'number' ? now : Date.now();
    if (!this.activeRun || this.pendingSummary) return null;
    if (ts < this.activeRun.expectedEndAt) return null;

    const def = this.getDefinition(this.activeRun.id);
    if (!def) {
      this.activeRun = null;
      return null;
    }

    const actualElapsedSec = Math.max(0, Math.floor((ts - this.activeRun.startedAt) / 1000));
    const summary = this._buildSummary(def, actualElapsedSec);

    this.activeRun = null;
    this.pendingSummary = summary;
    this.panelOpen = true;

    if (typeof addNotification === 'function') {
      addNotification(def.name + ' finished!', summary.success ? '#2ecc71' : '#e67e22');
    }
    if (typeof addLog === 'function') {
      addLog(def.name + ' resolved: ' + (summary.success ? 'Success' : 'Failed'), summary.success ? '#2ecc71' : '#e67e22');
    }
    if (!skipSave && typeof saveGame === 'function') saveGame();
    return summary;
  },

  _buildSummary(def, actualElapsedSec) {
    const p = this.getPlayer();
    const level = p ? p.level : def.minLevel;
    const durationMinutes = def.durationSec / 60;
    const riskMult = 1 + def.riskLevel * 0.22;
    const overLevel = Math.max(0, level - def.minLevel);
    const successChance = Math.max(0.58, Math.min(0.97, 0.9 - def.riskLevel * 0.09 + overLevel * 0.015));
    const success = Math.random() < successChance;

    const bias = this._getBiasMultipliers(def.rewardBias);
    let gold = Math.round(level * durationMinutes * 6 * riskMult * bias.gold);
    let exp = Math.round(level * durationMinutes * 5 * riskMult * bias.exp);

    if (!success) {
      gold = Math.max(10, Math.floor(gold * 0.35));
      exp = Math.max(5, Math.floor(exp * 0.35));
    }

    const materials = success ? this._rollMaterials(def, level, bias.material) : [];
    const items = success ? this._rollItems(def, level, bias.item) : [];

    return {
      expeditionId: def.id,
      name: def.name,
      zone: def.zone,
      success,
      riskLevel: def.riskLevel,
      elapsedSec: actualElapsedSec,
      gold,
      exp,
      materials,
      items,
      flavorText: success ? def.flavorSuccess : def.flavorFail,
      resolvedAt: Date.now()
    };
  },

  _getBiasMultipliers(bias) {
    switch (bias) {
      case 'gold':
        return { gold: 1.25, exp: 0.8, material: 0.9, item: 0.9 };
      case 'exp':
        return { gold: 0.8, exp: 1.25, material: 0.9, item: 0.9 };
      case 'material':
        return { gold: 0.75, exp: 0.85, material: 1.45, item: 1.0 };
      default:
        return { gold: 1.0, exp: 1.0, material: 1.0, item: 1.15 };
    }
  },

  _rollMaterials(def, level, materialMult) {
    if (typeof craftingSystem === 'undefined' || !craftingSystem.materials) return [];
    const keys = Array.isArray(def.materialTable) ? def.materialTable.filter(key => craftingSystem.materials[key]) : [];
    if (!keys.length) return [];

    const count = Math.max(1, Math.round(def.durationSec / 1200 * materialMult) + ri(0, def.riskLevel));
    const materials = [];
    for (let i = 0; i < count; i++) {
      const matKey = keys[ri(0, keys.length - 1)];
      const defn = craftingSystem.materials[matKey];
      if (!defn) continue;
      materials.push({
        name: defn.name,
        type: 'material',
        rarity: defn.rarity,
        stats: {},
        level: Math.max(1, Math.floor(level / 4)),
        value: defn.value,
        matKey: matKey
      });
    }
    return materials;
  },

  _rollItems(def, level, itemMult) {
    const chance = 0.04 + def.riskLevel * 0.08 + (itemMult - 1) * 0.05;
    if (Math.random() >= chance || typeof genItem !== 'function') return [];

    const items = [];
    const first = genItem(level + def.riskLevel * 2);
    if (first) items.push(first);
    if (def.riskLevel >= 3 && Math.random() < 0.18) {
      const second = genItem(level + 3);
      if (second) items.push(second);
    }
    return items;
  },

  claimSummary() {
    const p = this.getPlayer();
    const summary = this.pendingSummary;
    if (!p || !summary) return false;

    p.gold += summary.gold;
    if (typeof gainExp === 'function') gainExp(p, summary.exp);

    let overflowGold = 0;
    const rewards = [].concat(summary.materials || [], summary.items || []);
    for (const item of rewards) {
      if (!item) continue;
      if (p.inventory.length < 20) {
        p.inventory.push({ ...item });
        if (item.type !== 'material' && typeof autoEquip === 'function') {
          autoEquip(p, p.inventory[p.inventory.length - 1]);
        }
      } else {
        overflowGold += item.value || 10;
      }
    }

    if (overflowGold > 0) {
      p.gold += overflowGold;
      if (typeof addNotification === 'function') {
        addNotification('Inventory full, converted extras into ' + this.formatNum(overflowGold) + 'g', '#ffd166');
      }
    }

    if (typeof sfx !== 'undefined' && typeof sfx.itemPickup === 'function') sfx.itemPickup();
    if (typeof addNotification === 'function') addNotification('Expedition rewards claimed!', '#2ecc71');
    if (typeof addLog === 'function') {
      addLog('Claimed expedition rewards: +' + this.formatNum(summary.gold) + 'g +' + this.formatNum(summary.exp) + ' EXP', '#2ecc71');
    }

    this.pendingSummary = null;
    this.panelOpen = false;
    if (typeof saveGame === 'function') saveGame();
    return true;
  },

  getOfflineExpeditionSummary() {
    return this.pendingSummary;
  },

  formatNum(n) {
    return Math.floor(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  formatDuration(sec) {
    const total = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return h + 'h ' + m + 'm';
    if (m > 0) return m + 'm ' + s + 's';
    return s + 's';
  },

  getRiskLabel(level) {
    return ['Low', 'Guarded', 'Dangerous', 'Deadly'][level] || 'Unknown';
  },

  getRewardLabel(bias) {
    return {
      gold: 'Gold Focus',
      exp: 'EXP Focus',
      material: 'Material Focus',
      balanced: 'Balanced Loot'
    }[bias] || 'Balanced Loot';
  },

  getPanelLayout() {
    const pw = Math.min(620, canvas.width - 40);
    const ph = Math.min(430, canvas.height - 40);
    const px = Math.floor((canvas.width - pw) / 2);
    const py = Math.floor((canvas.height - ph) / 2);
    return { px, py, pw, ph };
  },

  getStartButtonRect(layout) {
    return {
      x: layout.px + layout.pw - 168,
      y: layout.py + layout.ph - 52,
      w: 140,
      h: 28
    };
  },

  getCancelButtonRect(layout) {
    return {
      x: layout.px + layout.pw - 168,
      y: layout.py + layout.ph - 52,
      w: 140,
      h: 28
    };
  },

  getClaimButtonRect(layout) {
    return {
      x: layout.px + layout.pw - 168,
      y: layout.py + layout.ph - 52,
      w: 140,
      h: 28
    };
  },

  renderOfflineExpeditionPanel(renderCtx) {
    if (!this.panelOpen) return;
    const drawCtx = renderCtx || ctx;
    const now = Date.now();
    const layout = this.getPanelLayout();
    const listX = layout.px + 18;
    const listY = layout.py + 54;
    const listW = 228;
    const rowH = 56;

    drawCtx.save();
    drawCtx.fillStyle = 'rgba(0,0,0,0.72)';
    drawCtx.fillRect(0, 0, canvas.width, canvas.height);

    drawCtx.fillStyle = 'rgba(9,14,28,0.97)';
    roundRect(drawCtx, layout.px, layout.py, layout.pw, layout.ph, 12);
    drawCtx.fill();
    drawCtx.strokeStyle = '#4a6d8c';
    drawCtx.lineWidth = 2;
    roundRect(drawCtx, layout.px, layout.py, layout.pw, layout.ph, 12);
    drawCtx.stroke();

    drawCtx.fillStyle = '#dcecff';
    drawCtx.font = 'bold 20px sans-serif';
    drawCtx.textAlign = 'center';
    drawCtx.fillText('Offline Expedition', layout.px + layout.pw / 2, layout.py + 28);

    drawCtx.fillStyle = 'rgba(180,40,40,0.85)';
    roundRect(drawCtx, layout.px + layout.pw - 30, layout.py + 8, 20, 20, 4);
    drawCtx.fill();
    drawCtx.fillStyle = '#fff';
    drawCtx.font = 'bold 14px sans-serif';
    drawCtx.fillText('X', layout.px + layout.pw - 20, layout.py + 23);

    if (this.pendingSummary) {
      this._drawSummaryPanel(drawCtx, layout);
      drawCtx.restore();
      return;
    }

    drawCtx.fillStyle = 'rgba(18,24,42,0.9)';
    roundRect(drawCtx, listX, listY, listW, layout.ph - 76, 8);
    drawCtx.fill();
    drawCtx.strokeStyle = '#294157';
    drawCtx.lineWidth = 1;
    roundRect(drawCtx, listX, listY, listW, layout.ph - 76, 8);
    drawCtx.stroke();

    const available = this.getAvailableExpeditions();
    for (let i = 0; i < available.length; i++) {
      const exp = available[i];
      const rowY = listY + 10 + i * (rowH + 8);
      const selected = exp.id === this.selectedExpeditionId;
      drawCtx.fillStyle = selected ? 'rgba(54,86,122,0.9)' : 'rgba(11,16,30,0.85)';
      roundRect(drawCtx, listX + 8, rowY, listW - 16, rowH, 6);
      drawCtx.fill();
      drawCtx.strokeStyle = selected ? '#88c0ff' : '#223548';
      roundRect(drawCtx, listX + 8, rowY, listW - 16, rowH, 6);
      drawCtx.stroke();

      drawCtx.textAlign = 'left';
      drawCtx.fillStyle = exp.unlocked ? '#ecf4ff' : '#7f8a99';
      drawCtx.font = 'bold 13px sans-serif';
      drawCtx.fillText(exp.name, listX + 18, rowY + 18);
      drawCtx.fillStyle = '#8fb7d9';
      drawCtx.font = '10px monospace';
      drawCtx.fillText(exp.zone + '  Lv.' + exp.minLevel, listX + 18, rowY + 34);
      drawCtx.fillStyle = exp.active ? '#2ecc71' : '#f0c75e';
      drawCtx.fillText(exp.active ? 'ACTIVE' : this.getRiskLabel(exp.riskLevel), listX + listW - 76, rowY + 34);
      drawCtx.fillStyle = '#9aa9bd';
      drawCtx.fillText(this.formatDuration(exp.durationSec), listX + 18, rowY + 48);
    }

    const selected = this.getSelectedDefinition();
    const detailX = listX + listW + 18;
    const detailW = layout.pw - (detailX - layout.px) - 18;
    drawCtx.fillStyle = 'rgba(16,22,38,0.92)';
    roundRect(drawCtx, detailX, listY, detailW, layout.ph - 76, 8);
    drawCtx.fill();
    drawCtx.strokeStyle = '#294157';
    roundRect(drawCtx, detailX, listY, detailW, layout.ph - 76, 8);
    drawCtx.stroke();

    drawCtx.textAlign = 'left';
    drawCtx.fillStyle = '#f4f8ff';
    drawCtx.font = 'bold 18px sans-serif';
    drawCtx.fillText(selected.name, detailX + 16, listY + 26);
    drawCtx.fillStyle = '#8fb7d9';
    drawCtx.font = '11px monospace';
    drawCtx.fillText(selected.zone + '  |  ' + this.formatDuration(selected.durationSec), detailX + 16, listY + 46);

    const p = this.getPlayer();
    const unlocked = !!p && p.level >= selected.minLevel;
    drawCtx.fillStyle = unlocked ? '#71d6a8' : '#ff8e8e';
    drawCtx.fillText(unlocked ? 'Unlocked' : 'Requires Lv.' + selected.minLevel, detailX + 16, listY + 66);

    const lines = [
      'Risk: ' + this.getRiskLabel(selected.riskLevel),
      'Reward Focus: ' + this.getRewardLabel(selected.rewardBias),
      'Only one expedition can run at a time.',
      'Active expeditions replace AFK rewards for that saved offline period.'
    ];
    drawCtx.fillStyle = '#d3deee';
    drawCtx.font = '12px sans-serif';
    for (let i = 0; i < lines.length; i++) {
      drawCtx.fillText(lines[i], detailX + 16, listY + 102 + i * 20);
    }

    if (this.activeRun) {
      const activeDef = this.getDefinition(this.activeRun.id) || selected;
      const remainingSec = Math.max(0, Math.ceil((this.activeRun.expectedEndAt - now) / 1000));
      drawCtx.fillStyle = 'rgba(28,62,48,0.95)';
      roundRect(drawCtx, detailX + 16, listY + 196, detailW - 32, 82, 8);
      drawCtx.fill();
      drawCtx.strokeStyle = '#4fd28e';
      roundRect(drawCtx, detailX + 16, listY + 196, detailW - 32, 82, 8);
      drawCtx.stroke();
      drawCtx.fillStyle = '#e9fff3';
      drawCtx.font = 'bold 16px sans-serif';
      drawCtx.fillText(activeDef.name + ' in progress', detailX + 28, listY + 222);
      drawCtx.fillStyle = '#b8ead0';
      drawCtx.font = '12px sans-serif';
      drawCtx.fillText('Time remaining: ' + this.formatDuration(remainingSec), detailX + 28, listY + 246);
      drawCtx.fillText('Started: ' + this.formatDuration(Math.floor((now - this.activeRun.startedAt) / 1000)) + ' ago', detailX + 28, listY + 266);

      const cancelBtn = this.getCancelButtonRect(layout);
      drawCtx.fillStyle = 'rgba(176,78,52,0.95)';
      roundRect(drawCtx, cancelBtn.x, cancelBtn.y, cancelBtn.w, cancelBtn.h, 6);
      drawCtx.fill();
      drawCtx.strokeStyle = '#ffab91';
      roundRect(drawCtx, cancelBtn.x, cancelBtn.y, cancelBtn.w, cancelBtn.h, 6);
      drawCtx.stroke();
      drawCtx.fillStyle = '#fff';
      drawCtx.font = 'bold 13px sans-serif';
      drawCtx.textAlign = 'center';
      drawCtx.fillText('Cancel Expedition', cancelBtn.x + cancelBtn.w / 2, cancelBtn.y + 19);
    } else {
      drawCtx.fillStyle = 'rgba(11,16,30,0.85)';
      roundRect(drawCtx, detailX + 16, listY + 196, detailW - 32, 82, 8);
      drawCtx.fill();
      drawCtx.strokeStyle = '#223548';
      roundRect(drawCtx, detailX + 16, listY + 196, detailW - 32, 82, 8);
      drawCtx.stroke();
      drawCtx.fillStyle = '#d3deee';
      drawCtx.font = '12px sans-serif';
      drawCtx.textAlign = 'left';
      drawCtx.fillText('Expected rewards', detailX + 28, listY + 220);
      drawCtx.fillText('Gold and EXP scale with player level, duration, and risk.', detailX + 28, listY + 242);
      drawCtx.fillText('High-risk runs can bring bonus loot. Materials require crafting to be loaded.', detailX + 28, listY + 262);

      const startBtn = this.getStartButtonRect(layout);
      const canStart = this.canStartExpedition(selected.id).ok;
      drawCtx.fillStyle = canStart ? 'rgba(56,142,60,0.95)' : 'rgba(75,78,84,0.95)';
      roundRect(drawCtx, startBtn.x, startBtn.y, startBtn.w, startBtn.h, 6);
      drawCtx.fill();
      drawCtx.strokeStyle = canStart ? '#9be7a2' : '#9aa1aa';
      roundRect(drawCtx, startBtn.x, startBtn.y, startBtn.w, startBtn.h, 6);
      drawCtx.stroke();
      drawCtx.fillStyle = '#fff';
      drawCtx.font = 'bold 13px sans-serif';
      drawCtx.textAlign = 'center';
      drawCtx.fillText(canStart ? 'Start Expedition' : 'Unavailable', startBtn.x + startBtn.w / 2, startBtn.y + 19);
    }

    drawCtx.restore();
  },

  _drawSummaryPanel(drawCtx, layout) {
    const summary = this.pendingSummary;
    const claimBtn = this.getClaimButtonRect(layout);
    const successColor = summary.success ? '#2ecc71' : '#f39c12';
    const rewardLines = [
      'Elapsed Time: ' + this.formatDuration(summary.elapsedSec),
      'Gold Gained: ' + this.formatNum(summary.gold),
      'EXP Gained: ' + this.formatNum(summary.exp),
      'Materials: ' + this._formatRewardNames(summary.materials),
      'Items: ' + this._formatRewardNames(summary.items)
    ];

    drawCtx.textAlign = 'left';
    drawCtx.fillStyle = 'rgba(14,22,39,0.94)';
    roundRect(drawCtx, layout.px + 18, layout.py + 48, layout.pw - 36, layout.ph - 116, 10);
    drawCtx.fill();
    drawCtx.strokeStyle = '#2f4c67';
    roundRect(drawCtx, layout.px + 18, layout.py + 48, layout.pw - 36, layout.ph - 116, 10);
    drawCtx.stroke();

    drawCtx.fillStyle = '#f4f8ff';
    drawCtx.font = 'bold 22px sans-serif';
    drawCtx.fillText(summary.name, layout.px + 34, layout.py + 84);
    drawCtx.fillStyle = successColor;
    drawCtx.font = 'bold 13px monospace';
    drawCtx.fillText(summary.success ? 'SUCCESS' : 'FAILED', layout.px + layout.pw - 130, layout.py + 84);

    drawCtx.fillStyle = '#8fb7d9';
    drawCtx.font = '12px monospace';
    drawCtx.fillText(summary.zone + '  |  ' + this.getRiskLabel(summary.riskLevel), layout.px + 34, layout.py + 108);

    drawCtx.fillStyle = '#d3deee';
    drawCtx.font = '12px sans-serif';
    for (let i = 0; i < rewardLines.length; i++) {
      drawCtx.fillText(rewardLines[i], layout.px + 34, layout.py + 148 + i * 24);
    }

    drawCtx.fillStyle = '#f7d794';
    drawCtx.font = 'italic 12px sans-serif';
    drawCtx.fillText(summary.flavorText, layout.px + 34, layout.py + 294);

    drawCtx.fillStyle = 'rgba(26,39,61,0.95)';
    roundRect(drawCtx, layout.px + 34, layout.py + 320, layout.pw - 68, 44, 8);
    drawCtx.fill();
    drawCtx.strokeStyle = '#36597a';
    roundRect(drawCtx, layout.px + 34, layout.py + 320, layout.pw - 68, 44, 8);
    drawCtx.stroke();
    drawCtx.fillStyle = '#bdd8f2';
    drawCtx.font = '11px sans-serif';
    drawCtx.fillText('Claim stores rewards immediately. Overflow items are converted into gold.', layout.px + 48, layout.py + 347);

    drawCtx.fillStyle = 'rgba(46,204,113,0.95)';
    roundRect(drawCtx, claimBtn.x, claimBtn.y, claimBtn.w, claimBtn.h, 6);
    drawCtx.fill();
    drawCtx.strokeStyle = '#b9f6ca';
    roundRect(drawCtx, claimBtn.x, claimBtn.y, claimBtn.w, claimBtn.h, 6);
    drawCtx.stroke();
    drawCtx.fillStyle = '#fff';
    drawCtx.font = 'bold 13px sans-serif';
    drawCtx.textAlign = 'center';
    drawCtx.fillText('Claim Rewards', claimBtn.x + claimBtn.w / 2, claimBtn.y + 19);
  },

  _formatRewardNames(items) {
    if (!items || !items.length) return 'None';
    const counts = {};
    for (const item of items) {
      if (!item || !item.name) continue;
      counts[item.name] = (counts[item.name] || 0) + 1;
    }
    const names = Object.keys(counts).map(name => counts[name] > 1 ? name + ' x' + counts[name] : name);
    return names.join(', ');
  },

  handleClick(cx, cy) {
    if (!this.panelOpen) return false;

    const layout = this.getPanelLayout();
    if (
      cx < layout.px || cx > layout.px + layout.pw ||
      cy < layout.py || cy > layout.py + layout.ph
    ) {
      this.panelOpen = false;
      return true;
    }

    const closeX = layout.px + layout.pw - 30;
    const closeY = layout.py + 8;
    if (cx >= closeX && cx <= closeX + 20 && cy >= closeY && cy <= closeY + 20) {
      this.panelOpen = false;
      return true;
    }

    if (this.pendingSummary) {
      const claimBtn = this.getClaimButtonRect(layout);
      if (
        cx >= claimBtn.x && cx <= claimBtn.x + claimBtn.w &&
        cy >= claimBtn.y && cy <= claimBtn.y + claimBtn.h
      ) {
        this.claimSummary();
      }
      return true;
    }

    const listX = layout.px + 18;
    const listY = layout.py + 54;
    const listW = 228;
    const rowH = 56;
    const available = this.getAvailableExpeditions();
    for (let i = 0; i < available.length; i++) {
      const rowY = listY + 10 + i * (rowH + 8);
      if (
        cx >= listX + 8 && cx <= listX + listW - 8 &&
        cy >= rowY && cy <= rowY + rowH
      ) {
        this.selectedExpeditionId = available[i].id;
        return true;
      }
    }

    if (this.activeRun) {
      const cancelBtn = this.getCancelButtonRect(layout);
      if (
        cx >= cancelBtn.x && cx <= cancelBtn.x + cancelBtn.w &&
        cy >= cancelBtn.y && cy <= cancelBtn.y + cancelBtn.h
      ) {
        this.cancelExpedition();
        return true;
      }
    } else {
      const startBtn = this.getStartButtonRect(layout);
      if (
        cx >= startBtn.x && cx <= startBtn.x + startBtn.w &&
        cy >= startBtn.y && cy <= startBtn.y + startBtn.h
      ) {
        this.startExpedition(this.selectedExpeditionId);
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

function canStartExpedition(id) {
  return offlineExpeditionSystem.canStartExpedition(id);
}

function startExpedition(id) {
  return offlineExpeditionSystem.startExpedition(id);
}

function cancelExpedition() {
  return offlineExpeditionSystem.cancelExpedition();
}

function resolveOfflineExpedition(now, skipSave) {
  return offlineExpeditionSystem.resolveOfflineExpedition(now, skipSave);
}

function getOfflineExpeditionSummary() {
  return offlineExpeditionSystem.getOfflineExpeditionSummary();
}

function renderOfflineExpeditionPanel(renderCtx) {
  return offlineExpeditionSystem.renderOfflineExpeditionPanel(renderCtx);
}

function handleOfflineExpeditionClick(cx, cy) {
  return offlineExpeditionSystem.handleClick(cx, cy);
}

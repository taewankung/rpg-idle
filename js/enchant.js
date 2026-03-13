// ============================================================
// ENCHANT — Enhancement system, enchant NPC, UI panel
// ============================================================

const ENHANCE_STONE_TEMPLATE = {
  name: 'Enhancement Stone', type: 'material', matKey: 'enhance_stone',
  rarity: 'uncommon', stats: {}, level: 1, value: 50
};

const ENHANCE_SUCCESS_RATES = [100, 95, 90, 80, 70, 55, 40, 25, 15, 5];

const enchantSystem = {
  panelOpen: false,
  selectedItem: null,
  selectedSource: null,   // 'inventory' | 'weapon' | 'armor' | 'accessory'
  selectedIdx: -1,
  animState: 'idle',      // 'idle' | 'enchanting' | 'success' | 'fail' | 'destroy'
  animTimer: 0,
  autoEnchant: false,
  autoMaxLevel: 5,
  particles: [],

  // --- NPC position ---
  npcPos: {
    x: (Math.floor(MAP_W / 2) + 5) * TILE + TILE / 2,
    y: (Math.floor(MAP_H / 2) + 1) * TILE + TILE / 2
  },

  // ---- SPRITES ----
  generateSprites() {
    // Enchanter NPC: glowing crystal wizard with blue aura
    genSprite('enchanter_npc', 16, 16, (c) => {
      // Blue aura glow
      c.fillStyle = 'rgba(79,195,247,0.15)';
      c.beginPath(); c.arc(8, 8, 7, 0, Math.PI * 2); c.fill();
      // Body robe
      c.fillStyle = '#1a237e'; c.fillRect(5, 7, 6, 7);
      // Head
      c.fillStyle = '#f4c99a'; c.fillRect(6, 3, 4, 4);
      // Wizard hat
      c.fillStyle = '#1a237e';
      c.beginPath(); c.moveTo(8, -1); c.lineTo(12, 5); c.lineTo(4, 5); c.closePath(); c.fill();
      // Hat star
      c.fillStyle = '#FFD700'; c.fillRect(7, 1, 2, 2);
      // Eyes
      c.fillStyle = '#4FC3F7'; c.fillRect(7, 4, 1, 1); c.fillRect(9, 4, 1, 1);
      // Crystal staff in right hand
      c.fillStyle = '#8B4513'; c.fillRect(11, 4, 1, 10);
      c.fillStyle = '#4FC3F7';
      c.beginPath(); c.moveTo(11, 1); c.lineTo(14, 4); c.lineTo(11, 5); c.lineTo(9, 4); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.5)';
      c.beginPath(); c.arc(11, 3, 1, 0, Math.PI * 2); c.fill();
      // Legs
      c.fillStyle = '#111'; c.fillRect(6, 14, 2, 2); c.fillRect(9, 14, 2, 2);
    });

    // Sign for enchanter
    genSprite('sign_enchant', 12, 16, (c) => {
      // Post
      c.fillStyle = '#8B4513'; c.fillRect(5, 6, 2, 10);
      // Sign board
      c.fillStyle = '#1a237e'; c.fillRect(1, 1, 10, 6);
      c.strokeStyle = '#4FC3F7'; c.lineWidth = 0.5;
      c.strokeRect(1, 1, 10, 6);
      // Crystal icon
      c.fillStyle = '#4FC3F7';
      c.beginPath(); c.moveTo(6, 2); c.lineTo(9, 4); c.lineTo(6, 6); c.lineTo(3, 4); c.closePath(); c.fill();
    });

    // Glow sprites for enhanced items at different tiers
    genSprite('enhance_glow_1', 16, 16, (c) => {
      const g = c.createRadialGradient(8, 8, 0, 8, 8, 8);
      g.addColorStop(0, 'rgba(255,255,255,0.4)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, 16, 16);
    });
    genSprite('enhance_glow_2', 16, 16, (c) => {
      const g = c.createRadialGradient(8, 8, 0, 8, 8, 8);
      g.addColorStop(0, 'rgba(79,195,247,0.5)');
      g.addColorStop(1, 'rgba(79,195,247,0)');
      c.fillStyle = g; c.fillRect(0, 0, 16, 16);
    });
    genSprite('enhance_glow_3', 16, 16, (c) => {
      const g = c.createRadialGradient(8, 8, 0, 8, 8, 8);
      g.addColorStop(0, 'rgba(171,71,188,0.5)');
      g.addColorStop(1, 'rgba(171,71,188,0)');
      c.fillStyle = g; c.fillRect(0, 0, 16, 16);
    });
  },

  // ---- TOWN NPC ----
  initTownNPC() {
    // Position is already set in npcPos
  },

  drawEnchantNPC() {
    if (game.state !== 'playing') return;
    const npc = this.npcPos;
    const { x: sx, y: sy } = camera.worldToScreen(npc.x, npc.y);

    // Viewport culling
    if (sx < -64 || sx > canvas.width + 64 || sy < -64 || sy > canvas.height + 64) return;

    // Draw sprite
    const spr = spriteCache['enchanter_npc'];
    if (spr) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      // Subtle floating bob
      const bob = Math.sin(game.time * 2) * 2;
      ctx.drawImage(spr, sx - 16, sy - 16 + bob, 32, 32);
      ctx.restore();
    }

    // Draw sign
    const sign = spriteCache['sign_enchant'];
    if (sign) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sign, sx - 36, sy + 4, 24, 32);
      ctx.restore();
    }

    // Draw name label
    ctx.save();
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText('Enchanter', sx, sy - 22);
    ctx.fillStyle = '#4FC3F7';
    ctx.fillText('Enchanter', sx, sy - 22);

    // Draw interaction hint if player is nearby
    if (game.player) {
      const dist = Math.hypot(game.player.x - npc.x, game.player.y - npc.y);
      if (dist < TILE * 2.5) {
        ctx.font = '9px monospace';
        ctx.strokeText('[Click to Enhance]', sx, sy - 32);
        ctx.fillStyle = '#AADDFF';
        ctx.fillText('[Click to Enhance]', sx, sy - 32);
      }
    }
    ctx.restore();
  },

  checkNPCClick(clickX, clickY) {
    if (game.state !== 'playing' || !game.player) return false;

    // If panel is open, handle panel clicks
    if (this.panelOpen) return handleEnchantClick(clickX, clickY);

    // Check if clicking near enchanter NPC
    const { x: sx, y: sy } = camera.worldToScreen(this.npcPos.x, this.npcPos.y);
    if (Math.hypot(clickX - sx, clickY - sy) < TILE * 1.5) {
      const dist = Math.hypot(game.player.x - this.npcPos.x, game.player.y - this.npcPos.y);
      if (dist < TILE * 3) {
        this.panelOpen = true;
        this.selectedItem = null;
        this.selectedSource = null;
        this.selectedIdx = -1;
        this.animState = 'idle';
        return true;
      }
    }
    return false;
  },

  // ---- ENHANCEMENT MECHANICS ----
  _getEnhanceBonus(item) {
    const lv = item.enhanceLevel || 0;
    if (lv === 0) return {};
    if (item.type === 'weapon') return { atk: lv * 3 };
    if (item.type === 'armor') return { def: lv * 2 };
    if (item.type === 'accessory') return { spd: lv * 1 };
    return {};
  },

  canEnhance(item) {
    if (!item) return { possible: false, reason: 'No item selected', cost: 0, successRate: 0, stoneCount: 0 };
    if (item.type !== 'weapon' && item.type !== 'armor' && item.type !== 'accessory')
      return { possible: false, reason: 'Cannot enhance this item type', cost: 0, successRate: 0, stoneCount: 0 };

    const level = item.enhanceLevel || 0;
    if (level >= 10)
      return { possible: false, reason: 'Already at max enhancement', cost: 0, successRate: 100, stoneCount: this._countStones() };

    const cost = 100 * (level + 1);
    const successRate = ENHANCE_SUCCESS_RATES[level];
    const stoneCount = this._countStones();
    const p = game.player;

    if (stoneCount <= 0)
      return { possible: false, reason: 'No Enhancement Stones', cost, successRate, stoneCount };
    if (p.gold < cost)
      return { possible: false, reason: 'Not enough gold (' + cost + 'g needed)', cost, successRate, stoneCount };

    return { possible: true, reason: '', cost, successRate, stoneCount };
  },

  _countStones() {
    if (!game.player) return 0;
    return game.player.inventory.filter(i => i && i.matKey === 'enhance_stone').length;
  },

  _consumeStone() {
    if (!game.player) return false;
    const idx = game.player.inventory.findIndex(i => i && i.matKey === 'enhance_stone');
    if (idx < 0) return false;
    game.player.inventory.splice(idx, 1);
    return true;
  },

  doEnhance() {
    const item = this.selectedItem;
    if (!item || this.animState !== 'idle') return;
    const check = this.canEnhance(item);
    if (!check.possible) {
      addNotification(check.reason, '#FF4444');
      return;
    }

    const p = game.player;
    const level = item.enhanceLevel || 0;

    // Consume resources
    p.gold -= check.cost;
    this._consumeStone();

    // Start enchanting animation
    this.animState = 'enchanting';
    this.animTimer = 1.0;
    this._pendingLevel = level;
    this._pendingItem = item;

    // Determine result now (displayed after animation)
    const roll = Math.random() * 100;
    this._pendingSuccess = roll < check.successRate;

    // Spawn initial sparkles
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      this.particles.push({
        x: 0, y: 0, vx: Math.cos(angle) * 40, vy: Math.sin(angle) * 40,
        color: '#4FC3F7', alpha: 1, size: 2, timer: 1.0
      });
    }
  },

  _resolveEnhance() {
    const item = this._pendingItem;
    const level = this._pendingLevel;
    const success = this._pendingSuccess;
    const p = game.player;
    if (!item || !p) return;

    // Check if item is currently equipped
    const equippedSlot = this._getEquippedSlot(item);

    if (success) {
      // Remove old enhance bonus from player if equipped
      if (equippedSlot) {
        const oldBonus = this._getEnhanceBonus(item);
        for (const [k, v] of Object.entries(oldBonus)) {
          if (k in p) p[k] -= v;
        }
      }

      // Level up
      item.enhanceLevel = level + 1;

      // Apply new enhance bonus if equipped
      if (equippedSlot) {
        const newBonus = this._getEnhanceBonus(item);
        for (const [k, v] of Object.entries(newBonus)) {
          if (k in p) p[k] += v;
        }
      }

      this.animState = 'success';
      this.animTimer = 1.5;

      addLog('Enhancement success! ' + this.getDisplayName(item), '#FFD700');
      addNotification(this.getDisplayName(item) + ' SUCCESS!', '#FFD700');

      // Success particles
      for (let i = 0; i < 20; i++) {
        const angle = rf(0, Math.PI * 2);
        const speed = rf(30, 80);
        this.particles.push({
          x: 0, y: 0, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          color: '#FFD700', alpha: 1, size: rf(1.5, 3), timer: rf(0.8, 1.5)
        });
      }

      if (typeof sfx !== 'undefined') sfx.victoryFanfare();

    } else {
      // Failure
      if (level >= 7 && level <= 9) {
        // DESTROY the item
        this.animState = 'destroy';
        this.animTimer = 2.0;

        // Remove all stats from player if equipped
        if (equippedSlot) {
          // Remove base stats
          for (const [k, v] of Object.entries(item.stats)) {
            if (k in p) p[k] -= v;
          }
          // Remove enhance bonus
          const bonus = this._getEnhanceBonus(item);
          for (const [k, v] of Object.entries(bonus)) {
            if (k in p) p[k] -= v;
          }
          p.equipment[equippedSlot] = null;
        }

        // Remove from inventory if there
        const invIdx = p.inventory.indexOf(item);
        if (invIdx >= 0) p.inventory.splice(invIdx, 1);

        // Clear selection
        this.selectedItem = null;
        this.selectedSource = null;
        this.selectedIdx = -1;

        addLog('DESTROYED: ' + this.getDisplayName(item), '#FF4444');
        addNotification(item.name + ' DESTROYED!', '#FF4444');

        screenShake(8, 0.4);

        // Shatter particles
        for (let i = 0; i < 15; i++) {
          const angle = rf(0, Math.PI * 2);
          const speed = rf(50, 120);
          this.particles.push({
            x: 0, y: 0, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            color: ['#FF4444', '#FF6644', '#CC2222', '#AA0000'][ri(0, 3)],
            alpha: 1, size: rf(2, 4), timer: rf(0.6, 1.2)
          });
        }

        if (typeof sfx !== 'undefined') sfx.hit();

      } else if (level >= 4 && level <= 6) {
        // Drop 1 level
        if (equippedSlot) {
          const oldBonus = this._getEnhanceBonus(item);
          for (const [k, v] of Object.entries(oldBonus)) {
            if (k in p) p[k] -= v;
          }
        }

        item.enhanceLevel = level - 1;

        if (equippedSlot) {
          const newBonus = this._getEnhanceBonus(item);
          for (const [k, v] of Object.entries(newBonus)) {
            if (k in p) p[k] += v;
          }
        }

        this.animState = 'fail';
        this.animTimer = 1.2;

        addLog('Enhancement failed! ' + this.getDisplayName(item) + ' dropped to +' + item.enhanceLevel, '#FF8844');
        addNotification('FAILED! Dropped to +' + item.enhanceLevel, '#FF8844');
        if (typeof sfx !== 'undefined') sfx.hit();

      } else if (level === 10) {
        // +10 attempt fail: mercy rule, drop to +7 (shouldn't happen since +10 can't enhance, but for safety)
        // Actually this applies to the +9->+10 fail alternative path
        // The spec says "+10 attempt fail: drop to +7", meaning failing while trying to go TO +10
        // But level here is 9 (attempting +9->+10), which falls in the 7-9 destroy range
        // The mercy rule overrides: if level is 9 (attempting +10), drop to +7 instead of destroy
        // We handle this by checking the target level
        this.animState = 'fail';
        this.animTimer = 1.2;
        addLog('Enhancement failed!', '#FF8844');
        if (typeof sfx !== 'undefined') sfx.hit();

      } else {
        // +0 to +3 fail: nothing happens
        this.animState = 'fail';
        this.animTimer = 1.2;

        addLog('Enhancement failed! Item unchanged.', '#FF8844');
        addNotification('Enhancement Failed!', '#FF8844');
        if (typeof sfx !== 'undefined') sfx.hit();
      }
    }
  },

  _getEquippedSlot(item) {
    if (!game.player) return null;
    const p = game.player;
    if (p.equipment.weapon === item) return 'weapon';
    if (p.equipment.armor === item) return 'armor';
    if (p.equipment.accessory === item) return 'accessory';
    return null;
  },

  // ---- DISPLAY HELPERS ----
  getDisplayName(item) {
    if (!item) return '';
    const lv = item.enhanceLevel || 0;
    let name = item.name;
    if (lv >= 10) name = 'Perfected ' + name;
    if (lv > 0) name += ' +' + lv;
    return name;
  },

  getGlowColor(level) {
    if (level >= 10) return '#FFD700';
    if (level >= 7) return '#AB47BC';
    if (level >= 4) return '#4FC3F7';
    if (level >= 1) return '#ffffff';
    return null;
  },

  shouldDrawParticles(item) {
    return item && (item.enhanceLevel || 0) >= 7;
  },

  // ---- STAT APPLICATION ----
  applyEnhanceStats(player, item) {
    if (!item || !player) return;
    const bonus = this._getEnhanceBonus(item);
    for (const [k, v] of Object.entries(bonus)) {
      if (k in player) player[k] += v;
    }
  },

  removeEnhanceStats(player, item) {
    if (!item || !player) return;
    const bonus = this._getEnhanceBonus(item);
    for (const [k, v] of Object.entries(bonus)) {
      if (k in player) player[k] -= v;
    }
  },

  // ---- ANIMATION UPDATE ----
  updateAnim(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.timer -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt; // gravity
      p.alpha = Math.max(0, p.timer / 1.0);
      if (p.timer <= 0) this.particles.splice(i, 1);
    }

    if (this.animState === 'idle') return;

    this.animTimer -= dt;

    if (this.animState === 'enchanting') {
      // Spawn spiraling sparkles during enchant
      if (Math.random() < 0.4) {
        const angle = game.time * 6 + rf(0, Math.PI * 2);
        this.particles.push({
          x: Math.cos(angle) * 30, y: Math.sin(angle) * 30,
          vx: -Math.cos(angle) * 30, vy: -Math.sin(angle) * 30,
          color: '#4FC3F7', alpha: 1, size: rf(1, 2.5), timer: 0.8
        });
      }

      if (this.animTimer <= 0) {
        // Resolve the enhancement
        // Re-check mercy rule for +9 fail (going to +10)
        if (!this._pendingSuccess && this._pendingLevel === 9) {
          // Mercy rule: drop to +7 instead of destroy
          const item = this._pendingItem;
          const p = game.player;
          const equippedSlot = this._getEquippedSlot(item);

          if (equippedSlot) {
            const oldBonus = this._getEnhanceBonus(item);
            for (const [k, v] of Object.entries(oldBonus)) {
              if (k in p) p[k] -= v;
            }
          }

          item.enhanceLevel = 7;

          if (equippedSlot) {
            const newBonus = this._getEnhanceBonus(item);
            for (const [k, v] of Object.entries(newBonus)) {
              if (k in p) p[k] += v;
            }
          }

          this.animState = 'fail';
          this.animTimer = 1.2;
          addLog('Enhancement failed! ' + this.getDisplayName(item) + ' dropped to +7 (mercy)', '#FF8844');
          addNotification('FAILED! Dropped to +7', '#FF8844');
          if (typeof sfx !== 'undefined') sfx.hit();
          screenShake(4, 0.2);
        } else {
          this._resolveEnhance();
        }
      }
    } else if (this.animTimer <= 0) {
      this.animState = 'idle';
    }
  },

  // ---- BOT AUTO-ENCHANT ----
  botAutoEnchant(player) {
    if (!this.autoEnchant || !player) return;
    if (this._countStones() <= 0) return;

    // Try weapon first, then armor
    const slots = ['weapon', 'armor'];
    for (const slot of slots) {
      const item = player.equipment[slot];
      if (!item) continue;
      const lv = item.enhanceLevel || 0;
      if (lv >= this.autoMaxLevel) continue;

      const check = this.canEnhance(item);
      if (!check.possible) continue;

      // Perform one enhancement attempt
      this.selectedItem = item;
      this.selectedSource = slot;
      this.selectedIdx = -1;

      // Direct enhance (skip animation for bot)
      player.gold -= check.cost;
      this._consumeStone();

      const roll = Math.random() * 100;
      const success = roll < check.successRate;

      if (success) {
        const oldBonus = this._getEnhanceBonus(item);
        for (const [k, v] of Object.entries(oldBonus)) {
          if (k in player) player[k] -= v;
        }
        item.enhanceLevel = lv + 1;
        const newBonus = this._getEnhanceBonus(item);
        for (const [k, v] of Object.entries(newBonus)) {
          if (k in player) player[k] += v;
        }
        addLog('Bot enhanced ' + this.getDisplayName(item), '#FFD700');
      } else {
        if (lv >= 7 && lv <= 9) {
          if (lv === 9) {
            // Mercy rule: drop to +7
            const oldBonus = this._getEnhanceBonus(item);
            for (const [k, v] of Object.entries(oldBonus)) {
              if (k in player) player[k] -= v;
            }
            item.enhanceLevel = 7;
            const newBonus = this._getEnhanceBonus(item);
            for (const [k, v] of Object.entries(newBonus)) {
              if (k in player) player[k] += v;
            }
            addLog('Bot enhance failed! ' + item.name + ' dropped to +7', '#FF8844');
          } else {
            // Destroy
            for (const [k, v] of Object.entries(item.stats)) {
              if (k in player) player[k] -= v;
            }
            const bonus = this._getEnhanceBonus(item);
            for (const [k, v] of Object.entries(bonus)) {
              if (k in player) player[k] -= v;
            }
            player.equipment[slot] = null;
            const invIdx = player.inventory.indexOf(item);
            if (invIdx >= 0) player.inventory.splice(invIdx, 1);
            addLog('Bot enhance DESTROYED ' + item.name + '!', '#FF4444');
          }
        } else if (lv >= 4 && lv <= 6) {
          const oldBonus = this._getEnhanceBonus(item);
          for (const [k, v] of Object.entries(oldBonus)) {
            if (k in player) player[k] -= v;
          }
          item.enhanceLevel = lv - 1;
          const newBonus = this._getEnhanceBonus(item);
          for (const [k, v] of Object.entries(newBonus)) {
            if (k in player) player[k] += v;
          }
          addLog('Bot enhance failed! ' + item.name + ' dropped to +' + item.enhanceLevel, '#FF8844');
        } else {
          addLog('Bot enhance failed! ' + item.name + ' unchanged.', '#FF8844');
        }
      }

      this.selectedItem = null;
      this.selectedSource = null;
      return; // One attempt per town visit
    }
  },

  // ---- SAVE/LOAD ----
  save() {
    return { autoEnchant: this.autoEnchant, autoMaxLevel: this.autoMaxLevel };
  },

  load(data) {
    if (!data) return;
    if (typeof data.autoEnchant === 'boolean') this.autoEnchant = data.autoEnchant;
    if (typeof data.autoMaxLevel === 'number') this.autoMaxLevel = Math.min(7, Math.max(1, data.autoMaxLevel));
  }
};

// ============================================================
// ENCHANT PANEL UI
// ============================================================
function drawEnchantPanel() {
  if (!enchantSystem.panelOpen || !game.player) return;
  const p = game.player;
  const W = canvas.width, H = canvas.height;
  const pw = 360, ph = 420;
  const px = (W - pw) / 2, py = (H - ph) / 2;

  ctx.save();

  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, W, H);

  // Panel background
  ctx.fillStyle = 'rgba(10,10,40,0.95)';
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.fill();
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.stroke();

  // Header
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#4FC3F7';

  // Crystal icon next to title
  const titleX = px + pw / 2;
  const iconSpr = spriteCache['icon_enhance_stone'];
  if (iconSpr) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(iconSpr, titleX - 70, py + 10, 18, 18);
  }
  ctx.fillText('Enhancement', titleX, py + 26);

  // Close button
  const closeX = px + pw - 28, closeY = py + 8;
  ctx.fillStyle = 'rgba(180,40,40,0.8)';
  roundRect(ctx, closeX, closeY, 20, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('X', closeX + 10, closeY + 15);

  const item = enchantSystem.selectedItem;
  const slotX = px + 20, slotY = py + 45;
  const slotW = 80, slotH = 80;

  // ---- ITEM SLOT (large, left side) ----
  const itemSlotBg = item ? (RARITY_COLORS[item.rarity] || '#AAAAAA') + '22' : 'rgba(40,40,60,0.8)';
  ctx.fillStyle = itemSlotBg;
  roundRect(ctx, slotX, slotY, slotW, slotH, 8);
  ctx.fill();
  ctx.strokeStyle = item ? (RARITY_COLORS[item.rarity] || '#AAAAAA') : '#444466';
  ctx.lineWidth = 2;
  roundRect(ctx, slotX, slotY, slotW, slotH, 8);
  ctx.stroke();

  if (item) {
    // Draw item icon
    const iconName = _getItemIcon(item);
    const iSpr = spriteCache[iconName];
    if (iSpr) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(iSpr, slotX + 16, slotY + 8, 48, 48);
    }

    // Enhance level badge
    const lv = item.enhanceLevel || 0;
    if (lv > 0) {
      const glowCol = enchantSystem.getGlowColor(lv);
      ctx.fillStyle = glowCol;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('+' + lv, slotX + slotW / 2, slotY + slotH - 6);
    }

    // Item name below slot
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = RARITY_COLORS[item.rarity] || '#AAAAAA';
    ctx.fillText(enchantSystem.getDisplayName(item), slotX + slotW / 2, slotY + slotH + 14);

    // Glow effect for animated items
    if (enchantSystem.animState === 'enchanting') {
      const glowAlpha = 0.3 + Math.sin(game.time * 10) * 0.2;
      ctx.fillStyle = 'rgba(79,195,247,' + glowAlpha + ')';
      roundRect(ctx, slotX - 2, slotY - 2, slotW + 4, slotH + 4, 10);
      ctx.fill();
    } else if (enchantSystem.animState === 'success') {
      const flashAlpha = Math.max(0, enchantSystem.animTimer / 1.5) * 0.5;
      ctx.fillStyle = 'rgba(255,215,0,' + flashAlpha + ')';
      roundRect(ctx, slotX - 2, slotY - 2, slotW + 4, slotH + 4, 10);
      ctx.fill();
    } else if (enchantSystem.animState === 'fail') {
      const flashAlpha = Math.max(0, enchantSystem.animTimer / 1.2) * 0.4;
      ctx.fillStyle = 'rgba(255,68,68,' + flashAlpha + ')';
      roundRect(ctx, slotX - 2, slotY - 2, slotW + 4, slotH + 4, 10);
      ctx.fill();
    }
  } else {
    // No item selected placeholder
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#666';
    ctx.fillText('Select an', slotX + slotW / 2, slotY + 32);
    ctx.fillText('item below', slotX + slotW / 2, slotY + 44);
  }

  // Draw particles relative to item slot center
  const pcx = slotX + slotW / 2, pcy = slotY + slotH / 2;
  for (const part of enchantSystem.particles) {
    ctx.globalAlpha = part.alpha;
    ctx.fillStyle = part.color;
    ctx.beginPath();
    ctx.arc(pcx + part.x, pcy + part.y, part.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ---- ENHANCEMENT INFO (right of slot) ----
  if (item) {
    const infoX = slotX + slotW + 16, infoY = slotY;
    const lv = item.enhanceLevel || 0;
    const check = enchantSystem.canEnhance(item);

    ctx.textAlign = 'left';
    ctx.font = 'bold 11px monospace';

    // Current level
    ctx.fillStyle = '#ccc';
    ctx.fillText('Current:', infoX, infoY + 12);
    ctx.fillStyle = enchantSystem.getGlowColor(lv) || '#aaa';
    ctx.fillText('+' + lv, infoX + 70, infoY + 12);

    if (lv < 10) {
      // Next level
      ctx.fillStyle = '#ccc';
      ctx.fillText('Next:', infoX, infoY + 28);
      ctx.fillStyle = enchantSystem.getGlowColor(lv + 1) || '#fff';
      ctx.fillText('+' + (lv + 1), infoX + 70, infoY + 28);

      // Stat gain
      ctx.fillStyle = '#ccc';
      ctx.fillText('Gain:', infoX, infoY + 44);
      ctx.fillStyle = '#44FF44';
      if (item.type === 'weapon') ctx.fillText('+3 ATK', infoX + 70, infoY + 44);
      else if (item.type === 'armor') ctx.fillText('+2 DEF', infoX + 70, infoY + 44);
      else if (item.type === 'accessory') ctx.fillText('+1 SPD', infoX + 70, infoY + 44);

      // Success rate
      ctx.fillStyle = '#ccc';
      ctx.fillText('Rate:', infoX, infoY + 60);
      const rate = ENHANCE_SUCCESS_RATES[lv];
      ctx.fillStyle = rate > 70 ? '#44FF44' : rate >= 40 ? '#FFD700' : '#FF4444';
      ctx.fillText(rate + '%', infoX + 70, infoY + 60);

      // Cost
      ctx.fillStyle = '#ccc';
      ctx.fillText('Cost:', infoX, infoY + 76);
      const cost = 100 * (lv + 1);
      ctx.fillStyle = p.gold >= cost ? '#ffcc00' : '#FF4444';
      ctx.fillText(cost + 'g', infoX + 70, infoY + 76);
    } else {
      ctx.fillStyle = '#FFD700';
      ctx.fillText('MAX LEVEL!', infoX, infoY + 28);
    }

    // Enhancement Stones count (below info, always shown)
    const stoneCount = enchantSystem._countStones();
    ctx.fillStyle = '#ccc';
    ctx.font = '10px monospace';
    ctx.fillText('Stones:', infoX, infoY + 92);
    ctx.fillStyle = stoneCount > 0 ? '#44FF44' : '#FF4444';
    ctx.fillText(stoneCount + ' available', infoX + 56, infoY + 92);
  }

  // ---- RESULT DISPLAY ----
  if (enchantSystem.animState === 'success') {
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD700';
    const fy = slotY + slotH / 2 - enchantSystem.animTimer * 20;
    ctx.globalAlpha = Math.min(1, enchantSystem.animTimer);
    ctx.fillText('+' + (item ? item.enhanceLevel : '') + '!', slotX + slotW / 2, fy);
    ctx.globalAlpha = 1;
  } else if (enchantSystem.animState === 'fail') {
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FF4444';
    ctx.globalAlpha = Math.min(1, enchantSystem.animTimer);
    ctx.fillText('FAILED', slotX + slotW / 2, slotY - 10);
    ctx.globalAlpha = 1;
  } else if (enchantSystem.animState === 'destroy') {
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FF0000';
    ctx.globalAlpha = Math.min(1, enchantSystem.animTimer / 1.5);
    ctx.fillText('DESTROYED!', px + pw / 2, slotY + slotH / 2);
    ctx.globalAlpha = 1;
    // Screen dim effect
    ctx.fillStyle = 'rgba(255,0,0,' + (enchantSystem.animTimer / 2 * 0.1) + ')';
    ctx.fillRect(0, 0, W, H);
  }

  // ---- ENHANCE BUTTON ----
  const btnW = 120, btnH = 32;
  const btnX = px + pw / 2 - btnW / 2, btnY = slotY + slotH + 22;

  if (item && (item.enhanceLevel || 0) < 10 && enchantSystem.animState === 'idle') {
    const check = enchantSystem.canEnhance(item);
    const canDo = check.possible;
    const lv = item.enhanceLevel || 0;

    // Button background
    if (canDo) {
      const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
      btnGrad.addColorStop(0, '#d4a017');
      btnGrad.addColorStop(1, '#8B6508');
      ctx.fillStyle = btnGrad;
      // Pulse glow
      const pulse = 0.5 + Math.sin(game.time * 4) * 0.2;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 8 * pulse;
    } else {
      ctx.fillStyle = 'rgba(60,60,60,0.9)';
    }
    roundRect(ctx, btnX, btnY, btnW, btnH, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Button text
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = canDo ? '#fff' : '#666';
    ctx.fillText('Enhance!', btnX + btnW / 2, btnY + 21);

    // Risk warning for +7-9
    if (lv >= 7 && lv <= 9) {
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#FF4444';
      ctx.fillText('RISK: Item may be destroyed!', px + pw / 2, btnY + btnH + 14);
    }
  }

  // ---- INVENTORY GRID (below button) ----
  const gridY = btnY + btnH + 24;
  const gridX = px + 8;
  const cellW = 40, cellH = 40, cols = 8, gap = 2;

  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#aaccee';
  ctx.fillText('Equipment & Inventory:', gridX, gridY - 4);

  // Draw equipped items first (3 slots)
  const equipSlots = ['weapon', 'armor', 'accessory'];
  const equipLabels = ['W', 'A', 'Acc'];
  for (let i = 0; i < 3; i++) {
    const slot = equipSlots[i];
    const eItem = p.equipment[slot];
    const ex = gridX + i * (cellW + gap), ey = gridY + 2;

    // Slot background
    ctx.fillStyle = eItem ? (RARITY_COLORS[eItem.rarity] || '#AAAAAA') + '33' : 'rgba(30,30,50,0.8)';
    roundRect(ctx, ex, ey, cellW, cellH, 4);
    ctx.fill();

    // Selected highlight
    if (enchantSystem.selectedItem === eItem && eItem) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      roundRect(ctx, ex, ey, cellW, cellH, 4);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#334';
      ctx.lineWidth = 1;
      roundRect(ctx, ex, ey, cellW, cellH, 4);
      ctx.stroke();
    }

    if (eItem) {
      // Draw icon
      const iconName = _getItemIcon(eItem);
      const iSpr = spriteCache[iconName];
      if (iSpr) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(iSpr, ex + 4, ey + 2, 32, 32);
      }
      // Enhance level badge
      const elv = eItem.enhanceLevel || 0;
      if (elv > 0) {
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = enchantSystem.getGlowColor(elv) || '#fff';
        ctx.fillText('+' + elv, ex + cellW - 2, ey + cellH - 2);
      }
    } else {
      // Empty slot label
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#555';
      ctx.fillText(equipLabels[i], ex + cellW / 2, ey + cellH / 2 + 3);
    }

    // "E" badge to indicate equipped
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4FC3F7';
    ctx.fillText('E', ex + 2, ey + 9);
  }

  // Divider after equipped items
  ctx.strokeStyle = '#334';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gridX + 3 * (cellW + gap) + 4, gridY + 2);
  ctx.lineTo(gridX + 3 * (cellW + gap) + 4, gridY + 2 + cellH);
  ctx.stroke();

  // Draw inventory items (only weapons/armors/accessories)
  const enhanceableInv = [];
  for (let i = 0; i < p.inventory.length; i++) {
    const inv = p.inventory[i];
    if (inv && (inv.type === 'weapon' || inv.type === 'armor' || inv.type === 'accessory')) {
      enhanceableInv.push({ item: inv, idx: i });
    }
  }

  const invStartX = gridX + 3 * (cellW + gap) + 10;
  const invCols = 5;
  for (let i = 0; i < enhanceableInv.length; i++) {
    const { item: inv, idx } = enhanceableInv[i];
    const col = i % invCols, row = Math.floor(i / invCols);
    const ix = invStartX + col * (cellW + gap), iy = gridY + 2 + row * (cellH + gap);

    // Only draw if fits in panel
    if (iy + cellH > py + ph - 10) break;

    // Slot background
    ctx.fillStyle = (RARITY_COLORS[inv.rarity] || '#AAAAAA') + '22';
    roundRect(ctx, ix, iy, cellW, cellH, 4);
    ctx.fill();

    // Selected highlight
    if (enchantSystem.selectedItem === inv) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = (RARITY_COLORS[inv.rarity] || '#AAAAAA') + '66';
      ctx.lineWidth = 1;
    }
    roundRect(ctx, ix, iy, cellW, cellH, 4);
    ctx.stroke();

    // Item icon
    const iconName = _getItemIcon(inv);
    const iSpr = spriteCache[iconName];
    if (iSpr) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(iSpr, ix + 4, iy + 2, 32, 32);
    }

    // Enhance level badge
    const elv = inv.enhanceLevel || 0;
    if (elv > 0) {
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = enchantSystem.getGlowColor(elv) || '#fff';
      ctx.fillText('+' + elv, ix + cellW - 2, iy + cellH - 2);
    }
  }

  // Second row of inventory if needed
  const invRow2Y = gridY + 2 + cellH + gap + 4;
  if (enhanceableInv.length > invCols) {
    // Already handled by the row calculation above
  }

  // ---- AUTO-ENCHANT SETTINGS ----
  const autoY = py + ph - 36;
  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#888';

  // Auto-enchant toggle
  const autoToggleX = px + 12, autoToggleY = autoY;
  ctx.fillStyle = enchantSystem.autoEnchant ? 'rgba(20,120,40,0.8)' : 'rgba(60,60,60,0.8)';
  roundRect(ctx, autoToggleX, autoToggleY, 12, 12, 2);
  ctx.fill();
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  roundRect(ctx, autoToggleX, autoToggleY, 12, 12, 2);
  ctx.stroke();
  if (enchantSystem.autoEnchant) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('v', autoToggleX + 6, autoToggleY + 10);
  }

  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#aaa';
  ctx.fillText('Auto-enchant (bot)', autoToggleX + 18, autoToggleY + 10);

  // Max level selector
  ctx.fillText('Max +' + enchantSystem.autoMaxLevel, px + pw - 80, autoToggleY + 10);

  // - and + buttons
  const minBtnX = px + pw - 40, maxBtnX = px + pw - 20;
  ctx.fillStyle = 'rgba(60,60,80,0.8)';
  roundRect(ctx, minBtnX, autoToggleY, 14, 12, 2); ctx.fill();
  roundRect(ctx, maxBtnX, autoToggleY, 14, 12, 2); ctx.fill();
  ctx.fillStyle = '#ccc';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('-', minBtnX + 7, autoToggleY + 10);
  ctx.fillText('+', maxBtnX + 7, autoToggleY + 10);

  ctx.restore();
}

// ---- Helper: get item sprite icon name ----
function _getItemIcon(item) {
  if (!item) return 'loot_bag';
  const n = item.name.toLowerCase();
  if (n.includes('sword')) return 'icon_sword';
  if (n.includes('axe')) return 'icon_axe';
  if (n.includes('staff')) return 'icon_staff';
  if (n.includes('bow')) return 'icon_bow';
  if (n.includes('mace')) return 'icon_mace';
  if (n.includes('scepter')) return 'scepter';
  if (n.includes('dagger')) return 'icon_dagger';
  if (n.includes('robe')) return 'icon_robe';
  if (n.includes('plate') || n.includes('chain')) return 'icon_armor';
  if (n.includes('leather')) return 'icon_armor';
  if (n.includes('ring')) return 'icon_ring';
  if (n.includes('amulet')) return 'icon_amulet';
  if (n.includes('bracelet')) return 'icon_bracelet';
  if (n.includes('enhancement stone')) return 'icon_enhance_stone';
  if (item.type === 'weapon') return 'icon_sword';
  if (item.type === 'armor') return 'icon_armor';
  if (item.type === 'accessory') return 'icon_ring';
  return 'loot_bag';
}

// ============================================================
// ENCHANT CLICK HANDLER
// ============================================================
function handleEnchantClick(clickX, clickY) {
  if (!enchantSystem.panelOpen || !game.player) return false;
  const p = game.player;
  const W = canvas.width, H = canvas.height;
  const pw = 360, ph = 420;
  const px = (W - pw) / 2, py = (H - ph) / 2;

  // Click outside panel -> close
  if (clickX < px || clickX > px + pw || clickY < py || clickY > py + ph) {
    enchantSystem.panelOpen = false;
    enchantSystem.selectedItem = null;
    enchantSystem.selectedSource = null;
    enchantSystem.selectedIdx = -1;
    enchantSystem.animState = 'idle';
    enchantSystem.particles = [];
    return true;
  }

  // Close button
  const closeX = px + pw - 28, closeY = py + 8;
  if (clickX >= closeX && clickX <= closeX + 20 && clickY >= closeY && clickY <= closeY + 20) {
    enchantSystem.panelOpen = false;
    enchantSystem.selectedItem = null;
    enchantSystem.selectedSource = null;
    enchantSystem.selectedIdx = -1;
    enchantSystem.animState = 'idle';
    enchantSystem.particles = [];
    return true;
  }

  // Don't allow clicks during animation
  if (enchantSystem.animState !== 'idle') return true;

  // ---- Enhance button ----
  const slotY = py + 45, slotH = 80;
  const btnW = 120, btnH = 32;
  const btnX = px + pw / 2 - btnW / 2, btnY = slotY + slotH + 22;

  if (clickX >= btnX && clickX <= btnX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
    if (enchantSystem.selectedItem) {
      enchantSystem.doEnhance();
    }
    return true;
  }

  // ---- Equipment slots ----
  const gridY = btnY + btnH + 24;
  const gridX = px + 8;
  const cellW = 40, cellH = 40, gap = 2;
  const equipSlots = ['weapon', 'armor', 'accessory'];

  for (let i = 0; i < 3; i++) {
    const ex = gridX + i * (cellW + gap), ey = gridY + 2;
    if (clickX >= ex && clickX <= ex + cellW && clickY >= ey && clickY <= ey + cellH) {
      const slot = equipSlots[i];
      const eItem = p.equipment[slot];
      if (eItem) {
        enchantSystem.selectedItem = eItem;
        enchantSystem.selectedSource = slot;
        enchantSystem.selectedIdx = -1;
      }
      return true;
    }
  }

  // ---- Inventory grid ----
  const enhanceableInv = [];
  for (let i = 0; i < p.inventory.length; i++) {
    const inv = p.inventory[i];
    if (inv && (inv.type === 'weapon' || inv.type === 'armor' || inv.type === 'accessory')) {
      enhanceableInv.push({ item: inv, idx: i });
    }
  }

  const invStartX = gridX + 3 * (cellW + gap) + 10;
  const invCols = 5;
  for (let i = 0; i < enhanceableInv.length; i++) {
    const { item: inv, idx } = enhanceableInv[i];
    const col = i % invCols, row = Math.floor(i / invCols);
    const ix = invStartX + col * (cellW + gap), iy = gridY + 2 + row * (cellH + gap);

    if (iy + cellH > py + ph - 10) break;

    if (clickX >= ix && clickX <= ix + cellW && clickY >= iy && clickY <= iy + cellH) {
      enchantSystem.selectedItem = inv;
      enchantSystem.selectedSource = 'inventory';
      enchantSystem.selectedIdx = idx;
      return true;
    }
  }

  // ---- Auto-enchant toggle ----
  const autoY = py + ph - 36;
  const autoToggleX = px + 12, autoToggleY = autoY;
  if (clickX >= autoToggleX && clickX <= autoToggleX + 12 && clickY >= autoToggleY && clickY <= autoToggleY + 12) {
    enchantSystem.autoEnchant = !enchantSystem.autoEnchant;
    return true;
  }

  // ---- Max level - / + buttons ----
  const minBtnX = px + pw - 40, maxBtnX = px + pw - 20;
  if (clickX >= minBtnX && clickX <= minBtnX + 14 && clickY >= autoToggleY && clickY <= autoToggleY + 12) {
    enchantSystem.autoMaxLevel = Math.max(1, enchantSystem.autoMaxLevel - 1);
    return true;
  }
  if (clickX >= maxBtnX && clickX <= maxBtnX + 14 && clickY >= autoToggleY && clickY <= autoToggleY + 12) {
    enchantSystem.autoMaxLevel = Math.min(7, enchantSystem.autoMaxLevel + 1);
    return true;
  }

  return true; // Click inside panel, consume it
}

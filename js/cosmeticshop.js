// ============================================================
// COSMETIC SHOP — Skins & Skill Effects
// ============================================================

const SKIN_DEFS = {
  shadow:   { name:'Shadow',   price:5000,  rarity:'rare',      tint:'#0a0020', opacity:0.55, desc:'Shrouded in darkness' },
  crimson:  { name:'Crimson',  price:5000,  rarity:'rare',      tint:'#cc0000', opacity:0.40, desc:'Forged in blood' },
  frost:    { name:'Frost',    price:5000,  rarity:'rare',      tint:'#0066cc', opacity:0.40, desc:'Cold as winter' },
  toxic:    { name:'Toxic',    price:5000,  rarity:'rare',      tint:'#00aa22', opacity:0.40, desc:'Venomous aura' },
  sakura:   { name:'Sakura',   price:8000,  rarity:'epic',      tint:'#ff66aa', opacity:0.40, desc:'Cherry blossom spirit' },
  golden:   { name:'Golden',   price:10000, rarity:'epic',      tint:'#ddaa00', opacity:0.45, desc:'Blessed by the gods' },
  celestial:{ name:'Celestial',price:12000, rarity:'epic',      tint:'#88ccff', opacity:0.35, desc:'Heavenly radiance' },
  phantom:  { name:'Phantom',  price:20000, rarity:'legendary', tint:'#8833cc', opacity:0.50, desc:'Between worlds' }
};

const EFFECT_THEMES = {
  inferno: {
    name:'Inferno', price:3000, rarity:'rare', desc:'Fire effects',
    hit:'#FF4400', slash:'#FF6600', aoe:'#FF2200', aoeInner:'#FFAA00',
    heal:'#FF8844', healCross:'#FF6622', buff:'#FF8844', buffInner:'#FF4400',
    particle:'#FFAA00', particleAlt:'#FF4400'
  },
  blizzard: {
    name:'Blizzard', price:3000, rarity:'rare', desc:'Ice effects',
    hit:'#88DDFF', slash:'#AAEEFF', aoe:'#4488FF', aoeInner:'#88CCFF',
    heal:'#66CCFF', healCross:'#44AAEE', buff:'#88DDFF', buffInner:'#4488FF',
    particle:'#AAEEFF', particleAlt:'#66BBFF'
  },
  thunder: {
    name:'Thunder', price:5000, rarity:'epic', desc:'Lightning effects',
    hit:'#FFEE44', slash:'#FFFF88', aoe:'#FFDD00', aoeInner:'#FFFFFF',
    heal:'#FFEE88', healCross:'#FFDD44', buff:'#FFEE44', buffInner:'#FFFF88',
    particle:'#FFFF44', particleAlt:'#FFDD00'
  },
  void: {
    name:'Void', price:5000, rarity:'epic', desc:'Dark energy effects',
    hit:'#AA44FF', slash:'#CC66FF', aoe:'#7722CC', aoeInner:'#AA44FF',
    heal:'#BB66FF', healCross:'#9944DD', buff:'#AA44FF', buffInner:'#7722CC',
    particle:'#CC66FF', particleAlt:'#8833DD'
  },
  divine: {
    name:'Divine', price:10000, rarity:'legendary', desc:'Holy light effects',
    hit:'#FFD700', slash:'#FFFFAA', aoe:'#FFD700', aoeInner:'#FFFFFF',
    heal:'#FFFFCC', healCross:'#FFD700', buff:'#FFD700', buffInner:'#FFFFAA',
    particle:'#FFFFAA', particleAlt:'#FFD700'
  }
};

const cosmeticShop = {
  panelOpen: false,
  activeTab: 'skins',
  ownedSkins: [],
  ownedEffects: [],
  equippedSkin: null,
  equippedEffect: null,
  scrollOffset: 0,
  npcPos: null,

  // --- INIT ---
  generateSprites() {
    // Stylist NPC sprite
    genSprite('stylist', 16, 16, (c) => {
      c.fillStyle = '#f4c99a'; c.fillRect(6, 4, 4, 4);
      c.fillStyle = '#ff69b4'; c.fillRect(5, 0, 6, 5);
      c.fillStyle = '#e91e9e'; c.fillRect(4, 0, 8, 2);
      c.fillStyle = '#9b59b6'; c.fillRect(5, 8, 6, 6);
      c.fillStyle = '#7d3c98'; c.fillRect(5, 14, 3, 2);
      c.fillStyle = '#7d3c98'; c.fillRect(8, 14, 3, 2);
      c.fillStyle = '#f4c99a'; c.fillRect(3, 9, 2, 4);
      c.fillStyle = '#f4c99a'; c.fillRect(11, 9, 2, 4);
      c.fillStyle = '#111'; c.fillRect(7, 5, 1, 1); c.fillRect(9, 5, 1, 1);
      c.fillStyle = '#FFD700'; c.fillRect(11, 8, 2, 2);
    });
    genSprite('sign_cosmetic', 12, 16, (c) => {
      c.fillStyle = '#8B4513'; c.fillRect(5, 6, 2, 10);
      c.fillStyle = '#9b59b6'; c.fillRect(1, 1, 10, 6);
      c.strokeStyle = '#7d3c98'; c.lineWidth = 0.5; c.strokeRect(1, 1, 10, 6);
      c.fillStyle = '#FFD700'; c.fillRect(4, 2, 1, 4);
      c.fillStyle = '#ff69b4'; c.fillRect(6, 2, 1, 4);
      c.fillStyle = '#88ccff'; c.fillRect(8, 2, 1, 4);
    });
  },

  initTownNPC() {
    const tcx = Math.floor(MAP_W / 2), tcy = Math.floor(MAP_H / 2);
    this.npcPos = {
      x: (tcx + 5) * TILE + TILE / 2,
      y: (tcy + 3) * TILE + TILE / 2,
      name: 'Stylist'
    };
  },

  // --- SKIN SPRITE GENERATION ---
  _generateSkinSprites(skinId) {
    const skin = SKIN_DEFS[skinId];
    if (!skin) return;
    // Get all character prefixes that exist in sprite cache
    const basePrefixes = ['knight','mage','ranger','priest'];
    const advPrefixes = ['paladin','darknight','archmage','chronomancer','sniper','beastlord','archbishop','necromancer'];
    const dirs = ['down','up','left','right'];

    for (const prefix of [...basePrefixes, ...advPrefixes]) {
      for (const dir of dirs) {
        for (let f = 0; f < 3; f++) {
          const baseKey = prefix + '_' + dir + '_' + f;
          const base = spriteCache[baseKey];
          if (!base) continue;
          const key = 'skin_' + skinId + '_' + baseKey;
          if (spriteCache[key]) continue;

          const cv = document.createElement('canvas');
          cv.width = 32; cv.height = 32;
          const c = cv.getContext('2d');
          c.drawImage(base, 0, 0);
          c.globalCompositeOperation = 'source-atop';
          c.fillStyle = skin.tint;
          c.globalAlpha = skin.opacity;
          c.fillRect(0, 0, 32, 32);
          spriteCache[key] = cv;
        }
      }
    }
  },

  // --- GET SKIN SPRITE KEY ---
  getSkinSpriteKey(baseKey) {
    if (!this.equippedSkin) return null;
    const skinKey = 'skin_' + this.equippedSkin + '_' + baseKey;
    return spriteCache[skinKey] ? skinKey : null;
  },

  // --- GET EFFECT THEME ---
  getEffectTheme() {
    if (!this.equippedEffect) return null;
    return EFFECT_THEMES[this.equippedEffect] || null;
  },

  // --- DRAW NPC ---
  drawNPC() {
    if (game.state !== 'playing' || !this.npcPos || (typeof dungeon !== 'undefined' && dungeon.active)) return;
    const npc = this.npcPos;
    const { x: sx, y: sy } = camera.worldToScreen(npc.x, npc.y);
    if (sx < -64 || sx > canvas.width + 64 || sy < -64 || sy > canvas.height + 64) return;

    const spr = spriteCache['stylist'];
    if (spr) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spr, sx - 16, sy - 16, 32, 32);
      ctx.restore();
    }
    const sign = spriteCache['sign_cosmetic'];
    if (sign) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sign, sx + 16, sy + 4, 24, 32);
      ctx.restore();
    }

    ctx.save();
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.strokeText(npc.name, sx, sy - 22);
    ctx.fillStyle = '#FF69B4';
    ctx.fillText(npc.name, sx, sy - 22);
    if (game.player) {
      const dist = Math.hypot(game.player.x - npc.x, game.player.y - npc.y);
      if (dist < TILE * 2.5) {
        ctx.font = '9px monospace';
        ctx.strokeText('[Click to Browse]', sx, sy - 32);
        ctx.fillStyle = '#AADDFF';
        ctx.fillText('[Click to Browse]', sx, sy - 32);
      }
    }
    ctx.restore();
  },

  // --- NPC CLICK ---
  checkNPCClick(clickX, clickY) {
    if (game.state !== 'playing' || !game.player || !this.npcPos || (typeof dungeon !== 'undefined' && dungeon.active)) return false;
    if (this.panelOpen) return this._handlePanelClick(clickX, clickY);

    const { x: sx, y: sy } = camera.worldToScreen(this.npcPos.x, this.npcPos.y);
    if (Math.hypot(clickX - sx, clickY - sy) < TILE * 1.5) {
      const dist = Math.hypot(game.player.x - this.npcPos.x, game.player.y - this.npcPos.y);
      if (dist < TILE * 3) {
        this.panelOpen = true;
        this.scrollOffset = 0;
        return true;
      }
    }
    return false;
  },

  // --- DRAW PANEL ---
  drawPanel() {
    if (!this.panelOpen || !game.player) return;
    const p = game.player;
    const W = canvas.width, H = canvas.height;
    const pw = 480, ph = 500;
    const px = (W - pw) / 2, py = (H - ph) / 2;

    ctx.save();

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);

    // Panel bg
    ctx.fillStyle = 'rgba(10,10,30,0.95)';
    roundRect(ctx, px, py, pw, ph, 12);
    ctx.fill();
    ctx.strokeStyle = '#9b59b6';
    ctx.lineWidth = 2;
    roundRect(ctx, px, py, pw, ph, 12);
    ctx.stroke();

    // Title
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FF69B4';
    ctx.fillText('Cosmetic Shop', px + pw / 2, py + 28);

    // Close button
    const closeX = px + pw - 28, closeY = py + 8;
    ctx.fillStyle = 'rgba(180,40,40,0.8)';
    roundRect(ctx, closeX, closeY, 20, 20, 4);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('X', closeX + 10, closeY + 15);

    // Gold
    ctx.textAlign = 'right';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(p.gold + 'g', px + pw - 36, py + 26);

    // Tabs
    const tabW = 100, tabH = 28;
    const tabY = py + 40;
    const tabs = [{ id: 'skins', label: 'SKINS' }, { id: 'effects', label: 'EFFECTS' }];
    for (let i = 0; i < tabs.length; i++) {
      const tx = px + 20 + i * (tabW + 8);
      const active = this.activeTab === tabs[i].id;
      ctx.fillStyle = active ? 'rgba(155,89,182,0.6)' : 'rgba(40,40,60,0.6)';
      roundRect(ctx, tx, tabY, tabW, tabH, 6);
      ctx.fill();
      ctx.strokeStyle = active ? '#bb77dd' : '#555';
      ctx.lineWidth = 1;
      roundRect(ctx, tx, tabY, tabW, tabH, 6);
      ctx.stroke();
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = active ? '#fff' : '#888';
      ctx.fillText(tabs[i].label, tx + tabW / 2, tabY + 19);
    }

    // Content area
    const contentY = tabY + tabH + 12;
    const contentH = ph - (contentY - py) - 12;
    ctx.save();
    ctx.beginPath();
    ctx.rect(px + 8, contentY, pw - 16, contentH);
    ctx.clip();

    if (this.activeTab === 'skins') {
      this._drawSkinItems(px, contentY, pw, contentH);
    } else {
      this._drawEffectItems(px, contentY, pw, contentH);
    }

    ctx.restore();
    ctx.restore();
  },

  _drawSkinItems(px, startY, pw, maxH) {
    const items = Object.entries(SKIN_DEFS);
    const rowH = 60;
    let y = startY - this.scrollOffset;

    for (const [id, skin] of items) {
      if (y + rowH < startY || y > startY + maxH) { y += rowH + 4; continue; }

      const owned = this.ownedSkins.includes(id);
      const equipped = this.equippedSkin === id;
      const rc = RARITY_COLORS[skin.rarity] || '#aaa';

      // Row bg
      ctx.fillStyle = equipped ? rc + '33' : rc + '11';
      roundRect(ctx, px + 12, y, pw - 24, rowH, 6);
      ctx.fill();
      ctx.strokeStyle = equipped ? rc : rc + '44';
      ctx.lineWidth = equipped ? 2 : 1;
      roundRect(ctx, px + 12, y, pw - 24, rowH, 6);
      ctx.stroke();

      // Color preview swatch
      ctx.fillStyle = skin.tint;
      ctx.globalAlpha = 1;
      roundRect(ctx, px + 20, y + 8, 44, 44, 4);
      ctx.fill();
      // Mini character silhouette on swatch
      const prefix = (typeof classChangeSystem !== 'undefined' && classChangeSystem.getSpritePrefix)
        ? classChangeSystem.getSpritePrefix(game.player) : (game.player.className || 'knight').toLowerCase();
      const previewKey = 'skin_' + id + '_' + prefix + '_down_0';
      const baseSpr = spriteCache[previewKey] || spriteCache[prefix + '_down_0'];
      if (baseSpr) {
        ctx.globalAlpha = 1;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(baseSpr, px + 22, y + 10, 40, 40);
      }
      ctx.globalAlpha = 1;

      // Name
      ctx.textAlign = 'left';
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = rc;
      ctx.fillText(skin.name, px + 72, y + 20);

      // Rarity
      ctx.font = '9px monospace';
      ctx.fillStyle = rc;
      ctx.fillText(skin.rarity.toUpperCase(), px + 72, y + 32);

      // Description
      ctx.font = '10px monospace';
      ctx.fillStyle = '#888';
      ctx.fillText(skin.desc, px + 72, y + 46);

      // Button
      const btnW = 70, btnH = 24;
      const btnX = px + pw - btnW - 20, btnY = y + 18;

      if (equipped) {
        ctx.fillStyle = 'rgba(100,100,100,0.6)';
        roundRect(ctx, btnX, btnY, btnW, btnH, 4);
        ctx.fill();
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#aaa';
        ctx.fillText('UNEQUIP', btnX + btnW / 2, btnY + 16);
      } else if (owned) {
        ctx.fillStyle = 'rgba(39,174,96,0.8)';
        roundRect(ctx, btnX, btnY, btnW, btnH, 4);
        ctx.fill();
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('EQUIP', btnX + btnW / 2, btnY + 16);
      } else {
        const canBuy = game.player.gold >= skin.price;
        ctx.fillStyle = canBuy ? 'rgba(142,68,173,0.8)' : 'rgba(60,60,60,0.8)';
        roundRect(ctx, btnX, btnY, btnW, btnH, 4);
        ctx.fill();
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = canBuy ? '#fff' : '#666';
        ctx.fillText(skin.price + 'g', btnX + btnW / 2, btnY + 16);
      }

      y += rowH + 4;
    }
  },

  _drawEffectItems(px, startY, pw, maxH) {
    const items = Object.entries(EFFECT_THEMES);
    const rowH = 60;
    let y = startY - this.scrollOffset;

    for (const [id, ef] of items) {
      if (y + rowH < startY || y > startY + maxH) { y += rowH + 4; continue; }

      const owned = this.ownedEffects.includes(id);
      const equipped = this.equippedEffect === id;
      const rc = RARITY_COLORS[ef.rarity] || '#aaa';

      // Row bg
      ctx.fillStyle = equipped ? rc + '33' : rc + '11';
      roundRect(ctx, px + 12, y, pw - 24, rowH, 6);
      ctx.fill();
      ctx.strokeStyle = equipped ? rc : rc + '44';
      ctx.lineWidth = equipped ? 2 : 1;
      roundRect(ctx, px + 12, y, pw - 24, rowH, 6);
      ctx.stroke();

      // Effect preview — animated particles
      const t = Date.now() / 1000;
      ctx.save();
      for (let i = 0; i < 8; i++) {
        const a = Math.PI * 2 * i / 8 + t * 2;
        const r = 12 + Math.sin(t * 3 + i) * 4;
        ctx.fillStyle = i % 2 === 0 ? ef.particle : ef.particleAlt;
        ctx.globalAlpha = 0.6 + Math.sin(t * 4 + i) * 0.4;
        ctx.beginPath();
        ctx.arc(px + 42 + Math.cos(a) * r, y + 30 + Math.sin(a) * r, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Center glow
      ctx.globalAlpha = 0.3 + Math.sin(t * 2) * 0.2;
      ctx.fillStyle = ef.hit;
      ctx.beginPath();
      ctx.arc(px + 42, y + 30, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Name
      ctx.textAlign = 'left';
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = rc;
      ctx.fillText(ef.name, px + 72, y + 20);

      // Rarity
      ctx.font = '9px monospace';
      ctx.fillStyle = rc;
      ctx.fillText(ef.rarity.toUpperCase(), px + 72, y + 32);

      // Description
      ctx.font = '10px monospace';
      ctx.fillStyle = '#888';
      ctx.fillText(ef.desc, px + 72, y + 46);

      // Button
      const btnW = 70, btnH = 24;
      const btnX = px + pw - btnW - 20, btnY = y + 18;

      if (equipped) {
        ctx.fillStyle = 'rgba(100,100,100,0.6)';
        roundRect(ctx, btnX, btnY, btnW, btnH, 4);
        ctx.fill();
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#aaa';
        ctx.fillText('UNEQUIP', btnX + btnW / 2, btnY + 16);
      } else if (owned) {
        ctx.fillStyle = 'rgba(39,174,96,0.8)';
        roundRect(ctx, btnX, btnY, btnW, btnH, 4);
        ctx.fill();
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('EQUIP', btnX + btnW / 2, btnY + 16);
      } else {
        const canBuy = game.player.gold >= ef.price;
        ctx.fillStyle = canBuy ? 'rgba(142,68,173,0.8)' : 'rgba(60,60,60,0.8)';
        roundRect(ctx, btnX, btnY, btnW, btnH, 4);
        ctx.fill();
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = canBuy ? '#fff' : '#666';
        ctx.fillText(ef.price + 'g', btnX + btnW / 2, btnY + 16);
      }

      y += rowH + 4;
    }
  },

  // --- CLICK HANDLER ---
  _handlePanelClick(clickX, clickY) {
    if (!this.panelOpen || !game.player) return false;
    const p = game.player;
    const W = canvas.width, H = canvas.height;
    const pw = 480, ph = 500;
    const px = (W - pw) / 2, py = (H - ph) / 2;

    // Outside panel
    if (clickX < px || clickX > px + pw || clickY < py || clickY > py + ph) {
      this.panelOpen = false;
      return true;
    }

    // Close button
    const closeX = px + pw - 28, closeY = py + 8;
    if (clickX >= closeX && clickX <= closeX + 20 && clickY >= closeY && clickY <= closeY + 20) {
      this.panelOpen = false;
      return true;
    }

    // Tab clicks
    const tabW = 100, tabH = 28, tabY = py + 40;
    const tabs = ['skins', 'effects'];
    for (let i = 0; i < tabs.length; i++) {
      const tx = px + 20 + i * (tabW + 8);
      if (clickX >= tx && clickX <= tx + tabW && clickY >= tabY && clickY <= tabY + tabH) {
        this.activeTab = tabs[i];
        this.scrollOffset = 0;
        return true;
      }
    }

    // Item clicks
    const contentY = tabY + tabH + 12;
    const items = this.activeTab === 'skins' ? Object.entries(SKIN_DEFS) : Object.entries(EFFECT_THEMES);
    const rowH = 60;
    let y = contentY - this.scrollOffset;

    for (const [id, item] of items) {
      const btnW = 70, btnH = 24;
      const btnX = px + pw - btnW - 20, btnY = y + 18;

      if (clickX >= btnX && clickX <= btnX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
        if (this.activeTab === 'skins') {
          this._handleSkinAction(id, item);
        } else {
          this._handleEffectAction(id, item);
        }
        return true;
      }
      y += rowH + 4;
    }

    return true;
  },

  _handleSkinAction(id, skin) {
    const p = game.player;
    if (this.equippedSkin === id) {
      // Unequip
      this.equippedSkin = null;
      addNotification('Skin removed', '#aaa');
      saveGame();
      return;
    }
    if (this.ownedSkins.includes(id)) {
      // Equip
      this._generateSkinSprites(id);
      this.equippedSkin = id;
      addNotification('Equipped ' + skin.name + ' skin!', RARITY_COLORS[skin.rarity]);
      if (typeof sfx !== 'undefined' && sfx.itemPickup) sfx.itemPickup();
      saveGame();
      return;
    }
    // Buy
    if (p.gold >= skin.price) {
      p.gold -= skin.price;
      this.ownedSkins.push(id);
      this._generateSkinSprites(id);
      this.equippedSkin = id;
      addNotification('Bought ' + skin.name + ' skin!', RARITY_COLORS[skin.rarity]);
      addLog('Purchased ' + skin.name + ' skin for ' + skin.price + 'g', '#FF69B4');
      if (typeof sfx !== 'undefined' && sfx.itemPickup) sfx.itemPickup();
      saveGame();
    } else {
      addNotification('Not enough gold!', '#FF4444');
    }
  },

  _handleEffectAction(id, ef) {
    const p = game.player;
    if (this.equippedEffect === id) {
      this.equippedEffect = null;
      addNotification('Effect removed', '#aaa');
      saveGame();
      return;
    }
    if (this.ownedEffects.includes(id)) {
      this.equippedEffect = id;
      addNotification('Equipped ' + ef.name + ' effects!', RARITY_COLORS[ef.rarity]);
      if (typeof sfx !== 'undefined' && sfx.itemPickup) sfx.itemPickup();
      saveGame();
      return;
    }
    if (p.gold >= ef.price) {
      p.gold -= ef.price;
      this.ownedEffects.push(id);
      this.equippedEffect = id;
      addNotification('Bought ' + ef.name + ' effects!', RARITY_COLORS[ef.rarity]);
      addLog('Purchased ' + ef.name + ' effects for ' + ef.price + 'g', '#FF69B4');
      if (typeof sfx !== 'undefined' && sfx.itemPickup) sfx.itemPickup();
      saveGame();
    } else {
      addNotification('Not enough gold!', '#FF4444');
    }
  },

  // --- SCROLL ---
  handleScroll(delta) {
    if (!this.panelOpen) return false;
    const items = this.activeTab === 'skins' ? Object.keys(SKIN_DEFS) : Object.keys(EFFECT_THEMES);
    const maxScroll = Math.max(0, items.length * 64 - 350);
    this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset + delta * 40));
    return true;
  },

  // --- SAVE / LOAD ---
  save() {
    return {
      ownedSkins: this.ownedSkins,
      ownedEffects: this.ownedEffects,
      equippedSkin: this.equippedSkin,
      equippedEffect: this.equippedEffect
    };
  },

  load(data) {
    if (!data) return;
    this.ownedSkins = data.ownedSkins || [];
    this.ownedEffects = data.ownedEffects || [];
    this.equippedSkin = data.equippedSkin || null;
    this.equippedEffect = data.equippedEffect || null;
    // Regenerate sprites for equipped skin
    if (this.equippedSkin) {
      this._generateSkinSprites(this.equippedSkin);
    }
  }
};

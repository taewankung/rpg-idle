// ============================================================
// COSMETIC SHOP — Skins & Skill Effects
// ============================================================

const SKIN_DEFS = {
  // --- Rare (5000g) ---
  shadow:     { name:'Shadow Cloak',    price:5000,  rarity:'rare', tint:'#0a0020', opacity:0.55, desc:'Vanish into darkness',
                aura:{color:'#1a0033',alt:'#330055',count:4,speed:1.5,size:2,style:'smoke'} },
  crimson:    { name:'Blood Knight',    price:5000,  rarity:'rare', tint:'#cc0000', opacity:0.40, desc:'Armor forged in blood',
                aura:{color:'#ff2200',alt:'#880000',count:3,speed:2,size:2,style:'drip'} },
  frost:      { name:'Frostborne',      price:5000,  rarity:'rare', tint:'#0066cc', opacity:0.40, desc:'Frozen warrior of the north',
                aura:{color:'#aaeeff',alt:'#44aaff',count:5,speed:1,size:2,style:'snowflake'} },
  sylvan:     { name:'Sylvan Spirit',   price:5000,  rarity:'rare', tint:'#1a6b2a', opacity:0.38, desc:'One with the ancient forest',
                aura:{color:'#44dd44',alt:'#88ff44',count:4,speed:0.8,size:2,style:'leaf'} },
  // --- Epic (8000-12000g) ---
  dragonborn: { name:'Dragonborn',      price:8000,  rarity:'epic', tint:'#cc4400', opacity:0.42, desc:'Dragon scales burn with fury',
                aura:{color:'#ff6600',alt:'#ffaa00',count:6,speed:2.5,size:3,style:'flame'} },
  stormcall:  { name:'Stormcaller',     price:8000,  rarity:'epic', tint:'#2244aa', opacity:0.38, desc:'Thunder courses through veins',
                aura:{color:'#ffff44',alt:'#44aaff',count:4,speed:3,size:2,style:'spark'} },
  sakura:     { name:'Sakura Bloom',    price:10000, rarity:'epic', tint:'#ff66aa', opacity:0.38, desc:'Cherry blossom warrior',
                aura:{color:'#ffaacc',alt:'#ff88bb',count:6,speed:0.6,size:3,style:'petal'} },
  abyssal:    { name:'Abyssal Lord',    price:10000, rarity:'epic', tint:'#220044', opacity:0.50, desc:'Demon king from the abyss',
                aura:{color:'#8800cc',alt:'#ff00aa',count:5,speed:2,size:3,style:'flame'} },
  celestial:  { name:'Celestial',       price:12000, rarity:'epic', tint:'#88ccff', opacity:0.35, desc:'Blessed by the heavens',
                aura:{color:'#ffffcc',alt:'#ffdd88',count:5,speed:0.7,size:2,style:'glow'} },
  // --- Legendary (15000-30000g) ---
  phoenix:    { name:'Phoenix Reborn',  price:15000, rarity:'legendary', tint:'#dd6600', opacity:0.45, desc:'Rise from the ashes eternal',
                aura:{color:'#ff4400',alt:'#ffcc00',count:8,speed:3,size:3,style:'flame'} },
  astral:     { name:'Astral Walker',   price:20000, rarity:'legendary', tint:'#4422aa', opacity:0.40, desc:'Walk among the stars',
                aura:{color:'#aaaaff',alt:'#ff88ff',count:7,speed:1.2,size:2,style:'star'} },
  voidking:   { name:'Void Emperor',    price:25000, rarity:'legendary', tint:'#110022', opacity:0.55, desc:'Ruler of the endless void',
                aura:{color:'#aa00ff',alt:'#000000',count:6,speed:2,size:4,style:'vortex'} },
  seraphim:   { name:'Seraphim',        price:30000, rarity:'legendary', tint:'#fff8e0', opacity:0.30, desc:'Six-winged divine avatar',
                aura:{color:'#FFD700',alt:'#ffffff',count:8,speed:0.5,size:3,style:'halo'} }
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

  // --- DRAW SKIN AURA around player ---
  drawSkinAura(sx, sy) {
    if (!this.equippedSkin) return;
    const skin = SKIN_DEFS[this.equippedSkin];
    if (!skin || !skin.aura) return;
    const a = skin.aura;
    const t = Date.now() / 1000;
    ctx.save();

    if (a.style === 'flame') {
      for (let i = 0; i < a.count; i++) {
        const angle = (Math.PI * 2 * i / a.count) + t * a.speed;
        const r = 10 + Math.sin(t * 3 + i * 1.7) * 4;
        const py = -Math.abs(Math.sin(t * 4 + i * 2)) * 8;
        ctx.globalAlpha = 0.4 + Math.sin(t * 5 + i) * 0.3;
        ctx.fillStyle = i % 2 === 0 ? a.color : a.alt;
        ctx.beginPath();
        ctx.arc(sx + Math.cos(angle) * r, sy + Math.sin(angle) * r * 0.5 + py, a.size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (a.style === 'snowflake') {
      for (let i = 0; i < a.count; i++) {
        const ox = Math.sin(t * 0.7 + i * 2.1) * 14;
        const oy = ((t * 12 + i * 17) % 32) - 16;
        ctx.globalAlpha = 0.5 + Math.sin(t * 2 + i) * 0.3;
        ctx.fillStyle = i % 2 === 0 ? a.color : a.alt;
        ctx.fillRect(sx + ox - 1, sy + oy - 1, a.size, a.size);
      }
    } else if (a.style === 'leaf') {
      for (let i = 0; i < a.count; i++) {
        const ox = Math.sin(t * 0.5 + i * 1.8) * 16;
        const oy = Math.cos(t * 0.3 + i * 2.5) * 12;
        const rot = t * 2 + i;
        ctx.globalAlpha = 0.5 + Math.sin(t + i) * 0.3;
        ctx.fillStyle = i % 2 === 0 ? a.color : a.alt;
        ctx.save();
        ctx.translate(sx + ox, sy + oy);
        ctx.rotate(rot);
        ctx.fillRect(-a.size, -1, a.size * 2, 2);
        ctx.restore();
      }
    } else if (a.style === 'spark') {
      for (let i = 0; i < a.count; i++) {
        const phase = t * a.speed + i * 1.5;
        const flash = Math.random() > 0.7;
        if (!flash && Math.sin(phase) < 0) continue;
        const ox = Math.sin(phase) * 14;
        const oy = Math.cos(phase * 1.3) * 10;
        ctx.globalAlpha = 0.6 + Math.random() * 0.4;
        ctx.fillStyle = i % 2 === 0 ? a.color : a.alt;
        ctx.fillRect(sx + ox - 1, sy + oy - 1, 2, a.size + Math.random() * 3);
      }
    } else if (a.style === 'smoke') {
      for (let i = 0; i < a.count; i++) {
        const ox = Math.sin(t * 0.8 + i * 2.3) * 12;
        const oy = -((t * 8 + i * 13) % 20);
        ctx.globalAlpha = 0.15 + Math.sin(t + i) * 0.1;
        ctx.fillStyle = i % 2 === 0 ? a.color : a.alt;
        ctx.beginPath();
        ctx.arc(sx + ox, sy + oy, a.size + 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (a.style === 'drip') {
      for (let i = 0; i < a.count; i++) {
        const ox = Math.sin(i * 2.5) * 8;
        const oy = ((t * 15 + i * 20) % 24);
        ctx.globalAlpha = 0.5 - oy / 48;
        ctx.fillStyle = i % 2 === 0 ? a.color : a.alt;
        ctx.fillRect(sx + ox - 1, sy + oy - 2, 2, a.size + 1);
      }
    } else if (a.style === 'petal') {
      for (let i = 0; i < a.count; i++) {
        const angle = t * a.speed + i * (Math.PI * 2 / a.count);
        const r = 14 + Math.sin(t * 1.5 + i) * 5;
        const oy = Math.sin(t * 0.8 + i * 1.2) * 4;
        ctx.globalAlpha = 0.5 + Math.sin(t * 2 + i) * 0.3;
        ctx.fillStyle = i % 2 === 0 ? a.color : a.alt;
        ctx.save();
        ctx.translate(sx + Math.cos(angle) * r, sy + Math.sin(angle) * r * 0.5 + oy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, a.size, a.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (a.style === 'glow') {
      ctx.globalAlpha = 0.12 + Math.sin(t * 1.5) * 0.06;
      const grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, 18);
      grad.addColorStop(0, a.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, 18, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < a.count; i++) {
        const angle = t * a.speed + i * (Math.PI * 2 / a.count);
        ctx.globalAlpha = 0.3 + Math.sin(t * 2 + i) * 0.2;
        ctx.fillStyle = i % 2 === 0 ? a.color : a.alt;
        ctx.beginPath();
        ctx.arc(sx + Math.cos(angle) * 14, sy + Math.sin(angle) * 14 * 0.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (a.style === 'star') {
      for (let i = 0; i < a.count; i++) {
        const angle = t * a.speed * 0.5 + i * (Math.PI * 2 / a.count);
        const r = 12 + Math.sin(t * 2 + i * 1.3) * 6;
        const twinkle = Math.sin(t * 6 + i * 3) > 0.3;
        if (!twinkle) continue;
        ctx.globalAlpha = 0.5 + Math.sin(t * 4 + i) * 0.4;
        ctx.fillStyle = i % 3 === 0 ? a.alt : a.color;
        const px2 = sx + Math.cos(angle) * r, py2 = sy + Math.sin(angle) * r * 0.6;
        ctx.fillRect(px2 - 1, py2, 3, 1);
        ctx.fillRect(px2, py2 - 1, 1, 3);
      }
    } else if (a.style === 'vortex') {
      for (let i = 0; i < a.count; i++) {
        const angle = t * a.speed + i * (Math.PI * 2 / a.count);
        const r = 8 + i * 2 + Math.sin(t * 3) * 3;
        ctx.globalAlpha = 0.4 - i * 0.04;
        ctx.fillStyle = i % 2 === 0 ? a.color : a.alt;
        ctx.beginPath();
        ctx.arc(sx + Math.cos(angle) * r, sy + Math.sin(angle) * r * 0.6, a.size - i * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (a.style === 'halo') {
      // Golden ring above head
      ctx.globalAlpha = 0.4 + Math.sin(t * 2) * 0.15;
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 20, 8, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Light rays
      for (let i = 0; i < a.count; i++) {
        const angle = t * a.speed + i * (Math.PI * 2 / a.count);
        const r = 16 + Math.sin(t * 1.5 + i) * 4;
        ctx.globalAlpha = 0.2 + Math.sin(t * 2 + i * 0.8) * 0.15;
        ctx.fillStyle = i % 2 === 0 ? a.color : a.alt;
        ctx.beginPath();
        ctx.arc(sx + Math.cos(angle) * r, sy + Math.sin(angle) * r * 0.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
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

    // Scrollbar
    const items = this.activeTab === 'skins' ? Object.keys(SKIN_DEFS) : Object.keys(EFFECT_THEMES);
    const totalH = items.length * 64;
    if (totalH > contentH) {
      const barX = px + pw - 10, barH = contentH - 8;
      const thumbH = Math.max(20, (contentH / totalH) * barH);
      const maxScroll = totalH - contentH;
      const thumbY = contentY + 4 + (this.scrollOffset / maxScroll) * (barH - thumbH);
      // Track
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      roundRect(ctx, barX, contentY + 4, 6, barH, 3);
      ctx.fill();
      // Thumb
      ctx.fillStyle = 'rgba(155,89,182,0.5)';
      roundRect(ctx, barX, thumbY, 6, thumbH, 3);
      ctx.fill();
    }

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

      // Preview swatch with aura
      const swX = px + 20, swY = y + 8, swS = 44;
      const t = Date.now() / 1000;
      const au = skin.aura;

      // Dark bg
      ctx.fillStyle = '#0a0a1a';
      roundRect(ctx, swX, swY, swS, swS, 6);
      ctx.fill();

      // Rarity glow behind character
      ctx.save();
      ctx.globalAlpha = 0.2 + Math.sin(t * 2) * 0.1;
      const grd = ctx.createRadialGradient(swX + swS/2, swY + swS/2, 2, swX + swS/2, swY + swS/2, swS/2);
      grd.addColorStop(0, rc);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(swX + swS/2, swY + swS/2, swS/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Mini aura particles
      if (au) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(swX, swY, swS, swS);
        ctx.clip();
        const cx2 = swX + swS/2, cy2 = swY + swS/2;
        for (let i = 0; i < Math.min(au.count, 5); i++) {
          const ang = (Math.PI * 2 * i / Math.min(au.count, 5)) + t * (au.speed || 1);
          const r2 = 12 + Math.sin(t * 2 + i * 1.5) * 4;
          ctx.globalAlpha = 0.5 + Math.sin(t * 3 + i) * 0.3;
          ctx.fillStyle = i % 2 === 0 ? au.color : au.alt;
          ctx.beginPath();
          ctx.arc(cx2 + Math.cos(ang) * r2, cy2 + Math.sin(ang) * r2, au.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Character sprite
      const prefix = (typeof classChangeSystem !== 'undefined' && classChangeSystem.getSpritePrefix)
        ? classChangeSystem.getSpritePrefix(game.player) : (game.player.className || 'knight').toLowerCase();
      const previewKey = 'skin_' + id + '_' + prefix + '_down_0';
      const baseSpr = spriteCache[previewKey] || spriteCache[prefix + '_down_0'];
      if (baseSpr) {
        ctx.globalAlpha = 1;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(baseSpr, swX + 2, swY + 2, 40, 40);
      }
      ctx.globalAlpha = 1;

      // Rarity border
      ctx.strokeStyle = rc;
      ctx.lineWidth = equipped ? 2 : 1;
      roundRect(ctx, swX, swY, swS, swS, 6);
      ctx.stroke();

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

      // Effect preview swatch
      const swX = px + 20, swY = y + 8, swS = 44;
      const t = Date.now() / 1000;

      // Dark bg
      ctx.fillStyle = '#0a0a1a';
      roundRect(ctx, swX, swY, swS, swS, 6);
      ctx.fill();

      // Animated particles
      ctx.save();
      ctx.beginPath();
      ctx.rect(swX, swY, swS, swS);
      ctx.clip();
      const ecx = swX + swS/2, ecy = swY + swS/2;
      for (let i = 0; i < 8; i++) {
        const a = Math.PI * 2 * i / 8 + t * 2;
        const r = 12 + Math.sin(t * 3 + i) * 4;
        ctx.fillStyle = i % 2 === 0 ? ef.particle : ef.particleAlt;
        ctx.globalAlpha = 0.6 + Math.sin(t * 4 + i) * 0.4;
        ctx.beginPath();
        ctx.arc(ecx + Math.cos(a) * r, ecy + Math.sin(a) * r, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Center glow
      ctx.globalAlpha = 0.3 + Math.sin(t * 2) * 0.2;
      ctx.fillStyle = ef.hit;
      ctx.beginPath();
      ctx.arc(ecx, ecy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Rarity border
      ctx.strokeStyle = rc;
      ctx.lineWidth = equipped ? 2 : 1;
      roundRect(ctx, swX, swY, swS, swS, 6);
      ctx.stroke();

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
    const ph = 500, contentY_offset = 40 + 28 + 12; // tabY + tabH + gap
    const contentH = ph - contentY_offset - 12;
    const totalH = items.length * 64;
    const maxScroll = Math.max(0, totalH - contentH);
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

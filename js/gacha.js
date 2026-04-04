// ============================================================
// GACHA — Summoning altar system: banners, pulls, animations, UI
// ============================================================

// --- GACHA PET POOL ---
const GACHA_PET_POOL = {
  common: [
    { type: 'slime', name: 'Slime', stats: { hp: 10, def: 1 }, desc: 'HP+10 DEF+1' },
    { type: 'goblin', name: 'Goblin', stats: { atk: 2, spd: 0.1 }, desc: 'ATK+2 SPD+0.1' }
  ],
  uncommon: [
    { type: 'wolf', name: 'Wolf', stats: { atk: 3, spd: 0.2 }, desc: 'ATK+3 SPD+0.2' },
    { type: 'skeleton', name: 'Skeleton', stats: { atk: 4, def: 2 }, desc: 'ATK+4 DEF+2' }
  ],
  rare: [
    { type: 'golden_slime', name: 'Golden Slime', stats: { hp: 30, def: 5 }, bonus: 'gold+10%', desc: 'HP+30 DEF+5 Gold+10%' },
    { type: 'shadow_wolf', name: 'Shadow Wolf', stats: { atk: 8, crit: 0.05 }, desc: 'ATK+8 CRIT+5%' }
  ],
  epic: [
    { type: 'dragon', name: 'Baby Dragon', stats: { atk: 12, def: 5, hp: 50 }, ability: 'fireAoe', desc: 'ATK+12 DEF+5 HP+50 Fire AoE' }
  ],
  legendary: [
    { type: 'phoenix', name: 'Phoenix', stats: { atk: 15, hp: 100 }, ability: 'revive', desc: 'ATK+15 HP+100 Revive+Fire Aura' }
  ]
};

// --- SPECIAL BANNER FEATURED POOL ---
const SPECIAL_FEATURED_POOL = [
  { name: 'Celestial Blade', type: 'weapon', rarity: 'legendary', stats: { atk: 25, crit: 0.1 }, level: 1, value: 5000, desc: 'ATK+25 CRIT+10%' },
  { name: 'Phoenix Feather Armor', type: 'armor', rarity: 'legendary', stats: { def: 20, hp: 100 }, level: 1, value: 5000, desc: 'DEF+20 HP+100' },
  { name: 'Time Ring', type: 'accessory', rarity: 'legendary', stats: { spd: 1, atk: 5, def: 5, hp: 5, mp: 5 }, level: 1, value: 5000, desc: 'SPD+1 All+5' },
  { name: 'Void Dragon', type: 'pet', rarity: 'legendary', petType: 'dragon', stats: { atk: 20 }, bonus: 'dmg+15%', desc: 'ATK+20 All DMG+15%' },
  { name: 'Starfall Staff', type: 'weapon', rarity: 'legendary', stats: { atk: 20 }, bonus: 'aoe+50%', level: 1, value: 5000, desc: 'ATK+20 AoE+50%' }
];

// --- BANNER DEFINITIONS ---
const GACHA_BANNERS = [
  {
    name: 'Weapons',
    cost: 500,
    cost10: 4500,
    color: '#FF7043',
    rates: [
      { r: 'common', w: 60 },
      { r: 'uncommon', w: 25 },
      { r: 'rare', w: 10 },
      { r: 'epic', w: 4 },
      { r: 'legendary', w: 1 }
    ],
    pityMax: 50,
    pityRarity: 'epic',
    guarantee10: 'rare'
  },
  {
    name: 'Pets',
    cost: 800,
    cost10: 7200,
    color: '#FF69B4',
    rates: [
      { r: 'common', w: 50 },
      { r: 'uncommon', w: 30 },
      { r: 'rare', w: 15 },
      { r: 'epic', w: 4 },
      { r: 'legendary', w: 1 }
    ],
    pityMax: 30,
    pityRarity: 'rare',
    guarantee10: 'rare'
  },
  {
    name: 'Special',
    cost: 1000,
    cost10: 9000,
    color: '#FFD700',
    rates: [
      { r: 'common', w: 57 },
      { r: 'uncommon', w: 25 },
      { r: 'rare', w: 10 },
      { r: 'epic', w: 4 },
      { r: 'legendary', w: 1 },
      { r: 'featured', w: 3 }
    ],
    pityMax: 50,
    pityRarity: 'epic',
    guarantee10: 'rare'
  }
];

// --- GACHA STATE ---
const gachaSystem = {
  panelOpen: false,
  currentBanner: 0,
  animState: 'idle',
  animTimer: 0,
  results: [],
  resultIdx: 0,
  pity: { weapon: 0, pet: 0, special: 0 },
  history: [],
  totalPulls: { weapon: 0, pet: 0, special: 0 },
  specialTimer: 600,
  specialFeatured: null,
  specialFeaturedIdx: 0,
  autoSummon: false,
  autoGoldThreshold: 5000,
  skipAnim: false,
  showRates: false,
  showHistory: false,
  particles: [],
  _altarParticles: [],
  _altarGlowTimer: 0,
  _newBannerTimer: 0,

  // --- PITY KEY ---
  _pityKey(bannerIdx) {
    return ['weapon', 'pet', 'special'][bannerIdx] || 'weapon';
  },

  // --- ROLL RARITY FROM BANNER ---
  _rollBannerRarity(bannerIdx) {
    const banner = GACHA_BANNERS[bannerIdx];
    const rates = banner.rates;
    let total = 0;
    for (const r of rates) total += r.w;
    let roll = Math.random() * total;
    for (const r of rates) {
      roll -= r.w;
      if (roll <= 0) return r.r;
    }
    return 'common';
  },

  // --- RARITY RANK (for pity/guarantee checks) ---
  _rarityRank(r) {
    return { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, featured: 5 }[r] || 0;
  },

  // --- GENERATE WEAPON ITEM ---
  _genWeaponItem(rarity, level) {
    const mult = rarMult(rarity) * (1 + level * 0.1);
    const tr = Math.random();
    let type, name;
    if (tr < 0.4) { type = 'weapon'; name = PRFX[ri(0, PRFX.length - 1)] + WPNS[ri(0, WPNS.length - 1)]; }
    else if (tr < 0.75) { type = 'armor'; name = PRFX[ri(0, PRFX.length - 1)] + ARMRS[ri(0, ARMRS.length - 1)]; }
    else { type = 'accessory'; name = PRFX[ri(0, PRFX.length - 1)] + ACCS[ri(0, ACCS.length - 1)]; }
    const stats = {};
    if (type === 'weapon') {
      stats.atk = Math.round((2 + level * 1.5) * mult);
      if (Math.random() < 0.3) stats.crit = parseFloat((0.01 * mult).toFixed(2));
    } else if (type === 'armor') {
      stats.def = Math.round((1 + level) * mult);
      if (Math.random() < 0.4) stats.hp = Math.round((10 + level * 5) * mult);
    } else {
      stats.spd = parseFloat((0.1 * mult).toFixed(2));
      if (Math.random() < 0.3) stats.mp = Math.round((5 + level * 3) * mult);
    }
    return { name, type, rarity, stats, level, value: Math.round((5 + level * 10) * rarMult(rarity)) };
  },

  // --- GENERATE PET RESULT ---
  _genPetResult(rarity) {
    const pool = GACHA_PET_POOL[rarity];
    if (!pool || pool.length === 0) {
      // fallback to common
      const fb = GACHA_PET_POOL.common;
      return fb[ri(0, fb.length - 1)];
    }
    return pool[ri(0, pool.length - 1)];
  },

  // --- CHECK IS NEW ---
  _isNew(name) {
    for (const h of this.history) {
      if (h.item === name) return false;
    }
    return true;
  },

  // --- SINGLE PULL ---
  pullWeapon() {
    const p = game.player;
    if (!p) return null;
    let rarity = this._rollBannerRarity(0);
    const key = 'weapon';
    this.pity[key]++;
    this.totalPulls[key]++;
    let isPity = false;
    // Pity check
    if (this.pity[key] >= GACHA_BANNERS[0].pityMax && this._rarityRank(rarity) < this._rarityRank(GACHA_BANNERS[0].pityRarity)) {
      rarity = GACHA_BANNERS[0].pityRarity;
      isPity = true;
    }
    // Reset pity on epic+
    if (this._rarityRank(rarity) >= this._rarityRank('epic')) this.pity[key] = 0;

    const item = this._genWeaponItem(rarity, p.level);
    const isNew = this._isNew(item.name);
    this._addHistory(0, item.name, rarity);
    return { item, rarity, isNew, isPity, isFeatured: false, kind: 'item' };
  },

  pullPet() {
    const p = game.player;
    if (!p) return null;
    let rarity = this._rollBannerRarity(1);
    const key = 'pet';
    this.pity[key]++;
    this.totalPulls[key]++;
    let isPity = false;
    if (this.pity[key] >= GACHA_BANNERS[1].pityMax && this._rarityRank(rarity) < this._rarityRank(GACHA_BANNERS[1].pityRarity)) {
      rarity = GACHA_BANNERS[1].pityRarity;
      isPity = true;
    }
    if (this._rarityRank(rarity) >= this._rarityRank('rare')) this.pity[key] = 0;

    const pet = this._genPetResult(rarity);
    const isNew = this._isNew(pet.name);
    this._addHistory(1, pet.name, rarity);
    return { pet, rarity, isNew, isPity, kind: 'pet' };
  },

  pullSpecial() {
    const p = game.player;
    if (!p) return null;
    let rarity = this._rollBannerRarity(2);
    const key = 'special';
    this.pity[key]++;
    this.totalPulls[key]++;
    let isPity = false;
    let isFeatured = false;

    if (this.pity[key] >= GACHA_BANNERS[2].pityMax && this._rarityRank(rarity) < this._rarityRank(GACHA_BANNERS[2].pityRarity)) {
      rarity = GACHA_BANNERS[2].pityRarity;
      isPity = true;
    }
    if (this._rarityRank(rarity) >= this._rarityRank('epic')) this.pity[key] = 0;

    // Featured item
    if (rarity === 'featured' && this.specialFeatured) {
      isFeatured = true;
      const feat = JSON.parse(JSON.stringify(this.specialFeatured));
      if (feat.level) feat.level = Math.max(feat.level, p.level);
      const isNew = this._isNew(feat.name);
      this._addHistory(2, feat.name, 'legendary');

      if (feat.type === 'pet' || feat.petType) {
        const petDef = feat.petType || 'dragon';
        return { pet: { type: petDef, name: feat.name, stats: feat.stats, desc: feat.desc }, rarity: 'legendary', isNew, isPity, isFeatured: true, kind: 'pet' };
      }
      return { item: feat, rarity: 'legendary', isNew, isPity, isFeatured: true, kind: 'item' };
    }

    // Normal weapon pull with special rates
    if (rarity === 'featured') rarity = 'epic'; // fallback if no featured set
    const item = this._genWeaponItem(rarity, p.level);
    const isNew = this._isNew(item.name);
    this._addHistory(2, item.name, rarity);
    return { item, rarity, isNew, isPity, isFeatured: false, kind: 'item' };
  },

  // --- MAIN PULL FUNCTION ---
  doPull(bannerIdx, count) {
    const p = game.player;
    if (!p) return [];
    const banner = GACHA_BANNERS[bannerIdx];
    const cost = count === 10 ? banner.cost10 : banner.cost * count;
    if (p.gold < cost) {
      addNotification('Not enough Gold! Need ' + cost + 'g', '#FF4444');
      return [];
    }
    if (p.inventory.length >= getMaxInventory() && bannerIdx !== 1) {
      addNotification('Inventory full! Sell items first.', '#FF4444');
      return [];
    }
    p.gold -= cost;
    addLog('Spent ' + cost + 'g on ' + count + 'x ' + banner.name + ' summon', '#FFDD44');

    const results = [];
    const pullFn = [() => this.pullWeapon(), () => this.pullPet(), () => this.pullSpecial()][bannerIdx];

    for (let i = 0; i < count; i++) {
      const result = pullFn();
      if (result) results.push(result);
    }

    // 10-pull guarantee: at least one result meets minimum rarity
    if (count === 10 && results.length > 0) {
      const minRarity = banner.guarantee10;
      const hasMin = results.some(r => this._rarityRank(r.rarity) >= this._rarityRank(minRarity));
      if (!hasMin) {
        // Upgrade the last result
        const last = results[results.length - 1];
        last.rarity = minRarity;
        if (last.kind === 'item' && last.item) {
          last.item = this._genWeaponItem(minRarity, p.level);
          last.isNew = this._isNew(last.item.name);
        } else if (last.kind === 'pet') {
          last.pet = this._genPetResult(minRarity);
          last.isNew = this._isNew(last.pet.name);
        }
      }
    }

    // Add items to inventory / activate pets
    for (const r of results) {
      if (r.kind === 'item' && r.item) {
        if (r.item.type === 'potion' || !r.item.type) continue;
        if (p.inventory.length < getMaxInventory()) {
          p.inventory.push(r.item);
          autoEquip(p, r.item);
        } else {
          // Sell overflow at 40% value
          const sellVal = Math.floor((r.item.value || 50) * 0.4);
          p.gold += sellVal;
          addLog('Inventory full! Sold ' + r.item.name + ' for ' + sellVal + 'g', '#FFDD44');
        }
      } else if (r.kind === 'pet' && r.pet) {
        // Integrate with pet system
        const petType = r.pet.type;
        if (typeof petSystem !== 'undefined' && petSystem.createPet) {
          // Check for duplicate
          if (petSystem.active && petSystem.active.type === petType) {
            // Duplicate: give gold bonus instead
            const bonus = this._rarityRank(r.rarity) * 200 + 100;
            p.gold += bonus;
            addLog('Duplicate pet! +' + bonus + 'g bonus', '#FFD700');
            addNotification('Duplicate ' + r.pet.name + '! +' + bonus + 'g', '#FFD700');
          } else {
            petSystem.createPet(petType);
          }
        }
      }
    }

    return results;
  },

  // --- HISTORY ---
  _addHistory(bannerIdx, itemName, rarity) {
    this.history.unshift({
      banner: ['weapon', 'pet', 'special'][bannerIdx],
      item: itemName,
      rarity: rarity,
      timestamp: Date.now()
    });
    if (this.history.length > 100) this.history.length = 100;
  },

  // --- SPECIAL BANNER ROTATION ---
  updateSpecialBanner(dt) {
    this.specialTimer -= dt;
    if (this.specialTimer <= 0) {
      this.rotateSpecialBanner();
      this.specialTimer = 600;
    }
    if (this._newBannerTimer > 0) this._newBannerTimer -= dt;
  },

  rotateSpecialBanner() {
    this.specialFeaturedIdx = (this.specialFeaturedIdx + 1) % SPECIAL_FEATURED_POOL.length;
    this.specialFeatured = SPECIAL_FEATURED_POOL[this.specialFeaturedIdx];
    this._newBannerTimer = 5;
    addNotification('NEW BANNER! ' + this.specialFeatured.name, '#FFD700');
    addLog('Special banner rotated: ' + this.specialFeatured.name, '#FFD700');
  },

  // --- ANIMATION ---
  startAnim(results, count) {
    this.results = results;
    this.resultIdx = 0;
    this.animTimer = 0;
    this.particles = [];
    if (results.length === 0) {
      this.animState = 'idle';
      return;
    }
    if (this.skipAnim) {
      this.animState = 'showing';
      this.resultIdx = results.length;
      return;
    }
    this.animState = 'summoning';
  },

  updateAnim(dt) {
    if (this.animState === 'idle' || this.animState === 'showing') return;

    this.animTimer += dt;

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.timer -= dt;
      p.alpha = Math.max(0, p.timer / p.maxTimer);
      if (p.timer <= 0) this.particles.splice(i, 1);
    }

    const isSingle = this.results.length === 1;
    const totalTime = isSingle ? 3.0 : 0.3;

    if (this.animState === 'summoning') {
      if (isSingle) {
        this._updateSingleAnim(dt);
      } else {
        this._updateMultiAnim(dt);
      }
    } else if (this.animState === 'revealing') {
      // Brief pause after reveal effects
      if (this.animTimer > 1.0) {
        this.animState = 'showing';
      }
    }
  },

  _updateSingleAnim(dt) {
    const t = this.animTimer;
    const result = this.results[0];
    const rarity = result.rarity;

    // Phase 1 (0-1s): Altar glow + swirling particles
    if (t < 1.0) {
      if (Math.random() < 0.3) {
        this._spawnParticle('sparkle', 0, 0, rarity);
      }
    }
    // Phase 2 (1-2s): Orb rises
    else if (t < 2.0) {
      if (Math.random() < 0.2) {
        this._spawnParticle('glow', 0, 0, rarity);
      }
    }
    // Phase 3 (2-3s): Crack + reveal
    else if (t < 3.0) {
      if (t < 2.1) {
        // Trigger reveal effects once
        this._triggerRevealEffects(rarity);
      }
    }
    // Done
    else {
      this.animState = 'showing';
      this.resultIdx = 1;
    }
  },

  _updateMultiAnim(dt) {
    const perReveal = 0.3;
    const targetIdx = Math.floor(this.animTimer / perReveal);

    if (targetIdx > this.resultIdx && this.resultIdx < this.results.length) {
      this.resultIdx = Math.min(targetIdx, this.results.length);
      if (this.resultIdx <= this.results.length) {
        const r = this.results[Math.min(this.resultIdx - 1, this.results.length - 1)];
        if (r && this._rarityRank(r.rarity) >= 2) {
          this._spawnBurstParticles(r.rarity);
        }
      }
    }

    if (this.resultIdx >= this.results.length) {
      this.animState = 'showing';
      this.resultIdx = this.results.length;
    }
  },

  _triggerRevealEffects(rarity) {
    const rank = this._rarityRank(rarity);
    if (rank >= 2 && typeof sfx !== 'undefined' && sfx.spell) sfx.spell();
    if (rank >= 3 && typeof sfx !== 'undefined' && sfx.crit) sfx.crit();
    if (rank >= 4) {
      if (typeof sfx !== 'undefined' && sfx.victoryFanfare) sfx.victoryFanfare();
      if (typeof screenShake === 'function') screenShake(4, 0.5);
      this._spawnConfetti(40);
    }
    this._spawnBurstParticles(rarity);
  },

  _spawnParticle(type, ox, oy, rarity) {
    const color = RARITY_COLORS[rarity] || '#fff';
    const maxT = rf(0.5, 1.5);
    this.particles.push({
      x: ox + rf(-40, 40),
      y: oy + rf(0, 20),
      vx: rf(-30, 30),
      vy: rf(-60, -20),
      color: color,
      alpha: 1,
      size: rf(2, 5),
      timer: maxT,
      maxTimer: maxT,
      type: type
    });
  },

  _spawnBurstParticles(rarity) {
    const color = RARITY_COLORS[rarity] || '#fff';
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const spd = rf(40, 100);
      const maxT = rf(0.5, 1.0);
      this.particles.push({
        x: 0, y: 0,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color: color,
        alpha: 1,
        size: rf(2, 4),
        timer: maxT,
        maxTimer: maxT,
        type: 'sparkle'
      });
    }
  },

  _spawnConfetti(count) {
    const colors = ['#FF4444', '#FFD700', '#44FF44', '#4488FF', '#FF44FF', '#FF8844'];
    for (let i = 0; i < count; i++) {
      const maxT = rf(1.5, 3.0);
      this.particles.push({
        x: rf(-100, 100), y: rf(-60, -20),
        vx: rf(-80, 80),
        vy: rf(-120, 20),
        color: colors[ri(0, colors.length - 1)],
        alpha: 1,
        size: rf(3, 6),
        timer: maxT,
        maxTimer: maxT,
        type: 'confetti'
      });
    }
  },

  // --- SPRITES ---
  generateSprites() {
    // Altar NPC: 16x16 purple/blue crystal on stone
    genSprite('altar_npc', 16, 16, (c) => {
      // Stone base
      c.fillStyle = '#6b7280';
      c.fillRect(2, 12, 12, 4);
      c.fillStyle = '#9ca3af';
      c.fillRect(3, 11, 10, 2);
      // Crystal body
      c.fillStyle = '#7c3aed';
      c.beginPath();
      c.moveTo(8, 1);
      c.lineTo(12, 6);
      c.lineTo(11, 11);
      c.lineTo(5, 11);
      c.lineTo(4, 6);
      c.closePath();
      c.fill();
      // Crystal highlight
      c.fillStyle = '#a78bfa';
      c.beginPath();
      c.moveTo(8, 2);
      c.lineTo(10, 6);
      c.lineTo(8, 8);
      c.lineTo(6, 6);
      c.closePath();
      c.fill();
      // Glow
      const g = c.createRadialGradient(8, 7, 0, 8, 7, 8);
      g.addColorStop(0, 'rgba(124,58,237,0.4)');
      g.addColorStop(1, 'rgba(124,58,237,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(8, 7, 8, 0, Math.PI * 2);
      c.fill();
      // Top sparkle
      c.fillStyle = '#e0d0ff';
      c.fillRect(7, 1, 2, 2);
    });

    // Sign sprite
    genSprite('sign_altar', 12, 16, (c) => {
      c.fillStyle = '#8B4513';
      c.fillRect(5, 6, 2, 10);
      c.fillStyle = '#a0522d';
      c.fillRect(0, 0, 12, 7);
      c.strokeStyle = '#5d3a1a';
      c.lineWidth = 0.5;
      c.strokeRect(0, 0, 12, 7);
      // Star icon
      c.fillStyle = '#d4a017';
      c.beginPath();
      c.arc(6, 3, 2, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#f1c40f';
      c.fillRect(5, 2, 2, 2);
    });

    // Summon orb: 8x8
    genSprite('summon_orb', 8, 8, (c) => {
      const g = c.createRadialGradient(4, 4, 0, 4, 4, 4);
      g.addColorStop(0, '#fff');
      g.addColorStop(0.4, '#d8b4fe');
      g.addColorStop(1, '#7c3aed');
      c.fillStyle = g;
      c.beginPath();
      c.arc(4, 4, 4, 0, Math.PI * 2);
      c.fill();
    });
  },

  // --- TOWN NPC ---
  npcPos: null,

  initTownNPC() {
    const tcx = Math.floor(MAP_W / 2);
    const tcy = Math.floor(MAP_H / 2);
    this.npcPos = {
      x: (tcx + 1) * TILE + TILE / 2,
      y: (tcy + 3) * TILE + TILE / 2,
      name: 'Summoning Altar'
    };
    // Init special banner
    this.specialFeatured = SPECIAL_FEATURED_POOL[0];
    this.specialFeaturedIdx = 0;
  },

  drawAltarNPC() {
    if (game.state !== 'playing' || !this.npcPos) return;
    const npc = this.npcPos;
    const pos = camera.worldToScreen(npc.x, npc.y);
    const sx = pos.x, sy = pos.y;

    // Viewport cull
    if (sx < -64 || sx > canvas.width + 64 || sy < -64 || sy > canvas.height + 64) return;

    ctx.save();

    // Ambient glow
    this._altarGlowTimer += 0.016;
    const glowPulse = 0.4 + Math.sin(this._altarGlowTimer * 2) * 0.2;
    const glow = ctx.createRadialGradient(sx, sy - 4, 0, sx, sy - 4, 28);
    glow.addColorStop(0, 'rgba(124,58,237,' + glowPulse + ')');
    glow.addColorStop(1, 'rgba(124,58,237,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy - 4, 28, 0, Math.PI * 2);
    ctx.fill();

    // Draw altar sprite
    const spr = spriteCache['altar_npc'];
    if (spr) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spr, sx - 16, sy - 16, 32, 32);
    }

    // Draw sign
    const sign = spriteCache['sign_altar'];
    if (sign) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sign, sx + 14, sy + 2, 24, 32);
    }

    // Ambient particles
    if (Math.random() < 0.08) {
      this._altarParticles.push({
        x: sx + rf(-12, 12),
        y: sy + 8,
        vx: rf(-5, 5),
        vy: rf(-20, -10),
        alpha: 1,
        timer: rf(0.8, 1.5),
        maxTimer: 1.2,
        size: rf(1, 3),
        color: Math.random() < 0.5 ? '#a78bfa' : '#d8b4fe'
      });
    }

    // Draw ambient particles
    for (let i = this._altarParticles.length - 1; i >= 0; i--) {
      const ap = this._altarParticles[i];
      ap.x += ap.vx * 0.016;
      ap.y += ap.vy * 0.016;
      ap.timer -= 0.016;
      ap.alpha = Math.max(0, ap.timer / ap.maxTimer);
      if (ap.timer <= 0) { this._altarParticles.splice(i, 1); continue; }
      ctx.globalAlpha = ap.alpha;
      ctx.fillStyle = ap.color;
      ctx.fillRect(ap.x - ap.size / 2, ap.y - ap.size / 2, ap.size, ap.size);
    }
    ctx.globalAlpha = 1;

    // Name label
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(npc.name, sx, sy - 22);
    ctx.fillStyle = '#d8b4fe';
    ctx.fillText(npc.name, sx, sy - 22);

    // Interaction hint
    if (game.player) {
      const dist = Math.hypot(game.player.x - npc.x, game.player.y - npc.y);
      if (dist < TILE * 2.5) {
        ctx.font = '9px monospace';
        ctx.strokeText('[Click to Summon]', sx, sy - 32);
        ctx.fillStyle = '#AADDFF';
        ctx.fillText('[Click to Summon]', sx, sy - 32);
      }
    }

    ctx.restore();
  },

  checkNPCClick(clickX, clickY) {
    if (game.state !== 'playing' || !game.player || !this.npcPos) return false;
    if (this.panelOpen) return false;

    const pos = camera.worldToScreen(this.npcPos.x, this.npcPos.y);
    if (Math.hypot(clickX - pos.x, clickY - pos.y) < TILE * 1.5) {
      const dist = Math.hypot(game.player.x - this.npcPos.x, game.player.y - this.npcPos.y);
      if (dist < TILE * 3) {
        this.panelOpen = true;
        this.animState = 'idle';
        this.results = [];
        return true;
      }
    }
    return false;
  },

  // --- BOT AUTO SUMMON ---
  botAutoSummon(player) {
    if (!this.autoSummon || !player) return;
    if (player.gold < this.autoGoldThreshold) return;
    if (player.inventory.length >= getMaxInventory()) return;
    // Single weapon pull, skip animation
    const savedSkip = this.skipAnim;
    this.skipAnim = true;
    const results = this.doPull(0, 1);
    this.skipAnim = savedSkip;
    if (results.length > 0) {
      const r = results[0];
      const name = r.kind === 'item' ? r.item.name : r.pet.name;
      addLog('Auto-summon: ' + name + ' [' + r.rarity + ']', '#d8b4fe');
    }
  },

  // --- SAVE / LOAD ---
  save() {
    return {
      pity: this.pity,
      totalPulls: this.totalPulls,
      history: this.history.slice(0, 100),
      autoSummon: this.autoSummon,
      autoGoldThreshold: this.autoGoldThreshold,
      specialTimer: this.specialTimer,
      specialFeaturedIdx: this.specialFeaturedIdx,
      skipAnim: this.skipAnim
    };
  },

  load(data) {
    if (!data) return;
    if (data.pity) this.pity = data.pity;
    if (data.totalPulls) this.totalPulls = data.totalPulls;
    if (data.history) this.history = data.history;
    if (data.autoSummon !== undefined) this.autoSummon = data.autoSummon;
    if (data.autoGoldThreshold !== undefined) this.autoGoldThreshold = data.autoGoldThreshold;
    if (data.specialTimer !== undefined) this.specialTimer = data.specialTimer;
    if (data.specialFeaturedIdx !== undefined) {
      this.specialFeaturedIdx = data.specialFeaturedIdx;
      this.specialFeatured = SPECIAL_FEATURED_POOL[this.specialFeaturedIdx] || SPECIAL_FEATURED_POOL[0];
    }
    if (data.skipAnim !== undefined) this.skipAnim = data.skipAnim;
  }
};

// ============================================================
// GACHA UI — Panel drawing and click handling
// ============================================================

function drawGachaPanel() {
  if (!gachaSystem.panelOpen || !game.player) return;
  const p = game.player;
  const W = canvas.width, H = canvas.height;
  const pw = 440, ph = 460;
  const px = (W - pw) / 2, py = (H - ph) / 2;

  ctx.save();

  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, W, H);

  // Panel bg
  ctx.fillStyle = 'rgba(10,8,30,0.96)';
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.fill();
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.stroke();

  // Title
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#d8b4fe';
  ctx.fillText('Summoning Altar', px + pw / 2, py + 26);

  // Close button
  const clX = px + pw - 28, clY = py + 8;
  ctx.fillStyle = 'rgba(180,40,40,0.8)';
  roundRect(ctx, clX, clY, 20, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('X', clX + 10, clY + 15);

  // --- BANNER TABS ---
  const tabW = 130, tabH = 28, tabY = py + 36;
  const bannerNames = ['Weapons', 'Pets', 'Special'];
  for (let i = 0; i < 3; i++) {
    const tx = px + 10 + i * (tabW + 5);
    const active = gachaSystem.currentBanner === i;
    ctx.fillStyle = active ? GACHA_BANNERS[i].color + '44' : 'rgba(30,30,50,0.8)';
    roundRect(ctx, tx, tabY, tabW, tabH, 6);
    ctx.fill();
    ctx.strokeStyle = active ? GACHA_BANNERS[i].color : '#444';
    ctx.lineWidth = active ? 2 : 1;
    roundRect(ctx, tx, tabY, tabW, tabH, 6);
    ctx.stroke();

    ctx.font = active ? 'bold 12px monospace' : '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = active ? '#fff' : '#888';
    let label = bannerNames[i];
    if (i === 2) {
      const secs = Math.max(0, Math.ceil(gachaSystem.specialTimer));
      const mm = Math.floor(secs / 60);
      const ss = secs % 60;
      label += ' ' + mm + ':' + (ss < 10 ? '0' : '') + ss;
    }
    ctx.fillText(label, tx + tabW / 2, tabY + tabH - 8);
  }

  // --- BANNER DISPLAY AREA ---
  const dispY = tabY + tabH + 8;
  const dispH = 160;
  const bi = gachaSystem.currentBanner;
  const banner = GACHA_BANNERS[bi];

  // Banner art background
  ctx.fillStyle = banner.color + '15';
  roundRect(ctx, px + 10, dispY, pw - 20, dispH, 8);
  ctx.fill();
  ctx.strokeStyle = banner.color + '44';
  ctx.lineWidth = 1;
  roundRect(ctx, px + 10, dispY, pw - 20, dispH, 8);
  ctx.stroke();

  // Check if we're in animation/showing state
  if (gachaSystem.animState === 'summoning' || gachaSystem.animState === 'revealing') {
    _drawGachaAnim(px + 10, dispY, pw - 20, dispH);
  } else if (gachaSystem.animState === 'showing' && gachaSystem.results.length > 0) {
    _drawGachaResults(px + 10, dispY, pw - 20, dispH);
  } else {
    // Banner info
    _drawBannerInfo(px + 10, dispY, pw - 20, dispH, bi);
  }

  // --- RATES TOGGLE ---
  const rateY = dispY + dispH + 4;
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#88aacc';
  ctx.fillText(gachaSystem.showRates ? '[-] Hide Rates' : '[+] Show Rates', px + 14, rateY + 10);

  let nextY = rateY + 16;
  if (gachaSystem.showRates) {
    const rates = banner.rates;
    for (const r of rates) {
      const rc = RARITY_COLORS[r.r] || '#FFD700';
      ctx.fillStyle = rc;
      ctx.font = '9px monospace';
      const label = (r.r === 'featured' ? 'Featured' : r.r.charAt(0).toUpperCase() + r.r.slice(1));
      ctx.fillText(label + ': ' + r.w + '%', px + 20, nextY);
      nextY += 12;
    }
    // Pity info
    const pKey = gachaSystem._pityKey(bi);
    const pCount = gachaSystem.pity[pKey];
    ctx.fillStyle = '#FF7043';
    ctx.fillText('Pity: ' + banner.pityRarity.toUpperCase() + '+ in ' + (banner.pityMax - pCount) + ' pulls', px + 20, nextY);
    nextY += 14;
  }

  // --- PULL BUTTONS ---
  const btnY = Math.max(nextY + 4, dispY + dispH + (gachaSystem.showRates ? 90 : 24));
  const btn1X = px + 30, btn10X = px + pw / 2 + 15;
  const btnW = pw / 2 - 45, btnH = 36;

  // Single pull
  const can1 = p.gold >= banner.cost;
  ctx.fillStyle = can1 ? 'rgba(80,30,120,0.9)' : 'rgba(40,40,50,0.9)';
  roundRect(ctx, btn1X, btnY, btnW, btnH, 8);
  ctx.fill();
  ctx.strokeStyle = can1 ? '#a78bfa' : '#444';
  ctx.lineWidth = 1;
  roundRect(ctx, btn1X, btnY, btnW, btnH, 8);
  ctx.stroke();
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = can1 ? '#fff' : '#666';
  ctx.fillText('Summon x1', btn1X + btnW / 2, btnY + 16);
  ctx.font = '10px monospace';
  ctx.fillStyle = can1 ? '#ffcc00' : '#555';
  ctx.fillText(banner.cost + 'g', btn1X + btnW / 2, btnY + 29);

  // 10-pull
  const can10 = p.gold >= banner.cost10;
  const g10 = ctx.createLinearGradient(btn10X, btnY, btn10X + btnW, btnY + btnH);
  if (can10) {
    g10.addColorStop(0, 'rgba(160,80,20,0.9)');
    g10.addColorStop(1, 'rgba(120,60,10,0.9)');
  } else {
    g10.addColorStop(0, 'rgba(40,40,50,0.9)');
    g10.addColorStop(1, 'rgba(40,40,50,0.9)');
  }
  ctx.fillStyle = g10;
  roundRect(ctx, btn10X, btnY, btnW, btnH, 8);
  ctx.fill();
  ctx.strokeStyle = can10 ? '#FFD700' : '#444';
  ctx.lineWidth = can10 ? 2 : 1;
  roundRect(ctx, btn10X, btnY, btnW, btnH, 8);
  ctx.stroke();
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = can10 ? '#FFD700' : '#666';
  ctx.fillText('Summon x10', btn10X + btnW / 2, btnY + 16);
  ctx.font = '10px monospace';
  ctx.fillStyle = can10 ? '#ffcc00' : '#555';
  ctx.fillText(banner.cost10 + 'g', btn10X + btnW / 2, btnY + 29);

  // Current gold
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcc00';
  ctx.fillText('Gold: ' + p.gold + 'g', px + pw / 2, btnY + btnH + 16);

  // --- BOTTOM SECTION ---
  const bottomY = btnY + btnH + 24;

  // History toggle
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#88aacc';
  ctx.fillText(gachaSystem.showHistory ? '[-] Hide History' : '[+] Show History', px + 14, bottomY);

  let histY = bottomY + 6;
  if (gachaSystem.showHistory) {
    // Pull counts
    ctx.font = '9px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Total: W:' + gachaSystem.totalPulls.weapon + ' P:' + gachaSystem.totalPulls.pet + ' S:' + gachaSystem.totalPulls.special, px + 14, histY + 12);
    histY += 16;

    // Last 20 pulls
    const showCount = Math.min(gachaSystem.history.length, 20);
    for (let i = 0; i < showCount; i++) {
      const h = gachaSystem.history[i];
      const rc = RARITY_COLORS[h.rarity] || '#aaa';
      const col = i % 2;
      const row = Math.floor(i / 2);
      const hx = px + 14 + col * (pw / 2 - 10);
      const hy = histY + row * 12;
      if (hy > py + ph - 20) break;
      ctx.fillStyle = rc;
      ctx.font = '8px monospace';
      ctx.fillText(h.item.substring(0, 18), hx + 8, hy);
      // Rarity dot
      ctx.fillStyle = rc;
      ctx.beginPath();
      ctx.arc(hx + 3, hy - 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- AUTO SUMMON ---
  const autoY = py + ph - 34;
  // Checkbox
  ctx.fillStyle = gachaSystem.autoSummon ? '#7c3aed' : 'rgba(40,40,60,0.9)';
  ctx.fillRect(px + 14, autoY, 12, 12);
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 14, autoY, 12, 12);
  if (gachaSystem.autoSummon) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('\u2713', px + 20, autoY + 10);
  }
  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#aaa';
  ctx.fillText('Auto-summon when Gold > ' + gachaSystem.autoGoldThreshold, px + 30, autoY + 10);

  // Skip anim checkbox
  ctx.fillStyle = gachaSystem.skipAnim ? '#7c3aed' : 'rgba(40,40,60,0.9)';
  ctx.fillRect(px + pw - 120, autoY, 12, 12);
  ctx.strokeStyle = '#aaa';
  ctx.strokeRect(px + pw - 120, autoY, 12, 12);
  if (gachaSystem.skipAnim) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('\u2713', px + pw - 114, autoY + 10);
  }
  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#aaa';
  ctx.fillText('Skip anim', px + pw - 104, autoY + 10);

  // Skip button during animation
  if (gachaSystem.animState === 'summoning' || gachaSystem.animState === 'revealing') {
    const skBx = px + pw - 80, skBy = dispY + dispH - 26;
    ctx.fillStyle = 'rgba(80,80,100,0.9)';
    roundRect(ctx, skBx, skBy, 60, 20, 4);
    ctx.fill();
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ddd';
    ctx.fillText('SKIP', skBx + 30, skBy + 14);
  }

  // New banner notification
  if (gachaSystem._newBannerTimer > 0 && gachaSystem.currentBanner !== 2) {
    const flash = Math.sin(Date.now() / 200) > 0;
    if (flash) {
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFD700';
      const tx = px + 10 + 2 * (tabW + 5) + tabW / 2;
      ctx.fillText('NEW!', tx, tabY - 2);
    }
  }

  ctx.restore();
}

// --- DRAW BANNER INFO ---
function _drawBannerInfo(x, y, w, h, bannerIdx) {
  const banner = GACHA_BANNERS[bannerIdx];
  ctx.save();

  if (bannerIdx === 0) {
    // Weapon banner art
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = banner.color;
    ctx.fillText('Weapon Summon', x + w / 2, y + 30);
    ctx.font = '11px monospace';
    ctx.fillStyle = '#bbb';
    ctx.fillText('Summon weapons, armor & accessories', x + w / 2, y + 50);
    ctx.fillText('Pity: Epic+ guaranteed every 50 pulls', x + w / 2, y + 66);
    ctx.fillText('10-pull: 1 Rare+ guaranteed', x + w / 2, y + 82);
    // Draw some weapon icons
    const icons = ['icon_sword', 'icon_staff', 'icon_bow', 'icon_armor', 'icon_ring'];
    for (let i = 0; i < icons.length; i++) {
      const spr = spriteCache[icons[i]];
      if (spr) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(spr, x + w / 2 - 60 + i * 28, y + 95, 24, 24);
      }
    }
  } else if (bannerIdx === 1) {
    // Pet banner art
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = banner.color;
    ctx.fillText('Pet Summon', x + w / 2, y + 30);
    ctx.font = '11px monospace';
    ctx.fillStyle = '#bbb';
    ctx.fillText('Summon companion pets', x + w / 2, y + 50);
    ctx.fillText('Pity: Rare+ guaranteed every 30 pulls', x + w / 2, y + 66);
    // Draw pet sprites
    const petIcons = ['pet_slime_0', 'pet_goblin_0', 'pet_wolf_0', 'pet_skeleton_0', 'pet_dragon_0'];
    for (let i = 0; i < petIcons.length; i++) {
      const spr = spriteCache[petIcons[i]];
      if (spr) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(spr, x + w / 2 - 60 + i * 28, y + 85, 24, 24);
      }
    }
  } else {
    // Special banner
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('Special Banner', x + w / 2, y + 26);

    // Limited time indicator
    const flash = Math.sin(Date.now() / 300) > 0;
    ctx.fillStyle = flash ? '#FF4444' : '#CC2222';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('LIMITED TIME!', x + w / 2, y + 40);

    // Featured item
    if (gachaSystem.specialFeatured) {
      const feat = gachaSystem.specialFeatured;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = RARITY_COLORS.legendary;
      ctx.fillText(feat.name, x + w / 2, y + 62);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#ddd';
      ctx.fillText(feat.desc || '', x + w / 2, y + 80);
      ctx.fillStyle = '#aaa';
      ctx.fillText('Featured Rate: 3%', x + w / 2, y + 96);

      // Timer
      const secs = Math.max(0, Math.ceil(gachaSystem.specialTimer));
      const mm = Math.floor(secs / 60);
      const ss = secs % 60;
      ctx.fillStyle = '#FF7043';
      ctx.font = '12px monospace';
      ctx.fillText('Rotates in: ' + mm + ':' + (ss < 10 ? '0' : '') + ss, x + w / 2, y + 116);
    }
  }

  ctx.restore();
}

// --- DRAW ANIMATION ---
function _drawGachaAnim(x, y, w, h) {
  ctx.save();
  const centerX = x + w / 2;
  const centerY = y + h / 2;

  if (gachaSystem.results.length === 1) {
    // Single pull animation
    const t = gachaSystem.animTimer;
    const result = gachaSystem.results[0];
    const rarity = result.rarity;
    const rc = RARITY_COLORS[rarity] || '#fff';

    // Phase 1: altar glow
    if (t < 1.0) {
      const progress = t / 1.0;
      const glow = ctx.createRadialGradient(centerX, centerY + 20, 0, centerX, centerY + 20, 40 * progress);
      glow.addColorStop(0, rc + '88');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(centerX, centerY + 20, 40 * progress, 0, Math.PI * 2);
      ctx.fill();

      // Swirling particles
      for (let i = 0; i < 6; i++) {
        const a = (t * 3 + i / 6 * Math.PI * 2) % (Math.PI * 2);
        const r = 20 + progress * 15;
        const px = centerX + Math.cos(a) * r;
        const py = centerY + 20 + Math.sin(a) * r - progress * 30;
        ctx.globalAlpha = 0.6 + progress * 0.4;
        ctx.fillStyle = rc;
        ctx.fillRect(px - 2, py - 2, 4, 4);
      }
      ctx.globalAlpha = 1;

      // Text
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#aaa';
      ctx.fillText('Summoning...', centerX, y + h - 10);
    }
    // Phase 2: orb rises
    else if (t < 2.0) {
      const progress = (t - 1.0) / 1.0;
      const orbY = centerY + 20 - progress * 40;

      // Orb glow
      const glow = ctx.createRadialGradient(centerX, orbY, 0, centerX, orbY, 20 + progress * 10);
      glow.addColorStop(0, '#fff');
      glow.addColorStop(0.3, rc + 'cc');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(centerX, orbY, 20 + progress * 10, 0, Math.PI * 2);
      ctx.fill();

      // Orb
      ctx.fillStyle = rc;
      ctx.beginPath();
      ctx.arc(centerX, orbY, 8 + progress * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(centerX - 2, orbY - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Phase 3: crack + reveal
    else if (t < 3.0) {
      const progress = (t - 2.0) / 1.0;
      const orbY = centerY - 20;

      // Flash
      if (progress < 0.2) {
        const flashAlpha = (0.2 - progress) / 0.2;
        ctx.fillStyle = 'rgba(255,255,255,' + (flashAlpha * 0.5) + ')';
        ctx.fillRect(x, y, w, h);
      }

      // Rarity-specific effects
      const rank = gachaSystem._rarityRank(rarity);
      if (rank >= 4) {
        // Legendary: light beams
        ctx.save();
        ctx.globalAlpha = Math.max(0, 0.4 - progress * 0.3);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(centerX, orbY);
          ctx.lineTo(centerX + Math.cos(a) * 100 * progress, orbY + Math.sin(a) * 100 * progress);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Crack lines
      ctx.strokeStyle = rc;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4 + rank * 2; i++) {
        const a = (i / (4 + rank * 2)) * Math.PI * 2;
        const len = 10 + progress * (10 + rank * 8);
        ctx.beginPath();
        ctx.moveTo(centerX, orbY);
        ctx.lineTo(centerX + Math.cos(a) * len, orbY + Math.sin(a) * len);
        ctx.stroke();
      }

      // Revealed item preview
      if (progress > 0.3) {
        const revAlpha = Math.min(1, (progress - 0.3) / 0.4);
        ctx.globalAlpha = revAlpha;
        _drawResultCard(centerX - 50, orbY - 10, 100, 60, result);
        ctx.globalAlpha = 1;
      }
    }
  } else {
    // Multi-pull: sequential reveal
    const revealed = gachaSystem.resultIdx;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Revealing ' + Math.min(revealed, gachaSystem.results.length) + '/' + gachaSystem.results.length + '...', centerX, y + h - 8);

    // Show revealed items in small grid
    const cols = 5, rows = 2;
    const cardW = (w - 20) / cols, cardH = (h - 30) / rows;
    for (let i = 0; i < Math.min(revealed, gachaSystem.results.length); i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const cx = x + 10 + col * cardW;
      const cy = y + 5 + row * cardH;

      const fadeIn = Math.min(1, (gachaSystem.animTimer - i * 0.3) * 3);
      ctx.globalAlpha = Math.max(0, fadeIn);
      _drawResultCard(cx + 2, cy + 2, cardW - 4, cardH - 4, gachaSystem.results[i]);
    }
    ctx.globalAlpha = 1;
  }

  // Draw particles
  for (const pp of gachaSystem.particles) {
    ctx.globalAlpha = pp.alpha;
    ctx.fillStyle = pp.color;
    if (pp.type === 'confetti') {
      ctx.save();
      ctx.translate(centerX + pp.x, centerY + pp.y);
      ctx.rotate(pp.timer * 5);
      ctx.fillRect(-pp.size / 2, -pp.size / 2, pp.size, pp.size * 0.6);
      ctx.restore();
    } else {
      ctx.fillRect(centerX + pp.x - pp.size / 2, centerY + pp.y - pp.size / 2, pp.size, pp.size);
    }
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

// --- DRAW RESULTS GRID ---
function _drawGachaResults(x, y, w, h) {
  ctx.save();
  const results = gachaSystem.results;
  if (results.length === 1) {
    _drawResultCard(x + w / 2 - 80, y + 10, 160, h - 20, results[0]);
  } else {
    const cols = 5, rows = 2;
    const cardW = (w - 20) / cols, cardH = (h - 10) / rows;
    for (let i = 0; i < results.length; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const cx = x + 10 + col * cardW;
      const cy = y + 5 + row * cardH;
      _drawResultCard(cx + 2, cy + 2, cardW - 4, cardH - 4, results[i]);
    }
  }

  // Tap to close hint
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#666';
  ctx.fillText('Click to dismiss', x + w / 2, y + h - 2);

  ctx.restore();
}

// --- DRAW SINGLE RESULT CARD ---
function _drawResultCard(x, y, w, h, result) {
  ctx.save();
  const rarity = result.rarity;
  const rc = RARITY_COLORS[rarity] || '#aaa';

  // Card bg with rarity border
  ctx.fillStyle = 'rgba(20,15,40,0.9)';
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = rc;
  ctx.lineWidth = result.isFeatured ? 2 : 1;
  roundRect(ctx, x, y, w, h, 4);
  ctx.stroke();

  // Rarity glow for epic+
  if (gachaSystem._rarityRank(rarity) >= 3) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = rc;
    roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.restore();
  }

  const isLarge = w > 120;
  const name = result.kind === 'item' ? result.item.name : result.pet.name;

  // Draw item/pet icon
  const icoSize = isLarge ? 40 : 20;
  const icoX = x + w / 2 - icoSize / 2;
  const icoY = y + (isLarge ? 8 : 3);
  let hasIcon = false;
  ctx.imageSmoothingEnabled = false;
  if (result.kind === 'item' && typeof _getItemIcon === 'function') {
    const iconName = _getItemIcon(result.item);
    if (iconName && spriteCache[iconName]) {
      ctx.drawImage(spriteCache[iconName], icoX, icoY, icoSize, icoSize);
      hasIcon = true;
    }
  } else if (result.kind === 'pet') {
    const petKey = 'pet_' + result.pet.type + '_0';
    if (spriteCache[petKey]) {
      ctx.drawImage(spriteCache[petKey], icoX, icoY, icoSize, icoSize);
      hasIcon = true;
    }
  }
  ctx.imageSmoothingEnabled = true;

  const textOff = hasIcon ? (isLarge ? icoSize + 2 : icoSize) : 0;

  // Item name
  ctx.font = isLarge ? 'bold 12px monospace' : 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = rc;
  const displayName = isLarge ? name : name.substring(0, 10);
  ctx.fillText(displayName, x + w / 2, y + textOff + (isLarge ? 20 : 14));

  // Rarity label
  ctx.font = isLarge ? '10px monospace' : '7px monospace';
  ctx.fillStyle = rc;
  const rarLabel = rarity.charAt(0).toUpperCase() + rarity.slice(1);
  ctx.fillText(rarLabel, x + w / 2, y + textOff + (isLarge ? 34 : 22));

  // Stats
  if (result.kind === 'item' && result.item.stats) {
    ctx.font = isLarge ? '10px monospace' : '7px monospace';
    ctx.fillStyle = '#bbb';
    const stats = result.item.stats;
    const statArr = Object.entries(stats).map(([k, v]) => k.toUpperCase() + ':' + (k === 'crit' ? (v * 100).toFixed(0) + '%' : k === 'spd' ? v.toFixed(1) : v));
    const statStr = statArr.join(' ');
    ctx.fillText(statStr.substring(0, isLarge ? 30 : 14), x + w / 2, y + textOff + (isLarge ? 50 : 30));
  } else if (result.kind === 'pet' && result.pet.desc) {
    ctx.font = isLarge ? '9px monospace' : '7px monospace';
    ctx.fillStyle = '#bbb';
    ctx.fillText(result.pet.desc.substring(0, isLarge ? 30 : 14), x + w / 2, y + textOff + (isLarge ? 50 : 30));
  }

  // NEW badge
  if (result.isNew) {
    ctx.fillStyle = '#44FF44';
    ctx.font = 'bold ' + (isLarge ? '10' : '7') + 'px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('NEW!', x + w - 4, y + 12);
  }

  // PITY badge
  if (result.isPity) {
    ctx.fillStyle = '#FF7043';
    ctx.font = 'bold ' + (isLarge ? '9' : '6') + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('PITY', x + 4, y + 12);
  }

  // Featured badge
  if (result.isFeatured) {
    const flash = Math.sin(Date.now() / 200) > 0;
    ctx.fillStyle = flash ? '#FFD700' : '#FFA000';
    ctx.font = 'bold ' + (isLarge ? '9' : '6') + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('\u2605 FEATURED \u2605', x + w / 2, y + h - (isLarge ? 8 : 4));
  }

  ctx.restore();
}

// ============================================================
// GACHA CLICK HANDLER
// ============================================================
function handleGachaClick(clickX, clickY) {
  if (!gachaSystem.panelOpen || !game.player) return false;
  const p = game.player;
  const W = canvas.width, H = canvas.height;
  const pw = 440, ph = 460;
  const px = (W - pw) / 2, py = (H - ph) / 2;

  // Click outside panel -> close
  if (clickX < px || clickX > px + pw || clickY < py || clickY > py + ph) {
    gachaSystem.panelOpen = false;
    gachaSystem.animState = 'idle';
    gachaSystem.results = [];
    return true;
  }

  // Close button
  const clX = px + pw - 28, clY = py + 8;
  if (clickX >= clX && clickX <= clX + 20 && clickY >= clY && clickY <= clY + 20) {
    gachaSystem.panelOpen = false;
    gachaSystem.animState = 'idle';
    gachaSystem.results = [];
    return true;
  }

  // If showing results, click to dismiss
  if (gachaSystem.animState === 'showing') {
    gachaSystem.animState = 'idle';
    gachaSystem.results = [];
    return true;
  }

  // Skip animation button
  if (gachaSystem.animState === 'summoning' || gachaSystem.animState === 'revealing') {
    const bi = gachaSystem.currentBanner;
    const banner = GACHA_BANNERS[bi];
    const tabH = 28, tabY = py + 36;
    const dispY = tabY + tabH + 8;
    const dispH = 160;
    const skBx = px + pw - 80, skBy = dispY + dispH - 26;
    if (clickX >= skBx && clickX <= skBx + 60 && clickY >= skBy && clickY <= skBy + 20) {
      gachaSystem.animState = 'showing';
      gachaSystem.resultIdx = gachaSystem.results.length;
      return true;
    }
    // Or click anywhere during anim to skip
    gachaSystem.animState = 'showing';
    gachaSystem.resultIdx = gachaSystem.results.length;
    return true;
  }

  // Banner tabs
  const tabW = 130, tabH = 28, tabY = py + 36;
  for (let i = 0; i < 3; i++) {
    const tx = px + 10 + i * (tabW + 5);
    if (clickX >= tx && clickX <= tx + tabW && clickY >= tabY && clickY <= tabY + tabH) {
      gachaSystem.currentBanner = i;
      gachaSystem.showRates = false;
      gachaSystem.showHistory = false;
      return true;
    }
  }

  // Rate info toggle
  const dispY = tabY + tabH + 8;
  const dispH = 160;
  const rateY = dispY + dispH + 4;
  if (clickX >= px + 14 && clickX <= px + 160 && clickY >= rateY && clickY <= rateY + 14) {
    gachaSystem.showRates = !gachaSystem.showRates;
    return true;
  }

  // Pull buttons
  const bi = gachaSystem.currentBanner;
  const banner = GACHA_BANNERS[bi];
  let nextY = rateY + 16;
  if (gachaSystem.showRates) {
    nextY += banner.rates.length * 12 + 14;
  }
  const btnY = Math.max(nextY + 4, dispY + dispH + (gachaSystem.showRates ? 90 : 24));
  const btn1X = px + 30, btn10X = px + pw / 2 + 15;
  const btnW = pw / 2 - 45, btnH = 36;

  // x1 pull
  if (clickX >= btn1X && clickX <= btn1X + btnW && clickY >= btnY && clickY <= btnY + btnH) {
    if (p.gold >= banner.cost) {
      const results = gachaSystem.doPull(bi, 1);
      if (results.length > 0) {
        gachaSystem.startAnim(results, 1);
        if (typeof sfx !== 'undefined' && sfx.spell) sfx.spell();
      }
    } else {
      addNotification('Not enough Gold!', '#FF4444');
    }
    return true;
  }

  // x10 pull
  if (clickX >= btn10X && clickX <= btn10X + btnW && clickY >= btnY && clickY <= btnY + btnH) {
    if (p.gold >= banner.cost10) {
      const results = gachaSystem.doPull(bi, 10);
      if (results.length > 0) {
        gachaSystem.startAnim(results, 10);
        if (typeof sfx !== 'undefined' && sfx.spell) sfx.spell();
      }
    } else {
      addNotification('Not enough Gold!', '#FF4444');
    }
    return true;
  }

  // History toggle
  const bottomY = btnY + btnH + 24;
  if (clickX >= px + 14 && clickX <= px + 160 && clickY >= bottomY - 6 && clickY <= bottomY + 8) {
    gachaSystem.showHistory = !gachaSystem.showHistory;
    return true;
  }

  // Auto-summon checkbox
  const autoY = py + ph - 34;
  if (clickX >= px + 14 && clickX <= px + 26 && clickY >= autoY && clickY <= autoY + 12) {
    gachaSystem.autoSummon = !gachaSystem.autoSummon;
    addNotification('Auto-summon: ' + (gachaSystem.autoSummon ? 'ON' : 'OFF'), '#d8b4fe');
    return true;
  }

  // Auto threshold cycle (click on the text to cycle thresholds)
  if (clickX >= px + 30 && clickX <= px + 260 && clickY >= autoY && clickY <= autoY + 12) {
    const thresholds = [2000, 5000, 10000, 20000, 50000];
    const idx = thresholds.indexOf(gachaSystem.autoGoldThreshold);
    gachaSystem.autoGoldThreshold = thresholds[(idx + 1) % thresholds.length];
    addNotification('Auto-summon threshold: ' + gachaSystem.autoGoldThreshold + 'g', '#d8b4fe');
    return true;
  }

  // Skip anim checkbox
  if (clickX >= px + pw - 120 && clickX <= px + pw - 108 && clickY >= autoY && clickY <= autoY + 12) {
    gachaSystem.skipAnim = !gachaSystem.skipAnim;
    addNotification('Skip animation: ' + (gachaSystem.skipAnim ? 'ON' : 'OFF'), '#d8b4fe');
    return true;
  }

  return true; // Consumed click inside panel
}

// ============================================================
// KEYBOARD HANDLER
// ============================================================
document.addEventListener('keydown', (e) => {
  if (game.state !== 'playing') return;
  if (e.code === 'KeyU') {
    if (gachaSystem.panelOpen) {
      gachaSystem.panelOpen = false;
      gachaSystem.animState = 'idle';
      gachaSystem.results = [];
    } else {
      gachaSystem.panelOpen = true;
      gachaSystem.animState = 'idle';
      gachaSystem.results = [];
    }
  }
});

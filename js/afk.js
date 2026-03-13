// ============================================================
// AFK REWARDS — Offline progress calculation & reward popup
// ============================================================

const afkSystem = {
  showPopup: false,
  rewards: null,
  popupState: 'idle', // 'idle' | 'chestAnim' | 'revealRewards' | 'ready'
  animTimer: 0,
  chestPhase: 0,     // 0=closed, 1=opening, 2=open
  rewardLines: [],    // {text, color, alpha, y} animated lines
  revealIndex: 0,
  buttonAlpha: 0,
  particles: [],

  // --------------------------------------------------------
  //  Number formatting with commas
  // --------------------------------------------------------
  formatNum(n) {
    return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  // --------------------------------------------------------
  //  Calculate AFK rewards based on elapsed time
  // --------------------------------------------------------
  calculate(lastTimestamp) {
    const p = game.player;
    if (!p) return null;

    let timeAway = (Date.now() - lastTimestamp) / 1000;
    timeAway = Math.min(timeAway, 86400); // cap at 24 hours

    // Multiplier brackets
    const brackets = [
      { start: 0, end: 3600, mult: 1.0 },       // first hour 100%
      { start: 3600, end: 28800, mult: 0.8 },    // hours 2-8: 80%
      { start: 28800, end: 86400, mult: 0.5 }    // hours 8-24: 50%
    ];

    let gold = 0;
    let exp = 0;
    const multiplierInfo = [];

    for (const b of brackets) {
      if (timeAway <= b.start) break;
      const secsInBracket = Math.min(timeAway, b.end) - b.start;
      if (secsInBracket <= 0) continue;
      gold += secsInBracket * p.level * 0.5 * b.mult;
      exp += secsInBracket * p.level * 0.3 * b.mult;
      multiplierInfo.push({
        label: b.start === 0 ? 'First hour' : b.start === 3600 ? 'Hours 2-8' : 'Hours 8-24',
        pct: Math.round(b.mult * 100) + '%',
        seconds: secsInBracket
      });
    }

    gold = Math.floor(gold);
    exp = Math.floor(exp);

    // Items: 1 per hour away
    const itemCount = Math.floor(timeAway / 3600);
    const items = [];
    for (let i = 0; i < itemCount; i++) {
      const item = genItem(p.level);
      if (item) items.push(item);
    }

    // Pet EXP
    let petExp = 0;
    if (typeof petSystem !== 'undefined' && petSystem.active) {
      petExp = Math.floor(timeAway * 0.1);
    }

    // Guild bonus
    if (typeof guildSystem !== 'undefined' && guildSystem.level >= 9) {
      gold = Math.floor(gold * 1.2);
      exp = Math.floor(exp * 1.2);
      petExp = Math.floor(petExp * 1.2);
      for (const item of items) {
        if (item.value) item.value = Math.floor(item.value * 1.2);
      }
    }

    return { timeAway, gold, exp, items, petExp, multiplierInfo };
  },

  // --------------------------------------------------------
  //  Check AFK on load — show popup if away > 60s
  // --------------------------------------------------------
  checkAfk(saveTimestamp) {
    if (!saveTimestamp) return;
    const elapsed = (Date.now() - saveTimestamp) / 1000;
    if (elapsed < 60) return;

    const rewards = this.calculate(saveTimestamp);
    if (!rewards) return;

    this.rewards = rewards;
    this.showPopup = true;
    this.popupState = 'chestAnim';
    this.animTimer = 0;
    this.chestPhase = 0;
    this.rewardLines = [];
    this.revealIndex = 0;
    this.buttonAlpha = 0;
    this.particles = [];
    this._buildRewardLines();
  },

  // --------------------------------------------------------
  //  Build reward lines for display
  // --------------------------------------------------------
  _buildRewardLines() {
    const r = this.rewards;
    if (!r) return;
    this.rewardLines = [];

    this.rewardLines.push({
      text: '+' + this.formatNum(r.gold) + ' Gold',
      color: '#FFD700',
      icon: 'afk_coin_icon',
      alpha: 0, slideX: -40
    });

    this.rewardLines.push({
      text: '+' + this.formatNum(r.exp) + ' EXP',
      color: '#4FC3F7',
      icon: 'afk_exp_icon',
      alpha: 0, slideX: -40
    });

    if (r.items.length > 0) {
      this.rewardLines.push({
        text: r.items.length + ' Item' + (r.items.length > 1 ? 's' : '') + ' found:',
        color: '#FFFFFF',
        icon: null,
        alpha: 0, slideX: -40
      });
      for (const item of r.items) {
        this.rewardLines.push({
          text: '  ' + item.name,
          color: RARITY_COLORS[item.rarity] || '#AAAAAA',
          icon: null,
          alpha: 0, slideX: -40,
          isItem: true
        });
      }
    }

    if (r.petExp > 0) {
      this.rewardLines.push({
        text: '+' + this.formatNum(r.petExp) + ' Pet EXP',
        color: '#82e0aa',
        icon: null,
        alpha: 0, slideX: -40
      });
    }
  },

  // --------------------------------------------------------
  //  Claim all rewards
  // --------------------------------------------------------
  claim() {
    const p = game.player;
    const r = this.rewards;
    if (!p || !r) return;

    // Add gold
    p.gold += r.gold;

    // Add exp
    gainExp(p, r.exp);

    // Add items to inventory
    let equipped = 0;
    let excessGold = 0;
    for (const item of r.items) {
      if (p.inventory.length < 20) {
        p.inventory.push(item);
        autoEquip(p, item);
        if (!p.inventory.includes(item)) equipped++;
      } else {
        // Inventory full — convert to gold
        excessGold += item.value || 10;
      }
    }
    if (excessGold > 0) {
      p.gold += excessGold;
      addNotification('Inventory full! +' + this.formatNum(excessGold) + 'g from excess items', '#FFD700');
    }
    if (equipped > 0) {
      addNotification(equipped + ' item' + (equipped > 1 ? 's' : '') + ' auto-equipped!', '#88CCFF');
    }

    // Pet EXP
    if (r.petExp > 0 && typeof petSystem !== 'undefined' && petSystem.active) {
      if (petSystem.active.exp !== undefined) petSystem.active.exp += r.petExp;
    }

    // Sound effects
    sfx.itemPickup();
    setTimeout(function() { sfx.victoryFanfare(); }, 200);

    // Close popup
    this.showPopup = false;
    this.popupState = 'idle';
    this.rewards = null;

    addNotification('AFK rewards claimed!', '#FFD700');
    addLog('AFK rewards claimed! +' + this.formatNum(r.gold) + 'g +' + this.formatNum(r.exp) + ' EXP', '#FFD700');
  },

  // --------------------------------------------------------
  //  Update popup animation
  // --------------------------------------------------------
  updatePopup(dt) {
    if (!this.showPopup) return;

    this.animTimer += dt;

    // Phase 1: Chest animation (0-1s)
    if (this.popupState === 'chestAnim') {
      if (this.animTimer < 0.4) {
        this.chestPhase = 0; // closed
      } else if (this.animTimer < 0.7) {
        this.chestPhase = 1; // opening
      } else {
        this.chestPhase = 2; // open
        // Spawn particles on open
        if (this.particles.length === 0) {
          for (let i = 0; i < 12; i++) {
            this.particles.push({
              x: 0, y: 0,
              vx: rf(-60, 60),
              vy: rf(-80, -20),
              life: rf(0.6, 1.2),
              maxLife: rf(0.6, 1.2),
              color: ['#FFD700', '#FF7043', '#4FC3F7', '#AB47BC'][ri(0, 3)],
              size: rf(2, 4)
            });
          }
        }
      }
      if (this.animTimer >= 1.0) {
        this.popupState = 'revealRewards';
        this.animTimer = 0;
        this.revealIndex = 0;
      }
    }

    // Phase 2: Reveal reward lines (slide in one by one)
    if (this.popupState === 'revealRewards') {
      const lineDelay = 0.3;
      const currentLine = Math.floor(this.animTimer / lineDelay);

      for (let i = 0; i < this.rewardLines.length; i++) {
        if (i <= currentLine) {
          const lineTime = this.animTimer - i * lineDelay;
          const t = Math.min(1, lineTime / 0.25);
          // Ease out
          const ease = 1 - Math.pow(1 - t, 3);
          this.rewardLines[i].alpha = ease;
          this.rewardLines[i].slideX = -40 * (1 - ease);
        }
      }

      if (currentLine >= this.rewardLines.length) {
        this.popupState = 'ready';
        this.animTimer = 0;
      }
    }

    // Phase 3: Button fade in
    if (this.popupState === 'ready') {
      this.buttonAlpha = Math.min(1, this.animTimer / 0.3);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 60 * dt; // gravity
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  },

  // --------------------------------------------------------
  //  Sprite generation for AFK system
  // --------------------------------------------------------
  generateSprites() {
    // Chest closed (16x16)
    genSprite('afk_chest_closed', 16, 16, function(c) {
      // Body
      c.fillStyle = '#8B4513';
      c.fillRect(2, 6, 12, 8);
      // Lid
      c.fillStyle = '#A0522D';
      c.fillRect(1, 4, 14, 4);
      // Gold trim
      c.fillStyle = '#FFD700';
      c.fillRect(1, 7, 14, 1);
      c.fillRect(7, 4, 2, 4);
      // Lock
      c.fillStyle = '#FFD700';
      c.fillRect(6, 8, 4, 3);
      c.fillStyle = '#8B4513';
      c.fillRect(7, 9, 2, 1);
      // Dark bottom
      c.fillStyle = '#5d3a1a';
      c.fillRect(2, 12, 12, 2);
    });

    // Chest open (16x16)
    genSprite('afk_chest_open', 16, 16, function(c) {
      // Body
      c.fillStyle = '#8B4513';
      c.fillRect(2, 8, 12, 6);
      // Open lid (tilted back)
      c.fillStyle = '#A0522D';
      c.fillRect(1, 2, 14, 4);
      c.fillStyle = '#5d3a1a';
      c.fillRect(2, 5, 12, 2);
      // Gold trim
      c.fillStyle = '#FFD700';
      c.fillRect(1, 6, 14, 1);
      c.fillRect(7, 2, 2, 3);
      // Inner glow
      c.fillStyle = '#FFD700';
      c.fillRect(4, 8, 8, 3);
      c.fillStyle = '#FFF8DC';
      c.fillRect(5, 9, 6, 1);
      // Sparkle dots
      c.fillStyle = '#FFFFFF';
      c.fillRect(5, 4, 1, 1);
      c.fillRect(10, 3, 1, 1);
      c.fillRect(3, 5, 1, 1);
      c.fillRect(12, 4, 1, 1);
      // Dark bottom
      c.fillStyle = '#5d3a1a';
      c.fillRect(2, 13, 12, 1);
    });

    // Coin icon (8x8)
    genSprite('afk_coin_icon', 8, 8, function(c) {
      c.fillStyle = '#FFD700';
      c.beginPath();
      c.arc(4, 4, 3, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#FFA500';
      c.beginPath();
      c.arc(4, 4, 2, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#FFD700';
      c.fillRect(3, 2, 2, 4);
    });

    // EXP icon (8x8) — blue star
    genSprite('afk_exp_icon', 8, 8, function(c) {
      c.fillStyle = '#4FC3F7';
      c.beginPath();
      c.moveTo(4, 0);
      c.lineTo(5, 3);
      c.lineTo(8, 3);
      c.lineTo(5.5, 5);
      c.lineTo(6.5, 8);
      c.lineTo(4, 6);
      c.lineTo(1.5, 8);
      c.lineTo(2.5, 5);
      c.lineTo(0, 3);
      c.lineTo(3, 3);
      c.closePath();
      c.fill();
      c.fillStyle = '#81D4FA';
      c.beginPath();
      c.moveTo(4, 1);
      c.lineTo(4.5, 3);
      c.lineTo(4, 4);
      c.lineTo(3.5, 3);
      c.closePath();
      c.fill();
    });
  },

  // --------------------------------------------------------
  //  AFK rate text for settings/bot panel
  // --------------------------------------------------------
  getAfkRateText(player) {
    if (!player) return '';
    const goldPerHr = Math.floor(3600 * player.level * 0.5);
    const expPerHr = Math.floor(3600 * player.level * 0.3);
    return 'AFK rate: ~' + this.formatNum(goldPerHr) + ' Gold/hr, ~' + this.formatNum(expPerHr) + ' EXP/hr';
  }
};

// ============================================================
//  Popup rendering — drawn on top of everything
// ============================================================
function drawAfkPopup() {
  if (!afkSystem.showPopup || !afkSystem.rewards) return;

  const r = afkSystem.rewards;
  const cw = canvas.width;
  const ch = canvas.height;

  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, cw, ch);

  // Panel dimensions
  const pw = 380;
  const lineCount = afkSystem.rewardLines.length;
  const ph = Math.max(420, 260 + lineCount * 20 + 60);
  const px = Math.floor((cw - pw) / 2);
  const py = Math.floor((ch - ph) / 2);

  // Panel background
  ctx.fillStyle = 'rgba(20,15,30,0.95)';
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.fill();

  // Panel border
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.stroke();

  // Inner border glow
  ctx.strokeStyle = 'rgba(255,215,0,0.3)';
  ctx.lineWidth = 1;
  roundRect(ctx, px + 4, py + 4, pw - 8, ph - 8, 10);
  ctx.stroke();

  // --- Treasure chest ---
  const chestScale = 3;
  const chestX = Math.floor(cw / 2 - 8 * chestScale);
  const chestY = py + 20;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (afkSystem.chestPhase < 2) {
    const sprite = spriteCache['afk_chest_closed'];
    if (sprite) ctx.drawImage(sprite, chestX, chestY, 16 * chestScale, 16 * chestScale);
    // Wobble during opening
    if (afkSystem.chestPhase === 1) {
      ctx.save();
      const wobble = Math.sin(afkSystem.animTimer * 30) * 2;
      ctx.translate(chestX + 8 * chestScale, chestY + 8 * chestScale);
      ctx.rotate(wobble * Math.PI / 180);
      ctx.translate(-(chestX + 8 * chestScale), -(chestY + 8 * chestScale));
      if (sprite) ctx.drawImage(sprite, chestX, chestY, 16 * chestScale, 16 * chestScale);
      ctx.restore();
    }
  } else {
    const sprite = spriteCache['afk_chest_open'];
    if (sprite) ctx.drawImage(sprite, chestX, chestY, 16 * chestScale, 16 * chestScale);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.restore();

  // Draw particles
  const pcx = cw / 2;
  const pcy = chestY + 8 * chestScale;
  for (const pt of afkSystem.particles) {
    const a = Math.max(0, pt.life / pt.maxLife);
    ctx.globalAlpha = a;
    ctx.fillStyle = pt.color;
    ctx.fillRect(pcx + pt.x - pt.size / 2, pcy + pt.y - pt.size / 2, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;

  // --- Title ---
  let ty = chestY + 16 * chestScale + 16;
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('Welcome back!', cw / 2, ty);

  // --- Subtitle: time away ---
  ty += 22;
  const hours = Math.floor(r.timeAway / 3600);
  const minutes = Math.floor((r.timeAway % 3600) / 60);
  let timeStr = 'You were away for ';
  if (hours > 0) timeStr += hours + ' hour' + (hours > 1 ? 's' : '') + ' ';
  if (minutes > 0) timeStr += minutes + ' minute' + (minutes > 1 ? 's' : '');
  if (hours === 0 && minutes === 0) timeStr += 'a moment';
  ctx.font = '11px monospace';
  ctx.fillStyle = '#AAAAAA';
  ctx.fillText(timeStr, cw / 2, ty);

  // --- Divider ---
  ty += 14;
  ctx.strokeStyle = 'rgba(255,215,0,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + 30, ty);
  ctx.lineTo(px + pw - 30, ty);
  ctx.stroke();

  // --- Reward lines ---
  ty += 20;
  ctx.textAlign = 'left';
  const lineX = px + 40;
  for (let i = 0; i < afkSystem.rewardLines.length; i++) {
    const line = afkSystem.rewardLines[i];
    if (line.alpha <= 0) continue;

    ctx.globalAlpha = line.alpha;
    const drawX = lineX + line.slideX;
    const drawY = ty + i * 20;

    // Icon
    if (line.icon && spriteCache[line.icon]) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spriteCache[line.icon], drawX - 14, drawY - 8, 12, 12);
      ctx.imageSmoothingEnabled = true;
    }

    // Text
    ctx.font = line.isItem ? '10px monospace' : 'bold 12px monospace';
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, drawX + (line.icon ? 2 : 0), drawY);
  }
  ctx.globalAlpha = 1;

  // --- Multiplier info ---
  const multY = ty + afkSystem.rewardLines.length * 20 + 12;
  ctx.textAlign = 'center';
  ctx.font = '9px monospace';
  ctx.fillStyle = 'rgba(170,170,170,0.7)';
  ctx.fillText('First hour: 100%  |  Hours 2-8: 80%  |  Hours 8-24: 50%', cw / 2, multY);

  // --- Claim All button ---
  if (afkSystem.buttonAlpha > 0) {
    ctx.globalAlpha = afkSystem.buttonAlpha;

    const bw = 160;
    const bh = 36;
    const bx = Math.floor(cw / 2 - bw / 2);
    const by = py + ph - 52;

    // Button glow
    const glowIntensity = 0.3 + Math.sin(afkSystem.animTimer * 3) * 0.15;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 12 * glowIntensity;

    // Button background
    const grad = ctx.createLinearGradient(bx, by, bx, by + bh);
    grad.addColorStop(0, '#FFD700');
    grad.addColorStop(0.5, '#FFA500');
    grad.addColorStop(1, '#FF8C00');
    ctx.fillStyle = grad;
    roundRect(ctx, bx, by, bw, bh, 6);
    ctx.fill();

    // Button border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#FFF8DC';
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, bw, bh, 6);
    ctx.stroke();

    // Button text
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#1a0a00';
    ctx.textAlign = 'center';
    ctx.fillText('Claim All', cw / 2, by + bh / 2 + 5);

    // Store button bounds for click detection
    afkSystem._btnBounds = { x: bx, y: by, w: bw, h: bh };

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
}

// ============================================================
//  Click handler — blocks all other input while popup is shown
// ============================================================
function handleAfkClick(cx, cy) {
  if (!afkSystem.showPopup) return false;

  // "Claim All" button
  if (afkSystem.popupState === 'ready' && afkSystem._btnBounds) {
    const b = afkSystem._btnBounds;
    if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
      afkSystem.claim();
    }
  }

  // Block all other clicks while popup is showing
  return true;
}

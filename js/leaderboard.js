// ============================================================
// LEADERBOARD — Rankings, DPS tracking, rank badges, panel UI
// ============================================================

// --- FORMATTING HELPERS ---

function formatNumber(n) {
  if (n === undefined || n === null || isNaN(n)) return '0';
  n = Math.floor(n);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) {
    const s = n.toString();
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  return n.toString();
}

function formatDPS(n) {
  if (!n || isNaN(n)) return '0/s';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K/s';
  return Math.floor(n) + '/s';
}

// --- CLASS ABBREVIATIONS ---
const CLASS_ABBR = { Knight: 'Kni', Mage: 'Mag', Ranger: 'Ran', Priest: 'Pri' };

// --- LEADERBOARD STATE ---
const leaderboard = {
  panelOpen: false,
  activeTab: 'level',
  rankings: { level: [], kills: [], dps: [], gold: [], points: [] },
  lastRanks: { level: {}, kills: {}, dps: {}, gold: {}, points: {} },
  updateTimer: 0,
  dpsTracker: { damages: [], lastCalc: 0, dps: 0 },
  notifications: [],
  playerRankBadge: null,

  // ---- DPS TRACKING ----

  recordDamage(amount) {
    const now = Date.now();
    this.dpsTracker.damages.push({ amount, time: now });
    // Prune entries older than 60 seconds
    const cutoff = now - 60000;
    while (
      this.dpsTracker.damages.length > 0 &&
      this.dpsTracker.damages[0].time < cutoff
    ) {
      this.dpsTracker.damages.shift();
    }
  },

  calcDPS() {
    const now = Date.now();
    const cutoff = now - 60000;
    let total = 0;
    for (const entry of this.dpsTracker.damages) {
      if (entry.time >= cutoff) total += entry.amount;
    }
    this.dpsTracker.dps = total / 60;
    this.dpsTracker.lastCalc = now;
    return this.dpsTracker.dps;
  },

  // ---- NPC SIMULATED STATS ----

  simulateNPCStats(dt) {
    if (!game.npcPlayers) return;
    for (const npc of game.npcPlayers) {
      if (npc.isDead) continue;

      // Assign growth multiplier once
      if (npc._lbGrowthRate === undefined) {
        npc._lbGrowthRate = rf(0.5, 2.0);
      }
      // Initialize simulated stats
      if (npc._lbKills === undefined) npc._lbKills = npc.killCount || 0;
      if (npc._lbGold === undefined) npc._lbGold = npc.gold || 0;
      if (npc._lbDPS === undefined) {
        const base = (npc.level || 1) * 2;
        npc._lbDPS = base * npc._lbGrowthRate;
      }

      // Grow kills over time based on level and growth rate
      const killRate = npc._lbGrowthRate * (npc.level || 1) * 0.04 * dt;
      npc._lbKills += killRate;

      // Gold grows proportionally to kills
      const goldRate = npc._lbGrowthRate * (npc.level || 1) * 1.5 * dt;
      npc._lbGold += goldRate;

      // DPS drifts slightly based on level changes
      const targetDPS = (npc.level || 1) * 2 * npc._lbGrowthRate;
      npc._lbDPS += (targetDPS - npc._lbDPS) * 0.1 * dt;

      // 1% chance per update of a "lucky" boost
      if (Math.random() < 0.01) {
        const boost = rf(1.5, 3.0);
        npc._lbKills += (npc.level || 1) * boost;
        npc._lbGold += (npc.level || 1) * boost * 5;
        npc._lbDPS *= rf(1.1, 1.5);
      }
    }
  },

  // ---- NPC SIMULATED POINTS ----

  getNPCPoints(npc) {
    const kills = Math.floor(npc._lbKills || npc.killCount || 0);
    const gold = Math.floor(npc._lbGold || npc.gold || 0);
    const level = npc.level || 1;
    return Math.floor(level * 100 + kills * 10 + gold * 0.5);
  },

  // ---- PLAYER REAL POINTS ----

  getPlayerPoints() {
    const p = game.player;
    if (!p) return 0;
    return Math.floor((p.level || 1) * 100 + (p.killCount || 0) * 10 + (p.gold || 0) * 0.5);
  },

  // ---- RANKING CALCULATION ----

  updateRankings() {
    if (!game.player && !game.npcPlayers) return;

    const tabs = ['level', 'kills', 'dps', 'gold', 'points'];

    // Save previous rankings for change indicators
    for (const tab of tabs) {
      this.lastRanks[tab] = {};
      for (let i = 0; i < this.rankings[tab].length; i++) {
        const entry = this.rankings[tab][i];
        this.lastRanks[tab][entry.name] = i + 1;
      }
    }

    // Build entity list
    const entities = [];
    if (game.player) {
      const p = game.player;
      entities.push({
        name: p.name || 'Player',
        level: p.level || 1,
        kills: p.killCount || 0,
        dps: this.dpsTracker.dps || 0,
        gold: p.gold || 0,
        points: this.getPlayerPoints(),
        className: p.className || 'Knight',
        isPlayer: true
      });
    }
    if (game.npcPlayers) {
      for (const npc of game.npcPlayers) {
        entities.push({
          name: npc.name || 'NPC',
          level: npc.level || 1,
          kills: Math.floor(npc._lbKills || npc.killCount || 0),
          dps: npc._lbDPS || 0,
          gold: Math.floor(npc._lbGold || npc.gold || 0),
          points: this.getNPCPoints(npc),
          className: npc.className || 'Knight',
          isPlayer: false
        });
      }
    }

    const sortKey = { level: 'level', kills: 'kills', dps: 'dps', gold: 'gold', points: 'points' };
    for (const tab of tabs) {
      const key = sortKey[tab];
      const sorted = [...entities].sort((a, b) => b[key] - a[key]);
      this.rankings[tab] = sorted.slice(0, 15);
    }

    // Check if player hit #1 in any category → push notification
    if (game.player) {
      const playerName = game.player.name || 'Player';
      for (const tab of tabs) {
        if (
          this.rankings[tab].length > 0 &&
          this.rankings[tab][0].isPlayer
        ) {
          const prevRank = this.lastRanks[tab][playerName];
          if (prevRank && prevRank > 1) {
            const tabLabel = tab.charAt(0).toUpperCase() + tab.slice(1);
            this.notifications.push({
              text: '#1 in ' + tabLabel + '! You are the best!',
              timer: 4,
              alpha: 1
            });
            addNotification('You reached #1 in ' + tabLabel + '!', '#FFD700');
          }
        }
      }
    }

    // Update player rank badge
    this.playerRankBadge = this.getPlayerBadge();
  },

  // ---- RANK BADGE ----

  getPlayerBadge() {
    if (!game.player) return '';
    const playerName = game.player.name || 'Player';
    let bestRank = Infinity;
    const tab = this.activeTab;
    const list = this.rankings[tab];
    for (let i = 0; i < list.length; i++) {
      if (list[i].isPlayer) {
        bestRank = Math.min(bestRank, i + 1);
        break;
      }
    }
    if (bestRank === 1) return '🥇';
    if (bestRank === 2) return '🥈';
    if (bestRank === 3) return '🥉';
    return '';
  },

  // ---- SAVE / LOAD ----

  getSaveData() {
    return { dps: this.dpsTracker.dps };
  },

  loadSaveData(data) {
    if (!data) return;
    if (typeof data.dps === 'number') this.dpsTracker.dps = data.dps;
  }
};

// ---- RANK CHANGE INDICATOR ----

function getRankChange(tab, name, currentIdx) {
  const prev = leaderboard.lastRanks[tab][name];
  const curr = currentIdx + 1;
  if (prev === undefined) return { symbol: '—', color: '#888888' };
  if (prev > curr) return { symbol: '▲', color: '#44FF44' };
  if (prev < curr) return { symbol: '▼', color: '#FF4444' };
  return { symbol: '—', color: '#888888' };
}

// ---- DRAW LEADERBOARD PANEL ----

function drawLeaderboardPanel() {
  if (!leaderboard.panelOpen) return;

  const W = canvas.width;
  const H = canvas.height;
  const PW = 420;
  const PH = 450;
  const PX = Math.floor((W - PW) / 2);
  const PY = Math.floor((H - PH) / 2);

  ctx.save();

  // Backdrop
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);

  // Panel background
  ctx.fillStyle = '#0d0d1a';
  roundRect(ctx, PX, PY, PW, PH, 12);
  ctx.fill();

  ctx.strokeStyle = '#444466';
  ctx.lineWidth = 2;
  roundRect(ctx, PX, PY, PW, PH, 12);
  ctx.stroke();

  // Title bar
  const titleGrad = ctx.createLinearGradient(PX, PY, PX, PY + 40);
  titleGrad.addColorStop(0, '#1a1a3a');
  titleGrad.addColorStop(1, '#0d0d1a');
  ctx.fillStyle = titleGrad;
  roundRect(ctx, PX, PY, PW, 40, 12);
  ctx.fill();

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LEADERBOARD', PX + PW / 2, PY + 26);

  // Close button
  ctx.fillStyle = '#cc3333';
  roundRect(ctx, PX + PW - 32, PY + 8, 24, 24, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✕', PX + PW - 20, PY + 24);

  // Tabs
  const tabs = ['level', 'kills', 'dps', 'gold', 'points'];
  const tabLabels = { level: 'Level', kills: 'Kills', dps: 'DPS', gold: 'Gold', points: 'Points' };
  const tabW = PW / tabs.length;
  const tabY = PY + 44;
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    const tx = PX + i * tabW;
    const isActive = leaderboard.activeTab === tab;
    ctx.fillStyle = isActive ? '#2a2a5a' : '#111122';
    ctx.fillRect(tx, tabY, tabW, 28);
    ctx.strokeStyle = isActive ? '#8888ff' : '#333355';
    ctx.lineWidth = 1;
    ctx.strokeRect(tx, tabY, tabW, 28);
    ctx.fillStyle = isActive ? '#ffffff' : '#888899';
    ctx.font = (isActive ? 'bold ' : '') + '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tabLabels[tab], tx + tabW / 2, tabY + 18);
  }

  // Header row
  const headerY = tabY + 28;
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(PX, headerY, PW, 24);
  ctx.fillStyle = '#8888aa';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  const hPad = PX + 8;
  ctx.fillText('#', hPad, headerY + 16);
  ctx.fillText('Chg', hPad + 26, headerY + 16);
  ctx.fillText('Name', hPad + 56, headerY + 16);
  ctx.fillText('Class', hPad + 196, headerY + 16);
  ctx.fillText('Value', hPad + 256, headerY + 16);

  // Rows
  const rowH = 26;
  const listY = headerY + 24;
  const currentTab = leaderboard.activeTab;
  const list = leaderboard.rankings[currentTab] || [];
  const playerName = game.player ? (game.player.name || 'Player') : null;

  let playerInTop = false;

  for (let i = 0; i < list.length; i++) {
    const entry = list[i];
    const ry = listY + i * rowH;
    const isPlayerRow = entry.isPlayer;
    if (isPlayerRow) playerInTop = true;

    // Row background
    if (isPlayerRow) {
      ctx.fillStyle = 'rgba(180,140,0,0.22)';
    } else {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.0)';
    }
    ctx.fillRect(PX, ry, PW, rowH);

    // Rank number
    let rankColor = '#888899';
    if (i === 0) rankColor = '#FFD700';
    else if (i === 1) rankColor = '#C0C0C0';
    else if (i === 2) rankColor = '#CD7F32';
    ctx.fillStyle = rankColor;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText((i + 1).toString(), hPad + 20, ry + 17);

    // Rank change indicator
    const change = getRankChange(currentTab, entry.name, i);
    ctx.fillStyle = change.color;
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(change.symbol, hPad + 26, ry + 17);

    // Name (truncated)
    const maxNameLen = 14;
    let displayName = entry.name;
    if (displayName.length > maxNameLen) displayName = displayName.slice(0, maxNameLen - 1) + '…';
    ctx.fillStyle = isPlayerRow ? '#FFD700' : '#ccccdd';
    ctx.font = (isPlayerRow ? 'bold ' : '') + '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(displayName, hPad + 56, ry + 17);

    // Class abbreviation
    const abbr = CLASS_ABBR[entry.className] || entry.className.slice(0, 3);
    const classColor = CLASS_DEFS[entry.className] ? CLASS_DEFS[entry.className].color : '#aaaaaa';
    ctx.fillStyle = classColor;
    ctx.font = '10px monospace';
    ctx.fillText(abbr, hPad + 196, ry + 17);

    // Value
    let valueStr = '';
    switch (currentTab) {
      case 'level':  valueStr = entry.level.toString(); break;
      case 'kills':  valueStr = formatNumber(entry.kills); break;
      case 'dps':    valueStr = formatDPS(entry.dps); break;
      case 'gold':   valueStr = formatNumber(entry.gold); break;
      case 'points': valueStr = formatNumber(entry.points); break;
    }
    ctx.fillStyle = isPlayerRow ? '#FFD700' : '#aaddff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(valueStr, hPad + 256, ry + 17);
  }

  // If player not in top 15, draw them at bottom with "..." separator
  if (game.player && !playerInTop) {
    const sepY = listY + list.length * rowH + 2;

    // "..." separator
    ctx.fillStyle = '#555577';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('· · ·', PX + PW / 2, sepY + 12);

    // Find player rank in full sorted list
    let playerRank = '?';
    let playerEntry = null;
    if (game.player) {
      const p = game.player;
      const allEntities = [];
      allEntities.push({
        name: p.name || 'Player',
        level: p.level || 1,
        kills: p.killCount || 0,
        dps: leaderboard.dpsTracker.dps || 0,
        gold: p.gold || 0,
        points: leaderboard.getPlayerPoints(),
        className: p.className || 'Knight',
        isPlayer: true
      });
      if (game.npcPlayers) {
        for (const npc of game.npcPlayers) {
          allEntities.push({
            name: npc.name || 'NPC',
            level: npc.level || 1,
            kills: Math.floor(npc._lbKills || npc.killCount || 0),
            dps: npc._lbDPS || 0,
            gold: Math.floor(npc._lbGold || npc.gold || 0),
            points: leaderboard.getNPCPoints(npc),
            className: npc.className || 'Knight',
            isPlayer: false
          });
        }
      }
      const sortedAll = allEntities.sort((a, b) => b[currentTab] - a[currentTab]);
      for (let i = 0; i < sortedAll.length; i++) {
        if (sortedAll[i].isPlayer) {
          playerRank = i + 1;
          playerEntry = sortedAll[i];
          break;
        }
      }
    }

    if (playerEntry) {
      const pry = sepY + 18;
      ctx.fillStyle = 'rgba(180,140,0,0.22)';
      ctx.fillRect(PX, pry, PW, rowH);

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(playerRank.toString(), hPad + 20, pry + 17);

      const change = getRankChange(currentTab, playerEntry.name, playerRank - 1);
      ctx.fillStyle = change.color;
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(change.symbol, hPad + 26, pry + 17);

      let displayName = playerEntry.name;
      if (displayName.length > 14) displayName = displayName.slice(0, 13) + '…';
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(displayName, hPad + 56, pry + 17);

      const abbr = CLASS_ABBR[playerEntry.className] || playerEntry.className.slice(0, 3);
      ctx.fillStyle = CLASS_DEFS[playerEntry.className] ? CLASS_DEFS[playerEntry.className].color : '#aaaaaa';
      ctx.font = '10px monospace';
      ctx.fillText(abbr, hPad + 196, pry + 17);

      let valueStr = '';
      switch (currentTab) {
        case 'level':  valueStr = playerEntry.level.toString(); break;
        case 'kills':  valueStr = formatNumber(playerEntry.kills); break;
        case 'dps':    valueStr = formatDPS(playerEntry.dps); break;
        case 'gold':   valueStr = formatNumber(playerEntry.gold); break;
        case 'points': valueStr = formatNumber(playerEntry.points); break;
      }
      ctx.fillStyle = '#FFD700';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(valueStr, hPad + 256, pry + 17);
    }
  }

  // Footer hint
  ctx.fillStyle = '#444466';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Press L to close', PX + PW / 2, PY + PH - 8);

  ctx.restore();
}

// ---- DRAW RANK BADGE (world space, near player name) ----

function drawRankBadge() {
  const p = game.player;
  if (!p || p.isDead) return;
  const badge = leaderboard.playerRankBadge;
  if (!badge) return;

  const { x: sx, y: sy } = camera.worldToScreen(p.x, p.y);
  ctx.save();
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badge, sx + 18, sy - 26);
  ctx.restore();
}

// ---- CLICK HANDLER ----

function handleLeaderboardClick(cx, cy) {
  if (!leaderboard.panelOpen) return false;

  const W = canvas.width;
  const H = canvas.height;
  const PW = 420;
  const PH = 450;
  const PX = Math.floor((W - PW) / 2);
  const PY = Math.floor((H - PH) / 2);

  // Close button
  if (cx >= PX + PW - 32 && cx <= PX + PW - 8 && cy >= PY + 8 && cy <= PY + 32) {
    leaderboard.panelOpen = false;
    return true;
  }

  // Tab clicks
  const tabs = ['level', 'kills', 'dps', 'gold', 'points'];
  const tabW = PW / tabs.length;
  const tabY = PY + 44;
  if (cy >= tabY && cy <= tabY + 28) {
    for (let i = 0; i < tabs.length; i++) {
      const tx = PX + i * tabW;
      if (cx >= tx && cx <= tx + tabW) {
        leaderboard.activeTab = tabs[i];
        leaderboard.playerRankBadge = leaderboard.getPlayerBadge();
        return true;
      }
    }
  }

  // Absorb all clicks inside panel
  if (cx >= PX && cx <= PX + PW && cy >= PY && cy <= PY + PH) return true;

  return false;
}

// ---- UPDATE FUNCTION (called from game loop) ----

function updateLeaderboard(dt) {
  if (!game.player) return;

  // Simulate NPC stat growth
  leaderboard.simulateNPCStats(dt);

  // DPS: prune old damage entries
  const now = Date.now();
  const cutoff = now - 60000;
  while (
    leaderboard.dpsTracker.damages.length > 0 &&
    leaderboard.dpsTracker.damages[0].time < cutoff
  ) {
    leaderboard.dpsTracker.damages.shift();
  }
  // Recalc DPS every second
  if (now - leaderboard.dpsTracker.lastCalc > 1000) {
    leaderboard.calcDPS();
  }

  // Refresh rankings every 30 seconds
  leaderboard.updateTimer += dt;
  if (leaderboard.updateTimer >= 30) {
    leaderboard.updateTimer = 0;
    leaderboard.updateRankings();
  }

  // Tick leaderboard-specific notifications
  for (let i = leaderboard.notifications.length - 1; i >= 0; i--) {
    const n = leaderboard.notifications[i];
    n.timer -= dt;
    n.alpha = Math.max(0, n.timer / 4);
    if (n.timer <= 0) leaderboard.notifications.splice(i, 1);
  }
}

// ---- KEYBOARD HOOK (L key toggles panel) ----
// Wire this into the game's keydown handler where appropriate.
// Example: in the main keydown listener add:
//   case 'l': case 'L': leaderboard.panelOpen = !leaderboard.panelOpen; break;

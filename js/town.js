// ============================================================
// TOWN — NPCs, shop, healer, town bot logic
// ============================================================
const cx = Math.floor(MAP_W / 2), cy = Math.floor(MAP_H / 2);

const town = {
  shopNPC: { x: (cx - 3) * TILE + TILE / 2, y: (cy - 1) * TILE + TILE / 2, name: 'Merchant' },
  healerNPC: { x: (cx + 3) * TILE + TILE / 2, y: (cy - 1) * TILE + TILE / 2, name: 'Healer' },
  shopOpen: false,
  healCooldown: 0,
  shopScroll: 0,
  invScroll: 0,
  shopItems: [
    { name: 'HP Potion', type: 'potion', rarity: 'common', stats: { hp: 50 }, level: 1, value: 50 },
    { name: 'MP Potion', type: 'potion', rarity: 'common', stats: { mp: 50 }, level: 1, value: 50 },
    { name: 'Basic Sword', type: 'weapon', rarity: 'common', stats: { atk: 5 }, level: 1, value: 200 },
    { name: 'Basic Staff', type: 'weapon', rarity: 'common', stats: { atk: 4, mp: 10 }, level: 1, value: 200 },
    { name: 'Basic Bow', type: 'weapon', rarity: 'common', stats: { atk: 4, spd: 0.2 }, level: 1, value: 200 },
    { name: 'Basic Scepter', type: 'weapon', rarity: 'common', stats: { atk: 3, crit: 0.02 }, level: 1, value: 200 },
    { name: 'Basic Armor', type: 'armor', rarity: 'common', stats: { def: 4, hp: 20 }, level: 1, value: 150 }
  ]
};

// ---- SPRITES ----
function generateTownSprites() {
  // Shopkeeper: simple humanoid with brown hat and apron
  genSprite('shopkeeper', 16, 16, (c) => {
    // Body
    c.fillStyle = '#f4c99a'; c.fillRect(6, 4, 4, 4);      // head
    c.fillStyle = '#8B4513'; c.fillRect(5, 1, 6, 3);       // brown hat
    c.fillStyle = '#8B4513'; c.fillRect(4, 0, 8, 2);       // hat brim
    c.fillStyle = '#d4a017'; c.fillRect(5, 8, 6, 6);       // apron
    c.fillStyle = '#555';    c.fillRect(5, 14, 3, 2);       // left leg
    c.fillStyle = '#555';    c.fillRect(8, 14, 3, 2);       // right leg
    c.fillStyle = '#f4c99a'; c.fillRect(3, 9, 2, 4);        // left arm
    c.fillStyle = '#f4c99a'; c.fillRect(11, 9, 2, 4);       // right arm
    // Eyes
    c.fillStyle = '#111'; c.fillRect(7, 5, 1, 1); c.fillRect(9, 5, 1, 1);
  });

  // Healer shrine: white/gold cross on pedestal
  genSprite('healer_shrine', 16, 16, (c) => {
    // Pedestal
    c.fillStyle = '#9ca3af'; c.fillRect(3, 12, 10, 4);
    c.fillStyle = '#bdc3c7'; c.fillRect(4, 11, 8, 2);
    // Cross
    c.fillStyle = '#f0f0f0'; c.fillRect(6, 2, 4, 10);
    c.fillStyle = '#f0f0f0'; c.fillRect(3, 4, 10, 4);
    // Gold outline
    c.fillStyle = '#d4a017'; c.fillRect(6, 1, 4, 1);
    c.fillStyle = '#d4a017'; c.fillRect(6, 12, 4, 1);
    c.fillStyle = '#d4a017'; c.fillRect(2, 4, 1, 4);
    c.fillStyle = '#d4a017'; c.fillRect(13, 4, 1, 4);
    // Glow
    c.fillStyle = 'rgba(255,255,200,0.3)'; c.beginPath(); c.arc(8, 7, 6, 0, Math.PI * 2); c.fill();
  });

  // Sign shop: wooden signpost with tiny sword icon
  genSprite('sign_shop', 12, 16, (c) => {
    // Post
    c.fillStyle = '#8B4513'; c.fillRect(5, 6, 2, 10);
    // Sign board
    c.fillStyle = '#a0522d'; c.fillRect(1, 1, 10, 6);
    c.fillStyle = '#8B4513'; c.strokeStyle = '#5d3a1a'; c.lineWidth = 0.5;
    c.strokeRect(1, 1, 10, 6);
    // Tiny sword icon
    c.fillStyle = '#ccc'; c.fillRect(5, 2, 1, 4);   // blade
    c.fillStyle = '#d4a017'; c.fillRect(4, 5, 3, 1); // crossguard
  });

  // Sign healer: wooden signpost with tiny cross icon
  genSprite('sign_healer', 12, 16, (c) => {
    // Post
    c.fillStyle = '#8B4513'; c.fillRect(5, 6, 2, 10);
    // Sign board
    c.fillStyle = '#a0522d'; c.fillRect(1, 1, 10, 6);
    c.fillStyle = '#8B4513'; c.strokeStyle = '#5d3a1a'; c.lineWidth = 0.5;
    c.strokeRect(1, 1, 10, 6);
    // Tiny cross icon
    c.fillStyle = '#f0f0f0'; c.fillRect(5, 2, 2, 4);
    c.fillStyle = '#f0f0f0'; c.fillRect(4, 3, 4, 2);
  });
}

// ---- UPDATE ----
function updateTown(dt) {
  if (game.state !== 'playing' || !game.player) return;
  const p = game.player;

  // Decrease heal cooldown
  if (town.healCooldown > 0) town.healCooldown -= dt;

  // Healer: auto-heal when player is within 2 tiles
  if (town.healCooldown <= 0) {
    const dist = Math.hypot(p.x - town.healerNPC.x, p.y - town.healerNPC.y);
    if (dist < TILE * 2) {
      if (p.hp < p.maxHp || p.mp < p.maxMp) {
        p.hp = p.maxHp;
        p.mp = p.maxMp;
        addDmg(p.x, p.y - TILE, '+FULL HP', '#44FF44');
        addEffect(p.x, p.y, 'heal', 0.8);
        addLog('Healer restored you to full health!', '#44FF44');
        town.healCooldown = 3;
      }
    }
  }
}

// ---- DRAW TOWN NPCs ----
function drawTownNPCs() {
  if (game.state !== 'playing') return;

  const drawNPC = (npc, spriteName, signSprite, signOffX) => {
    const { x: sx, y: sy } = camera.worldToScreen(npc.x, npc.y);
    // Viewport culling
    if (sx < -64 || sx > canvas.width + 64 || sy < -64 || sy > canvas.height + 64) return;

    // Draw sprite
    const spr = spriteCache[spriteName];
    if (spr) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spr, sx - 16, sy - 16, 32, 32);
      ctx.restore();
    }

    // Draw sign
    const sign = spriteCache[signSprite];
    if (sign) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sign, sx + signOffX - 12, sy + 4, 24, 32);
      ctx.restore();
    }

    // Draw name label / interaction hint based on proximity
    ctx.save();
    const pDist = game.player ? Math.hypot(game.player.x - npc.x, game.player.y - npc.y) : Infinity;
    if (pDist < TILE * 3) {
      // Close enough: show name
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText(npc.name, sx, sy - 22);
      ctx.fillStyle = '#FFD700';
      ctx.fillText(npc.name, sx, sy - 22);
      // Very close: show interaction hint
      if (pDist < TILE * 1.5) {
        const hint = spriteName === 'shopkeeper' ? '[Click to Shop]' : '[Auto Heal]';
        ctx.font = '9px monospace';
        ctx.strokeText(hint, sx, sy - 32);
        ctx.fillStyle = '#AADDFF';
        ctx.fillText(hint, sx, sy - 32);
      }
    } else {
      // Far away: show colored dot above NPC
      ctx.fillStyle = spriteName === 'shopkeeper' ? '#FFD700' : '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy - 22, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  drawNPC(town.shopNPC, 'shopkeeper', 'sign_shop', -24);
  drawNPC(town.healerNPC, 'healer_shrine', 'sign_healer', 24);
}

// ---- SHOP PANEL ----
function drawShopPanel() {
  if (!town.shopOpen || !game.player) return;
  const p = game.player;
  const W = canvas.width, H = canvas.height;
  const pw = 400, ph = 450;
  const px = (W - pw) / 2, py = (H - ph) / 2;

  // Dark overlay
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);

  // Panel background
  ctx.fillStyle = 'rgba(10,10,30,0.95)';
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.fill();
  ctx.strokeStyle = '#557799';
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.stroke();

  // Title
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('Shop', px + pw / 2, py + 28);

  // X close button
  const closeX = px + pw - 28, closeY = py + 8;
  ctx.fillStyle = 'rgba(180,40,40,0.8)';
  roundRect(ctx, closeX, closeY, 20, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('X', closeX + 10, closeY + 15);

  // Shop items grid (2 columns)
  const colW = (pw - 30) / 2, rowH = 54;
  const gridX = px + 10, gridY = py + 42;
  const items = town.shopItems;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const col = i % 2, row = Math.floor(i / 2);
    const ix = gridX + col * (colW + 10), iy = gridY + row * (rowH + 4);

    // Item background with rarity tint
    const rc = RARITY_COLORS[item.rarity] || '#AAAAAA';
    ctx.fillStyle = rc + '22';
    roundRect(ctx, ix, iy, colW, rowH, 6);
    ctx.fill();
    ctx.strokeStyle = rc + '66';
    ctx.lineWidth = 1;
    roundRect(ctx, ix, iy, colW, rowH, 6);
    ctx.stroke();

    // Item name
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = rc;
    ctx.fillText(item.name, ix + 6, iy + 14);

    // Stats
    ctx.font = '9px monospace';
    ctx.fillStyle = '#AAA';
    const statStr = Object.entries(item.stats).map(([k, v]) => k.toUpperCase() + ':' + (k === 'crit' ? (v * 100).toFixed(0) + '%' : k === 'spd' ? v.toFixed(1) : v)).join(' ');
    ctx.fillText(statStr, ix + 6, iy + 28);

    // Price
    ctx.fillStyle = '#ffcc00';
    ctx.font = '10px monospace';
    ctx.fillText(item.value + 'g', ix + 6, iy + 42);

    // BUY button
    const bx = ix + colW - 42, by = iy + rowH - 22;
    const canBuy = p.gold >= item.value && p.inventory.length < 20;
    ctx.fillStyle = canBuy ? 'rgba(20,120,40,0.9)' : 'rgba(60,60,60,0.9)';
    roundRect(ctx, bx, by, 36, 18, 4);
    ctx.fill();
    ctx.fillStyle = canBuy ? '#fff' : '#666';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BUY', bx + 18, by + 13);
  }

  // Divider line
  const divY = gridY + Math.ceil(items.length / 2) * (rowH + 4) + 6;
  ctx.strokeStyle = '#334';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + 10, divY);
  ctx.lineTo(px + pw - 10, divY);
  ctx.stroke();

  // Player gold
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#ffcc00';
  ctx.fillText('Your Gold: ' + p.gold + 'g', px + 10, divY + 18);

  // Inventory section for selling
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#aaccee';
  ctx.textAlign = 'left';
  ctx.fillText('Inventory (click to sell at 40%)', px + 10, divY + 36);

  const invY = divY + 44;
  const invColW = (pw - 30) / 2, invRowH = 28;
  const invItems = p.inventory;

  for (let i = 0; i < Math.min(invItems.length, 10); i++) {
    const item = invItems[i];
    const col = i % 2, row = Math.floor(i / 2);
    const ix = px + 10 + col * (invColW + 10), iy = invY + row * (invRowH + 2);

    const rc = RARITY_COLORS[item.rarity] || '#AAAAAA';
    ctx.fillStyle = rc + '18';
    roundRect(ctx, ix, iy, invColW, invRowH, 4);
    ctx.fill();

    // Item name
    ctx.textAlign = 'left';
    ctx.font = '9px monospace';
    ctx.fillStyle = rc;
    ctx.fillText(item.name.substring(0, 12), ix + 4, iy + 12);

    // Sell button
    const sellPrice = Math.floor(item.value * 0.4);
    const sbx = ix + invColW - 56, sby = iy + 3;
    ctx.fillStyle = 'rgba(120,80,20,0.9)';
    roundRect(ctx, sbx, sby, 52, 22, 3);
    ctx.fill();
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SELL ' + sellPrice + 'g', sbx + 26, sby + 15);
  }

  if (invItems.length === 0) {
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#555';
    ctx.fillText('(empty)', px + pw / 2, invY + 14);
  }

  ctx.restore();
}

// ---- SHOP CLICK HANDLING ----
function handleShopClick(clickX, clickY) {
  if (!town.shopOpen || !game.player) return false;
  const p = game.player;
  const W = canvas.width, H = canvas.height;
  const pw = 400, ph = 450;
  const px = (W - pw) / 2, py = (H - ph) / 2;

  // Click outside panel → close
  if (clickX < px || clickX > px + pw || clickY < py || clickY > py + ph) {
    town.shopOpen = false;
    return true;
  }

  // X close button
  const closeX = px + pw - 28, closeY = py + 8;
  if (clickX >= closeX && clickX <= closeX + 20 && clickY >= closeY && clickY <= closeY + 20) {
    town.shopOpen = false;
    return true;
  }

  // Shop items — check BUY buttons
  const colW = (pw - 30) / 2, rowH = 54;
  const gridX = px + 10, gridY = py + 42;
  const items = town.shopItems;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const col = i % 2, row = Math.floor(i / 2);
    const ix = gridX + col * (colW + 10), iy = gridY + row * (rowH + 4);
    const bx = ix + colW - 42, by = iy + rowH - 22;

    if (clickX >= bx && clickX <= bx + 36 && clickY >= by && clickY <= by + 18) {
      if (p.gold >= item.value && p.inventory.length < 20) {
        p.gold -= item.value;
        // Add a copy of the item to inventory
        const bought = JSON.parse(JSON.stringify(item));
        p.inventory.push(bought);
        sfx.itemPickup();
        addNotification('Bought ' + item.name, RARITY_COLORS[item.rarity] || '#fff');
        addLog('Bought ' + item.name + ' for ' + item.value + 'g', '#FFDD44');
      } else if (p.gold < item.value) {
        addNotification('Not enough gold!', '#FF4444');
      } else {
        addNotification('Inventory full!', '#FF4444');
      }
      return true;
    }
  }

  // Inventory sell buttons
  const divY = gridY + Math.ceil(items.length / 2) * (rowH + 4) + 6;
  const invY = divY + 44;
  const invColW = (pw - 30) / 2, invRowH = 28;

  for (let i = 0; i < Math.min(p.inventory.length, 10); i++) {
    const item = p.inventory[i];
    const col = i % 2, row = Math.floor(i / 2);
    const ix = px + 10 + col * (invColW + 10), iy = invY + row * (invRowH + 2);
    const sbx = ix + invColW - 56, sby = iy + 3;

    if (clickX >= sbx && clickX <= sbx + 52 && clickY >= sby && clickY <= sby + 22) {
      const sellPrice = Math.floor(item.value * 0.4);
      p.gold += sellPrice;

      // Unequip if this item is equipped
      for (const slot of ['weapon', 'armor', 'accessory']) {
        if (p.equipment[slot] === item) {
          for (const [k, v] of Object.entries(item.stats)) {
            if (k in p) p[k] -= v;
          }
          p.equipment[slot] = null;
          addLog('Unequipped ' + item.name, '#888');
        }
      }

      p.inventory.splice(i, 1);
      sfx.itemPickup();
      addNotification('Sold for ' + sellPrice + 'g', '#FFDD44');
      addLog('Sold ' + item.name + ' for ' + sellPrice + 'g', '#FFDD44');
      return true;
    }
  }

  return true; // Click was inside panel, consume it
}

// ---- CHECK SHOP NPC CLICK (called from main click handler) ----
function checkTownNPCClick(clickX, clickY) {
  if (game.state !== 'playing' || !game.player) return false;

  // If shop is open, handle shop clicks
  if (town.shopOpen) return handleShopClick(clickX, clickY);

  // Check if clicking near shopkeeper (screen coords → world coords)
  const { x: sx, y: sy } = camera.worldToScreen(town.shopNPC.x, town.shopNPC.y);
  if (Math.hypot(clickX - sx, clickY - sy) < TILE * 1.5) {
    // Player must be close enough in world
    const dist = Math.hypot(game.player.x - town.shopNPC.x, game.player.y - town.shopNPC.y);
    if (dist < TILE * 3) {
      town.shopOpen = true;
      return true;
    }
  }

  return false;
}

// ---- BOT TOWN LOGIC ----
// Called when bot is retreating and reaches town area.
// Returns {x,y} target coords to walk to, or null when done.
function townBotLogic(p) {
  if (!p) return null;

  const healerDist = Math.hypot(p.x - town.healerNPC.x, p.y - town.healerNPC.y);
  const isFullHp = p.hp >= p.maxHp && p.mp >= p.maxMp;

  // Step 1: Walk to healer first if not full HP
  if (!isFullHp) {
    if (healerDist > TILE * 2) {
      return { x: town.healerNPC.x, y: town.healerNPC.y };
    }
    // Close enough — updateTown() will auto-heal, just wait
    return { x: town.healerNPC.x, y: town.healerNPC.y };
  }

  // Step 2: After healed, check if we should buy potions
  const hpPotCount = p.inventory.filter(i => i && i.type === 'potion' && i.stats.hp).length;
  const mpPotCount = p.inventory.filter(i => i && i.type === 'potion' && i.stats.mp).length;
  if (game.settings.autoBuyPotions && p.gold >= 50 && p.inventory.length < 20) {
    // Auto-buy HP potions (keep 5 in stock)
    if (hpPotCount < 5) {
      const hpPot = town.shopItems[0]; // HP Potion
      if (p.gold >= hpPot.value) {
        p.gold -= hpPot.value;
        p.inventory.push(JSON.parse(JSON.stringify(hpPot)));
        addLog('Bot bought ' + hpPot.name, '#FFDD44');
        addNotification('Bot bought ' + hpPot.name, '#FFDD44');
        return { x: town.shopNPC.x, y: town.shopNPC.y };
      }
    }
    // Auto-buy MP potions (keep 3 in stock)
    if (mpPotCount < 3) {
      const mpPot = town.shopItems[1]; // MP Potion
      if (p.gold >= mpPot.value) {
        p.gold -= mpPot.value;
        p.inventory.push(JSON.parse(JSON.stringify(mpPot)));
        addLog('Bot bought ' + mpPot.name, '#3498db');
        addNotification('Bot bought ' + mpPot.name, '#3498db');
        return { x: town.shopNPC.x, y: town.shopNPC.y };
      }
    }
  }

  // Done — bot can resume hunting
  return null;
}

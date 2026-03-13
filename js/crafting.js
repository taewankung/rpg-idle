// ============================================================
// CRAFTING — Material drops, recipes, crafting table NPC, UI
// ============================================================
const craftingSystem = {
  panelOpen: false,
  selectedRecipe: 0,
  craftTimer: 0,
  craftingActive: false,
  scrollOffset: 0,
  botCraftedThisVisit: false,

  // --- MATERIAL DEFINITIONS ---
  materials: {
    iron_ore:    {name:'Iron Ore',     rarity:'common',   icon:'icon_ore',     value:15},
    wood:        {name:'Wood',         rarity:'common',   icon:'icon_wood',    value:10},
    leather:     {name:'Leather',      rarity:'common',   icon:'icon_leather', value:12},
    iron_bar:    {name:'Iron Bar',     rarity:'uncommon', icon:'icon_ore',     value:40},
    steel_bar:   {name:'Steel Bar',    rarity:'rare',     icon:'icon_ore',     value:100},
    fire_gem:    {name:'Fire Gem',     rarity:'rare',     icon:'icon_gem_fire',      value:80},
    ice_gem:     {name:'Ice Gem',      rarity:'rare',     icon:'icon_gem_ice',       value:80},
    lightning_gem:{name:'Lightning Gem',rarity:'rare',    icon:'icon_gem_lightning',  value:80},
    shield_gem:  {name:'Shield Gem',   rarity:'rare',     icon:'icon_gem_shield',    value:80},
    soul_gem:    {name:'Soul Gem',     rarity:'epic',     icon:'icon_soul_gem',      value:150}
  },

  // --- DROP TABLE ---
  // monsterType -> [{mat, chance}]
  dropTable: {
    skeleton: [{mat:'iron_ore',chance:0.15},{mat:'shield_gem',chance:0.03}],
    goblin:   [{mat:'iron_ore',chance:0.15},{mat:'leather',chance:0.10}],
    wolf:     [{mat:'wood',chance:0.15},{mat:'leather',chance:0.10}],
    slime:    [{mat:'wood',chance:0.15}],
    dragon:   [{mat:'shield_gem',chance:0.03},{mat:'soul_gem',chance:0.05}]
  },

  dungeonDrops: [
    {mat:'fire_gem',chance:0.03},
    {mat:'ice_gem',chance:0.03},
    {mat:'lightning_gem',chance:0.03},
    {mat:'soul_gem',chance:0.02}
  ],

  // --- RECIPES ---
  recipes: [
    // Basic materials
    {name:'Iron Bar',       inputs:[{mat:'iron_ore',qty:2}],                       output:{type:'material',matKey:'iron_bar'}},
    {name:'Steel Bar',      inputs:[{mat:'iron_bar',qty:2}],                       output:{type:'material',matKey:'steel_bar'}},
    // Iron tier
    {name:'Iron Sword',     inputs:[{mat:'iron_bar',qty:1},{mat:'wood',qty:1}],    output:{type:'weapon',name:'Iron Sword',rarity:'uncommon',stats:{atk:5},level:3,value:120}},
    {name:'Iron Armor',     inputs:[{mat:'iron_bar',qty:1},{mat:'leather',qty:1}], output:{type:'armor',name:'Iron Armor',rarity:'uncommon',stats:{def:5},level:3,value:120}},
    // Steel tier
    {name:'Steel Sword',    inputs:[{mat:'steel_bar',qty:1},{mat:'wood',qty:1}],    output:{type:'weapon',name:'Steel Sword',rarity:'rare',stats:{atk:12},level:6,value:300}},
    {name:'Steel Armor',    inputs:[{mat:'steel_bar',qty:1},{mat:'leather',qty:1}], output:{type:'armor',name:'Steel Armor',rarity:'rare',stats:{def:12},level:6,value:300}},
    // Gem enchantments (weapon + gem)
    {name:'Fire Enchant',   inputs:[{slot:'weapon',qty:1},{mat:'fire_gem',qty:1}],      output:{type:'enchant',enchant:'fire'}},
    {name:'Ice Enchant',    inputs:[{slot:'weapon',qty:1},{mat:'ice_gem',qty:1}],       output:{type:'enchant',enchant:'ice'}},
    {name:'Thunder Enchant',inputs:[{slot:'weapon',qty:1},{mat:'lightning_gem',qty:1}],  output:{type:'enchant',enchant:'thunder'}},
    // Armor enchant
    {name:'Fortify Armor',  inputs:[{slot:'armor',qty:1},{mat:'shield_gem',qty:1}],     output:{type:'enchant',enchant:'fortify'}},
    // Soul gem craft
    {name:'Soul Forge',     inputs:[{mat:'soul_gem',qty:3}],                            output:{type:'random_epic'}},
    // Legendary class weapon
    {name:'Legendary Forge',inputs:[{mat:'soul_gem',qty:2},{mat:'steel_bar',qty:1},{mat:'fire_gem',qty:1}], output:{type:'legendary_weapon'}}
  ],

  // --- MATERIAL DROP ROLL ---
  rollMaterialDrop(monType, inDungeon) {
    const drops = [];
    // Normal drops by monster type
    const table = this.dropTable[monType];
    if (table) {
      for (const entry of table) {
        if (Math.random() < entry.chance) drops.push(entry.mat);
      }
    }
    // Dungeon bonus drops
    if (inDungeon) {
      for (const entry of this.dungeonDrops) {
        if (Math.random() < entry.chance) drops.push(entry.mat);
      }
    }
    if (drops.length === 0) return null;
    // Return first drop as item
    const matKey = drops[0];
    const def = this.materials[matKey];
    return {name:def.name, type:'material', rarity:def.rarity, stats:{}, level:1, value:def.value, matKey:matKey};
  },

  // --- CHECK IF PLAYER HAS MATERIALS ---
  hasInputs(recipe, inv) {
    const counts = {};
    for (const inp of recipe.inputs) {
      if (inp.mat) {
        counts[inp.mat] = (counts[inp.mat] || 0) + inp.qty;
      }
    }
    // Count materials in inventory
    for (const [mat, need] of Object.entries(counts)) {
      const have = inv.filter(i => i && i.type === 'material' && i.matKey === mat).length;
      if (have < need) return false;
    }
    // Check equipment slots for enchant recipes
    for (const inp of recipe.inputs) {
      if (inp.slot) {
        const slotItems = inv.filter(i => i && i.type === inp.slot);
        if (slotItems.length < inp.qty) return false;
      }
    }
    return true;
  },

  // --- CONSUME INPUTS ---
  consumeInputs(recipe, inv) {
    const consumed = {slotItem: null};
    for (const inp of recipe.inputs) {
      if (inp.mat) {
        for (let q = 0; q < inp.qty; q++) {
          const idx = inv.findIndex(i => i && i.type === 'material' && i.matKey === inp.mat);
          if (idx >= 0) inv.splice(idx, 1);
        }
      }
      if (inp.slot) {
        const idx = inv.findIndex(i => i && i.type === inp.slot);
        if (idx >= 0) {
          consumed.slotItem = inv[idx];
          inv.splice(idx, 1);
        }
      }
    }
    return consumed;
  },

  // --- PRODUCE OUTPUT ITEM ---
  produceOutput(recipe, consumed, playerClass) {
    const out = recipe.output;
    if (out.type === 'material') {
      const def = this.materials[out.matKey];
      return {name:def.name, type:'material', rarity:def.rarity, stats:{}, level:1, value:def.value, matKey:out.matKey};
    }
    if (out.type === 'weapon' || out.type === 'armor' || out.type === 'accessory') {
      return {name:out.name, type:out.type, rarity:out.rarity, stats:{...out.stats}, level:out.level, value:out.value};
    }
    if (out.type === 'enchant') {
      const base = consumed.slotItem;
      if (!base) return null;
      const item = {...base, stats:{...base.stats}};
      if (out.enchant === 'fire') {
        item.name = 'Fire ' + item.name;
        item.stats.atk = Math.round((item.stats.atk || 0) * 1.2);
        item.rarity = 'epic';
        item.enchant = 'fire';
      } else if (out.enchant === 'ice') {
        item.name = 'Ice ' + item.name;
        item.rarity = 'epic';
        item.enchant = 'ice';
        item.stats.spd = parseFloat(((item.stats.spd || 0) + 0.3).toFixed(2));
      } else if (out.enchant === 'thunder') {
        item.name = 'Thunder ' + item.name;
        item.rarity = 'epic';
        item.enchant = 'thunder';
        item.stats.atk = Math.round((item.stats.atk || 0) * 1.15);
        item.stats.crit = parseFloat(((item.stats.crit || 0) + 0.05).toFixed(2));
      } else if (out.enchant === 'fortify') {
        item.name = 'Fortified ' + item.name;
        item.rarity = 'epic';
        item.enchant = 'fortify';
        item.stats.def = Math.round((item.stats.def || 0) * 1.3);
      }
      item.value = Math.round(item.value * 2);
      return item;
    }
    if (out.type === 'random_epic') {
      const lvl = game.player ? game.player.level : 5;
      const mult = rarMult('epic') * (1 + lvl * 0.1);
      const tr = Math.random();
      let type, name;
      if (tr < 0.4) {type='weapon'; name=PRFX[ri(0,PRFX.length-1)]+WPNS[ri(0,WPNS.length-1)];}
      else if (tr < 0.75) {type='armor'; name=PRFX[ri(0,PRFX.length-1)]+ARMRS[ri(0,ARMRS.length-1)];}
      else {type='accessory'; name=PRFX[ri(0,PRFX.length-1)]+ACCS[ri(0,ACCS.length-1)];}
      const stats = {};
      if (type==='weapon'){stats.atk=Math.round((2+lvl*1.5)*mult);if(Math.random()<0.4)stats.crit=parseFloat((0.02*mult).toFixed(2));}
      else if (type==='armor'){stats.def=Math.round((1+lvl)*mult);if(Math.random()<0.5)stats.hp=Math.round((10+lvl*5)*mult);}
      else{stats.spd=parseFloat((0.15*mult).toFixed(2));if(Math.random()<0.4)stats.mp=Math.round((5+lvl*3)*mult);}
      return {name,type,rarity:'epic',stats,level:lvl,value:Math.round((5+lvl*10)*rarMult('epic'))};
    }
    if (out.type === 'legendary_weapon') {
      const cls = playerClass || (game.player ? game.player.className : 'Knight');
      const lvl = game.player ? game.player.level : 10;
      const mult = rarMult('legendary') * (1 + lvl * 0.1);
      const classWeapons = {
        Knight:{name:'Excalibur',stats:{atk:Math.round(30*mult),def:Math.round(10*mult),crit:0.08}},
        Mage:{name:'Staff of Eternity',stats:{atk:Math.round(25*mult),mp:Math.round(50*mult),crit:0.1}},
        Ranger:{name:'Windrunner Bow',stats:{atk:Math.round(28*mult),spd:parseFloat((1.0*mult).toFixed(2)),crit:0.15}},
        Priest:{name:'Divine Scepter',stats:{atk:Math.round(20*mult),hp:Math.round(80*mult),mp:Math.round(40*mult)}}
      };
      const w = classWeapons[cls] || classWeapons.Knight;
      return {name:w.name, type:'weapon', rarity:'legendary', stats:{...w.stats}, level:lvl, value:Math.round((5+lvl*10)*rarMult('legendary'))};
    }
    return null;
  },

  // --- CRAFT EXECUTION ---
  craft(recipeIdx) {
    if (this.craftingActive) return;
    const p = game.player;
    if (!p) return;
    const recipe = this.recipes[recipeIdx];
    if (!recipe) return;
    if (!this.hasInputs(recipe, p.inventory)) {
      addNotification('Missing materials!', '#FF4444');
      return;
    }
    if (p.inventory.length >= 20) {
      addNotification('Inventory full!', '#FF4444');
      return;
    }
    this.craftingActive = true;
    this.craftTimer = 1.0;
    this._pendingRecipe = recipeIdx;
  },

  updateCrafting(dt) {
    if (!this.craftingActive) return;
    this.craftTimer -= dt;
    // Spark effects while crafting
    if (game.player && Math.random() < 0.3) {
      const nx = this.anvilNPC ? this.anvilNPC.x : game.player.x;
      const ny = this.anvilNPC ? this.anvilNPC.y : game.player.y;
      addEffect(nx + rf(-12, 12), ny + rf(-12, 12), 'hit', 0.3);
    }
    if (this.craftTimer <= 0) {
      this.craftingActive = false;
      const p = game.player;
      const recipe = this.recipes[this._pendingRecipe];
      if (!recipe || !p) return;
      if (!this.hasInputs(recipe, p.inventory)) {
        addNotification('Materials lost!', '#FF4444');
        return;
      }
      const consumed = this.consumeInputs(recipe, p.inventory);
      const item = this.produceOutput(recipe, consumed, p.className);
      if (!item) {
        addNotification('Crafting failed!', '#FF4444');
        return;
      }
      if (p.inventory.length < 20) {
        p.inventory.push(item);
        autoEquip(p, item);
        sfx.spell();
        addNotification('Crafted: ' + item.name, RARITY_COLORS[item.rarity] || '#fff');
        addLog('Crafted ' + item.name + '!', RARITY_COLORS[item.rarity] || '#FFDD44');
        if (this.anvilNPC) addEffect(this.anvilNPC.x, this.anvilNPC.y, 'buff', 0.8);
      } else {
        addNotification('Inventory full!', '#FF4444');
      }
    }
  },

  // --- SPRITES ---
  generateSprites() {
    genSprite('anvil', 16, 16, (c) => {
      // Base/platform
      c.fillStyle = '#4b5563';
      c.fillRect(2, 12, 12, 4);
      // Anvil body
      c.fillStyle = '#6b7280';
      c.fillRect(4, 8, 8, 5);
      // Anvil top (wider)
      c.fillStyle = '#9ca3af';
      c.fillRect(3, 6, 10, 3);
      // Horn (left side taper)
      c.fillStyle = '#9ca3af';
      c.fillRect(1, 7, 3, 2);
      c.fillStyle = '#6b7280';
      c.fillRect(0, 7, 2, 1);
      // Highlight
      c.fillStyle = '#bdc3c7';
      c.fillRect(4, 6, 6, 1);
      // Dark underside
      c.fillStyle = '#374151';
      c.fillRect(3, 13, 10, 1);
    });

    genSprite('sign_crafting', 12, 16, (c) => {
      // Post
      c.fillStyle = '#8B4513'; c.fillRect(5, 6, 2, 10);
      // Sign board
      c.fillStyle = '#a0522d'; c.fillRect(1, 1, 10, 6);
      c.strokeStyle = '#5d3a1a'; c.lineWidth = 0.5;
      c.strokeRect(1, 1, 10, 6);
      // Tiny anvil icon
      c.fillStyle = '#ccc'; c.fillRect(3, 3, 6, 2);
      c.fillStyle = '#aaa'; c.fillRect(4, 5, 4, 1);
    });
  },

  // --- TOWN NPC ---
  anvilNPC: null,

  initTownNPC() {
    const tcx = Math.floor(MAP_W / 2), tcy = Math.floor(MAP_H / 2);
    this.anvilNPC = {
      x: (tcx - 1) * TILE + TILE / 2,
      y: (tcy + 2) * TILE + TILE / 2,
      name: 'Anvil'
    };
  },

  // --- DRAW ANVIL NPC ---
  drawAnvilNPC() {
    if (game.state !== 'playing' || !this.anvilNPC || dungeon.active) return;
    const npc = this.anvilNPC;
    const {x: sx, y: sy} = camera.worldToScreen(npc.x, npc.y);
    if (sx < -64 || sx > canvas.width + 64 || sy < -64 || sy > canvas.height + 64) return;

    const spr = spriteCache['anvil'];
    if (spr) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spr, sx - 16, sy - 16, 32, 32);
      ctx.restore();
    }

    const sign = spriteCache['sign_crafting'];
    if (sign) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sign, sx + 16, sy + 4, 24, 32);
      ctx.restore();
    }

    ctx.save();
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(npc.name, sx, sy - 22);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(npc.name, sx, sy - 22);

    if (game.player) {
      const dist = Math.hypot(game.player.x - npc.x, game.player.y - npc.y);
      if (dist < TILE * 2.5) {
        ctx.font = '9px monospace';
        ctx.strokeText('[Click to Craft]', sx, sy - 32);
        ctx.fillStyle = '#AADDFF';
        ctx.fillText('[Click to Craft]', sx, sy - 32);
      }
    }
    ctx.restore();
  },

  // --- CHECK ANVIL CLICK ---
  checkAnvilClick(clickX, clickY) {
    if (game.state !== 'playing' || !game.player || !this.anvilNPC || dungeon.active) return false;
    if (this.panelOpen) return this._handlePanelClick(clickX, clickY);

    const {x: sx, y: sy} = camera.worldToScreen(this.anvilNPC.x, this.anvilNPC.y);
    if (Math.hypot(clickX - sx, clickY - sy) < TILE * 1.5) {
      const dist = Math.hypot(game.player.x - this.anvilNPC.x, game.player.y - this.anvilNPC.y);
      if (dist < TILE * 3) {
        this.panelOpen = true;
        this.selectedRecipe = 0;
        this.scrollOffset = 0;
        return true;
      }
    }
    return false;
  },

  // --- PANEL CLICK HANDLER (internal) ---
  _handlePanelClick(clickX, clickY) {
    if (!this.panelOpen || !game.player) return false;
    const W = canvas.width, H = canvas.height;
    const pw = 420, ph = 400;
    const px = (W - pw) / 2, py = (H - ph) / 2;

    // Click outside panel -> close
    if (clickX < px || clickX > px + pw || clickY < py || clickY > py + ph) {
      this.panelOpen = false;
      return true;
    }

    // X close button
    const closeX = px + pw - 28, closeY = py + 8;
    if (clickX >= closeX && clickX <= closeX + 20 && clickY >= closeY && clickY <= closeY + 20) {
      this.panelOpen = false;
      return true;
    }

    // Recipe list (left side)
    const listX = px + 10, listY = py + 42;
    const listW = 180, rowH = 30;
    const maxVisible = 10;
    for (let i = 0; i < Math.min(this.recipes.length, maxVisible); i++) {
      const ri2 = i + this.scrollOffset;
      if (ri2 >= this.recipes.length) break;
      const ry = listY + i * rowH;
      if (clickX >= listX && clickX <= listX + listW && clickY >= ry && clickY <= ry + rowH) {
        this.selectedRecipe = ri2;
        return true;
      }
    }

    // Scroll arrows
    const arrowY = listY + maxVisible * rowH + 4;
    if (clickX >= listX && clickX <= listX + 40 && clickY >= arrowY && clickY <= arrowY + 18) {
      // Up arrow
      if (this.scrollOffset > 0) this.scrollOffset--;
      return true;
    }
    if (clickX >= listX + 50 && clickX <= listX + 90 && clickY >= arrowY && clickY <= arrowY + 18) {
      // Down arrow
      if (this.scrollOffset < this.recipes.length - maxVisible) this.scrollOffset++;
      return true;
    }

    // Craft button
    const btnW = 120, btnH = 30;
    const btnX = px + pw / 2 + 20, btnY = py + ph - 50;
    if (clickX >= btnX && clickX <= btnX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
      const recipe = this.recipes[this.selectedRecipe];
      if (recipe && this.hasInputs(recipe, game.player.inventory)) {
        this.craft(this.selectedRecipe);
      }
      return true;
    }

    return true; // consume click inside panel
  },

  // --- GET RECIPE INPUT LABEL ---
  _inputLabel(inp) {
    if (inp.mat) {
      const def = this.materials[inp.mat];
      return (def ? def.name : inp.mat) + (inp.qty > 1 ? ' x' + inp.qty : '');
    }
    if (inp.slot) {
      return 'Any ' + inp.slot.charAt(0).toUpperCase() + inp.slot.slice(1);
    }
    return '???';
  },

  // --- GET RECIPE OUTPUT LABEL ---
  _outputInfo(recipe) {
    const out = recipe.output;
    if (out.type === 'material') {
      const def = this.materials[out.matKey];
      return {name:def.name, rarity:def.rarity, stats:null, icon:def.icon};
    }
    if (out.type === 'weapon' || out.type === 'armor' || out.type === 'accessory') {
      const iconMap = {weapon:'icon_sword', armor:'icon_armor', accessory:'icon_ring'};
      return {name:out.name, rarity:out.rarity, stats:out.stats, icon:iconMap[out.type]};
    }
    if (out.type === 'enchant') {
      const enchNames = {fire:'Fire Enchant', ice:'Ice Enchant', thunder:'Thunder Enchant', fortify:'Fortify Armor'};
      return {name:enchNames[out.enchant] || 'Enchant', rarity:'epic', stats:null, icon:'icon_enhance_stone'};
    }
    if (out.type === 'random_epic') {
      return {name:'Random Epic Item', rarity:'epic', stats:null, icon:'icon_soul_gem'};
    }
    if (out.type === 'legendary_weapon') {
      return {name:'Legendary Weapon', rarity:'legendary', stats:null, icon:'icon_sword'};
    }
    return {name:'???', rarity:'common', stats:null, icon:'icon_ore'};
  },

  // --- BOT AUTO-CRAFT ---
  botAutoCraft(player) {
    if (!player || this.botCraftedThisVisit) return;
    // Find best craftable recipe (by output stat score)
    let bestIdx = -1, bestScore = -1;
    for (let i = 0; i < this.recipes.length; i++) {
      const recipe = this.recipes[i];
      if (!this.hasInputs(recipe, player.inventory)) continue;
      if (player.inventory.length >= 20) continue;
      // Score the output
      const info = this._outputInfo(recipe);
      let score = 0;
      if (info.stats) score = statScore(info.stats);
      // Prioritize higher rarity
      const rarScores = {common:1, uncommon:5, rare:15, epic:40, legendary:100};
      score += rarScores[info.rarity] || 0;
      if (score > bestScore) {bestScore = score; bestIdx = i;}
    }
    if (bestIdx >= 0) {
      const recipe = this.recipes[bestIdx];
      const consumed = this.consumeInputs(recipe, player.inventory);
      const item = this.produceOutput(recipe, consumed, player.className);
      if (item && player.inventory.length < 20) {
        player.inventory.push(item);
        autoEquip(player, item);
        addNotification('Bot crafted: ' + item.name, RARITY_COLORS[item.rarity] || '#fff');
        addLog('Bot crafted ' + item.name + '!', RARITY_COLORS[item.rarity] || '#FFDD44');
        sfx.spell();
      }
      this.botCraftedThisVisit = true;
    }
  },

  // --- SAVE / LOAD ---
  save() {
    return {
      botCraftedThisVisit: this.botCraftedThisVisit
    };
  },

  load(data) {
    if (!data) return;
    if (typeof data.botCraftedThisVisit !== 'undefined') this.botCraftedThisVisit = data.botCraftedThisVisit;
  }
};

// ---- GLOBAL DRAW FUNCTION ----
function drawCraftingPanel() {
  // Draw anvil NPC in world (always, before panel overlay)
  craftingSystem.drawAnvilNPC();

  if (!craftingSystem.panelOpen || !game.player) return;
  const p = game.player;
  const sys = craftingSystem;
  const W = canvas.width, H = canvas.height;
  const pw = 420, ph = 400;
  const px = (W - pw) / 2, py = (H - ph) / 2;

  // Dark overlay
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);

  // Panel background
  ctx.fillStyle = 'rgba(10,10,30,0.95)';
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.fill();
  ctx.strokeStyle = '#886622';
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.stroke();

  // Title
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('Crafting', px + pw / 2, py + 28);

  // X close button
  const closeX = px + pw - 28, closeY = py + 8;
  ctx.fillStyle = 'rgba(180,40,40,0.8)';
  roundRect(ctx, closeX, closeY, 20, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('X', closeX + 10, closeY + 15);

  // Crafting timer indicator
  if (sys.craftingActive) {
    const pct = 1 - sys.craftTimer;
    ctx.fillStyle = 'rgba(255,200,50,0.3)';
    ctx.fillRect(px + 10, py + ph - 8, (pw - 20) * pct, 4);
  }

  // ---- LEFT: Recipe list ----
  const listX = px + 10, listY = py + 42;
  const listW = 180, rowH = 30;
  const maxVisible = 10;

  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#aaccee';
  ctx.fillText('Recipes', listX, listY - 4);

  for (let i = 0; i < Math.min(sys.recipes.length, maxVisible); i++) {
    const ri2 = i + sys.scrollOffset;
    if (ri2 >= sys.recipes.length) break;
    const recipe = sys.recipes[ri2];
    const ry = listY + i * rowH;
    const selected = ri2 === sys.selectedRecipe;
    const canCraft = sys.hasInputs(recipe, p.inventory);

    // Row background
    ctx.fillStyle = selected ? 'rgba(100,80,30,0.6)' : 'rgba(30,30,50,0.5)';
    roundRect(ctx, listX, ry, listW, rowH - 2, 4);
    ctx.fill();
    if (selected) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1;
      roundRect(ctx, listX, ry, listW, rowH - 2, 4);
      ctx.stroke();
    }

    // Recipe icon
    const info = sys._outputInfo(recipe);
    const ico = spriteCache[info.icon];
    if (ico) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(ico, listX + 2, ry + 3, 22, 22);
    }

    // Recipe name
    ctx.font = '10px monospace';
    ctx.fillStyle = canCraft ? (RARITY_COLORS[info.rarity] || '#aaa') : '#555';
    ctx.textAlign = 'left';
    ctx.fillText(recipe.name, listX + 28, ry + 18);
  }

  // Scroll arrows
  const arrowY = listY + maxVisible * rowH + 4;
  ctx.fillStyle = sys.scrollOffset > 0 ? 'rgba(80,80,120,0.8)' : 'rgba(40,40,60,0.5)';
  roundRect(ctx, listX, arrowY, 40, 18, 3);
  ctx.fill();
  ctx.fillStyle = '#aaa';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('▲ Up', listX + 20, arrowY + 13);

  ctx.fillStyle = sys.scrollOffset < sys.recipes.length - maxVisible ? 'rgba(80,80,120,0.8)' : 'rgba(40,40,60,0.5)';
  roundRect(ctx, listX + 50, arrowY, 40, 18, 3);
  ctx.fill();
  ctx.fillStyle = '#aaa';
  ctx.fillText('▼ Dn', listX + 70, arrowY + 13);

  // ---- RIGHT: Selected recipe detail ----
  const detX = px + 200, detY = py + 42, detW = 210;

  const selRecipe = sys.recipes[sys.selectedRecipe];
  if (selRecipe) {
    const outInfo = sys._outputInfo(selRecipe);
    const canCraft = sys.hasInputs(selRecipe, p.inventory);

    // Output preview header
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#aaccee';
    ctx.fillText('Result:', detX, detY + 6);

    // Output icon + name
    const ico = spriteCache[outInfo.icon];
    if (ico) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(ico, detX, detY + 12, 28, 28);
    }
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = RARITY_COLORS[outInfo.rarity] || '#aaa';
    ctx.fillText(outInfo.name, detX + 34, detY + 30);

    // Rarity label
    ctx.font = '9px monospace';
    ctx.fillStyle = RARITY_COLORS[outInfo.rarity] || '#aaa';
    ctx.fillText('[' + (outInfo.rarity ? outInfo.rarity.charAt(0).toUpperCase() + outInfo.rarity.slice(1) : '') + ']', detX + 34, detY + 42);

    // Stats preview
    if (outInfo.stats) {
      ctx.font = '10px monospace';
      ctx.fillStyle = '#88CC88';
      const statStr = Object.entries(outInfo.stats).map(([k,v]) => k.toUpperCase() + ':+' + (k === 'crit' ? (v*100).toFixed(0) + '%' : k === 'spd' ? v.toFixed(1) : v)).join('  ');
      ctx.fillText(statStr, detX, detY + 60);
    }

    // Materials needed
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#aaccee';
    ctx.fillText('Materials:', detX, detY + 84);

    let my = detY + 98;
    for (const inp of selRecipe.inputs) {
      const label = sys._inputLabel(inp);
      let hasIt = false;
      if (inp.mat) {
        const need = inp.qty;
        const have = p.inventory.filter(it => it && it.type === 'material' && it.matKey === inp.mat).length;
        hasIt = have >= need;
        // Draw material icon
        const matDef = sys.materials[inp.mat];
        if (matDef) {
          const matIco = spriteCache[matDef.icon];
          if (matIco) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(matIco, detX, my - 10, 16, 16);
          }
        }
        // Check/X mark
        ctx.font = '10px monospace';
        ctx.fillStyle = hasIt ? '#44FF44' : '#FF4444';
        ctx.fillText(hasIt ? '✓' : '✗', detX + 18, my + 2);
        // Label with count
        ctx.fillStyle = hasIt ? '#aaa' : '#666';
        ctx.fillText(label + ' (' + have + '/' + need + ')', detX + 30, my + 2);
      } else if (inp.slot) {
        const have = p.inventory.filter(it => it && it.type === inp.slot).length;
        hasIt = have >= inp.qty;
        ctx.font = '10px monospace';
        ctx.fillStyle = hasIt ? '#44FF44' : '#FF4444';
        ctx.fillText(hasIt ? '✓' : '✗', detX + 18, my + 2);
        ctx.fillStyle = hasIt ? '#aaa' : '#666';
        ctx.fillText(label + ' (' + have + '/' + inp.qty + ')', detX + 30, my + 2);
      }
      my += 20;
    }

    // Craft button
    const btnW = 120, btnH = 30;
    const btnX = px + pw / 2 + 20, btnY = py + ph - 50;

    if (sys.craftingActive) {
      ctx.fillStyle = 'rgba(120,100,30,0.9)';
      roundRect(ctx, btnX, btnY, btnW, btnH, 6);
      ctx.fill();
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Crafting...', btnX + btnW / 2, btnY + 20);
    } else if (canCraft) {
      ctx.fillStyle = 'rgba(180,140,30,0.9)';
      roundRect(ctx, btnX, btnY, btnW, btnH, 6);
      ctx.fill();
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1;
      roundRect(ctx, btnX, btnY, btnW, btnH, 6);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRAFT', btnX + btnW / 2, btnY + 20);
    } else {
      ctx.fillStyle = 'rgba(40,40,50,0.9)';
      roundRect(ctx, btnX, btnY, btnW, btnH, 6);
      ctx.fill();
      ctx.fillStyle = '#555';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRAFT', btnX + btnW / 2, btnY + 20);
    }
  }

  ctx.restore();
}

// ---- GLOBAL CLICK HANDLER ----
function handleCraftingClick(cx2, cy2) {
  return craftingSystem.checkAnvilClick(cx2, cy2);
}

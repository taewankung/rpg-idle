// ============================================================
// COSMETIC SHOP — Skins & Skill Effects
// ============================================================

const SKIN_DEFS = {
  // --- Rare (5000g) ---
  ninja: { name:'Shadow Ninja', price:5000, rarity:'rare', desc:'Silent blade in the dark',
    skin:'#e8d4b8', body:'#1a1a2e', armor:'#16213e', legs:'#0f3460',
    head:(c,s,u)=>{
      // Ninja mask/hood
      c.fillStyle='#1a1a2e';c.fillRect(9,2,14,8);
      if(!u){c.fillStyle='#0f3460';c.fillRect(9,6,14,5); // face mask
      c.fillStyle='#fff';if(!s){c.fillRect(12,4,2,2);c.fillRect(18,4,2,2)}else{c.fillRect(18,4,2,2)}
      c.fillStyle='#c00';c.fillRect(12,4,1,1);c.fillRect(18,4,1,1)} // red eyes
      // Headband tail
      c.fillStyle='#e74c3c';c.fillRect(9,3,14,2);
      c.fillRect(23,3,6,1);c.fillRect(25,4,5,1);
    },
    right:(c)=>{c.fillStyle='#9ca3af';c.fillRect(25,8,2,10);c.fillRect(24,6,4,2)}, // kunai
    left:(c)=>{c.fillStyle='#9ca3af';c.fillRect(4,10,2,2);c.fillRect(3,11,2,2);c.fillRect(2,12,2,2)}, // shuriken
    aura:{color:'#1a1a2e',alt:'#e74c3c',count:3,speed:2,size:1.5,style:'smoke'} },

  pirate: { name:'Sea Pirate', price:5000, rarity:'rare', desc:'Terror of the seven seas',
    skin:'#d4a574', body:'#ecf0f1', armor:'#2c3e50', legs:'#8B4513',
    head:(c,s,u)=>{
      // Pirate hat
      c.fillStyle='#2c3e50';c.fillRect(7,0,18,4);c.fillRect(5,4,22,3);
      c.fillStyle='#f1c40f';c.fillRect(14,1,4,3); // skull emblem
      if(!u){c.fillStyle='#111';if(!s){c.fillRect(12,7,2,2);c.fillRect(18,7,2,2)}else{c.fillRect(18,7,2,2)}
      // Eye patch
      c.fillStyle='#111';if(!s){c.fillRect(11,7,4,3);c.fillRect(10,5,1,3)}else{c.fillRect(17,7,4,3)}}
    },
    right:(c)=>{c.fillStyle='#bdc3c7';c.fillRect(26,6,2,16);c.fillStyle='#f1c40f';c.fillRect(25,5,4,3)}, // cutlass
    aura:{color:'#2c3e50',alt:'#f1c40f',count:3,speed:1,size:2,style:'leaf'} },

  frost: { name:'Frostborne', price:5000, rarity:'rare', desc:'Frozen warrior of the north',
    skin:'#c8e6ff', body:'#4488cc', armor:'#2266aa', legs:'#1a4d7a',
    head:(c,s,u)=>{
      c.fillStyle='#aaeeff';c.fillRect(9,1,14,6); // ice crown
      c.fillStyle='#66bbee';c.fillRect(11,0,3,4);c.fillRect(18,0,3,4);c.fillRect(14,-1,4,3); // crystals
      c.fillStyle='#fff';c.fillRect(15,0,2,2);
    },
    right:(c)=>{c.fillStyle='#88ccff';c.fillRect(26,4,2,18);c.fillStyle='#aaeeff';c.fillRect(25,2,4,4)},
    aura:{color:'#aaeeff',alt:'#44aaff',count:5,speed:1,size:2,style:'snowflake'} },

  viking: { name:'Viking Raider', price:5000, rarity:'rare', desc:'From the frozen north',
    skin:'#f4c99a', body:'#8B7355', armor:'#6B4226', legs:'#5C4033',
    head:(c,s,u)=>{
      // Horned helmet
      c.fillStyle='#808080';c.fillRect(8,3,16,7);
      c.fillStyle='#999';c.fillRect(8,6,16,3); // visor
      c.fillStyle='#f5f0e1';c.fillRect(7,2,4,2);c.lineTo(5,-2);
      c.beginPath();c.moveTo(8,4);c.lineTo(5,-2);c.lineTo(10,3);c.fillStyle='#f5f0e1';c.fill(); // left horn
      c.beginPath();c.moveTo(24,4);c.lineTo(27,-2);c.lineTo(22,3);c.fill(); // right horn
      if(!u&&!s){c.fillStyle='#3498db';c.fillRect(12,7,2,2);c.fillRect(18,7,2,2)}
      // Beard
      c.fillStyle='#c68c53';c.fillRect(12,11,8,3);c.fillRect(14,13,4,2);
    },
    right:(c)=>{c.fillStyle='#888';c.fillRect(26,4,2,14);c.fillStyle='#aaa';c.fillRect(24,2,6,4)}, // axe
    left:(c)=>{c.fillStyle='#8B4513';c.beginPath();c.arc(5,18,8,0,Math.PI*2);c.fillStyle='#6B4226';c.fill();
      c.strokeStyle='#888';c.lineWidth=1;c.stroke()}, // shield
    aura:{color:'#c68c53',alt:'#808080',count:3,speed:1.5,size:2,style:'spark'} },

  // --- Epic (8000-12000g) ---
  dracula: { name:'Count Dracula', price:8000, rarity:'epic', desc:'Lord of the eternal night',
    skin:'#e8e0d0', body:'#1a1a1a', armor:'#8B0000', legs:'#111',
    head:(c,s,u)=>{
      // Slicked-back hair
      c.fillStyle='#111';c.fillRect(9,1,14,6);c.fillRect(8,3,2,4);c.fillRect(22,3,2,4);
      if(!u){c.fillStyle='#c00';if(!s){c.fillRect(12,7,2,2);c.fillRect(18,7,2,2)}else{c.fillRect(18,7,2,2)}
      // Fangs
      c.fillStyle='#fff';c.fillRect(13,11,1,2);c.fillRect(18,11,1,2)}
    },
    right:null,
    bodyExtra:(c,s)=>{
      // Cape
      c.fillStyle='#8B0000';c.fillRect(6,12,3,16);c.fillRect(23,12,3,16);
      c.fillStyle='#cc0000';c.fillRect(7,13,2,14);c.fillRect(24,13,2,14);
      // Inner cape lining
      c.fillStyle='#220000';c.fillRect(8,14,1,12);c.fillRect(23,14,1,12);
    },
    aura:{color:'#8B0000',alt:'#ff0000',count:4,speed:1.5,size:2,style:'drip'} },

  samurai: { name:'Ronin Samurai', price:8000, rarity:'epic', desc:'Way of the blade',
    skin:'#f4c99a', body:'#2c3e50', armor:'#c0392b', legs:'#1a252f',
    head:(c,s,u)=>{
      // Kabuto helmet
      c.fillStyle='#c0392b';c.fillRect(7,1,18,8);
      c.fillStyle='#e74c3c';c.fillRect(7,1,18,3);
      c.fillStyle='#f1c40f';c.fillRect(14,0,4,2); // crest
      c.fillRect(13,-2,6,3);
      // Face guard
      c.fillStyle='#2c3e50';c.fillRect(9,8,14,3);
      if(!u&&!s){c.fillStyle='#111';c.fillRect(12,5,2,2);c.fillRect(18,5,2,2)}
    },
    right:(c)=>{c.fillStyle='#bdc3c7';c.fillRect(26,2,2,22);c.fillStyle='#f1c40f';c.fillRect(25,0,4,3)}, // katana
    left:(c)=>{c.fillStyle='#c0392b';c.fillRect(3,12,5,7);c.fillStyle='#e74c3c';c.fillRect(4,13,3,5)}, // saya
    aura:{color:'#c0392b',alt:'#f1c40f',count:4,speed:2,size:2,style:'flame'} },

  pharaoh: { name:'Pharaoh', price:10000, rarity:'epic', desc:'God-king of the sands',
    skin:'#c8a87c', body:'#1a6baa', armor:'#f1c40f', legs:'#e8d9b5',
    head:(c,s,u)=>{
      // Nemes headdress
      c.fillStyle='#f1c40f';c.fillRect(8,0,16,10);
      c.fillStyle='#1a6baa';c.fillRect(10,1,12,2);c.fillRect(10,5,12,2); // stripes
      c.fillStyle='#f1c40f';c.fillRect(6,6,4,8);c.fillRect(22,6,4,8); // side flaps
      c.fillStyle='#1a6baa';c.fillRect(7,8,2,4);c.fillRect(23,8,2,4);
      // Cobra ornament
      c.fillStyle='#27ae60';c.fillRect(14,-2,4,3);c.fillRect(15,-3,2,2);
      if(!u&&!s){c.fillStyle='#111';c.fillRect(12,7,2,2);c.fillRect(18,7,2,2)}
    },
    right:(c)=>{c.fillStyle='#f1c40f';c.fillRect(26,4,2,18);c.fillStyle='#27ae60';c.fillRect(25,2,4,4)}, // ankh staff
    aura:{color:'#f1c40f',alt:'#1a6baa',count:5,speed:0.8,size:2,style:'glow'} },

  demon: { name:'Demon Lord', price:10000, rarity:'epic', desc:'Ruler of the infernal realm',
    skin:'#cc4444', body:'#2d1b2e', armor:'#4a1942', legs:'#1a0a1a',
    head:(c,s,u)=>{
      // Horns
      c.fillStyle='#1a1a1a';c.fillRect(9,3,14,7);
      c.fillStyle='#444';
      c.beginPath();c.moveTo(9,4);c.lineTo(5,-4);c.lineTo(11,3);c.fill();
      c.beginPath();c.moveTo(23,4);c.lineTo(27,-4);c.lineTo(21,3);c.fill();
      if(!u){c.fillStyle='#ff4400';if(!s){c.fillRect(12,6,2,2);c.fillRect(18,6,2,2)}else{c.fillRect(18,6,2,2)}}
      // Mouth
      c.fillStyle='#ff2200';c.fillRect(13,10,6,1);
    },
    bodyExtra:(c,s)=>{
      // Dark wings (small)
      c.fillStyle='#2d1b2e';
      c.beginPath();c.moveTo(8,14);c.lineTo(0,8);c.lineTo(2,16);c.closePath();c.fill();
      c.beginPath();c.moveTo(24,14);c.lineTo(32,8);c.lineTo(30,16);c.closePath();c.fill();
    },
    aura:{color:'#ff4400',alt:'#4a1942',count:5,speed:2,size:3,style:'flame'} },

  sakura: { name:'Sakura Bloom', price:12000, rarity:'epic', desc:'Cherry blossom spirit',
    skin:'#ffe0e8', body:'#ff88aa', armor:'#ff5588', legs:'#cc4477',
    head:(c,s,u)=>{
      c.fillStyle='#ff88aa';c.fillRect(9,2,14,6);
      // Flower ornament
      c.fillStyle='#ff5588';c.fillRect(20,0,4,4);c.fillStyle='#ffaacc';c.fillRect(21,1,2,2);
      c.fillStyle='#ff99bb';c.fillRect(7,1,4,3);
      // Petals in hair
      c.fillStyle='#ffccdd';c.fillRect(10,1,2,2);c.fillRect(16,0,2,2);
    },
    right:(c)=>{c.fillStyle='#ff5588';c.fillRect(26,8,2,8);c.fillStyle='#ffaacc';c.fillRect(25,6,4,3)}, // fan
    aura:{color:'#ffaacc',alt:'#ff88bb',count:6,speed:0.6,size:3,style:'petal'} },

  // --- Legendary (15000-30000g) ---
  phoenix: { name:'Phoenix Knight', price:15000, rarity:'legendary', desc:'Reborn in eternal flame',
    skin:'#ffe0a0', body:'#ff6600', armor:'#cc4400', legs:'#aa3300',
    head:(c,s,u)=>{
      // Flame helm
      c.fillStyle='#cc4400';c.fillRect(8,2,16,8);
      c.fillStyle='#ff6600';c.fillRect(10,0,3,4);c.fillRect(15,-1,3,5);c.fillRect(19,0,3,4); // flames
      c.fillStyle='#ffaa00';c.fillRect(11,0,1,3);c.fillRect(16,-1,1,4);c.fillRect(20,0,1,3);
      if(!u&&!s){c.fillStyle='#fff';c.fillRect(12,6,2,2);c.fillRect(18,6,2,2)}
    },
    bodyExtra:(c,s)=>{
      // Fire wings
      c.fillStyle='#ff6600';
      c.beginPath();c.moveTo(8,14);c.lineTo(-2,6);c.lineTo(0,10);c.lineTo(-4,2);c.lineTo(4,12);c.closePath();c.fill();
      c.beginPath();c.moveTo(24,14);c.lineTo(34,6);c.lineTo(32,10);c.lineTo(36,2);c.lineTo(28,12);c.closePath();c.fill();
      c.fillStyle='#ffaa00';
      c.beginPath();c.moveTo(8,16);c.lineTo(0,10);c.lineTo(4,14);c.closePath();c.fill();
      c.beginPath();c.moveTo(24,16);c.lineTo(32,10);c.lineTo(28,14);c.closePath();c.fill();
    },
    aura:{color:'#ff4400',alt:'#ffcc00',count:8,speed:3,size:3,style:'flame'} },

  angel: { name:'Divine Angel', price:20000, rarity:'legendary', desc:'Heaven\'s holy warrior',
    skin:'#fff5ee', body:'#ecf0f1', armor:'#FFD700', legs:'#f5f5dc',
    head:(c,s,u)=>{
      // Halo
      c.strokeStyle='#FFD700';c.lineWidth=2;
      c.beginPath();c.ellipse(16,-1,8,3,0,0,Math.PI*2);c.stroke();
      c.fillStyle='#fff';c.fillRect(9,3,14,6);
      if(!u&&!s){c.fillStyle='#3498db';c.fillRect(12,6,2,2);c.fillRect(18,6,2,2)}
    },
    bodyExtra:(c,s)=>{
      // Angel wings
      c.fillStyle='#ecf0f1';
      c.beginPath();c.moveTo(8,12);c.lineTo(-2,4);c.lineTo(-4,8);c.lineTo(-2,14);c.lineTo(4,16);c.closePath();c.fill();
      c.beginPath();c.moveTo(24,12);c.lineTo(34,4);c.lineTo(36,8);c.lineTo(34,14);c.lineTo(28,16);c.closePath();c.fill();
      c.fillStyle='#fff';
      c.beginPath();c.moveTo(8,14);c.lineTo(0,8);c.lineTo(2,14);c.closePath();c.fill();
      c.beginPath();c.moveTo(24,14);c.lineTo(32,8);c.lineTo(30,14);c.closePath();c.fill();
    },
    right:(c)=>{c.fillStyle='#FFD700';c.fillRect(26,4,2,18);c.fillStyle='#fff';c.fillRect(24,2,6,4)},
    aura:{color:'#FFD700',alt:'#ffffff',count:6,speed:0.5,size:3,style:'halo'} },

  voidking: { name:'Void Emperor', price:25000, rarity:'legendary', desc:'Ruler of the endless void',
    skin:'#8866aa', body:'#110022', armor:'#220044', legs:'#0a0014',
    head:(c,s,u)=>{
      c.fillStyle='#220044';c.fillRect(8,1,16,9);
      // Crown with void gems
      c.fillStyle='#440066';c.fillRect(8,0,16,4);
      c.fillStyle='#aa00ff';c.fillRect(11,0,2,3);c.fillRect(15,-1,2,4);c.fillRect(19,0,2,3);
      if(!u){c.fillStyle='#cc44ff';if(!s){c.fillRect(12,6,2,2);c.fillRect(18,6,2,2)}else{c.fillRect(18,6,2,2)}}
    },
    bodyExtra:(c,s)=>{
      // Void cape
      c.fillStyle='#110022';c.fillRect(5,12,4,18);c.fillRect(23,12,4,18);
      c.fillStyle='#aa00ff';c.fillRect(6,20,1,1);c.fillRect(8,16,1,1);c.fillRect(24,18,1,1);c.fillRect(26,22,1,1);
    },
    right:(c)=>{c.fillStyle='#440066';c.fillRect(26,2,2,20);c.fillStyle='#aa00ff';c.fillRect(25,0,4,4);
      c.fillStyle='#cc44ff';c.fillRect(26,1,2,2)},
    aura:{color:'#aa00ff',alt:'#000000',count:6,speed:2,size:4,style:'vortex'} },

  seraphim: { name:'Seraphim', price:30000, rarity:'legendary', desc:'Six-winged divine avatar',
    skin:'#fff8e0', body:'#fffce0', armor:'#FFD700', legs:'#f5e6c8',
    head:(c,s,u)=>{
      // Golden crown with divine glow
      c.fillStyle='#FFD700';c.fillRect(8,0,16,4);
      c.fillRect(10,-2,3,3);c.fillRect(15,-3,3,4);c.fillRect(20,-2,3,3);
      c.fillStyle='#fff';c.fillRect(11,-1,1,1);c.fillRect(16,-2,1,1);c.fillRect(21,-1,1,1);
      c.fillStyle='#fff5cc';c.fillRect(9,3,14,6);
      if(!u&&!s){c.fillStyle='#3498db';c.fillRect(12,6,2,2);c.fillRect(18,6,2,2)}
    },
    bodyExtra:(c,s)=>{
      // Six wings (3 pairs)
      c.fillStyle='#FFD700';
      // Top wings
      c.beginPath();c.moveTo(8,10);c.lineTo(-4,0);c.lineTo(-2,6);c.lineTo(2,10);c.closePath();c.fill();
      c.beginPath();c.moveTo(24,10);c.lineTo(36,0);c.lineTo(34,6);c.lineTo(30,10);c.closePath();c.fill();
      // Mid wings
      c.fillStyle='#ffe066';
      c.beginPath();c.moveTo(8,14);c.lineTo(-6,8);c.lineTo(-4,14);c.lineTo(4,16);c.closePath();c.fill();
      c.beginPath();c.moveTo(24,14);c.lineTo(38,8);c.lineTo(36,14);c.lineTo(28,16);c.closePath();c.fill();
      // Bottom wings
      c.fillStyle='#fff5cc';
      c.beginPath();c.moveTo(8,18);c.lineTo(-2,18);c.lineTo(0,24);c.lineTo(6,20);c.closePath();c.fill();
      c.beginPath();c.moveTo(24,18);c.lineTo(34,18);c.lineTo(32,24);c.lineTo(26,20);c.closePath();c.fill();
    },
    right:(c)=>{c.fillStyle='#FFD700';c.fillRect(26,4,2,18);c.fillStyle='#fff';c.fillRect(24,2,6,4);
      c.fillStyle='#FFD700';c.fillRect(25,3,4,2)},
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
    // Pre-generate preview sprites for all skins (down_0 only for shop display)
    for (const [id, skin] of Object.entries(SKIN_DEFS)) {
      genSprite('skinpreview_' + id, 32, 32, (c) => {
        drawHumanoid(c, 'down', 0, skin.skin || '#f4c99a', {
          bodyColor: skin.body || '#888',
          armorColor: skin.armor || '#888',
          legsColor: skin.legs || '#555',
          headExtra: skin.head || null,
          rightHand: skin.right || null,
          leftHand: skin.left || null,
          bodyExtra: skin.bodyExtra || null
        });
      });
    }
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
    const basePrefixes = ['knight','mage','ranger','priest'];
    const advPrefixes = ['paladin','darknight','archmage','chronomancer','sniper','beastlord','archbishop','necromancer'];
    const dirs = ['down','up','left','right'];

    for (const prefix of [...basePrefixes, ...advPrefixes]) {
      for (const dir of dirs) {
        for (let f = 0; f < 3; f++) {
          const baseKey = prefix + '_' + dir + '_' + f;
          if (!spriteCache[baseKey]) continue;
          const key = 'skin_' + skinId + '_' + baseKey;
          if (spriteCache[key]) continue;

          genSprite(key, 32, 32, (c) => {
            drawHumanoid(c, dir, f, skin.skin || '#f4c99a', {
              bodyColor: skin.body || '#888',
              armorColor: skin.armor || '#888',
              legsColor: skin.legs || '#555',
              headExtra: skin.head || null,
              rightHand: skin.right || null,
              leftHand: skin.left || null,
              bodyExtra: skin.bodyExtra || null
            });
          });
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

      // Character sprite (use pre-generated preview)
      const baseSpr = spriteCache['skinpreview_' + id];
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

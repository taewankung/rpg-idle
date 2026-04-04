// ============================================================
// CLASS CHANGE — Advanced class system, quests, sprites
// ============================================================
let showClassChange = false;

const classChangeSystem = {
  get panelOpen() { return showClassChange; },
  set panelOpen(v) { showClassChange = v; },
  changed: false,
  advancedClass: null,
  questComplete: false,
  questType: null,
  confirmChoice: null, // set to advanced class name when confirming

  // --- Quest state ---
  quest: {
    active: false,
    type: null,       // 'knight','mage','ranger','priest'
    timer: 0,
    maxTime: 0,
    progress: 0,
    goal: 0,
    failed: false,
    complete: false,
    // Quest arena entities
    arenaMonsters: [],
    arenaNPCs: [],
    savedPos: null,
    noHitTaken: true,
    totalDmg: 0
  },

  // --- ADVANCED CLASS DEFINITIONS ---
  advancedClasses: {
    Knight: [
      {
        name: 'Paladin', prefix: 'paladin', color: '#f0e68c',
        desc: 'Holy Knight. Divine protector with healing abilities.',
        statMod: { hp: 1.2, def: 1.15 },
        lifesteal: 0,
        skills: [
          { name: 'Holy Strike', key: 'Q', dmgPct: 1.8, cd: 4, range: TILE * 2, heal: 0, healPct: 0.10 },
          { name: 'Divine Shield', key: 'W', dmgPct: 0, cd: 15, range: 0, buff: { type: 'def', pct: 0.5, dur: 8 } },
          null, // keep slot 2 (Cleave / War Cry)
          { name: 'Party Blessing', key: 'R', dmgPct: 0, cd: 30, range: TILE * 5, aoe: true, aoeR: TILE * 5, heal: 0.20, partyHeal: true, reqLv: 20 }
        ]
      },
      {
        name: 'Dark Knight', prefix: 'darknight', color: '#cc3333',
        desc: 'Berserker. Devastating attacks with lifesteal.',
        statMod: { atk: 1.3, crit: 0.10 },
        lifesteal: 0.05,
        skills: [
          { name: 'Dark Slash', key: 'Q', dmgPct: 2.5, cd: 4, range: TILE * 3, aoe: true, aoeR: TILE * 2 },
          { name: 'Blood Rage', key: 'W', dmgPct: 0, cd: 15, range: 0, buff: { type: 'berserk', atkPct: 0.6, defPct: -0.3, dur: 10 } },
          null, // keep slot 2
          { name: 'Soul Drain', key: 'R', dmgPct: 2.0, cd: 20, range: TILE * 2, healPct: 0.30, reqLv: 20 }
        ]
      }
    ],
    Mage: [
      {
        name: 'Archmage', prefix: 'archmage', color: '#ff6600',
        desc: 'Pyromancer. Enhanced fire AoE devastation.',
        statMod: { atk: 1.25 },
        lifesteal: 0,
        skills: [
          { name: 'Inferno', key: 'Q', dmgPct: 2.0, cd: 3, range: TILE * 4, aoe: true, aoeR: TILE * 3 },
          { name: 'Flame Shield', key: 'W', dmgPct: 0, cd: 18, range: 0, buff: { type: 'def', pct: 0.4, dur: 8 } },
          null, // keep slot 2 (Blizzard / Mana Shield)
          { name: 'Meteor Storm', key: 'R', dmgPct: 3.0, cd: 35, range: TILE * 6, aoe: true, aoeR: TILE * 3, hits: 3, reqLv: 20 }
        ]
      },
      {
        name: 'Chronomancer', prefix: 'chronomancer', color: '#7799ff',
        desc: 'Frost/Time mage. Speed and crowd control master.',
        statMod: { spd: 1.2 },
        lifesteal: 0,
        skills: [
          { name: 'Time Bolt', key: 'Q', dmgPct: 1.5, cd: 3, range: TILE * 5, slow: true },
          { name: 'Time Warp', key: 'W', dmgPct: 0, cd: 12, range: 0, buff: { type: 'evasion', dur: 6, spdPct: 0.8 } },
          null, // keep slot 2 (heal / Mana Shield)
          { name: 'Time Stop', key: 'R', dmgPct: 0, cd: 40, range: TILE * 4, aoe: true, aoeR: TILE * 4, slow: true, reqLv: 20 }
        ]
      }
    ],
    Ranger: [
      {
        name: 'Sniper', prefix: 'sniper', color: '#88cc44',
        desc: 'Sharpshooter. Extreme range and critical strikes.',
        statMod: { crit: 0.15 },
        rangeMod: 1.4,
        lifesteal: 0,
        skills: [
          { name: 'Headshot', key: 'Q', dmgPct: 3.0, cd: 3, range: TILE * 6 },
          { name: 'Camouflage', key: 'W', dmgPct: 0, cd: 12, range: 0, buff: { type: 'evasion', dur: 5, spdPct: 0.5 } },
          null, // keep slot 2 (Multishot / Evasion)
          { name: 'Execute', key: 'R', dmgPct: 4.0, cd: 30, range: TILE * 6, reqLv: 20 }
        ]
      },
      {
        name: 'Beast Lord', prefix: 'beastlord', color: '#cc8844',
        desc: 'Beastmaster. Summons beasts to fight alongside you.',
        statMod: { atk: 1.15, spd: 1.1 },
        lifesteal: 0,
        skills: [
          { name: 'Beast Strike', key: 'Q', dmgPct: 1.8, cd: 3, range: TILE * 4, hits: 2 },
          { name: 'Call Wolf', key: 'W', dmgPct: 0, cd: 15, range: 0, buff: { type: 'berserk', atkPct: 0.4, defPct: 0, dur: 15 } },
          null, // keep slot 2
          { name: 'Stampede', key: 'R', dmgPct: 3.0, cd: 35, range: TILE * 5, aoe: true, aoeR: TILE * 4, reqLv: 20 }
        ]
      }
    ],
    Priest: [
      {
        name: 'Archbishop', prefix: 'archbishop', color: '#ffffcc',
        desc: 'Holy healer. Superior healing and party support.',
        statMod: { hp: 1.15, mp: 1.2 },
        healMod: 2.0,
        lifesteal: 0,
        skills: [
          { name: 'Holy Light', key: 'Q', dmgPct: 1.5, cd: 3, range: TILE * 3, healPct: 0.15 },
          { name: 'Mass Heal', key: 'W', dmgPct: 0, cd: 20, range: TILE * 5, aoe: true, aoeR: TILE * 5, heal: 0.30, partyHeal: true },
          null, // keep slot 2 (Purify)
          { name: 'Resurrection', key: 'R', dmgPct: 0, cd: 60, range: TILE * 4, heal: 0.50, partyHeal: true, reqLv: 20 }
        ]
      },
      {
        name: 'Necromancer', prefix: 'necromancer', color: '#9933cc',
        desc: 'Shadow caster. Dark magic and life drain.',
        statMod: { atk: 1.3 },
        lifesteal: 0.05,
        skills: [
          { name: 'Death Bolt', key: 'Q', dmgPct: 2.2, cd: 3, range: TILE * 4, healPct: 0.05 },
          { name: 'Raise Dead', key: 'W', dmgPct: 0, cd: 20, range: 0, buff: { type: 'berserk', atkPct: 0.5, defPct: 0, dur: 20 } },
          null, // keep slot 2 (Purify)
          { name: 'Death Beam', key: 'R', dmgPct: 3.5, cd: 30, range: TILE * 6, piercing: true, aoe: true, aoeR: TILE * 2, reqLv: 20 }
        ]
      }
    ]
  },

  // --- SPRITE GENERATION ---
  generateSprites() {
    const dirs = ['down', 'up', 'left', 'right'];

    // Class Master NPC sprite (16x16 old sage)
    genSprite('classmaster', 32, 32, (c) => {
      // Shadow
      c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(16, 30, 8, 3, 0, 0, Math.PI * 2); c.fill();
      // Legs
      c.fillStyle = '#555'; c.fillRect(11, 22, 4, 9); c.fillRect(17, 22, 4, 9);
      c.fillStyle = '#333'; c.fillRect(11, 30, 4, 2); c.fillRect(17, 30, 4, 2);
      // Body - purple robes
      c.fillStyle = '#6a0dad'; c.fillRect(9, 12, 14, 12);
      c.fillStyle = '#8b5cf6'; c.fillRect(9, 12, 14, 4);
      // Arms
      c.fillStyle = '#6a0dad'; c.fillRect(5, 12, 4, 9); c.fillRect(23, 12, 4, 9);
      // Staff in right hand
      c.fillStyle = '#8B4513'; c.fillRect(26, 2, 2, 22);
      c.fillStyle = '#f1c40f'; c.beginPath(); c.arc(27, 1, 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(27, 0, 2, 0, Math.PI * 2); c.fill();
      // Head
      c.fillStyle = '#f4c99a'; c.fillRect(10, 4, 12, 10);
      // Eyes
      c.fillStyle = '#111'; c.fillRect(12, 7, 2, 2); c.fillRect(18, 7, 2, 2);
      // Beard
      c.fillStyle = '#ddd'; c.fillRect(12, 10, 8, 4);
      // Hat/hood
      c.fillStyle = '#6a0dad'; c.beginPath(); c.moveTo(16, -2); c.lineTo(23, 5); c.lineTo(9, 5); c.closePath(); c.fill();
      c.fillStyle = '#f1c40f'; c.fillRect(15, -1, 2, 2);
      // Gold trim
      c.fillStyle = '#d4a017'; c.fillRect(9, 12, 14, 1); c.fillRect(9, 23, 14, 1);
    });

    // Sign for Class Master
    genSprite('sign_classmaster', 12, 16, (c) => {
      c.fillStyle = '#8B4513'; c.fillRect(5, 6, 2, 10);
      c.fillStyle = '#a0522d'; c.fillRect(1, 1, 10, 6);
      c.fillStyle = '#8B4513'; c.strokeStyle = '#5d3a1a'; c.lineWidth = 0.5;
      c.strokeRect(1, 1, 10, 6);
      // Star icon
      c.fillStyle = '#f1c40f'; c.fillRect(5, 2, 2, 4); c.fillRect(3, 3, 6, 2);
    });

    // --- ADVANCED CLASS CHARACTER SPRITES ---
    const classSprites = {
      paladin: {
        body: '#e8e8e8', armor: '#f0e68c', legs: '#bdc3c7',
        head: (c, s, u) => {
          // White/gold helmet with halo hint
          c.fillStyle = '#e8e8e8'; c.fillRect(9, 2, 14, 7);
          c.fillStyle = '#d4d4d4'; c.fillRect(9, 7, 14, 3);
          if (!u) { c.fillStyle = '#2c3e50'; if (!s) { c.fillRect(11, 7, 4, 2); c.fillRect(17, 7, 4, 2); } else { c.fillRect(18, 7, 4, 2); } }
          // Halo
          c.strokeStyle = '#f1c40f'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(16, 1, 6, 2, 0, 0, Math.PI * 2); c.stroke();
          // Shoulder guards
          c.fillStyle = '#f0e68c'; c.fillRect(5, 11, 5, 4); c.fillRect(22, 11, 5, 4);
        },
        right: (c) => {
          // Sword
          c.fillStyle = '#bdc3c7'; c.fillRect(25, 6, 2, 14);
          c.fillStyle = '#f1c40f'; c.fillRect(23, 14, 6, 2); c.fillRect(25, 19, 2, 2);
        },
        left: (c) => {
          // Shield
          c.fillStyle = '#f0e68c'; c.fillRect(3, 12, 5, 7);
          c.fillStyle = '#d4a017'; c.fillRect(4, 14, 3, 3);
        }
      },
      darknight: {
        body: '#1a1a1a', armor: '#8b0000', legs: '#333',
        head: (c, s, u) => {
          // Black/red helmet
          c.fillStyle = '#1a1a1a'; c.fillRect(9, 2, 14, 7);
          c.fillStyle = '#333'; c.fillRect(9, 7, 14, 3);
          if (!u) { c.fillStyle = '#cc0000'; if (!s) { c.fillRect(11, 7, 4, 2); c.fillRect(17, 7, 4, 2); } else { c.fillRect(18, 7, 4, 2); } }
          // Horns
          c.fillStyle = '#8b0000'; c.beginPath(); c.moveTo(10, 4); c.lineTo(7, -2); c.lineTo(12, 3); c.fill();
          c.beginPath(); c.moveTo(22, 4); c.lineTo(25, -2); c.lineTo(20, 3); c.fill();
          c.fillStyle = '#8b0000'; c.fillRect(5, 11, 5, 4); c.fillRect(22, 11, 5, 4);
        },
        right: (c) => {
          // Greatsword
          c.fillStyle = '#555'; c.fillRect(24, 2, 3, 18);
          c.fillStyle = '#8b0000'; c.fillRect(22, 14, 7, 2);
          c.fillStyle = '#333'; c.fillRect(25, 19, 2, 4);
        }
      },
      archmage: {
        body: '#cc3300', armor: '#ff6600', legs: '#993300',
        head: (c, s, u) => {
          // Red/orange wizard hat
          c.fillStyle = '#cc3300'; c.beginPath(); c.moveTo(16, -4); c.lineTo(23, 4); c.lineTo(9, 4); c.closePath(); c.fill();
          c.fillStyle = '#993300'; c.fillRect(7, 4, 18, 3);
          // Flame tip
          c.fillStyle = '#f1c40f'; c.fillRect(14, -5, 4, 3);
          c.fillStyle = '#ff6600'; c.fillRect(15, -6, 2, 2);
        },
        right: (c) => {
          // Flame staff
          c.fillStyle = '#8B4513'; c.fillRect(26, 2, 2, 22);
          c.fillStyle = '#ff6600'; c.beginPath(); c.arc(27, 1, 4, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#f1c40f'; c.beginPath(); c.arc(27, 0, 2, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#ffff00'; c.beginPath(); c.arc(27, -1, 1, 0, Math.PI * 2); c.fill();
        }
      },
      chronomancer: {
        body: '#4466aa', armor: '#7799cc', legs: '#334477',
        head: (c, s, u) => {
          // Blue/silver hood
          c.fillStyle = '#4466aa'; c.beginPath(); c.moveTo(16, -2); c.lineTo(24, 5); c.lineTo(8, 5); c.closePath(); c.fill();
          c.fillStyle = '#7799cc'; c.fillRect(7, 5, 18, 3);
          // Silver gem
          c.fillStyle = '#ccddef'; c.fillRect(15, 0, 2, 2);
        },
        right: (c) => {
          // Hourglass staff
          c.fillStyle = '#7799cc'; c.fillRect(26, 2, 2, 22);
          c.fillStyle = '#ccddef'; c.fillRect(24, -1, 6, 2);
          c.fillStyle = '#aabbdd'; c.fillRect(25, 1, 4, 4);
          c.fillStyle = '#ccddef'; c.fillRect(24, 5, 6, 2);
          c.fillStyle = '#f1c40f'; c.fillRect(26, 2, 2, 2);
        }
      },
      sniper: {
        body: '#556b2f', armor: '#6b8e23', legs: '#8B4513',
        head: (c, s, u) => {
          // Green/brown hood
          c.fillStyle = '#556b2f'; c.fillRect(8, 2, 16, 10);
          c.fillStyle = '#6b8e23'; c.fillRect(8, 2, 3, 10); c.fillRect(21, 2, 3, 10);
          // Cloak drape
          c.fillStyle = '#556b2f'; c.fillRect(6, 12, 3, 8); c.fillRect(23, 12, 3, 8);
        },
        right: (c) => {
          // Rifle/crossbow
          c.fillStyle = '#8B4513'; c.fillRect(24, 8, 2, 14);
          c.fillStyle = '#555'; c.fillRect(23, 6, 4, 4);
          c.fillStyle = '#333'; c.fillRect(24, 4, 2, 4);
        },
        bodyExtra: (c) => {
          // Quiver
          c.fillStyle = '#8B4513'; c.fillRect(22, 10, 4, 10);
          c.fillStyle = '#f1c40f'; c.fillRect(23, 8, 1, 4); c.fillRect(25, 7, 1, 5);
        }
      },
      beastlord: {
        body: '#8B6914', armor: '#a0522d', legs: '#6b4226',
        head: (c, s, u) => {
          // Fur helm with wolf motif
          c.fillStyle = '#8B6914'; c.fillRect(8, 2, 16, 10);
          c.fillStyle = '#a0522d'; c.fillRect(8, 2, 16, 4);
          // Wolf ears
          c.fillStyle = '#6b4226'; c.beginPath(); c.moveTo(10, 4); c.lineTo(7, -2); c.lineTo(12, 3); c.fill();
          c.beginPath(); c.moveTo(22, 4); c.lineTo(25, -2); c.lineTo(20, 3); c.fill();
          // Fangs on forehead
          c.fillStyle = '#ddd'; c.fillRect(14, 2, 2, 2); c.fillRect(16, 2, 2, 2);
        },
        left: (c) => {
          // Claw weapon
          c.strokeStyle = '#ccc'; c.lineWidth = 1.5;
          c.beginPath(); c.moveTo(5, 14); c.lineTo(1, 10); c.stroke();
          c.beginPath(); c.moveTo(5, 16); c.lineTo(0, 14); c.stroke();
          c.beginPath(); c.moveTo(5, 18); c.lineTo(1, 20); c.stroke();
        },
        bodyExtra: (c) => {
          // Fur cape
          c.fillStyle = '#a0522d'; c.fillRect(9, 12, 14, 2);
          c.fillStyle = '#8B6914'; c.fillRect(10, 14, 12, 1);
        }
      },
      archbishop: {
        body: '#f0f0f0', armor: '#f1c40f', legs: '#ddd',
        head: (c, s, u) => {
          // Golden halo and white hood
          c.strokeStyle = '#f1c40f'; c.lineWidth = 2; c.beginPath(); c.ellipse(16, 2, 8, 3, 0, 0, Math.PI * 2); c.stroke();
          c.fillStyle = '#f1c40f'; c.strokeStyle = '#f1c40f'; c.lineWidth = 1; c.strokeRect(9, 11, 14, 2);
          // Wing hints
          c.fillStyle = 'rgba(255,255,200,0.5)';
          c.beginPath(); c.moveTo(6, 14); c.lineTo(0, 8); c.lineTo(4, 14); c.fill();
          c.beginPath(); c.moveTo(26, 14); c.lineTo(32, 8); c.lineTo(28, 14); c.fill();
        },
        right: (c) => {
          // Golden scepter
          c.fillStyle = '#f1c40f'; c.fillRect(26, 6, 2, 18);
          c.fillStyle = '#fff'; c.fillRect(24, 4, 6, 4);
          c.fillStyle = '#f1c40f'; c.fillRect(25, 3, 4, 2);
        }
      },
      necromancer: {
        body: '#2d1b4e', armor: '#4a2d7a', legs: '#1a0f2e',
        head: (c, s, u) => {
          // Dark purple hood
          c.fillStyle = '#2d1b4e'; c.beginPath(); c.moveTo(16, -2); c.lineTo(24, 5); c.lineTo(8, 5); c.closePath(); c.fill();
          c.fillStyle = '#4a2d7a'; c.fillRect(7, 5, 18, 3);
          // Glowing eyes
          if (!u) { c.fillStyle = '#cc44ff'; if (!s) { c.fillRect(12, 7, 2, 2); c.fillRect(18, 7, 2, 2); } else { c.fillRect(19, 7, 2, 2); } }
          c.fillStyle = '#9933cc'; c.fillRect(15, -1, 2, 2);
        },
        right: (c) => {
          // Skull staff
          c.fillStyle = '#4a2d7a'; c.fillRect(26, 4, 2, 20);
          c.fillStyle = '#ddd'; c.fillRect(24, 0, 6, 5);
          c.fillStyle = '#111'; c.fillRect(25, 1, 2, 2); c.fillRect(28, 1, 1, 2);
          c.fillStyle = '#333'; c.fillRect(25, 3, 4, 1);
          c.fillStyle = '#cc44ff'; c.beginPath(); c.arc(27, 2, 1, 0, Math.PI * 2); c.fill();
        }
      }
    };

    // Generate all 8 classes x 4 dirs x 3 frames
    for (const [cls, d] of Object.entries(classSprites)) {
      for (const dir of dirs) {
        for (let f = 0; f < 3; f++) {
          genSprite(cls + '_' + dir + '_' + f, 32, 32, (c) => {
            drawHumanoid(c, dir, f, '#f4c99a', {
              bodyColor: d.body, armorColor: d.armor, legsColor: d.legs,
              headExtra: d.head, rightHand: d.right || null,
              leftHand: d.left || null, bodyExtra: d.bodyExtra || null
            });
          });
        }
      }
    }
  },

  // --- TOWN NPC ---
  masterNPC: null,

  initTownNPC() {
    const tcx = Math.floor(MAP_W / 2), tcy = Math.floor(MAP_H / 2);
    this.masterNPC = {
      x: (tcx + 2) * TILE + TILE / 2,
      y: (tcy + 2) * TILE + TILE / 2,
      name: 'Class Master'
    };
  },

  drawMasterNPC() {
    if (game.state !== 'playing' || !this.masterNPC || dungeon.active) return;
    const npc = this.masterNPC;
    const { x: sx, y: sy } = camera.worldToScreen(npc.x, npc.y);
    if (sx < -64 || sx > canvas.width + 64 || sy < -64 || sy > canvas.height + 64) return;

    const spr = spriteCache['classmaster'];
    if (spr) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spr, sx - 16, sy - 16, 32, 32);
      ctx.restore();
    }

    const sign = spriteCache['sign_classmaster'];
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
        const hint = game.player.level >= 20 ? '[Click to Class Change]' : '[Lv.20 Required]';
        ctx.font = '9px monospace';
        ctx.strokeText(hint, sx, sy - 32);
        ctx.fillStyle = game.player.level >= 20 ? '#AADDFF' : '#FF8888';
        ctx.fillText(hint, sx, sy - 32);
      }
    }
    ctx.restore();
  },

  checkMasterClick(clickX, clickY) {
    if (game.state !== 'playing' || !game.player || !this.masterNPC || dungeon.active) return false;
    if (showClassChange) return handleClassChangeClick(clickX, clickY);

    const { x: sx, y: sy } = camera.worldToScreen(this.masterNPC.x, this.masterNPC.y);
    if (Math.hypot(clickX - sx, clickY - sy) < TILE * 1.5) {
      const dist = Math.hypot(game.player.x - this.masterNPC.x, game.player.y - this.masterNPC.y);
      if (dist < TILE * 3) {
        showClassChange = true;
        this.confirmChoice = null;
        return true;
      }
    }
    return false;
  },

  // --- SPRITE PREFIX HELPER ---
  getSpritePrefix(entity) {
    if (entity._advancedClass) {
      const baseClass = entity._baseClassName || entity.className;
      const choices = this.advancedClasses[baseClass];
      if (choices) {
        const adv = choices.find(a => a.name === entity._advancedClass);
        if (adv) return adv.prefix;
      }
    }
    return (entity.className || 'knight').toLowerCase();
  },

  // --- CLASS CHANGE QUESTS ---
  getQuestDesc(baseClass) {
    const descs = {
      Knight: { text: 'Survive 3 minutes vs endless monsters', goal: 180 },
      Mage: { text: 'Deal 10000 damage in 1 minute', goal: 10000 },
      Ranger: { text: 'Kill 20 monsters without taking damage', goal: 20 },
      Priest: { text: 'Keep 3 NPCs alive for 2 minutes', goal: 120 }
    };
    return descs[baseClass] || descs.Knight;
  },

  startQuest(questType) {
    const p = game.player;
    if (!p || p.level < 20) return;
    const q = this.quest;
    q.active = true;
    q.type = questType;
    q.failed = false;
    q.complete = false;
    q.totalDmg = 0;
    q.noHitTaken = true;
    q.savedPos = { x: p.x, y: p.y };
    q.arenaMonsters = [];
    q.arenaNPCs = [];

    // Move player to arena area (offset from town)
    const arenaX = Math.floor(MAP_W / 2) * TILE + TILE / 2;
    const arenaY = Math.floor(MAP_H / 2) * TILE + TILE / 2;
    p.x = arenaX;
    p.y = arenaY;
    p.hp = p.maxHp;
    p.mp = p.maxMp;

    showClassChange = false;

    switch (questType) {
      case 'Knight':
        q.maxTime = 180;
        q.timer = 0;
        q.goal = 180;
        q.progress = 0;
        this._spawnQuestMonsters(8);
        break;
      case 'Mage':
        q.maxTime = 60;
        q.timer = 0;
        q.goal = 10000;
        q.progress = 0;
        this._spawnQuestMonsters(10);
        break;
      case 'Ranger':
        q.maxTime = 300; // generous time limit
        q.timer = 0;
        q.goal = 20;
        q.progress = 0;
        q.noHitTaken = true;
        this._spawnQuestMonsters(6);
        break;
      case 'Priest':
        q.maxTime = 120;
        q.timer = 0;
        q.goal = 120;
        q.progress = 0;
        this._spawnQuestNPCs(3);
        this._spawnQuestMonsters(5);
        break;
    }

    addLog('Class Change Quest started!', '#FFD700');
    addNotification('Quest: ' + this.getQuestDesc(questType).text, '#FFD700');
  },

  _spawnQuestMonsters(count) {
    const q = this.quest;
    const px = game.player.x, py = game.player.y;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const dist = TILE * ri(4, 8);
      const mx = px + Math.cos(angle) * dist;
      const my = py + Math.sin(angle) * dist;
      const types = ['goblin', 'wolf', 'skeleton'];
      const m = createMon(types[ri(0, 2)], mx, my);
      m._questMon = true;
      q.arenaMonsters.push(m);
    }
  },

  _spawnQuestNPCs(count) {
    const q = this.quest;
    const px = game.player.x, py = game.player.y;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.PI / 6;
      const dist = TILE * 3;
      const npc = createPlayer('Knight', 'Ally ' + (i + 1));
      npc.x = px + Math.cos(angle) * dist;
      npc.y = py + Math.sin(angle) * dist;
      npc.hp = Math.round(npc.maxHp * 0.5); // start injured
      npc.isNPC = true;
      npc.entityType = 'npc';
      npc._questNPC = true;
      q.arenaNPCs.push(npc);
    }
  },

  updateQuest(dt) {
    const q = this.quest;
    if (!q.active || q.complete || q.failed) return;
    const p = game.player;
    if (!p || p.isDead) { this._failQuest('You died!'); return; }

    q.timer += dt;

    // Respawn dead quest monsters periodically
    for (const m of q.arenaMonsters) {
      if (m.isDead) {
        m.respawnTimer -= dt;
        if (m.respawnTimer <= 0) {
          const types = ['goblin', 'wolf', 'skeleton'];
          const d = MON_DATA[types[ri(0, 2)]];
          m.hp = ri(d.hpR[0], d.hpR[1]);
          m.maxHp = m.hp;
          m.isDead = false;
          m.x = p.x + (Math.random() - 0.5) * TILE * 12;
          m.y = p.y + (Math.random() - 0.5) * TILE * 12;
        }
      } else {
        updateMonster(m, dt);
      }
    }

    // Update quest NPCs if priest quest
    for (const npc of q.arenaNPCs) {
      if (!npc.isDead) {
        // Slow regen for quest NPCs
        npc.hp = Math.min(npc.maxHp, npc.hp + npc.maxHp * 0.01 * dt);
      }
    }

    switch (q.type) {
      case 'Knight':
        q.progress = Math.floor(q.timer);
        if (q.timer >= q.maxTime) this._completeQuest();
        break;
      case 'Mage':
        // Track damage via hook (totalDmg updated externally)
        q.progress = q.totalDmg;
        if (q.totalDmg >= q.goal) this._completeQuest();
        if (q.timer >= q.maxTime) this._failQuest('Time\'s up! Damage: ' + q.totalDmg + '/' + q.goal);
        break;
      case 'Ranger':
        // Count killed quest monsters
        q.progress = q.arenaMonsters.filter(m => m.isDead && m._counted).length;
        for (const m of q.arenaMonsters) {
          if (m.isDead && !m._counted) { m._counted = true; q.progress++; }
        }
        if (!q.noHitTaken) this._failQuest('You took damage!');
        if (q.progress >= q.goal) this._completeQuest();
        if (q.timer >= q.maxTime) this._failQuest('Time\'s up!');
        break;
      case 'Priest':
        // Check if all NPCs still alive
        const allAlive = q.arenaNPCs.every(n => !n.isDead);
        if (!allAlive) this._failQuest('An ally died!');
        q.progress = Math.floor(q.timer);
        if (q.timer >= q.maxTime) this._completeQuest();
        break;
    }
  },

  _completeQuest() {
    const q = this.quest;
    q.complete = true;
    q.active = false;
    this.questComplete = true;
    // Return player to saved position
    if (q.savedPos) { game.player.x = q.savedPos.x; game.player.y = q.savedPos.y; }
    q.arenaMonsters = [];
    q.arenaNPCs = [];
    addNotification('Quest Complete! Choose your advanced class!', '#44FF44');
    addLog('Class Change Quest complete!', '#FFD700');
    sfx.victoryFanfare();
    screenShake(6, 0.3);
  },

  _failQuest(reason) {
    const q = this.quest;
    q.failed = true;
    q.active = false;
    if (q.savedPos) { game.player.x = q.savedPos.x; game.player.y = q.savedPos.y; }
    game.player.hp = Math.max(1, Math.round(game.player.maxHp * 0.5));
    q.arenaMonsters = [];
    q.arenaNPCs = [];
    addNotification('Quest Failed: ' + reason, '#FF4444');
    addLog('Class Change Quest failed: ' + reason, '#FF4444');
  },

  // Called from combat when player takes damage during quest
  onPlayerHitDuringQuest() {
    if (this.quest.active && this.quest.type === 'Ranger') {
      this.quest.noHitTaken = false;
    }
  },

  // Called from combat when player deals damage during quest
  onDamageDealtDuringQuest(dmg) {
    if (this.quest.active && this.quest.type === 'Mage') {
      this.quest.totalDmg += dmg;
    }
  },

  // --- CLASS CHANGE EXECUTION ---
  changeClass(advancedClassName) {
    const p = game.player;
    if (!p || p.level < 20 || !this.questComplete) return false;

    const baseClass = p.className;
    const choices = this.advancedClasses[baseClass];
    if (!choices) return false;

    const adv = choices.find(a => a.name === advancedClassName);
    if (!adv) return false;

    // Apply stat mods
    if (adv.statMod.hp) { p.maxHp = Math.round(p.maxHp * adv.statMod.hp); p.hp = p.maxHp; }
    if (adv.statMod.mp) { p.maxMp = Math.round(p.maxMp * adv.statMod.mp); p.mp = p.maxMp; }
    if (adv.statMod.atk) p.atk = Math.round(p.atk * adv.statMod.atk);
    if (adv.statMod.def) p.def = Math.round(p.def * adv.statMod.def);
    if (adv.statMod.spd) p.spd = parseFloat((p.spd * adv.statMod.spd).toFixed(2));
    if (adv.statMod.crit) p.crit = parseFloat((p.crit + adv.statMod.crit).toFixed(2));

    // Apply range mod
    if (adv.rangeMod) p.attackRange = Math.round(p.attackRange * adv.rangeMod);

    // Replace skills
    const baseSkills = CLASS_DATA[baseClass].skills;
    for (let i = 0; i < adv.skills.length; i++) {
      if (adv.skills[i] !== null) {
        p.skills[i] = { ...adv.skills[i], cdTimer: 0 };
      }
    }
    // Add slot 3 if it doesn't exist
    while (p.skills.length < 4) {
      p.skills.push({ name: 'None', cd: 999, cdTimer: 0, dmgPct: 0, range: 0 });
    }

    // Store advanced class info
    p._advancedClass = advancedClassName;
    p._baseClassName = baseClass;
    p.title = p.name + ' the ' + advancedClassName;

    // Mark as changed
    this.changed = true;
    this.advancedClass = advancedClassName;
    this.confirmChoice = null;
    showClassChange = false;

    // Transformation effects
    addEffect(p.x, p.y, 'levelup', 2.0);
    addEffect(p.x, p.y, 'buff', 1.5);
    screenShake(10, 0.5);
    sfx.victoryFanfare();
    addNotification('CLASS CHANGE! ' + p.name + ' became ' + advancedClassName + '!', adv.color);
    addLog(p.name + ' class changed to ' + advancedClassName + '!', '#FFD700');

    saveGame();
    return true;
  },

  // --- NPC CLASS CHANGE ---
  checkNPCClassChange(npc) {
    if (!npc || npc.level < 20 || npc._advancedClass) return;
    const baseClass = npc.className;
    const choices = this.advancedClasses[baseClass];
    if (!choices) return;

    // Random pick
    const adv = choices[ri(0, 1)];
    if (!adv) return;

    // Apply stat mods
    if (adv.statMod.hp) { npc.maxHp = Math.round(npc.maxHp * adv.statMod.hp); npc.hp = npc.maxHp; }
    if (adv.statMod.mp) { npc.maxMp = Math.round(npc.maxMp * adv.statMod.mp); npc.mp = npc.maxMp; }
    if (adv.statMod.atk) npc.atk = Math.round(npc.atk * adv.statMod.atk);
    if (adv.statMod.def) npc.def = Math.round(npc.def * adv.statMod.def);
    if (adv.statMod.spd) npc.spd = parseFloat((npc.spd * adv.statMod.spd).toFixed(2));
    if (adv.statMod.crit) npc.crit = parseFloat((npc.crit + adv.statMod.crit).toFixed(2));

    // Replace skills
    for (let i = 0; i < adv.skills.length; i++) {
      if (adv.skills[i] !== null) {
        npc.skills[i] = { ...adv.skills[i], cdTimer: 0 };
      }
    }
    while (npc.skills.length < 4) {
      npc.skills.push({ name: 'None', cd: 999, cdTimer: 0, dmgPct: 0, range: 0 });
    }

    npc._advancedClass = adv.name;
    npc._baseClassName = baseClass;

    addNotification(npc.name + ' became a ' + adv.name + '!', adv.color);
    addLog(npc.name + ' class changed to ' + adv.name + '!', '#FFD700');
  },

  // --- SAVE / LOAD ---
  save() {
    return {
      changed: this.changed,
      advancedClass: this.advancedClass,
      questComplete: this.questComplete,
      questType: this.questType
    };
  },

  load(data) {
    if (!data) return;
    this.changed = data.changed || false;
    this.advancedClass = data.advancedClass || null;
    this.questComplete = data.questComplete || false;
    this.questType = data.questType || null;

    // Reapply if player has class changed
    if (this.changed && this.advancedClass && game.player) {
      const p = game.player;
      const baseClass = p.className;
      // Find which base class this advanced class belongs to
      for (const [base, choices] of Object.entries(this.advancedClasses)) {
        const adv = choices.find(a => a.name === this.advancedClass);
        if (adv) {
          p._advancedClass = this.advancedClass;
          p._baseClassName = base;
          p.title = p.name + ' the ' + this.advancedClass;
          // Restore skills (stats already saved/loaded directly)
          for (let i = 0; i < adv.skills.length; i++) {
            if (adv.skills[i] !== null) {
              p.skills[i] = { ...adv.skills[i], cdTimer: 0 };
            }
          }
          while (p.skills.length < 4) {
            p.skills.push({ name: 'None', cd: 999, cdTimer: 0, dmgPct: 0, range: 0 });
          }
          break;
        }
      }
    }
  }
};

// ============================================================
// DRAW CLASS CHANGE PANEL
// ============================================================
function drawClassChangePanel() {
  if (!showClassChange || !game.player) return;
  const p = game.player;
  const W = canvas.width, H = canvas.height;
  const pw = 420, ph = 450;
  const px = (W - pw) / 2, py = (H - ph) / 2;

  // Dark overlay
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);

  // Panel background
  ctx.fillStyle = 'rgba(10,10,30,0.95)';
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.fill();
  ctx.strokeStyle = '#8855aa';
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.stroke();

  // Title
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('Class Master', px + pw / 2, py + 28);

  // X close button
  const closeX = px + pw - 28, closeY = py + 8;
  ctx.fillStyle = 'rgba(180,40,40,0.8)';
  roundRect(ctx, closeX, closeY, 20, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('X', closeX + 10, closeY + 15);

  // --- Confirmation dialog ---
  if (classChangeSystem.confirmChoice) {
    _drawConfirmDialog(px, py, pw, ph);
    ctx.restore();
    return;
  }

  // --- Level check ---
  if (p.level < 20) {
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#FF8888';
    ctx.textAlign = 'center';
    ctx.fillText('You must be Level 20 to class change.', px + pw / 2, py + 100);
    ctx.fillStyle = '#aaa';
    ctx.font = '12px sans-serif';
    ctx.fillText('Current Level: ' + p.level, px + pw / 2, py + 130);
    ctx.fillText('Return when you are stronger!', px + pw / 2, py + 160);
    ctx.restore();
    return;
  }

  // --- Already class changed ---
  if (classChangeSystem.changed) {
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#88FF88';
    ctx.textAlign = 'center';
    ctx.fillText('Advanced Class: ' + classChangeSystem.advancedClass, px + pw / 2, py + 80);

    // Draw sprite preview
    const prefix = classChangeSystem.getSpritePrefix(p);
    const sprKey = prefix + '_down_' + (Math.floor(Date.now() / 300) % 3);
    const spr = spriteCache[sprKey];
    if (spr) { ctx.imageSmoothingEnabled = false; ctx.drawImage(spr, px + pw / 2 - 32, py + 100, 64, 64); }

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#ccc';
    ctx.fillText('Your class change is complete!', px + pw / 2, py + 190);
    ctx.restore();
    return;
  }

  const baseClass = p.className;
  const choices = classChangeSystem.advancedClasses[baseClass];
  if (!choices) { ctx.restore(); return; }

  // --- Quest requirement ---
  const questDesc = classChangeSystem.getQuestDesc(baseClass);
  const qStatus = classChangeSystem.questComplete ? 'Complete' : classChangeSystem.quest.active ? 'In Progress' : 'Not Started';
  const qColor = classChangeSystem.questComplete ? '#44FF44' : classChangeSystem.quest.active ? '#FFAA44' : '#888';

  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ddd';
  ctx.fillText('Trial: ' + questDesc.text, px + pw / 2, py + 50);
  ctx.fillStyle = qColor;
  ctx.font = '10px sans-serif';
  ctx.fillText('Status: ' + qStatus, px + pw / 2, py + 66);

  // Start Quest button (if not complete and not active)
  if (!classChangeSystem.questComplete && !classChangeSystem.quest.active) {
    const qbx = px + pw / 2 - 50, qby = py + 74;
    ctx.fillStyle = 'rgba(20,100,120,0.9)';
    roundRect(ctx, qbx, qby, 100, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Start Quest', qbx + 50, qby + 16);
  }

  // --- Two class cards ---
  const cardW = 185, cardH = 310;
  const cardGap = 10;
  const startX = px + (pw - cardW * 2 - cardGap) / 2;
  const cardY = py + 105;

  for (let i = 0; i < 2; i++) {
    const adv = choices[i];
    const cx2 = startX + i * (cardW + cardGap);

    // Card hover check
    const hovered = mouseX >= cx2 && mouseX <= cx2 + cardW && mouseY >= cardY && mouseY <= cardY + cardH;

    // Card bg
    const cg = ctx.createLinearGradient(cx2, cardY, cx2, cardY + cardH);
    cg.addColorStop(0, hovered ? '#2a2a4a' : '#1a1a3a');
    cg.addColorStop(1, '#0f0f1f');
    ctx.fillStyle = cg;
    roundRect(ctx, cx2, cardY, cardW, cardH, 8);
    ctx.fill();
    ctx.strokeStyle = hovered ? adv.color : '#444466';
    ctx.lineWidth = hovered ? 2 : 1;
    roundRect(ctx, cx2, cardY, cardW, cardH, 8);
    ctx.stroke();

    // Sprite preview
    const sprKey = adv.prefix + '_down_' + (Math.floor(Date.now() / 300) % 3);
    const spr = spriteCache[sprKey];
    if (spr) { ctx.imageSmoothingEnabled = false; ctx.drawImage(spr, cx2 + cardW / 2 - 24, cardY + 8, 48, 48); ctx.imageSmoothingEnabled = true; }

    // Class name
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = adv.color;
    ctx.fillText(adv.name, cx2 + cardW / 2, cardY + 70);

    // Description
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#bbb';
    const words = adv.desc.split(' ');
    let line = '', ly = cardY + 86;
    for (const w of words) {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > cardW - 16) {
        ctx.fillText(line.trim(), cx2 + cardW / 2, ly);
        line = w + ' '; ly += 12;
      } else { line = test; }
    }
    if (line.trim()) ctx.fillText(line.trim(), cx2 + cardW / 2, ly);

    // Stat bonuses
    ly += 16;
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#88CCFF';
    ctx.textAlign = 'left';
    const statLabels = [];
    if (adv.statMod.hp) statLabels.push('HP +' + Math.round((adv.statMod.hp - 1) * 100) + '%');
    if (adv.statMod.mp) statLabels.push('MP +' + Math.round((adv.statMod.mp - 1) * 100) + '%');
    if (adv.statMod.atk) statLabels.push('ATK +' + Math.round((adv.statMod.atk - 1) * 100) + '%');
    if (adv.statMod.def) statLabels.push('DEF +' + Math.round((adv.statMod.def - 1) * 100) + '%');
    if (adv.statMod.spd) statLabels.push('SPD +' + Math.round((adv.statMod.spd - 1) * 100) + '%');
    if (adv.statMod.crit) statLabels.push('CRIT +' + Math.round(adv.statMod.crit * 100) + '%');
    if (adv.lifesteal) statLabels.push('Lifesteal ' + Math.round(adv.lifesteal * 100) + '%');
    if (adv.rangeMod) statLabels.push('Range +' + Math.round((adv.rangeMod - 1) * 100) + '%');
    if (adv.healMod) statLabels.push('Heal x' + adv.healMod);
    for (const sl of statLabels) {
      ctx.fillText(sl, cx2 + 10, ly);
      ly += 11;
    }

    // Skills list
    ly += 6;
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('Skills:', cx2 + 10, ly);
    ly += 12;
    ctx.font = '8px monospace';
    ctx.fillStyle = '#ccc';
    for (const sk of adv.skills) {
      if (sk === null) continue;
      const skLine = '[' + sk.key + '] ' + sk.name;
      ctx.fillText(skLine, cx2 + 10, ly);
      ly += 11;
    }

    // Choose button
    if (classChangeSystem.questComplete) {
      const bx = cx2 + cardW / 2 - 35, by = cardY + cardH - 32;
      ctx.fillStyle = hovered ? 'rgba(40,140,60,0.95)' : 'rgba(30,100,40,0.85)';
      roundRect(ctx, bx, by, 70, 24, 6);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Choose', bx + 35, by + 17);
    }
  }

  ctx.restore();
}

// --- Confirmation dialog overlay ---
function _drawConfirmDialog(px, py, pw, ph) {
  const dlgW = 280, dlgH = 100;
  const dlgX = px + (pw - dlgW) / 2, dlgY = py + (ph - dlgH) / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(px, py, pw, ph);

  ctx.fillStyle = 'rgba(20,20,50,0.98)';
  roundRect(ctx, dlgX, dlgY, dlgW, dlgH, 10);
  ctx.fill();
  ctx.strokeStyle = '#f1c40f';
  ctx.lineWidth = 2;
  roundRect(ctx, dlgX, dlgY, dlgW, dlgH, 10);
  ctx.stroke();

  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('This choice is permanent. Proceed?', dlgX + dlgW / 2, dlgY + 30);
  ctx.fillStyle = '#ccc';
  ctx.font = '11px sans-serif';
  ctx.fillText('Become ' + classChangeSystem.confirmChoice + '?', dlgX + dlgW / 2, dlgY + 48);

  // Yes button
  const ybx = dlgX + dlgW / 2 - 70, yby = dlgY + dlgH - 34;
  ctx.fillStyle = 'rgba(40,140,60,0.9)';
  roundRect(ctx, ybx, yby, 60, 24, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('Yes', ybx + 30, yby + 17);

  // No button
  const nbx = dlgX + dlgW / 2 + 10, nby = dlgY + dlgH - 34;
  ctx.fillStyle = 'rgba(140,40,40,0.9)';
  roundRect(ctx, nbx, nby, 60, 24, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillText('No', nbx + 30, nby + 17);
}

// --- Quest progress HUD ---
function drawQuestProgressHUD() {
  const q = classChangeSystem.quest;
  if (!q.active) return;

  const W = canvas.width;
  const hudW = 250, hudH = 50;
  const hx = (W - hudW) / 2, hy = 10;

  ctx.save();
  ctx.fillStyle = 'rgba(10,10,30,0.9)';
  roundRect(ctx, hx, hy, hudW, hudH, 8);
  ctx.fill();
  ctx.strokeStyle = '#f1c40f';
  ctx.lineWidth = 1;
  roundRect(ctx, hx, hy, hudW, hudH, 8);
  ctx.stroke();

  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('Class Change Trial', hx + hudW / 2, hy + 16);

  // Progress bar
  const barX = hx + 10, barY = hy + 24, barW = hudW - 20, barH = 8;
  ctx.fillStyle = '#222';
  ctx.fillRect(barX, barY, barW, barH);
  let pct = 0;
  let statusText = '';

  switch (q.type) {
    case 'Knight':
      pct = Math.min(1, q.timer / q.maxTime);
      statusText = 'Survive: ' + Math.floor(q.timer) + '/' + q.maxTime + 's';
      break;
    case 'Mage':
      pct = Math.min(1, q.totalDmg / q.goal);
      statusText = 'Damage: ' + q.totalDmg + '/' + q.goal + ' (' + Math.floor(q.maxTime - q.timer) + 's left)';
      break;
    case 'Ranger':
      pct = Math.min(1, q.progress / q.goal);
      statusText = 'Kills: ' + q.progress + '/' + q.goal + ' (No hit!)';
      break;
    case 'Priest':
      pct = Math.min(1, q.timer / q.maxTime);
      statusText = 'Protect: ' + Math.floor(q.timer) + '/' + q.maxTime + 's';
      break;
  }

  ctx.fillStyle = pct >= 1 ? '#44FF44' : '#f1c40f';
  ctx.fillRect(barX, barY, barW * pct, barH);

  ctx.font = '9px monospace';
  ctx.fillStyle = '#ccc';
  ctx.fillText(statusText, hx + hudW / 2, hy + 44);
  ctx.restore();
}

// ============================================================
// CLICK HANDLER
// ============================================================
function handleClassChangeClick(cx2, cy2) {
  if (!showClassChange || !game.player) return false;
  const p = game.player;
  const W = canvas.width, H = canvas.height;
  const pw = 420, ph = 450;
  const px = (W - pw) / 2, py = (H - ph) / 2;

  // Click outside panel -> close
  if (cx2 < px || cx2 > px + pw || cy2 < py || cy2 > py + ph) {
    showClassChange = false;
    classChangeSystem.confirmChoice = null;
    return true;
  }

  // X close button
  const closeX = px + pw - 28, closeY = py + 8;
  if (cx2 >= closeX && cx2 <= closeX + 20 && cy2 >= closeY && cy2 <= closeY + 20) {
    showClassChange = false;
    classChangeSystem.confirmChoice = null;
    return true;
  }

  // --- Confirmation dialog clicks ---
  if (classChangeSystem.confirmChoice) {
    const dlgW = 280, dlgH = 100;
    const dlgX = px + (pw - dlgW) / 2, dlgY = py + (ph - dlgH) / 2;

    // Yes button
    const ybx = dlgX + dlgW / 2 - 70, yby = dlgY + dlgH - 34;
    if (cx2 >= ybx && cx2 <= ybx + 60 && cy2 >= yby && cy2 <= yby + 24) {
      classChangeSystem.changeClass(classChangeSystem.confirmChoice);
      return true;
    }

    // No button
    const nbx = dlgX + dlgW / 2 + 10, nby = dlgY + dlgH - 34;
    if (cx2 >= nbx && cx2 <= nbx + 60 && cy2 >= nby && cy2 <= nby + 24) {
      classChangeSystem.confirmChoice = null;
      return true;
    }
    return true;
  }

  // Level < 20: no interactions
  if (p.level < 20) return true;

  // Already changed: no interactions
  if (classChangeSystem.changed) return true;

  // Start Quest button
  if (!classChangeSystem.questComplete && !classChangeSystem.quest.active) {
    const qbx = px + pw / 2 - 50, qby = py + 74;
    if (cx2 >= qbx && cx2 <= qbx + 100 && cy2 >= qby && cy2 <= qby + 24) {
      classChangeSystem.startQuest(p.className);
      return true;
    }
  }

  // Choose buttons on cards (only if quest complete)
  if (classChangeSystem.questComplete) {
    const baseClass = p.className;
    const choices = classChangeSystem.advancedClasses[baseClass];
    if (!choices) return true;

    const cardW = 185, cardH = 310;
    const cardGap = 10;
    const startX = px + (pw - cardW * 2 - cardGap) / 2;
    const cardY = py + 105;

    for (let i = 0; i < 2; i++) {
      const cx3 = startX + i * (cardW + cardGap);
      const bx = cx3 + cardW / 2 - 35, by = cardY + cardH - 32;
      if (cx2 >= bx && cx2 <= bx + 70 && cy2 >= by && cy2 <= by + 24) {
        classChangeSystem.confirmChoice = choices[i].name;
        return true;
      }
    }
  }

  return true;
}

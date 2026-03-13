// ============================================================
// PARTY SYSTEM — Invite, follow formation, EXP sharing, HUD
// ============================================================

// ------------------------------------------------------------
// PARTY STATE
// ------------------------------------------------------------
const partySystem = {
  members: [],          // entity refs; index 0 = player (leader)
  maxSize: 4,
  invitePending: null,  // entity currently being invited
  inviteTimer: 0,       // countdown for decline-bubble display
  expBonus: 0.10,       // 10% extra EXP per additional member
  active: false,        // true when party has >1 member

  // ---- Helpers ----
  isFull() { return this.members.length >= this.maxSize; },
  isInParty(ent) { return this.members.includes(ent); },
  memberCount() { return this.members.length; },

  // ---- Init ----
  // Call once after player is created.
  init() {
    this.members = [];
    this.invitePending = null;
    this.inviteTimer = 0;
    this.active = false;
    if (game.player) this.members.push(game.player);
  },

  // ---- Invite NPC to party ----
  invite(npc) {
    if (!npc || !game.player) return;
    if (this.isFull()) { addLog('Party is full!', '#FF8844'); return; }
    if (this.isInParty(npc)) return;

    // Must be within 3 tiles of NPC
    const dist = Math.hypot(npc.x - game.player.x, npc.y - game.player.y);
    if (dist > TILE * 3) { addLog('Too far away to invite!', '#AAAAAA'); return; }

    // 10% chance NPC declines
    if (Math.random() < 0.10) {
      npc._partyChatBubble = 'Sorry, busy!';
      npc._partyChatTimer = 2.0;
      this.invitePending = null;
      addLog(npc.name + ' declined the party invite.', '#AAAAAA');
      return;
    }

    // Accept
    this.members.push(npc);
    npc._inParty = true;
    npc._partyFollowing = true;
    npc._partyChatBubble = 'Sure, let\'s go!';
    npc._partyChatTimer = 1.5;
    npc.botState = 'partyFollow'; // override normal NPC AI state
    this.active = this.members.length > 1;
    this.invitePending = null;
    addLog(npc.name + ' joined the party!', '#44FF88');
    sfx.itemPickup();
  },

  // ---- Kick member by index (1+) ----
  kick(index) {
    if (index <= 0 || index >= this.members.length) return;
    const npc = this.members[index];
    this.members.splice(index, 1);
    if (npc) {
      npc._inParty = false;
      npc._partyFollowing = false;
      npc.botState = 'idle';
      npc._partyChatBubble = 'Fine...';
      npc._partyChatTimer = 1.5;
      addLog(npc.name + ' was kicked from the party.', '#FF8844');
    }
    this.active = this.members.length > 1;
  },

  // ---- Player leaves, disbands party ----
  leave() {
    for (let i = 1; i < this.members.length; i++) {
      const npc = this.members[i];
      if (npc) {
        npc._inParty = false;
        npc._partyFollowing = false;
        npc.botState = 'idle';
        npc._partyChatBubble = 'Bye!';
        npc._partyChatTimer = 1.5;
      }
    }
    this.members = game.player ? [game.player] : [];
    this.active = false;
    addLog('Party disbanded.', '#AAAAAA');
  },

  // ---- Reward sharing (called from killMon hook) ----
  shareRewards(gold, exp, killer) {
    if (!this.active || this.members.length < 2) {
      // No party — give all to killer
      if (killer) { killer.gold += gold; gainExp(killer, exp); }
      return;
    }
    const count = this.members.length;
    const goldShare = Math.floor(gold / count);
    const bonusMult = 1 + this.expBonus * (count - 1);
    const expShare = Math.floor(exp * bonusMult / count);

    for (const m of this.members) {
      if (m && !m.isDead) {
        m.gold = (m.gold || 0) + goldShare;
        gainExp(m, expShare);
      }
    }
    addLog(
      'Party share: +' + goldShare + 'G +' + expShare + 'XP each (' + count + ' members)',
      '#FFD700'
    );
  },

  // ---- Save/Load ----
  getSaveData() {
    return {
      memberNames: this.members.slice(1).map(m => ({ name: m.name, className: m.className, level: m.level }))
    };
  },

  loadSaveData(data) {
    if (!data || !data.memberNames) return;
    this.members = game.player ? [game.player] : [];
    for (const md of data.memberNames) {
      // Try to find existing NPC by name
      const existing = game.npcPlayers.find(n => n.name === md.name && n.className === md.className);
      if (existing && !this.isInParty(existing)) {
        existing._inParty = true;
        existing._partyFollowing = true;
        existing.botState = 'partyFollow';
        this.members.push(existing);
      }
    }
    this.active = this.members.length > 1;
  }
};

// ------------------------------------------------------------
// FORMATION OFFSETS (behind player, in world space)
// Offset relative to player: applied after rotation by dir
// ------------------------------------------------------------
// Member 1 → behind-left, Member 2 → behind, Member 3 → behind-right
const PARTY_OFFSETS = [
  null,                     // index 0 = player, no offset
  { bx: -TILE * 0.9, by: TILE * 1.0 },  // member 1: behind-left
  { bx: 0,           by: TILE * 1.3 },  // member 2: directly behind
  { bx: TILE * 0.9,  by: TILE * 1.0 }   // member 3: behind-right
];

function _getFormationTarget(leaderX, leaderY, leaderDir, slotIndex) {
  const off = PARTY_OFFSETS[slotIndex];
  if (!off) return { x: leaderX, y: leaderY };
  let bx = off.bx, by = off.by;
  // Rotate offset according to leader facing direction
  let fx, fy;
  switch (leaderDir) {
    case 'up':    fx = leaderX - bx; fy = leaderY - by; break;
    case 'left':  fx = leaderX - by; fy = leaderY + bx; break;
    case 'right': fx = leaderX + by; fy = leaderY - bx; break;
    default:      fx = leaderX + bx; fy = leaderY + by; break; // 'down'
  }
  return { x: fx, y: fy };
}

// ------------------------------------------------------------
// PARTY MEMBER UPDATE (called each frame)
// ------------------------------------------------------------
function updatePartyMembers(dt) {
  if (!partySystem.active) return;
  const p = game.player;
  if (!p || p.isDead) return;

  const activeMons = dungeon.active ? dungeon.monsters : game.monsters;

  // Remove dead/invalid members (except player)
  for (let i = partySystem.members.length - 1; i >= 1; i--) {
    const m = partySystem.members[i];
    if (!m || !game.npcPlayers.includes(m)) {
      partySystem.members.splice(i, 1);
    }
  }
  partySystem.active = partySystem.members.length > 1;
  if (!partySystem.active) return;

  for (let idx = 1; idx < partySystem.members.length; idx++) {
    const member = partySystem.members[idx];
    if (!member) continue;

    // Cooldowns
    for (const sk of member.skills) if (sk.cdTimer > 0) sk.cdTimer = Math.max(0, sk.cdTimer - dt);
    if (member.attackTimer > 0) member.attackTimer -= dt;

    // Respawn handling
    if (member.isDead) {
      member.respawnTimer -= dt;
      if (member.respawnTimer <= 0) {
        member.isDead = false;
        member.hp = Math.round(member.maxHp * 0.5);
        member.mp = Math.round(member.maxMp * 0.5);
        // Teleport to player
        member.x = p.x + rf(-TILE, TILE);
        member.y = p.y + TILE;
      }
      continue;
    }

    updateBuffs(member, dt);

    // Dungeon teleport: if player in dungeon and member is not
    if (dungeon.active) {
      const dSpawn = dungeon.spawnPos || dungeon.rooms && dungeon.rooms[0] &&
        { x: dungeon.rooms[0].cx * TILE + TILE / 2, y: dungeon.rooms[0].cy * TILE + TILE / 2 };
      if (dSpawn) {
        const memberInDungeon = dungeon.isWalkable(Math.floor(member.x / TILE), Math.floor(member.y / TILE));
        if (!memberInDungeon) {
          member.x = dSpawn.x + rf(-TILE, TILE);
          member.y = dSpawn.y + TILE * 0.5;
        }
      }
    }

    // ---- Priest: prioritize healing lowest HP party member ----
    if (member.className === 'Priest') {
      let lowestMember = null, lowestRatio = 1.0;
      for (const pm of partySystem.members) {
        if (pm && !pm.isDead) {
          const ratio = pm.hp / pm.maxHp;
          if (ratio < lowestRatio) { lowestRatio = ratio; lowestMember = pm; }
        }
      }
      if (lowestMember && lowestRatio < 0.6) {
        const healSkill = member.skills.find(s => s.name === 'Heal');
        if (healSkill && healSkill.cdTimer <= 0) {
          const healIdx = member.skills.indexOf(healSkill);
          // Temporarily override target for healing
          const healAmt = Math.round(lowestMember.maxHp * healSkill.heal);
          lowestMember.hp = Math.min(lowestMember.maxHp, lowestMember.hp + healAmt);
          healSkill.cdTimer = healSkill.cd;
          addDmg(lowestMember.x, lowestMember.y - TILE, '+' + healAmt, '#44FF44');
          addEffect(lowestMember.x, lowestMember.y, 'heal', 0.8);
          addLog(member.name + ' healed ' + lowestMember.name + ' for ' + healAmt, '#44FF44');
          sfx.spell && sfx.spell();
        }
      }
    }

    // ---- Find combat target (player's current bot target or nearest) ----
    let target = null;
    // Prefer player's current target
    if (botAI.target && botAI.isValidTarget(botAI.target)) {
      target = botAI.target;
    } else {
      // Find nearest alive monster
      let nd = Infinity;
      for (const m of activeMons) {
        if (m.isDead) continue;
        const d = Math.hypot(m.x - member.x, m.y - member.y);
        if (d < nd) { nd = d; target = m; }
      }
    }

    // ---- Auto-attack ----
    if (target && !target.isDead) {
      const distToTarget = Math.hypot(target.x - member.x, target.y - member.y);

      if (distToTarget <= member.attackRange) {
        // In range: attack
        member.state = 'combat';
        if (member.attackTimer <= 0) {
          const r = calcDamage(member, target);
          target.hp -= r.dmg;
          addDmg(target.x, target.y - TILE, r.dmg + (r.crit ? '!' : ''), r.crit ? '#FFD700' : '#CCCCCC');
          addEffect(target.x, target.y, 'hit', 0.25);
          member.attackTimer = 1 / member.spd;
          if (target.hp <= 0 && !target.isDead) {
            partySystem.shareRewards(target.goldReward, target.expReward, member);
            // Mark as dead (don't double-kill)
            target.isDead = true;
            target.respawnTimer = rf(8, 15);
            target.hp = 0;
            sfx.monDeath && sfx.monDeath();
            addLog('Killed ' + (target.type || target.name) + '! (party share)', '#FFD700');
          }
        }
        // Auto-skills on cooldown
        _partyMemberAutoSkills(member, target, activeMons, dt);

      } else if (distToTarget < TILE * 10) {
        // Chase target
        member.state = 'walking';
        member._partyChaseTimer = (member._partyChaseTimer || 0) + dt;
        if (member._partyChaseTimer > 1.5 || !member._path || member._pathIdx >= (member._path || []).length) {
          assignPath(member, target.x, target.y, 18);
          member._partyChaseTimer = 0;
        }
        followPath(member, dt);
      }
    } else {
      // No target — follow leader in formation
      _partyMemberFollowFormation(member, idx, p, dt);
    }

    // Animation
    member.animTimer = (member.animTimer || 0) + dt;
    if (member.animTimer > 0.15) {
      member.frame = (member.state !== 'idle') ? (member.frame + 1) % 3 : 0;
      member.animTimer = 0;
    }
  }

  // Update invite timer (decline bubble countdown)
  if (partySystem.inviteTimer > 0) partySystem.inviteTimer -= dt;
}

// Follow formation position
function _partyMemberFollowFormation(member, slotIndex, leader, dt) {
  const formTarget = _getFormationTarget(leader.x, leader.y, leader.dir || 'down', slotIndex);
  const dist = Math.hypot(formTarget.x - member.x, formTarget.y - member.y);

  if (dist < TILE * 0.5) {
    member.state = 'idle';
    member._path = null;
    return;
  }

  // Only repath if far enough to matter
  if (dist > TILE * 1.5) {
    member._partyFollowTimer = (member._partyFollowTimer || 0) + dt;
    if (member._partyFollowTimer > 0.8 || !member._path || member._pathIdx >= (member._path || []).length) {
      const walked = _isWalkable(Math.floor(formTarget.x / TILE), Math.floor(formTarget.y / TILE));
      if (walked) {
        assignPath(member, formTarget.x, formTarget.y, 12);
      } else {
        // Formation spot not walkable — just move direct
        moveTowardDirect(member, formTarget.x, formTarget.y, dt);
      }
      member._partyFollowTimer = 0;
    }
    followPath(member, dt);
    member.state = 'walking';
  } else {
    // Close enough: direct move
    moveTowardDirect(member, formTarget.x, formTarget.y, dt);
    member.state = 'walking';
  }
}

// Auto skill usage for party members
function _partyMemberAutoSkills(member, target, mons, dt) {
  const cls = member.className;
  const hpR = member.hp / member.maxHp;
  const nearby = mons.filter(m => !m.isDead && Math.hypot(m.x - member.x, m.y - member.y) < TILE * 5).length;

  if (cls === 'Knight') {
    if (hpR < 0.5) useSkill(member, 1);          // Iron Wall
    if (nearby >= 2) useSkill(member, 0);          // Sword Slash
    if (nearby >= 3) { useSkill(member, 2); useSkill(member, 3); } // War Cry / Berserk
  } else if (cls === 'Mage') {
    if (member.mp / member.maxMp < 0.15) return;
    if (nearby >= 3) useSkill(member, 3);          // Meteor
    if (nearby >= 2) useSkill(member, 1);          // Frost Nova
    useSkill(member, 0);                           // Fireball
    if (hpR < 0.4) useSkill(member, 2);           // Mana Shield
  } else if (cls === 'Ranger') {
    useSkill(member, 0);                           // Power Shot
    useSkill(member, 1);                           // Multi-Arrow
    if (hpR < 0.5) useSkill(member, 2);           // Evasion
    useSkill(member, 3);                           // Snipe
  } else if (cls === 'Priest') {
    if (hpR < 0.7) useSkill(member, 1);           // Heal (self)
    useSkill(member, 2);                           // Purify
    useSkill(member, 0);                           // Holy Smite
    if (nearby >= 2) useSkill(member, 3);          // Divine Judgment
  }
}

// ------------------------------------------------------------
// PARTY FRAME UI — Left side, below player HUD (y ~140)
// Each card: 150 × 35 px
// ------------------------------------------------------------
const PARTY_FRAME_X = 10;
const PARTY_FRAME_Y = 140;  // below the 10+115 player HUD
const PARTY_CARD_W = 150;
const PARTY_CARD_H = 35;
const PARTY_CARD_GAP = 4;

function drawPartyFrame() {
  if (!partySystem.active) return;
  ctx.save();

  for (let i = 0; i < partySystem.members.length; i++) {
    const m = partySystem.members[i];
    if (!m) continue;

    const cardX = PARTY_FRAME_X;
    const cardY = PARTY_FRAME_Y + i * (PARTY_CARD_H + PARTY_CARD_GAP);
    const classColor = (CLASS_DEFS[m.className] || {}).color || '#888';

    // Card background
    ctx.fillStyle = 'rgba(0,0,10,0.78)';
    roundRect(ctx, cardX, cardY, PARTY_CARD_W, PARTY_CARD_H, 5);
    ctx.fill();
    ctx.strokeStyle = m.isDead ? '#AA2222' : classColor;
    ctx.lineWidth = i === 0 ? 1.5 : 1;
    roundRect(ctx, cardX, cardY, PARTY_CARD_W, PARTY_CARD_H, 5);
    ctx.stroke();

    // Leader crown icon (index 0)
    if (i === 0) {
      ctx.fillStyle = '#FFD700';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('♛', cardX + 3, cardY + 10);
    }

    // Class color dot
    ctx.fillStyle = classColor;
    ctx.beginPath();
    ctx.arc(cardX + (i === 0 ? 16 : 8), cardY + 9, 4, 0, Math.PI * 2);
    ctx.fill();

    // Name + class
    ctx.fillStyle = m.isDead ? '#AA4444' : '#EEE';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    const nameX = cardX + (i === 0 ? 24 : 16);
    ctx.fillText(m.name.substring(0, 11), nameX, cardY + 11);
    ctx.fillStyle = '#888';
    ctx.font = '8px monospace';
    ctx.fillText('Lv.' + m.level + ' ' + (m.className || ''), nameX, cardY + 20);

    // HP bar
    const barX = cardX + 4, barY = cardY + PARTY_CARD_H - 9;
    const barW = PARTY_CARD_W - 8 - 18; // leave room for X button
    const hpRatio = Math.max(0, Math.min(1, m.hp / m.maxHp));
    ctx.fillStyle = '#330000'; ctx.fillRect(barX, barY, barW, 4);
    ctx.fillStyle = m.isDead ? '#555' : '#e74c3c';
    ctx.fillRect(barX, barY, barW * hpRatio, 4);

    // MP bar (thin, below HP)
    const mpRatio = Math.max(0, Math.min(1, m.mp / m.maxMp));
    ctx.fillStyle = '#001133'; ctx.fillRect(barX, barY + 5, barW, 3);
    ctx.fillStyle = '#3498db'; ctx.fillRect(barX, barY + 5, barW * mpRatio, 3);

    // X (kick) button — only for non-leader members
    if (i > 0) {
      const bx = cardX + PARTY_CARD_W - 16, by = cardY + PARTY_CARD_H - 14;
      ctx.fillStyle = 'rgba(160,30,30,0.85)';
      roundRect(ctx, bx, by, 12, 12, 3);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('X', bx + 6, by + 9);
    }
  }

  ctx.restore();
}

// ------------------------------------------------------------
// INVITE PROMPT — shown above NPC when player is nearby
// Also renders decline chat bubbles
// ------------------------------------------------------------
function drawInvitePrompt() {
  const p = game.player;
  if (!p || p.isDead) return;

  // Draw decline/accept bubbles on all NPCs that have them
  for (const npc of game.npcPlayers) {
    if (!npc._partyChatBubble || npc._partyChatTimer <= 0) continue;
    const { x: sx, y: sy } = camera.worldToScreen(npc.x, npc.y);
    const alpha = Math.min(1, npc._partyChatTimer);
    ctx.save();
    ctx.globalAlpha = alpha;
    const bubW = 120, bubH = 20, bubX = sx - bubW / 2, bubY = sy - TILE - 30;
    ctx.fillStyle = 'rgba(20,20,30,0.88)';
    roundRect(ctx, bubX, bubY, bubW, bubH, 5);
    ctx.fill();
    ctx.strokeStyle = '#88AACC';
    ctx.lineWidth = 1;
    roundRect(ctx, bubX, bubY, bubW, bubH, 5);
    ctx.stroke();
    ctx.fillStyle = '#EEE';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(npc._partyChatBubble, sx, bubY + 14);
    ctx.restore();
  }

  // Show invite prompt above the nearest eligible NPC
  if (partySystem.isFull()) return;
  if (dungeon.active) return; // no inviting in dungeon

  let nearest = null, nd = Infinity;
  for (const npc of game.npcPlayers) {
    if (npc.isDead || npc._inParty) continue;
    const d = Math.hypot(npc.x - p.x, npc.y - p.y);
    if (d < nd && d <= TILE * 3) { nd = d; nearest = npc; }
  }
  partySystem.invitePending = nearest;
  if (!nearest) return;

  const { x: sx, y: sy } = camera.worldToScreen(nearest.x, nearest.y);
  const label = 'Click to invite ' + nearest.name;
  const tw = ctx.measureText(label).width + 16;
  const px = sx - tw / 2, py = sy - TILE - 26;

  ctx.save();
  // Pulsing alpha
  const pulse = 0.75 + Math.sin(Date.now() / 300) * 0.25;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = 'rgba(10,30,10,0.88)';
  roundRect(ctx, px, py, tw, 20, 5);
  ctx.fill();
  ctx.strokeStyle = '#44FF88';
  ctx.lineWidth = 1;
  roundRect(ctx, px, py, tw, 20, 5);
  ctx.stroke();
  ctx.fillStyle = '#44FF88';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, sx, py + 14);
  ctx.restore();
}

// ------------------------------------------------------------
// CLICK HANDLER — returns true if click was consumed
// ------------------------------------------------------------
function handlePartyClick(clickX, clickY) {
  // 1. Check party frame card clicks
  if (partySystem.active) {
    for (let i = 0; i < partySystem.members.length; i++) {
      const cardX = PARTY_FRAME_X;
      const cardY = PARTY_FRAME_Y + i * (PARTY_CARD_H + PARTY_CARD_GAP);

      if (clickX >= cardX && clickX <= cardX + PARTY_CARD_W &&
          clickY >= cardY && clickY <= cardY + PARTY_CARD_H) {

        // X (kick) button hit?
        if (i > 0) {
          const bx = cardX + PARTY_CARD_W - 16, by = cardY + PARTY_CARD_H - 14;
          if (clickX >= bx && clickX <= bx + 12 && clickY >= by && clickY <= by + 12) {
            partySystem.kick(i);
            return true;
          }
        }

        // Left-click on member card → set as bot focus target
        const member = partySystem.members[i];
        if (member && member !== game.player) {
          // Target whatever the member is targeting (their combat partner if any)
          if (botAI.target && botAI.isValidTarget(botAI.target)) {
            // Already focused on a valid target
          }
          addLog('Focusing on ' + member.name + '\'s position.', '#AACCFF');
        }
        return true;
      }
    }
  }

  // 2. Check NPC world-click for invite
  if (!dungeon.active && !partySystem.isFull()) {
    const p = game.player;
    if (!p) return false;
    for (const npc of game.npcPlayers) {
      if (npc.isDead || npc._inParty) continue;
      const { x: sx, y: sy } = camera.worldToScreen(npc.x, npc.y);
      // Click within 20px of NPC sprite center
      if (Math.hypot(clickX - sx, clickY - sy) <= 20) {
        partySystem.invite(npc);
        return true;
      }
    }

    // 3. Click on invite prompt label (if pending)
    if (partySystem.invitePending) {
      const npc = partySystem.invitePending;
      const { x: sx, y: sy } = camera.worldToScreen(npc.x, npc.y);
      const label = 'Click to invite ' + npc.name;
      ctx.font = 'bold 10px sans-serif';
      const tw = ctx.measureText(label).width + 16;
      const px = sx - tw / 2, py = sy - TILE - 26;
      if (clickX >= px && clickX <= px + tw && clickY >= py && clickY <= py + 20) {
        partySystem.invite(npc);
        return true;
      }
    }
  }

  return false;
}

// ------------------------------------------------------------
// BOT INTEGRATION — auto-invite when idle/roaming near town
// ------------------------------------------------------------
function partyBotLogic() {
  if (!botAI.enabled) return;
  if (!game.player || game.player.isDead) return;
  if (partySystem.isFull()) return;
  if (dungeon.active) return;

  // Only auto-invite when bot is idle or roaming
  const state = botAI.state;
  if (state !== 'idle' && state !== 'roaming') return;

  const p = game.player;
  const townCX = Math.floor(MAP_W / 2) * TILE + TILE / 2;
  const townCY = Math.floor(MAP_H / 2) * TILE + TILE / 2;
  const nearTown = Math.hypot(p.x - townCX, p.y - townCY) < TILE * 8;
  if (!nearTown) return;

  // Find an invitable NPC within 3 tiles
  for (const npc of game.npcPlayers) {
    if (npc.isDead || npc._inParty) continue;
    const dist = Math.hypot(npc.x - p.x, npc.y - p.y);
    if (dist <= TILE * 3) {
      partySystem.invite(npc);
      return; // only try one per frame cycle
    }
  }
}

// ------------------------------------------------------------
// CHAT BUBBLE TIMER UPDATE (per-frame)
// ------------------------------------------------------------
function updatePartyChatBubbles(dt) {
  for (const npc of game.npcPlayers) {
    if (npc._partyChatTimer > 0) {
      npc._partyChatTimer -= dt;
      if (npc._partyChatTimer <= 0) {
        npc._partyChatBubble = null;
        npc._partyChatTimer = 0;
      }
    }
  }
}

// ------------------------------------------------------------
// INTEGRATION HELPERS
// Call these from game.js update() and render()
// ------------------------------------------------------------

// update hook: call once per frame from update()
function updatePartySystem(dt) {
  updatePartyChatBubbles(dt);
  updatePartyMembers(dt);
  if (botAI.enabled) partyBotLogic();
}

// render hook: call from render() after drawHUD()
function drawPartySystem() {
  drawPartyFrame();
  drawInvitePrompt();
}

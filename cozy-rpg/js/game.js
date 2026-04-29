/* Game state, save/load, and the idle tick loop. */

window.Game = (function () {

  const SAVE_KEY = "lantern-atlas:save:v1";
  const SETTINGS_KEY = "lantern-atlas:settings:v1";
  const TICK_MS = 1000;             // 1 logical tick per second
  const OFFLINE_CAP_HRS = 10;       // cap offline catch-up

  const state = {
    version: 1,
    seed: Date.now(),
    name: "Ember",
    className: "Warrior",
    level: 1,
    exp: 0, expNext: 50,
    hp: 40, maxHp: 40,
    mp: 12, maxMp: 12,
    atk: 8, def: 5, mag: 3, spd: 7, luk: 4,
    crit: 5, eva: 3,
    carry: 24,
    skillPoints: 0,
    skills: {},
    statBase: { atk: 8, def: 5, mag: 3, spd: 7, luk: 4, crit: 5, eva: 3, maxHp: 40, maxMp: 12 },
    cond: { energy: 8, hunger: 7, mood: 7, fatigue: 1 }, // out of 8
    gold: 120,
    rep: "Wayward",
    day: 1,
    tick: 0,
    zoneId: "meadow",
    zoneProgress: { meadow: 0 },
    zonesUnlocked: ["meadow"],
    action: "walking",
    actionTimer: 0,
    stance: "balanced",
    options: { autoPotion: true, retreat: false, music: true, sfx: true, reduceMotion: false },
    combat: null,
    pack: { "potion-sm": 3, "herb": 2 },
    equip: { weapon: "worn-sword", armor: "patched-tunic", trinket: null },
    quests: [],
    questDone: [],
    chronicle: [],            // recent events {time, text, type}
    sessionExp: 0,
    sessionGold: 0,
    sessionKills: 0,
    lastSaveAt: Date.now(),
    lastTickAt: Date.now(),
  };

  function ensureFresh() {
    state.quests = window.GameData.STARTER_QUESTS.map(q => ({
      id: q.id, progress: 0, done: false, def: q
    }));
    state.zoneProgress.meadow = 0;
    addEntry("opening", "Ember sets foot in Hearthwick Hollow with a borrowed lantern.", "level");
  }

  /* ─────────── Stats / equipment ─────────── */
  function recomputeStats() {
    const eq = state.equip;
    const base = state.statBase;
    const sums = { atk:0, def:0, mag:0, spd:0, luk:0, crit:0, eva:0, hp:0, mp:0 };
    ["weapon","armor","trinket"].forEach(slot => {
      const id = eq[slot]; if (!id) return;
      const item = window.GameData.ITEMS[id]; if (!item || !item.stats) return;
      Object.entries(item.stats).forEach(([k,v]) => {
        if (k === "hp") sums.hp += v;
        else if (k === "mp") sums.mp += v;
        else sums[k] = (sums[k] || 0) + v;
      });
    });
    state.maxHp = base.maxHp + sums.hp + state.level * 6;
    state.maxMp = base.maxMp + sums.mp + state.level * 2;
    state.atk = base.atk + sums.atk + (state.skills["power-strike"] ? Math.round(base.atk*0.15) : 0);
    state.def = base.def + sums.def + (state.skills["iron-skin"] ? 8 : 0);
    state.mag = base.mag + sums.mag;
    state.spd = base.spd + sums.spd + (state.skills["quick-shot"] ? Math.round(base.spd*0.1) : 0);
    state.luk = base.luk + sums.luk;
    state.crit = base.crit + (sums.crit||0) + (state.skills["quick-shot"] ? 3 : 0);
    state.eva  = base.eva  + (sums.eva||0);
    state.hp = Math.min(state.hp, state.maxHp);
    state.mp = Math.min(state.mp, state.maxMp);
  }

  /* ─────────── Persistence ─────────── */
  function save() {
    try {
      state.lastSaveAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      return true;
    } catch (e) { return false; }
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1) return false;
      Object.assign(state, parsed);
      return true;
    } catch (e) { return false; }
  }
  function wipe() {
    localStorage.removeItem(SAVE_KEY);
  }

  /* ─────────── Idle tick ─────────── */
  function tick() {
    state.tick++;
    state.actionTimer--;

    // condition decay
    if (state.tick % 30 === 0) {
      state.cond.energy = Math.max(0, state.cond.energy - 1);
      state.cond.hunger = Math.max(0, state.cond.hunger - 1);
      if (state.cond.fatigue < 8) state.cond.fatigue++;
      if (state.skills["lantern-rest"]) state.cond.mood = Math.min(8, state.cond.mood + 1);
    }

    // day clock
    if (state.tick % 600 === 0) {
      state.day++;
      addEntry("dawn", `Dawn breaks over Hearthwick. Day ${state.day} begins.`, "level");
    }

    if (!state.combat) {
      if (state.action === "walking") {
        // chance to encounter monster
        if (state.actionTimer <= 0) {
          // either walk done with no encounter (loot/herb pickup) or fight
          const zone = currentZone();
          const encounterRoll = Math.random();
          if (encounterRoll < 0.62) {
            startCombat(pickMonster(zone));
          } else if (encounterRoll < 0.86) {
            gatherMaterial(zone);
            state.action = "walking";
            state.actionTimer = 4 + Math.floor(Math.random()*4);
          } else if (encounterRoll < 0.93 && state.cond.energy < 3) {
            state.action = "resting";
            state.actionTimer = 8;
            addEntry("rest", "Ember rests by a small fire.", "");
          } else {
            // brief idle stroll
            state.actionTimer = 4 + Math.floor(Math.random()*4);
          }
          updateZoneProgress(zone);
        }
      } else if (state.action === "resting") {
        if (state.actionTimer <= 0) {
          state.cond.energy = Math.min(8, state.cond.energy + 4);
          state.cond.fatigue = Math.max(0, state.cond.fatigue - 4);
          state.hp = Math.min(state.maxHp, state.hp + Math.floor(state.maxHp * 0.4));
          state.mp = Math.min(state.maxMp, state.mp + Math.floor(state.maxMp * 0.4));
          state.action = "walking";
          state.actionTimer = 4;
          addEntry("rest", "Ember rises from the camp, lantern bright again.", "");
        }
      } else if (state.action === "looting") {
        if (state.actionTimer <= 0) {
          state.action = "walking";
          state.actionTimer = 3;
        }
      } else if (state.action === "returning") {
        if (state.actionTimer <= 0) {
          state.action = "walking";
          state.actionTimer = 6;
        }
      }
    } else {
      runCombatTick();
    }

    // auto potion
    if (state.options.autoPotion && state.hp / state.maxHp < 0.3 && state.pack["potion-sm"] > 0) {
      usePotion("potion-sm");
    }
    // retreat
    if (state.options.retreat && state.combat && state.hp / state.maxHp < 0.2) {
      retreatFromCombat();
    }

    // autosave each 30 ticks
    if (state.tick % 30 === 0) save();
  }

  function currentZone() {
    return window.GameData.ZONES.find(z => z.id === state.zoneId) || window.GameData.ZONES[0];
  }

  function pickMonster(zone) {
    if (zone.boss && Math.random() < 0.05 && (state.zoneProgress[zone.id]||0) > zone.progressGoal*0.6) return zone.boss;
    return zone.monsters[Math.floor(Math.random() * zone.monsters.length)];
  }

  /* ─────────── Combat ─────────── */
  function startCombat(monsterId) {
    const m = window.GameData.MONSTERS[monsterId];
    if (!m) return;
    const lvScale = 1 + (currentZone().lvMin - 1) * 0.18;
    state.combat = {
      monsterId, name: m.name,
      hp: Math.round(m.hp * lvScale),
      maxHp: Math.round(m.hp * lvScale),
      atk: Math.round(m.atk * lvScale),
      def: m.def,
      exp: Math.round(m.exp * lvScale),
      gold: Math.round(m.gold * lvScale),
      drops: m.drop || [],
      boss: !!m.boss,
      cooldown: 0,
      heroCooldown: 0,
    };
    state.action = "fighting";
    addEntry("encounter", `A wild ${m.name} appears!`, "");
    if (window.Scene) window.Scene.spawnMonster(monsterId);
    if (window.UI) window.UI.flash("encounter");
  }

  function runCombatTick() {
    const c = state.combat; if (!c) return;
    const stance = state.stance;

    // stance modifiers
    const heroAtkMul = stance === "aggressive" ? 1.25 : stance === "defensive" ? 0.85 : 1;
    const heroDefMul = stance === "defensive" ? 1.4 : stance === "aggressive" ? 0.85 : 1;
    const useSkillChance = stance === "frugal" ? 0 : stance === "aggressive" ? 0.35 : 0.18;

    // hero strikes
    if (c.heroCooldown <= 0) {
      const dodge = Math.random()*100 < (Math.max(0, /*monster eva*/0));
      if (!dodge) {
        let dmg = Math.max(1, Math.round((state.atk * heroAtkMul) - c.def * 0.4 + (Math.random()*4 - 2)));
        let crit = Math.random()*100 < state.crit + (stance==="aggressive"?5:0);
        if (crit) dmg = Math.round(dmg * 1.7);

        // skill cast
        let skillUsed = null;
        if (state.skills["fireball"] && state.mp >= 18 && Math.random() < useSkillChance) {
          dmg += Math.round(state.mag * 2.6 + 6);
          state.mp -= 18;
          skillUsed = "Fireball";
        }
        c.hp -= dmg;
        if (window.Scene) window.Scene.showDamage(dmg, { crit });
        if (skillUsed) addEntry("skill", `Ember casts <b>${skillUsed}</b> for ${dmg} damage.`, "crit");
        else if (crit) addEntry("hit", `<b>Critical!</b> Ember strikes the ${c.name} for ${dmg}.`, "crit");
        c.heroCooldown = Math.max(2, 6 - Math.floor(state.spd / 4));
      } else {
        c.heroCooldown = 4;
      }
    } else {
      c.heroCooldown--;
    }

    // monster strikes
    if (c.hp > 0 && c.cooldown <= 0) {
      const evaded = Math.random()*100 < state.eva;
      if (!evaded) {
        let dmg = Math.max(1, Math.round(c.atk * 0.8 / heroDefMul - state.def * 0.5 + (Math.random()*3-1)));
        state.hp -= dmg;
        if (window.Scene) window.Scene.showHeroDamage(dmg);
        addEntry("hit", `The ${c.name} strikes Ember for ${dmg}.`, "");
      } else {
        addEntry("hit", `Ember slips aside — the blow misses!`, "defeat");
      }
      c.cooldown = c.boss ? 4 : (5 + Math.floor(Math.random()*3));
    } else c.cooldown--;

    // healing
    if (state.skills["healing-light"] && state.hp / state.maxHp < 0.5 && state.mp >= 20 && Math.random() < 0.2) {
      state.hp = Math.min(state.maxHp, state.hp + 60);
      state.mp -= 20;
      if (window.Scene) window.Scene.showDamage(60, { heal: true });
      addEntry("skill", `Ember calls <b>Healing Light</b> (+60 HP).`, "level");
    }

    // resolve
    if (c.hp <= 0) {
      victory(c);
    } else if (state.hp <= 0) {
      defeat(c);
    }
  }

  function victory(c) {
    state.sessionKills++;
    addExp(c.exp);
    state.gold += c.gold;
    state.sessionGold += c.gold;
    addEntry("victory", `Ember defeats the <b>${c.name}</b> — +${c.exp} XP, +${c.gold}g.`, "loot");

    // drops
    const lootMul = (state.skills["treasure-hunt"] ? 1.12 : 1) + state.luk * 0.005;
    (c.drops || []).forEach(itemId => {
      if (Math.random() < 0.55 * lootMul) {
        addItem(itemId, 1);
        const item = window.GameData.ITEMS[itemId];
        if (window.Scene) window.Scene.showLoot(`+${item.name}`, window.GameData.RARITY[item.rarity].color);
        if (window.UI) window.UI.toast(item.name, item.rarity);
      }
    });
    // small chance for equipment
    if (Math.random() < 0.06 + state.luk * 0.002) {
      const eqPool = ["iron-sword","silver-blade","leather-vest","moss-cloak","copper-ring","lucky-charm"];
      const drop = eqPool[Math.floor(Math.random()*eqPool.length)];
      addItem(drop, 1);
      const item = window.GameData.ITEMS[drop];
      if (window.UI) window.UI.toast(item.name, item.rarity);
    }
    // gold pile bonus
    if (c.boss) {
      const bonus = Math.round(c.gold * 0.6);
      state.gold += bonus;
      addEntry("victory", `The ${c.name} drops a heavy purse (+${bonus}g).`, "loot");
    }

    // quest progress
    state.quests.forEach(q => {
      if (q.done) return;
      const def = q.def;
      if (def.type === "kill" && def.target === c.monsterId) { q.progress++; }
      if (def.type === "boss" && def.target === c.monsterId) { q.progress++; }
      if (q.progress >= def.goal) finishQuest(q);
    });

    state.combat = null;
    state.action = "looting";
    state.actionTimer = 3;
    if (window.Scene) window.Scene.despawnMonster();
  }

  function defeat(c) {
    state.hp = 1;
    state.cond.energy = Math.max(0, state.cond.energy - 3);
    state.cond.mood = Math.max(0, state.cond.mood - 2);
    state.cond.fatigue = Math.min(8, state.cond.fatigue + 4);
    addEntry("defeat", `Ember falls before the ${c.name} and crawls back to town with a borrowed bandage.`, "defeat");
    state.combat = null;
    state.action = "returning";
    state.actionTimer = 8;
    if (window.Scene) window.Scene.despawnMonster();
  }
  function retreatFromCombat() {
    addEntry("defeat", `Ember retreats from the ${state.combat.name}.`, "defeat");
    state.combat = null;
    state.action = "returning";
    state.actionTimer = 8;
    if (window.Scene) window.Scene.despawnMonster();
  }

  function gatherMaterial(zone) {
    const pool = zone.mats || ["herb"];
    const id = pool[Math.floor(Math.random()*pool.length)];
    if (Math.random() < 0.6) {
      addItem(id, 1);
      const item = window.GameData.ITEMS[id];
      if (item) {
        addEntry("gather", `Ember gathers a <b>${item.name}</b>.`, "loot");
        if (window.Scene) window.Scene.showLoot(`+${item.name}`, window.GameData.RARITY[item.rarity].color);
        if (window.UI) window.UI.toast(item.name, item.rarity);
        state.quests.forEach(q => {
          if (q.done) return;
          if (q.def.type === "collect" && q.def.target === id) { q.progress++; if (q.progress >= q.def.goal) finishQuest(q); }
        });
      }
    }
  }

  function updateZoneProgress(zone) {
    state.zoneProgress[zone.id] = (state.zoneProgress[zone.id] || 0) + 1;
    // unlock next zone
    if (state.zoneProgress[zone.id] >= zone.progressGoal) {
      const idx = window.GameData.ZONES.findIndex(z => z.id === zone.id);
      const next = window.GameData.ZONES[idx + 1];
      if (next && !state.zonesUnlocked.includes(next.id)) {
        state.zonesUnlocked.push(next.id);
        addEntry("unlock", `New zone discovered: <b>${next.name}</b>!`, "level");
        if (window.UI) window.UI.toast("Zone Unlocked: " + next.name, "legend");
      }
    }
    state.quests.forEach(q => {
      if (q.done) return;
      if (q.def.type === "explore" && q.def.target === zone.id) { q.progress = Math.max(q.progress, 1); finishQuest(q); }
    });
  }

  function finishQuest(q) {
    q.done = true; q.progress = q.def.goal;
    const r = q.def.rewards || {};
    if (r.gold) state.gold += r.gold;
    if (r.exp) addExp(r.exp);
    if (r.items) Object.entries(r.items).forEach(([id, n]) => addItem(id, n));
    addEntry("quest", `Quest complete: <b>${q.def.title}</b>.`, "level");
    if (window.UI) window.UI.toast("Quest: " + q.def.title, "epic");
  }

  /* ─────────── Items ─────────── */
  function addItem(id, n) {
    n = n || 1;
    state.pack[id] = (state.pack[id] || 0) + n;
  }
  function removeItem(id, n) {
    n = n || 1;
    state.pack[id] = (state.pack[id] || 0) - n;
    if (state.pack[id] <= 0) delete state.pack[id];
  }
  function packCount() {
    return Object.keys(state.pack).length;
  }
  function usePotion(id) {
    const item = window.GameData.ITEMS[id];
    if (!item || (state.pack[id]||0) <= 0) return;
    if (item.heal) state.hp = Math.min(state.maxHp, state.hp + item.heal);
    if (item.mp)   state.mp = Math.min(state.maxMp, state.mp + item.mp);
    removeItem(id, 1);
    addEntry("potion", `Ember drinks a <b>${item.name}</b>.`, "");
  }

  function equipItem(id) {
    const item = window.GameData.ITEMS[id];
    if (!item) return;
    let slot = item.type === "weapon" ? "weapon" : item.type === "armor" ? "armor" : "trinket";
    const prev = state.equip[slot];
    if (prev) addItem(prev, 1);
    state.equip[slot] = id;
    removeItem(id, 1);
    recomputeStats();
    addEntry("equip", `Ember equips <b>${item.name}</b>.`, "");
  }

  /* ─────────── Leveling ─────────── */
  function addExp(amount) {
    state.exp += amount; state.sessionExp += amount;
    while (state.exp >= state.expNext) {
      state.exp -= state.expNext;
      levelUp();
    }
  }
  function levelUp() {
    state.level++;
    state.expNext = Math.round(50 * Math.pow(1.3, state.level - 1));
    state.statBase.maxHp += 6;
    state.statBase.maxMp += 2;
    state.statBase.atk   += 1;
    state.statBase.def   += 1;
    if (state.level % 2 === 0) state.statBase.spd += 1;
    if (state.level % 3 === 0) state.statBase.mag += 1;
    state.skillPoints += 1;
    recomputeStats();
    state.hp = state.maxHp;
    state.mp = state.maxMp;
    addEntry("levelup", `Ember rises to <b>Level ${state.level}</b>!`, "level");
    if (window.Scene) window.Scene.levelUpBurst();
    if (window.UI) window.UI.celebrateLevel(state.level);
  }

  /* ─────────── Skills ─────────── */
  function learnSkill(id) {
    if (state.skills[id]) return false;
    if (state.skillPoints <= 0) return false;
    const s = window.GameData.SKILLS.find(s => s.id === id); if (!s) return false;
    if ((s.needs || []).some(n => !state.skills[n])) return false;
    state.skills[id] = true;
    state.skillPoints--;
    recomputeStats();
    addEntry("skill", `Ember learns the art of <b>${s.name}</b>.`, "level");
    return true;
  }

  /* ─────────── Zones ─────────── */
  function travel(zoneId) {
    if (!state.zonesUnlocked.includes(zoneId)) return;
    if (state.zoneId === zoneId) return;
    state.zoneId = zoneId;
    state.combat = null;
    state.action = "walking";
    state.actionTimer = 4;
    state.zoneProgress[zoneId] = state.zoneProgress[zoneId] || 0;
    const z = window.GameData.ZONES.find(z => z.id === zoneId);
    addEntry("travel", `Ember sets out for <b>${z.name}</b>.`, "");
  }

  function setStance(s) { state.stance = s; }

  /* ─────────── Chronicle ─────────── */
  function addEntry(kind, text, css) {
    state.chronicle.unshift({
      t: Date.now(),
      day: state.day,
      kind, text,
      css: css || "",
    });
    if (state.chronicle.length > 80) state.chronicle.length = 80;
  }

  /* ─────────── Offline catch-up ─────────── */
  function catchUpOffline() {
    if (!state.lastSaveAt) return null;
    const elapsedMs = Date.now() - state.lastSaveAt;
    if (elapsedMs < 60_000) return null; // ignore tiny gaps
    const cap = OFFLINE_CAP_HRS * 3600 * 1000;
    const used = Math.min(elapsedMs, cap);
    const ticks = Math.floor(used / 1000);

    const restEff = state.skills["lantern-rest"] ? 1.25 : 1.0;
    const luckEff = 1 + state.luk * 0.005;
    const stanceEff = state.stance === "frugal" ? 0.85 : 1.0;
    const efficiency = 0.45 * restEff * luckEff * stanceEff; // offline ~45% efficient

    const summary = { ms: used, kills: 0, exp: 0, gold: 0, lootCounts: {}, levels: 0 };
    const zone = currentZone();
    const monsters = zone.monsters;

    let virtualTime = 0;
    while (virtualTime < ticks) {
      const m = window.GameData.MONSTERS[monsters[Math.floor(Math.random()*monsters.length)]];
      const lvScale = 1 + (zone.lvMin - 1) * 0.18;
      const battleTicks = Math.max(2, Math.round(m.hp * lvScale / Math.max(1, state.atk * 1.4)) + 2);
      virtualTime += battleTicks;
      summary.kills++;
      summary.exp  += Math.round(m.exp  * lvScale * efficiency);
      summary.gold += Math.round(m.gold * lvScale * efficiency);
      (m.drop||[]).forEach(itemId => {
        if (Math.random() < 0.4 * efficiency) summary.lootCounts[itemId] = (summary.lootCounts[itemId]||0)+1;
      });
    }
    state.gold += summary.gold;
    Object.entries(summary.lootCounts).forEach(([id,n]) => addItem(id, n));
    addExp(summary.exp);
    state.cond.energy = Math.max(0, state.cond.energy - 1);
    state.cond.fatigue = Math.min(8, state.cond.fatigue + 2);
    return summary;
  }

  /* ─────────── Lifecycle ─────────── */
  let tickHandle = null;
  function start() {
    const restored = load();
    if (!restored) { ensureFresh(); recomputeStats(); save(); }
    else { recomputeStats(); }
    state.lastTickAt = Date.now();
    if (tickHandle) clearInterval(tickHandle);
    tickHandle = setInterval(() => {
      const now = Date.now();
      const dt = now - state.lastTickAt;
      const n = Math.floor(dt / TICK_MS);
      for (let i = 0; i < n; i++) tick();
      state.lastTickAt += n * TICK_MS;
      if (window.UI) window.UI.refresh();
    }, 200);

    // also save on visibility change
    document.addEventListener("visibilitychange", () => save());
    window.addEventListener("beforeunload", () => save());
  }
  function pause() { if (tickHandle) clearInterval(tickHandle); tickHandle = null; }

  return {
    state, start, pause,
    save, load, wipe,
    catchUpOffline,
    travel, setStance, equipItem, learnSkill, usePotion,
    addEntry, recomputeStats,
    packCount,
  };
})();

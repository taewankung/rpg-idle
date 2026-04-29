/* DOM bindings & rendering loop. */

window.UI = (function () {

  const el = id => document.getElementById(id);
  const q  = sel => document.querySelector(sel);
  const qa = sel => document.querySelectorAll(sel);

  const TIMES_OF_DAY = ["dawn", "morning", "midday", "afternoon", "dusk", "night"];

  function init() {
    bindBanner();
    bindTabs();
    bindStances();
    bindSettings();
    renderZones();
    renderQuests();
    renderTown();
    renderSkills();
    renderEquip();
    renderPack();
    renderHeroPortrait();
    refresh();
  }

  function refresh() {
    const s = window.Game.state;

    el("hero-name").textContent = s.name;
    el("hero-name-tag").textContent = s.name + " the Wayward";
    el("hero-class").textContent = s.className;
    el("hero-level").textContent = s.level;
    el("hero-title").textContent = `— ${titleFor(s.level)} —`;

    setBar("bar-hp", s.hp, s.maxHp); el("val-hp").textContent = `${s.hp} / ${s.maxHp}`;
    setBar("bar-mp", s.mp, s.maxMp); el("val-mp").textContent = `${s.mp} / ${s.maxMp}`;
    setBar("bar-xp", s.exp, s.expNext); el("val-xp").textContent = `${s.exp} / ${s.expNext}`;

    el("s-atk").textContent = s.atk;
    el("s-def").textContent = s.def;
    el("s-mag").textContent = s.mag;
    el("s-spd").textContent = s.spd;
    el("s-luk").textContent = s.luk;
    el("s-crit").textContent = s.crit + "%";
    el("s-eva").textContent  = s.eva  + "%";
    el("s-carry").textContent = `${window.Game.packCount()} / ${s.carry}`;

    renderPips("cond-energy", s.cond.energy, "is-on");
    renderPips("cond-hunger", s.cond.hunger, "is-on");
    renderPips("cond-mood",   s.cond.mood,   "is-on");
    renderPips("cond-fatigue", s.cond.fatigue, "is-warn");

    el("scene-zone").textContent = currentZone().name;
    el("scene-action").textContent = actionCaption();
    el("scene-time").textContent  = timeOfDay();

    el("stat-gold").textContent = s.gold.toLocaleString();
    el("stat-pack").textContent = `${window.Game.packCount()} / ${s.carry}`;
    el("stat-rep").textContent  = s.rep;
    el("stat-day").textContent  = s.day;
    el("stat-saved").textContent = relativeSave(s.lastSaveAt);

    el("eq-weapon").textContent  = nameOf(s.equip.weapon)  || "— none —";
    el("eq-armor").textContent   = nameOf(s.equip.armor)   || "— none —";
    el("eq-trinket").textContent = nameOf(s.equip.trinket) || "— none —";

    renderChronicle();
    renderQuestProgress();
    renderZoneStates();
    renderPackIfChanged();
    renderEquipIfChanged();

    el("skill-points").textContent = s.skillPoints;
  }

  let _lastPackKey = "";
  function renderPackIfChanged() {
    const s = window.Game.state;
    const key = JSON.stringify(s.pack);
    if (key === _lastPackKey) return;
    _lastPackKey = key;
    renderPack();
  }
  let _lastEquipKey = "";
  function renderEquipIfChanged() {
    const s = window.Game.state;
    const key = JSON.stringify(s.equip);
    if (key === _lastEquipKey) return;
    _lastEquipKey = key;
    renderEquip();
  }

  function setBar(id, cur, max) {
    const w = max === 0 ? 0 : Math.max(0, Math.min(100, (cur / max) * 100));
    el(id).style.width = w + "%";
  }

  function renderPips(id, n, cls) {
    const root = el(id); if (!root) return;
    if (root.children.length !== 8) {
      root.innerHTML = "";
      for (let i = 0; i < 8; i++) root.appendChild(document.createElement("span"));
    }
    Array.from(root.children).forEach((p, i) => {
      p.className = "pip" + (i < n ? " " + cls : "");
    });
  }

  function nameOf(id) { return id ? (window.GameData.ITEMS[id]||{}).name : null; }
  function currentZone() { return window.GameData.ZONES.find(z => z.id === window.Game.state.zoneId) || window.GameData.ZONES[0]; }

  function timeOfDay() {
    const phase = (window.Game.state.tick % 1200) / 1200;
    if (phase < 0.12) return "dawn";
    if (phase < 0.32) return "morning";
    if (phase < 0.5)  return "midday";
    if (phase < 0.68) return "afternoon";
    if (phase < 0.86) return "dusk";
    return "night";
  }

  function actionCaption() {
    const s = window.Game.state;
    const zone = currentZone();
    if (s.combat) {
      const m = window.GameData.MONSTERS[s.combat.monsterId];
      return `crosses blades with a ${m.name}…`;
    }
    if (s.action === "resting")   return "boils water over moss and rests by the fire.";
    if (s.action === "looting")   return "pockets what fortune left behind.";
    if (s.action === "returning") return "limps back toward the lantern of home.";
    return `wanders through ${biomeFor(zone)}…`;
  }
  function biomeFor(z) {
    return ({
      meadow: "the green meadow",
      forest: "the whispering forest",
      cave:   "the crystal cave",
      ruins:  "the forgotten ruins",
      tower:  "the ancient tower",
      skyisle:"the bright sky garden"
    })[z.id] || "the trail";
  }
  function titleFor(lv) {
    if (lv < 3) return "Apprentice of the Lantern";
    if (lv < 6) return "Journey-Bearer";
    if (lv < 10) return "Lanternkin";
    if (lv < 15) return "Stargazer";
    if (lv < 22) return "Warden of the Three Stars";
    return "Light-of-the-Nine-Roads";
  }
  function relativeSave(ts) {
    if (!ts) return "—";
    const d = (Date.now() - ts) / 1000;
    if (d < 30) return "just now";
    if (d < 90) return "a moment ago";
    if (d < 600) return Math.floor(d/60) + " min ago";
    return new Date(ts).toLocaleTimeString();
  }

  /* ─────────── Banner buttons ─────────── */
  function bindBanner() {
    el("btn-save").addEventListener("click", () => {
      window.Game.save();
      flash("save"); refresh();
      toast("Inscribed in the Lantern Codex", "uncommon");
    });
    el("btn-settings").addEventListener("click", () => openModal("modal-settings"));
    qa("[data-close]").forEach(b => b.addEventListener("click", e => closeModal(e.currentTarget.dataset.close)));
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") qa(".modal:not([hidden])").forEach(m => closeModal(m.id));
      if (e.key.toLowerCase() === "i") activateTab("pack");
      if (e.key.toLowerCase() === "c") /* hero focus */ scrollTo(0,0);
      if (e.key.toLowerCase() === "q") activateTab("quests");
      if (e.key.toLowerCase() === "m") activateTab("atlas");
      if (e.key.toLowerCase() === "s") activateTab("skills");
    });
  }

  /* ─────────── Tabs ─────────── */
  function bindTabs() {
    qa(".tab").forEach(t => t.addEventListener("click", () => activateTab(t.dataset.tab)));
  }
  function activateTab(name) {
    qa(".tab").forEach(t => t.classList.toggle("is-active", t.dataset.tab === name));
    qa(".tab-panel").forEach(p => p.classList.toggle("is-active", p.dataset.panel === name));
  }

  /* ─────────── Stances ─────────── */
  function bindStances() {
    qa(".stance").forEach(b => b.addEventListener("click", () => {
      qa(".stance").forEach(x => x.classList.remove("is-active"));
      b.classList.add("is-active");
      window.Game.setStance(b.dataset.stance);
      window.Game.addEntry("stance", `Ember adopts a <b>${b.dataset.stance}</b> stance.`, "");
    }));
    el("opt-autopotion").addEventListener("change", e => window.Game.state.options.autoPotion = e.target.checked);
    el("opt-retreat").addEventListener("change", e => window.Game.state.options.retreat = e.target.checked);
  }

  /* ─────────── Settings ─────────── */
  function bindSettings() {
    el("set-name").addEventListener("change", e => {
      const v = (e.target.value || "").trim();
      if (v) { window.Game.state.name = v; refresh(); }
    });
    el("set-name").value = window.Game.state.name;
    el("set-music").checked = !!window.Game.state.options.music;
    el("set-sfx").checked = !!window.Game.state.options.sfx;
    el("set-rmotion").checked = !!window.Game.state.options.reduceMotion;
    el("set-music").addEventListener("change", e => window.Game.state.options.music = e.target.checked);
    el("set-sfx").addEventListener("change",   e => window.Game.state.options.sfx = e.target.checked);
    el("set-rmotion").addEventListener("change", e => {
      window.Game.state.options.reduceMotion = e.target.checked;
      document.documentElement.style.setProperty("--prm", e.target.checked ? "1" : "0");
    });
    el("set-wipe").addEventListener("click", () => {
      if (!confirm("Burn the entire chronicle? This cannot be undone.")) return;
      window.Game.wipe();
      location.reload();
    });
  }

  /* ─────────── Hero portrait ─────────── */
  function renderHeroPortrait() {
    const c = el("hero-portrait");
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0,0,c.width,c.height);

    // background lantern halo from below-left
    const grad = ctx.createRadialGradient(20, c.height-4, 4, 20, c.height-4, 36);
    grad.addColorStop(0, "rgba(255,210,120,.55)");
    grad.addColorStop(1, "rgba(255,180,80,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,c.width,c.height);

    // soft inner vignette
    const vg = ctx.createRadialGradient(c.width/2, c.height/2, c.width*0.2, c.width/2, c.height/2, c.width*0.7);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,.35)");
    ctx.fillStyle = vg;
    ctx.fillRect(0,0,c.width,c.height);

    // bust portrait (32x32 source)
    const sprite = window.Sprites.portrait();
    const scale = Math.min(c.width / sprite.width, c.height / sprite.height) * 1.0;
    const dw = sprite.width * scale, dh = sprite.height * scale;
    const dx = (c.width - dw) / 2;
    const dy = (c.height - dh) / 2 + 1;
    ctx.drawImage(sprite, 0, 0, sprite.width, sprite.height, dx, dy, dw, dh);
  }

  /* ─────────── Zones / atlas ─────────── */
  function renderZones() {
    const list = el("zone-list");
    list.innerHTML = "";
    window.GameData.ZONES.forEach(z => {
      const card = document.createElement("article");
      card.className = "zone-card";
      card.dataset.zone = z.id;
      const thumb = window.Sprites.zoneThumb(z.id);
      const cv = document.createElement("canvas");
      cv.className = "zone-thumb"; cv.width = 88; cv.height = 60;
      cv.getContext("2d").drawImage(thumb, 0, 0);

      const info = document.createElement("div");
      info.className = "zone-info";
      info.innerHTML = `
        <h4>${z.name}</h4>
        <div class="zone-meta">Lv ${z.lvMin}–${z.lvMax} · <span class="zp-pct" data-zone="${z.id}">0%</span> explored</div>
        <div class="zone-progress"><div class="zp-fill" data-zone-fill="${z.id}"></div></div>
        <p class="zone-flavor">${z.flavor}</p>`;

      const btn = document.createElement("button");
      btn.className = "travel-btn";
      btn.textContent = "Travel";
      btn.addEventListener("click", () => {
        if (!window.Game.state.zonesUnlocked.includes(z.id)) return;
        window.Game.travel(z.id);
        renderZoneStates();
        refresh();
      });

      card.appendChild(cv);
      card.appendChild(info);
      card.appendChild(btn);

      if (!window.Game.state.zonesUnlocked.includes(z.id)) {
        card.classList.add("is-locked");
        const stamp = document.createElement("span");
        stamp.className = "lock-stamp";
        stamp.textContent = `Lv ${z.unlock}`;
        card.appendChild(stamp);
      }
      list.appendChild(card);
    });
    renderZoneStates();
  }

  function renderZoneStates() {
    const s = window.Game.state;
    qa(".zone-card").forEach(c => {
      const id = c.dataset.zone;
      c.classList.toggle("is-active", id === s.zoneId);
      const z = window.GameData.ZONES.find(z => z.id === id);
      const pct = Math.min(100, Math.round(((s.zoneProgress[id]||0) / z.progressGoal) * 100));
      const pctEl = c.querySelector(".zp-pct");
      const fillEl = c.querySelector(".zp-fill");
      if (pctEl) pctEl.textContent = pct + "%";
      if (fillEl) fillEl.style.width = pct + "%";
      const unlocked = s.zonesUnlocked.includes(id);
      c.classList.toggle("is-locked", !unlocked);
      const btn = c.querySelector(".travel-btn");
      btn.disabled = !unlocked;
      btn.textContent = id === s.zoneId ? "Walking" : "Travel";
    });
  }

  /* ─────────── Quests ─────────── */
  function renderQuests() {
    const list = el("quest-list");
    list.innerHTML = "";
    window.Game.state.quests.forEach(q => {
      const li = document.createElement("li");
      li.className = "quest" + (q.done ? " is-done" : "");
      li.dataset.quest = q.id;
      const r = q.def.rewards || {};
      const rewardLine =
        [r.gold ? `+${r.gold}g` : null, r.exp ? `+${r.exp}xp` : null,
         r.items ? Object.entries(r.items).map(([id,n])=> `${n}× ${nameOf(id)}`).join(" · ") : null]
        .filter(Boolean).join(" · ");
      li.innerHTML = `
        <div class="quest-stamp">${q.done ? "✓" : "★"}</div>
        <div class="quest-body">
          <h4>${q.def.title}</h4>
          <p>${q.def.desc}</p>
          <div class="quest-progress">
            <span class="qp-text">${Math.min(q.progress, q.def.goal)} / ${q.def.goal}</span>
            <div class="qp-track"><div class="qp-fill" style="width:${Math.min(100, (q.progress/q.def.goal)*100)}%"></div></div>
          </div>
          <div class="quest-rewards">${rewardLine}</div>
        </div>`;
      list.appendChild(li);
    });
  }
  function renderQuestProgress() {
    const s = window.Game.state;
    s.quests.forEach(q => {
      const li = document.querySelector(`[data-quest="${q.id}"]`); if (!li) return;
      li.classList.toggle("is-done", q.done);
      const stamp = li.querySelector(".quest-stamp"); if (stamp) stamp.textContent = q.done ? "✓" : "★";
      const txt = li.querySelector(".qp-text"); if (txt) txt.textContent = `${Math.min(q.progress, q.def.goal)} / ${q.def.goal}`;
      const fill = li.querySelector(".qp-fill"); if (fill) fill.style.width = Math.min(100, (q.progress/q.def.goal)*100) + "%";
    });
  }

  /* ─────────── Chronicle log ─────────── */
  function renderChronicle() {
    const list = el("chronicle");
    if (!list) return;
    const entries = window.Game.state.chronicle.slice(0, 60);
    if (list.dataset.lastTs === String(entries[0]?.t || 0) && list.children.length === entries.length) return;
    list.dataset.lastTs = String(entries[0]?.t || 0);
    list.innerHTML = "";
    entries.forEach(e => {
      const li = document.createElement("li");
      li.className = "entry " + (e.css ? `entry-${e.css}` : "");
      const cssClassMap = { loot: "entry-loot", crit: "entry-crit", level: "entry-level", defeat: "entry-defeat" };
      li.innerHTML = `
        <span class="entry-time">d${e.day} · ${formatRelTime(e.t)}</span>
        <span class="entry-text ${cssClassMap[e.css] || ""}">${e.text}</span>`;
      list.appendChild(li);
    });
  }
  function formatRelTime(ts) {
    const d = (Date.now() - ts) / 1000;
    if (d < 60) return Math.floor(d) + "s";
    if (d < 3600) return Math.floor(d/60) + "m";
    return Math.floor(d/3600) + "h";
  }

  /* ─────────── Pack / equipment ─────────── */
  function renderPack() {
    const grid = el("pack-grid");
    grid.innerHTML = "";
    const SLOT_COUNT = 24;
    const entries = Object.entries(window.Game.state.pack);
    for (let i = 0; i < SLOT_COUNT; i++) {
      const slot = document.createElement("div");
      slot.className = "slot";
      const entry = entries[i];
      if (!entry) {
        slot.classList.add("is-empty");
        grid.appendChild(slot);
        continue;
      }
      const [id, n] = entry;
      const item = window.GameData.ITEMS[id]; if (!item) { grid.appendChild(slot); continue; }
      slot.dataset.rarity = item.rarity;
      slot.title = `${item.name} — ${window.GameData.RARITY[item.rarity].name}\n${item.value}g`;
      const cv = document.createElement("canvas");
      cv.width = 16; cv.height = 16;
      cv.getContext("2d").drawImage(window.Sprites.itemIcon(id), 0, 0);
      slot.appendChild(cv);
      if (n > 1) {
        const qty = document.createElement("span");
        qty.className = "qty"; qty.textContent = "×" + n;
        slot.appendChild(qty);
      }
      slot.addEventListener("click", () => {
        if (item.heal || item.mp) {
          window.Game.usePotion(id);
          renderPack(); refresh();
          toast("Used " + item.name, "common");
        } else if (item.type === "weapon" || item.type === "armor" || item.type === "trinket") {
          window.Game.equipItem(id);
          renderPack(); renderEquip(); refresh();
          toast("Equipped " + item.name, item.rarity);
        } else if (item.gold) {
          window.Game.state.gold += item.gold;
          window.Game.removeItem ? window.Game.removeItem(id, 1) : null;
          window.Game.state.pack[id] = (window.Game.state.pack[id]||1) - 1;
          if (window.Game.state.pack[id] <= 0) delete window.Game.state.pack[id];
          renderPack(); refresh();
          toast("+" + item.gold + " gold", "uncommon");
        }
      });
      grid.appendChild(slot);
    }
  }

  function renderEquip() {
    const s = window.Game.state;
    qa(".equip-slot").forEach(slot => {
      const which = slot.dataset.slot;
      const id = s.equip[which];
      const frame = slot.querySelector(".equip-frame");
      frame.innerHTML = "";
      if (id) {
        const cv = document.createElement("canvas");
        cv.width = 16; cv.height = 16;
        cv.getContext("2d").drawImage(window.Sprites.itemIcon(id), 0, 0);
        frame.appendChild(cv);
        const item = window.GameData.ITEMS[id];
        if (item) frame.style.boxShadow = `inset 0 0 0 1px ${window.GameData.RARITY[item.rarity].color}, 0 0 12px ${window.GameData.RARITY[item.rarity].color}66`;
      } else {
        frame.style.boxShadow = "";
      }
    });
  }

  /* ─────────── Skills ─────────── */
  function renderSkills() {
    const board = el("skill-board");
    board.innerHTML = "";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "skill-svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    board.appendChild(svg);

    const nodeById = {};
    window.GameData.SKILLS.forEach(s => nodeById[s.id] = s);

    window.GameData.SKILL_LINKS.forEach(([a,b]) => {
      const A = nodeById[a], B = nodeById[b];
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", A.x); line.setAttribute("y1", A.y);
      line.setAttribute("x2", B.x); line.setAttribute("y2", B.y);
      const both = window.Game.state.skills[a] && window.Game.state.skills[b];
      if (both) line.classList.add("is-active");
      svg.appendChild(line);
    });

    window.GameData.SKILLS.forEach(s => {
      const node = document.createElement("div");
      node.className = "skill-node";
      node.style.left = s.x + "%";
      node.style.top  = s.y + "%";
      const learned = !!window.Game.state.skills[s.id];
      const locked = (s.needs||[]).some(n => !window.Game.state.skills[n]);
      if (learned) node.classList.add("is-learned");
      if (locked && !learned) node.classList.add("is-locked");
      node.innerHTML = `<span class="skill-node-icon">${s.icon}</span><span class="skill-node-label">${s.name}</span>`;
      node.title = `${s.name}\n${s.desc}`;
      node.addEventListener("click", () => {
        if (window.Game.learnSkill(s.id)) {
          renderSkills(); refresh();
          toast("Learned " + s.name, "epic");
        }
      });
      board.appendChild(node);
    });
  }

  /* ─────────── Town ─────────── */
  function renderTown() {
    const list = el("town-list");
    list.innerHTML = "";
    window.GameData.TOWN.forEach(t => {
      const card = document.createElement("article");
      card.className = "town-card";
      card.innerHTML = `
        <div class="town-icon">${t.icon}</div>
        <div>
          <h4>${t.name}</h4>
          <span class="town-prop">Lv ${t.lv} · ${t.prop}</span>
          <p>${t.desc} <em style="color:var(--ember-deep)">— ${t.npc}</em></p>
        </div>`;
      list.appendChild(card);
    });
  }

  /* ─────────── Toasts ─────────── */
  function toast(text, rarity) {
    const pool = el("toast-pool");
    const t = document.createElement("div");
    t.className = "toast " + (rarity || "");
    const glyphs = { common: "✚", uncommon: "✦", rare: "✧", epic: "❖", legend: "⚜", mythic: "✺" };
    t.innerHTML = `<span class="toast-glyph">${glyphs[rarity] || "✦"}</span><b>${(rarity||"common").toUpperCase()}</b><span>${text}</span>`;
    pool.appendChild(t);
    setTimeout(() => t.remove(), rarity === "mythic" ? 5000 : 4000);
  }

  function flash(kind) {
    document.body.animate(
      [{ filter: "brightness(1)" }, { filter: kind==="encounter" ? "brightness(1.05) hue-rotate(-10deg)" : "brightness(1.08)" }, { filter: "brightness(1)" }],
      { duration: 280, easing: "ease-out" }
    );
  }

  /* ─────────── Modals ─────────── */
  function openModal(id) {
    const m = el(id); if (!m) return;
    m.hidden = false;
  }
  function closeModal(id) {
    const m = el(id); if (!m) return;
    m.hidden = true;
  }

  function celebrateLevel(lv) {
    el("levelup-lv").textContent = lv;
    const gains = el("levelup-gains");
    gains.innerHTML = `
      <div class="gain"><span>Max HP</span><b>+6</b></div>
      <div class="gain"><span>Max MP</span><b>+2</b></div>
      <div class="gain"><span>Attack</span><b>+1</b></div>
      <div class="gain"><span>Defense</span><b>+1</b></div>
      <div class="gain"><span>Skill Points</span><b>+1</b></div>
      <div class="gain"><span>Title</span><b>${titleFor(lv)}</b></div>`;
    openModal("modal-levelup");
  }

  function showOfflineSummary(summary) {
    if (!summary) return;
    const hours = summary.ms / 3600000;
    el("offline-when").textContent = `— gone for ${hours >= 1 ? hours.toFixed(1) + "h" : Math.round(summary.ms/60000) + "m"} —`;
    const list = el("offline-list");
    list.innerHTML = "";
    const rows = [
      { glyph: "⚔", label: "Monsters defeated", value: summary.kills },
      { glyph: "✦", label: "Experience earned", value: summary.exp },
      { glyph: "⛁", label: "Gold collected", value: summary.gold },
    ];
    Object.entries(summary.lootCounts).slice(0, 6).forEach(([id, n]) => {
      const item = window.GameData.ITEMS[id];
      if (item) rows.push({ glyph: "✿", label: item.name, value: n });
    });
    rows.forEach(r => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="glyph">${r.glyph}</span><span>${r.label}</span><b>${r.value}</b>`;
      list.appendChild(li);
    });
    openModal("modal-offline");
  }

  return { init, refresh, toast, flash, celebrateLevel, showOfflineSummary };
})();

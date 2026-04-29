// ─── save.js ───────────────────────────────────────────────
// localStorage save/load + offline progress simulation + diary log.

(function () {
  const KEY = 'cozyroom_v1';
  const SETTINGS_KEY = 'cozyroom_settings_v1';

  // diary entries are accumulated as the player triggers meaningful activities
  const diary = {
    entries: [], // { dateLabel, text }
  };

  function recordDiary(activityKey, def) {
    const time = window.TIME.dayString();
    const moodPhrase = window.STATS.getMoodPhrase();
    const lines = {
      eat:      'a meal, thanks to a quiet nudge.',
      sleep:    'i slept, and the room kept me.',
      bathe:    'warm water again. small reset.',
      work:     'pushed through a little work today.',
      read:     'i read until the words slowed.',
      paint:    'i made something. it doesn\'t need to be good.',
      exercise: 'moved a bit. shoulders thank me.',
      clean:    'tidied. the room can breathe.',
      window:   'watched the world from inside.',
    };
    const entry = lines[activityKey];
    if (!entry) return;
    diary.entries.unshift({
      dateLabel: time,
      text: `${entry} ${moodPhrase}`,
    });
    // keep manageable
    if (diary.entries.length > 80) diary.entries.length = 80;
  }

  function save() {
    const data = {
      v: 1,
      now: Date.now(),
      time: window.TIME.serialize(),
      stats: window.STATS.serialize(),
      bond: window.BOND.serialize(),
      char: window.CHAR.serialize(),
      activity: window.ACT.serialize(),
      diary: diary.entries,
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* quota or disabled */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function applyLoaded(data) {
    if (!data) return null;
    window.TIME.deserialize(data.time);
    window.STATS.deserialize(data.stats);
    window.BOND.deserialize(data.bond);
    window.CHAR.deserialize(data.char);
    window.ACT.deserialize(data.activity);
    diary.entries = (data.diary && data.diary.length) ? data.diary : [];
    return data.now ?? null;
  }

  function clearAll() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
    diary.entries = [];
  }

  // calculate offline progress: returns a summary list
  function applyOfflineProgress(lastSavedMs) {
    if (!lastSavedMs) return null;
    const elapsedMs = Date.now() - lastSavedMs;
    if (elapsedMs <= 0) return null;
    const elapsedH = elapsedMs / 3600000;
    if (elapsedH < 0.05) return null; // less than 3 min, skip
    const cap = window.CFG.OFFLINE_CAP_HOURS;
    const realHours = Math.min(elapsedH, cap);
    const wasCapped = elapsedH > cap;

    // fraction of decay (be kinder than online)
    const decayMult = 0.55;
    const ingameHours = realHours * window.CFG.TIME_SCALE / 60; // 1 real min = 1 in-game hour, but here it's hours
    // we want: time advance proportional to TIME_SCALE; decay proportional to those hours
    const inGameHrsAdvanced = realHours * window.CFG.TIME_SCALE; // total in-game hours

    const sim = {
      slept: 0,    // in-game hours slept
      worked: 0,
      ate: 0,
      tidied: 0,
      watered: 0,
      bond: 0,
      moneyEarned: 0,
    };

    // Step in chunks of in-game hours; let character "live" in a simplified loop
    let h = 0;
    const stats = window.STATS.state;
    const bond = window.BOND.state;
    while (h < inGameHrsAdvanced) {
      const stepH = Math.min(1, inGameHrsAdvanced - h);

      // baseline decay (gentler)
      for (const k of Object.keys(window.CFG.DECAY)) {
        stats[k] = window.STATS.clamp(stats[k] + window.CFG.DECAY[k] * stepH * decayMult);
      }

      // simple choice: if energy low -> sleep; if hunger low -> eat;
      // if stress high -> window; otherwise random idle
      let action = null;
      if (stats.energy < 30) action = 'sleep';
      else if (stats.hunger < 30 && stats.money >= 4) action = 'eat';
      else if (stats.stress > 70) action = 'window';
      else {
        const r = Math.random();
        if (r < 0.18) action = 'work';
        else if (r < 0.30) action = 'tidy';
        else if (r < 0.42) action = 'read';
        else if (r < 0.50) action = 'water';
        else action = 'rest';
      }

      switch (action) {
        case 'sleep':
          stats.energy = window.STATS.clamp(stats.energy + 30 * stepH);
          stats.health = window.STATS.clamp(stats.health + 1.5 * stepH);
          stats.stress = window.STATS.clamp(stats.stress - 6 * stepH);
          sim.slept += stepH;
          break;
        case 'eat':
          if (stats.money >= 4) {
            stats.money -= 4;
            stats.hunger = window.STATS.clamp(stats.hunger + 35);
            stats.happiness = window.STATS.clamp(stats.happiness + 2);
            sim.ate += 1;
          }
          break;
        case 'work':
          stats.energy = window.STATS.clamp(stats.energy - 6 * stepH);
          stats.stress = window.STATS.clamp(stats.stress + 4 * stepH);
          stats.money += Math.round(8 * stepH);
          sim.moneyEarned += Math.round(8 * stepH);
          sim.worked += stepH;
          break;
        case 'tidy':
          stats.cleanliness = window.STATS.clamp(stats.cleanliness + 18 * stepH);
          stats.stress = window.STATS.clamp(stats.stress - 2 * stepH);
          sim.tidied += stepH;
          break;
        case 'read':
          stats.inspiration = window.STATS.clamp(stats.inspiration + 6 * stepH);
          stats.stress = window.STATS.clamp(stats.stress - 3 * stepH);
          break;
        case 'water':
          stats.happiness = window.STATS.clamp(stats.happiness + 2 * stepH);
          stats.stress = window.STATS.clamp(stats.stress - 1 * stepH);
          sim.watered += stepH;
          break;
        case 'rest':
          stats.energy = window.STATS.clamp(stats.energy + 3 * stepH);
          stats.stress = window.STATS.clamp(stats.stress - 1 * stepH);
          break;
        case 'window':
          stats.stress = window.STATS.clamp(stats.stress - 4 * stepH);
          stats.loneliness = window.STATS.clamp(stats.loneliness + 1 * stepH);
          break;
      }
      h += stepH;
    }

    // advance world time
    window.TIME.applyOfflineHours(realHours);

    // small bond for being away too long penalty (loneliness already grew)
    // streak break risk
    if (realHours >= 6) bond.bond = Math.max(0, bond.bond - 0.5);
    sim.bond = bond.bond;

    return {
      realHours, wasCapped,
      slept: sim.slept,
      worked: sim.worked,
      ate: sim.ate,
      tidied: sim.tidied,
      watered: sim.watered,
      moneyEarned: sim.moneyEarned,
    };
  }

  // build user-friendly bullet list
  function buildOfflineSummary(sim) {
    if (!sim) return [];
    const out = [];
    const name = window.STATS.state.name || 'she';
    if (sim.slept > 0.4) out.push(`slept about ${sim.slept.toFixed(1)} hours.`);
    if (sim.ate > 0)      out.push(`had ${sim.ate} small meal${sim.ate > 1 ? 's' : ''}.`);
    if (sim.worked > 0.4) out.push(`got a little work done — earned ◉${sim.moneyEarned}.`);
    if (sim.tidied > 0.3) out.push(`tidied the room a bit.`);
    if (sim.watered > 0.2) out.push(`watered the plant.`);
    if (out.length === 0) out.push('mostly stayed quiet, watching the light move.');
    return out;
  }

  // Settings
  function saveSettings(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  window.SAVE = {
    save, load, applyLoaded, clearAll,
    applyOfflineProgress, buildOfflineSummary,
    saveSettings, loadSettings,
    diary, recordDiary,
  };
})();

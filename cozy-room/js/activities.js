// ─── activities.js ─────────────────────────────────────────
// Drives activity execution: player-triggered (eat, sleep, paint…)
// and idle behavior selection (when nothing is queued, character lives).

(function () {
  const CFG = window.CFG;

  const state = {
    current: null,        // { key, def, elapsed, duration, done }
    queue: [],
    cooldown: 0,          // gap between idle picks
    lastIdle: null,
  };

  // Player initiates an activity. May fail if cost not met.
  function start(key) {
    const def = window.ACTIVITIES[key];
    if (!def) return false;
    if (def.requires && def.requires.money && window.STATS.state.money < def.requires.money) {
      // not enough money
      window.UI?.showSpeech('i don\'t think i can afford that right now…');
      return false;
    }
    // commit cost
    if (def.cost) window.STATS.spend(def.cost);

    state.current = {
      key, def,
      elapsed: 0,
      duration: def.duration || 10,
      target: def.target || null,
      pose: def.pose || 'idle',
      isPlayerInitiated: !key.startsWith('idle_'),
      effectsApplied: false,
    };
    return true;
  }

  function cancel() {
    if (!state.current) return;
    state.current = null;
  }

  function tick(realDtSeconds, speed = 1) {
    if (state.cooldown > 0) state.cooldown -= realDtSeconds * speed;
    if (!state.current) return;

    state.current.elapsed += realDtSeconds * speed;
    // halfway -> apply effects gradually as fraction so it feels live
    const def = state.current.def;
    if (state.current.elapsed >= state.current.duration && !state.current.effectsApplied) {
      state.current.effectsApplied = true;
      finish();
    }
  }

  function finish() {
    const cur = state.current;
    if (!cur) return;
    const def = cur.def;

    // apply effects
    if (def.effects) window.STATS.apply(def.effects);
    if (def.rewards) window.STATS.apply(def.rewards);

    // bond bump
    if (def.bond) window.BOND.add(def.bond);

    // dialogue
    if (cur.isPlayerInitiated && def.line) {
      const line = window.DIALOG.getActivityLine(cur.key);
      if (line) window.UI?.showSpeech(line);
    }

    // diary entry for big moments
    if (cur.isPlayerInitiated && window.SAVE?.recordDiary) {
      window.SAVE.recordDiary(cur.key, def);
    }

    // small skill growth
    if (cur.key === 'paint' || cur.key === 'read' || cur.key === 'work') {
      window.STATS.state.skill = Math.min(100, window.STATS.state.skill + 0.5);
    }

    state.cooldown = 1.5; // idle gap
    state.current = null;
  }

  function isBusy() { return !!state.current; }

  function progress() {
    if (!state.current) return 0;
    return Math.min(1, state.current.elapsed / state.current.duration);
  }

  // ─── IDLE BRAIN ────────────────────────────────────────────
  // Picks an idle behavior based on current need and time of day.
  function pickIdle() {
    const stats = window.STATS.state;
    const phase = window.TIME.getDayPhase();
    const weather = window.TIME.state.weather;

    // weighted candidates
    const opts = [];

    // night -> sleep takes over
    if ((phase === 'night' || phase === 'late_night') && stats.energy < 70) {
      opts.push({ k: 'sleep', w: 6 });
    }

    if (stats.hunger < 35)      opts.push({ k: 'eat', w: 5 });
    if (stats.energy < 30)      opts.push({ k: 'sleep', w: 5 });
    if (stats.cleanliness < 35) opts.push({ k: 'idle_water', w: 1 });
    if (stats.stress > 65)      opts.push({ k: 'idle_window', w: 3 });
    if (stats.loneliness > 65)  opts.push({ k: 'idle_phone', w: 2 });
    if (stats.inspiration > 65 && stats.energy > 40) opts.push({ k: 'paint', w: 2 });

    // weather flavors
    if (weather === 'rain' || weather === 'snow') opts.push({ k: 'idle_window', w: 2 });

    // baseline filler
    opts.push({ k: 'idle_wander', w: 2 });
    opts.push({ k: 'idle_sit', w: 2 });
    opts.push({ k: 'idle_phone', w: 1 });
    opts.push({ k: 'idle_water', w: 1 });
    opts.push({ k: 'idle_window', w: 1 });

    // avoid back-to-back same idle
    const filtered = opts.filter(o => o.k !== state.lastIdle);

    const total = filtered.reduce((s, o) => s + o.w, 0);
    let r = Math.random() * total;
    for (const o of filtered) {
      r -= o.w;
      if (r <= 0) {
        state.lastIdle = o.k;
        return o.k;
      }
    }
    return 'idle_wander';
  }

  function maybePickIdle() {
    if (state.current) return;
    if (state.cooldown > 0) return;
    const key = pickIdle();
    start(key);
  }

  function serialize() {
    return {
      current: state.current
        ? { key: state.current.key, elapsed: state.current.elapsed }
        : null,
      cooldown: state.cooldown,
      lastIdle: state.lastIdle,
    };
  }
  function deserialize(d) {
    if (!d) return;
    state.cooldown = d.cooldown ?? 0;
    state.lastIdle = d.lastIdle ?? null;
    if (d.current && window.ACTIVITIES[d.current.key]) {
      state.current = {
        key: d.current.key,
        def: window.ACTIVITIES[d.current.key],
        elapsed: d.current.elapsed || 0,
        duration: window.ACTIVITIES[d.current.key].duration || 10,
        target: window.ACTIVITIES[d.current.key].target,
        pose:   window.ACTIVITIES[d.current.key].pose || 'idle',
        isPlayerInitiated: !d.current.key.startsWith('idle_'),
        effectsApplied: false,
      };
    }
  }

  window.ACT = {
    state, start, cancel, tick, finish,
    isBusy, progress, pickIdle, maybePickIdle,
    serialize, deserialize,
  };
})();

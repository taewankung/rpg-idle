// ─── relationship.js ───────────────────────────────────────
// Bond between player and character. Slow trust progression.

(function () {
  const CFG = window.CFG;

  const state = {
    bond: 0,             // 0–100
    careStreakDays: 0,
    lastCareDay: -1,
    organicHourBank: 0,  // accumulates real-time, releases bond +1 per BOND_TICK_HOURS
  };

  function add(amount) {
    state.bond = Math.max(0, Math.min(100, state.bond + amount));
  }

  function tier() {
    let cur = CFG.BOND_TIERS[0];
    for (const t of CFG.BOND_TIERS) {
      if (state.bond >= t.t) cur = t;
    }
    return cur;
  }

  function tierLabel() { return tier().label; }

  function tickOrganic(realDtSeconds, speed = 1) {
    // every BOND_TICK_HOURS in-game (only when player is around) -> +1 bond
    state.organicHourBank += (realDtSeconds * CFG.TIME_SCALE * speed) / 3600;
    while (state.organicHourBank >= CFG.BOND_TICK_HOURS) {
      state.organicHourBank -= CFG.BOND_TICK_HOURS;
      add(0.5); // gentle drip
    }
  }

  function checkInBoost(currentDay) {
    if (currentDay !== state.lastCareDay) {
      state.lastCareDay = currentDay;
      state.careStreakDays += 1;
      // streak rewards
      if (state.careStreakDays % 3 === 0) add(2);
      else add(1);
    } else {
      add(0.2);
    }
  }

  function unlockedActivities() {
    const out = ['check', 'eat', 'sleep', 'bathe', 'work', 'read', 'paint', 'exercise', 'clean', 'window'];
    return out;
  }

  function unlockedDialogues() {
    // higher bond unlocks more intimate phrases
    const t = state.bond;
    const out = ['default', 'small_talk'];
    if (t >= 15) out.push('familiar');
    if (t >= 35) out.push('warm');
    if (t >= 60) out.push('open');
    if (t >= 85) out.push('refuge');
    return out;
  }

  function serialize() { return { ...state }; }
  function deserialize(d) {
    if (!d) return;
    Object.assign(state, d);
  }

  window.BOND = {
    state, add, tier, tierLabel,
    tickOrganic, checkInBoost,
    unlockedActivities, unlockedDialogues,
    serialize, deserialize,
  };
})();

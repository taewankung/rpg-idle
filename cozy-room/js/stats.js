// ─── stats.js ──────────────────────────────────────────────
// Character stats, decay over time, mood derivation.

(function () {
  const CFG = window.CFG;

  const state = {
    name: 'Lin',
    hunger:      78,
    energy:      82,
    happiness:   65,
    health:      88,
    cleanliness: 72,
    stress:      28,
    loneliness:  35,
    inspiration: 50,
    money:       50,
    skill:       0,    // life skill (slow growth)
    daysCared:   0,
  };

  // last hour we applied decay (to prevent multi-decay drift)
  let lastDecayHourMark = 0;

  function clamp(v) { return Math.max(0, Math.min(100, v)); }

  function tickDecay(realDtSeconds, speed = 1) {
    // convert real seconds -> in-game hours
    const ingameHours = (realDtSeconds * CFG.TIME_SCALE * speed) / 3600;
    for (const k of Object.keys(CFG.DECAY)) {
      state[k] = clamp(state[k] + CFG.DECAY[k] * ingameHours);
    }
  }

  function apply(effects) {
    if (!effects) return;
    for (const k of Object.keys(effects)) {
      if (k === 'money') {
        state.money = Math.max(0, state.money + effects.money);
        continue;
      }
      if (state[k] === undefined) continue;
      state[k] = clamp(state[k] + effects[k]);
    }
  }

  function spend(cost) {
    if (!cost) return true;
    if (cost.money && state.money < cost.money) return false;
    if (cost.energy && state.energy < cost.energy) return false;
    if (cost.money) state.money -= cost.money;
    if (cost.energy) state.energy = clamp(state.energy - cost.energy);
    return true;
  }

  function isLow(key) {
    if (key === 'stress' || key === 'loneliness') return state[key] > 70;
    return state[key] < 30;
  }

  function isCritical(key) {
    if (key === 'stress' || key === 'loneliness') return state[key] > 85;
    return state[key] < 15;
  }

  function getDominantNeed() {
    // pick the worst-off stat (positive ones low, negative ones high)
    const candidates = [
      { k: 'hunger',      score: 100 - state.hunger },
      { k: 'energy',      score: 100 - state.energy },
      { k: 'cleanliness', score: 100 - state.cleanliness },
      { k: 'happiness',   score: 100 - state.happiness },
      { k: 'inspiration', score: 100 - state.inspiration },
      { k: 'stress',      score: state.stress },
      { k: 'loneliness',  score: state.loneliness },
    ];
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  function getMood() {
    // returns one of: normal, happy, tired, stressed, lonely, inspired, sick, calm, excited
    if (state.health < 35)               return 'sick';
    if (state.energy < 25)               return 'tired';
    if (state.stress > 75)               return 'stressed';
    if (state.loneliness > 70)           return 'lonely';
    if (state.inspiration > 75 && state.energy > 50) return 'inspired';
    if (state.happiness > 78 && state.stress < 30)   return 'happy';
    if (state.happiness > 65 && state.stress < 40)   return 'calm';
    if (state.energy < 40 || state.hunger < 40)      return 'tired';
    return 'normal';
  }

  function getMoodPhrase() {
    const m = getMood();
    const phrases = {
      sick:      ['she feels a little under the weather.', 'she\'s pale and quiet today.'],
      tired:     ['she looks worn out.', 'her shoulders are a little heavy.'],
      stressed:  ['her hands are restless.', 'she seems wound up.'],
      lonely:    ['the room feels too quiet for her.', 'she keeps glancing at her phone.'],
      inspired:  ['she\'s humming softly to herself.', 'something about today feels open.'],
      happy:     ['she seems content.', 'there\'s a small smile on her face.'],
      calm:      ['she seems calm.', 'the day moves gently around her.'],
      normal:    ['she\'s just being herself.', 'a quiet, ordinary moment.'],
    };
    const p = phrases[m] || phrases.normal;
    return p[Math.floor(Math.random() * p.length)];
  }

  function serialize() {
    return { ...state };
  }
  function deserialize(d) {
    if (!d) return;
    Object.assign(state, d);
  }

  window.STATS = {
    state, tickDecay, apply, spend, clamp,
    isLow, isCritical, getDominantNeed,
    getMood, getMoodPhrase,
    serialize, deserialize,
  };
})();

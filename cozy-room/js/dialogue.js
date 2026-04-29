// ─── dialogue.js ───────────────────────────────────────────
// Dialogue lines pooled by mood, season, time, and bond tier.
// Randomly surfaces small thoughts; also handles activity-bound lines.

(function () {
  const POOLS = {
    // generic by mood
    mood: {
      normal: [
        'just another quiet morning.',
        'i forgot to set an alarm again.',
        'this song has been stuck in my head all day.',
        'i think i\'ll make tea soon.',
        'the air feels soft today.',
      ],
      happy: [
        'today is being kind to me.',
        'small things matter so much, don\'t they?',
        'i caught myself smiling for no reason.',
        'i\'m glad i\'m still here.',
      ],
      tired: [
        'my eyes are heavy.',
        'maybe a small nap would help.',
        'one more thing, then i\'ll rest. promise.',
        'the day got heavier without warning.',
      ],
      stressed: [
        'too many things knocking at once.',
        'i need to slow down.',
        'breathe. just breathe.',
        'i can\'t hear myself think.',
      ],
      lonely: [
        'the room feels bigger when i\'m alone.',
        'i wish someone would say hi.',
        'thank you for being here, even quietly.',
        'i opened the chat but didn\'t type anything.',
      ],
      inspired: [
        'i had an idea i don\'t want to forget.',
        'colors look more like themselves today.',
        'i could write something. maybe i will.',
      ],
      sick: [
        'my head feels foggy.',
        'i think i\'ll go easy today.',
        'a warm drink and a blanket, that\'s the plan.',
      ],
      calm: [
        'the light is just right.',
        'i could sit like this for a while.',
        'nothing urgent. just being.',
      ],
    },

    // weather-tinted thoughts
    weather: {
      rain: [
        'rain on the window is the best lullaby.',
        'i love this kind of weather, somehow.',
        'gray days are honest days.',
      ],
      snow: [
        'snow makes everything quieter.',
        'the world looks soft today.',
      ],
      wind: [
        'the windows keep humming.',
        'leaves are dancing out there.',
      ],
      clear: [
        'the sun is making the floor warm.',
        'a sunbeam moved across the desk.',
      ],
      cloudy: [
        'the sky looks like a soft sweater.',
      ],
    },

    // by hour
    time: {
      dawn: [
        'morning came earlier than i wanted.',
        'i\'ll watch the light shift for a moment.',
      ],
      morning: [
        'morning. let\'s try.',
        'the kettle is whispering.',
      ],
      noon: [
        'midday already?',
        'i should eat something soon.',
      ],
      afternoon: [
        'the light is golden right now.',
        'i could stretch and not regret it.',
      ],
      dusk: [
        'the sky is doing that pink thing.',
        'i love this time of day.',
      ],
      evening: [
        'i\'ll dim the lamp soon.',
        'feels like a closing-down kind of evening.',
      ],
      night: [
        'the city is sleeping. mostly.',
        'i should head to bed, but not yet.',
        'do you think the moon ever feels lonely?',
      ],
      late_night: [
        'i\'m not sure why i\'m still up.',
        'late thoughts are too honest sometimes.',
      ],
    },

    // bond-gated specials
    bond: {
      familiar: [
        'thanks for stopping by. i mean it.',
        'i was hoping you\'d come back.',
      ],
      warm: [
        'is it weird that this is my favorite part of the day?',
        'i feel a little less alone when you\'re here.',
      ],
      open: [
        'i\'m starting to believe in small good things.',
        'you don\'t have to do anything. just stay a little.',
      ],
      refuge: [
        'whatever happens out there, this room is okay.',
        'thank you. for choosing to keep showing up.',
      ],
    },

    seasonal: {
      spring: ['something is blooming again. inside, too.'],
      summer: ['the heat is heavy but the evenings are kind.'],
      autumn: ['things are letting go. that\'s allowed.'],
      winter: ['the world is rest, and so should i be.'],
    },
  };

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getRandomThought() {
    const mood    = window.STATS?.getMood() || 'normal';
    const phase   = window.TIME?.getDayPhase() || 'morning';
    const weather = window.TIME?.state?.weather || 'clear';
    const season  = window.TIME?.getSeason() || 'spring';
    const tier    = window.BOND?.tier()?.label || 'a stranger';

    const buckets = [];
    if (POOLS.mood[mood]) buckets.push({ pool: POOLS.mood[mood], w: 4 });
    if (POOLS.weather[weather]) buckets.push({ pool: POOLS.weather[weather], w: 2 });
    if (POOLS.time[phase]) buckets.push({ pool: POOLS.time[phase], w: 2 });
    if (POOLS.seasonal[season]) buckets.push({ pool: POOLS.seasonal[season], w: 1 });

    // bond gating
    if (tier === 'familiar' && POOLS.bond.familiar) buckets.push({ pool: POOLS.bond.familiar, w: 2 });
    if (tier === 'a friend' && POOLS.bond.warm)     buckets.push({ pool: POOLS.bond.warm, w: 2 });
    if (tier === 'someone close' && POOLS.bond.open) buckets.push({ pool: POOLS.bond.open, w: 3 });
    if (tier === 'a quiet refuge' && POOLS.bond.refuge) buckets.push({ pool: POOLS.bond.refuge, w: 3 });

    // weighted pick
    const total = buckets.reduce((s, b) => s + b.w, 0);
    let r = Math.random() * total;
    for (const b of buckets) {
      r -= b.w;
      if (r <= 0) return pickRandom(b.pool);
    }
    return pickRandom(POOLS.mood.normal);
  }

  function getActivityLine(actKey) {
    const a = window.ACTIVITIES[actKey];
    if (a && a.line) return pickRandom(a.line);
    return null;
  }

  function getOfflineGreeting(hours) {
    if (hours < 1) return 'oh — that was quick.';
    if (hours < 3) return 'welcome back. it was a quiet stretch.';
    if (hours < 6) return 'i was wondering when you\'d come by.';
    if (hours < 10) return 'oh, you\'re back. i thought maybe tomorrow.';
    return 'it\'s been a while. i\'m glad you came back.';
  }

  window.DIALOG = {
    getRandomThought, getActivityLine, getOfflineGreeting,
  };
})();

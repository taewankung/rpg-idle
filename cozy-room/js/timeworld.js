// ─── timeworld.js ──────────────────────────────────────────
// In-game clock, day-night cycle, season cycle, and weather.

(function () {
  const CFG = window.CFG;

  const state = {
    // total in-game seconds since game start
    totalGameSeconds: 0,
    // start at 7:00am of day 1, spring
    startHour: 7,
    weather: 'clear',
    // last weather roll hour (so we don't reroll multiple times in same hour)
    lastWeatherHour: -1,
    seasonOverride: null,
  };

  function getHour() {
    const totalHrs = state.totalGameSeconds / 3600;
    const h = (state.startHour + totalHrs) % 24;
    return h;
  }
  function getHourInt() { return Math.floor(getHour()); }

  function getMinuteInt() {
    const totalSec = state.totalGameSeconds + state.startHour * 3600;
    return Math.floor((totalSec / 60) % 60);
  }

  function getDayCount() {
    return Math.floor((state.startHour + state.totalGameSeconds / 3600) / 24);
  }

  function getDayOfWeek() {
    return getDayCount() % 7;
  }

  function getDayName() {
    return CFG.DAYNAMES[getDayOfWeek()];
  }

  function getSeason() {
    if (state.seasonOverride) return state.seasonOverride;
    const seasonIdx = Math.floor(getDayCount() / CFG.DAYS_PER_SEASON) % CFG.SEASONS.length;
    return CFG.SEASONS[seasonIdx];
  }

  function getDayPhase() {
    const h = getHour();
    if (h < 5)  return 'late_night';
    if (h < 8)  return 'dawn';
    if (h < 12) return 'morning';
    if (h < 14) return 'noon';
    if (h < 17) return 'afternoon';
    if (h < 19) return 'dusk';
    if (h < 22) return 'evening';
    return 'night';
  }

  function isNight() {
    const h = getHourInt();
    return h >= 19 || h < 6;
  }

  function isAsleep(charPose) {
    return charPose === 'sleep';
  }

  function tick(realDtSeconds, speed = 1) {
    state.totalGameSeconds += realDtSeconds * CFG.TIME_SCALE * speed;
    // weather roll once per in-game hour
    const hourInt = getHourInt() + getDayCount() * 24;
    if (hourInt !== state.lastWeatherHour) {
      state.lastWeatherHour = hourInt;
      rollWeather();
    }
  }

  function rollWeather() {
    const season = getSeason();
    const odds = CFG.WEATHER_ODDS[season] || CFG.WEATHER_ODDS.spring;
    // 70% chance keep current weather (less flicker)
    if (Math.random() < 0.7 && state.weather && state.weather !== undefined) {
      // small chance for weather to drift to nearby type
      return;
    }
    let r = Math.random();
    for (const key of Object.keys(odds)) {
      r -= odds[key];
      if (r <= 0) {
        state.weather = key;
        return;
      }
    }
    state.weather = 'clear';
  }

  function setHour(h) {
    state.startHour = h;
    state.totalGameSeconds = 0;
  }

  function clockString() {
    const h = getHourInt();
    const m = getMinuteInt();
    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }

  function dayString() {
    const dayName = getDayName();
    const season  = getSeason();
    const day     = getDayCount() + 1;
    return `${capitalize(dayName)} · ${capitalize(season)} · day ${day}`;
  }

  function capitalize(s) { return s[0].toUpperCase() + s.slice(1); }

  function applyOfflineHours(realHours) {
    // advance time by realHours (capped externally)
    state.totalGameSeconds += realHours * 3600 * CFG.TIME_SCALE;
    // re-roll weather a few times to land somewhere fresh
    state.lastWeatherHour = -1;
    rollWeather();
  }

  function serialize() {
    return {
      totalGameSeconds: state.totalGameSeconds,
      startHour: state.startHour,
      weather: state.weather,
      lastWeatherHour: state.lastWeatherHour,
    };
  }

  function deserialize(d) {
    if (!d) return;
    state.totalGameSeconds = d.totalGameSeconds || 0;
    state.startHour        = d.startHour ?? 7;
    state.weather          = d.weather || 'clear';
    state.lastWeatherHour  = d.lastWeatherHour ?? -1;
  }

  window.gameTime = state;
  window.TIME = {
    state, tick,
    getHour, getHourInt, getMinuteInt,
    getDayCount, getDayOfWeek, getDayName,
    getSeason, getDayPhase, isNight,
    setHour, rollWeather,
    clockString, dayString,
    applyOfflineHours,
    serialize, deserialize,
  };
})();

// ─── ui.js ─────────────────────────────────────────────────
// All DOM updates: stats panel, clock, mood, speech bubble,
// activity bar, modals (settings, diary, intro, offline).

(function () {
  const $ = id => document.getElementById(id);

  let speechTimer = null;

  function buildStatList() {
    const list = $('stat-list');
    list.innerHTML = '';
    for (const def of window.CFG.STAT_DEFS) {
      const li = document.createElement('li');
      li.className = 'stat';
      li.dataset.key = def.key;
      li.innerHTML = `
        <span class="stat-label">${def.label}</span>
        <div class="stat-bar"><div class="stat-fill" style="--c:${def.color}"></div></div>
      `;
      list.appendChild(li);
    }
  }

  function updateStats() {
    const s = window.STATS.state;
    for (const def of window.CFG.STAT_DEFS) {
      const li = document.querySelector(`#stat-list li[data-key="${def.key}"]`);
      if (!li) continue;
      const fill = li.querySelector('.stat-fill');
      let v = s[def.key];
      if (def.invert) v = 100 - v;
      fill.style.width = `${Math.round(v)}%`;
      fill.classList.toggle('low', v < 25);
    }
  }

  function updateBond() {
    const t = window.BOND.tier();
    $('bond-fill').style.width = `${Math.round(window.BOND.state.bond)}%`;
    $('bond-tier').textContent = t.label;
  }

  function updateClock() {
    $('clock').textContent = window.TIME.clockString();
    $('dayname').textContent = window.TIME.dayString();
  }

  function updateWeather() {
    const w = window.TIME.state.weather;
    $('weather-icon').textContent = window.CFG.WEATHER_ICONS[w] || '☀';
    $('weather-name').textContent = window.CFG.WEATHER_NAMES[w] || w;
  }

  function updateMoney() {
    $('money').textContent = Math.floor(window.STATS.state.money);
  }

  function updateName() {
    $('char-name').textContent = window.STATS.state.name || 'Lin';
  }

  let lastMoodSet = 0;
  function updateMood(force = false) {
    const now = performance.now();
    if (!force && now - lastMoodSet < 5000) return;
    lastMoodSet = now;
    $('char-mood').textContent = window.STATS.getMoodPhrase();
  }

  function showSpeech(text, durationMs = 4500) {
    const el = $('speech');
    $('speech-text').textContent = text;
    el.classList.remove('hidden');

    // position near character (approximate to canvas via getBoundingClientRect)
    positionSpeech();

    if (speechTimer) clearTimeout(speechTimer);
    speechTimer = setTimeout(() => {
      el.classList.add('hidden');
    }, durationMs);
  }

  function positionSpeech() {
    const stage = $('stage');
    const rect = stage.getBoundingClientRect();
    const sx = rect.width / 480;
    const sy = rect.height / 270;
    const cx = (window.CHAR.state.x) * sx;
    const cy = (window.CHAR.state.y - 30) * sy;
    const speech = $('speech');
    speech.style.left = `${rect.left + cx - 30}px`;
    speech.style.top  = `${rect.top + cy - 60}px`;
    // clamp within frame
    const frame = document.getElementById('frame').getBoundingClientRect();
    const sw = speech.getBoundingClientRect().width;
    const minX = frame.left + 12;
    const maxX = frame.right - sw - 12;
    let left = parseFloat(speech.style.left);
    if (left < minX) speech.style.left = `${minX}px`;
    if (left > maxX) speech.style.left = `${maxX}px`;
  }

  function updateActivityBar() {
    const cur = window.ACT.state.current;
    const bar = $('activity-bar');
    if (!cur || !cur.isPlayerInitiated) {
      bar.classList.add('hidden');
      return;
    }
    bar.classList.remove('hidden');
    $('ab-label').textContent = cur.def.label || cur.key;
    $('ab-fill').style.width = `${Math.round(window.ACT.progress() * 100)}%`;
  }

  function updateActionButtonState() {
    const cur = window.ACT.state.current;
    document.querySelectorAll('#actions .btn, #actions .btn-soft').forEach(b => {
      b.classList.toggle('active', !!(cur && cur.isPlayerInitiated && cur.key === b.dataset.action));
    });
  }

  // ─── modals ────────────────────────────────────────────────
  function openModal(id) { $(id)?.classList.remove('hidden'); }
  function closeModal(id) {
    const el = $(id);
    if (!el) return;
    el.classList.add('closing');
    setTimeout(() => {
      el.classList.add('hidden');
      el.classList.remove('closing');
    }, 200);
  }

  function buildDiary() {
    const wrap = $('diary-pages');
    const entries = window.SAVE.diary.entries;
    if (!entries.length) {
      wrap.innerHTML = `<div class="empty">no entries yet — small days haven't been written down.</div>`;
      return;
    }
    wrap.innerHTML = entries.map(e =>
      `<div class="entry"><div class="date">${e.dateLabel}</div><div class="text">${e.text}</div></div>`
    ).join('');
  }

  function openOffline(sim) {
    if (!sim) return;
    const list = $('offline-list');
    list.innerHTML = window.SAVE.buildOfflineSummary(sim).map(li => `<li>${li}</li>`).join('');
    const greeting = window.DIALOG.getOfflineGreeting(sim.realHours);
    const name = window.STATS.state.name || 'she';
    const hrsLabel = sim.realHours.toFixed(1);
    const cap = sim.wasCapped ? ' (capped — i didn\'t want to count too many)' : '';
    $('offline-text').textContent =
      `${greeting} ${name} was on her own for about ${hrsLabel} hours${cap}.`;
    openModal('offline-modal');
  }

  function openIntro() { openModal('intro-modal'); }

  function bindButtons() {
    document.querySelectorAll('#actions [data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = btn.dataset.action;
        if (a === 'diary')     return openModalDiary();
        if (a === 'settings')  return openSettings();
        if (a === 'check')     return playerCheckIn();
        // toggle: cancel if same activity
        const cur = window.ACT.state.current;
        if (cur && cur.isPlayerInitiated && cur.key === a) {
          window.ACT.cancel();
          return;
        }
        if (window.ACTIVITIES[a]) {
          window.ACT.start(a);
        }
      });
    });

    $('ab-cancel').addEventListener('click', () => window.ACT.cancel());

    document.querySelectorAll('[data-close]').forEach(b => {
      b.addEventListener('click', () => closeModal(b.dataset.close));
    });

    // settings
    $('opt-name').addEventListener('change', e => {
      const v = e.target.value.trim().slice(0, 14);
      if (v) {
        window.STATS.state.name = v;
        updateName();
      }
    });
    $('opt-music').addEventListener('input', e => {
      window.GAME.settings.musicVol = parseInt(e.target.value, 10) / 100;
    });
    $('opt-amb').addEventListener('input', e => {
      window.GAME.settings.ambientVol = parseInt(e.target.value, 10) / 100;
    });
    $('opt-speed').addEventListener('change', e => {
      window.GAME.settings.speed = parseFloat(e.target.value);
    });
    $('opt-grain').addEventListener('change', e => {
      const on = e.target.checked;
      window.GAME.settings.grain = on;
      document.getElementById('grain').style.display = on ? '' : 'none';
    });
    $('btn-newgame').addEventListener('click', () => {
      if (!confirm('Start over? everything will be reset.')) return;
      window.SAVE.clearAll();
      location.reload();
    });

    // intro
    $('intro-begin').addEventListener('click', () => {
      const v = $('intro-name').value.trim().slice(0, 14);
      if (v) window.STATS.state.name = v;
      updateName();
      closeModal('intro-modal');
      window.GAME.firstHello();
    });
  }

  function openModalDiary() { buildDiary(); openModal('diary-modal'); }
  function openSettings()   {
    $('opt-name').value = window.STATS.state.name || 'Lin';
    openModal('settings-modal');
  }

  function bindKeys() {
    document.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      const num = parseInt(e.key, 10);
      if (e.key === 'Escape') {
        // cascade close
        for (const id of ['intro-modal','offline-modal','diary-modal','settings-modal']) {
          if (!$(id).classList.contains('hidden')) {
            if (id !== 'intro-modal') closeModal(id);
            return;
          }
        }
        openSettings();
        return;
      }
      if (k === 'd') return openModalDiary();
      if (k === 'q') return playerCheckIn();
      if (!isNaN(num)) {
        const map = { 1:'eat', 2:'sleep', 3:'bathe', 4:'work', 5:'read',
                      6:'paint', 7:'exercise', 8:'clean', 9:'window' };
        if (map[num]) window.ACT.start(map[num]);
      }
    });

    window.addEventListener('resize', positionSpeech);
  }

  function playerCheckIn() {
    window.BOND.checkInBoost(window.TIME.getDayCount());
    window.ACT.start('check');
    updateBond();
  }

  function refreshAll() {
    updateClock();
    updateWeather();
    updateStats();
    updateBond();
    updateMoney();
    updateName();
    updateMood();
    updateActivityBar();
    updateActionButtonState();
  }

  window.UI = {
    buildStatList, refreshAll,
    updateStats, updateBond, updateClock, updateWeather, updateMoney,
    updateName, updateMood, updateActivityBar, updateActionButtonState,
    showSpeech, positionSpeech,
    openModal, closeModal, openOffline, openIntro,
    bindButtons, bindKeys,
    playerCheckIn,
  };
})();

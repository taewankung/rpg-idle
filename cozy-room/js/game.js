// ─── game.js ───────────────────────────────────────────────
// Main loop. init -> load save -> build UI -> run requestAnimationFrame.

(function () {
  const settings = {
    musicVol: 0.4,
    ambientVol: 0.6,
    speed: 1,
    grain: true,
  };

  const ctx = (() => {
    const c = document.getElementById('stage');
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return x;
  })();

  let lastT = performance.now();
  let saveAccum = 0;
  let thoughtAccum = 0;
  let nextThought = 12 + Math.random() * 18;
  let booted = false;

  function init() {
    window.UI.buildStatList();

    // Load settings
    const ls = window.SAVE.loadSettings();
    if (ls) Object.assign(settings, ls);
    document.getElementById('opt-music').value = Math.round(settings.musicVol * 100);
    document.getElementById('opt-amb').value   = Math.round(settings.ambientVol * 100);
    document.getElementById('opt-speed').value = String(settings.speed);
    document.getElementById('opt-grain').checked = !!settings.grain;
    document.getElementById('grain').style.display = settings.grain ? '' : 'none';

    // Load save
    const data = window.SAVE.load();
    if (data) {
      const lastNow = window.SAVE.applyLoaded(data);
      const sim = window.SAVE.applyOfflineProgress(lastNow);
      window.UI.bindButtons();
      window.UI.bindKeys();
      window.UI.refreshAll();
      booted = true;
      if (sim) window.UI.openOffline(sim);
    } else {
      window.UI.bindButtons();
      window.UI.bindKeys();
      window.UI.refreshAll();
      window.UI.openIntro();
      booted = true;
    }

    requestAnimationFrame(loop);

    // periodic autosave
    window.addEventListener('beforeunload', () => window.SAVE.save());
  }

  function firstHello() {
    setTimeout(() => {
      window.UI.showSpeech('hi. it\'s nice that someone\'s here.');
    }, 600);
  }

  function loop(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    const speed = settings.speed;

    // tick world (time + weather)
    window.TIME.tick(dt, speed);

    // pause stat decay if asleep (be kind)
    const asleep = window.CHAR.state.pose === 'sleep';
    if (!asleep) {
      window.STATS.tickDecay(dt, speed);
    }

    // bond drip (only while open / "watching")
    window.BOND.tickOrganic(dt, speed);

    // activities
    if (!window.ACT.isBusy()) {
      window.ACT.maybePickIdle();
    }
    window.ACT.tick(dt, speed);

    // character
    window.CHAR.update(dt, speed);

    // UI ticks
    window.UI.updateClock();
    window.UI.updateWeather();
    window.UI.updateStats();
    window.UI.updateBond();
    window.UI.updateMoney();
    window.UI.updateMood();
    window.UI.updateActivityBar();
    window.UI.updateActionButtonState();
    window.UI.positionSpeech();

    // ambient thoughts
    thoughtAccum += dt;
    if (thoughtAccum >= nextThought) {
      thoughtAccum = 0;
      nextThought = 18 + Math.random() * 25;
      // less likely if doing something
      if (!window.ACT.state.current ||
          (window.ACT.state.current && !window.ACT.state.current.isPlayerInitiated)) {
        const t = window.DIALOG.getRandomThought();
        if (t) window.UI.showSpeech(t);
      }
    }

    // autosave every 10s
    saveAccum += dt;
    if (saveAccum > 10) {
      saveAccum = 0;
      window.SAVE.save();
      window.SAVE.saveSettings(settings);
    }
  }

  function render() {
    ctx.clearRect(0, 0, 480, 270);
    window.ROOM.render(ctx);

    // character
    window.CHAR.render(ctx);

    // overlays (particles + lighting)
    window.ROOM.renderAfterCharacter(ctx);
  }

  window.GAME = { settings, init, firstHello };

  // boot when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

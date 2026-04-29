/* Bootstrap. */
(function () {
  function boot() {
    // 1. start the game state (loads or seeds)
    window.Game.start();

    // 2. catch up offline progress *after* state is loaded
    const summary = window.Game.catchUpOffline();

    // 3. wire UI
    window.UI.init();

    // 4. start the canvas scene loop
    window.Scene.init(document.getElementById("scene"));

    // 5. show offline modal if any
    if (summary && summary.kills > 0) {
      setTimeout(() => window.UI.showOfflineSummary(summary), 600);
    }

    // 6. autosave bookkeeping marker
    window.Game.save();
    window.UI.refresh();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

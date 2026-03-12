/* ============================================
   Fantasy Idle MMORPG - Main Entry Point
   ============================================ */

(function () {
    'use strict';

    // Create engine & UI
    const engine = new GameEngine();
    const ui = new UIManager(engine);

    // Initialize
    engine.init();
    ui.init();

    // Start the game loop
    engine.start();

    // Initial log
    ui.addLog('⚔️ Welcome to Fantasy Idle MMORPG!', 'system');
    ui.addLog('🌲 You arrive at Greenwood Forest...', 'system');
    ui.addLog('🔄 Auto Battle is ON. Sit back and watch!', 'system');

    // Save before closing
    window.addEventListener('beforeunload', () => {
        engine.saveGame();
    });

    // Expose for debugging (dev only)
    window.__game = { engine, ui };
})();

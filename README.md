# Fantasy Idle MMORPG

This is a simple idle-themed fantasy MMORPG game built with plain HTML, CSS, and JavaScript. It runs entirely in the browser and uses `localStorage` for saving progress.

## How to Run 🕹️

1. **Open the project folder** in your file explorer (`c:\workSpace\fantasyIdle`).
2. **Launch `index.html`** using your web browser:
   - Double-click the file, or
   - Right-click ➜ _Open with_ ➜ choose your preferred browser (Chrome, Edge, Firefox, etc.).
3. The game will load automatically. You can interact with UI panels, battle enemies, manage inventory, and more.

> 💾 Progress is saved automatically every 30 seconds and when you close the page.

## Development & Debugging 🔧

- All source files are located in the `js/` directory:
  - `data/gameData.js` – game configuration (classes, items, enemies, quests)
  - `core/engine.js` – game logic and simulation
  - `core/ui.js` – UI rendering and event handling
  - `main.js` – initialization and entry point
- To restart the game state, clear the browser's local storage or run `window.__game.engine.resetGame()` in the console.

Enjoy building or playing the idle adventure! 🎮

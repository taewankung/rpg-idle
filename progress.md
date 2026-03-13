Original prompt: เพิ่มระบบ “Offline Expedition System (Deep System, Low-Risk Integration)” ให้เกม Auto MMO RPG นี้ โดยต้อง implement จริงใน codebase เดิม ไม่ใช่ mock UI

- 2026-03-14: Inspected existing expedition prototype and integration points in `index.html`, `js/game.js`, `js/ui.js`, `js/save.js`, and `js/afk.js`.
- 2026-03-14: Locked low-risk design: keep expedition formulas/UI state in `js/offlineexpedition.js`, patch only minimal entry-point, save/load, AFK de-duplication, HUD, and key/Escape flow in core files.
- 2026-03-14: Existing repo already had an expedition script and script tag. Plan is to replace the shallow implementation with a deeper maintainable version while preserving the public/global API names used by the rest of the game.
- 2026-03-14: Rebuilt `js/offlineexpedition.js` into a full offline planning system with 6 expeditions, 5 strategies, duration options, build-based scoring, dynamic events, outcome grades, debrief/claim flow, HUD status, and backward-compatible save/load migration.
- 2026-03-14: Patched `js/game.js`, `js/ui.js`, and `js/save.js` only for the new `KeyX` entry point, HUD/menu wiring, and AFK de-duplication when an expedition run or pending debrief already owns the offline window.
- 2026-03-14: Added/updated Playwright coverage in `tests/offline-expedition.playwright.js` for start/save/load/resolve/no-double-reward/strategy effect/build effect/debrief panel/key+Escape flow/old-save compatibility.
- 2026-03-14: Validation passed with `npm run test:expedition`. Latest screenshots still show minor text density in the planning/debrief headers, but the panel is functional and readable enough for this pass.
- 2026-03-14: Interactive Playwright validation exposed a debrief layout issue: zone/duration/strategy/outcome grade were present in data but not clearly visible. Patched `js/offlineexpedition.js` header/layout so the debrief renders those fields explicitly above the reward columns.
- 2026-03-14: Follow-up UI fix for dungeon viewport sizing: when dungeon floor size (`20x20`) is smaller than the browser viewport, camera now centers the floor instead of pinning it to the top-left, and dungeon minimap viewport bounds are clamped to the visible dungeon area.

TODO / follow-up:
- Consider a v2 polish pass for summary typography and denser text wrapping in the expedition panel.
- Consider exposing `render_game_to_text` and deterministic time hooks if broader automated game coverage is needed later.

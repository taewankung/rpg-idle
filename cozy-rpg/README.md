# The Lantern‑Lit Atlas

A cozy 2D pixel-art idle RPG, presented as an illuminated leather codex.
Vanilla JS · HTML5 Canvas · localStorage · zero build step.

## Run

```bash
# from the repo root
python3 -m http.server 8090
# open http://127.0.0.1:8090/cozy-rpg/
```

Or, if you prefer the existing npm script:

```bash
npm run dev
# then visit http://127.0.0.1:8090/cozy-rpg/
```

## Desktop packaging

The whole game is a single `index.html` + a handful of static assets.
To ship it as a Windows / macOS desktop binary, wrap the folder with one of:

* **Tauri** — small native bundle (~2 MB), recommended.
* **Electron** — wider compatibility, larger bundle.
* **NW.js** — the simplest "drop in a folder, zip" path.

No source-level changes are required — the game runs in any modern browser.

## Aesthetic

* **Lantern‑lit storybook** — illuminated medieval atlas meets cozy pixel RPG.
* Display: *Jacquard 12* · UI labels: *Silkscreen* · numerals: *VT323* · narrative: *Cormorant Garamond*.
* Hand-drawn warm parchment, gold leaf accents, ember red, forest moss, twilight.
* All sprites are generated procedurally on `<canvas>` — no image assets.

## Systems shipped (MVP)

| System | Status |
|---|---|
| One hero (warrior class, customizable name) | ✅ |
| One town hub (6 buildings, 6 NPCs) | ✅ |
| 6 adventure zones (Meadow → Sky Island) | ✅ |
| Auto combat with 4 stances + auto-potion + retreat | ✅ |
| Loot drops, rarity (common → mythic) | ✅ |
| Equipment slots (weapon / armor / trinket) | ✅ |
| Stat & condition tracking (energy, hunger, mood, fatigue) | ✅ |
| 4 starter quests (kill / collect / explore / boss) | ✅ |
| Skill constellation tree (7 nodes, 3 branches) | ✅ |
| Save / load to localStorage | ✅ |
| Auto-save every 30 ticks + on visibility/unload | ✅ |
| Offline progress catch-up (capped at 10h) | ✅ |
| Animated diorama scene with parallax + weather + day/night | ✅ |
| Combat chronicle (rolling 80 entries) | ✅ |
| Modal flows (offline summary, level-up, settings) | ✅ |
| Keyboard shortcuts (I / Q / M / S / Esc) | ✅ |

## Files

```
cozy-rpg/
├── index.html
├── css/style.css
└── js/
    ├── data.js     # zones, monsters, items, quests, skills, town
    ├── sprites.js  # canvas sprite generators (hero, monsters, props, item icons)
    ├── scene.js    # animated diorama renderer
    ├── game.js     # state machine, combat, idle tick, save/load, offline catch-up
    ├── ui.js       # DOM bindings + refresh
    └── main.js     # bootstrap
```

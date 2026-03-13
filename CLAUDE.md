# Auto MMO RPG

## Architecture
- Vanilla JS, no frameworks or build tools — plain `<script>` tags in `index.html`
- All code uses globals on `window` (no ES modules)
- HTML5 Canvas 2D rendering, all sprites generated via Canvas API (no image files)
- Web Audio API oscillators for sound (no audio files)
- localStorage for save/load

## File load order (dependency matters)
config → sound → chat → sprites → map → items → combat → entities → town → bot → save → atmosphere → ui → game

## Key conventions
- `TILE = 32`, `MAP_W = 50`, `MAP_H = 50`
- Entity types: `entityType` field — `'player'`, `'monster'`, `'npc'`
- Pathfinding: A* in `map.findPath()`, max 20-tile radius, 8-directional
- Movement: `followPath(ent, dt)` / `assignPath(ent, wx, wy, maxR)` shared by bot + NPCs
- Sprites: `genSprite(name, w, h, drawFn)` caches to `spriteCache[name]`
- Bot AI states: idle → roaming → approaching → combat → looting → retreating
- Items: `{name, type, rarity, stats, level, value}`
- Settings saved separately from game save (persist across New Game)

## Common pitfalls
- Bot must ONLY target `entityType === 'monster'` — never NPCs or players
- `game.killCount` and `game.sessionExp` track player-only stats
- Equipment stats are baked into player stats — don't double-apply on load
- Sound system has a `ready` flag — no sounds before `sfx.startFadeIn()` is called
- Town NPC positions use `const cx/cy` in town.js (file-scope)

## Commands
- `npm start` — serve on default port
- `npm run dev` — serve on port 8090

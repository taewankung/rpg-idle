# Auto MMO RPG

## Architecture
- Vanilla JS, no frameworks or build tools — plain `<script>` tags in `index.html`
- All code uses globals on `window` (no ES modules)
- HTML5 Canvas 2D rendering, all sprites generated via Canvas API (no image files)
- Web Audio API oscillators for sound (no audio files)
- localStorage for save/load

## File load order (dependency matters)
config → sound → chat → sprites → map → items → combat → entities → town → dungeon → pet → quest → talents → worldboss → party → achievements → leaderboard → crafting → worldmap → pvp → classchange → statpoints → jobsystem → afk → enchant → guild → gacha → bot → save → atmosphere → ui → game

## All Systems (33 JS files)
- **Core**: config, sound, chat, sprites, map, items, combat, entities, atmosphere
- **Town**: town (shop, healer NPCs)
- **Content**: dungeon (procedural floors), pet, quest, worldboss, party
- **Progression**: talents (talent tree), jobsystem (job lv 1-30, skill points, passives), statpoints (6 stats: STR/VIT/INT/DEX/AGI/LUK, evasion system)
- **World**: worldmap (3 zones: Forest Lv1-10, Desert Lv10-20, Ice Lv20-30 with zone portals)
- **Competition**: pvp (arena 1v1), achievements, leaderboard
- **Social**: guild (quests, levels, shop)
- **Economy**: crafting (anvil NPC, recipes), enchant (+0 to +10), gacha (3 banners, pity)
- **Systems**: classchange (8 advanced classes), afk (offline rewards)
- **Engine**: bot (AI state machine), save (localStorage), ui (HUD, TAB menu, all panels), game (main loop, input)

## Key conventions
- `TILE = 32`, `MAP_W = 50`, `MAP_H = 50`
- Entity types: `entityType` field — `'player'`, `'monster'`, `'npc'`
- Pathfinding: A* in `map.findPath()`, max 20-tile radius, 8-directional
- Movement: `followPath(ent, dt)` / `assignPath(ent, wx, wy, maxR)` shared by bot + NPCs
- Sprites: `genSprite(name, w, h, drawFn)` caches to `spriteCache[name]`
- Bot AI states: idle → roaming → approaching → combat → looting → retreating
- Items: `{name, type, rarity, stats, level, value}`
- Settings saved separately from game save (persist across New Game)
- New systems pattern: create JS file → add `<script>` in index.html → add generateSprites/initTownNPC in startGame() → add update hooks → add click handlers (priority ordered) → add keyboard shortcuts → add Escape cascade → add render calls → add save/load

## Integration points
- **Click handler priority**: AFK popup → TAB menu → Help → Settings → Inventory → Stats → Achievements → Leaderboard → Talents → Crafting → PvP → ClassChange → Enchant → Guild → Gacha → Skill Panel → Shop → Quest → Dungeon → Party → Pet → Town NPCs → Bot toggle
- **Escape cascade**: TAB menu → Help → Achievements → Leaderboard → Talents → Crafting → PvP → ClassChange → Enchant → Guild → Gacha → Skill Panel → Quest → Shop → Inventory → Settings
- **Keyboard**: SPACE(bot), I(items), C(stats), B(skills), T(talents), K(craft), N(enchant), G(guild), U(summon), P(pvp), J(class), H(achieve), L(ranks), M(mute), F(portal/zone), TAB(menu), ESC(cascade)

## Player object key fields
- Base: className, name, level, exp, gold, hp/maxHp, mp/maxMp, atk, def, spd, crit
- Job: jobLevel, jobExp, skillPoints, skillLevels[4], _jobPassives
- Stats: evasion, dropRate, critDmg, matk (from statPointSystem)
- Equipment: equipment.weapon/armor/accessory, inventory[]

## Common pitfalls
- Bot must ONLY target `entityType === 'monster'` — never NPCs or players
- `game.killCount` and `game.sessionExp` track player-only stats
- Equipment stats are baked into player stats — don't double-apply on load
- Sound system has a `ready` flag — no sounds before `sfx.startFadeIn()` is called
- Town NPC positions use `const cx/cy` in town.js (file-scope)
- Zone tiles (10-17) need `worldMap.getTileSprite()` fallback in drawMapTiles
- Zone monsters use `ZONE_MON_DATA` not `MON_DATA`
- Use defensive `typeof` checks for all optional systems

## Commands
- `npm start` — serve on default port
- `npm run dev` — serve on port 8090

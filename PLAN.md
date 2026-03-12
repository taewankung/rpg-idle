# RPG Idle → Top-Down 2D MMORPG Rewrite Plan

## Overview
เปลี่ยนจาก idle RPG แบบ text/panel เป็น **top-down 2D map** ที่ตัวละครเดินเอง ตีมอนเอง
ใช้ **Phaser 3** + **pixel art sprites** (free asset packs) + **full screen map**

---

## Phase 1 MVP Scope
- 1 zone map (Greenwood Forest) — Tiled tilemap 50×40 @ 16px
- ตัวละครเดินหามอน + ตีอัตโนมัติ (Auto-Bot FSM)
- มอน spawn/respawn บน map
- Combat system ใช้สูตรเดิมจาก engine.js
- Loot drop + auto pickup
- Basic HUD (HP/MP bar, level, gold, battle log)
- Save/Load ผ่าน localStorage

---

## Tech Stack
| Component | Technology |
|-----------|-----------|
| Game Engine | Phaser 3.80.1 (CDN) |
| Art Style | Pixel art 16×16 (free packs) |
| Map Editor | Tiled → JSON export |
| Physics | Phaser Arcade Physics |
| Build Tools | None (script tags) |

---

## Project Structure
```
/rpg-idle/
├── index.html                    # Phaser CDN + script tags
├── assets/
│   ├── tilesets/overworld.png    # 16×16 tileset
│   ├── sprites/                  # Player + enemy spritesheets
│   ├── ui/                       # HUD icons
│   └── maps/greenwood.json       # Tiled JSON
├── js/
│   ├── data/gameData.js          # KEEP — all game config
│   ├── core/GameState.js         # Headless state manager (from engine.js)
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── PreloadScene.js
│   │   ├── GameScene.js          # Main scene (map, entities, systems)
│   │   └── HudScene.js           # Overlay HUD
│   ├── entities/
│   │   ├── Player.js             # Arcade Sprite
│   │   └── Enemy.js              # Arcade Sprite + HP bar
│   ├── systems/
│   │   ├── AutoBotSystem.js      # FSM: IDLE→WALK→ATTACK→LOOT
│   │   ├── CombatSystem.js       # Sprites ↔ GameState bridge
│   │   ├── LootSystem.js         # Drop + pickup
│   │   └── SpawnSystem.js        # Enemy respawn
│   └── main.js                   # Phaser config + launch
```

---

## Auto-Bot AI (FSM)
```
IDLE → (find nearest enemy) → WALKING_TO_ENEMY → (in range) → ATTACKING
  ↑                                                               |
  +--- (no loot) ←── (enemy died) ──→ (loot) → WALKING_TO_LOOT --+
```
- Movement: `physics.moveToObject()` — ไม่ต้อง pathfinding
- Speed: `60 + SPD×2` px/s
- Anti-stuck: ตรวจทุก 0.5s → สุ่มทิศใหม่ถ้าไม่ขยับ

---

## Existing Code Reuse
| File | Action |
|------|--------|
| `gameData.js` | **KEEP** ทั้งหมด |
| `engine.js` | **EXTRACT** → `GameState.js` (combat, stats, inventory, leveling, save/load) |
| `ui.js` | **DISCARD** → Phaser scenes แทน |
| `style.css` | **DISCARD** → เก็บ color values เป็น reference |

---

## Implementation Steps

| Step | Description | Key Files |
|------|-------------|-----------|
| 1 | Scaffold + Phaser boot | `index.html`, `main.js`, scenes |
| 2 | GameState extraction | `GameState.js` |
| 3 | Tilemap (Tiled → JSON) | `greenwood.json`, tileset |
| 4 | Player + Camera | `Player.js`, `GameScene.js` |
| 5 | Enemy + SpawnSystem | `Enemy.js`, `SpawnSystem.js` |
| 6 | CombatSystem | `CombatSystem.js` |
| 7 | AutoBotSystem | `AutoBotSystem.js` |
| 8 | LootSystem | `LootSystem.js` |
| 9 | HUD | `HudScene.js` |
| 10 | Save/Load + Polish | GameState, scenes |

---

## Free Asset Packs
- **Tileset**: "Serene Village" by LimeZu (itch.io)
- **Characters**: "Mystic Woods" by Game Endeavor (itch.io)
- **Enemies**: "Monsters Creatures Fantasy" by Luiz Melo (itch.io)
- **Fallback**: Colored rectangles/circles as placeholder

---

## HUD Layout
```
[HP ████████░░] 85/100  [MP ████░░] 30/50
Lv.3 Warrior                    Gold: 245

          (game world + floating damage)

[Killed Slime! +10 Gold +10 EXP]
```

---

## Future Phases
- Phase 2: Multiple zones, zone transitions, more enemies
- Phase 3: Inventory UI, Equipment UI, Shop UI (all in Phaser)
- Phase 4: Dungeon system, Quest UI
- Phase 5: Offline progress, Prestige system

# Auto MMO RPG

**A fully autonomous 2D pixel-art idle RPG that plays itself — built entirely with vanilla JavaScript and HTML5 Canvas.**

![Game Screenshot](/assets/screenshot/screenshot-map.jpeg)

## Features

### Core
- 4 unique classes: Knight, Mage, Ranger, Priest — each with 4 skills
- Autonomous bot AI with A* pathfinding, stuck detection, and smart combat
- Dynamic loot system with 5 rarity tiers (Common to Legendary)
- NPC players that roam, fight, and level up independently
- Day/night cycle with atmospheric lighting
- Oscillator-based sound effects (no audio files needed)
- Auto-save/load with localStorage

### World & Content
- 3 overworld zones: Forest (Lv1-10), Desert (Lv10-20), Ice (Lv20-30) with zone portals
- 5-floor procedural dungeon with lava hazards, treasure chests, and a Demon Lord boss
- World Boss encounters with AoE mechanics and damage rankings
- Town with shop merchant and healing shrine

### Progression
- Job level system (Lv1-30) with skill points and passive bonuses
- 6-stat point allocation: STR, VIT, INT, DEX, AGI, LUK with per-stat effects
- Talent/skill tree with 2 specialization branches per class
- 8 advanced classes via class change quests
- Enchantment system (+0 to +10) for gear upgrading
- AFK/offline rewards system

### Systems
- Pet companion system with 5 pet types and unique abilities
- Quest system with 5 quest types and a quest board NPC
- Crafting system with anvil NPC and recipes
- PvP arena with 1v1 matchmaking
- Guild system with guild quests, levels, and guild shop
- Gacha summoning with 3 banners and pity system
- Achievement system with unlockable titles
- Leaderboard rankings

### UI & Quality of Life
- Minimap with real-time entity tracking and dungeon floor info
- TAB menu for quick access to all panels
- Dungeon HUD with monster count, stairs status, and boss HP bar
- Kill streak notifications and screen shake effects
- World chat with NPC messages
- Settings panel with game speed, volume, and display toggles

## How to Play

- Open `index.html` in any modern browser
- Select a class and click "Start Game"
- The bot plays automatically — watch or take manual control

### Controls

| Key | Action |
|-----|--------|
| SPACE | Toggle bot AI on/off |
| WASD / Arrows | Move manually (bot off) |
| Q/W/E/R | Use skills 1-4 |
| I | Inventory |
| C | Character stats & stat allocation |
| T | Talent tree |
| B | Skill panel |
| K | Crafting |
| N | Enchant |
| G | Guild |
| U | Gacha summon |
| P | PvP arena |
| J | Class change |
| H | Achievements |
| L | Leaderboard |
| F | Enter dungeon portal / Descend stairs / Change zone |
| M | Mute audio |
| TAB | Quick menu |
| ESC | Close panels / Settings |

## Tech Stack

- Vanilla JavaScript (no frameworks, no build tools)
- HTML5 Canvas for rendering
- Web Audio API for sound synthesis
- localStorage for save/load
- Zero external dependencies

## Run Locally

```bash
npm start
# or
npm run dev        # port 8090
# or just open index.html directly
```

## Project Structure

```
js/
  config.js         # Game constants, class definitions, and configuration
  sound.js          # Oscillator-based sound effects via Web Audio API
  chat.js           # World chat system with NPC messages
  sprites.js        # Pixel-art sprite rendering and animations
  map.js            # World map, tile rendering, pathfinding helpers
  items.js          # Loot tables, item generation, and rarity tiers
  combat.js         # Combat mechanics, skills, and damage calculations
  entities.js       # Player, monster, and NPC entity definitions
  town.js           # Town NPCs, shop merchant, and healing shrine
  dungeon.js        # 5-floor procedural dungeon with boss fight
  pet.js            # Pet companion system with soul gems and pet AI
  quest.js          # Quest board, 5 quest types, tracking, and rewards
  talents.js        # Talent/skill tree with 2 branches per class
  worldboss.js      # World boss encounters with AoE and rankings
  party.js          # Party system for group content
  achievements.js   # Achievement tracking and title unlocks
  leaderboard.js    # Player ranking system
  crafting.js       # Crafting recipes and anvil NPC
  worldmap.js       # Multi-zone world with portals and transitions
  pvp.js            # PvP arena 1v1 matchmaking
  classchange.js    # 8 advanced class change quests
  statpoints.js     # 6-stat allocation system (STR/VIT/INT/DEX/AGI/LUK)
  jobsystem.js      # Job levels, skill points, and passive bonuses
  afk.js            # AFK/offline rewards calculator
  enchant.js        # Equipment enchantment (+0 to +10)
  guild.js          # Guild quests, levels, and guild shop
  gacha.js          # Gacha summoning with banners and pity
  bot.js            # Autonomous bot AI with state machine and combat
  save.js           # Auto-save/load system using localStorage
  atmosphere.js     # Day/night cycle and atmospheric lighting
  ui.js             # HUD, menus, minimap, and all panels
  game.js           # Main game loop, input handling, and bootstrap
```

## Credits

Built with [Claude Code](https://claude.ai/claude-code)

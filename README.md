# Auto MMO RPG

**A fully autonomous 2D pixel-art idle RPG that plays itself — built entirely with vanilla JavaScript and HTML5 Canvas.**

![Game Screenshot](/assets/screenshot/screenshot-map.jpeg)

## Features

- 4 unique classes: Knight, Mage, Ranger, Priest — each with 4 skills
- Autonomous bot AI with A* pathfinding, stuck detection, and smart combat
- 5 monster types including a Dragon boss with fire breath AoE
- Dynamic loot system with 5 rarity tiers (Common to Legendary)
- NPC players that roam, fight, and level up independently
- Town with shop merchant and healing shrine
- Day/night cycle with atmospheric lighting
- Oscillator-based sound effects (no audio files needed)
- Auto-save/load with localStorage
- Settings panel with game speed, volume, and display toggles
- Kill streak notifications and screen shake effects
- Minimap with real-time entity tracking
- World chat with NPC messages

## How to Play

- Open `index.html` in any modern browser
- Select a class and click "Start Game"
- The bot plays automatically — watch or take manual control
- Press **SPACE** to toggle bot AI on/off
- **WASD** to move manually (when bot is off)
- **Q/W/E/R** for skills
- **I** for inventory, **C** for character stats
- **ESC** for settings
- **M** to mute audio
- Click monsters to target them

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
  atmosphere.js   # Day/night cycle and atmospheric lighting
  bot.js          # Autonomous bot AI with A* pathfinding and combat logic
  chat.js         # World chat system with NPC messages
  combat.js       # Combat mechanics, skills, and damage calculations
  config.js       # Game constants, class definitions, and configuration
  entities.js     # Player, monster, and NPC entity definitions
  game.js         # Main game loop, initialization, and state management
  items.js        # Loot tables, item generation, and rarity tiers
  map.js          # World map, tile rendering, and collision detection
  save.js         # Auto-save/load system using localStorage
  sound.js        # Oscillator-based sound effects via Web Audio API
  sprites.js      # Pixel-art sprite rendering and animations
  town.js         # Town NPCs, shop merchant, and healing shrine
  ui.js           # HUD, menus, minimap, and settings panel
```

## Credits

Built with [Claude Code](https://claude.ai/claude-code)

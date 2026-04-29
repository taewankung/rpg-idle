/* Static data — zones, monsters, items, quests, skills, town */
window.GameData = (function () {

  const RARITY = {
    common:   { name: "Common",    color: "#8a8478", weight: 100, mult: 1.0 },
    uncommon: { name: "Uncommon",  color: "#5a7a4f", weight: 50,  mult: 1.4 },
    rare:     { name: "Rare",      color: "#3a6e9e", weight: 18,  mult: 1.9 },
    epic:     { name: "Epic",      color: "#7a4a8a", weight: 6,   mult: 2.6 },
    legend:   { name: "Legendary", color: "#c89b3c", weight: 1.5, mult: 3.6 },
    mythic:   { name: "Mythic",    color: "#d04a6e", weight: 0.2, mult: 5.0 },
  };

  const ZONES = [
    {
      id: "meadow", name: "Green Meadow",
      lvMin: 1, lvMax: 4, unlock: 0,
      flavor: "Soft hills humming with crickets and clover.",
      palette: { sky:["#fcd9a3","#f6b27e"], hills:["#8db26a","#5a7a4f"], grass:"#6e9555", accent:"#d97842" },
      props: ["flower","rock-sm","tree-sm"],
      weather: ["sunny","sunny","sunny","sunny","cloudy"],
      monsters: ["slime-grass","sparrow","beetle"],
      boss: "honey-bear",
      mats: ["herb","mushroom","slime-gel"],
      progressGoal: 50
    },
    {
      id: "forest", name: "Whispering Forest",
      lvMin: 3, lvMax: 8, unlock: 3,
      flavor: "Older than the town. The leaves know your name.",
      palette: { sky:["#a4c8e4","#5a8aa8"], hills:["#3a5a3a","#2a4030"], grass:"#3e6240", accent:"#5a7a4f" },
      props: ["tree-tall","mushroom","stump"],
      weather: ["sunny","cloudy","cloudy","rainy"],
      monsters: ["slime-leaf","wolf-pup","bandit"],
      boss: "elder-stag",
      mats: ["wood","mushroom","sap","feather"],
      progressGoal: 80
    },
    {
      id: "cave", name: "Crystal Cave",
      lvMin: 6, lvMax: 12, unlock: 6,
      flavor: "A throat of stone that hums when you whisper.",
      palette: { sky:["#2a1a4a","#0a0828"], hills:["#3a2a5a","#1a0d2a"], grass:"#1a1430", accent:"#7a4a8a" },
      props: ["crystal","crystal-tall","rock-sm"],
      weather: ["dim","dim","dim"],
      monsters: ["bat","crystal-slime","kobold"],
      boss: "crystal-golem",
      mats: ["crystal","iron-ore","silver-ore","gemstone"],
      progressGoal: 110
    },
    {
      id: "ruins", name: "Forgotten Ruins",
      lvMin: 10, lvMax: 16, unlock: 10,
      flavor: "Marble bones half-swallowed by the moss.",
      palette: { sky:["#7a8aa8","#3a4868"], hills:["#5a6a55","#3a4838"], grass:"#3a4838", accent:"#c89b3c" },
      props: ["pillar","statue","rune-stone"],
      weather: ["cloudy","misty","cloudy"],
      monsters: ["skeleton","wraith","stone-guardian"],
      boss: "lich-warden",
      mats: ["ancient-relic","gold-coin","magic-dust","cracked-tablet"],
      progressGoal: 150
    },
    {
      id: "tower", name: "Ancient Tower",
      lvMin: 14, lvMax: 22, unlock: 14,
      flavor: "Each step climbs further from the world below.",
      palette: { sky:["#3a2a5a","#1a1430"], hills:["#5a4868","#3a2a48"], grass:"#2a1a4a", accent:"#d97842" },
      props: ["pillar","brazier","arch"],
      weather: ["stormy","stormy","cloudy"],
      monsters: ["wraith","sorcerer","golem-iron"],
      boss: "tower-warden",
      mats: ["magic-dust","silver-ore","ancient-relic","scroll"],
      progressGoal: 200
    },
    {
      id: "skyisle", name: "Sky Island",
      lvMin: 20, lvMax: 30, unlock: 20,
      flavor: "Where clouds keep their gardens, and dragons keep their grudges.",
      palette: { sky:["#f6b27e","#d97842"], hills:["#a45a3a","#6a3a28"], grass:"#8a5a3a", accent:"#f3c963" },
      props: ["cloud","feather-tree","sun-stone"],
      weather: ["sunny","windy","sunny"],
      monsters: ["griffon","skyserpent","cherub"],
      boss: "sky-dragon",
      mats: ["cloud-silk","sun-stone","dragon-fang","feather"],
      progressGoal: 320
    }
  ];

  const MONSTERS = {
    "slime-grass":   { name: "Grass Slime",  hp: 18,  atk: 4,  def: 1, exp: 6,  gold: 3,  drop: ["slime-gel","herb"] },
    "sparrow":       { name: "Field Sparrow",hp: 14,  atk: 5,  def: 0, exp: 7,  gold: 4,  drop: ["feather"], wings: true },
    "beetle":        { name: "Iron Beetle",  hp: 24,  atk: 3,  def: 4, exp: 8,  gold: 5,  drop: ["iron-ore"] },
    "honey-bear":    { name: "Honey Bear",   hp: 80,  atk: 10, def: 4, exp: 40, gold: 35, drop: ["honey","bear-claw"], boss: true },

    "slime-leaf":    { name: "Leaf Slime",   hp: 32,  atk: 7,  def: 2, exp: 12, gold: 6,  drop: ["slime-gel","mushroom"] },
    "wolf-pup":      { name: "Wolf Pup",     hp: 38,  atk: 11, def: 2, exp: 16, gold: 8,  drop: ["fang","fur"] },
    "bandit":        { name: "Forest Bandit",hp: 50,  atk: 13, def: 5, exp: 22, gold: 18, drop: ["coin-pouch","dagger"] },
    "elder-stag":    { name: "Elder Stag",   hp: 220, atk: 18, def: 8, exp: 90, gold: 80, drop: ["antler-crown","fur"], boss: true },

    "bat":           { name: "Cave Bat",     hp: 28,  atk: 9,  def: 1, exp: 14, gold: 6,  drop: ["wing","fang"], wings: true },
    "crystal-slime": { name: "Crystal Slime",hp: 60,  atk: 12, def: 6, exp: 28, gold: 20, drop: ["crystal","slime-gel"] },
    "kobold":        { name: "Mine Kobold",  hp: 70,  atk: 15, def: 4, exp: 32, gold: 24, drop: ["iron-ore","silver-ore"] },
    "crystal-golem": { name: "Crystal Golem",hp: 380, atk: 22, def: 14,exp: 160,gold: 140,drop: ["heart-crystal","gemstone"], boss: true },

    "skeleton":      { name: "Stone Skeleton",hp:90,  atk: 18, def: 6, exp: 42, gold: 32, drop: ["bone","cracked-tablet"] },
    "wraith":        { name: "Pale Wraith",   hp:110, atk: 24, def: 4, exp: 55, gold: 45, drop: ["magic-dust","scroll"] },
    "stone-guardian":{ name: "Stone Guardian",hp:160, atk: 20, def: 16,exp: 70, gold: 55, drop: ["ancient-relic"] },
    "lich-warden":   { name: "Lich Warden",   hp:620, atk: 32, def: 18,exp:280, gold:240, drop: ["lich-amulet","scroll","ancient-relic"], boss: true },

    "sorcerer":      { name: "Tower Sorcerer",hp:140, atk: 28, def: 6, exp: 72, gold: 60, drop: ["scroll","magic-dust"] },
    "golem-iron":    { name: "Iron Golem",    hp:240, atk: 26, def: 22,exp:110, gold: 90, drop: ["iron-core","silver-ore"] },
    "tower-warden":  { name: "Tower Warden",  hp:880, atk: 38, def: 22,exp:380, gold:320, drop: ["warden-cape","scroll","ancient-relic"], boss: true },

    "griffon":       { name: "Sky Griffon",   hp:200, atk: 32, def: 10,exp:120, gold:100, drop: ["feather","cloud-silk"], wings: true },
    "skyserpent":    { name: "Sky Serpent",   hp:240, atk: 36, def: 8, exp:140, gold:115, drop: ["scale","sun-stone"] },
    "cherub":        { name: "Stone Cherub",  hp:180, atk: 28, def: 14,exp:115, gold:105, drop: ["wing","cloud-silk"], wings: true },
    "sky-dragon":    { name: "Aurelin, the Sky Dragon", hp:1500, atk:55, def:28, exp:900, gold:780, drop:["dragon-fang","sun-stone","heart-crystal"], boss: true },
  };

  const ITEMS = {
    /* materials */
    "herb":           { name: "Forest Herb",   type: "material", rarity: "common",   value: 4 },
    "mushroom":       { name: "Wild Mushroom", type: "material", rarity: "common",   value: 5 },
    "slime-gel":      { name: "Slime Gel",     type: "material", rarity: "common",   value: 3 },
    "wood":           { name: "Sturdy Wood",   type: "material", rarity: "common",   value: 6 },
    "sap":            { name: "Tree Sap",      type: "material", rarity: "uncommon", value: 9 },
    "feather":        { name: "Soft Feather",  type: "material", rarity: "common",   value: 5 },
    "fur":            { name: "Wolf Fur",      type: "material", rarity: "uncommon", value: 10 },
    "fang":           { name: "Sharp Fang",    type: "material", rarity: "uncommon", value: 12 },
    "wing":           { name: "Bat Wing",      type: "material", rarity: "uncommon", value: 9 },
    "iron-ore":       { name: "Iron Ore",      type: "material", rarity: "uncommon", value: 14 },
    "silver-ore":     { name: "Silver Ore",    type: "material", rarity: "rare",     value: 28 },
    "crystal":        { name: "Cave Crystal",  type: "material", rarity: "rare",     value: 32 },
    "gemstone":       { name: "Cut Gemstone",  type: "material", rarity: "epic",     value: 75 },
    "magic-dust":     { name: "Magic Dust",    type: "material", rarity: "rare",     value: 40 },
    "ancient-relic":  { name: "Ancient Relic", type: "material", rarity: "epic",     value: 120 },
    "scroll":         { name: "Faded Scroll",  type: "material", rarity: "rare",     value: 35 },
    "cracked-tablet": { name: "Cracked Tablet",type: "material", rarity: "uncommon", value: 18 },
    "bone":           { name: "Old Bone",      type: "material", rarity: "common",   value: 7 },
    "honey":          { name: "Wild Honey",    type: "material", rarity: "uncommon", value: 16 },
    "bear-claw":      { name: "Bear's Claw",   type: "material", rarity: "rare",     value: 38 },
    "antler-crown":   { name: "Antler Crown",  type: "trinket",  rarity: "epic",     value: 220, stats: { atk: 4, mag: 6, luk: 3 } },
    "heart-crystal":  { name: "Heart Crystal", type: "material", rarity: "legend",   value: 480 },
    "iron-core":      { name: "Iron Core",     type: "material", rarity: "epic",     value: 140 },
    "lich-amulet":    { name: "Lich's Amulet", type: "trinket",  rarity: "legend",   value: 720, stats: { mag: 12, mp: 30, luk: 4 } },
    "warden-cape":    { name: "Warden Cape",   type: "armor",    rarity: "legend",   value: 820, stats: { def: 22, hp: 60 } },
    "cloud-silk":     { name: "Cloud Silk",    type: "material", rarity: "epic",     value: 180 },
    "sun-stone":      { name: "Sun Stone",     type: "material", rarity: "legend",   value: 520 },
    "scale":          { name: "Serpent Scale", type: "material", rarity: "rare",     value: 60 },
    "dragon-fang":    { name: "Dragon Fang",   type: "material", rarity: "mythic",   value: 1800 },
    "coin-pouch":     { name: "Coin Pouch",    type: "consumable",rarity:"uncommon",  value: 0, gold: 50 },
    "dagger":         { name: "Bandit Dagger", type: "weapon",   rarity: "uncommon", value: 80, stats: { atk: 8, crit: 4 } },

    /* equipment */
    "worn-sword":     { name: "Worn Sword",    type: "weapon", rarity: "common",   value: 30,  stats: { atk: 4 } },
    "iron-sword":     { name: "Iron Sword",    type: "weapon", rarity: "uncommon", value: 120, stats: { atk: 10, crit: 2 } },
    "silver-blade":   { name: "Silver Blade",  type: "weapon", rarity: "rare",     value: 320, stats: { atk: 18, crit: 5 } },
    "lantern-spear":  { name: "Lantern Spear", type: "weapon", rarity: "epic",     value: 760, stats: { atk: 28, crit: 4, mag: 6 } },

    "patched-tunic":  { name: "Patched Tunic", type: "armor",  rarity: "common",   value: 24,  stats: { def: 3 } },
    "leather-vest":   { name: "Leather Vest",  type: "armor",  rarity: "uncommon", value: 90,  stats: { def: 8, eva: 2 } },
    "moss-cloak":     { name: "Moss Cloak",    type: "armor",  rarity: "rare",     value: 240, stats: { def: 14, eva: 6, luk: 2 } },

    "copper-ring":    { name: "Copper Ring",   type: "trinket",rarity: "common",   value: 22,  stats: { luk: 1 } },
    "lucky-charm":    { name: "Lucky Charm",   type: "trinket",rarity: "uncommon", value: 88,  stats: { luk: 4, crit: 2 } },

    /* consumables */
    "potion-sm":      { name: "Small Potion",  type: "consumable", rarity: "common", value: 14, heal: 30 },
    "potion-md":      { name: "Honey Potion",  type: "consumable", rarity: "uncommon", value: 36, heal: 80 },
    "ether-sm":       { name: "Lantern Oil",   type: "consumable", rarity: "uncommon", value: 30, mp: 25 },
  };

  const STARTER_QUESTS = [
    {
      id: "q-slimes",
      title: "The Trembling Slimes",
      desc: "Apothecary Briar wants 12 grass slimes thinned from the meadow.",
      type: "kill", target: "slime-grass", goal: 12,
      rewards: { gold: 80, exp: 50, items: { "potion-md": 2 } }
    },
    {
      id: "q-herbs",
      title: "Briar's Pantry",
      desc: "Gather 8 forest herbs while you wander.",
      type: "collect", target: "herb", goal: 8,
      rewards: { gold: 60, exp: 30 }
    },
    {
      id: "q-forest",
      title: "Into the Whispering Forest",
      desc: "Reach the Whispering Forest and survive a single day.",
      type: "explore", target: "forest", goal: 1,
      rewards: { gold: 200, exp: 120, items: { "leather-vest": 1 } }
    },
    {
      id: "q-bear",
      title: "A Bear in the Hives",
      desc: "Defeat the Honey Bear haunting the meadow's edge.",
      type: "boss", target: "honey-bear", goal: 1,
      rewards: { gold: 320, exp: 220, items: { "iron-sword": 1 } }
    }
  ];

  const SKILLS = [
    { id: "power-strike", name: "Power Strike",   icon: "⚔", x: 22, y: 30, branch: "war",   needs: [], desc: "+15% damage on basic strikes." },
    { id: "iron-skin",    name: "Iron Skin",      icon: "🛡", x: 22, y: 60, branch: "war",   needs: ["power-strike"], desc: "+8 Defense." },
    { id: "fireball",     name: "Fireball",       icon: "✺", x: 50, y: 22, branch: "magic", needs: [], desc: "Active: 18 mp · big magic damage." },
    { id: "healing-light",name: "Healing Light",  icon: "✦", x: 50, y: 52, branch: "magic", needs: ["fireball"], desc: "Active: 20 mp · heal 60 HP." },
    { id: "quick-shot",   name: "Quick Shot",     icon: "❯", x: 78, y: 30, branch: "agi",   needs: [], desc: "+10% Speed, +3% crit." },
    { id: "treasure-hunt",name: "Treasure Hunter",icon: "✪", x: 78, y: 60, branch: "agi",   needs: ["quick-shot"], desc: "+12% rare loot, +20% gold." },
    { id: "lantern-rest", name: "Rest Efficiency",icon: "❂", x: 50, y: 82, branch: "idle",  needs: ["iron-skin","treasure-hunt"], desc: "+25% offline progress, +1 Mood/min." },
  ];

  const SKILL_LINKS = [
    ["power-strike","iron-skin"],
    ["fireball","healing-light"],
    ["quick-shot","treasure-hunt"],
    ["iron-skin","lantern-rest"],
    ["healing-light","lantern-rest"],
    ["treasure-hunt","lantern-rest"],
  ];

  const TOWN = [
    { id: "blacksmith",  name: "The Smolderhart Forge",   icon: "⚒", lv: 1, npc: "Old Hesper",   prop: "Weapon &amp; Armor",  desc: "Hesper hammers iron and rumour in equal measure." },
    { id: "alchemist",   name: "Briar's Apothecary",      icon: "❀", lv: 1, npc: "Briar",         prop: "Potions &amp; Herbs", desc: "Smells of mint and quiet panic." },
    { id: "guild",       name: "Lantern Guild Hall",      icon: "✦", lv: 2, npc: "Reeve Aldra",   prop: "Quests &amp; Bounties", desc: "Three stars carved above the door." },
    { id: "tavern",      name: "The Salt &amp; Sparrow",  icon: "♨", lv: 1, npc: "Tomas",          prop: "Rest &amp; Rumour",   desc: "Where heroes lose their gold to dice." },
    { id: "library",     name: "Hush Library",            icon: "📜", lv: 1, npc: "Sister Lin",    prop: "Skills &amp; Lore",   desc: "Books that turn their own pages." },
    { id: "shrine",      name: "Shrine of Three Stars",   icon: "✶", lv: 1, npc: "Priestess Yune", prop: "Blessings",          desc: "A wind that always smells of the sea." },
  ];

  const SCENE_CAPTIONS = {
    walking:   ["walks through the {biome}…", "presses on along the path…", "follows the lantern's bob…", "hums a small tune."],
    fighting:  ["meets a {mon} on the trail!", "raises blade against a {mon}!", "the {mon} hisses, eyes wet."],
    looting:   ["pockets what fortune left behind.", "kneels and gathers loot.", "marks the page with a small smile."],
    resting:   ["stops to catch a breath.", "boils water over moss.", "writes a note no one will read."],
    returning: ["turns toward home, lantern dimming.", "follows a familiar scent of bread."],
  };

  return { RARITY, ZONES, MONSTERS, ITEMS, STARTER_QUESTS, SKILLS, SKILL_LINKS, TOWN, SCENE_CAPTIONS };
})();

/* ============================================
   Fantasy Idle MMORPG - Game Data
   All game configuration, items, enemies, etc.
   ============================================ */

const GameData = {
    // ========================
    // Character Classes
    // ========================
    classes: {
        warrior: {
            name: 'Warrior',
            icon: '⚔️',
            avatar: '🧙',
            description: 'A mighty warrior skilled in melee combat.',
            baseStats: { hp: 120, mp: 30, atk: 14, def: 10, spd: 8, crit: 5 },
            growthPerLevel: { hp: 15, mp: 3, atk: 3, def: 2, spd: 1, crit: 0.2 },
        },
        mage: {
            name: 'Mage',
            icon: '🔮',
            avatar: '🧙‍♂️',
            description: 'A powerful spellcaster dealing magical damage.',
            baseStats: { hp: 80, mp: 80, atk: 18, def: 5, spd: 10, crit: 8 },
            growthPerLevel: { hp: 8, mp: 8, atk: 4, def: 1, spd: 1, crit: 0.3 },
        },
        ranger: {
            name: 'Ranger',
            icon: '🏹',
            avatar: '🧝',
            description: 'A swift archer with high critical strikes.',
            baseStats: { hp: 90, mp: 50, atk: 12, def: 6, spd: 15, crit: 12 },
            growthPerLevel: { hp: 10, mp: 5, atk: 3, def: 1, spd: 2, crit: 0.5 },
        },
        priest: {
            name: 'Priest',
            icon: '✝️',
            avatar: '🧑‍⚕️',
            description: 'A healer who can sustain through long battles.',
            baseStats: { hp: 100, mp: 70, atk: 8, def: 7, spd: 9, crit: 4 },
            growthPerLevel: { hp: 12, mp: 7, atk: 2, def: 2, spd: 1, crit: 0.2 },
        },
    },

    // ========================
    // Skills
    // ========================
    skills: {
        power_strike: {
            name: 'Power Strike',
            icon: '💥',
            description: 'A powerful melee attack.',
            type: 'active',
            cooldown: 3,
            mpCost: 10,
            damageMultiplier: 2.0,
            unlockLevel: 1,
            maxLevel: 20,
        },
        fireball: {
            name: 'Fireball',
            icon: '🔥',
            description: 'Launch a ball of fire at the enemy.',
            type: 'active',
            cooldown: 4,
            mpCost: 20,
            damageMultiplier: 2.5,
            unlockLevel: 3,
            maxLevel: 20,
        },
        heal: {
            name: 'Heal',
            icon: '💚',
            description: 'Restore HP.',
            type: 'active',
            cooldown: 5,
            mpCost: 15,
            healMultiplier: 0.3,
            unlockLevel: 2,
            maxLevel: 20,
        },
        critical_eye: {
            name: 'Critical Eye',
            icon: '👁️',
            description: 'Passive: Increase critical rate.',
            type: 'passive',
            critBonus: 3,
            unlockLevel: 5,
            maxLevel: 10,
        },
        berserker_rage: {
            name: 'Berserker Rage',
            icon: '😡',
            description: 'Greatly increase ATK for 5 seconds.',
            type: 'active',
            cooldown: 10,
            mpCost: 25,
            atkBuffMultiplier: 1.5,
            buffDuration: 5,
            unlockLevel: 8,
            maxLevel: 15,
        },
        shield_wall: {
            name: 'Shield Wall',
            icon: '🛡️',
            description: 'Increase DEF for 8 seconds.',
            type: 'active',
            cooldown: 12,
            mpCost: 20,
            defBuffMultiplier: 2.0,
            buffDuration: 8,
            unlockLevel: 6,
            maxLevel: 15,
        },
        mana_flow: {
            name: 'Mana Flow',
            icon: '🔮',
            description: 'Passive: Regenerate MP over time.',
            type: 'passive',
            mpRegenBonus: 2,
            unlockLevel: 4,
            maxLevel: 10,
        },
    },

    // ========================
    // Zones
    // ========================
    zones: [
        {
            id: 'greenwood',
            name: 'Greenwood Forest',
            icon: '🌲',
            levelRange: [1, 5],
            enemies: ['slime', 'wolf', 'goblin'],
            bossEnemy: 'goblin_chief',
            unlockLevel: 1,
        },
        {
            id: 'dark_cave',
            name: 'Dark Cave',
            icon: '🕳️',
            levelRange: [5, 10],
            enemies: ['bat', 'spider', 'skeleton'],
            bossEnemy: 'cave_troll',
            unlockLevel: 5,
        },
        {
            id: 'ancient_ruins',
            name: 'Ancient Ruins',
            icon: '🏛️',
            levelRange: [10, 20],
            enemies: ['ghost', 'golem', 'dark_knight'],
            bossEnemy: 'lich_king',
            unlockLevel: 10,
        },
        {
            id: 'dragon_peak',
            name: 'Dragon Peak',
            icon: '🏔️',
            levelRange: [20, 35],
            enemies: ['wyvern', 'fire_elemental', 'dragon_whelp'],
            bossEnemy: 'elder_dragon',
            unlockLevel: 20,
        },
        {
            id: 'demon_realm',
            name: 'Demon Realm',
            icon: '🌋',
            levelRange: [35, 50],
            enemies: ['imp', 'succubus', 'demon_warrior'],
            bossEnemy: 'demon_lord',
            unlockLevel: 35,
        },
    ],

    // ========================
    // Enemies
    // ========================
    enemies: {
        // Greenwood Forest
        slime: {
            name: 'Slime',
            icon: '🟢',
            stats: { hp: 30, atk: 5, def: 2, spd: 3 },
            expReward: 10,
            goldReward: [5, 15],
            drops: [
                { itemId: 'slime_gel', chance: 0.4 },
                { itemId: 'wooden_sword', chance: 0.05 },
                { itemId: 'wooden_amulet', chance: 0.04 },
            ],
        },
        wolf: {
            name: 'Wild Wolf',
            icon: '🐺',
            stats: { hp: 50, atk: 10, def: 3, spd: 8 },
            expReward: 18,
            goldReward: [8, 20],
            drops: [
                { itemId: 'wolf_fang', chance: 0.3 },
                { itemId: 'leather_armor', chance: 0.05 },
                { itemId: 'copper_ring', chance: 0.04 },
            ],
        },
        goblin: {
            name: 'Goblin',
            icon: '👺',
            stats: { hp: 45, atk: 12, def: 5, spd: 10 },
            expReward: 22,
            goldReward: [10, 30],
            drops: [
                { itemId: 'goblin_ear', chance: 0.35 },
                { itemId: 'iron_helmet', chance: 0.04 },
            ],
        },
        goblin_chief: {
            name: '👑 Goblin Chief',
            icon: '👹',
            isBoss: true,
            stats: { hp: 200, atk: 25, def: 12, spd: 12 },
            expReward: 100,
            goldReward: [50, 100],
            drops: [
                { itemId: 'iron_sword', chance: 0.3 },
                { itemId: 'goblin_crown', chance: 0.1 },
            ],
        },

        // Dark Cave
        bat: {
            name: 'Cave Bat',
            icon: '🦇',
            stats: { hp: 60, atk: 15, def: 5, spd: 18 },
            expReward: 30,
            goldReward: [15, 35],
            drops: [
                { itemId: 'bat_wing', chance: 0.35 },
                { itemId: 'silver_amulet', chance: 0.04 },
            ],
        },
        spider: {
            name: 'Giant Spider',
            icon: '🕷️',
            stats: { hp: 80, atk: 18, def: 8, spd: 12 },
            expReward: 38,
            goldReward: [18, 40],
            drops: [
                { itemId: 'spider_silk', chance: 0.3 },
                { itemId: 'steel_armor', chance: 0.04 },
            ],
        },
        skeleton: {
            name: 'Skeleton',
            icon: '💀',
            stats: { hp: 70, atk: 20, def: 10, spd: 8 },
            expReward: 35,
            goldReward: [20, 45],
            drops: [
                { itemId: 'bone_fragment', chance: 0.4 },
                { itemId: 'steel_sword', chance: 0.05 },
                { itemId: 'silver_ring', chance: 0.04 },
            ],
        },
        cave_troll: {
            name: '👑 Cave Troll',
            icon: '🧌',
            isBoss: true,
            stats: { hp: 500, atk: 40, def: 25, spd: 5 },
            expReward: 250,
            goldReward: [100, 250],
            drops: [
                { itemId: 'troll_club', chance: 0.25 },
                { itemId: 'emerald_ring', chance: 0.1 },
            ],
        },

        // Ancient Ruins
        ghost: {
            name: 'Lost Spirit',
            icon: '👻',
            stats: { hp: 100, atk: 28, def: 5, spd: 20 },
            expReward: 55,
            goldReward: [30, 60],
            drops: [
                { itemId: 'ectoplasm', chance: 0.3 },
            ],
        },
        golem: {
            name: 'Stone Golem',
            icon: '🗿',
            stats: { hp: 200, atk: 22, def: 30, spd: 3 },
            expReward: 60,
            goldReward: [35, 70],
            drops: [
                { itemId: 'magic_stone', chance: 0.25 },
                { itemId: 'mithril_armor', chance: 0.03 },
            ],
        },
        dark_knight: {
            name: 'Dark Knight',
            icon: '🖤',
            stats: { hp: 150, atk: 35, def: 20, spd: 12 },
            expReward: 70,
            goldReward: [40, 80],
            drops: [
                { itemId: 'dark_essence', chance: 0.2 },
                { itemId: 'shadow_blade', chance: 0.04 },
                { itemId: 'ruby_ring', chance: 0.03 },
            ],
        },
        lich_king: {
            name: '👑 Lich King',
            icon: '☠️',
            isBoss: true,
            stats: { hp: 1200, atk: 60, def: 35, spd: 15 },
            expReward: 600,
            goldReward: [300, 600],
            drops: [
                { itemId: 'shadow_blade', chance: 0.2 },
                { itemId: 'necro_amulet', chance: 0.1 },
            ],
        },

        // Dragon Peak
        wyvern: {
            name: 'Wyvern',
            icon: '🐉',
            stats: { hp: 250, atk: 45, def: 25, spd: 18 },
            expReward: 100,
            goldReward: [60, 120],
            drops: [
                { itemId: 'wyvern_scale', chance: 0.25 },
            ],
        },
        fire_elemental: {
            name: 'Fire Elemental',
            icon: '🔥',
            stats: { hp: 180, atk: 55, def: 15, spd: 22 },
            expReward: 110,
            goldReward: [70, 130],
            drops: [
                { itemId: 'fire_crystal', chance: 0.2 },
            ],
        },
        dragon_whelp: {
            name: 'Dragon Whelp',
            icon: '🐲',
            stats: { hp: 300, atk: 50, def: 30, spd: 15 },
            expReward: 120,
            goldReward: [80, 150],
            drops: [
                { itemId: 'dragon_scale', chance: 0.15 },
                { itemId: 'dragon_sword', chance: 0.03 },
                { itemId: 'dragon_ring', chance: 0.02 },
            ],
        },
        elder_dragon: {
            name: '👑 Elder Dragon',
            icon: '🐉',
            isBoss: true,
            stats: { hp: 3000, atk: 90, def: 50, spd: 20 },
            expReward: 1500,
            goldReward: [800, 1500],
            drops: [
                { itemId: 'dragon_sword', chance: 0.15 },
                { itemId: 'dragon_amulet', chance: 0.08 },
            ],
        },

        // Demon Realm
        imp: {
            name: 'Imp',
            icon: '😈',
            stats: { hp: 350, atk: 60, def: 30, spd: 25 },
            expReward: 180,
            goldReward: [100, 200],
            drops: [
                { itemId: 'demon_horn', chance: 0.2 },
            ],
        },
        succubus: {
            name: 'Succubus',
            icon: '🧛‍♀️',
            stats: { hp: 280, atk: 75, def: 20, spd: 30 },
            expReward: 200,
            goldReward: [120, 220],
            drops: [
                { itemId: 'dark_gem', chance: 0.15 },
                { itemId: 'demon_amulet', chance: 0.02 },
            ],
        },
        demon_warrior: {
            name: 'Demon Warrior',
            icon: '👿',
            stats: { hp: 500, atk: 70, def: 40, spd: 18 },
            expReward: 220,
            goldReward: [150, 250],
            drops: [
                { itemId: 'demon_essence', chance: 0.15 },
                { itemId: 'demon_blade', chance: 0.03 },
            ],
        },
        demon_lord: {
            name: '👑 Demon Lord',
            icon: '😈',
            isBoss: true,
            stats: { hp: 8000, atk: 130, def: 70, spd: 22 },
            expReward: 5000,
            goldReward: [2000, 4000],
            drops: [
                { itemId: 'demon_blade', chance: 0.12 },
                { itemId: 'demon_crown', chance: 0.05 },
                { itemId: 'demon_ring', chance: 0.04 },
            ],
        },
    },

    // ========================
    // Items
    // ========================
    items: {
        // Materials
        slime_gel: { name: 'Slime Gel', icon: '🟢', type: 'material', rarity: 'common', sellPrice: 3, description: 'Sticky gel from a slime.' },
        wolf_fang: { name: 'Wolf Fang', icon: '🦷', type: 'material', rarity: 'common', sellPrice: 5, description: 'A sharp wolf fang.' },
        goblin_ear: { name: 'Goblin Ear', icon: '👂', type: 'material', rarity: 'common', sellPrice: 8, description: 'A goblin ear trophy.' },
        bat_wing: { name: 'Bat Wing', icon: '🦇', type: 'material', rarity: 'common', sellPrice: 10, description: 'A thin bat wing.' },
        spider_silk: { name: 'Spider Silk', icon: '🕸️', type: 'material', rarity: 'uncommon', sellPrice: 15, description: 'Strong spider silk thread.' },
        bone_fragment: { name: 'Bone Fragment', icon: '🦴', type: 'material', rarity: 'common', sellPrice: 12, description: 'A piece of skeleton bone.' },
        ectoplasm: { name: 'Ectoplasm', icon: '💧', type: 'material', rarity: 'uncommon', sellPrice: 25, description: 'Ghostly residue.' },
        magic_stone: { name: 'Magic Stone', icon: '💎', type: 'material', rarity: 'rare', sellPrice: 50, description: 'A stone imbued with magic.' },
        dark_essence: { name: 'Dark Essence', icon: '🖤', type: 'material', rarity: 'rare', sellPrice: 60, description: 'Concentrated dark energy.' },
        wyvern_scale: { name: 'Wyvern Scale', icon: '🐉', type: 'material', rarity: 'rare', sellPrice: 80, description: 'A tough wyvern scale.' },
        fire_crystal: { name: 'Fire Crystal', icon: '🔴', type: 'material', rarity: 'rare', sellPrice: 90, description: 'A crystal of pure fire.' },
        dragon_scale: { name: 'Dragon Scale', icon: '🐲', type: 'material', rarity: 'epic', sellPrice: 150, description: 'A magnificent dragon scale.' },
        demon_horn: { name: 'Demon Horn', icon: '😈', type: 'material', rarity: 'rare', sellPrice: 100, description: 'A demon horn from the abyss.' },
        dark_gem: { name: 'Dark Gem', icon: '🔮', type: 'material', rarity: 'epic', sellPrice: 180, description: 'A gem full of dark power.' },
        demon_essence: { name: 'Demon Essence', icon: '🩸', type: 'material', rarity: 'epic', sellPrice: 200, description: 'Pure demonic energy.' },

        // Consumables
        hp_potion: { name: 'HP Potion', icon: '🧪', type: 'consumable', rarity: 'common', buyPrice: 30, sellPrice: 10, healAmount: 50, description: 'Restore 50 HP.' },
        mp_potion: { name: 'MP Potion', icon: '🧴', type: 'consumable', rarity: 'common', buyPrice: 40, sellPrice: 15, mpAmount: 30, description: 'Restore 30 MP.' },
        hp_potion_large: { name: 'Large HP Potion', icon: '🧪', type: 'consumable', rarity: 'uncommon', buyPrice: 100, sellPrice: 35, healAmount: 200, description: 'Restore 200 HP.' },
        exp_scroll: { name: 'EXP Scroll', icon: '📜', type: 'consumable', rarity: 'rare', buyPrice: 500, sellPrice: 150, expBoost: 1.5, duration: 60, description: 'x1.5 EXP for 60s.' },

        // Weapons
        wooden_sword: { name: 'Wooden Sword', icon: '🗡️', type: 'weapon', rarity: 'common', slot: 'weapon', stats: { atk: 5 }, sellPrice: 15, buyPrice: 50, description: 'A basic wooden sword.' },
        iron_sword: { name: 'Iron Sword', icon: '⚔️', type: 'weapon', rarity: 'uncommon', slot: 'weapon', stats: { atk: 12, spd: 2 }, sellPrice: 50, buyPrice: 200, description: 'A sturdy iron sword.' },
        steel_sword: { name: 'Steel Sword', icon: '⚔️', type: 'weapon', rarity: 'rare', slot: 'weapon', stats: { atk: 25, crit: 3 }, sellPrice: 150, buyPrice: 500, description: 'A sharp steel sword.' },
        troll_club: { name: 'Troll Club', icon: '🏓', type: 'weapon', rarity: 'rare', slot: 'weapon', stats: { atk: 35, spd: -3 }, sellPrice: 200, buyPrice: 700, description: 'A massive troll club.' },
        shadow_blade: { name: 'Shadow Blade', icon: '🗡️', type: 'weapon', rarity: 'epic', slot: 'weapon', stats: { atk: 50, crit: 8, spd: 5 }, sellPrice: 500, buyPrice: 2000, description: 'A blade forged in shadow.' },
        dragon_sword: { name: 'Dragon Slayer', icon: '⚔️', type: 'weapon', rarity: 'legendary', slot: 'weapon', stats: { atk: 80, crit: 12, spd: 8 }, sellPrice: 1500, buyPrice: 6000, description: 'A legendary dragon-slaying sword.' },
        demon_blade: { name: 'Demon Blade', icon: '🗡️', type: 'weapon', rarity: 'mythic', slot: 'weapon', stats: { atk: 120, crit: 15, spd: 10 }, sellPrice: 3000, description: 'A blade empowered by demonic energy.' },

        // Armor
        leather_armor: { name: 'Leather Armor', icon: '🎽', type: 'armor', rarity: 'common', slot: 'armor', stats: { def: 5, hp: 20 }, sellPrice: 20, buyPrice: 80, description: 'Basic leather armor.' },
        steel_armor: { name: 'Steel Armor', icon: '🎽', type: 'armor', rarity: 'rare', slot: 'armor', stats: { def: 15, hp: 80 }, sellPrice: 180, buyPrice: 600, description: 'Heavy steel armor.' },
        mithril_armor: { name: 'Mithril Armor', icon: '🎽', type: 'armor', rarity: 'epic', slot: 'armor', stats: { def: 30, hp: 150, spd: 3 }, sellPrice: 600, buyPrice: 2500, description: 'Lightweight mithril armor.' },

        // Helmets
        iron_helmet: { name: 'Iron Helmet', icon: '⛑️', type: 'helmet', rarity: 'uncommon', slot: 'helmet', stats: { def: 5, hp: 30 }, sellPrice: 40, buyPrice: 150, description: 'A sturdy iron helmet.' },

        // Boots
        leather_boots: { name: 'Leather Boots', icon: '👢', type: 'boots', rarity: 'common', slot: 'boots', stats: { spd: 3, def: 2 }, sellPrice: 15, buyPrice: 60, description: 'Light leather boots.' },
        swift_boots: { name: 'Swift Boots', icon: '👢', type: 'boots', rarity: 'rare', slot: 'boots', stats: { spd: 10, def: 5 }, sellPrice: 200, buyPrice: 700, description: 'Boots enchanted with speed.' },

        // Accessories - Rings
        copper_ring: { name: 'Copper Ring', icon: '💍', type: 'ring', rarity: 'common', slot: 'ring', stats: { atk: 2, def: 2 }, sellPrice: 25, buyPrice: 100, description: 'A simple copper ring.' },
        silver_ring: { name: 'Silver Ring', icon: '💍', type: 'ring', rarity: 'uncommon', slot: 'ring', stats: { atk: 5, hp: 30, spd: 2 }, sellPrice: 80, buyPrice: 280, description: 'A polished silver ring.' },
        emerald_ring: { name: 'Emerald Ring', icon: '💍', type: 'ring', rarity: 'rare', slot: 'ring', stats: { hp: 50, mp: 30, def: 5 }, sellPrice: 250, buyPrice: 900, description: 'A ring with an emerald gem.' },
        ruby_ring: { name: 'Ruby Ring', icon: '💍', type: 'ring', rarity: 'epic', slot: 'ring', stats: { atk: 15, crit: 6, hp: 80 }, sellPrice: 600, buyPrice: 2200, description: 'A ring blazing with ruby fire.' },
        dragon_ring: { name: 'Dragon Ring', icon: '💍', type: 'ring', rarity: 'legendary', slot: 'ring', stats: { atk: 30, def: 15, crit: 10, hp: 150 }, sellPrice: 1800, buyPrice: 6500, description: 'A ring forged from dragon flame.' },
        demon_ring: { name: 'Demon Ring', icon: '💍', type: 'ring', rarity: 'mythic', slot: 'ring', stats: { atk: 45, def: 25, crit: 12, hp: 250, spd: 8 }, sellPrice: 4000, description: 'A ring pulsing with demonic power.' },

        // Accessories - Amulets
        wooden_amulet: { name: 'Wooden Amulet', icon: '📿', type: 'amulet', rarity: 'common', slot: 'amulet', stats: { hp: 20, mp: 10 }, sellPrice: 20, buyPrice: 80, description: 'A simple wooden charm.' },
        silver_amulet: { name: 'Silver Amulet', icon: '📿', type: 'amulet', rarity: 'uncommon', slot: 'amulet', stats: { hp: 40, mp: 20, def: 3 }, sellPrice: 70, buyPrice: 250, description: 'A shining silver amulet.' },
        necro_amulet: { name: 'Necro Amulet', icon: '📿', type: 'amulet', rarity: 'epic', slot: 'amulet', stats: { atk: 20, mp: 50, crit: 5 }, sellPrice: 800, buyPrice: 3000, description: 'An amulet radiating dark power.' },
        dragon_amulet: { name: 'Dragon Amulet', icon: '📿', type: 'amulet', rarity: 'legendary', slot: 'amulet', stats: { atk: 35, def: 20, hp: 200, crit: 8 }, sellPrice: 2000, buyPrice: 8000, description: 'An amulet holding dragon essence.' },
        demon_amulet: { name: 'Demon Amulet', icon: '📿', type: 'amulet', rarity: 'mythic', slot: 'amulet', stats: { atk: 60, mp: 80, crit: 12, hp: 250 }, sellPrice: 4500, description: 'An amulet forged in the demon realm.' },

        // Accessories - Other
        goblin_crown: { name: 'Goblin Crown', icon: '👑', type: 'helmet', rarity: 'rare', slot: 'helmet', stats: { atk: 8, def: 8, hp: 40 }, sellPrice: 300, buyPrice: 1000, description: 'Crown of the Goblin Chief.' },
        demon_crown: { name: 'Demon Crown', icon: '👑', type: 'helmet', rarity: 'mythic', slot: 'helmet', stats: { atk: 50, def: 40, hp: 300, crit: 10 }, sellPrice: 5000, description: 'The crown of the Demon Lord.' },
    },

    // ========================
    // Dungeons
    // ========================
    dungeons: [
        {
            id: 'goblin_den',
            name: 'Goblin Den',
            icon: '🏚️',
            description: 'A hidden goblin hideout deep in the forest.',
            requiredLevel: 5,
            waves: 5,
            enemies: ['goblin', 'goblin', 'goblin_chief'],
            rewards: { gold: [100, 200], exp: 200, drops: [{ itemId: 'iron_sword', chance: 0.3 }] },
            cooldown: 300,
        },
        {
            id: 'spider_nest',
            name: 'Spider Nest',
            icon: '🕸️',
            description: 'A cave filled with giant spiders.',
            requiredLevel: 10,
            waves: 8,
            enemies: ['spider', 'spider', 'bat', 'cave_troll'],
            rewards: { gold: [300, 500], exp: 500, drops: [{ itemId: 'steel_sword', chance: 0.2 }] },
            cooldown: 600,
        },
        {
            id: 'ruins_of_shadow',
            name: 'Ruins of Shadow',
            icon: '🏛️',
            description: 'Ancient ruins haunted by undead.',
            requiredLevel: 18,
            waves: 10,
            enemies: ['ghost', 'dark_knight', 'golem', 'lich_king'],
            rewards: { gold: [600, 1000], exp: 1200, drops: [{ itemId: 'shadow_blade', chance: 0.15 }] },
            cooldown: 900,
        },
        {
            id: 'dragon_lair',
            name: "Dragon's Lair",
            icon: '🐉',
            description: 'The lair of the Elder Dragon.',
            requiredLevel: 30,
            waves: 12,
            enemies: ['wyvern', 'dragon_whelp', 'fire_elemental', 'elder_dragon'],
            rewards: { gold: [1500, 3000], exp: 3000, drops: [{ itemId: 'dragon_sword', chance: 0.1 }] },
            cooldown: 1200,
        },
    ],

    // ========================
    // Quests
    // ========================
    quests: [
        {
            id: 'kill_slimes',
            name: 'Slime Extermination',
            description: 'Defeat 10 Slimes.',
            type: 'daily',
            target: { type: 'kill', enemyId: 'slime', count: 10 },
            rewards: { gold: 100, exp: 50 },
        },
        {
            id: 'kill_wolves',
            name: 'Wolf Hunt',
            description: 'Defeat 10 Wild Wolves.',
            type: 'daily',
            target: { type: 'kill', enemyId: 'wolf', count: 10 },
            rewards: { gold: 150, exp: 80 },
        },
        {
            id: 'collect_fangs',
            name: 'Fang Collector',
            description: 'Collect 5 Wolf Fangs.',
            type: 'daily',
            target: { type: 'collect', itemId: 'wolf_fang', count: 5 },
            rewards: { gold: 200, exp: 100 },
        },
        {
            id: 'first_dungeon',
            name: 'Dungeon Explorer',
            description: 'Complete the Goblin Den dungeon.',
            type: 'main',
            target: { type: 'dungeon', dungeonId: 'goblin_den', count: 1 },
            rewards: { gold: 500, exp: 300, items: ['iron_sword'] },
        },
        {
            id: 'reach_level_10',
            name: 'Rising Hero',
            description: 'Reach Level 10.',
            type: 'main',
            target: { type: 'level', count: 10 },
            rewards: { gold: 1000, exp: 500, gems: 10 },
        },
        {
            id: 'kill_50_enemies',
            name: 'Monster Slayer',
            description: 'Defeat 50 enemies.',
            type: 'weekly',
            target: { type: 'kill_any', count: 50 },
            rewards: { gold: 500, exp: 300, gems: 5 },
        },
    ],

    // ========================
    // Shop Upgrade Levels
    // ========================
    shopUpgrades: [
        {
            level: 1,
            name: 'Traveling Merchant',
            icon: '🏕️',
            upgradeCost: 0,
            discount: 0,
            items: [
                { itemId: 'hp_potion', stock: -1 },
                { itemId: 'mp_potion', stock: -1 },
                { itemId: 'wooden_sword', stock: 1 },
                { itemId: 'leather_boots', stock: 1 },
                { itemId: 'wooden_amulet', stock: 1 },
            ],
        },
        {
            level: 2,
            name: 'Village Shop',
            icon: '🏠',
            upgradeCost: 500,
            discount: 0,
            items: [
                { itemId: 'hp_potion', stock: -1 },
                { itemId: 'mp_potion', stock: -1 },
                { itemId: 'hp_potion_large', stock: -1 },
                { itemId: 'iron_sword', stock: 1 },
                { itemId: 'leather_armor', stock: 1 },
                { itemId: 'iron_helmet', stock: 1 },
                { itemId: 'leather_boots', stock: 1 },
                { itemId: 'copper_ring', stock: 1 },
                { itemId: 'wooden_amulet', stock: 1 },
            ],
        },
        {
            level: 3,
            name: 'Town Market',
            icon: '🏪',
            upgradeCost: 3000,
            discount: 5,
            items: [
                { itemId: 'hp_potion', stock: -1 },
                { itemId: 'mp_potion', stock: -1 },
                { itemId: 'hp_potion_large', stock: -1 },
                { itemId: 'exp_scroll', stock: 3 },
                { itemId: 'iron_sword', stock: 1 },
                { itemId: 'steel_sword', stock: 1 },
                { itemId: 'leather_armor', stock: 1 },
                { itemId: 'steel_armor', stock: 1 },
                { itemId: 'iron_helmet', stock: 1 },
                { itemId: 'leather_boots', stock: 1 },
                { itemId: 'swift_boots', stock: 1 },
                { itemId: 'copper_ring', stock: 1 },
                { itemId: 'silver_ring', stock: 1 },
                { itemId: 'wooden_amulet', stock: 1 },
                { itemId: 'silver_amulet', stock: 1 },
            ],
        },
        {
            level: 4,
            name: 'Grand Bazaar',
            icon: '🏛️',
            upgradeCost: 10000,
            discount: 10,
            items: [
                { itemId: 'hp_potion', stock: -1 },
                { itemId: 'mp_potion', stock: -1 },
                { itemId: 'hp_potion_large', stock: -1 },
                { itemId: 'exp_scroll', stock: -1 },
                { itemId: 'iron_sword', stock: 1 },
                { itemId: 'steel_sword', stock: 1 },
                { itemId: 'troll_club', stock: 1 },
                { itemId: 'leather_armor', stock: 1 },
                { itemId: 'steel_armor', stock: 1 },
                { itemId: 'mithril_armor', stock: 1 },
                { itemId: 'iron_helmet', stock: 1 },
                { itemId: 'goblin_crown', stock: 1 },
                { itemId: 'leather_boots', stock: 1 },
                { itemId: 'swift_boots', stock: 1 },
                { itemId: 'copper_ring', stock: 1 },
                { itemId: 'silver_ring', stock: 1 },
                { itemId: 'emerald_ring', stock: 1 },
                { itemId: 'ruby_ring', stock: 1 },
                { itemId: 'wooden_amulet', stock: 1 },
                { itemId: 'silver_amulet', stock: 1 },
                { itemId: 'necro_amulet', stock: 1 },
            ],
        },
        {
            level: 5,
            name: 'Royal Emporium',
            icon: '👑',
            upgradeCost: 30000,
            discount: 15,
            items: [
                { itemId: 'hp_potion', stock: -1 },
                { itemId: 'mp_potion', stock: -1 },
                { itemId: 'hp_potion_large', stock: -1 },
                { itemId: 'exp_scroll', stock: -1 },
                { itemId: 'iron_sword', stock: 1 },
                { itemId: 'steel_sword', stock: 1 },
                { itemId: 'troll_club', stock: 1 },
                { itemId: 'shadow_blade', stock: 1 },
                { itemId: 'dragon_sword', stock: 1 },
                { itemId: 'leather_armor', stock: 1 },
                { itemId: 'steel_armor', stock: 1 },
                { itemId: 'mithril_armor', stock: 1 },
                { itemId: 'iron_helmet', stock: 1 },
                { itemId: 'goblin_crown', stock: 1 },
                { itemId: 'leather_boots', stock: 1 },
                { itemId: 'swift_boots', stock: 1 },
                { itemId: 'copper_ring', stock: 1 },
                { itemId: 'silver_ring', stock: 1 },
                { itemId: 'emerald_ring', stock: 1 },
                { itemId: 'ruby_ring', stock: 1 },
                { itemId: 'dragon_ring', stock: 1 },
                { itemId: 'wooden_amulet', stock: 1 },
                { itemId: 'silver_amulet', stock: 1 },
                { itemId: 'necro_amulet', stock: 1 },
                { itemId: 'dragon_amulet', stock: 1 },
            ],
        },
    ],

    getShopData(shopLevel) {
        return this.shopUpgrades[Math.min(shopLevel - 1, this.shopUpgrades.length - 1)];
    },

    getMaxShopLevel() {
        return this.shopUpgrades.length;
    },

    // ========================
    // Level EXP Table
    // ========================
    getExpRequired(level) {
        return Math.floor(100 * Math.pow(level, 1.5));
    },

    // Scale enemy stats by zone
    scaleEnemy(enemyId, zoneLevel) {
        const base = this.enemies[enemyId];
        if (!base) return null;
        const scale = 1 + (zoneLevel - 1) * 0.15;
        return {
            ...base,
            id: enemyId,
            currentHp: Math.floor(base.stats.hp * scale),
            maxHp: Math.floor(base.stats.hp * scale),
            atk: Math.floor(base.stats.atk * scale),
            def: Math.floor(base.stats.def * scale),
            spd: Math.floor(base.stats.spd * scale),
            expReward: Math.floor(base.expReward * scale),
            goldReward: [
                Math.floor(base.goldReward[0] * scale),
                Math.floor(base.goldReward[1] * scale),
            ],
        };
    },
};

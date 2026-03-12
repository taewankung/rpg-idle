/* ============================================
   Fantasy Idle MMORPG - Game Engine
   Core game logic: combat, progression, saving
   ============================================ */

class GameEngine {
    constructor() {
        // Game State
        this.state = {
            player: {
                name: 'Hero',
                classId: 'warrior',
                level: 1,
                exp: 0,
                gold: 50,
                gems: 0,
                stats: { ...GameData.classes.warrior.baseStats },
                currentHp: GameData.classes.warrior.baseStats.hp,
                currentMp: GameData.classes.warrior.baseStats.mp,
                equipment: { weapon: null, armor: null, helmet: null, boots: null, ring: null, amulet: null },
                skills: {
                    power_strike: { level: 1, cooldownRemaining: 0 },
                    heal: { level: 0, cooldownRemaining: 0 },
                },
                buffs: [],
            },
            inventory: [],
            currentZoneIndex: 0,
            currentEnemy: null,
            autoBattle: true,
            battleSpeed: 1,
            totalKills: 0,
            totalDamageDealt: 0,
            playTime: 0,
            questProgress: {},
            dungeonCooldowns: {},
            shopLevel: 1,
            lastSaveTime: Date.now(),
        };

        // Timers
        this.battleTimer = 0;
        this.battleInterval = 1.5; // seconds per attack
        this.tickRate = 100; // ms per tick
        this.accumulator = 0;

        // DPS tracking
        this.dpsAccumulator = 0;
        this.dpsTimer = 0;
        this.currentDps = 0;

        // Callbacks
        this.onBattleUpdate = null;
        this.onPlayerUpdate = null;
        this.onEnemyDefeated = null;
        this.onEnemySpawned = null;
        this.onLogMessage = null;
        this.onLevelUp = null;
        this.onLoot = null;
        this.onQuestUpdate = null;

        this._running = false;
        this._lastTime = 0;

        // Movement phase - combat only starts when entities are in range
        this.battleReady = false;
    }

    // ========================
    // Initialization
    // ========================
    init() {
        this.loadGame();
        this.validateState();
        this.recalculateStats();
        if (!this.state.currentEnemy) {
            this.spawnEnemy();
        }
        this.initQuests();
    }

    validateState() {
        const player = this.state.player;
        const classData = GameData.classes[player.classId];
        if (!classData) {
            player.classId = 'warrior';
        }

        // Recalculate base stats from class + level growth
        const cls = GameData.classes[player.classId];
        const baseStats = { ...cls.baseStats };
        for (const stat of Object.keys(baseStats)) {
            baseStats[stat] = Math.floor(cls.baseStats[stat] + (cls.growthPerLevel[stat] || 0) * (player.level - 1));
        }
        player.stats = baseStats;

        // Unlock any skills the player should have at their current level
        this.checkSkillUnlocks();

        // Remove skills that no longer exist in GameData
        for (const skillId of Object.keys(player.skills)) {
            if (!GameData.skills[skillId]) {
                delete player.skills[skillId];
            }
        }

        // Clamp HP/MP to valid range
        const maxHp = this.getTotalStat('hp');
        const maxMp = this.getTotalStat('mp');
        if (player.currentHp > maxHp) player.currentHp = maxHp;
        if (player.currentMp > maxMp) player.currentMp = maxMp;
        if (player.currentHp <= 0) player.currentHp = Math.floor(maxHp * 0.5);
        if (player.currentMp < 0) player.currentMp = 0;

        // Ensure auto battle is always enabled
        this.state.autoBattle = true;
    }

    start() {
        if (this._running) return;
        this._running = true;
        this._lastTime = performance.now();
        this._loop();
    }

    stop() {
        this._running = false;
    }

    _loop() {
        if (!this._running) return;
        const now = performance.now();
        const dt = (now - this._lastTime) / 1000; // delta in seconds
        this._lastTime = now;

        this.update(dt);

        requestAnimationFrame(() => this._loop());
    }

    // ========================
    // Main Update Loop
    // ========================
    update(dt) {
        const scaledDt = dt * this.state.battleSpeed;

        // Play time
        this.state.playTime += dt;

        // Update buffs
        this.updateBuffs(scaledDt);

        // Update skill cooldowns
        this.updateCooldowns(scaledDt);

        // Update dungeon cooldowns
        this.updateDungeonCooldowns(dt);

        // DPS tracking
        this.dpsTimer += dt;
        if (this.dpsTimer >= 1) {
            this.currentDps = this.dpsAccumulator;
            this.dpsAccumulator = 0;
            this.dpsTimer = 0;
        }

        // Passive MP regeneration
        this.updateMpRegen(scaledDt);

        // Battle (only in combat phase, after approach walk is done)
        if (this.state.autoBattle && this.state.currentEnemy && this.battleReady) {
            this.battleTimer += scaledDt;

            const attackSpeed = this.getAttackSpeed();
            if (this.battleTimer >= attackSpeed) {
                this.battleTimer -= attackSpeed;
                this.performCombatRound();
            }
        }

        // Auto-save every 30 seconds
        if (Date.now() - this.state.lastSaveTime > 30000) {
            this.saveGame();
        }

        if (this.onBattleUpdate) this.onBattleUpdate();
    }

    // ========================
    // Combat System
    // ========================
    getAttackSpeed() {
        const spd = this.getTotalStat('spd');
        return Math.max(0.3, this.battleInterval - spd * 0.02);
    }

    performCombatRound() {
        const player = this.state.player;
        const enemy = this.state.currentEnemy;
        if (!enemy) return;

        // Player attacks
        this.playerAttack(enemy);

        // Check if enemy is dead
        if (enemy.currentHp <= 0) {
            this.handleEnemyDefeated(enemy);
            return;
        }

        // Enemy attacks back
        this.enemyAttack(enemy);

        // Check if player is dead
        if (player.currentHp <= 0) {
            this.handlePlayerDeath();
        }
    }

    playerAttack(enemy) {
        const player = this.state.player;
        let atk = this.getTotalStat('atk');
        const crit = this.getTotalStat('crit');

        // Check for active skill usage
        let skillUsed = null;
        for (const [skillId, skillState] of Object.entries(player.skills)) {
            if (skillState.level <= 0) continue;
            const skillData = GameData.skills[skillId];
            if (!skillData || skillData.type !== 'active') continue;
            if (skillState.cooldownRemaining > 0) continue;

            if (skillData.healMultiplier) {
                // Use heal skill
                const healAmount = Math.floor(this.getTotalStat('hp') * skillData.healMultiplier * (1 + skillState.level * 0.1));
                player.currentHp = Math.min(player.currentHp + healAmount, this.getTotalStat('hp'));
                player.currentMp -= skillData.mpCost;
                skillState.cooldownRemaining = skillData.cooldown;
                if (this.onLogMessage) this.onLogMessage(`✨ Used ${skillData.name}! Healed ${healAmount} HP`, 'player-action');
                if (this.onLoot) this.onLoot(healAmount, 'heal');
                continue;
            }

            if (player.currentMp >= skillData.mpCost) {
                // Use damage/buff skill
                if (skillData.damageMultiplier) {
                    atk = Math.floor(atk * skillData.damageMultiplier * (1 + skillState.level * 0.05));
                    skillUsed = skillData;
                }
                if (skillData.atkBuffMultiplier) {
                    this.addBuff('atk', skillData.atkBuffMultiplier, skillData.buffDuration);
                    skillUsed = skillData;
                }
                if (skillData.defBuffMultiplier) {
                    this.addBuff('def', skillData.defBuffMultiplier, skillData.buffDuration);
                    skillUsed = skillData;
                }
                player.currentMp -= skillData.mpCost;
                skillState.cooldownRemaining = skillData.cooldown;
                if (this.onLogMessage) this.onLogMessage(`✨ Used ${skillData.name}!`, 'player-action');
                break;
            }
        }

        // Apply buff multipliers
        const atkBuff = this.getBuffMultiplier('atk');
        atk = Math.floor(atk * atkBuff);

        // Calculate damage
        let damage = Math.max(1, atk - enemy.def);
        let isCrit = false;

        // Critical hit check
        if (Math.random() * 100 < crit) {
            damage = Math.floor(damage * 2);
            isCrit = true;
        }

        // Add some variance ±10%
        const variance = 0.9 + Math.random() * 0.2;
        damage = Math.floor(damage * variance);
        damage = Math.max(1, damage);

        enemy.currentHp -= damage;
        this.dpsAccumulator += damage;
        this.state.totalDamageDealt += damage;

        const critText = isCrit ? ' 💥CRIT!' : '';
        if (this.onLogMessage) this.onLogMessage(`⚔️ You dealt ${damage} damage to ${enemy.name}${critText}`, 'player-action');
        if (this.onLoot) this.onLoot(damage, isCrit ? 'crit' : 'player-dmg');
    }

    enemyAttack(enemy) {
        const player = this.state.player;
        const defBuff = this.getBuffMultiplier('def');
        const playerDef = Math.floor(this.getTotalStat('def') * defBuff);

        let damage = Math.max(1, enemy.atk - playerDef);
        const variance = 0.9 + Math.random() * 0.2;
        damage = Math.floor(damage * variance);
        damage = Math.max(1, damage);

        player.currentHp -= damage;
        if (this.onLogMessage) this.onLogMessage(`💢 ${enemy.name} dealt ${damage} damage to you`, 'enemy-action');
        if (this.onLoot) this.onLoot(damage, 'enemy-dmg');
    }

    handleEnemyDefeated(enemy) {
        const player = this.state.player;
        this.state.totalKills++;

        // Gold reward
        const goldMin = enemy.goldReward[0];
        const goldMax = enemy.goldReward[1];
        const goldEarned = Math.floor(goldMin + Math.random() * (goldMax - goldMin));
        player.gold += goldEarned;

        // EXP reward
        const expEarned = enemy.expReward;
        this.addExp(expEarned);

        // MP regeneration
        player.currentMp = Math.min(player.currentMp + 5, this.getTotalStat('mp'));

        if (this.onLogMessage) {
            this.onLogMessage(`💀 ${enemy.name} defeated!`, 'system');
            this.onLogMessage(`🪙 +${goldEarned} Gold  ⭐ +${expEarned} EXP`, 'loot');
        }

        // Loot drops
        if (enemy.drops) {
            for (const drop of enemy.drops) {
                if (Math.random() < drop.chance) {
                    this.addItem(drop.itemId);
                    const item = GameData.items[drop.itemId];
                    if (item && this.onLogMessage) {
                        this.onLogMessage(`🎁 Dropped: ${item.icon} ${item.name}!`, 'loot');
                    }
                }
            }
        }

        // Quest progress
        this.updateQuestProgress('kill', enemy.id);
        this.updateQuestProgress('kill_any');

        if (this.onEnemyDefeated) this.onEnemyDefeated(enemy);

        // Spawn next enemy
        this.spawnEnemy();
    }

    handlePlayerDeath() {
        const player = this.state.player;
        if (this.onLogMessage) this.onLogMessage('☠️ You have been defeated! Recovering...', 'system');

        // Revive with 50% HP
        player.currentHp = Math.floor(this.getTotalStat('hp') * 0.5);
        player.currentMp = Math.floor(this.getTotalStat('mp') * 0.5);

        // Spawn new enemy
        this.spawnEnemy();
    }

    spawnEnemy() {
        const zone = GameData.zones[this.state.currentZoneIndex];
        if (!zone) return;

        // Random enemy from zone
        const enemyPool = zone.enemies;
        const randomIndex = Math.floor(Math.random() * enemyPool.length);
        const enemyId = enemyPool[randomIndex];

        // Scale to zone average level
        const avgLevel = Math.floor((zone.levelRange[0] + zone.levelRange[1]) / 2);
        this.state.currentEnemy = GameData.scaleEnemy(enemyId, avgLevel);
        this.battleTimer = 0;
        this.battleReady = false;

        // Notify UI to start approach animation
        if (this.onEnemySpawned) this.onEnemySpawned();
    }

    // ========================
    // Buff System
    // ========================
    addBuff(stat, multiplier, duration) {
        this.state.player.buffs.push({ stat, multiplier, remaining: duration });
    }

    getBuffMultiplier(stat) {
        let mult = 1;
        for (const buff of this.state.player.buffs) {
            if (buff.stat === stat) mult *= buff.multiplier;
        }
        return mult;
    }

    updateBuffs(dt) {
        this.state.player.buffs = this.state.player.buffs.filter(b => {
            b.remaining -= dt;
            return b.remaining > 0;
        });
    }

    updateCooldowns(dt) {
        for (const skillState of Object.values(this.state.player.skills)) {
            if (skillState.cooldownRemaining > 0) {
                skillState.cooldownRemaining = Math.max(0, skillState.cooldownRemaining - dt);
            }
        }
    }

    updateMpRegen(dt) {
        const player = this.state.player;
        let regenPerSec = 0;

        for (const [skillId, skillState] of Object.entries(player.skills)) {
            if (skillState.level <= 0) continue;
            const skillData = GameData.skills[skillId];
            if (!skillData || skillData.type !== 'passive') continue;
            if (skillData.mpRegenBonus) {
                regenPerSec += skillData.mpRegenBonus * skillState.level;
            }
        }

        if (regenPerSec > 0) {
            const maxMp = this.getTotalStat('mp');
            player.currentMp = Math.min(player.currentMp + regenPerSec * dt, maxMp);
        }
    }

    updateDungeonCooldowns(dt) {
        for (const [id, cd] of Object.entries(this.state.dungeonCooldowns)) {
            if (cd > 0) {
                this.state.dungeonCooldowns[id] = Math.max(0, cd - dt);
            }
        }
    }

    // ========================
    // Stats System
    // ========================
    getBaseStats() {
        const classData = GameData.classes[this.state.player.classId];
        const level = this.state.player.level;
        const stats = {};
        for (const stat of ['hp', 'mp', 'atk', 'def', 'spd', 'crit']) {
            stats[stat] = Math.floor(classData.baseStats[stat] + classData.growthPerLevel[stat] * (level - 1));
        }
        return stats;
    }

    getTotalStat(stat) {
        const base = this.getBaseStats();
        let total = base[stat] || 0;

        // Equipment bonuses
        const equip = this.state.player.equipment;
        for (const slotItem of Object.values(equip)) {
            if (slotItem) {
                const itemData = GameData.items[slotItem];
                if (itemData && itemData.stats && itemData.stats[stat]) {
                    total += itemData.stats[stat];
                }
            }
        }

        // Passive skill bonuses
        for (const [skillId, skillState] of Object.entries(this.state.player.skills)) {
            if (skillState.level <= 0) continue;
            const skillData = GameData.skills[skillId];
            if (!skillData || skillData.type !== 'passive') continue;
            if (stat === 'crit' && skillData.critBonus) {
                total += skillData.critBonus * skillState.level;
            }
        }

        return total;
    }

    recalculateStats() {
        const player = this.state.player;
        const maxHp = this.getTotalStat('hp');
        const maxMp = this.getTotalStat('mp');
        player.currentHp = Math.min(player.currentHp, maxHp);
        player.currentMp = Math.min(player.currentMp, maxMp);
    }

    // ========================
    // Leveling
    // ========================
    addExp(amount) {
        const player = this.state.player;
        player.exp += amount;

        let required = GameData.getExpRequired(player.level);
        while (player.exp >= required) {
            player.exp -= required;
            player.level++;
            this.recalculateStats();
            // Full heal on level up
            player.currentHp = this.getTotalStat('hp');
            player.currentMp = this.getTotalStat('mp');

            // Unlock skills
            this.checkSkillUnlocks();

            if (this.onLogMessage) this.onLogMessage(`🎉 LEVEL UP! You are now Level ${player.level}!`, 'level-up');
            if (this.onLevelUp) this.onLevelUp(player.level);

            // Quest progress
            this.updateQuestProgress('level');

            required = GameData.getExpRequired(player.level);
        }
    }

    checkSkillUnlocks() {
        const player = this.state.player;
        for (const [skillId, skillData] of Object.entries(GameData.skills)) {
            if (player.level >= skillData.unlockLevel) {
                if (!player.skills[skillId]) {
                    player.skills[skillId] = { level: 1, cooldownRemaining: 0 };
                    if (this.onLogMessage) this.onLogMessage(`✨ New skill unlocked: ${skillData.icon} ${skillData.name}!`, 'level-up');
                } else if (player.skills[skillId].level <= 0) {
                    player.skills[skillId].level = 1;
                    if (this.onLogMessage) this.onLogMessage(`✨ New skill unlocked: ${skillData.icon} ${skillData.name}!`, 'level-up');
                }
            }
        }
    }

    // ========================
    // Inventory
    // ========================
    addItem(itemId, count = 1) {
        const existing = this.state.inventory.find(i => i.id === itemId);
        if (existing) {
            existing.count += count;
        } else {
            this.state.inventory.push({ id: itemId, count });
        }
        this.updateQuestProgress('collect', itemId);
    }

    removeItem(itemId, count = 1) {
        const existing = this.state.inventory.find(i => i.id === itemId);
        if (!existing || existing.count < count) return false;
        existing.count -= count;
        if (existing.count <= 0) {
            this.state.inventory = this.state.inventory.filter(i => i.id !== itemId);
        }
        return true;
    }

    getItemCount(itemId) {
        const existing = this.state.inventory.find(i => i.id === itemId);
        return existing ? existing.count : 0;
    }

    equipItem(itemId) {
        const itemData = GameData.items[itemId];
        if (!itemData || !itemData.slot) return false;

        const slot = itemData.slot;
        const currentEquipped = this.state.player.equipment[slot];

        // Unequip current item
        if (currentEquipped) {
            this.addItem(currentEquipped);
        }

        // Equip new item
        if (this.removeItem(itemId)) {
            this.state.player.equipment[slot] = itemId;
            this.recalculateStats();
            return true;
        }
        return false;
    }

    unequipItem(slot) {
        const currentEquipped = this.state.player.equipment[slot];
        if (!currentEquipped) return false;

        this.addItem(currentEquipped);
        this.state.player.equipment[slot] = null;
        this.recalculateStats();
        return true;
    }

    sellItem(itemId, count = 1) {
        const itemData = GameData.items[itemId];
        if (!itemData) return false;

        if (this.removeItem(itemId, count)) {
            this.state.player.gold += itemData.sellPrice * count;
            return true;
        }
        return false;
    }

    useItem(itemId) {
        const itemData = GameData.items[itemId];
        if (!itemData || itemData.type !== 'consumable') return false;

        if (!this.removeItem(itemId)) return false;

        if (itemData.healAmount) {
            this.state.player.currentHp = Math.min(
                this.state.player.currentHp + itemData.healAmount,
                this.getTotalStat('hp')
            );
        }
        if (itemData.mpAmount) {
            this.state.player.currentMp = Math.min(
                this.state.player.currentMp + itemData.mpAmount,
                this.getTotalStat('mp')
            );
        }
        return true;
    }

    useAllItems(itemId) {
        const count = this.getItemCount(itemId);
        if (count <= 0) return 0;
        let used = 0;
        for (let i = 0; i < count; i++) {
            if (this.useItem(itemId)) {
                used++;
            } else {
                break;
            }
        }
        return used;
    }

    sellAllItems(itemId) {
        const count = this.getItemCount(itemId);
        if (count <= 0) return 0;
        if (this.sellItem(itemId, count)) {
            return count;
        }
        return 0;
    }

    // ========================
    // Shop
    // ========================
    getShopDiscount() {
        const shopData = GameData.getShopData(this.state.shopLevel);
        return shopData ? shopData.discount : 0;
    }

    getDiscountedPrice(basePrice) {
        const discount = this.getShopDiscount();
        return Math.floor(basePrice * (1 - discount / 100));
    }

    buyItem(itemId) {
        const itemData = GameData.items[itemId];
        if (!itemData || !itemData.buyPrice) return false;

        const price = this.getDiscountedPrice(itemData.buyPrice);
        if (this.state.player.gold >= price) {
            this.state.player.gold -= price;
            this.addItem(itemId);
            return true;
        }
        return false;
    }

    upgradeShop() {
        const currentLevel = this.state.shopLevel;
        const maxLevel = GameData.getMaxShopLevel();
        if (currentLevel >= maxLevel) return false;

        const nextData = GameData.getShopData(currentLevel + 1);
        if (!nextData) return false;

        if (this.state.player.gold >= nextData.upgradeCost) {
            this.state.player.gold -= nextData.upgradeCost;
            this.state.shopLevel = currentLevel + 1;
            if (this.onLogMessage) {
                this.onLogMessage(`🏪 Shop upgraded to ${nextData.icon} ${nextData.name}!`, 'level-up');
            }
            return true;
        }
        return false;
    }

    // ========================
    // Zone Navigation
    // ========================
    changeZone(direction) {
        const newIndex = this.state.currentZoneIndex + direction;
        if (newIndex < 0 || newIndex >= GameData.zones.length) return false;

        const zone = GameData.zones[newIndex];
        if (this.state.player.level < zone.unlockLevel) return false;

        this.state.currentZoneIndex = newIndex;
        this.spawnEnemy();
        return true;
    }

    // ========================
    // Dungeons
    // ========================
    canEnterDungeon(dungeonId) {
        const dungeon = GameData.dungeons.find(d => d.id === dungeonId);
        if (!dungeon) return false;
        if (this.state.player.level < dungeon.requiredLevel) return false;
        if ((this.state.dungeonCooldowns[dungeonId] || 0) > 0) return false;
        return true;
    }

    runDungeon(dungeonId) {
        const dungeon = GameData.dungeons.find(d => d.id === dungeonId);
        if (!dungeon || !this.canEnterDungeon(dungeonId)) return null;

        const results = { waves: [], totalGold: 0, totalExp: 0, drops: [], success: true };

        // Simulate waves
        for (let wave = 0; wave < dungeon.waves; wave++) {
            const enemyId = dungeon.enemies[wave % dungeon.enemies.length];
            const enemy = GameData.scaleEnemy(enemyId, dungeon.requiredLevel);

            let waveSuccess = true;
            let waveRounds = 0;

            // Simple sim: keep attacking until one side dies
            while (enemy.currentHp > 0 && this.state.player.currentHp > 0) {
                waveRounds++;
                const atk = this.getTotalStat('atk');
                const playerDef = this.getTotalStat('def');

                let playerDmg = Math.max(1, atk - enemy.def);
                let enemyDmg = Math.max(1, enemy.atk - playerDef);

                // Variance
                playerDmg = Math.floor(playerDmg * (0.9 + Math.random() * 0.2));
                enemyDmg = Math.floor(enemyDmg * (0.9 + Math.random() * 0.2));

                // Crit
                if (Math.random() * 100 < this.getTotalStat('crit')) {
                    playerDmg *= 2;
                }

                enemy.currentHp -= playerDmg;
                if (enemy.currentHp <= 0) break;
                this.state.player.currentHp -= enemyDmg;

                if (waveRounds > 200) { waveSuccess = false; break; }
            }

            if (this.state.player.currentHp <= 0) {
                results.success = false;
                this.state.player.currentHp = Math.floor(this.getTotalStat('hp') * 0.3);
                break;
            }

            results.waves.push({ enemy: enemy.name, rounds: waveRounds });
        }

        if (results.success) {
            // Rewards
            const goldMin = dungeon.rewards.gold[0];
            const goldMax = dungeon.rewards.gold[1];
            results.totalGold = Math.floor(goldMin + Math.random() * (goldMax - goldMin));
            results.totalExp = dungeon.rewards.exp;

            this.state.player.gold += results.totalGold;
            this.addExp(results.totalExp);

            // Drops
            if (dungeon.rewards.drops) {
                for (const drop of dungeon.rewards.drops) {
                    if (Math.random() < drop.chance) {
                        this.addItem(drop.itemId);
                        results.drops.push(drop.itemId);
                    }
                }
            }

            // Quest progress
            this.updateQuestProgress('dungeon', dungeonId);
        }

        // Start cooldown
        this.state.dungeonCooldowns[dungeonId] = dungeon.cooldown;

        // Heal back
        this.state.player.currentHp = Math.min(this.state.player.currentHp, this.getTotalStat('hp'));

        return results;
    }

    // ========================
    // Quests
    // ========================
    initQuests() {
        for (const quest of GameData.quests) {
            if (!this.state.questProgress[quest.id]) {
                this.state.questProgress[quest.id] = { current: 0, claimed: false };
            }
        }
    }

    updateQuestProgress(type, targetId) {
        for (const quest of GameData.quests) {
            const progress = this.state.questProgress[quest.id];
            if (!progress || progress.claimed) continue;

            const target = quest.target;
            let match = false;

            if (target.type === 'kill' && type === 'kill' && target.enemyId === targetId) match = true;
            if (target.type === 'kill_any' && (type === 'kill' || type === 'kill_any')) match = true;
            if (target.type === 'collect' && type === 'collect' && target.itemId === targetId) match = true;
            if (target.type === 'dungeon' && type === 'dungeon' && target.dungeonId === targetId) match = true;
            if (target.type === 'level' && type === 'level') {
                progress.current = this.state.player.level;
                if (this.onQuestUpdate) this.onQuestUpdate(quest.id);
                continue;
            }

            if (match) {
                progress.current++;
                if (this.onQuestUpdate) this.onQuestUpdate(quest.id);
            }
        }
    }

    claimQuest(questId) {
        const quest = GameData.quests.find(q => q.id === questId);
        const progress = this.state.questProgress[questId];
        if (!quest || !progress || progress.claimed) return false;
        if (progress.current < quest.target.count) return false;

        progress.claimed = true;

        // Grant rewards
        if (quest.rewards.gold) this.state.player.gold += quest.rewards.gold;
        if (quest.rewards.exp) this.addExp(quest.rewards.exp);
        if (quest.rewards.gems) this.state.player.gems += quest.rewards.gems;
        if (quest.rewards.items) {
            for (const itemId of quest.rewards.items) {
                this.addItem(itemId);
            }
        }

        if (this.onLogMessage) {
            this.onLogMessage(`📜 Quest completed: ${quest.name}!`, 'loot');
        }
        return true;
    }

    // ========================
    // Save / Load
    // ========================
    saveGame() {
        try {
            const saveData = JSON.stringify(this.state);
            localStorage.setItem('fantasyIdle_save', saveData);
            this.state.lastSaveTime = Date.now();
            return true;
        } catch {
            return false;
        }
    }

    loadGame() {
        try {
            const saveData = localStorage.getItem('fantasyIdle_save');
            if (saveData) {
                const loaded = JSON.parse(saveData);
                // Merge with defaults (in case of new fields)
                this.state = this._deepMerge(this.state, loaded);
                this.recalculateStats();
                return true;
            }
        } catch {
            // Corrupted save - start fresh
        }
        return false;
    }

    resetGame() {
        localStorage.removeItem('fantasyIdle_save');
        location.reload();
    }

    _deepMerge(target, source) {
        const result = { ...target };
        for (const key of Object.keys(source)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this._deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }

    // ========================
    // Utility
    // ========================
    formatNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return Math.floor(num).toString();
    }

    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
}

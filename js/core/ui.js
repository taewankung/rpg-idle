/* ============================================
   Fantasy Idle MMORPG - UI Manager
   Handles all DOM updates and user interactions
   ============================================ */

class UIManager {
    constructor(engine) {
        this.engine = engine;
        this.elements = {};
        this.damageNumberId = 0;
        this.minimap = new MinimapRenderer();
    }

    // ========================
    // Initialization
    // ========================
    init() {
        this.cacheElements();
        this.bindEvents();
        this.setupCallbacks();
        this.renderAll();
        this.minimap.init();
        this.syncMinimapZone();
        this.syncMinimapEntities();
        this.startInitialApproach();
    }

    cacheElements() {
        const ids = [
            'gold-amount', 'gems-amount', 'exp-amount',
            'char-avatar', 'char-name', 'char-class', 'char-level',
            'exp-bar-fill', 'exp-bar-text',
            'stat-hp', 'stat-mp', 'stat-atk', 'stat-def', 'stat-spd', 'stat-crit',
            'skills-list',
            'zone-name', 'zone-level',
            'player-battle-avatar', 'player-battle-name',
            'player-hp-bar', 'player-hp-text',
            'player-mp-bar', 'player-mp-text',
            'enemy-avatar', 'enemy-name', 'enemy-hp-bar', 'enemy-hp-text',
            'auto-battle-status', 'battle-effects', 'battle-log',
            'equipment-slots', 'inventory-grid',
            'dungeon-list', 'quest-list', 'shop-list', 'shop-header',
            'dps-value', 'kills-value', 'playtime-value',
            'tooltip', 'modal-overlay', 'modal', 'modal-title', 'modal-body', 'modal-close',
        ];

        for (const id of ids) {
            this.elements[id] = document.getElementById(id);
        }
    }

    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Zone navigation
        document.getElementById('btn-prev-zone').addEventListener('click', () => {
            if (this.engine.changeZone(-1)) this.renderZone();
        });

        document.getElementById('btn-next-zone').addEventListener('click', () => {
            if (this.engine.changeZone(1)) this.renderZone();
        });

        // Auto battle toggle
        document.getElementById('btn-auto-battle').addEventListener('click', () => {
            this.engine.state.autoBattle = !this.engine.state.autoBattle;
            this.elements['auto-battle-status'].textContent = this.engine.state.autoBattle ? 'ON' : 'OFF';
        });

        // Battle speed
        document.querySelectorAll('.btn-speed').forEach(btn => {
            btn.addEventListener('click', () => {
                this.engine.state.battleSpeed = parseInt(btn.dataset.speed);
                document.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Save button
        document.getElementById('btn-save').addEventListener('click', () => {
            if (this.engine.saveGame()) {
                this.addLog('💾 Game saved!', 'system');
            }
        });

        // Modal close
        this.elements['modal-close'].addEventListener('click', () => this.closeModal());
        this.elements['modal-overlay'].addEventListener('click', (e) => {
            if (e.target === this.elements['modal-overlay']) this.closeModal();
        });

        // Minimap resize
        window.addEventListener('resize', () => {
            if (this.minimap && this.minimap.canvas) this.minimap.resize();
        });

        // Equipment slot clicks
        document.querySelectorAll('.equip-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                const slotName = slot.dataset.slot;
                if (this.engine.state.player.equipment[slotName]) {
                    this.engine.unequipItem(slotName);
                    this.renderEquipment();
                    this.renderInventory();
                    this.renderStats();
                }
            });
        });
    }

    setupCallbacks() {
        this.engine.onBattleUpdate = () => this.updateBattle();
        this.engine.onLogMessage = (msg, type) => {
            this.addLog(msg, type);
            // Detect skill usage for minimap effects
            if (type === 'player-action' && msg.startsWith('✨ Used')) {
                this.showSkillOnMinimap(msg);
            }
        };
        this.engine.onEnemyDefeated = (enemy) => this.onEnemyDefeated(enemy);
        this.engine.onLevelUp = (level) => this.onLevelUp(level);
        this.engine.onLoot = (value, type) => this.showDamageNumber(value, type);
        this.engine.onQuestUpdate = () => this.renderQuests();

        // Movement phase: when a new enemy spawns, start approach
        this.engine.onEnemySpawned = () => {
            // Sync zone first (rebuilds grid + resets positions if zone changed)
            this.syncMinimapZone();
            this.syncMinimapEntities();
            this.minimap.spawnEnemyPosition();
            this.minimap.startApproach();
        };

        // When minimap says entities are in range, enable combat
        this.minimap.onReachedEnemy = () => {
            this.engine.battleReady = true;
        };
    }

    syncMinimapZone() {
        const zone = GameData.zones[this.engine.state.currentZoneIndex];
        if (zone) this.minimap.setZone(zone.id);
    }

    syncMinimapEntities() {
        const p = this.engine.state.player;
        const classData = GameData.classes[p.classId];
        this.minimap.setPlayerInfo(classData.avatar, p.name);

        const enemy = this.engine.state.currentEnemy;
        if (enemy) {
            this.minimap.setEnemyInfo(enemy.icon, enemy.name);
        }
    }

    // Start the first approach on init (enemy already exists from engine.init)
    startInitialApproach() {
        this.syncMinimapEntities();
        if (this.engine.state.currentEnemy) {
            this.minimap.startApproach();
        }
    }

    showSkillOnMinimap(msg) {
        // Find which skill was used by matching the name
        const player = this.engine.state.player;
        for (const [skillId] of Object.entries(player.skills)) {
            const skillData = GameData.skills[skillId];
            if (skillData && msg.includes(skillData.name)) {
                const target = skillData.healMultiplier ? 'player' : 'enemy';
                this.minimap.showSkillEffect(skillData.icon, target);
                break;
            }
        }
    }

    // ========================
    // Render All
    // ========================
    renderAll() {
        this.renderResources();
        this.renderCharacter();
        this.renderStats();
        this.renderSkills();
        this.renderZone();
        this.renderEquipment();
        this.renderInventory();
        this.renderDungeons();
        this.renderQuests();
        this.renderShop();
    }

    // ========================
    // Resources
    // ========================
    renderResources() {
        const p = this.engine.state.player;
        this.elements['gold-amount'].textContent = this.engine.formatNumber(p.gold);
        this.elements['gems-amount'].textContent = this.engine.formatNumber(p.gems);
        this.elements['exp-amount'].textContent = this.engine.formatNumber(p.exp);
    }

    // ========================
    // Character Info
    // ========================
    renderCharacter() {
        const p = this.engine.state.player;
        const classData = GameData.classes[p.classId];
        this.elements['char-avatar'].textContent = classData.avatar;
        this.elements['char-name'].textContent = p.name;
        this.elements['char-class'].textContent = classData.name;
        this.elements['char-level'].textContent = p.level;
        this.elements['player-battle-avatar'].textContent = classData.avatar;
        this.elements['player-battle-name'].textContent = p.name;
        this.minimap.setPlayerInfo(classData.avatar, p.name);
    }

    renderStats() {
        const engine = this.engine;
        const p = engine.state.player;

        const maxHp = engine.getTotalStat('hp');
        const maxMp = engine.getTotalStat('mp');

        this.elements['stat-hp'].textContent = `${Math.floor(p.currentHp)} / ${maxHp}`;
        this.elements['stat-mp'].textContent = `${Math.floor(p.currentMp)} / ${maxMp}`;
        this.elements['stat-atk'].textContent = engine.getTotalStat('atk');
        this.elements['stat-def'].textContent = engine.getTotalStat('def');
        this.elements['stat-spd'].textContent = engine.getTotalStat('spd');
        this.elements['stat-crit'].textContent = engine.getTotalStat('crit') + '%';
    }

    // ========================
    // Skills
    // ========================
    renderSkills() {
        const container = this.elements['skills-list'];
        container.innerHTML = '';

        const player = this.engine.state.player;
        for (const [skillId, skillState] of Object.entries(player.skills)) {
            if (skillState.level <= 0) continue;
            const skillData = GameData.skills[skillId];
            if (!skillData) continue;

            const div = document.createElement('div');
            div.className = 'skill-item';
            if (skillState.cooldownRemaining > 0) div.classList.add('on-cooldown');

            const cooldownPercent = skillData.cooldown > 0
                ? (skillState.cooldownRemaining / skillData.cooldown) * 100
                : 0;

            div.innerHTML = `
                <div class="skill-cooldown-overlay" style="width: ${cooldownPercent}%"></div>
                <span class="skill-icon">${skillData.icon}</span>
                <div class="skill-info">
                    <div class="skill-name">${skillData.name}</div>
                    <div class="skill-level">Lv.${skillState.level} ${skillData.type === 'passive' ? '(Passive)' : ''}</div>
                </div>
            `;

            div.addEventListener('click', () => this.showSkillDetail(skillId));
            container.appendChild(div);
        }
    }

    showSkillDetail(skillId) {
        const skillData = GameData.skills[skillId];
        const skillState = this.engine.state.player.skills[skillId];
        if (!skillData || !skillState) return;

        let body = `<p>${skillData.description}</p>`;
        body += `<p>Level: ${skillState.level} / ${skillData.maxLevel}</p>`;
        if (skillData.type === 'active') {
            body += `<p>Cooldown: ${skillData.cooldown}s | MP Cost: ${skillData.mpCost}</p>`;
        }

        if (skillState.level < skillData.maxLevel) {
            body += `<br><button class="btn-buy" id="btn-upgrade-skill">⬆️ Upgrade (${skillState.level * 50} Gold)</button>`;
        }

        this.showModal(`${skillData.icon} ${skillData.name}`, body);

        const upgradeBtn = document.getElementById('btn-upgrade-skill');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                const cost = skillState.level * 50;
                if (this.engine.state.player.gold >= cost) {
                    this.engine.state.player.gold -= cost;
                    skillState.level++;
                    this.closeModal();
                    this.renderSkills();
                    this.renderResources();
                    this.renderStats();
                    this.addLog(`✨ ${skillData.name} upgraded to Lv.${skillState.level}!`, 'level-up');
                }
            });
        }
    }

    // ========================
    // Zone
    // ========================
    renderZone() {
        const zone = GameData.zones[this.engine.state.currentZoneIndex];
        if (!zone) return;
        this.elements['zone-name'].textContent = `${zone.icon} ${zone.name}`;
        this.elements['zone-level'].textContent = `Lv. ${zone.levelRange[0]}-${zone.levelRange[1]}`;
        this.syncMinimapZone();
    }

    // ========================
    // Battle Updates
    // ========================
    updateBattle() {
        const engine = this.engine;
        const player = engine.state.player;
        const enemy = engine.state.currentEnemy;

        // Player HP bar
        const maxHp = engine.getTotalStat('hp');
        const hpPercent = (player.currentHp / maxHp) * 100;
        this.elements['player-hp-bar'].style.width = `${Math.max(0, hpPercent)}%`;
        this.elements['player-hp-text'].textContent = `${Math.floor(player.currentHp)}/${maxHp}`;

        // Player MP bar
        const maxMp = engine.getTotalStat('mp');
        const mpPercent = (player.currentMp / maxMp) * 100;
        this.elements['player-mp-bar'].style.width = `${Math.max(0, mpPercent)}%`;
        this.elements['player-mp-text'].textContent = `${Math.floor(player.currentMp)}/${maxMp}`;

        // EXP bar
        const expRequired = GameData.getExpRequired(player.level);
        const expPercent = (player.exp / expRequired) * 100;
        this.elements['exp-bar-fill'].style.width = `${expPercent}%`;
        this.elements['exp-bar-text'].textContent = `${engine.formatNumber(player.exp)} / ${engine.formatNumber(expRequired)}`;

        // Enemy
        if (enemy) {
            this.elements['enemy-avatar'].textContent = enemy.icon;
            this.elements['enemy-name'].textContent = enemy.name;
            const enemyHpPercent = (enemy.currentHp / enemy.maxHp) * 100;
            this.elements['enemy-hp-bar'].style.width = `${Math.max(0, enemyHpPercent)}%`;
            this.elements['enemy-hp-text'].textContent = `${Math.floor(Math.max(0, enemy.currentHp))}/${enemy.maxHp}`;

            // Sync minimap
            this.minimap.setEnemyHpRatio(Math.max(0, enemy.currentHp / enemy.maxHp));
            this.minimap.setEnemyInfo(enemy.icon, enemy.name);
        }

        // Sync player HP to minimap
        this.minimap.setPlayerHpRatio(Math.max(0, player.currentHp / maxHp));

        // Resources
        this.renderResources();

        // Footer stats
        this.elements['dps-value'].textContent = engine.formatNumber(engine.currentDps);
        this.elements['kills-value'].textContent = engine.formatNumber(engine.state.totalKills);
        this.elements['playtime-value'].textContent = engine.formatTime(engine.state.playTime);

        // Update stats panel
        this.renderStats();

        // Update skill cooldowns visually
        this.updateSkillCooldowns();
    }

    updateSkillCooldowns() {
        const items = this.elements['skills-list'].querySelectorAll('.skill-item');
        const player = this.engine.state.player;
        const skillEntries = Object.entries(player.skills).filter(([, s]) => s.level > 0);

        items.forEach((item, i) => {
            if (i >= skillEntries.length) return;
            const [skillId, skillState] = skillEntries[i];
            const skillData = GameData.skills[skillId];
            if (!skillData) return;

            const overlay = item.querySelector('.skill-cooldown-overlay');
            if (overlay) {
                const pct = skillData.cooldown > 0 ? (skillState.cooldownRemaining / skillData.cooldown) * 100 : 0;
                overlay.style.width = `${pct}%`;
            }

            if (skillState.cooldownRemaining > 0) {
                item.classList.add('on-cooldown');
            } else {
                item.classList.remove('on-cooldown');
            }
        });
    }

    onEnemyDefeated(enemy) {
        // Death burst effect on minimap
        this.minimap.showEnemyDeath();

        // Re-render inventory in case of drops
        this.renderInventory();
        // Note: new enemy sync & approach is handled by onEnemySpawned callback
    }

    onLevelUp(level) {
        const charPanel = document.querySelector('.character-panel');
        charPanel.classList.add('level-up-glow');
        setTimeout(() => charPanel.classList.remove('level-up-glow'), 3000);

        this.renderCharacter();
        this.renderStats();
        this.renderSkills();
        this.renderDungeons();
        this.renderQuests();
    }

    showDamageNumber(value, type) {
        // Determine target and trigger minimap effects
        if (type === 'heal') {
            this.minimap.showDamageOnMap(value, type, 'player');
            this.minimap.showHealEffect();
        } else if (type === 'player-dmg' || type === 'crit') {
            // Player dealt damage to enemy
            this.minimap.triggerPlayerAttack();
            this.minimap.triggerEnemyHit();
            this.minimap.showDamageOnMap(value, type, 'enemy');
        } else if (type === 'enemy-dmg') {
            // Enemy dealt damage to player
            this.minimap.triggerEnemyAttack();
            this.minimap.triggerPlayerHit();
            this.minimap.showDamageOnMap(value, type, 'player');
        }
    }

    // ========================
    // Equipment
    // ========================
    renderEquipment() {
        const equip = this.engine.state.player.equipment;
        for (const [slot, itemId] of Object.entries(equip)) {
            const nameEl = document.getElementById(`equip-${slot}`);
            if (!nameEl) continue;

            if (itemId) {
                const itemData = GameData.items[itemId];
                nameEl.textContent = itemData ? `${itemData.icon} ${itemData.name}` : itemId;
                nameEl.classList.add('equipped');
                nameEl.parentElement.classList.add('has-item');
                nameEl.parentElement.style.borderColor = `var(--rarity-${itemData?.rarity || 'common'})`;
            } else {
                nameEl.textContent = 'Empty';
                nameEl.classList.remove('equipped');
                nameEl.parentElement.classList.remove('has-item');
                nameEl.parentElement.style.borderColor = '';
            }
        }
    }

    // ========================
    // Inventory
    // ========================
    renderInventory() {
        const container = this.elements['inventory-grid'];
        container.innerHTML = '';

        const inv = this.engine.state.inventory;
        const totalSlots = 20;

        for (let i = 0; i < totalSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';

            if (i < inv.length) {
                const item = inv[i];
                const itemData = GameData.items[item.id];
                if (itemData) {
                    slot.textContent = itemData.icon;
                    slot.classList.add(`rarity-${itemData.rarity}`);
                    if (item.count > 1) {
                        const countEl = document.createElement('span');
                        countEl.className = 'item-count';
                        countEl.textContent = item.count;
                        slot.appendChild(countEl);
                    }
                    slot.addEventListener('click', () => this.showItemDetail(item.id));
                }
            }

            container.appendChild(slot);
        }
    }

    showItemDetail(itemId) {
        const itemData = GameData.items[itemId];
        if (!itemData) return;

        const count = this.engine.getItemCount(itemId);
        let body = `<p style="color: var(--rarity-${itemData.rarity})">[${itemData.rarity.toUpperCase()}]</p>`;
        body += `<p>${itemData.description}</p>`;
        body += `<p>Count: ${count}</p>`;

        if (itemData.stats) {
            body += '<div style="margin-top:8px">';
            for (const [stat, val] of Object.entries(itemData.stats)) {
                const sign = val >= 0 ? '+' : '';
                body += `<div style="color: var(--green-heal)">${stat.toUpperCase()}: ${sign}${val}</div>`;
            }
            body += '</div>';
        }

        body += '<div style="margin-top:12px; display: flex; gap: 8px; flex-wrap: wrap">';

        if (itemData.slot) {
            body += `<button class="btn-buy" id="btn-equip-item">🎽 Equip</button>`;
        }

        if (itemData.type === 'consumable') {
            body += `<button class="btn-buy" id="btn-use-item">🧪 Use</button>`;
            if (count > 1) {
                body += `<button class="btn-buy" id="btn-use-all-item" style="background: linear-gradient(135deg, #1a6b2a, #27ae60)">🧪 Use All (${count})</button>`;
            }
        }

        body += `<button class="btn-buy" id="btn-sell-item" style="background: linear-gradient(135deg, #7d3c1f, #c0392b)">💰 Sell (${itemData.sellPrice}g)</button>`;
        if (count > 1) {
            body += `<button class="btn-buy" id="btn-sell-all-item" style="background: linear-gradient(135deg, #7d3c1f, #c0392b)">💰 Sell All (${count}) = ${itemData.sellPrice * count}g</button>`;
        }
        body += '</div>';

        this.showModal(`${itemData.icon} ${itemData.name}`, body);

        // Bind actions
        const equipBtn = document.getElementById('btn-equip-item');
        if (equipBtn) {
            equipBtn.addEventListener('click', () => {
                this.engine.equipItem(itemId);
                this.closeModal();
                this.renderEquipment();
                this.renderInventory();
                this.renderStats();
            });
        }

        const useBtn = document.getElementById('btn-use-item');
        if (useBtn) {
            useBtn.addEventListener('click', () => {
                if (this.engine.useItem(itemId)) {
                    this.addLog(`🧪 Used ${itemData.name}`, 'system');
                }
                this.closeModal();
                this.renderInventory();
                this.renderStats();
            });
        }

        const sellBtn = document.getElementById('btn-sell-item');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                if (this.engine.sellItem(itemId)) {
                    this.addLog(`💰 Sold ${itemData.name} for ${itemData.sellPrice}g`, 'loot');
                }
                this.closeModal();
                this.renderInventory();
                this.renderResources();
            });
        }

        const useAllBtn = document.getElementById('btn-use-all-item');
        if (useAllBtn) {
            useAllBtn.addEventListener('click', () => {
                const used = this.engine.useAllItems(itemId);
                if (used > 0) {
                    this.addLog(`🧪 Used ${itemData.name} x${used}`, 'system');
                }
                this.closeModal();
                this.renderInventory();
                this.renderStats();
            });
        }

        const sellAllBtn = document.getElementById('btn-sell-all-item');
        if (sellAllBtn) {
            sellAllBtn.addEventListener('click', () => {
                const totalGold = itemData.sellPrice * this.engine.getItemCount(itemId);
                const sold = this.engine.sellAllItems(itemId);
                if (sold > 0) {
                    this.addLog(`💰 Sold ${itemData.name} x${sold} for ${totalGold}g`, 'loot');
                }
                this.closeModal();
                this.renderInventory();
                this.renderResources();
            });
        }
    }

    // ========================
    // Dungeons
    // ========================
    renderDungeons() {
        const container = this.elements['dungeon-list'];
        if (!container) return;
        container.innerHTML = '';

        for (const dungeon of GameData.dungeons) {
            const canEnter = this.engine.canEnterDungeon(dungeon.id);
            const locked = this.engine.state.player.level < dungeon.requiredLevel;
            const cooldown = this.engine.state.dungeonCooldowns[dungeon.id] || 0;

            const card = document.createElement('div');
            card.className = `dungeon-card ${locked ? 'locked' : ''}`;

            let statusText = '';
            if (locked) statusText = `🔒 Requires Lv.${dungeon.requiredLevel}`;
            else if (cooldown > 0) statusText = `⏱️ ${this.engine.formatTime(cooldown)}`;
            else statusText = '✅ Ready';

            card.innerHTML = `
                <div class="dungeon-icon">${dungeon.icon}</div>
                <div class="dungeon-info">
                    <div class="dungeon-name">${dungeon.name}</div>
                    <div class="dungeon-desc">${dungeon.description}</div>
                    <div class="dungeon-req">${statusText} | Waves: ${dungeon.waves}</div>
                </div>
                <div class="dungeon-reward">
                    🪙 ${dungeon.rewards.gold[0]}-${dungeon.rewards.gold[1]}<br>
                    ⭐ ${dungeon.rewards.exp}
                </div>
            `;

            if (canEnter) {
                card.addEventListener('click', () => {
                    const result = this.engine.runDungeon(dungeon.id);
                    if (result) this.showDungeonResult(dungeon, result);
                    this.renderDungeons();
                });
            }

            container.appendChild(card);
        }
    }

    showDungeonResult(dungeon, result) {
        let body = '';
        if (result.success) {
            body += '<p style="color: var(--green-heal); font-size: 1.2rem">✅ Victory!</p>';
            body += `<p>Waves Cleared: ${result.waves.length}/${dungeon.waves}</p>`;
            body += `<p>🪙 Gold: +${result.totalGold}</p>`;
            body += `<p>⭐ EXP: +${result.totalExp}</p>`;
            if (result.drops.length > 0) {
                body += '<p>🎁 Drops:</p>';
                for (const dropId of result.drops) {
                    const item = GameData.items[dropId];
                    if (item) body += `<p style="color: var(--rarity-${item.rarity})">${item.icon} ${item.name}</p>`;
                }
            }
        } else {
            body += '<p style="color: var(--red-hp); font-size: 1.2rem">❌ Defeated!</p>';
            body += `<p>Waves Cleared: ${result.waves.length}/${dungeon.waves}</p>`;
            body += '<p>You need to get stronger!</p>';
        }

        this.showModal(`${dungeon.icon} ${dungeon.name}`, body);
        this.renderInventory();
        this.renderResources();
        this.renderStats();
    }

    // ========================
    // Quests
    // ========================
    renderQuests() {
        const container = this.elements['quest-list'];
        if (!container) return;
        container.innerHTML = '';

        for (const quest of GameData.quests) {
            const progress = this.engine.state.questProgress[quest.id];
            if (!progress) continue;

            const card = document.createElement('div');
            card.className = 'quest-card';

            const current = Math.min(progress.current, quest.target.count);
            const percent = (current / quest.target.count) * 100;
            const isComplete = current >= quest.target.count && !progress.claimed;

            let rewardText = '';
            if (quest.rewards.gold) rewardText += `🪙${quest.rewards.gold} `;
            if (quest.rewards.exp) rewardText += `⭐${quest.rewards.exp} `;
            if (quest.rewards.gems) rewardText += `💎${quest.rewards.gems} `;

            card.innerHTML = `
                <div class="quest-header">
                    <span class="quest-name">${quest.name}</span>
                    <span class="quest-type ${quest.type}">${quest.type.toUpperCase()}</span>
                </div>
                <div class="quest-desc">${quest.description}</div>
                <div class="quest-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%; background: ${progress.claimed ? 'var(--text-muted)' : 'linear-gradient(90deg, var(--gold-dark), var(--gold))'}"></div>
                        <span class="progress-text">${current}/${quest.target.count}</span>
                    </div>
                    <span class="quest-progress-text">${progress.claimed ? '✅ Claimed' : (isComplete ? '' : `${Math.floor(percent)}%`)}</span>
                    ${isComplete ? '<button class="btn-claim quest-claim-btn">Claim</button>' : ''}
                </div>
                <div class="quest-reward">Reward: ${rewardText}</div>
            `;

            const claimBtn = card.querySelector('.quest-claim-btn');
            if (claimBtn) {
                claimBtn.addEventListener('click', () => {
                    this.engine.claimQuest(quest.id);
                    this.renderQuests();
                    this.renderResources();
                    this.renderInventory();
                });
            }

            container.appendChild(card);
        }
    }

    // ========================
    // Shop
    // ========================
    renderShop() {
        // --- Shop Header (name + upgrade) ---
        const header = this.elements['shop-header'];
        if (header) {
            const shopLevel = this.engine.state.shopLevel;
            const shopData = GameData.getShopData(shopLevel);
            const maxLevel = GameData.getMaxShopLevel();
            const isMaxed = shopLevel >= maxLevel;
            const nextData = !isMaxed ? GameData.getShopData(shopLevel + 1) : null;
            const canUpgrade = nextData && this.engine.state.player.gold >= nextData.upgradeCost;
            const discount = shopData.discount;

            let headerHtml = `<div class="shop-header-row">`;
            headerHtml += `<div class="shop-title">${shopData.icon} ${shopData.name} <span class="shop-level">Lv.${shopLevel}</span></div>`;
            if (discount > 0) {
                headerHtml += `<div class="shop-discount">🏷️ -${discount}% discount</div>`;
            }
            headerHtml += `</div>`;

            if (!isMaxed) {
                headerHtml += `<div class="shop-upgrade-row">`;
                headerHtml += `<div class="shop-upgrade-info">⬆️ Next: ${nextData.icon} ${nextData.name}`;
                if (nextData.discount > 0) headerHtml += ` <span class="shop-discount-preview">(-${nextData.discount}%)</span>`;
                headerHtml += `</div>`;
                headerHtml += `<button class="btn-upgrade-shop" id="btn-upgrade-shop" ${canUpgrade ? '' : 'disabled'}>🪙 ${this.engine.formatNumber(nextData.upgradeCost)} Upgrade</button>`;
                headerHtml += `</div>`;
            } else {
                headerHtml += `<div class="shop-upgrade-row"><div class="shop-upgrade-info">✨ Max Level!</div></div>`;
            }
            header.innerHTML = headerHtml;

            const upgradeBtn = header.querySelector('#btn-upgrade-shop');
            if (upgradeBtn) {
                upgradeBtn.addEventListener('click', () => {
                    if (this.engine.upgradeShop()) {
                        this.renderShop();
                        this.renderResources();
                    }
                });
            }
        }

        // --- Shop Item List ---
        const container = this.elements['shop-list'];
        if (!container) return;
        container.innerHTML = '';

        const shopData = GameData.getShopData(this.engine.state.shopLevel);
        if (!shopData) return;

        for (const shopEntry of shopData.items) {
            const itemData = GameData.items[shopEntry.itemId];
            if (!itemData || !itemData.buyPrice) continue;

            const price = this.engine.getDiscountedPrice(itemData.buyPrice);
            const canAfford = this.engine.state.player.gold >= price;
            const hasDiscount = price < itemData.buyPrice;

            const div = document.createElement('div');
            div.className = 'shop-item';

            let priceHtml = `🪙 ${price}`;
            if (hasDiscount) {
                priceHtml = `<span class="shop-original-price">${itemData.buyPrice}</span> 🪙 ${price}`;
            }

            div.innerHTML = `
                <div class="shop-item-icon">${itemData.icon}</div>
                <div class="shop-item-info">
                    <div class="shop-item-name" style="color: var(--rarity-${itemData.rarity})">${itemData.name}</div>
                    <div class="shop-item-desc">${itemData.description}</div>
                </div>
                <div class="shop-item-price">${priceHtml}</div>
                <button class="btn-buy" ${canAfford ? '' : 'disabled'}>Buy</button>
            `;

            const buyBtn = div.querySelector('.btn-buy');
            buyBtn.addEventListener('click', () => {
                if (this.engine.buyItem(shopEntry.itemId)) {
                    this.addLog(`🛒 Bought ${itemData.name} for ${price}g!`, 'loot');
                    this.renderShop();
                    this.renderResources();
                    this.renderInventory();
                }
            });

            container.appendChild(div);
        }
    }

    // ========================
    // Tabs
    // ========================
    switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        document.querySelector(`.tab-btn[data-tab="${tabId}"]`)?.classList.add('active');
        document.getElementById(`tab-${tabId}`)?.classList.add('active');

        // Refresh tab content
        if (tabId === 'dungeon') this.renderDungeons();
        if (tabId === 'quest') this.renderQuests();
        if (tabId === 'shop') this.renderShop();
    }

    // ========================
    // Battle Log
    // ========================
    addLog(message, type = 'system') {
        const log = this.elements['battle-log'];
        if (!log) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;
        log.appendChild(entry);

        // Keep only last 100 entries
        while (log.children.length > 100) {
            log.removeChild(log.firstChild);
        }

        log.scrollTop = log.scrollHeight;
    }

    // ========================
    // Modal
    // ========================
    showModal(title, bodyHtml) {
        this.elements['modal-title'].textContent = title;
        this.elements['modal-body'].innerHTML = bodyHtml;
        this.elements['modal-overlay'].classList.remove('hidden');
    }

    closeModal() {
        this.elements['modal-overlay'].classList.add('hidden');
    }
}

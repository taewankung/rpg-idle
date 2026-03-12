/* ============================================
   Fantasy Idle MMORPG - UI Manager
   Handles all DOM updates and user interactions
   ============================================ */

class UIManager {
    constructor(engine) {
        this.engine = engine;
        this.elements = {};
        this.damageNumberId = 0;
    }

    // ========================
    // Initialization
    // ========================
    init() {
        this.cacheElements();
        this.bindEvents();
        this.setupCallbacks();
        this.renderAll();
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
            'enemy-avatar', 'enemy-name', 'enemy-hp-bar', 'enemy-hp-text',
            'auto-battle-status', 'battle-effects', 'battle-log',
            'equipment-slots', 'inventory-grid',
            'dungeon-list', 'quest-list', 'shop-list',
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
        this.engine.onLogMessage = (msg, type) => this.addLog(msg, type);
        this.engine.onEnemyDefeated = () => this.onEnemyDefeated();
        this.engine.onLevelUp = (level) => this.onLevelUp(level);
        this.engine.onLoot = (value, type) => this.showDamageNumber(value, type);
        this.engine.onQuestUpdate = () => this.renderQuests();
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
        }

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

    onEnemyDefeated() {
        // Flash enemy
        const el = this.elements['enemy-avatar'];
        el.classList.add('hit');
        setTimeout(() => el.classList.remove('hit'), 300);

        // Re-render inventory in case of drops
        this.renderInventory();
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
        const container = this.elements['battle-effects'];
        if (!container) return;

        const el = document.createElement('div');
        el.className = `damage-number ${type}`;
        el.textContent = type === 'heal' ? `+${value}` : `-${value}`;
        el.style.left = `${Math.random() * 40 - 20}px`;

        container.appendChild(el);
        setTimeout(() => el.remove(), 1000);
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
        }

        body += `<button class="btn-buy" id="btn-sell-item" style="background: linear-gradient(135deg, #7d3c1f, #c0392b)">💰 Sell (${itemData.sellPrice}g)</button>`;
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
        const container = this.elements['shop-list'];
        if (!container) return;
        container.innerHTML = '';

        for (const shopEntry of GameData.shopItems) {
            const itemData = GameData.items[shopEntry.itemId];
            if (!itemData || !itemData.buyPrice) continue;

            const canAfford = this.engine.state.player.gold >= itemData.buyPrice;

            const div = document.createElement('div');
            div.className = 'shop-item';

            div.innerHTML = `
                <div class="shop-item-icon">${itemData.icon}</div>
                <div class="shop-item-info">
                    <div class="shop-item-name" style="color: var(--rarity-${itemData.rarity})">${itemData.name}</div>
                    <div class="shop-item-desc">${itemData.description}</div>
                </div>
                <div class="shop-item-price">🪙 ${itemData.buyPrice}</div>
                <button class="btn-buy" ${canAfford ? '' : 'disabled'}>Buy</button>
            `;

            const buyBtn = div.querySelector('.btn-buy');
            buyBtn.addEventListener('click', () => {
                if (this.engine.buyItem(shopEntry.itemId)) {
                    this.addLog(`🛒 Bought ${itemData.name}!`, 'loot');
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

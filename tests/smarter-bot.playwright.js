const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = path.join(os.tmpdir(), 'rpg-idle-playwright');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png'
};

function createStaticServer(rootDir) {
  return http.createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
      const relativePath = decodeURIComponent(reqUrl.pathname === '/' ? '/index.html' : reqUrl.pathname);
      const filePath = path.resolve(rootDir, '.' + relativePath);
      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      const stat = await fsp.stat(filePath);
      if (stat.isDirectory()) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      res.writeHead(error && error.code === 'ENOENT' ? 404 : 500);
      res.end(error && error.code === 'ENOENT' ? 'Not found' : 'Server error');
    }
  });
}

async function main() {
  await fsp.mkdir(ARTIFACT_DIR, { recursive: true });

  const server = createStaticServer(ROOT_DIR);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (error) => {
    pageErrors.push(String(error));
  });

  async function resetScenario(className) {
    await page.evaluate((cls) => {
      localStorage.clear();
      startGame(cls);
      const p = game.player;
      p.x = 8 * TILE + TILE / 2;
      p.y = Math.floor(MAP_H / 2) * TILE + TILE / 2;
      p.hp = p.maxHp;
      p.mp = p.maxMp;
      p.gold = 500;
      p.inventory = [];
      p.equipment.weapon = null;
      p.equipment.armor = null;
      p.equipment.accessory = null;
      p._path = null;
      p._pathIdx = 0;
      game.monsters = [];
      game.npcPlayers = [];
      game.itemDrops = [];
      game.killCount = 0;
      game.sessionExp = 0;
      botAI.applySettings({
        hpThreshold: 35,
        targetPriority: 'smart',
        maxChaseDistance: 9,
        preferWeaker: true,
        lootNearbyFirst: true,
        stopWhenInventoryAlmostFull: true,
        avoidDangerousTargets: true
      });
      botAI.setEnabled(true, p);
      botAI.state = 'idle';
      botAI.target = null;
      botAI.roamTarget = null;
      botAI.retreatTarget = null;
      botAI.lootTarget = null;
      botAI.stopReason = 'ready';
      botAI.statusText = 'Scanning';
      botAI.focusText = 'Scanning';
      camera.update(p);
    }, className);
  }

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    await resetScenario('Knight');
    await page.evaluate(() => {
      const p = game.player;
      function mon(type, x, y, opts) {
        return Object.assign({
          entityType: 'monster',
          type,
          level: p.level,
          hp: 60,
          maxHp: 60,
          atk: 12,
          def: 3,
          spd: 1.6,
          expReward: 18,
          goldReward: 8,
          x,
          y,
          dir: 'down',
          frame: 0,
          animTimer: 0,
          state: 'patrol',
          patrolCenter: { x, y },
          patrolAngle: 0,
          target: null,
          respawnTimer: 0,
          attackTimer: 0,
          aggroRange: 0,
          attackRange: TILE * 1.2,
          slowTimer: 0,
          isDead: false,
          crit: 0.05
        }, opts || {});
      }
      game.monsters = [
        mon('decoy_npc', p.x + TILE, p.y, { entityType: 'npc', hp: 20, maxHp: 20 }),
        mon('danger_wolf', p.x + TILE * 1.4, p.y, { level: p.level + 8, hp: 180, maxHp: 180, atk: 120, def: 12, expReward: 20, goldReward: 5 }),
        mon('safe_slime', p.x + TILE * 3.2, p.y - TILE * 0.4, { level: p.level, hp: 35, maxHp: 35, atk: 10, def: 2, expReward: 40, goldReward: 14 }),
        mon('far_goblin', p.x + TILE * 18, p.y, { expReward: 200, goldReward: 50 })
      ];
      botAI.state = 'idle';
      botAI.target = null;
      botAI.noTargetTimer = 0;
    });
    await page.evaluate(() => advanceTime(900));
    const targetSelection = await page.evaluate(() => ({
      state: botAI.state,
      target: botAI.target && botAI.target.type,
      targetEntityType: botAI.target && botAI.target.entityType,
      reason: botAI.stopReason
    }));
    assert.equal(targetSelection.target, 'safe_slime', 'Bot should prefer the safer, efficient monster');
    assert.equal(targetSelection.targetEntityType, 'monster', 'Bot must only target monsters');

    await resetScenario('Mage');
    const retreatResult = await page.evaluate(() => {
      const p = game.player;
      p.hp = Math.round(p.maxHp * 0.1);
      p.inventory.push({ name: 'Emergency Potion', type: 'potion', rarity: 'common', stats: { hp: 20 }, level: 1, value: 10 });
      game.monsters = [{
        entityType: 'monster',
        type: 'wolf',
        level: p.level + 1,
        hp: 80,
        maxHp: 80,
        atk: 25,
        def: 4,
        spd: 1.8,
        expReward: 22,
        goldReward: 10,
        x: p.x + TILE * 1.2,
        y: p.y,
        dir: 'down',
        frame: 0,
        animTimer: 0,
        state: 'patrol',
        patrolCenter: { x: p.x + TILE * 1.2, y: p.y },
        patrolAngle: 0,
        target: null,
        respawnTimer: 0,
        attackTimer: 0,
        aggroRange: 0,
        attackRange: TILE * 1.2,
        slowTimer: 0,
        isDead: false,
        crit: 0.05
      }];
      const beforeHp = p.hp;
      advanceTime(500);
      return {
        state: botAI.state,
        reason: botAI.stopReason,
        hpAfter: p.hp,
        beforeHp
      };
    });
    assert.equal(retreatResult.state, 'retreating', 'Bot should retreat at low HP');
    assert.equal(retreatResult.reason, 'low_hp', 'Low HP retreat should expose a clear reason');
    assert.ok(retreatResult.hpAfter >= retreatResult.beforeHp, 'Retreat logic should use available recovery tools');

    await resetScenario('Ranger');
    await page.evaluate(() => {
      const p = game.player;
      game.monsters = [{
        entityType: 'monster',
        type: 'goblin',
        level: p.level,
        hp: 90,
        maxHp: 90,
        atk: 15,
        def: 3,
        spd: 1.4,
        expReward: 20,
        goldReward: 12,
        x: p.x + TILE * 4,
        y: p.y,
        dir: 'down',
        frame: 0,
        animTimer: 0,
        state: 'patrol',
        patrolCenter: { x: p.x + TILE * 4, y: p.y },
        patrolAngle: 0,
        target: null,
        respawnTimer: 0,
        attackTimer: 0,
        aggroRange: 0,
        attackRange: TILE * 1.2,
        slowTimer: 0,
        isDead: false,
        crit: 0.05
      }];
      game.itemDrops = [{
        item: { name: 'Epic Bow', type: 'weapon', rarity: 'epic', stats: { atk: 20, crit: 0.08 }, level: 5, value: 200 },
        x: p.x + TILE * 2.2,
        y: p.y,
        timer: 30
      }];
      botAI.state = 'idle';
      botAI.target = null;
    });
    await page.evaluate(() => advanceTime(300));
    const lootDecision = await page.evaluate(() => ({
      state: botAI.state,
      reason: botAI.stopReason,
      focus: botAI.getFocusLabel()
    }));
    assert.equal(lootDecision.state, 'looting', 'Bot should loot nearby priority drops before re-engaging');
    assert.equal(lootDecision.reason, 'loot_nearby', 'Looting should set a clear reason');
    await page.evaluate(() => advanceTime(4200));
    const lootOutcome = await page.evaluate(() => ({
      dropCount: game.itemDrops.length,
      remainingDropNames: game.itemDrops.map(d => d.item && d.item.name),
      inventoryNames: game.player.inventory.map(i => i && i.name),
      equippedWeapon: game.player.equipment.weapon && game.player.equipment.weapon.name
    }));
    assert.equal(lootOutcome.remainingDropNames.includes('Epic Bow'), false, 'Priority loot should be collected');
    assert.equal(lootOutcome.equippedWeapon, 'Epic Bow', 'Collected upgrades should still auto-equip');

    await resetScenario('Knight');
    const inventoryPressure = await page.evaluate(() => {
      const p = game.player;
      p.x = 5 * TILE + TILE / 2;
      p.y = Math.floor(MAP_H / 2) * TILE + TILE / 2;
      for (let i = 0; i < 18; i++) {
        p.inventory.push({ name: 'Junk ' + i, type: 'armor', rarity: 'common', stats: { def: 1 }, level: 1, value: 1 });
      }
      game.monsters = [{
        entityType: 'monster',
        type: 'slime',
        level: p.level,
        hp: 40,
        maxHp: 40,
        atk: 8,
        def: 1,
        spd: 1.2,
        expReward: 10,
        goldReward: 5,
        x: p.x + TILE * 1.5,
        y: p.y,
        dir: 'down',
        frame: 0,
        animTimer: 0,
        state: 'patrol',
        patrolCenter: { x: p.x + TILE * 1.5, y: p.y },
        patrolAngle: 0,
        target: null,
        respawnTimer: 0,
        attackTimer: 0,
        aggroRange: 0,
        attackRange: TILE * 1.2,
        slowTimer: 0,
        isDead: false,
        crit: 0.05
      }];
      advanceTime(500);
      return {
        state: botAI.state,
        reason: botAI.stopReason,
        render: JSON.parse(window.render_game_to_text())
      };
    });
    assert.equal(inventoryPressure.state, 'retreating', 'Inventory pressure should stop farming and retreat');
    assert.equal(inventoryPressure.reason, 'inventory_full', 'Inventory retreat should expose the correct reason');
    assert.equal(inventoryPressure.render.bot.reason, 'inventory_full', 'Text renderer should expose bot reason');

    await resetScenario('Knight');
    const saveLoadCheck = await page.evaluate(() => {
      botAI.applySettings({
        hpThreshold: 45,
        targetPriority: 'highestExp',
        maxChaseDistance: 12,
        preferWeaker: false,
        lootNearbyFirst: false,
        stopWhenInventoryAlmostFull: false,
        avoidDangerousTargets: false
      });
      saveGame();
      const saved = JSON.parse(localStorage.getItem('idle_rpg_save'));
      const oldSave = JSON.parse(JSON.stringify(saved));
      oldSave.bot = {
        enabled: true,
        hpThreshold: 30,
        targetPriority: 'nearest',
        autoSkill: true
      };
      localStorage.setItem('idle_rpg_save', JSON.stringify(oldSave));
      const loaded = loadGame();
      return {
        savedBot: saved.bot,
        loaded,
        loadedSettings: {
          hpThreshold: botAI.settings.hpThreshold,
          targetPriority: botAI.settings.targetPriority,
          maxChaseDistance: botAI.settings.maxChaseDistance,
          lootNearbyFirst: botAI.settings.lootNearbyFirst,
          avoidDangerousTargets: botAI.settings.avoidDangerousTargets
        },
        render: JSON.parse(window.render_game_to_text())
      };
    });
    assert.equal(typeof saveLoadCheck.savedBot.maxChaseDistance, 'number', 'New bot config should persist into save data');
    assert.equal(saveLoadCheck.loaded, true, 'Loading an older bot save should remain backward compatible');
    assert.equal(saveLoadCheck.loadedSettings.targetPriority, 'nearest', 'Legacy target priority should load unchanged');
    assert.equal(saveLoadCheck.loadedSettings.maxChaseDistance, 9, 'Missing chase distance should fall back to default');
    assert.equal(saveLoadCheck.loadedSettings.lootNearbyFirst, true, 'Missing loot setting should fall back to default');
    assert.equal(saveLoadCheck.render.bot.settings.maxChaseDistance, 9, 'Text state should expose loaded defaults');

    const hudShot = path.join(ARTIFACT_DIR, 'smarter-bot-panel.png');
    await page.screenshot({ path: hudShot });

    assert.deepEqual(consoleErrors, [], 'Expected no console errors');
    assert.deepEqual(pageErrors, [], 'Expected no page errors');
    console.log('Smarter Bot AI tests passed.');
    console.log('Artifact:', hudShot);
  } finally {
    await page.close();
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

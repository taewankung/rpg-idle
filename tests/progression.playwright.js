const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = path.join(os.tmpdir(), 'rpg-idle-progression-playwright');

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
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

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

  async function resetScenario(className, extra) {
    await page.evaluate(({ cls, extraGold }) => {
      localStorage.clear();
      startGame(cls);
      const p = game.player;
      p.gold = extraGold || 0;
      p.hp = p.maxHp;
      p.mp = p.maxMp;
      p.inventory = [];
      p.equipment.weapon = null;
      p.equipment.armor = null;
      p.equipment.accessory = null;
      p.skillPoints = 0;
      p.skillLevels = [0, 0, 0, 0];
      p.jobLevel = 1;
      p.jobExp = 0;
      p.exp = 0;
      p.level = 1;
      if (typeof statPointSystem !== 'undefined') {
        statPointSystem.allocated = { STR: 0, VIT: 0, INT: 0, DEX: 0, AGI: 0, LUK: 0 };
        statPointSystem.pending = { STR: 0, VIT: 0, INT: 0, DEX: 0, AGI: 0, LUK: 0 };
        statPointSystem.unspent = 0;
        statPointSystem.resetCount = 0;
        statPointSystem.applyStats(p);
      }
      p._jobPassives = {};
      game.monsters = [];
      game.npcPlayers = [];
      game.itemDrops = [];
      showCharStats = false;
      showSkillPanel = false;
      botAI.setEnabled(false, p);
      botAI.state = 'idle';
      botAI.target = null;
      botAI.roamTarget = null;
      botAI.retreatTarget = null;
      botAI.lootTarget = null;
      camera.update(p);
      if (typeof extra === 'function') extra();
    }, { cls: className, extraGold: extra || 0 });
    await page.evaluate(() => render());
  }

  async function clickCanvas(x, y) {
    const box = await page.locator('#gameCanvas').boundingBox();
    await page.mouse.click(box.x + x, box.y + y);
    await page.waitForTimeout(150);
  }

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    await resetScenario('Knight', 0);
    const levelVsGold = await page.evaluate(() => {
      const p = game.player;
      const baseAtk = p.atk;
      for (let i = 0; i < 9; i++) levelUp(p);
      const atkAfterLevels = p.atk;

      p.level = 1;
      p.exp = 0;
      p.gold = 4000;
      statPointSystem.allocated = { STR: 0, VIT: 0, INT: 0, DEX: 0, AGI: 0, LUK: 0 };
      statPointSystem.pending = { STR: 0, VIT: 0, INT: 0, DEX: 0, AGI: 0, LUK: 0 };
      statPointSystem.unspent = 0;
      statPointSystem.applyStats(p);

      statPointSystem.buyPoints(6, true);
      for (let i = 0; i < 6; i++) statPointSystem.addPoint('STR');
      statPointSystem.confirm();

      return {
        baseAtk,
        atkAfterLevels,
        atkAfterGold: p.atk
      };
    });
    assert.ok(levelVsGold.atkAfterLevels - levelVsGold.baseAtk <= 4, 'Leveling alone should add only tiny direct ATK growth');
    assert.ok(levelVsGold.atkAfterGold - levelVsGold.baseAtk >= 12, 'Gold stat training should be the stronger ATK jump');

    await resetScenario('Knight', 1200);
    await page.evaluate(() => { showCharStats = true; render(); });
    let statButtons = await page.evaluate(() => statPointSystem.buttonRects);
    await clickCanvas(statButtons.find((r) => r.type === 'buy1').x + 10, statButtons.find((r) => r.type === 'buy1').y + 10);
    await page.evaluate(() => render());
    statButtons = await page.evaluate(() => statPointSystem.buttonRects);
    await clickCanvas(statButtons.find((r) => r.type === 'plus' && r.stat === 'STR').x + 10, statButtons.find((r) => r.type === 'plus' && r.stat === 'STR').y + 10);
    await clickCanvas(statButtons.find((r) => r.type === 'confirm').x + 20, statButtons.find((r) => r.type === 'confirm').y + 10);
    const statUiResult = await page.evaluate(() => ({
      gold: game.player.gold,
      atk: game.player.atk,
      baseAtk: CLASS_DATA[game.player.className].atk,
      str: statPointSystem.allocated.STR,
      bought: statPointSystem.getPurchasedPoints()
    }));
    assert.equal(statUiResult.str, 1, 'Stat UI should allocate purchased stat points');
    assert.equal(statUiResult.bought, 1, 'Buying through the stat panel should increase trained points');
    assert.ok(statUiResult.gold < 1200, 'Stat training should consume gold');
    assert.ok(statUiResult.atk > statUiResult.baseAtk, 'Stat training should increase combat power');

    await resetScenario('Mage', 3000);
    await page.evaluate(() => { showSkillPanel = true; render(); });
    const skillBefore = await page.evaluate(() => ({ gold: game.player.gold, skill: game.player.skillLevels[0] }));
    const skillButton = await page.evaluate(() => ({
      x: ((canvas.width - 340) / 2) + 340 - 70 + 20,
      y: ((canvas.height - 404) / 2) + 82 + 30 + 10
    }));
    await clickCanvas(skillButton.x, skillButton.y);
    const skillAfter = await page.evaluate(() => ({
      gold: game.player.gold,
      skill: game.player.skillLevels[0],
      cap: progressionSystem.getSkillCap(game.player)
    }));
    assert.equal(skillAfter.skill, skillBefore.skill + 1, 'Skill panel should buy skill ranks with gold');
    assert.ok(skillAfter.gold < skillBefore.gold, 'Skill upgrade should consume gold');
    assert.ok(skillAfter.cap >= 1, 'Level should still control the skill cap');

    await resetScenario('Ranger', 10000);
    const autoSpend = await page.evaluate(() => {
      botAI.setEnabled(true, game.player);
      game.settings.autoStatAllocate = true;
      game.settings.autoSkillAllocate = true;
      advanceTime(1500);
      return {
        bought: statPointSystem.getPurchasedPoints(),
        skillRanks: game.player.skillLevels.slice(),
        gold: game.player.gold
      };
    });
    assert.ok(autoSpend.bought > 0, 'Bot/idle loop should auto-buy stat training with gold');
    assert.ok(autoSpend.skillRanks.some((lv) => lv > 0), 'Bot/idle loop should auto-buy skill ranks with gold');
    assert.ok(autoSpend.gold < 10000, 'Auto progression should actually spend gold');

    await resetScenario('Knight', 0);
    const dungeonGate = await page.evaluate(() => {
      const before = dungeon.enterDungeon();
      game.player.level = 5;
      if (typeof statPointSystem !== 'undefined') statPointSystem.applyStats(game.player);
      const after = dungeon.enterDungeon();
      return { before, after, active: dungeon.active };
    });
    assert.equal(dungeonGate.before, false, 'Dungeon should remain level-gated');
    assert.equal(dungeonGate.after, true, 'Level should still unlock gated content');
    assert.equal(dungeonGate.active, true, 'Dungeon gate should open once requirement is met');

    await resetScenario('Knight', 0);
    const migrationResult = await page.evaluate(() => {
      saveGame();
      const save = JSON.parse(localStorage.getItem('idle_rpg_save'));
      save.version = 1;
      save.player.gold = 50;
      save.player.skillPoints = 4;
      save.statPoints = save.statPoints || {};
      save.statPoints.allocated = save.statPoints.allocated || { STR: 0, VIT: 0, INT: 0, DEX: 0, AGI: 0, LUK: 0 };
      save.statPoints.unspent = 3;
      delete save.progression;
      localStorage.setItem('idle_rpg_save', JSON.stringify(save));
      loadGame();
      return {
        gold: game.player.gold,
        skillPoints: game.player.skillPoints,
        unspent: statPointSystem.unspent,
        progressionVersion: JSON.parse(localStorage.getItem('idle_rpg_save')).progression.version
      };
    });
    assert.equal(migrationResult.skillPoints, 0, 'Legacy skill points should migrate out of the save');
    assert.equal(migrationResult.unspent, 0, 'Legacy free stat points should migrate out of the save');
    assert.equal(migrationResult.gold, 50 + 4 * 140 + 3 * 60, 'Migration should convert old free power into gold');
    assert.equal(migrationResult.progressionVersion, 2, 'Migrated save should be resaved with progression version 2');

    await resetScenario('Knight', 300000);
    const bossResult = await page.evaluate(() => {
      const p = game.player;
      for (let i = 0; i < 19; i++) levelUp(p);
      p.gold = 300000;
      while (statPointSystem.buyPoints(5, true)) {}
      while (statPointSystem.unspent > 0) {
        if (!statPointSystem.addPoint('STR')) break;
      }
      statPointSystem.confirm();
      while (skillLevelUp(p, 0)) {}
      p.x = Math.floor(MAP_W / 2) * TILE + TILE / 2;
      p.y = Math.floor(MAP_H / 2) * TILE + TILE / 2;
      const dragon = createMon('dragon', p.x + TILE, p.y);
      dragon.hp = Math.round(dragon.maxHp * 0.25);
      dragon.maxHp = Math.round(dragon.maxHp);
      game.monsters = [dragon];
      botAI.setEnabled(false, p);
      advanceTime(10000);
      return {
        dragonMaxHp: dragon.maxHp,
        dragonDead: dragon.isDead,
        dragonHp: dragon.hp,
        atk: p.atk
      };
    });
    assert.ok(bossResult.dragonMaxHp >= 3200, 'Boss HP should be dramatically higher than before');
    assert.ok(bossResult.atk >= 80, 'Heavy gold investment should create a clearly overpowered player');
    assert.equal(bossResult.dragonDead, true, 'Boss fights should still resolve after heavy investment');

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'progression-ui.png') });

    const renderState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
    assert.ok(renderState.player && typeof renderState.player.gold === 'number', 'Text render should expose progression state');

    assert.deepEqual(consoleErrors, [], 'Expected no console errors');
    assert.deepEqual(pageErrors, [], 'Expected no page errors');

    console.log('progression.playwright.js: PASS');
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

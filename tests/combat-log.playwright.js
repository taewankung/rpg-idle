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

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    const canvasBox = await page.locator('#gameCanvas').boundingBox();
    assert.ok(canvasBox, 'Canvas should be present');

    const clickCanvas = async (x, y) => {
      await page.mouse.click(canvasBox.x + x, canvasBox.y + y);
      await page.waitForTimeout(200);
    };

    const setup = await page.evaluate(() => {
      localStorage.clear();
      startGame('Knight');
      botAI.setEnabled(false, game.player);
      game.monsters = [];
      game.npcPlayers = [];
      combatLog.length = 0;
      setCombatLogFilter('self');

      let buddy = null;
      if (typeof partySystem !== 'undefined') {
        partySystem.init();
        buddy = createPlayer('Priest', 'Buddy');
        buddy.entityType = 'npc';
        buddy.isNPC = true;
        partySystem.members = [game.player, buddy];
        partySystem.active = true;
      }

      addLog('Hero hit slime', '#ffffff', { actor: game.player });
      if (buddy) addLog('Buddy hit slime', '#44ff88', { actor: buddy });
      addLog('Other ranger hit slime', '#ff8888', { actor: { entityType: 'npc', name: 'Other Ranger' } });
      addLog('Inventory full!', '#ffaa44', { actor: game.player });
      render();

      return {
        filter: getCombatLogFilter(),
        visible: getVisibleCombatLogEntries(10).map((entry) => entry.text),
        chips: getCombatLogFilterChipRects()
      };
    });

    assert.equal(setup.filter, 'self', 'Combat log should default to self filter');
    assert.deepEqual(setup.visible, ['Inventory full!', 'Hero hit slime'], 'Self filter should only show player-owned entries');

    await clickCanvas(setup.chips[1].x + setup.chips[1].w / 2, setup.chips[1].y + setup.chips[1].h / 2);
    const partyView = await page.evaluate(() => ({
      filter: getCombatLogFilter(),
      visible: getVisibleCombatLogEntries(10).map((entry) => entry.text)
    }));
    assert.equal(partyView.filter, 'party', 'Clicking PARTY chip should switch the filter');
    assert.deepEqual(partyView.visible, ['Inventory full!', 'Buddy hit slime', 'Hero hit slime'], 'Party filter should include self and party entries');

    const allChip = await page.evaluate(() => getCombatLogFilterChipRects()[2]);
    await clickCanvas(allChip.x + allChip.w / 2, allChip.y + allChip.h / 2);
    const allView = await page.evaluate(() => ({
      filter: getCombatLogFilter(),
      visible: getVisibleCombatLogEntries(10).map((entry) => entry.text)
    }));
    assert.equal(allView.filter, 'all', 'Clicking ALL chip should switch the filter');
    assert.deepEqual(allView.visible, ['Inventory full!', 'Other ranger hit slime', 'Buddy hit slime', 'Hero hit slime'], 'All filter should show every entry');

    const screenshotPath = path.join(ARTIFACT_DIR, 'combat-log-filter.png');
    await page.screenshot({ path: screenshotPath });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const persistedFilter = await page.evaluate(() => getCombatLogFilter());
    assert.equal(persistedFilter, 'all', 'Combat log filter should persist in saved settings');

    assert.deepEqual(consoleErrors, [], 'Expected no console errors');
    assert.deepEqual(pageErrors, [], 'Expected no page errors');
    console.log('Combat log filter Playwright test passed');
    console.log('Artifact:', screenshotPath);
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

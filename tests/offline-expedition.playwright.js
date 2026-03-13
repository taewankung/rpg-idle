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
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
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

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
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

    const bootState = await page.evaluate(() => {
      localStorage.clear();
      return { width: canvas.width, height: canvas.height, gameState: game.state };
    });
    assert.equal(bootState.gameState, 'classSelect', 'Expected class select on boot');

    const canvasBox = await page.locator('#gameCanvas').boundingBox();
    assert.ok(canvasBox, 'Canvas should be present');

    const clickCanvas = async (x, y) => {
      await page.mouse.click(canvasBox.x + x, canvasBox.y + y);
      await page.waitForTimeout(400);
    };

    const cardWidth = 180;
    const totalWidth = 4 * cardWidth + 3 * 20;
    const classStartX = (bootState.width - totalWidth) / 2;
    const classStartY = (bootState.height - 280) / 2 - 10;

    await clickCanvas(classStartX + cardWidth / 2, classStartY + 100);
    await clickCanvas(bootState.width / 2, classStartY + 280 + 60 + 18);
    await page.waitForTimeout(1000);

    const afterStart = await page.evaluate(() => ({
      gameState: game.state,
      hasPlayer: !!game.player,
      playerLevel: game.player && game.player.level
    }));
    assert.equal(afterStart.gameState, 'playing', 'Game should enter playing state');
    assert.equal(afterStart.hasPlayer, true, 'Player should exist after starting');

    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    const expeditionMenuRect = await page.evaluate(() => {
      const panelW = 360;
      const panelH = 446;
      const panelX = (canvas.width - panelW) / 2;
      const panelY = (canvas.height - panelH) / 2;
      const buttonW = 72;
      const buttonH = 60;
      const gap = 8;
      const gridH = 4 * buttonH + 3 * gap;
      const gridY = panelY + 42;
      return {
        x: panelX + 28,
        y: gridY + gridH + 18,
        w: panelW - 56,
        h: 50
      };
    });

    await clickCanvas(
      expeditionMenuRect.x + expeditionMenuRect.w / 2,
      expeditionMenuRect.y + expeditionMenuRect.h / 2
    );
    await page.waitForTimeout(300);

    const panelState = await page.evaluate(() => ({
      panelOpen: offlineExpeditionSystem.panelOpen,
      expeditions: offlineExpeditionSystem.getAvailableExpeditions().map((exp) => ({
        id: exp.id,
        unlocked: exp.unlocked
      })),
      selected: offlineExpeditionSystem.selectedExpeditionId
    }));
    assert.equal(panelState.panelOpen, true, 'Expedition panel should open from TAB menu');
    assert.equal(panelState.selected, 'short_patrol', 'Short Patrol should be selected by default');
    assert.equal(panelState.expeditions[0].unlocked, true, 'Short Patrol should be unlocked at level 1');

    const panelScreenshot = path.join(ARTIFACT_DIR, 'offline-expedition-panel.png');
    await page.screenshot({ path: panelScreenshot });

    const startButton = await page.evaluate(() => {
      const layout = offlineExpeditionSystem.getPanelLayout();
      return offlineExpeditionSystem.getStartButtonRect(layout);
    });
    await clickCanvas(startButton.x + startButton.w / 2, startButton.y + startButton.h / 2);
    await page.waitForTimeout(500);

    const activeRunState = await page.evaluate(() => ({
      activeRun: offlineExpeditionSystem.activeRun,
      saveData: JSON.parse(localStorage.getItem('idle_rpg_save'))
    }));
    assert.ok(activeRunState.activeRun, 'Starting an expedition should create an active run');
    assert.ok(
      activeRunState.saveData &&
      activeRunState.saveData.offlineExpedition &&
      activeRunState.saveData.offlineExpedition.activeRun,
      'Active expedition should be persisted in save data'
    );

    await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('idle_rpg_save'));
      const now = Date.now();
      data.timestamp = now - 3600 * 1000;
      data.offlineExpedition.activeRun.startedAt = now - 3600 * 1000;
      data.offlineExpedition.activeRun.expectedEndAt = now - 1800 * 1000;
      localStorage.setItem('idle_rpg_save', JSON.stringify(data));
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const resolvedState = await page.evaluate(() => ({
      afkPopup: typeof afkSystem !== 'undefined' ? afkSystem.showPopup : false,
      panelOpen: offlineExpeditionSystem.panelOpen,
      summary: offlineExpeditionSystem.getOfflineExpeditionSummary(),
      playerGold: game.player && game.player.gold,
      playerExp: game.player && game.player.exp
    }));

    assert.equal(resolvedState.afkPopup, false, 'AFK popup should be suppressed when expedition resolves');
    assert.equal(resolvedState.panelOpen, true, 'Summary panel should open after resolve');
    assert.ok(resolvedState.summary, 'Resolved expedition should produce a summary');
    assert.equal(resolvedState.summary.name, 'Short Patrol', 'Resolved expedition should match selected run');

    const summaryScreenshot = path.join(ARTIFACT_DIR, 'offline-expedition-summary.png');
    await page.screenshot({ path: summaryScreenshot });

    const claimButton = await page.evaluate(() => {
      const layout = offlineExpeditionSystem.getPanelLayout();
      return offlineExpeditionSystem.getClaimButtonRect(layout);
    });
    await clickCanvas(claimButton.x + claimButton.w / 2, claimButton.y + claimButton.h / 2);
    await page.waitForTimeout(500);

    const afterClaim = await page.evaluate(() => ({
      panelOpen: offlineExpeditionSystem.panelOpen,
      summary: offlineExpeditionSystem.getOfflineExpeditionSummary(),
      playerGold: game.player && game.player.gold,
      playerExp: game.player && game.player.exp
    }));
    assert.equal(afterClaim.panelOpen, false, 'Claiming should close the panel');
    assert.equal(afterClaim.summary, null, 'Claiming should clear pending summary');
    assert.ok(afterClaim.playerGold >= resolvedState.playerGold, 'Gold should not decrease after claiming');
    assert.ok(afterClaim.playerExp >= resolvedState.playerExp, 'EXP should not decrease after claiming');

    await page.keyboard.press('KeyO');
    await page.waitForTimeout(300);
    const openedByKey = await page.evaluate(() => offlineExpeditionSystem.panelOpen === true);
    assert.equal(openedByKey, true, 'KeyO should open expedition panel');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const closedByEscape = await page.evaluate(() => offlineExpeditionSystem.panelOpen === false);
    assert.equal(closedByEscape, true, 'Escape should close expedition panel');

    await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('idle_rpg_save'));
      delete data.offlineExpedition;
      data.timestamp = Date.now() - 600 * 1000;
      localStorage.setItem('idle_rpg_save', JSON.stringify(data));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const oldSaveState = await page.evaluate(() => ({
      gameState: game.state,
      hasPlayer: !!game.player,
      afkPopup: typeof afkSystem !== 'undefined' ? afkSystem.showPopup : false
    }));
    assert.equal(oldSaveState.gameState, 'playing', 'Old saves should still load into the game');
    assert.equal(oldSaveState.hasPlayer, true, 'Old saves should still restore player state');
    assert.equal(oldSaveState.afkPopup, true, 'AFK rewards should still appear for saves without expedition data');

    assert.deepEqual(consoleErrors, [], 'Expected no console errors');
    assert.deepEqual(pageErrors, [], 'Expected no page errors');

    console.log('Offline expedition Playwright test passed');
    console.log('Artifacts:', panelScreenshot, summaryScreenshot);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

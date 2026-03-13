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
      await page.waitForTimeout(350);
    };

    const clickRectCenter = async (rect) => {
      await clickCanvas(rect.x + rect.w / 2, rect.y + rect.h / 2);
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

    await clickRectCenter(expeditionMenuRect);
    await page.waitForTimeout(500);

    const initialPanelState = await page.evaluate(() => ({
      panelOpen: offlineExpeditionSystem.panelOpen,
      expeditions: offlineExpeditionSystem.getAvailableExpeditions(),
      strategies: offlineExpeditionSystem.getExpeditionStrategies(),
      selectedExpeditionId: offlineExpeditionSystem.selectedExpeditionId,
      selectedStrategyId: offlineExpeditionSystem.selectedStrategyId,
      selectedDurationSec: offlineExpeditionSystem.selectedDurationSec
    }));

    assert.equal(initialPanelState.panelOpen, true, 'Expedition panel should open from TAB menu');
    assert.equal(initialPanelState.expeditions.length >= 6, true, 'Expected at least 6 expedition definitions');
    assert.equal(initialPanelState.strategies.length >= 5, true, 'Expected at least 5 strategies');
    assert.equal(initialPanelState.selectedExpeditionId, 'short_safe_patrol', 'First expedition should be selected by default');

    const planningScreenshot = path.join(ARTIFACT_DIR, 'offline-expedition-planning.png');
    await page.screenshot({ path: planningScreenshot });

    const planRects = await page.evaluate(() => ({
      duration: offlineExpeditionSystem._clickMap['duration:2700'],
      strategy: offlineExpeditionSystem._clickMap['strategy:loot_hunter'],
      start: offlineExpeditionSystem._clickMap.start
    }));
    assert.ok(planRects.duration, 'Expected 45m duration button for first expedition');
    assert.ok(planRects.strategy, 'Expected Loot Hunter strategy button');
    assert.ok(planRects.start, 'Expected expedition start button');

    await clickRectCenter(planRects.duration);
    await clickRectCenter(planRects.strategy);
    await clickRectCenter(planRects.start);
    await page.waitForTimeout(500);

    const activeRunState = await page.evaluate(() => ({
      activeRun: offlineExpeditionSystem.activeRun,
      selectedStrategyId: offlineExpeditionSystem.selectedStrategyId,
      selectedDurationSec: offlineExpeditionSystem.selectedDurationSec,
      saveData: JSON.parse(localStorage.getItem('idle_rpg_save'))
    }));

    assert.ok(activeRunState.activeRun, 'Starting an expedition should create an active run');
    assert.equal(activeRunState.activeRun.strategyId, 'loot_hunter', 'Selected strategy should persist into active run');
    assert.equal(activeRunState.activeRun.durationSec, 2700, 'Selected duration should persist into active run');
    assert.ok(
      activeRunState.saveData &&
      activeRunState.saveData.offlineExpedition &&
      activeRunState.saveData.offlineExpedition.activeRun &&
      activeRunState.saveData.offlineExpedition.selectedStrategyId === 'loot_hunter',
      'Expedition state should persist into the save file'
    );

    await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('idle_rpg_save'));
      const now = Date.now();
      data.timestamp = now - 4 * 3600 * 1000;
      data.offlineExpedition.activeRun.startedAt = now - 4 * 3600 * 1000;
      data.offlineExpedition.activeRun.endsAt = now - 3 * 3600 * 1000;
      data.offlineExpedition.activeRun.expectedEndAt = data.offlineExpedition.activeRun.endsAt;
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

    assert.equal(resolvedState.afkPopup, false, 'AFK popup should be suppressed when expedition consumes the offline window');
    assert.equal(resolvedState.panelOpen, true, 'Debrief panel should open after offline resolution');
    assert.ok(resolvedState.summary, 'Resolved expedition should create a debrief report');
    assert.equal(resolvedState.summary.strategyId, 'loot_hunter', 'Resolved summary should keep selected strategy');
    assert.ok(resolvedState.summary.outcomeGrade, 'Resolved summary should include outcome grade');
    assert.ok(Array.isArray(resolvedState.summary.eventLog) && resolvedState.summary.eventLog.length > 0, 'Resolved summary should include event log');
    assert.ok(typeof resolvedState.summary.flavorSummary === 'string' && resolvedState.summary.flavorSummary.length > 0, 'Resolved summary should include flavor summary');

    const summaryScreenshot = path.join(ARTIFACT_DIR, 'offline-expedition-summary.png');
    await page.screenshot({ path: summaryScreenshot });

    const claimRect = await page.evaluate(() => offlineExpeditionSystem._clickMap.claim);
    assert.ok(claimRect, 'Expected claim button on debrief panel');
    await clickRectCenter(claimRect);
    await page.waitForTimeout(500);

    const afterClaim = await page.evaluate(() => ({
      panelOpen: offlineExpeditionSystem.panelOpen,
      summary: offlineExpeditionSystem.getOfflineExpeditionSummary(),
      playerGold: game.player && game.player.gold,
      playerExp: game.player && game.player.exp
    }));
    assert.equal(afterClaim.panelOpen, false, 'Claiming should close expedition panel');
    assert.equal(afterClaim.summary, null, 'Claiming should clear pending summary');
    assert.ok(afterClaim.playerGold >= resolvedState.playerGold, 'Gold should not decrease after claim');
    assert.ok(afterClaim.playerExp >= resolvedState.playerExp, 'EXP should not decrease after claim');

    const strategyComparison = await page.evaluate(() => {
      function withSequence(seq, fn) {
        const original = Math.random;
        let idx = 0;
        Math.random = () => (idx < seq.length ? seq[idx++] : 0.42);
        try {
          return fn();
        } finally {
          Math.random = original;
        }
      }
      const seed = [0.22, 0.31, 0.18, 0.44, 0.27, 0.35, 0.14, 0.52, 0.29, 0.39];
      const strategyPlayer = {
        className: 'Ranger',
        level: 14,
        maxHp: 320,
        hp: 320,
        maxMp: 110,
        mp: 110,
        atk: 48,
        def: 22,
        spd: 4.6,
        crit: 0.14,
        matk: 0,
        evasion: 0.03,
        dropRate: 0.08,
        critDmg: 1.64,
        attackRange: 96,
        skillLevels: [2, 2, 1, 1],
        jobLevel: 10,
        _jobPassives: { quickDraw: 0.15 },
        equipment: {
          weapon: { enhanceLevel: 3 },
          armor: { enhanceLevel: 2 },
          accessory: { enhanceLevel: 1 }
        }
      };
      const makeReport = (strategyId) => withSequence(seed.slice(), () => offlineExpeditionSystem.generateExpeditionReport('forest_beast_hunt', {
        player: strategyPlayer,
        strategyId,
        durationSec: 3600
      }, Date.now()));
      const safe = makeReport('safe');
      const aggressive = makeReport('aggressive');
      return {
        safe: {
          successChance: safe.successChance,
          injuryChance: safe.injuryChance,
          exp: safe.exp,
          gold: safe.gold,
          grade: safe.outcomeGrade
        },
        aggressive: {
          successChance: aggressive.successChance,
          injuryChance: aggressive.injuryChance,
          exp: aggressive.exp,
          gold: aggressive.gold,
          grade: aggressive.outcomeGrade
        }
      };
    });

    assert.ok(strategyComparison.safe.successChance > strategyComparison.aggressive.successChance, 'Safe strategy should improve success chance');
    assert.ok(strategyComparison.aggressive.injuryChance > strategyComparison.safe.injuryChance, 'Aggressive strategy should increase injury chance');
    assert.ok(
      strategyComparison.aggressive.exp !== strategyComparison.safe.exp ||
      strategyComparison.aggressive.gold !== strategyComparison.safe.gold ||
      strategyComparison.aggressive.grade !== strategyComparison.safe.grade,
      'Strategy choice should change the resolved expedition outcome'
    );

    const buildComparison = await page.evaluate(() => {
      function withSequence(seq, fn) {
        const original = Math.random;
        let idx = 0;
        Math.random = () => (idx < seq.length ? seq[idx++] : 0.41);
        try {
          return fn();
        } finally {
          Math.random = original;
        }
      }
      const lowPlayer = {
        className: 'Knight',
        level: 12,
        maxHp: 220,
        hp: 220,
        maxMp: 60,
        mp: 60,
        atk: 24,
        def: 16,
        spd: 3,
        crit: 0.06,
        matk: 0,
        evasion: 0,
        dropRate: 0,
        critDmg: 1.5,
        attackRange: 38,
        skillLevels: [0, 0, 0, 0],
        jobLevel: 4,
        _jobPassives: {},
        equipment: { weapon: null, armor: null, accessory: null }
      };
      const highPlayer = {
        className: 'Knight',
        level: 30,
        maxHp: 920,
        hp: 920,
        maxMp: 180,
        mp: 180,
        atk: 132,
        def: 82,
        spd: 5.6,
        crit: 0.19,
        matk: 0,
        evasion: 0.08,
        dropRate: 0.16,
        critDmg: 1.82,
        attackRange: 44,
        skillLevels: [4, 4, 3, 2],
        jobLevel: 22,
        _jobPassives: { hpMult: 0.15, atkMult: 0.2 },
        equipment: {
          weapon: { enhanceLevel: 7 },
          armor: { enhanceLevel: 5 },
          accessory: { enhanceLevel: 4 }
        }
      };
      const durationSec = 7200;
      const scoresLow = offlineExpeditionSystem.calculateExpeditionScores('forbidden_rift_survey', {
        player: lowPlayer,
        strategyId: 'balanced',
        durationSec
      });
      const scoresHigh = offlineExpeditionSystem.calculateExpeditionScores('forbidden_rift_survey', {
        player: highPlayer,
        strategyId: 'balanced',
        durationSec
      });
      const seed = [0.25, 0.4, 0.19, 0.47, 0.28, 0.33, 0.11, 0.55];
      const lowReport = withSequence(seed.slice(), () => offlineExpeditionSystem.generateExpeditionReport('forbidden_rift_survey', {
        player: lowPlayer,
        strategyId: 'balanced',
        durationSec
      }, Date.now()));
      const highReport = withSequence(seed.slice(), () => offlineExpeditionSystem.generateExpeditionReport('forbidden_rift_survey', {
        player: highPlayer,
        strategyId: 'balanced',
        durationSec
      }, Date.now()));
      return {
        low: { overall: scoresLow.overallScore, successChance: lowReport.successChance, gradeIndex: lowReport.gradeIndex },
        high: { overall: scoresHigh.overallScore, successChance: highReport.successChance, gradeIndex: highReport.gradeIndex }
      };
    });

    assert.ok(buildComparison.high.overall > buildComparison.low.overall, 'Stronger build should score higher overall');
    assert.ok(buildComparison.high.gradeIndex <= buildComparison.low.gradeIndex, 'Stronger build should not roll a worse grade with identical randomness');

    await page.keyboard.press('KeyX');
    await page.waitForTimeout(300);
    const openedByKey = await page.evaluate(() => offlineExpeditionSystem.panelOpen === true);
    assert.equal(openedByKey, true, 'KeyX should open expedition panel');

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
    assert.equal(oldSaveState.afkPopup, true, 'AFK rewards should still appear when no expedition data exists');

    assert.deepEqual(consoleErrors, [], 'Expected no console errors');
    assert.deepEqual(pageErrors, [], 'Expected no page errors');

    console.log('Offline expedition Playwright test passed');
    console.log('Artifacts:', planningScreenshot, summaryScreenshot);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

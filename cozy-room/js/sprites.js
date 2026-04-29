// ─── sprites.js ────────────────────────────────────────────
// Pixel art sprites drawn directly on canvas. Internal canvas is 480x270.
// Everything is hand-drawn pixel-by-pixel for the cozy soft-pixel look.
// All draw functions take (ctx, x, y, opts) and assume integer positions.

(function () {
  const P = window.CFG.PAL;

  // tiny helper: draw a single pixel rectangle
  const px = (ctx, x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
  };

  // draw a 2D bitmap defined as an array of strings, one char per pixel
  // legend maps char -> color (or null for transparent)
  const bmp = (ctx, x, y, rows, legend) => {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        const col = legend[ch];
        if (col) px(ctx, x + c, y + r, 1, 1, col);
      }
    }
  };

  // ─── ROOM BACKDROP ─────────────────────────────────────────
  function drawWall(ctx) {
    // wallpaper gradient (subtle vertical bands)
    for (let y = 0; y < 200; y++) {
      const t = y / 200;
      const c = lerpColor(P.wallBg, P.wallBg2, t);
      px(ctx, 0, y, 480, 1, c);
    }
    // pinstripe pattern, every 8 px
    ctx.fillStyle = 'rgba(120, 90, 60, 0.08)';
    for (let x = 0; x < 480; x += 8) ctx.fillRect(x, 0, 1, 200);
    // baseboard
    px(ctx, 0, 196, 480, 4, P.wallTrim);
    px(ctx, 0, 200, 480, 1, P.shadow);
  }

  function drawFloor(ctx) {
    // floor gradient
    for (let y = 200; y < 270; y++) {
      const t = (y - 200) / 70;
      const c = lerpColor(P.floor, P.floor2, t);
      px(ctx, 0, y, 480, 1, c);
    }
    // floorboards
    for (let x = 0; x < 480; x += 32) {
      px(ctx, x, 200, 1, 70, P.floorBoard);
    }
    for (let y = 200; y < 270; y += 18) {
      px(ctx, 0, y, 480, 1, 'rgba(60, 40, 28, 0.15)');
    }
  }

  function drawRug(ctx) {
    const x = 196, y = 218;
    // shadow
    px(ctx, x - 4, y + 18, 110, 2, 'rgba(0,0,0,0.18)');
    // rug body
    px(ctx, x, y, 100, 20, P.rugA);
    // pattern
    for (let i = 0; i < 5; i++) {
      px(ctx, x + 6 + i * 18, y + 4, 12, 12, P.rugB);
      px(ctx, x + 9 + i * 18, y + 7, 6, 6, P.cream);
    }
    // edge fringe
    for (let i = 0; i < 100; i += 2) px(ctx, x + i, y - 1, 1, 1, P.cream);
    for (let i = 0; i < 100; i += 2) px(ctx, x + i, y + 20, 1, 1, P.cream);
  }

  // ─── FURNITURE ─────────────────────────────────────────────
  // each piece is a self-contained drawing function

  function drawBed(ctx, opts = {}) {
    const x = 30, y = 158;
    // shadow
    px(ctx, x - 2, y + 38, 88, 2, 'rgba(0,0,0,0.25)');
    // frame
    px(ctx, x, y + 18, 84, 22, P.deskWood2);
    px(ctx, x, y + 16, 84, 4, P.deskWood);
    // legs
    px(ctx, x + 2,  y + 38, 4, 4, P.deskWood2);
    px(ctx, x + 78, y + 38, 4, 4, P.deskWood2);
    // mattress
    px(ctx, x + 2, y + 8, 80, 12, P.cream);
    px(ctx, x + 2, y + 6, 80, 2, P.creamSoft);
    // blanket
    px(ctx, x + 14, y + 12, 68, 10, P.blanket);
    px(ctx, x + 14, y + 18, 68, 2, P.blanket2);
    // pillow
    px(ctx, x + 4,  y + 4,  18, 8, P.pillow);
    px(ctx, x + 6,  y + 6,  14, 4, P.cream);
    // headboard
    px(ctx, x - 2, y - 2, 6, 24, P.deskWood2);
    px(ctx, x - 2, y - 2, 6, 2,  P.deskWood);
    // small heart on blanket (tiny detail)
    px(ctx, x + 70, y + 14, 1, 1, P.roseDeep);
    px(ctx, x + 72, y + 14, 1, 1, P.roseDeep);
    px(ctx, x + 71, y + 15, 1, 1, P.roseDeep);
  }

  function drawDesk(ctx, opts = {}) {
    const x = 130, y = 168;
    // shadow
    px(ctx, x - 2, y + 32, 64, 2, 'rgba(0,0,0,0.22)');
    // legs
    px(ctx, x + 2,  y + 12, 3, 22, P.deskWood2);
    px(ctx, x + 56, y + 12, 3, 22, P.deskWood2);
    // top
    px(ctx, x, y + 8, 62, 6, P.deskWood);
    px(ctx, x, y + 8, 62, 1, P.cream);
    px(ctx, x, y + 14, 62, 1, P.deskWood2);
    // small drawer
    px(ctx, x + 4, y + 16, 18, 8, P.deskWood);
    px(ctx, x + 12, y + 19, 2, 1, P.amberDeep);
    // items on desk
    // notebook
    px(ctx, x + 4,  y + 4, 10, 4, P.bookA);
    px(ctx, x + 5,  y + 5,  8, 1, P.cream);
    // pen cup
    px(ctx, x + 18, y + 2, 4, 6, P.amberDeep);
    px(ctx, x + 19, y, 1, 4, P.bookB);
    px(ctx, x + 21, y, 1, 4, P.sage);
    // lamp on desk
    px(ctx, x + 28, y + 2, 3, 1, P.amberDeep);   // neck
    px(ctx, x + 27, y + 3, 5, 1, P.amberDeep);
    px(ctx, x + 26, y, 7, 3, P.amber);           // shade
    px(ctx, x + 27, y - 1, 5, 1, P.amber);
    // plant on desk
    px(ctx, x + 38, y + 4, 4, 4, P.plantPot);
    px(ctx, x + 38, y + 1, 1, 3, P.plantLeaf);
    px(ctx, x + 40, y, 1, 4, P.plantLeaf2);
    px(ctx, x + 41, y + 1, 1, 3, P.plantLeaf);
    // small painting/canvas leaning
    px(ctx, x + 46, y + 2, 10, 6, P.cream);
    px(ctx, x + 47, y + 3, 8, 1, P.rose);
    px(ctx, x + 47, y + 5, 8, 1, P.sage);
    // chair (in front of desk)
    drawChair(ctx, x + 22, y + 22);
  }

  function drawChair(ctx, x, y) {
    // simple wooden chair
    px(ctx, x + 1, y - 14, 14, 2, P.deskWood);
    px(ctx, x + 1, y - 14, 1, 16, P.deskWood2);
    px(ctx, x + 14, y - 14, 1, 16, P.deskWood2);
    px(ctx, x, y, 16, 4, P.deskWood);
    px(ctx, x, y + 4, 16, 1, P.deskWood2);
    px(ctx, x + 1, y + 5, 2, 8, P.deskWood2);
    px(ctx, x + 13, y + 5, 2, 8, P.deskWood2);
  }

  function drawBookshelf(ctx) {
    const x = 220, y = 150;
    px(ctx, x - 2, y + 44, 56, 2, 'rgba(0,0,0,0.22)');
    // body
    px(ctx, x, y, 52, 44, P.deskWood2);
    px(ctx, x + 2, y + 2, 48, 4,  P.deskWood);
    // shelves
    for (let s = 0; s < 3; s++) {
      const sy = y + 2 + s * 12;
      px(ctx, x + 2, sy, 48, 12, P.shadow);
      // books on shelf
      const cols = [P.bookA, P.bookB, P.bookC, P.bookD, P.bookB, P.bookC];
      for (let i = 0; i < 6; i++) {
        const bx = x + 4 + i * 8;
        const bh = 10 - (i % 3);
        const c  = cols[(i + s) % cols.length];
        px(ctx, bx, sy + (12 - bh), 6, bh, c);
        px(ctx, bx + 1, sy + (12 - bh), 1, bh, lighten(c, 0.2));
      }
    }
    // top decoration: tiny plant + photo
    px(ctx, x + 4, y - 4, 3, 4, P.plantPot);
    px(ctx, x + 5, y - 7, 1, 3, P.plantLeaf);
    px(ctx, x + 6, y - 8, 1, 4, P.plantLeaf2);
    px(ctx, x + 14, y - 6, 8, 6, P.deskWood);
    px(ctx, x + 15, y - 5, 6, 4, P.cream);
    px(ctx, x + 17, y - 4, 2, 2, P.rose);
  }

  function drawPlant(ctx) {
    const x = 296, y = 168;
    px(ctx, x - 2, y + 22, 26, 2, 'rgba(0,0,0,0.22)');
    // pot
    px(ctx, x + 4, y + 12, 16, 12, P.plantPot);
    px(ctx, x + 4, y + 12, 16, 2,  P.amberDeep);
    px(ctx, x + 5, y + 22, 14, 2,  P.shadow);
    // big leaves (monstera-like)
    const leaves = [
      [8, -2, P.sageDeep], [4, 2, P.plantLeaf], [12, 0, P.plantLeaf2],
      [6, -6, P.plantLeaf2], [14, -4, P.plantLeaf], [10, -10, P.sageDeep],
    ];
    for (const [lx, ly, c] of leaves) {
      px(ctx, x + lx, y + ly, 4, 6, c);
      px(ctx, x + lx + 1, y + ly - 1, 2, 1, c);
      px(ctx, x + lx + 1, y + ly + 6, 2, 1, c);
    }
    px(ctx, x + 11, y + 4, 1, 8, P.sageDeep); // stem
  }

  function drawWindow(ctx, hour, weather) {
    const x = 360, y = 60;
    // frame shadow
    px(ctx, x + 2, y + 2, 64, 80, 'rgba(0,0,0,0.18)');
    // frame
    px(ctx, x, y, 64, 80, P.deskWood2);
    px(ctx, x + 2, y + 2, 60, 76, P.deskWood);
    // glass background — sky depending on time + weather
    drawSky(ctx, x + 4, y + 4, 56, 50, hour, weather);
    // ground (distant city)
    drawSkyline(ctx, x + 4, y + 50, 56, 24, hour);
    // weather inside window (rain/snow streaks)
    drawWindowWeather(ctx, x + 4, y + 4, 56, 70, weather, hour);
    // cross frame
    px(ctx, x + 32, y + 4, 1, 70, P.deskWood2);
    px(ctx, x + 4, y + 38, 60, 1, P.deskWood2);
    // sill with small plant
    px(ctx, x - 2, y + 80, 68, 4, P.deskWood);
    px(ctx, x - 2, y + 84, 68, 2, P.deskWood2);
    px(ctx, x + 50, y + 75, 4, 6, P.plantPot);
    px(ctx, x + 51, y + 70, 1, 5, P.plantLeaf);
    px(ctx, x + 53, y + 71, 1, 4, P.plantLeaf2);
    // curtain hint
    px(ctx, x - 6, y - 4, 4, 88, P.rose);
    px(ctx, x - 4, y - 4, 2, 88, P.roseDeep);
    px(ctx, x + 66, y - 4, 4, 88, P.rose);
    px(ctx, x + 68, y - 4, 2, 88, P.roseDeep);
    // curtain rod
    px(ctx, x - 8, y - 6, 80, 2, P.amberDeep);
  }

  function drawSky(ctx, x, y, w, h, hour, weather) {
    const tint = skyTint(hour, weather);
    // gradient sky
    for (let yy = 0; yy < h; yy++) {
      const t = yy / h;
      const c = lerpColor(tint.top, tint.bot, t);
      px(ctx, x, y + yy, w, 1, c);
    }
    // sun / moon
    const isNight = hour < 6 || hour >= 19;
    const isDawn  = hour >= 5 && hour < 8;
    const isDusk  = hour >= 17 && hour < 20;
    if (isNight) {
      // moon
      const mx = x + (w * ((hour < 6 ? hour + 24 : hour) - 19) / 11) - 4;
      const my = y + 8;
      px(ctx, mx, my, 7, 7, P.moon);
      px(ctx, mx + 5, my, 4, 5, lerpColor(P.moon, tint.top, 0.5));
      // stars
      const stars = [[10,3],[20,7],[34,4],[44,11],[50,2],[16,14],[28,12],[40,18]];
      for (const [sx, sy] of stars) {
        if ((sx + sy) % 3 === 0) px(ctx, x + sx, y + sy, 1, 1, P.star);
      }
    } else {
      // sun position based on hour
      const t = clamp((hour - 6) / 13, 0, 1);
      const sx = x + 6 + Math.floor(t * (w - 16));
      const sy = y + 6 + Math.floor(Math.sin(t * Math.PI) * -10) + 12;
      let sunColor = P.amber;
      if (isDawn) sunColor = P.peach;
      if (isDusk) sunColor = P.skySunset;
      // sun
      px(ctx, sx, sy, 6, 6, sunColor);
      px(ctx, sx + 1, sy + 1, 4, 4, P.cream);
      // glow
      ctx.fillStyle = 'rgba(255, 217, 183, 0.35)';
      ctx.fillRect(sx - 2, sy - 1, 10, 8);
    }
    // clouds
    if (weather !== 'clear' || (hour > 8 && hour < 17)) {
      const drift = (window.gameTime?.totalGameSeconds || 0) * 0.05;
      drawCloud(ctx, x + ((10 + drift * 0.6) % (w + 20) - 10), y + 6, 10);
      drawCloud(ctx, x + ((30 + drift * 0.4) % (w + 30) - 14), y + 14, 8);
      drawCloud(ctx, x + ((44 + drift * 0.7) % (w + 18) - 8), y + 3, 6);
    }
  }

  function drawCloud(ctx, x, y, w) {
    px(ctx, Math.floor(x), Math.floor(y), w, 2, P.cloud);
    px(ctx, Math.floor(x) + 1, Math.floor(y) + 2, w - 2, 1, P.cloud);
    px(ctx, Math.floor(x) + 2, Math.floor(y) - 1, w - 4, 1, P.cloud);
  }

  function drawSkyline(ctx, x, y, w, h, hour) {
    const isNight = hour < 6 || hour >= 19;
    const dark = isNight ? P.night : '#7a8ca0';
    // far buildings
    const buildings = [
      [0, 6, 8, 16], [10, 4, 6, 18], [18, 8, 10, 14], [30, 2, 7, 20],
      [38, 6, 8, 16], [48, 4, 6, 18],
    ];
    for (const [bx, by, bw, bh] of buildings) {
      px(ctx, x + bx, y + by, bw, bh, dark);
      // lit windows at night
      if (isNight) {
        for (let wx = 0; wx < bw - 1; wx += 2) {
          for (let wy = 1; wy < bh - 1; wy += 3) {
            if ((bx + wx + wy) % 3 === 0) {
              px(ctx, x + bx + wx, y + by + wy, 1, 1, P.amber);
            }
          }
        }
      }
    }
    // ground
    px(ctx, x, y + 22, w, h - 22, isNight ? '#1a1420' : '#5a4a3a');
  }

  function drawWindowWeather(ctx, x, y, w, h, weather, hour) {
    if (weather === 'rain') {
      const t = (window.gameTime?.totalGameSeconds || 0);
      ctx.fillStyle = 'rgba(180, 200, 220, 0.6)';
      for (let i = 0; i < 30; i++) {
        const rx = x + ((i * 7 + t * 30) % w);
        const ry = y + ((i * 11 + t * 70) % h);
        ctx.fillRect(rx, ry, 1, 3);
      }
    } else if (weather === 'snow') {
      const t = (window.gameTime?.totalGameSeconds || 0);
      ctx.fillStyle = P.cream;
      for (let i = 0; i < 22; i++) {
        const rx = x + ((i * 5 + t * 8 + Math.sin(t + i) * 4) % w);
        const ry = y + ((i * 9 + t * 18) % h);
        ctx.fillRect(rx, ry, 1, 1);
      }
    }
  }

  // ─── KITCHEN nook ──────────────────────────────────────────
  function drawKitchen(ctx) {
    const x = 414, y = 170;
    px(ctx, x - 2, y + 26, 60, 2, 'rgba(0,0,0,0.2)');
    // counter
    px(ctx, x, y, 56, 6, P.cream);
    px(ctx, x, y + 6, 56, 22, P.deskWood);
    px(ctx, x, y + 28, 56, 1, P.deskWood2);
    // little drawer
    px(ctx, x + 32, y + 10, 16, 8, P.deskWood2);
    px(ctx, x + 38, y + 13, 4, 1, P.amberDeep);
    // stovetop circles
    px(ctx, x + 4, y + 2, 4, 1, P.shadow);
    px(ctx, x + 12, y + 2, 4, 1, P.shadow);
    // kettle
    px(ctx, x + 4, y - 6, 8, 6, P.bookA);
    px(ctx, x + 4, y - 8, 8, 2, P.bookA);
    px(ctx, x + 12, y - 5, 1, 3, P.bookA);
    px(ctx, x + 6, y - 9, 1, 1, P.cream);
    // small bowl
    px(ctx, x + 22, y - 2, 8, 4, P.cream);
    px(ctx, x + 24, y - 1, 4, 1, P.peach);
    // upper shelf
    px(ctx, x + 2, y - 22, 52, 2, P.deskWood);
    px(ctx, x + 6, y - 30, 4, 8, P.bookB);
    px(ctx, x + 12, y - 28, 3, 6, P.sage);
    px(ctx, x + 18, y - 30, 4, 8, P.amberDeep);
    px(ctx, x + 26, y - 26, 8, 4, P.cream);
    px(ctx, x + 38, y - 30, 4, 8, P.bookA);
  }

  // ─── DOOR ──────────────────────────────────────────────────
  function drawDoor(ctx) {
    const x = 4, y = 110;
    px(ctx, x, y, 28, 90, P.deskWood);
    px(ctx, x, y, 28, 4,  P.deskWood2);
    px(ctx, x, y, 2, 90,  P.deskWood2);
    px(ctx, x + 26, y, 2, 90, P.deskWood2);
    // panels
    px(ctx, x + 4, y + 8, 20, 30, P.amberDeep);
    px(ctx, x + 4, y + 44, 20, 40, P.amberDeep);
    // knob
    px(ctx, x + 22, y + 50, 2, 2, P.amber);
    // floor mat
    px(ctx, x - 4, y + 90, 36, 4, P.rugA);
    px(ctx, x - 2, y + 90, 32, 1, P.rugB);
  }

  // ─── POSTERS / WALL DECOR ──────────────────────────────────
  function drawWallDecor(ctx) {
    // small hanging picture frame above bed
    const fx = 50, fy = 90;
    px(ctx, fx, fy, 30, 22, P.deskWood);
    px(ctx, fx + 2, fy + 2, 26, 18, P.cream);
    // sun & sea pixel art
    px(ctx, fx + 4, fy + 4, 22, 6, P.skyDay);
    px(ctx, fx + 18, fy + 5, 4, 4, P.amber);
    px(ctx, fx + 4, fy + 10, 22, 8, P.sky);
    // hanging string
    px(ctx, fx + 14, fy - 4, 1, 4, P.shadow);

    // poster — abstract shapes
    const px2 = 110; const py2 = 80;
    px(ctx, px2, py2, 22, 32, P.cream);
    px(ctx, px2 + 1, py2 + 1, 20, 30, P.creamSoft);
    px(ctx, px2 + 4, py2 + 4, 6, 6, P.rose);
    px(ctx, px2 + 12, py2 + 8, 8, 12, P.sage);
    px(ctx, px2 + 4, py2 + 16, 14, 8, P.amber);
    px(ctx, px2 + 6, py2 + 26, 4, 2, P.ink);
    px(ctx, px2 + 12, py2 + 26, 6, 2, P.ink);

    // string lights across top
    ctx.strokeStyle = P.warmGray;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.bezierCurveTo(160, 50, 320, 50, 480, 30);
    ctx.lineWidth = 1;
    ctx.stroke();
    for (let i = 0; i < 24; i++) {
      const t = i / 23;
      const lx = Math.floor(t * 480);
      const ly = Math.floor(30 + Math.sin(t * Math.PI) * 22);
      px(ctx, lx, ly, 2, 2, [P.amber, P.peach, P.rose][i % 3]);
      // glow
      ctx.fillStyle = 'rgba(232, 184, 111, 0.18)';
      ctx.fillRect(lx - 1, ly - 1, 4, 4);
    }
  }

  // ─── CHARACTER ─────────────────────────────────────────────
  // The character has different "poses". Each pose composites
  // limbs onto a base body. Sprites are 14 wide x 26 tall.
  // facing: +1 right, -1 left

  // bitmap legend shared by character
  const CL = {
    h: P.hair,
    H: P.hairLight,
    s: P.skin,
    S: P.skinShadow,
    c: P.cloth,
    C: P.clothShadow,
    p: P.pants,
    P: P.pantsShadow,
    o: P.shoe,
    e: P.ink,    // eye
    k: P.cheek,  // cheek
    m: P.roseDeep, // mouth
    w: P.cream,  // white in eye / item
    '.': null,
  };

  function drawCharacter(ctx, x, y, pose, frame, facing, mood) {
    x = Math.floor(x); y = Math.floor(y);
    const f = facing >= 0 ? 1 : -1;

    // shadow under feet (always)
    if (pose !== 'sleep') {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x - 6, y + 24, 14, 2);
    }

    if (pose === 'sleep') {
      drawCharSleep(ctx, x, y, frame);
      return;
    }
    if (pose === 'sit')   return drawCharSit(ctx, x, y, frame, f, mood);
    if (pose === 'eat')   return drawCharEat(ctx, x, y, frame, f, mood);
    if (pose === 'work')  return drawCharWork(ctx, x, y, frame, f, mood);
    if (pose === 'paint') return drawCharPaint(ctx, x, y, frame, f, mood);
    if (pose === 'read')  return drawCharRead(ctx, x, y, frame, f, mood);
    if (pose === 'window')return drawCharWindow(ctx, x, y, frame, f, mood);
    if (pose === 'water') return drawCharWater(ctx, x, y, frame, f, mood);
    if (pose === 'stretch')return drawCharStretch(ctx, x, y, frame, f, mood);
    if (pose === 'clean') return drawCharClean(ctx, x, y, frame, f, mood);
    if (pose === 'walk')  return drawCharWalk(ctx, x, y, frame, f, mood);
    return drawCharIdle(ctx, x, y, frame, f, mood);
  }

  // standing idle (small breathing bob)
  function drawCharIdle(ctx, x, y, frame, f, mood) {
    const bob = (frame % 60 < 30) ? 0 : -1;
    drawCharBase(ctx, x, y + bob, f, mood, 'stand');
    // arms relaxed
    px(ctx, x + (f > 0 ? -3 : 7), y + 10 + bob, 2, 8, P.cloth);
    px(ctx, x + (f > 0 ? 8  : -2), y + 10 + bob, 2, 8, P.cloth);
  }

  function drawCharWalk(ctx, x, y, frame, f, mood) {
    const phase = Math.floor(frame / 8) % 4;
    const bob = (phase === 1 || phase === 3) ? -1 : 0;
    drawCharBase(ctx, x, y + bob, f, mood, 'walk', phase);
    // arms swinging
    const aPhase = phase % 2;
    px(ctx, x + (f > 0 ? -3 : 7), y + 10 + bob + aPhase, 2, 7, P.cloth);
    px(ctx, x + (f > 0 ? 8 : -2), y + 10 + bob + (1 - aPhase), 2, 7, P.cloth);
  }

  function drawCharSleep(ctx, x, y, frame) {
    // x,y is character anchor; on the bed
    const bx = 38; const by = 168;
    // body lying horizontally
    px(ctx, bx + 4, by, 32, 6, P.blanket);
    px(ctx, bx + 6, by - 1, 28, 1, P.blanket2);
    // head
    px(ctx, bx + 36, by - 4, 8, 8, P.skin);
    px(ctx, bx + 36, by - 6, 8, 4, P.hair);
    // closed eyes
    px(ctx, bx + 38, by - 1, 1, 1, P.ink);
    px(ctx, bx + 41, by - 1, 1, 1, P.ink);
    // breathing zzz
    if (Math.floor(frame / 30) % 2 === 0) {
      ctx.fillStyle = 'rgba(245, 230, 211, 0.7)';
      ctx.font = '6px monospace';
      ctx.fillText('z', bx + 48, by - 6);
      ctx.fillText('Z', bx + 52, by - 10);
    }
  }

  function drawCharSit(ctx, x, y, frame, f, mood) {
    drawCharBase(ctx, x, y + 4, f, mood, 'sit');
    // legs tucked
    px(ctx, x, y + 18, 7, 4, P.pants);
  }

  function drawCharEat(ctx, x, y, frame, f, mood) {
    drawCharBase(ctx, x, y, f, mood, 'stand');
    // bowl in hands
    px(ctx, x + (f > 0 ? 6 : -2), y + 14, 5, 3, P.cream);
    px(ctx, x + (f > 0 ? 6 : -2), y + 14, 5, 1, P.peach);
    // arms holding bowl
    px(ctx, x + (f > 0 ? 5 : -1), y + 12, 2, 4, P.cloth);
    px(ctx, x + (f > 0 ? 9 : 3),  y + 12, 2, 4, P.cloth);
    // eating animation (steam)
    if (Math.floor(frame / 12) % 2 === 0) {
      px(ctx, x + (f > 0 ? 7 : -1), y + 11, 1, 1, 'rgba(255,248,236,0.5)');
    }
  }

  function drawCharWork(ctx, x, y, frame, f, mood) {
    drawCharBase(ctx, x, y + 2, f, mood, 'sit');
    // hunched arms forward
    px(ctx, x + (f > 0 ? 4 : 2), y + 10, 4, 6, P.cloth);
    // typing motion
    const k = Math.floor(frame / 6) % 2;
    px(ctx, x + (f > 0 ? 7 : -1) + k, y + 14, 1, 1, P.skinShadow);
  }

  function drawCharPaint(ctx, x, y, frame, f, mood) {
    drawCharBase(ctx, x, y + 2, f, mood, 'sit');
    // arm outstretched with brush
    px(ctx, x + (f > 0 ? 6 : 0), y + 10, 4, 2, P.cloth);
    px(ctx, x + (f > 0 ? 10 : -1), y + 10, 1, 2, P.deskWood);
    px(ctx, x + (f > 0 ? 11 : -2), y + 9 + (frame % 20 < 10 ? 0 : 1), 1, 1, P.rose);
  }

  function drawCharRead(ctx, x, y, frame, f, mood) {
    drawCharBase(ctx, x, y, f, mood, 'stand');
    // book in hands
    px(ctx, x + 1, y + 11, 8, 6, P.bookB);
    px(ctx, x + 2, y + 12, 6, 4, P.cream);
    px(ctx, x + 5, y + 12, 1, 4, P.bookB);
    // arms
    px(ctx, x - 1, y + 11, 2, 4, P.cloth);
    px(ctx, x + 9, y + 11, 2, 4, P.cloth);
  }

  function drawCharWindow(ctx, x, y, frame, f, mood) {
    drawCharBase(ctx, x, y, f, mood, 'stand');
    // arms behind back
    px(ctx, x + 2, y + 14, 5, 5, P.clothShadow);
  }

  function drawCharWater(ctx, x, y, frame, f, mood) {
    drawCharBase(ctx, x, y + 1, f, mood, 'stand');
    // bent slightly forward
    px(ctx, x + (f > 0 ? 6 : -1), y + 12, 3, 2, P.cloth);
    // watering can
    px(ctx, x + (f > 0 ? 9 : -3), y + 12, 4, 3, P.bookA);
    px(ctx, x + (f > 0 ? 12 : -4), y + 13, 1, 1, P.bookA);
    // water droplets
    if (Math.floor(frame / 6) % 2 === 0) {
      px(ctx, x + (f > 0 ? 13 : -5), y + 16, 1, 2, '#9bc4cf');
    }
  }

  function drawCharStretch(ctx, x, y, frame, f, mood) {
    drawCharBase(ctx, x, y, f, mood, 'stand');
    // arms up
    const phase = Math.floor(frame / 30) % 2;
    px(ctx, x - 2, y + 5 - phase, 2, 5, P.cloth);
    px(ctx, x + 8, y + 5 - phase, 2, 5, P.cloth);
    px(ctx, x - 2, y + 3 - phase, 2, 2, P.skin);
    px(ctx, x + 8, y + 3 - phase, 2, 2, P.skin);
  }

  function drawCharClean(ctx, x, y, frame, f, mood) {
    drawCharBase(ctx, x, y + 1, f, mood, 'stand');
    // broom angled
    const sway = Math.sin(frame * 0.2) * 1;
    const bx = x + (f > 0 ? 8 : -4);
    px(ctx, bx, y + 8, 1, 14, P.deskWood);
    px(ctx, bx - 1 + sway, y + 22, 4, 3, P.amber);
    // arm holding broom
    px(ctx, x + (f > 0 ? 6 : 0), y + 12, 3, 2, P.cloth);
  }

  // base body draws head + torso + legs (no arms)
  function drawCharBase(ctx, x, y, f, mood, mode, phase = 0) {
    // legs
    if (mode === 'walk') {
      const offset = (phase % 2 === 0) ? 0 : 1;
      px(ctx, x + 1,     y + 18, 3, 6, P.pants);
      px(ctx, x + 4,     y + 18 - offset, 3, 6, P.pants);
      px(ctx, x + 1,     y + 23, 3, 1, P.shoe);
      px(ctx, x + 4,     y + 23 - offset, 3, 1, P.shoe);
    } else if (mode === 'sit') {
      px(ctx, x,         y + 16, 8, 4, P.pants);
      px(ctx, x + 1,     y + 20, 6, 1, P.pantsShadow);
    } else {
      px(ctx, x + 1,     y + 18, 3, 6, P.pants);
      px(ctx, x + 4,     y + 18, 3, 6, P.pants);
      px(ctx, x + 1,     y + 23, 3, 1, P.shoe);
      px(ctx, x + 4,     y + 23, 3, 1, P.shoe);
      px(ctx, x + 1,     y + 21, 3, 2, P.pantsShadow);
      px(ctx, x + 4,     y + 21, 3, 2, P.pantsShadow);
    }

    // torso (cozy sweater)
    px(ctx, x,     y + 10, 8, 8, P.cloth);
    px(ctx, x,     y + 17, 8, 1, P.clothShadow);
    px(ctx, x + 1, y + 11, 6, 1, P.creamSoft);  // collar highlight

    // head
    px(ctx, x + 1, y + 1,  6, 8, P.skin);
    px(ctx, x + 1, y + 8,  6, 1, P.skinShadow);
    // hair (varies by face direction)
    if (f > 0) {
      px(ctx, x + 1, y,     6, 4, P.hair);
      px(ctx, x,     y + 2, 1, 5, P.hair);
      px(ctx, x + 1, y + 1, 4, 1, P.hairLight);
      px(ctx, x + 5, y + 4, 2, 4, P.hair);
    } else {
      px(ctx, x + 1, y,     6, 4, P.hair);
      px(ctx, x + 7, y + 2, 1, 5, P.hair);
      px(ctx, x + 3, y + 1, 4, 1, P.hairLight);
      px(ctx, x + 1, y + 4, 2, 4, P.hair);
    }

    // face — eyes, mouth, cheeks (mood-aware)
    drawFace(ctx, x, y, f, mood);
  }

  function drawFace(ctx, x, y, f, mood = 'normal') {
    const eyeY = y + 5;
    const eyeL = f > 0 ? x + 2 : x + 3;
    const eyeR = f > 0 ? x + 5 : x + 6;
    // cheeks
    px(ctx, eyeL,     eyeY + 1, 1, 1, 'rgba(232, 163, 163, 0.7)');
    px(ctx, eyeR,     eyeY + 1, 1, 1, 'rgba(232, 163, 163, 0.7)');

    // eyes vary by mood
    if (mood === 'tired' || mood === 'sleepy') {
      // half-lidded: short horizontal lines
      px(ctx, eyeL, eyeY, 1, 1, P.ink);
      px(ctx, eyeR, eyeY, 1, 1, P.ink);
    } else if (mood === 'sad' || mood === 'lonely') {
      // downturned dots
      px(ctx, eyeL, eyeY,     1, 1, P.ink);
      px(ctx, eyeR, eyeY,     1, 1, P.ink);
      // small mouth
      px(ctx, x + 3, y + 7, 2, 1, P.shadow);
    } else if (mood === 'happy') {
      // crescent eyes
      px(ctx, eyeL,     eyeY,     1, 1, P.ink);
      px(ctx, eyeR,     eyeY,     1, 1, P.ink);
      // smile
      px(ctx, x + 3, y + 7, 2, 1, P.roseDeep);
    } else if (mood === 'inspired') {
      px(ctx, eyeL, eyeY, 1, 1, P.ink);
      px(ctx, eyeR, eyeY, 1, 1, P.ink);
      px(ctx, eyeL, eyeY - 1, 1, 1, P.cream); // sparkle
    } else {
      // normal: simple dots
      px(ctx, eyeL, eyeY, 1, 1, P.ink);
      px(ctx, eyeR, eyeY, 1, 1, P.ink);
      px(ctx, x + 3, y + 7, 2, 1, P.roseDeep);
    }
  }

  // ─── PARTICLE/AMBIENCE ─────────────────────────────────────
  function drawDustMotes(ctx, time) {
    ctx.fillStyle = 'rgba(255, 217, 183, 0.35)';
    for (let i = 0; i < 14; i++) {
      const x = (i * 47 + time * 8) % 480;
      const y = 40 + Math.sin(time * 0.4 + i) * 30 + i * 5;
      ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    }
  }

  function drawRain(ctx, time) {
    ctx.fillStyle = 'rgba(180, 200, 220, 0.35)';
    for (let i = 0; i < 90; i++) {
      const x = (i * 13 + time * 60) % 480;
      const y = (i * 17 + time * 200) % 270;
      ctx.fillRect(Math.floor(x), Math.floor(y), 1, 4);
    }
  }

  function drawSnow(ctx, time) {
    ctx.fillStyle = 'rgba(255, 248, 236, 0.6)';
    for (let i = 0; i < 60; i++) {
      const baseX = i * 9;
      const x = (baseX + Math.sin(time * 0.6 + i) * 20 + time * 10) % 480;
      const y = (i * 11 + time * 30) % 270;
      ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    }
  }

  // ─── LIGHT/TIME OVERLAY ────────────────────────────────────
  function drawLightingOverlay(ctx, hour, weather) {
    let color = null;
    let alpha = 0;
    if (hour >= 19 || hour < 6) {
      // night
      color = '52, 50, 80';
      alpha = 0.42;
    } else if (hour < 7) {
      color = '218, 160, 130'; alpha = 0.18;
    } else if (hour >= 17 && hour < 19) {
      color = '232, 140, 100'; alpha = 0.22;
    } else if (weather === 'rain' || weather === 'cloudy') {
      color = '160, 160, 180'; alpha = 0.10;
    } else if (weather === 'snow') {
      color = '210, 220, 240'; alpha = 0.10;
    } else {
      color = '255, 230, 200'; alpha = 0.06;
    }
    if (alpha > 0) {
      ctx.fillStyle = `rgba(${color}, ${alpha})`;
      ctx.fillRect(0, 0, 480, 270);
    }
    // lamp glow at night
    if (hour >= 18 || hour < 6) {
      const grd = ctx.createRadialGradient(160, 168, 4, 160, 168, 80);
      grd.addColorStop(0, 'rgba(255, 217, 130, 0.45)');
      grd.addColorStop(1, 'rgba(255, 217, 130, 0)');
      ctx.fillStyle = grd;
      ctx.fillRect(80, 110, 160, 110);
    }
  }

  function skyTint(hour, weather) {
    if (weather === 'rain') return { top: '#5e6c7a', bot: '#8294a3' };
    if (weather === 'snow') return { top: '#8a96a8', bot: '#c8d4e0' };
    if (hour < 5)  return { top: '#1a1a2e', bot: '#2d2638' };
    if (hour < 7)  return { top: '#5d4f7a', bot: '#f4b18a' };
    if (hour < 17) return { top: '#9bc4cf', bot: '#cfe5ed' };
    if (hour < 19) return { top: '#c98088', bot: '#f4b18a' };
    if (hour < 21) return { top: '#3d4f66', bot: '#7c6090' };
    return { top: '#1a1a2e', bot: '#2d2638' };
  }

  // ─── COLOR HELPERS ─────────────────────────────────────────
  function hexToRgb(h) {
    const m = h.replace('#', '');
    return {
      r: parseInt(m.substring(0, 2), 16),
      g: parseInt(m.substring(2, 4), 16),
      b: parseInt(m.substring(4, 6), 16),
    };
  }
  function rgbToHex(r, g, b) {
    const h = n => n.toString(16).padStart(2, '0');
    return '#' + h(r) + h(g) + h(b);
  }
  function lerpColor(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex(
      Math.round(A.r + (B.r - A.r) * t),
      Math.round(A.g + (B.g - A.g) * t),
      Math.round(A.b + (B.b - A.b) * t),
    );
  }
  function lighten(c, amt) { return lerpColor(c, '#ffffff', amt); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ─── EXPORT ────────────────────────────────────────────────
  window.SPR = {
    drawWall, drawFloor, drawRug, drawBed, drawDesk, drawChair,
    drawBookshelf, drawPlant, drawWindow, drawKitchen, drawDoor,
    drawWallDecor, drawCharacter,
    drawDustMotes, drawRain, drawSnow,
    drawLightingOverlay,
    px, lerpColor, clamp,
  };
})();

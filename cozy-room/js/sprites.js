// ─── sprites.js ────────────────────────────────────────────
// Isometric pixel-art rendering. Internal canvas: 320×180.
// Tile dimetric (2:1) projection. Detailed cozy diorama.

(function () {
  const P = window.CFG.PAL;
  const TW = window.CFG.TILE_W;        // 32
  const TH = window.CFG.TILE_H;        // 16
  const WALL_H = window.CFG.WALL_H_TILES; // 4
  const ROOM_W = window.CFG.ROOM_W;    // 7
  const ROOM_D = window.CFG.ROOM_D;    // 5
  const OX = window.CFG.ISO_OX;        // 144
  const OY = window.CFG.ISO_OY;        // 72

  // ─── PROJECTION ────────────────────────────────────────────
  function iso(tx, ty, tz = 0) {
    return {
      x: Math.round(OX + (tx - ty) * (TW / 2)),
      y: Math.round(OY + (tx + ty) * (TH / 2) - tz * TH),
    };
  }

  // ─── PRIMITIVES ────────────────────────────────────────────
  function poly(ctx, pts, fill, stroke) {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pts[0].x + 0.5, pts[0].y + 0.5);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x + 0.5, pts[i].y + 0.5);
      ctx.closePath();
      ctx.stroke();
    }
  }

  function fillRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
  }

  function isoBox(ctx, tx, ty, w, d, h, c) {
    const blb = iso(tx,     ty,     0);
    const brb = iso(tx + w, ty,     0);
    const brf = iso(tx + w, ty + d, 0);
    const blf = iso(tx,     ty + d, 0);
    const tlb = iso(tx,     ty,     h);
    const trb = iso(tx + w, ty,     h);
    const trf = iso(tx + w, ty + d, h);
    const tlf = iso(tx,     ty + d, h);
    if (c.left)  poly(ctx, [tlb, tlf, blf, blb], c.left,  c.outline);
    if (c.right) poly(ctx, [trb, trf, brf, brb], c.right, c.outline);
    if (c.front) poly(ctx, [tlf, trf, brf, blf], c.front, c.outline);
    if (c.top)   poly(ctx, [tlb, trb, trf, tlf], c.top,   c.outline);
  }

  // ─── ROOM SHELL ────────────────────────────────────────────
  function drawWall(ctx, hour, weather) {
    drawBackWall(ctx, hour, weather);
    drawLeftWall(ctx);
  }

  function drawBackWall(ctx) {
    // panel
    poly(ctx, [
      iso(0, 0, 0), iso(ROOM_W, 0, 0),
      iso(ROOM_W, 0, WALL_H), iso(0, 0, WALL_H),
    ], P.wallBg);
    // wallpaper polka pattern (small dots staggered)
    ctx.fillStyle = 'rgba(120, 90, 60, 0.18)';
    for (let z = 0.4; z < WALL_H - 0.2; z += 0.28) {
      const offset = (Math.floor(z * 10) % 2) * 0.18;
      for (let tx = 0.18 + offset; tx < ROOM_W; tx += 0.36) {
        const p = iso(tx, 0, z);
        ctx.fillRect(p.x, p.y, 1, 1);
        ctx.fillRect(p.x + 1, p.y - 1, 1, 1);
      }
    }
    // wood paneling at bottom 0.4 of wall
    poly(ctx, [
      iso(0, 0, 0), iso(ROOM_W, 0, 0),
      iso(ROOM_W, 0, 0.55), iso(0, 0, 0.55),
    ], P.wallTrim);
    // vertical board lines on paneling
    ctx.strokeStyle = 'rgba(60, 40, 28, 0.35)';
    for (let tx = 0.5; tx < ROOM_W; tx += 0.5) {
      const a = iso(tx, 0, 0);
      const b = iso(tx, 0, 0.55);
      ctx.beginPath();
      ctx.moveTo(a.x + 0.5, a.y);
      ctx.lineTo(b.x + 0.5, b.y);
      ctx.stroke();
    }
    // baseboard (skinny strip)
    poly(ctx, [
      iso(0, 0, 0), iso(ROOM_W, 0, 0),
      iso(ROOM_W, 0, 0.18), iso(0, 0, 0.18),
    ], P.deskWood2);
    // top of paneling rail
    poly(ctx, [
      iso(0, 0, 0.55), iso(ROOM_W, 0, 0.55),
      iso(ROOM_W, 0, 0.62), iso(0, 0, 0.62),
    ], P.deskWood);
    // crown moulding (top strip)
    poly(ctx, [
      iso(0, 0, WALL_H - 0.14), iso(ROOM_W, 0, WALL_H - 0.14),
      iso(ROOM_W, 0, WALL_H), iso(0, 0, WALL_H),
    ], P.deskWood2);
  }

  function drawLeftWall(ctx) {
    // panel
    poly(ctx, [
      iso(0, 0, 0), iso(0, ROOM_D, 0),
      iso(0, ROOM_D, WALL_H), iso(0, 0, WALL_H),
    ], P.wallBg2);
    // polka pattern
    ctx.fillStyle = 'rgba(120, 90, 60, 0.18)';
    for (let z = 0.4; z < WALL_H - 0.2; z += 0.28) {
      const offset = (Math.floor(z * 10) % 2) * 0.18;
      for (let ty = 0.18 + offset; ty < ROOM_D; ty += 0.36) {
        const p = iso(0, ty, z);
        ctx.fillRect(p.x - 1, p.y, 1, 1);
        ctx.fillRect(p.x - 2, p.y - 1, 1, 1);
      }
    }
    // wood paneling bottom
    poly(ctx, [
      iso(0, 0, 0), iso(0, ROOM_D, 0),
      iso(0, ROOM_D, 0.55), iso(0, 0, 0.55),
    ], P.wallTrim);
    ctx.strokeStyle = 'rgba(60, 40, 28, 0.35)';
    for (let ty = 0.5; ty < ROOM_D; ty += 0.5) {
      const a = iso(0, ty, 0);
      const b = iso(0, ty, 0.55);
      ctx.beginPath();
      ctx.moveTo(a.x + 0.5, a.y);
      ctx.lineTo(b.x + 0.5, b.y);
      ctx.stroke();
    }
    poly(ctx, [
      iso(0, 0, 0), iso(0, ROOM_D, 0),
      iso(0, ROOM_D, 0.18), iso(0, 0, 0.18),
    ], P.deskWood2);
    poly(ctx, [
      iso(0, 0, 0.55), iso(0, ROOM_D, 0.55),
      iso(0, ROOM_D, 0.62), iso(0, 0, 0.62),
    ], P.deskWood);
    poly(ctx, [
      iso(0, 0, WALL_H - 0.14), iso(0, ROOM_D, WALL_H - 0.14),
      iso(0, ROOM_D, WALL_H), iso(0, 0, WALL_H),
    ], P.deskWood2);
  }

  function drawFloor(ctx) {
    // base
    poly(ctx, [
      iso(0, 0), iso(ROOM_W, 0),
      iso(ROOM_W, ROOM_D), iso(0, ROOM_D),
    ], P.floor);
    // alternating plank rows - faint warm/cool variation
    for (let ty = 0; ty < ROOM_D; ty++) {
      if (ty % 2 === 1) {
        poly(ctx, [
          iso(0, ty), iso(ROOM_W, ty),
          iso(ROOM_W, ty + 1), iso(0, ty + 1),
        ], P.floor2);
      }
    }
    // plank seams (along tx axis)
    ctx.strokeStyle = 'rgba(60, 40, 28, 0.45)';
    ctx.lineWidth = 1;
    for (let ty = 1; ty < ROOM_D; ty++) {
      const a = iso(0, ty);
      const b = iso(ROOM_W, ty);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y + 0.5);
      ctx.lineTo(b.x, b.y + 0.5);
      ctx.stroke();
    }
    // staggered plank cuts
    ctx.strokeStyle = 'rgba(60, 40, 28, 0.25)';
    for (let ty = 0; ty < ROOM_D; ty++) {
      for (let tx = (ty % 2 === 0) ? 1.5 : 0.7; tx < ROOM_W; tx += 1.6) {
        const a = iso(tx, ty);
        const b = iso(tx, ty + 1);
        ctx.beginPath();
        ctx.moveTo(a.x + 0.5, a.y);
        ctx.lineTo(b.x + 0.5, b.y);
        ctx.stroke();
      }
    }
    // wood knots (small dots)
    ctx.fillStyle = 'rgba(60, 40, 28, 0.3)';
    const knots = [[1.3, 0.6], [3.7, 1.4], [5.5, 2.6], [2.2, 3.1], [4.8, 4.2], [0.6, 4.1]];
    for (const [tx, ty] of knots) {
      const p = iso(tx, ty);
      ctx.fillRect(p.x, p.y, 1, 1);
      ctx.fillRect(p.x + 1, p.y, 1, 1);
    }
  }

  // ─── ROOM SILHOUETTE OUTLINE ───────────────────────────────
  function drawRoomOutline(ctx) {
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'square';

    // top edges (where walls meet ceiling line)
    line(ctx, iso(0, ROOM_D, WALL_H), iso(0, 0, WALL_H));
    line(ctx, iso(0, 0, WALL_H), iso(ROOM_W, 0, WALL_H));
    // vertical corner where two walls meet
    line(ctx, iso(0, 0, WALL_H), iso(0, 0, 0));
    // back wall right edge (vertical)
    line(ctx, iso(ROOM_W, 0, WALL_H), iso(ROOM_W, 0, 0));
    // left wall front edge (vertical)
    line(ctx, iso(0, ROOM_D, WALL_H), iso(0, ROOM_D, 0));
    // floor front edges (the camera-side L-shape)
    line(ctx, iso(0, ROOM_D, 0), iso(ROOM_W, ROOM_D, 0));
    line(ctx, iso(ROOM_W, 0, 0), iso(ROOM_W, ROOM_D, 0));
    // floor back-corner (faint, where wall meets floor)
    ctx.lineWidth = 1;
    line(ctx, iso(0, 0, 0), iso(ROOM_W, 0, 0));
    line(ctx, iso(0, 0, 0), iso(0, ROOM_D, 0));

    ctx.lineWidth = 1;
  }

  function line(ctx, a, b) {
    ctx.beginPath();
    ctx.moveTo(a.x + 0.5, a.y + 0.5);
    ctx.lineTo(b.x + 0.5, b.y + 0.5);
    ctx.stroke();
  }

  // ─── WINDOW (cuts back wall) ───────────────────────────────
  function drawWindow(ctx, hour, weather) {
    const x1 = 4.4, x2 = 5.5, z1 = 1.6, z2 = 3.3;
    const a = iso(x1, 0, z1);
    const b = iso(x2, 0, z1);
    const c = iso(x2, 0, z2);
    const d = iso(x1, 0, z2);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y);
    ctx.closePath();
    ctx.clip();
    drawSkyInside(ctx, a, b, c, d, hour, weather);
    ctx.restore();

    // outer frame (thick wood)
    ctx.lineJoin = 'miter';
    poly(ctx, [
      iso(x1 - 0.06, 0, z1 - 0.05),
      iso(x2 + 0.06, 0, z1 - 0.05),
      iso(x2 + 0.06, 0, z2 + 0.05),
      iso(x1 - 0.06, 0, z2 + 0.05),
    ], null, P.deskWood2);
    ctx.strokeStyle = P.deskWood2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y);
    ctx.closePath();
    ctx.stroke();
    // muntins (cross frame)
    ctx.lineWidth = 1;
    const mx = (x1 + x2) / 2;
    const mz = (z1 + z2) / 2;
    const m1 = iso(mx, 0, z1);
    const m2 = iso(mx, 0, z2);
    const m3 = iso(x1, 0, mz);
    const m4 = iso(x2, 0, mz);
    ctx.beginPath();
    ctx.moveTo(m1.x, m1.y); ctx.lineTo(m2.x, m2.y);
    ctx.moveTo(m3.x, m3.y); ctx.lineTo(m4.x, m4.y);
    ctx.stroke();
    // sill
    poly(ctx, [
      iso(x1 - 0.1, 0, z1 - 0.12),
      iso(x2 + 0.1, 0, z1 - 0.12),
      iso(x2 + 0.1, 0, z1),
      iso(x1 - 0.1, 0, z1),
    ], P.deskWood);
    poly(ctx, [
      iso(x1 - 0.1, 0, z1 - 0.18),
      iso(x2 + 0.1, 0, z1 - 0.18),
      iso(x2 + 0.1, 0, z1 - 0.12),
      iso(x1 - 0.1, 0, z1 - 0.12),
    ], P.deskWood2);
    // tiny potted plant on sill
    const pot = iso(x1 + 0.2, 0, z1);
    fillRect(ctx, pot.x, pot.y - 4, 3, 3, P.plantPot);
    fillRect(ctx, pot.x, pot.y - 6, 1, 2, P.plantLeaf);
    fillRect(ctx, pot.x + 1, pot.y - 7, 1, 3, P.plantLeaf2);
    fillRect(ctx, pot.x + 2, pot.y - 6, 1, 2, P.sageDeep);
    // curtains hanging from rod
    const rodA = iso(x1 - 0.15, 0, z2 + 0.1);
    const rodB = iso(x2 + 0.15, 0, z2 + 0.1);
    fillRect(ctx, rodA.x, rodA.y - 1, rodB.x - rodA.x, 1, P.amberDeep);
    // tied curtain on left
    poly(ctx, [
      iso(x1 - 0.18, 0, z2 + 0.05),
      iso(x1 - 0.04, 0, z2 + 0.05),
      iso(x1 - 0.06, 0, z1 + 0.2),
      iso(x1 - 0.18, 0, z1 + 0.2),
    ], P.rose);
    poly(ctx, [
      iso(x2 + 0.04, 0, z2 + 0.05),
      iso(x2 + 0.18, 0, z2 + 0.05),
      iso(x2 + 0.18, 0, z1 + 0.2),
      iso(x2 + 0.06, 0, z1 + 0.2),
    ], P.rose);
    // curtain pleats
    ctx.strokeStyle = P.roseDeep;
    const pl_a = iso(x1 - 0.1, 0, z2);
    const pl_b = iso(x1 - 0.1, 0, z1 + 0.3);
    ctx.beginPath();
    ctx.moveTo(pl_a.x, pl_a.y); ctx.lineTo(pl_b.x, pl_b.y);
    ctx.stroke();
  }

  function drawSkyInside(ctx, a, b, c, d, hour, weather) {
    const minX = Math.min(a.x, d.x);
    const maxX = Math.max(b.x, c.x);
    const minY = Math.min(c.y, d.y);
    const maxY = Math.max(a.y, b.y);
    const w = maxX - minX;
    const h = maxY - minY;

    const tint = skyTint(hour, weather);
    const grd = ctx.createLinearGradient(0, minY, 0, maxY);
    grd.addColorStop(0, tint.top);
    grd.addColorStop(1, tint.bot);
    ctx.fillStyle = grd;
    ctx.fillRect(minX - 2, minY - 2, w + 4, h + 4);

    const isNight = hour < 6 || hour >= 19;
    if (isNight) {
      const mx = minX + w * 0.62;
      const my = minY + h * 0.22;
      ctx.fillStyle = P.moon;
      ctx.fillRect(mx - 3, my - 3, 6, 6);
      ctx.fillStyle = lerpColor(P.moon, tint.top, 0.55);
      ctx.fillRect(mx + 1, my - 2, 4, 4);
      ctx.fillStyle = P.star;
      const t = window.gameTime?.totalGameSeconds || 0;
      for (let i = 0; i < 9; i++) {
        const sx = minX + ((i * 11) % w);
        const sy = minY + 2 + ((i * 5) % Math.floor(h * 0.5));
        if ((i + Math.floor(t / 1.5)) % 4 !== 0) ctx.fillRect(sx, sy, 1, 1);
      }
    } else {
      const tNorm = clamp((hour - 6) / 13, 0, 1);
      const sx = minX + 4 + Math.floor(tNorm * (w - 12));
      const sy = minY + 4 + Math.floor(Math.sin(tNorm * Math.PI) * -8) + 8;
      let sunCol = P.amber;
      if (hour < 8) sunCol = P.peach;
      if (hour > 17) sunCol = P.skySunset;
      ctx.fillStyle = 'rgba(255, 217, 183, 0.4)';
      ctx.fillRect(sx - 2, sy - 2, 9, 9);
      ctx.fillStyle = sunCol;
      ctx.fillRect(sx, sy, 5, 5);
      ctx.fillStyle = P.cream;
      ctx.fillRect(sx + 1, sy + 1, 3, 3);
    }

    // far mountain ridge
    ctx.fillStyle = isNight ? '#1a1a2a' : '#5a6a6a';
    const mtnY = minY + Math.floor(h * 0.55);
    for (let mx = 0; mx < w; mx++) {
      const triH = 5 + Math.floor(Math.sin(mx * 0.4) * 2 + Math.cos(mx * 0.7) * 2);
      ctx.fillRect(minX + mx, mtnY - triH, 1, triH);
    }
    // closer pine ridge
    ctx.fillStyle = isNight ? '#0e0e1c' : '#3a4a3a';
    const treeY = minY + Math.floor(h * 0.68);
    for (let tx = 0; tx < w; tx += 2) {
      const triH = 3 + ((tx * 5) % 6);
      ctx.fillRect(minX + tx, treeY - triH, 1, triH);
      ctx.fillRect(minX + tx + 1, treeY - triH + 1, 1, triH - 1);
    }
    ctx.fillStyle = isNight ? '#2a2030' : '#6a5440';
    ctx.fillRect(minX, treeY, w, h - (treeY - minY));

    // clouds
    if (weather !== 'clear' || (hour > 9 && hour < 17)) {
      const t = window.gameTime?.totalGameSeconds || 0;
      ctx.fillStyle = isNight ? 'rgba(58, 53, 64, 0.85)' : P.cloud;
      const c1x = minX + ((t * 0.3 + 5) % (w + 14)) - 7;
      const c1y = minY + 4;
      ctx.fillRect(c1x, c1y, 7, 2);
      ctx.fillRect(c1x + 1, c1y - 1, 5, 1);
      const c2x = minX + ((t * 0.2 + 25) % (w + 12)) - 6;
      const c2y = minY + 12;
      ctx.fillRect(c2x, c2y, 5, 2);
      ctx.fillRect(c2x + 1, c2y - 1, 3, 1);
    }

    // rain or snow streaks
    if (weather === 'rain') {
      ctx.fillStyle = 'rgba(180, 200, 220, 0.55)';
      const t = window.gameTime?.totalGameSeconds || 0;
      for (let i = 0; i < 14; i++) {
        const rx = minX + ((i * 5 + t * 30) % w);
        const ry = minY + ((i * 7 + t * 70) % h);
        ctx.fillRect(rx, ry, 1, 2);
      }
    } else if (weather === 'snow') {
      ctx.fillStyle = P.cream;
      const t = window.gameTime?.totalGameSeconds || 0;
      for (let i = 0; i < 11; i++) {
        const rx = minX + ((i * 4 + t * 6 + Math.sin(t + i) * 2) % w);
        const ry = minY + ((i * 6 + t * 14) % h);
        ctx.fillRect(rx, ry, 1, 1);
      }
    }
  }

  // ─── WALL DECOR ────────────────────────────────────────────
  function drawWallDecor(ctx) {
    drawCircleClock(ctx);
    drawFrameOnBackWall(ctx, 1.65, 2.4, 0.65, 0.55, 'sunset');
    drawFrameOnBackWall(ctx, 2.4, 2.5, 0.4, 0.45, 'circle');
    drawFrameOnBackWall(ctx, 3.05, 2.45, 0.55, 0.5, 'plant');
    drawHangingPlant(ctx, 6.3, 3.2);
    drawWallShelf(ctx, 1.9, 1.4);
    drawCelloOnWall(ctx);
    drawLeftWallFrames(ctx);
  }

  function drawFrameOnBackWall(ctx, tx, z, w, h, kind) {
    const a = iso(tx, 0, z);
    const b = iso(tx + w, 0, z);
    const c = iso(tx + w, 0, z + h);
    const d = iso(tx, 0, z + h);
    poly(ctx, [a, b, c, d], P.deskWood2);
    const pad = 0.06;
    const ia = iso(tx + pad, 0, z + pad);
    const ib = iso(tx + w - pad, 0, z + pad);
    const ic = iso(tx + w - pad, 0, z + h - pad);
    const id = iso(tx + pad, 0, z + h - pad);
    poly(ctx, [ia, ib, ic, id], P.cream);
    const fx = ia.x + 1, fy = ic.y + 1;
    const fw = ib.x - ia.x - 2;
    const fh = id.y - ia.y - 2;

    if (kind === 'sunset') {
      ctx.fillStyle = P.skySunset;
      ctx.fillRect(fx, fy, fw, Math.floor(fh * 0.5));
      ctx.fillStyle = P.amber;
      ctx.fillRect(fx + Math.floor(fw * 0.65), fy + 1, 3, 3);
      ctx.fillStyle = P.peach;
      ctx.fillRect(fx + Math.floor(fw * 0.65) + 1, fy + 2, 1, 1);
      ctx.fillStyle = P.sage;
      ctx.fillRect(fx, fy + Math.floor(fh * 0.5), fw, fh - Math.floor(fh * 0.5));
      ctx.fillStyle = P.sageDeep;
      ctx.fillRect(fx + 1, fy + Math.floor(fh * 0.55) + 1, 2, 2);
      ctx.fillRect(fx + fw - 3, fy + Math.floor(fh * 0.6), 2, 2);
    } else if (kind === 'circle') {
      // abstract circles
      ctx.fillStyle = P.creamSoft;
      ctx.fillRect(fx, fy, fw, fh);
      ctx.fillStyle = P.rose;
      ctx.fillRect(fx + 1, fy + 1, 3, 3);
      ctx.fillStyle = P.sage;
      ctx.fillRect(fx + fw - 4, fy + fh - 4, 3, 3);
      ctx.fillStyle = P.amber;
      ctx.fillRect(fx + Math.floor(fw / 2), fy + Math.floor(fh / 2) - 1, 2, 2);
    } else if (kind === 'plant') {
      // botanical
      ctx.fillStyle = P.creamSoft;
      ctx.fillRect(fx, fy, fw, fh);
      ctx.fillStyle = P.sageDeep;
      ctx.fillRect(fx + Math.floor(fw / 2), fy + 1, 1, fh - 2);
      ctx.fillStyle = P.plantLeaf;
      for (let ly = 1; ly < fh - 1; ly += 2) {
        ctx.fillRect(fx + Math.floor(fw / 2) - 2, fy + ly, 2, 1);
        ctx.fillRect(fx + Math.floor(fw / 2) + 1, fy + ly + 1, 2, 1);
      }
    }
  }

  function drawCircleClock(ctx) {
    const center = iso(0.7, 0, 3.0);
    const r = 4;
    ctx.fillStyle = P.cream;
    ctx.beginPath(); ctx.arc(center.x, center.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = P.deskWood2;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(center.x, center.y, r, 0, Math.PI * 2); ctx.stroke();
    // tick marks at 12/3/6/9
    ctx.fillStyle = P.ink;
    ctx.fillRect(center.x, center.y - r + 1, 1, 1);
    ctx.fillRect(center.x + r - 1, center.y, 1, 1);
    ctx.fillRect(center.x, center.y + r - 1, 1, 1);
    ctx.fillRect(center.x - r + 1, center.y, 1, 1);
    // hands
    const h = window.TIME?.getHour?.() || 7;
    const hourAng = ((h % 12) / 12) * Math.PI * 2 - Math.PI / 2;
    const minAng  = ((h % 1) * 60 / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = P.ink;
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x + Math.cos(hourAng) * 2, center.y + Math.sin(hourAng) * 2);
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x + Math.cos(minAng) * 3, center.y + Math.sin(minAng) * 3);
    ctx.stroke();
    ctx.fillStyle = P.roseDeep;
    ctx.fillRect(center.x, center.y, 1, 1);
  }

  function drawHangingPlant(ctx, tx, z) {
    const top = iso(tx, 0, z);
    // hanging cord
    ctx.strokeStyle = P.warmGray;
    ctx.beginPath();
    ctx.moveTo(top.x - 2, top.y);
    ctx.lineTo(top.x - 2, iso(tx, 0, z - 0.6).y);
    ctx.moveTo(top.x + 3, top.y);
    ctx.lineTo(top.x + 3, iso(tx, 0, z - 0.6).y);
    ctx.stroke();
    // pot
    const pot = iso(tx, 0, z - 0.7);
    fillRect(ctx, pot.x - 3, pot.y, 7, 4, P.plantPot);
    fillRect(ctx, pot.x - 3, pot.y, 7, 1, P.amber);
    // trailing vines
    const baseY = pot.y + 4;
    ctx.fillStyle = P.plantLeaf;
    for (let i = 0; i < 5; i++) {
      const xo = -3 + i * 1.5;
      const len = 4 + (i % 3) * 2;
      for (let v = 0; v < len; v++) {
        ctx.fillRect(pot.x + xo + Math.sin(v * 0.5) * 1, baseY + v, 1, 1);
      }
      // leaf nubs
      ctx.fillStyle = P.plantLeaf2;
      ctx.fillRect(pot.x + xo - 1, baseY + Math.floor(len / 2), 2, 1);
      ctx.fillStyle = P.plantLeaf;
    }
    // leaves on top of pot
    fillRect(ctx, pot.x - 4, pot.y - 2, 2, 3, P.sageDeep);
    fillRect(ctx, pot.x - 1, pot.y - 4, 3, 4, P.plantLeaf2);
    fillRect(ctx, pot.x + 2, pot.y - 2, 2, 3, P.plantLeaf);
  }

  function drawWallShelf(ctx, tx, z) {
    // floating shelf on back wall with little objects
    const w = 0.85;
    const a = iso(tx, 0, z);
    const b = iso(tx + w, 0, z);
    const c = iso(tx + w, 0, z + 0.07);
    const d = iso(tx, 0, z + 0.07);
    poly(ctx, [a, b, c, d], P.deskWood, P.shadow);
    // tiny items
    const top = c.y;
    const baseX = a.x;
    // book
    fillRect(ctx, baseX + 2, top - 4, 3, 4, P.bookA);
    fillRect(ctx, baseX + 2, top - 4, 1, 4, P.bookB);
    // candle
    fillRect(ctx, baseX + 7, top - 5, 2, 5, P.cream);
    fillRect(ctx, baseX + 7, top - 5, 2, 1, P.amber);
    // mini plant
    fillRect(ctx, baseX + 12, top - 3, 3, 3, P.plantPot);
    fillRect(ctx, baseX + 13, top - 5, 1, 2, P.plantLeaf);
    fillRect(ctx, baseX + 14, top - 6, 1, 3, P.sageDeep);
    // ribbon ball
    fillRect(ctx, baseX + 18, top - 3, 3, 3, P.rose);
    fillRect(ctx, baseX + 18, top - 3, 3, 1, P.roseDeep);
  }

  function drawCelloOnWall(ctx) {
    // a cello / standing instrument leaning against back wall
    const tx = 1.2;
    const baseY = iso(tx, 0, 0.55).y;
    const topY  = iso(tx, 0, 2.4).y;
    const cx = iso(tx, 0, 0.55).x;
    // body (large oval shape)
    ctx.fillStyle = P.deskWood2;
    ctx.fillRect(cx - 4, topY + 8, 9, 22);
    ctx.fillStyle = P.deskWood;
    ctx.fillRect(cx - 3, topY + 8, 7, 22);
    ctx.fillStyle = P.amberDeep;
    ctx.fillRect(cx - 4, topY + 28, 9, 4);
    // neck
    ctx.fillStyle = P.deskWood2;
    ctx.fillRect(cx - 1, topY, 3, 9);
    // head
    ctx.fillStyle = P.shadow;
    ctx.fillRect(cx - 2, topY - 2, 4, 3);
    // strings
    ctx.fillStyle = P.amber;
    ctx.fillRect(cx - 1, topY, 1, 26);
    ctx.fillRect(cx + 1, topY, 1, 26);
    // f-holes
    ctx.fillStyle = P.shadow;
    ctx.fillRect(cx - 3, topY + 14, 1, 3);
    ctx.fillRect(cx + 3, topY + 14, 1, 3);
  }

  function drawLeftWallFrames(ctx) {
    // small frame on left wall above bed
    const ty = 1.3, z = 2.2, w = 0.5, h = 0.5;
    const a = iso(0, ty, z);
    const b = iso(0, ty + w, z);
    const c = iso(0, ty + w, z + h);
    const d = iso(0, ty, z + h);
    poly(ctx, [a, b, c, d], P.deskWood2);
    const pad = 0.06;
    const ia = iso(0, ty + pad, z + pad);
    const ib = iso(0, ty + w - pad, z + pad);
    const ic = iso(0, ty + w - pad, z + h - pad);
    const id = iso(0, ty + pad, z + h - pad);
    poly(ctx, [ia, ib, ic, id], P.cream);
    // little heart
    const cx = (ia.x + ib.x) / 2;
    const cy = (ia.y + id.y) / 2;
    ctx.fillStyle = P.roseDeep;
    ctx.fillRect(cx - 2, cy - 1, 1, 1);
    ctx.fillRect(cx, cy - 1, 1, 1);
    ctx.fillRect(cx - 2, cy, 3, 1);
    ctx.fillRect(cx - 1, cy + 1, 1, 1);
  }

  function drawStringLights(ctx, hour) {
    const z = 3.6;
    const segs = 14;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const tx = t * ROOM_W;
      const sag = Math.sin(t * Math.PI) * 0.18;
      pts.push(iso(tx, 0, z - sag));
    }
    ctx.strokeStyle = P.warmGray;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    const colors = [P.amber, P.peach, P.rose];
    const lit = hour >= 18 || hour < 7;
    for (let i = 1; i < pts.length; i += 2) {
      const p = pts[i];
      const c = colors[Math.floor(i / 2) % 3];
      ctx.fillStyle = c;
      ctx.fillRect(p.x - 1, p.y, 2, 2);
      if (lit) {
        ctx.fillStyle = `rgba(255, 220, 160, 0.35)`;
        ctx.fillRect(p.x - 2, p.y - 1, 4, 4);
      }
    }
  }

  // ─── FURNITURE ─────────────────────────────────────────────
  function drawBookshelf(ctx) {
    const tx = 0.15, ty = 0.0, w = 0.95, d = 0.45, h = 2.3;
    isoBox(ctx, tx, ty, w, d, h, {
      top: P.deskWood, front: P.deskWood, right: P.deskWood2, outline: P.ink,
    });
    // shelves drawn on front face
    const cols = [P.bookA, P.bookB, P.bookC, P.bookD, P.bookB, P.bookC, P.bookA, P.bookD];
    for (let s = 0; s < 4; s++) {
      const z = 0.22 + s * 0.5;
      // shelf board line
      const sa = iso(tx, ty + d, z);
      const sb = iso(tx + w, ty + d, z);
      ctx.strokeStyle = P.shadow;
      ctx.beginPath();
      ctx.moveTo(sa.x + 0.5, sa.y);
      ctx.lineTo(sb.x + 0.5, sb.y);
      ctx.stroke();
      // 6 books per shelf — varied widths/heights
      const widths = [0.13, 0.16, 0.12, 0.17, 0.14, 0.15];
      let cur = 0.04;
      for (let i = 0; i < 6 && cur + 0.13 < w; i++) {
        const bw = widths[i % widths.length];
        const bh = 0.32 + (i % 3) * 0.05;
        const c = cols[(s * 6 + i) % cols.length];
        const ba = iso(tx + cur, ty + d, z + 0.05);
        const bb = iso(tx + cur + bw, ty + d, z + 0.05);
        const bc = iso(tx + cur + bw, ty + d, z + 0.05 + bh);
        const bd = iso(tx + cur, ty + d, z + 0.05 + bh);
        poly(ctx, [ba, bb, bc, bd], c);
        // page edge
        const ha = iso(tx + cur + 0.005, ty + d, z + 0.05);
        const hb = iso(tx + cur + 0.04, ty + d, z + 0.05);
        const hc = iso(tx + cur + 0.04, ty + d, z + 0.05 + bh);
        const hd = iso(tx + cur + 0.005, ty + d, z + 0.05 + bh);
        poly(ctx, [ha, hb, hc, hd], lighten(c, 0.28));
        // title stripe
        const tlbk = iso(tx + cur + 0.01, ty + d, z + 0.05 + bh * 0.3);
        const tlbk2 = iso(tx + cur + bw - 0.01, ty + d, z + 0.05 + bh * 0.3);
        ctx.strokeStyle = lighten(c, 0.5);
        ctx.beginPath();
        ctx.moveTo(tlbk.x, tlbk.y);
        ctx.lineTo(tlbk2.x, tlbk2.y);
        ctx.stroke();
        cur += bw + 0.005;
      }
      // accent item at end of shelf (alternates: plant, photo, stack)
      if (s === 0) {
        // tiny photo frame
        const p = iso(tx + cur + 0.02, ty + d, z + 0.08);
        fillRect(ctx, p.x, p.y - 5, 5, 5, P.deskWood);
        fillRect(ctx, p.x + 1, p.y - 4, 3, 3, P.cream);
      } else if (s === 2) {
        // mini plant
        const p = iso(tx + cur + 0.02, ty + d, z + 0.05);
        fillRect(ctx, p.x, p.y - 3, 3, 3, P.plantPot);
        fillRect(ctx, p.x, p.y - 5, 1, 2, P.plantLeaf);
        fillRect(ctx, p.x + 1, p.y - 6, 1, 3, P.plantLeaf2);
        fillRect(ctx, p.x + 2, p.y - 5, 1, 2, P.sageDeep);
      } else {
        // stacked book sideways
        const p = iso(tx + cur + 0.02, ty + d, z + 0.05);
        fillRect(ctx, p.x, p.y - 3, 4, 1, P.bookB);
        fillRect(ctx, p.x, p.y - 4, 4, 1, P.bookC);
      }
    }
    // top decoration: a small cactus or trinket
    const top = iso(tx + w * 0.4, ty + d * 0.5, h);
    fillRect(ctx, top.x - 1, top.y - 4, 3, 4, P.plantPot);
    fillRect(ctx, top.x, top.y - 8, 2, 4, P.plantLeaf);
    fillRect(ctx, top.x, top.y - 9, 1, 1, P.rose);
  }

  function drawDesk(ctx) {
    const tx = 2.4, ty = 0.0, w = 1.7, d = 0.85, h = 0.7;
    isoBox(ctx, tx, ty, w, d, h, {
      top: P.deskWood, front: P.deskWood2, right: P.deskWood2, outline: P.ink,
    });
    // drawer detail on front
    const drawerY1 = h * 0.2, drawerY2 = h * 0.6;
    const da = iso(tx + 1.3, ty + d, drawerY1);
    const db = iso(tx + 1.6, ty + d, drawerY1);
    const dc = iso(tx + 1.6, ty + d, drawerY2);
    const dd = iso(tx + 1.3, ty + d, drawerY2);
    poly(ctx, [da, db, dc, dd], P.deskWood, P.shadow);
    fillRect(ctx, (da.x + db.x) / 2 - 1, (da.y + dc.y) / 2, 2, 1, P.amber);
    // monitor (chunkier)
    const mx = tx + 0.55, my = ty + 0.18, mw = 0.75, md = 0.1, mh = 0.6;
    isoBox(ctx, mx, my, mw, md, mh, {
      top: P.shadow, front: '#161220', right: '#0a0612', outline: P.ink,
    });
    // screen
    const sa = iso(mx + 0.05, my + md, h + 0.08);
    const sb = iso(mx + mw - 0.05, my + md, h + 0.08);
    const sc = iso(mx + mw - 0.05, my + md, h + mh - 0.04);
    const sd = iso(mx + 0.05, my + md, h + mh - 0.04);
    poly(ctx, [sa, sb, sc, sd], P.skyDay);
    // screen content (window of code-like blocks)
    ctx.fillStyle = P.amber;
    ctx.fillRect(sa.x + 1, sd.y + 1, 5, 1);
    ctx.fillRect(sa.x + 1, sd.y + 3, 7, 1);
    ctx.fillRect(sa.x + 3, sd.y + 5, 4, 1);
    ctx.fillStyle = P.rose;
    ctx.fillRect(sa.x + 1, sd.y + 7, 3, 1);
    // cursor blink
    const blink = (Math.floor((window.gameTime?.totalGameSeconds || 0) * 2)) % 2;
    if (blink) {
      ctx.fillStyle = P.cream;
      ctx.fillRect(sa.x + 5, sd.y + 7, 1, 1);
    }
    // monitor stand
    const stand_a = iso(mx + 0.32, my + 0.04, h);
    fillRect(ctx, stand_a.x, stand_a.y - 4, 2, 4, P.shadow);
    fillRect(ctx, stand_a.x - 1, stand_a.y, 4, 1, P.shadow);

    // pen jar with pens
    const pj = iso(tx + 0.18, ty + 0.22, h);
    fillRect(ctx, pj.x - 1, pj.y - 4, 4, 4, P.amberDeep);
    fillRect(ctx, pj.x - 1, pj.y - 4, 4, 1, P.amber);
    fillRect(ctx, pj.x, pj.y - 7, 1, 3, P.bookB);
    fillRect(ctx, pj.x + 1, pj.y - 8, 1, 4, P.sage);
    fillRect(ctx, pj.x + 2, pj.y - 6, 1, 2, P.amberDeep);
    // notebook with pen
    const nb_a = iso(tx + 1.32, ty + 0.42, h);
    const nb_b = iso(tx + 1.62, ty + 0.42, h);
    const nb_c = iso(tx + 1.62, ty + 0.72, h);
    const nb_d = iso(tx + 1.32, ty + 0.72, h);
    poly(ctx, [nb_a, nb_b, nb_c, nb_d], P.bookA);
    // notebook lines
    ctx.strokeStyle = lighten(P.bookA, 0.2);
    ctx.beginPath();
    const ml1a = iso(tx + 1.36, ty + 0.5, h + 0.001);
    const ml1b = iso(tx + 1.58, ty + 0.5, h + 0.001);
    ctx.moveTo(ml1a.x, ml1a.y); ctx.lineTo(ml1b.x, ml1b.y);
    ctx.stroke();
    // pen on notebook
    const pen_a = iso(tx + 1.4, ty + 0.55, h);
    fillRect(ctx, pen_a.x, pen_a.y - 1, 5, 1, P.roseDeep);
    fillRect(ctx, pen_a.x + 5, pen_a.y - 1, 1, 1, P.amber);
    // small photo frame
    const ph = iso(tx + 1.18, ty + 0.18, h);
    fillRect(ctx, ph.x - 2, ph.y - 7, 5, 5, P.deskWood);
    fillRect(ctx, ph.x - 1, ph.y - 6, 3, 3, P.peach);
    fillRect(ctx, ph.x, ph.y - 5, 1, 1, P.roseDeep);
    // mug + steam
    const mug = iso(tx + 0.4, ty + 0.55, h);
    fillRect(ctx, mug.x - 1, mug.y - 4, 4, 4, P.rose);
    fillRect(ctx, mug.x + 3, mug.y - 3, 1, 2, P.rose);
    fillRect(ctx, mug.x - 1, mug.y - 4, 4, 1, P.cream);
    fillRect(ctx, mug.x, mug.y - 3, 2, 2, P.creamSoft);
    const t = (window.gameTime?.totalGameSeconds || 0) * 2;
    ctx.fillStyle = 'rgba(255, 248, 236, 0.55)';
    ctx.fillRect(Math.floor(mug.x + Math.sin(t) * 1), mug.y - 7, 1, 1);
    ctx.fillRect(Math.floor(mug.x + 1 + Math.sin(t + 0.6) * 1), mug.y - 9, 1, 1);
    // desk lamp (taller, with visible bulb)
    const lamp = iso(tx + w - 0.18, ty + 0.18, h);
    fillRect(ctx, lamp.x, lamp.y - 8, 1, 8, P.amberDeep);
    fillRect(ctx, lamp.x - 3, lamp.y - 11, 7, 4, P.amber);
    fillRect(ctx, lamp.x - 2, lamp.y - 12, 5, 1, P.amber);
    fillRect(ctx, lamp.x - 1, lamp.y - 10, 3, 2, P.creamSoft);
    fillRect(ctx, lamp.x - 4, lamp.y, 7, 1, P.amberDeep);
    // tiny stack of books beside lamp
    const sb_a = iso(tx + 1.55, ty + 0.18, h);
    fillRect(ctx, sb_a.x - 3, sb_a.y - 1, 5, 1, P.bookB);
    fillRect(ctx, sb_a.x - 3, sb_a.y - 3, 5, 1, P.bookC);
    fillRect(ctx, sb_a.x - 3, sb_a.y - 5, 5, 1, P.bookA);
  }

  function drawChair(ctx) {
    const tx = 3.45, ty = 1.05, w = 0.55, d = 0.55;
    const base = iso(tx + w / 2, ty + d / 2, 0);
    fillRect(ctx, base.x - 5, base.y, 10, 2, P.shadow);
    fillRect(ctx, base.x - 1, base.y - 6, 2, 7, P.shadow);
    isoBox(ctx, tx, ty, w, d, 0.4, {
      top: P.cloth, front: P.clothShadow, right: P.clothShadow, outline: P.ink,
    });
    // back rest taller with cushion shape
    isoBox(ctx, tx, ty, w, 0.1, 1.1, {
      top: P.cloth, front: P.cloth, right: P.clothShadow, outline: P.ink,
    });
    // seat cushion line
    const sc1 = iso(tx + 0.05, ty + d - 0.05, 0.41);
    const sc2 = iso(tx + w - 0.05, ty + d - 0.05, 0.41);
    ctx.strokeStyle = P.shadow;
    ctx.beginPath();
    ctx.moveTo(sc1.x, sc1.y);
    ctx.lineTo(sc2.x, sc2.y);
    ctx.stroke();
  }

  function drawBed(ctx) {
    const tx = 0.2, ty = 2.0, w = 1.4, d = 1.9, h = 0.45;
    // frame
    isoBox(ctx, tx, ty, w, d, h, {
      top: P.cream, front: P.deskWood, right: P.deskWood2, outline: P.ink,
    });
    // headboard
    isoBox(ctx, tx, ty - 0.1, w, 0.1, 1.0, {
      top: P.deskWood, front: P.deskWood2, right: P.deskWood2, outline: P.ink,
    });
    // headboard panel detail
    const hb_a = iso(tx + 0.15, ty - 0.1, 0.2);
    const hb_b = iso(tx + w - 0.15, ty - 0.1, 0.2);
    const hb_c = iso(tx + w - 0.15, ty - 0.1, 0.85);
    const hb_d = iso(tx + 0.15, ty - 0.1, 0.85);
    poly(ctx, [hb_a, hb_b, hb_c, hb_d], P.deskWood, P.shadow);
    // mattress
    const mx = tx + 0.05, my = ty + 0.05, mw = w - 0.1, md = d - 0.1, mh = 0.16;
    isoBox(ctx, mx, my, mw, md, mh, {
      top: P.cream, front: P.creamSoft, right: P.creamSoft, outline: P.ink,
    });
    const bz = h + mh;
    // blanket lower 65%
    poly(ctx, [
      iso(mx + 0.03, my + 0.55, bz),
      iso(mx + mw - 0.03, my + 0.55, bz),
      iso(mx + mw - 0.03, my + md - 0.03, bz),
      iso(mx + 0.03, my + md - 0.03, bz),
    ], P.blanket);
    // blanket pattern stripes
    ctx.strokeStyle = P.blanket2;
    for (let i = 0; i < 3; i++) {
      const yo = 0.62 + i * 0.18;
      const a = iso(mx + 0.03, my + yo, bz + 0.002);
      const b = iso(mx + mw - 0.03, my + yo, bz + 0.002);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    // blanket front edge fold
    poly(ctx, [
      iso(mx + 0.03, my + md - 0.03, bz),
      iso(mx + mw - 0.03, my + md - 0.03, bz),
      iso(mx + mw - 0.03, my + md - 0.03, bz - 0.1),
      iso(mx + 0.03, my + md - 0.03, bz - 0.1),
    ], P.blanket2);
    // big pillow
    poly(ctx, [
      iso(mx + 0.08, my + 0.04, bz),
      iso(mx + mw - 0.08, my + 0.04, bz),
      iso(mx + mw - 0.08, my + 0.42, bz),
      iso(mx + 0.08, my + 0.42, bz),
    ], P.pillow);
    // accent pillow on top
    poly(ctx, [
      iso(mx + 0.18, my + 0.1, bz + 0.005),
      iso(mx + mw - 0.18, my + 0.1, bz + 0.005),
      iso(mx + mw - 0.18, my + 0.32, bz + 0.005),
      iso(mx + 0.18, my + 0.32, bz + 0.005),
    ], P.rose);
    // pillow seam
    ctx.strokeStyle = P.shadow;
    const psa = iso(mx + 0.12, my + 0.08, bz + 0.003);
    const psb = iso(mx + mw - 0.12, my + 0.08, bz + 0.003);
    ctx.beginPath();
    ctx.moveTo(psa.x, psa.y);
    ctx.lineTo(psb.x, psb.y);
    ctx.stroke();
    // tiny stuffed bear at head
    const bear = iso(mx + mw - 0.25, my + 0.15, bz + 0.005);
    fillRect(ctx, bear.x, bear.y - 5, 4, 4, P.amberDeep);
    fillRect(ctx, bear.x, bear.y - 7, 2, 2, P.amberDeep);
    fillRect(ctx, bear.x + 2, bear.y - 7, 2, 2, P.amberDeep);
    fillRect(ctx, bear.x + 1, bear.y - 4, 1, 1, P.ink);
    fillRect(ctx, bear.x + 2, bear.y - 4, 1, 1, P.ink);
    // heart on blanket
    const heart = iso(mx + mw - 0.4, my + md - 0.4, bz + 0.01);
    ctx.fillStyle = P.roseDeep;
    ctx.fillRect(heart.x - 2, heart.y, 1, 1);
    ctx.fillRect(heart.x, heart.y, 1, 1);
    ctx.fillRect(heart.x - 1, heart.y + 1, 1, 1);
    // slippers next to bed (in front)
    drawSlippers(ctx, tx + w + 0.05, ty + d - 0.4);
  }

  function drawSlippers(ctx, tx, ty) {
    const a = iso(tx, ty, 0.005);
    fillRect(ctx, a.x - 2, a.y, 5, 3, P.rose);
    fillRect(ctx, a.x - 2, a.y, 5, 1, P.roseDeep);
    fillRect(ctx, a.x + 3, a.y + 2, 5, 3, P.rose);
    fillRect(ctx, a.x + 3, a.y + 2, 5, 1, P.roseDeep);
    // soft pom-poms
    fillRect(ctx, a.x, a.y + 1, 1, 1, P.cream);
    fillRect(ctx, a.x + 5, a.y + 3, 1, 1, P.cream);
  }

  function drawNightstand(ctx) {
    const tx = 1.5, ty = 2.4, w = 0.45, d = 0.5, h = 0.55;
    isoBox(ctx, tx, ty, w, d, h, {
      top: P.deskWood, front: P.deskWood2, right: P.deskWood2, outline: P.ink,
    });
    // drawer line
    const da = iso(tx + 0.05, ty + d, h * 0.5);
    const db = iso(tx + w - 0.05, ty + d, h * 0.5);
    ctx.strokeStyle = P.shadow;
    ctx.beginPath();
    ctx.moveTo(da.x, da.y);
    ctx.lineTo(db.x, db.y);
    ctx.stroke();
    // knob
    const kn = iso((tx + tx + w) / 2, ty + d, h * 0.65);
    fillRect(ctx, kn.x, kn.y, 1, 1, P.amber);
    // small lamp on top
    const top = iso(tx + 0.18, ty + 0.3, h);
    fillRect(ctx, top.x - 1, top.y - 4, 3, 4, P.cream);
    fillRect(ctx, top.x - 2, top.y - 8, 5, 4, P.amber);
    fillRect(ctx, top.x - 1, top.y - 9, 3, 1, P.amber);
    fillRect(ctx, top.x, top.y - 7, 1, 2, P.creamSoft);
    // alarm clock
    const ac = iso(tx + 0.32, ty + 0.18, h);
    fillRect(ctx, ac.x, ac.y - 4, 4, 4, P.bookB);
    fillRect(ctx, ac.x + 1, ac.y - 3, 2, 2, P.cream);
    fillRect(ctx, ac.x + 1, ac.y - 3, 1, 1, P.ink);
  }

  function drawSofa(ctx) {
    const tx = 1.9, ty = 4.0, w = 2.2, d = 0.95, h = 0.35;
    isoBox(ctx, tx, ty, w, d, h, {
      top: P.cloth, front: P.clothShadow, right: P.clothShadow, outline: P.ink,
    });
    // back rest
    isoBox(ctx, tx, ty, w, 0.22, h + 0.55, {
      top: P.cloth, front: P.cloth, right: P.clothShadow, outline: P.ink,
    });
    // arm rests
    isoBox(ctx, tx, ty, 0.2, d, h + 0.22, {
      top: P.cloth, front: P.clothShadow, right: P.clothShadow, outline: P.ink,
    });
    isoBox(ctx, tx + w - 0.2, ty, 0.2, d, h + 0.22, {
      top: P.cloth, front: P.clothShadow, right: P.clothShadow, outline: P.ink,
    });
    // seam dividers
    ctx.strokeStyle = P.shadow;
    const s1a = iso(tx + 0.2 + (w - 0.4) / 3, ty + 0.25, h);
    const s1b = iso(tx + 0.2 + (w - 0.4) / 3, ty + d - 0.05, h);
    const s2a = iso(tx + 0.2 + 2 * (w - 0.4) / 3, ty + 0.25, h);
    const s2b = iso(tx + 0.2 + 2 * (w - 0.4) / 3, ty + d - 0.05, h);
    ctx.beginPath();
    ctx.moveTo(s1a.x, s1a.y); ctx.lineTo(s1b.x, s1b.y);
    ctx.moveTo(s2a.x, s2a.y); ctx.lineTo(s2b.x, s2b.y);
    ctx.stroke();
    // throw pillow 1 (rose)
    isoBox(ctx, tx + 0.3, ty + 0.3, 0.32, 0.32, 0.18, {
      top: P.rose, front: P.roseDeep, right: P.roseDeep, outline: P.ink,
    });
    // throw pillow 2 (sage)
    isoBox(ctx, tx + w - 0.62, ty + 0.32, 0.3, 0.3, 0.16, {
      top: P.sage, front: P.sageDeep, right: P.sageDeep, outline: P.ink,
    });
    // blanket draped over right arm
    poly(ctx, [
      iso(tx + w - 0.25, ty + 0.05, h + 0.22),
      iso(tx + w + 0.05, ty + 0.05, h + 0.22),
      iso(tx + w + 0.05, ty + 0.7, h + 0.22),
      iso(tx + w - 0.25, ty + 0.7, h + 0.22),
    ], P.amber);
    poly(ctx, [
      iso(tx + w + 0.05, ty + 0.05, h + 0.22),
      iso(tx + w + 0.05, ty + 0.7, h + 0.22),
      iso(tx + w + 0.05, ty + 0.7, h - 0.05),
      iso(tx + w + 0.05, ty + 0.05, h - 0.05),
    ], P.amberDeep);
    // blanket fringe
    ctx.fillStyle = P.amber;
    const fra = iso(tx + w + 0.05, ty + 0.05, h - 0.05);
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(fra.x, fra.y + i * 1.5, 1, 1);
    }
    // sleeping cat on left cushion
    drawSleepingCat(ctx, tx + 0.5, ty + 0.45, h);
  }

  function drawSleepingCat(ctx, tx, ty, baseZ) {
    const c = iso(tx, ty, baseZ);
    // body curl
    ctx.fillStyle = P.amberDeep;
    ctx.fillRect(c.x - 5, c.y - 4, 10, 5);
    ctx.fillRect(c.x - 4, c.y - 5, 8, 1);
    ctx.fillRect(c.x - 5, c.y, 9, 1);
    // stripes
    ctx.fillStyle = P.shadow;
    ctx.fillRect(c.x - 3, c.y - 4, 1, 4);
    ctx.fillRect(c.x, c.y - 4, 1, 4);
    ctx.fillRect(c.x + 2, c.y - 4, 1, 4);
    // head tucked
    ctx.fillStyle = P.amberDeep;
    ctx.fillRect(c.x + 3, c.y - 6, 4, 4);
    ctx.fillRect(c.x + 3, c.y - 7, 1, 1); // ear
    ctx.fillRect(c.x + 5, c.y - 7, 1, 1); // ear
    // closed eye
    ctx.fillStyle = P.shadow;
    ctx.fillRect(c.x + 4, c.y - 4, 1, 1);
    // tail
    ctx.fillStyle = P.amberDeep;
    ctx.fillRect(c.x - 6, c.y - 2, 1, 1);
    ctx.fillRect(c.x - 7, c.y - 3, 1, 1);
    ctx.fillRect(c.x - 7, c.y - 5, 1, 2);
  }

  function drawCoffeeTable(ctx) {
    const tx = 2.6, ty = 3.4, w = 1.0, d = 0.55, h = 0.28;
    isoBox(ctx, tx, ty, w, d, h, {
      top: P.deskWood, front: P.deskWood2, right: P.deskWood2, outline: P.ink,
    });
    // book lying open
    poly(ctx, [
      iso(tx + 0.1, ty + 0.1, h),
      iso(tx + 0.5, ty + 0.1, h),
      iso(tx + 0.5, ty + 0.4, h),
      iso(tx + 0.1, ty + 0.4, h),
    ], P.bookA);
    // book pages
    ctx.strokeStyle = lighten(P.bookA, 0.5);
    const pa = iso(tx + 0.3, ty + 0.1, h + 0.001);
    const pb = iso(tx + 0.3, ty + 0.4, h + 0.001);
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    const lna = iso(tx + 0.15, ty + 0.18, h + 0.001);
    const lnb = iso(tx + 0.45, ty + 0.18, h + 0.001);
    ctx.beginPath();
    ctx.moveTo(lna.x, lna.y); ctx.lineTo(lnb.x, lnb.y); ctx.stroke();
    const lna2 = iso(tx + 0.15, ty + 0.25, h + 0.001);
    const lnb2 = iso(tx + 0.45, ty + 0.25, h + 0.001);
    ctx.beginPath();
    ctx.moveTo(lna2.x, lna2.y); ctx.lineTo(lnb2.x, lnb2.y); ctx.stroke();
    // tea cup with saucer
    const cup = iso(tx + 0.7, ty + 0.18, h);
    fillRect(ctx, cup.x - 3, cup.y - 1, 6, 2, P.cream);
    fillRect(ctx, cup.x - 2, cup.y - 4, 4, 4, P.cream);
    fillRect(ctx, cup.x - 2, cup.y - 4, 4, 1, P.peach);
    fillRect(ctx, cup.x + 2, cup.y - 3, 1, 2, P.cream);
    // candle in jar
    const cnd = iso(tx + 0.85, ty + 0.4, h);
    fillRect(ctx, cnd.x - 1, cnd.y - 4, 3, 4, P.creamSoft);
    fillRect(ctx, cnd.x - 1, cnd.y - 4, 3, 1, P.amber);
    // flame flicker
    if ((Math.floor((window.gameTime?.totalGameSeconds || 0) * 4)) % 2) {
      fillRect(ctx, cnd.x, cnd.y - 6, 1, 2, P.amber);
    } else {
      fillRect(ctx, cnd.x, cnd.y - 6, 1, 1, P.peach);
    }
  }

  function drawPlant(ctx) {
    const tx = 6.0, ty = 4.1, w = 0.5, d = 0.45;
    // pot with rim
    isoBox(ctx, tx, ty, w, d, 0.5, {
      top: P.shadow, front: P.plantPot, right: P.amberDeep, outline: P.ink,
    });
    // pot rim accent
    poly(ctx, [
      iso(tx, ty, 0.5),
      iso(tx + w, ty, 0.5),
      iso(tx + w, ty + d, 0.5),
      iso(tx, ty + d, 0.5),
    ], null, P.shadow);
    // soil
    poly(ctx, [
      iso(tx + 0.04, ty + 0.04, 0.5),
      iso(tx + w - 0.04, ty + 0.04, 0.5),
      iso(tx + w - 0.04, ty + d - 0.04, 0.5),
      iso(tx + 0.04, ty + d - 0.04, 0.5),
    ], '#3a2a1e');
    // leaves cluster — fuller
    const center = iso(tx + w / 2, ty + d / 2, 0.5);
    const leaves = [
      [-4, -10, 5, 8, P.plantLeaf],
      [-1, -14, 4, 9, P.plantLeaf2],
      [-7, -7, 5, 7, P.sageDeep],
      [3, -8, 5, 8, P.plantLeaf2],
      [-2, -16, 3, 5, P.plantLeaf],
      [-8, -4, 4, 6, P.plantLeaf],
      [4, -3, 5, 5, P.sageDeep],
      [1, -18, 2, 4, P.plantLeaf2],
      [-5, -13, 3, 5, P.sageDeep],
    ];
    for (const [dx, dy, lw, lh, c] of leaves) {
      ctx.fillStyle = c;
      ctx.fillRect(center.x + dx, center.y + dy, lw, lh);
      ctx.fillStyle = lighten(c, 0.22);
      ctx.fillRect(center.x + dx, center.y + dy, lw, 1);
      // mid-leaf vein
      ctx.fillStyle = lighten(c, 0.1);
      ctx.fillRect(center.x + dx + Math.floor(lw / 2), center.y + dy, 1, lh);
    }
  }

  function drawFloorLamp(ctx) {
    // tall lamp in front-right corner
    const tx = 6.4, ty = 3.0;
    const baseY = iso(tx, ty, 0).y;
    const cx = iso(tx, ty, 0).x;
    // base
    fillRect(ctx, cx - 4, baseY - 1, 9, 2, P.shadow);
    fillRect(ctx, cx - 3, baseY - 2, 7, 1, P.deskWood2);
    // pole
    fillRect(ctx, cx, baseY - 30, 1, 28, P.deskWood2);
    // cord drape
    ctx.strokeStyle = P.warmGray;
    ctx.beginPath();
    ctx.moveTo(cx + 1, baseY - 14);
    ctx.bezierCurveTo(cx + 4, baseY - 8, cx + 3, baseY - 4, cx + 2, baseY);
    ctx.stroke();
    // shade
    ctx.fillStyle = P.amber;
    ctx.beginPath();
    ctx.moveTo(cx - 5, baseY - 30);
    ctx.lineTo(cx + 6, baseY - 30);
    ctx.lineTo(cx + 4, baseY - 38);
    ctx.lineTo(cx - 3, baseY - 38);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.amberDeep;
    fillRect(ctx, cx - 5, baseY - 30, 12, 1, P.amberDeep);
    // shade highlight
    ctx.fillStyle = P.peach;
    ctx.fillRect(cx - 2, baseY - 36, 1, 5);
    ctx.fillRect(cx - 1, baseY - 37, 1, 6);
    // warm halo (only at night)
    const hour = window.TIME?.getHourInt?.() || 12;
    if (hour >= 18 || hour < 7) {
      const grd = ctx.createRadialGradient(cx, baseY - 33, 2, cx, baseY - 33, 28);
      grd.addColorStop(0, 'rgba(255, 220, 160, 0.45)');
      grd.addColorStop(1, 'rgba(255, 220, 160, 0)');
      ctx.fillStyle = grd;
      ctx.fillRect(cx - 28, baseY - 60, 56, 56);
    }
  }

  function drawKitchen(ctx) {
    const tx = 5.6, ty = 0.0, w = 1.3, d = 0.7, h = 0.7;
    // base cabinet
    isoBox(ctx, tx, ty, w, d, h, {
      top: P.cream, front: P.cream, right: P.creamSoft, outline: P.ink,
    });
    // cabinet doors detail
    const doorY = h * 0.3;
    const da = iso(tx + 0.05, ty + d, doorY);
    const db = iso(tx + w / 2 - 0.04, ty + d, doorY);
    const dc = iso(tx + w / 2 - 0.04, ty + d, h - 0.05);
    const dd2 = iso(tx + 0.05, ty + d, h - 0.05);
    poly(ctx, [da, db, dc, dd2], P.creamSoft, P.shadow);
    const ea = iso(tx + w / 2 + 0.04, ty + d, doorY);
    const eb = iso(tx + w - 0.05, ty + d, doorY);
    const ec = iso(tx + w - 0.05, ty + d, h - 0.05);
    const ed = iso(tx + w / 2 + 0.04, ty + d, h - 0.05);
    poly(ctx, [ea, eb, ec, ed], P.creamSoft, P.shadow);
    // knobs
    const k1 = iso(tx + w / 2 - 0.08, ty + d, doorY + 0.1);
    const k2 = iso(tx + w / 2 + 0.08, ty + d, doorY + 0.1);
    fillRect(ctx, k1.x, k1.y, 1, 1, P.amber);
    fillRect(ctx, k2.x, k2.y, 1, 1, P.amber);
    // counter trim
    ctx.strokeStyle = P.deskWood2;
    const cea = iso(tx, ty + d, h);
    const ceb = iso(tx + w, ty + d, h);
    ctx.beginPath();
    ctx.moveTo(cea.x, cea.y + 0.5);
    ctx.lineTo(ceb.x, ceb.y + 0.5);
    ctx.stroke();
    // stove circles
    const stoveA = iso(tx + 0.25, ty + 0.32, h);
    fillRect(ctx, stoveA.x - 2, stoveA.y - 1, 5, 2, P.shadow);
    fillRect(ctx, stoveA.x + 5, stoveA.y - 1, 5, 2, P.shadow);
    // kettle on stove
    isoBox(ctx, tx + 0.2, ty + 0.28, 0.22, 0.22, 0.28, {
      top: '#5a6c8a', front: '#5a6c8a', right: '#3d4f66', outline: P.ink,
    });
    const spout = iso(tx + 0.42, ty + 0.36, h + 0.18);
    fillRect(ctx, spout.x, spout.y - 2, 2, 1, '#3d4f66');
    // tiny steam from kettle
    const t = (window.gameTime?.totalGameSeconds || 0) * 1.5;
    ctx.fillStyle = 'rgba(255, 248, 236, 0.55)';
    ctx.fillRect(Math.floor(spout.x + 1 + Math.sin(t) * 1), spout.y - 5, 1, 1);
    ctx.fillRect(Math.floor(spout.x + 2 + Math.sin(t + 0.7) * 1), spout.y - 7, 1, 1);
    // cutting board
    const cb = iso(tx + 0.62, ty + 0.4, h);
    fillRect(ctx, cb.x - 2, cb.y - 4, 9, 4, P.deskWood);
    fillRect(ctx, cb.x - 2, cb.y - 4, 9, 1, P.peach);
    // tomato on board
    fillRect(ctx, cb.x, cb.y - 3, 2, 2, P.roseDeep);
    fillRect(ctx, cb.x, cb.y - 4, 1, 1, P.sage);
    // bottle
    const bot = iso(tx + 1.0, ty + 0.3, h);
    fillRect(ctx, bot.x - 1, bot.y - 8, 2, 8, P.sageDeep);
    fillRect(ctx, bot.x - 1, bot.y - 6, 2, 2, P.cream);
    fillRect(ctx, bot.x - 1, bot.y - 8, 2, 1, P.shadow);
    // upper shelf
    const sh_z = 1.7;
    poly(ctx, [
      iso(tx, 0, sh_z),
      iso(tx + w, 0, sh_z),
      iso(tx + w, 0, sh_z + 0.08),
      iso(tx, 0, sh_z + 0.08),
    ], P.deskWood);
    // jars (more, varied)
    const jars = [
      [0.1, P.bookB, 0.32],
      [0.25, P.sage,  0.42],
      [0.42, P.amberDeep, 0.34],
      [0.58, P.cream, 0.32],
      [0.72, P.bookA, 0.4],
      [0.88, P.rose, 0.3],
      [1.04, P.amber, 0.36],
      [1.18, P.sageDeep, 0.32],
    ];
    for (const [fx, c, jh] of jars) {
      const j = iso(tx + fx, 0, sh_z + 0.08);
      fillRect(ctx, j.x - 1, j.y - jh * TH, 3, jh * TH, c);
      fillRect(ctx, j.x - 1, j.y - jh * TH, 3, 1, lighten(c, 0.3));
      // lid
      fillRect(ctx, j.x - 1, j.y - jh * TH - 1, 3, 1, P.shadow);
    }
    // hanging utensils
    const ut_z = 1.5;
    for (let i = 0; i < 4; i++) {
      const u = iso(tx + 0.2 + i * 0.18, 0, ut_z);
      ctx.strokeStyle = P.shadow;
      ctx.beginPath();
      ctx.moveTo(u.x, u.y);
      ctx.lineTo(u.x, u.y + 5);
      ctx.stroke();
      // utensil tip varies
      ctx.fillStyle = i % 2 === 0 ? P.shadow : P.deskWood;
      ctx.fillRect(u.x - 1, u.y + 5, 2, 2);
    }
  }

  function drawRug(ctx) {
    const tx = 2.0, ty = 1.9, w = 3.2, d = 1.9;
    const z = 0.005;
    poly(ctx, [
      iso(tx, ty, z),
      iso(tx + w, ty, z),
      iso(tx + w, ty + d, z),
      iso(tx, ty + d, z),
    ], P.rugA, P.shadow);
    // border ring
    ctx.strokeStyle = lighten(P.rugA, 0.3);
    const ba = iso(tx + 0.15, ty + 0.15, z + 0.001);
    const bb = iso(tx + w - 0.15, ty + 0.15, z + 0.001);
    const bc = iso(tx + w - 0.15, ty + d - 0.15, z + 0.001);
    const bd = iso(tx + 0.15, ty + d - 0.15, z + 0.001);
    ctx.beginPath();
    ctx.moveTo(ba.x, ba.y); ctx.lineTo(bb.x, bb.y);
    ctx.lineTo(bc.x, bc.y); ctx.lineTo(bd.x, bd.y);
    ctx.closePath();
    ctx.stroke();
    // pattern stripes
    ctx.strokeStyle = lerpColor(P.rugA, P.rugB, 0.5);
    for (let i = 1; i < 5; i++) {
      const t = i / 5;
      const a = iso(tx + t * w, ty + 0.2, z + 0.001);
      const b = iso(tx + t * w, ty + d - 0.2, z + 0.001);
      ctx.beginPath();
      ctx.moveTo(a.x + 0.5, a.y);
      ctx.lineTo(b.x + 0.5, b.y);
      ctx.stroke();
    }
    // central diamond
    const cx = tx + w / 2, cy = ty + d / 2;
    poly(ctx, [
      iso(cx - 0.55, cy, z + 0.002),
      iso(cx, cy - 0.42, z + 0.002),
      iso(cx + 0.55, cy, z + 0.002),
      iso(cx, cy + 0.42, z + 0.002),
    ], P.rugB);
    poly(ctx, [
      iso(cx - 0.28, cy, z + 0.003),
      iso(cx, cy - 0.22, z + 0.003),
      iso(cx + 0.28, cy, z + 0.003),
      iso(cx, cy + 0.22, z + 0.003),
    ], P.cream);
    // tiny diamond center
    poly(ctx, [
      iso(cx - 0.1, cy, z + 0.004),
      iso(cx, cy - 0.08, z + 0.004),
      iso(cx + 0.1, cy, z + 0.004),
      iso(cx, cy + 0.08, z + 0.004),
    ], P.rose);
    // tassels
    ctx.fillStyle = P.rugB;
    for (let i = 0; i < 9; i++) {
      const xo = tx + (i / 8) * w;
      const a1 = iso(xo, ty - 0.05, z);
      const a2 = iso(xo, ty + d + 0.05, z);
      ctx.fillRect(a1.x, a1.y, 1, 2);
      ctx.fillRect(a2.x, a2.y, 1, 2);
    }
  }

  function drawDoor(ctx) {
    const ty1 = 4.0, ty2 = 4.85, z1 = 0, z2 = 2.2;
    poly(ctx, [
      iso(0, ty1 - 0.05, z1),
      iso(0, ty2 + 0.05, z1),
      iso(0, ty2 + 0.05, z2 + 0.1),
      iso(0, ty1 - 0.05, z2 + 0.1),
    ], P.deskWood2);
    poly(ctx, [
      iso(0, ty1, z1),
      iso(0, ty2, z1),
      iso(0, ty2, z2),
      iso(0, ty1, z2),
    ], P.amberDeep);
    poly(ctx, [
      iso(0, ty1 + 0.08, z1 + 0.1),
      iso(0, ty2 - 0.08, z1 + 0.1),
      iso(0, ty2 - 0.08, z1 + 0.9),
      iso(0, ty1 + 0.08, z1 + 0.9),
    ], P.deskWood, P.shadow);
    poly(ctx, [
      iso(0, ty1 + 0.08, z1 + 1.0),
      iso(0, ty2 - 0.08, z1 + 1.0),
      iso(0, ty2 - 0.08, z2 - 0.1),
      iso(0, ty1 + 0.08, z2 - 0.1),
    ], P.deskWood, P.shadow);
    // knob
    const knob = iso(0, ty1 + 0.18, 1.05);
    fillRect(ctx, knob.x - 1, knob.y - 1, 2, 2, P.amber);
    // door mat
    poly(ctx, [
      iso(0.05, ty1 - 0.05, 0.005),
      iso(0.65, ty1 - 0.05, 0.005),
      iso(0.65, ty2 + 0.05, 0.005),
      iso(0.05, ty2 + 0.05, 0.005),
    ], P.rugB, P.shadow);
    // mat fringe
    ctx.fillStyle = P.cream;
    for (let i = 0; i < 6; i++) {
      const a = iso(0.05 + (i / 5) * 0.6, ty1 - 0.07, 0.006);
      ctx.fillRect(a.x, a.y, 1, 1);
    }
  }

  // ─── CHARACTER ─────────────────────────────────────────────
  function drawCharacter(ctx, sx, sy, pose, frame, facing, mood) {
    sx = Math.floor(sx); sy = Math.floor(sy);
    const f = facing >= 0 ? 1 : -1;

    if (pose !== 'sleep') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (pose === 'sleep')    return drawCharSleep(ctx, frame);
    if (pose === 'sit_desk') return drawCharSitDesk(ctx, sx, sy, frame, mood);
    if (pose === 'work')     return drawCharSitDesk(ctx, sx, sy, frame, mood, 'work');
    if (pose === 'paint')    return drawCharSitDesk(ctx, sx, sy, frame, mood, 'paint');
    if (pose === 'sit')      return drawCharSit(ctx, sx, sy, frame, f, mood);
    if (pose === 'eat')      return drawCharStand(ctx, sx, sy, frame, f, mood, 'eat');
    if (pose === 'read')     return drawCharStand(ctx, sx, sy, frame, f, mood, 'read');
    if (pose === 'window')   return drawCharStand(ctx, sx, sy, frame, f, mood, 'window');
    if (pose === 'water')    return drawCharBend(ctx, sx, sy, frame, f, mood, 'water');
    if (pose === 'clean')    return drawCharStand(ctx, sx, sy, frame, f, mood, 'clean');
    if (pose === 'stretch')  return drawCharStand(ctx, sx, sy, frame, f, mood, 'stretch');
    if (pose === 'walk')     return drawCharWalk(ctx, sx, sy, frame, f, mood);
    return drawCharStand(ctx, sx, sy, frame, f, mood);
  }

  function drawCharBody(ctx, x, y, f, mood, mode = 'stand') {
    // legs — chunky chibi (navy denim)
    fillRect(ctx, x - 2, y - 5, 2, 5, P.pants);
    fillRect(ctx, x,     y - 5, 2, 5, P.pants);
    fillRect(ctx, x - 2, y - 5, 2, 1, P.pantsShadow);
    fillRect(ctx, x,     y - 5, 2, 1, P.pantsShadow);
    fillRect(ctx, x - 2, y - 1, 2, 1, P.shoe);
    fillRect(ctx, x,     y - 1, 2, 1, P.shoe);
    // sweater — oversized 8-wide cozy
    fillRect(ctx, x - 4, y - 12, 8, 7, P.cloth);
    fillRect(ctx, x - 4, y - 12, 8, 1, P.clothShadow);
    fillRect(ctx, x - 4, y - 6,  8, 1, P.clothShadow);
    // sleeve sides
    fillRect(ctx, x - 4, y - 11, 1, 5, P.clothShadow);
    fillRect(ctx, x + 3, y - 11, 1, 5, P.clothShadow);
    // knit stitch dots scattered
    ctx.fillStyle = P.clothShadow;
    ctx.fillRect(x - 2, y - 10, 1, 1);
    ctx.fillRect(x + 1, y - 10, 1, 1);
    ctx.fillRect(x,     y - 9,  1, 1);
    ctx.fillRect(x - 3, y - 8,  1, 1);
    ctx.fillRect(x + 2, y - 8,  1, 1);
    ctx.fillRect(x - 1, y - 7,  1, 1);
    // collar bow ribbon
    fillRect(ctx, x - 1, y - 12, 2, 1, P.roseDeep);
    fillRect(ctx, x - 2, y - 13, 4, 1, P.skin);
    // round head — 6 wide × 6 tall
    fillRect(ctx, x - 3, y - 19, 6, 6, P.skin);
    fillRect(ctx, x - 3, y - 13, 6, 1, P.skinShadow);
    // soften head corners with hair
    fillRect(ctx, x - 3, y - 19, 1, 1, P.hair);
    fillRect(ctx, x + 2, y - 19, 1, 1, P.hair);
    // hair cap (top)
    fillRect(ctx, x - 4, y - 21, 8, 3, P.hair);
    fillRect(ctx, x - 4, y - 21, 8, 1, P.hairLight);
    // bangs (asymmetric, leaving eye gap)
    fillRect(ctx, x - 3, y - 18, 2, 2, P.hair);
    fillRect(ctx, x + 1, y - 18, 2, 1, P.hair);
    // side strands curving
    fillRect(ctx, x - 4, y - 18, 1, 4, P.hair);
    fillRect(ctx, x + 3, y - 18, 1, 4, P.hair);
    // ─── twin side buns (cuteness factor +100) ───
    fillRect(ctx, x - 6, y - 20, 2, 3, P.hair);
    fillRect(ctx, x - 6, y - 20, 2, 1, P.hairLight);
    fillRect(ctx, x + 4, y - 20, 2, 3, P.hair);
    fillRect(ctx, x + 4, y - 20, 2, 1, P.hairLight);
    // ribbon bows on each bun
    fillRect(ctx, x - 6, y - 21, 1, 1, P.roseDeep);
    fillRect(ctx, x - 5, y - 21, 1, 1, P.rose);
    fillRect(ctx, x + 4, y - 21, 1, 1, P.rose);
    fillRect(ctx, x + 5, y - 21, 1, 1, P.roseDeep);
    drawFace(ctx, x, y - 16, f, mood);
  }

  function drawCharStand(ctx, x, y, frame, f, mood, mode) {
    const bob = (Math.floor(frame / 30) % 2) ? -1 : 0;
    y += bob;
    drawCharBody(ctx, x, y, f, mood, mode);
    if (mode === 'eat') {
      fillRect(ctx, x - 4, y - 9, 2, 3, P.cloth);
      fillRect(ctx, x + 2, y - 9, 2, 3, P.cloth);
      fillRect(ctx, x - 1, y - 8, 3, 2, P.cream);
      fillRect(ctx, x - 1, y - 8, 3, 1, P.peach);
    } else if (mode === 'read') {
      fillRect(ctx, x - 4, y - 9, 2, 3, P.cloth);
      fillRect(ctx, x + 2, y - 9, 2, 3, P.cloth);
      fillRect(ctx, x - 2, y - 9, 5, 3, P.bookB);
      fillRect(ctx, x - 1, y - 8, 1, 1, P.cream);
      fillRect(ctx, x + 1, y - 8, 1, 1, P.cream);
    } else if (mode === 'stretch') {
      const phase = Math.floor(frame / 24) % 2;
      fillRect(ctx, x - 5, y - 16 - phase, 1, 5, P.cloth);
      fillRect(ctx, x + 4, y - 16 - phase, 1, 5, P.cloth);
      fillRect(ctx, x - 5, y - 17 - phase, 1, 1, P.skin);
      fillRect(ctx, x + 4, y - 17 - phase, 1, 1, P.skin);
    } else if (mode === 'clean') {
      fillRect(ctx, x - 1, y - 10, 2, 4, P.cloth);
      fillRect(ctx, x + 2, y - 10, 1, 8, P.deskWood);
      fillRect(ctx, x + 1, y - 3, 4, 2, P.amber);
      fillRect(ctx, x + 1, y - 3, 4, 1, P.amberDeep);
    } else if (mode === 'window') {
      fillRect(ctx, x - 4, y - 11, 2, 5, P.cloth);
      fillRect(ctx, x + 2, y - 11, 2, 5, P.cloth);
    } else {
      fillRect(ctx, x - 4, y - 11, 2, 5, P.cloth);
      fillRect(ctx, x + 2, y - 11, 2, 5, P.cloth);
    }
  }

  function drawCharWalk(ctx, x, y, frame, f, mood) {
    const phase = Math.floor(frame / 8) % 4;
    const bob = (phase === 1 || phase === 3) ? -1 : 0;
    y += bob;
    // legs alternate (one slightly forward each phase)
    if (phase === 0 || phase === 2) {
      fillRect(ctx, x - 2, y - 5, 2, 5, P.pants);
      fillRect(ctx, x,     y - 5, 2, 5, P.pants);
    } else {
      fillRect(ctx, x - 2, y - 6, 2, 4, P.pants);
      fillRect(ctx, x,     y - 4, 2, 4, P.pants);
    }
    fillRect(ctx, x - 2, y - 1, 2, 1, P.shoe);
    fillRect(ctx, x,     y - 1, 2, 1, P.shoe);
    // sweater (same as body)
    fillRect(ctx, x - 4, y - 12, 8, 7, P.cloth);
    fillRect(ctx, x - 4, y - 12, 8, 1, P.clothShadow);
    fillRect(ctx, x - 4, y - 6,  8, 1, P.clothShadow);
    fillRect(ctx, x - 4, y - 11, 1, 5, P.clothShadow);
    fillRect(ctx, x + 3, y - 11, 1, 5, P.clothShadow);
    ctx.fillStyle = P.clothShadow;
    ctx.fillRect(x - 2, y - 10, 1, 1);
    ctx.fillRect(x + 1, y - 10, 1, 1);
    ctx.fillRect(x, y - 9, 1, 1);
    ctx.fillRect(x - 3, y - 8, 1, 1);
    ctx.fillRect(x + 2, y - 8, 1, 1);
    fillRect(ctx, x - 1, y - 12, 2, 1, P.roseDeep);
    // arms swing
    const ao = (phase % 2 === 0) ? 0 : 1;
    fillRect(ctx, x - 5, y - 11 + ao, 2, 5, P.cloth);
    fillRect(ctx, x + 3, y - 11 + (1 - ao), 2, 5, P.cloth);
    // head
    fillRect(ctx, x - 3, y - 19, 6, 6, P.skin);
    fillRect(ctx, x - 3, y - 13, 6, 1, P.skinShadow);
    fillRect(ctx, x - 3, y - 19, 1, 1, P.hair);
    fillRect(ctx, x + 2, y - 19, 1, 1, P.hair);
    // hair cap
    fillRect(ctx, x - 4, y - 21, 8, 3, P.hair);
    fillRect(ctx, x - 4, y - 21, 8, 1, P.hairLight);
    fillRect(ctx, x - 3, y - 18, 2, 2, P.hair);
    fillRect(ctx, x + 1, y - 18, 2, 1, P.hair);
    fillRect(ctx, x - 4, y - 18, 1, 4, P.hair);
    fillRect(ctx, x + 3, y - 18, 1, 4, P.hair);
    // twin side buns
    fillRect(ctx, x - 6, y - 20, 2, 3, P.hair);
    fillRect(ctx, x - 6, y - 20, 2, 1, P.hairLight);
    fillRect(ctx, x + 4, y - 20, 2, 3, P.hair);
    fillRect(ctx, x + 4, y - 20, 2, 1, P.hairLight);
    fillRect(ctx, x - 6, y - 21, 1, 1, P.roseDeep);
    fillRect(ctx, x - 5, y - 21, 1, 1, P.rose);
    fillRect(ctx, x + 4, y - 21, 1, 1, P.rose);
    fillRect(ctx, x + 5, y - 21, 1, 1, P.roseDeep);
    drawFace(ctx, x, y - 16, f, mood);
  }

  function drawCharSit(ctx, x, y, frame, f, mood) {
    // legs forward (sitting)
    fillRect(ctx, x - 3, y - 4, 6, 4, P.pants);
    fillRect(ctx, x - 3, y - 4, 6, 1, P.pantsShadow);
    fillRect(ctx, x - 3, y - 1, 6, 1, P.shoe);
    // sweater (oversized)
    fillRect(ctx, x - 4, y - 11, 8, 7, P.cloth);
    fillRect(ctx, x - 4, y - 11, 8, 1, P.clothShadow);
    fillRect(ctx, x - 4, y - 5,  8, 1, P.clothShadow);
    fillRect(ctx, x - 4, y - 10, 1, 5, P.clothShadow);
    fillRect(ctx, x + 3, y - 10, 1, 5, P.clothShadow);
    ctx.fillStyle = P.clothShadow;
    ctx.fillRect(x - 2, y - 9, 1, 1);
    ctx.fillRect(x + 1, y - 9, 1, 1);
    ctx.fillRect(x, y - 7, 1, 1);
    fillRect(ctx, x - 1, y - 11, 2, 1, P.roseDeep);
    // arms (slightly forward)
    fillRect(ctx, x - 5, y - 9, 2, 5, P.cloth);
    fillRect(ctx, x + 3, y - 9, 2, 5, P.cloth);
    // head
    fillRect(ctx, x - 3, y - 18, 6, 6, P.skin);
    fillRect(ctx, x - 3, y - 12, 6, 1, P.skinShadow);
    fillRect(ctx, x - 3, y - 18, 1, 1, P.hair);
    fillRect(ctx, x + 2, y - 18, 1, 1, P.hair);
    // hair cap
    fillRect(ctx, x - 4, y - 20, 8, 3, P.hair);
    fillRect(ctx, x - 4, y - 20, 8, 1, P.hairLight);
    fillRect(ctx, x - 3, y - 17, 2, 2, P.hair);
    fillRect(ctx, x + 1, y - 17, 2, 1, P.hair);
    fillRect(ctx, x - 4, y - 17, 1, 4, P.hair);
    fillRect(ctx, x + 3, y - 17, 1, 4, P.hair);
    // twin side buns
    fillRect(ctx, x - 6, y - 19, 2, 3, P.hair);
    fillRect(ctx, x - 6, y - 19, 2, 1, P.hairLight);
    fillRect(ctx, x + 4, y - 19, 2, 3, P.hair);
    fillRect(ctx, x + 4, y - 19, 2, 1, P.hairLight);
    fillRect(ctx, x - 6, y - 20, 1, 1, P.roseDeep);
    fillRect(ctx, x - 5, y - 20, 1, 1, P.rose);
    fillRect(ctx, x + 4, y - 20, 1, 1, P.rose);
    fillRect(ctx, x + 5, y - 20, 1, 1, P.roseDeep);
    drawFace(ctx, x, y - 15, f, mood);
  }

  function drawCharSitDesk(ctx, x, y, frame, mood, sub = '') {
    // body (back of sweater)
    fillRect(ctx, x - 4, y - 13, 8, 8, P.cloth);
    fillRect(ctx, x - 4, y - 13, 8, 1, P.creamSoft);
    fillRect(ctx, x - 4, y - 6,  8, 1, P.clothShadow);
    // back knit dots
    ctx.fillStyle = P.clothShadow;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(x - 3 + i * 2, y - 11, 1, 1);
      ctx.fillRect(x - 3 + i * 2, y - 9, 1, 1);
    }
    if (sub === 'work') {
      const tap = Math.floor(frame / 6) % 2;
      fillRect(ctx, x - 5, y - 11, 2, 5, P.cloth);
      fillRect(ctx, x + 3, y - 11, 2, 5, P.cloth);
      fillRect(ctx, x - 5, y - 7 + tap, 1, 1, P.skinShadow);
      fillRect(ctx, x + 4, y - 7 - tap, 1, 1, P.skinShadow);
    } else if (sub === 'paint') {
      const sway = Math.floor(frame / 16) % 2;
      fillRect(ctx, x + 3, y - 11 - sway, 2, 5, P.cloth);
      fillRect(ctx, x - 5, y - 10, 2, 4, P.cloth);
    } else {
      fillRect(ctx, x - 5, y - 11, 2, 5, P.cloth);
      fillRect(ctx, x + 3, y - 11, 2, 5, P.cloth);
    }
    // head from BEHIND — round, with twin side buns visible
    fillRect(ctx, x - 3, y - 20, 6, 7, P.hair);
    fillRect(ctx, x - 3, y - 20, 6, 1, P.hairLight);
    // little ear nubs
    fillRect(ctx, x - 4, y - 16, 1, 2, P.skin);
    fillRect(ctx, x + 3, y - 16, 1, 2, P.skin);
    // SIDE BUNS (visible from behind too — symmetrical)
    fillRect(ctx, x - 6, y - 20, 2, 3, P.hair);
    fillRect(ctx, x - 6, y - 20, 2, 1, P.hairLight);
    fillRect(ctx, x + 4, y - 20, 2, 3, P.hair);
    fillRect(ctx, x + 4, y - 20, 2, 1, P.hairLight);
    // ribbon bows
    fillRect(ctx, x - 6, y - 21, 1, 1, P.roseDeep);
    fillRect(ctx, x - 5, y - 21, 1, 1, P.rose);
    fillRect(ctx, x + 4, y - 21, 1, 1, P.rose);
    fillRect(ctx, x + 5, y - 21, 1, 1, P.roseDeep);
    // hair strands at neck nape
    fillRect(ctx, x - 1, y - 13, 3, 1, P.hair);
  }

  function drawCharSleep(ctx, frame) {
    const headPos = iso(1.4, 2.45, 0.65);
    const footPos = iso(0.4, 3.7, 0.65);
    const steps = 9;
    for (let s = 1; s < steps; s++) {
      const t = s / (steps - 1);
      const cx = Math.round(headPos.x + (footPos.x - headPos.x) * t);
      const cy = Math.round(headPos.y + (footPos.y - headPos.y) * t);
      fillRect(ctx, cx - 5, cy - 1, 12, 4, P.blanket);
      if (s === 1) fillRect(ctx, cx - 5, cy - 1, 12, 1, P.blanket2);
      // blanket pattern dots
      if (s % 2 === 0) {
        ctx.fillStyle = P.blanket2;
        ctx.fillRect(cx - 2, cy + 1, 1, 1);
        ctx.fillRect(cx + 2, cy, 1, 1);
      }
    }
    // pillow head zone
    fillRect(ctx, headPos.x - 4, headPos.y - 7, 9, 6, P.skin);
    fillRect(ctx, headPos.x - 5, headPos.y - 8, 11, 4, P.hair);
    fillRect(ctx, headPos.x - 5, headPos.y - 8, 11, 1, P.hairLight);
    // closed eyes
    fillRect(ctx, headPos.x - 1, headPos.y - 4, 1, 1, P.ink);
    fillRect(ctx, headPos.x + 2, headPos.y - 4, 1, 1, P.ink);
    // mouth
    fillRect(ctx, headPos.x, headPos.y - 2, 1, 1, P.shadow);
    // blush
    fillRect(ctx, headPos.x - 2, headPos.y - 3, 1, 1, 'rgba(232, 163, 163, 0.6)');
    fillRect(ctx, headPos.x + 3, headPos.y - 3, 1, 1, 'rgba(232, 163, 163, 0.6)');
    // zzz
    if (Math.floor(frame / 20) % 2 === 0) {
      ctx.fillStyle = 'rgba(245, 230, 211, 0.85)';
      ctx.font = '5px monospace';
      ctx.fillText('z', headPos.x + 8, headPos.y - 6);
      ctx.fillText('Z', headPos.x + 11, headPos.y - 10);
    }
  }

  function drawCharBend(ctx, x, y, frame, f, mood, sub) {
    fillRect(ctx, x - 2, y - 5, 2, 5, P.pants);
    fillRect(ctx, x,     y - 5, 2, 5, P.pants);
    fillRect(ctx, x - 2, y - 1, 2, 1, P.shoe);
    fillRect(ctx, x,     y - 1, 2, 1, P.shoe);
    fillRect(ctx, x - 3, y - 11, 6, 6, P.cloth);
    fillRect(ctx, x - 3, y - 6, 6, 1, P.clothShadow);
    fillRect(ctx, x - 3, y - 16, 6, 5, P.skin);
    fillRect(ctx, x - 4, y - 17, 8, 4, P.hair);
    fillRect(ctx, x - 4, y - 17, 8, 1, P.hairLight);
    const armX = (f > 0 ? x + 3 : x - 5);
    fillRect(ctx, armX, y - 9, 2, 4, P.cloth);
    if (sub === 'water') {
      const cx = (f > 0 ? x + 5 : x - 8);
      fillRect(ctx, cx, y - 7, 4, 3, P.bookA);
      fillRect(ctx, cx + (f > 0 ? 4 : -1), y - 6, 1, 1, P.bookA);
      if (Math.floor(frame / 6) % 2 === 0) {
        fillRect(ctx, cx + (f > 0 ? 5 : -2), y - 4, 1, 2, '#9bc4cf');
      }
    }
  }

  function drawFace(ctx, x, y, f, mood = 'normal') {
    // y = eye top (sparkle row); face center at (x, y+1)
    // Layout: eyes at columns x-2 and x+1 (1×2 tall ink)
    // Sparkle pixels above eyes, blush on outer cheek columns
    const lex = x - 2;        // left eye column
    const rex = x + 1;        // right eye column

    // BLUSH — wider, more visible (always)
    ctx.fillStyle = 'rgba(244, 168, 176, 0.9)';
    ctx.fillRect(x - 3, y + 1, 1, 1);
    ctx.fillRect(x + 2, y + 1, 1, 1);
    ctx.fillStyle = 'rgba(244, 168, 176, 0.55)';
    ctx.fillRect(x - 3, y + 2, 1, 1);
    ctx.fillRect(x + 2, y + 2, 1, 1);

    if (mood === 'tired' || mood === 'sleepy') {
      // half-closed: short horizontal lines
      fillRect(ctx, lex, y + 1, 1, 1, P.ink);
      fillRect(ctx, rex, y + 1, 1, 1, P.ink);
      fillRect(ctx, x, y + 3, 1, 1, P.shadow);
    } else if (mood === 'stressed') {
      // worried brow + small eyes
      fillRect(ctx, lex, y - 1, 1, 1, P.ink);
      fillRect(ctx, rex, y - 1, 1, 1, P.ink);
      fillRect(ctx, lex, y, 1, 1, P.ink);
      fillRect(ctx, rex, y, 1, 1, P.ink);
      fillRect(ctx, x, y + 3, 1, 1, P.shadow);
    } else if (mood === 'happy') {
      // happy crescent eyes ^ ^
      fillRect(ctx, lex - 1, y + 1, 1, 1, P.ink);
      fillRect(ctx, lex,     y,     1, 1, P.ink);
      fillRect(ctx, lex + 1, y + 1, 1, 1, P.ink);
      fillRect(ctx, rex - 1, y + 1, 1, 1, P.ink);
      fillRect(ctx, rex,     y,     1, 1, P.ink);
      fillRect(ctx, rex + 1, y + 1, 1, 1, P.ink);
      // ω smile — open little mouth
      fillRect(ctx, x - 1, y + 3, 1, 1, P.roseDeep);
      fillRect(ctx, x + 1, y + 3, 1, 1, P.roseDeep);
      fillRect(ctx, x,     y + 4, 1, 1, P.roseDeep);
    } else if (mood === 'lonely' || mood === 'sad') {
      fillRect(ctx, lex, y + 1, 1, 1, P.ink);
      fillRect(ctx, rex, y + 1, 1, 1, P.ink);
      // tear drop
      fillRect(ctx, rex, y + 2, 1, 1, '#9bc4cf');
      fillRect(ctx, x, y + 3, 1, 1, P.shadow);
    } else if (mood === 'inspired') {
      // sparkly tall eyes + floating star sparkles
      fillRect(ctx, lex, y, 1, 2, P.ink);
      fillRect(ctx, rex, y, 1, 2, P.ink);
      fillRect(ctx, lex, y - 1, 1, 1, P.cream);
      fillRect(ctx, rex, y - 1, 1, 1, P.cream);
      // floating amber sparkles outside head
      fillRect(ctx, x - 5, y - 1, 1, 1, P.amber);
      fillRect(ctx, x + 4, y - 1, 1, 1, P.amber);
      fillRect(ctx, x, y + 3, 1, 1, P.roseDeep);
    } else {
      // normal — big sparkle chibi eyes
      fillRect(ctx, lex, y, 1, 2, P.ink);
      fillRect(ctx, rex, y, 1, 2, P.ink);
      // catchlight (top pixel)
      fillRect(ctx, lex, y, 1, 1, 'rgba(255, 255, 255, 0.95)');
      fillRect(ctx, rex, y, 1, 1, 'rgba(255, 255, 255, 0.95)');
      // tiny smile
      fillRect(ctx, x, y + 3, 1, 1, P.roseDeep);
    }
  }

  // ─── ATMOSPHERE ────────────────────────────────────────────
  function drawDustMotes(ctx, time) {
    ctx.fillStyle = 'rgba(255, 217, 183, 0.55)';
    for (let i = 0; i < 14; i++) {
      const x = (i * 31 + time * 6) % 320;
      const y = 40 + Math.sin(time * 0.45 + i) * 20 + (i % 4) * 10;
      ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    }
  }

  function drawRain(ctx, time) {
    ctx.fillStyle = 'rgba(180, 200, 220, 0.22)';
    for (let i = 0; i < 28; i++) {
      const x = (i * 11 + time * 50) % 320;
      const y = (i * 13 + time * 160) % 180;
      ctx.fillRect(Math.floor(x), Math.floor(y), 1, 3);
    }
  }

  function drawSnow(ctx, time) {
    ctx.fillStyle = 'rgba(255, 248, 236, 0.4)';
    for (let i = 0; i < 18; i++) {
      const baseX = i * 7;
      const x = (baseX + Math.sin(time * 0.5 + i) * 14 + time * 5) % 320;
      const y = (i * 9 + time * 18) % 180;
      ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    }
  }

  function drawLightingOverlay(ctx, hour, weather) {
    let color = null;
    let alpha = 0;
    if (hour >= 19 || hour < 6) {
      color = '52, 50, 80'; alpha = 0.46;
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
      ctx.fillRect(0, 0, 320, 180);
    }
    if (hour >= 8 && hour < 17 && (weather === 'clear' || weather === 'cloudy')) {
      const win = iso(4.9, 0.5, 2.4);
      const beam = ctx.createLinearGradient(win.x, win.y, win.x - 50, win.y + 90);
      beam.addColorStop(0, 'rgba(255, 220, 160, 0.22)');
      beam.addColorStop(1, 'rgba(255, 220, 160, 0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(win.x - 6, win.y + 4);
      ctx.lineTo(win.x + 18, win.y + 4);
      ctx.lineTo(win.x - 30, win.y + 90);
      ctx.lineTo(win.x - 60, win.y + 90);
      ctx.closePath();
      ctx.fill();
    }
    if (hour >= 18 || hour < 6) {
      const lamp = iso(3.95, 0.25, 0.95);
      const grd = ctx.createRadialGradient(lamp.x, lamp.y, 2, lamp.x, lamp.y, 60);
      grd.addColorStop(0, 'rgba(255, 217, 130, 0.55)');
      grd.addColorStop(1, 'rgba(255, 217, 130, 0)');
      ctx.fillStyle = grd;
      ctx.fillRect(lamp.x - 60, lamp.y - 60, 120, 120);
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
    iso,
    TILE_W: TW, TILE_H: TH, ROOM_W, ROOM_D, WALL_H,
    drawWall, drawFloor, drawRoomOutline, drawWindow, drawWallDecor, drawStringLights,
    drawBookshelf, drawDesk, drawChair, drawBed, drawSofa,
    drawCoffeeTable, drawPlant, drawKitchen, drawRug, drawDoor,
    drawNightstand, drawFloorLamp,
    drawCharacter,
    drawDustMotes, drawRain, drawSnow, drawLightingOverlay,
    fillRect, lerpColor, clamp,
  };
})();

// ─── sprites.js ────────────────────────────────────────────
// Isometric pixel-art rendering. Internal canvas: 320×180.
// Tile dimetric (2:1) projection.

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

  function isoTile(ctx, tx, ty, color, stroke) {
    const a = iso(tx,     ty);
    const b = iso(tx + 1, ty);
    const c = iso(tx + 1, ty + 1);
    const d = iso(tx,     ty + 1);
    poly(ctx, [a, b, c, d], color, stroke);
  }

  // ─── ROOM SHELL ────────────────────────────────────────────
  function drawWall(ctx, hour, weather) {
    drawBackWall(ctx, hour, weather);
    drawLeftWall(ctx);
  }

  function drawBackWall(ctx) {
    // panel
    const a = iso(0,      0, 0);
    const b = iso(ROOM_W, 0, 0);
    const c = iso(ROOM_W, 0, WALL_H);
    const d = iso(0,      0, WALL_H);
    poly(ctx, [a, b, c, d], P.wallBg);
    // subtle vertical pinstripe
    ctx.fillStyle = 'rgba(120, 90, 60, 0.12)';
    for (let tx = 0.25; tx < ROOM_W; tx += 0.5) {
      const top = iso(tx, 0, WALL_H);
      ctx.fillRect(top.x, top.y, 1, WALL_H * TH);
    }
    // baseboard (bottom strip)
    poly(ctx, [
      iso(0, 0, 0), iso(ROOM_W, 0, 0),
      iso(ROOM_W, 0, 0.18), iso(0, 0, 0.18),
    ], P.wallTrim);
    // crown moulding (top strip)
    poly(ctx, [
      iso(0, 0, WALL_H - 0.12), iso(ROOM_W, 0, WALL_H - 0.12),
      iso(ROOM_W, 0, WALL_H), iso(0, 0, WALL_H),
    ], P.wallTrim);
  }

  function drawLeftWall(ctx) {
    const a = iso(0, 0,      0);
    const b = iso(0, ROOM_D, 0);
    const c = iso(0, ROOM_D, WALL_H);
    const d = iso(0, 0,      WALL_H);
    poly(ctx, [a, b, c, d], P.wallBg2);
    // pinstripe
    ctx.fillStyle = 'rgba(120, 90, 60, 0.12)';
    for (let ty = 0.25; ty < ROOM_D; ty += 0.5) {
      const top = iso(0, ty, WALL_H);
      ctx.fillRect(top.x - 1, top.y, 1, WALL_H * TH);
    }
    poly(ctx, [
      iso(0, 0, 0), iso(0, ROOM_D, 0),
      iso(0, ROOM_D, 0.18), iso(0, 0, 0.18),
    ], P.wallTrim);
    poly(ctx, [
      iso(0, 0, WALL_H - 0.12), iso(0, ROOM_D, WALL_H - 0.12),
      iso(0, ROOM_D, WALL_H), iso(0, 0, WALL_H),
    ], P.wallTrim);
  }

  function drawFloor(ctx) {
    const tl = iso(0,      0);
    const tr = iso(ROOM_W, 0);
    const br = iso(ROOM_W, ROOM_D);
    const bl = iso(0,      ROOM_D);
    poly(ctx, [tl, tr, br, bl], P.floor);
    // plank seams along tx axis (one line per row)
    ctx.strokeStyle = 'rgba(60, 40, 28, 0.35)';
    ctx.lineWidth = 1;
    for (let ty = 1; ty < ROOM_D; ty++) {
      const a = iso(0, ty);
      const b = iso(ROOM_W, ty);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y + 0.5);
      ctx.lineTo(b.x, b.y + 0.5);
      ctx.stroke();
    }
    // staggered plank cuts every 2 tiles
    ctx.strokeStyle = 'rgba(60, 40, 28, 0.2)';
    for (let ty = 0; ty < ROOM_D; ty++) {
      for (let tx = (ty % 2 === 0) ? 2 : 1; tx < ROOM_W; tx += 2) {
        const a = iso(tx, ty);
        const b = iso(tx, ty + 1);
        ctx.beginPath();
        ctx.moveTo(a.x + 0.5, a.y);
        ctx.lineTo(b.x + 0.5, b.y);
        ctx.stroke();
      }
    }
  }

  // ─── WINDOW (cuts back wall) ───────────────────────────────
  function drawWindow(ctx, hour, weather) {
    const x1 = 4.3, x2 = 5.5, z1 = 1.6, z2 = 3.3;
    const a = iso(x1, 0, z1);
    const b = iso(x2, 0, z1);
    const c = iso(x2, 0, z2);
    const d = iso(x1, 0, z2);

    // sky inside (clipped)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y);
    ctx.closePath();
    ctx.clip();
    drawSkyInside(ctx, a, b, c, d, hour, weather);
    ctx.restore();

    // frame
    ctx.strokeStyle = P.deskWood2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y);
    ctx.closePath();
    ctx.stroke();
    // cross frame
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

    // sill below the window
    poly(ctx, [
      iso(x1 - 0.05, 0, z1 - 0.1),
      iso(x2 + 0.05, 0, z1 - 0.1),
      iso(x2 + 0.05, 0, z1),
      iso(x1 - 0.05, 0, z1),
    ], P.deskWood);
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
      for (let i = 0; i < 7; i++) {
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

    // distant pine ridge
    ctx.fillStyle = isNight ? '#1a1a2a' : '#4a5a4a';
    const treeY = minY + Math.floor(h * 0.62);
    for (let tx = 0; tx < w; tx += 3) {
      const triH = 3 + ((tx * 7) % 6);
      ctx.fillRect(minX + tx, treeY - triH, 1, triH);
      ctx.fillRect(minX + tx + 1, treeY - triH + 1, 1, triH - 1);
    }
    ctx.fillStyle = isNight ? '#2a2030' : '#6a5440';
    ctx.fillRect(minX, treeY, w, h - (treeY - minY));

    // drifting clouds
    if (weather !== 'clear' || (hour > 9 && hour < 17)) {
      const t = window.gameTime?.totalGameSeconds || 0;
      ctx.fillStyle = isNight ? 'rgba(58, 53, 64, 0.8)' : P.cloud;
      const c1x = minX + ((t * 0.3 + 5) % (w + 14)) - 7;
      const c1y = minY + 4;
      ctx.fillRect(c1x, c1y, 7, 2);
      ctx.fillRect(c1x + 1, c1y - 1, 5, 1);
      const c2x = minX + ((t * 0.2 + 25) % (w + 12)) - 6;
      const c2y = minY + 12;
      ctx.fillRect(c2x, c2y, 5, 2);
    }

    // weather streaks inside window
    if (weather === 'rain') {
      ctx.fillStyle = 'rgba(180, 200, 220, 0.55)';
      const t = window.gameTime?.totalGameSeconds || 0;
      for (let i = 0; i < 12; i++) {
        const rx = minX + ((i * 5 + t * 30) % w);
        const ry = minY + ((i * 7 + t * 70) % h);
        ctx.fillRect(rx, ry, 1, 2);
      }
    } else if (weather === 'snow') {
      ctx.fillStyle = P.cream;
      const t = window.gameTime?.totalGameSeconds || 0;
      for (let i = 0; i < 9; i++) {
        const rx = minX + ((i * 4 + t * 6 + Math.sin(t + i) * 2) % w);
        const ry = minY + ((i * 6 + t * 14) % h);
        ctx.fillRect(rx, ry, 1, 1);
      }
    }
  }

  // ─── WALL DECOR ────────────────────────────────────────────
  function drawWallDecor(ctx) {
    drawFrameOnBackWall(ctx, 1.8, 2.5, 0.7, 0.55);
    drawFrameOnBackWall(ctx, 2.7, 2.4, 0.4, 0.5);
    drawCircleClock(ctx);
  }

  function drawFrameOnBackWall(ctx, tx, z, w, h) {
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
    // mini abstract painting inside the frame
    const fx = ia.x + 1, fy = ic.y + 1;
    const fw = ib.x - ia.x - 2;
    const fh = id.y - ia.y - 2;
    ctx.fillStyle = P.skyDay;
    ctx.fillRect(fx, fy, fw, Math.floor(fh * 0.55));
    ctx.fillStyle = P.amber;
    ctx.fillRect(fx + Math.floor(fw * 0.6), fy + 1, 3, 3);
    ctx.fillStyle = P.sage;
    ctx.fillRect(fx, fy + Math.floor(fh * 0.55), fw, fh - Math.floor(fh * 0.55));
    ctx.fillStyle = P.sageDeep;
    ctx.fillRect(fx + 2, fy + Math.floor(fh * 0.55) + 1, 2, 2);
  }

  function drawCircleClock(ctx) {
    // small wall clock above bookshelf
    const center = iso(0.7, 0, 3.0);
    const r = 4;
    ctx.fillStyle = P.cream;
    ctx.beginPath(); ctx.arc(center.x, center.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = P.deskWood2;
    ctx.beginPath(); ctx.arc(center.x, center.y, r, 0, Math.PI * 2); ctx.stroke();
    // hands tied to in-game hour
    const h = window.TIME?.getHour?.() || 7;
    const hourAng = ((h % 12) / 12) * Math.PI * 2 - Math.PI / 2;
    const minAng  = ((h % 1) * 60 / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x + Math.cos(hourAng) * 2, center.y + Math.sin(hourAng) * 2);
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x + Math.cos(minAng) * 3, center.y + Math.sin(minAng) * 3);
    ctx.stroke();
    ctx.fillStyle = P.roseDeep;
    ctx.fillRect(center.x, center.y, 1, 1);
  }

  function drawStringLights(ctx, hour) {
    const z = 3.6;
    const segs = 14;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const tx = t * ROOM_W;
      const sag = Math.sin(t * Math.PI) * 0.16;
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
        ctx.fillStyle = `rgba(255, 220, 160, 0.32)`;
        ctx.fillRect(p.x - 2, p.y - 1, 4, 4);
      }
    }
  }

  // ─── FURNITURE ─────────────────────────────────────────────
  function drawBookshelf(ctx) {
    const tx = 0.15, ty = 0.0, w = 0.8, d = 0.45, h = 2.3;
    isoBox(ctx, tx, ty, w, d, h, {
      top: P.deskWood, front: P.deskWood, right: P.deskWood2, outline: P.shadow,
    });
    // shelves drawn on the FRONT face
    const cols = [P.bookA, P.bookB, P.bookC, P.bookD, P.bookB, P.bookC];
    for (let s = 0; s < 4; s++) {
      const z = 0.25 + s * 0.5;
      const sa = iso(tx, ty + d, z);
      const sb = iso(tx + w, ty + d, z);
      ctx.strokeStyle = P.shadow;
      ctx.beginPath();
      ctx.moveTo(sa.x + 0.5, sa.y);
      ctx.lineTo(sb.x + 0.5, sb.y);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const bxFrac = 0.05 + i * 0.2;
        const bzBase = z + 0.05;
        const bh = 0.32 + (i % 3) * 0.04;
        const c = cols[(s * 4 + i) % cols.length];
        const ba = iso(tx + bxFrac, ty + d, bzBase);
        const bb = iso(tx + bxFrac + 0.16, ty + d, bzBase);
        const bc = iso(tx + bxFrac + 0.16, ty + d, bzBase + bh);
        const bd = iso(tx + bxFrac, ty + d, bzBase + bh);
        poly(ctx, [ba, bb, bc, bd], c);
        // page edge highlight
        const ha = iso(tx + bxFrac + 0.01, ty + d, bzBase);
        const hb = iso(tx + bxFrac + 0.04, ty + d, bzBase);
        const hc = iso(tx + bxFrac + 0.04, ty + d, bzBase + bh);
        const hd = iso(tx + bxFrac + 0.01, ty + d, bzBase + bh);
        poly(ctx, [ha, hb, hc, hd], lighten(c, 0.25));
      }
    }
  }

  function drawDesk(ctx) {
    const tx = 2.4, ty = 0.0, w = 1.7, d = 0.85, h = 0.7;
    isoBox(ctx, tx, ty, w, d, h, {
      top: P.deskWood, front: P.deskWood2, right: P.deskWood2, outline: P.shadow,
    });
    // monitor
    const mx = tx + 0.55, my = ty + 0.18, mw = 0.7, md = 0.1, mh = 0.55;
    isoBox(ctx, mx, my, mw, md, mh, {
      top: P.shadow, front: '#161220', right: '#0a0612', outline: P.shadow,
    });
    // screen glow on front
    const sa = iso(mx + 0.05, my + md, h + 0.06);
    const sb = iso(mx + mw - 0.05, my + md, h + 0.06);
    const sc = iso(mx + mw - 0.05, my + md, h + mh - 0.04);
    const sd = iso(mx + 0.05, my + md, h + mh - 0.04);
    poly(ctx, [sa, sb, sc, sd], P.skyDay);
    // tiny screen content
    ctx.fillStyle = P.amber;
    ctx.fillRect(sa.x + 1, sd.y + 1, 4, 1);
    ctx.fillRect(sa.x + 1, sd.y + 3, 6, 1);
    ctx.fillRect(sa.x + 1, sd.y + 5, 3, 1);
    // monitor stand
    const stand_a = iso(mx + 0.3, my + 0.04, h);
    fillRect(ctx, stand_a.x, stand_a.y - 4, 2, 4, P.shadow);
    // notebook
    poly(ctx, [
      iso(tx + 1.32, ty + 0.42, h),
      iso(tx + 1.62, ty + 0.42, h),
      iso(tx + 1.62, ty + 0.72, h),
      iso(tx + 1.32, ty + 0.72, h),
    ], P.bookA);
    // mug + steam
    const mug = iso(tx + 0.18, ty + 0.55, h);
    fillRect(ctx, mug.x - 1, mug.y - 4, 4, 4, P.rose);
    fillRect(ctx, mug.x + 3, mug.y - 3, 1, 2, P.rose);
    fillRect(ctx, mug.x - 1, mug.y - 4, 4, 1, P.cream);
    const t = (window.gameTime?.totalGameSeconds || 0) * 2;
    ctx.fillStyle = 'rgba(255, 248, 236, 0.55)';
    ctx.fillRect(Math.floor(mug.x + Math.sin(t) * 1), mug.y - 7, 1, 1);
    ctx.fillRect(Math.floor(mug.x + 1 + Math.sin(t + 0.6) * 1), mug.y - 9, 1, 1);
    // small lamp on right edge
    const lamp = iso(tx + w - 0.18, ty + 0.2, h);
    fillRect(ctx, lamp.x, lamp.y - 4, 1, 4, P.amberDeep);
    fillRect(ctx, lamp.x - 2, lamp.y - 7, 5, 3, P.amber);
    fillRect(ctx, lamp.x - 1, lamp.y - 8, 3, 1, P.amber);
  }

  function drawChair(ctx) {
    const tx = 3.45, ty = 1.05, w = 0.55, d = 0.55;
    // base
    const base = iso(tx + w / 2, ty + d / 2, 0);
    fillRect(ctx, base.x - 5, base.y, 10, 2, P.shadow);
    fillRect(ctx, base.x - 1, base.y - 6, 2, 7, P.shadow);
    // seat
    isoBox(ctx, tx, ty, w, d, 0.4, {
      top: P.cloth, front: P.clothShadow, right: P.clothShadow, outline: P.shadow,
    });
    // back rest (against ty=ty side, taller)
    isoBox(ctx, tx, ty, w, 0.1, 1.0, {
      top: P.cloth, front: P.cloth, right: P.clothShadow, outline: P.shadow,
    });
  }

  function drawBed(ctx) {
    const tx = 0.2, ty = 2.0, w = 1.4, d = 1.9, h = 0.45;
    // frame (wood)
    isoBox(ctx, tx, ty, w, d, h, {
      top: P.cream, front: P.deskWood, right: P.deskWood2, outline: P.shadow,
    });
    // headboard (against back of bed = ty = ty)
    isoBox(ctx, tx, ty - 0.1, w, 0.1, 0.9, {
      top: P.deskWood, front: P.deskWood2, right: P.deskWood2, outline: P.shadow,
    });
    // mattress
    const mx = tx + 0.05, my = ty + 0.05, mw = w - 0.1, md = d - 0.1, mh = 0.16;
    isoBox(ctx, mx, my, mw, md, mh, {
      top: P.cream, front: P.creamSoft, right: P.creamSoft, outline: P.shadow,
    });
    // blanket on lower 65%
    const bz = h + mh;
    poly(ctx, [
      iso(mx + 0.03, my + 0.55, bz),
      iso(mx + mw - 0.03, my + 0.55, bz),
      iso(mx + mw - 0.03, my + md - 0.03, bz),
      iso(mx + 0.03, my + md - 0.03, bz),
    ], P.blanket);
    // blanket front edge fold
    poly(ctx, [
      iso(mx + 0.03, my + md - 0.03, bz),
      iso(mx + mw - 0.03, my + md - 0.03, bz),
      iso(mx + mw - 0.03, my + md - 0.03, bz - 0.1),
      iso(mx + 0.03, my + md - 0.03, bz - 0.1),
    ], P.blanket2);
    // pillow
    poly(ctx, [
      iso(mx + 0.08, my + 0.04, bz),
      iso(mx + mw - 0.08, my + 0.04, bz),
      iso(mx + mw - 0.08, my + 0.45, bz),
      iso(mx + 0.08, my + 0.45, bz),
    ], P.pillow);
    // pillow seam
    ctx.strokeStyle = P.shadow;
    const psa = iso(mx + 0.1, my + 0.08, bz + 0.005);
    const psb = iso(mx + mw - 0.1, my + 0.08, bz + 0.005);
    ctx.beginPath();
    ctx.moveTo(psa.x, psa.y);
    ctx.lineTo(psb.x, psb.y);
    ctx.stroke();
    // tiny heart on blanket
    const heart = iso(mx + mw - 0.35, my + md - 0.4, bz + 0.01);
    ctx.fillStyle = P.roseDeep;
    ctx.fillRect(heart.x - 2, heart.y, 1, 1);
    ctx.fillRect(heart.x, heart.y, 1, 1);
    ctx.fillRect(heart.x - 1, heart.y + 1, 1, 1);
  }

  function drawSofa(ctx) {
    const tx = 1.9, ty = 4.0, w = 2.2, d = 0.95, h = 0.35;
    // base
    isoBox(ctx, tx, ty, w, d, h, {
      top: P.cloth, front: P.clothShadow, right: P.clothShadow, outline: P.shadow,
    });
    // back rest
    isoBox(ctx, tx, ty, w, 0.22, h + 0.55, {
      top: P.cloth, front: P.cloth, right: P.clothShadow, outline: P.shadow,
    });
    // arm rests
    isoBox(ctx, tx, ty, 0.18, d, h + 0.2, {
      top: P.cloth, front: P.clothShadow, right: P.clothShadow, outline: P.shadow,
    });
    isoBox(ctx, tx + w - 0.18, ty, 0.18, d, h + 0.2, {
      top: P.cloth, front: P.clothShadow, right: P.clothShadow, outline: P.shadow,
    });
    // cushion seam
    ctx.strokeStyle = P.shadow;
    const s1a = iso(tx + w / 2, ty + 0.25, h);
    const s1b = iso(tx + w / 2, ty + d - 0.05, h);
    ctx.beginPath();
    ctx.moveTo(s1a.x, s1a.y);
    ctx.lineTo(s1b.x, s1b.y);
    ctx.stroke();
    // throw pillow
    isoBox(ctx, tx + 0.3, ty + 0.3, 0.35, 0.35, 0.18, {
      top: P.rose, front: P.roseDeep, right: P.roseDeep, outline: P.shadow,
    });
  }

  function drawCoffeeTable(ctx) {
    const tx = 2.6, ty = 3.4, w = 1.0, d = 0.55, h = 0.28;
    isoBox(ctx, tx, ty, w, d, h, {
      top: P.deskWood, front: P.deskWood2, right: P.deskWood2, outline: P.shadow,
    });
    // book
    poly(ctx, [
      iso(tx + 0.1, ty + 0.15, h),
      iso(tx + 0.45, ty + 0.15, h),
      iso(tx + 0.45, ty + 0.4, h),
      iso(tx + 0.1, ty + 0.4, h),
    ], P.bookA);
    // tea cup
    const cup = iso(tx + 0.7, ty + 0.3, h);
    fillRect(ctx, cup.x - 2, cup.y - 4, 4, 4, P.cream);
    fillRect(ctx, cup.x - 2, cup.y - 4, 4, 1, P.peach);
    fillRect(ctx, cup.x + 2, cup.y - 3, 1, 2, P.cream);
  }

  function drawPlant(ctx) {
    const tx = 6.0, ty = 4.1, w = 0.5, d = 0.45;
    // pot
    isoBox(ctx, tx, ty, w, d, 0.45, {
      top: P.shadow, front: P.plantPot, right: P.amberDeep, outline: P.shadow,
    });
    // soil
    poly(ctx, [
      iso(tx + 0.04, ty + 0.04, 0.45),
      iso(tx + w - 0.04, ty + 0.04, 0.45),
      iso(tx + w - 0.04, ty + d - 0.04, 0.45),
      iso(tx + 0.04, ty + d - 0.04, 0.45),
    ], '#3a2a1e');
    // leaves cluster
    const center = iso(tx + w / 2, ty + d / 2, 0.45);
    const leaves = [
      [-3, -10, 4, 7, P.plantLeaf],
      [0, -13, 3, 8, P.plantLeaf2],
      [-6, -8, 4, 6, P.sageDeep],
      [3, -8, 4, 7, P.plantLeaf2],
      [-1, -15, 2, 4, P.plantLeaf],
      [-7, -5, 3, 5, P.plantLeaf],
      [4, -4, 4, 4, P.sageDeep],
    ];
    for (const [dx, dy, lw, lh, c] of leaves) {
      ctx.fillStyle = c;
      ctx.fillRect(center.x + dx, center.y + dy, lw, lh);
      ctx.fillStyle = lighten(c, 0.18);
      ctx.fillRect(center.x + dx, center.y + dy, lw, 1);
    }
  }

  function drawKitchen(ctx) {
    const tx = 5.6, ty = 0.0, w = 1.3, d = 0.7, h = 0.7;
    // base cabinet
    isoBox(ctx, tx, ty, w, d, h, {
      top: P.cream, front: P.cream, right: P.creamSoft, outline: P.shadow,
    });
    // cabinet doors detail (front)
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
    // counter top stripe (slightly darker line at edge)
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
    // kettle
    isoBox(ctx, tx + 0.2, ty + 0.28, 0.22, 0.22, 0.28, {
      top: '#5a6c8a', front: '#5a6c8a', right: '#3d4f66', outline: P.shadow,
    });
    // spout
    const spout = iso(tx + 0.42, ty + 0.36, h + 0.18);
    fillRect(ctx, spout.x, spout.y - 2, 2, 1, '#3d4f66');
    // upper shelf with jars
    const sh_z = 1.7;
    poly(ctx, [
      iso(tx, 0, sh_z),
      iso(tx + w, 0, sh_z),
      iso(tx + w, 0, sh_z + 0.08),
      iso(tx, 0, sh_z + 0.08),
    ], P.deskWood);
    // jars
    const jars = [
      [0.15, P.bookB, 0.3],
      [0.35, P.sage,  0.4],
      [0.55, P.amberDeep, 0.32],
      [0.78, P.cream, 0.3],
      [0.98, P.bookA, 0.36],
    ];
    for (const [fx, c, jh] of jars) {
      const j = iso(tx + fx, 0, sh_z + 0.08);
      fillRect(ctx, j.x - 1, j.y - jh * TH, 3, jh * TH, c);
      fillRect(ctx, j.x - 1, j.y - jh * TH, 3, 1, lighten(c, 0.3));
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
    // pattern stripes (along ty)
    ctx.strokeStyle = lerpColor(P.rugA, P.rugB, 0.5);
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const t = i / 5;
      const a = iso(tx + t * w, ty, z + 0.001);
      const b = iso(tx + t * w, ty + d, z + 0.001);
      ctx.beginPath();
      ctx.moveTo(a.x + 0.5, a.y);
      ctx.lineTo(b.x + 0.5, b.y);
      ctx.stroke();
    }
    // central diamond accent
    const cx = tx + w / 2, cy = ty + d / 2;
    poly(ctx, [
      iso(cx - 0.5, cy, z + 0.002),
      iso(cx, cy - 0.4, z + 0.002),
      iso(cx + 0.5, cy, z + 0.002),
      iso(cx, cy + 0.4, z + 0.002),
    ], P.rugB);
    poly(ctx, [
      iso(cx - 0.25, cy, z + 0.003),
      iso(cx, cy - 0.2, z + 0.003),
      iso(cx + 0.25, cy, z + 0.003),
      iso(cx, cy + 0.2, z + 0.003),
    ], P.cream);
  }

  function drawDoor(ctx) {
    const ty1 = 4.0, ty2 = 4.85, z1 = 0, z2 = 2.2;
    // frame
    poly(ctx, [
      iso(0, ty1 - 0.05, z1),
      iso(0, ty2 + 0.05, z1),
      iso(0, ty2 + 0.05, z2 + 0.1),
      iso(0, ty1 - 0.05, z2 + 0.1),
    ], P.deskWood2);
    // door panel
    poly(ctx, [
      iso(0, ty1, z1),
      iso(0, ty2, z1),
      iso(0, ty2, z2),
      iso(0, ty1, z2),
    ], P.amberDeep);
    // panel inset
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
    // door mat in front of door
    poly(ctx, [
      iso(0.05, ty1 - 0.05, 0.005),
      iso(0.65, ty1 - 0.05, 0.005),
      iso(0.65, ty2 + 0.05, 0.005),
      iso(0.05, ty2 + 0.05, 0.005),
    ], P.rugB, P.shadow);
  }

  // ─── CHARACTER ─────────────────────────────────────────────
  function drawCharacter(ctx, sx, sy, pose, frame, facing, mood) {
    sx = Math.floor(sx); sy = Math.floor(sy);
    const f = facing >= 0 ? 1 : -1;

    // ground shadow
    if (pose !== 'sleep') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
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
    // legs (4 px tall)
    fillRect(ctx, x - 2, y - 5, 2, 5, P.pants);
    fillRect(ctx, x,     y - 5, 2, 5, P.pants);
    fillRect(ctx, x - 2, y - 1, 2, 1, P.shoe);
    fillRect(ctx, x,     y - 1, 2, 1, P.shoe);
    // body — cozy oversized cream sweater
    fillRect(ctx, x - 3, y - 12, 6, 7, P.cloth);
    fillRect(ctx, x - 3, y - 6,  6, 1, P.clothShadow);
    fillRect(ctx, x - 3, y - 12, 6, 1, P.clothShadow); // collar
    // head
    fillRect(ctx, x - 3, y - 18, 6, 6, P.skin);
    fillRect(ctx, x - 3, y - 13, 6, 1, P.skinShadow);
    // hair (rose) — frame the face
    fillRect(ctx, x - 4, y - 19, 8, 4, P.hair);
    fillRect(ctx, x - 4, y - 19, 8, 1, P.hairLight);
    fillRect(ctx, x - 4, y - 16, 1, 3, P.hair);
    fillRect(ctx, x + 3, y - 16, 1, 3, P.hair);
    // bow accent on hair (right side if facing right)
    if (f > 0) {
      fillRect(ctx, x + 2, y - 19, 2, 1, P.roseDeep);
      fillRect(ctx, x + 1, y - 20, 1, 1, P.roseDeep);
    } else {
      fillRect(ctx, x - 3, y - 19, 2, 1, P.roseDeep);
      fillRect(ctx, x + 1, y - 20, 1, 1, P.roseDeep);
    }
    // face
    drawFace(ctx, x, y - 16, f, mood);
  }

  function drawCharStand(ctx, x, y, frame, f, mood, mode) {
    const bob = (Math.floor(frame / 30) % 2) ? -1 : 0;
    y += bob;
    drawCharBody(ctx, x, y, f, mood, mode);
    // arms by mode
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
    // legs alternate
    if (phase === 0 || phase === 2) {
      fillRect(ctx, x - 2, y - 5, 2, 5, P.pants);
      fillRect(ctx, x,     y - 5, 2, 5, P.pants);
    } else {
      fillRect(ctx, x - 2, y - 6, 2, 4, P.pants);
      fillRect(ctx, x,     y - 4, 2, 4, P.pants);
    }
    fillRect(ctx, x - 2, y - 1, 2, 1, P.shoe);
    fillRect(ctx, x,     y - 1, 2, 1, P.shoe);
    // body
    fillRect(ctx, x - 3, y - 12, 6, 7, P.cloth);
    fillRect(ctx, x - 3, y - 6, 6, 1, P.clothShadow);
    fillRect(ctx, x - 3, y - 12, 6, 1, P.clothShadow);
    // arms swing
    const ao = (phase % 2 === 0) ? 0 : 1;
    fillRect(ctx, x - 4, y - 11 + ao, 2, 5, P.cloth);
    fillRect(ctx, x + 2, y - 11 + (1 - ao), 2, 5, P.cloth);
    // head/hair
    fillRect(ctx, x - 3, y - 18, 6, 6, P.skin);
    fillRect(ctx, x - 3, y - 13, 6, 1, P.skinShadow);
    fillRect(ctx, x - 4, y - 19, 8, 4, P.hair);
    fillRect(ctx, x - 4, y - 19, 8, 1, P.hairLight);
    fillRect(ctx, x - 4, y - 16, 1, 3, P.hair);
    fillRect(ctx, x + 3, y - 16, 1, 3, P.hair);
    if (f > 0) {
      fillRect(ctx, x + 2, y - 19, 2, 1, P.roseDeep);
    } else {
      fillRect(ctx, x - 3, y - 19, 2, 1, P.roseDeep);
    }
    drawFace(ctx, x, y - 16, f, mood);
  }

  function drawCharSit(ctx, x, y, frame, f, mood) {
    // sitting on sofa — bottom slightly lower, legs forward
    fillRect(ctx, x - 3, y - 4, 6, 4, P.pants);
    fillRect(ctx, x - 3, y - 1, 6, 1, P.shoe);
    fillRect(ctx, x - 3, y - 11, 6, 7, P.cloth);
    fillRect(ctx, x - 3, y - 5, 6, 1, P.clothShadow);
    fillRect(ctx, x - 4, y - 10, 2, 5, P.cloth);
    fillRect(ctx, x + 2, y - 10, 2, 5, P.cloth);
    fillRect(ctx, x - 3, y - 17, 6, 6, P.skin);
    fillRect(ctx, x - 3, y - 12, 6, 1, P.skinShadow);
    fillRect(ctx, x - 4, y - 18, 8, 4, P.hair);
    fillRect(ctx, x - 4, y - 18, 8, 1, P.hairLight);
    fillRect(ctx, x - 4, y - 15, 1, 3, P.hair);
    fillRect(ctx, x + 3, y - 15, 1, 3, P.hair);
    drawFace(ctx, x, y - 15, f, mood);
  }

  function drawCharSitDesk(ctx, x, y, frame, mood, sub = '') {
    // BACK to camera, sitting at desk; we see hair + back of sweater
    // body
    fillRect(ctx, x - 4, y - 13, 8, 8, P.cloth);
    fillRect(ctx, x - 4, y - 13, 8, 1, P.creamSoft);
    fillRect(ctx, x - 4, y - 6,  8, 1, P.clothShadow);
    // arms
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
    // head from BEHIND — mostly hair, side ears
    fillRect(ctx, x - 4, y - 20, 8, 7, P.hair);
    fillRect(ctx, x - 4, y - 20, 8, 1, P.hairLight);
    fillRect(ctx, x - 4, y - 16, 1, 3, P.skin);
    fillRect(ctx, x + 3, y - 16, 1, 3, P.skin);
    // pony tail bump
    fillRect(ctx, x - 1, y - 21, 2, 2, P.hair);
    fillRect(ctx, x - 1, y - 21, 2, 1, P.hairLight);
    // bow
    fillRect(ctx, x - 1, y - 22, 2, 1, P.roseDeep);
  }

  function drawCharSleep(ctx, frame) {
    // pose drawn at fixed iso position on the bed
    const headPos = iso(1.4, 2.45, 0.65);
    const footPos = iso(0.4, 3.7, 0.65);
    // body under blanket — slope from head to foot
    const steps = 9;
    for (let s = 1; s < steps; s++) {
      const t = s / (steps - 1);
      const cx = Math.round(headPos.x + (footPos.x - headPos.x) * t);
      const cy = Math.round(headPos.y + (footPos.y - headPos.y) * t);
      fillRect(ctx, cx - 5, cy - 1, 12, 4, P.blanket);
      if (s === 1) fillRect(ctx, cx - 5, cy - 1, 12, 1, P.blanket2);
    }
    // pillow head zone — character face
    fillRect(ctx, headPos.x - 4, headPos.y - 7, 9, 6, P.skin);
    fillRect(ctx, headPos.x - 5, headPos.y - 8, 11, 4, P.hair);
    fillRect(ctx, headPos.x - 5, headPos.y - 8, 11, 1, P.hairLight);
    // closed eyes
    fillRect(ctx, headPos.x - 1, headPos.y - 4, 1, 1, P.ink);
    fillRect(ctx, headPos.x + 2, headPos.y - 4, 1, 1, P.ink);
    // mouth small
    fillRect(ctx, headPos.x, headPos.y - 2, 1, 1, P.shadow);
    // zzz floating
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
    // body bent forward
    fillRect(ctx, x - 3, y - 11, 6, 6, P.cloth);
    fillRect(ctx, x - 3, y - 6, 6, 1, P.clothShadow);
    // head down
    fillRect(ctx, x - 3, y - 16, 6, 5, P.skin);
    fillRect(ctx, x - 4, y - 17, 8, 4, P.hair);
    fillRect(ctx, x - 4, y - 17, 8, 1, P.hairLight);
    // arms forward
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
    const eyeY = y;
    const lx = f > 0 ? x - 2 : x - 1;
    const rx = f > 0 ? x + 1 : x + 2;
    // cheeks
    fillRect(ctx, lx, eyeY + 1, 1, 1, 'rgba(232, 163, 163, 0.7)');
    fillRect(ctx, rx, eyeY + 1, 1, 1, 'rgba(232, 163, 163, 0.7)');
    // eyes by mood
    if (mood === 'tired' || mood === 'sleepy') {
      fillRect(ctx, lx, eyeY, 1, 1, P.ink);
      fillRect(ctx, rx, eyeY, 1, 1, P.ink);
    } else if (mood === 'stressed') {
      fillRect(ctx, lx, eyeY - 1, 1, 1, P.ink);
      fillRect(ctx, rx, eyeY - 1, 1, 1, P.ink);
      fillRect(ctx, x, y + 2, 1, 1, P.shadow);
    } else if (mood === 'happy') {
      fillRect(ctx, lx, eyeY, 1, 1, P.ink);
      fillRect(ctx, rx, eyeY, 1, 1, P.ink);
      fillRect(ctx, x - 1, y + 2, 3, 1, P.roseDeep);
    } else if (mood === 'lonely' || mood === 'sad') {
      fillRect(ctx, lx, eyeY, 1, 1, P.ink);
      fillRect(ctx, rx, eyeY, 1, 1, P.ink);
      fillRect(ctx, x, y + 2, 1, 1, P.shadow);
    } else if (mood === 'inspired') {
      fillRect(ctx, lx, eyeY, 1, 1, P.ink);
      fillRect(ctx, rx, eyeY, 1, 1, P.ink);
      fillRect(ctx, lx, eyeY - 1, 1, 1, P.cream);
    } else {
      fillRect(ctx, lx, eyeY, 1, 1, P.ink);
      fillRect(ctx, rx, eyeY, 1, 1, P.ink);
      fillRect(ctx, x, y + 2, 1, 1, P.roseDeep);
    }
  }

  // ─── ATMOSPHERE ────────────────────────────────────────────
  function drawDustMotes(ctx, time) {
    ctx.fillStyle = 'rgba(255, 217, 183, 0.5)';
    for (let i = 0; i < 12; i++) {
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
    // window light beam during day
    if (hour >= 8 && hour < 17 && (weather === 'clear' || weather === 'cloudy')) {
      const win = iso(4.9, 0.5, 2.4);
      const beam = ctx.createLinearGradient(win.x, win.y, win.x - 50, win.y + 90);
      beam.addColorStop(0, 'rgba(255, 220, 160, 0.20)');
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
    // desk lamp glow at night
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
    // iso helpers
    iso,
    TILE_W: TW, TILE_H: TH, ROOM_W, ROOM_D, WALL_H,
    // pieces
    drawWall, drawFloor, drawWindow, drawWallDecor, drawStringLights,
    drawBookshelf, drawDesk, drawChair, drawBed, drawSofa,
    drawCoffeeTable, drawPlant, drawKitchen, drawRug, drawDoor,
    drawCharacter,
    // atmosphere
    drawDustMotes, drawRain, drawSnow, drawLightingOverlay,
    // color helpers
    fillRect, lerpColor, clamp,
  };
})();

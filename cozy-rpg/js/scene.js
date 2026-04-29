/* The animated diorama — hero walks, fights, loots in a parallax pixel scene. */

window.Scene = (function () {
  let canvas, ctx, W, H;
  let lastTime = 0, time = 0;
  let particles = [];
  let damageTexts = [];
  let lootTexts = [];
  let heroX = 60, heroY = 0;     // y is set after init
  let heroFacing = 1;
  let monsterX = 0, monsterY = 0;
  let monsterAlpha = 0;
  let monsterShake = 0;
  let weatherDrops = [];

  function init(canvasEl) {
    canvas = canvasEl;
    W = canvas.width; H = canvas.height;
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    heroY = H - 36;
    monsterY = H - 26;
    requestAnimationFrame(loop);
  }

  function loop(t) {
    if (!lastTime) lastTime = t;
    const dt = Math.min(0.05, (t - lastTime) / 1000);
    lastTime = t; time += dt;
    render(dt);
    requestAnimationFrame(loop);
  }

  function getZone() {
    const game = window.Game.state;
    return window.GameData.ZONES.find(z => z.id === game.zoneId) || window.GameData.ZONES[0];
  }

  function render(dt) {
    const game = window.Game.state;
    const zone = getZone();
    const action = game.action || "walking";
    const pal = zone.palette;

    /* ─── sky ─── */
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, pal.sky[0]);
    sky.addColorStop(1, pal.sky[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    /* ─── time-of-day tint ─── */
    const dayPhase = (game.tick % 1200) / 1200; // 0..1
    let tintAlpha = 0, tintColor = "0,0,0";
    if (dayPhase < 0.15) { tintAlpha = (0.15-dayPhase) * 1.2; tintColor = "30,15,40"; }      // dawn
    else if (dayPhase > 0.7 && dayPhase < 0.9) { tintAlpha = (dayPhase-0.7) * 1.2; tintColor = "60,30,80"; } // dusk
    else if (dayPhase >= 0.9) { tintAlpha = 0.45; tintColor = "20,15,40"; }                  // night

    /* ─── sun / moon ─── */
    const sunX = W * 0.85;
    const sunY = 30 + Math.sin(time*0.05) * 4;
    if (dayPhase < 0.85) {
      ctx.fillStyle = pal.accent;
      ctx.beginPath(); ctx.arc(sunX, sunY, 8, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.arc(sunX, sunY, 14, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      // moon + stars
      ctx.fillStyle = "#f4e3c0";
      ctx.beginPath(); ctx.arc(sunX, sunY, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#0a0814";
      ctx.beginPath(); ctx.arc(sunX-3, sunY-1, 6, 0, Math.PI*2); ctx.fill();
      for (let i=0; i<14; i++) {
        const sx = (i*53) % W, sy = (i*31) % 60 + 10;
        if (Math.sin(time + i) > 0.4) {
          ctx.fillStyle = "rgba(255,240,180," + (0.4 + Math.sin(time*2+i)*0.3) + ")";
          ctx.fillRect(sx, sy, 1, 1);
        }
      }
    }

    /* ─── parallax far hills ─── */
    const farX = (time * 8) % W;
    drawHills(pal.hills[0], H * 0.55, 18, farX*0.2, time*0.04);

    /* ─── parallax near hills ─── */
    drawHills(pal.hills[1], H * 0.7, 12, time*0.4, time*0.08);

    /* ─── ground ─── */
    ctx.fillStyle = pal.grass;
    ctx.fillRect(0, H-22, W, 22);
    // grass texture lines
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let x = 0; x < W; x += 4) {
      const gh = 1 + ((x*7+time*30)|0) % 3;
      ctx.fillRect(x, H-22, 1, gh);
    }
    // soft path tint under hero
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(0, H-6, W, 6);

    /* ─── props (parallax) ─── */
    drawProps(zone, dt);

    /* ─── weather ─── */
    drawWeather(zone, dt);

    /* ─── monster (now 3× scale for combat visibility) ─── */
    if (game.combat && monsterAlpha > 0.05) {
      const monKey = game.combat.monsterId;
      const sprite = window.Sprites.monster(monKey);
      const flying = window.GameData.MONSTERS[monKey] && window.GameData.MONSTERS[monKey].wings;
      const monScale = window.GameData.MONSTERS[monKey] && window.GameData.MONSTERS[monKey].boss ? 3 : 3;
      const monH = sprite.height * monScale;
      const monW = sprite.width  * monScale;
      const my = flying ? H - 60 - Math.sin(time*4)*4 : H - 22 - monH;
      const sx = monsterShake > 0 ? (Math.random()-0.5) * 5 : 0;
      ctx.globalAlpha = monsterAlpha;
      ctx.save();
      ctx.translate(monsterX + sx, my);
      ctx.scale(-monScale, monScale);  // facing left
      ctx.translate(-sprite.width, 0);
      ctx.drawImage(sprite, 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;
      // monster shadow
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath(); ctx.ellipse(monsterX, H-20, monW*0.5, 4, 0, 0, Math.PI*2); ctx.fill();
      // ★ Monster HP bar floating above its head
      drawHpBar(ctx,
        monsterX - monW * 0.5,
        my - 12,
        monW,
        game.combat.hp / game.combat.maxHp,
        game.combat.name,
        "#d04a4a"
      );
    }

    /* ─── hero ─── */
    // 4-frame walk; freeze on frame 0 when not walking
    const isMoving = (game.action === "walking" || game.action === "fighting") && !game.combat;
    const frame = isMoving ? ((time * 7) | 0) % 4 : 0;
    const heroSprite = window.Sprites.hero(frame);
    const hh = heroSprite.height * 2;
    // Subtle bob on frames 0 and 2 (idle bob effect)
    const bob = isMoving && (frame === 0 || frame === 2) ? -1 : 0;
    // Top of sprite at heroY; feet extend to heroY + hh (size-agnostic)
    const hx = heroX, hy = heroY + bob;
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath(); ctx.ellipse(hx + 16, hy + hh - 2, 14, 3, 0, 0, Math.PI*2); ctx.fill();
    ctx.save();
    if (heroFacing < 0) {
      ctx.translate(hx + heroSprite.width*2, hy);
      ctx.scale(-2, 2);
      ctx.drawImage(heroSprite, 0, 0);
    } else {
      ctx.translate(hx, hy);
      ctx.scale(2, 2);
      ctx.drawImage(heroSprite, 0, 0);
    }
    ctx.restore();

    /* ─── lantern halo ─── */
    const lx = hx + (heroFacing > 0 ? 30 : 4);
    const ly = hy + 18;
    const halo = ctx.createRadialGradient(lx, ly, 2, lx, ly, 60);
    halo.addColorStop(0, "rgba(255,200,110,0.65)");
    halo.addColorStop(0.5, "rgba(255,180,80,0.18)");
    halo.addColorStop(1, "rgba(255,180,80,0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(lx, ly, 60, 0, Math.PI*2); ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    /* ★ Hero HP bar floating above the head during combat */
    if (game.combat) {
      const hpFrac = Math.max(0, game.hp / game.maxHp);
      drawHpBar(ctx,
        hx - 4,                         // align over hero
        hy - 14,
        heroSprite.width * 2 + 8,
        hpFrac,
        game.name || "Ember",
        "#54d27a"
      );
    }

    /* ─── damage / loot text ─── */
    for (let i = damageTexts.length - 1; i >= 0; i--) {
      const d = damageTexts[i];
      d.life -= dt;
      d.y -= 30 * dt;
      d.x += d.vx * dt;
      if (d.life <= 0) damageTexts.splice(i, 1);
      else {
        ctx.font = `bold ${d.crit ? 22 : 16}px "VT323", monospace`;
        ctx.textAlign = "center";
        ctx.fillStyle = d.color;
        ctx.globalAlpha = Math.min(1, d.life * 1.5);
        ctx.fillText(d.text, d.x, d.y);
        ctx.globalAlpha = 1;
      }
    }
    for (let i = lootTexts.length - 1; i >= 0; i--) {
      const d = lootTexts[i];
      d.life -= dt;
      d.y -= 14 * dt;
      if (d.life <= 0) lootTexts.splice(i, 1);
      else {
        ctx.font = `14px "VT323", monospace`;
        ctx.textAlign = "left";
        ctx.fillStyle = d.color;
        ctx.globalAlpha = Math.min(1, d.life * 0.7);
        ctx.fillText(d.text, d.x, d.y);
        ctx.globalAlpha = 1;
      }
    }

    /* ─── particles ─── */
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.life <= 0) particles.splice(i, 1);
      else {
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x | 0, p.y | 0, p.size, p.size);
        ctx.globalAlpha = 1;
      }
    }

    /* ─── tint overlay ─── */
    if (tintAlpha > 0) {
      ctx.fillStyle = `rgba(${tintColor},${tintAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    /* ─── vignette inside frame ─── */
    const vg = ctx.createRadialGradient(W/2, H/2, W*0.3, W/2, H/2, W*0.7);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    /* ─── update monster shake ─── */
    if (monsterShake > 0) monsterShake -= dt * 8;

    /* ─── update action animations ─── */
    if (action === "walking") {
      heroX += 18 * heroFacing * dt;
      if (heroX > W - 80) { heroFacing = -1; }
      if (heroX < 40)     { heroFacing = 1; }
    } else if (action === "fighting") {
      // hero bobs slightly toward monster
      const target = Math.min(monsterX - 60, W - 100);
      heroX += (target - heroX) * dt * 4;
      heroFacing = monsterX > heroX ? 1 : -1;
      monsterAlpha = Math.min(1, monsterAlpha + dt * 3);
    } else if (action === "looting") {
      heroX += (W*0.5 - heroX) * dt * 3;
      monsterAlpha = Math.max(0, monsterAlpha - dt * 2);
    } else if (action === "resting" || action === "returning") {
      heroX += (40 - heroX) * dt * 1.5;
      heroFacing = 1;
    }
  }

  /* Floating combat HP bar — name + bordered fill, bright and readable.
     x, y: top-left of the bar. Width auto-clamped to a min size. */
  function drawHpBar(ctx, x, y, w, frac, label, color) {
    w = Math.max(48, w);
    const h = 6;
    frac = Math.max(0, Math.min(1, frac));

    // Drop shadow
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x, y + 1, w, h);

    // Black outline
    ctx.fillStyle = "#1a1010";
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);

    // Empty track
    ctx.fillStyle = "#2a1810";
    ctx.fillRect(x, y, w, h);

    // Filled portion
    if (frac > 0) {
      const fw = Math.max(2, Math.floor(w * frac));
      // base
      ctx.fillStyle = color;
      ctx.fillRect(x, y, fw, h);
      // shine highlight (top half)
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fillRect(x, y, fw, 2);
      // shadow (bottom)
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(x, y + h - 1, fw, 1);
    }

    // Label above the bar
    if (label) {
      ctx.font = "bold 12px \"VT323\", monospace";
      ctx.textAlign = "center";
      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.fillText(label, x + w/2 + 1, y - 3 + 1);
      // main
      ctx.fillStyle = "#ffe6b0";
      ctx.fillText(label, x + w/2, y - 3);
    }
  }

  function drawHills(color, baseY, amp, offset, phase) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let x = 0; x <= W; x += 4) {
      const y = baseY - Math.sin((x + offset) * 0.012 + phase) * amp - amp * 0.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
  }

  function drawProps(zone, dt) {
    // place 5 deterministic props per zone
    const props = zone.props || ["tree-sm","rock-sm"];
    for (let i = 0; i < 6; i++) {
      const propKey = props[i % props.length];
      const offset = (i * 137) % W;
      const x = (offset - (time * 15) % W + W) % W;
      const baseY = H - 22;
      let s, scale = 2;
      if (propKey === "tree-sm")     s = window.Sprites.tree(false);
      else if (propKey === "tree-tall") { s = window.Sprites.tree(true); scale = 3; }
      else if (propKey === "rock-sm") s = window.Sprites.rock();
      else if (propKey === "crystal") s = window.Sprites.crystal(false);
      else if (propKey === "crystal-tall") { s = window.Sprites.crystal(true); scale = 3; }
      else if (propKey === "mushroom") s = window.Sprites.mushroom();
      else if (propKey === "flower")   s = window.Sprites.flower();
      else if (propKey === "pillar" || propKey === "statue" || propKey === "rune-stone" || propKey === "brazier" || propKey === "arch") { s = window.Sprites.pillar(); scale = 3; }
      else if (propKey === "stump")   s = window.Sprites.rock();
      else continue;
      const px = x;
      const py = baseY - s.height * scale;
      ctx.drawImage(s, 0, 0, s.width, s.height, px, py, s.width * scale, s.height * scale);
    }
  }

  function drawWeather(zone, dt) {
    const w = (zone.weather && zone.weather[Math.floor((time/8) % zone.weather.length)]) || "sunny";
    if (w === "rainy" || w === "stormy") {
      while (weatherDrops.length < 80) weatherDrops.push({ x: Math.random()*W, y: Math.random()*H, v: 220 + Math.random()*120 });
      ctx.strokeStyle = "rgba(180,200,230,0.45)";
      ctx.lineWidth = 1;
      for (const d of weatherDrops) {
        d.y += d.v * dt;
        d.x -= 30 * dt;
        if (d.y > H) { d.y = -4; d.x = Math.random()*W; }
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x-2, d.y+5); ctx.stroke();
      }
      if (w === "stormy" && Math.random() < 0.005) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillRect(0, 0, W, H);
      }
    } else {
      weatherDrops.length = 0;
    }
  }

  /* ─── public events ─── */
  function spawnMonster(monId) {
    monsterX = W - 90;
    monsterAlpha = 0.05;
    monsterShake = 0;
  }
  function despawnMonster() {
    monsterAlpha = 0;
  }
  function showDamage(num, opts={}) {
    damageTexts.push({
      x: monsterX + (Math.random()-0.5)*16,
      y: H - 60 - Math.random()*10,
      vx: (Math.random()-0.5)*40,
      life: 1.0,
      text: opts.miss ? "miss" : (opts.heal ? `+${num}` : num + ""),
      color: opts.heal ? "#5a7a4f" : opts.crit ? "#ffe0a3" : "#ffd0a0",
      crit: opts.crit
    });
    monsterShake = 0.3;
    if (opts.crit) {
      for (let i = 0; i < 12; i++) {
        particles.push({
          x: monsterX, y: H-50,
          vx: (Math.random()-0.5) * 120,
          vy: -50 - Math.random()*60,
          g: 200, life: 0.6,
          size: 2,
          color: ["#ffe0a3","#d97842","#c89b3c"][i%3]
        });
      }
    }
  }
  function showHeroDamage(num) {
    damageTexts.push({
      x: heroX + 18,
      y: heroY - 30,
      vx: 0,
      life: 0.9,
      text: num + "",
      color: "#d04a6e",
      crit: false
    });
  }
  function showLoot(text, color) {
    lootTexts.push({
      x: heroX + 32,
      y: H - 80 - lootTexts.length * 14,
      life: 1.6,
      text,
      color: color || "#c89b3c",
    });
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: heroX + 18, y: H-30,
        vx: (Math.random()-0.5) * 80,
        vy: -120 - Math.random()*40,
        g: 220, life: 0.8,
        size: 2,
        color: color || "#c89b3c",
      });
    }
  }
  function levelUpBurst() {
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: heroX + 16, y: heroY - 8,
        vx: (Math.random()-0.5) * 200,
        vy: -100 - Math.random()*150,
        g: 200, life: 1.4,
        size: 2 + Math.floor(Math.random()*2),
        color: ["#ffe0a3","#f3c963","#d97842","#fff"][Math.floor(Math.random()*4)],
      });
    }
  }

  return { init, spawnMonster, despawnMonster, showDamage, showHeroDamage, showLoot, levelUpBurst };
})();

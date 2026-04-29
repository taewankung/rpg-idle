// ─── room.js ───────────────────────────────────────────────
// Render orchestration for the iso scene with depth sort.

(function () {
  // Static furniture entries with depth keys (back-to-front).
  // Depth = y-screen of the front edge — higher value draws later.
  function staticItems() {
    return [
      { z: 0.5,  draw: window.SPR.drawBookshelf },
      { z: 0.85, draw: window.SPR.drawDesk },
      { z: 0.85, draw: window.SPR.drawKitchen },
      { z: 1.78, draw: window.SPR.drawChair },
      { z: 3.95, draw: window.SPR.drawCoffeeTable },
      { z: 3.95, draw: window.SPR.drawBed },
      { z: 4.95, draw: window.SPR.drawSofa },
      { z: 4.55, draw: window.SPR.drawPlant },
    ];
  }

  function characterDepth() {
    const c = window.CHAR.state;
    // poses anchored to a piece use that piece's depth so they layer correctly
    if (c.pose === 'sleep')    return 4.0;   // on top of bed
    if (c.pose === 'sit_desk' ||
        c.pose === 'work' ||
        c.pose === 'paint')    return 1.85;  // just behind chair front
    return c.ty + 0.2;
  }

  function render(ctx) {
    const hour    = window.TIME.getHourInt();
    const weather = window.TIME.state.weather;

    // background canvas tint matching exterior light
    const tint = exteriorAmbient(hour, weather);
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, 320, 180);

    // 1. walls
    window.SPR.drawWall(ctx, hour, weather);
    // 2. cut window into back wall
    window.SPR.drawWindow(ctx, hour, weather);
    // 3. wall decor
    window.SPR.drawWallDecor(ctx);
    // 4. floor
    window.SPR.drawFloor(ctx);
    // 5. rug
    window.SPR.drawRug(ctx);
    // 6. door (on left wall)
    window.SPR.drawDoor(ctx);

    // 7. depth-sorted furniture + character
    const items = staticItems();
    items.push({
      z: characterDepth(),
      draw: window.CHAR.render,
    });
    items.sort((a, b) => a.z - b.z);
    for (const it of items) it.draw(ctx);

    // 8. string lights (always on top of back wall + character heads OK)
    window.SPR.drawStringLights(ctx, hour);
  }

  function renderAfterCharacter(ctx) {
    const hour    = window.TIME.getHourInt();
    const weather = window.TIME.state.weather;
    const t       = window.gameTime.totalGameSeconds;

    if (hour >= 7 && hour < 17 && weather === 'clear') {
      window.SPR.drawDustMotes(ctx, t);
    }
    if (weather === 'rain') window.SPR.drawRain(ctx, t);
    if (weather === 'snow') window.SPR.drawSnow(ctx, t);

    window.SPR.drawLightingOverlay(ctx, hour, weather);
  }

  function exteriorAmbient(hour, weather) {
    // a bg color barely visible behind walls but it sets the canvas tone
    if (hour >= 19 || hour < 6) return '#1c1828';
    if (weather === 'rain' || weather === 'snow') return '#3a4050';
    return '#2a2231';
  }

  window.ROOM = { render, renderAfterCharacter };
})();

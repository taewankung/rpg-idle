// ─── room.js ───────────────────────────────────────────────
// Renders the room: background, all furniture, weather overlay, lighting.

(function () {
  function render(ctx) {
    const hour = window.TIME.getHourInt();
    const weather = window.TIME.state.weather;

    // base layers
    window.SPR.drawWall(ctx);
    window.SPR.drawWallDecor(ctx);
    window.SPR.drawWindow(ctx, hour, weather);
    window.SPR.drawDoor(ctx);
    window.SPR.drawFloor(ctx);
    window.SPR.drawRug(ctx);

    // furniture (back to front roughly)
    window.SPR.drawBookshelf(ctx);
    window.SPR.drawDesk(ctx);
    window.SPR.drawBed(ctx);
    window.SPR.drawPlant(ctx);
    window.SPR.drawKitchen(ctx);
  }

  function renderAfterCharacter(ctx) {
    const hour = window.TIME.getHourInt();
    const weather = window.TIME.state.weather;
    const t = window.gameTime.totalGameSeconds;

    // ambient particles in foreground
    if (hour >= 7 && hour < 17 && weather === 'clear') {
      window.SPR.drawDustMotes(ctx, t);
    }
    if (weather === 'rain') window.SPR.drawRain(ctx, t);
    if (weather === 'snow') window.SPR.drawSnow(ctx, t);

    // lighting overlay (last, so it tints everything)
    window.SPR.drawLightingOverlay(ctx, hour, weather);
  }

  window.ROOM = { render, renderAfterCharacter };
})();

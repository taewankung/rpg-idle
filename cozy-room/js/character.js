// ─── character.js ──────────────────────────────────────────
// Tile-coord character. Movement in (tx, ty) tile space.
// Screen position is projected each frame via SPR.iso().

(function () {
  const CFG = window.CFG;

  const state = {
    tx: 3.5, ty: 2.7,
    targetTx: 3.5, targetTy: 2.7,
    facing: 1,                // +1 = looking down-right (SE), -1 = down-left (SW)
    pose: 'idle',
    frame: 0,
    speed: 1.6,               // tiles per second
    screenX: 0, screenY: 0,
  };

  const MIN_TX = 0.6, MIN_TY = 0.6;
  const MAX_TX = (CFG.ROOM_W - 0.4);
  const MAX_TY = (CFG.ROOM_D - 0.3);

  function clampTx(v) { return Math.max(MIN_TX, Math.min(MAX_TX, v)); }
  function clampTy(v) { return Math.max(MIN_TY, Math.min(MAX_TY, v)); }

  function moveTo(tx, ty) {
    state.targetTx = tx;
    state.targetTy = ty;
    if (tx > state.tx + 0.05) state.facing = 1;
    else if (tx < state.tx - 0.05) state.facing = -1;
  }

  function poseForActivity(key, target) {
    if (!key) return 'idle';
    if (key === 'sleep') return 'sleep';
    if (key === 'work')  return 'work';
    if (key === 'paint') return 'paint';
    if (key === 'eat')   return 'eat';
    if (key === 'read')  return 'read';
    if (key === 'window' || key === 'idle_window') return 'window';
    if (key === 'water'  || key === 'idle_water')  return 'water';
    if (key === 'clean') return 'clean';
    if (key === 'exercise') return 'stretch';
    if (key === 'bathe') return 'idle';
    if (key === 'idle_sit'  ) return target === 'chair' ? 'sit_desk' : 'sit';
    if (key === 'idle_phone') return 'sit';
    if (key === 'idle_wander') return 'walk';
    return 'idle';
  }

  function update(realDtSeconds, speed = 1) {
    state.frame += realDtSeconds * 60 * speed;
    const dt = realDtSeconds * speed;

    const cur = window.ACT.state.current;

    // 1) decide where to walk
    let goalTx = null, goalTy = null;
    if (cur && cur.target) {
      const pos = CFG.POS[cur.target];
      if (pos) {
        goalTx = pos.faceTx ?? pos.tx;
        goalTy = pos.faceTy ?? pos.ty;
      }
    } else if (cur && cur.key === 'idle_wander') {
      // pick a new wander spot once we arrive
      const dx = state.targetTx - state.tx;
      const dy = state.targetTy - state.ty;
      if (Math.hypot(dx, dy) < 0.2) {
        state.targetTx = clampTx(1.2 + Math.random() * (CFG.ROOM_W - 2.0));
        state.targetTy = clampTy(2.0 + Math.random() * (CFG.ROOM_D - 2.4));
      }
      goalTx = state.targetTx;
      goalTy = state.targetTy;
    }

    if (goalTx !== null) {
      moveTo(clampTx(goalTx), clampTy(goalTy));
    }

    // 2) walk toward target
    const dx = state.targetTx - state.tx;
    const dy = state.targetTy - state.ty;
    const dist = Math.hypot(dx, dy);
    const arrived = dist < 0.06;

    if (!arrived) {
      const step = state.speed * dt;
      if (step >= dist) {
        state.tx = state.targetTx;
        state.ty = state.targetTy;
      } else {
        state.tx += (dx / dist) * step;
        state.ty += (dy / dist) * step;
      }
    }

    // 3) decide pose
    if (cur && cur.target && !arrived) {
      state.pose = 'walk';
    } else if (cur) {
      state.pose = poseForActivity(cur.key, cur.target);
    } else {
      state.pose = 'idle';
    }

    // 4) project to screen
    const sp = window.SPR.iso(state.tx, state.ty);
    state.screenX = sp.x;
    state.screenY = sp.y;
  }

  function render(ctx) {
    const mood = window.STATS?.getMood?.() || 'normal';
    window.SPR.drawCharacter(
      ctx, state.screenX, state.screenY,
      state.pose, Math.floor(state.frame), state.facing, mood
    );
  }

  function serialize() {
    return {
      tx: state.tx, ty: state.ty,
      targetTx: state.targetTx, targetTy: state.targetTy,
      facing: state.facing, pose: state.pose,
    };
  }
  function deserialize(d) {
    if (!d) return;
    // accept legacy {x, y} screen-coord saves: drop them, restart at center
    if (d.tx !== undefined) state.tx = d.tx;
    if (d.ty !== undefined) state.ty = d.ty;
    state.targetTx = d.targetTx ?? state.tx;
    state.targetTy = d.targetTy ?? state.ty;
    state.facing   = d.facing ?? 1;
    state.pose     = d.pose   ?? 'idle';
  }

  window.CHAR = {
    state, moveTo, update, render,
    serialize, deserialize,
  };
})();

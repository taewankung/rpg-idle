// ─── character.js ──────────────────────────────────────────
// The little human in the room. Movement, pose, animation frame.

(function () {
  const CFG = window.CFG;

  const state = {
    x: 200, y: 192,         // anchor (top-left of sprite, feet at y+24)
    targetX: 200,
    facing: 1,              // +1 right, -1 left
    pose: 'idle',
    nextPose: null,
    frame: 0,
    speed: 22,              // px / sec
    blinking: false,
    moodOverride: null,
  };

  function setPose(p) {
    if (state.pose === p) return;
    state.pose = p;
  }

  function moveTo(x, snapInstant = false) {
    state.targetX = Math.floor(x);
    if (snapInstant) state.x = state.targetX;
    if (state.targetX > state.x) state.facing = 1;
    else if (state.targetX < state.x) state.facing = -1;
  }

  function update(realDtSeconds, speed = 1) {
    state.frame += realDtSeconds * 60 * speed;
    const dt = realDtSeconds * speed;

    const cur = window.ACT.state.current;

    // honor active activity: walk to target then assume pose
    if (cur && cur.target) {
      const tx = CFG.POS[cur.target]?.faceX ?? CFG.POS[cur.target]?.x ?? state.targetX;
      const ty = CFG.POS[cur.target]?.y ?? state.y;
      moveTo(tx);
      // y "snaps" gently to position y
      state.y += (ty - state.y) * Math.min(1, dt * 4);

      // walk vs final pose
      if (Math.abs(state.x - state.targetX) > 1) {
        setPose('walk');
      } else {
        setPose(cur.pose || 'idle');
        // sleep pose snaps onto bed coords (handled in sprite)
      }
    } else if (cur && !cur.target) {
      // idle without target (e.g., wander)
      if (cur.key === 'idle_wander') {
        if (Math.abs(state.x - state.targetX) < 2) {
          // pick a new wander spot
          const left  = CFG.ROOM_LEFT + 30;
          const right = CFG.ROOM_RIGHT - 30;
          state.targetX = Math.floor(left + Math.random() * (right - left));
          state.facing = state.targetX > state.x ? 1 : -1;
        }
        setPose('walk');
      } else {
        setPose(cur.pose || 'idle');
      }
    } else {
      // no activity, idle in place
      setPose('idle');
    }

    // physically move toward targetX
    if (Math.abs(state.x - state.targetX) > 0.5) {
      const dir = Math.sign(state.targetX - state.x);
      state.x += dir * state.speed * dt;
      if ((dir > 0 && state.x > state.targetX) ||
          (dir < 0 && state.x < state.targetX)) {
        state.x = state.targetX;
      }
    }

    // clamp inside room
    if (state.x < CFG.ROOM_LEFT) state.x = CFG.ROOM_LEFT;
    if (state.x > CFG.ROOM_RIGHT) state.x = CFG.ROOM_RIGHT;
  }

  function render(ctx) {
    const mood = state.moodOverride || (window.STATS?.getMood() || 'normal');
    window.SPR.drawCharacter(
      ctx,
      state.x - 4,            // center-anchor adjust
      state.y - 24,           // y is feet baseline; sprite is 26 tall
      state.pose,
      Math.floor(state.frame),
      state.facing,
      mood
    );
  }

  function serialize() {
    return {
      x: state.x, targetX: state.targetX,
      facing: state.facing, pose: state.pose,
    };
  }
  function deserialize(d) {
    if (!d) return;
    state.x       = d.x ?? state.x;
    state.targetX = d.targetX ?? state.x;
    state.facing  = d.facing ?? 1;
    state.pose    = d.pose   ?? 'idle';
  }

  window.CHAR = {
    state, setPose, moveTo, update, render,
    serialize, deserialize,
  };
})();

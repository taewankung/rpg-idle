/* Pixel-art sprite generators — refined edition.
   Every sprite uses 3-4 tone shading + selective outlining + a specular highlight.
   Outputs cached offscreen canvases; CSS scales them with image-rendering: pixelated. */

window.Sprites = (function () {

  const cache = {};

  function make(key, w, h, drawFn) {
    if (cache[key]) return cache[key];
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx, w, h);
    cache[key] = c;
    return c;
  }

  /* Plot a 2-D character map onto the ctx using a palette object.
     `.` and ` ` are transparent. */
  function plot(ctx, ox, oy, map, palette) {
    for (let y = 0; y < map.length; y++) {
      const row = map[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === " " || ch === ".") continue;
        const col = palette[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     HERO — 18×28, hooded lantern-bearer (matches concept reference).
       • Deep purple hood with a visible CRIMSON inner rim around the
         face cavity.
       • Single glowing cyan eye floating in the dark.
       • Gold round clasp at the throat + thin gold band across the chest.
       • Silver pauldron on the RIGHT shoulder + rune-sword pommel
         rising directly above it.
       • Lantern in the LEFT hand (brass frame, warm orange flame).
       • Cape hem flares wide showing CRIMSON LINING on both sides.
       • Black tunic, dark plum trousers, leather boots with bright
         silver toecaps.
     4-frame walk cycle (legs swap, cape edges sway).
     ═══════════════════════════════════════════════════════════════ */
  const HERO_PAL = {
    "K": "#0a0610",   // outline
    // hood / cloak (deep plum-purple)
    "M": "#3a2050",   // cloak mid
    "m": "#1f1228",   // cloak shadow
    "D": "#5a3070",   // cloak highlight
    // crimson lining
    "R": "#c84a3a",   // crimson bright
    "r": "#8a2820",   // crimson mid
    "o": "#5a1010",   // crimson deep
    // hood interior face-shadow
    "H": "#1a0e1f",
    "h": "#0a0510",
    // skin
    "S": "#f6cfa3",
    "s": "#c89572",
    "x": "#7a4830",
    // glowing eye
    "E": "#5acfff",   // cyan
    "e": "#c4ecff",   // bright core
    // silver pauldron
    "A": "#d4dde6",
    "a": "#7a8290",
    "n": "#3e4658",
    // gold
    "G": "#f3c963",
    "Y": "#fff0a8",
    "g": "#8a6020",
    // tunic black-purple
    "T": "#1a1018",
    "t": "#0a0408",
    // belt
    "B": "#5a3010",
    "b": "#2a1808",
    // pants
    "P": "#2a1830",
    "p": "#150818",
    // boots
    "F": "#1a0e08",
    "f": "#3a2818",
    "N": "#c8d0d8",
    // brass lantern + flame
    "C": "#c8884a",   // brass frame
    "c": "#5a3a1c",   // brass shadow
    "L": "#ffaa44",   // flame outer
    "l": "#fff0a8",   // flame inner
    "W": "#fff8c8",   // hot core
    "Q": "#ffd078",   // glass glow
    // rune blade
    "U": "#a4d8ff",
    "u": "#5078c8",
  };

  /* Top half (rows 0..19) is shared across walk frames.
     Only legs (rows 20..27) change. 18 wide × 28 tall.
     The hood interior is a deep void — only a single hair-thin crimson
     line runs along the rim (visible at outer edge of the cavity). */
  function heroTop() {
    return [
      "..................",  // 0
      "......KKKKKKK.....",  // 1  hood top arc
      ".....KMMMMMMMMK...",  // 2  hood outer
      "....KMDMmMMmMDMK..",  // 3  hood depth
      "....KMmHHHHHHHmK..",  // 4  hood interior — pure dark
      "....KMRHHHHHHHRK..",  // 5  ★ thin crimson rim (1px each side)
      "....KmRHHHHHHHRK..",  // 6
      "....KmRHHEeKHHRK..",  // 7  ★ glowing cyan eye (col 8-9)
      "....KmRHHHHHHHRK..",  // 8
      "....KmRHHsxsHHRK..",  // 9  hint of skin at bottom of cavity
      ".....KRrsSSSsRrK..",  // 10 jaw barely visible — crimson under-rim
      ".....KKHsSSsHKK...",  // 11 chin/jaw ends
      "....KmMTTGGGTTMmK.",  // 12 collar w/ thin gold band
      "....KmMTToGGoTTMmK",  // 13 ★ gold round clasp 'o' col 7 + 10
      "....KmMTTTTTTTMmAA",  // 14 ★ pauldron RIGHT (col 16-17)
      "...KMmTTTTTTTTmMAa",  // 15 pauldron
      "...KMmRTTBBBBTmMAA",  // 16 belt
      "..KMmRrTBBGGBTmMaK",  // 17 ★ gold belt buckle
      "..KMmRRrTTTTTrRMmK",  // 18 cloak side w/ crimson lining peek
      "..KMmRRrTTTTTrRMmK",  // 19
    ];
  }

  function heroFrame(frame) {
    const top = heroTop();
    let bottom;
    if (frame === 0 || frame === 2) {
      // neutral stance — feet planted, cape spread
      bottom = [
        ".KMmRRrPPPPPPrRRMK",  // 20  cape flares — crimson edges
        ".KMRRRrPPPPPPrRRMK",  // 21
        ".KMRRrPPpPPPpPRrMK",  // 22  pants visible thru cape opening
        "..KMRrPpPPPPpPRMK.",  // 23
        "..KKKKKK..KKKKKK..",  // 24  cape ends, legs emerge
        ".....KK....KK.....",  // 25  leg split
        "....KFfK..KFfK....",  // 26  boot leather
        "....KNNK..KNNK....",  // 27  metal toecaps
      ];
    } else if (frame === 1) {
      // LEFT leg strides forward
      bottom = [
        ".KMmRRrPPPPPPrRRMK",  // 20
        ".KMRRRrPPPPPPrRRMK",  // 21
        ".KMRRrPpPPPPpPRrMK",  // 22
        "..KMRrPPpPPPPpRMK.",  // 23
        "..KPpPPK....KKKKK.",  // 24  left leg striding forward
        ".KFfK......KPPPPK.",  // 25  left foot ahead
        ".KNNK......KFfK...",  // 26
        "..KK........KNNK..",  // 27
      ];
    } else {
      // frame 3 — RIGHT leg strides forward
      bottom = [
        ".KMmRRrPPPPPPrRRMK",  // 20
        ".KMRRRrPPPPPPrRRMK",  // 21
        ".KMRRrPpPPPPpPRrMK",  // 22
        ".KMRrPPpPPPPpPRMK.",  // 23
        ".KKKKK....KPpPPPK.",  // 24  right leg striding forward
        "..KPPPPK....KFfK..",  // 25  right foot ahead
        "...KFfK......KNNK.",  // 26
        "...KNNK........KK.",  // 27
      ];
    }
    return top.concat(bottom);
  }

  function drawHero(ctx, frame) {
    plot(ctx, 0, 0, heroFrame(frame), HERO_PAL);

    // ─── Eye-glow bloom (small, focused additive halo) ───
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(90,207,255,0.55)";
    ctx.fillRect(8, 7, 2, 1);
    ctx.fillStyle = "rgba(196,236,255,0.85)";
    ctx.fillRect(8, 7, 1, 1);
    ctx.restore();

    // ─── Gold round clasps at the throat (two small dots from map 'o') ───
    ctx.fillStyle = HERO_PAL.G; ctx.fillRect(7, 13, 1, 1);
    ctx.fillStyle = HERO_PAL.Y; ctx.fillRect(7, 13, 1, 1);
    ctx.fillStyle = HERO_PAL.G; ctx.fillRect(10, 13, 1, 1);
    ctx.fillStyle = HERO_PAL.g; ctx.fillRect(10, 13, 1, 1);

    // ─── Gold belt buckle (square, central) ───
    ctx.fillStyle = HERO_PAL.K; ctx.fillRect(9, 17, 2, 1);
    ctx.fillStyle = HERO_PAL.G; ctx.fillRect(9, 17, 2, 1);
    ctx.fillStyle = HERO_PAL.Y; ctx.fillRect(9, 17, 1, 1);

    // ─── Rune-sword rising above the right pauldron (cols 15-17) ───
    // blade rune (cool blue, very small)
    ctx.fillStyle = "#cfe7ff";        ctx.fillRect(16, 8,  1, 1);  // tip flare
    ctx.fillStyle = HERO_PAL.U;       ctx.fillRect(16, 9,  1, 2);  // blade glow
    // pommel (gold knob)
    ctx.fillStyle = HERO_PAL.K;       ctx.fillRect(15, 11, 3, 1);
    ctx.fillStyle = HERO_PAL.G;       ctx.fillRect(15, 11, 3, 1);
    ctx.fillStyle = HERO_PAL.Y;       ctx.fillRect(15, 11, 1, 1);
    ctx.fillStyle = HERO_PAL.g;       ctx.fillRect(17, 11, 1, 1);
    // grip wrap
    ctx.fillStyle = "#3a2818";        ctx.fillRect(16, 12, 1, 1);
    // cross-guard
    ctx.fillStyle = HERO_PAL.G;       ctx.fillRect(15, 13, 3, 1);
    ctx.fillStyle = HERO_PAL.Y;       ctx.fillRect(15, 13, 1, 1);

    // ─── Pauldron rivet (single bright dot on silver dome) ───
    ctx.fillStyle = HERO_PAL.K;       ctx.fillRect(17, 15, 1, 1);
    ctx.fillStyle = HERO_PAL.Y;       ctx.fillRect(17, 15, 1, 1);

    // ─── Brass lantern in left hand ───
    const lx = 1, ly = 17;
    // chain (links)
    ctx.fillStyle = HERO_PAL.c;       ctx.fillRect(lx + 1, ly - 3, 1, 1);
    ctx.fillStyle = HERO_PAL.C;       ctx.fillRect(lx + 1, ly - 2, 1, 1);
    ctx.fillStyle = HERO_PAL.c;       ctx.fillRect(lx + 1, ly - 1, 1, 1);
    // top cap
    ctx.fillStyle = HERO_PAL.K;       ctx.fillRect(lx,     ly,     3, 1);
    ctx.fillStyle = HERO_PAL.C;       ctx.fillRect(lx + 1, ly,     1, 1);
    // body outline
    ctx.fillStyle = HERO_PAL.K;
    ctx.fillRect(lx,     ly + 1, 1, 4);
    ctx.fillRect(lx + 2, ly + 1, 1, 4);
    ctx.fillRect(lx,     ly + 5, 3, 1);
    // glass with warm glow
    ctx.fillStyle = HERO_PAL.Q;       ctx.fillRect(lx + 1, ly + 1, 1, 4);
    // flame layered
    ctx.fillStyle = HERO_PAL.L;       ctx.fillRect(lx + 1, ly + 3, 1, 1);
    ctx.fillStyle = HERO_PAL.l;       ctx.fillRect(lx + 1, ly + 2, 1, 1);
    ctx.fillStyle = HERO_PAL.W;       ctx.fillRect(lx + 1, ly + 2, 1, 1);
    // bottom finial
    ctx.fillStyle = HERO_PAL.C;       ctx.fillRect(lx + 1, ly + 6, 1, 1);
  }

  function hero(frame = 0) {
    frame = ((frame % 4) + 4) % 4;
    return make(`hero-${frame}`, 18, 28, ctx => drawHero(ctx, frame));
  }

  /* ─────────────────────────────────────────────────────────
     HERO PORTRAIT — 36×36 bust, dramatic close-up.
     Matches the concept reference: deep purple hood with vivid
     crimson interior rim, glowing cyan eye, gold round clasp
     at the throat, silver pauldron on right shoulder, ember
     sparks floating in the dark.
     ───────────────────────────────────────────────────────── */
  const PORTRAIT_PAL = {
    "K": "#0a0610",
    "M": "#3a2050",
    "m": "#1f1228",
    "D": "#5a3070",
    "R": "#c84a3a",
    "r": "#8a2820",
    "o": "#5a1010",
    "H": "#1a0e1f",
    "h": "#0a0510",
    "S": "#f6cfa3",
    "s": "#c89572",
    "x": "#7a4830",
    "E": "#5acfff",
    "e": "#c4ecff",
    "A": "#d4dde6",
    "a": "#7a8290",
    "n": "#3e4658",
    "G": "#f3c963",
    "g": "#8a6020",
    "Y": "#fff0a8",
    "T": "#1a1018",
    "t": "#0a0408",
    "U": "#a4d8ff",
    "W": "#fff8c8",
  };

  function drawPortrait(ctx) {
    const M = [
      "....................................",  // 0
      "....................................",  // 1
      ".............KKKKKKKKKK.............",  // 2  hood top
      "...........KKMMMMMMMMMMKK...........",  // 3
      "..........KMMMDDMDMDDDMMMK..........",  // 4  hood w/ purple highlights
      ".........KMMMMmMMmMMmMMmMMK.........",  // 5
      "........KMMmRRRRRRRRRRRRRrK.........",  // 6  ★ CRIMSON RIM begins
      "........KMmRrrrrrrrrrrrrrRK.........",  // 7  rim continues
      "........KMRrHHHHHHHHHHHHrRK.........",  // 8  face cavity inside rim
      "........KMRrHHHHHHHHHHHHrRK.........",  // 9
      "........KMRrHHHEeKHHHHHHrRK.........",  // 10 ★ glowing cyan eye
      "........KMRrHHHEeKHHHHHHrRK.........",  // 11
      "........KMRrHHHHHHHHHHHHrRK.........",  // 12
      "........KMRrHHsxsSSsxsHHrRK.........",  // 13 jaw partly lit
      ".........KMRsSSSSSSSSSsRRK..........",  // 14 chin
      "..........KKsSSsxxxxsSsKK...........",  // 15 jaw narrows
      "............KKsSSSSsKK..............",  // 16 neck
      "...........KmMTGYoGTMmK.............",  // 17 ★ collar w/ gold band & round clasp 'o'
      "..........KmMTtTGGGTtTMmK...........",  // 18 tunic + gold accent
      ".........KMmMmTtTTTTtTmMmK..........",  // 19
      "........KMmMmTTtTTTTTTtmMmK.........",  // 20
      "........KMmMmTtTTTTTTTtmMK..AAAK....",  // 21 ★ silver pauldron — RIGHT
      ".......KMmRrTTtTTTTTTtTmMKAAaaaAK...",  // 22 crimson left edge of cloak
      "......KMRRrTtTTTTTTTTTtmMKAaaaaaK...",  // 23 pauldron rivet
      "......KRRrrTTtTTRTTTTTtmMKAaaanaK...",  // 24 ★ inner crimson lining peek
      ".....KRRrrrTTtRRRrrRTTTtmMKaanaK....",  // 25
      ".....KRrrrrTTtRrrrrrRTttmMKaaK......",  // 26
      ".....KRRrrrTtRRrrrrrRTttmMK.K.......",  // 27
      "....KKRRrrrTttRRRrrRRTttmMK.........",  // 28
      "....KKKKKKKKKKKKKKKKKKKKKKKK........",  // 29
      "....................................",  // 30
      "....................................",  // 31
      "....................................",  // 32
      "....................................",  // 33
      "....................................",  // 34
      "....................................",  // 35
    ];
    plot(ctx, 0, 0, M, PORTRAIT_PAL);

    // ─── Eye-glow bloom (additive cyan halo around the eye) ───
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(90,207,255,0.45)";
    ctx.fillRect(13, 9, 6, 4);
    ctx.fillStyle = "rgba(196,236,255,0.75)";
    ctx.fillRect(15, 10, 3, 2);
    ctx.restore();

    // ─── Gold round clasp at throat (covers 'o' from map) ───
    ctx.fillStyle = PORTRAIT_PAL.G; ctx.fillRect(18, 17, 2, 1);
    ctx.fillStyle = PORTRAIT_PAL.Y; ctx.fillRect(18, 17, 1, 1);
    ctx.fillStyle = PORTRAIT_PAL.g; ctx.fillRect(19, 18, 1, 1);

    // ─── Sword hilt rising over RIGHT shoulder (above pauldron) ───
    // blade rune glow
    ctx.fillStyle = "#cfe7ff";        ctx.fillRect(29, 14, 1, 1);
    ctx.fillStyle = PORTRAIT_PAL.U;   ctx.fillRect(29, 15, 1, 3);
    // pommel (gold sphere)
    ctx.fillStyle = PORTRAIT_PAL.K;   ctx.fillRect(28, 18, 3, 1);
    ctx.fillStyle = PORTRAIT_PAL.G;   ctx.fillRect(28, 18, 3, 1);
    ctx.fillStyle = PORTRAIT_PAL.Y;   ctx.fillRect(28, 18, 1, 1);
    ctx.fillStyle = PORTRAIT_PAL.g;   ctx.fillRect(30, 19, 1, 1);
    // grip wrap
    ctx.fillStyle = "#3a2818";        ctx.fillRect(29, 19, 1, 1);
    // cross-guard
    ctx.fillStyle = PORTRAIT_PAL.G;   ctx.fillRect(28, 20, 3, 1);
    ctx.fillStyle = PORTRAIT_PAL.Y;   ctx.fillRect(28, 20, 1, 1);

    // ─── Pauldron rivet on right shoulder ───
    ctx.fillStyle = PORTRAIT_PAL.K;   ctx.fillRect(28, 22, 1, 1);
    ctx.fillStyle = PORTRAIT_PAL.Y;   ctx.fillRect(28, 22, 1, 1);

    // ─── Floating ember sparks (warm orange, scattered) ───
    ctx.fillStyle = "rgba(255,180,90,0.85)";
    ctx.fillRect(3, 17, 1, 1);
    ctx.fillRect(34, 14, 1, 1);
    ctx.fillRect(2, 24, 1, 1);
    ctx.fillRect(33, 25, 1, 1);
    ctx.fillStyle = "rgba(255,210,140,0.95)";
    ctx.fillRect(5, 11, 1, 1);
    ctx.fillRect(31, 9, 1, 1);
  }

  function portrait() {
    return make("hero-portrait-bust", 36, 36, drawPortrait);
  }

  /* ─────────────────────────────────────────────────────────
     SLIME — 16×12, glossy + eyes + bottom shadow.
     Variants: grass, leaf, crystal.
     ───────────────────────────────────────────────────────── */
  const SLIME_PALS = {
    "slime-grass": { K:"#15281a", D:"#2f4828", G:"#5a8a48", g:"#3e6e2f", L:"#a0d272", H:"#dff5b0", E:"#1a1010", W:"#fff8d8", X:"#3a5a28" },
    "slime-leaf":  { K:"#0e1a14", D:"#243824", G:"#456e3c", g:"#2f5028", L:"#7aa860", H:"#c0e090", E:"#1a1010", W:"#fff8d8", X:"#243024" },
    "crystal-slime":{K:"#0e1430", D:"#3a3a72", G:"#7a8edc", g:"#4a5ab0", L:"#c4d4ff", H:"#eef0ff", E:"#1a1030", W:"#ffffff", X:"#1a1f4a" },
  };
  function drawSlime(ctx, palKey) {
    const P = SLIME_PALS[palKey] || SLIME_PALS["slime-grass"];
    // 16 wide × 12 tall
    const M = [
      "................",  // 0
      "................",  // 1
      ".....KKKKKK.....",  // 2  top arc
      "....KGHHHGGgK...",  // 3  highlight curl
      "...KGHLLGGGgGK..",  // 4
      "..KGLLGGGGGGgGK.",  // 5  full belly
      "..KGLGGGGGGGgGK.",  // 6
      ".KGgGEWGGEWGgGgK",  // 7  eyes E + glints W
      ".KGgGEEGGEEGgGgK",  // 8
      ".KGgggGGGGggggGK",  // 9
      "..KKKKDDDDKKKKK.",  // 10 underside dark
      "....XXXX..XXXX..",  // 11 ground shadow
    ];
    plot(ctx, 0, 0, M, P);

    // Tiny mouth
    ctx.fillStyle = P.K;
    ctx.fillRect(7, 9, 2, 1);
    ctx.fillStyle = P.L;
    ctx.fillRect(7, 8, 1, 1);
  }
  function slime(palKey) {
    return make(`slime-${palKey || "default"}`, 16, 12, ctx => drawSlime(ctx, palKey));
  }

  /* ─────────────────────────────────────────────────────────
     SPARROW — 14×10, plump field bird.
     ───────────────────────────────────────────────────────── */
  function drawSparrow(ctx) {
    const P = {K:"#0d0814", B:"#7a4828", b:"#4a2818", H:"#c89858", Y:"#f3c963", E:"#fff", W:"#f4e3c0", o:"#a86028"};
    const M = [
      "..............",
      "....KKKKK.....",
      "...KHBBBBK....",
      "..KHHBBoBBK...",
      ".KHHBEWBoBBK..",
      ".KHHBBBBBobBK.",
      "..KHBbbbBBbBK.",
      "...KKYYBBKKK..",
      "....KKKKK.....",
      ".....KK.......",
    ];
    plot(ctx, 0, 0, M, P);
  }

  /* ─────────────────────────────────────────────────────────
     IRON BEETLE — 14×10
     ───────────────────────────────────────────────────────── */
  function drawBeetle(ctx) {
    const P = {K:"#0d0814", B:"#3a2c44", b:"#1c1426", H:"#7a6a8c", Y:"#c89b3c", S:"#dcdce4"};
    const M = [
      "..............",
      ".....KKKK.....",
      "....KHBHBK....",
      "...KBHBHBHBK..",
      "..KBHBHBHBHBK.",
      "..KBSBHBHBSBK.",
      "..KBHBHbHBHBK.",
      "..KBHbBbBbHBK.",
      "...KKbKKbKKK..",
      "....K.K..K.K..",
    ];
    plot(ctx, 0, 0, M, P);
  }

  /* ─────────────────────────────────────────────────────────
     BAT — 14×10, with proper wing membranes.
     ───────────────────────────────────────────────────────── */
  function drawBat(ctx) {
    const P = {K:"#0a0814", B:"#5a3a72", b:"#2a1840", H:"#8a5aa0", E:"#ff5a78", W:"#ffd0d8", G:"#3a1850", F:"#1a0828"};
    const M = [
      "..............",
      "K............K",
      "KBK..KKKK..KBK",
      "KBBKKHHHHKKBBK",
      "KBHBKBbbBKBHBK",
      ".KBHBBBbBBHBK.",
      "..KBBKEWWEKBB.",
      "...KGKBbbBKGK.",
      "....KKBbBKKK..",
      ".....KKKK.....",
    ];
    plot(ctx, 0, 0, M, P);
    // Tiny fang
    ctx.fillStyle = P.W;
    ctx.fillRect(7, 8, 1, 1);
  }

  /* ─────────────────────────────────────────────────────────
     WOLF PUP — 18×14
     ───────────────────────────────────────────────────────── */
  function drawWolf(ctx) {
    const P = {K:"#0a0814", F:"#9b8068", G:"#6a5238", H:"#cdb59a", D:"#3a2818", E:"#ffaa44", T:"#fff", N:"#1a0810", R:"#d04060"};
    const M = [
      "..................",
      "...KKKK...........",
      "..KFGFFK..........",
      ".KFFGFGFFKKKKKK...",
      ".KFEHTEFFFFFFFFFK.",
      ".KFFGGGGGGGGGFFFK.",
      ".KFGFFGFFFFFGFFFK.",
      ".KFFGFFGFFGFGFRFK.",
      ".KFGGGGFFFFGFGFFK.",
      "..KKKD.KKD.KKD.KK.",
      "..KKD..KD..KD..K..",
      "..KD...K...K...K..",
      "..................",
      "..................",
    ];
    plot(ctx, 0, 0, M, P);
    // Snout shading
    ctx.fillStyle = P.N;
    ctx.fillRect(2, 4, 1, 1);
  }

  /* ─────────────────────────────────────────────────────────
     BANDIT — 16×24, hooded with dagger.
     ───────────────────────────────────────────────────────── */
  function drawBandit(ctx) {
    const P = {
      K:"#0d0814", S:"#e0b890", s:"#a87858", H:"#1a1818",
      C:"#3a4838", c:"#1f2a20", o:"#0e1410", G:"#8a8678", g:"#4a4838",
      M:"#dcdce4", m:"#6a6a78", B:"#1f1208", R:"#7a1818"
    };
    const M = [
      "................",  // 0
      ".....KKKKKK.....",  // 1  hood top
      "....KHHHHHHK....",  // 2
      "...KHHHHHHHHK...",  // 3
      "...KHKSSSKHHK...",  // 4  scarf gap (face)
      "...KKSsSsSKKK...",  // 5  face
      "....KsKsKsK.....",  // 6  eyes
      "....KKsSssK.....",  // 7
      "...KCcCCCCcCK...",  // 8  cloak shoulder
      "..KCccCCcCCcCK..",  // 9
      "..KCccCCCCccCK..",  // 10
      ".KCcccCcCcccCK..",  // 11
      ".KCccccGGcccCK..",  // 12 gold trim
      ".KoCccBBBBcCoK..",  // 13 belt
      "..KoCcCBBCcCoK..",  // 14
      "...KKCccccCKK...",  // 15
      "....KCcCcCK.....",  // 16 cloak hem
      "....KK..KK......",  // 17 legs split
      "....K....K......",  // 18
      "...KK....KK.....",  // 19
      "..KKK..MKKK.....",  // 20 dagger M peeks out
      "..KKK.MmKKK.....",  // 21
      "..KK..MmK.K.....",  // 22
      "......KK........",  // 23
    ];
    plot(ctx, 0, 0, M, P);
  }

  /* ─────────────────────────────────────────────────────────
     KOBOLD — 16×18
     ───────────────────────────────────────────────────────── */
  function drawKobold(ctx) {
    const P = {K:"#0a0814", S:"#7a4838", s:"#4a2818", H:"#c89858", h:"#8a6028", E:"#ff5a78", T:"#fff", G:"#3a2818", g:"#1a0e08", M:"#dcdce4", I:"#7a6e60"};
    const M = [
      "................",
      "....KKKKKK......",
      "...KHHHHhhK.....",
      "..KHHsHHHHhK....",
      ".KHKSSSSSKHK....",
      ".KKSsKEKEKsK....",  // eyes
      "..KSSsSsSsSK....",
      "..KKsSSSSsKK....",  // tooth fang
      "...KGGgGGgK.....",  // armor leather
      "..KGggGGggGK....",
      "..KGGggGgGGK....",
      "..KKgGGGgKK.....",
      "...KIIIIIIK.....",  // pickaxe shaft
      "...KIIIIIIK.....",
      "....KK..KK......",
      "....K....K......",
      "...KK....KK.....",
      "................",
    ];
    plot(ctx, 0, 0, M, P);
    // Tooth/fang
    ctx.fillStyle = P.T;
    ctx.fillRect(8, 8, 1, 1);
  }

  /* ─────────────────────────────────────────────────────────
     SKELETON — 16×22
     ───────────────────────────────────────────────────────── */
  function drawSkeleton(ctx) {
    const P = {K:"#0a0814", B:"#e8e0c4", b:"#a89878", S:"#3a2818", E:"#5a8eff", T:"#fff", D:"#1f1408", M:"#dcdce4", m:"#7a7a86"};
    const M = [
      "................",
      ".....KKKKKK.....",
      "....KbBBBBbK....",
      "....KBbBBBbK....",
      "...KBKEKEKBK....",  // eye sockets
      "...KBBBBBBBK....",
      "....KbBBBbK.....",
      ".....KKKKK......",
      "....KBbBbBK.....",  // ribcage start
      "...KBbKBKbBK....",
      "..KBBKBBBKBBK...",
      "..KBKBBBBBKBK...",
      "..KBKBBbBBKBK...",
      "..KBBKKKKKBBK...",
      "...KBBbBbBBK....",
      "....KKbKbKK.....",
      "....KK..KK......",  // legs
      "....KB..BK......",
      "....KB..BK......",
      "...KKB..BKK.....",
      "..KKK....KKK....",
      "..K........K....",
    ];
    plot(ctx, 0, 0, M, P);
  }

  /* ─────────────────────────────────────────────────────────
     WRAITH — 16×20, ghostly
     ───────────────────────────────────────────────────────── */
  function drawWraith(ctx) {
    const P = {K:"#0a0814", B:"#4a3868", b:"#2a1c40", H:"#7a5a98", h:"#3a2a4c", E:"#5a8eff", T:"#bfd6ff", G:"#9b8060"};
    const M = [
      "................",
      ".....KKKKKK.....",
      "....KbHHHHbK....",
      "...KhHHbbHHhK...",
      "..KhHHHHHHHHhK..",
      "..KhHKETKEKHhK..",  // glowing eyes
      "..KhHHHHHHHHhK..",
      "..KhBHHbbHHBhK..",
      "..KhBBBbbbBBhK..",
      ".KhBBbBBBBbBBhK.",
      ".KhBbbBBBBbbBhK.",
      ".KhBbBBBBBBbBhK.",
      ".KhBBbBBBbBBBhK.",
      "..KhBbBBBbBBhK..",
      "...KhBbBBbBhK...",
      "....KhBbbBhK....",
      ".....KhBbhK.....",
      "......KhBhK.....",
      "......KhhK......",
      "......KKKK......",
    ];
    plot(ctx, 0, 0, M, P);
  }

  /* ─────────────────────────────────────────────────────────
     STONE GUARDIAN — 18×20, stoic golem
     ───────────────────────────────────────────────────────── */
  function drawGuardian(ctx) {
    const P = {K:"#0a0814", S:"#7a6e60", s:"#4a3f35", L:"#a89878", G:"#c89b3c", E:"#ffd078", T:"#fff8c8", D:"#2a1f18"};
    const M = [
      "..................",
      "....KKKKKKKKKK....",
      "...KSSSSSSSSSSK...",
      "..KSSLLSSSSSLLSK..",
      "..KSLSSSSSSSSSLK..",
      "..KSSKEEEKEEEKSK..",  // glowing eye band
      "..KSSSSSSSSSSSSK..",
      "..KSsSSGGGGSSSsK..",
      ".KSsSSSGGGGSSSSsK.",
      ".KSSsSSSSSSSSsSSK.",
      ".KSSSsSSGSSSSsSSK.",
      ".KSSsSSGGSSSsSSSK.",
      "..KsSSSGGGSSSsK...",
      "..KSSsSSSSSsSSK...",
      "..KSSSsSSSsSSK....",
      "..KKKK.....KKK....",
      "..KSSK....KSSK....",
      "..KsSK....KSsK....",
      ".KSSSK....KSSSK...",
      ".KKKKK....KKKKK...",
    ];
    plot(ctx, 0, 0, M, P);
  }

  /* ─────────────────────────────────────────────────────────
     GENERIC BOSS — 24×24 with spikes, glowing eyes
     ───────────────────────────────────────────────────────── */
  function drawBoss(ctx, hue) {
    const palettes = {
      fire: {K:"#0a0408", B:"#a8421f", b:"#5a2010", D:"#2a0c08", H:"#d97842", G:"#f3c963", E:"#ffe080", T:"#fff8c8", S:"#1a0408"},
      void: {K:"#0a0408", B:"#4a3868", b:"#2a1a4a", D:"#100820", H:"#7a5a98", G:"#bfa0e0", E:"#5a8eff", T:"#bfd6ff", S:"#080418"},
      ice:  {K:"#04060a", B:"#3a5a8a", b:"#1c2c4a", D:"#0c1422", H:"#6a8acb", G:"#a4c4ff", E:"#dff0ff", T:"#ffffff", S:"#04060f"},
    };
    const P = palettes[hue] || palettes.fire;
    const M = [
      "........................",
      "...KKK....KKKK....KKK...",  // horns
      "..KbHbK..KbHHbK..KbHbK..",
      ".KbHHHbKKbHHHHbKKbHHHbK.",
      ".KbBHHHbBHHHHHHbBHHHbBK.",
      "KbBBHHHHHHBBBHHHHHHHbBK.",  // brow
      "KBBBHKEEKHHKHHKEEKHBBBK.",  // glowing eyes
      "KBBHHKETTEKHHKETTEHHBBK.",
      "KBBBHHKEEKHHHHKEEKHBBBK.",
      ".KBBBHHHHGGGGGGGHHHHBBK.",  // gold band
      ".KBbBBBBBHGGGGGHBBBBBbK.",
      ".KBbBBBBBBHHHHHBBBBBBbK.",
      "..KBbBBBBBBBBBBBBBBBbK..",
      "..KBBbBBBHHHHHHHBBBbBK..",
      "...KBBBbBHHHHHHHbBBBK...",
      "....KBBBBBBHHHBBBBBK....",
      ".....KBBBbBBBBBBbBK.....",
      "......KKKKKKKKKKKK......",
      ".....KBBKKBBBKKBBK......",  // claws/feet
      "....KBBKKDBBDKKBBK......",
      "....KBKKD.BB.DKKBK......",
      "....KK....KK....KK......",
      "................",
      "................",
    ];
    plot(ctx, 0, 0, M, P);
  }

  /* ─────────────────────────────────────────────────────────
     ENVIRONMENT — TREE (small + tall)
     ───────────────────────────────────────────────────────── */
  function drawTree(ctx, tall) {
    const P = {
      K:"#0d0814", L:"#5a8a48", l:"#3e6432", H:"#a0c272", D:"#3a2410", d:"#1f1408", T:"#5a3820"
    };
    const small = [
      "..............",
      "....KKKKKK....",
      "...KHLLHLLLK..",
      "..KLHLLLLLLLK.",
      ".KLHLLLLLlLLK.",
      ".KHLLLLLlLLLK.",
      ".KLLlLLLLLlLK.",
      ".KLLLlLLlLLLK.",
      "..KLLLLLLLLLK.",
      "...KLLlLLLLK..",
      "....KKDdDKK...",
      ".....KDdTK....",
      ".....KdTDK....",
      ".....KDTdK....",
      "....KKKKKK....",
    ];
    const big = [
      "..................",
      ".....KKKKKKKK.....",
      "...KKHHLLHLLHKK...",
      "..KHHLLLLLLLLLLK..",
      ".KLHLHLLLLLLLLLK..",
      ".KLLLLLLLLLLLlLK..",
      "KLHLLLLLLLLlLLLLK.",
      "KLHLLLLLLLLLLLlLK.",
      "KLLLlLLLLLLLLLLLK.",
      "KLHLLLLlLLLLLLlLK.",
      ".KLLlLLLLLLLLLLK..",
      ".KLLLLLLLlLLLLLK..",
      "..KLLLLlLLLLLLK...",
      "...KKLLLLLLLKK....",
      "....KKKDdDDKK.....",
      ".....KDdDdDK......",
      ".....KdDDdTK......",
      ".....KDDddDK......",
      ".....KDdDDDK......",
      "....KKKKKKKK......",
    ];
    plot(ctx, 0, 0, tall ? big : small, P);
  }

  function drawRock(ctx) {
    const P = {K:"#0d0814", S:"#9c8e7c", s:"#6a5e4e", H:"#c0b29a", D:"#3a2e22", L:"#5a8a48"};
    const M = [
      "...KKKKKK..",
      "..KSHHHSSK.",
      ".KSHHSSSSSK",
      ".KSSSsSSSSK",
      "KSSsSsSsSSK",
      "KSsSsLLsSSK",  // tiny moss
      "KKKsKKKKsK.",
      ".KKKKKKKK..",
    ];
    plot(ctx, 0, 0, M, P);
  }

  function drawCrystal(ctx, tall) {
    const P = {K:"#0d0814", C:"#7a8edc", c:"#4a5ab0", L:"#c4d4ff", H:"#eef0ff", T:"#ffffff", D:"#1a1f4a"};
    const small = [
      "..K....",
      ".KHK...",
      "KCLCK..",
      "KLCcK..",
      "KCcCK..",
      "KcCcK..",
      "KCccK..",
      "KKKKK..",
    ];
    const big = [
      "...K.....",
      "..KHK....",
      ".KLCLK...",
      ".KCLCK.K.",
      "KCLcCKCK.",
      "KLcCcLCK.",
      "KCcCcCcK.",
      "KcCcCccK.",
      "KCccccCK.",
      "KccCcccK.",
      "KKKKKKKK.",
    ];
    plot(ctx, 0, 0, tall ? big : small, P);
  }

  function drawMushroom(ctx) {
    const P = {K:"#0d0814", R:"#c84838", r:"#7a1c14", H:"#f08070", S:"#f0e0b0", s:"#a08868", W:"#fff", D:"#3a2818"};
    const M = [
      "..KKKKKK..",
      ".KRHHRRRK.",
      "KRHRWRRRRK",
      "KRRWHRRWRK",
      "KRrRRRRrRK",
      "KRRRrRRRRK",
      ".KKDsSDKK.",
      "..KSsSSK..",
      "..KsSSsK..",
      "..KKKKKK..",
    ];
    plot(ctx, 0, 0, M, P);
  }

  function drawFlower(ctx) {
    const P = {K:"#0d0814", P:"#f3a4c3", p:"#c87090", Y:"#f3c963", y:"#a87838", S:"#3a5a30", L:"#5a8a48"};
    const M = [
      "..K..",
      ".KPK.",
      "KPYPK",
      "KpYpK",
      ".KPK.",
      "..S..",
      ".LSL.",
      "..S..",
    ];
    plot(ctx, 0, 0, M, P);
  }

  function drawPillar(ctx) {
    const P = {K:"#0d0814", S:"#c8b89a", s:"#7a6e58", H:"#e8dcc0", G:"#f3c963", g:"#8a6020", M:"#5a4a38"};
    const M = [
      "KGGGGGGGK",
      "KSSSSSSSK",
      "KSHSSSHSK",
      "KSSsSsSSK",
      "KSHSSSHSK",
      "KSsSSsSSK",
      "KSSSsSSSK",
      "KSHSsSHSK",
      "KSSSSSSSK",
      "KGGGGGGGK",
      "KMMMMMMMK",
    ];
    plot(ctx, 0, 0, M, P);
  }

  /* ─────────────────────────────────────────────────────────
     ITEM ICONS — 16×16, with rim light + depth.
     ───────────────────────────────────────────────────────── */
  function drawItemIcon(ctx, kind) {
    const P = {
      K:"#0d0814",
      M:"#dcdce4", m:"#7a7a86", H:"#ffffff",            // metal
      G:"#f3c963", g:"#8a6020", T:"#fff8c8",            // gold
      B:"#c84838", b:"#7a1c14", h:"#f08070",            // red bottle
      L:"#5a8a48", l:"#3e6432", X:"#a0c272",            // green
      C:"#7a8edc", c:"#4a5ab0", U:"#c4d4ff",            // blue/cyan
      R:"#d97842", r:"#a8421f",                         // orange/leather
      P:"#7a4a8a", p:"#4a2a5a",                         // purple
      W:"#f3e0b0", w:"#b8916a",                         // paper/cream
      S:"#3a2010", I:"#9c8e7c", i:"#6a5e4e",            // stone
      D:"#3a2818",                                       // dark wood
      F:"#f4e3c0",                                       // bone
      Q:"#5a3820",                                       // hilt
      N:"#5a8a48",                                       // herb stem
    };
    const sprites = {
      sword: [
        "................",
        "................",
        "............KK..",
        "...........KMK..",
        "..........KMHK..",
        ".........KMHHK..",
        "........KMHHKK..",
        ".......KMHHKK...",
        "......KMHHKK....",
        ".....KMHHKK.....",
        "....KMHKKK......",
        "...KGGGKK.......",
        "..KGGgGGK.......",
        "...KQQQK........",
        "....KQK.........",
        ".....K..........",
      ],
      armor: [
        "................",
        "....KKKKKKKK....",
        "...KIIIIIIIIK...",
        "..KIIiIIIIiIK...",
        "..KIIIIIIIIIIK..",
        "..KIIiIIIiIIIK..",
        "..KIIIIGIIIIIK..",  // central stud
        "..KIIIGGGIIIIK..",
        "..KIIiIGIiIIIK..",
        "..KIIIIIIIIIIK..",
        "..KIIiIIIiIIIK..",
        "..KIIIIIIIIIK...",
        "..KIIIiIIIIK....",
        "...KKKIIKKK.....",
        "....KIIIIK......",
        "....KKKKKK......",
      ],
      ring: [
        "................",
        "................",
        ".....KKKKKK.....",
        "....KGGggGGGK...",
        "...KGGgggGGGK...",
        "...KGgKCCKgGK...",  // gem set
        "...KGgKHCKgGK...",
        "...KGgKCCKgGK...",
        "...KGGgggGGGK...",
        "....KGggGGGK....",
        ".....KKGKGK.....",
        "......KKKK......",
        "................",
        "................",
        "................",
        "................",
      ],
      potion: [  // red
        "................",
        ".....KKKK.......",
        "....KQQQQK......",
        "....KQQQQK......",
        "...KKWWWWKK.....",
        "...KWWWWWWK.....",
        "..KbBBHBBBbK....",
        "..KbBhBBBBbK....",
        ".KbBBBhBBBBbK...",
        ".KbBhBBBBhBbK...",
        ".KbBBBBhBBBbK...",
        ".KbbBBBbBBbbK...",
        "..KKbbbbbKKK....",
        "...KKKKKKK......",
        "................",
        "................",
      ],
      ether: [   // blue
        "................",
        ".....KKKK.......",
        "....KQQQQK......",
        "....KQQQQK......",
        "...KKWWWWKK.....",
        "...KWWWWWWK.....",
        "..KcCCUCCCcK....",
        "..KcCUCCCCcK....",
        ".KcCCCUCCCCcK...",
        ".KcCUCCCCUCcK...",
        ".KcCCCCUCCCcK...",
        ".KccCCCcCCccK...",
        "..KKccccKKK.....",
        "...KKKKKKK......",
        "................",
        "................",
      ],
      herb: [
        "................",
        ".......NN.......",
        "......KLLK......",
        ".....KLXLLK.....",
        ".KKKKLLLLLKKKK..",
        "KLXLLLXLXLLLXLK.",
        "KLLXLLLXLLLLLLK.",
        ".KLLLLLLLLLLLK..",
        "..KLLLLXLLLLK...",
        "...KLLLLLLLK....",
        "....KLLNLLK.....",
        ".....KNNNK......",
        "......KNK.......",
        "......KSK.......",
        "......KSK.......",
        "................",
      ],
      mushroom: [
        "................",
        "....KKKKKK......",
        "...KRRRRRRK.....",
        "..KRRWRRWRRK....",
        ".KRWRRRRRWRRK...",
        ".KRRRWRRRRRRK...",
        ".KrRRRrRRRrRK...",
        ".KRrRRRRRrRRK...",
        "..KKKDsDsDKK....",
        "...KSsSsSSK.....",
        "...KSsSSsSK.....",
        "...KSsSsSSK.....",
        "...KKKKKKKK.....",
        "................",
        "................",
        "................",
      ],
      gem: [
        "................",
        "................",
        ".....KKKKK......",
        "....KCcccCK.....",
        "...KCcUccCCK....",
        "...KcUHUccCK....",
        "...KCUUUccCK....",
        "...KCcUccccK....",
        "....KcccccK.....",
        ".....KCcCK......",
        "......KKK.......",
        "................",
        "................",
        "................",
        "................",
        "................",
      ],
      ore: [
        "................",
        "................",
        "....KKKKKKK.....",
        "...KIIiIIIK.....",
        "..KIiIIIIiIK....",
        "..KIIIIiIIIK....",
        "..KIIiIIIIIK....",
        "..KIIIIIIiIK....",
        "...KIIiIIIK.....",
        "....KKKKKK......",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
      ],
      coin: [  // stack
        "................",
        "................",
        "....KKKKKKKK....",
        "...KGGGgGGGGK...",
        "..KGgGTTGGgGGK..",
        "..KGGTTTTGGGgK..",
        "..KGgGTTGGggGK..",
        "..KGGgGgGgGGGK..",
        "...KKKKKKKKKK...",
        "...KGGgGGGgGK...",
        "..KGgGGgGGgGGK..",
        "..KGGGgGGgGgGK..",
        "..KGgGGgGGGGgK..",
        "...KKKKKKKKKK...",
        "................",
        "................",
      ],
      relic: [
        "................",
        "......KKK.......",
        ".....KGGGK......",
        "....KGgGgGK.....",
        "...KGGTGGgGK....",  // pulsing core
        "..KGgGGTGGgGK...",
        "..KGGGgTgGGGK...",
        "..KGgGGGGGGgK...",
        "..KGGGgGgGGGK...",
        "...KGgGGGGgK....",
        "....KGGGGGK.....",
        ".....KGgGK......",
        "......KGK.......",
        "......KKK.......",
        "................",
        "................",
      ],
      scroll: [
        "................",
        "................",
        "..KKKKKKKKKKKK..",
        ".KQWWWWWWWWWWQK.",
        ".KQWKKKKKKKWWQK.",
        ".KQWKKKKKKKWWQK.",
        ".KQWWKKKKKWWWQK.",
        ".KQWKKKKKKKWWQK.",
        ".KQWKKKKKKKWWQK.",
        ".KQWWKKKKKWWWQK.",
        ".KQWKKKKKKKWWQK.",
        ".KQWWWWWWWWWWQK.",
        "..KKKKKKKKKKKK..",
        "................",
        "................",
        "................",
      ],
      feather: [
        "................",
        "....K...........",
        "...KHK..........",
        "..KMHHK.........",
        "..KMHHHK........",
        "..KMHcHHK.......",
        "..KMHHHHK.......",
        "...KMHcHK.......",
        "...KMHHHK.......",
        "....KMHcK.......",
        "....KMHHK.......",
        ".....KMHK.......",
        ".....KMK........",
        ".....KK.........",
        "................",
        "................",
      ],
      crystal: [
        "................",
        ".......K........",
        "......KCK.......",
        ".....KCHcK......",
        "....KCcCccK.....",
        "...KCccUccCK....",
        "...KCcUcCccK....",
        "....KccUcCK.....",
        "....KCcccK......",
        ".....KKKK.......",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
      ],
      generic: [
        "................",
        "................",
        "....KKKKKKKK....",
        "...KIIIIIIIIK...",
        "...KIIiIIIIIK...",
        "...KIIIIiIIIK...",
        "...KIIiIIIIIK...",
        "...KIIIIIIiIK...",
        "...KIIiIIIIIK...",
        "....KKKKKKKK....",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
      ],
    };
    plot(ctx, 0, 0, sprites[kind] || sprites.generic, P);
  }

  function iconForItem(itemId) {
    const item = window.GameData.ITEMS[itemId];
    if (!item) return "generic";
    if (item.type === "weapon") return "sword";
    if (item.type === "armor") return "armor";
    if (item.type === "trinket") return "ring";
    if (item.heal) return "potion";
    if (item.mp) return "ether";
    if (itemId.includes("herb")) return "herb";
    if (itemId.includes("mushroom")) return "mushroom";
    if (itemId.includes("ore")) return "ore";
    if (itemId === "crystal" || itemId === "heart-crystal") return "crystal";
    if (itemId === "gemstone" || itemId === "scale" || itemId === "dragon-fang") return "gem";
    if (itemId.includes("coin") || itemId === "honey" || itemId === "sun-stone") return "coin";
    if (itemId.includes("relic") || itemId === "antler-crown" || itemId === "lich-amulet" || itemId === "iron-core") return "relic";
    if (itemId === "scroll" || itemId === "cracked-tablet") return "scroll";
    if (itemId === "feather" || itemId === "cloud-silk" || itemId === "wing") return "feather";
    return "generic";
  }

  /* ─────────────────────────────────────────────────────────
     PUBLIC SPRITE GETTERS
     ───────────────────────────────────────────────────────── */
  function monster(id) {
    const data = window.GameData.MONSTERS[id];
    if (!data) return slime("slime-grass");
    if (id.includes("slime")) return slime(id);
    if (id === "sparrow")    return make("mon-sparrow", 14, 10, drawSparrow);
    if (id === "beetle")     return make("mon-beetle",  14, 10, drawBeetle);
    if (id === "bat")        return make("mon-bat",     14, 10, drawBat);
    if (id === "wolf-pup")   return make("mon-wolf",    18, 14, drawWolf);
    if (id === "bandit")     return make("mon-bandit",  16, 24, drawBandit);
    if (id === "kobold")     return make("mon-kobold",  16, 18, drawKobold);
    if (id === "skeleton")   return make("mon-skeleton",16, 22, drawSkeleton);
    if (id === "wraith" || id === "sorcerer" || id === "cherub")
                              return make(`mon-${id}`,  16, 20, drawWraith);
    if (id === "stone-guardian" || id === "golem-iron")
                              return make(`mon-${id}`,  18, 20, drawGuardian);
    if (data.boss) {
      const hue = id.includes("crystal") || id.includes("lich") ? "void"
                : id.includes("sky") || id.includes("warden") ? "ice" : "fire";
      return make(`mon-${id}`, 24, 24, ctx => drawBoss(ctx, hue));
    }
    if (data.wings) return make("mon-bat", 14, 10, drawBat);
    return slime("slime-grass");
  }

  function tree(tall=false)   { return make(`tree-${tall?'b':'s'}`, tall?18:14, tall?20:15, ctx => drawTree(ctx, tall)); }
  function rock()             { return make("rock", 11, 8, drawRock); }
  function crystal(tall=false){ return make(`crystal-${tall?'b':'s'}`, tall?9:7, tall?11:8, ctx => drawCrystal(ctx, tall)); }
  function mushroom()         { return make("mushroom", 10, 10, drawMushroom); }
  function flower()           { return make("flower", 5, 8, drawFlower); }
  function pillar()           { return make("pillar", 9, 11, drawPillar); }
  function itemIcon(itemId)   { return make(`item-${itemId}`, 16, 16, ctx => drawItemIcon(ctx, iconForItem(itemId))); }

  // Zone thumbnail — small pixel diorama 88x60 with stronger composition.
  function zoneThumb(zoneId) {
    const z = window.GameData.ZONES.find(z => z.id === zoneId);
    return make(`thumb-${zoneId}`, 88, 60, (ctx, w, h) => {
      // sky
      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, z.palette.sky[0]);
      grd.addColorStop(1, z.palette.sky[1]);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // sun/moon halo
      ctx.fillStyle = z.palette.accent;
      ctx.globalAlpha = 0.25;
      ctx.beginPath(); ctx.arc(w-18, 14, 11, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;

      // far hills
      ctx.fillStyle = z.palette.hills[0];
      ctx.beginPath();
      ctx.moveTo(0, 36);
      for (let x = 0; x <= w; x += 4) ctx.lineTo(x, 36 - Math.sin(x*0.18 + zoneId.length) * 5 - 4);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
      ctx.fill();

      // hill shading
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      for (let x = 0; x < w; x += 3) {
        const dy = Math.sin(x*0.18 + zoneId.length) * 5 + 4;
        ctx.fillRect(x, 36 - dy + 1, 1, 1);
      }

      // near hills
      ctx.fillStyle = z.palette.hills[1];
      ctx.beginPath();
      ctx.moveTo(0, 46);
      for (let x = 0; x <= w; x += 4) ctx.lineTo(x, 46 - Math.cos(x*0.22 + zoneId.length*1.4) * 4 - 2);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
      ctx.fill();

      // grass with darker bottom band
      ctx.fillStyle = z.palette.grass;
      ctx.fillRect(0, h-12, w, 12);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(0, h-3, w, 3);

      // sun/moon disc
      ctx.fillStyle = z.palette.accent;
      ctx.beginPath(); ctx.arc(w-18, 14, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillRect(w-21, 12, 1, 1);

      // tiny hero silhouette w/ lantern
      ctx.fillStyle = "#1a1320";
      ctx.fillRect(20, h-18, 3, 6);
      ctx.fillRect(22, h-13, 1, 2);
      // lantern
      ctx.fillStyle = z.palette.accent;
      ctx.fillRect(19, h-14, 1, 1);
      ctx.fillStyle = "rgba(255,200,110,0.7)";
      ctx.fillRect(18, h-15, 3, 3);

      // zone-specific landmarks
      if (zoneId === "meadow") {
        // tree
        ctx.fillStyle = "#3a2410"; ctx.fillRect(60, h-15, 3, 7);
        ctx.fillStyle = "#3e6432"; ctx.beginPath(); ctx.arc(61, h-18, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#5a8a48"; ctx.beginPath(); ctx.arc(60, h-19, 4, 0, Math.PI*2); ctx.fill();
        // flower
        ctx.fillStyle = "#f3a4c3"; ctx.fillRect(45, h-13, 1, 1);
        ctx.fillStyle = "#f3c963"; ctx.fillRect(45, h-12, 1, 1);
      } else if (zoneId === "forest") {
        // multiple trees
        for (const tx of [50, 62, 72]) {
          ctx.fillStyle = "#2a1810"; ctx.fillRect(tx, h-16, 2, 6);
          ctx.fillStyle = "#243824"; ctx.beginPath(); ctx.arc(tx+1, h-19, 5, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = "#456e3c"; ctx.beginPath(); ctx.arc(tx, h-20, 3, 0, Math.PI*2); ctx.fill();
        }
      } else if (zoneId === "cave") {
        // crystals
        ctx.fillStyle = "#7a8edc"; ctx.beginPath();
        ctx.moveTo(56, h-10); ctx.lineTo(60, h-22); ctx.lineTo(64, h-10); ctx.fill();
        ctx.fillStyle = "#c4d4ff"; ctx.beginPath();
        ctx.moveTo(58, h-10); ctx.lineTo(60, h-22); ctx.lineTo(60, h-10); ctx.fill();
        ctx.fillStyle = "#7a8edc"; ctx.beginPath();
        ctx.moveTo(67, h-10); ctx.lineTo(70, h-16); ctx.lineTo(73, h-10); ctx.fill();
      } else if (zoneId === "ruins") {
        // pillars
        ctx.fillStyle = "#9b8060";
        ctx.fillRect(54, h-22, 4, 12);
        ctx.fillRect(62, h-22, 4, 12);
        ctx.fillStyle = "#c89b3c";
        ctx.fillRect(52, h-24, 16, 2);
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(57, h-22, 1, 12);
        ctx.fillRect(65, h-22, 1, 12);
      } else if (zoneId === "tower") {
        // tall tower silhouette
        ctx.fillStyle = "#3a2a48";
        ctx.fillRect(56, h-30, 12, 20);
        ctx.fillRect(58, h-34, 8, 4);
        ctx.fillStyle = "#5a4868";
        ctx.fillRect(58, h-30, 1, 18);
        ctx.fillStyle = "#ffd078";
        ctx.fillRect(60, h-26, 2, 2);  // lit window
        ctx.fillRect(60, h-20, 2, 2);
      } else if (zoneId === "skyisle") {
        // floating cloud platform
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(58, 30, 6, 0, Math.PI*2);
        ctx.arc(64, 28, 5, 0, Math.PI*2);
        ctx.arc(70, 30, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#a45a3a";
        ctx.fillRect(58, 32, 14, 3);
      }
    });
  }

  return {
    hero, portrait, monster, slime, tree, rock, crystal, mushroom, flower, pillar,
    itemIcon, zoneThumb, _cache: cache
  };
})();

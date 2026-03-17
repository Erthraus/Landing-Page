/* src/game.js — CAREER_SIM v3.1 — Advanced platformer */
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const hintText = document.getElementById("hint-text");
  const distCounter = document.getElementById("dist-counter");
  const skillsUi = document.getElementById("skills-ui");

  let W, H;
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
  }
  window.addEventListener("resize", resize);
  resize();

  /* ═══════ INPUT ═══════ */
  const keys = {};
  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (hintText) hintText.style.display = "none";
  });
  window.addEventListener("keyup", (e) => (keys[e.code] = false));
  ["btn-left", "btn-right", "btn-up"].forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const code =
      id === "btn-left"
        ? "ArrowLeft"
        : id === "btn-right"
          ? "ArrowRight"
          : "ArrowUp";
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      keys[code] = true;
    });
    btn.addEventListener("pointerup", (e) => {
      e.preventDefault();
      keys[code] = false;
    });
    btn.addEventListener("pointerleave", () => {
      keys[code] = false;
    });
  });
  const kL = () => keys.ArrowLeft || keys.KeyA;
  const kR = () => keys.ArrowRight || keys.KeyD;
  const kJ = () => keys.ArrowUp || keys.KeyW || keys.Space;
  const kD = () => keys.ArrowDown || keys.KeyS;

  /* ═══════ CONSTANTS ═══════ */
  const G = 0.55,
    MAXF = 14,
    ACC = 0.8,
    DEC = 0.6,
    MAXS = 6;
  const JV = -13,
    COY = 100,
    JBF = 100,
    SB = -9,
    DTM = 180;
  const GL = H - 80; // ground level
  const PW = 28,
    PH = 48; // player size

  /* ═══════ LEVEL DATA ═══════ */
  // Platform types: solid (thick ground), thin (drop-through), moving
  const platforms = [
    // ══ SEC 1: University (easy intro) ══
    { x: 0, y: GL, w: 1400, h: 100, solid: true },
    { x: 350, y: GL - 80, w: 90, h: 16, solid: false },
    { x: 550, y: GL - 150, w: 90, h: 16, solid: false },

    // ══ SEC 2: TA ══
    { x: 1600, y: GL, w: 500, h: 100, solid: true },
    { x: 1700, y: GL - 110, w: 100, h: 16, solid: false },
    { x: 1900, y: GL - 200, w: 100, h: 16, solid: false },
    { x: 2250, y: GL, w: 700, h: 100, solid: true },

    // ══ SEC 3: GameDev (harder jumps) ══
    { x: 3100, y: GL - 50, w: 110, h: 16, solid: false },
    { x: 3350, y: GL - 130, w: 110, h: 16, solid: false },
    { x: 3600, y: GL, w: 700, h: 100, solid: true },
    { x: 3750, y: GL - 110, w: 100, h: 16, solid: false },
    { x: 3750, y: GL - 220, w: 100, h: 16, solid: false },

    // ══ SEC 4: Hacettepe ══
    { x: 4500, y: GL, w: 500, h: 100, solid: true },
    { x: 4600, y: GL - 90, w: 80, h: 16, solid: false },
    { x: 4750, y: GL - 180, w: 80, h: 16, solid: false },
    { x: 4900, y: GL - 260, w: 80, h: 16, solid: false },
    { x: 5150, y: GL, w: 900, h: 100, solid: true },

    // ══ SEC 5: Defense (floating islands + moving) ══
    { x: 6200, y: GL - 50, w: 120, h: 16, solid: false },
    { x: 6450, y: GL - 130, w: 120, h: 16, solid: false },
    // (moving platforms added separately below)
    { x: 6900, y: GL, w: 600, h: 100, solid: true },
    { x: 6950, y: GL - 120, w: 100, h: 16, solid: false },
    { x: 6950, y: GL - 240, w: 120, h: 16, solid: false },
    { x: 6950, y: GL - 340, w: 120, h: 16, solid: false },

    // ══ SEC 6: Erasmus (tricky alternating) ══
    { x: 7700, y: GL, w: 350, h: 100, solid: true },
    { x: 8150, y: GL - 60, w: 110, h: 16, solid: false },
    { x: 8350, y: GL - 160, w: 110, h: 16, solid: false },
    { x: 8550, y: GL - 60, w: 110, h: 16, solid: false },
    // (moving platform below)
    { x: 8900, y: GL, w: 700, h: 100, solid: true },
    { x: 8950, y: GL - 130, w: 100, h: 16, solid: false },
    { x: 8950, y: GL - 260, w: 120, h: 16, solid: false },

    // ══ SEC 7: XR (hardest) ══
    { x: 9800, y: GL - 50, w: 100, h: 16, solid: false },
    // (moving platforms below)
    { x: 10300, y: GL, w: 500, h: 100, solid: true },
    { x: 10400, y: GL - 110, w: 90, h: 16, solid: false },
    { x: 10400, y: GL - 220, w: 90, h: 16, solid: false },
    { x: 10400, y: GL - 330, w: 100, h: 16, solid: false },
    // Final ground
    { x: 10950, y: GL, w: 1200, h: 100, solid: true },
  ];

  // Moving platforms: { x, y, w, h, type:"hori"|"vert"|"fall", range, speed, ... }
  const movingPlatforms = [
    // SEC 5: horizontal ferry over gap
    {
      x: 6600,
      y: GL - 60,
      w: 110,
      h: 16,
      type: "hori",
      ox: 6550,
      range: 250,
      speed: 1.5,
      phase: 0,
    },
    // SEC 6: vertical lift
    {
      x: 8700,
      y: GL - 100,
      w: 110,
      h: 16,
      type: "vert",
      oy: GL - 100,
      range: 180,
      speed: 1,
      phase: 0,
    },
    // SEC 7: horizontal ferry 1
    {
      x: 9950,
      y: GL - 130,
      w: 100,
      h: 16,
      type: "hori",
      ox: 9900,
      range: 300,
      speed: 2,
      phase: 0,
    },
    // SEC 7: falling platform (crumbles after standing)
    {
      x: 10150,
      y: GL - 60,
      w: 100,
      h: 16,
      type: "fall",
      fallTimer: 0,
      falling: false,
      oy: GL - 60,
      fallen: false,
      respawnTimer: 0,
    },
  ];

  // Milestones — placed on solid ground, well-separated
  const milestones = [
    {
      id: "uni",
      x: 250,
      title: "2021 · Çankaya Uni",
      desc: "B.S. Computer Eng · GPA 3.68",
      reqs: [],
    },
    {
      id: "ta",
      x: 2500,
      title: "2022 · Teaching Assistant",
      desc: "Coding labs & algorithms TA",
      reqs: ["C", "Algo"],
    },
    {
      id: "gamelab",
      x: 4050,
      title: "2023 · GameDev Intern",
      desc: "C++ dev on GlistEngine",
      reqs: ["C++", "OOP"],
    },
    {
      id: "hacettepe",
      x: 5700,
      title: "2023 · Hacettepe Transfer",
      desc: "B.S. Computer Science",
      reqs: ["DS"],
    },
    {
      id: "defense",
      x: 7250,
      title: "2024 · TÜBİTAK & HAVELSAN",
      desc: "Defense R&D · Software Intern",
      reqs: ["Py", "Linux"],
    },
    {
      id: "erasmus",
      x: 9300,
      title: "2024 · Erasmus Germany",
      desc: "Data Science · Uni Marburg",
      reqs: ["Data", "ML"],
    },
    {
      id: "xr",
      x: 11600,
      title: "2025 · XR Product Dev",
      desc: "VR Akademi · ODTÜ Teknokent",
      reqs: ["Unity", "C#"],
    },
  ];

  // Skills — placed between milestones, never overlapping
  const skills = [
    { id: "C", x: 800, y: GL - 80 },
    { id: "Algo", x: 1200, y: GL - 80 },
    { id: "C++", x: 1950, y: GL - 270 },
    { id: "OOP", x: 2700, y: GL - 80 },
    { id: "DS", x: 4960, y: GL - 330 },
    { id: "Py", x: 5500, y: GL - 80 },
    { id: "Linux", x: 7010, y: GL - 410 },
    { id: "Data", x: 7900, y: GL - 80 },
    { id: "ML", x: 9010, y: GL - 330 },
    { id: "Unity", x: 9500, y: GL - 80 },
    { id: "C#", x: 10460, y: GL - 400 },
  ].map((s) => ({ ...s, collected: false }));

  // Enemies — walkers only on solid ground with proper boundaries
  const enemies = [
    // SEC 1 easy
    {
      type: "walk",
      w: 36,
      h: 36,
      vx: 1.2,
      platIdx: 0,
      offL: 300,
      offR: 1100,
      alive: true,
    },
    // SEC 2
    {
      type: "fly",
      w: 32,
      h: 32,
      vx: 1.5,
      startX: 2300,
      endX: 2800,
      alive: true,
      originY: GL - 140,
    },
    {
      type: "walk",
      w: 36,
      h: 36,
      vx: 1.8,
      platIdx: 6,
      offL: 100,
      offR: 500,
      alive: true,
    },
    // SEC 3 (harder)
    {
      type: "walk",
      w: 36,
      h: 36,
      vx: 2.2,
      platIdx: 9,
      offL: 50,
      offR: 550,
      alive: true,
    },
    {
      type: "jump",
      w: 32,
      h: 32,
      vx: 1,
      startX: 3650,
      endX: 4100,
      alive: true,
      vy: 0,
      onGround: true,
    },
    // SEC 4
    {
      type: "walk",
      w: 36,
      h: 36,
      vx: 2.5,
      platIdx: 16,
      offL: 50,
      offR: 700,
      alive: true,
    },
    {
      type: "fly",
      w: 32,
      h: 32,
      vx: -2,
      startX: 5300,
      endX: 5900,
      alive: true,
      originY: GL - 120,
    },
    // SEC 5 (challenging)
    {
      type: "walk",
      w: 36,
      h: 36,
      vx: 2.5,
      platIdx: 20,
      offL: 50,
      offR: 450,
      alive: true,
    },
    {
      type: "jump",
      w: 32,
      h: 32,
      vx: -1.5,
      startX: 6950,
      endX: 7350,
      alive: true,
      vy: 0,
      onGround: true,
    },
    // SEC 6
    {
      type: "fly",
      w: 32,
      h: 32,
      vx: 2.5,
      startX: 8100,
      endX: 8600,
      alive: true,
      originY: GL - 200,
    },
    {
      type: "walk",
      w: 36,
      h: 36,
      vx: 3,
      platIdx: 28,
      offL: 50,
      offR: 550,
      alive: true,
    },
    // SEC 7 hardest
    {
      type: "jump",
      w: 32,
      h: 32,
      vx: 1.5,
      startX: 10350,
      endX: 10700,
      alive: true,
      vy: 0,
      onGround: true,
    },
    {
      type: "fly",
      w: 32,
      h: 32,
      vx: -3,
      startX: 11000,
      endX: 11500,
      alive: true,
      originY: GL - 150,
    },
    {
      type: "walk",
      w: 36,
      h: 36,
      vx: 3.5,
      platIdx: 35,
      offL: 50,
      offR: 900,
      alive: true,
    },
  ];

  // Initialize walker enemies on their platforms, with boundaries clamped to platform edges
  enemies.forEach((e) => {
    if (e.type === "walk") {
      const p = platforms[e.platIdx];
      e.startX = p.x + e.offL;
      e.endX = Math.min(p.x + e.offR, p.x + p.w - e.w); // never past platform edge
      e.x = e.startX;
      e.y = p.y - e.h;
    } else if (e.type === "fly") {
      e.x = e.startX;
      e.y = e.originY;
    } else if (e.type === "jump") {
      e.x = e.startX;
      e.y = GL - e.h;
    }
  });

  // Gates
  const gates = milestones
    .filter((m) => m.reqs.length > 0)
    .map((m) => ({
      x: m.x - 80,
      w: 16,
      reqs: m.reqs,
      open: false,
      milestoneTitle: m.title,
    }));

  /* ═══════ PLAYER STATE ═══════ */
  const player = {
    x: 100,
    y: GL - PH,
    vx: 0,
    vy: 0,
    grounded: false,
    facingRight: true,
    lastGroundTime: 0,
    lastJumpPress: 0,
    respawning: false,
    finishedGame: false,
    animFrame: 0,
    animTimer: 0,
    dropThrough: 0,
    onMovingPlat: null, // reference to moving platform player is standing on
  };
  let checkpoint = { x: 100 };
  const inv = new Set();
  let deathFlash = 0;
  let particles = [];
  let t = 0;

  /* ═══════ HELPERS ═══════ */
  function spawnP(x, y, color, n) {
    for (let i = 0; i < n; i++)
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 1) * 5,
        life: 30 + Math.random() * 20,
        color,
        size: 2 + Math.random() * 3,
      });
  }
  function hits(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function die() {
    if (player.respawning) return;
    player.respawning = true;
    deathFlash = 20;
    spawnP(player.x + PW / 2, player.y + PH / 2, "#f00", 15);
    setTimeout(() => {
      player.x = checkpoint.x;
      player.y = -100;
      player.vx = 0;
      player.vy = 0;
      player.respawning = false;
    }, 600);
  }

  /* ═══════ UPDATE ═══════ */
  function update(dt) {
    t += dt;
    if (player.respawning) {
      updParticles();
      return;
    }

    // ── Moving platforms update ──
    player.onMovingPlat = null;
    movingPlatforms.forEach((mp) => {
      if (mp.type === "hori") {
        const prev = mp.x;
        mp.phase += mp.speed * 0.016;
        mp.x = mp.ox + Math.sin(mp.phase) * mp.range;
        mp.dx = mp.x - prev; // delta for carrying player
      } else if (mp.type === "vert") {
        const prev = mp.y;
        mp.phase += mp.speed * 0.016;
        mp.y = mp.oy + Math.sin(mp.phase) * mp.range;
        mp.dy = mp.y - prev;
        mp.dx = 0;
      } else if (mp.type === "fall") {
        mp.dx = 0;
        mp.dy = 0;
        if (mp.fallen) {
          mp.respawnTimer -= dt;
          if (mp.respawnTimer <= 0) {
            mp.fallen = false;
            mp.falling = false;
            mp.fallTimer = 0;
            mp.y = mp.oy;
          }
          return;
        }
        if (mp.falling) {
          mp.y += 4;
          if (mp.y > GL + 200) {
            mp.fallen = true;
            mp.respawnTimer = 3000;
          }
        }
      }
    });

    // ── Drop-through ──
    if (kD() && player.grounded) {
      const allPlats = [...platforms, ...movingPlatforms];
      for (const p of allPlats) {
        if (p.solid) continue;
        if (
          player.y + PH >= p.y &&
          player.y + PH <= p.y + (p.h || 16) + 4 &&
          player.x + PW > p.x &&
          player.x < p.x + p.w
        ) {
          player.dropThrough = performance.now();
          player.grounded = false;
          player.y += 6;
          break;
        }
      }
    }

    // ── Horizontal movement ──
    if (kR()) {
      player.vx = Math.min(player.vx + ACC, MAXS);
      player.facingRight = true;
    } else if (kL()) {
      player.vx = Math.max(player.vx - ACC, -MAXS);
      player.facingRight = false;
    } else {
      if (player.vx > 0) player.vx = Math.max(0, player.vx - DEC);
      else if (player.vx < 0) player.vx = Math.min(0, player.vx + DEC);
    }
    player.x += player.vx;
    if (player.x < 0) {
      player.x = 0;
      player.vx = 0;
    }

    // ── Gates ──
    gates.forEach((g) => {
      if (g.open) return;
      if (g.reqs.every((r) => inv.has(r))) {
        g.open = true;
        return;
      }
      if (hits(player.x, player.y, PW, PH, g.x, GL - 400, g.w, 400)) {
        if (player.vx > 0) {
          player.x = g.x - PW;
          player.vx = 0;
        }
      }
    });

    // ── Collectibles ──
    skills.forEach((s) => {
      if (s.collected) return;
      if (hits(player.x, player.y, PW, PH, s.x - 18, s.y - 18, 36, 36)) {
        s.collected = true;
        inv.add(s.id);
        skillsUi.innerText = inv.size;
        spawnP(s.x, s.y, "#0f0", 10);
      }
    });

    // ── Gravity ──
    player.vy = Math.min(player.vy + G, MAXF);
    player.y += player.vy;

    // ── Platform collision ──
    const isDrop = performance.now() - player.dropThrough < DTM;
    player.grounded = false;

    // Static platforms
    for (const p of platforms) {
      if (!p.solid && isDrop) continue;
      if (!hits(player.x, player.y, PW, PH, p.x, p.y, p.w, p.h)) continue;
      if (player.vy >= 0 && player.y + PH - player.vy <= p.y + 8) {
        player.y = p.y - PH;
        player.vy = 0;
        player.grounded = true;
        player.lastGroundTime = performance.now();
      }
    }

    // Moving platforms
    for (const mp of movingPlatforms) {
      if (mp.fallen) continue;
      if (isDrop) continue;
      if (!hits(player.x, player.y, PW, PH, mp.x, mp.y, mp.w, mp.h || 16))
        continue;
      if (player.vy >= 0 && player.y + PH - player.vy <= mp.y + 8) {
        player.y = mp.y - PH;
        player.vy = 0;
        player.grounded = true;
        player.lastGroundTime = performance.now();
        player.onMovingPlat = mp;
        // Falling platform trigger
        if (mp.type === "fall" && !mp.falling) {
          mp.fallTimer += dt;
          if (mp.fallTimer > 500) mp.falling = true;
        }
      }
    }

    // Carry player on moving platform
    if (player.onMovingPlat) {
      const mp = player.onMovingPlat;
      if (mp.dx) player.x += mp.dx;
      if (mp.dy) player.y += mp.dy;
    }

    // ── Jump ──
    if (kJ()) player.lastJumpPress = performance.now();
    const now = performance.now();
    if (
      now - player.lastJumpPress < JBF &&
      (player.grounded || now - player.lastGroundTime < COY)
    ) {
      player.vy = JV;
      player.grounded = false;
      player.lastGroundTime = 0;
      player.lastJumpPress = 0;
    }
    if (!kJ() && player.vy < JV * 0.4) player.vy = JV * 0.4;

    // ── Enemies ──
    const allPlatCollide = [
      ...platforms,
      ...movingPlatforms.filter((mp) => !mp.fallen),
    ];
    enemies.forEach((e) => {
      if (!e.alive) return;
      e.x += e.vx;
      if (e.x < e.startX || e.x + e.w > e.endX) e.vx *= -1;

      if (e.type === "fly") {
        e.y = e.originY + Math.sin(t * 0.003) * 25;
      } else if (e.type === "jump") {
        if (e.onGround) {
          e.vy = -11;
          e.onGround = false;
        }
        e.vy += G;
        e.y += e.vy;
        for (const p of allPlatCollide) {
          if (hits(e.x, e.y, e.w, e.h, p.x, p.y, p.w, p.h || 16)) {
            if (e.vy > 0 && e.y + e.h - e.vy <= p.y + 10) {
              e.y = p.y - e.h;
              e.vy = 0;
              e.onGround = true;
            }
          }
        }
      }
      // walk type doesn't need gravity — they are pinned on their platform via startX/endX

      if (!hits(player.x, player.y, PW, PH, e.x, e.y, e.w, e.h)) return;
      if (player.vy > 0 && player.y + PH - player.vy <= e.y + e.h * 0.45) {
        e.alive = false;
        player.vy = SB;
        spawnP(e.x + e.w / 2, e.y + e.h / 2, "#f00", 12);
      } else {
        die();
      }
    });

    // ── Checkpoints ──
    milestones.forEach((m) => {
      if (Math.abs(player.x + PW / 2 - m.x) < 120) checkpoint.x = m.x - PW / 2;
    });

    // ── End game ──
    const xr = milestones.find((m) => m.id === "xr");
    if (xr && Math.abs(player.x + PW / 2 - xr.x) < 60 && !player.finishedGame) {
      player.finishedGame = true;
      setTimeout(() => {
        window.location.href = "portfolio.html";
      }, 3500);
    }

    // ── Death pit ──
    if (player.y > H + 100) die();

    // ── Animation ──
    if (Math.abs(player.vx) > 0.5 && player.grounded) {
      player.animTimer++;
      if (player.animTimer > 5) {
        player.animTimer = 0;
        player.animFrame = (player.animFrame + 1) % 4;
      }
    } else {
      player.animFrame = 0;
      player.animTimer = 0;
    }

    updParticles();
    camera.x += (player.x - W * 0.35 - camera.x) * 0.1;
    if (camera.x < 0) camera.x = 0;
    distCounter.innerText = Math.floor(player.x / 10);
  }

  function updParticles() {
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life--;
    });
    particles = particles.filter((p) => p.life > 0);
  }

  /* ═══════ DRAWING ═══════ */
  const camera = { x: 0 };

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(-camera.x, 0);

    // ── Static Platforms ──
    platforms.forEach((p) => drawPlatform(p));

    // ── Moving Platforms ──
    movingPlatforms.forEach((mp) => {
      if (mp.fallen) return;
      // Shake effect for falling platform about to drop
      let sx = 0;
      if (mp.type === "fall" && mp.fallTimer > 0 && !mp.falling)
        sx = (Math.random() - 0.5) * 4;

      ctx.save();
      ctx.translate(sx, 0);

      // Draw as thin platform with special color
      ctx.fillStyle =
        mp.type === "fall" ? "rgba(255,100,0,0.15)" : "rgba(0,180,255,0.15)";
      ctx.fillRect(mp.x, mp.y, mp.w, mp.h || 16);
      ctx.strokeStyle = mp.type === "fall" ? "#f80" : "#0af";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(mp.x, mp.y);
      ctx.lineTo(mp.x + mp.w, mp.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Direction arrows for moving platforms
      if (mp.type === "hori") {
        ctx.fillStyle = "#0af";
        ctx.font = "12px sans-serif";
        ctx.fillText("↔", mp.x + mp.w / 2 - 5, mp.y + 12);
      } else if (mp.type === "vert") {
        ctx.fillStyle = "#0af";
        ctx.font = "12px sans-serif";
        ctx.fillText("↕", mp.x + mp.w / 2 - 4, mp.y + 12);
      } else if (mp.type === "fall") {
        ctx.fillStyle = "#f80";
        ctx.font = "12px sans-serif";
        ctx.fillText("⚠", mp.x + mp.w / 2 - 5, mp.y + 13);
      }
      ctx.restore();
    });

    // ── Gates ──
    gates.forEach((g) => {
      if (g.open) return;
      // Animated laser scanlines
      for (let i = 0; i < 400; i += 6) {
        const a = 0.2 + Math.sin(t * 0.005 + i * 0.1) * 0.3;
        ctx.fillStyle = `rgba(255,0,0,${Math.abs(a)})`;
        ctx.fillRect(g.x, GL - 400 + i, g.w, 4);
      }
      ctx.strokeStyle = "#f00";
      ctx.lineWidth = 1;
      ctx.strokeRect(g.x, GL - 400, g.w, 400);

      if (Math.abs(player.x + PW / 2 - g.x) < 100) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#f00";
        ctx.font = "bold 20px 'VT323', monospace";
        ctx.fillText("⚠ ACCESS DENIED", g.x + g.w / 2, GL - 425);
        ctx.fillStyle = "#fff";
        ctx.font = "16px 'VT323', monospace";
        ctx.fillText("NEED: " + g.reqs.join(", "), g.x + g.w / 2, GL - 403);
        ctx.textAlign = "left";
      }
    });

    // ── Milestones ──
    milestones.forEach((m) => {
      const isAct = checkpoint.x === m.x - PW / 2;
      // Pole
      ctx.strokeStyle = isAct ? "#0f0" : "#005500";
      ctx.lineWidth = isAct ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(m.x, GL);
      ctx.lineTo(m.x, GL - 100);
      ctx.stroke();

      // Sign board
      const sw = 200,
        sh = 58;
      const sx = m.x - sw / 2,
        sy = GL - 100 - sh - 10;

      // Glow for active checkpoint
      if (isAct) {
        ctx.shadowColor = "#0f0";
        ctx.shadowBlur = 12;
      }
      ctx.fillStyle = "rgba(0,12,0,0.93)";
      roundRect(ctx, sx, sy, sw, sh, 4);
      ctx.fill();
      ctx.strokeStyle = isAct ? "#0f0" : "#004400";
      ctx.lineWidth = isAct ? 2 : 1;
      roundRect(ctx, sx, sy, sw, sh, 4);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px 'VT323', monospace";
      ctx.fillText(m.title, m.x, sy + 22);
      ctx.fillStyle = isAct ? "#0f0" : "#006600";
      ctx.font = "14px 'VT323', monospace";
      ctx.fillText(m.desc, m.x, sy + 42);
      ctx.textAlign = "left";
    });

    // ── Skills ──
    const OR = 18;
    skills.forEach((s) => {
      if (s.collected) return;
      const bob = Math.sin(t * 0.004 + s.x) * 4;
      const sy = s.y + bob;
      // Outer glow
      ctx.shadowColor = "#0f0";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#0f0";
      ctx.beginPath();
      ctx.arc(s.x, sy, OR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Inner
      ctx.fillStyle = "#001a00";
      ctx.beginPath();
      ctx.arc(s.x, sy, OR - 4, 0, Math.PI * 2);
      ctx.fill();
      // Rotating highlight
      const angle = t * 0.003;
      ctx.fillStyle = "rgba(0,255,65,0.4)";
      ctx.beginPath();
      ctx.arc(
        s.x + Math.cos(angle) * 6,
        sy + Math.sin(angle) * 6,
        4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      // Label above
      ctx.textAlign = "center";
      ctx.fillStyle = "#0f0";
      ctx.font = "bold 16px 'VT323', monospace";
      ctx.fillText(s.id, s.x, sy - OR - 6);
      ctx.textAlign = "left";
    });

    // ── Enemies ──
    enemies.forEach((e) => {
      if (e.alive) drawEnemy(e);
    });

    // ── Player ──
    if (!player.respawning || Math.floor(t / 80) % 2) drawPlayer();

    // ── Particles ──
    particles.forEach((p) => {
      ctx.globalAlpha = p.life / 50;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    // ── End message ──
    if (player.finishedGame) {
      const xr = milestones.find((m) => m.id === "xr");
      if (xr) {
        ctx.textAlign = "center";
        ctx.shadowColor = "#0f0";
        ctx.shadowBlur = 15;
        ctx.fillStyle = "#fff";
        ctx.font = "bold 28px 'VT323', monospace";
        ctx.fillText("SIMULATION COMPLETE", xr.x, GL - 200);
        ctx.font = "20px 'VT323', monospace";
        ctx.fillText("Returning to Terminal...", xr.x, GL - 170);
        ctx.shadowBlur = 0;
        ctx.textAlign = "left";
      }
    }

    ctx.restore();

    // Death flash
    if (deathFlash > 0) {
      ctx.fillStyle = `rgba(255,0,0,${deathFlash / 40})`;
      ctx.fillRect(0, 0, W, H);
      deathFlash--;
    }
  }

  /* ── Platform drawing ── */
  function drawPlatform(p) {
    if (p.solid) {
      // Gradient fill for depth
      const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
      grad.addColorStop(0, "#002a00");
      grad.addColorStop(1, "#000800");
      ctx.fillStyle = grad;
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // Top surface highlight (bright neon edge)
      ctx.strokeStyle = "#0f0";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.w, p.y);
      ctx.stroke();

      // Left/right edges
      ctx.strokeStyle = "rgba(0,255,65,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y + p.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x + p.w, p.y);
      ctx.lineTo(p.x + p.w, p.y + p.h);
      ctx.stroke();

      // Grid pattern
      ctx.strokeStyle = "rgba(0,255,65,0.08)";
      for (let gx = p.x; gx < p.x + p.w; gx += 30) {
        ctx.beginPath();
        ctx.moveTo(gx, p.y);
        ctx.lineTo(gx, p.y + p.h);
        ctx.stroke();
      }
      for (let gy = p.y + 30; gy < p.y + p.h; gy += 30) {
        ctx.beginPath();
        ctx.moveTo(p.x, gy);
        ctx.lineTo(p.x + p.w, gy);
        ctx.stroke();
      }

      // Top surface "circuit" dots every ~60px
      ctx.fillStyle = "#0f0";
      for (let dx = 20; dx < p.w; dx += 60) {
        ctx.beginPath();
        ctx.arc(p.x + dx, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Thin drop-through — dashed with subtle glow
      ctx.strokeStyle = "#0f0";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.w, p.y);
      ctx.stroke();
      ctx.setLineDash([]);
      // Very subtle fill below
      ctx.fillStyle = "rgba(0,255,65,0.04)";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // Small brackets at edges
      ctx.strokeStyle = "rgba(0,255,65,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 8);
      ctx.lineTo(p.x, p.y);
      ctx.lineTo(p.x + 8, p.y);
      ctx.moveTo(p.x + p.w - 8, p.y);
      ctx.lineTo(p.x + p.w, p.y);
      ctx.lineTo(p.x + p.w, p.y + 8);
      ctx.stroke();
    }
  }

  /* ── Rounded rect helper ── */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ── Player ── */
  function drawPlayer() {
    const px = player.x,
      py = player.y,
      dir = player.facingRight ? 1 : -1;
    ctx.save();
    ctx.translate(px + PW / 2, py + PH);
    ctx.scale(dir, 1);
    ctx.translate(-PW / 2, -PH);
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(PW / 2, PH + 2, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Legs
    ctx.strokeStyle = "#0f0";
    ctx.lineWidth = 3;
    const la = player.grounded
      ? Math.sin((player.animFrame * Math.PI) / 2) * 6
      : 4;
    ctx.beginPath();
    ctx.moveTo(PW / 2 - 4, PH - 16);
    ctx.lineTo(PW / 2 - 4 - la, PH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PW / 2 + 4, PH - 16);
    ctx.lineTo(PW / 2 + 4 + la, PH);
    ctx.stroke();
    // Body
    ctx.fillStyle = "#111";
    ctx.strokeStyle = "#0f0";
    ctx.lineWidth = 2;
    ctx.fillRect(PW / 2 - 10, 14, 20, 22);
    ctx.strokeRect(PW / 2 - 10, 14, 20, 22);
    // Arms
    const aa = player.grounded
      ? Math.cos((player.animFrame * Math.PI) / 2) * 4
      : -6;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(PW / 2 - 10, 18);
    ctx.lineTo(PW / 2 - 16, 28 + aa);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PW / 2 + 10, 18);
    ctx.lineTo(PW / 2 + 16, 28 - aa);
    ctx.stroke();
    // Head
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(PW / 2, 8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f0";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Visor
    ctx.fillStyle = "#0f0";
    ctx.shadowColor = "#0f0";
    ctx.shadowBlur = 8;
    ctx.fillRect(PW / 2 + 1, 5, 10, 5);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /* ── Enemies ── */
  function drawEnemy(e) {
    const cx = e.x + e.w / 2,
      cy = e.y + e.h / 2;
    if (e.type === "walk") {
      ctx.fillStyle = "#200";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, e.w / 2, e.h / 2 - 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f00";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const ph = t * 0.01;
      ctx.strokeStyle = "#f00";
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i += 2) {
        for (let j = 0; j < 3; j++) {
          const off = Math.sin(ph + j * 2 + i) * 3;
          ctx.beginPath();
          ctx.moveTo(cx + i * (4 + j * 5), cy + 4);
          ctx.lineTo(cx + i * (10 + j * 4), cy + e.h / 2 + 2 + off);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "#f00";
      const ex = e.vx > 0 ? 4 : -8;
      ctx.fillRect(cx + ex, cy - 6, 4, 4);
      ctx.fillRect(cx + ex + 6, cy - 6, 4, 4);
    } else if (e.type === "fly") {
      ctx.fillStyle = "#200";
      ctx.strokeStyle = "#f00";
      ctx.lineWidth = 1.5;
      ctx.fillRect(cx - 6, cy - 4, 12, 8);
      ctx.strokeRect(cx - 6, cy - 4, 12, 8);
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy - 6);
      ctx.lineTo(cx + 16, cy - 6);
      ctx.stroke();
      const sp = Math.cos(t * 0.05);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 16 - 8 * sp, cy - 8);
      ctx.lineTo(cx - 16 + 8 * sp, cy - 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 16 - 8 * sp, cy - 8);
      ctx.lineTo(cx + 16 + 8 * sp, cy - 8);
      ctx.stroke();
      ctx.fillStyle = Math.floor(t / 200) % 2 ? "#f00" : "#600";
      ctx.fillRect(cx - 2, cy - 2, 4, 4);
    } else if (e.type === "jump") {
      const sq = e.vy < -2 ? 0.8 : e.onGround ? 1.2 : 1;
      const st = e.vy < -2 ? 1.3 : e.onGround ? 0.8 : 1;
      ctx.save();
      ctx.translate(cx, e.y + e.h);
      ctx.scale(sq, st);
      ctx.fillStyle = "#300";
      ctx.strokeStyle = "#f00";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, -e.h / 2, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f00";
      ctx.fillRect(-6, -e.h / 2 - 4, 4, 4);
      ctx.fillRect(3, -e.h / 2 - 4, 4, 4);
      ctx.restore();
    }
  }

  /* ═══════ LOOP ═══════ */
  let lt = performance.now();
  function loop(now) {
    update(now - lt);
    lt = now;
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
});

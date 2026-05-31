"use strict";

// ─── Canvas və Sabitlər ───────────────────────────────────────
const canvas = document.getElementById("c");
const ctx    = canvas.getContext("2d");

const W  = 560;
const H  = 420;
const TS = 20; 
const COLS = Math.floor(W / TS); 
const ROWS = Math.floor(H / TS); 

const LS_KEY = "dungeon_escape_hs";

// ─── Oyun Dəyişənləri ─────────────────────────────────────────
let player, enemies, chests, particles;
let gameState  = "idle"; // Başlanğıcda idle vəziyyəti
let keys       = {};
let doorOpen   = false;
let gold       = 0;
let score      = 0;
let attackAnim = 0;
let lastTime   = 0;
let msgTimer;
let wallMap    = [];

const WALL_DEFS = [
  [0, 0, COLS, 1], [0, ROWS - 1, COLS, 1], [0, 0, 1, ROWS], [COLS - 1, 0, 1, ROWS],
  [1, 5, 5, 1], [COLS - 7, 1, 1, 4], [COLS - 7, 4, 4, 1],
  [6, 8, 2, 2], [13, 4, 2, 2], [20, 9, 2, 2], [10, 14, 2, 2],
  [22, 3, 2, 2], [4, 16, 2, 2], [17, 15, 2, 2], [24, 13, 2, 2],
  [8, 12, 4, 1], [15, 7, 1, 4], [19, 12, 1, 3]
];

// ─── Köməkçi Funksiyalar ─────────────────────────────────────
function buildWallMap() {
  wallMap = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
  for (const [x, y, w, h] of WALL_DEFS) {
    for (let r = y; r < y + h && r < ROWS; r++) {
      for (let c = x; c < x + w && c < COLS; c++) {
        if (r >= 0 && c >= 0) wallMap[r][c] = true;
      }
    }
  }
}

function tileBlocked(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  return wallMap[ty][tx];
}

function rectBlocked(x, y, size) {
  const m = 2;
  return (
    tileBlocked(Math.floor((x + m)        / TS), Math.floor((y + m)        / TS)) ||
    tileBlocked(Math.floor((x + size - m) / TS), Math.floor((y + m)        / TS)) ||
    tileBlocked(Math.floor((x + m)        / TS), Math.floor((y + size - m) / TS)) ||
    tileBlocked(Math.floor((x + size - m) / TS), Math.floor((y + size - m) / TS))
  );
}

function updateHUD() {
  const aliveCount = enemies.filter(e => e.alive).length;
  document.getElementById("hp-num").textContent = Math.max(0, Math.floor(player.hp));
  const pct = Math.max(0, player.hp / player.maxHp) * 100;
  const bar = document.getElementById("hp-bar");
  if (bar) {
    bar.style.width = pct + "%";
    bar.style.background = pct > 50 ? "#4caf50" : pct > 25 ? "#ff9800" : "#f44336";
  }

  document.getElementById("gold-num").textContent  = gold;
  document.getElementById("enemy-num").textContent = aliveCount;

  const ds = document.getElementById("door-st");
  if (ds) {
    ds.textContent  = doorOpen ? "Open!" : "Locked";
    ds.style.color  = doorOpen ? "#81c784" : "#e57373";
  }

  // High score hissəsi (əgər html-də varsa)
  const hiHud = document.getElementById("hi-hud");
  if (hiHud) hiHud.textContent = localStorage.getItem(LS_KEY) || 0;
}

function showMsg(text) {
  const el = document.getElementById("msg-bar");
  if (!el) return;
  el.textContent = text;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { el.textContent = ""; }, 2500);
}

// ─── Oyunu Başlatma Funksiyası ───────────────────────────────
function startGame() {
  const screenEl = document.getElementById("screen");
  if (screenEl) screenEl.style.display = "none";
  
  buildWallMap();

  keys       = {};
  gold       = 0;
  score      = 0;
  gameState  = "playing";
  attackAnim = 0;
  particles  = [];
  doorOpen   = false;

  player = {
    x: 2 * TS, y: 2 * TS, size: 18, hp: 100, maxHp: 100, speed: 2.8, facing: 1, hitTimer: 0, attackCooldown: 0
  };

  enemies = [
    { x: 22 * TS, y: 2  * TS, size: 16, hp: 30, maxHp: 30, speed: 1.1, hitTimer: 0, atkTimer: 0, alive: true },
    { x: 18 * TS, y: 10 * TS, size: 16, hp: 30, maxHp: 30, speed: 1.0, hitTimer: 0, atkTimer: 0, alive: true },
    { x: 5  * TS, y: 12 * TS, size: 16, hp: 30, maxHp: 30, speed: 0.9, hitTimer: 0, atkTimer: 0, alive: true },
    { x: 12 * TS, y: 17 * TS, size: 16, hp: 30, maxHp: 30, speed: 1.2, hitTimer: 0, atkTimer: 0, alive: true },
    { x: 25 * TS, y: 16 * TS, size: 16, hp: 30, maxHp: 30, speed: 0.85,hitTimer: 0, atkTimer: 0, alive: true }
  ];

  chests = [
    { x: 3  * TS, y: 7  * TS, open: false, gold: 25 },
    { x: 24 * TS, y: 7  * TS, open: false, gold: 30 },
    { x: 14 * TS, y: 11 * TS, open: false, gold: 20 }
  ];

  updateHUD();
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

// ─── Oyun Dövrü (Loop) ────────────────────────────────────────
function loop(ts) {
  if (gameState !== "playing") return;
  const dt = Math.min((ts - lastTime) / 16.67, 3);
  lastTime = ts;
  
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ─── Məntiqi Yenilənmələr ─────────────────────────────────────
function update(dt) {
  let dx = 0, dy = 0;
  if (keys["w"] || keys["arrowup"])    dy -= 1;
  if (keys["s"] || keys["arrowdown"])  dy += 1;
  if (keys["a"] || keys["arrowleft"])  dx -= 1;
  if (keys["d"] || keys["arrowright"]) dx += 1;
  if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

  const sp = player.speed * dt;
  const nx = player.x + dx * sp;
  const ny = player.y + dy * sp;
  if (!rectBlocked(nx, player.y, player.size)) player.x = nx;
  if (!rectBlocked(player.x, ny, player.size)) player.y = ny;

  if (dx > 0) player.facing = 1;
  else if (dx < 0) player.facing = -1;

  if (player.hitTimer > 0)      player.hitTimer -= dt;
  if (player.attackCooldown > 0) player.attackCooldown -= dt;
  if (attackAnim > 0)            attackAnim -= dt * 2;

  // Uduzma şərtinin yoxlanılması
  if (player.hp <= 0) { 
    endGame(false); 
    return; 
  }

  const aliveEnemies = enemies.filter(e => e.alive);
  for (const e of aliveEnemies) {
    const edx  = player.x - e.x;
    const edy  = player.y - e.y;
    const dist = Math.sqrt(edx * edx + edy * edy);

    if (dist < 220) {
      const len = Math.max(dist, 0.1);
      const mvx = (edx / len) * e.speed * dt;
      const mvy = (edy / len) * e.speed * dt;
      if (!rectBlocked(e.x + mvx, e.y, e.size)) e.x += mvx;
      if (!rectBlocked(e.x, e.y + mvy, e.size)) e.y += mvy;
    }

    if (e.hitTimer > 0) e.hitTimer -= dt;
    if (e.atkTimer > 0) e.atkTimer -= dt;

    if (dist < 26 && e.atkTimer <= 0 && player.hitTimer <= 0) {
      player.hp     -= 5;
      player.hitTimer = 30;
      e.atkTimer      = 60;
      spawnParticles(player.x + 9, player.y + 9, "#f44336", 5);
    }
  }

  for (const ch of chests) {
    if (ch.open) continue;
    const dx2 = player.x - ch.x;
    const dy2 = player.y - ch.y;
    if (Math.sqrt(dx2 * dx2 + dy2 * dy2) < 26) {
      ch.open  = true;
      gold    += ch.gold;
      score   += ch.gold;
      spawnParticles(ch.x + 10, ch.y + 10, "#ffd700", 8);
      showMsg("Chest opened! +" + ch.gold + " gold");
    }
  }

  // Qazanma şərtinin yoxlanılması
  const doorX = (COLS - 4) * TS;
  const doorY = 1 * TS;
  if (aliveEnemies.length === 0) {
    doorOpen = true;
    const ddx = player.x - doorX;
    const ddy = player.y - doorY;
    if (Math.sqrt(ddx * ddx + ddy * ddy) < 30) {
      endGame(true);
      return;
    }
  }

  for (const p of particles) {
    p.x    += p.vx * dt;
    p.y    += p.vy * dt;
    p.life -= dt;
    p.vy   += 0.15 * dt;
  }
  particles = particles.filter(p => p.life > 0);

  updateHUD();
}

// ─── Hücum Mexanikası ─────────────────────────────────────────
function attack() {
  if (gameState !== "playing" || player.attackCooldown > 0) return;
  player.attackCooldown = 18;
  attackAnim = 8;

  const px = player.x + player.size / 2;
  const py = player.y + player.size / 2;

  for (const e of enemies) {
    if (!e.alive) continue;
    const ex   = e.x + e.size / 2;
    const ey   = e.y + e.size / 2;
    const dist = Math.sqrt((px - ex) ** 2 + (py - ey) ** 2);
    if (dist < 48) {
      e.hp -= 10;
      e.hitTimer = 8;
      spawnParticles(ex, ey, "#ff6b35", 6);
      if (e.hp <= 0) {
        e.alive = false;
        score  += 50;
        spawnParticles(ex, ey, "#ffd700", 10);
        showMsg("Enemy defeated! +50 pts");
      }
    }
  }
}

function spawnParticles(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x, y,
      vx:    Math.cos(a) * 2.5 * (Math.random() + 0.5),
      vy:    Math.sin(a) * 2.5 * (Math.random() + 0.5),
      life:  18 + Math.random() * 18,
      color,
    });
  }
}

// ─── Ekrana Çəkmə (Render) ────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, W, H);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * TS, y = r * TS;
      if (wallMap[r][c]) {
        ctx.fillStyle = "#252015";
        ctx.fillRect(x, y, TS, TS);
      } else {
        ctx.fillStyle = "#16120d";
        ctx.fillRect(x, y, TS, TS);
      }
    }
  }

  const doorX = (COLS - 4) * TS;
  const doorY = 1 * TS;
  if (doorOpen) {
    ctx.fillStyle = "#1b5e20";
    ctx.fillRect(doorX, doorY, TS * 2, TS * 2);
  } else {
    ctx.fillStyle = "#3e2a1a";
    ctx.fillRect(doorX, doorY, TS * 2, TS * 2);
  }

  for (const ch of chests) {
    ctx.fillStyle = ch.open ? "#3a2208" : "#6d4c19";
    ctx.fillRect(ch.x, ch.y, 20, 16);
  }

  for (const e of enemies) {
    if (!e.alive) continue;
    ctx.fillStyle = e.hitTimer > 0 ? "#ff5252" : "#7f0000";
    ctx.beginPath();
    ctx.arc(e.x + e.size/2, e.y + e.size/2, e.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
  if (player.hitTimer > 0) ctx.globalAlpha = 0.5;
  ctx.scale(player.facing, 1);
  ctx.font = "14px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🧙", 0, 1);

  if (attackAnim > 0) {
    ctx.save();
    ctx.rotate(-attackAnim * 0.4 * player.facing);
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.moveTo(4, -4);
    ctx.lineTo(24, -20);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 28);
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ─── Oyun Bitmə Paneli ────────────────────────────────────────
function endGame(win) {
  gameState = "end";
  if (win) score += Math.floor(player.hp);

  // High score mentiqi
  const currentHi = parseInt(localStorage.getItem(LS_KEY) || "0", 10);
  if (score > currentHi) {
    localStorage.setItem(LS_KEY, score.toString());
  }

  const scr = document.getElementById("screen");
  if (!scr) return;
  scr.style.display = "flex";

  if (win) {
    scr.innerHTML = `
      <h1 style="color:#d4af37">🏆 VICTORY!</h1>
      <p class="sub">You escaped the dungeon!</p>
      <p class="score-info">
        Gold: <b style="color:#d4af37">${gold}</b><br>
        Score: <b style="color:#d4af37">${score}</b><br>
        Best: <b style="color:#ffd700">${localStorage.getItem(LS_KEY)}</b>
      </p>
      <button class="btn" onclick="startGame()">▶ PLAY AGAIN</button>
    `;
  } else {
    scr.innerHTML = `
      <h1 style="color:#e57373">💀 DEFEATED</h1>
      <p class="sub">The dungeon claims another soul...</p>
      <p class="score-info">
        Score: <b style="color:#d4af37">${score}</b><br>
        Gold: <b style="color:#d4af37">${gold}</b><br>
        Best: <b style="color:#ffd700">${localStorage.getItem(LS_KEY)}</b>
      </p>
      <button class="btn" onclick="startGame()">↺ TRY AGAIN</button>
    `;
  }
}

// ─── Event Listeners (Düymələr) ───────────────────────────────
document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === " ") attack();
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// İlk açılışda High Score-u HUD panelində göstərmək üçün çağırış
document.addEventListener("DOMContentLoaded", () => {
  const hiHud = document.getElementById("hi-hud");
  if (hiHud) hiHud.textContent = localStorage.getItem(LS_KEY) || 0;
});
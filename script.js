"use strict";

const canvas = document.getElementById("c");
const ctx    = canvas.getContext("2d");

const W  = 560;
const H  = 420;
const TS = 20; 
const COLS = Math.floor(W / TS); 
const ROWS = Math.floor(H / TS); 

let player;
let keys     = {};
let lastTime = 0;
let wallMap  = [];

const WALL_DEFS = [
  [0, 0, COLS, 1], [0, ROWS - 1, COLS, 1], [0, 0, 1, ROWS], [COLS - 1, 0, 1, ROWS],
  [1, 5, 5, 1], [COLS - 7, 1, 1, 4], [COLS - 7, 4, 4, 1],
  [6, 8, 2, 2], [13, 4, 2, 2], [20, 9, 2, 2], [10, 14, 2, 2],
  [22, 3, 2, 2], [4, 16, 2, 2], [17, 15, 2, 2], [24, 13, 2, 2],
  [8, 12, 4, 1], [15, 7, 1, 4], [19, 12, 1, 3]
];

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

function init() {
  buildWallMap();
  player = { x: 2 * TS, y: 2 * TS, size: 18, speed: 2.8, facing: 1 };
  requestAnimationFrame(loop);
}

function loop(ts) {
  const dt = Math.min((ts - lastTime) / 16.67, 3);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

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
}

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
  ctx.save();
  ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
  ctx.scale(player.facing, 1);
  ctx.font = "14px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🧙", 0, 1);
  ctx.restore();
}

document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

init();
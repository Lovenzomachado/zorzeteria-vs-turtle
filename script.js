'use strict';

// ══════════════════════════════════════════
//  CONFIG
// ══════════════════════════════════════════
const SPRITE_PATH = './sprites/';
const SPRITE_SCALE = 0.72;

const STATES = {
  IDLE:    { file: 'idle.png',    duration: 0,    flash: null },
  STANCE:  { file: 'stance.png',  duration: 0,    flash: 'STANCE' },
  PUNCH:   { file: 'punch.png',   duration: 600,  flash: 'PUNCH!' },
  KICK:    { file: 'kick.png',    duration: 700,  flash: 'KICK!' },
  JUMP:    { file: 'jump.png',    duration: 800,  flash: 'JUMP!' },
};

// ══════════════════════════════════════════
//  SPRITE LOADER
// ══════════════════════════════════════════
const sprites = {};
let loadedCount = 0;
const totalSprites = Object.keys(STATES).length;

function loadSprites(cb) {
  Object.entries(STATES).forEach(([key, cfg]) => {
    const img = new Image();
    img.onload = () => {
      sprites[key] = img;
      loadedCount++;
      if (loadedCount === totalSprites) cb();
    };
    img.onerror = () => {
      // Fallback: create a placeholder canvas image
      const pc = document.createElement('canvas');
      pc.width = 200; pc.height = 300;
      const pctx = pc.getContext('2d');
      pctx.fillStyle = '#1a1a2e';
      pctx.fillRect(0,0,200,300);
      pctx.fillStyle = '#ffcc00';
      pctx.font = '14px monospace';
      pctx.textAlign = 'center';
      pctx.fillText(key, 100, 150);
      const fallback = new Image();
      fallback.src = pc.toDataURL();
      fallback.onload = () => {
        sprites[key] = fallback;
        loadedCount++;
        if (loadedCount === totalSprites) cb();
      };
    };
    img.src = SPRITE_PATH + cfg.file;
  });
}

// ══════════════════════════════════════════
//  GAME STATE
// ══════════════════════════════════════════
let currentState = 'IDLE';
let stateTimer = null;
let jumpY = 0;
let jumpVel = 0;
let isJumping = false;
let combo = 0;
let comboTimer = null;
let timerValue = 99;
let timerInterval = null;
let gameStarted = false;
let lastActionTime = 0;
let canvas, ctx;

// ══════════════════════════════════════════
//  BACKGROUND DRAWING
// ══════════════════════════════════════════
function drawBackground(cw, ch) {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, ch * 0.6);
  skyGrad.addColorStop(0, '#0a0018');
  skyGrad.addColorStop(0.5, '#1a0535');
  skyGrad.addColorStop(1, '#2d0a5a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, cw, ch * 0.72);

  // City silhouette (distant)
  drawCitySilhouette(cw, ch);

  // Rooftop floor
  const floorY = ch * 0.72;
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, ch);
  floorGrad.addColorStop(0, '#1a0f2e');
  floorGrad.addColorStop(0.3, '#110a20');
  floorGrad.addColorStop(1, '#08060f');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, cw, ch - floorY);

  // Floor edge highlight
  ctx.fillStyle = 'rgba(120,60,255,0.3)';
  ctx.fillRect(0, floorY, cw, 2);
  ctx.fillStyle = 'rgba(200,100,255,0.15)';
  ctx.fillRect(0, floorY + 2, cw, 4);

  // Floor tiles
  const tileW = 80;
  const perspY = floorY;
  ctx.strokeStyle = 'rgba(100,50,200,0.12)';
  ctx.lineWidth = 1;
  for (let x = -tileW; x < cw + tileW; x += tileW) {
    ctx.beginPath();
    ctx.moveTo(x, perspY);
    ctx.lineTo(x + (x - cw/2) * 0.3, ch);
    ctx.stroke();
  }
  for (let row = 0; row < 6; row++) {
    const y = perspY + (ch - perspY) * (row / 5);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cw, y);
    ctx.stroke();
  }

  // Neon signs
  drawNeonSign(ctx, cw * 0.08, ch * 0.18, 'FIGHT', '#ff2233');
  drawNeonSign(ctx, cw * 0.72, ch * 0.22, 'ARCADE', '#00ccff');

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  const starPositions = [
    [0.1,0.05],[0.2,0.12],[0.35,0.03],[0.45,0.09],[0.55,0.04],
    [0.65,0.07],[0.75,0.02],[0.85,0.1],[0.92,0.06],[0.15,0.18],
    [0.5,0.15],[0.8,0.17],[0.03,0.13],[0.97,0.08]
  ];
  starPositions.forEach(([rx, ry]) => {
    ctx.beginPath();
    ctx.arc(rx * cw, ry * ch, Math.random() * 1 + 0.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Moon
  ctx.fillStyle = '#fffde8';
  ctx.shadowColor = '#fffde8';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(cw * 0.88, ch * 0.1, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Ground glow
  const glowGrad = ctx.createRadialGradient(cw/2, floorY, 0, cw/2, floorY, cw*0.4);
  glowGrad.addColorStop(0, 'rgba(160,80,255,0.1)');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, floorY - 30, cw, 60);
}

function drawCitySilhouette(cw, ch) {
  const baseY = ch * 0.72;
  ctx.fillStyle = '#08040f';

  const buildings = [
    { x: 0, w: 60, h: 180 },
    { x: 50, w: 80, h: 220 },
    { x: 110, w: 50, h: 160 },
    { x: 150, w: 90, h: 260 },
    { x: 220, w: 60, h: 190 },
    { x: 270, w: 100, h: 240 },
    { x: 360, w: 55, h: 180 },
    // right side
    { x: cw-400, w: 70, h: 210 },
    { x: cw-340, w: 90, h: 250 },
    { x: cw-260, w: 60, h: 170 },
    { x: cw-210, w: 100, h: 230 },
    { x: cw-120, w: 70, h: 200 },
    { x: cw-60, w: 80, h: 180 },
  ];

  buildings.forEach(b => {
    ctx.fillRect(b.x, baseY - b.h, b.w, b.h);
    // windows
    ctx.fillStyle = 'rgba(255,200,80,0.3)';
    for (let wy = baseY - b.h + 15; wy < baseY - 15; wy += 20) {
      for (let wx = b.x + 8; wx < b.x + b.w - 8; wx += 14) {
        if (Math.random() > 0.4) {
          ctx.fillRect(wx, wy, 6, 8);
        }
      }
    }
    ctx.fillStyle = '#08040f';
  });
}

function drawNeonSign(ctx, x, y, text, color) {
  ctx.save();
  ctx.font = "bold 13px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  // Glow layers
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#fff';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ══════════════════════════════════════════
//  CHARACTER DRAWING
// ══════════════════════════════════════════
function drawCharacter(cw, ch) {
  const img = sprites[currentState];
  if (!img) return;

  const scaledW = img.naturalWidth * SPRITE_SCALE;
  const scaledH = img.naturalHeight * SPRITE_SCALE;
  const floorY = ch * 0.72;
  const baseX = cw / 2 - scaledW / 2;
  const baseY = floorY - scaledH + jumpY;

  // Shadow
  const shadowAlpha = isJumping ? Math.max(0.05, 0.2 + jumpY / (ch * 0.3)) : 0.25;
  const shadowScale = isJumping ? Math.max(0.4, 1 + jumpY / (ch * 0.5)) : 1;
  ctx.save();
  ctx.globalAlpha = shadowAlpha;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(cw/2, floorY + 8, 60 * shadowScale, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Sprite
  ctx.drawImage(img, baseX, baseY, scaledW, scaledH);
}

// ══════════════════════════════════════════
//  JUMP PHYSICS
// ══════════════════════════════════════════
function startJump() {
  if (isJumping) return;
  isJumping = true;
  jumpVel = -18;
  jumpY = 0;
}

function updateJump() {
  if (!isJumping) return;
  jumpVel += 1.1; // gravity
  jumpY += jumpVel;
  if (jumpY >= 0) {
    jumpY = 0;
    jumpVel = 0;
    isJumping = false;
    currentState = 'IDLE';
  }
}

// ══════════════════════════════════════════
//  STATE MACHINE
// ══════════════════════════════════════════
function setState(key) {
  if (stateTimer) clearTimeout(stateTimer);
  currentState = key;
  const cfg = STATES[key];
  showFlash(cfg.flash);
  if (key === 'JUMP') {
    startJump();
  } else if (cfg.duration > 0) {
    stateTimer = setTimeout(() => {
      currentState = 'IDLE';
    }, cfg.duration);
  }
  // Combo
  if (key === 'PUNCH' || key === 'KICK') {
    incrementCombo();
  } else {
    if (key !== 'JUMP') resetCombo();
  }
}

// ══════════════════════════════════════════
//  FLASH TEXT
// ══════════════════════════════════════════
const flashEl = document.getElementById('action-flash');
let flashTimer = null;
function showFlash(text) {
  if (!text) return;
  flashEl.textContent = text;
  flashEl.classList.remove('visible');
  void flashEl.offsetWidth; // reflow
  flashEl.classList.add('visible');
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => flashEl.classList.remove('visible'), 600);
}

// ══════════════════════════════════════════
//  COMBO SYSTEM
// ══════════════════════════════════════════
const comboDisplay = document.getElementById('combo-display');
const comboCount = document.getElementById('combo-count');

function incrementCombo() {
  combo++;
  if (comboTimer) clearTimeout(comboTimer);
  comboTimer = setTimeout(resetCombo, 1200);
  if (combo >= 2) {
    comboCount.textContent = combo + 'x';
    comboDisplay.classList.add('visible');
  }
}

function resetCombo() {
  combo = 0;
  comboDisplay.classList.remove('visible');
}

// ══════════════════════════════════════════
//  TIMER
// ══════════════════════════════════════════
const timerEl = document.getElementById('timer');
function startTimer() {
  timerValue = 99;
  timerEl.textContent = timerValue;
  timerInterval = setInterval(() => {
    timerValue--;
    if (timerValue <= 0) {
      timerValue = 0;
      clearInterval(timerInterval);
      setTimeout(() => { timerValue = 99; startTimer(); }, 2000);
    }
    timerEl.textContent = String(timerValue).padStart(2, '0');
    if (timerValue <= 10) timerEl.style.color = 'var(--arcade-red)';
    else timerEl.style.color = 'var(--arcade-yellow)';
  }, 1000);
}

// ══════════════════════════════════════════
//  INPUT
// ══════════════════════════════════════════
const keysDown = new Set();

document.addEventListener('keydown', (e) => {
  if (!gameStarted) {
    startGame();
    return;
  }
  if (keysDown.has(e.code)) return;
  keysDown.add(e.code);

  switch (e.code) {
    case 'KeyJ': setState('PUNCH'); break;
    case 'KeyK': setState('KICK');  break;
    case 'KeyS': setState('STANCE'); break;
    case 'Space':
      e.preventDefault();
      setState('JUMP');
      break;
  }
});

document.addEventListener('keyup', (e) => {
  keysDown.delete(e.code);
  if (e.code === 'KeyS' && currentState === 'STANCE') {
    setState('IDLE');
  }
});

// ══════════════════════════════════════════
//  RENDER LOOP
// ══════════════════════════════════════════
function resize() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;
}

function render() {
  const cw = canvas.width;
  const ch = canvas.height;
  ctx.clearRect(0, 0, cw, ch);
  drawBackground(cw, ch);
  updateJump();
  drawCharacter(cw, ch);
  requestAnimationFrame(render);
}

// ══════════════════════════════════════════
//  TITLE SCREEN
// ══════════════════════════════════════════
function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  document.getElementById('title-screen').style.display = 'none';
  startTimer();
}

// ══════════════════════════════════════════
//  TOUCH CONTROLS (mobile)
// ══════════════════════════════════════════
function setupTouchControls() {
  document.querySelectorAll('.touch-btn').forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!gameStarted) { startGame(); return; }
      const action = btn.dataset.action;
      if (action) setState(action);
    });
    btn.addEventListener('click', () => {
      if (!gameStarted) { startGame(); return; }
      const action = btn.dataset.action;
      if (action) setState(action);
    });
  });
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
window.addEventListener('load', () => {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  resize();
  window.addEventListener('resize', resize);

  setupTouchControls();

  loadSprites(() => {
    render();
  });
});

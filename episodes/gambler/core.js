/* =========================================================================
 * 《久赌必输的数学》 · 核心图形引擎 (2x HiDPI 超采样 + 光学后期 + 物理算子)
 * ========================================================================= */

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp  = (a, b, t) => a + (b - a) * clamp(t);
const sub   = (t, a, b) => clamp((t - a) / (b - a));
const eOut  = t => 1 - Math.pow(1 - clamp(t), 3);
const eInOut= t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

// 欠阻尼物理弹簧
function spring(t, d = 1.8, w = 8.5) {
  if (t <= 0) return 0;
  return 1 - Math.exp(-d * t) * (Math.cos(w * t) + (d / w) * Math.sin(w * t));
}

// 节拍脉冲与小节脉冲
function beatPulse(t, decay = 6.5) {
  const u = ((t - BAR0) % BEAT + BEAT) % BEAT;
  return Math.exp(-u * decay);
}
function barPulse(t, decay = 3.2) {
  const u = ((t - BAR0) % BAR + BAR) % BAR;
  return Math.exp(-u * decay);
}

// 确定性伪随机生成器
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 字体栈：优先本地高清中英文无衬线/衬线/等宽字体，杜绝退化为点阵宋体
const SERIF = "'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'Microsoft YaHei', serif";
const SANS  = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";
const MONO  = "'JetBrains Mono', 'Cascadia Mono', 'Consolas', 'Segoe UI', monospace";
const GARA  = "'EB Garamond', 'Georgia', 'Times New Roman', serif";

// 2x HiDPI 超采样画布初始化 (3840x2160 内部光栅缓冲，CSS 锁定 1920x1080)
const DPR = 2;
const BG  = document.getElementById('bg');
const SCN = document.getElementById('scene');
BG.width  = 1920 * DPR; BG.height  = 1080 * DPR;
SCN.width = 1920 * DPR; SCN.height = 1080 * DPR;
BG.style.width  = '1920px'; BG.style.height  = '1080px';
SCN.style.width = '1920px'; SCN.style.height = '1080px';

const BX = BG.getContext('2d');
const X  = SCN.getContext('2d');
BX.setTransform(DPR, 0, 0, DPR, 0, 0);
X.setTransform(DPR, 0, 0, DPR, 0, 0);
BX.imageSmoothingEnabled = true; BX.imageSmoothingQuality = 'high';
X.imageSmoothingEnabled  = true; X.imageSmoothingQuality  = 'high';

/* ================= 基础绘图原语 ================= */
function rr(ctx, x, y, w, h, r = 14) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function glow(c = CFG.gold, b = 16) {
  X.shadowColor = c;
  X.shadowBlur  = b * DPR;
}
function noGlow() {
  X.shadowColor = 'transparent';
  X.shadowBlur  = 0;
}

function txt(s, x, y, font, color = CFG.ink, align = 'center', base = 'middle') {
  X.font = font;
  X.fillStyle = color;
  X.textAlign = align;
  X.textBaseline = base;
  X.fillText(s, x, y);
}
function txtL(s, x, y, font, color = CFG.ink, base = 'middle') {
  txt(s, x, y, font, color, 'left', base);
}
function txtR(s, x, y, font, color = CFG.ink, base = 'middle') {
  txt(s, x, y, font, color, 'right', base);
}

// 玻璃态质感卡片
function drawCard(x, y, w, h, opts = {}) {
  const r = opts.r || 18;
  const border = opts.border || 'rgba(217, 185, 120, 0.32)';
  const bgTop  = opts.bgTop  || 'rgba(20, 18, 34, 0.90)';
  const bgBot  = opts.bgBot  || 'rgba(11, 10, 22, 0.94)';

  X.save();
  if (opts.glowColor) glow(opts.glowColor, opts.glowBlur || 18);
  const g = X.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, bgTop);
  g.addColorStop(1, bgBot);
  rr(X, x, y, w, h, r);
  X.fillStyle = g;
  X.fill();
  noGlow();

  X.strokeStyle = border;
  X.lineWidth = opts.lw || 1.6;
  X.stroke();

  if (opts.headerH) {
    X.save();
    rr(X, x, y, w, opts.headerH, r);
    X.clip();
    X.fillStyle = opts.headerBg || 'rgba(217, 185, 120, 0.08)';
    X.fillRect(x, y, w, opts.headerH);
    X.strokeStyle = 'rgba(217, 185, 120, 0.18)';
    X.lineWidth = 1;
    X.beginPath();
    X.moveTo(x + 16, y + opts.headerH);
    X.lineTo(x + w - 16, y + opts.headerH);
    X.stroke();
    X.restore();
  }
  X.restore();
}

// 胶囊徽章
function drawPill(x, y, w, h, label, font, fg, bg, border) {
  X.save();
  rr(X, x - w / 2, y - h / 2, w, h, h / 2);
  if (bg) { X.fillStyle = bg; X.fill(); }
  if (border) { X.strokeStyle = border; X.lineWidth = 1.4; X.stroke(); }
  txt(label, x, y + 1, font, fg);
  X.restore();
}

function drawArrow(x1, y1, x2, y2, color = CFG.gold, lw = 2.2, head = 9) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  X.save();
  X.strokeStyle = color;
  X.fillStyle = color;
  X.lineWidth = lw;
  X.beginPath();
  X.moveTo(x1, y1);
  X.lineTo(x2, y2);
  X.stroke();
  X.beginPath();
  X.moveTo(x2, y2);
  X.lineTo(x2 - head * Math.cos(ang - 0.42), y2 - head * Math.sin(ang - 0.42));
  X.lineTo(x2 - head * Math.cos(ang + 0.42), y2 - head * Math.sin(ang + 0.42));
  X.closePath();
  X.fill();
  X.restore();
}

/* ================= 深空星云背景与光学后处理 ================= */
const _bgRng = mulberry32(20261657);
const STARS = Array.from({ length: 68 }, () => ({
  x: _bgRng() * 1920,
  y: _bgRng() * 1080,
  r: 0.6 + _bgRng() * 1.35,
  sp: 0.4 + _bgRng() * 1.4,
  ph: _bgRng() * Math.PI * 2,
  warm: _bgRng() > 0.72
}));

const NEBULA = [
  { x: 460,  y: 340, r: 520, c: 'rgba(92, 68, 168, 0.08)' },
  { x: 1420, y: 420, r: 560, c: 'rgba(217, 160, 88, 0.055)' },
  { x: 960,  y: 680, r: 480, c: 'rgba(62, 138, 175, 0.05)' }
];

function drawBG(t) {
  BX.setTransform(DPR, 0, 0, DPR, 0, 0);
  const g = BX.createRadialGradient(960, 440, 40, 960, 520, 1180);
  g.addColorStop(0, '#0F0D24');
  g.addColorStop(0.58, '#080716');
  g.addColorStop(1, '#03020A');
  BX.fillStyle = g;
  BX.fillRect(0, 0, 1920, 1080);

  const bp = beatPulse(t, 5.5);
  for (let i = 0; i < NEBULA.length; i++) {
    const n = NEBULA[i];
    const ox = Math.sin(t * 0.18 + i * 2.1) * 32;
    const oy = Math.cos(t * 0.14 + i * 1.7) * 22;
    const rg = BX.createRadialGradient(n.x + ox, n.y + oy, 10, n.x + ox, n.y + oy, n.r * (1 + bp * 0.04));
    rg.addColorStop(0, n.c);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    BX.fillStyle = rg;
    BX.fillRect(0, 0, 1920, 1080);
  }

  BX.strokeStyle = 'rgba(150, 155, 195, 0.022)';
  BX.lineWidth = 1;
  for (let x = 120; x < 1920; x += 120) {
    BX.beginPath(); BX.moveTo(x, 0); BX.lineTo(x, 1080); BX.stroke();
  }
  for (let y = 120; y < 1080; y += 120) {
    BX.beginPath(); BX.moveTo(0, y); BX.lineTo(1920, y); BX.stroke();
  }

  for (const s of STARS) {
    const a = 0.16 + 0.30 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph));
    BX.fillStyle = s.warm ? `rgba(235, 205, 150, ${a.toFixed(3)})` : `rgba(185, 198, 238, ${a.toFixed(3)})`;
    BX.beginPath();
    BX.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    BX.fill();
  }
}

const _BL = document.createElement('canvas');
_BL.width = 480; _BL.height = 270;
const _BX = _BL.getContext('2d');

const _GR = document.createElement('canvas');
_GR.width = 160; _GR.height = 90;
const _GX = _GR.getContext('2d');

function postProcess(t) {
  _BX.clearRect(0, 0, 480, 270);
  _BX.filter = 'blur(10px)';
  _BX.drawImage(SCN, 0, 0, 480, 270);
  _BX.filter = 'none';

  X.save();
  X.setTransform(1, 0, 0, 1, 0, 0);
  X.globalCompositeOperation = 'screen';
  X.globalAlpha = 0.15;
  X.drawImage(_BL, 0, 0, 1920 * DPR, 1080 * DPR);

  const grng = mulberry32((Math.floor(t * 30) * 1103515245 + 12345) >>> 0);
  const img = _GX.createImageData(160, 90);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (grng() * 255) | 0;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  _GX.putImageData(img, 0, 0);
  X.globalCompositeOperation = 'overlay';
  X.globalAlpha = 0.024;
  X.drawImage(_GR, 0, 0, 1920 * DPR, 1080 * DPR);
  X.restore();

  X.save();
  X.setTransform(DPR, 0, 0, DPR, 0, 0);
  const vg = X.createRadialGradient(960, 500, 620, 960, 540, 1180);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(2,1,8,0.48)');
  X.fillStyle = vg;
  X.fillRect(0, 0, 1920, 1080);
  X.restore();
}

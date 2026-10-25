/* =========================================================================
 * 《久赌必输的数学》 · 无状态时间驱动主控与浏览器预览器 (main.js)
 * ========================================================================= */

const elTop   = document.getElementById('toplabel');
const elNote  = document.getElementById('note');
const elTC    = document.getElementById('titlecard');
const elSub   = document.getElementById('sub');
const elSubZh = document.getElementById('sub-zh');
const elSubEn = document.getElementById('sub-en');
const elCtrl  = document.getElementById('player-controls');
const elTL    = document.getElementById('timeline');
const elTD    = document.getElementById('time-display');
const btnPlay = document.getElementById('btn-play');
const bgmAudio= document.getElementById('bgm');
const sfxAudio= document.getElementById('sfx');

window.render = function(t) {
  t = clamp(t, 0, CFG.duration);

  drawBG(t);

  X.setTransform(DPR, 0, 0, DPR, 0, 0);
  X.clearRect(0, 0, 1920, 1080);
  noGlow();

  let secName = 'open', secLabel = '';
  for (const s of SECTIONS) {
    if (t >= s[0]) { secName = s[1]; secLabel = s[2]; }
  }

  if (secName === 'open')            sceneOpen(t);
  else if (secName === 'history')    sceneHistory(t);
  else if (secName === 'volatility') sceneVolatility(t);
  else if (secName === 'drop')       sceneDrop(t);
  else if (secName === 'kelly')      sceneKelly(t);
  else if (secName === 'end')        sceneEnd(t);

  if (secName !== 'title') {
    postProcess(t);
  }

  elTop.textContent = secLabel;
  elTop.style.opacity = secLabel ? '1' : '0';

  const isTitle = (secName === 'title');
  if (isTitle) {
    const lt = t - bar(8), dur = bar(11) - bar(8);
    const a = Math.min(eOut(sub(lt, 0, 0.55)), 1 - eInOut(sub(lt, dur - 0.45, dur)));
    elTC.style.display = 'flex';
    elTC.style.opacity = a.toFixed(3);
  } else {
    elTC.style.display = 'none';
    elTC.style.opacity = '0';
  }

  let curNote = '';
  for (const n of NOTES) {
    if (t >= n[0] && t < n[1]) { curNote = n[2]; break; }
  }
  elNote.textContent = curNote;
  elNote.style.opacity = (curNote && !isTitle) ? '0.82' : '0';

  let curSub = null;
  for (const s of SUBTITLES) {
    if (t >= s[0] && t < s[1]) { curSub = s; break; }
  }
  if (curSub && !isTitle) {
    const fadeIn  = eOut(sub(t, curSub[0], curSub[0] + 0.22));
    const fadeOut = 1 - eInOut(sub(t, curSub[1] - 0.18, curSub[1]));
    const alpha   = Math.min(fadeIn, fadeOut);
    elSub.style.opacity = alpha.toFixed(3);
    elSubZh.innerHTML   = curSub[2];
    elSubEn.textContent = curSub[3];
  } else {
    elSub.style.opacity = '0';
  }

  if (window.__RENDER_MODE__) {
    if (elCtrl) elCtrl.style.display = 'none';
  } else {
    if (elTL) elTL.value = t;
    if (elTD) {
      const m = Math.floor(t / 60), s = Math.floor(t % 60);
      elTD.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} / 02:40`;
    }
  }
};

/* ================= 浏览器交互预览器 ================= */
let currentTime = 0;
let isPlaying   = false;
let lastTS      = null;
let sfxReady    = false;

if (CFG.sfx && sfxAudio) {
  sfxAudio.src = CFG.sfx;
  sfxAudio.addEventListener('canplaythrough', () => { sfxReady = true; }, { once: true });
  sfxAudio.addEventListener('error', () => { sfxReady = false; });
}

function syncSfx() {
  if (!sfxReady) return;
  if (Math.abs(sfxAudio.currentTime - currentTime) > 0.08) {
    sfxAudio.currentTime = currentTime;
  }
}

function previewLoop(ts) {
  if (window.__RENDER_MODE__) return;
  if (!lastTS) lastTS = ts;
  const dt = (ts - lastTS) / 1000;
  lastTS = ts;

  if (isPlaying) {
    currentTime += dt;
    if (currentTime >= CFG.duration) {
      currentTime = CFG.duration;
      pause();
    }
    window.render(currentTime);
  }
  requestAnimationFrame(previewLoop);
}
requestAnimationFrame(previewLoop);

function play() {
  isPlaying = true;
  lastTS = null;
  if (btnPlay) btnPlay.textContent = '⏸ 暂停';
  if (bgmAudio) { bgmAudio.currentTime = currentTime; bgmAudio.play().catch(() => {}); }
  if (sfxReady) { syncSfx(); sfxAudio.play().catch(() => {}); }
}

function pause() {
  isPlaying = false;
  if (btnPlay) btnPlay.textContent = '▶ 播放';
  if (bgmAudio) bgmAudio.pause();
  if (sfxReady) sfxAudio.pause();
}

if (btnPlay) {
  btnPlay.onclick = () => { if (isPlaying) pause(); else play(); };
}
if (elTL) {
  elTL.oninput = function() {
    currentTime = parseFloat(this.value);
    if (bgmAudio) bgmAudio.currentTime = currentTime;
    syncSfx();
    window.render(currentTime);
  };
}

window.seek = function(t) {
  currentTime = clamp(t, 0, CFG.duration);
  if (elTL) elTL.value = currentTime;
  if (bgmAudio) bgmAudio.currentTime = currentTime;
  syncSfx();
  window.render(currentTime);
};

window.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (isPlaying) pause(); else play();
  }
});

window.render(0.0);

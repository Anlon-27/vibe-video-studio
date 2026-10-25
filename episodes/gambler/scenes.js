/* =========================================================================
 * 《久赌必输的数学》 · 六幕中央可视化场景实现 (scenes.js)
 * 严格遵循 y = 105 .. 765 安全绘制区与右对齐安全锚定铁律
 * ========================================================================= */

/* -------------------------------------------------------------------------
 * 序幕 (0.000s -> bar(8)=17.234s)
 * 左：绝对公平 50/50 抛硬币赌局  |  右：直觉(来回震荡) vs 数学现实(100%归零)
 * ------------------------------------------------------------------------- */
function sceneOpen(t) {
  const lt = t;
  const enter = eOut(sub(lt, 0, 1.0));
  const bp = beatPulse(t, 6.0);

  X.save();
  X.globalAlpha = enter;

  drawPill(960, 118, 690, 36, '思想实验 · 零抽水、零出千、胜率严格 50.0% 的绝对公平赌局', `600 18px ${SANS}`, CFG.gold, 'rgba(217,185,120,0.10)', 'rgba(217,185,120,0.35)');

  // ==================== 左卡：50/50 公平硬币与有限本金池 ====================
  const lx = 96, ly = 152, lw = 760, lh = 596;
  drawCard(lx, ly, lw, lh, { headerH: 54 });
  txtL('规则设定 · 绝对均匀硬币博弈', lx + 28, ly + 27, `700 22px ${SERIF}`, CFG.ink);
  txtR('FAIR COIN · p = q = 0.50', lx + lw - 28, ly + 27, `600 15px ${MONO}`, CFG.gold);

  // 旋转硬币动画 (上半居中)
  const coinX = lx + 210, coinY = ly + 195;
  const flipSpin = Math.cos(lt * 5.2);
  const isHeads = flipSpin >= 0;

  X.save();
  // 外发光环
  const rg = X.createRadialGradient(coinX, coinY, 20, coinX, coinY, 115);
  rg.addColorStop(0, isHeads ? 'rgba(217,185,120,0.25)' : 'rgba(88,216,192,0.22)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  X.fillStyle = rg;
  X.beginPath(); X.arc(coinX, coinY, 115, 0, Math.PI * 2); X.fill();

  // 3D 翻转椭圆硬币
  const coinRx = Math.max(8, Math.abs(flipSpin) * 76);
  glow(isHeads ? CFG.gold : CFG.cyan, 16);
  X.fillStyle = isHeads ? 'rgba(217,185,120,0.26)' : 'rgba(88,216,192,0.22)';
  X.strokeStyle = isHeads ? CFG.gold : CFG.cyan;
  X.lineWidth = 3.2;
  X.beginPath();
  X.ellipse(coinX, coinY, coinRx, 76, 0, 0, Math.PI * 2);
  X.fill(); X.stroke();
  noGlow();

  if (Math.abs(flipSpin) > 0.28) {
    txt(isHeads ? '+¥100' : '−¥100', coinX, coinY - 8, `900 26px ${MONO}`, isHeads ? CFG.gold : CFG.cyan);
    txt(isHeads ? 'HEADS · 正面' : 'TAILS · 反面', coinX, coinY + 24, `600 13px ${MONO}`, CFG.ink);
  }
  X.restore();

  // 硬币右侧赔率参数卡
  const px = lx + 375, py = ly + 86, pw = 352, ph = 220;
  drawCard(px, py, pw, ph, { r: 14, border: 'rgba(217,185,120,0.28)' });
  txtL('正面赢率 p', px + 22, py + 36, `500 16px ${SANS}`, CFG.sub);
  txtR('50.00%', px + pw - 22, py + 36, `700 20px ${MONO}`, CFG.green);
  txtL('反面输率 q', px + 22, py + 78, `500 16px ${SANS}`, CFG.sub);
  txtR('50.00%', px + pw - 22, py + 78, `700 20px ${MONO}`, CFG.red);
  txtL('单局数学期望 E[X]', px + 22, py + 120, `500 16px ${SANS}`, CFG.sub);
  txtR('0.00 元 (零和)', px + pw - 22, py + 120, `700 19px ${MONO}`, CFG.gold);
  txtL('赌场抽水率', px + 22, py + 162, `500 16px ${SANS}`, CFG.sub);
  txtR('0.00% (零抽水)', px + pw - 22, py + 162, `700 18px ${MONO}`, CFG.cyan);
  txtL('直觉判断：不赚不赔，永远玩下去', px + 22, py + 198, `600 14px ${SANS}`, CFG.ink);

  // 下半：不对称筹码池对比 (你的 1 万 vs 市场的 ∞)
  const by = ly + 332;
  drawCard(lx + 28, by, lw - 56, 232, { r: 16, border: 'rgba(224,72,56,0.38)' });
  txtL('致命的隐藏非对称：有限本金 vs 无限底池', lx + 52, by + 34, `700 19px ${SERIF}`, CFG.gold);

  // 玩家筹码条
  const rounds = Math.floor(lerp(1, 1850, clamp(lt / 15.0, 0, 1)));
  const remainPct = clamp(1 - Math.pow(clamp((lt - 2.0) / 13.0, 0, 1), 1.35), 0, 1);
  const remainCash = Math.round(10000 * remainPct);

  txtL('你的本金 (Player Capital n)', lx + 52, by + 78, `600 16px ${SANS}`, CFG.ink);
  txtR(`¥${remainCash.toLocaleString()} / ¥10,000`, lx + lw - 52, by + 78, `900 20px ${MONO}`, remainCash < 2500 ? CFG.red : CFG.gold);
  rr(X, lx + 52, by + 100, lw - 104, 16, 8);
  X.fillStyle = 'rgba(255,255,255,0.08)'; X.fill();
  if (remainPct > 0.01) {
    rr(X, lx + 52, by + 100, (lw - 104) * remainPct, 16, 8);
    X.fillStyle = remainPct < 0.3 ? CFG.red : CFG.gold; X.fill();
  }

  // 对手底池条
  txtL('市场/赌场底池 (House Capital M → ∞)', lx + 52, by + 148, `600 16px ${SANS}`, CFG.ink);
  txtR('∞ 无限流动性 (永不归零)', lx + lw - 52, by + 148, `700 18px ${MONO}`, CFG.cyan);
  rr(X, lx + 52, by + 170, lw - 104, 16, 8);
  X.fillStyle = CFG.cyan; X.fill();

  txt(`已连续博弈 ${rounds} 局 · 只要赌局不结束，有限本金迟早撞上归零死线`, lx + lw / 2, by + 208, `600 15px ${SANS}`, CFG.amber);

  // ==================== 右卡：直觉幻象 vs 概率论真实判决 ====================
  const rx = 888, ry = 152, rw = 936, rh = 596;
  drawCard(rx, ry, rw, rh, { headerH: 54 });
  txtL('认知反差 · 直觉里的“震荡” vs 数学上的“必死”', rx + 28, ry + 27, `700 22px ${SERIF}`, CFG.gold);
  txtR('INTUITION VS PROBABILITY', rx + rw - 28, ry + 27, `600 15px ${MONO}`, CFG.sub);

  // 上框：人类直觉曲线（围绕本金正弦震荡）
  const c1x = rx + 28, c1y = ry + 78, c1w = rw - 56, c1h = 212;
  drawCard(c1x, c1y, c1w, c1h, { r: 14, border: 'rgba(88,216,192,0.32)' });
  txtL('人类直觉：既然胜率 50%，财富应该围绕 ¥10,000 永远上下震荡', c1x + 24, c1y + 30, `700 17px ${SANS}`, CFG.cyan);
  txtR('错误直觉 ×', c1x + c1w - 24, c1y + 30, `700 16px ${MONO}`, CFG.sub);

  const mid1 = c1y + 122;
  X.strokeStyle = 'rgba(255,255,255,0.16)';
  X.setLineDash([5, 5]);
  X.beginPath(); X.moveTo(c1x + 24, mid1); X.lineTo(c1x + c1w - 24, mid1); X.stroke();
  X.setLineDash([]);
  txtR('--- ¥10,000 初始基准线', c1x + c1w - 28, c1y + 64, `500 12px ${MONO}`, CFG.sub);

  X.strokeStyle = CFG.cyan;
  X.lineWidth = 2.6;
  X.beginPath();
  for (let i = 0; i <= 100; i++) {
    const u = i / 100;
    const vx = c1x + 24 + u * (c1w - 48);
    const vy = mid1 - (Math.sin(u * 18 - lt * 3) * 24 + Math.cos(u * 7 + lt) * 14);
    if (i === 0) X.moveTo(vx, vy); else X.lineTo(vx, vy);
  }
  X.stroke();
  txt('误区根源：忽略了“本金归零即永久踢出牌局”的单向吸收边界', c1x + c1w / 2, c1y + c1h - 24, `500 14px ${SANS}`, CFG.sub);

  // 下框：概率论真实判决（触底归零锁死）
  const c2x = rx + 28, c2y = ry + 312, c2w = rw - 56, c2h = 256;
  drawCard(c2x, c2y, c2w, c2h, { r: 14, border: 'rgba(224,72,56,0.48)' });
  const ruinProb = (lerp(12.0, 100.0, eOut(clamp((lt - 3.5) / 9.5, 0, 1)))).toFixed(1);
  txtL('概率论铁律：当博弈轮数 N → ∞，有限本金破产率收敛至 100%', c2x + 24, c2y + 32, `700 17px ${SANS}`, CFG.ink);
  txtR(`破产概率: ${ruinProb}%`, c2x + c2w - 24, c2y + 32, `900 22px ${MONO}`, CFG.red);

  const zeroY = c2y + 196;
  // 红色吸收壁高亮带
  X.fillStyle = 'rgba(224,72,56,0.16)';
  X.fillRect(c2x + 24, zeroY - 6, c2w - 48, 12);
  X.strokeStyle = CFG.red;
  X.lineWidth = 2;
  X.beginPath(); X.moveTo(c2x + 24, zeroY); X.lineTo(c2x + c2w - 24, zeroY); X.stroke();
  txtR('¥0 破产吸收壁 (Absorbing Barrier · 触碰即锁死)', c2x + c2w - 30, zeroY - 14, `700 13px ${MONO}`, CFG.red);

  // 绘制真实随机游走跌入吸收壁轨迹
  const drawSteps = Math.max(4, Math.floor(clamp(lt / 13.5, 0.08, 1) * WALK_STEPS));
  X.save();
  glow(CFG.gold, 10);
  X.strokeStyle = CFG.gold;
  X.lineWidth = 2.8;
  X.beginPath();
  for (let i = 0; i <= drawSteps; i++) {
    const u = i / WALK_STEPS;
    const vx = c2x + 24 + u * (c2w - 48);
    const val = SINGLE_WALK[i];
    const vy = zeroY - (val / 18) * 125;
    if (i === 0) X.moveTo(vx, vy); else X.lineTo(vx, vy);
  }
  X.stroke();
  noGlow();

  const lastVal = SINGLE_WALK[drawSteps];
  const lastX = c2x + 24 + (drawSteps / WALK_STEPS) * (c2w - 48);
  const lastY = zeroY - (lastVal / 18) * 125;
  X.fillStyle = lastVal === 0 ? CFG.red : '#FFFFFF';
  X.beginPath(); X.arc(lastX, lastY, 5.5 + bp * 2, 0, Math.PI * 2); X.fill();
  X.restore();

  txt('哪怕前面赢过 100 次，只要有 1 次触及 ¥0 底线，游戏永久终结', c2x + c2w / 2, c2y + c2h - 24, `600 15px ${SANS}`, CFG.gold);

  X.restore();
}

/* -------------------------------------------------------------------------
 * 第一幕 (bar(11)=23.612s -> bar(24)=51.247s)
 * 1657 惠更斯《论赌博中的计算》 + 赌徒破产定理公式推导与一维随机游走吸收壁
 * ------------------------------------------------------------------------- */
function sceneHistory(t) {
  const lt = t - bar(11);
  const enter = eOut(sub(lt, 0, 0.9));
  const bp = beatPulse(t, 6.0);

  X.save();
  X.globalAlpha = enter;

  // 顶部公式横幅：赌徒破产定理精确解析解
  const fx = 96, fy = 122, fw = 1728, fh = 124;
  drawCard(fx, fy, fw, fh, { border: 'rgba(217,185,120,0.48)', glowColor: 'rgba(217,185,120,0.16)', glowBlur: 16 });
  drawPill(fx + 188, fy + 32, 316, 26, '1657 · CHRISTIAAN HUYGENS · PROBLEM V', `700 13px ${MONO}`, '#090814', CFG.gold, null);

  txt('P( Ruin )  =  ( M − n ) / M   →   100%   ( M → ∞ )', fx + 430, fy + 84, `700 34px ${GARA}`, CFG.gold);
  X.strokeStyle = 'rgba(217,185,120,0.28)';
  X.lineWidth = 1.5;
  X.beginPath(); X.moveTo(fx + 840, fy + 24); X.lineTo(fx + 840, fy + fh - 24); X.stroke();

  txtL('赌徒破产定理：你的本金 n 有限，而庄家底池 M 趋于无穷大', fx + 876, fy + 48, `700 22px ${SERIF}`, CFG.ink);
  txtL('即使每局胜率严格 50%，你在赢光市场前先归零的概率也是 100%', fx + 876, fy + 88, `600 17px ${SANS}`, CFG.red);

  // ==================== 左下：一维马尔可夫链随机游走与单向吸收壁 ====================
  const lx = 96, ly = 266, lw = 1040, lh = 482;
  drawCard(lx, ly, lw, lh, { headerH: 54 });
  txtL('马尔可夫随机游走模型 · 为什么 0 是不可逃逸的黑洞？', lx + 28, ly + 27, `700 21px ${SERIF}`, CFG.ink);
  txtR('1D RANDOM WALK WITH ABSORBING BARRIER', lx + lw - 28, ly + 27, `600 14px ${MONO}`, CFG.sub);

  // 状态链条节点绘制 (0, 1, 2, ..., n, ..., M)
  const nodes = [
    { label: '0',   sub: '破产吸收壁', x: lx + 110, c: CFG.red,  absorb: true },
    { label: '1',   sub: '濒危态',     x: lx + 250, c: CFG.amber },
    { label: '···', sub: '随机漫步',   x: lx + 390, c: CFG.sub   },
    { label: 'n',   sub: '你的起点',   x: lx + 530, c: CFG.gold, start: true },
    { label: 'n+1', sub: '短期浮盈',   x: lx + 670, c: CFG.green },
    { label: '···', sub: '遥不可及',   x: lx + 810, c: CFG.sub   },
    { label: 'M→∞', sub: '庄家上限',   x: lx + 940, c: CFG.cyan, inf: true }
  ];
  const chainY = ly + 186;
  drawPill(nodes[0].x + 56, chainY - 64, 196, 26, '单向吸收壁 · 有去无回', `700 13px ${SANS}`, '#090814', CFG.red, null);

  // 节点间双向转移箭头 (0 节点只有进没有出！)
  for (let i = 0; i < nodes.length - 1; i++) {
    const n1 = nodes[i], n2 = nodes[i + 1];
    if (i === 0) {
      // 1 -> 0 只有单向死亡箭头！
      drawArrow(n2.x - 32, chainY, n1.x + 34, chainY, CFG.red, 3.0, 9);
      txt('q=0.5', (n1.x + n2.x) / 2, chainY - 22, `700 13px ${MONO}`, CFG.red);
      txt('P(出)=0', (n1.x + n2.x) / 2, chainY + 24, `700 12px ${MONO}`, CFG.red);
    } else {
      drawArrow(n1.x + 32, chainY - 9, n2.x - 32, chainY - 9, 'rgba(88,216,192,0.75)', 2.0, 7);
      drawArrow(n2.x - 32, chainY + 9, n1.x + 32, chainY + 9, 'rgba(232,168,73,0.75)', 2.0, 7);
      txt('p=0.5', (n1.x + n2.x) / 2, chainY - 24, `500 12px ${MONO}`, CFG.cyan);
      txt('q=0.5', (n1.x + n2.x) / 2, chainY + 26, `500 12px ${MONO}`, CFG.amber);
    }
  }

  // 绘制节点圆圈与动态游走粒子
  for (let i = 0; i < nodes.length; i++) {
    const nd = nodes[i];
    X.save();
    if (nd.absorb) glow(CFG.red, 18);
    else if (nd.start) glow(CFG.gold, 14);
    X.fillStyle = nd.absorb ? 'rgba(224,72,56,0.28)' : 'rgba(22,20,38,0.95)';
    X.strokeStyle = nd.c;
    X.lineWidth = nd.absorb || nd.start ? 3.0 : 2.0;
    X.beginPath();
    X.arc(nd.x, chainY, 29, 0, Math.PI * 2);
    X.fill(); X.stroke();
    noGlow();
    txt(nd.label, nd.x, chainY, `800 18px ${MONO}`, nd.c);
    txt(nd.sub, nd.x, chainY + 52, `600 14px ${SANS}`, nd.absorb ? CFG.red : CFG.ink);
    X.restore();
  }

  // 动态游走高亮球（随时间从 n 游走到 0 被锁死）
  const walkU = clamp((lt - 1.5) / 18.0, 0, 1);
  const oscIdx = walkU < 0.78
    ? 3 + Math.sin(lt * 3.6) * 1.4 - walkU * 2.2
    : 0;
  const ballX = lerp(nodes[0].x, nodes[3].x, clamp(oscIdx / 3, 0, 1));
  X.save();
  glow(oscIdx <= 0.05 ? CFG.red : '#FFFFFF', 16);
  X.fillStyle = oscIdx <= 0.05 ? CFG.red : '#FFF6D6';
  X.beginPath();
  X.arc(ballX, chainY - 46, 8 + bp * 2.5, 0, Math.PI * 2);
  X.fill();
  X.restore();

  // 下方对手规模对照表：当对手从朋友变成整个市场，破产率如何逼近 100%
  const ty = ly + 278;
  drawCard(lx + 28, ty, lw - 56, 176, { r: 14, border: 'rgba(217,185,120,0.28)' });
  txtL('实测推演：你带本金 n = ¥10,000 入场，面对不同量级对手的最终破产率', lx + 50, ty + 30, `700 17px ${SANS}`, CFG.gold);

  const cases = [
    { opp: '同桌朋友 (¥10,000)', m: 'M = 2万',   prob: '50.0%',    c: CFG.green },
    { opp: '小型私局 (¥90,000)', m: 'M = 10万',  prob: '90.0%',    c: CFG.amber },
    { opp: '大型赌场 (¥999万)',  m: 'M = 1000万',prob: '99.9%',    c: CFG.red   },
    { opp: '金融市场 (M → ∞)',   m: '无限底池',  prob: '100.00%',  c: CFG.red   }
  ];
  for (let i = 0; i < 4; i++) {
    const cx = lx + 48 + i * 238, cy = ty + 54, cw = 224, ch = 102;
    drawCard(cx, cy, cw, ch, { r: 10, border: cases[i].c });
    txt(cases[i].opp, cx + cw / 2, cy + 24, `600 14px ${SANS}`, CFG.ink);
    txt(cases[i].m, cx + cw / 2, cy + 48, `500 13px ${MONO}`, CFG.sub);
    txt(`破产率 ${cases[i].prob}`, cx + cw / 2, cy + 78, `900 20px ${MONO}`, cases[i].c);
  }

  // ==================== 右下：1657 惠更斯历史文献与数学洞察卡 ====================
  const rx = 1168, ry = 266, rw = 656, rh = 482;
  drawCard(rx, ry, rw, rh, { headerH: 54 });
  txtL('1657 · 概率论诞生的原点', rx + 28, ry + 27, `700 21px ${SERIF}`, CFG.gold);
  txtR('DE RATIOCINIIS IN LUDO ALEAE', rx + rw - 28, ry + 27, `600 13px ${MONO}`, CFG.sub);

  drawCard(rx + 28, ry + 78, rw - 56, 174, { r: 14, border: 'rgba(217,185,120,0.32)' });
  txtL('克里斯蒂安·惠更斯 (Christiaan Huygens)', rx + 50, ry + 112, `700 19px ${SERIF}`, CFG.ink);
  txtL('1657 年发表《论赌博中的计算》，首次引入“数学期望”概念。', rx + 50, ry + 148, `400 16px ${SANS}`, CFG.sub);
  txtL('书中压轴第 5 题（帕斯卡与费马通信难题）直接证明：', rx + 50, ry + 182, `500 16px ${SANS}`, CFG.ink);
  txtL('“零和博弈中，决定生死的不只是胜率，而是谁先触底。”', rx + 50, ry + 218, `700 17px ${SERIF}`, CFG.gold);

  drawCard(rx + 28, ry + 274, rw - 56, 180, { r: 14, border: 'rgba(224,72,56,0.38)' });
  drawPill(rx + 150, ry + 306, 200, 26, '非对称边界效应', `700 13px ${SANS}`, '#090814', CFG.red, null);
  txtL('• 庄家赢你 100 次，赌局继续；你输光 1 次，永久出局。', rx + 50, ry + 348, `600 16px ${SANS}`, CFG.ink);
  txtL('• 随机游走具有“常返性”：只要步数无穷多，轨迹必然访问 0。', rx + 50, ry + 384, `500 15px ${SANS}`, CFG.sub);
  txtL('• 结论：与无限耐力的对手比拼耐力，时间是100%的死神。', rx + 50, ry + 420, `700 16px ${SANS}`, CFG.red);

  X.restore();
}

/* -------------------------------------------------------------------------
 * 第二幕 (bar(24)=51.247s -> bar(44)=93.762s)
 * 波动率税与几何均值陷阱：为什么涨 50% 再跌 50% 只剩 75%，10 轮后只剩 5.63
 * ------------------------------------------------------------------------- */
function sceneVolatility(t) {
  const lt = t - bar(24);
  const dur = bar(44) - bar(24);
  const enter = eOut(sub(lt, 0, 0.95));

  X.save();
  X.globalAlpha = enter;

  // ==================== 左卡：涨 50% 再跌 50% 的不对等复利陷阱 ====================
  const lx = 96, ly = 128, lw = 680, lh = 618;
  drawCard(lx, ly, lw, lh, { headerH: 56 });
  txtL('复利不对等定律 · 波动率税 (Volatility Drag)', lx + 26, ly + 28, `700 22px ${SERIF}`, CFG.gold);
  txtR('ASYMMETRIC COMPOUNDING', lx + lw - 26, ly + 28, `700 13px ${MONO}`, CFG.sub);

  // 第一轮可视化三柱对比：¥100 -> (+50%) ¥150 -> (-50%) ¥75
  const c1x = lx + 28, c1y = ly + 78, c1w = lw - 56, c1h = 268;
  drawCard(c1x, c1y, c1w, c1h, { r: 16, border: 'rgba(217,185,120,0.32)' });
  txtL('每次拿出半仓博弈：一赢 (+50%) + 一输 (−50%) = ?', c1x + 24, c1y + 30, `700 18px ${SANS}`, CFG.ink);

  const bars = [
    { label: '初始本金', val: 100, str: '¥100', c: CFG.gold,  x: c1x + 115 },
    { label: '第一局 +50%', val: 150, str: '¥150', c: CFG.green, x: c1x + 312 },
    { label: '第二局 −50%', val: 75,  str: '¥75',  c: CFG.red,   x: c1x + 510 }
  ];
  const baseBarY = c1y + 212;
  for (let i = 0; i < 3; i++) {
    const b = bars[i];
    const bh = (b.val / 150) * 116 * eOut(sub(lt, i * 0.6, i * 0.6 + 1.0));
    rr(X, b.x - 48, baseBarY - bh, 96, bh, 8);
    X.fillStyle = b.c; X.fill();
    txt(b.str, b.x, baseBarY - bh - 18, `900 22px ${MONO}`, b.c);
    txt(b.label, b.x, baseBarY + 24, `600 14px ${SANS}`, CFG.ink);
  }
  drawArrow(bars[0].x + 56, baseBarY - 65, bars[1].x - 56, baseBarY - 85, CFG.green, 2.2, 8);
  drawArrow(bars[1].x + 56, baseBarY - 85, bars[2].x - 56, baseBarY - 45, CFG.red, 2.2, 8);

  // 下半：算术均值 vs 几何均值核心方程卡
  const c2x = lx + 28, c2y = ly + 366, c2w = lw - 56, c2h = 224;
  drawCard(c2x, c2y, c2w, c2h, { r: 16, border: 'rgba(224,72,56,0.42)' });
  drawPill(c2x + 166, c2y + 32, 276, 28, 'QUANTITATIVE FINANCE LAW', `700 13px ${MONO}`, '#090814', CFG.gold, null);

  txt('g  ≈  μ  −  ½ σ²', c2x + c2w / 2, c2y + 82, `700 38px ${GARA}`, CFG.gold);
  txt('真实几何增长率 g  =  算术平均期望 μ (0%)  −  波动率方差税 ½σ²', c2x + c2w / 2, c2y + 126, `600 16px ${SANS}`, CFG.ink);
  txtL('• 算术平均：(+50% − 50%) / 2 = 0% （你的大脑以为不赚不赔）', c2x + 28, c2y + 164, `500 15px ${SANS}`, CFG.sub);
  txtL('• 几何复利：1.5 × 0.5 = 0.75 （每经历一轮震荡，本金永久蒸发 25%！）', c2x + 28, c2y + 196, `700 15px ${SANS}`, CFG.red);

  // ==================== 右卡：10 轮“一赢一输”后本金从 ¥100 缩水至 ¥5.63 ====================
  const rx = 804, ry = 128, rw = 1020, rh = 618;
  drawCard(rx, ry, rw, rh, { headerH: 56 });
  txtL('残酷推演 · 连续 10 轮“赢 50%、输 50%”的财富蒸发曲线', rx + 28, ry + 28, `700 22px ${SERIF}`, CFG.ink);
  txtR('W_2k = 100 × (0.75)^k', rx + rw - 28, ry + 28, `700 15px ${MONO}`, CFG.red);

  const gx = rx + 76, gy = ry + 86, gw = rw - 114, gh = 352;
  const zeroY = gy + gh - 20;
  const startY = gy + gh - 20 - (100 / 155) * (gh - 40);

  // 网格线与刻度
  X.strokeStyle = 'rgba(255,255,255,0.07)';
  X.lineWidth = 1;
  for (let v of [0, 50, 100, 150]) {
    const yy = zeroY - (v / 155) * (gh - 40);
    X.beginPath(); X.moveTo(gx, yy); X.lineTo(gx + gw, yy); X.stroke();
    txtR(`¥${v}`, gx - 12, yy, `600 13px ${MONO}`, v === 100 ? CFG.gold : CFG.sub);
  }

  // 算术平均水平虚线 (¥100)
  X.save();
  X.setLineDash([7, 5]);
  X.strokeStyle = 'rgba(88, 216, 192, 0.55)';
  X.lineWidth = 1.8;
  X.beginPath(); X.moveTo(gx, startY); X.lineTo(gx + gw, startY); X.stroke();
  txtR('算术平均错觉：永远 ¥100.00', gx + gw - 12, startY - 14, `600 13px ${SANS}`, CFG.cyan);
  X.restore();

  // 动态绘制 20 步锯齿衰减曲线
  const prog = clamp((lt - 1.0) / (dur * 0.78), 0.05, 1.0);
  const totalPts = VOL_DRAG_SERIES.length - 1; // 20
  const curFloat = prog * totalPts;
  const curIdx = Math.floor(curFloat);

  // 指数包络衰减虚线 100 * 0.75^k
  X.save();
  X.setLineDash([5, 5]);
  X.strokeStyle = 'rgba(224, 72, 56, 0.75)';
  X.lineWidth = 2.2;
  X.beginPath();
  for (let i = 0; i <= 100; i++) {
    const u = i / 100;
    if (u > prog) break;
    const val = 100 * Math.pow(0.75, u * 10);
    const vx = gx + u * gw;
    const vy = zeroY - (val / 155) * (gh - 40);
    if (i === 0) X.moveTo(vx, vy); else X.lineTo(vx, vy);
  }
  X.stroke();
  X.restore();

  // 锯齿复利实线
  X.save();
  glow(CFG.gold, 12);
  X.strokeStyle = CFG.gold;
  X.lineWidth = 3.0;
  X.beginPath();
  for (let i = 0; i <= curIdx; i++) {
    const pt = VOL_DRAG_SERIES[i];
    const vx = gx + (i / totalPts) * gw;
    const vy = zeroY - (pt.val / 155) * (gh - 40);
    if (i === 0) X.moveTo(vx, vy); else X.lineTo(vx, vy);
  }
  if (curIdx < totalPts) {
    const frac = curFloat - curIdx;
    const p0 = VOL_DRAG_SERIES[curIdx], p1 = VOL_DRAG_SERIES[curIdx + 1];
    const vVal = lerp(p0.val, p1.val, frac);
    const vx = gx + (curFloat / totalPts) * gw;
    const vy = zeroY - (vVal / 155) * (gh - 40);
    X.lineTo(vx, vy);
    X.stroke();
    noGlow();
    X.fillStyle = '#FFFFFF';
    X.beginPath(); X.arc(vx, vy, 5.5, 0, Math.PI * 2); X.fill();
  } else {
    X.stroke();
    noGlow();
  }
  X.restore();

  // 底部三张实时结算卡
  const roundNum = Math.min(10, Math.floor(curFloat / 2));
  const curWealth = (100 * Math.pow(0.75, roundNum)).toFixed(2);
  const lossPct = (100 - parseFloat(curWealth)).toFixed(1);

  const cards = [
    { title: '已完成“一赢一输”轮数', val: `${roundNum} / 10 轮`, sub: '胜率严格 50% (10赢 10输)', c: CFG.gold },
    { title: '当前剩余真实本金', val: `¥${curWealth}`, sub: '初始 ¥100 经波动率税层层剥皮', c: CFG.red },
    { title: '波动率累计吞噬比例', val: `−${lossPct}%`, sub: '重仓震荡 = 慢性自杀', c: CFG.amber }
  ];
  for (let i = 0; i < 3; i++) {
    const cx = rx + 28 + i * 326, cy = ry + 462, cw = 310, ch = 128;
    drawCard(cx, cy, cw, ch, { r: 14, border: 'rgba(217,185,120,0.28)' });
    txtL(cards[i].title, cx + 20, cy + 26, `500 14px ${SANS}`, CFG.sub);
    txtR(cards[i].val, cx + cw - 20, cy + 64, `900 28px ${MONO}`, cards[i].c);
    txtL(cards[i].sub, cx + 20, cy + 102, `500 13px ${SANS}`, CFG.ink);
  }

  X.restore();
}

/* -------------------------------------------------------------------------
 * 第三幕 DROP (bar(44)=93.762s -> bar(56)=119.271s)
 * 千人蒙特卡洛生存仿真：幸存者偏差 vs 吸收壁吞噬 & 非遍历性 (Ergodicity)
 * ------------------------------------------------------------------------- */
function sceneDrop(t) {
  const lt = t - bar(44);
  const dur = bar(56) - bar(44);
  const enter = eOut(sub(lt, 0, 0.85));
  const simU = clamp(lt / (dur * 0.86), 0.04, 1.0);
  const maxR = Math.max(2, Math.floor(simU * MC_ROUNDS));

  X.save();
  X.globalAlpha = enter;

  // ==================== 左主图：1000 名玩家蒙特卡洛财富轨迹簇 ====================
  const lx = 96, ly = 124, lw = 1100, lh = 622;
  drawCard(lx, ly, lw, lh, { headerH: 56, border: 'rgba(224,72,56,0.48)' });
  txtL('千人蒙特卡洛生存实验 · 1,000 名玩家同本金入场实况', lx + 28, ly + 28, `700 22px ${SERIF}`, CFG.ink);
  drawPill(lx + lw - 138, ly + 28, 220, 28, 'MONTE CARLO · N = 1,000', `700 13px ${MONO}`, '#090814', CFG.gold, null);

  const gx = lx + 74, gy = ly + 82, gw = lw - 108, gh = 384;
  const zeroY = gy + gh;
  const initY = zeroY - (100 / 340) * gh;

  // 初始本金线
  X.strokeStyle = 'rgba(255,255,255,0.18)';
  X.setLineDash([5, 5]);
  X.beginPath(); X.moveTo(gx, initY); X.lineTo(gx + gw, initY); X.stroke();
  X.setLineDash([]);
  txtR('¥100 初始线', gx - 10, initY, `600 12px ${MONO}`, CFG.sub);
  txtR('¥300 暴富区', gx - 10, gy + 24, `600 12px ${MONO}`, CFG.gold);
  txtR('¥0 破产线', gx - 10, zeroY - 6, `700 12px ${MONO}`, CFG.red);

  // 绘制 64 条代表性随机轨迹
  let ruinedCount = 0;
  for (let p = 0; p < MC_PATHS.length; p++) {
    const path = MC_PATHS[p];
    const isTopOutlier = p >= MC_PATHS.length - 3;
    const isRuinedNow = path.ruinedAt > 0 && path.ruinedAt <= maxR;
    if (isRuinedNow) ruinedCount++;

    X.beginPath();
    for (let r = 0; r <= maxR; r++) {
      const vx = gx + (r / MC_ROUNDS) * gw;
      const vy = zeroY - (path.line[r] / 340) * gh;
      if (r === 0) X.moveTo(vx, vy); else X.lineTo(vx, vy);
    }
    if (isTopOutlier) {
      X.strokeStyle = 'rgba(217, 185, 120, 0.92)';
      X.lineWidth = 2.4;
    } else if (isRuinedNow) {
      X.strokeStyle = 'rgba(224, 72, 56, 0.34)';
      X.lineWidth = 1.2;
    } else {
      X.strokeStyle = 'rgba(130, 155, 215, 0.28)';
      X.lineWidth = 1.2;
    }
    X.stroke();
  }

  // 底部吸收壁红色熔岩带
  X.fillStyle = 'rgba(224, 72, 56, 0.24)';
  X.fillRect(gx, zeroY - 8, gw, 10);
  X.strokeStyle = CFG.red;
  X.lineWidth = 2.6;
  X.beginPath(); X.moveTo(gx, zeroY); X.lineTo(gx + gw, zeroY); X.stroke();

  // 标注顶部幸存者偏差 vs 底部中位数归零（带深色胶囊衬底，杜绝与曲线重叠）
  drawPill(gx + gw - 235, gy + 26, 440, 30, '↑ 极少数短期暴富者（媒体唯一报道的“幸存者偏差”）', `700 14px ${SANS}`, CFG.gold, 'rgba(8,7,18,0.92)', 'rgba(217,185,120,0.45)');
  drawPill(gx + gw - 235, zeroY - 26, 440, 30, '↓ 破产吸收壁：触碰即永久锁死，绝大多数学徒在此归零', `700 14px ${SANS}`, CFG.red, 'rgba(8,7,18,0.92)', 'rgba(224,72,56,0.50)');

  // 左下统计栏
  const simRoundDisplay = Math.floor(simU * 500);
  const ruinRate = Math.min(98.4, (lerp(8, 96.8, Math.pow(simU, 0.85)))).toFixed(1);
  const medianWealth = Math.max(0, (100 * Math.pow(1 - simU, 2.4))).toFixed(1);

  const statCards = [
    { k: '当前模拟博弈轮数', v: `第 ${simRoundDisplay} 轮`, c: CFG.ink },
    { k: '已触底破产淘汰比例', v: `${ruinRate}%`, c: CFG.red },
    { k: '中位数玩家剩余财富', v: `¥${medianWealth}`, c: CFG.amber }
  ];
  for (let i = 0; i < 3; i++) {
    const sx = lx + 28 + i * 354, sy = ly + 492, sw = 336, sh = 102;
    drawCard(sx, sy, sw, sh, { r: 12, border: 'rgba(217,185,120,0.26)' });
    txtL(statCards[i].k, sx + 20, sy + 32, `500 15px ${SANS}`, CFG.sub);
    txtR(statCards[i].v, sx + sw - 20, sy + 68, `900 28px ${MONO}`, statCards[i].c);
  }

  // ==================== 右侧：非遍历性 (Non-Ergodicity) 核心物理学揭秘 ====================
  const rx = 1224, ry = 124, rw = 600, rh = 622;
  drawCard(rx, ry, rw, rh, { headerH: 56, border: 'rgba(88,216,192,0.45)' });
  txtL('物理学揭秘 · 非遍历性悖论', rx + 26, ry + 28, `700 22px ${SERIF}`, CFG.cyan);
  txtR('NON-ERGODICITY', rx + rw - 26, ry + 28, `700 14px ${MONO}`, CFG.sub);

  // 群体平均 vs 个体时间平均对比卡
  const b1y = ry + 82;
  drawCard(rx + 26, b1y, rw - 52, 224, { r: 14, border: 'rgba(217,185,120,0.35)' });
  drawPill(rx + 162, b1y + 32, 232, 26, '群体空间平均 (Ensemble Mean)', `700 13px ${SANS}`, '#090814', CFG.gold, null);
  txtL('把 1000 个人的财富加起来除以 1000：', rx + 48, b1y + 76, `500 16px ${SANS}`, CFG.sub);
  txtL('由于极少数暴富者赚了几万倍，拉高了整体均值，', rx + 48, b1y + 112, `500 16px ${SANS}`, CFG.ink);
  txtL('所以“群体算术平均线”看起来依然稳如泰山。', rx + 48, b1y + 148, `700 17px ${SANS}`, CFG.gold);
  txtL('→ 这就是赌场和金融衍生品敢宣传“期望公平”的障眼法。', rx + 48, b1y + 190, `500 14px ${SANS}`, CFG.sub);

  const b2y = ry + 328;
  drawCard(rx + 26, b2y, rw - 52, 264, { r: 14, border: 'rgba(224,72,56,0.45)' });
  drawPill(rx + 162, b2y + 32, 232, 26, '个体时间平均 (Time Average)', `700 13px ${SANS}`, '#090814', CFG.red, null);
  txtL('但你没有 1000 条平行宇宙的生命！你只有 1 条命。', rx + 48, b2y + 78, `700 17px ${SANS}`, CFG.ink);
  txtL('2019 年《Nature Physics》奥利弗·彼得斯指出：', rx + 48, b2y + 116, `500 16px ${SANS}`, CFG.sub);
  txtL('在乘法复利与吸收壁下，群体均值 ≠ 个人命运。', rx + 48, b2y + 152, `700 18px ${SERIF}`, CFG.red);
  txtL('只要单个个体在牌桌上一直赌下去，', rx + 48, b2y + 192, `500 16px ${SANS}`, CFG.ink);
  txtL('你的时间平均增长率注定趋向 −∞（100% 归零出局）。', rx + 48, b2y + 228, `700 16px ${SANS}`, CFG.gold);

  X.restore();
}

/* -------------------------------------------------------------------------
 * 第四幕 (bar(56)=119.271s -> bar(71)=151.158s)
 * 1956 贝尔实验室约翰·凯利 (John Kelly) 与香农：凯利公式与生存抛物线
 * ------------------------------------------------------------------------- */
function sceneKelly(t) {
  const lt = t - bar(56);
  const enter = eOut(sub(lt, 0, 0.9));

  X.save();
  X.globalAlpha = enter;

  // 顶部凯利公式横幅
  const fx = 96, fy = 120, fw = 1728, fh = 122;
  drawCard(fx, fy, fw, fh, { border: 'rgba(217,185,120,0.48)', glowColor: 'rgba(217,185,120,0.18)', glowBlur: 16 });
  drawPill(fx + 194, fy + 32, 328, 26, '1956 · BELL LABS · JOHN L. KELLY JR.', `700 13px ${MONO}`, '#090814', CFG.gold, null);

  txt('f*  =  ( b · p − q ) / b', fx + 380, fy + 82, `700 42px ${GARA}`, CFG.gold);
  X.strokeStyle = 'rgba(217,185,120,0.28)';
  X.lineWidth = 1.5;
  X.beginPath(); X.moveTo(fx + 720, fy + 24); X.lineTo(fx + 720, fy + fh - 24); X.stroke();

  txtL('凯利公式：最优下注仓位 f*  =  (赔率 b × 胜率 p − 败率 q)  /  赔率 b', fx + 756, fy + 48, `700 22px ${SERIF}`, CFG.ink);
  txtL('人类历史上第一条严格确保“永远不触发破产吸收壁、且长期复利最快”的数学边界', fx + 756, fy + 88, `500 17px ${SANS}`, CFG.cyan);

  // ==================== 左卡：凯利公式两条救命风控铁律 ====================
  const lx = 96, ly = 262, lw = 760, lh = 486;
  drawCard(lx, ly, lw, lh, { headerH: 56, border: 'rgba(88,216,192,0.42)' });
  txtL('数学家给普通人的两条救命铁律', lx + 28, ly + 28, `700 22px ${SERIF}`, CFG.ink);
  txtR('TWO SURVIVAL LAWS', lx + lw - 28, ly + 28, `700 14px ${MONO}`, CFG.cyan);

  // 铁律 1
  const r1y = ly + 80;
  drawCard(lx + 26, r1y, lw - 52, 178, { r: 14, border: 'rgba(224,72,56,0.42)' });
  drawPill(lx + 150, r1y + 32, 208, 28, '铁律 ① · 零/负期望法则', `700 14px ${SANS}`, '#090814', CFG.red, null);
  txtR('当 b·p − q ≤ 0   ⇒   f* = 0%', lx + lw - 48, r1y + 32, `700 17px ${MONO}`, CFG.red);
  txtL('• 只要牌局没有正期望优势（如彩票、赌场、高抽水短线博弈），', lx + 48, r1y + 82, `500 16px ${SANS}`, CFG.ink);
  txtL('  凯利公式算出的最优仓位严格等于 0%！', lx + 48, r1y + 114, `700 17px ${SANS}`, CFG.gold);
  txtL('• 唯一能赢庄家的数学策略：连一分钱都不要下，立刻离开牌桌。', lx + 48, r1y + 148, `700 16px ${SANS}`, CFG.red);

  // 铁律 2
  const r2y = ly + 280;
  drawCard(lx + 26, r2y, lw - 52, 180, { r: 14, border: 'rgba(66,200,120,0.42)' });
  drawPill(lx + 150, r2y + 32, 208, 28, '铁律 ② · 严禁满仓梭哈', `700 14px ${SANS}`, '#090814', CFG.green, null);
  txtR('胜率 60%, 赔率 1:1  ⇒  f* = 20%', lx + lw - 48, r2y + 32, `700 16px ${MONO}`, CFG.green);
  txtL('• 哪怕你手握 60% 胜率的巨大确定性优势，最佳单次仓位也绝不是 100%，', lx + 48, r2y + 82, `500 16px ${SANS}`, CFG.ink);
  txtL('  而是仅仅押注本金的 20%（留出 80% 现金抵御黑天鹅连败）。', lx + 48, r2y + 114, `700 17px ${SANS}`, CFG.cyan);
  txtL('• 一旦盲目自信满仓梭哈，只要遇到 1 次小概率黑天鹅，之前赢 99 次全部归零。', lx + 48, r2y + 148, `600 15px ${SANS}`, CFG.gold);

  // ==================== 右卡：凯利对数增长率抛物线 G(f) 实测 ====================
  const rx = 888, ry = 262, rw = 936, rh = 486;
  drawCard(rx, ry, rw, rh, { headerH: 56, border: 'rgba(217,185,120,0.42)' });
  txtL('凯利生存抛物线 · 仓位比例 f 与长期几何增长率 G(f)', rx + 28, ry + 28, `700 22px ${SERIF}`, CFG.gold);
  txtR('p = 60%, b = 1.0', rx + rw - 28, ry + 28, `700 14px ${MONO}`, CFG.sub);

  const gx = rx + 76, gy = ry + 86, gw = rw - 116, gh = 270;
  const zeroY = gy + gh * 0.48; // G(f) = 0 盈亏生死线

  // 正增长安全区与负增长破产区底色
  X.fillStyle = 'rgba(66, 200, 120, 0.05)';
  X.fillRect(gx, gy, gw * (0.40 / 0.70), zeroY - gy);
  X.fillStyle = 'rgba(224, 72, 56, 0.08)';
  X.fillRect(gx + gw * (0.40 / 0.70), zeroY, gw * (0.30 / 0.70), gy + gh - zeroY);

  // 零轴生死线
  X.strokeStyle = 'rgba(255,255,255,0.28)';
  X.lineWidth = 1.6;
  X.beginPath(); X.moveTo(gx, zeroY); X.lineTo(gx + gw, zeroY); X.stroke();
  txtR('G=0 生死线', gx - 10, zeroY, `600 12px ${MONO}`, CFG.ink);
  txtR('+增长区', gx - 10, gy + 24, `600 12px ${MONO}`, CFG.green);
  txtR('−破产区', gx - 10, gy + gh - 20, `600 12px ${MONO}`, CFG.red);

  // 绘制凯利抛物线 f in [0, 0.70]
  const maxF = 0.70;
  const curveProg = clamp((lt - 1.2) / 14.0, 0.12, 1.0);
  const M = 140;

  X.save();
  glow(CFG.gold, 12);
  X.lineWidth = 3.4;
  X.beginPath();
  for (let i = 0; i <= Math.floor(M * curveProg); i++) {
    const u = i / M;
    const f = u * maxF;
    const gVal = evalKellyGrowth(f); // 峰值在 f=0.20 时约 +0.0201，f=0.40 时为 0，f=0.65 时约 -0.11
    const vx = gx + u * gw;
    const vy = clamp(zeroY - (gVal / 0.024) * (zeroY - gy - 32), gy + 12, gy + gh - 10);
    if (i === 0) X.moveTo(vx, vy); else X.lineTo(vx, vy);
  }
  const pg = X.createLinearGradient(gx, 0, gx + gw, 0);
  pg.addColorStop(0, CFG.green);
  pg.addColorStop(0.32, CFG.gold);
  pg.addColorStop(0.60, CFG.amber);
  pg.addColorStop(1, CFG.red);
  X.strokeStyle = pg;
  X.stroke();
  noGlow();
  X.restore();

  // 三个关键仓位地标竖线与说明卡
  const landmarks = [
    { f: 0.20, name: '最优凯利点 f* = 20%', desc: '长期复利增长率最高，且 0% 破产率', c: CFG.green },
    { f: 0.40, name: '两倍凯利边界 2f* = 40%', desc: '增长率跌回 0，白忙一场只赚波动', c: CFG.amber },
    { f: 0.62, name: '重仓/梭哈区 f > 50%', desc: '哪怕胜率 60%，长期也 100% 破产归零', c: CFG.red }
  ];
  for (let i = 0; i < 3; i++) {
    const lm = landmarks[i];
    const lx0 = gx + (lm.f / maxF) * gw;
    const gVal = evalKellyGrowth(lm.f);
    const ly0 = clamp(zeroY - (gVal / 0.024) * (zeroY - gy - 32), gy + 12, gy + gh - 10);

    X.strokeStyle = 'rgba(255,255,255,0.18)';
    X.setLineDash([4, 4]);
    X.beginPath(); X.moveTo(lx0, gy + 10); X.lineTo(lx0, gy + gh); X.stroke();
    X.setLineDash([]);

    X.fillStyle = lm.c;
    glow(lm.c, 10);
    X.beginPath(); X.arc(lx0, ly0, 6, 0, Math.PI * 2); X.fill();
    noGlow();

    const cx = rx + 28 + i * 298, cy = ry + 372, cw = 284, ch = 92;
    drawCard(cx, cy, cw, ch, { r: 12, border: lm.c });
    txt(lm.name, cx + cw / 2, cy + 28, `700 15px ${MONO}`, lm.c);
    txt(lm.desc, cx + cw / 2, cy + 62, `500 13px ${SANS}`, CFG.ink);
  }

  X.restore();
}

/* -------------------------------------------------------------------------
 * 终章 (bar(71)=151.158s -> 160.000s)
 * 哲学金句收敛卡片：绝不押上让自己出局的筹码
 * ------------------------------------------------------------------------- */
function sceneEnd(t) {
  const lt = t - bar(71);
  const enter = eOut(sub(lt, 0, 1.1));

  X.save();
  X.globalAlpha = enter;

  const cx = 960, cy = 415;
  for (let i = 0; i < 4; i++) {
    const r = 140 + i * 75 + Math.sin(t * 0.9 + i) * 8;
    X.strokeStyle = `rgba(217, 185, 120, ${0.18 - i * 0.035})`;
    X.lineWidth = 1.6;
    X.beginPath();
    X.arc(cx, cy, r, 0, Math.PI * 2);
    X.stroke();
  }

  const cw = 1340, ch = 430;
  const x = cx - cw / 2, y = cy - ch / 2;
  drawCard(x, y, cw, ch, {
    r: 24,
    border: 'rgba(217, 185, 120, 0.55)',
    glowColor: 'rgba(217, 185, 120, 0.22)',
    glowBlur: 24
  });

  drawPill(cx, y + 54, 340, 32, 'VIBE 知识大赏 · 概率论终局', `700 14px ${SANS}`, '#090814', CFG.gold, null);

  txt('击败赌徒的从来不是庄家的千术，而是无穷时间轴上的破产边界。', cx, y + 142, `700 30px ${SERIF}`, CFG.sub);
  glow(CFG.gold, 18);
  txt('人生最大的数学智慧，不是算出哪一把能赢，', cx, y + 218, `900 44px ${SERIF}`, CFG.ink);
  txt('而是无论面对多大诱惑，都绝不押上让自己出局的筹码。', cx, y + 282, `900 44px ${SERIF}`, CFG.gold);
  noGlow();

  txt('Never wager the chips that could knock you out of the game—survival is the prerequisite of compounding.', cx, y + 348, `italic 400 21px ${GARA}`, CFG.sub);
  txt('@anran  ·  MATHEMATICS OF SURVIVAL  ·  2026', cx, y + 394, `600 14px ${MONO}`, CFG.dim);

  X.restore();
}

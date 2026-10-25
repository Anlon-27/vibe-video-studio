/* =========================================================================
 * 《休息的假象》 · 六幕中央可视化场景实现 (scenes.js)
 * 所有核心绘制严格限制在 y = 105 .. 765 安全区内，杜绝与顶栏/注释/字幕重叠
 * ========================================================================= */

/* -------------------------------------------------------------------------
 * 序幕 (0.000s -> bar(8)=17.234s)
 * 左：深夜沙发刷手机高频信息流抽卡  |  右：身体静止(2%) vs 大脑过载(95%)悖论仪表盘
 * ------------------------------------------------------------------------- */
function sceneOpen(t) {
  const lt = t;
  const enter = eOut(sub(lt, 0.0, 1.1));
  const bp = beatPulse(t, 6.0);

  X.save();
  X.globalAlpha = enter;

  // 顶部微型导语条
  drawPill(960, 118, 680, 36, '深夜 23:45 · “我就刷十五分钟歇会儿脑子”', `600 18px ${SANS}`, CFG.gold, 'rgba(217,185,120,0.10)', 'rgba(217,185,120,0.35)');

  // ==================== 左侧卡片：手机信息流抽卡与身体静止监测 ====================
  const lx = 96, ly = 152, lw = 740, lh = 596;
  drawCard(lx, ly, lw, lh, { headerH: 54 });
  txtL('表象 · 身体完全瘫平静止', lx + 28, ly + 27, `700 22px ${SERIF}`, CFG.ink);
  txtR('POSTURE: SUPINE / STILL', lx + lw - 28, ly + 27, `600 15px ${MONO}`, CFG.sub);

  // 手机外框 (左侧偏左)
  const px = lx + 42, py = ly + 78, pw = 290, ph = 420;
  X.save();
  rr(X, px, py, pw, ph, 26);
  X.fillStyle = '#070612';
  X.fill();
  X.strokeStyle = 'rgba(217, 185, 120, 0.48)';
  X.lineWidth = 2.5;
  X.stroke();

  // 手机顶部听筒与时间
  const elapsedMin = Math.floor(lerp(15, 138, clamp(lt / 15.5, 0, 1)));
  const clockH = (22 + Math.floor((15 + elapsedMin) / 60)) % 24;
  const clockM = (15 + elapsedMin) % 60;
  const clockStr = `${String(clockH).padStart(2, '0')}:${String(clockM).padStart(2, '0')}`;
  txtL(clockStr, px + 24, py + 24, `700 15px ${MONO}`, CFG.ink);
  txtR('5G · 98%', px + pw - 24, py + 24, `600 13px ${MONO}`, CFG.sub);

  // 手机屏幕裁剪区：模拟每 1.6s 极速上划切换一条短视频
  const swipePeriod = 1.55;
  const swipeIdx = Math.floor(lt / swipePeriod);
  const swipePhase = (lt % swipePeriod) / swipePeriod;
  const slideOffset = swipePhase > 0.72 ? eInOut((swipePhase - 0.72) / 0.28) : 0;

  X.save();
  rr(X, px + 14, py + 44, pw - 28, ph - 62, 16);
  X.clip();

  for (let k = 0; k <= 1; k++) {
    const cardData = FEED_CARDS[(swipeIdx + k) % FEED_CARDS.length];
    const cy = (py + 48) + (k - slideOffset) * (ph - 58);
    rr(X, px + 18, cy, pw - 36, ph - 74, 14);
    X.fillStyle = 'rgba(24, 21, 42, 0.96)';
    X.fill();
    X.strokeStyle = cardData.color;
    X.lineWidth = 1.6;
    X.stroke();

    // 视频卡片内容
    drawPill(px + 94, cy + 32, 128, 26, cardData.tag, `700 14px ${SANS}`, '#090814', cardData.color, null);
    txtR(`时长 ${cardData.dur}`, px + pw - 34, cy + 32, `700 14px ${MONO}`, CFG.sub);

    // 模拟画面动态波纹
    const waveY = cy + 128;
    X.strokeStyle = cardData.color;
    X.lineWidth = 2.2;
    X.beginPath();
    for (let i = 0; i <= 40; i++) {
      const wx = px + 34 + (i / 40) * (pw - 68);
      const wy = waveY + Math.sin(lt * 7 + i * 0.45 + k) * 18 * Math.sin((i / 40) * Math.PI);
      if (i === 0) X.moveTo(wx, wy); else X.lineTo(wx, wy);
    }
    X.stroke();

    txt('情绪语境强制切换', px + pw / 2, cy + 206, `500 15px ${SANS}`, CFG.sub);
    txt(cardData.ctx, px + pw / 2, cy + 236, `700 22px ${SERIF}`, CFG.ink);
    drawPill(px + pw / 2, cy + 284, 210, 30, cardData.load, `700 14px ${MONO}`, cardData.color, 'rgba(255,255,255,0.05)', cardData.color);
  }
  X.restore();
  X.restore();

  // 手机右侧：时间流逝与身体指标对比
  const rx = px + pw + 34, ry = py + 10, rw = lw - ( pw + 104 );
  drawCard(rx, ry, rw, 124, { r: 14, border: 'rgba(217,185,120,0.28)' });
  txtL('计划休息时长', rx + 22, ry + 32, `500 16px ${SANS}`, CFG.sub);
  txtR('15 MIN', rx + rw - 22, ry + 32, `700 20px ${MONO}`, CFG.green);
  txtL('实际已刷时长', rx + 22, ry + 78, `700 18px ${SANS}`, CFG.ink);
  txtR(`${elapsedMin} MIN`, rx + rw - 22, ry + 78, `900 32px ${MONO}`, CFG.red);

  // 骨骼肌耗能 vs 脑部耗能进度条
  const by1 = ry + 146;
  drawCard(rx, by1, rw, 124, { r: 14, border: 'rgba(66,200,120,0.30)' });
  txtL('骨骼肌运动耗能 (EMG)', rx + 22, by1 + 32, `600 16px ${SANS}`, CFG.sub);
  txtR('2.1% 静止', rx + rw - 22, by1 + 32, `700 18px ${MONO}`, CFG.green);
  rr(X, rx + 22, by1 + 64, rw - 44, 14, 7);
  X.fillStyle = 'rgba(255,255,255,0.08)'; X.fill();
  rr(X, rx + 22, by1 + 64, (rw - 44) * 0.06, 14, 7);
  X.fillStyle = CFG.green; X.fill();
  txtL('手指仅微动 · 心率 66 bpm', rx + 22, by1 + 98, `400 14px ${SANS}`, CFG.sub);

  const by2 = by1 + 144;
  const brainLoad = lerp(38, 94.6, eOut(clamp(lt / 14.0, 0, 1)));
  drawCard(rx, by2, rw, 124, { r: 14, border: 'rgba(224,72,56,0.45)' });
  txtL('前额叶神经代谢负荷', rx + 22, by2 + 32, `600 16px ${SANS}`, CFG.ink);
  txtR(`${brainLoad.toFixed(1)}%`, rx + rw - 22, by2 + 32, `900 22px ${MONO}`, CFG.red);
  rr(X, rx + 22, by2 + 64, rw - 44, 14, 7);
  X.fillStyle = 'rgba(255,255,255,0.08)'; X.fill();
  rr(X, rx + 22, by2 + 64, (rw - 44) * (brainLoad / 100), 14, 7);
  X.fillStyle = CFG.red; X.fill();
  txtL('高频切换场景 · 神经元满载点火', rx + 22, by2 + 98, `500 14px ${SANS}`, CFG.amber);

  // 底部结论小横幅
  txt('身体躺平 ≠ 大脑休息：每次手指上划都是一次隐形的认知急刹车', lx + lw / 2, ly + lh - 28, `600 17px ${SANS}`, CFG.gold);

  // ==================== 右侧卡片：三通道实时生理示波器 ====================
  const cx = 868, cy = 152, cw = 956, ch = 596;
  drawCard(cx, cy, cw, ch, { headerH: 54 });
  txtL('真相 · 大脑正在跑一场隐形马拉松', cx + 28, cy + 27, `700 22px ${SERIF}`, CFG.gold);
  txtR('NEURO-METABOLIC TELEMETRY', cx + cw - 28, cy + 27, `600 15px ${MONO}`, CFG.sub);

  const tracks = [
    {
      title: '通道 01 · 躯体运动皮层 (Somatic Motor Cortex)',
      metric: 'FLATLINE · 12 kcal/h',
      color: CFG.green,
      desc: '身体陷在沙发里一动不动，运动皮层几乎零负荷',
      fn: (x) => 0.08 * Math.sin(x * 10 + lt * 2.0)
    },
    {
      title: '通道 02 · 前额叶与奖赏回路脉冲 (PFC & VTA Switching)',
      metric: `SPIKING · ${Math.floor(lerp(18, 86, clamp(lt / 14, 0, 1)))} 次/15min`,
      color: CFG.red,
      desc: '每15秒切换全新人物/冲突/情绪，多巴胺与注意网络高频震荡',
      fn: (x) => {
        const s = Math.sin(x * 38 - lt * 9.5) * 0.45 + Math.cos(x * 63 - lt * 13) * 0.35;
        const p = Math.exp(-Math.pow(((x * 6 - lt * 0.8) % 1 + 1) % 1 - 0.5, 2) / 0.012) * 0.65;
        return clamp(s + p * 0.5, -0.92, 0.92);
      }
    },
    {
      title: '通道 03 · 主观清醒度与精力池 (Cognitive Energy Reserve)',
      metric: `DRAINED · ${Math.floor(lerp(68, 14, clamp(lt / 15, 0, 1)))}% 剩余`,
      color: CFG.gold,
      desc: '放下手机瞬间：基线跌穿谷底，昏沉感比加班更重',
      fn: (x) => {
        const prog = clamp(lt / 15.0, 0.15, 1.0);
        const drop = lerp(0.55, -0.72, Math.pow(x * prog, 1.15));
        return drop + 0.06 * Math.sin(x * 24 - lt * 4);
      }
    }
  ];

  for (let i = 0; i < tracks.length; i++) {
    const tr = tracks[i];
    const tx = cx + 28, ty = cy + 78 + i * 164, tw = cw - 56, th = 146;
    drawCard(tx, ty, tw, th, { r: 14, border: 'rgba(160,160,195,0.20)' });

    txtL(tr.title, tx + 22, ty + 26, `700 17px ${SANS}`, CFG.ink);
    txtR(tr.metric, tx + tw - 22, ty + 26, `700 17px ${MONO}`, tr.color);

    // 示波器网格线与基线
    const gx = tx + 22, gy = ty + 48, gw = tw - 44, gh = 58;
    const midY = gy + gh / 2;
    X.strokeStyle = 'rgba(255,255,255,0.07)';
    X.lineWidth = 1;
    X.beginPath();
    X.moveTo(gx, midY); X.lineTo(gx + gw, midY);
    X.stroke();

    // 绘制实时波形
    X.save();
    glow(tr.color, 10);
    X.strokeStyle = tr.color;
    X.lineWidth = 2.6;
    X.beginPath();
    const N = 120;
    for (let j = 0; j <= N; j++) {
      const u = j / N;
      const vx = gx + u * gw;
      const vy = midY - tr.fn(u) * (gh * 0.44);
      if (j === 0) X.moveTo(vx, vy); else X.lineTo(vx, vy);
    }
    X.stroke();

    // 右侧扫描光点
    const headY = midY - tr.fn(1.0) * (gh * 0.44);
    X.fillStyle = tr.color;
    X.beginPath();
    X.arc(gx + gw, headY, 4.5 + bp * 2, 0, Math.PI * 2);
    X.fill();
    X.restore();

    txtL(tr.desc, tx + 22, ty + 124, `400 14px ${SANS}`, CFG.sub);
  }

  X.restore();
}

/* -------------------------------------------------------------------------
 * 第一幕 (bar(11)=23.612s -> bar(24)=51.247s)
 * 前半 (bar 11..16.5): 1954 Olds & Milner 大鼠脑电极自刺激实验 (2000次/小时)
 * 后半 (bar 16.5..24): 1997 Wolfram Schultz 奖赏预测误差 RPE 方程与三态示波器
 * ------------------------------------------------------------------------- */
function sceneHistory(t) {
  const splitT = bar(16) + BEAT * 2; // 约 35.30s 切换至舒尔茨 RPE 模型
  if (t < splitT) {
    _drawOldsMilner(t);
  } else {
    _drawSchultzRPE(t, splitT);
  }
}

function _drawOldsMilner(t) {
  const lt = t - bar(11);
  const enter = eOut(sub(lt, 0, 0.9));
  const bp = beatPulse(t, 6.0);

  X.save();
  X.globalAlpha = enter;

  // 左侧：1954 麦吉尔大学斯金纳电极实验舱
  const lx = 96, ly = 132, lw = 840, lh = 612;
  drawCard(lx, ly, lw, lh, { headerH: 56 });
  txtL('1954 · 麦吉尔大学 · 脑深部电极自刺激实验', lx + 28, ly + 28, `700 22px ${SERIF}`, CFG.gold);
  txtR('OLDS & MILNER · McGILL UNIV.', lx + lw - 28, ly + 28, `600 15px ${MONO}`, CFG.sub);

  // 实验舱内框
  const bx = lx + 34, by = ly + 78, bw = lw - 68, bh = 370;
  drawCard(bx, by, bw, bh, { r: 16, bgTop: 'rgba(10, 10, 22, 0.95)', bgBot: 'rgba(6, 6, 14, 0.98)', border: 'rgba(217,185,120,0.25)' });

  // 顶部脉冲发生器模块
  const gx = bx + 260, gy = by + 22, gw = 260, gh = 54;
  drawCard(gx, gy, gw, gh, { r: 10, border: CFG.gold });
  txt('电脉冲刺激器 · 60 Hz AC', gx + gw / 2, gy + 20, `700 15px ${MONO}`, CFG.gold);
  txt('靶点：隔区 / 伏隔核通路 (Septal / NAcc)', gx + gw / 2, gy + 40, `500 13px ${SANS}`, CFG.sub);

  // 机械杠杆 (左侧，随高频节奏欠阻尼下压)
  const pressFreq = 6.5;
  const pressWave = Math.max(0, Math.sin(lt * pressFreq * Math.PI));
  const leverAng = -0.18 + pressWave * 0.34;
  const pivX = bx + 150, pivY = by + 245;

  // 杠杆底座
  rr(X, bx + 42, by + 185, 112, 118, 12);
  X.fillStyle = 'rgba(42, 38, 66, 0.9)'; X.fill();
  X.strokeStyle = 'rgba(217,185,120,0.4)'; X.lineWidth = 1.8; X.stroke();
  txt('通电踏板', bx + 98, by + 215, `700 16px ${SANS}`, CFG.ink);
  txt('LEVER', bx + 98, by + 238, `600 13px ${MONO}`, CFG.gold);

  // 动态杠杆臂
  X.save();
  X.translate(pivX, pivY);
  X.rotate(leverAng);
  rr(X, 0, -8, 110, 16, 8);
  X.fillStyle = CFG.gold; X.fill();
  X.beginPath();
  X.arc(110, 0, 13, 0, Math.PI * 2);
  X.fillStyle = pressWave > 0.6 ? CFG.red : CFG.amber;
  if (pressWave > 0.6) glow(CFG.red, 16);
  X.fill();
  X.restore();

  // 大鼠脑部轮廓与电极位点 (右侧)
  const rx = bx + 535, ry = by + 235;
  X.save();
  // 脑轮廓椭圆组
  X.strokeStyle = 'rgba(180, 195, 235, 0.55)';
  X.fillStyle = 'rgba(32, 30, 58, 0.78)';
  X.lineWidth = 2.2;
  X.beginPath();
  X.ellipse(rx, ry, 135, 82, -0.08, 0, Math.PI * 2);
  X.fill(); X.stroke();

  // 中脑边缘多巴胺通路 (VTA -> NAcc)
  const vtaX = rx + 38, vtaY = ry + 24;
  const naccX = rx - 46, naccY = ry - 6;
  X.strokeStyle = CFG.gold;
  X.lineWidth = 3.2;
  glow(CFG.gold, 14);
  X.beginPath();
  X.moveTo(vtaX, vtaY);
  X.quadraticCurveTo(rx - 4, ry + 34, naccX, naccY);
  X.stroke();
  noGlow();

  // 沿通路飞驰的神经电脉冲粒子
  for (let p = 0; p < 5; p++) {
    const u = ((lt * 2.4 + p * 0.2) % 1);
    const px0 = (1 - u) * (1 - u) * vtaX + 2 * (1 - u) * u * (rx - 4) + u * u * naccX;
    const py0 = (1 - u) * (1 - u) * vtaY + 2 * (1 - u) * u * (ry + 34) + u * u * naccY;
    X.fillStyle = '#FFF3C4';
    glow(CFG.gold, 10);
    X.beginPath(); X.arc(px0, py0, 4.2, 0, Math.PI * 2); X.fill();
    noGlow();
  }

  // 电极探针垂直插入伏隔核
  X.strokeStyle = CFG.cyan;
  X.lineWidth = 2.6;
  X.beginPath();
  X.moveTo(gx + gw / 2, gy + gh);
  X.lineTo(naccX, gy + gh + 28);
  X.lineTo(naccX, naccY);
  X.stroke();

  // 电极放电光环
  const pulseR = 10 + pressWave * 22;
  const rg = X.createRadialGradient(naccX, naccY, 2, naccX, naccY, pulseR);
  rg.addColorStop(0, 'rgba(255, 230, 140, 0.95)');
  rg.addColorStop(0.5, 'rgba(224, 72, 56, 0.55)');
  rg.addColorStop(1, 'rgba(224, 72, 56, 0)');
  X.fillStyle = rg;
  X.beginPath(); X.arc(naccX, naccY, pulseR, 0, Math.PI * 2); X.fill();

  txt('伏隔核 NAcc', naccX - 10, naccY - 26, `700 15px ${SANS}`, CFG.gold);
  txt('腹侧被盖 VTA', vtaX + 18, vtaY + 28, `600 14px ${SANS}`, CFG.cyan);
  X.restore();

  // 从杠杆到刺激器的反馈回路虚线
  X.save();
  X.setLineDash([6, 5]);
  X.strokeStyle = 'rgba(217, 185, 120, 0.45)';
  X.lineWidth = 2;
  X.beginPath();
  X.moveTo(bx + 98, by + 185);
  X.lineTo(bx + 98, gy + 27);
  X.lineTo(gx, gy + 27);
  X.stroke();
  X.restore();

  txt('每次按压踏板 → 触发微电流直击中脑奖赏通路 → 诱导下一次疯狂按压', bx + bw / 2, by + bh - 24, `500 15px ${SANS}`, CFG.sub);

  // 底部三组实测数据指标卡
  const countVal = Math.floor(lerp(120, 2000, eOut(clamp(lt / 4.2, 0, 1))));
  const metrics = [
    { label: '大鼠按压杠杆频率', val: `${countVal} 次/小时`, sub: '最高纪录连续 12 小时不眠', c: CFG.gold },
    { label: '食物与饮水摄入量', val: '0.0% 拒食', sub: '宁可饿死也不离开电踏板', c: CFG.red },
    { label: '早期学界错误定论', val: '“快乐中枢”', sub: '误以为多巴胺 = 快乐本身', c: CFG.cyan }
  ];
  for (let i = 0; i < 3; i++) {
    const mx = bx + i * 262, my = by + bh + 18, mw = 248, mh = 118;
    drawCard(mx, my, mw, mh, { r: 14, border: 'rgba(217,185,120,0.28)' });
    txt(metrics[i].label, mx + mw / 2, my + 28, `500 15px ${SANS}`, CFG.sub);
    txt(metrics[i].val, mx + mw / 2, my + 64, `900 28px ${MONO}`, metrics[i].c);
    txt(metrics[i].sub, mx + mw / 2, my + 96, `400 13px ${SANS}`, CFG.ink);
  }

  // 右侧：从 1954 误解到 1997 颠覆的科学转折卡
  const rxCard = 968, ryCard = 132, rwCard = 856, rhCard = 612;
  drawCard(rxCard, ryCard, rwCard, rhCard, { headerH: 56 });
  txtL('历史悬案 · 为什么大鼠越按越痛苦却停不下来？', rxCard + 28, ryCard + 28, `700 22px ${SERIF}`, CFG.ink);
  txtR('WANTING ≠ LIKING', rxCard + rwCard - 28, ryCard + 28, `700 15px ${MONO}`, CFG.gold);

  // 上半：经典假设的破产
  const c1x = rxCard + 32, c1y = ryCard + 82, c1w = rwCard - 64, c1h = 228;
  drawCard(c1x, c1y, c1w, c1h, { r: 16, border: 'rgba(224,72,56,0.38)' });
  drawPill(c1x + 118, c1y + 34, 184, 30, '1954–1990s 传统假说', `700 14px ${SANS}`, '#090814', CFG.amber, null);
  txtL('如果多巴胺等于“快乐”，大鼠按两千次应该感到极致满足。', c1x + 28, c1y + 84, `600 19px ${SANS}`, CFG.ink);
  txtL('但后续临床脑深部刺激发现：患者疯狂按压按钮时，', c1x + 28, c1y + 124, `400 17px ${SANS}`, CFG.sub);
  txtL('主观报告的根本不是愉悦幸福，而是“永远差一点点”的焦躁强迫。', c1x + 28, c1y + 158, `600 18px ${SANS}`, CFG.red);
  txtL('就像凌晨两点的你：手指机械上划，脸上却毫无笑容。', c1x + 28, c1y + 196, `500 16px ${SERIF}`, CFG.gold);

  // 下半：肯特·贝里奇 (Kent Berridge) 渴望与喜欢分离模型
  const c2x = rxCard + 32, c2y = ryCard + 334, c2w = rwCard - 64, c2h = 250;
  drawCard(c2x, c2y, c2w, c2h, { r: 16, border: 'rgba(88,216,192,0.38)' });
  drawPill(c2x + 146, c2y + 34, 240, 30, '神经科学实锤 · 双系统分离', `700 14px ${SANS}`, '#090814', CFG.cyan, null);

  // 左右对比双框
  const hw = (c2w - 72) / 2;
  drawCard(c2x + 24, c2y + 66, hw, 160, { r: 12, border: CFG.gold });
  txt('多巴胺系统 · WANTING', c2x + 24 + hw / 2, c2y + 96, `700 18px ${MONO}`, CFG.gold);
  txt('驱动“搜寻、渴望、上划”', c2x + 24 + hw / 2, c2y + 132, `700 20px ${SERIF}`, CFG.ink);
  txt('占脑区面积大 · 极易被算法劫持放大', c2x + 24 + hw / 2, c2y + 168, `400 14px ${SANS}`, CFG.sub);
  txt('只负责下令：“下一条更好！”', c2x + 24 + hw / 2, c2y + 198, `600 15px ${SANS}`, CFG.amber);

  const hx2 = c2x + 48 + hw;
  drawCard(hx2, c2y + 66, hw, 160, { r: 12, border: CFG.green });
  txt('阿片/内啡肽热点 · LIKING', hx2 + hw / 2, c2y + 96, `700 18px ${MONO}`, CFG.green);
  txt('产生“满足、平静、愉悦”', hx2 + hw / 2, c2y + 132, `700 20px ${SERIF}`, CFG.ink);
  txt('脆弱且极小 · 刷短视频几乎不触发', hx2 + hw / 2, c2y + 168, `400 14px ${SANS}`, CFG.sub);
  txt('结果：满脑子渴望，零分满足感', hx2 + hw / 2, c2y + 198, `600 15px ${SANS}`, CFG.green);

  X.restore();
}

function _drawSchultzRPE(t, splitT) {
  const lt = t - splitT;
  const enter = eOut(sub(lt, 0, 0.85));

  X.save();
  X.globalAlpha = enter;

  // 顶部核心公式横幅：舒尔茨 1997 Science 奖赏预测误差方程
  const fx = 96, fy = 122, fw = 1728, fh = 126;
  drawCard(fx, fy, fw, fh, { border: 'rgba(217,185,120,0.45)', glowColor: 'rgba(217,185,120,0.18)', glowBlur: 16 });
  drawPill(fx + 168, fy + 32, 276, 26, '1997 · WOLFRAM SCHULTZ · SCIENCE', `700 13px ${MONO}`, '#090814', CFG.gold, null);

  // 核心数学公式 (左半栏居中，与右侧文字由竖线分隔)
  txt('δ(t)  =  R_actual  −  E[ R ]', fx + 390, fy + 84, `700 38px ${GARA}`, CFG.gold);
  X.strokeStyle = 'rgba(217,185,120,0.28)';
  X.lineWidth = 1.5;
  X.beginPath(); X.moveTo(fx + 740, fy + 24); X.lineTo(fx + 740, fy + fh - 24); X.stroke();

  txtL('奖赏预测误差  =  实际刷到的内容价值  −  大脑预期的价值', fx + 776, fy + 48, `700 22px ${SERIF}`, CFG.ink);
  txtL('多巴胺不是对“好内容”的奖赏，而是对“意外惊喜”的数学差分信号', fx + 776, fy + 88, `500 17px ${SANS}`, CFG.cyan);

  // 下方三列并行神经电生理示波器：完整还原刷短视频的三个阶段
  const cols = [
    {
      mode: 0,
      badge: '阶段 ① · 偶遇神作 (δ > 0)',
      title: '意外刷到爆笑/神反转视频',
      eq: 'R = 1.0,  E[R] = 0.0   ⇒   δ = +1.0',
      cueLabel: '手指上划',
      rewLabel: '神作出现 (爆发!)',
      color: CFG.green,
      summary: '意外惊喜触发中脑多巴胺剧烈喷发，大脑立刻把“上划动作”标记为高价值赌博'
    },
    {
      mode: 1,
      badge: '阶段 ② · 成瘾迁移 (脉冲前移)',
      title: '多巴胺前移到“手指上划瞬间”',
      eq: 'Cue 触发脉冲,  真正看视频时 δ = 0',
      cueLabel: '上划瞬间 (提前引爆!)',
      rewLabel: '观看内容 (平淡)',
      color: CFG.gold,
      summary: '最残酷的发现：让你兴奋的不再是看视频，而是“开盲盒上划”那一秒的悬念！'
    },
    {
      mode: 2,
      badge: '阶段 ③ · 刷到平庸内容 (δ < 0)',
      title: '预期落空：多巴胺跌入负值深坑',
      eq: 'R = 0.0,  E[R] = 0.85  ⇒   δ = −0.85',
      cueLabel: '满怀期待上划',
      rewLabel: '内容无聊 (骤降!)',
      color: CFG.red,
      summary: '一旦刷到无聊视频，多巴胺瞬间跌穿基线产生焦躁感，逼你立刻划走救赎！'
    }
  ];

  const cw = 554, ch = 480, gap = 33;
  for (let i = 0; i < 3; i++) {
    const c = cols[i];
    const cx = 96 + i * (cw + gap), cy = 268;
    const colEnter = eOut(sub(lt, i * 0.45, i * 0.45 + 0.9));

    X.save();
    X.globalAlpha = enter * colEnter;
    drawCard(cx, cy, cw, ch, { headerH: 56, border: c.color });
    txtL(c.badge, cx + 24, cy + 28, `700 18px ${SANS}`, c.color);
    txtR(`TRIAL 0${i + 1}`, cx + cw - 24, cy + 28, `700 14px ${MONO}`, CFG.sub);

    txtL(c.title, cx + 24, cy + 84, `700 21px ${SERIF}`, CFG.ink);
    drawPill(cx + cw / 2, cy + 124, cw - 48, 32, c.eq, `700 15px ${MONO}`, c.color, 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.14)');

    // 示波器窗口
    const ox = cx + 24, oy = cy + 158, ow = cw - 48, oh = 212;
    drawCard(ox, oy, ow, oh, { r: 12, bgTop: 'rgba(7,6,15,0.95)', bgBot: 'rgba(5,4,10,0.98)', border: 'rgba(255,255,255,0.12)' });

    const baseLineY = oy + oh * 0.58;
    // 基线虚线
    X.save();
    X.setLineDash([5, 5]);
    X.strokeStyle = 'rgba(180,185,215,0.35)';
    X.lineWidth = 1.2;
    X.beginPath(); X.moveTo(ox + 16, baseLineY); X.lineTo(ox + ow - 16, baseLineY); X.stroke();

    // Cue 与 Reward 时间轴竖线
    const cueX = ox + 16 + (ow - 32) * 0.26;
    const rewX = ox + 16 + (ow - 32) * 0.68;
    X.strokeStyle = 'rgba(217,185,120,0.35)';
    X.beginPath(); X.moveTo(cueX, oy + 18); X.lineTo(cueX, oy + oh - 22); X.stroke();
    X.strokeStyle = 'rgba(88,216,192,0.35)';
    X.beginPath(); X.moveTo(rewX, oy + 18); X.lineTo(rewX, oy + oh - 22); X.stroke();
    X.restore();

    txt(c.cueLabel, cueX, oy + 20, `600 13px ${SANS}`, CFG.gold);
    txt(c.rewLabel, rewX, oy + 20, `600 13px ${SANS}`, c.color);
    txtL('0 nM 基线', ox + 22, baseLineY - 12, `500 12px ${MONO}`, CFG.sub);

    // 神经元脉冲栅格 (Raster spikes)
    for (let s = 0; s < 26; s++) {
      const su = (s + 0.5) / 26;
      const val = evalRPEWave(c.mode, su);
      if (val > 0.12 || (s % 3 === 0 && val > -0.25)) {
        const sx = ox + 16 + su * (ow - 32);
        X.strokeStyle = val > 0.35 ? c.color : 'rgba(180,185,215,0.35)';
        X.lineWidth = val > 0.35 ? 2.2 : 1.2;
        X.beginPath();
        X.moveTo(sx, oy + oh - 26);
        X.lineTo(sx, oy + oh - 12);
        X.stroke();
      }
    }

    // 连续瞬时多巴胺浓度曲线 (带扫描光头)
    const scanU = ((lt * 0.42 + i * 0.18) % 1);
    X.save();
    glow(c.color, 12);
    X.strokeStyle = c.color;
    X.lineWidth = 3.0;
    X.beginPath();
    const M = 110;
    for (let j = 0; j <= M; j++) {
      const u = j / M;
      const vx = ox + 16 + u * (ow - 32);
      const vy = baseLineY - evalRPEWave(c.mode, u) * 76;
      if (j === 0) X.moveTo(vx, vy); else X.lineTo(vx, vy);
    }
    X.stroke();

    // 扫描高亮脉冲点
    const dotX = ox + 16 + scanU * (ow - 32);
    const dotY = baseLineY - evalRPEWave(c.mode, scanU) * 76;
    X.fillStyle = '#FFFFFF';
    X.beginPath(); X.arc(dotX, dotY, 5, 0, Math.PI * 2); X.fill();
    X.restore();

    // 底部两行精炼结论
    const line1 = c.summary.slice(0, 21);
    const line2 = c.summary.slice(21);
    txt(line1, cx + cw / 2, cy + ch - 68, `500 15px ${SANS}`, CFG.ink);
    txt(line2, cx + cw / 2, cy + ch - 40, `600 15px ${SANS}`, c.color);
    X.restore();
  }

  X.restore();
}

/* -------------------------------------------------------------------------
 * 第二幕 (bar(24)=51.247s -> bar(44)=93.762s)
 * 1974 所罗门拮抗过程天平 (左) + 2021 斯坦福 Anna Lembke 多巴胺基线坍塌曲线 (右)
 * ------------------------------------------------------------------------- */
function sceneMechanism(t) {
  const lt = t - bar(24);
  const dur = bar(44) - bar(24);
  const enter = eOut(sub(lt, 0, 1.0));
  const simProgress = clamp(lt / (dur * 0.88), 0.05, 0.98);
  const state = evalOpponentState(simProgress);

  X.save();
  X.globalAlpha = enter;

  // ==================== 左侧：神经内稳态拮抗天平 ====================
  const lx = 96, ly = 128, lw = 640, lh = 618;
  drawCard(lx, ly, lw, lh, { headerH: 56 });
  txtL('1974 · 所罗门拮抗过程天平', lx + 26, ly + 28, `700 22px ${SERIF}`, CFG.gold);
  txtR('OPPONENT-PROCESS', lx + lw - 26, ly + 28, `700 14px ${MONO}`, CFG.sub);

  // 天平动力学区域 (上移支点并收敛倾角，确保上下绝不触碰文字与底卡)
  const sx = lx + lw / 2, sy = ly + 216;
  const beamAngle = clamp(-state.net * 0.26 + Math.sin(t * 3.2) * 0.012, -0.22, 0.22);

  // 水平稳态基准虚线 (标签置于支点正上方安全区)
  X.save();
  X.setLineDash([6, 6]);
  X.strokeStyle = 'rgba(255,255,255,0.20)';
  X.lineWidth = 1.5;
  X.beginPath();
  X.moveTo(lx + 46, sy); X.lineTo(lx + lw - 46, sy);
  X.stroke();
  txt('—— 内稳态平衡基准线 (Homeostasis) ——', sx, ly + 88, `500 13px ${MONO}`, CFG.sub);
  X.restore();

  // 中央支点三角座
  X.fillStyle = 'rgba(217, 185, 120, 0.22)';
  X.strokeStyle = CFG.gold;
  X.lineWidth = 2.4;
  X.beginPath();
  X.moveTo(sx, sy);
  X.lineTo(sx - 34, sy + 68);
  X.lineTo(sx + 34, sy + 68);
  X.closePath();
  X.fill(); X.stroke();
  txt('内稳态支点', sx, sy + 88, `600 14px ${SANS}`, CFG.gold);

  // 旋转横梁与左右托盘
  X.save();
  X.translate(sx, sy);
  X.rotate(beamAngle);

  // 横梁
  glow(beamAngle > 0.06 ? CFG.red : CFG.gold, 12);
  rr(X, -210, -5, 420, 10, 5);
  X.fillStyle = CFG.ink; X.fill();
  noGlow();

  // 左端：快过程 A (多巴胺瞬时快感)
  X.save();
  X.translate(-188, 0);
  X.rotate(-beamAngle); // 保持托盘水平悬挂
  X.strokeStyle = CFG.gold; X.lineWidth = 2;
  X.beginPath(); X.moveTo(0, 0); X.lineTo(-38, 48); X.moveTo(0, 0); X.lineTo(38, 48); X.stroke();
  rr(X, -64, 48, 128, 10, 5);
  X.fillStyle = CFG.gold; X.fill();

  const aHeight = 18 + state.procA * 52;
  rr(X, -44, 48 - aHeight, 88, aHeight, 7);
  X.fillStyle = 'rgba(217, 185, 120, 0.85)'; X.fill();
  txt('A 过程 · 快感', 0, 76, `700 15px ${SANS}`, CFG.gold);
  txt('瞬时冲高 · 极快消退', 0, 96, `400 13px ${SANS}`, CFG.sub);
  X.restore();

  // 右端：慢过程 B (大脑反制重锤 / 戒断赤字)
  X.save();
  X.translate(188, 0);
  X.rotate(-beamAngle);
  X.strokeStyle = CFG.red; X.lineWidth = 2;
  X.beginPath(); X.moveTo(0, 0); X.lineTo(-38, 48); X.moveTo(0, 0); X.lineTo(38, 48); X.stroke();
  rr(X, -64, 48, 128, 10, 5);
  X.fillStyle = CFG.red; X.fill();

  // 随刷视频次数叠加的拮抗铁块
  const weightCount = Math.min(5, 1 + Math.floor(simProgress * 5));
  for (let w = 0; w < weightCount; w++) {
    rr(X, -48 + w * 2, 48 - (w + 1) * 14, 96 - w * 4, 12, 3);
    X.fillStyle = '#E04838'; X.fill();
    X.strokeStyle = '#180808'; X.lineWidth = 1; X.stroke();
  }
  txt(`B 过程 · 拮抗重锤 ×${weightCount}`, 0, 76, `700 15px ${SANS}`, CFG.red);
  txt('缓慢累积 · 持久拖拽', 0, 96, `400 13px ${SANS}`, CFG.sub);
  X.restore();

  X.restore();

  // 左侧下半：斯坦福安娜·伦布克《多巴胺帝国》核心定律卡片
  const bx = lx + 28, by = ly + 424, bw = lw - 56, bh = 168;
  drawCard(bx, by, bw, bh, { r: 14, border: 'rgba(224,72,56,0.38)' });
  drawPill(bx + 158, by + 28, 268, 26, 'STANFORD · ANNA LEMBKE (2021)', `700 13px ${MONO}`, '#090814', CFG.red, null);
  txtL('定律 1：大脑绝不允许免费的持续高潮，每次波峰必伴随反向重锤。', bx + 22, by + 70, `600 16px ${SANS}`, CFG.ink);
  txtL('定律 2：连续高频刺激下，快感 A 越来越矮，拮抗重锤 B 却越垒越重。', bx + 22, by + 105, `600 16px ${SANS}`, CFG.gold);
  txtL('定律 3：后半夜你根本不是因为“好看”在刷，而是怕停手时天平砸穿谷底。', bx + 22, by + 140, `700 16px ${SANS}`, CFG.red);

  // ==================== 右侧：多巴胺基线坍塌全景动力学曲线 ====================
  const rx = 768, ry = 128, rw = 1056, rh = 618;
  drawCard(rx, ry, rw, rh, { headerH: 56 });
  txtL('连续刷短视频 120 分钟 · 多巴胺基线坍塌实测轨迹', rx + 28, ry + 28, `700 22px ${SERIF}`, CFG.ink);
  txtR('BASELINE COLLAPSE & DEFICIT', rx + rw - 28, ry + 28, `700 14px ${MONO}`, CFG.red);

  // 绘图坐标系区域
  const gx = rx + 78, gy = ry + 84, gw = rw - 116, gh = 356;
  const zeroY = gy + gh * 0.45; // 正常静息基线 (100 nM)

  // 背景风险分区染色
  X.fillStyle = 'rgba(217, 185, 120, 0.04)';
  X.fillRect(gx, gy, gw, zeroY - gy);
  X.fillStyle = 'rgba(224, 72, 56, 0.07)';
  X.fillRect(gx, zeroY, gw, gy + gh - zeroY);

  // 坐标网格与刻度
  X.strokeStyle = 'rgba(255,255,255,0.07)';
  X.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const yy = gy + (i / 4) * gh;
    X.beginPath(); X.moveTo(gx, yy); X.lineTo(gx + gw, yy); X.stroke();
  }
  txtR('+100% 欣快区', gx - 12, gy + 16, `600 13px ${MONO}`, CFG.gold);
  txtR('100nM 正常基线', gx - 12, zeroY, `700 13px ${MONO}`, CFG.ink);
  txtR('-60% 戒断赤字', gx - 12, gy + gh - 16, `700 13px ${MONO}`, CFG.red);

  // 正常静息基线水平参考虚线
  X.save();
  X.setLineDash([8, 6]);
  X.strokeStyle = 'rgba(240, 238, 232, 0.45)';
  X.lineWidth = 1.6;
  X.beginPath(); X.moveTo(gx, zeroY); X.lineTo(gx + gw, zeroY); X.stroke();
  X.restore();

  // 1. 绘制下沉的真实多巴胺基线 (虚线红)
  const steps = 220;
  const maxStep = Math.floor(steps * simProgress);

  X.save();
  X.setLineDash([6, 4]);
  X.strokeStyle = 'rgba(224, 72, 56, 0.82)';
  X.lineWidth = 2.4;
  X.beginPath();
  for (let i = 0; i <= maxStep; i++) {
    const u = i / steps;
    const st = evalOpponentState(u);
    const vx = gx + u * gw;
    const vy = zeroY - st.baseline * (gh * 0.48);
    if (i === 0) X.moveTo(vx, vy); else X.lineTo(vx, vy);
  }
  X.stroke();
  X.restore();

  // 2. 绘制净多巴胺波动曲线 (金色波峰 -> 红色深谷)
  X.save();
  glow(CFG.gold, 12);
  X.lineWidth = 3.0;
  X.beginPath();
  for (let i = 0; i <= maxStep; i++) {
    const u = i / steps;
    const st = evalOpponentState(u);
    const vx = gx + u * gw;
    const vy = clamp(zeroY - st.net * (gh * 0.48), gy + 8, gy + gh - 8);
    if (i === 0) X.moveTo(vx, vy); else X.lineTo(vx, vy);
  }
  const strokeGrad = X.createLinearGradient(gx, gy, gx + gw, gy + gh);
  strokeGrad.addColorStop(0, CFG.gold);
  strokeGrad.addColorStop(0.55, CFG.amber);
  strokeGrad.addColorStop(1, CFG.red);
  X.strokeStyle = strokeGrad;
  X.stroke();
  noGlow();

  // 当前时间扫描光点与数值标注
  const curX = gx + simProgress * gw;
  const curY = clamp(zeroY - state.net * (gh * 0.48), gy + 8, gy + gh - 8);

  X.fillStyle = '#FFFFFF';
  glow(CFG.red, 14);
  X.beginPath(); X.arc(curX, curY, 6, 0, Math.PI * 2); X.fill();
  noGlow();

  txtR('--- 红色虚线：真实静息基线持续下沉 ↓', gx + gw - 16, zeroY + 24, `700 14px ${SANS}`, CFG.red);
  X.restore();

  // 标注波峰递减趋势线
  if (simProgress > 0.35) {
    drawArrow(gx + 60, gy + 32, gx + gw * 0.78, zeroY - 18, 'rgba(217,185,120,0.65)', 2.0, 8);
    txt('耐受性：同样的段子，波峰越来越矮', gx + gw * 0.44, gy + 28, `600 15px ${SANS}`, CFG.gold);
  }

  // 底部三张动态结算指标卡
  const curSwipeNum = Math.min(180, Math.floor(simProgress * 180));
  const peakRemain  = Math.round(lerp(100, 22, simProgress));
  const baseLevel   = Math.round(lerp(100, 56, simProgress));
  const cards = [
    { title: '累计划过视频数', val: `${curSwipeNum} 条`, note: '平均每 15 秒一次多巴胺赊账', c: CFG.gold },
    { title: '单次多巴胺波峰高度', val: `${peakRemain}%`, note: '受体下调 (Downregulation) 产生耐受', c: CFG.amber },
    { title: '当前静息多巴胺基线', val: `${baseLevel} nM`, note: baseLevel < 75 ? '已跌入多巴胺赤字区（停手即空虚）' : '基线开始承压下滑', c: CFG.red }
  ];

  for (let i = 0; i < 3; i++) {
    const cx = rx + 28 + i * 338, cy = ry + 462, cw = 322, ch = 128;
    drawCard(cx, cy, cw, ch, { r: 14, border: 'rgba(217,185,120,0.26)' });
    txtL(cards[i].title, cx + 22, cy + 30, `500 15px ${SANS}`, CFG.sub);
    txtR(cards[i].val, cx + cw - 22, cy + 32, `900 28px ${MONO}`, cards[i].c);
    txtL(cards[i].note, cx + 22, cy + 86, `500 14px ${SANS}`, CFG.ink);
  }

  X.restore();
}

/* -------------------------------------------------------------------------
 * 第三幕 DROP (bar(44)=93.762s -> bar(56)=119.271s)
 * 左右双脑代谢同屏对比：高频上下文切换 (95% 过载) vs 默认模式网络 DMN (慢波清理)
 * ------------------------------------------------------------------------- */
function sceneDrop(t) {
  const lt = t - bar(44);
  const enter = eOut(sub(lt, 0, 0.85));
  const bp = beatPulse(t, 5.5);

  X.save();
  X.globalAlpha = enter;

  // 顶部能量定律横幅
  drawCard(96, 118, 1728, 56, { r: 14, border: 'rgba(217,185,120,0.42)' });
  txt('脑能量代谢铁律：人脑仅占体重 2%，却吞噬全身 20% 能量 —— “刷手机”与“真发呆”到底谁在耗电？', 960, 146, `700 20px ${SERIF}`, CFG.gold);

  // ==================== 左半场：刷短视频 · 伪休息 (TPN 高频切换过热) ====================
  const lx = 96, ly = 190, lw = 844, lh = 558;
  drawCard(lx, ly, lw, lh, { headerH: 56, border: 'rgba(224,72,56,0.55)' });
  txtL('刷短视频 · 伪休息（高频上下文撕裂）', lx + 26, ly + 28, `700 22px ${SERIF}`, CFG.red);
  drawPill(lx + lw - 116, ly + 28, 176, 28, 'LOAD: 95.4% OVERHEAT', `700 13px ${MONO}`, '#090814', CFG.red, null);

  // 左脑拓扑绘制
  _drawBrainNetwork(lx + lw / 2, ly + 235, 255, 145, t, 'overload', bp);

  // 左脑下方实时上下文切换指示器与代谢表
  const switchCount = 12 + Math.floor((lt / 25.5) * 36);
  const curCard = FEED_CARDS[Math.floor(t * 1.4) % FEED_CARDS.length];
  drawCard(lx + 26, ly + 402, lw - 52, 124, { r: 14, border: 'rgba(224,72,56,0.35)' });
  txtL(`当前强制加载语境：${curCard.tag} (${curCard.ctx})`, lx + 48, ly + 434, `700 17px ${SANS}`, CFG.amber);
  txtR(`10分钟切换: ${switchCount} 次`, lx + lw - 48, ly + 434, `900 20px ${MONO}`, CFG.red);
  txtL('• 每划一条新视频，视觉/语言/杏仁核必须在毫秒内推倒重建整套人物与情绪模型', lx + 48, ly + 472, `400 15px ${SANS}`, CFG.ink);
  txtL('• 默认模式网络 (DMN) 被强行抑制关闭，白天积压的工作记忆碎片 0% 得到清理', lx + 48, ly + 502, `600 15px ${SANS}`, CFG.red);

  // ==================== 右半场：看窗外/发呆 · 真休息 (DMN 默认模式网络慢波) ====================
  const rx = 980, ry = 190, rw = 844, rh = 558;
  drawCard(rx, ry, rw, rh, { headerH: 56, border: 'rgba(88,216,192,0.55)' });
  txtL('放空发呆 · 真休息（默认模式网络 DMN）', rx + 26, ry + 28, `700 22px ${SERIF}`, CFG.cyan);
  drawPill(rx + rw - 116, ry + 28, 176, 28, 'DMN: SLOW-WAVE SYNC', `700 13px ${MONO}`, '#090814', CFG.cyan, null);

  // 右脑拓扑绘制
  _drawBrainNetwork(rx + rw / 2, ry + 235, 255, 145, t, 'dmn', bp);

  // 右脑下方 DMN 内存归档说明
  const cleanPct = Math.min(96, Math.floor(lerp(42, 94, clamp(lt / 22, 0, 1))));
  drawCard(rx + 26, ry + 402, rw - 52, 124, { r: 14, border: 'rgba(88,216,192,0.35)' });
  txtL('2001 · 马库斯·雷切尔 (Marcus Raichle) 发现 DMN 默认模式网络', rx + 48, ry + 434, `700 17px ${SANS}`, CFG.cyan);
  txtR(`碎片归档率: ${cleanPct}%`, rx + rw - 48, ry + 434, `900 20px ${MONO}`, CFG.green);
  txtL('• 当你停止外部信息输入（散步、看窗外、发呆），内侧前额叶与后扣带回同步慢波亮起', rx + 48, ry + 472, `400 15px ${SANS}`, CFG.ink);
  txtL('• 像后台碎片整理程序，将白天杂乱的短期记忆归档入海马体，前额叶满血回蓝', rx + 48, ly + 502, `600 15px ${SANS}`, CFG.green);

  X.restore();
}

function _drawBrainNetwork(cx, cy, rx, ry, t, mode, bp) {
  X.save();
  const isOver = mode === 'overload';
  const mainCol = isOver ? CFG.red : CFG.cyan;

  // 外围脑皮层光晕与轮廓
  const bgGrad = X.createRadialGradient(cx, cy, 20, cx, cy, rx * 1.15);
  bgGrad.addColorStop(0, isOver ? 'rgba(224, 72, 56, 0.20)' : 'rgba(88, 216, 192, 0.18)');
  bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
  X.fillStyle = bgGrad;
  X.beginPath(); X.ellipse(cx, cy, rx * 1.15, ry * 1.15, 0, 0, Math.PI * 2); X.fill();

  // 若是 DMN 模式，绘制柔和同心慢波扩散环
  if (!isOver) {
    for (let r = 0; r < 3; r++) {
      const waveU = ((t * 0.35 + r * 0.33) % 1);
      X.strokeStyle = `rgba(88, 216, 192, ${(1 - waveU) * 0.42})`;
      X.lineWidth = 2;
      X.beginPath();
      X.ellipse(cx, cy, rx * (0.35 + waveU * 0.72), ry * (0.35 + waveU * 0.72), 0, 0, Math.PI * 2);
      X.stroke();
    }
  }

  // 大脑皮层外轮廓
  X.strokeStyle = isOver ? 'rgba(224, 72, 56, 0.55)' : 'rgba(88, 216, 192, 0.55)';
  X.lineWidth = 2.4;
  X.beginPath();
  X.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  X.stroke();

  // 绘制连接边与高速穿梭粒子
  const edges = isOver ? TASK_EDGES : DMN_EDGES;
  for (let e = 0; e < edges.length; e++) {
    const n1 = BRAIN_NODES[edges[e][0]];
    const n2 = BRAIN_NODES[edges[e][1]];
    const x1 = cx + n1.x * rx, y1 = cy + n1.y * ry;
    const x2 = cx + n2.x * rx, y2 = cy + n2.y * ry;

    X.strokeStyle = isOver ? 'rgba(232, 168, 73, 0.42)' : 'rgba(88, 216, 192, 0.48)';
    X.lineWidth = isOver ? 1.8 : 2.4;
    X.beginPath(); X.moveTo(x1, y1); X.lineTo(x2, y2); X.stroke();

    // 边上粒子流（过载模式狂乱高速，DMN 模式平缓同步）
    const speed = isOver ? 2.8 : 0.65;
    const pu = ((t * speed + e * 0.23) % 1);
    const px = lerp(x1, x2, pu), py = lerp(y1, y2, pu);
    X.fillStyle = isOver ? '#FFE082' : '#A8FFEC';
    glow(mainCol, 8);
    X.beginPath(); X.arc(px, py, isOver ? 3.8 : 4.5, 0, Math.PI * 2); X.fill();
    noGlow();
  }

  // 绘制脑区节点
  for (let i = 0; i < BRAIN_NODES.length; i++) {
    const nd = BRAIN_NODES[i];
    const nx = cx + nd.x * rx, ny = cy + nd.y * ry;
    const active = isOver ? (nd.role !== 'dmn') : (nd.role !== 'task');
    const nodeCol = active ? mainCol : 'rgba(130, 135, 165, 0.32)';
    const rad = active ? (7.5 + bp * 2.2) : 4.5;

    if (active) glow(mainCol, 12);
    X.fillStyle = nodeCol;
    X.beginPath(); X.arc(nx, ny, rad, 0, Math.PI * 2); X.fill();
    noGlow();

    if (active) {
      const labelY = nd.y > 0.15 ? ny + 20 : ny - 16;
      glow('#05040C', 8);
      txt(nd.name, nx, labelY, `600 13px ${SANS}`, CFG.ink);
      noGlow();
    }
  }

  X.restore();
}

/* -------------------------------------------------------------------------
 * 第四幕 (bar(56)=119.271s -> bar(71)=151.158s)
 * 多巴胺排毒的科学祛魅 + 两条神经恢复处方（单长上下文 + 10分钟无聊缓冲带）
 * ------------------------------------------------------------------------- */
function sceneYou(t) {
  const lt = t - bar(56);
  const enter = eOut(sub(lt, 0, 0.9));

  X.save();
  X.globalAlpha = enter;

  // 顶部概念纠偏横幅
  const tx = 96, ty = 120, tw = 1728, th = 114;
  drawCard(tx, ty, tw, th, { border: 'rgba(217,185,120,0.42)' });
  drawPill(tx + 178, ty + 34, 286, 28, '伪概念祛魅 · DOPAMINE DETOX MYTH', `700 13px ${MONO}`, '#090814', CFG.gold, null);
  txtL('× 误区：把“多巴胺排毒”当成排空体内的多巴胺（没有多巴胺人连起床喝水都无法完成）', tx + 340, ty + 36, `600 17px ${SANS}`, CFG.sub);
  txtL('✓ 真相：真正榨干你的是“零阻力高频切换”——恢复大脑只需切断碎片流，重启默认模式网络', tx + 34, ty + 80, `700 21px ${SERIF}`, CFG.gold);

  // ==================== 左卡：处方一 · 用“单长上下文”替代碎片 ====================
  const lx = 96, ly = 254, lw = 844, lh = 496;
  drawCard(lx, ly, lw, lh, { headerH: 56, border: 'rgba(88,152,232,0.45)' });
  txtL('处方 ① · 用“单长上下文”替代百次碎片切换', lx + 26, ly + 28, `700 22px ${SERIF}`, CFG.ink);
  txtR('CONTEXT FRICTION RULE', lx + lw - 26, ly + 28, `700 14px ${MONO}`, CFG.blue);

  // 对比实验：同样 120 分钟娱乐
  const b1y = ly + 82;
  drawCard(lx + 26, b1y, lw - 52, 174, { r: 14, border: 'rgba(224,72,56,0.38)' });
  txtL('方案 A：刷 120 分钟短视频（约 360 条）', lx + 48, b1y + 30, `700 18px ${SANS}`, CFG.red);
  txtR('切换损耗: 极高', lx + lw - 48, b1y + 30, `700 16px ${MONO}`, CFG.red);

  // 密集锯齿碎片条
  for (let i = 0; i < 36; i++) {
    const sx = lx + 48 + i * 20.8;
    rr(X, sx, b1y + 56, 16, 46, 3);
    X.fillStyle = i % 2 === 0 ? 'rgba(224,72,56,0.82)' : 'rgba(232,168,73,0.75)';
    X.fill();
  }
  txtL('• 360 次语境推倒重建 + 360 次奖赏预测误差冲击 → 停手时基线崩盘、头昏脑胀', lx + 48, b1y + 136, `500 15px ${SANS}`, CFG.sub);

  const b2y = ly + 278;
  drawCard(lx + 26, b2y, lw - 52, 188, { r: 14, border: 'rgba(66,200,120,0.42)' });
  txtL('方案 B：看 1 部 120 分钟长电影 / 读一章书 / 玩单机大作', lx + 48, b2y + 30, `700 18px ${SANS}`, CFG.green);
  txtR('切换损耗: 仅 1 次', lx + lw - 48, b2y + 30, `700 16px ${MONO}`, CFG.green);

  // 连续平稳心流条
  const flowW = (lw - 96) * eOut(clamp((lt - 1.5) / 6.0, 0.15, 1.0));
  rr(X, lx + 48, b2y + 56, lw - 96, 46, 10);
  X.fillStyle = 'rgba(255,255,255,0.06)'; X.fill();
  rr(X, lx + 48, b2y + 56, flowW, 46, 10);
  const fg = X.createLinearGradient(lx + 48, 0, lx + 48 + flowW, 0);
  fg.addColorStop(0, 'rgba(88,152,232,0.85)');
  fg.addColorStop(1, 'rgba(66,200,120,0.88)');
  X.fillStyle = fg; X.fill();
  txt('单一连续世界观 · 稳定沉浸心流 (Flow State)', lx + lw / 2, b2y + 79, `700 16px ${SANS}`, '#081018');
  txtL('• 前 10 分钟具有启动认知阻力，但进入后多巴胺平稳释放，结束后反而神清气爽', lx + 48, b2y + 136, `500 15px ${SANS}`, CFG.ink);
  txtL('• 核心心法：越需要“耐着性子进入”的休息，越能真正滋养神经基线', lx + 48, b2y + 164, `600 15px ${SANS}`, CFG.gold);

  // ==================== 右卡：处方二 · 10 分钟“无输入无聊缓冲带” ====================
  const rx = 980, ry = 254, rw = 844, rh = 496;
  drawCard(rx, ry, rw, rh, { headerH: 56, border: 'rgba(88,216,192,0.48)' });
  txtL('处方 ② · 给大脑留出 10 分钟“无聊缓冲带”', rx + 26, ry + 28, `700 22px ${SERIF}`, CFG.ink);
  txtR('10-MIN BOREDOM BUFFER', rx + rw - 26, ry + 28, `700 14px ${MONO}`, CFG.cyan);

  // 10 分钟恢复时间轴曲线
  const gx = rx + 68, gy = ry + 92, gw = rw - 108, gh = 236;
  const baseY = gy + gh * 0.42;

  X.strokeStyle = 'rgba(255,255,255,0.08)';
  X.lineWidth = 1;
  X.beginPath(); X.moveTo(gx, baseY); X.lineTo(gx + gw, baseY); X.stroke();
  txtR('正常基线', gx - 10, baseY, `600 12px ${MONO}`, CFG.gold);
  txtR('赤字谷底', gx - 10, gy + gh - 18, `600 12px ${MONO}`, CFG.red);

  // 恢复曲线：从 -0.85 赤字谷底经过 0..10 分钟爬升回正常基线并激活 DMN
  const recProg = clamp((lt - 2.0) / 18.0, 0.08, 1.0);
  X.save();
  glow(CFG.cyan, 12);
  X.lineWidth = 3.2;
  X.beginPath();
  const N = 120;
  for (let i = 0; i <= Math.floor(N * recProg); i++) {
    const u = i / N;
    const vx = gx + u * gw;
    // S 型回升 + 轻微慢波呼吸
    const val = lerp(-0.78, 0.18, eInOut(u)) + 0.05 * Math.sin(u * 18 - t * 2.5);
    const vy = baseY - val * (gh * 0.52);
    if (i === 0) X.moveTo(vx, vy); else X.lineTo(vx, vy);
  }
  const rg = X.createLinearGradient(gx, 0, gx + gw, 0);
  rg.addColorStop(0, CFG.red);
  rg.addColorStop(0.45, CFG.gold);
  rg.addColorStop(1, CFG.cyan);
  X.strokeStyle = rg;
  X.stroke();
  noGlow();
  X.restore();

  // 三个关键时间节点里程碑
  const stages = [
    { u: 0.08, time: '0–2 MIN · 戒断手痒期', desc: '刚放下手机极度无聊，手指本能想抓屏幕', c: CFG.red },
    { u: 0.48, time: '3–6 MIN · 慢波接管期', desc: '跨过焦躁阈值，默认模式网络 (DMN) 重新点火', c: CFG.gold },
    { u: 0.88, time: '7–10 MIN · 基线回升期', desc: '前额叶松弛下来，注意力与平静感重新聚拢', c: CFG.cyan }
  ];
  for (let i = 0; i < 3; i++) {
    const st = stages[i];
    const sx = gx + st.u * gw;
    X.strokeStyle = 'rgba(255,255,255,0.16)';
    X.setLineDash([4, 4]);
    X.beginPath(); X.moveTo(sx, gy + 10); X.lineTo(sx, gy + gh); X.stroke();
    X.setLineDash([]);

    const cardX = rx + 26 + i * 268, cardY = ry + 350, cardW = 254, cardH = 118;
    drawCard(cardX, cardY, cardW, cardH, { r: 12, border: st.c });
    txt(st.time, cardX + cardW / 2, cardY + 28, `700 15px ${MONO}`, st.c);
    txt(st.desc.slice(0, 12), cardX + cardW / 2, cardY + 64, `500 14px ${SANS}`, CFG.ink);
    txt(st.desc.slice(12), cardX + cardW / 2, cardY + 90, `500 14px ${SANS}`, CFG.sub);
  }

  X.restore();
}

/* -------------------------------------------------------------------------
 * 终章 (bar(71)=151.158s -> 160.000s)
 * 哲学金句收敛卡片：允许自己安静地无聊一会儿
 * ------------------------------------------------------------------------- */
function sceneEnd(t) {
  const lt = t - bar(71);
  const enter = eOut(sub(lt, 0, 1.1));

  X.save();
  X.globalAlpha = enter;

  // 中央静谧慢波同心圆环
  const cx = 960, cy = 415;
  for (let i = 0; i < 4; i++) {
    const r = 140 + i * 75 + Math.sin(t * 0.9 + i) * 8;
    X.strokeStyle = `rgba(217, 185, 120, ${0.18 - i * 0.035})`;
    X.lineWidth = 1.6;
    X.beginPath();
    X.arc(cx, cy, r, 0, Math.PI * 2);
    X.stroke();
  }

  // 核心金句悬浮卡
  const cw = 1320, ch = 430;
  const x = cx - cw / 2, y = cy - ch / 2;
  drawCard(x, y, cw, ch, {
    r: 24,
    border: 'rgba(217, 185, 120, 0.55)',
    glowColor: 'rgba(217, 185, 120, 0.22)',
    glowBlur: 24
  });

  drawPill(cx, y + 54, 320, 32, 'VIBE 知识大赏 · 认知收敛', `700 14px ${SANS}`, '#090814', CFG.gold, null);

  txt('刷手机从来不是休息，那是让大脑替算法无偿打工。', cx, y + 142, `700 32px ${SERIF}`, CFG.sub);
  glow(CFG.gold, 18);
  txt('真正治愈疲惫的，从来不是塞满刺激，', cx, y + 218, `900 44px ${SERIF}`, CFG.ink);
  txt('而是关掉屏幕，允许自己安静地无聊一会儿。', cx, y + 282, `900 46px ${SERIF}`, CFG.gold);
  noGlow();

  txt('True rest is never found in more stimulation, but in granting yourself the grace of quiet boredom.', cx, y + 348, `italic 400 22px ${GARA}`, CFG.sub);
  txt('@anran  ·  NEUROSCIENCE OF REST  ·  2026', cx, y + 394, `600 14px ${MONO}`, CFG.dim);

  X.restore();
}

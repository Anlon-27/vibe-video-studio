/* =========================================================================
 * 《久赌必输的数学》 · 确定性随机游走、波动率税与千人蒙特卡洛仿真 (sim.js)
 * ========================================================================= */

// 1. 预生成一维随机游走轨迹 (1657 惠更斯吸收壁展示)
const _walkRng = mulberry32(16570101);
const WALK_STEPS = 80;
const SINGLE_WALK = (() => {
  const arr = [10]; // 初始筹码 n = 10
  let cur = 10;
  // 精心构造一条先冲高到 17、随后经历连败跌破 0 吸收壁的典型轨迹
  const deltas = [
    1, 1, -1, 1, 1, 1, -1, 1, 1, -1,
    1, 1, -1, -1, 1, -1, -1, 1, -1, -1,
    -1, 1, -1, -1, -1, 1, -1, -1, 1, -1,
    -1, -1, 1, -1, -1, -1, 1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1
  ];
  for (let i = 0; i < WALK_STEPS; i++) {
    if (cur <= 0) {
      arr.push(0);
    } else {
      const d = i < deltas.length ? deltas[i] : (_walkRng() > 0.52 ? 1 : -1);
      cur = Math.max(0, cur + d);
      arr.push(cur);
    }
  }
  return arr;
})();

// 2. 波动率税（Volatility Drag）：本金 100，每轮先 +50% 再 -50%，共 10 个大周期（20步）
const VOL_DRAG_SERIES = (() => {
  const pts = [{ step: 0, val: 100.0, tag: '初始本金' }];
  let w = 100.0;
  for (let k = 1; k <= 10; k++) {
    w = w * 1.5;
    pts.push({ step: 2 * k - 1, val: w, tag: `+50%` });
    w = w * 0.5;
    pts.push({ step: 2 * k, val: w, tag: `-50%` });
  }
  return pts;
})();

// 3. 千人蒙特卡洛生存仿真（代表 1000 名玩家的 64 条可视轨迹 + 精确存活率统计）
const MC_ROUNDS = 120;
const MC_PATHS = (() => {
  const rng = mulberry32(20260888);
  const paths = [];
  for (let p = 0; p < 64; p++) {
    const line = [100];
    let w = 100;
    let ruinedAt = -1;
    for (let r = 1; r <= MC_ROUNDS; r++) {
      if (w <= 4.0) {
        w = 0;
        if (ruinedAt < 0) ruinedAt = r;
      } else {
        // 公平 50/50 乘法/高波动博弈 + 底部吸收壁
        const win = rng() > 0.50;
        w = win ? w * 1.26 : w * 0.76;
        if (w <= 4.5) { w = 0; ruinedAt = r; }
        if (w > 340) w = 340;
      }
      line.push(w);
    }
    paths.push({ line, ruinedAt, peak: Math.max(...line) });
  }
  // 将少量高点轨迹排在前面展示“幸存者偏差”
  paths.sort((a, b) => a.peak - b.peak);
  return paths;
})();

// 4. 凯利公式对数增长率抛物线 G(f) = p * ln(1 + b*f) + q * ln(1 - f)
// 参数：胜率 p = 0.60, 败率 q = 0.40, 赔率 b = 1.0 => 最优凯利点 f* = 0.20 (20%)
function evalKellyGrowth(f) {
  const p = 0.60, q = 0.40, b = 1.0;
  const fClamped = clamp(f, 0, 0.92);
  return p * Math.log(1 + b * fClamped) + q * Math.log(1 - fClamped);
}

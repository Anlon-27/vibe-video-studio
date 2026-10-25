/* =========================================================================
 * 《休息的假象》 · 神经动力学与脑代谢确定性仿真数据 (sim.js)
 * ========================================================================= */

// 1. 短视频信息流卡片库（高频切换的不同情绪/语境场景）
const FEED_CARDS = [
  { tag: '01 · 悬疑反转', dur: '14s', ctx: '恐惧 → 震惊', load: '+24% 杏仁核唤醒', color: '#E04838' },
  { tag: '02 · 萌宠治愈', dur: '11s', ctx: '温情 → 依恋', load: '+18% 奖赏回路切换', color: '#42C878' },
  { tag: '03 · 职场焦虑', dur: '16s', ctx: '攀比 → 紧迫', load: '+31% 前额叶皮质醇', color: '#E8A849' },
  { tag: '04 · 爽剧耳光', dur: '13s', ctx: '愤怒 → 宣泄', load: '+29% 交感神经冲动', color: '#E04838' },
  { tag: '05 · 知识干货', dur: '19s', ctx: '好奇 → 囤积', load: '+26% 工作记忆塞满', color: '#5898E8' },
  { tag: '06 · 猎奇现场', dur: '12s', ctx: '猎奇 → 眩晕', load: '+27% 视觉皮层重载', color: '#9B72F2' },
  { tag: '07 · 情感哭诉', dur: '15s', ctx: '共情 → 压抑', load: '+25% 镜像神经元耗竭', color: '#58D8C0' },
  { tag: '08 · 搞笑翻车', dur: '09s', ctx: '爆笑 → 空虚', load: '+22% 瞬时多巴胺透支', color: '#D9B978' }
];

// 2. 舒尔茨 (1997) 奖赏预测误差 (RPE) 三种经典神经脉冲波形
// x in [0, 1]，cue 在 x=0.26，reward 在 x=0.68
function evalRPEWave(mode, x) {
  const gauss = (mu, sig, amp) => amp * Math.exp(-Math.pow((x - mu) / sig, 2));
  // 基础微弱神经自发噪声（固定谐波）
  const noise = 0.035 * Math.sin(x * 62) + 0.025 * Math.cos(x * 97);

  if (mode === 0) {
    // 模式 A：意外奖赏 (δ = +1.0) —— 奖励出现瞬间爆发
    return noise + gauss(0.68, 0.042, 0.92) + gauss(0.73, 0.055, 0.35);
  }
  if (mode === 1) {
    // 模式 B：上划悬念 (Cue 触发脉冲，真正看到内容时无反应 δ = 0)
    return noise + gauss(0.26, 0.040, 0.90) + gauss(0.31, 0.052, 0.30);
  }
  // 模式 C：刷到无聊视频 (δ = -0.85) —— 上划时期待飙升，看到内容瞬间跌破基线
  return noise + gauss(0.26, 0.040, 0.85) - gauss(0.68, 0.048, 0.78);
}

// 3. 所罗门拮抗过程 (1974) + 伦布克基线坍塌 (2021) 连续动力学模型
// u in [0, 1] 代表连续刷手机 10 个周期的时间进程
const SWIPE_TIMES = [0.06, 0.15, 0.24, 0.33, 0.42, 0.51, 0.60, 0.69, 0.78, 0.87];

function evalOpponentState(u) {
  // 基础稳态基线随累计透支缓慢下沉 (从 0 降到 -0.52)
  let baseline = -0.52 * Math.pow(clamp(u, 0, 0.94), 1.28);
  let procA = 0; // 快过程：即时快感冲动
  let procB = 0; // 慢过程：拮抗重锤反向拖拽

  for (let i = 0; i < SWIPE_TIMES.length; i++) {
    const t0 = SWIPE_TIMES[i];
    const dt = u - t0;
    if (dt >= 0) {
      // 耐受效应：越往后刷，单次快感峰值越矮 (从 0.88 衰减到 0.24)
      const ampA = 0.88 * Math.pow(0.86, i);
      // 拮抗累积：越往后刷，反向下坠越深越久
      const ampB = 0.42 * (1 + i * 0.11);

      // 快升快降的 A 过程
      if (dt < 0.075) {
        procA += ampA * Math.sin((dt / 0.075) * Math.PI) * Math.exp(-dt * 12);
      }
      // 滞后且漫长的 B 过程
      if (dt > 0.015 && dt < 0.16) {
        const bPhase = (dt - 0.015) / 0.145;
        procB += ampB * Math.sin(bPhase * Math.PI) * Math.exp(-bPhase * 1.4);
      }
    }
  }

  const net = baseline + procA - procB;
  return { baseline, procA, procB, net };
}

// 4. 大脑皮层网络拓扑节点（归一化坐标 [-1, 1] 椭圆脑轮廓内，间距充足防重叠）
const BRAIN_NODES = [
  { id: 'PFC',  name: '前额叶 PFC',    x: -0.62, y: -0.32, role: 'both' },
  { id: 'mPFC', name: '内侧前额 mPFC', x: -0.52, y:  0.24, role: 'dmn'  },
  { id: 'VTA',  name: '腹侧被盖 VTA',  x:  0.10, y:  0.46, role: 'task' },
  { id: 'NAcc', name: '伏隔核 NAcc',   x: -0.30, y:  0.18, role: 'task' },
  { id: 'AMY',  name: '杏仁核 AMY',    x:  0.20, y: -0.04, role: 'task' },
  { id: 'SPL',  name: '顶叶注意网',    x:  0.04, y: -0.52, role: 'task' },
  { id: 'PCC',  name: '后扣带回 PCC',  x:  0.18, y: -0.16, role: 'dmn'  },
  { id: 'IPL',  name: '下顶叶 IPL',    x:  0.58, y: -0.34, role: 'dmn'  },
  { id: 'VC',   name: '视觉皮层 V1',   x:  0.66, y:  0.12, role: 'task' },
  { id: 'HIP',  name: '海马体 HIP',    x:  0.34, y:  0.36, role: 'dmn'  }
];

const TASK_EDGES = [
  [0, 3], [2, 3], [3, 4], [4, 0], [8, 5], [5, 0], [8, 4], [2, 0], [5, 3]
];

const DMN_EDGES = [
  [1, 6], [6, 7], [6, 9], [1, 9], [1, 0], [7, 9]
];

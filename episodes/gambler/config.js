/* =========================================================================
 * 《久赌必输的数学》 (The Mathematics of Gambler's Ruin & Kelly Criterion)
 * 配置文件：BGM 节拍网格、配色系统、章节时间轴、双语字幕与文献注释
 * ========================================================================= */

const BPM = 112.90, BEAT = 60 / BPM, BAR = BEAT * 4, BAR0 = 0.228;
const bar  = n => +(BAR0 + n * BAR).toFixed(3);
const beat = n => +(BAR0 + n * BEAT).toFixed(3);

const CFG = {
  duration: 160.0,
  fps: 30,
  sfx: 'assets/sfx.wav',
  gold:  '#D9B978',
  amber: '#E8A849',
  red:   '#E04838',
  green: '#42C878',
  cyan:  '#58D8C0',
  blue:  '#5898E8',
  purple:'#9B72F2',
  ink:   '#F0EEE8',
  sub:   '#A4A4BA',
  dim:   '#686882'
};

// 严格对齐 bar(n) 的 7 大章节
const SECTIONS = [
  [0,       'open',       ''],
  [bar(8),  'title',      ''],
  [bar(11), 'history',    '1657 · 惠更斯《论赌博中的计算》   |   一维随机游走与吸收壁'],
  [bar(24), 'volatility', '波动率税与几何均值陷阱   ·   为什么涨 50% 再跌 50% 会亏光本金'],
  [bar(44), 'drop',       '千人蒙特卡洛生存仿真   ·   有限本金对抗无限底池的必然归零'],
  [bar(56), 'kelly',      '1956 · 贝尔实验室凯利公式   ·   对抗破产深渊的唯一数学边界'],
  [bar(71), 'end',        '']
];

// 拍点递进构造器：保证无缝衔接
let _cur = 0;
const S  = (nb, zh, en) => { const a = _cur, b = +(a + nb * BEAT).toFixed(3); _cur = b; return [a, b, zh, en]; };
const S0 = (t0, nb, zh, en) => { const a = +t0.toFixed(3), b = +(a + nb * BEAT).toFixed(3); _cur = b; return [a, b, zh, en]; };
const STo = (t0, t1, zh, en) => { _cur = +t1.toFixed(3); return [+t0.toFixed(3), +t1.toFixed(3), zh, en]; };

const SUBTITLES = [
  /* ===== 序幕 0.000 -> bar(8)=17.234 ===== */
  STo(0, bar(1),
    '给你一枚绝对均匀的硬币，正面赢一百，反面输一百。',
    'Imagine a perfectly fair coin: heads you win a hundred, tails you lose a hundred.'),
  S(5,
    '没有庄家出千，没有赌场抽水，胜率<em>严格五五开</em>。',
    'No rigged deck, no house edge—your win probability is strictly fifty-fifty.'),
  S(5,
    '如果你带着一万块入场，一直玩下去会发生什么？',
    'If you walk in with ten thousand dollars and keep playing, what happens?'),
  S(6,
    '直觉告诉你：既然公平，应该是不赚不赔、<em>来回震荡</em>。',
    'Intuition says: in a fair game, you should simply oscillate around break-even.'),
  S(6,
    '但概率论给出的答案是：你破产归零的概率，是<em>百分之百</em>。',
    'Yet probability theory gives a cold verdict: your chance of total ruin is 100%.'),
  STo(_cur, bar(8),
    '为什么绝对公平的游戏，只要不离场就<em>注定倾家荡产</em>？',
    'Why does a perfectly fair game guarantee bankruptcy if you never leave the table?'),

  /* ===== 标题卡 bar(8)=17.234 -> bar(11)=23.612 (留白) ===== */

  /* ===== 第一幕 1657 惠更斯与吸收壁 bar(11)=23.612 -> bar(24)=51.247 (13小节 = 52拍) ===== */
  S0(bar(11), 6,
    '1657年，荷兰数学家<em>惠更斯</em>写下概率论史上第一本著作。',
    'In 1657, Dutch mathematician Christiaan Huygens published the first treatise on probability.'),
  S(6,
    '他在书中收录了帕斯卡提出的经典难题：<em>赌徒破产定理</em>。',
    'In it, he recorded Pascal’s classic puzzle: the Gambler’s Ruin Problem.'),
  S(6,
    '把你的财富看作一条直线上的随机游走，每局向左或向右一步。',
    'Picture your wealth as a random walk along a line, stepping left or right each round.'),
  S(6,
    '假设你有 <em>n</em> 枚筹码，而对手庄家的资金池是 <em>M − n</em>。',
    'Suppose you hold n chips, while the house bankroll holds M minus n.'),
  S(7,
    '数学严格证明：在赢光对手之前，你先归零的概率是 <em>(M−n) / M</em>。',
    'Mathematics proves strictly: your probability of hitting zero first is (M − n) over M.'),
  S(7,
    '当对手是资金近乎无限的赌场或市场，<em>M 趋近于无穷大</em>。',
    'When your opponent is a casino or market with near-infinite capital, M approaches infinity.'),
  S(7,
    '此时式子的极限精确收敛于 <em>100%</em>——哪怕胜率完全公平。',
    'In the limit, that fraction converges to exactly 100%—even with a fair 50% win rate.'),
  STo(_cur, bar(24),
    '因为庄家没有下限，而你脚下有一道<em>一旦触碰就永久出局</em>的吸收壁。',
    'Because the house has no floor, while beneath you lies an absorbing barrier of permanent exit.'),

  /* ===== 第二幕 波动率税与几何均值陷阱 bar(24)=51.247 -> bar(44)=93.762 (20小节 = 80拍) ===== */
  S0(bar(24), 6,
    '你可能不服：如果我不赌固定金额，每次<em>按本金的一半下注</em>呢？',
    'You might ask: what if I never bet a fixed sum, but always wager half my current bankroll?'),
  S(6,
    '这样永远赌不完本金了吧？可这恰恰掉进了更隐蔽的<em>复利陷阱</em>。',
    'Then I can never hit zero, right? Yet this springs an even deadlier compounding trap.'),
  S(6,
    '做个小学算术：一百块本金，第一把赢 <em>50%</em>，变成一百五。',
    'Do the simple arithmetic: start with 100, win 50% on round one, and you reach 150.'),
  S(6,
    '第二把输掉 <em>50%</em>，一百五砍半，只剩下<em>七十五块</em>！',
    'Lose 50% on round two, and 150 is cut in half—leaving you with just 75!'),
  S(7,
    '反过来先输 50% 变五十，再赢 50%，依然是<em>七十五块</em>。',
    'Flip the order—lose 50% to 50, then win 50%—and you still end up at 75.'),
  S(7,
    '明明是一赢一输，算术平均收益是零，你的本金却<em>凭空蒸发了四分之一</em>。',
    'One win and one loss gives an arithmetic mean of zero, yet a quarter of your capital vanished.'),
  S(6,
    '金融数学把这种不对等损耗称为<em>波动率税</em>（Volatility Drag）。',
    'Quantitative finance calls this asymmetric erosion Volatility Drag.'),
  S(6,
    '真实财富遵循几何增长率：<em>g 约等于期望收益减去二分之一方差</em>。',
    'Real wealth follows geometric growth: g equals expected return minus half the variance.'),
  S(6,
    '只要你重仓博弈，巨大的方差就会把几何增长率<em>硬生生拖成负数</em>。',
    'Whenever you over-leverage, massive variance drags your geometric growth rate negative.'),
  S(6,
    '赢一输一重复十轮，一百块就只剩<em>五块六毛三</em>。',
    'Repeat one win and one loss ten times, and 100 shrinks to just 5.63.'),
  S(6,
    '绝大多数人以为自己输给了运气，其实是被<em>方差的复利</em>慢慢绞杀。',
    'Most people think they lost to bad luck, when in fact compounding variance strangled them.'),
  STo(_cur, bar(44),
    '如果把一千名玩家同时放进市场，画面会有多残酷？',
    'If we place one thousand players into this market at once, how brutal does it look?'),

  /* ===== 第三幕 DROP：千人蒙特卡洛生存仿真 bar(44)=93.762 -> bar(56)=119.271 (12小节 = 48拍) ===== */
  S0(bar(44), 6,
    '看这场蒙特卡洛实验：<em>一千名玩家</em>带着同样本金同时入场。',
    'Watch this Monte Carlo simulation: 1,000 players enter with identical starting capital.'),
  S(6,
    '在前二十轮，金色曲线冲上高点，少数幸运儿实现了<em>短期暴富</em>。',
    'In the first twenty rounds, gold curves surge high as a few lucky outliers strike it rich.'),
  S(6,
    '媒体和幸存者偏差，只会让你看到最上面那<em>几根耀眼的曲线</em>。',
    'Media and survivorship bias only ever show you those few dazzling top trajectories.'),
  S(6,
    '但把时间轴推向第五百轮：底部的红色吸收壁正在<em>疯狂吞噬</em>。',
    'But push the timeline to round 500: the red absorbing barrier at the bottom devours them.'),
  S(6,
    '注意看右侧分布：算术均值看似平稳，<em>中位数却一路贴地归零</em>。',
    'Watch the distribution on the right: the mean looks flat, yet the median crashes to zero.'),
  S(6,
    '物理学将其称为<em>非遍历性</em>：群体的平均收益，绝不等于你个人的结局。',
    'Physics calls this non-ergodicity: the ensemble average never equals your personal fate.'),
  S(6,
    '只要你在赌桌上待得足够久，那次致命的连续回撤<em>一定会发生</em>。',
    'Stay at the table long enough, and that fatal streak of drawdown is guaranteed to arrive.'),
  STo(_cur, bar(56),
    '那么面对不确定性，人类到底有没有<em>不破产的数学武器</em>？',
    'Facing uncertainty, does humanity possess any mathematical weapon against ruin?'),

  /* ===== 第四幕 1956 贝尔实验室与凯利公式 bar(56)=119.271 -> bar(71)=151.158 (15小节 = 60拍) ===== */
  S0(bar(56), 6,
    '1956年，贝尔实验室物理学家<em>约翰·凯利</em>给出了终极答案。',
    'In 1956, Bell Labs physicist John Kelly delivered the ultimate mathematical answer.'),
  S(6,
    '他与信息论之父香农合作，推导出著名的<em>凯利公式</em>。',
    'Working alongside Claude Shannon, he derived the celebrated Kelly Criterion.'),
  S(6,
    '最优下注比例 <em>f* 等于净期望收益除以赔率 b</em>。',
    'The optimal fraction f-star equals net expected edge divided by the odds b.'),
  S(6,
    '这条公式揭示了两条足以救命的<em>人生风控铁律</em>：',
    'This equation reveals two life-saving laws of risk management:'),
  S(6,
    '第一，当胜率与赔率算出的净期望小于等于零，<em>f* 就是零</em>。',
    'First, whenever net expected value is zero or negative, f-star is strictly zero.'),
  S(6,
    '面对负期望的赌局，唯一能赢的策略就是<em>永远不要上桌</em>。',
    'In any negative-expectation game, the only winning move is never to sit at the table.'),
  S(6,
    '第二，哪怕你手握 60% 胜率的优势，最优仓位也只有<em>本金的 20%</em>。',
    'Second, even when you hold a 60% winning edge, the optimal bet is only 20% of capital.'),
  S(6,
    '看右侧凯利抛物线：一旦仓位超过两倍凯利点，增长率<em>立刻由正转负</em>。',
    'Look at the Kelly parabola: exceed twice the Kelly point, and growth plunges negative.'),
  S(6,
    '真正的顶尖高手从不追求单次暴利，只死守<em>永不出局的底线</em>。',
    'True masters never chase a single windfall; they guard the boundary of never getting knocked out.'),
  STo(_cur, bar(71),
    '因为只有活在牌桌上的人，才有资格等到<em>复利的玫瑰盛开</em>。',
    'Because only those who survive at the table live to see compounding bloom.'),

  /* ===== 终章 bar(71)=151.158 -> 160.000 ===== */
  S0(bar(71), 6,
    '击败赌徒的从来不是庄家的千术，而是无穷时间轴上的<em>破产边界</em>。',
    'What defeats the gambler is never the dealer’s trick, but the ruin boundary on infinite time.'),
  S(5,
    '人生最大的数学智慧，不是算出哪一把能赢。',
    'The greatest mathematical wisdom in life is not predicting which hand will win.'),
  STo(_cur, 160.0,
    '而是无论面对多大诱惑，都绝不押上<em>让自己出局的筹码</em>。',
    'It is refusing, no matter the temptation, to ever wager the chips that could knock you out.')
];

// 底部学术注释带 (#note)
const NOTES = [
  [bar(11), bar(18), 'Huygens, C. (1657) · De ratiociniis in ludo aleae (On Reasoning in Games of Chance) · Problem V: Gambler’s Ruin'],
  [bar(18), bar(24), 'Feller, W. (1950) · An Introduction to Probability Theory and Its Applications, Vol. 1 · Chapter XIV: Random Walk and Ruin Problems'],
  [bar(24), bar(44), 'Markowitz, H. (1959) & Shannon, C. E. · Geometric Mean Return & Volatility Drag: g ≈ μ − ½σ²'],
  [bar(44), bar(56), 'Peters, O. (2019) · The Ergodicity Problem in Economics · Nature Physics, 15(12), 1216–1221'],
  [bar(56), bar(71), 'Kelly, J. L. Jr. (1956) · A New Interpretation of Information Rate · Bell System Technical Journal, 35(4), 917–926']
];

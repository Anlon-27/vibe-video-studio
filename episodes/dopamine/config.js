/* =========================================================================
 * 《休息的假象》 (The Illusion of Rest: Dopamine & Context Switching)
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
  [0,       'open',      ''],
  [bar(8),  'title',     ''],
  [bar(11), 'history',   '1954 · 奥尔兹电极实验   |   1997 · 舒尔茨奖赏预测误差'],
  [bar(24), 'mechanism', '拮抗过程理论   ·   多巴胺基线坍塌与情绪天平失衡'],
  [bar(44), 'drop',      '脑能量账单   ·   高频上下文切换 vs 默认模式网络 (DMN)'],
  [bar(56), 'you',       '多巴胺排毒的真相   ·   认知摩擦力与大脑慢波恢复'],
  [bar(71), 'end',       '']
];

// 拍点递进构造器：保证无缝衔接
let _cur = 0;
const S  = (nb, zh, en) => { const a = _cur, b = +(a + nb * BEAT).toFixed(3); _cur = b; return [a, b, zh, en]; };
const S0 = (t0, nb, zh, en) => { const a = +t0.toFixed(3), b = +(a + nb * BEAT).toFixed(3); _cur = b; return [a, b, zh, en]; };
const STo = (t0, t1, zh, en) => { _cur = +t1.toFixed(3); return [+t0.toFixed(3), +t1.toFixed(3), zh, en]; };

const SUBTITLES = [
  /* ===== 序幕 0.000 -> bar(8)=17.234 (共 32.43 拍) ===== */
  STo(0, bar(1),
    '上了一整天班，你终于瘫倒在沙发上。',
    'After an exhausting day at work, you finally collapse onto the sofa.'),
  S(5,
    '你对自己说：<em>刷十五分钟手机</em>，歇会儿脑子。',
    'You tell yourself: just fifteen minutes of scrolling to rest my brain.'),
  S(5,
    '两小时划过去，你连一根手指都没多动。',
    'Two hours slip by, and you have barely moved a muscle.'),
  S(6,
    '可放下手机那刻，脑袋却比加班还要<em>昏沉疲惫</em>。',
    'Yet the moment you put the phone down, your head feels heavier than after overtime.'),
  S(6,
    '明明身体一动不动，大脑为什么像跑了一场马拉松？',
    'Your body lay completely still—why does your brain feel like it ran a marathon?'),
  STo(_cur, bar(8),
    '答案藏在一场延续七十年的<em>神经科学误会</em>里。',
    'The answer lies in a seventy-year-old neuroscience misunderstanding.'),

  /* ===== 标题卡 bar(8)=17.234 -> bar(11)=23.612 (留白) ===== */

  /* ===== 第一幕 历史与RPE bar(11)=23.612 -> bar(24)=51.247 (13小节 = 52拍) ===== */
  S0(bar(11), 6,
    '1954年，麦吉尔大学的<em>奥尔兹与米尔纳</em>把电极植入大鼠脑部。',
    'In 1954, Olds and Milner implanted electrodes into the brains of rats at McGill.'),
  S(6,
    '只要按下杠杆就会放电，大鼠竟然<em>每小时狂按两千次</em>。',
    'Each lever press delivered a pulse—and rats pressed it up to 2,000 times an hour.'),
  S(6,
    '它们不吃不喝直到力竭，世人以为找到了<em>快乐中枢</em>。',
    'They ignored food and water until exhaustion; the world thought it was the pleasure center.'),
  S(6,
    '直到1997年，剑桥神经学家<em>沃尔夫拉姆·舒尔茨</em>推翻定论。',
    'Until 1997, Cambridge neuroscientist Wolfram Schultz overturned that belief.'),
  S(7,
    '多巴胺编码的根本不是快乐本身，而是<em>奖赏预测误差</em>。',
    'Dopamine does not encode pleasure itself—it encodes Reward Prediction Error.'),
  S(7,
    '公式很残酷：误差 δ 等于<em>实际奖赏减去预期奖赏</em>。',
    'The equation is ruthless: error δ equals actual reward minus expected reward.'),
  S(7,
    '让你瞳孔放大的不是拿到奖励，而是<em>下一秒可能更好</em>的悬念。',
    'What dilates your pupils is not the reward, but the suspense that the next swipe might be better.'),
  STo(_cur, bar(24),
    '它给你的是<em>渴望</em>，却唯独不给你<em>满足</em>。',
    'It floods you with wanting, yet never grants you liking.'),

  /* ===== 第二幕 拮抗过程与基线坍塌 bar(24)=51.247 -> bar(44)=93.762 (20小节 = 80拍) ===== */
  S0(bar(24), 6,
    '更致命的机制，是所罗门提出的<em>拮抗过程理论</em>。',
    'Even more lethal is the Opponent-Process Theory proposed by Richard Solomon.'),
  S(6,
    '大脑为了维持内稳态，内部有一座严苛的<em>神经天平</em>。',
    'To preserve homeostasis, your brain enforces a strict neurological seesaw.'),
  S(6,
    '每当短视频把多巴胺推向波峰，天平另一端就<em>压下重锤</em>。',
    'Every time a clip spikes dopamine upward, an equal counterweight slams down.'),
  S(6,
    '15秒一个反转、30秒一场冲突，你连刷<em>上百个高频脉冲</em>。',
    'A twist every 15 seconds, a conflict every 30—hundreds of rapid-fire pulses.'),
  S(7,
    '注意看这条曲线：快乐的波峰在<em>一次次变矮</em>。',
    'Watch this curve closely: the peaks of pleasure grow shorter each time.'),
  S(7,
    '而紧随其后的回落低谷，却一次比一次<em>跌破基线</em>。',
    'While the post-spike trough plunges deeper and deeper below your baseline.'),
  S(6,
    '斯坦福医学院<em>安娜·伦布克</em>教授将其称为多巴胺赤字。',
    'Stanford psychiatrist Anna Lembke calls this state a dopamine deficit.'),
  S(6,
    '到了后半夜，你手指还在机械上划，其实<em>早已不觉得好笑</em>。',
    'Late into the night, your thumb keeps swiping—even though nothing feels funny anymore.'),
  S(6,
    '你刷的不再是快乐，而是为了逃避停下来那一刻的<em>戒断空虚</em>。',
    'You are no longer scrolling for joy, but to escape the crash of stopping.'),
  S(6,
    '每次划走都在向大脑<em>借高利贷</em>，停手时就是集中连本付息。',
    'Every swipe borrows on neurological credit; stopping forces instant repayment with interest.'),
  S(6,
    '但这还只解释了空虚，为什么你的脑子会像<em>CPU过载一样发烫</em>？',
    'Yet that only explains the emptiness—why does your brain feel overheated like an overloaded CPU?'),
  STo(_cur, bar(44),
    '让我们把视角切进大脑的<em>能量代谢账单</em>。',
    'Let us switch directly into your brain’s metabolic energy ledger.'),

  /* ===== 第三幕 DROP：高频上下文切换 vs DMN bar(44)=93.762 -> bar(56)=119.271 (12小节 = 48拍) ===== */
  S0(bar(44), 6,
    '人脑只占体重的 2%，却吞噬了全身 <em>20% 的能量</em>。',
    'The human brain weighs just 2% of your body, yet consumes 20% of all energy.'),
  S(6,
    '每划入一条新视频，大脑必须在毫秒内<em>重建整套上下文</em>。',
    'With every new video, your brain must rebuild an entire context in milliseconds.'),
  S(6,
    '新面孔、新语境、新情绪——十分钟强制<em>切换四十次场景</em>。',
    'New faces, new premises, new emotions—forty forced context switches in ten minutes.'),
  S(6,
    '看左侧：执行网络高频点火，代谢负荷飙到 <em>95% 持续过热</em>。',
    'On the left: task networks fire frenetically, pushing metabolic load to 95% overheat.'),
  S(6,
    '2001年马库斯·雷切尔发现，大脑真正的休息靠<em>默认模式网络</em>。',
    'In 2001, Marcus Raichle discovered that true brain rest relies on the Default Mode Network.'),
  S(6,
    '看右侧：只有当你发呆、看窗外，<em>DMN 慢波</em>才会同步亮起。',
    'On the right: only when you daydream or gaze outside do slow DMN waves synchronize.'),
  S(6,
    '它像后台清洁工，把白天堆积的<em>记忆碎片</em>归档清理。',
    'Like a background janitor, it archives and clears the memory fragments piled up all day.'),
  STo(_cur, bar(56),
    '刷手机关停了清洁工，还逼大脑<em>零片酬连轴加班</em>。',
    'Scrolling locks out the janitor and forces your brain into unpaid overtime.'),

  /* ===== 第四幕 落地：多巴胺排毒的真相与恢复处方 bar(56)=119.271 -> bar(71)=151.158 (15小节 = 60拍) ===== */
  S0(bar(56), 6,
    '所以风靡全网的<em>多巴胺排毒</em>，名字其实是个科学伪概念。',
    'So the viral term “Dopamine Detox” is actually a scientific misnomer.'),
  S(6,
    '你不可能排空多巴胺，没有它你连<em>起床喝水</em>都做不到。',
    'You cannot detox natural dopamine—without it, you could not even get up for water.'),
  S(6,
    '真正把你榨干的，是<em>零阻力、高频率</em>的算法投喂。',
    'What truly drains you is zero-friction, high-frequency algorithmic feeding.'),
  S(6,
    '想让多巴胺基线回升，只需要做两件<em>极其简单</em>的事：',
    'To restore your dopamine baseline, you only need two remarkably simple rules:'),
  S(6,
    '第一，用<em>单长上下文</em>替代碎片——看一部长片远比刷百条短视频省脑。',
    'First, replace fragments with a single long context—one film taxes you far less than 100 clips.'),
  S(6,
    '第二，给大脑留出十分钟<em>无输入的无聊缓冲带</em>。',
    'Second, grant your brain a ten-minute boredom buffer with zero external input.'),
  S(6,
    '不戴耳机散步、盯着树叶发呆，让<em>默认模式网络</em>重新接管。',
    'Walk without headphones, stare at leaves, and let the Default Mode Network take over.'),
  S(6,
    '你会感觉到紧绷的前额叶慢慢松开，<em>注意力重新聚拢</em>。',
    'You will feel your tense prefrontal cortex loosen as focus quietly reassembles.'),
  S(6,
    '无聊不是时间的浪费，无聊是大脑<em>自我修复的黄金窗口</em>。',
    'Boredom is not a waste of time; boredom is the brain’s golden window for self-repair.'),
  STo(_cur, bar(71),
    '今晚放下手机那十分钟，才是你今天<em>真正的下班</em>。',
    'Those ten phone-free minutes tonight are when your workday truly ends.'),

  /* ===== 终章 bar(71)=151.158 -> 160.000 (约 16.64 拍) ===== */
  S0(bar(71), 6,
    '刷手机从来不是休息，那是让大脑替算法<em>无偿打工</em>。',
    'Scrolling was never rest—it was unpaid neurological labor for the algorithm.'),
  S(5,
    '真正能治愈疲惫的，从来不是塞满刺激。',
    'What truly heals exhaustion is never cramming in more stimulation.'),
  STo(_cur, 160.0,
    '而是关掉屏幕，<em>允许自己安静地无聊一会儿</em>。',
    'It is turning off the screen, and allowing yourself a quiet moment of boredom.')
];

// 底部学术注释带 (#note)
const NOTES = [
  [bar(11), bar(16), 'Olds, J. & Milner, P. (1954) · Positive Reinforcement Produced by Electrical Stimulation of Septal Area · J. Comp. Physiol. Psychol.'],
  [bar(16), bar(24), 'Schultz, W., Dayan, P. & Montague, P. R. (1997) · A Neural Substrate of Prediction and Reward · Science, 275(5306), 1593–1599'],
  [bar(24), bar(34), 'Solomon, R. L. & Corbit, J. D. (1974) · An Opponent-Process Theory of Motivation · Psychological Review, 81(2), 119–145'],
  [bar(34), bar(44), 'Lembke, A. (2021) · Dopamine Nation: Finding Balance in the Age of Indulgence · Stanford University School of Medicine'],
  [bar(44), bar(56), 'Raichle, M. E. et al. (2001) · A Default Mode of Brain Function · Proceedings of the National Academy of Sciences (PNAS), 98(2), 676–682'],
  [bar(56), bar(71), 'Berridge, K. C. & Robinson, T. E. (1998) · What is the Role of Dopamine in Reward: Hedonic Impact, Reward Learning, or Incentive Salience?']
];

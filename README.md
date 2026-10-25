# Vibe 知识大赏 · AI 知识视频制作 Skill (V2.1)

<p align="center">
  <b>把数学、概率、哲学等硬知识，拍成电影感的抖音知识大片</b><br>
  纯代码生成 · 零配音纯BGM · 双语胶囊字幕 · 历史文献推演 · 活态动力学模拟 · GPU 硬件加速
</p>

<p align="center">
  <img src="https://img.shields.io/badge/style-Vibe%E7%9F%A5%E8%AF%86%E5%A4%A7%E8%B5%8F-0F0D24" alt="style">
  <img src="https://img.shields.io/badge/render-Canvas%202D%20%2B%20D3D11%20NVENC-C9A96A" alt="render">
  <img src="https://img.shields.io/badge/duration-160.0s%20%2F%204800frames-blue" alt="duration">
  <img src="https://img.shields.io/badge/watermark-Configurable-orange" alt="watermark">
  <img src="https://img.shields.io/badge/episodes-2%20Bundled-blueviolet" alt="episodes">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
</p>

---

> **电影级 AI 知识视频生成引擎与抖音爆款工业流水线 | The Cinematic Vibe Knowledge Video Studio for AI Agents. 专为抖音「Vibe知识大赏」风格硬核科普博主与自媒体打造，对标 @Iwanau/@Juno 顶流美学。输入选题一键生成六阶装甲叙事剧本、Canvas 活态物理动力学推演、双语悬浮胶囊字幕与沉浸 BGM 音效轨。全流程纯代码生成（D3D11 GPU 光栅化 + NVENC 极速压制），零配音纯靠视觉密度拉满抖音完播率与算法推荐，3分钟极速导出 1080P/30fps 工业级成片，配套提供抖音爆款标题、SEO 标签与高互动置顶评论，开箱即发。**
>
> **核心标签 / Keywords**：`#抖音知识大赏` `#Vibe知识大赏` `#硬核科普` `#AI做视频` `#ClaudeOpus` `#Canvas动画` `#自媒体爆款` `#高完播率算法` `#数学可视化` `#电影感短视频`

## 🎬 这种视频长什么样 (V2.1 工业级标准)

| 维度 | 工业级硬性规范 |
|---|---|
| **画幅与帧率** | **1920×1080 横屏，严格 30fps** |
| **标准时长** | **严格 2:30 ~ 2:50**（标准锁定 160.0 秒 / 4800 帧，平台完播黄金区间） |
| **声音轨** | **无配音旁白**。**统一使用共享 BGM `assets/audio/MidnightRush(旋律很哇塞)-云杪栖光.mp3`**（不逐期合成、不改写源文件）；**必须从 00:00:00 起播放**，尾部严格 2.5s 音频淡出（`afade`），成片端做 `-14 LUFS / TP -1` 响度归一。可选叠加**语义音效层**（`assets/sfx.json` → `make_sfx.py` → `assets/sfx.wav`），只做转场/落点/动作点缀，不替代 BGM |
| **视觉基调** | 深蓝黑渐变 `#0F0D24` $\to$ `#080716` $\to$ `#03020A`，微粒子暗星微闪，全片基调恒定 |
| **五区架构** | 1. 左上角 `@anran` 水印（恒定）<br>2. 顶部金色场景/阶段标签<br>3. 中央活态可视化动画区<br>4. $y \approx 70\%$ 动态学术注释<br>5. $y \approx 85-91\%$ 双语旁白字幕（胶囊悬浮框，中文加粗+英文斜体） |
| **标题卡** | **约 16–24 秒处落《片名》标题卡**（模板默认 16–22s；实际按 BGM 小节对齐，通常 17.3–23.7s）：VIBE 知识大赏 大写标签 + 金色大字片名 + 中英双语核心提问 |
| **动效铁律** | 拒绝死板 PPT！**欠阻尼物理运动**、**动态数值狂飙滚轮**、**活态分布与波形**、**卡片安全边距右对齐锚定** |
| **片尾收敛** | **禁止罗列枯燥学术书单**；必须使用震撼哲理性金句卡片升华收尾 |

六阶装甲叙事弧：**冷开场算力/常识不可能三角 → 机制模型推演 → 拓扑特征与算法精排 → 试探博弈强化 → 现实商业/人性落点 → 哲学金句收敛**

## 🚀 3 步极速上手 (Quick Start)

开箱即用，内置两期完整可渲染生产工程（《久赌必输的数学》与《休息的假象》）以及零配置静音保底音轨，任意机器克隆即可运行：

```bash
# 1. 克隆仓库并进入工程
git clone https://github.com/Anlon-27/vibe-knowledge-video.git
cd vibe-knowledge-video

# 2. 安装 Python 核心依赖与渲染内核浏览器
pip install -r requirements.txt
playwright install chromium

# 3. 极速渲染开箱即用工程（支持自动回退静音轨与多进程并发）
python scripts/gpu_master_render.py --html episodes/gambler/index.html

# 或直接运行当前激活期次（episodes/CURRENT）：
# Windows: render_and_mix.bat
# Python:  python scripts/gpu_master_render.py
```

### 依赖环境

| 工具 | 用途 | 说明 |
|---|---|---|
| Python 3.10+ | 渲染/配乐/合成脚本 | `pip install -r requirements.txt` (内含 playwright, imageio-ffmpeg, numpy, pillow) |
| Playwright + Chromium | 页面光栅化分片截图 | `playwright install chromium` |
| NVIDIA GPU + NVENC | V2 硬件极速压制 | 支持 RTX 2060 及以上显卡（若无独立显卡将自动无缝回退至 CPU libx264 编码） |
| 跨平台适配 | Windows / macOS / Linux | Windows 自动启用 D3D11 GPU 光栅化，macOS 启用 Metal，Linux 启用 EGL |
| 网络（首次渲染） | Google Fonts 字体缓存 | 页面通过 `fonts.googleapis.com` 加载 Noto Serif/Sans SC 等字体；离线会回退系统字体 |

### 生产执行指令

#### 推荐：V2 Windows GPU 极速流水线（RTX + NVENC）

```bash
# 方式 A：双击运行根目录批处理脚本（自动读取 episodes/CURRENT）
render_and_mix.bat

# 方式 B：Python 执行（不指定 --html 时读取 episodes/CURRENT）
python scripts/gpu_master_render.py --duration 160.0 --fps 30 --workers 8

# 指定某一期
python scripts/gpu_master_render.py --html episodes/gambler/index.html

# 归档旧版页面同样可渲染
python scripts/gpu_master_render.py --html episodes/archive/index_drone.html

# 只检查清单/路径/时长，不渲染
python scripts/gpu_master_render.py --dry-run

# 默认不覆盖同名成片；需要覆盖或额外复制桌面副本时
python scripts/gpu_master_render.py --overwrite
python scripts/gpu_master_render.py --copy-to-desktop

# 可选：先生成语义音效轨，再渲染（默认读 episode.json.sfx）
python scripts/make_sfx.py episodes/memory/assets/sfx.json
python scripts/gpu_master_render.py --sfx episodes/memory/assets/sfx.wav
python scripts/gpu_master_render.py --no-sfx
```

成片主档默认写入 `episodes/<slug>/dist/<slug>_v<版本>_<片名>.mp4`；归档页写入 `episodes/archive/dist/`。桌面副本只是交付副本，不是归档位置。

#### 跨平台：V1 可移植流水线（纯 CPU / Linux / macOS）

```bash
# 1. 逐帧渲染（页面暴露 window.render(t)）
python3 scripts/render_frames.py episodes/gambler/index.html temp/procrastination/frames --fps 30 --duration 160
python3 scripts/render_frames.py episodes/gambler/index.html episodes/gambler/preview --duration 160 --preview 8

# 2. BGM 固定使用共享 MP3（唯一默认音源；不逐期合成、不改写源文件）
#    合成链路自动做 -14 LUFS / TP -1 与结尾 2.5s 淡出
#    assets/audio/MidnightRush(旋律很哇塞)-云杪栖光.mp3

# 3. 可选：先生成语义音效轨（cue 表 → 44.1kHz 立体声 WAV）
python3 scripts/make_sfx.py episodes/<slug>/assets/sfx.json

# 4. 帧序列 + 共享 BGM（+ 可选音效）→ 成片主档
bash scripts/build_video.sh temp/procrastination/frames "assets/audio/MidnightRush(旋律很哇塞)-云杪栖光.mp3" episodes/gambler/dist/gambler_v1_久赌必输的数学.mp4
# 有音效时追加：--sfx episodes/procrastination/assets/sfx.wav

# 5. 六维自检（报告默认写入本期 episodes/<slug>/qa/）
python3 scripts/qa_check.py episodes/gambler/dist/gambler_v1_久赌必输的数学.mp4
```

用 `python scripts/new_episode.py <slug> --title "《片名》"` 创建一期新工程，模板以 `assets/template.html` 为唯一正式版本（`examples/` 仅作参考）——内置五区布局、胶囊双语字幕系统、标题卡、欠阻尼物理算子、固定种子随机数与浏览器原生实时预览器。

> BGM 一律使用共享 `assets/audio/MidnightRush(旋律很哇塞)-云杪栖光.mp3`，`episode.json` 的 `bgm` 指向它。不要逐期运行 `synth_bgm.py`，也不要在 `episodes/<slug>/assets/` 生成 `bgm.wav`；只有用户明确要求自定义配乐时才通过清单更换音源。渲染端自动做 `-14 LUFS / TP -1` 与 2.5s 淡出，源文件不修改。
>
> 语义音效是可选的 BGM 叠加层：cue 表写入 `episodes/<slug>/assets/sfx.json`，用 `python scripts/make_sfx.py <cue.json>` 生成 `sfx.wav`，再让 `episode.json.sfx` 指向它。`*.wav` 不入库，cue 表才是可复现源；渲染前必须先生成，缺失时渲染器会直接报错。

## 📁 仓库结构

```
vibe-knowledge-video/
├── SKILL.md                    # 技能主文件：V2.1 规格 + 动效铁律 + 六阶装甲叙事
├── AGENTS.md                   # 通用 AI 入口指令（Codex/Cursor/Trae/Gemini 自动识别）
├── CLAUDE.md                   # 平台指导规则与技术契约说明
├── episodes/                   # 一期一目录
│   ├── CURRENT                 # 当前期指针（默认渲染目标）
│   ├── <slug>/
│   │   ├── episode.json        # 本期清单：标题/版本/状态/时长/发布文案/BGM/SFX
│   │   ├── index.html + *.js   # 工程源码
│   │   ├── dist/               # 成片主档 + .render.json 渲染记录
│   │   ├── preview/            # 抽帧预览
│   │   ├── qa/                 # QA 报告
│   │   └── assets/             # 本期字体/图片/sfx.json（生成的 sfx.wav 不入库；BGM 共享）
│   ├── gambler/（久赌必输）  dopamine/（休息的假象）
│   └── archive/                # 早期单体页面 + manifest.json + dist/
├── publish/
│   └── douyin/                 # 发布文案；新文件用 <slug>.md，旧文件由 episode.json 映射
├── references/
│   ├── style-guide.md          # 风格 DNA 完整规范（布局坐标/配色/动效/母题库）
│   ├── narrative-templates.md  # 原片逐段拆解 + 六阶装甲剧本模板 + 选题公式
│   ├── prompt-brief.md         # 创作简报（Brief）填空模板
│   ├── script.md               # 旁白字幕文体与节奏规律
│   ├── visualization.md        # 文案转画面的动态推演设计
│   └── cinematic-vibe-engine.md# 电影级视听美学与后期光学链
├── scripts/
│   ├── gpu_master_render.py    # V2 GPU 主控：落盘解析 + 多 Worker 光栅化 + NVENC + 防覆盖
│   ├── new_episode.py          # 新一期脚手架：目录 + 清单 + 发布文案 + CURRENT
│   ├── render_frames.py        # V1 Playwright 逐帧渲染器（支持 --preview 抽帧）
│   ├── synth_bgm.py            # 可选配乐合成器（仅用户明确要求自制配乐时使用）
│   ├── make_sfx.py             # 语义音效合成器：cue 表 JSON → 44.1kHz 立体声 WAV
│   ├── build_video.sh          # V1 ffmpeg 合成脚本（BGM + 可选 --sfx）
│   ├── qa_check.py             # 自动六维质量检测 + QA 报告落盘
│   └── dev/snap.py             # 抽帧预览拼图调试工具
├── assets/
│   ├── template.html           # 标准工程模板（开箱即用的活态物理动力学引擎）
│   └── audio/                  # 共享 BGM（唯一默认音源，大文件不入库）
├── examples/
│   └── template_vibe_engine.html # V2 极简生产模板
├── docs/                       # 原片拆解记录与跨 AI 使用指南
├── temp/                       # 渲染中间产物 temp/<slug>/（自动生成，不入库）
├── render_and_mix.bat          # Windows 一键 GPU 渲染批处理（支持透传参数）
├── README.md
└── LICENSE
```

新建一期用 `python scripts/new_episode.py <slug> --title "《片名》"`：自动创建 `episodes/<slug>/` 固定目录、`episode.json`、发布文案骨架，并把 `episodes/CURRENT` 指向该期。旧版目录不删除，在清单里标记 `status: archived` 并用 `supersededBy` 指向新版；旧的 5 个单体页面已归档到 `episodes/archive/`，由 `manifest.json` 统一登记，仍可直接用 `--html` 指定渲染。

### 落盘规则

- 项目根目录不放生成物：成片、帧序列、预览图、QA 报告、自作曲 BGM 都有固定归属。
- 工程与媒体产物：`episodes/<slug>/`；中间帧：`temp/<slug>/`；发布文案：`publish/douyin/`。
- 成片主档：`episodes/<slug>/dist/`；桌面只是可选的交付副本。
- 命名：`<slug>_v<版本>_<片名>.mp4`；slug 已带 `_v2` / `-v2` 版本后缀时不重复追加。
- 渲染默认不覆盖；同名时自动追加 `_r2`、`_r3`，需要覆盖显式加 `--overwrite`。
- 每次渲染在成片旁写 `<成片名>.render.json`，QA 在 `qa/` 写结构化报告，便于回溯。

## 🔍 风格与架构演进

- **V1 奠基**：对 8 条原片（共 17.5 分钟 / 1091 静帧）进行逐帧 OCR 与声画结构逆向，提炼出无配音、深底色、五区布局与纯函数驱动契约。
- **V2 升级**：
  1. 引入 **六阶工业级装甲叙事**，彻底杜绝概念单薄与口水话；
  2. 确立 **活态动效四大铁律**（欠阻尼平衡振荡、滚动数字狂飙、拓扑脉冲波形、安全边距锚定）；
  3. 升级 **RTX GPU D3D11 多进程并发 + NVENC 硬件压制**，全片 4800 帧渲染耗时从 30 分钟压缩至 3 分钟以内；
  4. 采用全新深蓝黑渐变 `#0F0D24` $\to$ `#080716` $\to$ `#03020A` 与双语悬浮胶囊框。
- **V2.1 归档**：一期一目录 + `episode.json` 清单 + `dist/ preview/ qa/ assets/` 固定分区；按 slug/版本命名、默认不覆盖、渲染记录与 QA 报告落盘；归档页由 `episodes/archive/manifest.json` 统一登记。

## 🙏 致谢与说明

- 本 Skill 的风格规范逆向自抖音「Vibe知识大赏」系列，向原作者 **@Iwanau**、**@Juno**、**叁号暗房 Logos** 致敬。
- 由 **@anran** 持续迭代工业级生产流与 GPU 硬件加速管线。
- `docs/original-analysis/` 中的逐秒文字记录仅作风格研究与教学用途，版权归原作者所有。

## 📄 License

[MIT](LICENSE) — 脚本、模板、文档可自由使用；请保留致谢部分。
